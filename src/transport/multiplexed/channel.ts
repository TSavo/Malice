import { Subject } from 'rxjs';
import type { IChannel } from './types.js';

/**
 * A bidirectional communication channel
 *
 * Channels are created by the ChannelMux and provide typed RxJS streams
 * for sending and receiving messages. The mux handles encoding/decoding
 * and routing to the correct channel.
 */
export class Channel<TIn = unknown, TOut = unknown>
  implements IChannel<TIn, TOut>
{
  readonly id: string;
  readonly input$ = new Subject<TIn>();
  readonly output$ = new Subject<TOut>();

  private _isOpen = true;
  private readonly onClose?: () => void;

  constructor(id: string, onClose?: () => void) {
    this.id = id;
    this.onClose = onClose;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  /**
   * Send a message on this channel
   * The mux will subscribe to output$ and encode/transmit
   */
  send(payload: TOut): void {
    if (!this._isOpen) {
      throw new Error(`Channel ${this.id} is closed`);
    }
    this.output$.next(payload);
  }

  /**
   * Receive a message from the remote end
   * Called by the mux when a message arrives for this channel
   */
  receive(payload: TIn): void {
    if (!this._isOpen) {
      return; // Silently drop messages to closed channels
    }
    this.input$.next(payload);
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
    this.onClose?.();
  }
}
