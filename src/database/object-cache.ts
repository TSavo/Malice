/**
 * Object caching for ObjectManager
 *
 * Design Philosophy:
 * - Cache everything in memory using a high-performance array (O(1) access)
 * - Stable Proxy Pattern: References stay constant, never evicted
 * - Single Source of Truth: In-memory state is the authoritative record
 * - Async Persistence: Changes pushed to MongoDB in background
 * - Full Warmup: Complete database loaded into memory at startup
 *
 * This is designed for a MOO where:
 * - Object count is manageable (thousands to tens of thousands)
 * - Read:Write ratio is heavily skewed toward reads
 * - Single-server architecture eliminates sync overhead
 * - Zero-latency access is critical (no DB hits after warmup)
 */

import type { ObjId, RuntimeObject } from '../../types/object';

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
  parents: number[]; // Ordered from immediate parent to root (always numeric for objects)
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
 * In-memory state is the single source of truth.
 */
export class ObjectCache {
  // Primary object cache - stores proxies indexed by positive ObjId
  private objects: RuntimeObject[] = [];

  // Infrastructure objects cache (for negative IDs like #-1)
  private infrastructureObjects = new Map<number, RuntimeObject>();

  // Compiled method cache - key: "objId:methodName"
  private compiledMethods = new Map<string, string>();

  // Parent chain cache for fast inheritance lookups (objects only, by numeric ID)
  private parentChains = new Map<number, ParentChain>();

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
   * Get object from cache (objects only, by numeric ID)
   * For types, use ObjectManager.getTypeSync() instead
   */
  getObject(id: number): RuntimeObject | undefined {
    const obj = id >= 0 ? this.objects[id] : this.infrastructureObjects.get(id);
    if (obj) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }
    return obj;
  }

  /**
   * Store object in cache (never evicts)
   * For types, use ObjectManager.typeCache instead
   */
  setObject(id: number, obj: RuntimeObject): void {
    if (id >= 0) {
      if (this.objects[id] === undefined) {
        this.stats.objectsCached++;
      }
      this.objects[id] = obj;
    } else {
      if (!this.infrastructureObjects.has(id)) {
        this.stats.objectsCached++;
      }
      this.infrastructureObjects.set(id, obj);
    }
  }

  /**
   * Check if object is cached
   */
  hasObject(id: number): boolean {
    return id >= 0
      ? this.objects[id] !== undefined
      : this.infrastructureObjects.has(id);
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
  setCompiledMethod(
    objId: ObjId,
    methodName: string,
    compiledCode: string,
  ): void {
    const key = `${objId}:${methodName}`;
    if (!this.compiledMethods.has(key)) {
      this.stats.methodCompilationsCached++;
    }
    this.compiledMethods.set(key, compiledCode);
  }

  /**
   * Invalidate a specific compiled method
   */
  invalidateCompiledMethod(objId: ObjId, methodName: string): void {
    const key = `${objId}:${methodName}`;
    if (this.compiledMethods.has(key)) {
      this.compiledMethods.delete(key);
      this.stats.methodCompilationsCached--;
    }
  }

  /**
   * Get cached parent chain (objects only)
   */
  getParentChain(objId: number): ParentChain | undefined {
    const chain = this.parentChains.get(objId);
    if (chain) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }
    return chain;
  }

  /**
   * Store parent chain (never evicts, objects only)
   */
  setParentChain(objId: number, parents: number[]): void {
    if (!this.parentChains.has(objId)) {
      this.stats.parentChainsCached++;
    }
    this.parentChains.set(objId, {
      parents,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate transient caches for an object
   * Does NOT remove the object proxy (Stable Proxy Pattern)
   */
  invalidate(objId: number): void {
    this.stats.invalidations++;

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
    return this.stats.objectsCached;
  }

  /**
   * Mark object as preloaded (for stats)
   */
  markPreloaded(): void {
    this.stats.preloadedObjects++;
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
    for (const obj of this.objects) {
      if (obj !== undefined) yield obj;
    }
    for (const obj of this.infrastructureObjects.values()) {
      yield obj;
    }
  }

  /**
   * Get a cached object directly (objects only, by numeric ID)
   */
  get(id: number): RuntimeObject | undefined {
    return this.getObject(id);
  }

  /**
   * Set a cached object directly (objects only, by numeric ID)
   */
  set(id: number, obj: RuntimeObject): void {
    this.setObject(id, obj);
  }

  /**
   * Get all object IDs in the cache
   */
  getAllIds(): number[] {
    const ids: number[] = [];
    for (let i = 0; i < this.objects.length; i++) {
      if (this.objects[i] !== undefined) {
        ids.push(i);
      }
    }
    for (const id of this.infrastructureObjects.keys()) {
      ids.push(id);
    }
    return ids;
  }
}
