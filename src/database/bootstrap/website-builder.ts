import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Website objects for the Malice web server
 *
 * Creates:
 * - $webSite - Routes requests, main entry point
 * - $webTemplate - Prototype for HTML templates
 * - $webPage - Prototype for page content
 * - $.landingTemplate, $.terminalTemplate, $.docTemplate - Template instances
 * - $.homepage, $.playPage - Page instances
 *
 * All website content is stored in MongoDB as MOO objects.
 * The TypeScript web server delegates everything to $webSite.handleRequest().
 */
export class WebsiteBuilder {
  private webSite: RuntimeObject | null = null;
  private webTemplate: RuntimeObject | null = null;
  private webPage: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const root = await this.manager.load(1);
    if (!root) throw new Error('Root prototype not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    // Build $webTemplate prototype
    await this.buildWebTemplate(root, aliases, forceRebuild);

    // Build $webPage prototype
    await this.buildWebPage(root, aliases, forceRebuild);

    // Build $webSite singleton
    await this.buildWebSite(root, aliases, forceRebuild);

    // Build template instances
    await this.buildTemplateInstances(forceRebuild);

    // Build page instances
    await this.buildPageInstances(forceRebuild);
  }

  private async buildWebTemplate(
    root: RuntimeObject,
    aliases: Record<string, number>,
    forceRebuild: boolean
  ): Promise<void> {
    if (aliases.webTemplate) {
      this.webTemplate = await this.manager.load(aliases.webTemplate);
      if (this.webTemplate && !forceRebuild) return;
    }

    if (!this.webTemplate) {
      this.webTemplate = await this.manager.create({
        parent: root,
        properties: {
          name: 'Web Template',
          description: 'Prototype for HTML page templates',
          layout: '',
        },
        methods: {},
      });
    }

    // render(data) - Substitute {{placeholders}} with data
    this.webTemplate.setMethod('render', `
      const data = args[0] || {};
      let html = self.layout || '';

      // Replace all {{key}} placeholders
      for (const [key, value] of Object.entries(data)) {
        const placeholder = '{{' + key + '}}';
        html = html.split(placeholder).join(String(value || ''));
      }

      // Remove any unreplaced placeholders
      html = html.replace(/\\{\\{[^}]+\\}\\}/g, '');

      return html;
    `);
  }

  private async buildWebPage(
    root: RuntimeObject,
    aliases: Record<string, number>,
    forceRebuild: boolean
  ): Promise<void> {
    if (aliases.webPage) {
      this.webPage = await this.manager.load(aliases.webPage);
      if (this.webPage && !forceRebuild) return;
    }

    if (!this.webPage) {
      this.webPage = await this.manager.create({
        parent: root,
        properties: {
          name: 'Web Page',
          description: 'Prototype for web pages',
          path: '/',
          title: 'Untitled',
          content: '',
          contentType: 'html', // 'html' or 'markdown'
          published: true,
        },
        methods: {},
      });
    }

    // render() - Render content through template
    this.webPage.setMethod('render', `
      const template = self.template;
      if (!template) {
        return '<html><body>' + (self.content || '') + '</body></html>';
      }

      let content = self.content || '';

      // If markdown, convert to HTML
      if (self.contentType === 'markdown') {
        // Simple markdown conversion (basic support)
        content = content
          // Headers
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^# (.+)$/gm, '<h1>$1</h1>')
          // Bold and italic
          .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
          .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
          // Links
          .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2">$1</a>')
          // Paragraphs (double newline)
          .replace(/\\n\\n/g, '</p><p>')
          // Line breaks
          .replace(/\\n/g, '<br>');

        if (!content.startsWith('<')) {
          content = '<p>' + content + '</p>';
        }
      }

      return await template.render({
        title: self.title || 'Malice',
        content: content,
        path: self.path || '/',
        description: self.description || '',
      });
    `);
  }

