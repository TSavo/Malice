import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebSocketTransport } from './websocket-transport.js';
import type { TransportServerConfig } from '../../../types/transport.js';

/**
 * WebSocket server
 * Creates WebSocketTransport instances for incoming connections
 */
export class WebSocketServer {
  private server: WSServer;
  private readonly destroyed$ = new Subject<void>();

  /** Observable stream of new connections */
  public readonly connection$ = new Subject<WebSocketTransport>();

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
    const connection$ = fromEvent<WebSocket>(this.server, 'connection');
    const error$ = fromEvent<Error>(this.server, 'error');
    const listening$ = fromEvent(this.server, 'listening');

    // Handle new connections
    connection$.pipe(takeUntil(this.destroyed$)).subscribe((ws) => {
      this.handleConnection(ws);
    });

    // Propagate errors
    error$.pipe(takeUntil(this.destroyed$)).subscribe({
      next: (err) => {
        if (this.config.debug) {
          console.error('[WebSocketServer] Error:', err);
        }
        this.error$.next(err);
      },
    });

    // Log when listening
    listening$.pipe(takeUntil(this.destroyed$)).subscribe({
      next: () => {
        if (this.config.debug) {
          console.log(`[WebSocketServer] Listening on ${this.config.host || '0.0.0.0'}:${this.config.port}`);
        }
      },
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    // Extract remote address (not available in basic ws events)
    const remoteAddress = 'websocket-client';

    if (this.config.debug) {
      console.log(`[WebSocketServer] New connection from ${remoteAddress}`);
    }

    const transport = new WebSocketTransport(ws, remoteAddress);

    // Emit the new transport
    this.connection$.next(transport);

    // Log when closed
    if (this.config.debug) {
      transport.closed$.subscribe(() => {
        console.log(`[WebSocketServer] Connection closed: ${transport.remoteAddress}`);
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
