import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Taskbar class client module
 *
 * Creates $.taskbarJs which serves /js/taskbar.js
 * Windows 11-style taskbar for managing windows.
 */
export class TaskbarBuilder implements Builder {
  static provides = ['taskbarJs'];
  static depends = ['root'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const $ = this.manager as any;

    if ($.taskbarJs) {
      this.obj = $.taskbarJs;
      return;
    }

    const parentObj = $.root;
    if (!parentObj) throw new Error('TaskbarBuilder: $root not found');

    this.obj = await this.manager.create({
      parent: parentObj,
      properties: {
        name: 'Taskbar JS Module',
        description: 'Windows 11-style taskbar',
      },
      methods: {},
    });

    const obj = this.obj;

    obj.setMethod(
      'getScript',
      `
      return \`
/**
 * Taskbar - Windows 11-style taskbar
 * Shows start menu, buttons for each window, connection status, sound controls.
 */
export class Taskbar {
  constructor(container, wm, audioManager) {
    this.container = container;
    this.wm = wm;
    this.audio = audioManager;
    this.buttons = new Map();  // windowId -> button element
    this.menuOpen = false;

    // Dynamic menu entries - registered by client when state is received
    // Map of windowId -> { icon, label, windowType, stateType, data }
    this.availableWindows = new Map();

    this.render();
  }

  /**
   * Register an available window type for the start menu.
   * Called by MaliceClient when relevant state is received.
   */
  registerAvailableWindow(windowId, config) {
    this.availableWindows.set(windowId, {
      icon: config.icon || '📄',
      label: config.label || windowId,
      windowType: config.windowType || 'html',
      stateType: config.stateType || null,
      data: config.data || null,
      openFn: config.openFn || null
    });
  }

  /**
   * Unregister an available window type.
   */
  unregisterAvailableWindow(windowId) {
    this.availableWindows.delete(windowId);
  }

  render() {
    this.container.innerHTML = '';
    this.container.style.cssText = \\\`
      height: 40px;
      background: #141414;
      border-top: 1px solid #333;
      display: flex;
      align-items: center;
      padding: 0 8px;
      gap: 4px;
      position: relative;
    \\\`;

    // Start button (left)
    this.startBtn = document.createElement('button');
    this.startBtn.innerHTML = '&#9776;'; // Hamburger menu icon
    this.startBtn.style.cssText = \\\`
      width: 32px;
      height: 32px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #00ff88;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    \\\`;
    this.startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });
    this.startBtn.addEventListener('mouseenter', () => {
      this.startBtn.style.background = '#252525';
    });
    this.startBtn.addEventListener('mouseleave', () => {
      if (!this.menuOpen) this.startBtn.style.background = '#1a1a1a';
    });
    this.container.appendChild(this.startBtn);

    // Start menu (hidden by default)
    this.menu = document.createElement('div');
    this.menu.style.cssText = \\\`
      position: absolute;
      bottom: 44px;
      left: 8px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 8px 0;
      min-width: 180px;
      display: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 10000;
    \\\`;
    this._buildMenu();
    this.container.appendChild(this.menu);

    // Close menu when clicking elsewhere
    document.addEventListener('click', () => this.closeMenu());

    // Divider
    const divider = document.createElement('div');
    divider.style.cssText = 'width: 1px; height: 24px; background: #333; margin: 0 4px;';
    this.container.appendChild(divider);

    // Status indicator
    this.statusIndicator = document.createElement('div');
    this.statusIndicator.style.cssText = \\\`
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #666;
      margin-right: 8px;
    \\\`;
    this.container.appendChild(this.statusIndicator);

    // Window buttons area (center)
    this.buttonsArea = document.createElement('div');
    this.buttonsArea.style.cssText = \\\`
      flex: 1;
      display: flex;
      gap: 4px;
      overflow-x: auto;
    \\\`;
    this.container.appendChild(this.buttonsArea);

    // Sound button (right, before clock)
    this.soundBtn = document.createElement('button');
    this.soundBtn.id = 'taskbar-sound-btn';
    this.soundBtn.innerHTML = '🔊';
    this.soundBtn.style.cssText = \\\`
      width: 28px;
      height: 28px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #888;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 8px;
    \\\`;
    this.soundBtn.title = 'Sound Settings';
    this.soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.audio) {
        this.audio.toggleSettings();
      }
    });
    this.soundBtn.addEventListener('mouseenter', () => {
      this.soundBtn.style.background = '#252525';
    });
    this.soundBtn.addEventListener('mouseleave', () => {
      this.soundBtn.style.background = '#1a1a1a';
    });
    this.container.appendChild(this.soundBtn);

    // Clock (right)
    this.clock = document.createElement('div');
    this.clock.style.cssText = \\\`
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      color: #888;
      margin-left: 8px;
    \\\`;
    this.container.appendChild(this.clock);
    this._updateClock();
    setInterval(() => this._updateClock(), 1000);
  }

  /**
   * Update sound button icon based on mute state
   */
  updateSoundIcon() {
    if (!this.soundBtn || !this.audio) return;
    this.soundBtn.innerHTML = this.audio.globalMuted ? '🔇' : '🔊';
  }

  _updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    this.clock.textContent = h + ':' + m;
  }

  addWindow(windowId, title, icon = '□') {
    const btn = document.createElement('button');
    btn.style.cssText = \\\`
      padding: 4px 12px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #888;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      max-width: 160px;
      overflow: hidden;
    \\\`;

    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    iconSpan.style.fontSize = '14px';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    titleSpan.style.cssText = \\\`
      overflow: hidden;
      text-overflow: ellipsis;
    \\\`;

    btn.appendChild(iconSpan);
    btn.appendChild(titleSpan);

    btn.addEventListener('click', () => {
      this.wm?.focusWindow(windowId);
    });

    btn.addEventListener('mouseenter', () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = '#252525';
      }
    });

    btn.addEventListener('mouseleave', () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = '#1a1a1a';
      }
    });

    this.buttons.set(windowId, { button: btn, iconSpan, titleSpan });
    this.buttonsArea.appendChild(btn);
  }

  removeWindow(windowId) {
    const entry = this.buttons.get(windowId);
    if (entry) {
      entry.button.remove();
      this.buttons.delete(windowId);
    }
  }

  setActive(windowId) {
    // Remove active from all
    for (const [id, entry] of this.buttons) {
      entry.button.classList.remove('active');
      entry.button.style.background = '#1a1a1a';
      entry.button.style.borderColor = '#333';
      entry.button.style.color = '#888';
    }

    // Set active
    const entry = this.buttons.get(windowId);
    if (entry) {
      entry.button.classList.add('active');
      entry.button.style.background = '#252525';
      entry.button.style.borderColor = '#00ff88';
      entry.button.style.color = '#e0e0e0';
    }
  }

  setFlashing(windowId, flashing) {
    const entry = this.buttons.get(windowId);
    if (entry) {
      if (flashing) {
        entry.button.style.animation = 'taskbar-flash 0.5s ease infinite';
      } else {
        entry.button.style.animation = '';
      }
    }
  }

  updateTitle(windowId, title) {
    const entry = this.buttons.get(windowId);
    if (entry) {
      entry.titleSpan.textContent = title;
    }
  }

  updateButtonIcon(windowId, icon) {
    const entry = this.buttons.get(windowId);
    if (entry && entry.iconSpan) {
      entry.iconSpan.textContent = icon || '□';
    }
  }

  setStatus(state) {
    const colors = {
      connecting: '#ffcc00',
      connected: '#00ff88',
      disconnected: '#ff6666',
      error: '#ff3366'
    };
    this.statusIndicator.style.background = colors[state] || '#666';
  }

  _buildMenu() {
    // Clear existing menu items
    this.menu.innerHTML = '';

    // Build items list dynamically
    const items = [
      { icon: '>', label: 'Terminal', action: () => this.wm?.openTerminal() },
    ];

    // Add dynamic window entries from availableWindows
    for (const [windowId, config] of this.availableWindows) {
      const isOpen = this.wm?.windows?.has(windowId);
      items.push({
        icon: config.icon,
        label: config.label + (isOpen ? ' ✓' : ''),
        action: () => {
          if (isOpen) {
            // Focus existing window
            this.wm?.focusWindow(windowId);
          } else if (config.openFn) {
            // Use custom open function
            config.openFn();
          }
        }
      });
    }

    // Add separator and disconnect
    items.push({ type: 'separator' });
    items.push({ icon: '🔌', label: 'Disconnect', action: () => this.wm?.disconnect(), danger: true });

    for (const item of items) {
      if (item.type === 'separator') {
        const sep = document.createElement('div');
        sep.style.cssText = 'height: 1px; background: #333; margin: 8px 0;';
        this.menu.appendChild(sep);
        continue;
      }

      const btn = document.createElement('button');
      btn.style.cssText = \\\`
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 10px 16px;
        background: transparent;
        border: none;
        color: \\\${item.danger ? '#ff6666' : '#e0e0e0'};
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        cursor: pointer;
        text-align: left;
      \\\`;

      btn.innerHTML = '<span style="font-size: 16px;">' + item.icon + '</span><span>' + item.label + '</span>';

      btn.addEventListener('mouseenter', () => {
        btn.style.background = item.danger ? '#331111' : '#252525';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'transparent';
      });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeMenu();
        item.action();
      });

      this.menu.appendChild(btn);
    }
  }

  toggleMenu() {
    if (this.menuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    // Rebuild menu each time to reflect current state
    this._buildMenu();
    this.menu.style.display = 'block';
    this.menuOpen = true;
    this.startBtn.style.background = '#252525';
    this.startBtn.style.borderColor = '#00ff88';
  }

  closeMenu() {
    this.menu.style.display = 'none';
    this.menuOpen = false;
    this.startBtn.style.background = '#1a1a1a';
    this.startBtn.style.borderColor = '#333';
  }
}

// Add flash animation
const style = document.createElement('style');
style.textContent = \\\`
  @keyframes taskbar-flash {
    0%, 100% { border-color: #333; }
    50% { border-color: #00ff88; }
  }
\\\`;
document.head.appendChild(style);
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

    console.log(`[TaskbarBuilder] Built $.taskbarJs -> #${obj.id}`);
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'taskbarJs', this.obj.id);
  }
}

// Self-register
registerBuilder(TaskbarBuilder);
