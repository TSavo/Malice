import { runBuilders } from './bootstrap/builder-registry';
import { AliasLoader, MinimalBootstrap } from './bootstrap/index';
import type { ObjectManager } from './object-manager';

export interface GameBootstrapOptions {
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
 */
export class GameBootstrap {
  private options: GameBootstrapOptions;

  constructor(
    private manager: ObjectManager,
    options: GameBootstrapOptions = {},
  ) {
    this.options = {
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

    console.log('✅ World is built and ready for connections');
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
