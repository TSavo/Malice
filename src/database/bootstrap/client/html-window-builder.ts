import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the HtmlWindow class client module
 *
 * Creates $.htmlWindowJs which serves /js/html-window.js
 * Window type for displaying rich HTML content.
 */
export class HtmlWindowBuilder implements Builder {
  static provides = ['htmlWindowJs'];
  static depends = ['root'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const $ = this.manager as any;

    if ($.htmlWindowJs && !forceRebuild) {
      this.obj = $.htmlWindowJs;
      return;
    }

    const parentObj = $.root;
    if (!parentObj) throw new Error('HtmlWindowBuilder: $root not found');

    this.obj = await this.manager.create({
      parent: parentObj,
      properties: {
        name: 'HtmlWindow JS Module',
        description: 'Rich HTML content window',
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
 * HtmlWindow - Window for displaying rich HTML content
 * Extends base Window with scrollable HTML container.
 */
export class HtmlWindow extends Window {
  constructor(wm, config) {
    super(wm, config);
    this.contentDiv = null;
  }

  /**
   * Initialize HTML content area
   */
  initContent() {
    // Create scrollable content container
    this.contentDiv = document.createElement('div');
    this.contentDiv.className = 'html-window-content';
    this.contentDiv.style.cssText = \\\`
      width: 100%;
      height: 100%;
      overflow: auto;
      padding: 16px;
      box-sizing: border-box;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #e0e0e0;
      background: #1a1a1a;
    \\\`;

    this.content.appendChild(this.contentDiv);

    // Set initial content if provided
    if (this.config.content) {
      this.setContent(this.config.content);
    }
  }

  /**
   * Set HTML content
   */
  setContent(html) {
    if (this.contentDiv) {
      // Sanitize HTML to prevent XSS
      // For now, trust server content - in production use DOMPurify
      this.contentDiv.innerHTML = html;

      // Style links
      const links = this.contentDiv.querySelectorAll('a');
      links.forEach(link => {
        link.style.color = '#00ff88';
        link.style.textDecoration = 'none';
        link.addEventListener('mouseover', () => {
          link.style.textDecoration = 'underline';
        });
        link.addEventListener('mouseout', () => {
          link.style.textDecoration = 'none';
        });
      });

      // Style code blocks
      const codeBlocks = this.contentDiv.querySelectorAll('pre, code');
      codeBlocks.forEach(block => {
        block.style.backgroundColor = '#0d0d0d';
        block.style.padding = block.tagName === 'PRE' ? '12px' : '2px 6px';
        block.style.borderRadius = '4px';
        block.style.fontFamily = 'ui-monospace, monospace';
        block.style.fontSize = '13px';
      });

      // Style headings
      const headings = this.contentDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(h => {
        h.style.color = '#ffffff';
        h.style.marginTop = '1.5em';
        h.style.marginBottom = '0.5em';
      });
    }
  }

  /**
   * Append HTML content
   */
  appendContent(html) {
    if (this.contentDiv) {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      while (temp.firstChild) {
        this.contentDiv.appendChild(temp.firstChild);
      }
    }
  }

  /**
   * Clear content
   */
  clearContent() {
    if (this.contentDiv) {
      this.contentDiv.innerHTML = '';
    }
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    if (this.contentDiv) {
      this.contentDiv.scrollTop = this.contentDiv.scrollHeight;
    }
  }

  /**
   * Handle channel data
   */
  onChannelData(data) {
    if (typeof data === 'string') {
      // Append raw HTML
      this.appendContent(data);
      this.scrollToBottom();
    } else if (data && typeof data === 'object') {
      // Handle structured content
      if (data.action === 'set') {
        this.setContent(data.content || '');
      } else if (data.action === 'append') {
        this.appendContent(data.content || '');
        this.scrollToBottom();
      } else if (data.action === 'clear') {
        this.clearContent();
      } else if (data.content) {
        // Default: set content
        this.setContent(data.content);
      }
    }
  }

  /**
   * Handle resize
   */
  onResize() {
    // No special handling needed for HTML content
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

    console.log(`[HtmlWindowBuilder] Built $.htmlWindowJs -> #${obj.id}`);
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'htmlWindowJs', this.obj.id);
  }
}

// Self-register
registerBuilder(HtmlWindowBuilder);
