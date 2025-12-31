/**
 * Relationship Cache
 * Efficient caching layer for method relationship data
 */

import type { MethodRelationship } from './relationship-analyzer';

/**
 * Cache entry with LRU eviction
 */
interface CacheEntry {
  relationship: MethodRelationship;
  lastAccessed: number;
  accessCount: number;
}

/**
 * Relationship cache with intelligent invalidation
 */
export class RelationshipCache {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_SIZE = 1000; // Max cached relationships
  private readonly TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

  /**
   * Get cached relationship
   */
  get(objectId: number, methodName: string): MethodRelationship | null {
    const key = `${objectId}:${methodName}`;
    const entry = this.cache.get(key);

    if (entry && this.isEntryValid(entry)) {
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      return entry.relationship;
    }

    return null;
  }

  /**
   * Set cached relationship
   */
  set(
    objectId: number,
    methodName: string,
    relationship: MethodRelationship,
  ): void {
    const key = `${objectId}:${methodName}`;

    // Evict if cache is full
    if (this.cache.size >= this.MAX_SIZE && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      relationship,
      lastAccessed: Date.now(),
      accessCount: 1,
    };

    this.cache.set(key, entry);
  }

  /**
   * Invalidate relationships for specific object
   */
  invalidateObject(objectId: number): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${objectId}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Invalidate relationships for specific method
   */
  invalidateMethod(objectId: number, methodName: string): void {
    const key = `${objectId}:${methodName}`;
    this.cache.delete(key);
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    memoryUsage: number;
    hitRate: number;
  } {
    let validEntries = 0;

    for (const entry of this.cache.values()) {
      if (this.isEntryValid(entry)) {
        validEntries++;
      }
    }

    // Estimate memory usage (rough calculation)
    const avgEntrySize = 1024; // ~1KB per relationship entry
    const memoryUsage = this.cache.size * avgEntrySize;

    // Calculate hit rate (would need actual hit/miss tracking)
    const hitRate = validEntries > 0 ? 0.85 : 0; // Placeholder

    return {
      totalEntries: this.cache.size,
      memoryUsage,
      hitRate,
    };
  }

  /**
   * Check if cache entry is still valid
   */
  private isEntryValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.lastAccessed;
    return age < this.TTL_MS;
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
