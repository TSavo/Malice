import { type Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import type { WebSocket } from 'ws';
import { BaseTransport } from '../base-transport';
import { ChannelMux } from './channel-mux';
import type { CtrlResize, IChannel, WireCodec } from './types';

/**
 * Multiplexed WebSocket transport
 *
 * Wraps a WebSocket connection with a ChannelMux for multi-channel communication.
 * Provides backward compatibility with the standard transport interface by
 * mapping input$/output$ to the 'game' channel.
 */
export class MultiplexedTransport extends BaseTransport {
  public readonly type = 'websocket-mux' as const;
  public readonly remoteAddress: string;
  public readonly mux: ChannelMux;

  // Window manager channel messages
  private readonly wmSubject: Subject<unknown>;
  public readonly wm$: Observable<unknown>;

  constructor(
    private ws: WebSocket,
    remoteAddr?: string,
    codec?: WireCodec,
  ) {
    super();

    this.remoteAddress = remoteAddr || 'websocket-client';
    this.mux = new ChannelMux(ws, codec);

    // Initialize wm channel observable
    this.wmSubject = new Subject<unknown>();
    this.wm$ = this.wmSubject.asObservable();

    this.initialize();
  }

  /**
   * Initialize the transport
   */
  private initialize(): void {
    // Map game channel input to transport input$
    this.mux.game.input$.pipe(takeUntil(this.closed$)).subscribe({
      next: (data) => this.emitInput(data as string),
      error: (err) => this.emitError(err as Error),
    });

    // Map transport output$ to game channel output
    this.output$.pipe(takeUntil(this.closed$)).subscribe({
      next: (data) => this.mux.game.send(data),
    });

    // Handle control channel messages
    this.mux.ctrl.input$.pipe(takeUntil(this.closed$)).subscribe({
      next: (msg) => this.handleCtrlMessage(msg),
    });

    // Handle window manager channel messages
    this.mux
      .channel('wm')
      .input$.pipe(takeUntil(this.closed$))
      .subscribe({
        next: (msg) => this.wmSubject.next(msg),
      });

    // Handle mux events
    this.mux.events$.pipe(takeUntil(this.closed$)).subscribe({
      next: (event) => {
        if (event.type === 'error' && event.error) {
          this.emitError(event.error);
        }
      },
    });

    // Handle WebSocket close
    this.ws.on('close', () => {
      this.setClosed();
    });

    // Mark as connected
    this.setConnected(true);

    // Multiplexed clients typically use modern terminals
    this.updateCapabilities({
      ansi: true,
      terminalType: 'xterm-256color',
    });
  }

  /**
   * Handle control channel messages
   */
  private handleCtrlMessage(msg: unknown): void {
    if (!msg || typeof msg !== 'object') return;

    const ctrl = msg as { type?: string; [key: string]: unknown };

    switch (ctrl.type) {
      case 'resize': {
        const resize = ctrl as CtrlResize;
        if (typeof resize.w === 'number' && typeof resize.h === 'number') {
          this.updateCapabilities({
            width: resize.w,
            height: resize.h,
          });
        }
        break;
      }

      case 'ready':
        // Client signaling ready state - could trigger state push
        break;

      case 'typing':
        // Client typing indicator - could forward to game logic
        break;
    }
  }

  /**
   * Get a channel by ID
   */
  channel(id: string): IChannel {
    return this.mux.channel(id);
  }

  /**
   * Close the connection gracefully
   */
  close(): void {
    if (!this.connectedSubject.value) return;
    this.mux.destroy();
    this.ws.close(1000, 'Normal closure');
  }

  /**
   * Destroy the connection immediately
   */
  destroy(): void {
    if (!this.connectedSubject.value) return;
    this.mux.destroy();
    this.ws.terminate();
  }

  /**
   * Override cleanup to also destroy mux
   */
  protected cleanup(): void {
    this.mux.destroy();
    super.cleanup();
  }
}
