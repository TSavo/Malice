import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

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
export class WebsiteBuilder implements Builder {
  static provides = ['webSite', 'webTemplate', 'webPage', 'landingTemplate', 'terminalTemplate', 'docTemplate', 'homepage', 'playPage', 'clientJsRoute'];
  static depends = ['webRoute', 'webRouter']; // Needs these for routing

  private webSite: RuntimeObject | null = null;
  private webTemplate: RuntimeObject | null = null;
  private webPage: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const root = await this.manager.load(1);
    if (!root) throw new Error('Root prototype not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

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
    forceRebuild: boolean,
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
    this.webTemplate.setMethod(
      'render',
      `
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
    `,
    );
  }

  private async buildWebPage(
    root: RuntimeObject,
    aliases: Record<string, number>,
    forceRebuild: boolean,
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
    this.webPage.setMethod(
      'render',
      `
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
    `,
    );
  }

  private async buildWebSite(
    root: RuntimeObject,
    aliases: Record<string, number>,
    forceRebuild: boolean,
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
    this.webSite.setMethod(
      'handleRequest',
      `
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
    `,
    );

    // getPage(path) - Find page by path
    this.webSite.setMethod(
      'getPage',
      `
      const path = args[0] || '/';

      // Get webPage prototype
      const webPage = $webPage;
      if (!webPage) return null;

      // Query for pages with matching path
      const allObjects = $.getAllIds();
      for (const id of allObjects) {
        const obj = await $load(id);
        if (!obj) continue;

        // Check if it's a webPage (has path property and inherits from webPage)
        if (obj.path === path && obj.getParent() === webPage) {
          return obj;
        }
      }

      return null;
    `,
    );

    // handleDocsRequest(path) - Serve documentation from docs folder
    this.webSite.setMethod(
      'handleDocsRequest',
      `
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
    `,
    );

    // render404(path) - Render 404 page
    this.webSite.setMethod(
      'render404',
      `
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
    `,
    );
  }

