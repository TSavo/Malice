import { Socket } from 'net';
import { fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaseTransport } from '../base-transport.js';
import { TelnetProtocolParser } from './protocol-parser.js';
import { TelnetCommandBuilder } from './command-builder.js';
import { TELNET_COMMANDS, TELNET_OPTIONS } from '../../../types/telnet.js';
import type { TelnetCommandData } from '../../../types/telnet.js';

/**
 * Telnet transport implementation
 * Wraps a TCP socket with telnet protocol handling
 */
export class TelnetTransport extends BaseTransport {
  public readonly type = 'telnet' as const;
  public readonly remoteAddress: string;

  private parser: TelnetProtocolParser;
  private rawMode = false;

  constructor(private socket: Socket) {
    super();

    this.remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    this.parser = new TelnetProtocolParser();

    this.initialize();
  }

  /**
   * Initialize socket event handlers
   */
  private initialize(): void {
    // Set up reactive streams from socket events
    const data$ = fromEvent<Buffer>(this.socket, 'data');
    const end$ = fromEvent(this.socket, 'end');
    const close$ = fromEvent(this.socket, 'close');
    const error$ = fromEvent<Error>(this.socket, 'error');

    // Parse incoming data
    data$.pipe(takeUntil(this.closed$)).subscribe({
      next: (data) => this.handleData(data),
      error: (err) => this.emitError(err as Error),
    });

    // Handle errors
    error$.pipe(takeUntil(this.closed$)).subscribe({
      next: (err) => this.emitError(err),
    });

    // Handle close
    merge(end$, close$)
      .pipe(takeUntil(this.closed$))
      .subscribe({
        next: () => this.setClosed(),
      });

    // Subscribe to output
    this.output$.pipe(takeUntil(this.closed$)).subscribe({
      next: (data) => this.write(data),
    });

    // Mark as connected
    this.setConnected(true);

    // Negotiate telnet capabilities
    this.negotiate();
  }

  /**
   * Negotiate telnet options for TTY mode
   */
  private negotiate(): void {
    const commands = TelnetCommandBuilder.negotiateTTY();
    commands.forEach((cmd) => this.socket.write(cmd));
  }

  /**
   * Handle incoming data from socket
   */
  private handleData(data: Buffer): void {
    const result = this.parser.parse(data);

    // Process commands
    result.commands.forEach((cmd) => this.handleCommand(cmd));

    // Emit clean text data
    if (result.text && result.text.length > 0) {
      // Convert to string and emit
      const text = result.text.toString('utf8');
      this.emitInput(text);
    }
  }

  /**
   * Handle parsed telnet command
   */
  private handleCommand(cmd: TelnetCommandData): void {
    // Handle NAWS (window size)
    if (cmd.optionCode === TELNET_OPTIONS.NAWS && cmd.commandCode === TELNET_COMMANDS.SB) {
      const size = TelnetProtocolParser.parseWindowSize(cmd.data);
      if (size) {
        this.updateCapabilities({
          width: size.width,
          height: size.height,
        });
      }
    }

    // Handle terminal type
    if (cmd.optionCode === TELNET_OPTIONS.TERMINAL_TYPE) {
      // Request terminal type info
      if (cmd.commandCode === TELNET_COMMANDS.WILL) {
        const requests = TelnetCommandBuilder.requestTerminalType();
        requests.forEach((req) => this.socket.write(req));
      }
    }

    // Handle environment variables
    if (cmd.optionCode === TELNET_OPTIONS.NEW_ENVIRON && cmd.commandCode === TELNET_COMMANDS.SB) {
      const env = TelnetProtocolParser.parseEnvironment(cmd.data);
      if (env) {
        this.updateCapabilities({
          env: { [env.name]: env.value },
        });

        // Special handling for TERM
        if (env.name === 'TERM') {
          this.updateCapabilities({
            terminalType: env.value,
          });
        }
      }
    }
  }

  /**
   * Write data to socket
   * Automatically converts LF to CRLF for telnet
   */
  private write(data: string): void {
    if (!this.socket.writable) return;

    // Convert LF to CRLF for telnet protocol
    const converted = data.replace(/\r?\n/g, '\r\n');
    this.socket.write(converted, 'utf8');
  }

  /**
   * Set raw mode (for character-at-a-time input)
   */
  setRawMode(enabled: boolean): void {
    if (this.rawMode === enabled) return;

    this.rawMode = enabled;
    const commands = enabled ? TelnetCommandBuilder.enterRawMode() : TelnetCommandBuilder.exitRawMode();

    commands.forEach((cmd) => this.socket.write(cmd));
  }

  /**
   * Close the connection gracefully
   */
  close(): void {
    if (!this.connectedSubject.value) return;
    this.socket.end();
  }

  /**
   * Destroy the connection immediately
   */
  destroy(): void {
    if (!this.connectedSubject.value) return;
    this.socket.destroy();
  }
}
