import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Socket } from 'net';
import { EventEmitter } from 'events';

// We need to test TelnetTransport's line buffering behavior
// Since TelnetTransport wraps a socket, we'll mock the socket

class MockSocket extends EventEmitter {
  writable = true;
  remoteAddress = '127.0.0.1';
  remotePort = 12345;

  written: Buffer[] = [];

  write(data: Buffer | string, encoding?: BufferEncoding): boolean {
    if (typeof data === 'string') {
      this.written.push(Buffer.from(data, encoding));
    } else {
      this.written.push(data);
    }
    return true;
  }

  end(): void {
    this.emit('end');
  }

  destroy(): void {
    this.emit('close');
  }
}

// Import after mocking
import { TelnetTransport } from '../src/transport/telnet/telnet-transport.js';

describe('TelnetTransport line buffering', () => {
  let mockSocket: MockSocket;
  let transport: TelnetTransport;
  let receivedInputs: string[];

  beforeEach(() => {
    mockSocket = new MockSocket();
    transport = new TelnetTransport(mockSocket as unknown as Socket);
    receivedInputs = [];

    // Subscribe to input
    transport.input$.subscribe((input) => {
      receivedInputs.push(input);
    });
  });

  describe('line ending normalization', () => {
    it('should emit line when receiving \\r\\n', async () => {
      mockSocket.emit('data', Buffer.from('hello\r\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedInputs).toHaveLength(1);
      expect(receivedInputs[0]).toBe('hello');
    });

    it('should emit line when receiving just \\n', async () => {
      mockSocket.emit('data', Buffer.from('hello\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedInputs).toHaveLength(1);
      expect(receivedInputs[0]).toBe('hello');
    });

    it('should emit line when receiving just \\r (after next packet)', async () => {
      // Send line ending with just \r
      mockSocket.emit('data', Buffer.from('hello\r'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // \r at end is held in buffer waiting for possible \n
      expect(receivedInputs).toHaveLength(0);

      // Send something else - the \r should be processed as line ending
      mockSocket.emit('data', Buffer.from('world\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedInputs).toHaveLength(2);
      expect(receivedInputs[0]).toBe('hello');
      expect(receivedInputs[1]).toBe('world');
    });

    it('should handle \\r\\n split across packets', async () => {
      // First packet ends with \r
      mockSocket.emit('data', Buffer.from('hello\r'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // \r at end is held
      expect(receivedInputs).toHaveLength(0);

      // Second packet starts with \n (completing \r\n)
      mockSocket.emit('data', Buffer.from('\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should emit single line, not two
      expect(receivedInputs).toHaveLength(1);
      expect(receivedInputs[0]).toBe('hello');
    });
  });

  describe('multiple lines', () => {
    it('should emit multiple lines from single packet', async () => {
      mockSocket.emit('data', Buffer.from('line1\r\nline2\r\nline3\r\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedInputs).toHaveLength(3);
      expect(receivedInputs[0]).toBe('line1');
      expect(receivedInputs[1]).toBe('line2');
      expect(receivedInputs[2]).toBe('line3');
    });

    it('should handle incomplete line at end', async () => {
      mockSocket.emit('data', Buffer.from('line1\r\nincomplete'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Only complete line is emitted
      expect(receivedInputs).toHaveLength(1);
      expect(receivedInputs[0]).toBe('line1');

      // Complete the line in next packet
      mockSocket.emit('data', Buffer.from(' data\r\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedInputs).toHaveLength(2);
      expect(receivedInputs[1]).toBe('incomplete data');
    });
  });

  describe('empty lines', () => {
    it('should emit empty string for blank line', async () => {
      mockSocket.emit('data', Buffer.from('\r\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedInputs).toHaveLength(1);
      expect(receivedInputs[0]).toBe('');
    });

    it('should emit multiple empty lines', async () => {
      mockSocket.emit('data', Buffer.from('\r\n\r\n\r\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedInputs).toHaveLength(3);
      expect(receivedInputs[0]).toBe('');
      expect(receivedInputs[1]).toBe('');
      expect(receivedInputs[2]).toBe('');
    });

    it('should emit empty line between content', async () => {
      mockSocket.emit('data', Buffer.from('before\r\n\r\nafter\r\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedInputs).toHaveLength(3);
      expect(receivedInputs[0]).toBe('before');
      expect(receivedInputs[1]).toBe('');
      expect(receivedInputs[2]).toBe('after');
    });
  });

  describe('PuTTY-style input simulation', () => {
    it('should handle typical PuTTY password entry', async () => {
      // User types "password" and presses Enter
      // PuTTY sends: password\r\n (often in one packet)
      mockSocket.emit('data', Buffer.from('password\r\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedInputs).toHaveLength(1);
      expect(receivedInputs[0]).toBe('password');
    });

    it('should handle character-by-character typing with final enter', async () => {
      // Simulate slow typing (though usually buffered)
      mockSocket.emit('data', Buffer.from('p'));
      mockSocket.emit('data', Buffer.from('a'));
      mockSocket.emit('data', Buffer.from('s'));
      mockSocket.emit('data', Buffer.from('s'));
      mockSocket.emit('data', Buffer.from('\r\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // In line mode, only complete lines are emitted
      expect(receivedInputs).toHaveLength(1);
      expect(receivedInputs[0]).toBe('pass');
    });

    it('should not double-emit for \\r\\n as single sequence', async () => {
      // This was the original bug - \r\n was causing two line emissions
      mockSocket.emit('data', Buffer.from('test\r\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Must be exactly 1, not 2
      expect(receivedInputs).toHaveLength(1);
      expect(receivedInputs[0]).toBe('test');
    });

    it('should handle menu selection (number + enter)', async () => {
      mockSocket.emit('data', Buffer.from('1\r\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedInputs).toHaveLength(1);
      expect(receivedInputs[0]).toBe('1');
    });

    it('should handle yes/no response', async () => {
      mockSocket.emit('data', Buffer.from('yes\r\n'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(receivedInputs).toHaveLength(1);
      expect(receivedInputs[0]).toBe('yes');
    });
  });
});
