import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the IframeWindow class client module
 *
 * Creates $.iframeWindowJs which serves /js/iframe-window.js
 * Window type for loading external URLs in sandboxed iframes.
 */
export class IframeWindowBuilder implements Builder {
  static provides = ['iframeWindowJs'];
  static depends = ['root'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const $ = this.manager as any;

    if ($.iframeWindowJs) {
      this.obj = $.iframeWindowJs;
      return;
    }

    const parentObj = $.root;
    if (!parentObj) throw new Error('IframeWindowBuilder: $root not found');

    this.obj = await this.manager.create({
      parent: parentObj,
      properties: {
        name: 'IframeWindow JS Module',
        description: 'URL loading window with sandboxed iframe',
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
 * IframeWindow - Window for loading external URLs
 * Extends base Window with sandboxed iframe container.
 */
export class IframeWindow extends Window {
  constructor(wm, config) {
    super(wm, config);
    this.iframe = null;
    this.loadingOverlay = null;
    this.currentUrl = null;
  }

  /**
   * Initialize iframe content area
   */
  initContent() {
    // Create loading overlay
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.style.cssText = \\\`
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      color: #888;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      z-index: 1;
    \\\`;
    this.loadingOverlay.textContent = 'Loading...';
    this.content.appendChild(this.loadingOverlay);

    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.style.cssText = \\\`
      width: 100%;
      height: 100%;
      border: none;
      background: #ffffff;
    \\\`;

    // Sandbox for security
    this.iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';

    // Hide loading overlay when loaded
    this.iframe.addEventListener('load', () => {
      if (this.loadingOverlay) {
        this.loadingOverlay.style.display = 'none';
      }
    });

    // Handle load errors
    this.iframe.addEventListener('error', () => {
      if (this.loadingOverlay) {
        this.loadingOverlay.textContent = 'Failed to load content';
        this.loadingOverlay.style.color = '#ff6666';
      }
    });

    this.content.appendChild(this.iframe);

    // Load initial URL if provided
    if (this.config.url) {
      this.loadUrl(this.config.url);
    }
  }

  /**
   * Load a URL
   */
  loadUrl(url) {
    if (this.iframe) {
      // Show loading overlay
      if (this.loadingOverlay) {
        this.loadingOverlay.style.display = 'flex';
        this.loadingOverlay.textContent = 'Loading...';
        this.loadingOverlay.style.color = '#888';
      }

      // Validate URL (basic security)
      try {
        const parsed = new URL(url);
        // Only allow http/https
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('Invalid protocol');
        }
        this.iframe.src = url;
        this.currentUrl = url;
      } catch (e) {
        if (this.loadingOverlay) {
          this.loadingOverlay.textContent = 'Invalid URL';
          this.loadingOverlay.style.color = '#ff6666';
        }
      }
    }
  }

  /**
   * Reload current URL
   */
  reload() {
    if (this.iframe && this.currentUrl) {
      this.loadUrl(this.currentUrl);
    }
  }

  /**
   * Clear iframe
   */
  clear() {
    if (this.iframe) {
      this.iframe.src = 'about:blank';
      this.currentUrl = null;
      if (this.loadingOverlay) {
        this.loadingOverlay.style.display = 'flex';
        this.loadingOverlay.textContent = 'No content';
        this.loadingOverlay.style.color = '#888';
      }
    }
  }

  /**
   * Handle channel data
   */
  onChannelData(data) {
    if (typeof data === 'string') {
      // Treat as URL
      this.loadUrl(data);
    } else if (data && typeof data === 'object') {
      // Handle structured commands
      if (data.action === 'load' && data.url) {
        this.loadUrl(data.url);
      } else if (data.action === 'reload') {
        this.reload();
      } else if (data.action === 'clear') {
        this.clear();
      } else if (data.url) {
        // Default: load URL
        this.loadUrl(data.url);
      }
    }
  }

  /**
   * Handle resize - iframe handles this automatically
   */
  onResize() {
    // No special handling needed
  }

  /**
   * Override close to clean up iframe
   */
  close() {
    if (this.iframe) {
      this.iframe.src = 'about:blank';
    }
    super.close();
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

    console.log(`[IframeWindowBuilder] Built $.iframeWindowJs -> #${obj.id}`);
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'iframeWindowJs', this.obj.id);
  }
}

// Self-register
registerBuilder(IframeWindowBuilder);
