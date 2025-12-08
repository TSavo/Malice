/**
 * MCP Telnet Client - manages telnet sessions for MCP tools
 * Each session represents a player connection to the MOO
 */

import { Socket } from 'net';

export interface TelnetSession {
  socket: Socket;
  buffer: string[];
  log: string[];        // full session log (last 1000 lines)
  connected: boolean;
  closed: boolean;
  onData?: (sessionId: string, data: string) => void;  // callback for push notifications
}

/**
 * Manages multiple telnet sessions for MCP
 */
export class MCPTelnetClient {
  private sessions = new Map<string, TelnetSession>();
  private sessionCounter = 0;

  constructor(
    private host: string = 'localhost',
    private port: number = 5555
  ) {}

  /**
   * Create a new telnet session
   * Connects to the MOO and returns the welcome message
   * @param onData Optional callback for push notifications when data arrives
   */
  async connect(onData?: (sessionId: string, data: string) => void): Promise<{ sessionId: string; output: string }> {
    const sessionId = `mcp-telnet-${++this.sessionCounter}`;

    return new Promise((resolve, reject) => {
      const socket = new Socket();
      const session: TelnetSession = {
        socket,
        buffer: [],
        log: [],
        connected: false,
        closed: false,
        onData,
      };

      const timeout = setTimeout(() => {
        if (!session.connected) {
          socket.destroy();
          reject(new Error('Connection timeout'));
        }
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        session.connected = true;
        this.sessions.set(sessionId, session);
      });

      socket.on('data', (data: Buffer) => {
        // Strip telnet protocol bytes (IAC sequences)
        const text = this.stripTelnet(data);
        if (text) {
          session.buffer.push(text);
          // Add to log, keeping last 1000 lines
          const lines = text.split(/\r?\n/);
          session.log.push(...lines);
          if (session.log.length > 1000) {
            session.log = session.log.slice(-1000);
          }
          // Push notification callback
          if (session.onData) {
            session.onData(sessionId, text);
          }
        }
      });

      socket.on('close', () => {
        session.closed = true;
        session.connected = false;
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        session.closed = true;
        session.connected = false;
        if (!session.connected) {
          reject(err);
        }
      });

      // Connect to MOO
      socket.connect(this.port, this.host, () => {
        // Wait for welcome message
        setTimeout(() => {
          const output = this.drainBuffer(sessionId);
          resolve({ sessionId, output });
        }, 500);
      });
    });
  }

  /**
   * Send a command to an existing session
   * Returns accumulated output after a short wait
   */
  async send(sessionId: string, text: string): Promise<{ output: string; closed: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (session.closed) {
      return { output: '', closed: true };
    }

    // Send the command with CRLF
    session.socket.write(text + '\r\n');

    // Wait for response
    await this.wait(500);

    const output = this.drainBuffer(sessionId);
    return { output, closed: session.closed };
  }

  /**
   * Close a session
   */
  close(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.socket.destroy();
      session.closed = true;
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Get session status
   */
  getStatus(sessionId: string): { exists: boolean; connected: boolean; closed: boolean; bufferSize: number } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { exists: false, connected: false, closed: true, bufferSize: 0 };
    }
    return {
      exists: true,
      connected: session.connected,
      closed: session.closed,
      bufferSize: session.buffer.length,
    };
  }

  /**
   * Get session log (last 1000 lines)
   */
  getLog(sessionId: string, lines?: number): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '';

    const logLines = lines ? session.log.slice(-lines) : session.log;
    return logLines.join('\n');
  }

  /**
   * List all active sessions
   */
  listSessions(): string[] {
    return Array.from(this.sessions.keys()).filter(id => {
      const session = this.sessions.get(id);
      return session && !session.closed;
    });
  }

  /**
   * Drain and return all buffered output
   */
  private drainBuffer(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '';

    const output = session.buffer.join('');
    session.buffer = [];
    return output;
  }

  /**
   * Strip telnet protocol sequences from data
   */
  private stripTelnet(data: Buffer): string {
    const result: number[] = [];
    let i = 0;

    while (i < data.length) {
      // IAC (255) starts a telnet command
      if (data[i] === 255) {
        i++; // skip IAC
        if (i >= data.length) break;

        const cmd = data[i];
        i++; // skip command

        // WILL, WONT, DO, DONT have one option byte
        if (cmd >= 251 && cmd <= 254) {
          i++; // skip option
        }
        // SB (subnegotiation) - skip until IAC SE
        else if (cmd === 250) {
          while (i < data.length - 1) {
            if (data[i] === 255 && data[i + 1] === 240) {
              i += 2; // skip IAC SE
              break;
            }
            i++;
          }
        }
        // Other commands (like IAC IAC = literal 255)
        else if (cmd === 255) {
          result.push(255);
        }
        // Skip other single-byte commands
      } else {
        result.push(data[i]);
        i++;
      }
    }

    return Buffer.from(result).toString('utf8');
  }

  /**
   * Wait for a specified time
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
