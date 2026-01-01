import { Subject, type Subscription } from 'rxjs';
import type { WebSocket } from 'ws';
import { Channel } from './channel';
import { jsonCodec } from './codecs/json-codec';
import type { ChannelMessage, IChannel, IChannelMux, WireCodec } from './types';

/**
 * Channel multiplexer - routes messages between WebSocket and channels
 *
 * Manages multiple logical channels over a single WebSocket connection.
 * Handles encoding/decoding via pluggable codecs and routes messages
 * to the appropriate channel.
 */
export class ChannelMux implements IChannelMux {
  private readonly channels = new Map<string, Channel>();
  private readonly subscriptions = new Map<string, Subscription>();
  private codec: WireCodec;
  private destroyed = false;

  /** Subject for mux-level events (channel open/close, errors) */
  readonly events$ = new Subject<{
    type: 'open' | 'close' | 'error';
    channel?: string;
    error?: Error;
  }>();

  // Built-in channels
  private _game?: Channel<string, string>;
  private _ctrl?: Channel;
  private _state?: Channel;

  constructor(
    private readonly ws: WebSocket,
    codec?: WireCodec,
  ) {
    this.codec = codec ?? jsonCodec;
    this.setupWebSocket();

    // Create built-in channels
    this._game = this.createChannel('game') as Channel<string, string>;
    this._ctrl = this.createChannel('ctrl');
    this._state = this.createChannel('state');
  }

  get game(): IChannel<string, string> {
    return this._game!;
  }

  get ctrl(): IChannel {
    return this._ctrl!;
  }

  get state(): IChannel {
    return this._state!;
  }

  /**
   * Set up WebSocket message handling
   */
  private setupWebSocket(): void {
    this.ws.on('message', (data: Buffer | string) => {
      try {
        this.handleMessage(data);
      } catch (err) {
        this.events$.next({
          type: 'error',
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    });

    this.ws.on('close', () => {
      this.destroy();
    });

    this.ws.on('error', (err) => {
      this.events$.next({ type: 'error', error: err });
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: Buffer | string): void {
    const msg = this.codec.decode(data);

    // Handle protocol-level messages
    if (msg.t === 'ping') {
      this.sendRaw({ ch: msg.ch, t: 'pong', p: msg.p });
      return;
    }

    if (msg.t === 'open') {
      // Client requesting to open a new channel
      this.channel(msg.ch); // Ensure channel exists
      this.sendRaw({ ch: msg.ch, t: 'ack', p: { opened: true } });
      this.events$.next({ type: 'open', channel: msg.ch });
      return;
    }

    if (msg.t === 'close') {
      // Client closing a channel
      this.close(msg.ch);
      return;
    }

    // Route data messages to the appropriate channel
    if (msg.t === 'data') {
      const channel = this.channels.get(msg.ch);
      if (channel) {
        channel.receive(msg.p);
      }
      // Silently drop messages to unknown channels
    }
  }

  /**
   * Get or create a channel by ID
   */
  channel(id: string): IChannel {
    let channel = this.channels.get(id);
    if (!channel) {
      channel = this.createChannel(id);
    }
    return channel;
  }

  /**
   * Create a new channel
   */
  private createChannel(id: string): Channel {
    const channel = new Channel(id, () => {
      // Cleanup when channel closes itself
      this.removeChannel(id);
    });

    this.channels.set(id, channel);

    // Subscribe to outgoing messages
    const sub = channel.output$.subscribe((payload) => {
      this.sendRaw({ ch: id, t: 'data', p: payload });
    });
    this.subscriptions.set(id, sub);

    return channel;
  }

  /**
   * Remove a channel and clean up subscriptions
   */
  private removeChannel(id: string): void {
    const sub = this.subscriptions.get(id);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(id);
    }
    this.channels.delete(id);
  }

  /**
   * Check if a channel exists
   */
  has(id: string): boolean {
    return this.channels.has(id);
  }

  /**
   * Close a channel
   */
  close(id: string): void {
    const channel = this.channels.get(id);
    if (channel) {
      channel.close();
      this.removeChannel(id);
      this.sendRaw({ ch: id, t: 'close', p: null });
      this.events$.next({ type: 'close', channel: id });
    }
  }

  /**
   * Send a message on a channel (convenience method)
   */
  send(channelId: string, payload: unknown): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.send(payload);
    } else {
      // Channel doesn't exist yet - create it and send
      const newChannel = this.createChannel(channelId);
      newChannel.send(payload);
    }
  }

  /**
   * Send a raw message to the WebSocket
   */
  private sendRaw(msg: ChannelMessage): void {
    if (this.destroyed || this.ws.readyState !== 1) {
      return;
    }

    const encoded = this.codec.encode(msg);
    this.ws.send(encoded);
  }

  /**
   * Close all channels and clean up
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    // Close all channels
    for (const [id, channel] of this.channels) {
      channel.close();
      const sub = this.subscriptions.get(id);
      if (sub) {
        sub.unsubscribe();
      }
    }

    this.channels.clear();
    this.subscriptions.clear();
    this.events$.complete();
  }
}
