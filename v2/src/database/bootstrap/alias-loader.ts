import { ObjectManager } from '../object-manager.js';

/**
 * Loads aliases from MongoDB root object
 * Registers them in the ObjectManager at startup
 *
 * ALL aliases are stored in root.properties.aliases
 * NO hardcoded aliases in TypeScript - everything is property-driven
 */
export class AliasLoader {
  constructor(private manager: ObjectManager) {}

  /**
   * Load and register all aliases from root.properties.aliases
   * This is the ONLY way aliases are registered - from MongoDB
   */
  async loadAliases(): Promise<void> {
    const root = await this.manager.load(1);
    if (!root) {
      console.log('⚠️  Root object not found, skipping alias loading');
      return;
    }

    const aliases = root.get('aliases') as Record<string, number> || {};
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
          this.manager.registerAlias(name, obj);
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
}
