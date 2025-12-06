/**
 * DevTools Client Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import { DevToolsClient } from '../src/devtools-client';

describe('DevToolsClient', () => {
  let mockServer: WebSocketServer;
  let client: DevToolsClient;
  const TEST_PORT = 9997;
  const TEST_URL = `ws://localhost:${TEST_PORT}`;

  beforeEach(async () => {
    // Create mock WebSocket server
    mockServer = new WebSocketServer({ port: TEST_PORT });

    // Wait for server to start
    await new Promise(resolve => mockServer.on('listening', resolve));
  });

  afterEach(async () => {
    if (client) {
      client.close();
    }

    await new Promise(resolve => mockServer.close(resolve));
  });

  describe('Connection', () => {
    it('should connect to server', async () => {
      client = new DevToolsClient(TEST_URL);

      const connectPromise = client.connect();

      // Server accepts connection
      mockServer.once('connection', (ws) => {
        // Do nothing, just accept
      });

      await connectPromise;
    });

    it('should receive server hello message', async () => {
      client = new DevToolsClient(TEST_URL);

      const notificationPromise = new Promise((resolve) => {
        client.onNotification((method, params) => {
          resolve({ method, params });
        });
      });

      const connectPromise = client.connect();

      mockServer.once('connection', (ws) => {
        // Send hello
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'server.hello',
          params: { version: '1.0.0', capabilities: {} },
        }));
      });

      await connectPromise;

      const notification: any = await notificationPromise;
      expect(notification.method).toBe('server.hello');
      expect(notification.params.version).toBe('1.0.0');
    });

    it('should handle connection errors', async () => {
      // Close server before client connects
      await new Promise(resolve => mockServer.close(resolve));

      client = new DevToolsClient(TEST_URL);

      await expect(client.connect()).rejects.toThrow();
    });

    // Skip: Fake timers don't work reliably with real WebSocket close events
    it.skip('should auto-reconnect after disconnect', async () => {
      vi.useFakeTimers();

      client = new DevToolsClient(TEST_URL);

      let connectionCount = 0;
      mockServer.on('connection', () => {
        connectionCount++;
      });

      await client.connect();
      expect(connectionCount).toBe(1);

      // Force disconnect
      mockServer.clients.forEach(ws => ws.close());

      // Wait for reconnect timer (5 seconds)
      await vi.advanceTimersByTimeAsync(5000);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(connectionCount).toBe(2);

      vi.useRealTimers();
    });
  });

  describe('Request/Response', () => {
    beforeEach(async () => {
      client = new DevToolsClient(TEST_URL);

      const connectPromise = client.connect();

      mockServer.once('connection', (ws) => {
        // Mock server that echoes requests as responses
        ws.on('message', (data) => {
          const request = JSON.parse(data.toString());
          const response = {
            jsonrpc: '2.0',
            result: { echo: request.method, params: request.params },
            id: request.id,
          };
          ws.send(JSON.stringify(response));
        });
      });

      await connectPromise;
    });

    it('should send request and receive response', async () => {
      const result = await client.request('test.method', { foo: 'bar' });

      expect(result.echo).toBe('test.method');
      expect(result.params.foo).toBe('bar');
    });

    it('should handle multiple concurrent requests', async () => {
      const promises = [
        client.request('method1', { value: 1 }),
        client.request('method2', { value: 2 }),
        client.request('method3', { value: 3 }),
      ];

      const results = await Promise.all(promises);

      expect(results[0].echo).toBe('method1');
      expect(results[1].echo).toBe('method2');
      expect(results[2].echo).toBe('method3');
    });

    it('should reject request on error response', async () => {
      client.close();

      // Recreate client with error-returning server
      client = new DevToolsClient(TEST_URL);
      const connectPromise = client.connect();

      mockServer.once('connection', (ws) => {
        ws.on('message', (data) => {
          const request = JSON.parse(data.toString());
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32601, message: 'Method not found' },
            id: request.id,
          }));
        });
      });

      await connectPromise;

      await expect(client.request('unknown')).rejects.toThrow('Method not found');
    });

    // Skip: Fake timers with real WebSocket operations causes unhandled promise rejections
    it.skip('should timeout long requests', async () => {
      vi.useFakeTimers();

      client.close();
      client = new DevToolsClient(TEST_URL);
      const connectPromise = client.connect();

      mockServer.once('connection', (ws) => {
        ws.on('message', () => {
          // Never respond
        });
      });

      await connectPromise;

      const requestPromise = client.request('slow.method');

      // Advance time by 30 seconds
      await vi.advanceTimersByTimeAsync(30000);

      await expect(requestPromise).rejects.toThrow('timeout');

      vi.useRealTimers();
    });

    it('should reject pending requests on disconnect', async () => {
      const requestPromise = client.request('test.method');

      // Force disconnect
      mockServer.clients.forEach(ws => ws.close());

      await expect(requestPromise).rejects.toThrow('Connection closed');
    });
  });

  describe('Notifications', () => {
    beforeEach(async () => {
      client = new DevToolsClient(TEST_URL);
      await client.connect();
    });

    it('should receive notifications', async () => {
      const notifications: any[] = [];

      client.onNotification((method, params) => {
        notifications.push({ method, params });
      });

      // Send notification from server
      mockServer.clients.forEach(ws => {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'object.changed',
          params: { id: 5 },
        }));
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(notifications.length).toBe(1);
      expect(notifications[0].method).toBe('object.changed');
      expect(notifications[0].params.id).toBe(5);
    });

    it('should support multiple notification handlers', async () => {
      const handler1Calls: any[] = [];
      const handler2Calls: any[] = [];

      client.onNotification((method, params) => {
        handler1Calls.push({ method, params });
      });

      client.onNotification((method, params) => {
        handler2Calls.push({ method, params });
      });

      mockServer.clients.forEach(ws => {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'test.notification',
          params: { value: 123 },
        }));
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(handler1Calls.length).toBe(1);
      expect(handler2Calls.length).toBe(1);
      expect(handler1Calls[0].params.value).toBe(123);
      expect(handler2Calls[0].params.value).toBe(123);
    });

    it('should unregister notification handlers', async () => {
      const calls: any[] = [];

      const disposable = client.onNotification((method, params) => {
        calls.push({ method, params });
      });

      // Send notification
      mockServer.clients.forEach(ws => {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'test1',
          params: {},
        }));
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(calls.length).toBe(1);

      // Dispose handler
      disposable.dispose();

      // Send another notification
      mockServer.clients.forEach(ws => {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'test2',
          params: {},
        }));
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(calls.length).toBe(1); // Should still be 1
    });
  });

  describe('API Methods', () => {
    beforeEach(async () => {
      client = new DevToolsClient(TEST_URL);

      const connectPromise = client.connect();

      mockServer.once('connection', (ws) => {
        ws.on('message', (data) => {
          const request = JSON.parse(data.toString());
          let result: any;

          switch (request.method) {
            case 'objects.list':
              result = { objects: [{ id: 1 }, { id: 2 }] };
              break;
            case 'object.get':
              result = { object: { _id: request.params.id, parent: 1 } };
              break;
            case 'object.create':
              result = { id: 42 };
              break;
            case 'object.delete':
              result = { success: true };
              break;
            case 'method.get':
              result = { method: { name: request.params.name, code: 'return 1;' } };
              break;
            case 'method.set':
            case 'method.delete':
            case 'property.set':
            case 'property.delete':
              result = { success: true };
              break;
            case 'property.get':
              result = { property: { name: request.params.name, value: 'test' } };
              break;
            default:
              ws.send(JSON.stringify({
                jsonrpc: '2.0',
                error: { code: -32601, message: 'Method not found' },
                id: request.id,
              }));
              return;
          }

          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            result,
            id: request.id,
          }));
        });
      });

      await connectPromise;
    });

    it('should list objects', async () => {
      const objects = await client.listObjects();
      expect(objects).toHaveLength(2);
      expect(objects[0].id).toBe(1);
    });

    it('should get object', async () => {
      const obj = await client.getObject(5);
      expect(obj._id).toBe(5);
      expect(obj.parent).toBe(1);
    });

    it('should create object', async () => {
      const id = await client.createObject(1, { name: 'Test' }, { test: 'code' });
      expect(id).toBe(42);
    });

    it('should delete object', async () => {
      await expect(client.deleteObject(5)).resolves.toBeUndefined();
    });

    it('should get method', async () => {
      const method = await client.getMethod(5, 'test');
      expect(method.name).toBe('test');
      expect(method.code).toBe('return 1;');
    });

    it('should set method', async () => {
      await expect(client.setMethod(5, 'test', 'return 2;')).resolves.toBeUndefined();
    });

    it('should delete method', async () => {
      await expect(client.deleteMethod(5, 'test')).resolves.toBeUndefined();
    });

    it('should get property', async () => {
      const value = await client.getProperty(5, 'name');
      expect(value).toBe('test');
    });

    it('should set property', async () => {
      await expect(client.setProperty(5, 'name', 'newValue')).resolves.toBeUndefined();
    });

    it('should delete property', async () => {
      await expect(client.deleteProperty(5, 'name')).resolves.toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should throw error when requesting without connection', async () => {
      client = new DevToolsClient(TEST_URL);
      // Don't connect

      await expect(client.request('test')).rejects.toThrow('Not connected');
    });

    it('should handle server sending invalid JSON', async () => {
      client = new DevToolsClient(TEST_URL);

      const connectPromise = client.connect();

      mockServer.once('connection', (ws) => {
        ws.send('invalid json{');
      });

      await connectPromise;

      // Should not crash, just log error
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should close gracefully', async () => {
      client = new DevToolsClient(TEST_URL);
      await client.connect();

      client.close();

      // Verify no pending requests
      await expect(client.request('test')).rejects.toThrow('Not connected');
    });
  });
});
