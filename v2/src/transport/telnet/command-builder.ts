import { TELNET_COMMANDS, TELNET_OPTIONS, TELNET_SUB } from '../../../types/telnet.js';

/**
 * Builder for telnet protocol commands
 * Provides clean API for constructing telnet command sequences
 */
export class TelnetCommandBuilder {
  /**
   * Build a simple command (IAC + CMD + OPT)
   */
  private static buildSimple(command: number, option: number): Buffer {
    const buf = Buffer.allocUnsafe(3);
    buf[0] = TELNET_COMMANDS.IAC;
    buf[1] = command;
    buf[2] = option;
    return buf;
  }

  /**
   * Send WILL command
   */
  static will(option: number): Buffer {
    return this.buildSimple(TELNET_COMMANDS.WILL, option);
  }

  /**
   * Send WONT command
   */
  static wont(option: number): Buffer {
    return this.buildSimple(TELNET_COMMANDS.WONT, option);
  }

  /**
   * Send DO command
   */
  static do(option: number): Buffer {
    return this.buildSimple(TELNET_COMMANDS.DO, option);
  }

  /**
   * Send DONT command
   */
  static dont(option: number): Buffer {
    return this.buildSimple(TELNET_COMMANDS.DONT, option);
  }

  /**
   * Request terminal type (send DO TERMINAL_TYPE, then SB SEND)
   */
  static requestTerminalType(): Buffer[] {
    return [
      this.do(TELNET_OPTIONS.TERMINAL_TYPE),
      Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SB,
        TELNET_OPTIONS.TERMINAL_TYPE,
        TELNET_SUB.SEND,
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SE,
      ]),
    ];
  }

  /**
   * Request window size
   */
  static requestWindowSize(): Buffer {
    return this.do(TELNET_OPTIONS.NAWS);
  }

  /**
   * Request environment variables
   */
  static requestEnvironment(): Buffer {
    return this.do(TELNET_OPTIONS.NEW_ENVIRON);
  }

  /**
   * Enable binary transmission
   */
  static enableBinary(): Buffer {
    return this.do(TELNET_OPTIONS.TRANSMIT_BINARY);
  }

  /**
   * Enable echo mode
   */
  static enableEcho(): Buffer {
    return this.will(TELNET_OPTIONS.ECHO);
  }

  /**
   * Disable echo mode
   */
  static disableEcho(): Buffer {
    return this.wont(TELNET_OPTIONS.ECHO);
  }

  /**
   * Enable suppress go-ahead
   */
  static enableSuppressGoAhead(): Buffer {
    return this.will(TELNET_OPTIONS.SUPPRESS_GO_AHEAD);
  }

  /**
   * Negotiate full telnet mode (for TTY emulation)
   */
  static negotiateTTY(): Buffer[] {
    return [
      this.do(TELNET_OPTIONS.TRANSMIT_BINARY),
      this.do(TELNET_OPTIONS.TERMINAL_TYPE),
      this.do(TELNET_OPTIONS.NAWS),
      this.do(TELNET_OPTIONS.NEW_ENVIRON),
    ];
  }

  /**
   * Enter raw mode (suppress go-ahead, enable echo)
   */
  static enterRawMode(): Buffer[] {
    return [
      this.do(TELNET_OPTIONS.SUPPRESS_GO_AHEAD),
      this.will(TELNET_OPTIONS.SUPPRESS_GO_AHEAD),
      this.will(TELNET_OPTIONS.ECHO),
    ];
  }

  /**
   * Exit raw mode (cooked mode)
   */
  static exitRawMode(): Buffer[] {
    return [
      this.dont(TELNET_OPTIONS.SUPPRESS_GO_AHEAD),
      this.wont(TELNET_OPTIONS.SUPPRESS_GO_AHEAD),
      this.wont(TELNET_OPTIONS.ECHO),
    ];
  }
}
