import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the TerminalWindow class client module
 *
 * Creates $.terminalWindowJs which serves /js/terminal-window.js
 * Extends Window with xterm.js integration.
 */
export class TerminalWindowBuilder implements Builder {
  static provides = ['terminalWindowJs'];
  static depends = ['root'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const $ = this.manager as any;

    if ($.terminalWindowJs && !forceRebuild) {
      this.obj = $.terminalWindowJs;
      return;
    }

    const parentObj = $.root;
    if (!parentObj) throw new Error('TerminalWindowBuilder: $root not found');

    this.obj = await this.manager.create({
      parent: parentObj,
      properties: {
        name: 'TerminalWindow JS Module',
        description: 'Terminal window with xterm.js',
      },
      methods: {},
    });

    const obj = this.obj;

    obj.setMethod(
      'getScript',
      `
      return \`
import { Window } from '/js/window';

/**
 * TerminalWindow - Window with xterm.js terminal output + dedicated input area
 * Terminal is output-only, input field at bottom handles commands.
 */
export class TerminalWindow extends Window {
  constructor(wm, config) {
    super(wm, config);
    this.terminal = null;
    this.fitAddon = null;
    this.boundChannel = null;
    this.inputArea = null;
    this.inputField = null;
    this.terminalContainer = null;

    // Command history
    this.history = [];
    this.historyIndex = -1;
    this.savedInput = '';

    // Output buffer for restore after close
    this.outputBuffer = '';
    this.maxBufferSize = 100000; // ~100KB of text
  }

  /**
   * Initialize terminal (called after render)
   */
  async initTerminal(Terminal, FitAddon, WebLinksAddon) {
    // Restructure content area: terminal on top, input at bottom
    this.content.style.display = 'flex';
    this.content.style.flexDirection = 'column';

    // Terminal container (takes remaining space)
    this.terminalContainer = document.createElement('div');
    this.terminalContainer.style.cssText = 'flex: 1; min-height: 0; overflow: hidden;';
    this.content.appendChild(this.terminalContainer);

    // Input area at bottom
    this.inputArea = document.createElement('div');
    this.inputArea.style.cssText = 'display: flex; align-items: center; padding: 4px 8px; background: #1a1a1a; border-top: 1px solid var(--theme-border, #333); gap: 8px;';

    // Input field
    this.inputField = document.createElement('input');
    this.inputField.type = 'text';
    this.inputField.className = 'terminal-input';
    this.inputField.style.cssText = 'flex: 1; background: var(--theme-surface, #0d0d0d); border: 1px solid var(--theme-border, #333); border-radius: 3px; padding: 6px 10px; color: #e0e0e0; font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Monaco, "Courier New", monospace; font-size: 14px; outline: none;';
    this.inputField.placeholder = 'Enter command...';
    this.inputArea.appendChild(this.inputField);

    // Inject focus styles via stylesheet
    if (!document.getElementById('terminal-input-styles')) {
      const focusStyle = document.createElement('style');
      focusStyle.id = 'terminal-input-styles';
      focusStyle.textContent = '.terminal-input:focus { border-color: var(--theme-accent, #00ff88) !important; }';
      document.head.appendChild(focusStyle);
    }

    // Send button
    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Send';
    sendBtn.style.cssText = 'background: var(--theme-accent, #00ff88); color: var(--theme-bg, #0a0a0a); border: none; border-radius: 3px; padding: 6px 12px; font-family: monospace; font-weight: bold; cursor: pointer; filter: brightness(1); transition: filter 0.15s;';
    sendBtn.onmouseenter = () => sendBtn.style.filter = 'brightness(0.85)';
    sendBtn.onmouseleave = () => sendBtn.style.filter = 'brightness(1)';
    sendBtn.addEventListener('click', () => this._sendCommand());
    this.inputArea.appendChild(sendBtn);

    this.content.appendChild(this.inputArea);

    // Input field key handler
    this.inputField.addEventListener('keydown', (e) => this._handleInputKey(e));

    // Get theme from template (or use defaults)
    const theme = window.MALICE_THEME || {};
    const bg = theme.surface || '#0d0d0d';
    const selection = theme.selection || 'rgba(0, 255, 136, 0.3)';

    // Create terminal with standard ANSI colors
    // Only background and selection are themed - ANSI colors stay semantic
    this.terminal = new Terminal({
      fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: bg,
        foreground: '#e0e0e0',
        cursor: bg,
        cursorAccent: bg,
        selection: selection,
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
      cursorBlink: false,
      disableStdin: true,
      allowTransparency: false,
      scrollback: 5000
    });

    // Add fit addon
    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    // Add web links addon
    const webLinksAddon = new WebLinksAddon();
    this.terminal.loadAddon(webLinksAddon);

    // Open terminal in container
    this.terminal.open(this.terminalContainer);

    // Fit to container
    setTimeout(() => {
      this.fitAddon.fit();
    }, 0);

    // Click on terminal focuses input field
    this.terminalContainer.addEventListener('click', () => {
      this.inputField.focus();
    });
  }

  /**
   * Handle input field key events
   */
  _handleInputKey(e) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        this._sendCommand();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this._historyUp();
        break;

      case 'ArrowDown':
        e.preventDefault();
        this._historyDown();
        break;

      case 'Escape':
        // Clear input
        this.inputField.value = '';
        this.historyIndex = -1;
        break;

      case 'l':
        if (e.ctrlKey) {
          e.preventDefault();
          this.terminal.clear();
        }
        break;
    }
  }

  _historyUp() {
    if (this.history.length === 0) return;

    if (this.historyIndex === -1) {
      // Save current input
      this.savedInput = this.inputField.value;
      this.historyIndex = this.history.length - 1;
    } else if (this.historyIndex > 0) {
      this.historyIndex--;
    } else {
      return; // At oldest
    }

    this.inputField.value = this.history[this.historyIndex];
    // Move cursor to end
    this.inputField.selectionStart = this.inputField.selectionEnd = this.inputField.value.length;
  }

  _historyDown() {
    if (this.historyIndex === -1) return;

    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.inputField.value = this.history[this.historyIndex];
    } else {
      // Restore saved input
      this.historyIndex = -1;
      this.inputField.value = this.savedInput;
    }
    // Move cursor to end
    this.inputField.selectionStart = this.inputField.selectionEnd = this.inputField.value.length;
  }

  _sendCommand() {
    const command = this.inputField.value.trim();

    if (!command) return;

    // Echo command to terminal
    this._writeToTerminal(command + '\\\\r\\\\n');

    // Add to history if different from last
    if (this.history.length === 0 || this.history[this.history.length - 1] !== command) {
      this.history.push(command);
      // Limit history
      if (this.history.length > 100) {
        this.history.shift();
      }
    }

    // Reset state
    this.inputField.value = '';
    this.historyIndex = -1;

    // Send to server
    if (this.wm?.client) {
      this.wm.client.send(this.boundChannel || 'game', command);
    }
  }

  /**
   * Bind to a channel for I/O
   */
  bindChannel(channel) {
    this.boundChannel = channel;
  }

  /**
   * Write to terminal and buffer
   */
  _writeToTerminal(text) {
    if (this.terminal) {
      this.terminal.write(text);
    }
    // Save to buffer for restore
    this.outputBuffer += text;
    // Trim if too large (keep end)
    if (this.outputBuffer.length > this.maxBufferSize) {
      this.outputBuffer = this.outputBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Handle channel data
   */
  onChannelData(data) {
    if (typeof data === 'string') {
      this._writeToTerminal(data);
    } else if (data && typeof data === 'object') {
      // Handle structured terminal data
      if (data.text) {
        this._writeToTerminal(data.text);
      }
      if (data.clear) {
        if (this.terminal) this.terminal.clear();
        this.outputBuffer = '';
      }
      if (data.reset) {
        if (this.terminal) this.terminal.reset();
        this.outputBuffer = '';
      }
    }
  }

  /**
   * Restore buffer from saved state
   */
  restoreBuffer(buffer) {
    this.outputBuffer = buffer || '';
    if (this.terminal && this.outputBuffer) {
      this.terminal.write(this.outputBuffer);
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
   * Focus input field when window focuses
   */
  focus() {
    super.focus();
    if (this.inputField) {
      this.inputField.focus();
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

    console.log(`[TerminalWindowBuilder] Built $.terminalWindowJs -> #${obj.id}`);
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'terminalWindowJs', this.obj.id);
  }
}

// Self-register
registerBuilder(TerminalWindowBuilder);
