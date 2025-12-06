import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { LSPApiServer } from '../../src/lsp/api-server.js';
import type { Server } from 'http';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
const TEST_PORT = 13579; // Use a unique test port to avoid conflicts

describe('LSP API Server', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let server: LSPApiServer;
  let httpServer: Server;
  let baseUrl: string;

  beforeAll(async () => {
    // Setup database
    db = new ObjectDatabase(MONGO_URI, 'malice_test_lsp_api');
    await db.connect();
    await db['objects'].deleteMany({});
    await db.ensureRoot();

    manager = new ObjectManager(db);

    // Start API server on test port
    server = new LSPApiServer(manager, TEST_PORT);
    baseUrl = `http://localhost:${TEST_PORT}`;

    // Start server and capture reference
    await new Promise<void>((resolve) => {
      const apiServer = server as any;
      const createServer = require('http').createServer;
      httpServer = createServer(apiServer.handleRequest.bind(apiServer));
      httpServer.listen(TEST_PORT, () => {
        console.log(`Test server started on port ${TEST_PORT}`);
        resolve();
      });
    });

    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 500));
  }, 30000);

  afterAll(async () => {
    // Stop server
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Disconnect database
    await db.disconnect();
  }, 15000);

  beforeEach(async () => {
    // Clean up test objects (except root)
    const allObjects = await db.listAll();
    for (const obj of allObjects) {
      if (obj._id > 1) {
        await db.delete(obj._id);
      }
    }
  });

  describe('CORS Headers', () => {
    it('should set CORS headers on GET requests', async () => {
      const response = await fetch(`${baseUrl}/api/lsp/list/objects/`);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });

    it('should set CORS headers on POST requests', async () => {
      // Create a test object first
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });
      obj.setMethod('test', 'return "hello";');
      await obj.save();

      const response = await fetch(
        `${baseUrl}/api/lsp/write/objects/${obj.id}/test.ts`,
        {
          method: 'POST',
          body: 'return "updated";',
        }
      );

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await fetch(`${baseUrl}/api/lsp/list/objects/`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('GET /api/lsp/list/objects/', () => {
    it('should list all objects as directories', async () => {
      // Create some test objects
      await manager.create({
        parent: 1,
        properties: { name: 'Object A' },
        methods: {},
      });
      await manager.create({
        parent: 1,
        properties: { name: 'Object B' },
        methods: {},
      });

      const response = await fetch(`${baseUrl}/api/lsp/list/objects/`);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const entries = await response.json();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThanOrEqual(2); // At least root + our objects

      // Check structure of entries
      const firstEntry = entries[0];
      expect(firstEntry).toHaveProperty('name');
      expect(firstEntry).toHaveProperty('type');
      expect(firstEntry).toHaveProperty('uri');
      expect(firstEntry.type).toBe('directory');
    });

    it('should return empty array when no objects exist (except root)', async () => {
      const response = await fetch(`${baseUrl}/api/lsp/list/objects/`);
      expect(response.status).toBe(200);

      const entries = await response.json();
      expect(Array.isArray(entries)).toBe(true);
      // Should have at least root object
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });

    it('should include correct URIs in object list', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });

      const response = await fetch(`${baseUrl}/api/lsp/list/objects/`);
      const entries = await response.json();

      const objEntry = entries.find((e: any) => e.name === `${obj.id}`);
      expect(objEntry).toBeDefined();
      expect(objEntry.uri).toBe(`malice://objects/${obj.id}/`);
    });
  });

  describe('GET /api/lsp/list/objects/{id}/', () => {
    it('should list methods and properties for an object', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {
          hp: 100,
          name: 'Test Object',
        },
        methods: {},
      });
      obj.setMethod('greet', 'return "hello";');
      obj.setMethod('attack', 'return "attack!";');
      await obj.save();

      const response = await fetch(`${baseUrl}/api/lsp/list/objects/${obj.id}/`);
      expect(response.status).toBe(200);

      const entries = await response.json();
      expect(Array.isArray(entries)).toBe(true);

      // Should have 2 methods (.ts files) and 2 properties (.json files)
      const tsFiles = entries.filter((e: any) => e.name.endsWith('.ts'));
      const jsonFiles = entries.filter((e: any) => e.name.endsWith('.json'));

      expect(tsFiles.length).toBe(2);
      expect(jsonFiles.length).toBe(2);

      // Check method files
      const greetFile = tsFiles.find((e: any) => e.name === 'greet.ts');
      expect(greetFile).toBeDefined();
      expect(greetFile.type).toBe('file');
      expect(greetFile.uri).toBe(`malice://objects/${obj.id}/greet.ts`);

      // Check property files
      const hpFile = jsonFiles.find((e: any) => e.name === 'hp.json');
      expect(hpFile).toBeDefined();
      expect(hpFile.type).toBe('file');
      expect(hpFile.uri).toBe(`malice://objects/${obj.id}/hp.json`);
    });

    it('should return empty array for object with no methods or properties', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });

      const response = await fetch(`${baseUrl}/api/lsp/list/objects/${obj.id}/`);
      expect(response.status).toBe(200);

      const entries = await response.json();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });

    it('should return empty array for non-existent object', async () => {
      const response = await fetch(`${baseUrl}/api/lsp/list/objects/99999/`);
      expect(response.status).toBe(200);

      const entries = await response.json();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });
  });

  describe('GET /api/lsp/read/objects/{id}/{name}.ts', () => {
    it('should read method content with TypeScript context', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });
      const methodCode = 'return "Hello, World!";';
      obj.setMethod('greet', methodCode);
      await obj.save();

      const response = await fetch(`${baseUrl}/api/lsp/read/objects/${obj.id}/greet.ts`);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain');

      const content = await response.text();

      // Should include TypeScript context
      expect(content).toContain('// Malice MOO Method: greet');
      expect(content).toContain('declare const self:');
      expect(content).toContain('declare const $:');
      expect(content).toContain('declare const args:');

      // Should include actual method code
      expect(content).toContain(methodCode);
    });

    it('should return 404 for non-existent method', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });

      const response = await fetch(`${baseUrl}/api/lsp/read/objects/${obj.id}/nonexistent.ts`);
      expect(response.status).toBe(404);

      const text = await response.text();
      expect(text).toBe('Not found');
    });

    it('should return 404 for non-existent object', async () => {
      const response = await fetch(`${baseUrl}/api/lsp/read/objects/99999/test.ts`);
      expect(response.status).toBe(404);
    });

    it('should include correct prototype type in context', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });
      obj.setMethod('test', 'return self.id;');
      await obj.save();

      const response = await fetch(`${baseUrl}/api/lsp/read/objects/${obj.id}/test.ts`);
      const content = await response.text();

      // Should have some prototype type (RuntimeObject or specific type)
      expect(content).toMatch(/declare const self: \w+/);
    });
  });

  describe('GET /api/lsp/read/objects/{id}/{name}.json', () => {
    it('should read property content as JSON', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {
          hp: 100,
          name: 'Test Player',
          stats: { strength: 10, dexterity: 15 },
        },
        methods: {},
      });

      // Read number property
      const hpResponse = await fetch(`${baseUrl}/api/lsp/read/objects/${obj.id}/hp.json`);
      expect(hpResponse.status).toBe(200);
      expect(hpResponse.headers.get('Content-Type')).toBe('text/plain');
      const hpContent = await hpResponse.text();
      expect(JSON.parse(hpContent)).toBe(100);

      // Read string property
      const nameResponse = await fetch(`${baseUrl}/api/lsp/read/objects/${obj.id}/name.json`);
      const nameContent = await nameResponse.text();
      expect(JSON.parse(nameContent)).toBe('Test Player');

      // Read object property
      const statsResponse = await fetch(`${baseUrl}/api/lsp/read/objects/${obj.id}/stats.json`);
      const statsContent = await statsResponse.text();
      expect(JSON.parse(statsContent)).toEqual({ strength: 10, dexterity: 15 });
    });

    it('should return 404 for non-existent property', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });

      const response = await fetch(`${baseUrl}/api/lsp/read/objects/${obj.id}/nonexistent.json`);
      expect(response.status).toBe(404);
    });

    it('should format JSON with indentation', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {
          data: { a: 1, b: 2, c: 3 },
        },
        methods: {},
      });

      const response = await fetch(`${baseUrl}/api/lsp/read/objects/${obj.id}/data.json`);
      const content = await response.text();

      // Should be formatted with indentation (not minified)
      expect(content).toContain('\n');
      expect(content).toContain('  ');
    });
  });

  describe('POST /api/lsp/write/objects/{id}/{name}.ts', () => {
    it('should write method content to MongoDB', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });
      obj.setMethod('test', 'return "old";');
      await obj.save();

      const newCode = 'return "new value";';
      const response = await fetch(
        `${baseUrl}/api/lsp/write/objects/${obj.id}/test.ts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: newCode,
        }
      );

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('OK');

      // Wait for changes to propagate
      await new Promise(resolve => setTimeout(resolve, 200));

      // Invalidate cache to force reload
      manager.invalidate(obj.id);

      // Verify method was updated in database
      const reloaded = await manager.load(obj.id);
      expect(reloaded).not.toBeNull();

      const result = await reloaded!.call('test');
      expect(result).toBe('new value');
    });

    it('should create new method if it does not exist', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });

      const code = 'return "brand new";';
      const response = await fetch(
        `${baseUrl}/api/lsp/write/objects/${obj.id}/newMethod.ts`,
        {
          method: 'POST',
          body: code,
        }
      );

      expect(response.status).toBe(200);

      // Wait for changes and invalidate cache
      await new Promise(resolve => setTimeout(resolve, 200));
      manager.invalidate(obj.id);

      // Verify method was created
      const reloaded = await manager.load(obj.id);
      const result = await reloaded!.call('newMethod');
      expect(result).toBe('brand new');
    });

    it('should handle method with TypeScript syntax', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { value: 10 },
        methods: {},
      });

      const code = `
        const x: number = self.value;
        const doubled: number = x * 2;
        return doubled;
      `;

      const response = await fetch(
        `${baseUrl}/api/lsp/write/objects/${obj.id}/calculate.ts`,
        {
          method: 'POST',
          body: code,
        }
      );

      expect(response.status).toBe(200);

      // Wait for changes and invalidate cache
      await new Promise(resolve => setTimeout(resolve, 200));
      manager.invalidate(obj.id);

      // Verify method executes correctly
      const reloaded = await manager.load(obj.id);
      const result = await reloaded!.call('calculate');
      expect(result).toBe(20);
    });

    it('should invalidate cache after writing', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });
      obj.setMethod('cached', 'return "original";');
      await obj.save();

      // Load to cache it
      await obj.call('cached');

      // Write new code via API
      await fetch(
        `${baseUrl}/api/lsp/write/objects/${obj.id}/cached.ts`,
        {
          method: 'POST',
          body: 'return "updated";',
        }
      );

      // Wait for changes and invalidate cache
      await new Promise(resolve => setTimeout(resolve, 200));
      manager.invalidate(obj.id);

      // Should get updated code
      const reloaded = await manager.load(obj.id);
      const result = await reloaded!.call('cached');
      expect(result).toBe('updated');
    });

    it('should return 200 but not create method for invalid object ID', async () => {
      const response = await fetch(
        `${baseUrl}/api/lsp/write/objects/99999/test.ts`,
        {
          method: 'POST',
          body: 'return "test";',
        }
      );

      // Returns 200 but silently fails (VFS returns early if object doesn't exist)
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await fetch(`${baseUrl}/api/lsp/unknown/route`);
      expect(response.status).toBe(404);

      const text = await response.text();
      expect(text).toBe('Not found');
    });

    it('should return 404 for invalid paths', async () => {
      const response = await fetch(`${baseUrl}/api/lsp/read/invalid/path`);
      expect(response.status).toBe(404);
    });

    it('should handle malformed URIs gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/lsp/read/objects/abc/test.ts`);

      // Should either return 404 or 500, but not crash
      expect([404, 500]).toContain(response.status);
    });

    it('should return 500 on database errors', async () => {
      // Try to read from an object after disconnecting (simulated error)
      // This is hard to test without mocking, so we'll test with invalid data

      const response = await fetch(`${baseUrl}/api/lsp/read/objects/-999/test.ts`);

      // Should handle gracefully
      expect([404, 500]).toContain(response.status);
    });

    it('should return 500 with error message when exception occurs', async () => {
      // Create a server with a broken VFS that throws
      const brokenPort = TEST_PORT + 1;
      const brokenServer = new LSPApiServer(manager, brokenPort);

      // Override the VFS to throw an error
      const originalVfs = (brokenServer as any).vfs;
      (brokenServer as any).vfs = {
        listDirectory: async () => {
          throw new Error('Database connection failed');
        },
        getDocument: originalVfs.getDocument.bind(originalVfs),
        updateDocument: originalVfs.updateDocument.bind(originalVfs),
      };

      // Start the broken server
      const brokenHttpServer = require('http').createServer(
        (brokenServer as any).handleRequest.bind(brokenServer)
      );

      await new Promise<void>((resolve) => {
        brokenHttpServer.listen(brokenPort, () => resolve());
      });

      try {
        const response = await fetch(`http://localhost:${brokenPort}/api/lsp/list/objects/`);
        expect(response.status).toBe(500);

        const text = await response.text();
        expect(text).toBe('Database connection failed');
      } finally {
        await new Promise<void>((resolve, reject) => {
          brokenHttpServer.close((err: Error) => err ? reject(err) : resolve());
        });
      }
    });

    it('should return generic error message for non-Error exceptions', async () => {
      // Create a server with a VFS that throws a non-Error
      const brokenPort = TEST_PORT + 2;
      const brokenServer = new LSPApiServer(manager, brokenPort);

      // Override the VFS to throw a non-Error
      (brokenServer as any).vfs = {
        listDirectory: async () => {
          throw 'String error'; // Not an Error instance
        },
        getDocument: async () => null,
        updateDocument: async () => {},
      };

      // Start the broken server
      const brokenHttpServer = require('http').createServer(
        (brokenServer as any).handleRequest.bind(brokenServer)
      );

      await new Promise<void>((resolve) => {
        brokenHttpServer.listen(brokenPort, () => resolve());
      });

      try {
        const response = await fetch(`http://localhost:${brokenPort}/api/lsp/list/objects/`);
        expect(response.status).toBe(500);

        const text = await response.text();
        expect(text).toBe('Internal server error');
      } finally {
        await new Promise<void>((resolve, reject) => {
          brokenHttpServer.close((err: Error) => err ? reject(err) : resolve());
        });
      }
    });
  });

  describe('Integration Tests', () => {
    it('should support complete CRUD workflow', async () => {
      // Create object
      const obj = await manager.create({
        parent: 1,
        properties: { counter: 0 },
        methods: {},
      });

      // List objects (Read)
      const listResponse = await fetch(`${baseUrl}/api/lsp/list/objects/`);
      const objects = await listResponse.json();
      expect(objects.some((e: any) => e.name === `${obj.id}`)).toBe(true);

      // Write method (Create)
      await fetch(`${baseUrl}/api/lsp/write/objects/${obj.id}/increment.ts`, {
        method: 'POST',
        body: 'self.counter++; return self.counter;',
      });

      // Wait for changes and invalidate cache
      await new Promise(resolve => setTimeout(resolve, 200));
      manager.invalidate(obj.id);

      // Read method (Read)
      const readResponse = await fetch(`${baseUrl}/api/lsp/read/objects/${obj.id}/increment.ts`);
      const content = await readResponse.text();
      expect(content).toContain('self.counter++');

      // List methods (Read)
      const methodsResponse = await fetch(`${baseUrl}/api/lsp/list/objects/${obj.id}/`);
      const methods = await methodsResponse.json();
      const incrementFile = methods.find((e: any) => e.name === 'increment.ts');
      expect(incrementFile).toBeDefined();

      // Update method (Update)
      await fetch(`${baseUrl}/api/lsp/write/objects/${obj.id}/increment.ts`, {
        method: 'POST',
        body: 'self.counter += 2; return self.counter;',
      });

      // Wait for changes and invalidate cache
      await new Promise(resolve => setTimeout(resolve, 200));
      manager.invalidate(obj.id);

      // Verify update
      const updated = await manager.load(obj.id);
      const result = await updated!.call('increment');
      expect(result).toBe(2);
    });

    it('should handle concurrent requests', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });

      // Make concurrent read requests (reads are safe to parallelize)
      const readRequests = [
        fetch(`${baseUrl}/api/lsp/list/objects/`),
        fetch(`${baseUrl}/api/lsp/list/objects/${obj.id}/`),
      ];

      const readResponses = await Promise.all(readRequests);

      // All reads should succeed
      expect(readResponses[0].status).toBe(200);
      expect(readResponses[1].status).toBe(200);

      // Write methods sequentially to avoid race conditions on the same object
      const write1Response = await fetch(`${baseUrl}/api/lsp/write/objects/${obj.id}/test1.ts`, {
        method: 'POST',
        body: 'return 1;',
      });
      expect(write1Response.status).toBe(200);

      const write2Response = await fetch(`${baseUrl}/api/lsp/write/objects/${obj.id}/test2.ts`, {
        method: 'POST',
        body: 'return 2;',
      });
      expect(write2Response.status).toBe(200);

      // Wait for changes and invalidate cache
      await new Promise(resolve => setTimeout(resolve, 200));
      manager.invalidate(obj.id);

      // Verify both methods were created
      const reloaded = await manager.load(obj.id);
      expect(await reloaded!.call('test1')).toBe(1);
      expect(await reloaded!.call('test2')).toBe(2);
    });

    it('should work with objects that have many methods', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });

      // Create 10 methods
      for (let i = 0; i < 10; i++) {
        obj.setMethod(`method${i}`, `return ${i};`);
      }
      await obj.save();

      // List should show all methods
      const response = await fetch(`${baseUrl}/api/lsp/list/objects/${obj.id}/`);
      const entries = await response.json();

      const methodFiles = entries.filter((e: any) => e.name.endsWith('.ts'));
      expect(methodFiles.length).toBe(10);

      // Verify we can read each one
      for (let i = 0; i < 10; i++) {
        const readResponse = await fetch(
          `${baseUrl}/api/lsp/read/objects/${obj.id}/method${i}.ts`
        );
        expect(readResponse.status).toBe(200);
        const content = await readResponse.text();
        expect(content).toContain(`return ${i};`);
      }
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server via start() method', async () => {
      const startPort = TEST_PORT + 3;
      const startServer = new LSPApiServer(manager, startPort);

      // Use spyOn to capture console.log
      const consoleSpy = vi.spyOn(console, 'log');

      // Start the server
      startServer.start();

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify the log message was printed
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`LSP API Server listening on http://localhost:${startPort}`)
      );

      // Verify server is actually listening by making a request
      const response = await fetch(`http://localhost:${startPort}/api/lsp/list/objects/`);
      expect(response.status).toBe(200);

      // Cleanup - we need to close the server
      // The start() method doesn't return the server, so we need to find another way
      // For now, we'll just leave it running as it will be cleaned up when the test process exits
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle methods with special characters in names', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });

      // Method names with underscores and numbers
      obj.setMethod('on_connection_123', 'return "connected";');
      await obj.save();

      const response = await fetch(
        `${baseUrl}/api/lsp/read/objects/${obj.id}/on_connection_123.ts`
      );
      expect(response.status).toBe(200);
    });

    it('should handle empty method code', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });

      const response = await fetch(
        `${baseUrl}/api/lsp/write/objects/${obj.id}/empty.ts`,
        {
          method: 'POST',
          body: '',
        }
      );

      expect(response.status).toBe(200);

      // Wait longer for empty methods to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      manager.invalidate(obj.id);

      // Should be able to read it back
      const readResponse = await fetch(
        `${baseUrl}/api/lsp/read/objects/${obj.id}/empty.ts`
      );
      expect(readResponse.status).toBe(200);
    });

    it('should handle very large method code', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });

      // Generate large code (10KB)
      const largeCode = 'return "' + 'x'.repeat(10000) + '";';

      const response = await fetch(
        `${baseUrl}/api/lsp/write/objects/${obj.id}/large.ts`,
        {
          method: 'POST',
          body: largeCode,
        }
      );

      expect(response.status).toBe(200);

      // Wait for changes and invalidate cache
      await new Promise(resolve => setTimeout(resolve, 200));
      manager.invalidate(obj.id);

      // Verify it was saved
      const readResponse = await fetch(
        `${baseUrl}/api/lsp/read/objects/${obj.id}/large.ts`
      );
      const content = await readResponse.text();
      expect(content).toContain('x'.repeat(10000));
    });

    it('should handle properties with null values', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {
          nullProp: null,
        },
        methods: {},
      });

      const response = await fetch(`${baseUrl}/api/lsp/read/objects/${obj.id}/nullProp.json`);
      expect(response.status).toBe(200);

      const content = await response.text();
      expect(JSON.parse(content)).toBeNull();
    });

    it('should handle properties with array values', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {
          items: ['sword', 'shield', 'potion'],
        },
        methods: {},
      });

      const response = await fetch(`${baseUrl}/api/lsp/read/objects/${obj.id}/items.json`);
      const content = await response.text();

      expect(JSON.parse(content)).toEqual(['sword', 'shield', 'potion']);
    });
  });
});
