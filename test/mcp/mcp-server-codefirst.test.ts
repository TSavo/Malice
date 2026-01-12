import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ObjectManager } from '../../src/database/object-manager.js';
import { MaliceMCPServer } from '../../src/mcp/mcp-server-codefirst.js';

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
const waitForServer = async (
  url: string,
  maxAttempts = 10,
  delayMs = 100,
): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
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
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
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
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
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
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
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
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
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
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
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
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });

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
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      const response = await fetch(`http://127.0.0.1:${testPort}/unknown`);
      expect(response.status).toBe(404);
      const text = await response.text();
      expect(text).toContain('Not Found');
    });
  });

  describe('Health Endpoint During Shutdown', () => {
    it('should return 503 during shutdown', async () => {
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      // Initiate shutdown (don't await to allow health check during shutdown)
      const shutdownPromise = server.stop();

      // Give it a moment to set isShuttingDown flag
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Health check should return 503
      const response = await fetch(`http://127.0.0.1:${testPort}/health`);
      expect(response.status).toBe(503);

      const data = await response.json();
      expect(data).toMatchObject({
        status: 'shutting_down',
        service: 'mcp-codefirst',
        timestamp: expect.any(String),
      });

      await shutdownPromise;
    });

    it('should handle errors and return 500', async () => {
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      // Mock the sessions Map to throw an error
      Object.defineProperty(server, 'sessions', {
        get: () => {
          throw new Error('Test error');
        },
      });

      const response = await fetch(`http://127.0.0.1:${testPort}/health`);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toMatchObject({
        status: 'error',
        service: 'mcp-codefirst',
        error: expect.any(String),
        timestamp: expect.any(String),
      });
    });
  });

  describe('Session Cleanup', () => {
    it('should remove sessions after TTL expires', async () => {
      // Use very short TTL for testing
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
        sessionTtlMinutes: 0.05, // 3 seconds
        cleanupIntervalMinutes: 0.02, // 1.2 seconds
      });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      // Create a mock session directly (simpler than full MCP init)
      const sessionId = 'test-session-123';
      const mockSession = {
        server: {} as any,
        transport: { close: vi.fn() } as any,
        lastActivity: Date.now() - 4000, // 4 seconds ago (past 3s TTL)
      };
      (server as any).sessions.set(sessionId, mockSession);

      // Wait for cleanup interval to run
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Session should be cleaned up
      const sessions = (server as any).sessions;
      expect(sessions.has(sessionId)).toBe(false);
      expect(mockSession.transport.close).toHaveBeenCalled();
    }, 10000);
  });

  describe('Shutdown Session Prevention', () => {
    it('should prevent new session initialization during shutdown', async () => {
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      // Set isShuttingDown flag
      (server as any).isShuttingDown = true;

      // Try to initialize a new session during shutdown
      const response = await fetch(`http://127.0.0.1:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
        }),
      });

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toMatchObject({
        code: -32000,
        message: 'Server is shutting down',
      });
    });

    it('should prevent stale session recreation during shutdown', async () => {
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      // Set isShuttingDown flag
      (server as any).isShuttingDown = true;

      // Try to use a stale session ID during shutdown
      const response = await fetch(`http://127.0.0.1:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'mcp-session-id': 'stale-session-id',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        }),
      });

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toMatchObject({
        code: -32000,
        message: 'Server is shutting down',
      });
    });
  });

  describe('Session Activity Tracking', () => {
    it('should update lastActivity on GET requests', async () => {
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      // Create a mock session
      const sessionId = 'test-session-456';
      const initialTime = Date.now() - 1000; // 1 second ago
      const mockSession = {
        server: {} as any,
        transport: {
          handleRequest: vi.fn().mockResolvedValue(undefined),
        } as any,
        lastActivity: initialTime,
      };
      (server as any).sessions.set(sessionId, mockSession);

      // Make a GET request
      await fetch(`http://127.0.0.1:${testPort}/mcp`, {
        method: 'GET',
        headers: {
          'mcp-session-id': sessionId,
        },
      });

      // lastActivity should be updated
      const updatedSession = (server as any).sessions.get(sessionId);
      expect(updatedSession.lastActivity).toBeGreaterThan(initialTime);
    });

    it('should update lastActivity on POST requests', async () => {
      server = new MaliceMCPServer(manager, {
        port: testPort,
        host: '127.0.0.1',
      });
      await server.start();
      await waitForServer(`http://127.0.0.1:${testPort}/health`);

      // Create a mock session
      const sessionId = 'test-session-789';
      const initialTime = Date.now() - 1000; // 1 second ago
      const mockSession = {
        server: {} as any,
        transport: {
          handleRequest: vi.fn().mockResolvedValue(undefined),
        } as any,
        lastActivity: initialTime,
      };
      (server as any).sessions.set(sessionId, mockSession);

      // Make a POST request
      await fetch(`http://127.0.0.1:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'mcp-session-id': sessionId,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        }),
      });

      // lastActivity should be updated
      const updatedSession = (server as any).sessions.get(sessionId);
      expect(updatedSession.lastActivity).toBeGreaterThan(initialTime);
    });
  });
});
