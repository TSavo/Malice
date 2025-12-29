import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';

/**
 * Builds the Taskbar class client module
 *
 * Creates $.taskbarJs which serves /js/taskbar.js
 * Windows 11-style taskbar for managing windows.
 */
export class TaskbarBuilder {
  static readonly alias = 'taskbarJs';

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<RuntimeObject> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('ObjectManager not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    let obj: RuntimeObject | null = null;

    if (aliases[TaskbarBuilder.alias]) {
      obj = await this.manager.load(aliases[TaskbarBuilder.alias]);
      if (obj && !forceRebuild) {
        console.log(
          `[TaskbarBuilder] Using existing $.${TaskbarBuilder.alias}`,
        );
        return obj;
      }
    }

    if (!obj) {
      const root = await this.manager.load(1);
      obj = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Taskbar JS Module',
          description: 'Windows 11-style taskbar',
        },
        methods: {},
      });

      await objectManager.call('addAlias', TaskbarBuilder.alias, obj.id);
    }

    obj.setMethod(
      'getScript',
      `
      return \`
/**
 * Taskbar - Windows 11-style taskbar
 * Shows buttons for each window, connection status.
 */
export class Taskbar {
  constructor(container, wm) {
    this.container = container;
    this.wm = wm;
    this.buttons = new Map();  // windowId -> button element

    this.render();
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
    \\\`;

    // Status indicator (left)
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

    this.buttons.set(windowId, { button: btn, titleSpan });
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

  setStatus(state) {
    const colors = {
      connecting: '#ffcc00',
      connected: '#00ff88',
      disconnected: '#ff6666',
      error: '#ff3366'
    };
    this.statusIndicator.style.background = colors[state] || '#666';
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

    console.log(
      `[TaskbarBuilder] Built $.${TaskbarBuilder.alias} -> #${obj.id}`,
    );
    return obj;
  }
}
