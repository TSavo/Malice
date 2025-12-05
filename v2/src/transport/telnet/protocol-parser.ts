import {
  TELNET_COMMANDS,
  TELNET_OPTIONS,
  TELNET_SUB,
  type TelnetCommandData,
  type TelnetWindowSize,
  type TelnetEnvironment,
} from '../../../types/telnet.js';

/**
 * Create reverse lookup maps
 */
const COMMAND_NAMES = Object.fromEntries(
  Object.entries(TELNET_COMMANDS).map(([k, v]) => [v, k.toLowerCase()])
);

const OPTION_NAMES = Object.fromEntries(
  Object.entries(TELNET_OPTIONS).map(([k, v]) => [v, k.toLowerCase().replace(/_/g, ' ')])
);

/**
 * Parser state
 */
interface ParserState {
  buffer: Buffer;
  position: number;
}

/**
 * Parse result
 */
export interface ParseResult {
  text: Buffer | null;
  commands: TelnetCommandData[];
  incomplete: ParserState | null;
}

/**
 * Telnet protocol parser - redesigned for clarity
 *
 * Strategy:
 * 1. Scan buffer for IAC sequences
 * 2. Extract text segments between commands
 * 3. Parse commands when complete
 * 4. Save state if incomplete
 */
export class TelnetProtocolParser {
  private savedState: ParserState | null = null;

  /**
   * Parse incoming telnet data
   */
  parse(data: Buffer): ParseResult {
    // Prepend any saved state from previous incomplete parse
    const buffer = this.savedState
      ? Buffer.concat([this.savedState.buffer, data])
      : data;

    this.savedState = null;

    const textSegments: Buffer[] = [];
    const commands: TelnetCommandData[] = [];

    let position = 0;
    let textStart = 0;

    while (position < buffer.length) {
      // Check for IAC (command start)
      if (buffer[position] === TELNET_COMMANDS.IAC) {
        // Save any text before this command
        if (position > textStart) {
          textSegments.push(buffer.slice(textStart, position));
        }

        // Try to parse the command
        const commandResult = this.tryParseCommand(buffer, position);

        if (commandResult.incomplete) {
          // Not enough data - save state and wait for more
          this.savedState = {
            buffer: buffer.slice(textStart),
            position: 0,
          };
          break;
        }

        if (commandResult.command) {
          commands.push(commandResult.command);
        }

        // Move past the command
        position += commandResult.length;
        textStart = position;
      } else {
        // Regular character, keep scanning
        position++;
      }
    }

    // Save any remaining text
    if (!this.savedState && position > textStart) {
      textSegments.push(buffer.slice(textStart, position));
    }

    return {
      text: textSegments.length > 0 ? Buffer.concat(textSegments) : null,
      commands,
      incomplete: this.savedState,
    };
  }

  /**
   * Try to parse a command starting at position
   * Returns command info or incomplete status
   */
  private tryParseCommand(
    buffer: Buffer,
    position: number
  ): { command: TelnetCommandData | null; length: number; incomplete: boolean } {
    // Need at least 3 bytes for basic command: IAC + CMD + OPT
    if (buffer.length - position < 3) {
      return { command: null, length: 0, incomplete: true };
    }

    const iacCode = buffer[position];
    const commandCode = buffer[position + 1];
    const optionCode = buffer[position + 2];

    // Validate this is actually a command
    if (!COMMAND_NAMES[commandCode] || !OPTION_NAMES[optionCode]) {
      // Not a valid command, treat IAC as data (shouldn't happen in practice)
      return { command: null, length: 1, incomplete: false };
    }

    const commandName = COMMAND_NAMES[commandCode];
    const optionName = OPTION_NAMES[optionCode];

    // Handle subnegotiation (variable length)
    if (commandCode === TELNET_COMMANDS.SB) {
      return this.tryParseSubnegotiation(buffer, position, iacCode, commandCode, optionCode, commandName, optionName);
    }

    // Simple 3-byte command
    const cmd: TelnetCommandData = {
      iacCode,
      commandCode,
      optionCode,
      commandName,
      optionName,
      data: buffer.slice(position, position + 3),
      values: [],
    };

    return { command: cmd, length: 3, incomplete: false };
  }

  /**
   * Parse subnegotiation sequence
   */
  private tryParseSubnegotiation(
    buffer: Buffer,
    position: number,
    iacCode: number,
    commandCode: number,
    optionCode: number,
    commandName: string,
    optionName: string
  ): { command: TelnetCommandData | null; length: number; incomplete: boolean } {
    // Find the SE (end subnegotiation) marker
    let endPosition = position + 3;
    while (endPosition < buffer.length) {
      if (buffer[endPosition] === TELNET_COMMANDS.IAC && buffer[endPosition + 1] === TELNET_COMMANDS.SE) {
        // Found complete subnegotiation
        const length = endPosition - position + 2; // Include IAC SE
        const cmd: TelnetCommandData = {
          iacCode,
          commandCode,
          optionCode,
          commandName,
          optionName,
          data: buffer.slice(position, position + length),
          values: [],
        };
        return { command: cmd, length, incomplete: false };
      }
      endPosition++;
    }

    // Didn't find SE - incomplete
    return { command: null, length: 0, incomplete: true };
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
