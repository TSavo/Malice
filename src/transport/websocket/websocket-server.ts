import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { Subject } from 'rxjs';
import { IncomingMessage } from 'http';
import { WebSocketTransport } from './websocket-transport.js';
import type { TransportServerConfig } from '../../../types/transport.js';
import type { AuthInfo } from '../../../types/auth.js';
import { Connection } from '../../connection/connection.js';

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
        console.log(`[WebSocketServer] Listening on ${this.config.host || '0.0.0.0'}:${this.config.port}`);
      }
    });
  }

  /**
   * Handle new WebSocket connection
   * Extracts HTTP Basic Auth from headers if present
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const remoteAddress = req.socket.remoteAddress || 'unknown';

    if (this.config.debug) {
      console.log(`[WebSocketServer] New connection from ${remoteAddress}`);
    }

    // Extract HTTP Basic Auth if present
    let authInfo: AuthInfo | null = null;
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
            protocol: 'websocket',
          },
        };

        if (this.config.debug) {
          console.log(`[WebSocketServer] HTTP Basic Auth detected for user: ${username}`);
        }
      }
    }

    // Create transport and connection
    const transport = new WebSocketTransport(ws, remoteAddress);
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
