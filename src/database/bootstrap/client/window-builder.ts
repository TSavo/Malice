import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Window base class client module
 *
 * Creates $.windowJs which serves /js/window.js
 * Base window class with drag, resize, minimize/maximize/close.
 */
export class WindowBuilder implements Builder {
  static provides = ['windowJs'];
  static depends = ['root'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const $ = this.manager as any;

    if ($.windowJs) {
      this.obj = $.windowJs;
      return;
    }

    const parentObj = $.root;
    if (!parentObj) throw new Error('WindowBuilder: $root not found');

    this.obj = await this.manager.create({
      parent: parentObj,
      properties: {
        name: 'Window JS Module',
        description: 'Base window class for desktop UI',
      },
      methods: {},
    });

    const obj = this.obj;

    obj.setMethod(
      'getScript',
      `
      return \`
/**
 * Window - Base class for desktop windows
 * Provides drag, resize, minimize/maximize/close, focus management.
 */
export class Window {
  constructor(wm, config) {
    this.wm = wm;
    this.id = config.windowId;
    this.windowType = config.windowType || 'generic';
    this.config = config.config || {};
    this.title = config.title || 'Window';
    this.icon = config.icon || null;  // Unicode icon for title bar
    this.channel = config.channel || null;

    // State
    this.minimized = this.config.minimized || false;
    this.maximized = this.config.maximized || false;
    this.focused = false;

    // Geometry
    this.x = this.config.x ?? 100;
    this.y = this.config.y ?? 100;
    this.width = this.config.width ?? 400;
    this.height = this.config.height ?? 300;

    // Pre-maximize geometry (for restore)
    this.preMaxX = this.x;
    this.preMaxY = this.y;
    this.preMaxWidth = this.width;
    this.preMaxHeight = this.height;

    // DOM elements
    this.element = null;
    this.titlebar = null;
    this.content = null;
    this.iconEl = null;
  }

  /**
   * Render the window DOM
   */
  render() {
    this.element = document.createElement('div');
    this.element.className = 'malice-window';
    this.element.style.cssText = \\\`
      position: absolute;
      left: \\\${this.x}px;
      top: \\\${this.y}px;
      width: \\\${this.width}px;
      height: \\\${this.height}px;
      background: linear-gradient(180deg, #1a1a1a 0%, #141414 100%);
      border: 2px solid #2a2a2a;
      border-top-color: #3a3a3a;
      border-left-color: #353535;
      border-radius: 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 100;
    \\\`;

    // Titlebar
    this.titlebar = document.createElement('div');
    this.titlebar.className = 'window-titlebar';
    this.titlebar.style.cssText = \\\`
      height: 34px;
      min-height: 34px;
      background: linear-gradient(180deg, #222 0%, #1a1a1a 100%);
      border-bottom: 1px solid #2a2a2a;
      border-radius: 4px 4px 0 0;
      display: flex;
      align-items: center;
      padding: 0 10px;
      cursor: default;
      user-select: none;
    \\\`;

    // Icon (optional)
    const iconEl = document.createElement('span');
    iconEl.className = 'window-icon';
    iconEl.style.cssText = \\\`
      font-size: 14px;
      margin-right: 6px;
      flex-shrink: 0;
    \\\`;
    if (this.icon) {
      iconEl.textContent = this.icon;
    } else {
      iconEl.style.display = 'none';
    }
    this.iconEl = iconEl;

    // Title text
    const titleText = document.createElement('span');
    titleText.className = 'window-title';
    titleText.textContent = this.title;
    titleText.style.cssText = \\\`
      flex: 1;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      color: #888;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    \\\`;
    this.titleText = titleText;

    // Window buttons
    const buttons = document.createElement('div');
    buttons.className = 'window-buttons';
    buttons.style.cssText = 'display: flex; gap: 4px; margin-left: 8px;';

    // Minimize button
    if (this.config.minimizable !== false) {
      const minBtn = this._createButton('−', '#888', () => this.minimize());
      buttons.appendChild(minBtn);
    }

    // Maximize button
    if (this.config.resizable !== false) {
      const maxBtn = this._createButton('□', '#888', () => {
        if (this.maximized) this.restore();
        else this.maximize();
      });
      buttons.appendChild(maxBtn);
    }

    // Close button
    if (this.config.closable !== false) {
      const closeBtn = this._createButton('×', '#888', () => this.close(), '#ff3366');
      buttons.appendChild(closeBtn);
    }

    this.titlebar.appendChild(iconEl);
    this.titlebar.appendChild(titleText);
    this.titlebar.appendChild(buttons);

    // Content area
    this.content = document.createElement('div');
    this.content.className = 'window-content';
    this.content.style.cssText = \\\`
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #0d0d0d;
      border-radius: 0 0 4px 4px;
    \\\`;

    this.element.appendChild(this.titlebar);
    this.element.appendChild(this.content);

    // Init behaviors
    this._initDrag();
    if (this.config.resizable !== false) {
      this._initResize();
    }
    this._initFocus();

    // Init content (override in subclasses)
    this.initContent();

    // Apply initial minimized state
    if (this.minimized) {
      this.element.style.display = 'none';
    }

    // Apply maximized state if configured
    if (this.maximized) {
      // Will be applied after DOM append via applyInitialMaximized()
    }

    return this.element;
  }

  /**
   * Apply maximized geometry after DOM append
   */
  applyInitialMaximized() {
    if (this.maximized) {
      this._applyMaximized();
    }
  }

  /**
   * Override in subclasses to initialize content
   */
  initContent() {
    // Base class does nothing
  }

  _createButton(text, color, onClick, hoverColor) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = \\\`
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: \\\${color};
      font-size: 16px;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    \\\`;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = hoverColor || '#333';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  _initDrag() {
    let startX, startY, origX, origY;
    let dragging = false;
    let snapPreview = null;

    const onMouseDown = (e) => {
      if (e.target !== this.titlebar && !e.target.classList.contains('window-title')) return;
      if (this.maximized) return;

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origX = this.x;
      origY = this.y;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      this.x = origX + dx;
      this.y = origY + dy;
      this.element.style.left = this.x + 'px';
      this.element.style.top = this.y + 'px';

      // Check for edge snap preview
      const area = this.wm?.getWindowArea() || { width: 800, height: 600 };
      const edgeThreshold = 10;

      if (e.clientX <= edgeThreshold) {
        this._showSnapPreview('left', area);
      } else if (e.clientX >= area.width - edgeThreshold) {
        this._showSnapPreview('right', area);
      } else {
        this._hideSnapPreview();
      }
    };

    const onMouseUp = (e) => {
      if (dragging) {
        dragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Check for edge snap
        const area = this.wm?.getWindowArea() || { width: 800, height: 600 };
        const edgeThreshold = 10;

        if (e.clientX <= edgeThreshold) {
          this._hideSnapPreview();
          this.wm?.snapToHalf(this.id, 'left');
        } else if (e.clientX >= area.width - edgeThreshold) {
          this._hideSnapPreview();
          this.wm?.snapToHalf(this.id, 'right');
        } else {
          // Apply edge snapping
          if (this.wm?.snapPosition) {
            const snapped = this.wm.snapPosition(this.id, this.x, this.y, this.width, this.height);
            if (snapped.x !== this.x || snapped.y !== this.y) {
              this.x = snapped.x;
              this.y = snapped.y;
              this.element.style.left = this.x + 'px';
              this.element.style.top = this.y + 'px';
            }
          }
          this.wm?.userMoved(this.id, this.x, this.y);
        }
      }
    };

    this.titlebar.addEventListener('mousedown', onMouseDown);

    // Double-click to maximize
    this.titlebar.addEventListener('dblclick', (e) => {
      if (e.target !== this.titlebar && !e.target.classList.contains('window-title')) return;
      if (this.maximized) this.restore();
      else this.maximize();
    });
  }

  _showSnapPreview(side, area) {
    if (!this.snapPreview) {
      this.snapPreview = document.createElement('div');
      this.snapPreview.style.cssText = \\\`
        position: fixed;
        background: rgba(0, 255, 136, 0.1);
        border: 2px solid #00ff88;
        border-radius: 4px;
        pointer-events: none;
        z-index: 9999;
        transition: all 0.1s ease-out;
      \\\`;
      document.body.appendChild(this.snapPreview);
    }

    const halfWidth = Math.floor(area.width / 2);
    if (side === 'left') {
      this.snapPreview.style.left = '0px';
      this.snapPreview.style.top = '0px';
      this.snapPreview.style.width = halfWidth + 'px';
      this.snapPreview.style.height = area.height + 'px';
    } else {
      this.snapPreview.style.left = halfWidth + 'px';
      this.snapPreview.style.top = '0px';
      this.snapPreview.style.width = halfWidth + 'px';
      this.snapPreview.style.height = area.height + 'px';
    }
    this.snapPreview.style.display = 'block';
  }

  _hideSnapPreview() {
    if (this.snapPreview) {
      this.snapPreview.remove();
      this.snapPreview = null;
    }
  }

  _initResize() {
    const handleSize = 8;  // Larger handles for easier grabbing
    const cornerSize = 14; // Even larger corners

    // Create resize handles for all 8 directions
    const handles = [
      { cursor: 'n-resize', top: '0', left: handleSize + 'px', right: handleSize + 'px', height: handleSize + 'px', dirs: { top: true } },
      { cursor: 's-resize', bottom: '0', left: handleSize + 'px', right: handleSize + 'px', height: handleSize + 'px', dirs: { bottom: true } },
      { cursor: 'w-resize', left: '0', top: handleSize + 'px', bottom: handleSize + 'px', width: handleSize + 'px', dirs: { left: true } },
      { cursor: 'e-resize', right: '0', top: handleSize + 'px', bottom: handleSize + 'px', width: handleSize + 'px', dirs: { right: true } },
      { cursor: 'nw-resize', top: '0', left: '0', width: cornerSize + 'px', height: cornerSize + 'px', dirs: { top: true, left: true } },
      { cursor: 'ne-resize', top: '0', right: '0', width: cornerSize + 'px', height: cornerSize + 'px', dirs: { top: true, right: true } },
      { cursor: 'sw-resize', bottom: '0', left: '0', width: cornerSize + 'px', height: cornerSize + 'px', dirs: { bottom: true, left: true } },
      { cursor: 'se-resize', bottom: '0', right: '0', width: cornerSize + 'px', height: cornerSize + 'px', dirs: { bottom: true, right: true } },
    ];

    for (const h of handles) {
      const handle = document.createElement('div');
      handle.style.position = 'absolute';
      handle.style.cursor = h.cursor;
      if (h.top !== undefined) handle.style.top = h.top;
      if (h.bottom !== undefined) handle.style.bottom = h.bottom;
      if (h.left !== undefined) handle.style.left = h.left;
      if (h.right !== undefined) handle.style.right = h.right;
      if (h.width !== undefined) handle.style.width = h.width;
      if (h.height !== undefined) handle.style.height = h.height;
      handle.style.zIndex = '10';

      let startX, startY, origX, origY, origW, origH;
      let resizing = false;

      handle.addEventListener('mousedown', (e) => {
        if (this.maximized) return;
        resizing = true;
        startX = e.clientX;
        startY = e.clientY;
        origX = this.x;
        origY = this.y;
        origW = this.width;
        origH = this.height;

        const onMouseMove = (e) => {
          if (!resizing) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;

          let newX = origX, newY = origY, newW = origW, newH = origH;

          if (h.dirs.right) newW = Math.max(200, origW + dx);
          if (h.dirs.bottom) newH = Math.max(100, origH + dy);
          if (h.dirs.left) {
            const requestedW = origW - dx;
            newW = Math.max(200, requestedW);
            // Adjust X position by the difference between original and new width
            newX = origX + (origW - newW);
          }
          if (h.dirs.top) {
            const requestedH = origH - dy;
            newH = Math.max(100, requestedH);
            // Adjust Y position by the difference between original and new height
            newY = origY + (origH - newH);
          }

          this.x = newX;
          this.y = newY;
          this.width = newW;
          this.height = newH;
          this.element.style.left = this.x + 'px';
          this.element.style.top = this.y + 'px';
          this.element.style.width = this.width + 'px';
          this.element.style.height = this.height + 'px';
          this.onResize();
        };

        const onMouseUp = () => {
          if (resizing) {
            resizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            this.wm?.userResized(this.id, this.width, this.height);
            this.wm?.userMoved(this.id, this.x, this.y);
          }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
        e.stopPropagation();
      });

      this.element.appendChild(handle);
    }
  }

  _initFocus() {
    this.element.addEventListener('mousedown', () => {
      this.wm?.focusWindow(this.id);
    });
  }

  focus() {
    this.focused = true;
    this.element.style.borderColor = '#00cc6a';
    this.element.style.borderTopColor = '#00ff88';
    this.element.style.borderLeftColor = '#00dd77';
    this.element.style.boxShadow = '0 4px 24px rgba(0,255,136,0.15), inset 0 1px 0 rgba(255,255,255,0.05)';
    this.element.style.zIndex = this.wm?.getTopZIndex() || 200;
    this.titleText.style.color = '#e0e0e0';
  }

  blur() {
    this.focused = false;
    this.element.style.borderColor = '#2a2a2a';
    this.element.style.borderTopColor = '#3a3a3a';
    this.element.style.borderLeftColor = '#353535';
    this.element.style.boxShadow = '0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)';
    this.titleText.style.color = '#888';
  }

  minimize() {
    this.minimized = true;
    // Animate minimize
    this.element.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out';
    this.element.style.transform = 'scale(0.8)';
    this.element.style.opacity = '0';
    setTimeout(() => {
      this.element.style.display = 'none';
      this.element.style.transition = '';
      this.element.style.transform = '';
      this.element.style.opacity = '';
    }, 150);
    this.wm?.userMinimized(this.id);
  }

  restore() {
    if (this.maximized) {
      this.maximized = false;
      // Animate restore from maximized
      this.element.style.transition = 'all 0.15s ease-out';
      this.x = this.preMaxX;
      this.y = this.preMaxY;
      this.width = this.preMaxWidth;
      this.height = this.preMaxHeight;
      this.element.style.left = this.x + 'px';
      this.element.style.top = this.y + 'px';
      this.element.style.width = this.width + 'px';
      this.element.style.height = this.height + 'px';
      this.element.style.borderRadius = '6px';
      setTimeout(() => {
        this.element.style.transition = '';
        this.onResize();
      }, 150);
      this.wm?.userRestored(this.id);
    }
    if (this.minimized) {
      this.minimized = false;
      // Animate restore from minimized
      this.element.style.transform = 'scale(0.8)';
      this.element.style.opacity = '0';
      this.element.style.display = 'flex';
      // Force reflow
      this.element.offsetHeight;
      this.element.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out';
      this.element.style.transform = 'scale(1)';
      this.element.style.opacity = '1';
      setTimeout(() => {
        this.element.style.transition = '';
        this.element.style.transform = '';
        this.element.style.opacity = '';
      }, 150);
      this.wm?.focusWindow(this.id);
    }
  }

  maximize() {
    if (this.maximized) return;

    // Save current geometry
    this.preMaxX = this.x;
    this.preMaxY = this.y;
    this.preMaxWidth = this.width;
    this.preMaxHeight = this.height;

    // Maximize to window area with animation
    this.maximized = true;
    this.element.style.transition = 'all 0.15s ease-out';
    this._applyMaximized();
    setTimeout(() => {
      this.element.style.transition = '';
    }, 150);
    this.wm?.userMaximized(this.id);
  }

  _applyMaximized() {
    const area = this.wm?.getWindowArea() || { width: 800, height: 600 };
    this.x = 0;
    this.y = 0;
    this.width = area.width;
    this.height = area.height;
    this.element.style.left = '0px';
    this.element.style.top = '0px';
    this.element.style.width = this.width + 'px';
    this.element.style.height = this.height + 'px';
    this.element.style.borderRadius = '0';
    setTimeout(() => this.onResize(), 150);
  }

  close() {
    this.wm?.closeWindow(this.id);
  }

  setTitle(title) {
    this.title = title;
    if (this.titleText) {
      this.titleText.textContent = title;
    }
  }

  setIcon(icon) {
    this.icon = icon;
    if (this.iconEl) {
      if (icon) {
        this.iconEl.textContent = icon;
        this.iconEl.style.display = '';
      } else {
        this.iconEl.textContent = '';
        this.iconEl.style.display = 'none';
      }
    }
    // Also update taskbar button
    this.wm?.taskbar?.updateButtonIcon(this.id, icon);
  }

  updateGeometry(changes) {
    if (changes.x !== undefined) this.x = changes.x;
    if (changes.y !== undefined) this.y = changes.y;
    if (changes.width !== undefined) this.width = changes.width;
    if (changes.height !== undefined) this.height = changes.height;

    if (this.element) {
      this.element.style.left = this.x + 'px';
      this.element.style.top = this.y + 'px';
      this.element.style.width = this.width + 'px';
      this.element.style.height = this.height + 'px';
    }

    if (changes.minimized !== undefined && changes.minimized !== this.minimized) {
      if (changes.minimized) this.minimize();
      else this.restore();
    }

    if (changes.maximized !== undefined && changes.maximized !== this.maximized) {
      if (changes.maximized) this.maximize();
      else this.restore();
    }
  }

  flash() {
    this.element.style.animation = 'window-flash 0.5s ease 3';
    setTimeout(() => {
      this.element.style.animation = '';
    }, 1500);
  }

  /**
   * Override in subclasses to handle resize
   */
  onResize() {}

  /**
   * Override in subclasses to handle channel data
   */
  onChannelData(data) {}
}

// Add flash animation
const style = document.createElement('style');
style.textContent = \\\`
  @keyframes window-flash {
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

    console.log(`[WindowBuilder] Built $.windowJs -> #${obj.id}`);
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'windowJs', this.obj.id);
  }
}

// Self-register
registerBuilder(WindowBuilder);
