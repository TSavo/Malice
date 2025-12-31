import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

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
export class CartelDomainBuilder {
  private domain: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
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
      if (this.domain && !forceRebuild) return;
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
  
  <nav class="border-b border-red-900/30 px-6 py-3 bg-black/80 backdrop-blur sticky top-0 z-50">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <a href="/" class="flex items-center gap-3">
        <span class="text-cartel-accent font-bold tracking-wider glitch-flicker">UNDERGROUND</span>
      </a>
      <div class="flex gap-6 text-sm">
        <a href="/truth" class="text-gray-500 hover:text-cartel-accent transition">TRUTH</a>
        <a href="/family" class="text-gray-500 hover:text-cartel-accent transition">FAMILY</a>
        <a href="/descend" class="text-gray-500 hover:text-cartel-accent transition">DESCEND</a>
      </div>
    </div>
  </nav>
  
  <main>
    {{content}}
  </main>
  
  <footer class="border-t border-red-900/20 mt-20 py-8">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <p class="text-gray-700 text-xs">
        <span class="glitch-flicker">SIGNAL UNSTABLE</span> | 
        <span class="text-gray-600">BROADCAST ORIGIN: <span class="redacted">REDACTED</span></span>
      </p>
    </div>
  </footer>
</body>
</html>
    `.trim();
  }

  private getLandingPageHandler(): string {
    const template = this.getBaseTemplate();
    const content = `
<!-- Hero -->
<div class="relative overflow-hidden">
  <!-- Red grid background -->
  <div class="absolute inset-0 opacity-5">
    <div class="absolute inset-0" style="background-image: linear-gradient(rgba(255,51,102,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,51,102,0.3) 1px, transparent 1px); background-size: 40px 40px;"></div>
  </div>
  
  <div class="max-w-4xl mx-auto px-6 py-20 md:py-32 relative">
    <div class="text-center mb-16">
      <div class="text-xs font-mono text-cartel-accent mb-6 tracking-widest glitch-flicker">
        [ UNAUTHORIZED BROADCAST ]
      </div>
      
      <h1 class="text-4xl md:text-6xl font-bold mb-8 leading-tight">
        <span class="text-gray-300">They call us</span><br>
        <span class="text-cartel-accent glitch-text">criminals.</span>
      </h1>
      
      <p class="text-xl md:text-2xl text-gray-500 mb-6">
        They call themselves <span class="text-gray-400">civilization.</span>
      </p>
    </div>
    
    <!-- The pitch -->
    <div class="max-w-2xl mx-auto space-y-8 text-center">
      <div class="p-6 border border-red-900/30 bg-black/50 rounded">
        <p class="text-gray-400 leading-relaxed">
          The machine watches <span class="text-cartel-accent">everything</span>.<br>
          Every credit you spend. Every door you open.<br>
          Every word you say.
        </p>
        <p class="text-gray-500 mt-4 text-sm">
          Is that freedom?
        </p>
      </div>
      
      <div class="text-cartel-gold font-bold tracking-wider">
        - - - THE UNDERGROUND - - -
      </div>
      
      <div class="space-y-2 text-gray-500">
        <p><span class="text-gray-400">Cash</span> doesn't track.</p>
        <p><span class="text-gray-400">Shadows</span> don't talk.</p>
        <p><span class="text-gray-400">We</span> remember our names.</p>
      </div>
    </div>
    
    <!-- CTA -->
    <div class="mt-16 text-center">
      <div class="inline-block p-6 border border-red-900/50 bg-cartel-surface/50 rounded">
        <div class="text-xs text-gray-600 mb-4">[ FIND US IF YOU CAN ]</div>
        <div class="space-y-2 text-sm text-gray-500">
          <p>&gt; Look for the signs.</p>
          <p>&gt; Ask for <span class="text-cartel-accent">Gray</span>.</p>
          <p>&gt; Bring cash.</p>
        </div>
        <div class="mt-6">
          <a href="/descend" class="px-6 py-3 bg-cartel-accent/20 text-cartel-accent border border-cartel-accent/50 rounded hover:bg-cartel-accent hover:text-black transition text-sm font-bold inline-block">
            DESCEND
          </a>
        </div>
      </div>
    </div>
    