  private async buildWebSite(
    root: RuntimeObject,
    aliases: Record<string, number>,
    forceRebuild: boolean
  ): Promise<void> {
    if (aliases.webSite) {
      this.webSite = await this.manager.load(aliases.webSite);
      if (this.webSite && !forceRebuild) return;
    }

    if (!this.webSite) {
      this.webSite = await this.manager.create({
        parent: root,
        properties: {
          name: 'Web Site',
          description: 'Main website routing and logic',
        },
        methods: {},
      });
    }

    // handleRequest(path, method, meta) - Main entry point
    this.webSite.setMethod('handleRequest', `
      const path = args[0] || '/';
      const method = args[1] || 'GET';
      // const meta = args[2] || {};

      // Find page by path
      const page = await self.getPage(path);

      if (page) {
        if (!page.published) {
          return { status: 404, body: await self.render404(path) };
        }
        const html = await page.render();
        return { status: 200, contentType: 'text/html', body: html };
      }

      // Check for /docs/* paths - serve from docs folder
      if (path.startsWith('/docs')) {
        return await self.handleDocsRequest(path);
      }

      // 404
      return { status: 404, body: await self.render404(path) };
    `);

    // getPage(path) - Find page by path
    this.webSite.setMethod('getPage', `
      const path = args[0] || '/';

      // Get all webPage children
      const webPageId = $.aliases?.webPage;
      if (!webPageId) return null;

      // Query for pages with matching path
      const allObjects = await $.objectManager.getAllIds();
      for (const id of allObjects) {
        const obj = await $load(id);
        if (!obj) continue;

        // Check if it's a webPage (has path property and inherits from webPage)
        if (obj.path === path && obj.parent?.id === webPageId) {
          return obj;
        }
      }

      return null;
    `);

    // handleDocsRequest(path) - Serve documentation from docs folder
    this.webSite.setMethod('handleDocsRequest', `
      const path = args[0] || '/docs';
      const fs = await import('fs');
      const pathModule = await import('path');

      // Map URL to file path
      let filePath = path.replace('/docs', './docs');
      if (filePath === './docs' || filePath === './docs/') {
        filePath = './docs/WHAT-IS-MALICE.md';
      } else if (!filePath.endsWith('.md')) {
        filePath = filePath + '.md';
      }

      try {
        if (!fs.existsSync(filePath)) {
          return { status: 404, body: await self.render404(path) };
        }

        const markdown = fs.readFileSync(filePath, 'utf-8');

        // Convert markdown to HTML (basic)
        let html = markdown
          .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-6 mb-2">$1</h3>')
          .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-3">$1</h2>')
          .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
          .replace(/\`\`\`(\\w*)([\\s\\S]*?)\`\`\`/g, '<pre class="bg-malice-surface p-4 rounded my-4 overflow-x-auto"><code>$2</code></pre>')
          .replace(/\`([^\`]+)\`/g, '<code class="bg-malice-surface px-1 rounded">$1</code>')
          .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
          .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
          .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" class="text-malice-accent hover:underline">$1</a>')
          .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
          .replace(/(<li.*<\\/li>\\n?)+/g, '<ul class="list-disc my-4">$&</ul>')
          .replace(/\\n\\n/g, '</p><p class="my-4">')
          .replace(/\\n/g, '<br>');

        // Wrap in paragraph if needed
        if (!html.startsWith('<')) {
          html = '<p class="my-4">' + html + '</p>';
        }

        // Get doc template
        const docTemplate = $.docTemplate;
        if (docTemplate) {
          const title = markdown.match(/^# (.+)$/m)?.[1] || 'Documentation';
          const fullHtml = await docTemplate.render({
            title: title + ' - Malice',
            content: '<article class="prose prose-invert max-w-none">' + html + '</article>',
          });
          return { status: 200, contentType: 'text/html', body: fullHtml };
        }

        return { status: 200, contentType: 'text/html', body: html };
      } catch (err) {
        return { status: 500, body: 'Error loading documentation: ' + String(err) };
      }
    `);

    // render404(path) - Render 404 page
    this.webSite.setMethod('render404', `
      const path = args[0] || '/';

      return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>404 - Malice</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
</head>
<body class="bg-[#0a0a0a] text-gray-200 font-mono min-h-screen flex items-center justify-center">
  <div class="text-center">
    <h1 class="text-6xl font-bold text-[#ff3366] mb-4">404</h1>
    <p class="text-xl text-gray-400 mb-8">Nothing here but ghosts.</p>
    <a href="/" class="text-[#00ff88] hover:underline">Return to safety</a>
  </div>
</body>
</html>\`;
    `);
  }

