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

    // Line editing state
    this.inputBuffer = '';
    this.cursorPos = 0;
    this.history = [];
    this.historyIndex = -1;
    this.savedInput = '';
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

    // Handle terminal input with line buffering
    this.terminal.onData((data) => this._handleInput(data));
    this.terminal.onKey((e) => this._handleKey(e));
  }

  /**
   * Handle raw input data
   */
  _handleInput(data) {
    // Check for special sequences (handled in onKey)
    // Only process printable characters here
    for (const char of data) {
      const code = char.charCodeAt(0);
      // Printable ASCII and extended chars, but not control chars
      if (code >= 32 && code !== 127) {
        this._insertChar(char);
      }
    }
  }

  /**
   * Handle key events
   */
  _handleKey(e) {
    const key = e.domEvent.key;
    const ctrl = e.domEvent.ctrlKey;
    const shift = e.domEvent.shiftKey;

    switch (key) {
      case 'Enter':
        if (shift) {
          // Shift+Enter: insert newline in buffer
          this._insertChar('\\n');
          this.terminal.write('\\r\\n');
        } else {
          // Enter: send command
          this._sendCommand();
        }
        break;

      case 'Backspace':
        this._backspace();
        break;

      case 'Delete':
        this._delete();
        break;

      case 'ArrowLeft':
        if (ctrl) {
          this._wordLeft();
        } else {
          this._cursorLeft();
        }
        break;

      case 'ArrowRight':
        if (ctrl) {
          this._wordRight();
        } else {
          this._cursorRight();
        }
        break;

      case 'ArrowUp':
        this._historyUp();
        break;

      case 'ArrowDown':
        this._historyDown();
        break;

      case 'Home':
        this._cursorHome();
        break;

      case 'End':
        this._cursorEnd();
        break;

      case 'c':
        if (ctrl) {
          // Ctrl+C: cancel current input
          this.terminal.write('^C\\r\\n');
          this.inputBuffer = '';
          this.cursorPos = 0;
          this._showPrompt();
        }
        break;

      case 'l':
        if (ctrl) {
          // Ctrl+L: clear screen
          this.terminal.clear();
          this._redrawLine();
        }
        break;

      case 'u':
        if (ctrl) {
          // Ctrl+U: clear line before cursor
          this._clearLineBefore();
        }
        break;

      case 'k':
        if (ctrl) {
          // Ctrl+K: clear line after cursor
          this._clearLineAfter();
        }
        break;

      case 'a':
        if (ctrl) {
          // Ctrl+A: go to beginning
          this._cursorHome();
        }
        break;

      case 'e':
        if (ctrl) {
          // Ctrl+E: go to end
          this._cursorEnd();
        }
        break;
    }
  }

  _insertChar(char) {
    // Insert at cursor position
    this.inputBuffer =
      this.inputBuffer.slice(0, this.cursorPos) +
      char +
      this.inputBuffer.slice(this.cursorPos);
    this.cursorPos++;

    // Redraw from cursor
    this._redrawFromCursor();
  }

  _backspace() {
    if (this.cursorPos > 0) {
      this.inputBuffer =
        this.inputBuffer.slice(0, this.cursorPos - 1) +
        this.inputBuffer.slice(this.cursorPos);
      this.cursorPos--;
      this._redrawFromCursor(true);
    }
  }

  _delete() {
    if (this.cursorPos < this.inputBuffer.length) {
      this.inputBuffer =
        this.inputBuffer.slice(0, this.cursorPos) +
        this.inputBuffer.slice(this.cursorPos + 1);
      this._redrawFromCursor(true);
    }
  }

  _cursorLeft() {
    if (this.cursorPos > 0) {
      this.cursorPos--;
      this.terminal.write('\\x1b[D'); // Move cursor left
    }
  }

  _cursorRight() {
    if (this.cursorPos < this.inputBuffer.length) {
      this.cursorPos++;
      this.terminal.write('\\x1b[C'); // Move cursor right
    }
  }

  _wordLeft() {
    // Move to start of previous word
    while (this.cursorPos > 0 && this.inputBuffer[this.cursorPos - 1] === ' ') {
      this._cursorLeft();
    }
    while (this.cursorPos > 0 && this.inputBuffer[this.cursorPos - 1] !== ' ') {
      this._cursorLeft();
    }
  }

  _wordRight() {
    // Move to end of next word
    while (this.cursorPos < this.inputBuffer.length && this.inputBuffer[this.cursorPos] !== ' ') {
      this._cursorRight();
    }
    while (this.cursorPos < this.inputBuffer.length && this.inputBuffer[this.cursorPos] === ' ') {
      this._cursorRight();
    }
  }

  _cursorHome() {
    while (this.cursorPos > 0) {
      this._cursorLeft();
    }
  }

  _cursorEnd() {
    while (this.cursorPos < this.inputBuffer.length) {
      this._cursorRight();
    }
  }

  _clearLineBefore() {
    const removed = this.cursorPos;
    this.inputBuffer = this.inputBuffer.slice(this.cursorPos);
    this.cursorPos = 0;
    // Move to start and redraw
    this.terminal.write('\\x1b[' + removed + 'D');
    this._redrawFromCursor(true);
  }

  _clearLineAfter() {
    this.inputBuffer = this.inputBuffer.slice(0, this.cursorPos);
    this.terminal.write('\\x1b[K'); // Clear to end of line
  }

  _historyUp() {
    if (this.history.length === 0) return;

    if (this.historyIndex === -1) {
      // Save current input
      this.savedInput = this.inputBuffer;
      this.historyIndex = this.history.length - 1;
    } else if (this.historyIndex > 0) {
      this.historyIndex--;
    } else {
      return; // At oldest
    }

    this._replaceInput(this.history[this.historyIndex]);
  }

  _historyDown() {
    if (this.historyIndex === -1) return;

    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this._replaceInput(this.history[this.historyIndex]);
    } else {
      // Restore saved input
      this.historyIndex = -1;
      this._replaceInput(this.savedInput);
    }
  }

  _replaceInput(newInput) {
    // Clear current line
    this._cursorHome();
    this.terminal.write('\\x1b[K'); // Clear to end

    // Set new input
    this.inputBuffer = newInput;
    this.cursorPos = newInput.length;
    this.terminal.write(newInput);
  }

  _redrawFromCursor(deleted = false) {
    // Save cursor, write rest of line, restore cursor
    const rest = this.inputBuffer.slice(this.cursorPos - (deleted ? 0 : 1));
    this.terminal.write(rest);
    if (deleted) {
      this.terminal.write(' '); // Erase last char
      this.terminal.write('\\x1b[D'); // Back one
    }
    // Move cursor back
    const moveBack = this.inputBuffer.length - this.cursorPos;
    if (moveBack > 0) {
      this.terminal.write('\\x1b[' + moveBack + 'D');
    }
  }

  _redrawLine() {
    // Clear line and redraw
    this.terminal.write('\\r\\x1b[K');
    this.terminal.write(this.inputBuffer);
    // Position cursor
    const moveBack = this.inputBuffer.length - this.cursorPos;
    if (moveBack > 0) {
      this.terminal.write('\\x1b[' + moveBack + 'D');
    }
  }

  _sendCommand() {
    const command = this.inputBuffer.trim();

    // Echo newline
    this.terminal.write('\\r\\n');

    // Add to history if non-empty and different from last
    if (command && (this.history.length === 0 || this.history[this.history.length - 1] !== command)) {
      this.history.push(command);
      // Limit history
      if (this.history.length > 100) {
        this.history.shift();
      }
    }

    // Reset state
    this.inputBuffer = '';
    this.cursorPos = 0;
    this.historyIndex = -1;

    // Send to server
    if (command && this.wm?.client) {
      this.wm.client.send(this.boundChannel || 'game', command);
    }
  }

  _showPrompt() {
    // Server sends prompts, we just reset our state
    this.inputBuffer = '';
    this.cursorPos = 0;
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
