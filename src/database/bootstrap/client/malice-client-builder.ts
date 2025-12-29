import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Builds the MaliceClient class client module
 *
 * Creates $.maliceClientJs which serves /js/malice-client.js
 * Handles multiplexed WebSocket connection and channel routing.
 */
export class MaliceClientBuilder {
  static readonly alias = 'maliceClientJs';

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<RuntimeObject> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('ObjectManager not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    let obj: RuntimeObject | null = null;

    if (aliases[MaliceClientBuilder.alias]) {
      obj = await this.manager.load(aliases[MaliceClientBuilder.alias]);
      if (obj && !forceRebuild) {
        console.log(
          `[MaliceClientBuilder] Using existing $.${MaliceClientBuilder.alias}`,
        );
        return obj;
      }
    }

    if (!obj) {
      const root = await this.manager.load(1);
      obj = await this.manager.create({
        parent: root!,
        properties: {
          name: 'MaliceClient JS Module',
          description: 'Multiplexed WebSocket client',
        },
        methods: {},
      });

      await objectManager.call('addAlias', MaliceClientBuilder.alias, obj.id);
    }

    obj.setMethod(
      'getScript',
      `
      return \`
/**
 * MaliceClient - Multiplexed WebSocket client for Malice MOO
 * Handles channel-based communication with the game server.
 */
export class MaliceClient {
  constructor(url, windowManager) {
    this.url = url;
    this.wm = windowManager;
    this.ws = null;
    this.handlers = new Map();
    this.state = {
      room: null,
      inventory: [],
      stats: {},
      exits: []
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    // Register built-in channel handlers
    this.on('game', (data) => this.onGameMessage(data));
    this.on('ctrl', (data) => this.onCtrlMessage(data));
    this.on('state', (data) => this.onStateMessage(data));
    this.on('wm', (data) => this.onWmMessage(data));
    this.on('error', (data) => this.onErrorMessage(data));
  }

  connect() {
    this.updateStatus('connecting');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.updateStatus('connected');
      this.reconnectAttempts = 0;

      // Signal ready
      this.send('ctrl', { type: 'ready' });
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      this.updateStatus('disconnected');

      // Write to main terminal if exists
      const mainTerm = this.wm?.getWindow('terminal-main');
      if (mainTerm?.terminal) {
        mainTerm.terminal.write('\\\\r\\\\n\\\\x1b[31mDisconnected from server.\\\\x1b[0m\\\\r\\\\n');
      }

      // Attempt reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        if (mainTerm?.terminal) {
          mainTerm.terminal.write('\\\\x1b[33mReconnecting in ' + (delay/1000) + 's...\\\\x1b[0m\\\\r\\\\n');
        }
        setTimeout(() => this.connect(), delay);
      } else {
        if (mainTerm?.terminal) {
          mainTerm.terminal.write('\\\\x1b[31mMax reconnection attempts reached. Refresh to try again.\\\\x1b[0m\\\\r\\\\n');
        }
      }
    };

    this.ws.onerror = () => {
      this.updateStatus('error');
    };
  }

  updateStatus(state) {
    if (this.wm?.taskbar) {
      this.wm.taskbar.setStatus(state);
    }
  }

  handleMessage(data) {
    try {
      const msg = JSON.parse(data);
      const handler = this.handlers.get(msg.ch);
      if (handler) {
        handler(msg.p);
      } else if (msg.ch && msg.ch.startsWith('win:')) {
        // Route to window manager for window-specific channels
        this.wm?.routeChannelData(msg.ch, msg.p);
      } else {
        console.log('[MaliceClient] Unhandled channel:', msg.ch, msg.p);
      }
    } catch (e) {
      // Not JSON - treat as raw text for backwards compat
      // Write to main terminal
      const mainTerm = this.wm?.getWindow('terminal-main');
      if (mainTerm?.terminal) {
        mainTerm.terminal.write(data);
      }
    }
  }

  send(channel, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ ch: channel, t: 'data', p: payload }));
    }
  }

  sendCommand(text) {
    this.send('game', text);
  }

  on(channel, handler) {
    this.handlers.set(channel, handler);
  }

  // Built-in channel handlers

  onGameMessage(data) {
    // Route game channel to main terminal window
    const mainTerm = this.wm?.getWindow('terminal-main');
    if (mainTerm) {
      mainTerm.onChannelData(data);
    }
  }

  onCtrlMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'prompt':
        // Could update a prompt indicator
        break;
      case 'mode':
        console.log('[MaliceClient] Mode:', msg.mode);
        break;
      default:
        console.log('[MaliceClient] Ctrl:', msg);
    }
  }

  onStateMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    // Store state
    if (msg.type && msg.data !== undefined) {
      this.state[msg.type] = msg.data;
    }

    // Emit event for UI components
    document.dispatchEvent(new CustomEvent('moo-state', { detail: msg }));

    console.log('[MaliceClient] State:', msg.type, msg.data);
  }

  onWmMessage(msg) {
    // Route to window manager
    if (this.wm) {
      this.wm.handleWmMessage(msg);
    }
  }

  onErrorMessage(msg) {
    console.error('[MaliceClient] Error:', msg);
    const mainTerm = this.wm?.getWindow('terminal-main');
    if (mainTerm?.terminal && msg?.message) {
      mainTerm.terminal.write('\\\\r\\\\n\\\\x1b[31mError: ' + msg.message + '\\\\x1b[0m\\\\r\\\\n');
    }
  }
}
\`;
    `,
    );

    obj.setMethod(
      'handleRequest',
      `
      const script = await self.getScript();
      return {
        status: 200,
        contentType: 'application/javascript',
        body: script,
        headers: { 'Cache-Control': 'public, max-age=3600' }
      };
    `,
    );

    console.log(
      `[MaliceClientBuilder] Built $.${MaliceClientBuilder.alias} -> #${obj.id}`,
    );
    return obj;
  }
}