  private async buildTemplateInstances(forceRebuild: boolean): Promise<void> {
    if (!this.webTemplate) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

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
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
          colors: {
            malice: {
              bg: '#050505',
              surface: '#0f0f0f',
              accent: '#00ff88',
              danger: '#ff3366'
            }
          }
        }
      }
    }
  </script>
  <style>
    ::selection { background: #00ff88; color: #000; }
  </style>
</head>
<body class="bg-malice-bg text-gray-300 font-mono min-h-screen">
  <nav class="border-b border-gray-900 px-6 py-3 bg-black/50 backdrop-blur sticky top-0 z-50">
    <div class="max-w-6xl mx-auto flex justify-between items-center">
      <a href="/" class="flex items-center gap-3">
        <span class="text-malice-accent font-bold tracking-wider">SEATTLE</span>
        <span class="text-gray-600 text-sm hidden sm:inline">CITIZEN SERVICES</span>
      </a>
      <div class="flex gap-6 text-sm">
        <a href="/play" class="text-gray-400 hover:text-malice-accent transition">ACCESS</a>
        <a href="/map" class="text-gray-400 hover:text-malice-accent transition">MAP</a>
      </div>
    </div>
  </nav>
  <main>
    {{content}}
  </main>
</body>
</html>`,
        },
        methods: {},
      });
    } else if (forceRebuild) {
      // Update layout on force rebuild
      landingTemplate.set('layout', landingTemplate.get('layout') as string);
    }

    // Terminal Template - Windowed Desktop
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
  <link rel="stylesheet" href="https://unpkg.com/open-props">
  <style>
    /* Theme variables - override these in faction templates */
    :root {
      --theme-bg: #0a0a0a;
      --theme-surface: #0d0d0d;
      --theme-accent: #00ff88;
      --theme-accent-dim: #00ff8833;
      --theme-selection: rgba(0, 255, 136, 0.3);
      --theme-text: #e0e0e0;
      --theme-text-dim: #888;
      --theme-border: #333;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      overflow: hidden;
      background: var(--theme-bg);
      font-family: 'JetBrains Mono', monospace;
    }

    /* Desktop container */
    .malice-desktop {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      background: var(--theme-bg);
    }

    /* Window area (excludes taskbar) */
    #window-area {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    /* Taskbar container */
    #taskbar-container {
      flex-shrink: 0;
    }

    /* Window flashing animation */
    @keyframes window-flash {
      0%, 100% { border-color: var(--theme-border); }
      50% { border-color: var(--theme-accent); }
    }
    .malice-window.flashing {
      animation: window-flash 0.5s ease-in-out 4;
    }

    /* Taskbar button flashing */
    @keyframes taskbar-flash {
      0%, 100% { background: #1a1a1a; }
      50% { background: var(--theme-accent-dim); }
    }
  </style>
</head>
<body>
  <div class="malice-desktop">
    <div id="window-area"></div>
    <div id="taskbar-container"></div>
  </div>

  <script>
    window.MALICE_THEME = {
      name: 'The Continuum',
      tagline: 'Citizen authentication required',
      registerTagline: 'New citizen registration',
      accent: '#00ff88',
      surface: '#0d0d0d',
      selection: 'rgba(0, 255, 136, 0.3)'
    };
  </script>
  <script type="module" src="/js/desktop.js"></script>
</body>
</html>`,
        },
        methods: {},
      });
    } else if (forceRebuild) {
      // Update layout on force rebuild
      terminalTemplate.set(
        'layout',
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css">
  <link rel="stylesheet" href="https://unpkg.com/open-props">
  <style>
    /* Theme variables - override these in faction templates */
    :root {
      --theme-bg: #0a0a0a;
      --theme-surface: #0d0d0d;
      --theme-accent: #00ff88;
      --theme-accent-dim: #00ff8833;
      --theme-selection: rgba(0, 255, 136, 0.3);
      --theme-text: #e0e0e0;
      --theme-text-dim: #888;
      --theme-border: #333;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      overflow: hidden;
      background: var(--theme-bg);
      font-family: 'JetBrains Mono', monospace;
    }

    /* Desktop container */
    .malice-desktop {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      background: var(--theme-bg);
    }

    /* Window area (excludes taskbar) */
    #window-area {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    /* Taskbar container */
    #taskbar-container {
      flex-shrink: 0;
    }

    /* Window flashing animation */
    @keyframes window-flash {
      0%, 100% { border-color: var(--theme-border); }
      50% { border-color: var(--theme-accent); }
    }
    .malice-window.flashing {
      animation: window-flash 0.5s ease-in-out 4;
    }

    /* Taskbar button flashing */
    @keyframes taskbar-flash {
      0%, 100% { background: #1a1a1a; }
      50% { background: var(--theme-accent-dim); }
    }
  </style>
</head>
<body>
  <div class="malice-desktop">
    <div id="window-area"></div>
    <div id="taskbar-container"></div>
  </div>

  <script>
    // Theme data for JS that can't use CSS var()
    window.MALICE_THEME = {
      name: 'The Continuum',
      tagline: 'Citizen authentication required',
      registerTagline: 'New citizen registration',
      accent: '#00ff88',
      surface: '#0d0d0d',
      selection: 'rgba(0, 255, 136, 0.3)'
    };
  </script>
  <script type="module" src="/js/desktop.js"></script>
</body>
</html>`,
      );
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

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

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
          description:
            'Seattle Citizenship Services. Join the many. Secure your future.',
          content: `
<!-- Glitch Effect Styles -->
<style>
  @keyframes flicker {
    0%, 100% { opacity: 1; }
    41% { opacity: 1; }
    42% { opacity: 0.8; }
    43% { opacity: 1; }
    45% { opacity: 0.3; }
    46% { opacity: 1; }
  }
  @keyframes glitch-text {
    0%, 100% { transform: translate(0); }
    33% { transform: translate(-2px, 1px); }
    66% { transform: translate(2px, -1px); }
  }
  .glitch-flicker { animation: flicker 8s infinite; }
  .glitch-text:hover { animation: glitch-text 0.3s infinite; }
  .scanline {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 255, 136, 0.03) 2px,
      rgba(0, 255, 136, 0.03) 4px
    );
    z-index: 1000;
  }
  .error-text { color: #ff3366; }
  .warning-text { color: #ffaa00; }
</style>
<div class="scanline"></div>

<!-- System Status Header -->
<div class="border-b border-gray-800 bg-black">
  <div class="max-w-6xl mx-auto px-6 py-3">
    <div class="flex flex-wrap items-center justify-between gap-4 text-sm font-mono">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <span id="status-dot" class="w-2 h-2 rounded-full bg-gray-500"></span>
          <span id="status-text" class="text-gray-500">CONNECTING...</span>
        </div>
        <div class="hidden sm:block text-gray-600">|</div>
        <div class="hidden sm:flex items-center gap-4 text-gray-500">
          <span>POP: <span id="population" class="text-malice-accent">---</span></span>
          <span>SYS: <span id="uptime" class="text-gray-400">--:--:--</span></span>
        </div>
      </div>
      <div class="text-gray-600 text-xs glitch-flicker">
        CONTINUUM INFRASTRUCTURE AUTHORITY
      </div>
    </div>
  </div>
</div>

<!-- Hero Section -->
<div class="relative overflow-hidden">
  <div class="max-w-5xl mx-auto px-6 py-16 md:py-24">

    <div class="text-xs font-mono text-gray-600 mb-8 tracking-wider">CITIZEN SERVICES // PIONEER DISTRICT</div>

    <h1 class="text-3xl md:text-4xl font-bold mb-6 text-gray-300 leading-tight max-w-2xl">
      Citizen registration is available for all Pioneer District residents.
    </h1>

    <p class="text-gray-500 mb-8 max-w-xl text-sm leading-relaxed">
      Registered citizens receive allocation of sustenance, shelter assignment, and work placement.
      Registration is voluntary. Benefits require compliance with work assignments.
    </p>

    <div class="mb-12">
      <a href="/play" class="px-6 py-3 bg-malice-accent text-black font-bold hover:bg-green-400 transition text-sm">
        Citizen Registration
      </a>
    </div>

    <div class="border-t border-gray-800 pt-6">
      <p class="text-xs text-gray-700 font-mono">
        NOTICE: Processing delays may occur. Applications reviewed in order of submission.
        <span class="glitch-flicker">Current wait time: VARIABLE</span>
      </p>
    </div>

  </div>
</div>

<!-- Services Section -->
<div class="border-y border-gray-800 bg-black/30">
  <div class="max-w-5xl mx-auto px-6 py-12">

    <div class="text-xs font-mono text-gray-600 mb-8">CITIZEN ALLOCATION</div>

    <div class="grid md:grid-cols-2 gap-6 text-sm">
      <div class="border-l-2 border-gray-800 pl-4">
        <div class="text-gray-400 font-bold mb-1">Sustenance</div>
        <p class="text-gray-600">Daily nutrient allocation at designated dispensaries. Caloric requirements calculated per citizen.</p>
      </div>

      <div class="border-l-2 border-gray-800 pl-4">
        <div class="text-gray-400 font-bold mb-1">Shelter</div>
        <p class="text-gray-600">Housing assignment in secured zones. Climate control. Water access. Locking doors.</p>
      </div>

      <div class="border-l-2 border-gray-800 pl-4">
        <div class="text-gray-400 font-bold mb-1">Employment</div>
        <p class="text-gray-600">Work placement matched to capability assessment. Credit compensation. Advancement available.</p>
      </div>

      <div class="border-l-2 border-gray-800 pl-4">
        <div class="text-gray-400 font-bold mb-1">Security</div>
        <p class="text-gray-600">CorpSec presence in all citizen zones. Incident response. <span class="text-gray-700 glitch-flicker">Monitoring active.</span></p>
      </div>
    </div>

  </div>
</div>

<!-- Infrastructure Status -->
<div class="max-w-5xl mx-auto px-6 py-12">
  <div class="grid lg:grid-cols-2 gap-12 items-start">
    <div>
      <div class="text-xs font-mono text-gray-600 mb-6">DISTRICT STATUS</div>

      <div class="space-y-4 text-gray-500 text-sm">
        <p>
          Infrastructure restoration ongoing. Pioneer District designated primary reconstruction zone.
          Power, water, and distribution systems partially operational.
        </p>
        <p>
          Registered citizens: <span class="text-gray-400 font-mono" id="pop-inline">~500</span>.
          Unregistered population: <span class="text-gray-600">estimate unavailable</span>.
        </p>
      </div>

      <div class="mt-8 p-4 border border-gray-800 bg-black/30">
        <div class="text-xs font-mono text-gray-600 mb-3">SYSTEM STATUS</div>
        <div class="space-y-2 text-sm font-mono">
          <div class="flex justify-between">
            <span class="text-gray-600">Power Grid</span>
            <span class="text-yellow-600">40%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Water Treatment</span>
            <span class="text-gray-500">60%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Sewage</span>
            <span class="text-red-700">30%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Communications</span>
            <span class="text-gray-500">80%</span>
          </div>
        </div>
        <div class="mt-3 text-xs text-gray-700">
          Pioneer District only. <span class="glitch-flicker">Outer zones: NO DATA</span>
        </div>
      </div>
    </div>

    <!-- Access Terminal -->
    <div class="border border-gray-800 bg-black/50 p-6">
      <div class="text-xs font-mono text-gray-600 mb-4">CITIZEN ACCESS TERMINAL</div>
      <a href="/play" class="px-4 py-2 bg-malice-accent/20 text-malice-accent border border-malice-accent/50 hover:bg-malice-accent hover:text-black transition text-xs font-bold">
        ACCESS
      </a>
      <p class="text-xs text-gray-700 mt-4">Biometric verification required.</p>
    </div>
  </div>
</div>

<!-- Work Placement -->
<div class="border-t border-gray-800">
  <div class="max-w-5xl mx-auto px-6 py-12">
    <div class="text-xs font-mono text-gray-600 mb-6">WORK PLACEMENT CATEGORIES</div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
      <div class="p-3 border-l-2 border-gray-800">
        <div class="text-gray-400 font-bold mb-1">Infrastructure</div>
        <p class="text-gray-600 text-xs">Water, power, sewage repair</p>
      </div>

      <div class="p-3 border-l-2 border-gray-800">
        <div class="text-gray-400 font-bold mb-1">Security</div>
        <p class="text-gray-600 text-xs">CorpSec auxiliary. Training required.</p>
      </div>

      <div class="p-3 border-l-2 border-gray-800">
        <div class="text-gray-400 font-bold mb-1">Fabrication</div>
        <p class="text-gray-600 text-xs">Factory production, maintenance</p>
      </div>

      <div class="p-3 border-l-2 border-gray-800">
        <div class="text-gray-400 font-bold mb-1">Medical</div>
        <p class="text-gray-600 text-xs">Clone support, sanitation</p>
      </div>

      <div class="p-3 border-l-2 border-gray-800">
        <div class="text-gray-400 font-bold mb-1">Distribution</div>
        <p class="text-gray-600 text-xs">Logistics, supply chain</p>
      </div>

      <div class="p-3 border-l-2 border-gray-800">
        <div class="text-gray-400 font-bold mb-1">Administration</div>
        <p class="text-gray-600 text-xs">Records, processing</p>
      </div>
    </div>

    <div class="mt-6 text-xs text-gray-700">
      Work compensated in credits. Placement determined by capability assessment.
    </div>
  </div>
</div>

<!-- Bulletins -->
<div class="border-t border-gray-800">
  <div class="max-w-5xl mx-auto px-6 py-12">
    <div class="flex items-center justify-between mb-6">
      <div class="text-xs font-mono text-gray-600">PUBLIC NOTICES</div>
      <div class="flex gap-2 text-xs font-mono">
        <button onclick="filterNews('')" class="news-filter px-2 py-1 border border-gray-800 hover:border-gray-600 transition text-gray-600" data-category="">ALL</button>
        <button onclick="filterNews('announcement')" class="news-filter px-2 py-1 border border-gray-800 hover:border-gray-600 transition text-gray-600" data-category="announcement">NOTICES</button>
        <button onclick="filterNews('event')" class="news-filter px-2 py-1 border border-gray-800 hover:border-gray-600 transition text-gray-600" data-category="event">EVENTS</button>
      </div>
    </div>
    <div id="news-container" class="space-y-3">
      <div class="text-gray-700 text-center py-6 font-mono text-xs">LOADING...</div>
    </div>
    <div id="news-empty" class="hidden text-gray-700 text-center py-6 font-mono text-xs">
      NO CURRENT NOTICES.
    </div>
  </div>
</div>

<!-- Footer disclaimer - the cracks really showing -->
<div class="border-t border-gray-800 bg-black">
  <div class="max-w-6xl mx-auto px-6 py-8">
    <div class="text-center">
      <div class="text-gray-700 text-xs font-mono mb-4">
        CONTINUUM INFRASTRUCTURE AUTHORITY &middot; PIONEER DISTRICT &middot; SEATTLE 2110
      </div>
      <div class="text-gray-800 text-xs max-w-2xl mx-auto glitch-flicker">
        The Continuum is an impartial infrastructure management system. Citizenship is voluntary.
        Benefits require compliance with work assignments. The system is fair.
        <span class="error-text">The system is functioning normally.</span>
        Please report any anomalies to City Services.
      </div>
    </div>
  </div>
</div>

<!-- Scripts -->
<script>
(function() {
  // News loading with corporate styling
  let currentCategory = '';

  window.filterNews = function(category) {
    currentCategory = category;
    document.querySelectorAll('.news-filter').forEach(btn => {
      if (btn.dataset.category === category) {
        btn.classList.add('border-malice-accent', 'text-malice-accent');
      } else {
        btn.classList.remove('border-malice-accent', 'text-malice-accent');
      }
    });
    loadNews();
  };

  async function loadNews() {
    try {
      const url = currentCategory ? '/api/news?category=' + currentCategory : '/api/news';
      const res = await fetch(url);
      const data = await res.json();

      const container = document.getElementById('news-container');
      const empty = document.getElementById('news-empty');

      if (!data.items || data.items.length === 0) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }

      empty.classList.add('hidden');

      const categoryLabels = {
        announcement: 'NOTICE',
        event: 'EVENT',
        update: 'UPDATE',
        lore: 'BULLETIN',
        ooc: 'SYSTEM'
      };

      container.innerHTML = data.items.map(item => {
        const date = new Date(item.postedAt);
        const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const label = categoryLabels[item.category] || 'BULLETIN';
        const pinned = item.pinned ? '<span class="text-malice-accent">[PRIORITY]</span> ' : '';

        return '<div class="p-4 border border-gray-800 rounded bg-black/30 hover:border-gray-700 transition font-mono">' +
          '<div class="flex items-start gap-4">' +
            '<div class="text-gray-600 text-xs whitespace-nowrap">' + dateStr + '</div>' +
            '<div class="flex-1">' +
              '<div class="text-xs text-gray-500 mb-1">' + label + '</div>' +
              '<div class="text-white">' + pinned + item.title + '</div>' +
              '<div class="text-gray-500 text-sm mt-2">' + item.body.substring(0, 200) + (item.body.length > 200 ? '...' : '') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

    } catch (e) {
      document.getElementById('news-container').innerHTML =
        '<div class="text-gray-600 text-center py-8 font-mono text-sm">CONNECTION ERROR. RETRYING...</div>';
    }
  }

  loadNews();
  setInterval(loadNews, 300000);

  // Status updates with corporate messaging
  async function updateStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();

      const dot = document.getElementById('status-dot');
      const text = document.getElementById('status-text');
      const population = document.getElementById('population');
      const uptime = document.getElementById('uptime');
      const popInline = document.getElementById('pop-inline');

      if (data.online) {
        dot.className = 'w-2 h-2 rounded-full bg-malice-accent animate-pulse';
        text.textContent = 'SYSTEMS NOMINAL';
        text.className = 'text-malice-accent';
        population.textContent = data.population.toLocaleString();
        uptime.textContent = data.uptime;
        if (popInline) popInline.textContent = '~' + data.population.toLocaleString();
      } else {
        dot.className = 'w-2 h-2 rounded-full bg-red-500';
        text.textContent = 'SYSTEMS OFFLINE';
        text.className = 'text-red-400';
      }
    } catch (e) {
      const dot = document.getElementById('status-dot');
      const text = document.getElementById('status-text');
      dot.className = 'w-2 h-2 rounded-full bg-yellow-500';
      text.textContent = 'CONNECTION INTERRUPTED';
      text.className = 'text-yellow-400';
    }
  }

  updateStatus();
  setInterval(updateStatus, 30000);
})();
</script>`,
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
  private _clientJsRoute: RuntimeObject | null = null;

  /**
   * Build routes that are still needed (clientJsRoute for script serving)
   * Most routes are now handled by $continuumDomain via domain-based routing.
   */
  private async buildRoutes(
    aliases: Record<string, number>,
    _forceRebuild: boolean,
  ): Promise<void> {
    console.log('[WebsiteBuilder] buildRoutes() called');

    // Get webRoute prototype
    const webRouteId = aliases.webRoute;
    if (!webRouteId) {
      console.log('⚠️ webRoute alias not found, skipping clientJsRoute');
      return;
    }
    const webRoute = await this.manager.load(webRouteId);
    if (!webRoute) {
      console.log('⚠️ webRoute prototype not found, skipping clientJsRoute');
      return;
    }

    // Build client JS route (still needed - new routes delegate to $.clientJsRoute.getScript())
    await this.buildClientJsRoute(aliases, webRoute);

    console.log('[WebsiteBuilder] buildRoutes() complete');
  }

  private async buildClientJsRoute(
    aliases: Record<string, number>,
    webRoute: RuntimeObject,
  ): Promise<void> {
    // Check if already exists
    if (aliases.clientJsRoute) {
      this._clientJsRoute = await this.manager.load(aliases.clientJsRoute);
    }

    if (!this._clientJsRoute) {
      this._clientJsRoute = await this.manager.create({
        parent: webRoute,
        properties: {
          name: 'Client JS Route',
          description: 'Serves MaliceClient JavaScript for web terminal',
          path: '/js/malice-client.js',
          methods: ['GET'],
          contentType: 'application/javascript',
          requiresAuth: false,
        },
        methods: {},
      });
      console.log(
        `[WebsiteBuilder] clientJsRoute created: #${this._clientJsRoute?.id}`,
      );
    }

    if (this._clientJsRoute) {
      this._clientJsRoute.setMethod(
        'handleRequest',
        `
        const script = await self.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: {
            'Cache-Control': 'public, max-age=3600'
          }
        };
      `,
      );

      this._clientJsRoute.setMethod(
        'getScript',
        `
        return \`
/**
 * MaliceClient - Multiplexed WebSocket client for Malice MOO
 * Handles channel-based communication with the game server.
 */
class MaliceClient {
  constructor(url, terminal) {
    this.url = url;
    this.term = terminal;
    this.ws = null;
    this.handlers = new Map();
    this.state = {
      room: null,
      inventory: [],
      stats: {},
      exits: []
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.statusEl = document.getElementById('status');

    // Register built-in channel handlers
    this.on('game', (data) => this.onGameMessage(data));
    this.on('ctrl', (data) => this.onCtrlMessage(data));
    this.on('state', (data) => this.onStateMessage(data));
    this.on('error', (data) => this.onErrorMessage(data));
  }

  connect() {
    this.updateStatus('connecting');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.updateStatus('connected');
      this.reconnectAttempts = 0;

      // Send initial resize
      this.sendResize();

      // Signal ready
      this.send('ctrl', { type: 'ready' });

      // Hide status after 2 seconds
      setTimeout(() => {
        if (this.statusEl) this.statusEl.style.opacity = '0.3';
      }, 2000);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      this.updateStatus('disconnected');
      this.term.write('\\\\r\\\\n\\\\x1b[31mDisconnected from server.\\\\x1b[0m\\\\r\\\\n');

      // Attempt reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.term.write('\\\\x1b[33mReconnecting in ' + (delay/1000) + 's...\\\\x1b[0m\\\\r\\\\n');
        setTimeout(() => this.connect(), delay);
      } else {
        this.term.write('\\\\x1b[31mMax reconnection attempts reached. Refresh to try again.\\\\x1b[0m\\\\r\\\\n');
      }
    };

    this.ws.onerror = () => {
      this.updateStatus('error');
    };
  }

  updateStatus(state) {
    if (!this.statusEl) return;
    this.statusEl.style.opacity = '1';
    const states = {
      connecting: { text: 'Connecting...', class: 'status-connecting' },
      connected: { text: 'Connected', class: 'status-connected' },
      disconnected: { text: 'Disconnected', class: 'status-disconnected' },
      error: { text: 'Error', class: 'status-disconnected' }
    };
    const s = states[state] || states.error;
    this.statusEl.textContent = s.text;
    this.statusEl.className = s.class;
  }

  handleMessage(data) {
    try {
      const msg = JSON.parse(data);
      const handler = this.handlers.get(msg.ch);
      if (handler) {
        handler(msg.p);
      } else {
        console.log('[MaliceClient] Unhandled channel:', msg.ch, msg.p);
      }
    } catch (e) {
      // Not JSON - treat as raw text for backwards compat
      this.term.write(data);
    }
  }

  send(channel, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ ch: channel, t: 'data', p: payload }));
    }
  }

  sendCommand(text) {
    this.send('game', text);
  }

  sendResize() {
    if (this.term) {
      this.send('ctrl', { type: 'resize', w: this.term.cols, h: this.term.rows });
    }
  }

  on(channel, handler) {
    this.handlers.set(channel, handler);
  }

  // Built-in channel handlers

  onGameMessage(data) {
    // Game channel data is raw text
    this.term.write(data);
  }

  onCtrlMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'prompt':
        // Could update a prompt indicator
        break;
      case 'mode':
        // Could switch UI modes
        console.log('[MaliceClient] Mode:', msg.mode);
        break;
      default:
        console.log('[MaliceClient] Ctrl:', msg);
    }
  }

  onStateMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    // Store state for future UI components
    if (msg.type && msg.data !== undefined) {
      this.state[msg.type] = msg.data;
    }

    // Emit event for UI components to listen to
    document.dispatchEvent(new CustomEvent('moo-state', { detail: msg }));

    console.log('[MaliceClient] State:', msg.type, msg.data);
  }

  onErrorMessage(msg) {
    console.error('[MaliceClient] Error:', msg);
    if (msg && msg.message) {
      this.term.write('\\\\r\\\\n\\\\x1b[31mError: ' + msg.message + '\\\\x1b[0m\\\\r\\\\n');
    }
  }
}

// Export for use in terminal template
window.MaliceClient = MaliceClient;
\`;
      `,
      );

      console.log('[WebsiteBuilder] clientJsRoute handler set');
    }
  }

  async registerAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    // Get current aliases (webRoute/webRouter should exist now)
    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

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

    // Client JS route (still needed - new routes delegate to $.clientJsRoute.getScript())
    await register('clientJsRoute', this._clientJsRoute);
  }
}

// Self-register
registerBuilder(WebsiteBuilder);
