/**
 * Session MCP Server for Malice MOO
 *
 * First-class mux transport exposing multiplexed channels via MCP tools.
 * Supports both guest (unauthenticated) and authenticated sessions.
 *
 * Authentication flow:
 * - Guests can connect without credentials and use register/auth tools
 * - HTTP Basic Auth is a bypass that auto-authenticates on connect
 * - Session tools (send/receive/status) require authentication
 *
 * Architecture:
 * - Creates PollingMuxTransport for each session
 * - Authenticated players appear online and receive broadcasts
 * - Channels: game (text I/O), state (structured), ctrl (control), custom
 * - Tools: register, auth, send, receive, status
 */

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Subject } from 'rxjs';
import { z } from 'zod';
import type { AuthInfo } from '../../types/auth.js';
import type { ObjId, RuntimeObject } from '../../types/object.js';
import { Connection } from '../connection/connection.js';
import type { ObjectManager } from '../database/object-manager.js';
import { ConnectionContext } from '../game/connection-context.js';
import {
  type MuxMessage,
  PollingMuxTransport,
} from '../transport/polling/index.js';

export interface SessionMCPServerConfig {
  port?: number;
  host?: string;
  factionId?: number;
  factionName?: string;
}

interface SessionState {
  mcpServer: McpServer;
  mcpTransport: StreamableHTTPServerTransport;
  muxTransport: PollingMuxTransport | null;
  connection: Connection | null;
  context: ConnectionContext | null;
  playerId: ObjId | null;
  playerName: string | null;
  sessionId: string;
}

export class SessionMCPServer {
  private httpServer: ReturnType<typeof createServer> | null = null;
  private sessions = new Map<string, SessionState>();
  private port: number;
  private host: string;
  private factionId?: number;
  private factionName?: string;

  /** Emits Connection objects for integration with FactionBundle */
  public readonly connection$ = new Subject<Connection>();

  constructor(
    private manager: ObjectManager,
    config: SessionMCPServerConfig = {},
  ) {
    this.port = config.port ?? 3012;
    this.host = config.host ?? '127.0.0.1';
    this.factionId = config.factionId;
    this.factionName = config.factionName;
  }

  /**
   * Parse HTTP Basic Auth header
   */
  private parseBasicAuth(
    authHeader: string | undefined,
  ): { username: string; password: string } | null {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return null;
    }

