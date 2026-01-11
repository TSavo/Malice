import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds the thecontinuum.city domain
 *
 * This is Pluribus's official citizenship recruitment website.
 * Sets up:
 * - Root domain: thecontinuum.city
 * - Subdomain: www → alias to root
 * - Wildcard subdomain: * → player profiles
 * - Route tree for all paths
 */
export class ContinuumDomainBuilder implements Builder {
  static provides = ['continuumDomain'];
  static depends = ['webDomain', 'domainRegistry', 'webRoute'];

  private domain: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Need dependencies
    if (!aliases.webDomain) {
      throw new Error('$webDomain must be built before ContinuumDomainBuilder');
    }
    if (!aliases.domainRegistry) {
      throw new Error(
        '$domainRegistry must be built before ContinuumDomainBuilder',
      );
    }
    if (!aliases.webRoute) {
      throw new Error('$webRoute must be built before ContinuumDomainBuilder');
    }

    const webDomain = await this.manager.load(aliases.webDomain);
    const domainRegistry = await this.manager.load(aliases.domainRegistry);
    const webRoute = await this.manager.load(aliases.webRoute);

    if (!webDomain || !domainRegistry || !webRoute) {
      throw new Error('Failed to load dependencies');
    }

    // Check if already exists
    if (aliases.continuumDomain) {
      this.domain = await this.manager.load(aliases.continuumDomain);
      if (this.domain) return;
    }

    // Create the root domain
    if (!this.domain) {
      this.domain = await this.manager.create({
        parent: webDomain,
        properties: {
          name: 'The Continuum',
          description: 'Official Seattle Citizen Services website',
          segment: 'thecontinuum.city',
        },
        methods: {},
      });
    }

    // Set up subdomains and routes
    await this.buildSubdomains(webDomain);
    await this.buildRouteTree(webRoute);

    // Register with domain registry
    await domainRegistry.call('register', this.domain);

    // Also register as the wildcard/default domain
    // This means localhost, 127.0.0.1, or any unrecognized host
    // will be served by thecontinuum.city
    await domainRegistry.call('setDefault', this.domain);

