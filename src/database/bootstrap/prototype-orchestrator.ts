import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';
import * as Builders from './prototypes/index.js';
import { CashBuilder } from './cash-builder.js';

/**
 * Interface for builders with self-declared metadata
 */
interface SinglePrototypeBuilder {
  readonly alias: string;
  readonly parent: string;
  new (manager: ObjectManager): {
    build(parentId: number, existingObj?: RuntimeObject): Promise<RuntimeObject>;
  };
}

/**
 * Interface for compound builders that create multiple prototypes
 */
interface CompoundPrototypeBuilder {
  readonly aliases: readonly string[];
  readonly parent: string;
  new (manager: ObjectManager): {
    buildAll(parentId: number): Promise<Record<string, RuntimeObject>>;
  };
}

type PrototypeBuilder = SinglePrototypeBuilder | CompoundPrototypeBuilder;

function isSingleBuilder(b: PrototypeBuilder): b is SinglePrototypeBuilder {
  return 'alias' in b && typeof b.alias === 'string';
}

function isCompoundBuilder(b: PrototypeBuilder): b is CompoundPrototypeBuilder {
  return 'aliases' in b && Array.isArray(b.aliases);
}

/**
 * Orchestrates building the object prototype hierarchy
 *
 * Discovers builders from prototypes/index.ts, topologically sorts
 * by parent dependency, and builds in correct order.
 *
 * Each builder declares its own metadata:
 * - static readonly alias = 'name'  (or aliases = [...] for compound)
 * - static readonly parent = 'parentAlias'  (or 'root' for #1)
 */
export class PrototypeOrchestrator {
  constructor(private manager: ObjectManager) {}

  /**
   * Build all prototype objects
   * Idempotent - checks for existing aliases before creating
   */
  async buildPrototypes(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) {
      throw new Error('Root object not found - run minimal bootstrap first');
    }

    const existingAliases =
      (objectManager.get('aliases') as Record<string, number | Record<string, number>>) || {};

    const builders = this.discoverBuilders();
    const sorted = this.topoSort(builders);
    const aliases: Record<string, number> = {};

    // Copy existing scalar aliases to our working map
    for (const [key, value] of Object.entries(existingAliases)) {
      if (typeof value === 'number') {
        aliases[key] = value;
      }
    }

    console.log(`🔧 Building ${sorted.length} prototypes...`);

    for (const BuilderClass of sorted) {
      const parentAlias = BuilderClass.parent;
      const parentId = parentAlias === 'root' ? 1 : aliases[parentAlias];

      if (parentId === undefined) {
        throw new Error(
          `Parent '${parentAlias}' not found for '${isSingleBuilder(BuilderClass) ? BuilderClass.alias : BuilderClass.aliases.join(', ')}'`
        );
      }

      if (isCompoundBuilder(BuilderClass)) {
        // Compound builder - creates multiple prototypes
        const firstAlias = BuilderClass.aliases[0];
        if (aliases[firstAlias]) {
          // Already exists - load all
          for (const alias of BuilderClass.aliases) {
            if (existingAliases[alias]) {
              aliases[alias] = existingAliases[alias] as number;
            }
          }
          continue;
        }

        const builder = new BuilderClass(this.manager);
        const results = await builder.buildAll(parentId);
        for (const [name, obj] of Object.entries(results)) {
          aliases[name] = obj.id;
        }
        console.log(`  ✓ ${BuilderClass.aliases.length} ${parentAlias} subtypes`);
      } else {
        // Single builder
        if (aliases[BuilderClass.alias]) {
          continue; // Already exists
        }

        const builder = new BuilderClass(this.manager);
        const obj = await builder.build(parentId);
        aliases[BuilderClass.alias] = obj.id;
      }
    }

    // Handle CashBuilder specially (not in prototypes folder)
    if (!aliases.cash) {
      const cashBuilder = new CashBuilder(this.manager);
      const cash = await cashBuilder.build();
      aliases.cash = cash.id;
    }

    await this.registerAllAliases(aliases, objectManager);
    console.log(`✅ Registered ${Object.keys(aliases).length} prototype aliases`);
  }

  /**
   * Rebuild methods on existing prototypes
   * Called when FORCE_BOOTSTRAP=true to update methods without recreating objects
   */
  async rebuildMethods(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) {
      throw new Error('Root object not found');
    }

    const aliases =
      (objectManager.get('aliases') as Record<string, number | Record<string, number>>) || {};

    const builders = this.discoverBuilders();
    console.log('🔧 Rebuilding prototype methods...');

    for (const BuilderClass of builders) {
      if (isCompoundBuilder(BuilderClass)) {
        // Compound builders don't support rebuild (they use buildAll)
        continue;
      }

      const existingId = aliases[BuilderClass.alias];
      if (typeof existingId !== 'number') continue;

      const existing = await this.manager.load(existingId);
      if (!existing) continue;

      const builder = new BuilderClass(this.manager);
      await builder.build(0, existing); // parentId unused when existingObj provided
    }

    console.log('  ✅ Prototype methods rebuilt');
  }

  /**
   * Discover all builders from the barrel export
   */
  private discoverBuilders(): PrototypeBuilder[] {
    const results: PrototypeBuilder[] = [];

    for (const exp of Object.values(Builders)) {
      if (typeof exp !== 'function') continue;

      // Check for single builder (alias + parent)
      if ('alias' in exp && 'parent' in exp) {
        results.push(exp as SinglePrototypeBuilder);
      }
      // Check for compound builder (aliases + parent)
      else if ('aliases' in exp && 'parent' in exp) {
        results.push(exp as CompoundPrototypeBuilder);
      }
    }

    return results;
  }

  /**
   * Topologically sort builders by parent dependency
   */
  private topoSort(builders: PrototypeBuilder[]): PrototypeBuilder[] {
    // Map alias -> builder (for single builders only, compound use first alias)
    const byAlias = new Map<string, PrototypeBuilder>();
    for (const b of builders) {
      if (isSingleBuilder(b)) {
        byAlias.set(b.alias, b);
      } else {
        // For compound, register under first alias
        byAlias.set(b.aliases[0], b);
      }
    }

    const sorted: PrototypeBuilder[] = [];
    const visited = new Set<string>();

    const visit = (alias: string) => {
      if (visited.has(alias)) return;
      visited.add(alias);

      const builder = byAlias.get(alias);
      if (!builder) return; // 'root' or external dependency

      // Visit parent first
      if (builder.parent !== 'root') {
        visit(builder.parent);
      }

      sorted.push(builder);
    };

    for (const builder of builders) {
      const key = isSingleBuilder(builder) ? builder.alias : builder.aliases[0];
      visit(key);
    }

    return sorted;
  }

  /**
   * Register all aliases in #0.properties.aliases
   */
  private async registerAllAliases(
    aliases: Record<string, number>,
    objectManager: RuntimeObject
  ): Promise<void> {
    const existing =
      (objectManager.get('aliases') as Record<string, number | Record<string, number>>) || {};

    // Merge scalar aliases
    for (const [key, value] of Object.entries(aliases)) {
      existing[key] = value;
    }

    objectManager.set('aliases', existing);
  }
}
