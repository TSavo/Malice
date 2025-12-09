import { Socket } from 'net';
import { EventEmitter } from 'events';

/**
 * Simple telnet client for integration testing
 * Handles telnet protocol basics and provides async/await interface
 */
export class TelnetTestClient extends EventEmitter {
  private socket: Socket;
  private buffer = '';
  private connected = false;
  private responseQueue: Array<(data: string) => void> = [];

  constructor(private host: string = 'localhost', private port: number = 5555) {
    super();
    this.socket = new Socket();
  }

  /**
   * Connect to the telnet server
   */
  async connect(timeout = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Connection timeout after ${timeout}ms`));
      }, timeout);

      this.socket.connect(this.port, this.host, () => {
        clearTimeout(timer);
        this.connected = true;
      });

      this.socket.on('data', (data: Buffer) => {
        // Strip telnet control sequences (IAC commands)
        const text = this.stripTelnetCommands(data);
        this.buffer += text;
        this.emit('data', text);

        // Resolve pending waitFor calls
        if (this.responseQueue.length > 0) {
          const resolver = this.responseQueue[0];
          resolver(this.buffer);
        }
      });

      this.socket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      this.socket.on('close', () => {
        this.connected = false;
        this.emit('close');
      });

      // Wait for initial welcome message
      this.socket.once('data', () => {
        clearTimeout(timer);
        // Give a moment for full welcome to arrive
        setTimeout(() => {
          resolve(this.buffer);
        }, 100);
      });
    });
  }

  /**
   * Strip telnet IAC commands from buffer
   */
  private stripTelnetCommands(data: Buffer): string {
    const result: number[] = [];
    let i = 0;

    while (i < data.length) {
      if (data[i] === 0xff) { // IAC
        i++; // Skip IAC
        if (i >= data.length) break;

        const cmd = data[i];
        if (cmd >= 0xfb && cmd <= 0xfe) {
          // WILL, WONT, DO, DONT - skip option byte
          i += 2;
        } else if (cmd === 0xfa) {
          // SB - skip until SE
          while (i < data.length && !(data[i] === 0xff && data[i + 1] === 0xf0)) {
            i++;
          }
          i += 2; // Skip IAC SE
        } else {
          i++; // Skip command byte
        }
      } else {
        result.push(data[i]);
        i++;
      }
    }

    return Buffer.from(result).toString('utf8');
  }

  /**
   * Send a line to the server
   */
  send(text: string): void {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    this.socket.write(text + '\r\n');
  }

  /**
   * Send raw text without line ending
   */
  sendRaw(text: string): void {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    this.socket.write(text);
  }

  /**
   * Wait for output containing a specific string
   */
  async waitFor(pattern: string | RegExp, timeout = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.responseQueue.shift();
        reject(new Error(`Timeout waiting for: ${pattern}\nBuffer: ${this.buffer}`));
      }, timeout);

      const check = (buffer: string): boolean => {
        if (typeof pattern === 'string') {
          return buffer.includes(pattern);
        }
        return pattern.test(buffer);
      };

      // Check if already in buffer
      if (check(this.buffer)) {
        clearTimeout(timer);
        resolve(this.buffer);
        return;
      }

      // Wait for more data
      const resolver = (buffer: string) => {
        if (check(buffer)) {
          clearTimeout(timer);
          this.responseQueue.shift();
          resolve(buffer);
        }
      };

      this.responseQueue.push(resolver);
    });
  }

  /**
   * Wait for a short delay and return current buffer
   */
  async wait(ms = 100): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.buffer);
      }, ms);
    });
  }

  /**
   * Clear the buffer
   */
  clearBuffer(): void {
    this.buffer = '';
  }

  /**
   * Get current buffer contents
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.connected) {
      this.socket.end();
      this.connected = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
