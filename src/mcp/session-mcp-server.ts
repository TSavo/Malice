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

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import type { RuntimeObject } from '../../types/object.js';
import type { ObjectManager } from '../database/object-manager.js';

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
    config: SessionMCPServerConfig = {},
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
    this.httpServer = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        console.log(`[SessionMCP] ${req.method} ${req.url} sessionId=${req.headers['mcp-session-id'] || 'none'}`);

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET, POST, DELETE, OPTIONS',
        );
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, mcp-session-id',
        );
        res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

        if (req.method === 'OPTIONS') {
          console.log('[SessionMCP] OPTIONS preflight');
          res.writeHead(204);
          res.end();
          return;
        }

        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        // DELETE = close session
        if (req.method === 'DELETE' && sessionId) {
          console.log(`[SessionMCP] DELETE session ${sessionId}`);
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
          console.log('[SessionMCP] Creating new session...');
          try {
            // Read the request body to check if it's an initialize request
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const body = Buffer.concat(chunks).toString();
            const message = body ? JSON.parse(body) : null;

            // Create telnet session and MCP server
            const $session = this.getSession();
            if (!$session) {
              throw new Error('$.session not bootstrapped');
            }
            const telnetResult = (await $session.call('connect')) as {
              sessionId: string;
              output: string;
            };
            const telnetSessionId = telnetResult.sessionId;

            // Generate session ID upfront so we can pass it to registerTools
            const mcpSessionId = `mcp-${Date.now()}`;

            const server = new McpServer({
              name: 'malice-session',
              version: '2.0.0',
            });
            this.registerTools(server, mcpSessionId, telnetSessionId);

            // Create transport with callback to capture the session ID
            let capturedSessionId: string | null = null;
            const transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: () => mcpSessionId,
              onsessioninitialized: (newId) => {
                capturedSessionId = newId;
                this.sessions.set(newId, { server, transport, telnetSessionId });
                console.log(`[SessionMCP] Session initialized: ${newId}`);
              },
            });

            await server.connect(transport);

            // If not an initialize request, auto-initialize first
            if (message && message.method !== 'initialize') {
              console.log('[SessionMCP] Auto-initializing session...');
              const initMessage = {
                jsonrpc: '2.0',
                id: 0,
                method: 'initialize',
                params: {
                  protocolVersion: '2024-11-05',
                  capabilities: {},
                  clientInfo: { name: 'auto-init', version: '1.0.0' },
                },
              };

              // Create a fake response to absorb the initialize response
              const fakeRes = {
                writeHead: () => {},
                end: () => {},
                setHeader: () => {},
                write: () => true,
                on: () => {},
              } as unknown as ServerResponse;

              await transport.handleRequest(req, fakeRes, initMessage);

              // Set the session ID header that the transport generated
              if (capturedSessionId) {
                res.setHeader('mcp-session-id', capturedSessionId);
              }

              // Now handle the actual request
              await transport.handleRequest(req, res, message);
            } else {
              // It's an initialize request, handle normally
              await transport.handleRequest(req, res, message);
            }
          } catch (err) {
            console.error('[SessionMCP] Error creating session:', err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // Existing session
        console.log(`[SessionMCP] Using existing session ${sessionId}`);
        const session = this.sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res);
      },
    );

    return new Promise((resolve) => {
      this.httpServer?.listen(this.port, this.host, () => {
        console.log(
          `[SessionMCP] Server listening on http://${this.host}:${this.port}`,
        );
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
        this.httpServer?.close(() => {
          this.httpServer = null;
          console.log('[SessionMCP] Server stopped');
          resolve();
        });
      });
    }
  }

  getPort(): number {
    return this.port;
  }

  private registerTools(server: McpServer, mcpSessionId: string, initialTelnetSessionId: string): void {
    // Store telnetSessionId in a mutable wrapper so reconnect can update it
    const sessionRef = { telnetSessionId: initialTelnetSessionId };

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
        action: z
          .enum([
            'send',
            'getLog',
            'getStatus',
            'addKey',
            'listKeys',
            'removeKey',
          ])
          .describe('Action to perform'),
        command: z
          .string()
          .optional()
          .describe('Command to send (required for send action)'),
        lines: z
          .number()
          .optional()
          .describe('Number of log lines to return (default: all, max 1000)'),
        key: z
          .string()
          .optional()
          .describe('SSH public key (required for addKey action)'),
        keyId: z
          .string()
          .optional()
          .describe(
            'Key number or fingerprint (required for removeKey action)',
          ),
      },
      async ({ action, command, lines, key, keyId }) => {
        const $session = this.getSession();
        if (!$session) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: '$.session not bootstrapped' }),
              },
            ],
            isError: true,
          };
        }

        const ok = (data: unknown) => ({
          content: [
            {
              type: 'text' as const,
              text:
                typeof data === 'string' ? data : JSON.stringify(data, null, 2),
            },
          ],
        });
        const err = (msg: string) => ({
          content: [
            { type: 'text' as const, text: JSON.stringify({ error: msg }) },
          ],
          isError: true,
        });

        try {
          // Check if session is closed and auto-reconnect on send
          const status = await $session.call('getStatus', sessionRef.telnetSessionId) as { closed?: boolean };
          if (status?.closed && action === 'send') {
            // Auto-reconnect
            const telnetResult = (await $session.call('connect')) as {
              sessionId: string;
              output: string;
            };
            sessionRef.telnetSessionId = telnetResult.sessionId;
            // Update the session state
            const mcpSession = this.sessions.get(mcpSessionId);
            if (mcpSession) {
              mcpSession.telnetSessionId = sessionRef.telnetSessionId;
            }
          }

          switch (action) {
            case 'send': {
              if (!command) return err('command required for send action');
              const result = await $session.call(
                'send',
                sessionRef.telnetSessionId,
                command,
              );
              return ok(result);
            }

            case 'getLog': {
              const result = await $session.call(
                'getLog',
                sessionRef.telnetSessionId,
                lines,
              );
              return ok(result);
            }

            case 'getStatus': {
              const result = await $session.call('getStatus', sessionRef.telnetSessionId);
              return ok(result);
            }

            case 'addKey': {
              if (!key) return err('key required for addKey action');
              const result = await $session.call(
                'addKey',
                sessionRef.telnetSessionId,
                key,
              );
              return ok(result);
            }

            case 'listKeys': {
              const result = await $session.call('listKeys', sessionRef.telnetSessionId);
              return ok(result);
            }

            case 'removeKey': {
              if (!keyId) return err('keyId required for removeKey action');
              const result = await $session.call(
                'removeKey',
                sessionRef.telnetSessionId,
                keyId,
              );
              return ok(result);
            }

            default:
              return err(`Unknown action: ${action}`);
          }
        } catch (error) {
          return err(
            `Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );
  }
}

/**
 * Create and start a Session MCP server
 */
export async function createSessionMCPServer(
  manager: ObjectManager,
  config: SessionMCPServerConfig = {},
): Promise<SessionMCPServer> {
  const server = new SessionMCPServer(manager, config);
  await server.start();
  console.log(`🔌 Session MCP server ready on port ${server.getPort()}`);
  return server;
}
