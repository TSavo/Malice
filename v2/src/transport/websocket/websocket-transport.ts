import type { WebSocket } from 'ws';
import { fromEvent } from 'rxjs';
import { takeUntil, filter, map } from 'rxjs/operators';
import { BaseTransport } from '../base-transport.js';

/**
 * WebSocket transport implementation
 * Wraps a WebSocket connection with reactive streams
 */
export class WebSocketTransport extends BaseTransport {
  public readonly type = 'websocket' as const;
  public readonly remoteAddress: string;

  constructor(private ws: WebSocket, remoteAddr?: string) {
    super();

    // Extract remote address (WebSocket doesn't always expose this cleanly)
    this.remoteAddress = remoteAddr || 'websocket-client';

    this.initialize();
  }

  /**
   * Initialize WebSocket event handlers
   */
  private initialize(): void {
    // Set up reactive streams from WebSocket events
    const message$ = fromEvent<MessageEvent>(this.ws, 'message');
    const close$ = fromEvent(this.ws, 'close');
    const error$ = fromEvent<Error>(this.ws, 'error');

    // Parse incoming messages
    message$
      .pipe(
        takeUntil(this.closed$),
        map((event) => this.parseMessage(event)),
        filter((msg): msg is string => msg !== null)
      )
      .subscribe({
        next: (data) => this.emitInput(data),
        error: (err) => this.emitError(err as Error),
      });

    // Handle errors
    error$.pipe(takeUntil(this.closed$)).subscribe({
      next: (err) => this.emitError(err),
    });

    // Handle close
    close$.pipe(takeUntil(this.closed$)).subscribe({
      next: () => this.setClosed(),
    });

    // Subscribe to output
    this.output$.pipe(takeUntil(this.closed$)).subscribe({
      next: (data) => this.send(data),
    });

    // Mark as connected
    this.setConnected(true);

    // WebSocket supports ANSI by default (browser terminals handle it)
    this.updateCapabilities({
      ansi: true,
      terminalType: 'xterm-256color',
    });
  }

  /**
   * Parse incoming WebSocket message
   */
  private parseMessage(event: MessageEvent): string | null {
    const data = event.data;

    // Handle string messages
    if (typeof data === 'string') {
      return data;
    }

    // Handle Buffer/ArrayBuffer
    if (data instanceof Buffer) {
      return data.toString('utf8');
    }

    if (data instanceof ArrayBuffer) {
      return Buffer.from(data).toString('utf8');
    }

    // Ignore other types
    return null;
  }

  /**
   * Send data through WebSocket
   */
  private send(data: string): void {
    if (this.ws.readyState !== 1 /* OPEN */) return;

    try {
      this.ws.send(data);
    } catch (err) {
      this.emitError(err as Error);
    }
  }

  /**
   * Close the connection gracefully
   */
  close(): void {
    if (!this.connectedSubject.value) return;
    this.ws.close(1000, 'Normal closure');
  }

  /**
   * Destroy the connection immediately
   */
  destroy(): void {
    if (!this.connectedSubject.value) return;
    this.ws.terminate();
  }
}
