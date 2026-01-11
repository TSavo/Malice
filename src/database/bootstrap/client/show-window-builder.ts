import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the ShowWindow class client module
 *
 * Creates $.showWindowJs which serves /js/show-window.js
 * Generic window type for player.show() - displays object images or HTML content.
 */
export class ShowWindowBuilder implements Builder {
  static provides = ['showWindowJs'];
  static depends = ['root'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const $ = this.manager as any;

    if ($.showWindowJs) {
      this.obj = $.showWindowJs;
      return;
    }

    const parentObj = $.root;
    if (!parentObj) throw new Error('ShowWindowBuilder: $root not found');

    this.obj = await this.manager.create({
      parent: parentObj,
      properties: {
        name: 'ShowWindow JS Module',
        description: 'Generic show window for player.show() API',
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
 * ShowWindow - Generic window for player.show() API
 * Can display either an object's image/info or raw HTML content.
 */
export class ShowWindow extends Window {
  constructor(wm, config) {
    super(wm, config);
    this.imageEl = null;
    this.nameEl = null;
    this.descEl = null;
    this.htmlEl = null;
    this.placeholderEl = null;
    this.contentType = null;  // 'object' or 'html'
    this.data = null;
  }

  /**
   * Initialize content area
   */
  initContent() {
    // Main container
    const container = document.createElement('div');
    container.className = 'show-window-content';
    container.style.cssText = \\\`
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: #0a0a0a;
      overflow: hidden;
      position: relative;
    \\\`;

    // Image container (for object type)
    const imageContainer = document.createElement('div');
    imageContainer.className = 'show-image-container';
    imageContainer.style.cssText = \\\`
      width: 100%;
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #0d0d0d;
      display: none;
    \\\`;
    this.imageContainer = imageContainer;

    // Object image
    this.imageEl = document.createElement('img');
    this.imageEl.className = 'show-image';
    this.imageEl.style.cssText = \\\`
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    \\\`;
    this.imageEl.onerror = () => {
      this.imageEl.style.opacity = '0';
      this._showPlaceholder();
    };
    this.imageEl.onload = () => {
      this.imageEl.style.opacity = '1';
      this._hidePlaceholder();
    };

    // Placeholder when no image available
    this.placeholderEl = document.createElement('div');
    this.placeholderEl.className = 'show-placeholder';
    this.placeholderEl.style.cssText = \\\`
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
      color: #333;
      font-size: 48px;
      transition: opacity 0.3s ease-in-out;
    \\\`;
    this.placeholderEl.innerHTML = '📦';

    imageContainer.appendChild(this.imageEl);
    imageContainer.appendChild(this.placeholderEl);

    // Info bar at bottom (for object type)
    const infoBar = document.createElement('div');
    infoBar.className = 'show-info-bar';
    infoBar.style.cssText = \\\`
      padding: 12px;
      background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.8));
      display: none;
    \\\`;
    this.infoBar = infoBar;

    // Object name
    this.nameEl = document.createElement('div');
    this.nameEl.className = 'show-name';
    this.nameEl.style.cssText = \\\`
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #00ff88;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    \\\`;

    // Object description
    this.descEl = document.createElement('div');
    this.descEl.className = 'show-description';
    this.descEl.style.cssText = \\\`
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      color: #888;
      line-height: 1.4;
      max-height: 60px;
      overflow: auto;
    \\\`;

    infoBar.appendChild(this.nameEl);
    infoBar.appendChild(this.descEl);

    // HTML container (for html type)
    this.htmlEl = document.createElement('div');
    this.htmlEl.className = 'show-html-content';
    this.htmlEl.style.cssText = \\\`
      width: 100%;
      height: 100%;
      padding: 16px;
      overflow: auto;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      color: #ccc;
      line-height: 1.6;
      display: none;
      box-sizing: border-box;
    \\\`;

    container.appendChild(imageContainer);
    container.appendChild(infoBar);
    container.appendChild(this.htmlEl);
    this.content.appendChild(container);

    // Add some basic styles for HTML content
    const style = document.createElement('style');
    style.textContent = \\\`
      .show-html-content h1, .show-html-content h2, .show-html-content h3 {
        color: #00ff88;
        margin: 0 0 12px 0;
      }
      .show-html-content p {
        margin: 0 0 12px 0;
      }
      .show-html-content a {
        color: #00aaff;
      }
      .show-html-content ul, .show-html-content ol {
        margin: 0 0 12px 0;
        padding-left: 24px;
      }
      .show-html-content code {
        background: #1a1a1a;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: monospace;
      }
      .show-html-content pre {
        background: #1a1a1a;
        padding: 12px;
        border-radius: 4px;
        overflow-x: auto;
      }
      .show-html-content img {
        max-width: 100%;
        height: auto;
      }
    \\\`;
    this.content.appendChild(style);
  }

  _showPlaceholder() {
    if (this.placeholderEl) {
      this.placeholderEl.style.opacity = '1';
    }
  }

  _hidePlaceholder() {
    if (this.placeholderEl) {
      this.placeholderEl.style.opacity = '0';
    }
  }

  /**
   * Set content from show state data
   * @param data - { type: 'object'|'html', ... }
   */
  setContent(data) {
    this.data = data;
    this.contentType = data.type;

    if (data.type === 'object') {
      this._showObject(data);
    } else if (data.type === 'html') {
      this._showHtml(data);
    }
  }

  _showObject(data) {
    // Hide HTML, show image/info
    this.htmlEl.style.display = 'none';
    this.imageContainer.style.display = 'block';
    this.infoBar.style.display = 'block';

    // Set name and description
    if (this.nameEl) {
      this.nameEl.textContent = data.name || '';
    }
    if (this.descEl) {
      this.descEl.textContent = data.description || '';
    }

    // Set image
    if (this.imageEl) {
      if (data.imageUrl) {
        this.imageEl.src = data.imageUrl;
        // onload/onerror handlers will handle display
      } else {
        this.imageEl.style.opacity = '0';
        this._showPlaceholder();
      }
    }
  }

  _showHtml(data) {
    // Hide image/info, show HTML
    this.imageContainer.style.display = 'none';
    this.infoBar.style.display = 'none';
    this.htmlEl.style.display = 'block';

    // Set HTML content
    if (this.htmlEl && data.html) {
      this.htmlEl.innerHTML = data.html;
    }
  }

  /**
   * Clear content
   */
  clear() {
    this.data = null;
    this.contentType = null;

    if (this.imageEl) {
      this.imageEl.style.opacity = '0';
      this.imageEl.src = '';
    }
    if (this.nameEl) {
      this.nameEl.textContent = '';
    }
    if (this.descEl) {
      this.descEl.textContent = '';
    }
    if (this.htmlEl) {
      this.htmlEl.innerHTML = '';
    }
    this._showPlaceholder();
  }

  /**
   * Handle channel data
   */
  onChannelData(data) {
    if (data && typeof data === 'object') {
      if (data.action === 'update') {
        this.setContent(data);
      } else if (data.action === 'clear') {
        this.clear();
      }
    }
  }

  /**
   * Handle resize
   */
  onResize() {}
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

    console.log(`[ShowWindowBuilder] Built $.showWindowJs -> #${obj.id}`);
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'showWindowJs', this.obj.id);
  }
}

// Self-register
registerBuilder(ShowWindowBuilder);
