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
    const aliasLoader = new AliasLoader(this.manager);
    await aliasLoader.registerCoreAliases();  // system, programmer
    await aliasLoader.loadAliases();           // everything else from root.aliases

    // Phase 3: Check if world is built
    await this.checkWorldStatus();
  }

  /**
   * Check if the world has been built
   */
  private async checkWorldStatus(): Promise<void> {
    const describable = await this.manager.load(10);
    const player = await this.manager.load(13);
    const authManager = await this.manager.load(4);

    if (!describable || !player || !authManager) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  ⚠️  WORLD NOT BUILT');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log('This is a minimal bootstrap. The game world needs to be built.');
      console.log('');
      console.log('To build the world:');
      console.log('  1. Connect via DevTools (SSL client certificate required)');
      console.log('  2. Run: await $.programmer.call("buildWorld", context)');
      console.log('');
      console.log('After building, users can connect via telnet/websocket.');
      console.log('');
    } else {
      console.log('✅ World is built and ready for connections');
    }
  }
}
