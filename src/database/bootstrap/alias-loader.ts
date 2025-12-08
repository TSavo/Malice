import { ObjectManager } from '../object-manager.js';

/**
 * Loads aliases from ObjectManager (#0)
 * Registers them in the ObjectManager at startup
 *
 * ALL aliases are stored in #0.properties.aliases (the ObjectManager itself)
 * NO hardcoded aliases in TypeScript - everything is property-driven
 */
export class AliasLoader {
  constructor(private manager: ObjectManager) {}

  /**
   * Load and register all aliases from #0.properties.aliases
   * This is the ONLY way aliases are registered - from MongoDB
   */
  async loadAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) {
      console.log('⚠️  ObjectManager (#0) not found, skipping alias loading');
      return;
    }

    const aliases = objectManager.get('aliases') as Record<string, number> || {};
    const aliasCount = Object.keys(aliases).length;

    if (aliasCount === 0) {
      console.log('⚠️  No aliases found in #0.properties.aliases');
      return;
    }

    // Register each alias
    let registered = 0;
    let skipped = 0;
    for (const [name, id] of Object.entries(aliases)) {
      // Skip nested objects (like bodyParts which is a namespace, not an alias)
      if (typeof id !== 'number') {
        skipped++;
        continue;
      }

      try {
        const obj = await this.manager.load(id);
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

    const actualCount = aliasCount - skipped;
    console.log(`✅ Registered ${registered}/${actualCount} aliases from MongoDB`);
  }
}