    try {
      const base64 = authHeader.slice(6);
      const decoded = Buffer.from(base64, 'base64').toString('utf-8');
      const [username, password] = decoded.split(':');
      if (!username || password === undefined) {
        return null;
      }
      return { username: username.toLowerCase(), password };
    } catch {
      return null;
    }
  }

  /**
   * Find player by username
   */
  private async findPlayer(username: string): Promise<RuntimeObject | null> {
    // Load player and admin TYPES (not object aliases)
    const playerType = this.manager.getTypeSync('player');
    const adminType = this.manager.getTypeSync('admin');

    if (!playerType) return null;

    const playerPrototypeId = playerType.id;
    const adminPrototypeId = adminType?.id;

    // Helper to extract value from typed Value or raw value
    const getValue = (v: unknown): unknown => {
      if (v && typeof v === 'object' && 'type' in v && 'value' in v) {
        return (v as { type: unknown; value: unknown }).value;
      }
      return v;
    };

    // Find player by playername
    const users = await this.manager.db.listAll();
    const userDoc = users.find((u) => {
      const parentId = u.parent.id;
      return (
        (parentId === playerPrototypeId || parentId === adminPrototypeId) &&
        getValue(u.properties.playername) === username
      );
    });

    if (!userDoc) return null;

    return this.manager.load(userDoc._id);
  }

  /**
   * Validate credentials and return player
   */
  private async validateCredentials(
    username: string,
    password: string,
  ): Promise<RuntimeObject | null> {
    const player = await this.findPlayer(username);
    if (!player) return null;

    // Check if suspended
    if (player.get('isSuspended')) return null;

    // Verify password
    const valid = await player.call('checkPassword', password);
    if (!valid) return null;

    return player;
  }

  async start(): Promise<void> {
    this.httpServer = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET, POST, DELETE, OPTIONS',
        );
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, mcp-session-id, Authorization',
        );
        res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        // DELETE = close session
        if (req.method === 'DELETE' && sessionId) {
          const session = this.sessions.get(sessionId);
          if (session) {
            // Disconnect player if authenticated
            if (session.playerId) {
              try {
                const player = await this.manager.load(session.playerId);
                if (player) {
                  await player.call('disconnect');
                }
              } catch (err) {
                console.error('[SessionMCP] Error disconnecting player:', err);
              }
            }

            // Close transports
            session.muxTransport?.close();
            await session.mcpTransport.close();
            this.sessions.delete(sessionId);
          }
          res.writeHead(200);
          res.end();
          return;
        }

        // Existing session
        if (sessionId && this.sessions.has(sessionId)) {
          const session = this.sessions.get(sessionId)!;
          await session.mcpTransport.handleRequest(req, res);
          return;
        }

        // New session - check for optional HTTP Basic Auth
        const auth = this.parseBasicAuth(req.headers.authorization);
        let player: RuntimeObject | null = null;

        // If auth provided, validate it (but don't require it)
        if (auth) {
          player = await this.validateCredentials(auth.username, auth.password);
          if (!player) {
            // Invalid credentials - reject
            res.setHeader('WWW-Authenticate', 'Basic realm="Malice MOO"');
            res.writeHead(401);
            res.end(JSON.stringify({ error: 'Invalid credentials' }));
            return;
          }
        }

        try {
          // Read request body
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = Buffer.concat(chunks).toString();
          const message = body ? JSON.parse(body) : null;

          // Create session (authenticated or guest)
          const mcpSessionId = `mcp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const sessionState = await this.createSession(
            mcpSessionId,
            player,
            auth,
          );

          // Create MCP server and transport
          const mcpServer = new McpServer({
            name: 'malice-session',
            version: '2.0.0',
          });
          this.registerTools(mcpServer, sessionState);

          const mcpTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => mcpSessionId,
            onsessioninitialized: (newId) => {
              sessionState.mcpServer = mcpServer;
              sessionState.mcpTransport = mcpTransport;
              this.sessions.set(newId, sessionState);
              const who = player
                ? `${auth?.username} (authenticated)`
                : 'guest';
              console.log(`[SessionMCP] Session initialized: ${newId} for ${who}`);
            },
          });

          await mcpServer.connect(mcpTransport);

          // Handle request (auto-init if needed)
          if (message && message.method !== 'initialize') {
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

            const fakeRes = {
              writeHead: () => {},
              end: () => {},
              setHeader: () => {},
              write: () => true,
              on: () => {},
              off: () => {},
              destroy: () => {},
              writable: true,
              finished: false,
            } as unknown as ServerResponse;

            await mcpTransport.handleRequest(req, fakeRes, initMessage);
            res.setHeader('mcp-session-id', mcpSessionId);
            await mcpTransport.handleRequest(req, res, message);
          } else {
            await mcpTransport.handleRequest(req, res, message);
          }
        } catch (err) {
          console.error('[SessionMCP] Error creating session:', err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: String(err) }));
        }
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

  /**
   * Create a new session (authenticated or guest)
   */
  private async createSession(
    sessionId: string,
    player: RuntimeObject | null,
    auth: { username: string; password: string } | null,
  ): Promise<SessionState> {
    if (player && auth) {
      // Authenticated session
      const muxTransport = new PollingMuxTransport(`mcp:${auth.username}`);

      const authInfo: AuthInfo = {
        mode: 'http-basic',
        httpBasic: { username: auth.username, password: auth.password },
        metadata: {
          protocol: 'mcp-session',
          factionId: this.factionId,
          factionName: this.factionName,
        },
      };
      const connection = new Connection(muxTransport, authInfo);
      const context = new ConnectionContext(connection, this.manager);

      context.authenticate(player.id);
      await player.call('connect', context);

      // Note: Do NOT emit to connection$ here!
      // Session MCP handles authentication internally via player.call('connect').

      const playerId = player.id;
      const playerName = (player.get('playername') as string) || auth.username;

      console.log(
        `[SessionMCP] Player ${playerName} (#${playerId}) connected via MCP`,
      );

      return {
        mcpServer: null as unknown as McpServer,
        mcpTransport: null as unknown as StreamableHTTPServerTransport,
        muxTransport,
        connection,
        context,
        playerId,
        playerName,
        sessionId,
      };
    } else {
      // Guest session - no transport until authenticated
      console.log(`[SessionMCP] Guest session created: ${sessionId}`);

      return {
        mcpServer: null as unknown as McpServer,
        mcpTransport: null as unknown as StreamableHTTPServerTransport,
        muxTransport: null,
        connection: null,
        context: null,
        playerId: null,
        playerName: null,
        sessionId,
      };
    }
  }

  /**
   * Authenticate a guest session
   */
  private async authenticateSession(
    session: SessionState,
    player: RuntimeObject,
    username: string,
    password: string,
  ): Promise<void> {
    // Create mux transport
    const muxTransport = new PollingMuxTransport(`mcp:${username}`);

    // Create connection with auth info
    const authInfo: AuthInfo = {
      mode: 'mcp-auth',
      httpBasic: { username, password },
      metadata: {
        protocol: 'mcp-session',
        factionId: this.factionId,
        factionName: this.factionName,
      },
    };
    const connection = new Connection(muxTransport, authInfo);
    const context = new ConnectionContext(connection, this.manager);

    context.authenticate(player.id);
    await player.call('connect', context);

    // Note: Do NOT emit to connection$ here!
    // Session MCP handles authentication internally via player.call('connect').
    // Emitting to connection$ would trigger System.onConnection -> preAuthHandler
    // which doesn't recognize 'mcp-auth' mode and would close the connection.

    // Update session state
    session.muxTransport = muxTransport;
    session.connection = connection;
    session.context = context;
    session.playerId = player.id;
    session.playerName = (player.get('playername') as string) || username;
    session.player = player;

    console.log(
      `[SessionMCP] Guest upgraded: ${session.playerName} (#${session.playerId})`,
    );
  }

  /**
   * Register MCP tools
   */
  private registerTools(server: McpServer, session: SessionState): void {
    const ok = (data: unknown) => ({
      content: [
        {
          type: 'text' as const,
          text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
        },
      ],
    });
    const err = (msg: string) => ({
      content: [
        { type: 'text' as const, text: JSON.stringify({ error: msg }) },
      ],
      isError: true,
    });
    const requireAuth = () => {
      if (!session.playerId) {
        return err('Not authenticated. Use the auth tool first.');
      }
      return null;
    };

    // Register tool - create a new account
    server.tool(
      'register',
      `Create a new player account for this faction.

PARAMETERS:
  username - Desired username (lowercase, alphanumeric)
  password - Password (min 6 characters)
  email    - Email address for verification

RETURNS:
  success  - Whether registration succeeded
  message  - Status message

NOTE: After registering, use the auth tool to log in.`,
      {
        username: z.string().min(3).max(20).describe('Desired username'),
        password: z.string().min(6).describe('Password'),
        email: z.string().email().describe('Email address'),
      },
      async ({ username, password, email }) => {
        try {
          // Check if already authenticated
          if (session.playerId) {
            return err('Already authenticated. Cannot register while logged in.');
          }

          // Normalize username
          const normalizedUsername = username.toLowerCase().trim();

          // Check if username exists
          const existing = await this.findPlayer(normalizedUsername);
          if (existing) {
            return err('Username already taken.');
          }

          // Get faction's charGen
          if (!this.factionId) {
            return err('No faction configured for this session.');
          }

          const faction = await this.manager.load(this.factionId);
          if (!faction) {
            return err('Faction not found.');
          }

          const charGenId = faction.get('charGen') as number | null;
          if (!charGenId) {
            return err('Faction has no character generation configured.');
          }

          const charGen = await this.manager.load(charGenId);
          if (!charGen) {
            return err('Character generation system not found.');
          }

          // Create player via charGen
          const result = await charGen.call('createPlayer', {
            username: normalizedUsername,
            password,
            email,
            factionId: this.factionId,
          });

          if (!result || !result.success) {
            return err(result?.error || 'Failed to create account.');
          }

          return ok({
            success: true,
            message: `Account created for ${normalizedUsername}. Check your email for verification, then use auth to log in.`,
            playerId: result.playerId,
          });
        } catch (error) {
          return err(
            `Registration error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );

    // Auth tool - authenticate within session
    server.tool(
      'auth',
      `Authenticate with username and password.

PARAMETERS:
  username - Your username
  password - Your password

RETURNS:
  success    - Whether authentication succeeded
  playerId   - Your player object ID
  playerName - Your character name

After successful auth, you can use send/receive/status tools.`,
      {
        username: z.string().describe('Username'),
        password: z.string().describe('Password'),
      },
      async ({ username, password }) => {
        try {
          // Check if already authenticated
          if (session.playerId) {
            return ok({
              success: true,
              message: 'Already authenticated.',
              playerId: session.playerId,
              playerName: session.playerName,
            });
          }

          // Validate credentials
          const player = await this.validateCredentials(
            username.toLowerCase(),
            password,
          );
          if (!player) {
            return err('Invalid username or password.');
          }

          // Check email verification
          if (!player.get('emailVerified')) {
            return err('Email not verified. Check your inbox for verification link.');
          }

          // Upgrade session to authenticated
          await this.authenticateSession(session, player, username, password);

          return ok({
            success: true,
            playerId: session.playerId,
            playerName: session.playerName,
            message: 'Authenticated successfully. You can now use send/receive/status.',
          });
        } catch (error) {
          return err(
            `Auth error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );

    // Send tool - send to any channel (requires auth)
    server.tool(
      'send',
      `Send a message to a channel. Requires authentication.

CHANNELS:
  game  - Game commands and text (default)
  state - Structured state updates
  ctrl  - Control messages (resize, etc.)
  custom:* - Custom channels

EXAMPLES:
  send(payload="look")                          # Send game command
  send(channel="ctrl", payload={type:"resize",w:80,h:24})
  send(channel="custom:debug", payload={trace:true})`,
      {
        channel: z.string().optional().describe('Channel name (default: game)'),
        payload: z
          .union([z.string(), z.object({}).passthrough()])
          .describe('Message payload (string for game, object for others)'),
      },
      async ({ channel = 'game', payload }) => {
        const authErr = requireAuth();
        if (authErr) return authErr;

        try {
          session.muxTransport!.receiveOnChannel(channel, payload);

          // For game channel, wait for AI to finish (narrator or chargen)
          if (channel === 'game' && session.player) {
            // Check if in chargen or normal play
            const inChargen = session.player.get('chargenInProgress');

            // Yield to allow message processing to start (mutex acquire, etc.)
            await new Promise((r) => setImmediate(r));

            if (inChargen) {
              // Wait for chargen AI to complete
              await session.player.call('awaitChargen', 60000);
            } else {
              // Wait for narrator to complete
              await session.player.call('awaitNarrator', 60000);
            }

            // Drain messages accumulated during AI processing
            const messages = session.muxTransport!.drain();

            return ok({
              sent: true,
              channel,
              messages: messages.map((m) => ({
                ch: m.ch,
                t: m.t,
                p: m.p,
                ts: m.ts,
              })),
            });
          }

          return ok({ sent: true, channel });
        } catch (error) {
          return err(
            `Send error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );

    // Receive tool - drain buffered messages (requires auth)
    server.tool(
      'receive',
      `Get accumulated messages from all channels. Requires authentication.

Returns buffered messages since last receive call.
Messages are in format: {ch, t, p, ts}

OPTIONS:
  channels - Filter to specific channels (default: all)
  limit    - Max messages to return (default: all)

EXAMPLES:
  receive()                           # Get all messages
  receive(channels=["game","state"])  # Only game and state
  receive(limit=50)                   # Max 50 messages`,
      {
        channels: z
          .array(z.string())
          .optional()
          .describe('Filter to specific channels'),
        limit: z.number().optional().describe('Max messages to return'),
      },
      async ({ channels, limit }) => {
        const authErr = requireAuth();
        if (authErr) return authErr;

        try {
          let messages: MuxMessage[];

          if (channels && channels.length > 0) {
            messages = session.muxTransport!.drainChannels(channels);
          } else {
            messages = session.muxTransport!.drain();
          }

          if (limit && limit > 0 && messages.length > limit) {
            // Keep oldest messages in buffer (re-add them)
            const extra = messages.slice(0, messages.length - limit);
            for (const msg of extra) {
              session.muxTransport!.sendToChannel(msg.ch, msg.p);
            }
            messages = messages.slice(-limit);
          }

          return ok({
            messages: messages.map((m) => ({
              ch: m.ch,
              t: m.t,
              p: m.p,
              ts: m.ts,
            })),
            connected: true,
            buffered: session.muxTransport!.bufferedCount,
          });
        } catch (error) {
          return err(
            `Receive error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );

    // Status tool - connection and player info (requires auth)
    server.tool(
      'status',
      `Get connection and player status. Requires authentication.

Returns:
  connected  - Whether connected
  playerId   - Player object ID
  playerName - Player name
  location   - Current location info
  buffered   - Messages waiting in buffer`,
      {},
      async () => {
        const authErr = requireAuth();
        if (authErr) return authErr;

        try {
          const player = await this.manager.load(session.playerId!);
          let location = null;

          if (player) {
            const loc = player.get('location') as RuntimeObject | null;
            if (loc) {
              location = {
                id: loc.id,
                name: loc.get('name') as string,
              };
            }
          }

          return ok({
            connected: !session.muxTransport!.mux.isDestroyed,
            playerId: session.playerId,
            playerName: session.playerName,
            location,
            buffered: session.muxTransport!.bufferedCount,
          });
        } catch (error) {
          return err(
            `Status error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );

    // Whoami tool - check auth status (works for guests too)
    server.tool(
      'whoami',
      `Check current authentication status.

Returns auth state - works for both guests and authenticated users.`,
      {},
      async () => {
        if (session.playerId) {
          return ok({
            authenticated: true,
            playerId: session.playerId,
            playerName: session.playerName,
            faction: this.factionName || 'unknown',
          });
        } else {
          return ok({
            authenticated: false,
            message: 'Guest session. Use register or auth to authenticate.',
            faction: this.factionName || 'unknown',
          });
        }
      },
    );
  }

  async stop(): Promise<void> {
    // Disconnect all players
    for (const [_id, session] of this.sessions) {
      if (session.playerId) {
        try {
          const player = await this.manager.load(session.playerId);
          if (player) {
            await player.call('disconnect');
          }
        } catch (err) {
          console.error('[SessionMCP] Error disconnecting player:', err);
        }
      }

      session.muxTransport?.close();
      await session.mcpTransport.close();
    }
    this.sessions.clear();

    // Complete connection stream
    this.connection$.complete();

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
