/**
 * PollingChannel - Buffered channel for polling-based transports
 *
 * Unlike the standard Channel which streams output immediately,
 * PollingChannel buffers outgoing messages for later retrieval via drain().
 * This supports HTTP polling patterns where clients periodically fetch accumulated messages.
 */

import { Subject } from 'rxjs';
import type { IChannel } from '../multiplexed/types.js';

/** Maximum messages to buffer before dropping oldest */
const MAX_BUFFER_SIZE = 1000;

/**
 * A buffered bidirectional communication channel for polling transports
 */
export class PollingChannel<TIn = unknown, TOut = unknown>
  implements IChannel<TIn, TOut>
{
  readonly id: string;
  readonly input$ = new Subject<TIn>();
  readonly output$ = new Subject<TOut>();

  private _isOpen = true;
  private outputBuffer: TOut[] = [];
  private readonly onClose?: () => void;

  constructor(id: string, onClose?: () => void) {
    this.id = id;
    this.onClose = onClose;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  /**
   * Get current buffer size
   */
  get bufferedCount(): number {
    return this.outputBuffer.length;
  }

  /**
   * Send a message on this channel
   * Buffers the message for later retrieval via drain()
   * Also emits to output$ for observers
   */
  send(payload: TOut): void {
    if (!this._isOpen) {
      throw new Error(`Channel ${this.id} is closed`);
    }

    // Enforce max buffer size - drop oldest
    if (this.outputBuffer.length >= MAX_BUFFER_SIZE) {
      this.outputBuffer.shift();
    }

    this.outputBuffer.push(payload);
    this.output$.next(payload);
  }

  /**
   * Receive a message from the remote end (MCP client)
   * Called when MCP tool sends to this channel
   */
  receive(payload: TIn): void {
    if (!this._isOpen) {
      return; // Silently drop messages to closed channels
    }
    this.input$.next(payload);
  }

  /**
   * Drain all buffered messages
   * Returns accumulated messages and clears the buffer
   */
  drain(): TOut[] {
    const messages = [...this.outputBuffer];
    this.outputBuffer = [];
    return messages;
  }

  /**
   * Peek at buffered messages without draining
   */
  peek(): TOut[] {
    return [...this.outputBuffer];
  }

  /**
   * Close this channel
   */
  close(): void {
    if (!this._isOpen) {
      return;
    }

    this._isOpen = false;
    this.input$.complete();
    this.output$.complete();
    this.outputBuffer = [];
    this.onClose?.();
  }
}
