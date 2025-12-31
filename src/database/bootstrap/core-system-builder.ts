import type { ObjectManager } from '../object-manager';
import { getBuilders, topologicalSort, type Builder } from './builder-registry';

// Import barrel file to trigger all builder self-registrations
import './all-builders.js';

// ClientBuilder is a composite builder, handled separately
import { ClientBuilder } from './client/index';

/**
 * Orchestrates building all core system objects
 *
 * Uses the builder registry pattern:
 * 1. Import all-builders.ts triggers self-registration of all builders
 * 2. Topological sort orders builders by dependencies
 * 3. Build each in order, registering aliases immediately
 * 4. Call postRegister hooks after all aliases exist
 */
export class CoreSystemBuilder {
  constructor(private manager: ObjectManager) {}

  /**
   * Build all core system objects
   */
  async buildCoreSystems(): Promise<void> {
    // Get all registered builders and sort by dependencies
    const allBuilders = getBuilders();
    const sorted = topologicalSort(allBuilders);

    console.log(`[CoreSystemBuilder] Building ${sorted.length} systems...`);

    // Build each in order, registering aliases immediately
    const instances: Builder[] = [];
    for (const BuilderClass of sorted) {
      const builder = new BuilderClass(this.manager);
      await builder.build();
      await builder.registerAliases();
      instances.push(builder);
    }

    // Build client JS modules (composite builder, not in registry)
    const clientBuilder = new ClientBuilder(this.manager);
    await clientBuilder.build();

    // Post-register hooks (all builders, after all aliases exist)
    for (const builder of instances) {
      if (builder.postRegister) {
        await builder.postRegister();
      }
    }

    console.log(`[CoreSystemBuilder] ✅ ${sorted.length} systems built`);
  }

  /**
   * Rebuild methods on existing core system objects
   * Called when FORCE_BOOTSTRAP=true to update methods without recreating objects
   */
  async rebuildMethods(): Promise<void> {
    // Get all registered builders and sort by dependencies
    const allBuilders = getBuilders();
    const sorted = topologicalSort(allBuilders);

    console.log(`[CoreSystemBuilder] Rebuilding methods for ${sorted.length} systems...`);

    // Rebuild each in order
    for (const BuilderClass of sorted) {
      const builder = new BuilderClass(this.manager);

      // Use rebuildMethods if available, otherwise build(true)
      if (builder.rebuildMethods) {
        await builder.rebuildMethods();
      } else {
        await builder.build(true);
      }

      await builder.registerAliases();
    }

    // Rebuild client JS modules
    const clientBuilder = new ClientBuilder(this.manager);
    await clientBuilder.build(true);

    console.log('  ✅ Core system methods rebuilt');
  }
}
