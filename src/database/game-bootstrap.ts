import { ObjectManager } from './object-manager.js';
import { MinimalBootstrap, AliasLoader } from './bootstrap/index.js';

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
  constructor(private manager: ObjectManager) {}

  /**
   * Bootstrap the game system
   */
  async bootstrap(): Promise<void> {
    console.log('🎮 Bootstrapping Malice...');

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
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  🏗️  Building World...');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');

      await this.buildWorld();

      console.log('');
      console.log('✅ World built successfully!');
      console.log('');
    } else {
      console.log('✅ World is built and ready for connections');
    }
  }

  /**
   * Build the complete world (prototypes + core systems)
   */
  private async buildWorld(): Promise<void> {
    const { PrototypeBuilder } = await import('./bootstrap/prototype-builder.js');
    const { CoreSystemBuilder } = await import('./bootstrap/core-system-builder.js');
    const { WorldBuilder } = await import('./bootstrap/world-builder.js');

    const { BuildingBuilder } = await import('./bootstrap/building-builder.js');
    const prototypeBuilder = new PrototypeBuilder(this.manager);
    const coreSystemBuilder = new CoreSystemBuilder(this.manager);
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
    console.log("Registering global building aliases...");
    const citySign = await this.manager.find(obj => obj.name === "City Announcement Board");
    if (citySign) {
      const objectManager = await this.manager.load(0);
      await objectManager?.call("addAlias", "cityAnnounce", citySign.id);
      console.log("  ✅ Registered $.cityAnnounce");
    } else {
      console.warn("  ⚠️  City Announcement Board not found");
    }

    // Reload aliases again to include startRoom
    await aliasLoader.loadAliases();
  }
}
