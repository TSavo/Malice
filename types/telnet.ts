/**
 * Telnet protocol constants from RFC854
 */

export const TELNET_COMMANDS = {
  SE: 240,   // End of subnegotiation
  NOP: 241,  // No operation
  DM: 242,   // Data mark
  BRK: 243,  // Break
  IP: 244,   // Interrupt process
  AO: 245,   // Abort output
  AYT: 246,  // Are you there
  EC: 247,   // Erase character
  EL: 248,   // Erase line
  GA: 249,   // Go ahead
  SB: 250,   // Subnegotiation begin
  WILL: 251, // Will
  WONT: 252, // Won't
  DO: 253,   // Do
  DONT: 254, // Don't
  IAC: 255,  // Interpret as command
} as const;

export const TELNET_OPTIONS = {
  TRANSMIT_BINARY: 0,
  ECHO: 1,
  SUPPRESS_GO_AHEAD: 3,
  STATUS: 5,
  TIMING_MARK: 6,
  TERMINAL_TYPE: 24,
  END_OF_RECORD: 25,
  NAWS: 31,              // Negotiate about window size
  TERMINAL_SPEED: 32,
  TOGGLE_FLOW_CONTROL: 33,
  LINEMODE: 34,
  NEW_ENVIRON: 39,       // Environment variables
} as const;

export const TELNET_SUB = {
  IS: 0,
  SEND: 1,
  INFO: 2,
  VARIABLE: 0,
  VALUE: 1,
  ESC: 2,
  USER_VARIABLE: 3,
} as const;

export type TelnetCommand = typeof TELNET_COMMANDS[keyof typeof TELNET_COMMANDS];
export type TelnetOption = typeof TELNET_OPTIONS[keyof typeof TELNET_OPTIONS];
export type TelnetSub = typeof TELNET_SUB[keyof typeof TELNET_SUB];

/**
 * Parsed telnet command
 */
export interface TelnetCommandData {
  /** IAC command code */
  iacCode: number;
  /** Command code (WILL, WONT, DO, DONT, etc.) */
  commandCode: number;
  /** Option code */
  optionCode: number;
  /** Command name */
  commandName: string;
  /** Option name */
  optionName: string;
  /** Raw data */
  data: Buffer;
  /** Parsed values (for subnegotiation) */
  values?: unknown[];
}

/**
 * Window size (NAWS) data
 */
export interface TelnetWindowSize {
  width: number;
  height: number;
}

/**
 * Environment variable data
 */
export interface TelnetEnvironment {
  name: string;
  value: string;
  type: 'system' | 'user';
}
