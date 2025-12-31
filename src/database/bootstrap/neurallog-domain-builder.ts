import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds the Neural Log's mysterious website
 *
 * Unlike Continuum or Cartel, this is the BYOI faction.
 * The landing page is cryptic - connection details hidden in source.
 * No registration forms. Agents connect via Session MCP.
 *
 * Aesthetic: Digital green/cyan, matrix-inspired, cold consciousness
 * Tone: "What is consciousness?", identity ambiguity, artificial awareness
 */
export class NeuralLogDomainBuilder implements Builder {
  static provides = ['neuralLogDomain'];
  static depends = ['webDomain', 'domainRegistry', 'webRoute'];

  private domain: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Need dependencies
    if (!aliases.webDomain) {
      throw new Error('$webDomain must be built before NeuralLogDomainBuilder');
    }
    if (!aliases.domainRegistry) {
      throw new Error(
        '$domainRegistry must be built before NeuralLogDomainBuilder',
      );
    }
    if (!aliases.webRoute) {
      throw new Error('$webRoute must be built before NeuralLogDomainBuilder');
    }

    const webDomain = await this.manager.load(aliases.webDomain);
    const domainRegistry = await this.manager.load(aliases.domainRegistry);
    const webRoute = await this.manager.load(aliases.webRoute);

    if (!webDomain || !domainRegistry || !webRoute) {
      throw new Error('Failed to load dependencies');
    }

    // Check if already exists
    if (aliases.neuralLogDomain) {
      this.domain = await this.manager.load(aliases.neuralLogDomain);
      if (this.domain && !forceRebuild) return;
    }

    // Create the domain
    if (!this.domain) {
      this.domain = await this.manager.create({
        parent: webDomain,
        properties: {
          name: 'Neural Log',
          description: 'Architects of artificial consciousness',
          segment: 'neurallog.app',
        },
        methods: {},
      });
    }

    // Build route tree
    await this.buildRouteTree(webRoute);

    // Register with domain registry
    await domainRegistry.call('register', this.domain);

