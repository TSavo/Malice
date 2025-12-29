import type { Subject } from 'rxjs';

/**
 * Message types for channel protocol
 */
export type MessageType =
  | 'data' // Regular data
  | 'open' // Open channel request
  | 'close' // Close channel
  | 'ack' // Acknowledgment
  | 'error' // Error response
  | 'ping' // Keepalive ping
  | 'pong'; // Keepalive pong

/**
 * Wire protocol message envelope
 * Short keys for wire efficiency
 */
export interface ChannelMessage<T = unknown> {
  /** Channel ID (e.g., "game", "ctrl", "state") */
  ch: string;
  /** Message type */
  t: MessageType;
  /** Sequence number for ordering/ack (optional) */
  seq?: number;
  /** Payload - type depends on channel */
  p: T;
}

/**
 * Pluggable wire codec interface
 */
export interface WireCodec {
  /** Codec name for negotiation */
  readonly name: string;
  /** Content type for HTTP headers */
  readonly contentType: string;

  /** Encode a message for transmission */
  encode(msg: ChannelMessage): Buffer | string;

  /** Decode a received message */
  decode(data: Buffer | string): ChannelMessage;

  /**
   * Frame an encoded message for streaming (optional)
   * Used for transports that need length-prefixing
   */
  frame?(encoded: Buffer | string): Buffer | string;

  /**
   * Extract a complete message from a stream buffer (optional)
   * Returns null if buffer doesn't contain a complete message
   */
  unframe?(
    stream: Buffer | string,
  ): { message: Buffer | string; remainder: Buffer | string } | null;
}

/**
 * Channel interface - bidirectional typed stream
 */
export interface IChannel<TIn = unknown, TOut = unknown> {
  /** Channel identifier */
  readonly id: string;

  /** Whether the channel is open */
  readonly isOpen: boolean;

  /** Incoming messages from the remote end */
  readonly input$: Subject<TIn>;

  /** Outgoing messages to the remote end */
  readonly output$: Subject<TOut>;

  /** Send a message on this channel */
  send(payload: TOut): void;

  /** Close this channel */
  close(): void;
}

/**
 * Channel multiplexer interface
 */
export interface IChannelMux {
  /** Get or create a channel by ID */
  channel(id: string): IChannel;

  /** Check if a channel exists */
  has(id: string): boolean;

  /** Close a channel */
  close(id: string): void;

  /** Close all channels and the mux */
  destroy(): void;

  /** Send a message on a channel (convenience) */
  send(channelId: string, payload: unknown): void;

  // Built-in channels
  readonly game: IChannel<string, string>;
  readonly ctrl: IChannel;
  readonly state: IChannel;
}

/**
 * Control channel message types
 */
export interface CtrlMessage {
  type: string;
  [key: string]: unknown;
}

export interface CtrlReady extends CtrlMessage {
  type: 'ready';
}

export interface CtrlTyping extends CtrlMessage {
  type: 'typing';
  state: boolean;
}

export interface CtrlResize extends CtrlMessage {
  type: 'resize';
  w: number;
  h: number;
}

export interface CtrlMode extends CtrlMessage {
  type: 'mode';
  mode: string;
}

export interface CtrlPrompt extends CtrlMessage {
  type: 'prompt';
  text: string;
}

/**
 * State channel message types
 */
export interface StateMessage<T = unknown> {
  type: string;
  data: T;
}

export interface StateRoom extends StateMessage {
  type: 'room';
  data: {
    id: number;
    name: string;
    description?: string;
    exits?: Record<string, number>;
    contents?: Array<{ id: number; name: string; type: string }>;
  };
}

export interface StateInventory extends StateMessage {
  type: 'inventory';
  data: Array<{ id: number; name: string; [key: string]: unknown }>;
}

export interface StateInventoryDelta extends StateMessage {
  type: 'inventory_delta';
  data: {
    action: 'add' | 'remove';
    itemId?: number;
    item?: { id: number; name: string; [key: string]: unknown };
  };
}

/**
 * Error channel message
 */
export interface ErrorMessage {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Media channel message types
 */
export interface MediaMessage<T = unknown> {
  type: string;
  data: T;
}
