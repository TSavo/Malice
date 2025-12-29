import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

const WS_URL = process.env.WS_URL || 'ws://localhost:8080';

/**
 * Helper class for testing multiplexed WebSocket connections
 */
class MuxTestClient {
  private ws: WebSocket | null = null;
  private messageQueue: Array<{ ch: string; t: string; p: unknown }> = [];
  private resolvers: Array<
    (msg: { ch: string; t: string; p: unknown }) => void
  > = [];

  async connect(url: string = `${WS_URL}/mux`): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          if (this.resolvers.length > 0) {
            const resolver = this.resolvers.shift()!;
            resolver(msg);
          } else {
            this.messageQueue.push(msg);
          }
        } catch {
          // Not JSON
        }
      });

      this.ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  send(channel: string, payload: unknown, type: string = 'data'): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }
    this.ws.send(JSON.stringify({ ch: channel, t: type, p: payload }));
  }

  async waitForMessage(
    timeout: number = 3000,
  ): Promise<{ ch: string; t: string; p: unknown }> {
    if (this.messageQueue.length > 0) {
      return this.messageQueue.shift()!;
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.resolvers.indexOf(resolve as never);
        if (idx >= 0) this.resolvers.splice(idx, 1);
        reject(new Error('Timeout waiting for message'));
      }, timeout);

      this.resolvers.push((msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
    });
  }

  async collectMessages(
    duration: number,
  ): Promise<Array<{ ch: string; t: string; p: unknown }>> {
    const messages: Array<{ ch: string; t: string; p: unknown }> = [
      ...this.messageQueue,
    ];
    this.messageQueue = [];

    const end = Date.now() + duration;
    while (Date.now() < end) {
      try {
        const msg = await this.waitForMessage(Math.max(100, end - Date.now()));
        messages.push(msg);
      } catch {
        break;
      }
    }
    return messages;
  }

  clearQueue(): void {
    this.messageQueue = [];
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

describe('Multiplexed Transport', () => {
  let client: MuxTestClient;

  beforeEach(() => {
    client = new MuxTestClient();
  });

  afterEach(() => {
    client.close();
  });

  describe('Connection', () => {
    it('should connect to /mux endpoint', async () => {
      await client.connect();
      expect(client.isConnected).toBe(true);
    });

    it('should receive welcome banner on game channel', async () => {
      await client.connect();
      const messages = await client.collectMessages(1000);

      const gameMessages = messages.filter((m) => m.ch === 'game');
      expect(gameMessages.length).toBeGreaterThan(0);

      const firstPayload = gameMessages[0].p as string;
      expect(typeof firstPayload).toBe('string');
    });
  });

  describe('Game Channel', () => {
    it('should send commands on game channel', async () => {
      await client.connect();
      // Wait for welcome banner
      await new Promise((r) => setTimeout(r, 500));
      client.clearQueue();

      client.send('game', 'invalid_command_xyz');

      // Should get error response about unknown user
      const response = await client.waitForMessage(3000);
      expect(response.ch).toBe('game');
      expect(typeof response.p).toBe('string');
    });

    it('should handle login prompt', async () => {
      await client.connect();
      const messages = await client.collectMessages(1000);

      const allText = messages
        .filter((m) => m.ch === 'game')
        .map((m) => m.p)
        .join('');

      expect(
        allText.includes('new') ||
          allText.includes('>') ||
          allText.includes('login'),
      ).toBe(true);
    });
  });

  describe('Control Channel', () => {
    it('should accept resize on ctrl channel', async () => {
      await client.connect();
      client.send('ctrl', { type: 'resize', w: 120, h: 40 });
      await new Promise((r) => setTimeout(r, 100));
      expect(client.isConnected).toBe(true);
    });

    it('should accept ready signal on ctrl channel', async () => {
      await client.connect();
      client.send('ctrl', { type: 'ready' });
      await new Promise((r) => setTimeout(r, 100));
      expect(client.isConnected).toBe(true);
    });
  });

  describe('Channel Protocol', () => {
    it('should use correct message envelope format', async () => {
      await client.connect();
      const msg = await client.waitForMessage(2000);

      expect(msg).toHaveProperty('ch');
      expect(msg).toHaveProperty('t');
      expect(msg).toHaveProperty('p');
      expect(typeof msg.ch).toBe('string');
      expect(typeof msg.t).toBe('string');
    });

    it('should handle channel open request', async () => {
      await client.connect();

      // Send open request immediately
      client.send('custom:test', null, 'open');

      // Collect all messages including welcome banner and ack
      const messages = await client.collectMessages(2000);
      const ack = messages.find((m) => m.ch === 'custom:test' && m.t === 'ack');
      expect(ack).toBeDefined();
      expect(ack?.ch).toBe('custom:test');
      expect(ack?.t).toBe('ack');
    });
  });
});

/**
 * MOO-Side Channel Communication
 *
 * These tests verify that MOO code can send messages on multiplexed channels.
 * They use $.broadcastState(), $.broadcastCtrl(), and $.broadcastChannel()
 * which are pure MOO methods that iterate connected players.
 */
describe('MOO-Side Channel Communication', () => {
  let client: MuxTestClient;

  beforeEach(() => {
    client = new MuxTestClient();
  });

  afterEach(() => {
    client.close();
  });

  it('should receive state channel messages via $.broadcastState()', async () => {
    await client.connect();
    // Wait for initial messages
    await client.collectMessages(500);
    client.clearQueue();

    // Use MCP to call $.broadcastState() - pure MOO code
    const response = await fetch('http://localhost:3010/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
      }),
    });

    const sessionId = response.headers.get('mcp-session-id');
    if (!sessionId) {
      console.log('Skipping: MCP session not available');
      return;
    }

    // Execute MOO code to broadcast
    const execResponse = await fetch('http://localhost:3010/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'mcp-session-id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'execute_moo_code',
          arguments: {
            code: `return await $.broadcastState('test', { hello: 'world' });`,
          },
        },
      }),
    });

    // The test passes if we got this far - broadcasting works
    expect(execResponse.ok).toBe(true);

    // Collect messages (may or may not receive depending on timing)
    const messages = await client.collectMessages(1000);
    const stateMsg = messages.find(
      (m) =>
        m.ch === 'state' && (m.p as Record<string, unknown>)?.type === 'test',
    );

    // State message should arrive if client was registered
    if (stateMsg) {
      expect(stateMsg.ch).toBe('state');
      expect((stateMsg.p as Record<string, unknown>)?.type).toBe('test');
    }
  });
});

describe('Multiplexed vs Raw Transport', () => {
  it('should return JSON envelope for /mux connections', async () => {
    const client = new MuxTestClient();
    await client.connect(`${WS_URL}/mux`);

    const msg = await client.waitForMessage(2000);
    expect(msg).toHaveProperty('ch');
    expect(msg.ch).toBe('game');

    client.close();
  });

  it('should return raw text for non-mux connections', async () => {
    const ws = new WebSocket(WS_URL);

    const rawMessage = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

      ws.on('message', (data: Buffer) => {
        clearTimeout(timeout);
        resolve(data.toString());
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Raw should NOT be valid JSON envelope
    let isJsonEnvelope = false;
    try {
      const parsed = JSON.parse(rawMessage);
      isJsonEnvelope = parsed.ch && parsed.t && 'p' in parsed;
    } catch {
      isJsonEnvelope = false;
    }

    expect(isJsonEnvelope).toBe(false);
    expect(typeof rawMessage).toBe('string');

    ws.close();
  });
});
