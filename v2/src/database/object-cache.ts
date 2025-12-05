/**
 * Object caching for ObjectManager
 *
 * Design Philosophy:
 * - Cache everything in memory, never evict
 * - Rely 100% on MongoDB change streams for invalidation
 * - Cache compiled TypeScript → JavaScript for methods
 * - Cache inheritance chain lookups
 * - Preload critical objects (prototypes, system objects)
 *
 * This is designed for a MOO where:
 * - Object count is manageable (thousands to tens of thousands)
 * - Read:Write ratio is heavily skewed toward reads
 * - Multiple game servers share a single MongoDB instance
 * - Low-latency access is critical (no DB hits after warmup)
 */

import type { ObjId, RuntimeObject } from '../../types/object.js';

export interface CacheStats {
  objectsCached: number;
  methodCompilationsCached: number;
  parentChainsCached: number;
  cacheHits: number;
  cacheMisses: number;
  invalidations: number;
  preloadedObjects: number;
}

export interface ParentChain {
  parents: ObjId[]; // Ordered from immediate parent to root
  timestamp: number;
}

/**
 * Caching layer for ObjectManager
 *
 * Caches:
 * 1. RuntimeObjects (proxies) - Never evicted
 * 2. Compiled method code - Never evicted
 * 3. Parent chains for inheritance - Never evicted
 *
 * All caches are invalidated via MongoDB change streams
 */
export class ObjectCache {
  // Primary object cache - stores proxies
  private objects = new Map<ObjId, RuntimeObject>();

  // Compiled method cache - key: "objId:methodName"
  private compiledMethods = new Map<string, string>();

  // Parent chain cache for fast inheritance lookups
  private parentChains = new Map<ObjId, ParentChain>();

  // Statistics
  private stats: CacheStats = {
    objectsCached: 0,
    methodCompilationsCached: 0,
    parentChainsCached: 0,
    cacheHits: 0,
    cacheMisses: 0,
    invalidations: 0,
    preloadedObjects: 0,
  };

  /**
   * Get object from cache
   */
  getObject(id: ObjId): RuntimeObject | undefined {
    const obj = this.objects.get(id);
    if (obj) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }
    return obj;
  }

  /**
   * Store object in cache (never evicts)
   */
  setObject(id: ObjId, obj: RuntimeObject): void {
    if (!this.objects.has(id)) {
      this.stats.objectsCached++;
    }
    this.objects.set(id, obj);
  }

  /**
   * Check if object is cached
   */
  hasObject(id: ObjId): boolean {
    return this.objects.has(id);
  }

  /**
   * Get compiled method code
   */
  getCompiledMethod(objId: ObjId, methodName: string): string | undefined {
    const key = `${objId}:${methodName}`;
    const code = this.compiledMethods.get(key);
    if (code) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }
    return code;
  }

  /**
   * Store compiled method code (never evicts)
   */
  setCompiledMethod(objId: ObjId, methodName: string, compiledCode: string): void {
    const key = `${objId}:${methodName}`;
    if (!this.compiledMethods.has(key)) {
      this.stats.methodCompilationsCached++;
    }
    this.compiledMethods.set(key, compiledCode);
  }

  /**
   * Get cached parent chain
   */
  getParentChain(objId: ObjId): ParentChain | undefined {
    const chain = this.parentChains.get(objId);
    if (chain) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }
    return chain;
  }

  /**
   * Store parent chain (never evicts)
   */
  setParentChain(objId: ObjId, parents: ObjId[]): void {
    if (!this.parentChains.has(objId)) {
      this.stats.parentChainsCached++;
    }
    this.parentChains.set(objId, {
      parents,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate all caches for an object
   * Called when MongoDB change stream detects a modification
   */
  invalidate(objId: ObjId): void {
    this.stats.invalidations++;

    // Remove object from cache
    this.objects.delete(objId);

    // Remove all compiled methods for this object
    const methodPrefix = `${objId}:`;
    for (const key of this.compiledMethods.keys()) {
      if (key.startsWith(methodPrefix)) {
        this.compiledMethods.delete(key);
      }
    }

    // Remove parent chain
    this.parentChains.delete(objId);

    // Also invalidate any objects that have this object in their parent chain
    // (because if a parent changes, child inheritance lookups are stale)
    for (const [childId, chain] of this.parentChains.entries()) {
      if (chain.parents.includes(objId)) {
        this.parentChains.delete(childId);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache size (number of objects)
   */
  size(): number {
    return this.objects.size;
  }

  /**
   * Mark object as preloaded (for stats)
   */
  markPreloaded(): void {
    this.stats.preloadedObjects++;
  }

  /**
   * Clear all caches (for testing)
   */
  clear(): void {
    this.objects.clear();
    this.compiledMethods.clear();
    this.parentChains.clear();
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return total === 0 ? 0 : this.stats.cacheHits / total;
  }

  /**
   * Iterate over all cached objects
   */
  *values(): IterableIterator<RuntimeObject> {
    yield* this.objects.values();
  }

  /**
   * Get a cached object directly (used by getChildren)
   */
  get(id: ObjId): RuntimeObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Set a cached object directly (used by getChildren)
   */
  set(id: ObjId, obj: RuntimeObject): void {
    this.setObject(id, obj);
  }
}
