import { describe, it, expect, beforeEach } from 'vitest';
import { TelnetProtocolParser } from '../src/transport/telnet/protocol-parser.js';
import { TELNET_COMMANDS, TELNET_OPTIONS } from '../types/telnet.js';

describe('TelnetProtocolParser', () => {
  let parser: TelnetProtocolParser;

  beforeEach(() => {
    parser = new TelnetProtocolParser();
  });

  describe('basic text parsing', () => {
    it('should parse plain text without commands', () => {
      const input = Buffer.from('Hello, World!');
      const result = parser.parse(input);

      expect(result.text?.toString()).toBe('Hello, World!');
      expect(result.commands).toHaveLength(0);
      expect(result.incomplete).toBeNull();
    });

    it('should handle empty input', () => {
      const input = Buffer.from('');
      const result = parser.parse(input);

      expect(result.text).toBeNull();
      expect(result.commands).toHaveLength(0);
    });

    it('should handle newlines', () => {
      const input = Buffer.from('Line 1\r\nLine 2\n');
      const result = parser.parse(input);

      expect(result.text?.toString()).toBe('Line 1\r\nLine 2\n');
    });
  });

  describe('IAC command parsing', () => {
    it('should parse DO command', () => {
      const input = Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.DO,
        TELNET_OPTIONS.ECHO,
      ]);
      const result = parser.parse(input);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0].commandCode).toBe(TELNET_COMMANDS.DO);
      expect(result.commands[0].optionCode).toBe(TELNET_OPTIONS.ECHO);
      expect(result.commands[0].commandName).toBe('do');
      expect(result.commands[0].optionName).toBe('echo');
    });

    it('should parse WILL command', () => {
      const input = Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.WILL,
        TELNET_OPTIONS.SUPPRESS_GO_AHEAD,
      ]);
      const result = parser.parse(input);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0].commandCode).toBe(TELNET_COMMANDS.WILL);
      expect(result.commands[0].optionCode).toBe(TELNET_OPTIONS.SUPPRESS_GO_AHEAD);
    });

    it('should parse WONT command', () => {
      const input = Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.WONT,
        TELNET_OPTIONS.ECHO,
      ]);
      const result = parser.parse(input);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0].commandCode).toBe(TELNET_COMMANDS.WONT);
    });

    it('should parse DONT command', () => {
      const input = Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.DONT,
        TELNET_OPTIONS.LINEMODE,
      ]);
      const result = parser.parse(input);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0].commandCode).toBe(TELNET_COMMANDS.DONT);
    });
  });

  describe('mixed text and commands', () => {
    it('should separate text from commands', () => {
      const input = Buffer.concat([
        Buffer.from('Hello '),
        Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.DO, TELNET_OPTIONS.ECHO]),
        Buffer.from(' World'),
      ]);
      const result = parser.parse(input);

      // New parser correctly preserves text before and after commands
      expect(result.text?.toString()).toBe('Hello  World');
      expect(result.commands).toHaveLength(1);
      expect(result.commands[0].optionCode).toBe(TELNET_OPTIONS.ECHO);
    });

    it('should handle multiple commands', () => {
      const input = Buffer.concat([
        Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.DO, TELNET_OPTIONS.ECHO]),
        Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.WILL, TELNET_OPTIONS.NAWS]),
        Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.DO, TELNET_OPTIONS.TERMINAL_TYPE]),
      ]);
      const result = parser.parse(input);

      expect(result.commands).toHaveLength(3);
      expect(result.commands[0].optionCode).toBe(TELNET_OPTIONS.ECHO);
      expect(result.commands[1].optionCode).toBe(TELNET_OPTIONS.NAWS);
      expect(result.commands[2].optionCode).toBe(TELNET_OPTIONS.TERMINAL_TYPE);
    });
  });

  describe('incomplete command handling', () => {
    it('should detect incomplete IAC sequence (1 byte)', () => {
      const input = Buffer.from([TELNET_COMMANDS.IAC]);
      const result = parser.parse(input);

      expect(result.incomplete).not.toBeNull();
      expect(result.commands).toHaveLength(0);
    });

    it('should detect incomplete IAC sequence (2 bytes)', () => {
      const input = Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.DO]);
      const result = parser.parse(input);

      expect(result.incomplete).not.toBeNull();
      expect(result.commands).toHaveLength(0);
    });

    it('should resume parsing after receiving more data', () => {
      // First parse - incomplete
      const part1 = Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.DO]);
      const result1 = parser.parse(part1);
      expect(result1.incomplete).not.toBeNull();

      // Second parse - complete
      const part2 = Buffer.from([TELNET_OPTIONS.ECHO]);
      const result2 = parser.parse(part2);
      expect(result2.commands).toHaveLength(1);
      expect(result2.commands[0].optionCode).toBe(TELNET_OPTIONS.ECHO);
    });

    it('should handle incomplete subnegotiation sequence', () => {
      // Subnegotiation without SE terminator
      const input = Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SB,
        TELNET_OPTIONS.NAWS,
        0x00,
        0x50,
        // Missing: height bytes, IAC, SE
      ]);
      const result = parser.parse(input);

      // Should detect incomplete and wait for more data
      expect(result.incomplete).not.toBeNull();
      expect(result.commands).toHaveLength(0);
    });

    it('should handle partial subnegotiation then completion', () => {
      // Part 1: Incomplete NAWS
      const part1 = Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SB,
        TELNET_OPTIONS.NAWS,
        0x00,
        0x50,
      ]);
      const result1 = parser.parse(part1);
      expect(result1.incomplete).not.toBeNull();

      // Part 2: Complete it
      const part2 = Buffer.from([
        0x00,
        0x18,
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SE,
      ]);
      const result2 = parser.parse(part2);
      expect(result2.commands).toHaveLength(1);
      expect(result2.commands[0].commandCode).toBe(TELNET_COMMANDS.SB);
    });

    it('should handle invalid IAC command/option combination', () => {
      // IAC followed by invalid command (not in COMMAND_NAMES)
      const input = Buffer.from([
        TELNET_COMMANDS.IAC,
        0x99, // Invalid command code
        0x00,
      ]);
      const result = parser.parse(input);

      // Should skip the IAC and continue
      expect(result.commands).toHaveLength(0);
    });
  });

  describe('NAWS (window size) parsing', () => {
    it('should parse window size correctly', () => {
      const data = Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SB,
        TELNET_OPTIONS.NAWS,
        0x00,
        0x50, // width = 80
        0x00,
        0x18, // height = 24
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SE,
      ]);

      const size = TelnetProtocolParser.parseWindowSize(data);
      expect(size).not.toBeNull();
      expect(size?.width).toBe(80);
      expect(size?.height).toBe(24);
    });

    it('should handle large window sizes', () => {
      const data = Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SB,
        TELNET_OPTIONS.NAWS,
        0x01,
        0x90, // width = 400
        0x00,
        0xC8, // height = 200
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SE,
      ]);

      const size = TelnetProtocolParser.parseWindowSize(data);
      expect(size).not.toBeNull();
      expect(size?.width).toBe(400);
      expect(size?.height).toBe(200);
    });

    it('should reject invalid NAWS data', () => {
      const data = Buffer.from([1, 2, 3]); // Not valid NAWS
      const size = TelnetProtocolParser.parseWindowSize(data);
      expect(size).toBeNull();
    });

    it('should reject NAWS with wrong IAC', () => {
      const data = Buffer.from([
        0xFE, // Wrong - should be IAC (0xFF / 255)
        TELNET_COMMANDS.SB,
        TELNET_OPTIONS.NAWS,
        0x00,
        0x50,
        0x00,
        0x18,
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SE,
      ]);
      const size = TelnetProtocolParser.parseWindowSize(data);
      expect(size).toBeNull();
    });

    it('should reject NAWS with wrong command', () => {
      const data = Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.DO, // Wrong - should be SB
        TELNET_OPTIONS.NAWS,
        0x00,
        0x50,
        0x00,
        0x18,
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SE,
      ]);
      const size = TelnetProtocolParser.parseWindowSize(data);
      expect(size).toBeNull();
    });

    it('should reject NAWS with wrong option', () => {
      const data = Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SB,
        TELNET_OPTIONS.ECHO, // Wrong - should be NAWS
        0x00,
        0x50,
        0x00,
        0x18,
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SE,
      ]);
      const size = TelnetProtocolParser.parseWindowSize(data);
      expect(size).toBeNull();
    });

    it('should reject NAWS with wrong terminator', () => {
      const data = Buffer.from([
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.SB,
        TELNET_OPTIONS.NAWS,
        0x00,
        0x50,
        0x00,
        0x18,
        TELNET_COMMANDS.IAC,
        TELNET_COMMANDS.NOP, // Wrong - should be SE
      ]);
      const size = TelnetProtocolParser.parseWindowSize(data);
      expect(size).toBeNull();
    });
  });

  describe('environment variable parsing', () => {
    it('should reject environment data that is too short', () => {
      const data = Buffer.from([1, 2, 3, 4, 5]); // Only 5 bytes, need at least 10
      const env = TelnetProtocolParser.parseEnvironment(data);
      expect(env).toBeNull();
    });

    it('should parse TERM environment variable', () => {
      const termName = 'xterm-256color';
      const data = Buffer.concat([
        Buffer.from([
          TELNET_COMMANDS.IAC,
          TELNET_COMMANDS.SB,
          TELNET_OPTIONS.NEW_ENVIRON,
          0x02, // INFO
          0x00, // VARIABLE
        ]),
        Buffer.from('TERM'),
        Buffer.from([0x01]), // VALUE
        Buffer.from(termName),
        Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.SE]),
      ]);

      const env = TelnetProtocolParser.parseEnvironment(data);
      expect(env).not.toBeNull();
      expect(env?.name).toBe('TERM');
      expect(env?.value).toBe(termName.toLowerCase()); // TERM is lowercased
      expect(env?.type).toBe('system');
    });

    it('should parse user-defined variables', () => {
      const data = Buffer.concat([
        Buffer.from([
          TELNET_COMMANDS.IAC,
          TELNET_COMMANDS.SB,
          TELNET_OPTIONS.NEW_ENVIRON,
          0x02, // INFO
          0x03, // USER_VARIABLE
        ]),
        Buffer.from('CUSTOM'),
        Buffer.from([0x01]), // VALUE
        Buffer.from('value'),
        Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.SE]),
      ]);

      const env = TelnetProtocolParser.parseEnvironment(data);
      expect(env).not.toBeNull();
      expect(env?.name).toBe('CUSTOM');
      expect(env?.value).toBe('value');
      expect(env?.type).toBe('user');
    });

    it('should reject environment with wrong IAC', () => {
      const data = Buffer.concat([
        Buffer.from([
          0xFE, // Wrong - should be IAC
          TELNET_COMMANDS.SB,
          TELNET_OPTIONS.NEW_ENVIRON,
          0x02,
          0x00,
        ]),
        Buffer.from('TEST'),
        Buffer.from([0x01]),
        Buffer.from('value'),
        Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.SE]),
      ]);

      const env = TelnetProtocolParser.parseEnvironment(data);
      expect(env).toBeNull();
    });

    it('should reject environment with wrong command', () => {
      const data = Buffer.concat([
        Buffer.from([
          TELNET_COMMANDS.IAC,
          TELNET_COMMANDS.DO, // Wrong - should be SB
          TELNET_OPTIONS.NEW_ENVIRON,
          0x02,
          0x00,
        ]),
        Buffer.from('TEST'),
        Buffer.from([0x01]),
        Buffer.from('value'),
        Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.SE]),
      ]);

      const env = TelnetProtocolParser.parseEnvironment(data);
      expect(env).toBeNull();
    });

    it('should reject environment with wrong option', () => {
      const data = Buffer.concat([
        Buffer.from([
          TELNET_COMMANDS.IAC,
          TELNET_COMMANDS.SB,
          TELNET_OPTIONS.ECHO, // Wrong - should be NEW_ENVIRON
          0x02,
          0x00,
        ]),
        Buffer.from('TEST'),
        Buffer.from([0x01]),
        Buffer.from('value'),
        Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.SE]),
      ]);

      const env = TelnetProtocolParser.parseEnvironment(data);
      expect(env).toBeNull();
    });

    it('should reject environment with wrong info byte', () => {
      const data = Buffer.concat([
        Buffer.from([
          TELNET_COMMANDS.IAC,
          TELNET_COMMANDS.SB,
          TELNET_OPTIONS.NEW_ENVIRON,
          0x01, // Wrong - should be INFO (0x02)
          0x00,
        ]),
        Buffer.from('TEST'),
        Buffer.from([0x01]),
        Buffer.from('value'),
        Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.SE]),
      ]);

      const env = TelnetProtocolParser.parseEnvironment(data);
      expect(env).toBeNull();
    });

    it('should reject environment with wrong terminator', () => {
      const data = Buffer.concat([
        Buffer.from([
          TELNET_COMMANDS.IAC,
          TELNET_COMMANDS.SB,
          TELNET_OPTIONS.NEW_ENVIRON,
          0x02,
          0x00,
        ]),
        Buffer.from('TEST'),
        Buffer.from([0x01]),
        Buffer.from('value'),
        Buffer.from([TELNET_COMMANDS.IAC, TELNET_COMMANDS.NOP]), // Wrong - should be SE
      ]);

      const env = TelnetProtocolParser.parseEnvironment(data);
      expect(env).toBeNull();
    });
  });
});
