/**
 * PollingMuxTransport - Transport for polling-based multiplexed connections
 *
 * Unlike MultiplexedTransport which streams via WebSocket, this transport
 * accumulates messages for batch retrieval via drain(). Used by MCP Session
 * transport where clients poll for accumulated messages.
 */

import { takeUntil } from 'rxjs/operators';
import { BaseTransport } from '../base-transport';
import type { CtrlResize, IChannel } from '../multiplexed/types';
import type { MuxMessage } from './polling-mux';
import { PollingMux } from './polling-mux';

/**
 * Polling-based multiplexed transport
 *
 * Provides ITransport interface while accumulating messages across channels.
 * MCP tools call drain() to retrieve accumulated messages.
 */
export class PollingMuxTransport extends BaseTransport {
  public readonly type = 'polling-mux' as const;
  public readonly remoteAddress: string;
  public readonly mux: PollingMux;

  constructor(remoteAddr?: string) {
    super();

    this.remoteAddress = remoteAddr || 'mcp-client';
    this.mux = new PollingMux();

    this.initialize();
  }

  /**
   * Initialize the transport
   */
  private initialize(): void {
    // Map game channel input to transport input$
    // When MCP client sends to game channel, it emits on transport input$
    this.mux.game.input$.pipe(takeUntil(this.closed$)).subscribe({
      next: (data) => this.emitInput(data as string),
      error: (err) => this.emitError(err as Error),
    });

    // Map transport output$ to game channel output
    // When game sends text, it goes to the game channel buffer
    this.output$.pipe(takeUntil(this.closed$)).subscribe({
      next: (data) => this.mux.game.send(data),
    });

    // Handle control channel messages
    this.mux.ctrl.input$.pipe(takeUntil(this.closed$)).subscribe({
      next: (msg) => this.handleCtrlMessage(msg),
    });

    // Handle mux events
    this.mux.events$.pipe(takeUntil(this.closed$)).subscribe({
      next: (event) => {
        if (event.type === 'error' && event.error) {
          this.emitError(event.error);
        }
      },
    });

    // Mark as connected
    this.setConnected(true);

    // MCP clients typically have full capability
    this.updateCapabilities({
      ansi: true,
      terminalType: 'mcp',
      width: 120,
      height: 50,
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
        // Client signaling ready state
        break;

      case 'typing':
        // Client typing indicator
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
   * Send to a specific channel (convenience for MCP tools)
   */
  sendToChannel(channelId: string, payload: unknown): void {
    this.mux.send(channelId, payload);
  }

  /**
   * Receive from a specific channel (from MCP client)
   */
  receiveOnChannel(channelId: string, payload: unknown): void {
    this.mux.receive(channelId, payload);
  }

  /**
   * Drain all accumulated messages from all channels
   */
  drain(): MuxMessage[] {
    return this.mux.drainAll();
  }

  /**
   * Drain messages from specific channels only
   */
  drainChannels(channelIds: string[]): MuxMessage[] {
    return this.mux.drainChannels(channelIds);
  }

  /**
   * Get count of buffered messages
   */
  get bufferedCount(): number {
    return this.mux.bufferedCount;
  }

  /**
   * Close the connection gracefully
   */
  close(): void {
    if (!this.connectedSubject.value) return;
    this.setClosed();
  }

  /**
   * Destroy the connection immediately
   */
  destroy(): void {
    if (!this.connectedSubject.value) return;
    this.setClosed();
  }

  /**
   * Override cleanup to also destroy mux
   */
  protected cleanup(): void {
    this.mux.destroy();
    super.cleanup();
  }
}
