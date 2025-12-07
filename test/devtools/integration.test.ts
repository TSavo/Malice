/**
 * DevTools Integration Tests
 * Tests full end-to-end WebSocket communication
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DevToolsServer } from '../../src/devtools/devtools-server.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import WebSocket from 'ws';

describe('DevTools Integration', () => {
  let server: DevToolsServer;
  let manager: ObjectManager;
  let db: ObjectDatabase;
  let client1: WebSocket;
  let client2: WebSocket;

  const TEST_PORT = 9996;
  const SERVER_URL = `ws://localhost:${TEST_PORT}`;

  beforeEach(async () => {
    // Setup database
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
    db = new ObjectDatabase(MONGO_URI, 'malice_test_integration');

    await Promise.race([
      db.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000))
    ]);

    await db['objects'].deleteMany({});
    await db.ensureRoot();

    // Setup manager and server
    manager = new ObjectManager(db);
    server = new DevToolsServer(manager, TEST_PORT);

    await new Promise(resolve => setTimeout(resolve, 300));
  }, 15000);

  afterEach(async () => {
    if (client1 && client1.readyState === WebSocket.OPEN) {
      client1.close();
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (client2 && client2.readyState === WebSocket.OPEN) {
      client2.close();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (server) {
      await server.close();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (db) {
      await db.disconnect();
    }
  });

  /**
   * Connect client and skip hello message
   */
  async function connectClient(): Promise<WebSocket> {
    const client = new WebSocket(SERVER_URL);

    await new Promise<void>((resolve, reject) => {
      client.on('open', () => {
        client.once('message', () => {
          resolve(); // Skip hello
        });
      });
      client.on('error', reject);
    });

    return client;
  }

  /**
   * Send JSON-RPC request
   */
  function sendRequest(client: WebSocket, method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = Math.random();
      const request = { jsonrpc: '2.0', method, params, id };

      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

      const handler = (data: WebSocket.Data) => {
        const response = JSON.parse(data.toString());
        if (response.id === id) {
          clearTimeout(timeout);
          client.off('message', handler);

          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        }
      };

      client.on('message', handler);
      client.send(JSON.stringify(request));
    });
  }

  describe('Multi-Client Synchronization', () => {
    it('should broadcast object creation to all clients', async () => {
      client1 = await connectClient();
      client2 = await connectClient();

      // Client 2 waits for notification
      const notificationPromise = new Promise<any>((resolve) => {
        client2.once('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
      });

      // Client 1 creates object
      const result = await sendRequest(client1, 'object.create', {
        parent: 1,
        properties: { name: 'Test' },
        methods: {},
      });

      // Client 2 receives notification
      const notification = await notificationPromise;
      expect(notification.method).toBe('object.created');
      expect(notification.params.id).toBe(result.id);
    });

    it('should broadcast method changes to all clients', async () => {
      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });

      client1 = await connectClient();
      client2 = await connectClient();

      const notificationPromise = new Promise<any>((resolve) => {
        client2.once('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
      });

      await sendRequest(client1, 'method.set', {
        objectId: obj.id,
        name: 'test',
        code: 'return 42;',
      });

      const notification = await notificationPromise;
      expect(notification.method).toBe('method.changed');
      expect(notification.params.objectId).toBe(obj.id);
      expect(notification.params.name).toBe('test');
    });

    it('should broadcast property changes to all clients', async () => {
      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });

      client1 = await connectClient();
      client2 = await connectClient();

      const notificationPromise = new Promise<any>((resolve) => {
        client2.once('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
      });

      await sendRequest(client1, 'property.set', {
        objectId: obj.id,
        name: 'name',
        value: 'Updated',
      });

      const notification = await notificationPromise;
      expect(notification.method).toBe('property.changed');
    });

    it('should broadcast deletions to all clients', async () => {
      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });

      client1 = await connectClient();
      client2 = await connectClient();

      const notificationPromise = new Promise<any>((resolve) => {
        client2.once('message', (data) => {
          resolve(JSON.parse(data.toString()));
        });
      });

      await sendRequest(client1, 'object.delete', { id: obj.id });

      const notification = await notificationPromise;
      expect(notification.method).toBe('object.deleted');
      expect(notification.params.id).toBe(obj.id);
    });
  });

  describe('End-to-End Object Editing', () => {
    it('should complete full edit workflow', async () => {
      client1 = await connectClient();

      // 1. List objects (should only have root #1)
      let result = await sendRequest(client1, 'objects.list');
      expect(result.objects).toHaveLength(1);
      expect(result.objects[0].id).toBe(1);

      // 2. Create object
      result = await sendRequest(client1, 'object.create', {
        parent: 1,
        properties: { name: 'TestObject', count: 0 },
        methods: { increment: 'this.count++;' },
      });
      const objectId = result.id;

      // 3. List objects (should have 2: root + created)
      result = await sendRequest(client1, 'objects.list');
      expect(result.objects).toHaveLength(2);
      expect(result.objects.find((o: any) => o.id === objectId)).toBeDefined();

      // 4. Get full object
      result = await sendRequest(client1, 'object.get', { id: objectId });
      expect(result.object.properties.name).toBe('TestObject');
      // Methods created with object.create are stored as-is (string or object)
      const incrementMethod = result.object.methods.increment;
      const incrementCode = typeof incrementMethod === 'string' ? incrementMethod : incrementMethod.code;
      expect(incrementCode).toBe('this.count++;');

      // 5. Update method
      await sendRequest(client1, 'method.set', {
        objectId,
        name: 'increment',
        code: 'this.count += 2;',
      });

      // 6. Verify method updated
      result = await sendRequest(client1, 'method.get', {
        objectId,
        name: 'increment',
      });
      expect(result.method.code).toBe('this.count += 2;');

      // 7. Update property
      await sendRequest(client1, 'property.set', {
        objectId,
        name: 'count',
        value: 10,
      });

      // 8. Verify property updated
      result = await sendRequest(client1, 'property.get', {
        objectId,
        name: 'count',
      });
      expect(result.property.value).toBe(10);

      // 9. Add new method
      await sendRequest(client1, 'method.set', {
        objectId,
        name: 'reset',
        code: 'this.count = 0;',
      });

      // 10. Verify new method exists
      result = await sendRequest(client1, 'object.get', { id: objectId });
      // Methods set via method.set are stored as { code: '...' }
      const resetMethod = result.object.methods.reset;
      const resetCode = typeof resetMethod === 'string' ? resetMethod : resetMethod.code;
      expect(resetCode).toBe('this.count = 0;');

      // 11. Delete method
      await sendRequest(client1, 'method.delete', {
        objectId,
        name: 'reset',
      });

      // 12. Verify method deleted
      result = await sendRequest(client1, 'object.get', { id: objectId });
      expect(result.object.methods.reset).toBeUndefined();

      // 13. Delete property
      await sendRequest(client1, 'property.delete', {
        objectId,
        name: 'count',
      });

      // 14. Verify property deleted
      result = await sendRequest(client1, 'object.get', { id: objectId });
      expect(result.object.properties.count).toBeUndefined();

      // 15. Delete object
      await sendRequest(client1, 'object.delete', { id: objectId });

      // 16. Verify object recycled (only root #1 remains non-recycled)
      result = await sendRequest(client1, 'objects.list');
      expect(result.objects).toHaveLength(1);
      expect(result.objects[0].id).toBe(1);

      result = await sendRequest(client1, 'objects.list', { includeRecycled: true });
      expect(result.objects).toHaveLength(2);
      expect(result.objects.find((o: any) => o.recycled === true)).toBeDefined();
    });
  });

  describe('Concurrent Edits', () => {
    it('should handle concurrent edits from multiple clients', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { counter: 0 },
        methods: {},
      });

      client1 = await connectClient();
      client2 = await connectClient();

      // Both clients edit different methods concurrently
      await Promise.all([
        sendRequest(client1, 'method.set', {
          objectId: obj.id,
          name: 'method1',
          code: 'return 1;',
        }),
        sendRequest(client2, 'method.set', {
          objectId: obj.id,
          name: 'method2',
          code: 'return 2;',
        }),
      ]);

      // Verify both methods exist
      const result = await sendRequest(client1, 'object.get', { id: obj.id });
      // Methods set via method.set are stored as { code: '...' }
      const m1 = result.object.methods.method1;
      const m2 = result.object.methods.method2;
      expect(typeof m1 === 'string' ? m1 : m1.code).toBe('return 1;');
      expect(typeof m2 === 'string' ? m2 : m2.code).toBe('return 2;');
    });

    it('should handle rapid sequential edits', async () => {
      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });

      client1 = await connectClient();

      // Edit same method 10 times rapidly
      for (let i = 0; i < 10; i++) {
        await sendRequest(client1, 'method.set', {
          objectId: obj.id,
          name: 'counter',
          code: `return ${i};`,
        });
      }

      // Verify final value
      const result = await sendRequest(client1, 'method.get', {
        objectId: obj.id,
        name: 'counter',
      });
      expect(result.method.code).toBe('return 9;');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      client1 = await connectClient();
    });

    it('should return error for non-existent object', async () => {
      try {
        await sendRequest(client1, 'object.get', { id: 99999 });
        expect.fail('Should have thrown error');
      } catch (err: any) {
        expect(err.message).toContain('not found');
      }
    });

    it('should return error for non-existent method', async () => {
      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });

      try {
        await sendRequest(client1, 'method.get', {
          objectId: obj.id,
          name: 'nonexistent',
        });
        expect.fail('Should have thrown error');
      } catch (err: any) {
        expect(err.message).toContain('not found');
      }
    });

    it('should continue serving after client disconnect', async () => {
      // Client 1 disconnects
      client1.close();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // New client connects and should work fine
      client2 = await connectClient();

      const obj = await manager.create({ parent: 1, properties: {}, methods: {} });
      const result = await sendRequest(client2, 'object.get', { id: obj.id });

      expect(result.object._id).toBe(obj.id);
    });
  });

  describe('Performance', () => {
    it('should handle large object with many methods', async () => {
      client1 = await connectClient();

      // Create object with 100 methods
      const methods: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        methods[`method${i}`] = `return ${i};`;
      }

      const result = await sendRequest(client1, 'object.create', {
        parent: 1,
        properties: {},
        methods,
      });

      // Get object
      const obj = await sendRequest(client1, 'object.get', { id: result.id });
      expect(Object.keys(obj.object.methods)).toHaveLength(100);
    });

    it('should handle many objects', async () => {
      client1 = await connectClient();

      // Create 50 objects sequentially (parallel creates cause duplicate key errors)
      for (let i = 0; i < 50; i++) {
        await sendRequest(client1, 'object.create', {
          parent: 1,
          properties: { index: i },
          methods: {},
        });
      }

      // List all (50 + root #1)
      const result = await sendRequest(client1, 'objects.list');
      expect(result.objects).toHaveLength(51);
    });
  });
});