  private async buildTemplateInstances(forceRebuild: boolean): Promise<void> {
    if (!this.webTemplate) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    // Landing Template
    let landingTemplate: RuntimeObject | null = null;
    if (aliases.landingTemplate) {
      landingTemplate = await this.manager.load(aliases.landingTemplate);
    }
    if (!landingTemplate) {
      landingTemplate = await this.manager.create({
        parent: this.webTemplate,
        properties: {
          name: 'Landing Template',
          layout: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <meta name="description" content="{{description}}">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
          colors: {
            malice: {
              bg: '#0a0a0a',
              surface: '#141414',
              accent: '#00ff88',
              danger: '#ff3366'
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-malice-bg text-gray-200 font-mono min-h-screen">
  <nav class="border-b border-gray-800 px-6 py-4">
    <div class="max-w-6xl mx-auto flex justify-between items-center">
      <a href="/" class="text-xl font-bold text-malice-accent">MALICE</a>
      <div class="flex gap-6">
        <a href="/play" class="hover:text-malice-accent transition">Play</a>
        <a href="/docs" class="hover:text-malice-accent transition">Docs</a>
      </div>
    </div>
  </nav>
  <main>
    {{content}}
  </main>
  <footer class="border-t border-gray-800 px-6 py-8 mt-20">
    <div class="max-w-6xl mx-auto text-center text-gray-500 text-sm">
      <p>Malice doesn't care.</p>
    </div>
  </footer>
</body>
</html>`,
        },
        methods: {},
      });
    } else if (forceRebuild) {
      // Update layout on force rebuild
      landingTemplate.set('layout', landingTemplate.get('layout') as string);
    }

    // Terminal Template
    let terminalTemplate: RuntimeObject | null = null;
    if (aliases.terminalTemplate) {
      terminalTemplate = await this.manager.load(aliases.terminalTemplate);
    }
    if (!terminalTemplate) {
      terminalTemplate = await this.manager.create({
        parent: this.webTemplate,
        properties: {
          name: 'Terminal Template',
          layout: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; background: #0a0a0a; }
    #terminal { height: 100%; width: 100%; }
    .xterm { height: 100%; }
    #status {
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 4px 12px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      z-index: 1000;
    }
    .status-connecting { background: #f59e0b; color: #000; }
    .status-connected { background: #00ff88; color: #000; }
    .status-disconnected { background: #ff3366; color: #fff; }
  </style>
</head>
<body>
  <div id="status" class="status-connecting">Connecting...</div>
  <div id="terminal"></div>

  <script type="module">
    import { Terminal } from 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/+esm';
    import { FitAddon } from 'https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/+esm';
    import { WebLinksAddon } from 'https://cdn.jsdelivr.net/npm/xterm-addon-web-links@0.9.0/+esm';

    const statusEl = document.getElementById('status');

    const term = new Terminal({
      theme: {
        background: '#0a0a0a',
        foreground: '#e0e0e0',
        cursor: '#00ff88',
        cursorAccent: '#0a0a0a',
        selectionBackground: '#00ff8844',
      },
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(document.getElementById('terminal'));
    fitAddon.fit();

    window.addEventListener('resize', () => fitAddon.fit());

    // Connect to game server
    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPort = 8080;
    const wsUrl = wsProtocol + '//' + location.hostname + ':' + wsPort;

    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    function connect() {
      statusEl.textContent = 'Connecting...';
      statusEl.className = 'status-connecting';

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        statusEl.textContent = 'Connected';
        statusEl.className = 'status-connected';
        reconnectAttempts = 0;

        // Hide status after 2 seconds
        setTimeout(() => {
          statusEl.style.opacity = '0.3';
        }, 2000);
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onclose = () => {
        statusEl.textContent = 'Disconnected';
        statusEl.className = 'status-disconnected';
        statusEl.style.opacity = '1';

        term.write('\\r\\n\\x1b[31mDisconnected from server.\\x1b[0m\\r\\n');

        // Attempt reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          term.write('\\x1b[33mReconnecting in ' + (delay/1000) + 's...\\x1b[0m\\r\\n');
          setTimeout(connect, delay);
        } else {
          term.write('\\x1b[31mMax reconnection attempts reached. Refresh to try again.\\x1b[0m\\r\\n');
        }
      };

      ws.onerror = () => {
        statusEl.textContent = 'Error';
        statusEl.className = 'status-disconnected';
      };
    }

    term.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Focus terminal on click
    document.getElementById('terminal').addEventListener('click', () => {
      term.focus();
    });

    // Start connection
    connect();
    term.focus();
  </script>
</body>
</html>`,
        },
        methods: {},
      });
    }

    // Doc Template
    let docTemplate: RuntimeObject | null = null;
    if (aliases.docTemplate) {
      docTemplate = await this.manager.load(aliases.docTemplate);
    }
    if (!docTemplate) {
      docTemplate = await this.manager.create({
        parent: this.webTemplate,
        properties: {
          name: 'Doc Template',
          layout: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
          colors: {
            malice: {
              bg: '#0a0a0a',
              surface: '#141414',
              accent: '#00ff88',
              danger: '#ff3366'
            }
          }
        }
      }
    }
  </script>
  <style>
    .prose h1 { color: #00ff88; }
    .prose h2 { color: #e0e0e0; border-bottom: 1px solid #333; padding-bottom: 0.5rem; }
    .prose h3 { color: #d0d0d0; }
    .prose a { color: #00ff88; }
    .prose code { background: #141414; padding: 0.125rem 0.25rem; border-radius: 0.25rem; }
    .prose pre { background: #141414; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    .prose pre code { background: transparent; padding: 0; }
    .prose ul { list-style-type: disc; margin-left: 1.5rem; }
    .prose li { margin: 0.25rem 0; }
  </style>
</head>
<body class="bg-malice-bg text-gray-200 font-mono min-h-screen">
  <nav class="border-b border-gray-800 px-6 py-4">
    <div class="max-w-6xl mx-auto flex justify-between items-center">
      <a href="/" class="text-xl font-bold text-malice-accent">MALICE</a>
      <div class="flex gap-6">
        <a href="/play" class="hover:text-malice-accent transition">Play</a>
        <a href="/docs" class="text-malice-accent">Docs</a>
      </div>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto px-6 py-12">
    {{content}}
  </main>
  <footer class="border-t border-gray-800 px-6 py-8 mt-12">
    <div class="max-w-6xl mx-auto text-center text-gray-500 text-sm">
      <a href="/" class="hover:text-malice-accent">Home</a>
      <span class="mx-2">|</span>
      <a href="/docs" class="hover:text-malice-accent">Documentation</a>
    </div>
  </footer>
</body>
</html>`,
        },
        methods: {},
      });
    }

    // Store references for page building
    this._landingTemplate = landingTemplate;
    this._terminalTemplate = terminalTemplate;
    this._docTemplate = docTemplate;
  }

  private _landingTemplate: RuntimeObject | null = null;
  private _terminalTemplate: RuntimeObject | null = null;
  private _docTemplate: RuntimeObject | null = null;

  private async buildPageInstances(_forceRebuild: boolean): Promise<void> {
    if (!this.webPage) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    // Homepage
    let homepage: RuntimeObject | null = null;
    if (aliases.homepage) {
      homepage = await this.manager.load(aliases.homepage);
    }
    if (!homepage) {
      homepage = await this.manager.create({
        parent: this.webPage,
        properties: {
          name: 'Homepage',
          path: '/',
          title: 'Malice',
          template: this._landingTemplate,
          contentType: 'html',
          published: true,
          description: 'Hardcore survival cyberpunk text game. Permadeath. No hand-holding.',
          content: `
<div class="max-w-4xl mx-auto px-6 py-20">
  <h1 class="text-5xl md:text-7xl font-bold text-malice-accent mb-6">
    You'll regret everything.
  </h1>
  <p class="text-2xl md:text-3xl text-gray-400 mb-12">
    And you'll do it anyway. That's the game.
  </p>

  <div class="space-y-6 text-lg text-gray-300 max-w-2xl">
    <p>
      <strong class="text-white">Malice</strong> is a hardcore survival cyberpunk text game
      set in post-apocalyptic Seattle, 2110.
    </p>
    <p>
      No tutorials. No quest markers. No respawns.
      <span class="text-malice-danger">Permadeath is permanent.</span>
    </p>
    <p class="text-gray-500">
      This is not a game for everyone. It's barely a game at all.
    </p>
  </div>

  <div class="mt-16 flex flex-wrap gap-4">
    <a href="/play" class="px-8 py-4 bg-malice-accent text-black font-bold hover:bg-green-400 transition text-lg">
      Enter
    </a>
    <a href="/docs" class="px-8 py-4 border border-gray-600 hover:border-malice-accent hover:text-malice-accent transition text-lg">
      Read the Rules
    </a>
  </div>

  <div class="mt-24 pt-12 border-t border-gray-800">
    <h2 class="text-xl font-bold mb-6 text-gray-400">What Makes Malice Different</h2>
    <div class="grid md:grid-cols-3 gap-8 text-sm">
      <div>
        <h3 class="text-malice-accent font-bold mb-2">Permadeath</h3>
        <p class="text-gray-400">Your character dies, they're gone. Clones only remember up to their last backup.</p>
      </div>
      <div>
        <h3 class="text-malice-accent font-bold mb-2">Real Time</h3>
        <p class="text-gray-400">Your body needs food, water, and warmth 24/7. The world doesn't pause.</p>
      </div>
      <div>
        <h3 class="text-malice-accent font-bold mb-2">Player Driven</h3>
        <p class="text-gray-400">No NPCs, no quests. Every character you meet is a real person or AI agent.</p>
      </div>
    </div>
  </div>
</div>`,
        },
        methods: {},
      });
    }

    // Play Page
    let playPage: RuntimeObject | null = null;
    if (aliases.playPage) {
      playPage = await this.manager.load(aliases.playPage);
    }
    if (!playPage) {
      playPage = await this.manager.create({
        parent: this.webPage,
        properties: {
          name: 'Play Page',
          path: '/play',
          title: 'Play - Malice',
          template: this._terminalTemplate,
          contentType: 'html',
          published: true,
          content: '', // Terminal template handles everything
        },
        methods: {},
      });
    }

    // Store for alias registration
    this._homepage = homepage;
    this._playPage = playPage;
  }

  private _homepage: RuntimeObject | null = null;
  private _playPage: RuntimeObject | null = null;

  async registerAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const register = async (alias: string, obj: RuntimeObject | null) => {
      if (obj) {
        await objectManager.call('addAlias', alias, obj.id);
        console.log(`✅ Registered ${alias} alias -> #${obj.id}`);
      }
    };

    // Prototypes
    await register('webTemplate', this.webTemplate);
    await register('webPage', this.webPage);
    await register('webSite', this.webSite);

    // Template instances
    await register('landingTemplate', this._landingTemplate);
    await register('terminalTemplate', this._terminalTemplate);
    await register('docTemplate', this._docTemplate);

    // Page instances
    await register('homepage', this._homepage);
    await register('playPage', this._playPage);
  }
}
