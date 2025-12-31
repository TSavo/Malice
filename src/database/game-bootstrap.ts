import { AliasLoader, MinimalBootstrap } from './bootstrap/index';
import { runBuilders, rebuildAllMethods } from './bootstrap/builder-registry';
import type { ObjectManager } from './object-manager';

export interface GameBootstrapOptions {
  /**
   * If true, rebuild all builder methods on existing objects.
   * Useful for development when you've changed method code.
   * Set via FORCE_BOOTSTRAP=true environment variable.
   */
  forceBootstrap?: boolean;

  /**
   * TEST ONLY: Build world inline if missing.
   * Production should NEVER use this - run `npm run bootstrap:world` instead.
   */
  _testMode?: boolean;
}

/**
 * Game startup coordinator
 *
 * This assumes the world has already been built via CLI:
 *   npm run bootstrap:world
 *
 * On startup it:
 * 1. Loads all objects into memory
 * 2. Loads aliases from root.aliases
 * 3. Validates the world is built (fails if not)
 * 4. Optionally rebuilds methods if FORCE_BOOTSTRAP=true
 */
export class GameBootstrap {
  private options: GameBootstrapOptions;

  constructor(
    private manager: ObjectManager,
    options: GameBootstrapOptions = {},
  ) {
    this.options = {
      forceBootstrap: false,
      _testMode: false,
      ...options,
    };
  }

  /**
   * Initialize the game system
   */
  async bootstrap(): Promise<void> {
    console.log('🎮 Starting Malice...');

    // Phase 0: Load ALL objects into memory
    // This ensures synchronous property access (getSync/fromValue) always works
    // In-memory state is the single source of truth; DB is only for persistence.
    await this.manager.loadAll();

    // Phase 1: Create minimal required objects (Root, System) if missing
    // These are needed for the alias system to work
    const minimalBootstrap = new MinimalBootstrap(this.manager);
    await minimalBootstrap.bootstrap();

    // Phase 2: Load aliases from MongoDB
    // ALL aliases are loaded from root.properties.aliases
    const aliasLoader = new AliasLoader(this.manager);
    await aliasLoader.loadAliases();

    // Phase 3: Validate world is built (or build for tests)
    const worldExists = await this.checkWorld();

    if (!worldExists) {
      if (this.options._testMode) {
        // TEST ONLY: Build inline
        console.log('  [TEST MODE] Building world inline...');
        await import('./bootstrap/all-builders.js');
        // Aliases needed before builders ($.root, $.system)
        await aliasLoader.loadAliases();
        await runBuilders(this.manager);
        // Reload aliases after builders add new ones
        await aliasLoader.loadAliases();
        console.log('  [TEST MODE] World built');
      } else {
        // Production: Fail - world must be pre-built
        console.error('');
        console.error(
          '═══════════════════════════════════════════════════════════',
        );
        console.error('  ❌ World not built!');
        console.error(
          '═══════════════════════════════════════════════════════════',
        );
        console.error('');
        console.error('Run: npm run bootstrap:world');
        console.error('');
        process.exit(1);
      }
    }

    // Phase 4: Optionally rebuild methods (dev only)
    if (this.options.forceBootstrap) {
      console.log('');
      console.log(
        '═══════════════════════════════════════════════════════════',
      );
      console.log('  🔄 Force rebuilding prototype methods...');
      console.log(
        '═══════════════════════════════════════════════════════════',
      );
      console.log('');

      // Import all builders to register them
      await import('./bootstrap/all-builders.js');
      await rebuildAllMethods(this.manager);

      // Reload aliases after rebuild
      await aliasLoader.loadAliases();

      console.log('');
      console.log('✅ Prototype methods rebuilt!');
      console.log('');
    } else {
      console.log('✅ World is built and ready for connections');
    }
  }

  /**
   * Check if the world has been built
   * @returns true if world exists, false if not
   */
  private async checkWorld(): Promise<boolean> {
    const $ = this.manager as any;
    const describable = $.describable;
    const player = $.player;
    const authManager = $.authManager;

    return !!(describable && player && authManager);
  }
}
