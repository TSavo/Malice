import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the WindowManager class client module
 *
 * Creates $.windowManagerJs which serves /js/window-manager.js
 * Orchestrates all windows, manages z-order, and handles wm channel.
 */
export class WindowManagerBuilder implements Builder {
  static provides = ['windowManagerJs'];
  static depends = ['root'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const $ = this.manager as any;

    if ($.windowManagerJs) {
      this.obj = $.windowManagerJs;
      return;
    }

    const parentObj = $.root;
    if (!parentObj) throw new Error('WindowManagerBuilder: $root not found');

    this.obj = await this.manager.create({
      parent: parentObj,
      properties: {
        name: 'WindowManager JS Module',
        description: 'Window manager orchestration',
      },
      methods: {},
    });

    const obj = this.obj;

    obj.setMethod(
      'getScript',
      `
      return \`
import { Window } from '/js/window';
import { TerminalWindow } from '/js/terminal-window';
import { HtmlWindow } from '/js/html-window';
import { IframeWindow } from '/js/iframe-window';
import { LocationWindow } from '/js/location-window';
import { SpeakerWindow } from '/js/speaker-window';
import { ShowWindow } from '/js/show-window';
import { Taskbar } from '/js/taskbar';

/**
 * WindowManager - Orchestrates all desktop windows
 * Handles window lifecycle, z-order, and wm channel protocol.
 */
export class WindowManager {
  constructor(windowArea, taskbarContainer, client, audioManager) {
    this.windowArea = windowArea;
    this.client = client;
    this.audio = audioManager;
    this.windows = new Map();  // windowId -> Window instance
    this.zOrder = [];          // windowIds in z-order (back to front)
    this.activeWindowId = null;
    this.zIndexBase = 100;

    // Cascade placement tracking
    this.cascadeOffset = 0;
    this.cascadeStep = 30;
    this.cascadeMax = 150;

    // Snapping
    this.snapThreshold = 20;

    // Alt+Tab state
    this.altTabbing = false;
    this.altTabIndex = 0;

    // Saved terminal state for restore after close
    this._savedTerminalHistory = [];
    this._savedTerminalBuffer = '';

    // Create taskbar with audio manager reference
    this.taskbar = new Taskbar(taskbarContainer, this, audioManager);

    // Wire up audio mute change callback to update taskbar icon
    if (audioManager) {
      audioManager.onMuteChange = () => {
        this.taskbar.updateSoundIcon();
      };
    }

    // Cache Terminal and addons for window creation
    this.Terminal = null;
    this.FitAddon = null;
    this.WebLinksAddon = null;

    // Set up keyboard shortcuts
    this._initKeyboardShortcuts();
  }

  /**
   * Initialize keyboard shortcuts
   */
  _initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt+Tab - cycle windows
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        this._handleAltTab(e.shiftKey);
        return;
      }

      // Win+D or Meta+D - show desktop (minimize all)
      if ((e.metaKey || e.key === 'Meta') && e.key === 'd') {
        e.preventDefault();
        this.showDesktop();
        return;
      }

      // Escape - cancel alt-tab
      if (e.key === 'Escape' && this.altTabbing) {
        this._cancelAltTab();
        return;
      }
    });

    document.addEventListener('keyup', (e) => {
      // Alt released - confirm alt-tab selection
      if (e.key === 'Alt' && this.altTabbing) {
        this._confirmAltTab();
      }
    });
  }

  /**
   * Handle Alt+Tab window cycling
   */
  _handleAltTab(reverse) {
    const nonMinimized = this.zOrder.filter(id => {
      const win = this.windows.get(id);
      return win && !win.minimized;
    });

    if (nonMinimized.length < 2) return;

    if (!this.altTabbing) {
      this.altTabbing = true;
      this.altTabIndex = nonMinimized.length - 2; // Start at second-to-last
      this._showAltTabPreview();
    } else {
      if (reverse) {
        this.altTabIndex = (this.altTabIndex + 1) % nonMinimized.length;
      } else {
        this.altTabIndex = (this.altTabIndex - 1 + nonMinimized.length) % nonMinimized.length;
      }
    }

    // Highlight the window
    const targetId = nonMinimized[this.altTabIndex];
    this._updateAltTabPreview(targetId);
  }

  _showAltTabPreview() {
    // Create overlay
    this.altTabOverlay = document.createElement('div');
    this.altTabOverlay.style.cssText = \\\`
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    \\\`;

    // Create preview container
    this.altTabPreview = document.createElement('div');
    this.altTabPreview.style.cssText = \\\`
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      gap: 8px;
      max-width: 80%;
      overflow-x: auto;
    \\\`;

    // Add window thumbnails
    for (const id of this.zOrder) {
      const win = this.windows.get(id);
      if (!win || win.minimized) continue;

      const thumb = document.createElement('div');
      thumb.dataset.windowId = id;
      thumb.style.cssText = \\\`
        width: 120px;
        padding: 8px;
        border: 2px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        text-align: center;
      \\\`;
      thumb.innerHTML = \\\`
        <div style="font-size: 24px; margin-bottom: 4px;">\\\${this._getWindowIcon(win.config?.windowType)}</div>
        <div style="font-size: 12px; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\\\${win.title}</div>
      \\\`;
      thumb.addEventListener('click', () => {
        this.altTabIndex = this.zOrder.indexOf(id);
        this._confirmAltTab();
      });
      this.altTabPreview.appendChild(thumb);
    }

    this.altTabOverlay.appendChild(this.altTabPreview);
    document.body.appendChild(this.altTabOverlay);
  }

  _updateAltTabPreview(targetId) {
    if (!this.altTabPreview) return;

    const thumbs = this.altTabPreview.querySelectorAll('[data-window-id]');
    thumbs.forEach(thumb => {
      if (thumb.dataset.windowId === targetId) {
        thumb.style.borderColor = '#00ff88';
        thumb.style.background = '#252525';
      } else {
        thumb.style.borderColor = 'transparent';
        thumb.style.background = 'transparent';
      }
    });
  }

  _confirmAltTab() {
    if (!this.altTabbing) return;

    const nonMinimized = this.zOrder.filter(id => {
      const win = this.windows.get(id);
      return win && !win.minimized;
    });

    if (nonMinimized[this.altTabIndex]) {
      this.focusWindow(nonMinimized[this.altTabIndex]);
    }

    this._cancelAltTab();
  }

  _cancelAltTab() {
    this.altTabbing = false;
    if (this.altTabOverlay) {
      this.altTabOverlay.remove();
      this.altTabOverlay = null;
      this.altTabPreview = null;
    }
  }

  /**
   * Show desktop - minimize all windows
   */
  showDesktop() {
    // Check if all are minimized
    const allMinimized = Array.from(this.windows.values()).every(w => w.minimized);

    if (allMinimized) {
      // Restore all
      for (const win of this.windows.values()) {
        win.restore();
      }
    } else {
      // Minimize all
      for (const win of this.windows.values()) {
        if (!win.minimized) {
          win.minimize();
        }
      }
    }
  }

  /**
   * Get cascade position for new window
   */
  _getCascadePosition() {
    const x = 50 + this.cascadeOffset;
    const y = 50 + this.cascadeOffset;

    this.cascadeOffset += this.cascadeStep;
    if (this.cascadeOffset > this.cascadeMax) {
      this.cascadeOffset = 0;
    }

    return { x, y };
  }

  /**
   * Snap window position to edges or other windows
   */
  snapPosition(windowId, x, y, width, height) {
    const area = this.getWindowArea();
    let snappedX = x;
    let snappedY = y;

    // Snap to left edge
    if (Math.abs(x) < this.snapThreshold) {
      snappedX = 0;
    }
    // Snap to right edge
    if (Math.abs(x + width - area.width) < this.snapThreshold) {
      snappedX = area.width - width;
    }
    // Snap to top edge
    if (Math.abs(y) < this.snapThreshold) {
      snappedY = 0;
    }
    // Snap to bottom edge
    if (Math.abs(y + height - area.height) < this.snapThreshold) {
      snappedY = area.height - height;
    }

    // Snap to half-screen on edge drag
    // (This is handled in window drag end)

    return { x: snappedX, y: snappedY };
  }

  /**
   * Snap window to left/right half of screen
   */
  snapToHalf(windowId, side) {
    const win = this.windows.get(windowId);
    if (!win) return;

    const area = this.getWindowArea();
    const halfWidth = Math.floor(area.width / 2);

    win.preSnapX = win.x;
    win.preSnapY = win.y;
    win.preSnapWidth = win.width;
    win.preSnapHeight = win.height;

    if (side === 'left') {
      win.x = 0;
      win.y = 0;
      win.width = halfWidth;
      win.height = area.height;
    } else {
      win.x = halfWidth;
      win.y = 0;
      win.width = halfWidth;
      win.height = area.height;
    }

    win.element.style.left = win.x + 'px';
    win.element.style.top = win.y + 'px';
    win.element.style.width = win.width + 'px';
    win.element.style.height = win.height + 'px';
    win.element.style.transition = 'all 0.15s ease-out';
    setTimeout(() => {
      win.element.style.transition = '';
      win.onResize();
    }, 150);

    this.userResized(windowId, win.width, win.height);
    this.userMoved(windowId, win.x, win.y);
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

    // Apply cascade positioning if no position specified
    if (config.config && config.config.x === undefined && config.config.y === undefined) {
      const pos = this._getCascadePosition();
      config.config.x = pos.x;
      config.config.y = pos.y;
    } else if (!config.config) {
      const pos = this._getCascadePosition();
      config.config = { x: pos.x, y: pos.y };
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
      case 'location':
        win = new LocationWindow(this, config);
        break;
      case 'speaker':
        win = new SpeakerWindow(this, config);
        break;
      case 'show':
        win = new ShowWindow(this, config);
        break;
      default:
        win = new Window(this, config);
    }

    // Render and add to DOM
    const el = win.render();
    this.windowArea.appendChild(el);

    // Apply initial maximized state if configured
    win.applyInitialMaximized();

    // Add to tracking
    this.windows.set(config.windowId, win);
    this.zOrder.push(config.windowId);

    // Add to taskbar - use provided icon or derive from type
    const icon = config.icon || this._getWindowIcon(windowType);
    this.taskbar.addWindow(config.windowId, config.title, icon);

    // Initialize window based on type
    if (windowType === 'terminal' && this.Terminal) {
      await win.initTerminal(this.Terminal, this.FitAddon, this.WebLinksAddon);
      if (config.channel) {
        win.bindChannel(config.channel);
      }
      // Restore saved state if provided
      if (config.restoreHistory) {
        win.history = config.restoreHistory;
      }
      if (config.restoreBuffer) {
        win.restoreBuffer(config.restoreBuffer);
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
      case 'location': return '📍';
      case 'speaker': return '🔊';
      case 'show': return '👁';
      default: return '□';
    }
  }

  /**
   * Close a window (user-initiated)
   */
  closeWindow(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;

    // Save terminal state before closing
    if (win.windowType === 'terminal') {
      this._savedTerminalHistory = win.history ? [...win.history] : [];
      this._savedTerminalBuffer = win.outputBuffer || '';
    }

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

  /**
   * Open a terminal window (from start menu)
   * If one exists, focus it instead of creating new
   */
  async openTerminal() {
    // Check if terminal already exists
    for (const [id, win] of this.windows) {
      if (win.config?.windowType === 'terminal') {
        // Focus existing terminal
        this.focusWindow(id);
        return;
      }
    }

    // No terminal exists - create one
    const id = 'terminal-main';

    // Use cascade placement
    const pos = this._getCascadePosition();

    await this.openWindow({
      windowId: id,
      windowType: 'terminal',
      title: 'Terminal',
      channel: 'game',
      config: {
        x: 0,
        y: 0,
        width: 800,
        height: 500,
        maximized: true
      },
      restoreHistory: this._savedTerminalHistory?.length > 0 ? [...this._savedTerminalHistory] : null,
      restoreBuffer: this._savedTerminalBuffer || null
    });

    // Notify server
    if (this.client) {
      this.client.send('wm', {
        action: 'open',
        windowId: id,
        windowType: 'terminal',
        title: 'Terminal',
        channel: 'game'
      });
    }
  }

  /**
   * Disconnect from server and show reconnect dialog
   */
  disconnect() {
    // Close the WebSocket
    if (this.client) {
      this.client.close();
    }

    // Show reconnect dialog
    this.showReconnectDialog();
  }

  /**
   * Show reconnect dialog overlay
   */
  showReconnectDialog() {
    // Remove existing dialog if any
    const existing = document.getElementById('malice-reconnect-dialog');
    if (existing) existing.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'malice-reconnect-dialog';
    overlay.style.cssText = \\\`
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    \\\`;

    // Dialog box
    const dialog = document.createElement('div');
    dialog.style.cssText = \\\`
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 32px 48px;
      text-align: center;
      box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5);
    \\\`;

    // Icon
    const icon = document.createElement('div');
    icon.textContent = '🔌';
    icon.style.cssText = 'font-size: 48px; margin-bottom: 16px;';
    dialog.appendChild(icon);

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Disconnected';
    title.style.cssText = \\\`
      color: #e0e0e0;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
    \\\`;
    dialog.appendChild(title);

    // Message
    const msg = document.createElement('p');
    msg.textContent = 'Your connection to the server has been closed.';
    msg.style.cssText = \\\`
      color: #888;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      margin: 0 0 24px 0;
    \\\`;
    dialog.appendChild(msg);

    // Reconnect button
    const btn = document.createElement('button');
    btn.textContent = 'Reconnect';
    btn.style.cssText = \\\`
      background: #00ff88;
      color: #0a0a0a;
      border: none;
      border-radius: 6px;
      padding: 12px 32px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    \\\`;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#00cc6a';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#00ff88';
    });
    btn.addEventListener('click', () => {
      overlay.remove();
      if (this.client) {
        this.client.connect();
      }
    });
    dialog.appendChild(btn);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  /**
   * Hide reconnect dialog
   */
  hideReconnectDialog() {
    const dialog = document.getElementById('malice-reconnect-dialog');
    if (dialog) dialog.remove();
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

    console.log(`[WindowManagerBuilder] Built $.windowManagerJs -> #${obj.id}`);
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'windowManagerJs', this.obj.id);
  }
}

// Self-register
registerBuilder(WindowManagerBuilder);
