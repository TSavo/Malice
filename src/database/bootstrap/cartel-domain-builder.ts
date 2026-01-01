import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds the Gray Cartel's underground website
 *
 * The dark mirror to thecontinuum.city. Recruitment for those who
 * don't want to be tracked, don't trust the machine, or have already
 * burned their bridges with the system.
 *
 * Aesthetic: Crimson/red + amber accents, glitchy, "pirate broadcast" feel
 * Tone: "Blood and silence", freedom from surveillance, cash economy
 */
export class CartelDomainBuilder implements Builder {
  static provides = ['cartelDomain'];
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
      throw new Error('$webDomain must be built before CartelDomainBuilder');
    }
    if (!aliases.domainRegistry) {
      throw new Error(
        '$domainRegistry must be built before CartelDomainBuilder',
      );
    }
    if (!aliases.webRoute) {
      throw new Error('$webRoute must be built before CartelDomainBuilder');
    }

    const webDomain = await this.manager.load(aliases.webDomain);
    const domainRegistry = await this.manager.load(aliases.domainRegistry);
    const webRoute = await this.manager.load(aliases.webRoute);

    if (!webDomain || !domainRegistry || !webRoute) {
      throw new Error('Failed to load dependencies');
    }

    // Check if already exists
    if (aliases.cartelDomain) {
      this.domain = await this.manager.load(aliases.cartelDomain);
      if (this.domain) return;
    }

    // Create the domain
    if (!this.domain) {
      this.domain = await this.manager.create({
        parent: webDomain,
        properties: {
          name: 'The Underground',
          description: 'Gray Cartel recruitment and communications',
          segment: 'graycartel.com',
        },
        methods: {},
      });
    }

    // Build route tree
    await this.buildRouteTree(webRoute);

    // Register with domain registry
    await domainRegistry.call('register', this.domain);

    console.log('[CartelDomain] Registered graycartel.com');
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
        children: [],
        ...props,
      },
      methods: {},
    });

    if (parentNode) {
      await parentNode.call('addChild', route);
    }

    return route;
  }

  private async buildRouteTree(webRoute: RuntimeObject): Promise<void> {
    if (!this.domain) return;

    // Create root route
    const rootRoute = await this.createRoute(webRoute, null, {
      name: 'Cartel Root Route',
      segment: '',
      methods: ['GET'],
      contentType: 'text/html',
    });

    this.domain.set('rootRoute', rootRoute);

    // Root route - landing page
    rootRoute.setMethod('handleRequest', this.getLandingPageHandler());

    // /truth - Philosophy/manifesto
    const truthRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Truth Page',
      segment: 'truth',
      methods: ['GET'],
      contentType: 'text/html',
    });
    truthRoute.setMethod('handleRequest', this.getTruthPageHandler());

    // /family - The rules
    const familyRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Family Page',
      segment: 'family',
      methods: ['GET'],
      contentType: 'text/html',
    });
    familyRoute.setMethod('handleRequest', this.getFamilyPageHandler());

    // /descend - Play page (glitchy broken connection)
    const descendRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Descend Page',
      segment: 'descend',
      methods: ['GET'],
      contentType: 'text/html',
    });
    descendRoute.setMethod('handleRequest', this.getDescendPageHandler());

    // /play route - Cartel terminal template
    const playRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Cartel Play Route',
      segment: 'play',
      methods: ['GET'],
      contentType: 'text/html',
    });
    playRoute.setMethod('handleRequest', this.getPlayPageHandler());

    // /js/* routes - serve client modules from same MOO objects as Continuum
    await this.buildJsRoutes(webRoute, rootRoute);
  }

  /**
   * Build /js/* routes pointing to the same MOO objects as Continuum.
   * Each faction serves JS from their own domain for immersion.
   */
  private async buildJsRoutes(
    webRoute: RuntimeObject,
    rootRoute: RuntimeObject,
  ): Promise<void> {
    // /js route parent
    const jsRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Cartel JS Route',
      segment: 'js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });

    // JS modules and their MOO object aliases
    const modules = [
      { segment: 'malice-client.js', alias: 'maliceClientJs' },
      { segment: 'desktop.js', alias: 'desktopJs' },
      { segment: 'window-manager.js', alias: 'windowManagerJs' },
      { segment: 'window.js', alias: 'windowJs' },
      { segment: 'terminal-window.js', alias: 'terminalWindowJs' },
      { segment: 'html-window.js', alias: 'htmlWindowJs' },
      { segment: 'iframe-window.js', alias: 'iframeWindowJs' },
      { segment: 'taskbar.js', alias: 'taskbarJs' },
    ];

    for (const mod of modules) {
      const route = await this.createRoute(webRoute, jsRoute, {
        name: `Cartel ${mod.segment}`,
        segment: mod.segment,
        methods: ['GET'],
        contentType: 'application/javascript',
      });

      // Handler delegates to the MOO object's getScript() method
      route.setMethod(
        'handleRequest',
        `
        const mod = $.${mod.alias};
        if (mod && mod.getScript) {
          const script = await mod.getScript();
          return {
            status: 200,
            contentType: 'application/javascript',
            body: script,
            headers: { 'Cache-Control': 'public, max-age=3600' }
          };
        }
        return { status: 404, body: '// Module not found: ${mod.segment}' };
      `,
      );
    }
  }

  private getBaseTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
          colors: {
            cartel: {
              bg: '#0a0505',
              surface: '#150a0a',
              accent: '#ff3366',
              gold: '#ffaa00',
              dim: '#666060'
            }
          }
        }
      }
    }
  </script>
  <style>
    ::selection { background: #ff3366; color: #000; }
    
    @keyframes flicker {
      0%, 100% { opacity: 1; }
      41% { opacity: 1; }
      42% { opacity: 0.6; }
      43% { opacity: 1; }
      45% { opacity: 0.2; }
      46% { opacity: 1; }
      92% { opacity: 1; }
      93% { opacity: 0.5; }
      94% { opacity: 1; }
    }
    
    @keyframes glitch-text {
      0%, 100% { transform: translate(0); text-shadow: none; }
      20% { transform: translate(-2px, 1px); text-shadow: 2px 0 #ff3366, -2px 0 #ffaa00; }
      40% { transform: translate(2px, -1px); text-shadow: -2px 0 #ff3366, 2px 0 #ffaa00; }
      60% { transform: translate(-1px, 2px); text-shadow: 1px 0 #ff3366, -1px 0 #ffaa00; }
      80% { transform: translate(1px, -2px); text-shadow: -1px 0 #ff3366, 1px 0 #ffaa00; }
    }
    
    @keyframes static-noise {
      0%, 100% { background-position: 0 0; }
      10% { background-position: -5% -10%; }
      20% { background-position: -15% 5%; }
      30% { background-position: 7% -25%; }
      40% { background-position: -5% 25%; }
      50% { background-position: -15% 10%; }
      60% { background-position: 15% 0%; }
      70% { background-position: 0% 15%; }
      80% { background-position: 3% 35%; }
      90% { background-position: -10% 10%; }
    }
    
    @keyframes scanline {
      0% { top: -100%; }
      100% { top: 100%; }
    }
    
    .glitch-flicker { animation: flicker 4s infinite; }
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
        rgba(255, 51, 102, 0.03) 2px,
        rgba(255, 51, 102, 0.03) 4px
      );
      z-index: 1000;
    }
    
    .scanline::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100px;
      background: linear-gradient(
        to bottom,
        transparent,
        rgba(255, 51, 102, 0.1),
        transparent
      );
      animation: scanline 8s linear infinite;
    }
    
    .noise-bg {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      opacity: 0.02;
      z-index: 999;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
      animation: static-noise 0.5s steps(10) infinite;
    }
    
    .redacted {
      background: #ff3366;
      color: #ff3366;
      user-select: none;
    }
    
    .redacted:hover {
      background: transparent;
      color: #ff3366;
    }
    
    .terminal-cursor {
      animation: blink 1s step-end infinite;
    }
    
    @keyframes blink {
      50% { opacity: 0; }
    }
  </style>
</head>
<body class="bg-cartel-bg text-gray-400 font-mono min-h-screen">
  <div class="scanline"></div>
  <div class="noise-bg"></div>
  
  <main>
    {{content}}
  </main>
</body>
</html>
    `.trim();
  }

  private getLandingPageHandler(): string {
    const template = this.getBaseTemplate();
    const content = `
<div class="min-h-screen flex items-center justify-center">
  <div class="text-center">
    <a href="/descend" class="text-cartel-accent hover:text-white transition text-lg tracking-widest">
      &#x25BC;
    </a>
  </div>
</div>
    `.trim();

    return `
      const template = \`${template.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`;
      const content = \`${content.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`;
      
      const html = template
        .replace('{{title}}', 'The Underground')
        .replace('{{content}}', content);
      
      return {
        status: 200,
        contentType: 'text/html',
        body: html
      };
    `;
  }

  private getTruthPageHandler(): string {
    // Redirect to landing - no public ideology
    return `
      return {
        status: 302,
        headers: { 'Location': '/' },
        body: ''
      };
    `;
  }

  private getFamilyPageHandler(): string {
    // Redirect to landing - no public rules
    return `
      return {
        status: 302,
        headers: { 'Location': '/' },
        body: ''
      };
    `;
  }

  private getDescendPageHandler(): string {
    // Glitchy broken connection page
    return `
      const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIGNAL LOST</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      background: #0a0505;
      color: #ff3366;
      font-family: 'JetBrains Mono', monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .container {
      text-align: center;
      padding: 2rem;
      position: relative;
    }
    
    @keyframes glitch {
      0%, 100% { 
        transform: translate(0); 
        opacity: 1;
      }
      10% { 
        transform: translate(-5px, 3px); 
        opacity: 0.8;
      }
      20% { 
        transform: translate(5px, -3px); 
        opacity: 0.9;
      }
      30% { 
        transform: translate(-3px, -5px); 
        opacity: 0.7;
      }
      40% { 
        transform: translate(3px, 5px); 
        opacity: 0.85;
      }
      50% { 
        transform: translate(-5px, -3px); 
        opacity: 0.75;
      }
      60% { 
        transform: translate(5px, 3px); 
        opacity: 0.9;
      }
      70% { 
        transform: translate(-3px, 5px); 
        opacity: 0.8;
      }
      80% { 
        transform: translate(3px, -5px); 
        opacity: 0.85;
      }
      90% { 
        transform: translate(-5px, 3px); 
        opacity: 0.7;
      }
    }
    
    @keyframes static {
      0%, 100% { opacity: 0.03; }
      50% { opacity: 0.08; }
    }
    
    @keyframes blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    
    @keyframes corrupt {
      0%, 90%, 100% { 
        content: "CONNECTION TERMINATED"; 
      }
      91% { content: "C0NNECT10N T3RM1N4T3D"; }
      92% { content: "CONNE@#ION TE%MINA&ED"; }
      93% { content: "CONNECTION TERMINATED"; }
      94% { content: "C*NNECT!ON T#RMINAT$D"; }
      95% { content: "CONNECTION TERMINATED"; }
    }
    
    .static-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
      pointer-events: none;
      animation: static 0.3s steps(5) infinite;
      z-index: 100;
    }
    
    .error-main {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 2rem;
      animation: glitch 2s infinite;
      position: relative;
    }
    
    .error-main::before,
    .error-main::after {
      content: attr(data-text);
      position: absolute;
      left: 0;
      right: 0;
    }
    
    .error-main::before {
      color: #ffaa00;
      animation: glitch 2s infinite;
      clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
      transform: translate(-3px, -3px);
    }
    
    .error-main::after {
      color: #00ffaa;
      animation: glitch 2s infinite reverse;
      clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
      transform: translate(3px, 3px);
    }
    
    .error-code {
      color: #666;
      font-size: 0.8rem;
      margin-bottom: 3rem;
      letter-spacing: 0.2em;
    }
    
    .terminal-block {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid #ff336633;
      padding: 2rem;
      max-width: 500px;
      margin: 0 auto;
      text-align: left;
      position: relative;
    }
    
    .terminal-line {
      margin-bottom: 0.5rem;
      color: #666;
      font-size: 0.85rem;
    }
    
    .terminal-line.error {
      color: #ff3366;
    }
    
    .terminal-line.warn {
      color: #ffaa00;
    }
    
    .terminal-line.corrupt {
      color: #333;
      text-decoration: line-through;
    }
    
    .cursor {
      display: inline-block;
      width: 8px;
      height: 16px;
      background: #ff3366;
      animation: blink 1s step-end infinite;
      vertical-align: middle;
      margin-left: 4px;
    }
    
    .back-link {
      margin-top: 3rem;
      color: #444;
      font-size: 0.8rem;
    }
    
    .back-link a {
      color: #666;
      text-decoration: none;
      border-bottom: 1px solid #333;
    }
    
    .back-link a:hover {
      color: #ff3366;
      border-color: #ff3366;
    }
    
    .fragments {
      position: absolute;
      color: #ff336622;
      font-size: 0.7rem;
      pointer-events: none;
      user-select: none;
    }
    
    .fragment-1 { top: 10%; left: 5%; transform: rotate(-5deg); }
    .fragment-2 { top: 30%; right: 10%; transform: rotate(3deg); }
    .fragment-3 { bottom: 20%; left: 15%; transform: rotate(-2deg); }
    .fragment-4 { bottom: 35%; right: 5%; transform: rotate(7deg); }
  </style>
</head>
<body>
  <div class="static-overlay"></div>
  
  <div class="fragments fragment-1">UPLINK FAIL</div>
  <div class="fragments fragment-2">AUTH REJECT</div>
  <div class="fragments fragment-3">NODE OFFLINE</div>
  <div class="fragments fragment-4">RETRY: 0</div>
  
  <div class="container">
    <div class="error-main" data-text="INITIALIZING">INITIALIZING</div>
    <div class="error-code">SECURE_TUNNEL // HANDSHAKE</div>

    <div class="terminal-block">
      <div class="terminal-line" data-header="CONNECTING" data-sub="PROXY_CHAIN // ROUTING">&gt; INITIATING SECURE TUNNEL...</div>
      <div class="terminal-line" data-header="CONNECTING" data-sub="NODE_DISCOVERY // ACTIVE">&gt; ROUTING THROUGH PROXY CHAIN...</div>
      <div class="terminal-line" data-header="SEARCHING" data-sub="NODE_7-ALPHA // TIMEOUT">&gt; NODE 7-ALPHA: <span class="warn">TIMEOUT</span></div>
      <div class="terminal-line" data-header="SEARCHING" data-sub="NODE_7-BETA // TIMEOUT">&gt; NODE 7-BETA: <span class="warn">TIMEOUT</span></div>
      <div class="terminal-line" data-header="REROUTING" data-sub="NODE_7-GAMMA // REFUSED">&gt; NODE 7-GAMMA: <span class="error">CONNECTION REFUSED</span></div>
      <div class="terminal-line corrupt" data-header="REROUTING" data-sub="FALLBACK_ROUTE // ENCRYPTED">&gt; FALLBACK ROUTE: ██████████</div>
      <div class="terminal-line" data-header="TUNNELING" data-sub="UNDERGROUND_NODE // FOUND">&gt; UNDERGROUND NODE DETECTED...</div>
      <div class="terminal-line" data-header="HANDSHAKE" data-sub="AUTH_CHALLENGE // ACCEPTED">&gt; AUTHENTICATING...</div>
      <div class="terminal-line" style="color:#ff3366;" data-header="SIGNAL CONNECTED" data-sub="ENTERING THE UNDERGROUND...">&gt; TUNNEL ESTABLISHED<span class="cursor"></span></div>
    </div>

    <div class="back-link">
      <p style="margin-top: 2rem;"><a href="/" style="color:#666; border-bottom: 1px solid #333;">Return to surface broadcast</a></p>
    </div>
  </div>

  <script>
    // Animate the connection sequence with dynamic header updates
    let step = 0;
    const lines = document.querySelectorAll('.terminal-line');
    const headerEl = document.querySelector('.error-main');
    const subEl = document.querySelector('.error-code');
    const fragments = document.querySelectorAll('.fragments');

    // Fragment messages to cycle through
    const fragmentMsgs = [
      ['UPLINK FAIL', 'AUTH REJECT', 'NODE OFFLINE', 'RETRY: 0'],
      ['SCANNING...', 'PROBE SENT', 'WAIT...', 'RETRY: 1'],
      ['NODE FOUND', 'HANDSHAKE', 'ENCRYPT ON', 'RETRY: 2'],
      ['TUNNEL UP', 'VERIFIED', 'SECURE', 'CONNECTED']
    ];

    function updateFragments(phase) {
      const msgs = fragmentMsgs[Math.min(phase, fragmentMsgs.length - 1)];
      fragments.forEach((f, i) => {
        if (msgs[i]) f.textContent = msgs[i];
      });
    }

    function showLine() {
      if (step < lines.length) {
        const line = lines[step];
        line.style.opacity = '1';

        // Update header based on data attributes
        const newHeader = line.dataset.header;
        const newSub = line.dataset.sub;
        if (newHeader) {
          headerEl.textContent = newHeader;
          headerEl.dataset.text = newHeader;
          headerEl.style.color = step === lines.length - 1 ? '#ff3366' : '#ff3366';
        }
        if (newSub) {
          subEl.textContent = newSub;
        }

        // Update fragments at key points
        if (step === 2) updateFragments(1);
        if (step === 5) updateFragments(2);
        if (step === 8) updateFragments(3);

        step++;

        if (step === lines.length) {
          // Final state - redirect after delay
          setTimeout(() => {
            window.location.href = '/play';
          }, 1500);
        } else {
          setTimeout(showLine, 400 + Math.random() * 300);
        }
      }
    }

    // Hide all lines initially
    lines.forEach(line => {
      line.style.opacity = '0';
      line.style.transition = 'opacity 0.3s';
    });

    // Start the animation sequence
    setTimeout(showLine, 500);
  </script>
</body>
</html>\`;

      return {
        status: 200,
        contentType: 'text/html',
        body: html
      };
    `;
  }

  private getPlayPageHandler(): string {
    return `
      const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DESCENT // GRAY CARTEL</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css">
  <link rel="stylesheet" href="https://unpkg.com/open-props">
  <style>
    /* Cartel theme - crimson underground aesthetic */
    :root {
      --theme-bg: #0a0505;
      --theme-surface: #120808;
      --theme-accent: #ff3366;
      --theme-accent-dim: #ff336633;
      --theme-selection: rgba(255, 51, 102, 0.3);
      --theme-text: #e0e0e0;
      --theme-text-dim: #888;
      --theme-border: #442222;
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

    /* Scanline overlay for underground aesthetic */
    .scanline-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(255, 51, 102, 0.015) 2px,
        rgba(255, 51, 102, 0.015) 4px
      );
      z-index: 9999;
    }
  </style>
</head>
<body>
  <div class="scanline-overlay"></div>
  <div class="malice-desktop">
    <div id="window-area"></div>
    <div id="taskbar-container"></div>
  </div>

  <script>
    window.MALICE_THEME = {
      name: '',
      tagline: '',
      registerTagline: '',
      accent: '#ff3366',
      surface: '#120808',
      selection: 'rgba(255, 51, 102, 0.3)'
    };
  </script>
  <script type="module" src="/js/desktop.js"></script>
</body>
</html>\`;

      return {
        status: 200,
        contentType: 'text/html',
        body: html
      };
    `;
  }

  async registerAliases(): Promise<void> {
    if (!this.domain) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'cartelDomain', this.domain.id);
    console.log(`Registered cartelDomain alias -> #${this.domain.id}`);
  }
}

// Self-register
registerBuilder(CartelDomainBuilder);
