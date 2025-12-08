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
   *
   * Note: Root is a special bootstrap object created via db.create() with explicit ID.
   * Normal objects should be created via $.recycler which uses manager.create().
   */
  private async ensureRoot(): Promise<void> {
    let root = await this.manager.load(1);
    if (!root) {
      // Create directly in database with explicit ID (bootstrap-only pattern)
      await this.manager.db.create({
        _id: 1,
        parent: 0,
        properties: {
          name: { type: 'string', value: 'Root' },
          description: { type: 'string', value: 'Base of all objects' },
          config: {
            type: 'object',
            value: {
              siteName: { type: 'string', value: 'Malice' },
              motd: { type: 'string', value: 'Welcome to Malice!' },
              maxConnections: { type: 'number', value: 100 },
            },
          },
        },
        methods: {},
      });
      // Now load it to get the RuntimeObject
      root = await this.manager.load(1);
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
      // Create directly in database with explicit ID (bootstrap-only pattern)
      // Normal objects should be created via $.recycler
      await this.manager.db.create({
        _id: 2,
        parent: 1,
        properties: {
          name: { type: 'string', value: 'System' },
          description: { type: 'string', value: 'Connection router and system coordinator' },
        },
        methods: {},
      });
      // Now load it to get the RuntimeObject
      system = await this.manager.load(2);
      if (!system) throw new Error('Failed to load System object after creation');

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

    // Always ensure tickAllPlayers exists (may not exist on older systems)
    if (!system.hasMethod('tickAllPlayers')) {
      // Tick all online players (heartbeat)
      // Called by scheduler every minute
      system.setMethod('tickAllPlayers', `
        const authManager = $.authManager;
        if (!authManager) return { error: 'No authManager' };

        const onlinePlayers = authManager.onlinePlayers || [];
        const results = [];

        for (const playerId of onlinePlayers) {
          const player = await $.load(playerId);
          if (player && player.heartbeat) {
            try {
              await player.heartbeat();
              results.push({ player: playerId, success: true });
            } catch (err) {
              results.push({ player: playerId, success: false, error: String(err) });
            }
          }
        }

        return { tickedPlayers: results.length, results: results };
      `);
    }
  }

}