    console.log(
      '[ContinuumDomain] Registered thecontinuum.city as default domain',
    );
  }

  private async buildSubdomains(_webDomain: RuntimeObject): Promise<void> {
    if (!this.domain) return;

    // www subdomain - alias to root
    await this.manager.create({
      parent: this.domain, // Child of thecontinuum.city
      properties: {
        name: 'WWW Subdomain',
        segment: 'www',
        aliasOf: this.domain, // Delegates to parent
      },
      methods: {},
    });

    // Wildcard subdomain for player profiles
    const playerSubdomain = await this.manager.create({
      parent: this.domain,
      properties: {
        name: 'Player Subdomain',
        segment: '*',
        description:
          'Handles player profile subdomains like kevin.thecontinuum.city',
      },
      methods: {},
    });

    // Player subdomain handler
    playerSubdomain.setMethod(
      'handleRequest',
      `
      /**
       * Handle requests to player subdomains.
       * self.match contains the subdomain (player name).
       */
      const path = args[0] || '/';
      const method = args[1] || 'GET';
      const meta = args[2] || {};
      
      const playerName = self.match;
      
      if (!playerName) {
        return { status: 404, body: 'Player not found' };
      }
      
      // Look up player by name
      const player = await $query()
        .parent($player)
        .prop('playername').equals(playerName.toLowerCase())
        .first();
      
      if (!player) {
        return {
          status: 404,
          contentType: 'text/html',
          body: '<html><body style="background:#0a0a0a;color:#ff3366;font-family:monospace;padding:2rem;"><h1>Citizen Not Found</h1><p>No registered citizen: ' + playerName + '</p></body></html>'
        };
      }
      
      // Render player profile
      const name = player.name || player.playername || 'Unknown';
      const description = player.description || 'No public profile.';
      
      return {
        status: 200,
        contentType: 'text/html',
        body: \`<!DOCTYPE html>
<html>
<head>
  <title>\${name} - Seattle Citizen</title>
  <style>
    body { background: #0a0a0a; color: #e0e0e0; font-family: monospace; padding: 2rem; }
    h1 { color: #00ff88; }
    .profile { border: 1px solid #333; padding: 1rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <div style="color:#666;font-size:0.8rem;">SEATTLE CITIZEN SERVICES</div>
  <h1>\${name}</h1>
  <div class="profile">
    <p>\${description}</p>
  </div>
  <p style="margin-top:2rem;"><a href="/" style="color:#00ff88;">Return to Citizen Services</a></p>
</body>
</html>\`
      };
    `,
    );
  }

  /**
   * Helper to create a route and add it as a child of its parent in the tree.
   */
  private async createRoute(
    webRoute: RuntimeObject,
    parentNode: RuntimeObject | null,
    props: Record<string, unknown>,
  ): Promise<RuntimeObject> {
    const route = await this.manager.create({
      parent: webRoute,
      properties: {
        children: [], // Initialize empty children array
        ...props,
      },
      methods: {},
    });

    // Add to parent's children array
    if (parentNode) {
      await parentNode.call('addChild', route);
    }

    return route;
  }

  private async buildRouteTree(webRoute: RuntimeObject): Promise<void> {
    if (!this.domain) return;

    // Create root route for this domain
    const rootRoute = await this.createRoute(webRoute, null, {
      name: 'Continuum Root Route',
      segment: '',
      methods: ['GET'],
      contentType: 'text/html',
    });

    // Set as the domain's route tree
    this.domain.set('rootRoute', rootRoute);

    // Root route handler - homepage
    rootRoute.setMethod(
      'handleRequest',
      `
      /**
       * Serve the homepage
       */
      const meta = args[0] || {};
      
      // Get homepage from $homepage page object
      const homepage = await $.homepage;
      if (homepage && homepage.render) {
        const html = await homepage.render();
        return {
          status: 200,
          contentType: 'text/html',
          body: html
        };
      }
      
      return {
        status: 200,
        contentType: 'text/html',
        body: '<html><body><h1>The Continuum</h1><p>Welcome to Seattle.</p></body></html>'
      };
    `,
    );

    // /play route
    const playRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Play Route',
      segment: 'play',
      methods: ['GET'],
      contentType: 'text/html',
    });

    playRoute.setMethod(
      'handleRequest',
      `
      const playPage = await $.playPage;
      if (playPage && playPage.render) {
        const html = await playPage.render();
        return { status: 200, contentType: 'text/html', body: html };
      }
      return { status: 200, body: '<html><body><h1>Terminal</h1></body></html>' };
    `,
    );

    // /api route - parent for all API routes
    const apiRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'API Route',
      segment: 'api',
      methods: ['GET'],
      contentType: 'application/json',
    });

    // /api/status - inline the handler
    const statusRoute = await this.createRoute(webRoute, apiRoute, {
      name: 'Status API',
      segment: 'status',
      methods: ['GET'],
      contentType: 'application/json',
      startTime: Date.now(),
      basePopulation: 487,
    });

    statusRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};

      try {
        // Get connected players
        const connections = await $world.getAuthenticatedConnections();
        const playerCount = connections.length;

        // Get AI NPCs
        const npcIds = await $ai.getAll();
        const npcCount = npcIds.length;

        // Calculate population:
        // Base population represents the unseen masses of New Seattle
        const basePopulation = self.basePopulation || 487;
        const population = basePopulation + playerCount + npcCount;

        // Get room count
        const allRooms = await $world.getAllRooms();
        const roomCount = allRooms.length;

        // Calculate uptime
        const startTime = self.startTime || Date.now();
        const uptimeMs = Date.now() - startTime;
        const uptimeSeconds = Math.floor(uptimeMs / 1000);
        const uptimeDays = Math.floor(uptimeSeconds / 86400);
        const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
        const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

        let uptimeStr = '';
        if (uptimeDays > 0) uptimeStr += uptimeDays + 'd ';
        if (uptimeHours > 0 || uptimeDays > 0) uptimeStr += uptimeHours + 'h ';
        uptimeStr += uptimeMinutes + 'm';

        return {
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            online: true,
            population: population,
            rooms: roomCount,
            uptime: uptimeStr,
            uptimeMs: uptimeMs,
            timestamp: Date.now(),
            version: '0.1.0',
            ports: {
              telnet: 5555,
              ssh: 5556,
              web: 80,
              websocket: 8080
            }
          })
        };
      } catch (err) {
        return {
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to get status', online: false })
        };
      }
    `,
    );

    // /api/news - inline the handler
    const newsRoute = await this.createRoute(webRoute, apiRoute, {
      name: 'News API',
      segment: 'news',
      methods: ['GET'],
      contentType: 'application/json',
    });

    newsRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};

      try {
        // Get news from $.news
        if (!$.news) {
          return {
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ items: [], timestamp: Date.now() })
          };
        }

        const limit = parseInt(meta.query?.limit) || 10;
        const category = meta.query?.category;

        const items = await $.news.getForApi({ limit, category });

        return {
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: items,
            timestamp: Date.now()
          })
        };
      } catch (err) {
        return {
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to get news', items: [] })
        };
      }
    `,
    );

    // NOTE: /api/map/* routes moved to meta-domain-builder.ts (malice.world)

    // /docs route parent
    const docsRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Docs Route',
      segment: 'docs',
      methods: ['GET'],
      contentType: 'text/html',
    });

    // /docs (no wildcard) - serve index
    docsRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const fs = await import('fs');

      const filePath = './docs/WHAT-IS-MALICE.md';

      try {
        if (!fs.existsSync(filePath)) {
          return {
            status: 404,
            contentType: 'text/html',
            body: '<h1>Documentation not found</h1>'
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
    `,
    );

    // /docs/* wildcard handler - inline the handler
    const docsWildcard = await this.createRoute(webRoute, docsRoute, {
      name: 'Docs Wildcard',
      segment: '*',
      methods: ['GET'],
      contentType: 'text/html',
    });

    docsWildcard.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const docName = self.match || '';
      const fs = await import('fs');
      const path = await import('path');

      // Map URL to file path (case-insensitive)
      let filePath = '';
      if (!docName || docName === '') {
        filePath = './docs/WHAT-IS-MALICE.md';
      } else {
        // Try exact match first, then uppercase
        const baseName = docName.endsWith('.md') ? docName : docName + '.md';
        const exactPath = './docs/' + baseName;
        const upperPath = './docs/' + baseName.toUpperCase();
        
        if (fs.existsSync(exactPath)) {
          filePath = exactPath;
        } else if (fs.existsSync(upperPath)) {
          filePath = upperPath;
        } else {
          // Try to find case-insensitively
          const docsDir = fs.readdirSync('./docs');
          const match = docsDir.find(f => f.toLowerCase() === baseName.toLowerCase());
          filePath = match ? './docs/' + match : exactPath;
        }
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
    `,
    );

    // NOTE: /map and /admin/map routes moved to meta-domain-builder.ts (malice.world)
    // NOTE: /admin/* routes moved to meta-domain-builder.ts (malice.world)

    // /js/malice-client.js - client script
    const jsRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'JS Route',
      segment: 'js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });

    const clientJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'Client JS Route',
      segment: 'malice-client.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });

    // The client JS is defined in website-builder.ts as $.clientJsRoute
    // For now, delegate to that if it exists, otherwise return empty
    clientJsRoute.setMethod(
      'handleRequest',
      `
      // Try new modular client first, fall back to legacy
      const newClient = $.maliceClientJs;
      if (newClient && newClient.getScript) {
        const script = await newClient.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }

      const legacy = $.clientJsRoute;
      if (legacy && legacy.getScript) {
        const script = await legacy.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 200, contentType: 'application/javascript', body: '// MaliceClient not available' };
    `,
    );

    // === NEW DESKTOP CLIENT MODULES ===

    // /js/desktop.js - Desktop entry point
    const desktopJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'Desktop JS Route',
      segment: 'desktop.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    desktopJsRoute.setMethod(
      'handleRequest',
      `
      const desktop = $.desktopJs;
      if (desktop && desktop.getScript) {
        const script = await desktop.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, body: '// Desktop client not available' };
    `,
    );

    // /js/terminal.js - Terminal module
    const terminalJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'Terminal JS Route',
      segment: 'terminal.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    terminalJsRoute.setMethod(
      'handleRequest',
      `
      const terminal = $.terminalWindowJs;
      if (terminal && terminal.getScript) {
        const script = await terminal.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, body: '// Terminal module not available' };
    `,
    );

    // /js/mux.js - Multiplexer module
    const muxJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'Mux JS Route',
      segment: 'mux.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    muxJsRoute.setMethod(
      'handleRequest',
      `
      const mux = $.muxClientJs;
      if (mux && mux.getScript) {
        const script = await mux.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, body: '// Mux module not available' };
    `,
    );

    // /js/theme.js - Theme module
    const themeJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'Theme JS Route',
      segment: 'theme.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    themeJsRoute.setMethod(
      'handleRequest',
      `
      const theme = $.themeClientJs;
      if (theme && theme.getScript) {
        const script = await theme.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, body: '// Theme module not available' };
    `,
    );

    // /js/window-manager.js - WindowManager class
    const windowManagerJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'WindowManager JS Route',
      segment: 'window-manager.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    windowManagerJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.windowManagerJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/window.js - Base Window class
    const windowJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'Window JS Route',
      segment: 'window.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    windowJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.windowJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/terminal-window.js - TerminalWindow class
    const terminalWindowJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'TerminalWindow JS Route',
      segment: 'terminal-window.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    terminalWindowJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.terminalWindowJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/html-window.js - HtmlWindow class
    const htmlWindowJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'HtmlWindow JS Route',
      segment: 'html-window.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    htmlWindowJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.htmlWindowJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/iframe-window.js - IframeWindow class
    const iframeWindowJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'IframeWindow JS Route',
      segment: 'iframe-window.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    iframeWindowJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.iframeWindowJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/taskbar.js - Taskbar class
    const taskbarJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'Taskbar JS Route',
      segment: 'taskbar.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    taskbarJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.taskbarJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/audio-manager.js - AudioManager class for TTS playback
    const audioManagerJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'AudioManager JS Route',
      segment: 'audio-manager.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    audioManagerJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.audioManagerJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/location-window.js - LocationWindow class for room images
    const locationWindowJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'LocationWindow JS Route',
      segment: 'location-window.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    locationWindowJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.locationWindowJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.domain) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'continuumDomain', this.domain.id);
    console.log(`Registered continuumDomain alias -> #${this.domain.id}`);
  }
}

// Self-register
registerBuilder(ContinuumDomainBuilder);
