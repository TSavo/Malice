import { createServer, Server as NetServer, Socket } from 'net';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TelnetTransport } from './telnet-transport.js';
import type { TransportServerConfig } from '../../../types/transport.js';

/**
 * Telnet server
 * Creates TelnetTransport instances for incoming connections
 */
export class TelnetServer {
  private server: NetServer;
  private readonly destroyed$ = new Subject<void>();

  /** Observable stream of new connections */
  public readonly connection$ = new Subject<TelnetTransport>();

  /** Observable stream of errors */
  public readonly error$ = new Subject<Error>();

  constructor(private config: TransportServerConfig) {
    this.server = createServer((socket) => this.handleConnection(socket));
    this.setupEventHandlers();
  }

  /**
   * Set up server event handlers
   */
  private setupEventHandlers(): void {
    const error$ = fromEvent<Error>(this.server, 'error');
    const listening$ = fromEvent(this.server, 'listening');

    // Propagate errors
    error$.pipe(takeUntil(this.destroyed$)).subscribe({
      next: (err) => {
        if (this.config.debug) {
          console.error('[TelnetServer] Error:', err);
        }
        this.error$.next(err);
      },
    });

    // Log when listening
    listening$.pipe(takeUntil(this.destroyed$)).subscribe({
      next: () => {
        if (this.config.debug) {
          console.log(`[TelnetServer] Listening on ${this.config.host || '0.0.0.0'}:${this.config.port}`);
        }
      },
    });
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: Socket): void {
    if (this.config.debug) {
      console.log(`[TelnetServer] New connection from ${socket.remoteAddress}:${socket.remotePort}`);
    }

    const transport = new TelnetTransport(socket);

    // Emit the new transport
    this.connection$.next(transport);

    // Log when closed
    if (this.config.debug) {
      transport.closed$.subscribe(() => {
        console.log(`[TelnetServer] Connection closed: ${transport.remoteAddress}`);
      });
    }
  }

  /**
   * Start listening for connections
   */
  listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(this.config.port, this.config.host || '0.0.0.0', () => {
        this.server.removeListener('error', reject);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.destroyed$.next();
      this.destroyed$.complete();
      this.connection$.complete();
      this.error$.complete();

      this.server.close(() => {
        if (this.config.debug) {
          console.log('[TelnetServer] Server closed');
        }
        resolve();
      });
    });
  }

  /**
   * Get server address info
   */
  address(): { port: number; address: string; family: string } | null {
    const addr = this.server.address();
    if (!addr || typeof addr === 'string') return null;
    return addr;
  }
}
