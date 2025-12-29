import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Builds the WindowManager class client module
 *
 * Creates $.windowManagerJs which serves /js/window-manager.js
 * Orchestrates all windows, manages z-order, and handles wm channel.
 */
export class WindowManagerBuilder {
  static readonly alias = 'windowManagerJs';

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<RuntimeObject> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('ObjectManager not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    let obj: RuntimeObject | null = null;

    if (aliases[WindowManagerBuilder.alias]) {
      obj = await this.manager.load(aliases[WindowManagerBuilder.alias]);
      if (obj && !forceRebuild) {
        console.log(
          `[WindowManagerBuilder] Using existing $.${WindowManagerBuilder.alias}`,
        );
        return obj;
      }
    }

    if (!obj) {
      const root = await this.manager.load(1);
      obj = await this.manager.create({
        parent: root!,
        properties: {
          name: 'WindowManager JS Module',
          description: 'Window manager orchestration',
        },
        methods: {},
      });

      await objectManager.call(
        'addAlias',
        WindowManagerBuilder.alias,
        obj.id,
      );
    }

    obj.setMethod(
      'getScript',
      `
      return \`
import { Window } from '/js/window.js';
import { TerminalWindow } from '/js/terminal-window.js';
import { HtmlWindow } from '/js/html-window.js';
import { IframeWindow } from '/js/iframe-window.js';
import { Taskbar } from '/js/taskbar.js';

/**
 * WindowManager - Orchestrates all desktop windows
 * Handles window lifecycle, z-order, and wm channel protocol.
 */
export class WindowManager {
  constructor(windowArea, taskbarContainer, client) {
    this.windowArea = windowArea;
    this.client = client;
    this.windows = new Map();  // windowId -> Window instance
    this.zOrder = [];          // windowIds in z-order (back to front)
    this.activeWindowId = null;
    this.zIndexBase = 100;

    // Create taskbar
    this.taskbar = new Taskbar(taskbarContainer, this);

    // Cache Terminal and addons for window creation
    this.Terminal = null;
    this.FitAddon = null;
    this.WebLinksAddon = null;
  }

  /**
   * Set terminal libraries (loaded externally from CDN)
   */
  setTerminalLibs(Terminal, FitAddon, WebLinksAddon) {
    this.Terminal = Terminal;
    this.FitAddon = FitAddon;
    this.WebLinksAddon = WebLinksAddon;
  }

  /**
   * Handle wm channel message from server
   */
  handleWmMessage(msg) {
    if (!msg || !msg.action) return;

    switch (msg.action) {
      case 'open':
        this.openWindow(msg);
        break;
      case 'close':
        this.closeWindowFromServer(msg.windowId);
        break;
      case 'update':
        this.updateWindow(msg.windowId, msg.changes);
        break;
      case 'sync':
        this.syncLayout(msg);
        break;
      case 'focus':
        this.focusWindow(msg.windowId);
        break;
      case 'flash':
        this.flashWindow(msg.windowId);
        break;
      default:
        console.log('[WM] Unknown action:', msg.action);
    }
  }

  /**
   * Open a new window
   */
  async openWindow(config) {
    if (this.windows.has(config.windowId)) {
      // Already exists, just focus it
      this.focusWindow(config.windowId);
      return this.windows.get(config.windowId);
    }

    let win;
    const windowType = config.windowType || 'generic';

    // Create appropriate window type
    switch (windowType) {
      case 'terminal':
        win = new TerminalWindow(this, config);
        break;
      case 'html':
        win = new HtmlWindow(this, config);
        break;
      case 'iframe':
        win = new IframeWindow(this, config);
        break;
      default:
        win = new Window(this, config);
    }

    // Render and add to DOM
    const el = win.render();
    this.windowArea.appendChild(el);

    // Add to tracking
    this.windows.set(config.windowId, win);
    this.zOrder.push(config.windowId);

    // Add to taskbar
    const icon = this._getWindowIcon(windowType);
    this.taskbar.addWindow(config.windowId, config.title, icon);

    // Initialize window based on type
    if (windowType === 'terminal' && this.Terminal) {
      await win.initTerminal(this.Terminal, this.FitAddon, this.WebLinksAddon);
      if (config.channel) {
        win.bindChannel(config.channel);
      }
    } else if (windowType === 'html' || windowType === 'iframe') {
      // These types initialize content in their initContent() called from render()
      if (config.channel) {
        win.channel = config.channel;
      }
    }

    // Focus the new window
    this.focusWindow(config.windowId);

    return win;
  }

  _getWindowIcon(type) {
    switch (type) {
      case 'terminal': return '>';
      case 'html': return '📄';
      case 'iframe': return '🌐';
      case 'map': return '🗺';
      default: return '□';
    }
  }

  /**
   * Close a window (user-initiated)
   */
  closeWindow(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;

    // Remove from DOM
    if (win.element) {
      win.element.remove();
    }

    // Remove from tracking
    this.windows.delete(windowId);
    this.zOrder = this.zOrder.filter(id => id !== windowId);

    // Remove from taskbar
    this.taskbar.removeWindow(windowId);

    // Notify server
    if (this.client) {
      this.client.send('wm', { action: 'close', windowId });
    }

    // Focus next window
    if (this.activeWindowId === windowId && this.zOrder.length > 0) {
      this.focusWindow(this.zOrder[this.zOrder.length - 1]);
    }
  }

  /**
   * Close window from server command (no notification back)
   */
  closeWindowFromServer(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;

    if (win.element) {
      win.element.remove();
    }

    this.windows.delete(windowId);
    this.zOrder = this.zOrder.filter(id => id !== windowId);
    this.taskbar.removeWindow(windowId);

    if (this.activeWindowId === windowId && this.zOrder.length > 0) {
      this.focusWindow(this.zOrder[this.zOrder.length - 1]);
    }
  }

  /**
   * Focus a window (bring to front)
   */
  focusWindow(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;

    // If minimized, restore it
    if (win.minimized) {
      win.restore();
    }

    // Blur previous active
    if (this.activeWindowId && this.activeWindowId !== windowId) {
      const prev = this.windows.get(this.activeWindowId);
      if (prev) prev.blur();
    }

    // Update z-order
    this.zOrder = this.zOrder.filter(id => id !== windowId);
    this.zOrder.push(windowId);

    // Focus window
    this.activeWindowId = windowId;
    win.focus();

    // Update taskbar
    this.taskbar.setActive(windowId);
  }

  /**
   * Update window properties
   */
  updateWindow(windowId, changes) {
    const win = this.windows.get(windowId);
    if (!win) return;

    if (changes.title) {
      win.setTitle(changes.title);
      this.taskbar.updateTitle(windowId, changes.title);
    }

    if (changes.x !== undefined || changes.y !== undefined ||
        changes.width !== undefined || changes.height !== undefined ||
        changes.minimized !== undefined || changes.maximized !== undefined) {
      win.updateGeometry(changes);
    }
  }

  /**
   * Sync full layout from server (on connect)
   */
  async syncLayout(data) {
    // Clear existing windows
    for (const [id, win] of this.windows) {
      if (win.element) win.element.remove();
      this.taskbar.removeWindow(id);
    }
    this.windows.clear();
    this.zOrder = [];

    // Create windows from server data
    if (data.windows && Array.isArray(data.windows)) {
      for (const config of data.windows) {
        await this.openWindow(config);
      }
    }

    // Apply taskbar order if provided
    if (data.taskbarOrder) {
      // TODO: Reorder taskbar buttons
    }
  }

  /**
   * Flash a window (notification)
   */
  flashWindow(windowId) {
    const win = this.windows.get(windowId);
    if (win) {
      win.flash();
      this.taskbar.setFlashing(windowId, true);
      setTimeout(() => this.taskbar.setFlashing(windowId, false), 2000);
    }
  }

  /**
   * Get window by ID
   */
  getWindow(windowId) {
    return this.windows.get(windowId);
  }

  /**
   * Get top z-index for focusing
   */
  getTopZIndex() {
    return this.zIndexBase + this.zOrder.length + 1;
  }

  /**
   * Set active window (called by Window.focus)
   */
  setActiveWindow(windowId) {
    if (this.activeWindowId !== windowId) {
      const prev = this.windows.get(this.activeWindowId);
      if (prev) prev.blur();
    }
    this.activeWindowId = windowId;
    this.taskbar.setActive(windowId);
  }

  /**
   * Get window area dimensions (for maximize)
   */
  getWindowArea() {
    return {
      width: this.windowArea.clientWidth,
      height: this.windowArea.clientHeight
    };
  }

  // --- User events -> Server notifications ---

  userMoved(windowId, x, y) {
    if (this.client) {
      this.client.send('wm', { action: 'geometry', windowId, x, y });
    }
  }

  userResized(windowId, width, height) {
    if (this.client) {
      this.client.send('wm', { action: 'geometry', windowId, width, height });
    }
  }

  userMinimized(windowId) {
    if (this.client) {
      this.client.send('wm', { action: 'minimize', windowId });
    }
  }

  userMaximized(windowId) {
    if (this.client) {
      this.client.send('wm', { action: 'maximize', windowId });
    }
  }

  userRestored(windowId) {
    if (this.client) {
      this.client.send('wm', { action: 'restore', windowId });
    }
  }

  /**
   * Route channel data to appropriate window
   */
  routeChannelData(channel, data) {
    for (const win of this.windows.values()) {
      if (win.channel === channel) {
        if (win.onChannelData) {
          win.onChannelData(data);
        }
        break;
      }
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
      `[WindowManagerBuilder] Built $.${WindowManagerBuilder.alias} -> #${obj.id}`,
    );
    return obj;
  }
}
