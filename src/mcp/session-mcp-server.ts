/**
 * Session MCP Server for Malice MOO
 *
 * Provides secure access to telnet session management.
 * Port: 3012
 *
 * Architecture:
 * - Simple action-based tool (not code-first)
 * - Each MCP session auto-creates its own telnet session
 * - sessionId is curried/bound - players can ONLY access their own session
 * - No JavaScript execution - just simple action dispatch
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
    // Simple action-based session tool
    // sessionId is curried - player can ONLY access their own telnet session
    server.tool(
      'session',
      `Manage your telnet session to the MOO.

SECURITY: You can ONLY access your own telnet session - sessionId is automatically bound.

ACTIONS:
  send      - Send a command to your session (command)
  getLog    - Get your session log (lines?)
  getStatus - Get your session status
  addKey    - Add SSH public key to your account (key)
  listKeys  - List your registered SSH keys
  removeKey - Remove an SSH key from your account (keyId)

EXAMPLES:
  session(action="send", command="connect admin password")
  session(action="getLog", lines=50)
  session(action="addKey", key="ssh-rsa AAAA...")
  session(action="listKeys")
  session(action="removeKey", keyId="1")`,
      {
        action: z.enum(['send', 'getLog', 'getStatus', 'addKey', 'listKeys', 'removeKey'])
          .describe('Action to perform'),
        command: z.string().optional()
          .describe('Command to send (required for send action)'),
        lines: z.number().optional()
          .describe('Number of log lines to return (default: all, max 1000)'),
        key: z.string().optional()
          .describe('SSH public key (required for addKey action)'),
        keyId: z.string().optional()
          .describe('Key number or fingerprint (required for removeKey action)'),
      },
      async ({ action, command, lines, key, keyId }) => {
        const $session = this.getSession();
        if (!$session) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: '$.session not bootstrapped' }) }],
            isError: true,
          };
        }

        const ok = (data: unknown) => ({
          content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
        });
        const err = (msg: string) => ({
          content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }],
          isError: true,
        });

        try {
          switch (action) {
            case 'send': {
              if (!command) return err('command required for send action');
              const result = await $session.call('send', telnetSessionId, command);
              return ok(result);
            }

            case 'getLog': {
              const result = await $session.call('getLog', telnetSessionId, lines);
              return ok(result);
            }

            case 'getStatus': {
              const result = await $session.call('getStatus', telnetSessionId);
              return ok(result);
            }

            case 'addKey': {
              if (!key) return err('key required for addKey action');
              const result = await $session.call('addKey', telnetSessionId, key);
              return ok(result);
            }

            case 'listKeys': {
              const result = await $session.call('listKeys', telnetSessionId);
              return ok(result);
            }

            case 'removeKey': {
              if (!keyId) return err('keyId required for removeKey action');
              const result = await $session.call('removeKey', telnetSessionId, keyId);
              return ok(result);
            }

            default:
              return err(`Unknown action: ${action}`);
          }
        } catch (error) {
          return err(`Error: ${error instanceof Error ? error.message : String(error)}`);
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
  console.log(`🔌 Session MCP server ready on port ${server.getPort()}`);
  return server;
}
