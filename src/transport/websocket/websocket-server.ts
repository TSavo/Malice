import type { IncomingMessage } from 'node:http';
import { Subject } from 'rxjs';
import { type WebSocket, WebSocketServer as WSServer } from 'ws';
import type { AuthInfo } from '../../../types/auth.js';
import type { TransportServerConfig } from '../../../types/transport.js';
import { Connection } from '../../connection/connection.js';
import { MultiplexedTransport } from '../multiplexed/multiplexed-transport.js';
import { WebSocketTransport } from './websocket-transport.js';

/**
 * WebSocket server
 * Creates WebSocketTransport instances for incoming connections
 */
export class WebSocketServer {
  private server: WSServer;
  private readonly destroyed$ = new Subject<void>();

  /** Observable stream of new connections (with auth info) */
  public readonly connection$ = new Subject<Connection>();

  /** Observable stream of errors */
  public readonly error$ = new Subject<Error>();

  constructor(private config: TransportServerConfig) {
    this.server = new WSServer({
      host: config.host || '0.0.0.0',
      port: config.port,
    });

    this.setupEventHandlers();
  }

  /**
   * Set up server event handlers
   */
  private setupEventHandlers(): void {
    // ws library emits 'connection' with (socket, request)
    this.server.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    this.server.on('error', (err: Error) => {
      if (this.config.debug) {
        console.error('[WebSocketServer] Error:', err);
      }
      this.error$.next(err);
    });

    this.server.on('listening', () => {
      if (this.config.debug) {
        console.log(
          `[WebSocketServer] Listening on ${this.config.host || '0.0.0.0'}:${this.config.port}`,
        );
      }
    });
  }

  /**
   * Handle new WebSocket connection
   * Extracts HTTP Basic Auth from headers if present
   * Extracts token from URL query params if present
   * Routes to MultiplexedTransport for /ws/mux paths
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const remoteAddress = req.socket.remoteAddress || 'unknown';
    const url = req.url || '/';
    const isMultiplexed = url.startsWith('/mux') || url.startsWith('/ws/mux');

    if (this.config.debug) {
      console.log(
        `[WebSocketServer] New ${isMultiplexed ? 'multiplexed ' : ''}connection from ${remoteAddress} (${url})`,
      );
    }

    // Extract auth info from various sources
    let authInfo: AuthInfo | null = null;

    // Check for token and mode in URL query params
    let chargenMode: string | null = null;
    try {
      const urlObj = new URL(url, 'http://localhost');
      const token = urlObj.searchParams.get('token');
      chargenMode = urlObj.searchParams.get('mode'); // 'cartel' for Cartel chargen

      if (token) {
        authInfo = {
          mode: 'token',
          token: { value: token },
          metadata: {
            remoteAddress,
            userAgent: req.headers['user-agent'],
            protocol: isMultiplexed ? 'websocket-mux' : 'websocket',
            chargenMode: chargenMode || undefined,
          },
        };

        if (this.config.debug) {
          console.log(
            `[WebSocketServer] Token auth detected: ${token.substring(0, 8)}...`,
          );
        }
      }
    } catch {
      // URL parsing failed, continue without token
    }

    // Check for HTTP Basic Auth if no token
    if (!authInfo) {
      const authHeader = req.headers.authorization;

      if (authHeader?.startsWith('Basic ')) {
        const base64 = authHeader.substring(6);
        const decoded = Buffer.from(base64, 'base64').toString('utf-8');
        const [username, password] = decoded.split(':', 2);

        if (username && password) {
          authInfo = {
            mode: 'http-basic',
            httpBasic: { username, password },
            metadata: {
              remoteAddress,
              userAgent: req.headers['user-agent'],
              protocol: isMultiplexed ? 'websocket-mux' : 'websocket',
              chargenMode: chargenMode || undefined,
            },
          };

          if (this.config.debug) {
            console.log(
              `[WebSocketServer] HTTP Basic Auth detected for user: ${username}`,
            );
          }
        }
      }
    }

    // If we have a chargenMode but no auth info, create minimal auth info to carry it
    if (!authInfo && chargenMode) {
      authInfo = {
        mode: 'custom',
        custom: { type: 'chargen-mode', data: {} },
        metadata: {
          remoteAddress,
          userAgent: req.headers['user-agent'],
          protocol: isMultiplexed ? 'websocket-mux' : 'websocket',
          chargenMode,
        },
      };

      if (this.config.debug) {
        console.log(`[WebSocketServer] ChargenMode detected: ${chargenMode}`);
      }
    }

    // Create transport based on path
    const transport = isMultiplexed
      ? new MultiplexedTransport(ws, remoteAddress)
      : new WebSocketTransport(ws, remoteAddress);

    const connection = new Connection(transport, authInfo);

    // Emit the connection
    this.connection$.next(connection);

    // Log when closed
    if (this.config.debug) {
      transport.closed$.subscribe(() => {
        console.log(`[WebSocketServer] Connection closed: ${connection.id}`);
      });
    }
  }

  /**
   * Close the server
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.destroyed$.next();
      this.destroyed$.complete();
      this.connection$.complete();
      this.error$.complete();

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          if (this.config.debug) {
            console.log('[WebSocketServer] Server closed');
          }
          resolve();
        }
      });
    });
  }

  /**
   * Get server address info
   */
  address(): { port: number; address: string; family?: string } | null {
    const addr = this.server.address();
    if (!addr || typeof addr === 'string') return null;
    return addr;
  }
}
