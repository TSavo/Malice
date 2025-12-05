import {
  TELNET_COMMANDS,
  TELNET_OPTIONS,
  TELNET_SUB,
  type TelnetCommandData,
  type TelnetWindowSize,
  type TelnetEnvironment,
} from '../../../types/telnet.js';

/**
 * Create reverse lookup maps for debugging
 */
const COMMAND_NAMES = Object.fromEntries(
  Object.entries(TELNET_COMMANDS).map(([k, v]) => [v, k.toLowerCase()])
);

const OPTION_NAMES = Object.fromEntries(
  Object.entries(TELNET_OPTIONS).map(([k, v]) => [v, k.toLowerCase().replace(/_/g, ' ')])
);

/**
 * Parser state for incomplete telnet commands
 */
interface ParserState {
  data: Buffer;
  i: number;
  l: number;
}

/**
 * Result of parsing telnet data
 */
export interface ParseResult {
  /** Clean text data (non-command bytes) */
  text: Buffer | null;
  /** Parsed commands */
  commands: TelnetCommandData[];
  /** Incomplete parser state (if more data needed) */
  incomplete: ParserState | null;
}

/**
 * Telnet protocol parser
 * Handles RFC854 telnet command parsing
 */
export class TelnetProtocolParser {
  private lastState: ParserState | null = null;

  /**
   * Parse incoming telnet data
   * Returns clean text and any commands found
   */
  parse(data: Buffer): ParseResult {
    const bufs: Buffer[] = [];
    const commands: TelnetCommandData[] = [];
    let i = 0;
    let l = 0;
    let needsPush = false;

    // Resume from incomplete parse if we have one
    if (this.lastState) {
      data = Buffer.concat([this.lastState.data, data]);
      i = this.lastState.i;
      l = this.lastState.l;
      this.lastState = null;
    }

    while (i < data.length) {
      // Check for IAC command sequence (need at least 3 bytes)
      if (this.isCommand(data, i)) {
        const result = this.parseCommand(data, i);

        if (result.length === -1) {
          // Not enough data, save state and wait
          this.lastState = {
            data: data.slice(i),
            i: 0,
            l: 0,
          };
          if (i > l) {
            bufs.push(data.slice(l, i));
          }
          break;
        }

        if (result.command) {
          commands.push(result.command);
        }

        needsPush = true;
        l = i + result.length;
        i += result.length - 1;
      } else {
        // Check if we're at potential IAC but don't have enough bytes
        if (data[i] === TELNET_COMMANDS.IAC && data.length - 1 - i < 2) {
          this.lastState = {
            data: data.slice(i),
            i: 0,
            l: 0,
          };
          if (i > l) {
            bufs.push(data.slice(l, i));
          }
          break;
        }

        if (needsPush || i === data.length - 1) {
          bufs.push(data.slice(l, i + 1));
          needsPush = false;
        }
      }
      i++;
    }

    return {
      text: bufs.length > 0 ? Buffer.concat(bufs) : null,
      commands,
      incomplete: this.lastState,
    };
  }

  /**
   * Check if position is start of telnet command
   */
  private isCommand(data: Buffer, i: number): boolean {
    if (data.length - 1 - i < 2) return false;
    if (data[i] !== TELNET_COMMANDS.IAC) return false;
    return COMMAND_NAMES[data[i + 1]] !== undefined && OPTION_NAMES[data[i + 2]] !== undefined;
  }

  /**
   * Parse a single telnet command
   */
  private parseCommand(
    data: Buffer,
    i: number
  ): { command: TelnetCommandData | null; length: number } {
    const cdata = data.slice(i);

    if (cdata.length < 3) {
      return { command: null, length: -1 };
    }

    const iacCode = cdata.readUInt8(0);
    const commandCode = cdata.readUInt8(1);
    const optionCode = cdata.readUInt8(2);

    const commandName = COMMAND_NAMES[commandCode] || 'unknown';
    const optionName = OPTION_NAMES[optionCode] || 'unknown';

    const cmd: TelnetCommandData = {
      iacCode,
      commandCode,
      optionCode,
      commandName,
      optionName,
      data: cdata,
      values: [],
    };

    // Handle subnegotiation
    if (commandCode === TELNET_COMMANDS.SB) {
      return this.parseSubnegotiation(cmd);
    }

    // Simple command (3 bytes)
    cmd.data = cdata.slice(0, 3);
    return { command: cmd, length: 3 };
  }

  /**
   * Parse subnegotiation data
   */
  private parseSubnegotiation(cmd: TelnetCommandData): { command: TelnetCommandData; length: number } {
    // Find SE (end of subnegotiation)
    let len = 0;
    while (cmd.data[len] && cmd.data[len] !== TELNET_COMMANDS.SE) {
      len++;
    }

    if (!cmd.data[len]) {
      // No SE found, not enough data
      return { command: cmd, length: -1 };
    }

    len++; // Include SE
    cmd.data = cmd.data.slice(0, len);
    return { command: cmd, length: len };
  }

  /**
   * Parse NAWS (window size) subnegotiation
   */
  static parseWindowSize(data: Buffer): TelnetWindowSize | null {
    if (data.length < 9) return null;

    let i = 0;
    const iac1 = data.readUInt8(i++);
    const sb = data.readUInt8(i++);
    const naws = data.readUInt8(i++);
    const width = data.readUInt16BE(i);
    i += 2;
    const height = data.readUInt16BE(i);
    i += 2;
    const iac2 = data.readUInt8(i++);
    const se = data.readUInt8(i++);

    if (
      iac1 !== TELNET_COMMANDS.IAC ||
      sb !== TELNET_COMMANDS.SB ||
      naws !== TELNET_OPTIONS.NAWS ||
      iac2 !== TELNET_COMMANDS.IAC ||
      se !== TELNET_COMMANDS.SE
    ) {
      return null;
    }

    return { width, height };
  }

  /**
   * Parse environment variable subnegotiation
   */
  static parseEnvironment(data: Buffer): TelnetEnvironment | null {
    if (data.length < 10) return null;

    let i = 0;
    const iac1 = data.readUInt8(i++);
    const sb = data.readUInt8(i++);
    const newenv = data.readUInt8(i++);
    const info = data.readUInt8(i++);
    const variable = data.readUInt8(i++);

    // Parse name (until VALUE)
    const nameStart = i;
    while (i < data.length && data[i] !== TELNET_SUB.VALUE) {
      i++;
    }
    const name = data.toString('ascii', nameStart, i);
    i++; // Skip VALUE

    // Parse value (until IAC)
    const valueStart = i;
    while (i < data.length && data[i] !== TELNET_COMMANDS.IAC) {
      i++;
    }
    const value = data.toString('ascii', valueStart, i);

    const iac2 = data.readUInt8(i++);
    const se = data.readUInt8(i++);

    if (
      iac1 !== TELNET_COMMANDS.IAC ||
      sb !== TELNET_COMMANDS.SB ||
      newenv !== TELNET_OPTIONS.NEW_ENVIRON ||
      info !== TELNET_SUB.INFO ||
      iac2 !== TELNET_COMMANDS.IAC ||
      se !== TELNET_COMMANDS.SE
    ) {
      return null;
    }

    return {
      name,
      value: name === 'TERM' ? value.toLowerCase() : value,
      type: variable === TELNET_SUB.VARIABLE ? 'system' : 'user',
    };
  }
}
