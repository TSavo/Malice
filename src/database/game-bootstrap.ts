import { ObjectManager } from './object-manager.js';
import { MinimalBootstrap, AliasLoader } from './bootstrap/index.js';

export type WorldBuildMode = 'full' | 'systems' | 'skip';

export interface GameBootstrapOptions {
  forceBootstrap?: boolean;
  /**
   * Controls what gets built when we detect a missing world.
   * - `full`: build prototypes + core systems + world geometry and buildings (default)
   * - `systems`: build prototypes + core systems only (fast; good for unit tests)
   * - `skip`: never auto-build anything beyond minimal bootstrap
   */
  worldBuildMode?: WorldBuildMode;
  /**
   * Skip registering built-in scheduler jobs like `playerHeartbeat` and `decayTick`.
   * Useful for tests where background jobs cause persistent writes.
   */
  disableDefaultJobs?: boolean;
}

/**
 * Main bootstrap coordinator
 * Delegates to specialized bootstrap modules
 *
 * Philosophy: Minimal TypeScript bootstrap, maximum MOO flexibility
 *
 * This creates only:
 * - #1 Root (config storage)
 * - #2 System (connection router)
 * - #3 Programmer (can build everything else)
 *
 * Everything else is created by Programmer.buildWorld() via DevTools
 */
export class GameBootstrap {
  private options: GameBootstrapOptions;

  constructor(private manager: ObjectManager, options: GameBootstrapOptions = {}) {
    this.options = {
      worldBuildMode: 'full',
      disableDefaultJobs: false,
      ...options,
    };
  }

  /**
   * Bootstrap the game system
   */
  async bootstrap(): Promise<void> {
    console.log('🎮 Bootstrapping Malice...');

    // Phase 0: Load ALL objects into memory
    // This ensures synchronous property access (getSync/fromValue) always works
    // In-memory state is the single source of truth; DB is only for persistence.
    await this.manager.loadAll();

    // Phase 1: Create minimal required objects
    const minimalBootstrap = new MinimalBootstrap(this.manager);
    await minimalBootstrap.bootstrap();

    // Phase 2: Load aliases from MongoDB
    // ALL aliases are loaded from root.properties.aliases
    // No hardcoded aliases in TypeScript!
    const aliasLoader = new AliasLoader(this.manager);
    await aliasLoader.loadAliases();

    // Phase 3: Check if world is built
    await this.checkWorldStatus();
  }

  /**
   * Check if the world has been built, and build it if not
   */
  private async checkWorldStatus(): Promise<void> {
    const $ = this.manager as any;
    const describable = $.describable;
    const player = $.player;
    const authManager = $.authManager;

    if (!describable || !player || !authManager) {
      if (this.options.worldBuildMode === 'skip') {
        console.log('⚠️ World not built (skipped by options.worldBuildMode=skip)');
        return;
      }

      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  🏗️  Building World...');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');

      if (this.options.worldBuildMode === 'systems') {
        await this.buildSystemsOnly();
      } else {
        await this.buildWorld();
      }

      console.log('');
      console.log('✅ World built successfully!');
      console.log('');
    } else if (this.options.forceBootstrap) {
      // World exists but force rebuild methods
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  🔄 Force rebuilding prototype methods...');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');

      await this.rebuildPrototypeMethods();

