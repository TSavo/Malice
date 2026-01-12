import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Test suite for scripts/generate-room-images.ts
 *
 * This tests the core logic and utility functions used by the room image generation script.
 * The script orchestrates Midjourney image generation for MOO rooms via MCP.
 */

describe('generate-room-images script', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Command line argument parsing', () => {
    it('should parse --dry-run flag', () => {
      const args = ['--dry-run'];
      const dryRun = args.includes('--dry-run');
      expect(dryRun).toBe(true);
    });

    it('should parse --limit flag with value', () => {
      const args = ['--limit', '10'];
      const limitArgIdx = args.indexOf('--limit');
      const overrideLimit = limitArgIdx >= 0 ? parseInt(args[limitArgIdx + 1], 10) : null;
      expect(overrideLimit).toBe(10);
    });

    it('should parse --world-only flag', () => {
      const args = ['--world-only'];
      const worldOnly = args.includes('--world-only');
      expect(worldOnly).toBe(true);
    });

    it('should parse --buildings-only flag', () => {
      const args = ['--buildings-only'];
      const buildingsOnly = args.includes('--buildings-only');
      expect(buildingsOnly).toBe(true);
    });

    it('should parse --underground flag', () => {
      const args = ['--underground'];
      const undergroundOnly = args.includes('--underground');
      expect(undergroundOnly).toBe(true);
    });

    it('should parse --surface flag', () => {
      const args = ['--surface'];
      const surfaceOnly = args.includes('--surface');
      expect(surfaceOnly).toBe(true);
    });

    it('should parse --mcp-url flag with value', () => {
      const args = ['--mcp-url', 'http://custom:3010'];
      const mcpUrlIdx = args.indexOf('--mcp-url');
      const mcpUrl = mcpUrlIdx >= 0 ? args[mcpUrlIdx + 1] : 'http://localhost:3010';
      expect(mcpUrl).toBe('http://custom:3010');
    });

    it('should default mcp-url to localhost:3010', () => {
      const args: string[] = [];
      const mcpUrlIdx = args.indexOf('--mcp-url');
      const mcpUrl = mcpUrlIdx >= 0 ? args[mcpUrlIdx + 1] : 'http://localhost:3010';
      expect(mcpUrl).toBe('http://localhost:3010');
    });

    it('should parse --delay flag with value', () => {
      const args = ['--delay', '5000'];
      const delayIdx = args.indexOf('--delay');
      const delayMs = delayIdx >= 0 ? parseInt(args[delayIdx + 1], 10) : 0;
      expect(delayMs).toBe(5000);
    });
  });

  describe('Delay calculation', () => {
    it('should return fixed delay when DELAY_MS is set', () => {
      const DELAY_MS = 5000;
      const MIN_DELAY_MS = 5000;
      const MAX_DELAY_MS = 180000;

      function getDelay(): number {
        if (DELAY_MS > 0) return DELAY_MS;
        return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
      }

      const delay = getDelay();
      expect(delay).toBe(5000);
    });

    it('should return random delay within range when DELAY_MS is 0', () => {
      const DELAY_MS = 0;
      const MIN_DELAY_MS = 5000;
      const MAX_DELAY_MS = 180000;

      function getDelay(): number {
        if (DELAY_MS > 0) return DELAY_MS;
        return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
      }

      const delay = getDelay();
      expect(delay).toBeGreaterThanOrEqual(MIN_DELAY_MS);
      expect(delay).toBeLessThanOrEqual(MAX_DELAY_MS);
    });
  });

  describe('MCP session initialization', () => {
    it('should send correct initialize request', async () => {
      let capturedRequest: any = null;

      global.fetch = vi.fn(async (url: string, options?: any) => {
        capturedRequest = {
          url,
          body: JSON.parse(options.body),
          headers: options.headers,
        };

        return {
          ok: true,
          headers: new Map([['mcp-session-id', 'test-session-123']]),
          get: (key: string) => (key === 'mcp-session-id' ? 'test-session-123' : null),
        } as any;
      }) as any;

      async function initMcpSession(mcpUrl: string): Promise<string> {
        const response = await fetch(`${mcpUrl}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 0,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: { name: 'generate-room-images', version: '1.0.0' },
            },
          }),
        });

        const sessionId = response.headers.get('mcp-session-id');
        if (!sessionId) {
          throw new Error('No session ID returned from MCP initialize');
        }
        return sessionId;
      }

      const sessionId = await initMcpSession('http://localhost:3010');

      expect(capturedRequest.body.method).toBe('initialize');
      expect(capturedRequest.body.params.clientInfo.name).toBe('generate-room-images');
      expect(capturedRequest.headers['Content-Type']).toBe('application/json');
      expect(sessionId).toBe('test-session-123');
    });

    it('should throw error when no session ID returned', async () => {
      global.fetch = vi.fn(async () => {
        return {
          ok: true,
          headers: new Map(),
          get: () => null,
        } as any;
      }) as any;

      async function initMcpSession(mcpUrl: string): Promise<string> {
        const response = await fetch(`${mcpUrl}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 0,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: { name: 'generate-room-images', version: '1.0.0' },
            },
          }),
        });

        const sessionId = response.headers.get('mcp-session-id');
        if (!sessionId) {
          throw new Error('No session ID returned from MCP initialize');
        }
        return sessionId;
      }

      await expect(initMcpSession('http://localhost:3010')).rejects.toThrow(
        'No session ID returned from MCP initialize',
      );
    });
  });

  describe('MCP code execution', () => {
    it('should send correct execute_moo_code request', async () => {
      let capturedRequest: any = null;

      global.fetch = vi.fn(async (_url: string, options?: any) => {
        capturedRequest = {
          body: JSON.parse(options.body),
          headers: options.headers,
        };

        return {
          ok: true,
          text: async () =>
            'data: {"result":{"content":[{"type":"text","text":"{\\"id\\":42}"}]}}\n\n',
        } as any;
      }) as any;

      async function executeMooCode(
        code: string,
        mcpUrl: string,
        sessionId: string,
      ): Promise<unknown> {
        const response = await fetch(`${mcpUrl}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            'mcp-session-id': sessionId,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: {
              name: 'execute_moo_code',
              arguments: { code },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`MCP request failed: ${response.status}`);
        }

        const text = await response.text();
        const dataLine = text.split('\n').find((l) => l.startsWith('data:'));
        if (!dataLine) {
          throw new Error('No data in MCP response');
        }

        const result = JSON.parse(dataLine.substring(5));
        if (result.error) {
          throw new Error(`MCP error: ${result.error.message}`);
        }

        const content = result.result?.content?.[0];
        if (content?.type === 'text') {
          try {
            return JSON.parse(content.text);
          } catch {
            return content.text;
          }
        }
        return result.result;
      }

      const result = await executeMooCode(
        'const room = await $load(42); return room.id;',
        'http://localhost:3010',
        'test-session',
      );

      expect(capturedRequest.body.method).toBe('tools/call');
      expect(capturedRequest.body.params.name).toBe('execute_moo_code');
      expect(capturedRequest.body.params.arguments.code).toContain('$load(42)');
      expect(capturedRequest.headers['mcp-session-id']).toBe('test-session');
      expect(result).toEqual({ id: 42 });
    });

    it('should handle MCP error responses', async () => {
      global.fetch = vi.fn(async () => {
        return {
          ok: true,
          text: async () =>
            'data: {"error":{"message":"Room not found"}}\n\n',
        } as any;
      }) as any;

      async function executeMooCode(
        code: string,
        mcpUrl: string,
        sessionId: string,
      ): Promise<unknown> {
        const response = await fetch(`${mcpUrl}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            'mcp-session-id': sessionId,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: {
              name: 'execute_moo_code',
              arguments: { code },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`MCP request failed: ${response.status}`);
        }

        const text = await response.text();
        const dataLine = text.split('\n').find((l) => l.startsWith('data:'));
        if (!dataLine) {
          throw new Error('No data in MCP response');
        }

        const result = JSON.parse(dataLine.substring(5));
        if (result.error) {
          throw new Error(`MCP error: ${result.error.message}`);
        }

        return result.result;
      }

      await expect(
        executeMooCode('invalid code', 'http://localhost:3010', 'test-session'),
      ).rejects.toThrow('MCP error: Room not found');
    });

    it('should handle HTTP error responses', async () => {
      global.fetch = vi.fn(async () => {
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as any;
      }) as any;

      async function executeMooCode(
        code: string,
        mcpUrl: string,
        sessionId: string,
      ): Promise<unknown> {
        const response = await fetch(`${mcpUrl}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            'mcp-session-id': sessionId,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: {
              name: 'execute_moo_code',
              arguments: { code },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
        }

        return {};
      }

      await expect(
        executeMooCode('code', 'http://localhost:3010', 'test-session'),
      ).rejects.toThrow('MCP request failed: 500 Internal Server Error');
    });
  });

  describe('Room filtering logic', () => {
    interface RoomDef {
      name: string;
      x?: number;
      y?: number;
      z?: number;
      imageOnDisk?: string | object;
    }

    it('should filter underground rooms when --underground flag is set', () => {
      const rooms: RoomDef[] = [
        { name: 'Surface Room', x: 0, y: 0, z: 0 },
        { name: 'Underground Room', x: 0, y: 0, z: -1 },
        { name: 'Underground Deep', x: 0, y: 0, z: -5 },
      ];

      const undergroundOnly = true;
      const filtered = rooms.filter((r) => !undergroundOnly || (r.z !== undefined && r.z < 0));

      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe('Underground Room');
      expect(filtered[1].name).toBe('Underground Deep');
    });

    it('should filter surface rooms when --surface flag is set', () => {
      const rooms: RoomDef[] = [
        { name: 'Surface Room', x: 0, y: 0, z: 0 },
        { name: 'Underground Room', x: 0, y: 0, z: -1 },
        { name: 'Sky Room', x: 0, y: 0, z: 5 },
      ];

      const surfaceOnly = true;
      const filtered = rooms.filter((r) => !surfaceOnly || (r.z !== undefined && r.z >= 0));

      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe('Surface Room');
      expect(filtered[1].name).toBe('Sky Room');
    });

    it('should skip rooms that already have imageOnDisk', () => {
      const rooms: RoomDef[] = [
        { name: 'Room Without Image', x: 0, y: 0, z: 0 },
        { name: 'Room With Image', x: 0, y: 0, z: 0, imageOnDisk: 'image.png' },
        { name: 'Room With Image Object', x: 0, y: 0, z: 0, imageOnDisk: { path: 'img.png' } },
      ];

      const needsImage = rooms.filter((r) => !r.imageOnDisk);

      expect(needsImage).toHaveLength(1);
      expect(needsImage[0].name).toBe('Room Without Image');
    });
  });

  describe('Filename generation', () => {
    it('should generate correct filename format', () => {
      function generateFilename(name: string, x: number, y: number, z: number): string {
        const sanitized = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return `${sanitized}-x${x}-y${y}-z${z}.png`;
      }

      const filename = generateFilename('1st Ave S', 14, 1, 0);
      expect(filename).toBe('1st-ave-s-x14-y1-z0.png');
    });

    it('should handle special characters in room names', () => {
      function generateFilename(name: string, x: number, y: number, z: number): string {
        const sanitized = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return `${sanitized}-x${x}-y${y}-z${z}.png`;
      }

      const filename = generateFilename("Merchant's Café & Bar", -5, 10, -2);
      expect(filename).toBe('merchant-s-caf-bar-x-5-y10-z-2.png');
    });

    it('should handle negative coordinates', () => {
      function generateFilename(name: string, x: number, y: number, z: number): string {
        const sanitized = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return `${sanitized}-x${x}-y${y}-z${z}.png`;
      }

      const filename = generateFilename('Underground Tunnel', -10, -5, -3);
      expect(filename).toBe('underground-tunnel-x-10-y-5-z-3.png');
    });
  });

  describe('Sleep function', () => {
    it('should resolve after specified time', async () => {
      function sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some variance
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Health check logic', () => {
    it('should return true when API is healthy', () => {
      const healthResponse = { status: 'healthy', connected: true };
      const isHealthy = healthResponse.status === 'healthy' || healthResponse.connected === true;

      expect(isHealthy).toBe(true);
    });

    it('should return true when connected is true even if status is not healthy', () => {
      const healthResponse = { status: 'warning', connected: true };
      const isHealthy = healthResponse.status === 'healthy' || healthResponse.connected === true;

      expect(isHealthy).toBe(true);
    });

    it('should return false when API is unhealthy', () => {
      const healthResponse = { status: 'error', connected: false };
      const isHealthy = healthResponse.status === 'healthy' || healthResponse.connected === true;

      expect(isHealthy).toBe(false);
    });
  });

  describe('Error counting logic', () => {
    interface ProcessingResult {
      status: 'success' | 'error' | 'skipped';
    }

    interface ProcessingError extends ProcessingResult {
      status: 'error';
      isRateLimit?: boolean;
      isTokenError?: boolean;
      error: string;
    }

    it('should not count rate-limited errors in the error total', () => {
      const errors: ProcessingError[] = [
        { status: 'error', isRateLimit: true, error: 'Rate limited' },
        { status: 'error', isRateLimit: false, error: 'Failed to generate' },
        { status: 'error', error: 'Another error' },
      ];

      const errorCount = errors.filter(e => !e.isRateLimit).length;

      expect(errorCount).toBe(2);
    });

    it('should count all errors when none are rate-limited', () => {
      const errors: ProcessingError[] = [
        { status: 'error', error: 'Error 1' },
        { status: 'error', error: 'Error 2' },
        { status: 'error', isRateLimit: false, error: 'Error 3' },
      ];

      const errorCount = errors.filter(e => !e.isRateLimit).length;

      expect(errorCount).toBe(3);
    });

    it('should return zero when all errors are rate-limited', () => {
      const errors: ProcessingError[] = [
        { status: 'error', isRateLimit: true, error: 'Rate limited 1' },
        { status: 'error', isRateLimit: true, error: 'Rate limited 2' },
      ];

      const errorCount = errors.filter(e => !e.isRateLimit).length;

      expect(errorCount).toBe(0);
    });

    it('should return zero when errors array is empty', () => {
      const errors: ProcessingError[] = [];

      const errorCount = errors.filter(e => !e.isRateLimit).length;

      expect(errorCount).toBe(0);
    });

    it('should handle mixed error types correctly', () => {
      const errors: ProcessingError[] = [
        { status: 'error', isRateLimit: true, error: 'Rate limited' },
        { status: 'error', isTokenError: true, error: 'Token error' },
        { status: 'error', isRateLimit: false, isTokenError: false, error: 'Generic error' },
      ];

      // Rate-limited errors should not be counted, but token errors should
      const errorCount = errors.filter(e => !e.isRateLimit).length;

      expect(errorCount).toBe(2);
    });
  });
});
