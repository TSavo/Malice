/**
 * builder-registry.ts - Self-registration system for bootstrap builders
 *
 * Each builder declares:
 *   - static provides: string[] - aliases this builder creates
 *   - static depends: string[] - aliases this builder needs
 *
 * Builders self-register at module load time. The registry performs
 * topological sort to determine build order based on dependencies.
 *
 * Usage in a builder:
 *   class MyBuilder implements Builder {
 *     static provides = ['myAlias'];
 *     static depends = ['otherAlias'];
 *     // ...
 *   }
 *   registerBuilder(MyBuilder);
 */

import type { ObjectManager } from '../object-manager';

/**
 * Instance interface - what a builder instance must implement
 */
export interface Builder {
  /** Create the MOO type or load existing */
  build(): Promise<void>;

  /** Register alias(es) for the created object(s) - types auto-alias */
  registerAliases(): Promise<void>;

  /** Optional: called after ALL aliases are registered */
  postRegister?(): Promise<void>;
}

/**
 * Static interface - what a builder class must have
 */
export interface BuilderClass {
  new (manager: ObjectManager): Builder;

  /** Aliases this builder provides (creates) */
  provides: string[];

  /** Aliases this builder depends on (needs before build) */
  depends?: string[];
}

// Global registry
const builders: BuilderClass[] = [];

/**
 * Register a builder class. Called at module load time.
 */
export function registerBuilder(builder: BuilderClass): void {
  builders.push(builder);
}

/**
 * Get all registered builders (unsorted).
 */
export function getBuilders(): BuilderClass[] {
  return [...builders];
}

/**
 * Clear the registry (for testing).
 */
export function clearBuilders(): void {
  builders.length = 0;
}

/**
 * Topologically sort builders by their dependencies.
 * Returns builders in an order where each builder's dependencies
 * are built before it.
 *
 * Uses Kahn's algorithm.
 *
 * @throws Error if circular dependency detected
 */
export function topologicalSort(builderList: BuilderClass[]): BuilderClass[] {
  // Build provides map: alias -> builder that provides it
  const providerMap = new Map<string, BuilderClass>();
  for (const B of builderList) {
    for (const alias of B.provides) {
      if (providerMap.has(alias)) {
        const existing = providerMap.get(alias)!;
        throw new Error(
          `Duplicate provider for alias '${alias}': ${existing.name} and ${B.name}`,
        );
      }
      providerMap.set(alias, B);
    }
  }

  // Build dependency graph
  // inDegree: how many unbuilt dependencies each builder has
  // graph: builder -> list of builders that depend on it
  const inDegree = new Map<BuilderClass, number>();
  const graph = new Map<BuilderClass, BuilderClass[]>();

  for (const B of builderList) {
    inDegree.set(B, 0);
    graph.set(B, []);
  }

  // For each builder, add edges from its dependencies to it
  for (const B of builderList) {
    const deps = B.depends ?? [];
    for (const dep of deps) {
      const provider = providerMap.get(dep);
      if (provider) {
        // provider must be built before B
        graph.get(provider)!.push(B);
        inDegree.set(B, inDegree.get(B)! + 1);
      }
      // If no provider found, it's an external dependency (e.g., from prototypes)
      // We don't error - the dependency might be provided by MinimalBootstrap or PrototypeOrchestrator
    }
  }

  // Kahn's algorithm: start with builders that have no dependencies
  const queue = builderList.filter((B) => inDegree.get(B) === 0);
  const result: BuilderClass[] = [];

  while (queue.length > 0) {
    const B = queue.shift()!;
    result.push(B);

    // For each builder that depends on B, decrement its in-degree
    for (const dependent of graph.get(B)!) {
      const newDegree = inDegree.get(dependent)! - 1;
      inDegree.set(dependent, newDegree);

      // If all dependencies satisfied, add to queue
      if (newDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  // If we didn't process all builders, there's a cycle
  if (result.length !== builderList.length) {
    // Find the cycle for a helpful error message
    const remaining = builderList.filter((B) => !result.includes(B));
    const names = remaining.map((B) => B.name).join(', ');
    throw new Error(`Circular dependency detected among builders: ${names}`);
  }

  return result;
}

/**
 * Get builders sorted by dependency order.
 */
export function getSortedBuilders(): BuilderClass[] {
  return topologicalSort(getBuilders());
}

/**
 * Run all registered builders in dependency order.
 * This is the main entry point for bootstrap.
 *
 * Types are idempotent - if they exist, they're reused.
 * Methods are always rebuilt to ensure they're up to date.
 *
 * @param manager - The ObjectManager instance
 */
export async function runBuilders(manager: ObjectManager): Promise<void> {
  // Import all builders to trigger self-registration
  await import('./all-builders');
  const { AliasLoader } = await import('./alias-loader');
  const aliasLoader = new AliasLoader(manager);

  const sorted = getSortedBuilders();
  console.log(`[BuilderRegistry] Running ${sorted.length} builders...`);

  // Build types + register aliases, reload after each so next builder can use $.alias
  const instances: Builder[] = [];
  for (const BuilderClass of sorted) {
    const builder = new BuilderClass(manager);
    await builder.build();
    await builder.registerAliases();
    instances.push(builder);
    // Reload aliases into memory so next builder can access them via $.alias
    await aliasLoader.loadAliases();
  }

  // Phase 2: Post-registration hooks (optional)
  // Run after ALL builds complete so cross-references work
  // Reuse instances - don't call build() again!
  for (const builder of instances) {
    if (builder.postRegister) {
      await builder.postRegister();
    }
  }

  console.log(`[BuilderRegistry] ✅ Completed ${sorted.length} builders`);
}
