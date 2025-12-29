import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Builds the TerminalWindow class client module
 *
 * Creates $.terminalWindowJs which serves /js/terminal-window.js
 * Extends Window with xterm.js integration.
 */
export class TerminalWindowBuilder {
  static readonly alias = 'terminalWindowJs';

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<RuntimeObject> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('ObjectManager not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    let obj: RuntimeObject | null = null;

    if (aliases[TerminalWindowBuilder.alias]) {
      obj = await this.manager.load(aliases[TerminalWindowBuilder.alias]);
      if (obj && !forceRebuild) {
        console.log(
          `[TerminalWindowBuilder] Using existing $.${TerminalWindowBuilder.alias}`,
        );
        return obj;
      }
    }

    if (!obj) {
      const root = await this.manager.load(1);
      obj = await this.manager.create({
        parent: root!,
        properties: {
          name: 'TerminalWindow JS Module',
          description: 'Terminal window with xterm.js',
        },
        methods: {},
      });

      await objectManager.call(
        'addAlias',
        TerminalWindowBuilder.alias,
        obj.id,
      );
    }

    obj.setMethod(
      'getScript',
      `
      return \`
import { Window } from '/js/window.js';

/**
 * TerminalWindow - Window with xterm.js terminal
 * Extends base Window with terminal functionality.
 */
export class TerminalWindow extends Window {
  constructor(wm, config) {
    super(wm, config);
    this.terminal = null;
    this.fitAddon = null;
    this.boundChannel = null;
  }

  /**
   * Initialize terminal (called after render)
   */
  async initTerminal(Terminal, FitAddon, WebLinksAddon) {
    // Create terminal
    this.terminal = new Terminal({
      fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: '#0d0d0d',
        foreground: '#e0e0e0',
        cursor: '#00ff88',
        cursorAccent: '#0d0d0d',
        selection: 'rgba(0, 255, 136, 0.3)',
        black: '#0d0d0d',
        red: '#ff6666',
        green: '#00ff88',
        yellow: '#ffcc00',
        blue: '#6699ff',
        magenta: '#ff66ff',
        cyan: '#66ffff',
        white: '#e0e0e0',
        brightBlack: '#666666',
        brightRed: '#ff9999',
        brightGreen: '#66ffaa',
        brightYellow: '#ffdd66',
        brightBlue: '#99bbff',
        brightMagenta: '#ff99ff',
        brightCyan: '#99ffff',
        brightWhite: '#ffffff'
      },
      cursorBlink: true,
      allowTransparency: false,
      scrollback: 5000
    });

    // Add fit addon
    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    // Add web links addon
    const webLinksAddon = new WebLinksAddon();
    this.terminal.loadAddon(webLinksAddon);

    // Open terminal in content area
    this.terminal.open(this.content);

    // Fit to window
    setTimeout(() => {
      this.fitAddon.fit();
    }, 0);

    // Handle terminal input
    this.terminal.onData((data) => {
      if (this.wm?.client) {
        // Send through bound channel
        this.wm.client.send(this.boundChannel || 'game', data);
      }
    });
  }

  /**
   * Bind to a channel for I/O
   */
  bindChannel(channel) {
    this.boundChannel = channel;
  }

  /**
   * Handle channel data
   */
  onChannelData(data) {
    if (this.terminal) {
      if (typeof data === 'string') {
        this.terminal.write(data);
      } else if (data && typeof data === 'object') {
        // Handle structured terminal data
        if (data.text) {
          this.terminal.write(data.text);
        }
        if (data.clear) {
          this.terminal.clear();
        }
        if (data.reset) {
          this.terminal.reset();
        }
      }
    }
  }

  /**
   * Handle resize
   */
  onResize() {
    if (this.fitAddon) {
      setTimeout(() => {
        this.fitAddon.fit();
        // Report new dimensions to server
        if (this.terminal && this.wm?.client) {
          this.wm.client.send('ctrl', {
            type: 'resize',
            cols: this.terminal.cols,
            rows: this.terminal.rows
          });
        }
      }, 0);
    }
  }

  /**
   * Focus terminal when window focuses
   */
  focus() {
    super.focus();
    if (this.terminal) {
      this.terminal.focus();
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
      `[TerminalWindowBuilder] Built $.${TerminalWindowBuilder.alias} -> #${obj.id}`,
    );
    return obj;
  }
}
