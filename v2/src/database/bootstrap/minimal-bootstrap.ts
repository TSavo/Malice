import { ObjectManager } from '../object-manager.js';

/**
 * Minimal Bootstrap - Creates only the absolute essentials
 *
 * Creates:
 * - #1 Root: Empty base object
 * - #2 System: Connection router
 * - #3 Programmer: Can build everything else via DevTools
 *
 * Everything else is created by Programmer.buildWorld() at runtime
 */
export class MinimalBootstrap {
  constructor(private manager: ObjectManager) {}

  /**
   * Bootstrap the minimal required objects
   */
  async bootstrap(): Promise<void> {
    await this.ensureRoot();
    await this.ensureSystem();
    await this.ensureProgrammer();
    await this.registerCoreAliases();

    console.log('✅ Minimal bootstrap complete');
  }

  /**
   * Register core aliases in root.properties.aliases
   * These are the ONLY aliases TypeScript needs to know about
   */
  private async registerCoreAliases(): Promise<void> {
    const root = await this.manager.load(1);
    if (!root) return;

    const aliases = (root.get('aliases') as Record<string, number>) || {};

    // Only register if not already present
    if (!aliases.system) aliases.system = 2;
    if (!aliases.programmer) aliases.programmer = 3;

    root.set('aliases', aliases);
    await root.save();

    console.log('✅ Registered core aliases in root.properties.aliases');
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

          // Alias mappings (populated by Programmer.buildWorld)
          aliases: {},

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
   * Ensure System object #2 exists
   * Routes new connections to appropriate handlers
   */
  private async ensureSystem(): Promise<void> {
    let system = await this.manager.load(2);
    if (!system) {
      system = await this.manager.create({
        parent: 1,
        properties: {
          name: 'System',
          description: 'Connection router and system coordinator',
        },
        methods: {
          // Called when a new connection arrives
          onConnection: `
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
              context.send('\\r\\n');
              context.send('Administrator: Connect via DevTools and run:\\r\\n');
              context.send('  await $.programmer.call("buildWorld", context)\\r\\n');
              context.send('\\r\\n');
              context.close();
              return;
            }

            if (authInfo === null) {
              // Mode 1: Interactive authentication
              context.setHandler(authManager);
              await authManager.call('onConnect', context);
            } else {
              // Mode 2: Pre-authenticated (SSL cert, HTTP auth, etc.)
              const preAuth = await $.preAuthHandler;
              if (!preAuth) {
                context.send('Pre-authentication not available.\\r\\n');
                context.close();
                return;
              }

              context.setHandler(preAuth);
              await preAuth.call('onPreAuth', context, authInfo);
            }
          `,
        },
      });
      console.log('✅ Created System object #2');
    }
  }

  /**
   * Ensure Programmer object #3 exists
   * Provides tools to build the world and manage objects
   */
  private async ensureProgrammer(): Promise<void> {
    let programmer = await this.manager.load(3);
    if (!programmer) {
      programmer = await this.manager.create({
        parent: 1,
        properties: {
          name: 'Programmer',
          description: 'World builder and object management tools',

          // Security: Only accessible via DevTools with SSL cert
          requiresDevTools: true,
        },
        methods: {
          // Build the entire world from scratch
          buildWorld: `
            const context = args[0];

            context.send('\\r\\n');
            context.send('═══════════════════════════════════════════════════════════\\r\\n');
            context.send('  MALICE - World Builder\\r\\n');
            context.send('═══════════════════════════════════════════════════════════\\r\\n');
            context.send('\\r\\n');
            context.send('Building world from minimal bootstrap...\\r\\n');
            context.send('\\r\\n');

            try {
              // Load builders
              const { PrototypeBuilder } = await import('./bootstrap/prototype-builder.js');
              const { CoreSystemBuilder } = await import('./bootstrap/core-system-builder.js');

              const prototypeBuilder = new PrototypeBuilder($);
              const coreSystemBuilder = new CoreSystemBuilder($);

              // Build prototypes
              context.send('Creating object prototypes...\\r\\n');
              await prototypeBuilder.buildPrototypes();
              context.send('  ✅ Created Describable, Agent, Human, Player\\r\\n');

              // Build core systems
              context.send('Creating core systems...\\r\\n');
              await coreSystemBuilder.buildCoreSystems();
              context.send('  ✅ Created AuthManager, CharGen, PreAuthHandler\\r\\n');

              // Register aliases
              context.send('Registering system aliases...\\r\\n');
              const root = await $.load(1);
              const aliases = root.get('aliases') || {};

              for (const [name, id] of Object.entries(aliases)) {
                await $.registerAliasById(name, id);
              }
              context.send('  ✅ Registered aliases\\r\\n');

              context.send('\\r\\n');
              context.send('═══════════════════════════════════════════════════════════\\r\\n');
              context.send('  World built successfully!\\r\\n');
              context.send('═══════════════════════════════════════════════════════════\\r\\n');
              context.send('\\r\\n');
              context.send('Users can now connect via telnet or websocket.\\r\\n');
              context.send('\\r\\n');

            } catch (err) {
              context.send(\`\\r\\n❌ Error building world: \${err.message}\\r\\n\`);
              console.error('World build error:', err);
              throw err;
            }
          `,

          // Create a new object
          create: `
            const spec = args[0];
            const obj = await $.create(spec);
            return obj;
          `,

          // Edit an object's properties
          setProperty: `
            const objectId = args[0];
            const key = args[1];
            const value = args[2];

            const obj = await $.load(objectId);
            if (!obj) throw new Error('Object not found');

            obj.set(key, value);
            await obj.save();

            return obj;
          `,

          // Edit an object's method
          setMethod: `
            const objectId = args[0];
            const methodName = args[1];
            const methodCode = args[2];

            const obj = await $.load(objectId);
            if (!obj) throw new Error('Object not found');

            obj.setMethod(methodName, methodCode);
            await obj.save();

            return obj;
          `,

          // Register an alias
          registerAlias: `
            const name = args[0];
            const objectId = args[1];

            // Register in runtime
            await $.registerAliasById(name, objectId);

            // Persist in root.aliases
            const root = await $.load(1);
            const aliases = root.get('aliases') || {};
            aliases[name] = objectId;
            root.set('aliases', aliases);
            await root.save();

            return true;
          `,

          // Clear an alias
          clearAlias: `
            const name = args[0];

            // Clear from runtime
            $.clearAlias(name);

            // Remove from root.aliases
            const root = await $.load(1);
            const aliases = root.get('aliases') || {};
            delete aliases[name];
            root.set('aliases', aliases);
            await root.save();

            return true;
          `,
        },
      });
      console.log('✅ Created Programmer object #3');
    }
  }
}
