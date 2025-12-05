import { describe, it, expect } from 'vitest';
import { TelnetCommandBuilder } from '../src/transport/telnet/command-builder.js';
import { TELNET_COMMANDS, TELNET_OPTIONS, TELNET_SUB } from '../types/telnet.js';

describe('TelnetCommandBuilder', () => {
  describe('basic commands', () => {
    it('should build WILL command', () => {
      const cmd = TelnetCommandBuilder.will(TELNET_OPTIONS.ECHO);

      expect(cmd).toHaveLength(3);
      expect(cmd[0]).toBe(TELNET_COMMANDS.IAC);
      expect(cmd[1]).toBe(TELNET_COMMANDS.WILL);
      expect(cmd[2]).toBe(TELNET_OPTIONS.ECHO);
    });

    it('should build WONT command', () => {
      const cmd = TelnetCommandBuilder.wont(TELNET_OPTIONS.ECHO);

      expect(cmd).toHaveLength(3);
      expect(cmd[0]).toBe(TELNET_COMMANDS.IAC);
      expect(cmd[1]).toBe(TELNET_COMMANDS.WONT);
      expect(cmd[2]).toBe(TELNET_OPTIONS.ECHO);
    });

    it('should build DO command', () => {
      const cmd = TelnetCommandBuilder.do(TELNET_OPTIONS.NAWS);

      expect(cmd).toHaveLength(3);
      expect(cmd[0]).toBe(TELNET_COMMANDS.IAC);
      expect(cmd[1]).toBe(TELNET_COMMANDS.DO);
      expect(cmd[2]).toBe(TELNET_OPTIONS.NAWS);
    });

    it('should build DONT command', () => {
      const cmd = TelnetCommandBuilder.dont(TELNET_OPTIONS.LINEMODE);

      expect(cmd).toHaveLength(3);
      expect(cmd[0]).toBe(TELNET_COMMANDS.IAC);
      expect(cmd[1]).toBe(TELNET_COMMANDS.DONT);
      expect(cmd[2]).toBe(TELNET_OPTIONS.LINEMODE);
    });
  });

  describe('terminal type negotiation', () => {
    it('should request terminal type', () => {
      const commands = TelnetCommandBuilder.requestTerminalType();

      expect(commands).toHaveLength(2);

      // First: DO TERMINAL_TYPE
      expect(commands[0]).toHaveLength(3);
      expect(commands[0][0]).toBe(TELNET_COMMANDS.IAC);
      expect(commands[0][1]).toBe(TELNET_COMMANDS.DO);
      expect(commands[0][2]).toBe(TELNET_OPTIONS.TERMINAL_TYPE);

      // Second: SB TERMINAL_TYPE SEND SE
      expect(commands[1]).toHaveLength(6);
      expect(commands[1][0]).toBe(TELNET_COMMANDS.IAC);
      expect(commands[1][1]).toBe(TELNET_COMMANDS.SB);
      expect(commands[1][2]).toBe(TELNET_OPTIONS.TERMINAL_TYPE);
      expect(commands[1][3]).toBe(TELNET_SUB.SEND);
      expect(commands[1][4]).toBe(TELNET_COMMANDS.IAC);
      expect(commands[1][5]).toBe(TELNET_COMMANDS.SE);
    });
  });

  describe('capability requests', () => {
    it('should request window size', () => {
      const cmd = TelnetCommandBuilder.requestWindowSize();

      expect(cmd).toHaveLength(3);
      expect(cmd[0]).toBe(TELNET_COMMANDS.IAC);
      expect(cmd[1]).toBe(TELNET_COMMANDS.DO);
      expect(cmd[2]).toBe(TELNET_OPTIONS.NAWS);
    });

    it('should request environment variables', () => {
      const cmd = TelnetCommandBuilder.requestEnvironment();

      expect(cmd).toHaveLength(3);
      expect(cmd[0]).toBe(TELNET_COMMANDS.IAC);
      expect(cmd[1]).toBe(TELNET_COMMANDS.DO);
      expect(cmd[2]).toBe(TELNET_OPTIONS.NEW_ENVIRON);
    });

    it('should enable binary transmission', () => {
      const cmd = TelnetCommandBuilder.enableBinary();

      expect(cmd).toHaveLength(3);
      expect(cmd[0]).toBe(TELNET_COMMANDS.IAC);
      expect(cmd[1]).toBe(TELNET_COMMANDS.DO);
      expect(cmd[2]).toBe(TELNET_OPTIONS.TRANSMIT_BINARY);
    });
  });

  describe('echo control', () => {
    it('should enable echo', () => {
      const cmd = TelnetCommandBuilder.enableEcho();

      expect(cmd).toHaveLength(3);
      expect(cmd[0]).toBe(TELNET_COMMANDS.IAC);
      expect(cmd[1]).toBe(TELNET_COMMANDS.WILL);
      expect(cmd[2]).toBe(TELNET_OPTIONS.ECHO);
    });

    it('should disable echo', () => {
      const cmd = TelnetCommandBuilder.disableEcho();

      expect(cmd).toHaveLength(3);
      expect(cmd[0]).toBe(TELNET_COMMANDS.IAC);
      expect(cmd[1]).toBe(TELNET_COMMANDS.WONT);
      expect(cmd[2]).toBe(TELNET_OPTIONS.ECHO);
    });

    it('should enable suppress go-ahead', () => {
      const cmd = TelnetCommandBuilder.enableSuppressGoAhead();

      expect(cmd).toHaveLength(3);
      expect(cmd[0]).toBe(TELNET_COMMANDS.IAC);
      expect(cmd[1]).toBe(TELNET_COMMANDS.WILL);
      expect(cmd[2]).toBe(TELNET_OPTIONS.SUPPRESS_GO_AHEAD);
    });
  });

  describe('mode sequences', () => {
    it('should negotiate TTY mode', () => {
      const commands = TelnetCommandBuilder.negotiateTTY();

      expect(commands).toHaveLength(4);

      // DO TRANSMIT_BINARY
      expect(commands[0][2]).toBe(TELNET_OPTIONS.TRANSMIT_BINARY);

      // DO TERMINAL_TYPE
      expect(commands[1][2]).toBe(TELNET_OPTIONS.TERMINAL_TYPE);

      // DO NAWS
      expect(commands[2][2]).toBe(TELNET_OPTIONS.NAWS);

      // DO NEW_ENVIRON
      expect(commands[3][2]).toBe(TELNET_OPTIONS.NEW_ENVIRON);
    });

    it('should enter raw mode', () => {
      const commands = TelnetCommandBuilder.enterRawMode();

      expect(commands).toHaveLength(3);

      // DO SUPPRESS_GO_AHEAD
      expect(commands[0][1]).toBe(TELNET_COMMANDS.DO);
      expect(commands[0][2]).toBe(TELNET_OPTIONS.SUPPRESS_GO_AHEAD);

      // WILL SUPPRESS_GO_AHEAD
      expect(commands[1][1]).toBe(TELNET_COMMANDS.WILL);
      expect(commands[1][2]).toBe(TELNET_OPTIONS.SUPPRESS_GO_AHEAD);

      // WILL ECHO
      expect(commands[2][1]).toBe(TELNET_COMMANDS.WILL);
      expect(commands[2][2]).toBe(TELNET_OPTIONS.ECHO);
    });

    it('should exit raw mode', () => {
      const commands = TelnetCommandBuilder.exitRawMode();

      expect(commands).toHaveLength(3);

      // DONT SUPPRESS_GO_AHEAD
      expect(commands[0][1]).toBe(TELNET_COMMANDS.DONT);
      expect(commands[0][2]).toBe(TELNET_OPTIONS.SUPPRESS_GO_AHEAD);

      // WONT SUPPRESS_GO_AHEAD
      expect(commands[1][1]).toBe(TELNET_COMMANDS.WONT);
      expect(commands[1][2]).toBe(TELNET_OPTIONS.SUPPRESS_GO_AHEAD);

      // WONT ECHO
      expect(commands[2][1]).toBe(TELNET_COMMANDS.WONT);
      expect(commands[2][2]).toBe(TELNET_OPTIONS.ECHO);
    });
  });

  describe('command structure validation', () => {
    it('all commands should start with IAC', () => {
      const commands = [
        TelnetCommandBuilder.will(TELNET_OPTIONS.ECHO),
        TelnetCommandBuilder.wont(TELNET_OPTIONS.ECHO),
        TelnetCommandBuilder.do(TELNET_OPTIONS.ECHO),
        TelnetCommandBuilder.dont(TELNET_OPTIONS.ECHO),
        TelnetCommandBuilder.requestWindowSize(),
        TelnetCommandBuilder.enableEcho(),
        TelnetCommandBuilder.disableEcho(),
      ];

      commands.forEach((cmd) => {
        expect(cmd[0]).toBe(TELNET_COMMANDS.IAC);
      });
    });

    it('all simple commands should be 3 bytes', () => {
      const commands = [
        TelnetCommandBuilder.will(TELNET_OPTIONS.ECHO),
        TelnetCommandBuilder.wont(TELNET_OPTIONS.ECHO),
        TelnetCommandBuilder.do(TELNET_OPTIONS.NAWS),
        TelnetCommandBuilder.dont(TELNET_OPTIONS.LINEMODE),
      ];

      commands.forEach((cmd) => {
        expect(cmd).toHaveLength(3);
      });
    });
  });
});
