import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectCache } from '../src/database/object-cache.js';
import type { RuntimeObject } from '../types/object.js';

describe('ObjectCache', () => {
  let cache: ObjectCache;

  beforeEach(() => {
    cache = new ObjectCache();
  });

  describe('Object Caching', () => {
    it('should cache and retrieve objects', () => {
      const mockObj = { id: 1 } as RuntimeObject;

      cache.setObject(1, mockObj);

      expect(cache.hasObject(1)).toBe(true);
      expect(cache.getObject(1)).toBe(mockObj);
      expect(cache.size()).toBe(1);
    });

    it('should return undefined for uncached objects', () => {
      expect(cache.hasObject(999)).toBe(false);
      expect(cache.getObject(999)).toBeUndefined();
    });

    it('should never evict objects', () => {
      // Cache 1000 objects
      for (let i = 0; i < 1000; i++) {
        cache.setObject(i, { id: i } as RuntimeObject);
      }

      expect(cache.size()).toBe(1000);

      // Verify all are still cached
      for (let i = 0; i < 1000; i++) {
        expect(cache.hasObject(i)).toBe(true);
      }
    });
  });

  describe('Compiled Method Caching', () => {
    it('should cache and retrieve compiled methods', () => {
      const compiledCode = 'console.log("compiled");';

      cache.setCompiledMethod(1, 'greet', compiledCode);

      expect(cache.getCompiledMethod(1, 'greet')).toBe(compiledCode);
    });

    it('should return undefined for uncached methods', () => {
      expect(cache.getCompiledMethod(999, 'unknown')).toBeUndefined();
    });

    it('should cache multiple methods for same object', () => {
      cache.setCompiledMethod(1, 'greet', 'code1');
      cache.setCompiledMethod(1, 'farewell', 'code2');
      cache.setCompiledMethod(1, 'emote', 'code3');

      expect(cache.getCompiledMethod(1, 'greet')).toBe('code1');
      expect(cache.getCompiledMethod(1, 'farewell')).toBe('code2');
      expect(cache.getCompiledMethod(1, 'emote')).toBe('code3');
    });
  });

  describe('Parent Chain Caching', () => {
    it('should cache and retrieve parent chains', () => {
      const parents = [2, 3, 4, 1]; // Chain: 5 -> 2 -> 3 -> 4 -> 1

      cache.setParentChain(5, parents);

      const chain = cache.getParentChain(5);
      expect(chain).toBeDefined();
      expect(chain!.parents).toEqual(parents);
    });

    it('should return undefined for uncached chains', () => {
      expect(cache.getParentChain(999)).toBeUndefined();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate object cache', () => {
      const mockObj = { id: 1 } as RuntimeObject;
      cache.setObject(1, mockObj);

      expect(cache.hasObject(1)).toBe(true);

      cache.invalidate(1);

      expect(cache.hasObject(1)).toBe(false);
    });

    it('should invalidate all compiled methods for object', () => {
      cache.setCompiledMethod(1, 'greet', 'code1');
      cache.setCompiledMethod(1, 'farewell', 'code2');
      cache.setCompiledMethod(1, 'emote', 'code3');

      cache.invalidate(1);

      expect(cache.getCompiledMethod(1, 'greet')).toBeUndefined();
      expect(cache.getCompiledMethod(1, 'farewell')).toBeUndefined();
      expect(cache.getCompiledMethod(1, 'emote')).toBeUndefined();
    });

    it('should invalidate parent chain', () => {
      cache.setParentChain(5, [2, 3, 4, 1]);

      cache.invalidate(5);

      expect(cache.getParentChain(5)).toBeUndefined();
    });

    it('should invalidate child parent chains when parent changes', () => {
      // Set up parent chains:
      // Object 5 inherits from: 3 -> 2 -> 1
      // Object 6 inherits from: 4 -> 3 -> 2 -> 1
      // Object 7 inherits from: 1
      cache.setParentChain(5, [3, 2, 1]);
      cache.setParentChain(6, [4, 3, 2, 1]);
      cache.setParentChain(7, [1]);

      // Invalidate object #3 (appears in chains for 5 and 6)
      cache.invalidate(3);

      // Chains that included #3 should be invalidated
      expect(cache.getParentChain(5)).toBeUndefined();
      expect(cache.getParentChain(6)).toBeUndefined();

      // Chain that didn't include #3 should remain
      expect(cache.getParentChain(7)).toBeDefined();
    });

    it('should not affect other objects when invalidating', () => {
      cache.setObject(1, { id: 1 } as RuntimeObject);
      cache.setObject(2, { id: 2 } as RuntimeObject);
      cache.setCompiledMethod(1, 'greet', 'code1');
      cache.setCompiledMethod(2, 'greet', 'code2');

      cache.invalidate(1);

      // Object 1 invalidated
      expect(cache.hasObject(1)).toBe(false);
      expect(cache.getCompiledMethod(1, 'greet')).toBeUndefined();

      // Object 2 still cached
      expect(cache.hasObject(2)).toBe(true);
      expect(cache.getCompiledMethod(2, 'greet')).toBe('code2');
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', () => {
      cache.setObject(1, { id: 1 } as RuntimeObject);

      // Cache hit
      cache.getObject(1);

      // Cache miss
      cache.getObject(999);

      const stats = cache.getStats();
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
    });

    it('should track objects cached', () => {
      cache.setObject(1, { id: 1 } as RuntimeObject);
      cache.setObject(2, { id: 2 } as RuntimeObject);

      const stats = cache.getStats();
      expect(stats.objectsCached).toBe(2);
    });

    it('should track method compilations cached', () => {
      cache.setCompiledMethod(1, 'greet', 'code1');
      cache.setCompiledMethod(1, 'farewell', 'code2');

      const stats = cache.getStats();
      expect(stats.methodCompilationsCached).toBe(2);
    });

    it('should track parent chains cached', () => {
      cache.setParentChain(1, [2, 3]);
      cache.setParentChain(2, [3]);

      const stats = cache.getStats();
      expect(stats.parentChainsCached).toBe(2);
    });

    it('should track invalidations', () => {
      cache.setObject(1, { id: 1 } as RuntimeObject);
      cache.setObject(2, { id: 2 } as RuntimeObject);

      cache.invalidate(1);
      cache.invalidate(2);

      const stats = cache.getStats();
      expect(stats.invalidations).toBe(2);
    });

    it('should calculate cache hit rate', () => {
      cache.setObject(1, { id: 1 } as RuntimeObject);

      // 3 hits, 2 misses = 60% hit rate
      cache.getObject(1);
      cache.getObject(1);
      cache.getObject(1);
      cache.getObject(999);
      cache.getObject(998);

      expect(cache.getHitRate()).toBe(0.6);
    });

    it('should return 0 hit rate when no accesses', () => {
      expect(cache.getHitRate()).toBe(0);
    });

    it('should track preloaded objects', () => {
      cache.markPreloaded();
      cache.markPreloaded();
      cache.markPreloaded();

      const stats = cache.getStats();
      expect(stats.preloadedObjects).toBe(3);
    });
  });

  describe('Cache Clear', () => {
    it('should clear all caches', () => {
      cache.setObject(1, { id: 1 } as RuntimeObject);
      cache.setCompiledMethod(1, 'greet', 'code1');
      cache.setParentChain(1, [2, 3]);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.getObject(1)).toBeUndefined();
      expect(cache.getCompiledMethod(1, 'greet')).toBeUndefined();
      expect(cache.getParentChain(1)).toBeUndefined();
    });
  });
});