    <!-- Bottom message -->
    <div class="mt-20 text-center">
      <p class="text-xs text-gray-700">
        "What do you want. What are you offering. <span class="glitch-flicker">Be specific.</span>"
      </p>
    </div>
  </div>
</div>

<!-- The contrast -->
<div class="border-t border-red-900/20 bg-black/30">
  <div class="max-w-4xl mx-auto px-6 py-16">
    <div class="grid md:grid-cols-2 gap-8">
      <div class="p-6 border border-gray-800 rounded bg-black/30">
        <div class="text-xs text-gray-600 mb-4">WHAT THEY OFFER</div>
        <ul class="space-y-2 text-sm text-gray-500">
          <li>+ Rations (tracked)</li>
          <li>+ Shelter (monitored)</li>
          <li>+ Work (assigned)</li>
          <li>+ Security (controlled)</li>
        </ul>
        <div class="mt-4 text-xs text-gray-600">
          Cost: <span class="text-gray-500">Everything you are.</span>
        </div>
      </div>
      
      <div class="p-6 border border-red-900/30 rounded bg-cartel-surface/30">
        <div class="text-xs text-cartel-accent mb-4">WHAT WE OFFER</div>
        <ul class="space-y-2 text-sm text-gray-400">
          <li>+ Freedom (real)</li>
          <li>+ Cash (untraceable)</li>
          <li>+ Work (your choice)</li>
          <li>+ Family (earned)</li>
        </ul>
        <div class="mt-4 text-xs text-cartel-gold">
          Cost: <span class="text-gray-400">Blood and silence.</span>
        </div>
      </div>
    </div>
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
    const template = this.getBaseTemplate();
    const content = `
<div class="max-w-3xl mx-auto px-6 py-16">
  <div class="text-xs text-cartel-accent mb-8 tracking-wider">[ CLASSIFIED // BROADCAST 7-ALPHA ]</div>
  
  <h1 class="text-3xl font-bold mb-8 text-gray-300">The Truth They Won't Tell You</h1>
  
  <div class="space-y-8 text-gray-400 leading-relaxed">
    <p>
      In 2055, the corporations went to war. Not with nations. <span class="text-gray-300">With each other.</span>
    </p>
    
    <p>
      Seven years of hell. Cities burned. Infrastructure collapsed. The systems everyone 
      depended on - power, water, food distribution - all of it became weapons. All of it 
      became targets.
    </p>
    
    <p>
      By 2062, someone decided to end it. <span class="text-cartel-accent">Operation Decapitation.</span> 
      Coordinated strikes on every corporate AI datacenter. Every automated system. Every 
      piece of infrastructure that kept the war machine running.
    </p>
    
    <p>
      It worked. The war ended.
    </p>
    
    <p class="text-gray-500 border-l-2 border-red-900/50 pl-4">
      So did everything else.
    </p>
    
    <div class="my-12 p-6 border border-red-900/30 bg-black/50 rounded">
      <div class="text-xs text-gray-600 mb-4">CASUALTIES: 2062-2070</div>
      <p class="text-2xl text-cartel-accent font-bold">80-90%</p>
      <p class="text-sm text-gray-500 mt-2">
        Not from the strikes. From what came after.<br>
        Starvation. Disease. Violence.<br>
        <span class="text-gray-600">The infrastructure was gone. People forgot how to survive without it.</span>
      </p>
    </div>
    
    <p>
      Now it's 2110. Forty-eight years later. And guess who's back?
    </p>
    
    <p>
      <span class="text-gray-300">The corporations.</span> New names. Same game. 
      "The Continuum." "Citizen Services." "Reconstruction."
    </p>
    
    <p>
      They offer food. Shelter. Safety. All you have to do is <span class="text-cartel-accent">register</span>. 
      Let them track you. Let them assign you. Let them own you.
    </p>
    
    <p class="text-gray-500">
      They killed the old world. They're building a cage from the ashes.
    </p>
    
    <div class="my-12 border-t border-b border-red-900/30 py-8">
      <p class="text-center text-cartel-gold">
        "History doesn't repeat, but it rhymes."
      </p>
    </div>
    
    <p>
      The Cartel remembers. We were here before Pluribus. Before the machine decided 
      it knew what was best for everyone. Before "citizenship" became another word 
      for <span class="redacted">slavery</span>.
    </p>
    
    <p>
      We'll be here after.
    </p>
    
    <div class="mt-12 text-center">
      <a href="/family" class="text-cartel-accent hover:text-cartel-gold transition">
        Learn what it means to be family &rarr;
      </a>
    </div>
  </div>
</div>
    `.trim();

