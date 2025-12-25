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

    // Note: Routes are built in registerAliases() after webRoute/webRouter aliases exist
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
    // Delegates to $webRouter for registered routes, then falls back to page lookup
    this.webSite.setMethod('handleRequest', `
      const path = args[0] || '/';
      const method = args[1] || 'GET';
      const meta = args[2] || {};

      // First, try the router for registered routes (API, docs, etc.)
      if ($.webRouter) {
        const routerResult = await $.webRouter.dispatch(path, method, meta);
        if (routerResult) {
          return routerResult;
        }
      }

      // Fall back to page lookup for content pages
      const page = await self.getPage(path);

      if (page) {
        if (!page.published) {
          return { status: 404, contentType: 'text/html', body: await self.render404(path) };
        }
        const html = await page.render();
        return { status: 200, contentType: 'text/html', body: html };
      }

      // 404
      return { status: 404, contentType: 'text/html', body: await self.render404(path) };
    `);

    // getPage(path) - Find page by path
    this.webSite.setMethod('getPage', `
      const path = args[0] || '/';

      // Get all webPage children
      const webPageId = $.aliases?.webPage;
      if (!webPageId) return null;

      // Query for pages with matching path
      const allObjects = $.getAllIds();
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
  private _docsRoute: RuntimeObject | null = null;
  private _mapRoute: RuntimeObject | null = null;
  private _mapAdminRoute: RuntimeObject | null = null;
  private _mapRoomsRoute: RuntimeObject | null = null;
  private _mapPlayersRoute: RuntimeObject | null = null;
  private _mapPlayersAdminRoute: RuntimeObject | null = null;

  private async buildRoutes(
    aliases: Record<string, number>,
    _forceRebuild: boolean
  ): Promise<void> {
    console.log('[WebsiteBuilder] buildRoutes() called');

    // Get webRoute prototype
    const webRouteId = aliases.webRoute;
    console.log(`[WebsiteBuilder] webRoute alias: ${webRouteId}`);
    if (!webRouteId) {
      console.log('⚠️ webRoute alias not found, skipping route registration');
      return;
    }
    const webRoute = await this.manager.load(webRouteId);
    if (!webRoute) {
      console.log('⚠️ webRoute prototype not found, skipping route registration');
      return;
    }
    console.log(`[WebsiteBuilder] webRoute loaded: #${webRoute.id}`);

    // Build docs route
    console.log('[WebsiteBuilder] Checking docsRoute...');
    if (aliases.docsRoute) {
      console.log(`[WebsiteBuilder] docsRoute alias exists: ${aliases.docsRoute}, loading...`);
      this._docsRoute = await this.manager.load(aliases.docsRoute);
    }
    if (!this._docsRoute) {
      console.log('[WebsiteBuilder] Creating docsRoute...');
      this._docsRoute = await this.manager.create({
        parent: webRoute,
        properties: {
          name: 'Docs Route',
          description: 'Serves documentation from /docs/*',
          path: '/docs/*',
          methods: ['GET'],
          contentType: 'text/html',
          requiresAuth: false,
        },
        methods: {},
      });
      console.log(`[WebsiteBuilder] docsRoute created: #${this._docsRoute?.id}`);
    } else {
      console.log(`[WebsiteBuilder] docsRoute already exists: #${this._docsRoute?.id}`);
    }

    // Set the handler for docs route
    console.log('[WebsiteBuilder] Setting docsRoute handler...');
    if (this._docsRoute) {
      this._docsRoute.setMethod('handleRequest', `
        const params = args[0] || {};
        // const meta = args[1] || {};

        const fs = await import('fs');

        // Get the wildcard path (everything after /docs/)
        const docPath = params['*'] || '';

        // Map URL to file path
        let filePath = './docs/' + docPath;
        if (!docPath || docPath === '') {
          filePath = './docs/WHAT-IS-MALICE.md';
        } else if (!filePath.endsWith('.md')) {
          filePath = filePath + '.md';
        }

        try {
          if (!fs.existsSync(filePath)) {
            return {
              status: 404,
              contentType: 'text/html',
              body: '<h1>Documentation not found</h1><p>File: ' + filePath + '</p>'
            };
          }

          const markdown = fs.readFileSync(filePath, 'utf-8');

          // Convert markdown to HTML (basic)
          let html = markdown
            .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-6 mb-2">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-3">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
            .replace(/\\\`\\\`\\\`(\\w*)([\\s\\S]*?)\\\`\\\`\\\`/g, '<pre class="bg-malice-surface p-4 rounded my-4 overflow-x-auto"><code>$2</code></pre>')
            .replace(/\\\`([^\\\`]+)\\\`/g, '<code class="bg-malice-surface px-1 rounded">$1</code>')
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
          return {
            status: 500,
            contentType: 'text/html',
            body: 'Error loading documentation: ' + String(err)
          };
        }
      `);
      console.log('[WebsiteBuilder] docsRoute handler set');
    }

    // Build map API routes
    console.log('[WebsiteBuilder] Calling buildMapRoutes...');
    await this.buildMapRoutes(aliases, webRoute);
    console.log('[WebsiteBuilder] buildRoutes() complete');
  }

  private async buildMapRoutes(
    aliases: Record<string, number>,
    webRoute: RuntimeObject
  ): Promise<void> {
    console.log('[WebsiteBuilder] buildMapRoutes() called');
    console.log(`[WebsiteBuilder] webRoute parent: #${webRoute.id}`);

    // 1. RoomsRoute - /api/map/rooms
    console.log('[WebsiteBuilder] Building mapRoomsRoute...');
    if (aliases.mapRoomsRoute) {
      console.log(`[WebsiteBuilder] mapRoomsRoute alias exists: ${aliases.mapRoomsRoute}`);
      this._mapRoomsRoute = await this.manager.load(aliases.mapRoomsRoute);
    }
    if (!this._mapRoomsRoute) {
      console.log('[WebsiteBuilder] Creating mapRoomsRoute...');
      this._mapRoomsRoute = await this.manager.create({
        parent: webRoute,
        properties: {
          name: 'Map Rooms API Route',
          description: 'Returns room coordinates for map visualization',
          path: '/api/map/rooms',
          methods: ['GET'],
          contentType: 'application/json',
          requiresAuth: false,
        },
        methods: {},
      });
      console.log(`[WebsiteBuilder] mapRoomsRoute created: #${this._mapRoomsRoute?.id}`);
    } else {
      console.log(`[WebsiteBuilder] mapRoomsRoute already exists: #${this._mapRoomsRoute?.id}`);
    }

    if (this._mapRoomsRoute) {
      console.log('[WebsiteBuilder] Setting mapRoomsRoute handler...');
      this._mapRoomsRoute.setMethod('handleRequest', `
        const params = args[0] || {};
        const meta = args[1] || {};

        // Get all rooms from $world
        const allRooms = await $world.getAllRooms();

        // Filter by z_min if provided
        const zMin = meta.query?.z_min;
        let rooms = allRooms;
        if (zMin !== undefined) {
          const zMinNum = parseInt(zMin);
          if (!isNaN(zMinNum)) {
            rooms = rooms.filter(r => r.z >= zMinNum);
          }
        }

        // Return all rooms with names
        const filteredRooms = rooms.map(r => ({
          x: r.x,
          y: r.y,
          z: r.z,
          name: r.name
        }));

        return {
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ rooms: filteredRooms })
        };
      `);
      console.log('[WebsiteBuilder] mapRoomsRoute handler set');
    }

    // 2. PlayersRoute - /api/map/players (public, aggregated)
    console.log('[WebsiteBuilder] Building mapPlayersRoute...');
    if (aliases.mapPlayersRoute) {
      console.log(`[WebsiteBuilder] mapPlayersRoute alias exists: ${aliases.mapPlayersRoute}`);
      this._mapPlayersRoute = await this.manager.load(aliases.mapPlayersRoute);
    }
    if (!this._mapPlayersRoute) {
      console.log('[WebsiteBuilder] Creating mapPlayersRoute...');
      this._mapPlayersRoute = await this.manager.create({
        parent: webRoute,
        properties: {
          name: 'Map Players API Route',
          description: 'Returns aggregated player/NPC population heat map',
          path: '/api/map/players',
          methods: ['GET'],
          contentType: 'application/json',
          requiresAuth: false,
          cachedHeatmap: null,
          cacheTimestamp: 0,
        },
        methods: {},
      });
      console.log(`[WebsiteBuilder] mapPlayersRoute created: #${this._mapPlayersRoute?.id}`);
    } else {
      console.log(`[WebsiteBuilder] mapPlayersRoute already exists: #${this._mapPlayersRoute?.id}`);
    }

    if (this._mapPlayersRoute) {
      console.log('[WebsiteBuilder] Setting mapPlayersRoute handler...');
      this._mapPlayersRoute.setMethod('handleRequest', `
        const params = args[0] || {};
        const meta = args[1] || {};

        // Check cache (30 seconds)
        const now = Date.now();
        const cacheAge = now - (self.cacheTimestamp || 0);
        if (cacheAge < 30000 && self.cachedHeatmap) {
          return {
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              heatmap: self.cachedHeatmap,
              timestamp: self.cacheTimestamp,
              cached: true
            })
          };
        }

        // Get all connected players
        const connections = await $world.getAuthenticatedConnections();

        // Get all AI NPCs
        const npcIds = await $ai.getAll();

        // Collect positions
        const positions = [];

        // Add player positions
        for (const conn of connections) {
          try {
            const player = conn.player;
            if (!player || !player.location) continue;

            const loc = player.location;
            if (!loc) continue;

            const x = loc.x;
            const y = loc.y;
            const z = loc.z;

            if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
              // Filter to z >= 0 only (above ground)
              if (z >= 0) {
                positions.push({ x, y, z });
              }
            }
          } catch (err) {
            console.error('[MapPlayers] Error getting player position:', err);
          }
        }

        // Add NPC positions
        for (const npcId of npcIds) {
          try {
            const npc = await $load(npcId);
            if (!npc || !npc.location) continue;

            const loc = npc.location;
            if (!loc) continue;

            const x = loc.x;
            const y = loc.y;
            const z = loc.z;

            if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
              // Filter to z >= 0 only
              if (z >= 0) {
                positions.push({ x, y, z });
              }
            }
          } catch (err) {
            console.error('[MapPlayers] Error getting NPC position:', err);
          }
        }

        // Aggregate to 5x5 grid
        const gridSize = 5;
        const gridCounts = {};

        for (const pos of positions) {
          const gridX = Math.floor(pos.x / gridSize) * gridSize;
          const gridY = Math.floor(pos.y / gridSize) * gridSize;
          const gridZ = pos.z;
          const key = gridX + ',' + gridY + ',' + gridZ;

          gridCounts[key] = (gridCounts[key] || 0) + 1;
        }

        // Convert to array
        const heatmap = [];
        for (const [key, count] of Object.entries(gridCounts)) {
          const parts = key.split(',');
          heatmap.push({
            x: parseInt(parts[0]),
            y: parseInt(parts[1]),
            z: parseInt(parts[2]),
            count: count
          });
        }

        // Cache the result
        self.cachedHeatmap = heatmap;
        self.cacheTimestamp = now;

        return {
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            heatmap,
            timestamp: now,
            cached: false
          })
        };
      `);
      console.log('[WebsiteBuilder] mapPlayersRoute handler set');
    }

    // 3. PlayersAdminRoute - /api/map/players/admin (admin only, exact positions)
    console.log('[WebsiteBuilder] Building mapPlayersAdminRoute...');
    if (aliases.mapPlayersAdminRoute) {
      console.log(`[WebsiteBuilder] mapPlayersAdminRoute alias exists: ${aliases.mapPlayersAdminRoute}`);
      this._mapPlayersAdminRoute = await this.manager.load(aliases.mapPlayersAdminRoute);
    }
    if (!this._mapPlayersAdminRoute) {
      console.log('[WebsiteBuilder] Creating mapPlayersAdminRoute...');
      this._mapPlayersAdminRoute = await this.manager.create({
        parent: webRoute,
        properties: {
          name: 'Map Players Admin API Route',
          description: 'Returns exact player/NPC positions (admin only)',
          path: '/api/map/players/admin',
          methods: ['GET'],
          contentType: 'application/json',
          requiresAuth: 'admin',
        },
        methods: {},
      });
      console.log(`[WebsiteBuilder] mapPlayersAdminRoute created: #${this._mapPlayersAdminRoute?.id}`);
    } else {
      console.log(`[WebsiteBuilder] mapPlayersAdminRoute already exists: #${this._mapPlayersAdminRoute?.id}`);
    }

    if (this._mapPlayersAdminRoute) {
      console.log('[WebsiteBuilder] Setting mapPlayersAdminRoute handler...');
      this._mapPlayersAdminRoute.setMethod('handleRequest', `
        const params = args[0] || {};
        const meta = args[1] || {};

        // Get all connected players
        const connections = await $world.getAuthenticatedConnections();

        // Get all AI NPCs
        const npcIds = await $ai.getAll();

        const agents = [];

        // Add players
        for (const conn of connections) {
          try {
            const player = conn.player;
            if (!player || !player.location) continue;

            const loc = player.location;
            if (!loc) continue;

            const x = loc.x;
            const y = loc.y;
            const z = loc.z;

            if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
              agents.push({
                id: player.id,
                name: player.name || 'Unknown',
                x,
                y,
                z,
                roomName: loc.name || '',
                isNPC: false
              });
            }
          } catch (err) {
            console.error('[MapPlayersAdmin] Error getting player position:', err);
          }
        }

        // Add NPCs
        for (const npcId of npcIds) {
          try {
            const npc = await $load(npcId);
            if (!npc || !npc.location) continue;

            const loc = npc.location;
            if (!loc) continue;

            const x = loc.x;
            const y = loc.y;
            const z = loc.z;

            if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
              agents.push({
                id: npc.id,
                name: npc.name || 'NPC',
                x,
                y,
                z,
                roomName: loc.name || '',
                isNPC: true
              });
            }
          } catch (err) {
            console.error('[MapPlayersAdmin] Error getting NPC position:', err);
          }
        }

        return {
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ agents })
        };
      `);
      console.log('[WebsiteBuilder] mapPlayersAdminRoute handler set');
    }

    // 4. MapRoute - /map (public HTML page)
    console.log('[WebsiteBuilder] Building mapRoute...');
    if (aliases.mapRoute) {
      console.log(`[WebsiteBuilder] mapRoute alias exists: ${aliases.mapRoute}`);
      this._mapRoute = await this.manager.load(aliases.mapRoute);
    }
    if (!this._mapRoute) {
      console.log('[WebsiteBuilder] Creating mapRoute...');
      this._mapRoute = await this.manager.create({
        parent: webRoute,
        properties: {
          name: 'Map Page Route',
          description: 'Public 3D map view (above-ground only)',
          path: '/map',
          methods: ['GET'],
          contentType: 'text/html',
          requiresAuth: false,
          // Visual config - tweak via MOO code
          roomColor: 0x00ff44,       // Bright green
          roomOpacity: 0.7,          // More visible
          roomEmissive: 0.4,         // Glow intensity
          blockSize: 1.8,            // Cube size
          ambientIntensity: 1.5,     // Ambient light
          directionalIntensity: 0.8, // Directional light
          gridColor: 0x00ff00,       // Grid main color
          gridFade: 0x003300,        // Grid fade color
          fogNear: 80,               // Fog start
          fogFar: 300,               // Fog end
        },
        methods: {},
      });
      console.log(`[WebsiteBuilder] mapRoute created: #${this._mapRoute?.id}`);
    } else {
      console.log(`[WebsiteBuilder] mapRoute already exists: #${this._mapRoute?.id}`);
    }

    if (this._mapRoute) {
      console.log('[WebsiteBuilder] Setting mapRoute handler...');
      this._mapRoute.setMethod('handleRequest', `
        // Read visual config from route props
        const config = {
          roomColor: self.roomColor || 0x00ff44,
          roomOpacity: self.roomOpacity || 0.7,
          roomEmissive: self.roomEmissive || 0.4,
          blockSize: self.blockSize || 1.8,
          ambientIntensity: self.ambientIntensity || 1.5,
          directionalIntensity: self.directionalIntensity || 0.8,
          gridColor: self.gridColor || 0x00ff00,
          gridFade: self.gridFade || 0x003300,
          fogNear: self.fogNear || 80,
          fogFar: self.fogFar || 300,
        };

        // Generate HTML for public map view
        const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Malice World Map</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      font-family: monospace;
      background: #000;
      color: #0f0;
    }
    #info {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.9);
      padding: 15px;
      border: 1px solid #0f0;
      max-width: 300px;
      z-index: 100;
    }
    #info h2 {
      margin: 0 0 10px 0;
      color: #0ff;
    }
    #controls {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.9);
      padding: 10px;
      border: 1px solid #0f0;
    }
    button {
      background: #000;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 5px 10px;
      margin: 2px;
      cursor: pointer;
      font-family: monospace;
    }
    button:hover {
      background: #0f0;
      color: #000;
    }
    #tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      padding: 8px;
      border: 1px solid #0ff;
      pointer-events: none;
      display: none;
      z-index: 100;
    }
  </style>
</head>
<body>
  <div id="info">
    <h2>World Map (Public)</h2>
    <div id="stats">Loading...</div>
  </div>
  <div id="tooltip"></div>
  <div id="controls">
    <button onclick="viewTop()">Top View</button>
    <button onclick="viewSide()">Side View</button>
    <button onclick="resetView()">Reset</button>
  </div>

  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    // Visual config (injected from route props)
    const CFG = {
      roomColor: \${config.roomColor},
      roomOpacity: \${config.roomOpacity},
      roomEmissive: \${config.roomEmissive},
      blockSize: \${config.blockSize},
      ambientIntensity: \${config.ambientIntensity},
      directionalIntensity: \${config.directionalIntensity},
      gridColor: \${config.gridColor},
      gridFade: \${config.gridFade},
      fogNear: \${config.fogNear},
      fogFar: \${config.fogFar},
    };

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, CFG.fogNear, CFG.fogFar);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 80, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, CFG.ambientIntensity);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, CFG.directionalIntensity);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(200, 50, CFG.gridColor, CFG.gridFade);
    scene.add(gridHelper);

    // Dynamic content group (rooms, heatmap) - cleared on reload
    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);

    // Raycaster for hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const tooltip = document.getElementById('tooltip');

    // Height gradient function - varies color by z-level
    function getColorForZ(z) {
      if (z === 0) {
        return CFG.roomColor; // Base color at ground level
      } else {
        // Higher = warmer tint (towards orange/yellow)
        const heightFactor = Math.min(z / 30, 1);
        const r = Math.floor(0x00 + heightFactor * 0xff);
        const g = Math.floor(0xff - heightFactor * 0x44);
        const b = Math.floor(0x44 - heightFactor * 0x44);
        return (r << 16) | (g << 8) | b;
      }
    }

    // Load rooms and render
    async function loadMap() {
      try {
        // Clear previous dynamic content
        while (dynamicGroup.children.length > 0) {
          dynamicGroup.remove(dynamicGroup.children[0]);
        }

        // Fetch rooms (above ground only)
        const roomsRes = await fetch('/api/map/rooms?z_min=0');
        const roomsData = await roomsRes.json();
        const rooms = roomsData.rooms;

        // Fetch population heat map
        const playersRes = await fetch('/api/map/players');
        const playersData = await playersRes.json();
        const heatmap = playersData.heatmap;

        // Render rooms with height gradient
        const roomGeometry = new THREE.BoxGeometry(CFG.blockSize, CFG.blockSize, CFG.blockSize);
        for (const room of rooms) {
          const zColor = getColorForZ(room.z);
          const material = new THREE.MeshPhongMaterial({
            color: zColor,
            transparent: true,
            opacity: CFG.roomOpacity,
            emissive: zColor,
            emissiveIntensity: CFG.roomEmissive,
          });
          const cube = new THREE.Mesh(roomGeometry, material);
          cube.position.set(room.x * 2, room.z * 2, -room.y * 2);
          cube.userData = { type: 'room', ...room };
          dynamicGroup.add(cube);
        }

        // Render heat map cubes
        const heatGeometry = new THREE.BoxGeometry(10, 2, 10); // 5x5 grid
        for (const cell of heatmap) {
          const intensity = Math.min(cell.count / 6, 1);
          let color;
          if (cell.count <= 2) color = 0xffff00; // Yellow
          else if (cell.count <= 5) color = 0xff8800; // Orange
          else color = 0xff0000; // Red

          const material = new THREE.MeshPhongMaterial({
            color,
            transparent: true,
            opacity: 0.6 * intensity,
            emissive: color,
            emissiveIntensity: 0.3,
          });
          const cube = new THREE.Mesh(heatGeometry, material);
          cube.position.set(cell.x * 2, cell.z * 2 + 5, -cell.y * 2);
          cube.userData = { type: 'heat', count: cell.count };
          dynamicGroup.add(cube);
        }

        // Update stats
        const stats = document.getElementById('stats');
        stats.innerHTML = \\\`
          <strong>Rooms:</strong> \\\${rooms.length}<br>
          <strong>Population:</strong> \\\${heatmap.reduce((s, c) => s + c.count, 0)}<br>
          <strong>Updated:</strong> \\\${new Date(playersData.timestamp).toLocaleTimeString()}<br>
          <br>
          <em>5x5 grid aggregation</em><br>
          <em>Updates every 30s</em>
        \\\`;

      } catch (err) {
        console.error('Error loading map:', err);
        document.getElementById('stats').innerHTML = '<strong style="color: red;">Error loading map</strong>';
      }
    }

    // View presets
    window.viewTop = () => {
      camera.position.set(0, 80, 0);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    };

    window.viewSide = () => {
      camera.position.set(100, 40, 0);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    };

    window.resetView = () => {
      camera.position.set(0, 80, 0);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    };

    // Mouse hover
    function onMouseMove(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(dynamicGroup.children);

      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const data = obj.userData;

        if (data.type === 'room' && data.name) {
          tooltip.innerHTML = \\\`<strong>\\\${data.name}</strong><br>(\\\${data.x}, \\\${data.y}, \\\${data.z})\\\`;
          tooltip.style.display = 'block';
          tooltip.style.left = (event.clientX + 15) + 'px';
          tooltip.style.top = (event.clientY + 15) + 'px';
        } else if (data.type === 'heat') {
          tooltip.innerHTML = \\\`<strong>Population: \\\${data.count}</strong>\\\`;
          tooltip.style.display = 'block';
          tooltip.style.left = (event.clientX + 15) + 'px';
          tooltip.style.top = (event.clientY + 15) + 'px';
        }
      } else {
        tooltip.style.display = 'none';
      }
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    // Initial load
    loadMap();
    animate();

    // Reload every 30s (loadMap clears dynamicGroup internally)
    setInterval(loadMap, 30000);
  </script>
</body>
</html>
\`;

        return {
          status: 200,
          contentType: 'text/html',
          body: html
        };
      `);
      console.log('[WebsiteBuilder] mapRoute handler set');
    }

    // 5. MapAdminRoute - /map/admin (admin HTML page)
    console.log('[WebsiteBuilder] Building mapAdminRoute...');
    if (aliases.mapAdminRoute) {
      console.log(`[WebsiteBuilder] mapAdminRoute alias exists: ${aliases.mapAdminRoute}`);
      this._mapAdminRoute = await this.manager.load(aliases.mapAdminRoute);
    }
    if (!this._mapAdminRoute) {
      console.log('[WebsiteBuilder] Creating mapAdminRoute...');
      this._mapAdminRoute = await this.manager.create({
        parent: webRoute,
        properties: {
          name: 'Map Admin Page Route',
          description: 'Admin 3D map view (all z-levels)',
          path: '/map/admin',
          methods: ['GET'],
          contentType: 'text/html',
          requiresAuth: 'admin',
        },
        methods: {},
      });
      console.log(`[WebsiteBuilder] mapAdminRoute created: #${this._mapAdminRoute?.id}`);
    } else {
      console.log(`[WebsiteBuilder] mapAdminRoute already exists: #${this._mapAdminRoute?.id}`);
    }

    if (this._mapAdminRoute) {
      console.log('[WebsiteBuilder] Setting mapAdminRoute handler...');
      this._mapAdminRoute.setMethod('handleRequest', `
        // Use the existing 3D visualizer HTML from world-map-3d.html but fetch data from APIs
        const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Malice World Map - Admin</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      font-family: monospace;
      background: #000;
      color: #0f0;
    }
    #info {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.9);
      padding: 15px;
      border: 1px solid #0f0;
      max-width: 350px;
      z-index: 100;
    }
    #info h2 {
      margin: 0 0 10px 0;
      color: #ff0000;
    }
    .live-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      background: #f00;
      border-radius: 50%;
      margin-right: 5px;
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    #controls {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.9);
      padding: 10px;
      border: 1px solid #0f0;
    }
    button {
      background: #000;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 5px 10px;
      margin: 2px;
      cursor: pointer;
      font-family: monospace;
    }
    button:hover {
      background: #0f0;
      color: #000;
    }
    #tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.95);
      padding: 10px;
      border: 1px solid #0ff;
      pointer-events: none;
      display: none;
      z-index: 100;
      max-width: 400px;
    }
  </style>
</head>
<body>
  <div id="info">
    <h2><span class="live-indicator"></span>Admin Map (LIVE)</h2>
    <div id="stats">Loading...</div>
  </div>
  <div id="tooltip"></div>
  <div id="controls">
    <button onclick="viewSurface()">Surface</button>
    <button onclick="viewUnderground()">Underground</button>
    <button onclick="viewTower()">Tower</button>
    <button onclick="viewAll()">View All</button>
  </div>

  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 50, 300);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(200, 50, 0x00ff00, 0x003300);
    scene.add(gridHelper);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const tooltip = document.getElementById('tooltip');

    // Agent markers group
    const agentGroup = new THREE.Group();
    scene.add(agentGroup);

    // Color function for rooms
    function getColorForZ(z) {
      if (z < 0) {
        const depth = Math.abs(z);
        const hue = 0.65 - depth * 0.05;
        const lightness = Math.max(0.15, 0.5 - depth * 0.05);
        return new THREE.Color().setHSL(hue, 0.9, lightness);
      } else if (z === 0) {
        return new THREE.Color(0x00ff00);
      } else {
        return new THREE.Color().setHSL(0.15 - z * 0.003, 0.9, 0.5);
      }
    }

    // Load rooms and agents
    async function loadMap() {
      try {
        // Fetch all rooms
        const roomsRes = await fetch('/api/map/rooms');
        const roomsData = await roomsRes.json();
        const rooms = roomsData.rooms;

        // Render rooms (if not already rendered)
        if (scene.children.filter(c => c.userData.type === 'room').length === 0) {
          const roomGeometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
          for (const room of rooms) {
            const color = getColorForZ(room.z);
            const material = new THREE.MeshPhongMaterial({
              color,
              transparent: true,
              opacity: room.z < 0 ? 0.9 : 0.8,
              emissive: color,
              emissiveIntensity: room.z < 0 ? 0.3 : 0.2,
            });
            const cube = new THREE.Mesh(roomGeometry, material);
            cube.position.set(room.x * 2, room.z * 2, -room.y * 2);
            cube.userData = { type: 'room', ...room };
            scene.add(cube);
          }
        }

        // Fetch agent positions
        const agentsRes = await fetch('/api/map/players/admin');
        const agentsData = await agentsRes.json();
        const agents = agentsData.agents;

        // Clear old agent markers
        while (agentGroup.children.length > 0) {
          agentGroup.remove(agentGroup.children[0]);
        }

        // Render agent markers
        const agentGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        for (const agent of agents) {
          const color = agent.isNPC ? 0x0066ff : 0x00ff00; // Blue for NPCs, Green for players
          const material = new THREE.MeshPhongMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.5,
          });
          const sphere = new THREE.Mesh(agentGeometry, material);
          sphere.position.set(agent.x * 2, agent.z * 2 + 3, -agent.y * 2);
          sphere.userData = { type: 'agent', ...agent };
          agentGroup.add(sphere);
        }

        // Update stats
        const players = agents.filter(a => !a.isNPC);
        const npcs = agents.filter(a => a.isNPC);
        const stats = document.getElementById('stats');
        stats.innerHTML = \\\`
          <strong>Total Rooms:</strong> \\\${rooms.length}<br>
          <strong>Players:</strong> \\\${players.length}<br>
          <strong>NPCs:</strong> \\\${npcs.length}<br>
          <strong>Total Agents:</strong> \\\${agents.length}<br>
          <br>
          <em style="color: #0f0;">● = Player</em><br>
          <em style="color: #06f;">● = NPC</em><br>
          <br>
          <em>Updates every 3s</em>
        \\\`;

      } catch (err) {
        console.error('Error loading map:', err);
        document.getElementById('stats').innerHTML = '<strong style="color: red;">Error loading map</strong>';
      }
    }

    // View presets
    window.viewSurface = () => {
      camera.position.set(0, 80, 0);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    };

    window.viewUnderground = () => {
      camera.position.set(-20, -10, 40);
      camera.lookAt(-10, -8, 0);
      controls.target.set(-10, -8, 0);
    };

    window.viewTower = () => {
      camera.position.set(-25, 40, 30);
      camera.lookAt(-12, 20, -10);
      controls.target.set(-12, 20, -10);
    };

    window.viewAll = () => {
      camera.position.set(0, 50, 100);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    };

    // Mouse hover
    function onMouseMove(event) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([
        ...scene.children.filter(c => c.userData.type === 'room'),
        ...agentGroup.children
      ]);

      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const data = obj.userData;

        if (data.type === 'room') {
          tooltip.innerHTML = \\\`<strong>\\\${data.name || 'Room'}</strong><br>(\\\${data.x}, \\\${data.y}, \\\${data.z})\\\`;
          tooltip.style.display = 'block';
          tooltip.style.left = (event.clientX + 15) + 'px';
          tooltip.style.top = (event.clientY + 15) + 'px';
        } else if (data.type === 'agent') {
          tooltip.innerHTML = \\\`
            <strong>\\\${data.name}</strong> <em>(\\\${data.isNPC ? 'NPC' : 'Player'})</em><br>
            <strong>Position:</strong> (\\\${data.x}, \\\${data.y}, \\\${data.z})<br>
            <strong>Room:</strong> \\\${data.roomName}<br>
            <strong>ID:</strong> #\\\${data.id}
          \\\`;
          tooltip.style.display = 'block';
          tooltip.style.left = (event.clientX + 15) + 'px';
          tooltip.style.top = (event.clientY + 15) + 'px';
        }
      } else {
        tooltip.style.display = 'none';
      }
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    // Initial load
    loadMap();
    animate();

    // Reload agents every 3s (real-time tracking)
    setInterval(loadMap, 3000);
  </script>
</body>
</html>
\`;

        return {
          status: 200,
          contentType: 'text/html',
          body: html
        };
      `);
      console.log('[WebsiteBuilder] mapAdminRoute handler set');
    }

    console.log('[WebsiteBuilder] buildMapRoutes() complete');
  }

  async registerAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    // Get current aliases (webRoute/webRouter should exist now)
    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    // Build routes NOW that webRoute/webRouter aliases exist
    console.log('[WebsiteBuilder] registerAliases() - building routes now');
    await this.buildRoutes(aliases, false);

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

    // Route instances
    await register('docsRoute', this._docsRoute);
    await register('mapRoomsRoute', this._mapRoomsRoute);
    await register('mapPlayersRoute', this._mapPlayersRoute);
    await register('mapPlayersAdminRoute', this._mapPlayersAdminRoute);
    await register('mapRoute', this._mapRoute);
    await register('mapAdminRoute', this._mapAdminRoute);

    // Register routes with the router (must happen after aliases are registered)
    await this.registerRoutes();
  }

  private async registerRoutes(): Promise<void> {
    // Load ObjectManager to get aliases
    const objectManager = await this.manager.load(0);
    if (!objectManager) {
      console.log('⚠️ ObjectManager not found, routes not registered');
      return;
    }

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    const webRouterId = aliases.webRouter;
    if (!webRouterId) {
      console.log('⚠️ webRouter alias not found, routes not registered');
      return;
    }

    const webRouter = await this.manager.load(webRouterId);
    if (!webRouter) {
      console.log('⚠️ webRouter object not found, routes not registered');
      return;
    }

    if (this._docsRoute) {
      await webRouter.call('register', this._docsRoute);
      console.log('✅ Registered docsRoute with webRouter');
    }

    // Register map API routes
    if (this._mapRoomsRoute) {
      await webRouter.call('register', this._mapRoomsRoute);
      console.log('✅ Registered mapRoomsRoute with webRouter');
    }
    if (this._mapPlayersRoute) {
      await webRouter.call('register', this._mapPlayersRoute);
      console.log('✅ Registered mapPlayersRoute with webRouter');
    }
    if (this._mapPlayersAdminRoute) {
      await webRouter.call('register', this._mapPlayersAdminRoute);
      console.log('✅ Registered mapPlayersAdminRoute with webRouter');
    }

    // Register map HTML routes
    if (this._mapRoute) {
      await webRouter.call('register', this._mapRoute);
      console.log('✅ Registered mapRoute with webRouter');
    }
    if (this._mapAdminRoute) {
      await webRouter.call('register', this._mapAdminRoute);
      console.log('✅ Registered mapAdminRoute with webRouter');
    }
  }
}
