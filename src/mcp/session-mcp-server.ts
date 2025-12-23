/**
 * Session MCP Server for Malice MOO
 *
 * Dedicated MCP server for telnet session management.
 * Provides a consolidated 'session' tool with actions for connecting,
 * sending commands, and managing telnet sessions to the MOO.
 *
 * Port: 3003
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { z } from 'zod';
import { MCPTelnetClient } from './telnet-client.js';

interface SessionMCPServerConfig {
  port?: number;
  host?: string;
  telnetHost?: string;
  telnetPort?: number;
}

interface SessionState {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
}

export class SessionMCPServer {
  private httpServer: ReturnType<typeof createServer> | null = null;
  private sessions = new Map<string, SessionState>();
  private telnetClient: MCPTelnetClient;
  private port: number;
  private host: string;

  constructor(config: SessionMCPServerConfig = {}) {
    this.port = config.port ?? 3003;
    this.host = config.host ?? '127.0.0.1';
    this.telnetClient = new MCPTelnetClient(
      config.telnetHost ?? 'localhost',
      config.telnetPort ?? 5555
    );
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
        const newSession = this.createSession();
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
    for (const [, session] of this.sessions) {
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

  private createSession(): SessionState {
    const server = new McpServer({
      name: 'malice-session',
      version: '1.0.0',
    });

    this.registerTools(server);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => `mcp-${Date.now()}`,
    });

    server.connect(transport).catch(console.error);

    return { server, transport };
  }

  getPort(): number {
    return this.port;
  }

  private registerTools(server: McpServer): void {
    server.tool(
      'session',
      `Consolidated telnet session management tool.

ACTIONS:
  connect   - Connect to the MOO via telnet. Returns sessionId and welcome message.
  send      - Send a command to a session (sessionId, command). Returns output.
  log       - Get session log (sessionId, lines?). Returns recent output history.
  list      - List all active telnet sessions.
  close     - Close a telnet session (sessionId).
  status    - Get session status (sessionId). Returns connected/closed state.

SSH KEY MANAGEMENT (requires authenticated session):
  addkey    - Add SSH public key to your account (sessionId, key).
  listkeys  - List your registered SSH keys (sessionId).
  removekey - Remove an SSH key from your account (sessionId, keyId).
              keyId can be key number (1, 2, 3) or fingerprint.`,
      {
        action: z.string().describe('Action: connect, send, log, list, close, status, addkey, listkeys, removekey'),
        sessionId: z.string().optional().describe('Session ID (required for send, log, close, status, and key actions)'),
        command: z.string().optional().describe('Command to send (required for send action)'),
        lines: z.number().optional().describe('Number of log lines to return (default: all, max 1000)'),
        key: z.string().optional().describe('SSH public key (required for addkey action)'),
        keyId: z.string().optional().describe('Key number or fingerprint (required for removekey action)'),
      },
      async ({ action, sessionId, command, lines, key, keyId }) => {
        const ok = (data: unknown) => ({
          content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
        });
        const err = (msg: string) => ({
          content: [{ type: 'text' as const, text: msg }],
          isError: true,
        });

        try {
          switch (action) {
            case 'connect': {
              const result = await this.telnetClient.connect(undefined);
              return ok({
                sessionId: result.sessionId,
                output: result.output,
                message: 'Connected to MOO. Use this sessionId for subsequent commands.',
              });
            }

            case 'send': {
              if (!sessionId) return err('sessionId required for send action');
              if (!command) return err('command required for send action');
              const result = await this.telnetClient.send(sessionId, command);
              return ok(result);
            }

            case 'log': {
              if (!sessionId) return err('sessionId required for log action');
              const log = this.telnetClient.getLog(sessionId, lines);
              const status = this.telnetClient.getStatus(sessionId);
              return ok({ ...status, log });
            }

            case 'list': {
              const sessions = this.telnetClient.listSessions();
              return ok({ sessions, count: sessions.length });
            }

            case 'close': {
              if (!sessionId) return err('sessionId required for close action');
              this.telnetClient.close(sessionId);
              return ok({ message: `Session ${sessionId} closed` });
            }

            case 'status': {
              if (!sessionId) return err('sessionId required for status action');
              const status = this.telnetClient.getStatus(sessionId);
              return ok(status);
            }

            // SSH Key Management Actions
            case 'addkey': {
              if (!sessionId) return err('sessionId required for addkey action');
              if (!key) return err('key required for addkey action');
              // Send the addkey command through the telnet session
              const result = await this.telnetClient.send(sessionId, `addkey ${key}`);
              return ok({ output: result.output, closed: result.closed });
            }

            case 'listkeys': {
              if (!sessionId) return err('sessionId required for listkeys action');
              const result = await this.telnetClient.send(sessionId, 'listkeys');
              return ok({ output: result.output, closed: result.closed });
            }

            case 'removekey': {
              if (!sessionId) return err('sessionId required for removekey action');
              if (!keyId) return err('keyId required for removekey action');
              const result = await this.telnetClient.send(sessionId, `removekey ${keyId}`);
              return ok({ output: result.output, closed: result.closed });
            }

            default:
              return err(`Unknown action: ${action}. Valid: connect, send, log, list, close, status, addkey, listkeys, removekey`);
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
  config: SessionMCPServerConfig = {}
): Promise<SessionMCPServer> {
  const server = new SessionMCPServer(config);
  await server.start();
  console.log(`🔌 Session MCP server ready on port ${server.getPort()}`);
  return server;
}
