import { ObjectManager } from '../object-manager.js';

/**
 * Loads aliases from MongoDB root object
 * Registers them in the ObjectManager at startup
 */
export class AliasLoader {
  constructor(private manager: ObjectManager) {}

  /**
   * Load and register all aliases from root.properties.aliases
   */
  async loadAliases(): Promise<void> {
    const root = await this.manager.load(1);
    if (!root) {
      console.log('⚠️  Root object not found, skipping alias loading');
      return;
    }

    const aliases = root.get('aliases') || {};
    const aliasCount = Object.keys(aliases).length;

    if (aliasCount === 0) {
      console.log('⚠️  No aliases found in root.properties.aliases');
      return;
    }

    // Register each alias
    let registered = 0;
    for (const [name, id] of Object.entries(aliases)) {
      try {
        const obj = await this.manager.load(id as number);
        if (obj) {
          await this.manager.registerAliasById(name, id as number);
          registered++;
        } else {
          console.log(`⚠️  Alias '${name}' points to non-existent object #${id}`);
        }
      } catch (err) {
        console.error(`❌ Failed to register alias '${name}':`, err);
      }
    }

    console.log(`✅ Registered ${registered}/${aliasCount} aliases from MongoDB`);
  }

  /**
   * Register core system aliases (minimal set)
   */
  async registerCoreAliases(): Promise<void> {
    // Always register these core aliases, even if not in root.aliases yet
    const coreAliases: Record<string, number> = {
      system: 2,
      programmer: 3,
    };

    for (const [name, id] of Object.entries(coreAliases)) {
      const obj = await this.manager.load(id);
      if (obj) {
        await this.manager.registerAliasById(name, id);
      }
    }

    console.log('✅ Registered core system aliases');
  }
}
