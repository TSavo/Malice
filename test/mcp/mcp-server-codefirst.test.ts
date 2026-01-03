import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MaliceMCPServer } from '../../src/mcp/mcp-server-codefirst.js';
import type { ObjectManager } from '../../src/database/object-manager.js';
import http from 'node:http';

// Mock ObjectManager - only need minimal interface for MCP server
const createMockManager = (): ObjectManager => {
  return {
    load: vi.fn().mockResolvedValue({
      invoke: vi.fn().mockResolvedValue({ result: 'mocked' }),
    }),
    query: vi.fn().mockReturnValue({
      all: vi.fn().mockResolvedValue([]),
    }),
  } as unknown as ObjectManager;
};

// Helper to wait for server to be ready
const waitForServer = async (url: string, maxAttempts = 10, delayMs = 100): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`Server at ${url} did not become ready`);
};

describe('MaliceMCPServer', () => {
  let server: MaliceMCPServer | null = null;
  let manager: ObjectManager;
  const testPort = 13010; // Use non-standard port for testing

  beforeEach(() => {
    manager = createMockManager();
  });

  afterEach(async () => {
    if (server) {
      try {
        await server.stop();
      } catch {
        // Ignore errors during cleanup
      }
      server = null;
    }
  });

  describe('Health Check Endpoint', () => {
    it('should return 200 OK with session stats when healthy', async () => {
      server = new MaliceMCPServer(manager, { port: testPort, host: '127.0.0.1' });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      const response = await fetch(`http://127.0.0.1:${testPort}/health`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toMatchObject({
        status: 'ok',
        service: 'mcp-codefirst',
        sessions: {
          total: 0,
          active: 0,
        },
      });
      expect(data.timestamp).toBeDefined();
      expect(data.sessionTtlMinutes).toBe(30); // Default TTL
    });

    it('should reject non-GET requests to /health', async () => {
      server = new MaliceMCPServer(manager, { port: testPort, host: '127.0.0.1' });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      const response = await fetch(`http://127.0.0.1:${testPort}/health`, {
        method: 'POST',
      });
      expect(response.status).toBe(405);
    });
  });

  describe('Session TTL Configuration', () => {
    it('should use default TTL of 30 minutes', async () => {
      server = new MaliceMCPServer(manager, { port: testPort });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      const response = await fetch(`http://127.0.0.1:${testPort}/health`);
      const data = await response.json();

      expect(data.sessionTtlMinutes).toBe(30);
    });

    it('should accept custom TTL configuration', async () => {
      server = new MaliceMCPServer(manager, {
        port: testPort,
        sessionTtlMinutes: 60,
      });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      const response = await fetch(`http://127.0.0.1:${testPort}/health`);
      const data = await response.json();

      expect(data.sessionTtlMinutes).toBe(60);
    });

    it('should accept custom cleanup interval', async () => {
      server = new MaliceMCPServer(manager, {
        port: testPort,
        cleanupIntervalMinutes: 10,
      });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      // Cleanup interval is internal, but we can verify server starts successfully
      const response = await fetch(`http://127.0.0.1:${testPort}/health`);
      expect(response.status).toBe(200);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should prevent concurrent shutdown calls', async () => {
      server = new MaliceMCPServer(manager, { port: testPort, host: '127.0.0.1' });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      // Call stop() twice concurrently
      await Promise.all([server.stop(), server.stop()]);

      // Both should complete without errors (second is a no-op)
      // If we get here without throwing, the test passes
      expect(true).toBe(true);
    });
  });

  describe('DELETE Session Endpoint', () => {
    it('should return 404 for non-existent session', async () => {
      server = new MaliceMCPServer(manager, { port: testPort, host: '127.0.0.1' });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      const response = await fetch(`http://127.0.0.1:${testPort}/mcp`, {
        method: 'DELETE',
        headers: { 'x-mcp-session-id': 'non-existent-session' },
      });

      expect(response.status).toBe(404);
      const text = await response.text();
      expect(text).toContain('Session not found');
    });

    it('should return 404 when deleting without session ID', async () => {
      server = new MaliceMCPServer(manager, { port: testPort, host: '127.0.0.1' });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      const response = await fetch(`http://127.0.0.1:${testPort}/mcp`, {
        method: 'DELETE',
      });

      // Without session ID, should return 404 (no session to delete)
      expect(response.status).toBe(404);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start and stop cleanly', async () => {
      server = new MaliceMCPServer(manager, { port: testPort, host: '127.0.0.1' });

      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      const response1 = await fetch(`http://127.0.0.1:${testPort}/health`);
      expect(response1.status).toBe(200);

      await server.stop();

      // Should not be reachable after stop
      try {
        await fetch(`http://127.0.0.1:${testPort}/health`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Expected - server is stopped
        expect(error).toBeDefined();
      }
    });

    it('should handle stop() when not started', async () => {
      server = new MaliceMCPServer(manager, { port: testPort });

      // Should not throw when stopping a server that was never started
      await server.stop();
      expect(true).toBe(true);
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown paths', async () => {
      server = new MaliceMCPServer(manager, { port: testPort, host: '127.0.0.1' });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      const response = await fetch(`http://127.0.0.1:${testPort}/unknown`);
      expect(response.status).toBe(404);
      const text = await response.text();
      expect(text).toContain('Not Found');
    });
  });
});