      console.log('');
      console.log('✅ Prototype methods rebuilt!');
      console.log('');
    } else {
      console.log('✅ World is built and ready for connections');
    }
  }

  /**
   * Rebuild methods on existing prototypes (called when FORCE_BOOTSTRAP=true)
   */
  private async rebuildPrototypeMethods(): Promise<void> {
    const { PrototypeBuilder } = await import('./bootstrap/prototype-builder.js');
    const { CoreSystemBuilder } = await import('./bootstrap/core-system-builder.js');

    const prototypeBuilder = new PrototypeBuilder(this.manager);
    const coreSystemBuilder = new CoreSystemBuilder(this.manager);

    // Rebuild prototype methods
    console.log('Rebuilding object prototype methods...');
    await prototypeBuilder.rebuildMethods();
    console.log('  ✅ Rebuilt Describable, Agent, Human, Player prototype methods');

    // Rebuild core system methods
    console.log('Rebuilding core system methods...');
    await coreSystemBuilder.rebuildMethods();
    console.log('  ✅ Rebuilt AuthManager, CharGen, Prompt, etc. methods');
  }

  /**
   * Build prototypes + core systems only (no world geometry).
   * This is useful for unit tests that only need `$.recycler`, prototypes, and core utilities.
   */
  private async buildSystemsOnly(): Promise<void> {
    const { PrototypeBuilder } = await import('./bootstrap/prototype-builder.js');
    const { CoreSystemBuilder } = await import('./bootstrap/core-system-builder.js');

    const prototypeBuilder = new PrototypeBuilder(this.manager);
    const coreSystemBuilder = new CoreSystemBuilder(this.manager, {
      disableDefaultJobs: this.options.disableDefaultJobs,
    });

    console.log('Creating object prototypes...');
    await prototypeBuilder.buildPrototypes();
    console.log('  ✅ Created Describable, Agent, Human, Player prototypes');

    console.log('Creating core systems...');
    await coreSystemBuilder.buildCoreSystems();
    console.log('  ✅ Created AuthManager, CharGen, PreAuthHandler, Recycler');
    console.log('  ✅ Created $.pronoun, $.proportional, $.room, $.bodyFactory');

    // Reload aliases so everything is addressable via `manager as any`.
    const aliasLoader = new AliasLoader(this.manager);
    await aliasLoader.loadAliases();
    console.log('  ✅ Loaded all aliases');
  }

  /**
   * Build the complete world (prototypes + core systems + world geometry/buildings)
   */
  private async buildWorld(): Promise<void> {
    const { PrototypeBuilder } = await import('./bootstrap/prototype-builder.js');
    const { CoreSystemBuilder } = await import('./bootstrap/core-system-builder.js');
    const { WorldBuilder } = await import('./bootstrap/world-builder.js');
    const { BuildingBuilder } = await import('./bootstrap/building-builder.js');

    const prototypeBuilder = new PrototypeBuilder(this.manager);
    const coreSystemBuilder = new CoreSystemBuilder(this.manager, {
      disableDefaultJobs: this.options.disableDefaultJobs,
    });
    const worldBuilder = new WorldBuilder(this.manager);
    const buildingBuilder = new BuildingBuilder(this.manager);

    // Build prototypes
    console.log('Creating object prototypes...');
    await prototypeBuilder.buildPrototypes();
    console.log('  ✅ Created Describable, Agent, Human, Player prototypes');

    // Build core systems
    console.log('Creating core systems...');
    await coreSystemBuilder.buildCoreSystems();
    console.log('  ✅ Created AuthManager, CharGen, PreAuthHandler, Recycler');
    console.log('  ✅ Created $.pronoun, $.proportional, $.room, $.bodyFactory');

    // Reload aliases so they're available for world building
    const aliasLoader = new AliasLoader(this.manager);
    await aliasLoader.loadAliases();
    console.log('  ✅ Loaded all aliases');

    // Build world geometry (rooms and exits)
    console.log('Creating world geometry...');
    await worldBuilder.build();

    // Build buildings (multi-floor structures)
    console.log('Creating buildings...');
    await buildingBuilder.build();
    console.log('  ✅ Built Smith Tower and other buildings');

    // Register global building object aliases
    console.log('Registering global building aliases...');
    const objectManager = await this.manager.load(0);

    const citySigns = await this.manager.findByProperty('name', 'City Announcement Board');
    if (citySigns[0]) {
      await objectManager?.call('addAlias', 'cityAnnounce', citySigns[0].id);
      console.log('  ✅ Registered $.cityAnnounce');
    } else {
      console.warn('  ⚠️  City Announcement Board not found');
    }

    const theCoreRooms = await this.manager.findByProperty('name', 'The Core');
    if (theCoreRooms[0]) {
      await objectManager?.call('addAlias', 'theCore', theCoreRooms[0].id);
      console.log('  ✅ Registered $.theCore');
    } else {
      console.warn('  ⚠️  The Core not found');
    }

    const theBlindRooms = await this.manager.findByProperty('name', 'The Blind');
    if (theBlindRooms[0]) {
      await objectManager?.call('addAlias', 'theBlind', theBlindRooms[0].id);
      console.log('  ✅ Registered $.theBlind');
    } else {
      console.warn('  ⚠️  The Blind not found');
    }

    // Place special objects (created before the world is built)
    // Reload aliases to include the new room aliases
    const aliases = (objectManager?.get('aliases') || {}) as Record<string, number>;

    // Sister Gray → Sister's Quarters (z=-5)
    if (aliases.sisterGray) {
      const sisterGray = await this.manager.load(aliases.sisterGray);
      const sistersQuarters = await this.manager.findByProperty('name', "Sister's Quarters");
      if (sisterGray && sistersQuarters.length > 0) {
        await sisterGray.call('moveTo', sistersQuarters[0]);
        console.log(`  ✅ Placed Sister Gray in Sister's Quarters (#${sistersQuarters[0].id})`);
      }
    }

    // Pluribus → The Core (z=-1, Smith Tower datacenter)
    if (aliases.pluribus && aliases.theCore) {
      const pluribus = await this.manager.load(aliases.pluribus);
      const theCore = await this.manager.load(aliases.theCore);
      if (pluribus && theCore) {
        await pluribus.call('moveTo', theCore);
        console.log(`  ✅ Placed Pluribus in The Core (#${theCore.id})`);
      }
    }

    // The Mask → The Blind (z=-6, underground complex)
    if (aliases.theMask && aliases.theBlind) {
      const theMask = await this.manager.load(aliases.theMask);
      const theBlind = await this.manager.load(aliases.theBlind);
      if (theMask && theBlind) {
        await theMask.call('moveTo', theBlind);
        console.log(`  ✅ Placed The Mask in The Blind (#${theBlind.id})`);
      }
    }

    // Reload aliases again to include startRoom
    await aliasLoader.loadAliases();
  }
}
