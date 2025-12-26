/**
 * SSH Transport - wraps an SSH channel as an ITransport
 */

import type { ServerChannel } from 'ssh2';
import type { TransportType } from '../../../types/transport.js';
import { BaseTransport } from '../base-transport.js';

/**
 * SSH transport wrapping an SSH server channel (PTY session)
 */
export class SSHTransport extends BaseTransport {
  public readonly type: TransportType = 'ssh';
  public readonly remoteAddress: string;

  private inputBuffer = '';

  constructor(
    private channel: ServerChannel,
    remoteAddress: string,
  ) {
    super();
    this.remoteAddress = remoteAddress;

    this.setupChannel();
    this.setConnected(true);
  }

  /**
   * Set up channel event handlers
   */
  private setupChannel(): void {
    // Handle incoming data from client
    this.channel.on('data', (data: Buffer) => {
      const text = data.toString('utf8');

      // Buffer input until we get a complete line
      for (const char of text) {
        if (char === '\r' || char === '\n') {
          if (this.inputBuffer.length > 0) {
            this.emitInput(this.inputBuffer);
            this.inputBuffer = '';
          }
        } else if (char === '\x7f' || char === '\b') {
          // Backspace
          this.inputBuffer = this.inputBuffer.slice(0, -1);
        } else if (char >= ' ' || char === '\t') {
          this.inputBuffer += char;
        }
      }
    });

    // Handle channel close
    this.channel.on('close', () => {
      this.setClosed();
    });

    this.channel.on('end', () => {
      this.setClosed();
    });

    this.channel.on('error', (err: Error) => {
      this.emitError(err);
    });

    // Subscribe to output and send to channel
    this.output$.subscribe({
      next: (data) => {
        if (!this.channel.destroyed) {
          // Convert LF to CRLF for terminal
          const output = data.replace(/\n/g, '\r\n');
          this.channel.write(output);
        }
      },
      error: (err) => {
        this.emitError(err instanceof Error ? err : new Error(String(err)));
      },
    });
  }

  /**
   * Update terminal size from PTY resize event
   */
  setWindowSize(cols: number, rows: number): void {
    this.updateCapabilities({
      width: cols,
      height: rows,
    });
  }

  /**
   * Set terminal type from PTY request
   */
  setTerminalType(termType: string): void {
    this.updateCapabilities({
      terminalType: termType,
      ansi:
        termType.includes('xterm') ||
        termType.includes('ansi') ||
        termType.includes('vt'),
    });
  }

  /**
   * Close the transport gracefully
   */
  close(): void {
    if (!this.channel.destroyed) {
      this.channel.end();
    }
    this.setClosed();
  }

  /**
   * Destroy the transport immediately
   */
  destroy(): void {
    if (!this.channel.destroyed) {
      this.channel.destroy();
    }
    this.setClosed();
  }
}