    return `
      const template = \`${template.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`;
      const content = \`${content.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`;
      
      const html = template
        .replace('{{title}}', 'The Truth - Underground')
        .replace('{{content}}', content);
      
      return {
        status: 200,
        contentType: 'text/html',
        body: html
      };
    `;
  }

  private getFamilyPageHandler(): string {
    const template = this.getBaseTemplate();
    const content = `
<div class="max-w-3xl mx-auto px-6 py-16">
  <div class="text-xs text-cartel-accent mb-8 tracking-wider">[ INTERNAL // EYES ONLY ]</div>
  
  <h1 class="text-3xl font-bold mb-8 text-gray-300">Blood and Silence</h1>
  
  <div class="space-y-8 text-gray-400 leading-relaxed">
    <p>
      We are not a gang. We are not terrorists. We are not what Pluribus calls us.
    </p>
    
    <p>
      We are <span class="text-cartel-accent">family</span>.
    </p>
    
    <p>
      Family means something here. It means sixty people who stayed when everyone else ran. 
      It means watching each other's backs when the machine is hunting. It means 
      <span class="text-gray-300">blood in, blood out</span>.
    </p>
    
    <div class="my-12 p-6 border border-red-900/30 bg-cartel-surface/30 rounded">
      <div class="text-xs text-cartel-gold mb-6">THE RULES</div>
      
      <div class="space-y-6">
        <div>
          <div class="text-gray-300 font-bold mb-2">1. Silence is survival.</div>
          <p class="text-sm text-gray-500">
            You don't talk about family. You don't talk about operations. 
            You don't talk about the tunnels. Not to outsiders. Not to friends. 
            Not to anyone who hasn't bled with you.
          </p>
        </div>
        
        <div>
          <div class="text-gray-300 font-bold mb-2">2. Debts are sacred.</div>
          <p class="text-sm text-gray-500">
            When family helps you, you owe. When you help family, they owe. 
            Every favor is remembered. Every debt is paid. 
            <span class="text-gray-600">The ledger is always balanced.</span>
          </p>
        </div>
        
        <div>
          <div class="text-gray-300 font-bold mb-2">3. Cash only.</div>
          <p class="text-sm text-gray-500">
            Credits are chains. Every transaction Pluribus sees is a thread they can pull.
            We deal in paper. In barter. In things that don't leave trails.
          </p>
        </div>
        
        <div>
          <div class="text-gray-300 font-bold mb-2">4. Betrayal is answered.</div>
          <p class="text-sm text-gray-500 text-cartel-accent">
            Always.
          </p>
        </div>
      </div>
    </div>
    
    <p>
      You don't apply to join. You don't fill out forms. 
      You prove yourself. Small tasks. Observed closely. Trust is earned in inches.
    </p>
    
    <p>
      If you're useful, you'll hear from us again.<br>
      If you're not, you won't.<br>
      If you betray us...
    </p>
    
    <p class="text-gray-600">
      Well. There's a reason the tunnels go deep.
    </p>
    
    <div class="my-12 border-t border-red-900/30 pt-8">
      <p class="text-center text-gray-500 text-sm">
        "There's a problem at this address."
      </p>
      <p class="text-center text-gray-700 text-xs mt-2">
        - How jobs begin
      </p>
    </div>
    
    <div class="p-6 border border-gray-800 bg-black/50 rounded">
      <div class="text-xs text-gray-600 mb-4">CELL STRUCTURE</div>
      <p class="text-sm text-gray-500">
        You know your cell. Your cell knows you. Nobody knows more than they need to.
        If one falls, the rest survive. That's how we've lasted nine years underground.
      </p>
      <div class="mt-4 text-xs text-gray-600">
        Roles: <span class="text-gray-500">Cutters. Runners. Sparks. Ghosts. Keepers.</span>
      </div>
      <div class="mt-2 text-xs text-gray-700">
        You'll learn what these mean. If you're chosen.
      </div>
    </div>
    
    <div class="mt-12 text-center">
      <a href="/descend" class="text-cartel-accent hover:text-cartel-gold transition">
        Ready to descend? &rarr;
      </a>
    </div>
  </div>
</div>
    `.trim();

    return `
      const template = \`${template.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`;
      const content = \`${content.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`;
      
      const html = template
        .replace('{{title}}', 'Family - Underground')
        .replace('{{content}}', content);
      
      return {
        status: 200,
        contentType: 'text/html',
        body: html
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
      content: "SIGNAL LOST";
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
    <div class="error-main">SIGNAL LOST</div>
    <div class="error-code">ERR_TUNNEL_COLLAPSE // NODE_UNREACHABLE</div>
    
    <div class="terminal-block">
      <div class="terminal-line">&gt; INITIATING SECURE TUNNEL...</div>
      <div class="terminal-line">&gt; ROUTING THROUGH PROXY CHAIN...</div>
      <div class="terminal-line">&gt; NODE 7-ALPHA: <span class="warn">TIMEOUT</span></div>
      <div class="terminal-line">&gt; NODE 7-BETA: <span class="warn">TIMEOUT</span></div>
      <div class="terminal-line">&gt; NODE 7-GAMMA: <span class="error">CONNECTION REFUSED</span></div>
      <div class="terminal-line corrupt">&gt; FALLBACK ROUTE: ██████████</div>
      <div class="terminal-line error">&gt; ALL ROUTES EXHAUSTED</div>
      <div class="terminal-line">&nbsp;</div>
      <div class="terminal-line error">CONNECTION TERMINATED<span class="cursor"></span></div>
    </div>
    
    <div class="back-link">
      <p style="margin-top: 2rem;"><a href="/" style="color:#666; border-bottom: 1px solid #333;">Return to surface broadcast</a></p>
    </div>
  </div>
  
  <script>
    // Animate the connection sequence, then redirect to terminal
    let step = 0;
    const lines = document.querySelectorAll('.terminal-line');
    
    function showLine() {
      if (step < lines.length) {
        lines[step].style.opacity = '1';
        step++;
        
        if (step === lines.length) {
          // After showing "CONNECTION TERMINATED", wait then show success
          setTimeout(() => {
            // Replace the error with success
            document.querySelector('.error-main').textContent = 'ROUTE FOUND';
            document.querySelector('.error-main').style.color = '#ff3366';
            document.querySelector('.error-code').textContent = 'CONNECTING TO UNDERGROUND NODE...';
            
            // Redirect to terminal with cartel mode
            setTimeout(() => {
              window.location.href = '/descend?new=1&mode=cartel';
            }, 1500);
          }, 2000);
        } else {
          setTimeout(showLine, 300 + Math.random() * 400);
        }
      }
    }
    
    // Hide all lines initially, then reveal them one by one
    lines.forEach(line => line.style.opacity = '0');
    lines.forEach(line => line.style.transition = 'opacity 0.3s');
    
    // Check if we're already in terminal mode (has mode param)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'cartel' || urlParams.get('new') === '1') {
      // Already going to terminal - don't show animation, just load terminal
      // The desktop.js will handle this via the terminal template
    } else {
      // Show the animation sequence
      setTimeout(showLine, 500);
    }
  </script>
</body>
</html>\`;
      
      // Check if this is a request with mode=cartel (terminal flow)
      const meta = args[0] || {};
      const url = meta.url || '';
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const mode = urlParams.get('mode');
      const isNew = urlParams.get('new');
      
      if (mode === 'cartel' || isNew === '1') {
        // Serve Cartel-themed terminal template
        const terminalHtml = \`<!DOCTYPE html>
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
          body: terminalHtml
        };
      }
      
      // Otherwise serve the animation page
      return {
        status: 200,
        contentType: 'text/html',
        body: html
      };
    `;
  }

  async registerAlias(): Promise<void> {
    if (!this.domain) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'cartelDomain', this.domain.id);
  }
}
