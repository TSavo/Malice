/**
 * PollingMux - Channel multiplexer for polling-based transports
 *
 * Unlike ChannelMux which streams to WebSocket immediately,
 * PollingMux accumulates messages across all channels for batch retrieval.
 * Used by MCP Session transport where clients poll for accumulated messages.
 */

import { Subject, type Subscription } from 'rxjs';
import type { IChannel, IChannelMux } from '../multiplexed/types';
import { PollingChannel } from './polling-channel';

/**
 * Mux message with timestamp for ordering
 */
export interface MuxMessage {
  /** Channel ID */
  ch: string;
  /** Message type (always 'data' for buffered output) */
  t: 'data';
  /** Payload */
  p: unknown;
  /** Timestamp when message was buffered */
  ts: number;
}

let muxIdCounter = 0;

/**
 * Channel multiplexer for polling transports
 */
export class PollingMux implements IChannelMux {
  readonly muxId = ++muxIdCounter;
  private readonly channels = new Map<string, PollingChannel>();
  private readonly subscriptions = new Map<string, Subscription>();
  private destroyed = false;

  /** Subject for mux-level events */
  readonly events$ = new Subject<{
    type: 'open' | 'close' | 'error';
    channel?: string;
    error?: Error;
  }>();

  // Built-in channels
  private _game: PollingChannel<string, string>;
  private _ctrl: PollingChannel;
  private _state: PollingChannel;

  constructor() {
    // Create built-in channels
    this._game = this.createChannel('game') as PollingChannel<string, string>;
    this._ctrl = this.createChannel('ctrl');
    this._state = this.createChannel('state');
  }

  get game(): IChannel<string, string> {
    return this._game;
  }

  get ctrl(): IChannel {
    return this._ctrl;
  }

  get state(): IChannel {
    return this._state;
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
  private createChannel(id: string): PollingChannel {
    const channel = new PollingChannel(
      id,
      () => {
        this.removeChannel(id);
      },
      this.muxId,
    );

    this.channels.set(id, channel);

    // No WebSocket to send to - messages accumulate in channel buffer
    // Just track the channel for events
    const sub = channel.output$.subscribe(() => {
      // Output is buffered in channel, nothing to do here
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
   * Receive a message on a channel (from MCP client)
   */
  receive(channelId: string, payload: unknown): void {
    const channel = this.channel(channelId) as PollingChannel;
    channel.receive(payload);
  }

  /**
   * Drain all buffered messages from all channels
   * Returns messages in order received across channels
   */
  drainAll(): MuxMessage[] {
    const messages: MuxMessage[] = [];
    const now = Date.now();

    for (const [id, channel] of this.channels) {
      const payloads = channel.drain();
      for (const p of payloads) {
        messages.push({
          ch: id,
          t: 'data',
          p,
          ts: now,
        });
      }
    }

    return messages;
  }

  /**
   * Drain messages from specific channels only
   */
  drainChannels(channelIds: string[]): MuxMessage[] {
    const messages: MuxMessage[] = [];
    const now = Date.now();

    for (const id of channelIds) {
      const channel = this.channels.get(id);
      if (channel) {
        const payloads = channel.drain();
        for (const p of payloads) {
          messages.push({
            ch: id,
            t: 'data',
            p,
            ts: now,
          });
        }
      }
    }

    return messages;
  }

  /**
   * Get total buffered message count across all channels
   */
  get bufferedCount(): number {
    let count = 0;
    for (const channel of this.channels.values()) {
      count += channel.bufferedCount;
    }
    return count;
  }

  /**
   * Get list of channel IDs
   */
  get channelIds(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Close all channels and clean up
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

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

  get isDestroyed(): boolean {
    return this.destroyed;
  }
}
