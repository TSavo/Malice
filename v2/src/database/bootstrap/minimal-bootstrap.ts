import { ObjectManager } from '../object-manager.js';

/**
 * Minimal Bootstrap - Creates only the absolute essentials
 *
 * Creates:
 * - #1 Root: Empty base object (always #1, parent of all objects)
 * - #2 System: Connection router (registered as $.system)
 *
 * World is automatically built on first run (prototypes + core systems)
 */
export class MinimalBootstrap {
  constructor(private manager: ObjectManager) {}

  /**
   * Bootstrap the minimal required objects
   */
  async bootstrap(): Promise<void> {
    await this.ensureRoot();
    await this.ensureSystem();
    await this.registerCoreAliases();

    console.log('✅ Minimal bootstrap complete');
  }

  /**
   * Register core aliases in #0.properties.aliases (ObjectManager)
   */
  private async registerCoreAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    // Register core aliases
    if (!aliases.nothing) aliases.nothing = -1;
    if (!aliases.object_manager) aliases.object_manager = 0;
    if (!aliases.root) aliases.root = 1;
    if (!aliases.system) aliases.system = 2;

    objectManager.set('aliases', aliases);

    console.log('✅ Registered core aliases in #0.properties.aliases');
  }

  /**
   * Ensure Root object #1 exists
   * Base of all inheritance, stores global configuration
   */
  private async ensureRoot(): Promise<void> {
    let root = await this.manager.load(1);
    if (!root) {
      root = await this.manager.create({
        parent: 0,
        properties: {
          name: 'Root',
          description: 'Base of all objects',

          // System configuration
          config: {
            siteName: 'Malice',
            motd: 'Welcome to Malice!',
            maxConnections: 100,
          },
        },
        methods: {},
      });
      console.log('✅ Created Root object #1');
    }
  }

  /**
   * Ensure System object exists
   * Routes new connections to appropriate handlers
   */
  private async ensureSystem(): Promise<void> {
    // Check if System already exists via alias
    const objectManager = await this.manager.load(0);
    const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};

    let system = aliases.system ? await this.manager.load(aliases.system) : null;
    if (!system) {
      system = await this.manager.create({
        parent: 1,
        properties: {
          name: 'System',
          description: 'Connection router and system coordinator',
        },
        methods: {},
      });

      // Called when a new connection arrives
      system.setMethod('onConnection', `
        const context = args[0];
        const authInfo = context.getAuthInfo();

        // Check if world is built
        const authManager = await $.authManager;
        if (!authManager) {
          context.send('\\r\\n');
          context.send('═══════════════════════════════════════════════════════════\\r\\n');
          context.send('  MALICE - System Not Initialized\\r\\n');
          context.send('═══════════════════════════════════════════════════════════\\r\\n');
          context.send('\\r\\n');
          context.send('The game world has not been built yet.\\r\\n');
          context.send('This should not happen - world builds automatically on startup.\\r\\n');
          context.send('Please restart the server.\\r\\n');
          context.send('\\r\\n');
          context.close();
          return;
        }

        if (authInfo === null) {
          // Mode 1: Interactive authentication
          context.setHandler(authManager);
          await authManager.onConnect(context);
        } else {
          // Mode 2: Pre-authenticated (SSL cert, HTTP auth, etc.)
          const preAuth = await $.preAuthHandler;
          if (!preAuth) {
            context.send('Pre-authentication not available.\\r\\n');
            context.close();
            return;
          }

          context.setHandler(preAuth);
          await preAuth.onPreAuth(context, authInfo);
        }
      `);
      console.log(`✅ Created System object #${system.id}`);
    }
  }

}
