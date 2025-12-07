/**
 * DevTools WebSocket Server Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import WebSocket from 'ws';
import { DevToolsServer } from '../../src/devtools/devtools-server.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { ObjectDatabase } from '../../src/database/object-db.js';

// Use sequential to ensure test order for shared server
describe.sequential('DevToolsServer', () => {
  let server: DevToolsServer;
  let manager: ObjectManager;
  let db: ObjectDatabase;
  let client: WebSocket | null = null;

  const TEST_PORT = 9998;
  const SERVER_URL = `ws://localhost:${TEST_PORT}`;

  // Setup server once for all tests
  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
    db = new ObjectDatabase(MONGO_URI, 'malice_test_devtools');

    await Promise.race([
      db.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000))
    ]);

    manager = new ObjectManager(db);
    server = new DevToolsServer(manager, TEST_PORT);

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 300));
  }, 20000);

  // Cleanup after all tests
  afterAll(async () => {
    if (client && client.readyState === WebSocket.OPEN) {
      client.close();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (server) {
      await server.close();
    }

    if (db) {
      await db.disconnect();
    }
  });

  // Clean data and disconnect client before each test
  beforeEach(async () => {
    // Close any existing client connection
    if (client && client.readyState === WebSocket.OPEN) {
      client.close();
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    client = null;

    // Clear all test data and reinitialize root
    await db['objects'].deleteMany({});
    await db.ensureRoot();

    // Clear manager's cache
    manager.clearCache();
  });

  /**
   * Helper to send JSON-RPC request and wait for response
   */
  function sendRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!client || client.readyState !== WebSocket.OPEN) {
        reject(new Error('Client not connected'));
        return;
      }

      const id = Math.random();
      const request = {
        jsonrpc: '2.0',
        method,
        params,
        id,
      };

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      const handler = (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === id) {
            clearTimeout(timeout);
            client!.off('message', handler);

            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.result);
            }
          }
        } catch (err) {
          reject(err);
        }
      };

      client.on('message', handler);
      client.send(JSON.stringify(request));
    });
  }

  /**
   * Helper to connect client and skip hello message
   */
  async function connectClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      client = new WebSocket(SERVER_URL);

      client.on('open', () => {
        // Wait for hello message
        client!.once('message', (data) => {
          const msg = JSON.parse(data.toString());
          expect(msg.method).toBe('server.hello');
          resolve();
        });
      });

      client.on('error', reject);

      // Timeout for connection
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
  }

  /**
   * Helper to create a second client for notification tests
   * Returns a promise for the next notification and cleanup function
   */
  async function setupNotificationClient(): Promise<{
    waitForNotification: () => Promise<any>;
    cleanup: () => void;
  }> {
    const client2 = new WebSocket(SERVER_URL);

    // Register message listener BEFORE connection opens to catch hello
    const helloPromise = new Promise<void>((resolve, reject) => {
      const helloTimeout = setTimeout(() => reject(new Error('Hello timeout')), 10000);
      client2.once('message', () => {
        clearTimeout(helloTimeout);
        resolve();
      });
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const connectTimeout = setTimeout(() => reject(new Error('Connect timeout')), 5000);
      client2.on('open', () => {
        clearTimeout(connectTimeout);
        resolve();
      });
      client2.on('error', (err) => {
        clearTimeout(connectTimeout);
        reject(err);
      });
    });

    // Wait for hello message (listener was already registered)
    await helloPromise;

    // Set up notification listener
    let notificationResolve: (value: any) => void;
    let notificationReject: (reason: any) => void;
    let timeout: ReturnType<typeof setTimeout>;
    let resolved = false;

    const notificationPromise = new Promise((resolve, reject) => {
      notificationResolve = resolve;
      notificationReject = reject;
    });

    timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        notificationReject(new Error('Notification timeout'));
      }
    }, 10000);

    client2.once('message', (data) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        notificationResolve(JSON.parse(data.toString()));
      }
    });

    // Small delay to ensure listener is ready
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      waitForNotification: () => notificationPromise,
      cleanup: () => {
        resolved = true;
        clearTimeout(timeout);
        client2.removeAllListeners();
        if (client2.readyState === WebSocket.OPEN || client2.readyState === WebSocket.CONNECTING) {
          client2.close();
        }
      },
    };
  }

  describe('Connection', () => {
    it('should accept WebSocket connections', async () => {
      await connectClient();
      expect(client!.readyState).toBe(WebSocket.OPEN);
    });

    it('should send hello message with capabilities', async () => {
      client = new WebSocket(SERVER_URL);

      const hello: any = await new Promise((resolve, reject) => {
        client!.on('message', (data) => {
          const msg = JSON.parse(data.toString());
          resolve(msg);
        });
        client!.on('error', reject);
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });

      expect(hello.jsonrpc).toBe('2.0');
      expect(hello.method).toBe('server.hello');
      expect(hello.params.version).toBe('1.0.0');
      expect(hello.params.capabilities).toEqual({
        objectCRUD: true,
        typeGeneration: true,
        changeWatch: true,
        lsp: false,
      });
    });

    it('should handle multiple concurrent clients', async () => {
      const client1 = new WebSocket(SERVER_URL);
      const client2 = new WebSocket(SERVER_URL);

      await Promise.all([
        new Promise((resolve, reject) => {
          client1.on('open', resolve);
          client1.on('error', reject);
        }),
        new Promise((resolve, reject) => {
          client2.on('open', resolve);
          client2.on('error', reject);
        }),
      ]);

      expect(client1.readyState).toBe(WebSocket.OPEN);
      expect(client2.readyState).toBe(WebSocket.OPEN);

      client1.close();
      client2.close();
    });
  });

  describe('JSON-RPC Protocol', () => {
    it('should handle malformed JSON', async () => {
      await connectClient();

      const response: any = await new Promise((resolve) => {
        client!.once('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
        client!.send('invalid json{');
      });

      expect(response.jsonrpc).toBe('2.0');
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32700); // Parse error
      expect(response.id).toBeNull();
    });

    it('should return error for unknown method', async () => {
      await connectClient();
      await expect(sendRequest('unknown.method')).rejects.toThrow('Method not found');
    });

    it('should include request id in response', async () => {
      await connectClient();

      // Create a test object first
      await manager.create({ parent: 1, properties: {}, methods: {} });

      const id = 123;
      const request = {
        jsonrpc: '2.0',
        method: 'objects.list',
        params: {},
        id,
      };

      const response: any = await new Promise((resolve) => {
        client!.once('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
        client!.send(JSON.stringify(request));
      });

      expect(response.id).toBe(id);
    });
  });

  describe('objects.list', () => {
    it('should list all objects', async () => {
      await connectClient();

      // Create test objects
      const obj1 = await manager.create({ parent: 1, properties: {}, methods: {} });
      const obj2 = await manager.create({ parent: 1, properties: {}, methods: {} });

      const result = await sendRequest('objects.list');

      expect(result.objects).toBeDefined();
      // Result includes root object (id=1) plus our 2 created objects
      expect(result.objects.length).toBeGreaterThanOrEqual(2);
      expect(result.objects.map((o: any) => o.id)).toContain(obj1.id);
      expect(result.objects.map((o: any) => o.id)).toContain(obj2.id);
    });

    it('should exclude recycled objects by default', async () => {
      await connectClient();

      const obj1 = await manager.create({ parent: 1, properties: {}, methods: {} });
      await manager.delete(obj1.id); // Recycle it

      const result = await sendRequest('objects.list');

      // Should not contain the recycled object
      const recycledObj = result.objects.find((o: any) => o.id === obj1.id);
      expect(recycledObj).toBeUndefined();
    });

    it('should include recycled objects when requested', async () => {
      await connectClient();

      const obj1 = await manager.create({ parent: 1, properties: {}, methods: {} });

      // Use devtools API to delete (recycle) the object
      await sendRequest('object.delete', { id: obj1.id });

      // Wait for change stream to process and invalidate cache
      await new Promise(resolve => setTimeout(resolve, 100));
      manager.clearCache();

      const result = await sendRequest('objects.list', { includeRecycled: true });

      // Should contain the recycled object
      const recycledObj = result.objects.find((o: any) => o.id === obj1.id);
      expect(recycledObj).toBeDefined();
      expect(recycledObj.recycled).toBe(true);
    });

    it('should include object metadata', async () => {
      await connectClient();

      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Test' },
        methods: { doSomething: { code: 'return 42;' } },
      });

      const result = await sendRequest('objects.list');

      // Find our created object by id
      const createdObj = result.objects.find((o: any) => o.id === obj.id);
      expect(createdObj).toMatchObject({
        id: obj.id,
        parent: 1,
        properties: ['name'],
        methods: ['doSomething'],
        recycled: false,
      });
    });
  });

  describe('object.get', () => {
    it('should get object by id', async () => {
      await connectClient();

      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Test' },
        methods: { test: { code: 'return 1;' } },
      });

      const result = await sendRequest('object.get', { id: obj.id });

      expect(result.object).toBeDefined();
      expect(result.object._id).toBe(obj.id);
      expect(result.object.parent).toBe(1);
      expect(result.object.properties.name).toBe('Test');
      expect(result.object.methods.test.code).toBe('return 1;');
    });

    it('should return error for non-existent object', async () => {
      await connectClient();
      await expect(sendRequest('object.get', { id: 99999 })).rejects.toThrow('not found');
    });
  });

  describe('object.create', () => {
    it('should create new object', async () => {
      await connectClient();

      const result = await sendRequest('object.create', {
        parent: 1,
        properties: { name: 'NewObject' },
        methods: { test: { code: 'return 42;' } },
      });

      expect(result.id).toBeDefined();

      // Verify object was created
      const obj = await manager.load(result.id);
      expect(obj).toBeDefined();
      expect(obj!.get('name')).toBe('NewObject');
      expect(obj!.getOwnMethods().test.code).toBe('return 42;');
    });

    it('should broadcast object.created notification', async () => {
      await connectClient();
      const { waitForNotification, cleanup } = await setupNotificationClient();

      try {
        // Create object from first client
        await sendRequest('object.create', { parent: 1 });

        const notification: any = await waitForNotification();
        expect(notification.method).toBe('object.created');
        expect(notification.params.id).toBeDefined();
      } finally {
        cleanup();
      }
    });
  });

  describe('object.delete', () => {
    it('should delete object', async () => {
      await connectClient();

      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });

      const result = await sendRequest('object.delete', { id: obj.id });

      expect(result.success).toBe(true);

      // Wait for change stream to process and invalidate cache
      await new Promise(resolve => setTimeout(resolve, 100));
      manager.clearCache();

      // Verify object was recycled
      const loaded = await manager.load(obj.id);
      expect(loaded!._getRaw().recycled).toBe(true);
    });

    it('should broadcast object.deleted notification', async () => {
      await connectClient();
      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });
      const { waitForNotification, cleanup } = await setupNotificationClient();

      try {
        await sendRequest('object.delete', { id: obj.id });

        const notification: any = await waitForNotification();
        expect(notification.method).toBe('object.deleted');
        expect(notification.params.id).toBe(obj.id);
      } finally {
        cleanup();
      }
    });
  });

  describe('method.get', () => {
    it('should get method code', async () => {
      await connectClient();

      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: { test: { code: 'return 42;' } },
      });

      const result = await sendRequest('method.get', { objectId: obj.id, name: 'test' });

      expect(result.method.name).toBe('test');
      expect(result.method.code).toBe('return 42;');
    });

    it('should return error for non-existent method', async () => {
      await connectClient();

      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });

      await expect(
        sendRequest('method.get', { objectId: obj.id, name: 'unknown' })
      ).rejects.toThrow('not found');
    });
  });

  describe('method.set', () => {
    it('should set method code', async () => {
      await connectClient();

      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });

      await sendRequest('method.set', {
        objectId: obj.id,
        name: 'newMethod',
        code: 'return 123;',
      });

      // Verify method was set
      const loaded = await manager.load(obj.id);
      expect(loaded!.getOwnMethods().newMethod.code).toBe('return 123;');
    });

    it('should update existing method', async () => {
      await connectClient();

      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: { test: { code: 'return 1;' } },
      });

      await sendRequest('method.set', {
        objectId: obj.id,
        name: 'test',
        code: 'return 2;',
      });

      const loaded = await manager.load(obj.id);
      expect(loaded!.getOwnMethods().test.code).toBe('return 2;');
    });

    it('should broadcast method.changed notification', async () => {
      await connectClient();
      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });
      const { waitForNotification, cleanup } = await setupNotificationClient();

      try {
        await sendRequest('method.set', {
          objectId: obj.id,
          name: 'test',
          code: 'return 1;',
        });

        const notification: any = await waitForNotification();
        expect(notification.method).toBe('method.changed');
        expect(notification.params.objectId).toBe(obj.id);
        expect(notification.params.name).toBe('test');
      } finally {
        cleanup();
      }
    });
  });

  describe('method.delete', () => {
    it('should delete method', async () => {
      await connectClient();

      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: { test: { code: 'return 1;' } },
      });

      await sendRequest('method.delete', { objectId: obj.id, name: 'test' });

      // Wait for change stream to process and invalidate cache
      await new Promise(resolve => setTimeout(resolve, 100));
      manager.clearCache();

      const loaded = await manager.load(obj.id);
      expect(loaded!.getOwnMethods().test).toBeUndefined();
    });

    it('should broadcast method.deleted notification', async () => {
      await connectClient();
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: { test: { code: 'return 1;' } },
      });
      const { waitForNotification, cleanup } = await setupNotificationClient();

      try {
        await sendRequest('method.delete', { objectId: obj.id, name: 'test' });

        const notification: any = await waitForNotification();
        expect(notification.method).toBe('method.deleted');
      } finally {
        cleanup();
      }
    });
  });

  describe('property.get', () => {
    it('should get property value', async () => {
      await connectClient();

      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Test', count: 42 },
        methods: {},
      });

      const result = await sendRequest('property.get', { objectId: obj.id, name: 'name' });

      expect(result.property.name).toBe('name');
      expect(result.property.value).toBe('Test');
    });
  });

  describe('property.set', () => {
    it('should set property value', async () => {
      await connectClient();

      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });

      await sendRequest('property.set', {
        objectId: obj.id,
        name: 'newProp',
        value: 'newValue',
      });

      // Wait for change stream to process and invalidate cache
      await new Promise(resolve => setTimeout(resolve, 100));
      manager.clearCache();

      const loaded = await manager.load(obj.id);
      expect(loaded!.get('newProp')).toBe('newValue');
    });

    it('should broadcast property.changed notification', async () => {
      await connectClient();
      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });
      const { waitForNotification, cleanup } = await setupNotificationClient();

      try {
        await sendRequest('property.set', {
          objectId: obj.id,
          name: 'test',
          value: 123,
        });

        const notification: any = await waitForNotification();
        expect(notification.method).toBe('property.changed');
      } finally {
        cleanup();
      }
    });
  });

  describe('property.delete', () => {
    it('should delete property', async () => {
      await connectClient();

      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Test' },
        methods: {},
      });

      await sendRequest('property.delete', { objectId: obj.id, name: 'name' });

      const loaded = await manager.load(obj.id);
      expect(loaded!.get('name')).toBeUndefined();
    });

    it('should broadcast property.deleted notification', async () => {
      await connectClient();
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Test' },
        methods: {},
      });
      const { waitForNotification, cleanup } = await setupNotificationClient();

      try {
        await sendRequest('property.delete', { objectId: obj.id, name: 'name' });

        const notification: any = await waitForNotification();
        expect(notification.method).toBe('property.deleted');
      } finally {
        cleanup();
      }
    });
  });
});
