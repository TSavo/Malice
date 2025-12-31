import type { ChannelMessage, WireCodec } from '../types';

/**
 * JSON wire codec - newline-delimited JSON
 *
 * Each message is a JSON object followed by a newline.
 * Human-readable, easy to debug, works well with WebSocket text frames.
 */
export class JsonCodec implements WireCodec {
  readonly name = 'json';
  readonly contentType = 'application/json';

  encode(msg: ChannelMessage): string {
    return JSON.stringify(msg);
  }

  decode(data: Buffer | string): ChannelMessage {
    const str = typeof data === 'string' ? data : data.toString('utf-8');
    const parsed = JSON.parse(str);

    // Validate minimal structure
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid message: not an object');
    }
    if (typeof parsed.ch !== 'string') {
      throw new Error('Invalid message: missing channel (ch)');
    }
    if (typeof parsed.t !== 'string') {
      throw new Error('Invalid message: missing type (t)');
    }

    return parsed as ChannelMessage;
  }

  /**
   * Frame a message with newline delimiter
   */
  frame(encoded: string): string {
    return `${encoded}\n`;
  }

  /**
   * Extract a complete message from a newline-delimited stream
   */
  unframe(stream: string): { message: string; remainder: string } | null {
    const newlineIndex = stream.indexOf('\n');
    if (newlineIndex === -1) {
      return null; // No complete message yet
    }

    return {
      message: stream.substring(0, newlineIndex),
      remainder: stream.substring(newlineIndex + 1),
    };
  }
}

/**
 * Default JSON codec instance
 */
export const jsonCodec = new JsonCodec();