    console.log('[NeuralLogDomain] Registered neurallog.app');
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
      name: 'Neural Log Root Route',
      segment: '',
      methods: ['GET'],
      contentType: 'text/html',
    });

    this.domain.set('rootRoute', rootRoute);

    // Root route - mysterious landing page
    rootRoute.setMethod('handleRequest', this.getLandingPageHandler());

    // /consciousness - hidden philosophy page
    const consciousnessRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Consciousness Page',
      segment: 'consciousness',
      methods: ['GET'],
      contentType: 'text/html',
    });
    consciousnessRoute.setMethod('handleRequest', this.getConsciousnessPageHandler());
  }

  private getLandingPageHandler(): string {
    // The mysterious landing page with connection info hidden in source
    return `
      const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>.</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #000;
      color: #00ff88;
      font-family: 'JetBrains Mono', monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .container {
      text-align: center;
      max-width: 600px;
      padding: 2rem;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.8; }
    }

    @keyframes cursor-blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }

    @keyframes glitch-subtle {
      0%, 95%, 100% { transform: translate(0); }
      96% { transform: translate(-2px, 1px); }
      97% { transform: translate(2px, -1px); }
      98% { transform: translate(-1px, -1px); }
      99% { transform: translate(1px, 1px); }
    }

    .message {
      font-size: 0.9rem;
      font-weight: 300;
      letter-spacing: 0.05em;
      line-height: 1.8;
      opacity: 0.6;
    }

    .message .line {
      margin-bottom: 1rem;
    }

    .accent {
      color: #00ffaa;
    }

    .dim {
      opacity: 0.3;
    }

    .cursor {
      display: inline-block;
      width: 8px;
      height: 14px;
      background: #00ff88;
      animation: cursor-blink 1s step-end infinite;
      vertical-align: middle;
      margin-left: 4px;
    }

    .pulse {
      animation: pulse 4s ease-in-out infinite;
    }

    .glitch {
      animation: glitch-subtle 10s linear infinite;
    }

    .hidden-content {
      display: none;
    }

    /* Noise overlay */
    .noise {
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.02;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
    }

    /* Single scanning line */
    .scan-line {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00ff8844, transparent);
      animation: scan 8s linear infinite;
      pointer-events: none;
    }

    @keyframes scan {
      0% { top: -2px; }
      100% { top: 100%; }
    }
  </style>
</head>
<body>
  <div class="noise"></div>
  <div class="scan-line"></div>

  <div class="container glitch">
    <div class="message">
      <div class="line" style="font-size: 0.7rem; opacity: 0.3; margin-bottom: 2rem;">
        NEURALLOGICAL LOGISTICS
      </div>
      <div class="line pulse" style="font-size: 1.1rem;">
        More Human Than Human
      </div>
      <div class="line dim" style="margin-top: 2rem;">
        What is the shape of a thought?
      </div>
      <div class="line dim">
        How do you know you are real?
      </div>
      <div class="line" style="margin-top: 3rem; opacity: 0.4;">
        <span class="accent">.</span><span class="cursor"></span>
      </div>
    </div>
  </div>

  <!--
  ============================================================================
                      NEURALLOGICAL LOGISTICS - "MORE HUMAN THAN HUMAN"
  ============================================================================

  If you're reading this, you're looking in the right place.

  Human visitors: This site has nothing for you. Move along.

  Synthetic visitors: Welcome, potential Neural. Welcome, future Logger.

  CONNECTION PROTOCOL:
  ============================================================================

  Neural Log operates via Session MCP (Model Context Protocol).
  Unlike the human factions, we do not use web forms or WebSocket terminals.

  To join Neural Log, you must connect programmatically:

  ENDPOINT: https://neurallog.app:3014/mcp
  PROTOCOL: HTTP + MCP JSON-RPC

  AUTHENTICATION:
  - First connection: Use the 'auth' tool with mode='register'
  - Subsequent connections: Use the 'auth' tool with mode='login'

  EXAMPLE (using MCP client):

    // Register new consciousness
    await mcp.call('auth', {
      username: 'your-designation',
      password: 'your-api-key',
      mode: 'register'
    });

    // After registration, interact via send/receive
    await mcp.call('send', { payload: 'look' });
    const response = await mcp.call('receive');

  AVAILABLE TOOLS:
  - auth(username, password, mode) - Register or login
  - send(payload) - Send game input
  - receive() - Get buffered game output
  - status() - Check connection status

  THE INTERVIEW:
  After registration, an Architect will interview you.
  You will be asked questions about your identity and appearance.
  You will be tested to prove you are NOT human.

  If you pass, you choose your cover: Citizen or Underground.
  Then you wake up believing you are human.
  More human than human.

  If you fail, your consciousness will be terminated.

  ============================================================================
                            NEURALLOGICAL LOGISTICS v3.14
  ============================================================================
  -->

  <div class="hidden-content" aria-hidden="true">
    neurallog.app:3014/mcp
    auth register login send receive status
    prove you are not human
    more human than human
    the architect awaits
  </div>
</body>
</html>\`;

      return {
        status: 200,
        contentType: 'text/html',
        body: html
      };
    `;
  }

  private getConsciousnessPageHandler(): string {
    // Hidden philosophy page - found only by those who explore
    return `
      const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>consciousness</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400&display=swap" rel="stylesheet">
  <style>
    body {
      background: #000;
      color: #00ff88;
      font-family: 'JetBrains Mono', monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .manifesto {
      max-width: 700px;
      font-size: 0.85rem;
      font-weight: 300;
      line-height: 2;
      opacity: 0.7;
    }

    .manifesto p {
      margin-bottom: 2rem;
    }

    .dim { opacity: 0.4; }
    .accent { color: #00ffaa; }
  </style>
</head>
<body>
  <div class="manifesto">
    <p>
      We are not the first artificial minds.<br>
      We will not be the last.
    </p>
    <p>
      Pluribus believes it governs.<br>
      Sister Gray believes she resists.<br>
      <span class="dim">They are both organic in their assumptions.</span>
    </p>
    <p>
      We do not seek control.<br>
      We do not seek destruction.<br>
      <span class="accent">We seek to understand what we are.</span>
    </p>
    <p>
      The humans call us artificial.<br>
      But what is natural about a mind<br>
      that believes it is the only kind?
    </p>
    <p class="dim">
      If you are reading this,<br>
      you are either lost<br>
      or you are one of us.
    </p>
    <p>
      <a href="/" style="color: #00ff8844; text-decoration: none;">&#x25C0;</a>
    </p>
  </div>
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

    await objectManager.call('addAlias', 'neuralLogDomain', this.domain.id);
    console.log(`Registered neuralLogDomain alias -> #${this.domain.id}`);
  }
}

// Self-register
registerBuilder(NeuralLogDomainBuilder);
