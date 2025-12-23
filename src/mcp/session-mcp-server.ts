/**
 * Session MCP Server for Malice MOO (Code-First)
 *
 * Provides sandboxed access to telnet session management via $.session.
 * Port: 3012
 *
 * Architecture:
 * - Single tool: execute_session_code
 * - Sandboxed execution: ONLY $.session is injected (no $, $load, $create, etc.)
 * - $.session wraps $.telnet native methods (player-safe)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import type { ObjectManager } from '../database/object-manager.js';
import type { RuntimeObject } from '../../types/object.js';

interface SessionMCPServerConfig {
  port?: number;
  host?: string;
}

interface SessionState {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  telnetSessionId: string; // Associated telnet session for this MCP session
}

export class SessionMCPServer {
  private httpServer: ReturnType<typeof createServer> | null = null;
  private sessions = new Map<string, SessionState>();
  private port: number;
  private host: string;

  constructor(
    private manager: ObjectManager,
    config: SessionMCPServerConfig = {}
  ) {
    this.port = config.port ?? 3012;
    this.host = config.host ?? '127.0.0.1';
  }

  /**
   * Get $.session object
   */
  private getSession(): RuntimeObject | undefined {
    return this.manager.getAliases().get('session');
  }

  /**
   * Serialize value for JSON output (handles RuntimeObjects)
   */
  private serializeValue(value: any, seen = new WeakSet()): any {
    if (value === null || value === undefined) return value;

    // RuntimeObject -> #ID
    if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'number' && typeof value.get === 'function') {
      return `#${value.id}`;
    }

    if (Array.isArray(value)) {
      return value.map(v => this.serializeValue(v, seen));
    }

    if (typeof value === 'object') {
      if (seen.has(value)) return '[circular]';
      seen.add(value);
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = this.serializeValue(v, seen);
      }
      return result;
    }

    return value;
  }

  async start(): Promise<void> {
    this.httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
      res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      // DELETE = close session
      if (req.method === 'DELETE' && sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
          await session.transport.close();
          this.sessions.delete(sessionId);
        }
        res.writeHead(200);
        res.end();
        return;
      }

      // GET or POST without session = new session
      if (!sessionId || !this.sessions.has(sessionId)) {
        const newSession = await this.createSession();
        const newSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        this.sessions.set(newSessionId, newSession);
        res.setHeader('mcp-session-id', newSessionId);
        await newSession.transport.handleRequest(req, res);
        return;
      }

      // Existing session
      const session = this.sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res);
    });

    return new Promise((resolve) => {
      this.httpServer!.listen(this.port, this.host, () => {
        console.log(`[SessionMCP] Server listening on http://${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    const $session = this.getSession();

    for (const [, session] of this.sessions) {
      // Close associated telnet session
      if ($session) {
        try {
          await $session.call('close', session.telnetSessionId);
        } catch (err) {
          console.error('[SessionMCP] Error closing telnet session:', err);
        }
      }
      await session.transport.close();
    }
    this.sessions.clear();

    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer!.close(() => {
          this.httpServer = null;
          console.log('[SessionMCP] Server stopped');
          resolve();
        });
      });
    }
  }

  private async createSession(): Promise<SessionState> {
    // Create telnet session for this MCP session
    const $session = this.getSession();
    if (!$session) {
      throw new Error('$.session not bootstrapped');
    }

    const telnetResult = await $session.call('connect') as { sessionId: string; output: string; message: string };
    const telnetSessionId = telnetResult.sessionId;

    const server = new McpServer({
      name: 'malice-session',
      version: '2.0.0',
    });

    this.registerTools(server, telnetSessionId);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => `mcp-${Date.now()}`,
    });

    server.connect(transport).catch(console.error);

    return { server, transport, telnetSessionId };
  }

  getPort(): number {
    return this.port;
  }

  private registerTools(server: McpServer, telnetSessionId: string): void {
    // Sandboxed executor: ONLY $.session is available (with sessionId pre-bound)
    server.tool(
      'execute_session_code',
      `Execute session management code with access to $.session.

SANDBOXED: This executor ONLY provides $.session - no access to $, $load, $create, $query, or other MOO internals.

SECURITY: Your sessionId is automatically bound - you can ONLY access your own telnet session.

The code runs with access to:
- $.session.send(command) - Send command to YOUR session
- $.session.getLog(lines?) - Get YOUR session log
- $.session.getStatus() - Get YOUR session status
- $.session.addKey(key) - Add SSH key to YOUR account
- $.session.listKeys() - List YOUR SSH keys
- $.session.removeKey(keyId) - Remove SSH key from YOUR account

Example:
  // Send commands (sessionId automatically bound)
  await $.session.send("connect admin password");
  const log = await $.session.getLog();
  return log;`,
      {
        code: z.string().describe('Session management code to execute'),
      },
      async ({ code }) => {
        try {
          const $session = this.getSession();
          if (!$session) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: '$.session not bootstrapped. Run FORCE_BOOTSTRAP=true npm start' }) }],
              isError: true,
            };
          }

          // Create curried/bound version of $.session with sessionId pre-filled
          const boundSession = {
            // Curried methods - sessionId is pre-bound, player can't change it
            send: async (command: string) => {
              return await $session.call('send', telnetSessionId, command);
            },
            getLog: async (lines?: number) => {
              return await $session.call('getLog', telnetSessionId, lines);
            },
            getStatus: async () => {
              return await $session.call('getStatus', telnetSessionId);
            },
            addKey: async (key: string) => {
              return await $session.call('addKey', telnetSessionId, key);
            },
            listKeys: async () => {
              return await $session.call('listKeys', telnetSessionId);
            },
            removeKey: async (keyId: string) => {
              return await $session.call('removeKey', telnetSessionId, keyId);
            },
          };

          // Create sandboxed context with ONLY bound $.session
          const sandboxContext = {
            $: {
              session: boundSession,
            },
            // Standard JavaScript globals
            Object, Array, Math, JSON, Date, String, Number, Boolean,
            RegExp, Error, Promise, console, parseInt, parseFloat, isNaN, isFinite,
          };

          // Execute code in sandboxed context
          const AsyncFn = async function () { }.constructor as FunctionConstructor;
          const fn = new AsyncFn('ctx', `
            const $ = ctx.$;
            const Object = ctx.Object;
            const Array = ctx.Array;
            const Math = ctx.Math;
            const JSON = ctx.JSON;
            const Date = ctx.Date;
            const String = ctx.String;
            const Number = ctx.Number;
            const Boolean = ctx.Boolean;
            const RegExp = ctx.RegExp;
            const Error = ctx.Error;
            const Promise = ctx.Promise;
            const console = ctx.console;
            const parseInt = ctx.parseInt;
            const parseFloat = ctx.parseFloat;
            const isNaN = ctx.isNaN;
            const isFinite = ctx.isFinite;
            return (async () => {
              ${code}
            })();
          `);

          const result = await fn(sandboxContext);
          const serialized = this.serializeValue(result);

          return {
            content: [{ type: 'text', text: JSON.stringify(serialized, null, 2) }],
          };
        } catch (err) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }) }],
            isError: true,
          };
        }
      }
    );
  }
}

/**
 * Create and start a Session MCP server
 */
export async function createSessionMCPServer(
  manager: ObjectManager,
  config: SessionMCPServerConfig = {}
): Promise<SessionMCPServer> {
  const server = new SessionMCPServer(manager, config);
  await server.start();
  console.log(`🔌 Session MCP server (code-first) ready on port ${server.getPort()}`);
  return server;
}
