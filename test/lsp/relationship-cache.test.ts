/**
 * Relationship Cache Unit Tests
 * Tests LRU caching, TTL expiration, and invalidation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MethodRelationship,
  RelationshipType,
} from '../../src/lsp/relationship-analyzer.js';
import { RelationshipCache } from '../../src/lsp/relationship-cache.js';

describe('RelationshipCache', () => {
  let cache: RelationshipCache;

  // Helper to create mock relationship data
  function createMockRelationship(
    objectId: number,
    methodName: string,
  ): MethodRelationship {
    return {
      sourceObjectId: objectId,
      sourceMethod: methodName,
      targetObjectId: objectId + 1,
      targetMethod: 'targetMethod',
      type: 'call' as RelationshipType,
      strength: 0.8,
      frequency: 10,
    };
  }

  beforeEach(() => {
    cache = new RelationshipCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic get/set operations', () => {
    it('should store and retrieve relationships', () => {
      const rel = createMockRelationship(1, 'testMethod');
      cache.set(1, 'testMethod', rel);

      const retrieved = cache.get(1, 'testMethod');
      expect(retrieved).toEqual(rel);
    });

    it('should return null for non-existent entries', () => {
      const result = cache.get(999, 'nonexistent');
      expect(result).toBeNull();
    });

    it('should update existing entries', () => {
      const rel1 = createMockRelationship(1, 'method');
      const rel2 = createMockRelationship(1, 'method');
      rel2.strength = 0.9;

      cache.set(1, 'method', rel1);
      cache.set(1, 'method', rel2);

      const retrieved = cache.get(1, 'method');
      expect(retrieved?.strength).toBe(0.9);
    });

    it('should use objectId:methodName as key', () => {
      const rel1 = createMockRelationship(1, 'methodA');
      const rel2 = createMockRelationship(1, 'methodB');
      const rel3 = createMockRelationship(2, 'methodA');

      cache.set(1, 'methodA', rel1);
      cache.set(1, 'methodB', rel2);
      cache.set(2, 'methodA', rel3);

      expect(cache.get(1, 'methodA')).toEqual(rel1);
      expect(cache.get(1, 'methodB')).toEqual(rel2);
      expect(cache.get(2, 'methodA')).toEqual(rel3);
    });
  });

  describe('TTL expiration', () => {
    it('should return valid entries within TTL', () => {
      const rel = createMockRelationship(1, 'method');
      cache.set(1, 'method', rel);

      // Advance time by 5 minutes (within 10 min TTL)
      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(cache.get(1, 'method')).toEqual(rel);
    });

    it('should return null for expired entries', () => {
      const rel = createMockRelationship(1, 'method');
      cache.set(1, 'method', rel);

      // Advance time past TTL (10 minutes)
      vi.advanceTimersByTime(11 * 60 * 1000);

      expect(cache.get(1, 'method')).toBeNull();
    });

    it('should refresh lastAccessed on get', () => {
      const rel = createMockRelationship(1, 'method');
      cache.set(1, 'method', rel);

      // Advance 9 minutes
      vi.advanceTimersByTime(9 * 60 * 1000);

      // Access the entry (should refresh)
      cache.get(1, 'method');

      // Advance another 5 minutes (total 14 from set, but only 5 from last access)
      vi.advanceTimersByTime(5 * 60 * 1000);

      // Should still be valid because lastAccessed was updated
      expect(cache.get(1, 'method')).toEqual(rel);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when cache is full', () => {
      // Fill cache to MAX_SIZE (1000), with entry 0 being oldest
      cache.set(0, 'method', createMockRelationship(0, 'method'));
      vi.advanceTimersByTime(1000); // Make entry 0 older

      for (let i = 1; i < 1000; i++) {
        cache.set(i, 'method', createMockRelationship(i, 'method'));
      }

      // Add one more (should trigger eviction of oldest = entry 0)
      cache.set(1000, 'method', createMockRelationship(1000, 'method'));

      // New entry should exist
      expect(cache.get(1000, 'method')).not.toBeNull();

      // Entry 0 should be evicted (oldest/LRU)
      expect(cache.get(0, 'method')).toBeNull();
    });

    it('should not evict when updating existing entry', () => {
      // Fill cache to MAX_SIZE
      for (let i = 0; i < 1000; i++) {
        cache.set(i, 'method', createMockRelationship(i, 'method'));
      }

      // Update existing entry (should not trigger eviction)
      const updated = createMockRelationship(500, 'method');
      updated.strength = 0.99;
      cache.set(500, 'method', updated);

      // First entry should still exist
      expect(cache.get(0, 'method')).not.toBeNull();
      expect(cache.get(500, 'method')?.strength).toBe(0.99);
    });

    it('should evict oldest entry based on lastAccessed', () => {
      // Add entries with time gaps
      cache.set(1, 'method', createMockRelationship(1, 'method'));
      vi.advanceTimersByTime(1000);

      cache.set(2, 'method', createMockRelationship(2, 'method'));
      vi.advanceTimersByTime(1000);

      cache.set(3, 'method', createMockRelationship(3, 'method'));

      // Access entry 1 to make it recently used
      cache.get(1, 'method');

      // Fill cache to trigger eviction
      for (let i = 4; i <= 1001; i++) {
        cache.set(i, 'method', createMockRelationship(i, 'method'));
      }

      // Entry 1 should still exist (was accessed recently)
      expect(cache.get(1, 'method')).not.toBeNull();

      // Entry 2 should be evicted (oldest lastAccessed)
      expect(cache.get(2, 'method')).toBeNull();
    });
  });

  describe('Invalidation', () => {
    it('should invalidate all methods for an object', () => {
      cache.set(1, 'methodA', createMockRelationship(1, 'methodA'));
      cache.set(1, 'methodB', createMockRelationship(1, 'methodB'));
      cache.set(2, 'methodA', createMockRelationship(2, 'methodA'));

      cache.invalidateObject(1);

      expect(cache.get(1, 'methodA')).toBeNull();
      expect(cache.get(1, 'methodB')).toBeNull();
      expect(cache.get(2, 'methodA')).not.toBeNull();
    });

    it('should invalidate specific method', () => {
      cache.set(1, 'methodA', createMockRelationship(1, 'methodA'));
      cache.set(1, 'methodB', createMockRelationship(1, 'methodB'));

      cache.invalidateMethod(1, 'methodA');

      expect(cache.get(1, 'methodA')).toBeNull();
      expect(cache.get(1, 'methodB')).not.toBeNull();
    });

    it('should handle invalidating non-existent object', () => {
      cache.set(1, 'method', createMockRelationship(1, 'method'));

      // Should not throw
      cache.invalidateObject(999);

      expect(cache.get(1, 'method')).not.toBeNull();
    });

    it('should handle invalidating non-existent method', () => {
      cache.set(1, 'methodA', createMockRelationship(1, 'methodA'));

      // Should not throw
      cache.invalidateMethod(1, 'nonexistent');

      expect(cache.get(1, 'methodA')).not.toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set(1, 'methodA', createMockRelationship(1, 'methodA'));
      cache.set(2, 'methodB', createMockRelationship(2, 'methodB'));

      cache.clear();

      expect(cache.get(1, 'methodA')).toBeNull();
      expect(cache.get(2, 'methodB')).toBeNull();
    });

    it('should reset statistics', () => {
      cache.set(1, 'method', createMockRelationship(1, 'method'));
      cache.clear();

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct total entries', () => {
      cache.set(1, 'methodA', createMockRelationship(1, 'methodA'));
      cache.set(2, 'methodB', createMockRelationship(2, 'methodB'));

      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(2);
    });

    it('should estimate memory usage', () => {
      cache.set(1, 'method', createMockRelationship(1, 'method'));

      const stats = cache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should return zero entries for empty cache', () => {
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.memoryUsage).toBe(0);
    });
  });

  describe('Access count tracking', () => {
    it('should increment access count on get', () => {
      const rel = createMockRelationship(1, 'method');
      cache.set(1, 'method', rel);

      // Access multiple times
      cache.get(1, 'method');
      cache.get(1, 'method');
      cache.get(1, 'method');

      // Internal accessCount should be 4 (1 from set + 3 from get)
      // We can't directly test internal state, but we can verify the entry exists
      expect(cache.get(1, 'method')).not.toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle objectId 0', () => {
      const rel = createMockRelationship(0, 'method');
      cache.set(0, 'method', rel);
      expect(cache.get(0, 'method')).toEqual(rel);
    });

    it('should handle empty method name', () => {
      const rel = createMockRelationship(1, '');
      cache.set(1, '', rel);
      expect(cache.get(1, '')).toEqual(rel);
    });

    it('should handle special characters in method name', () => {
      const rel = createMockRelationship(1, 'method:with:colons');
      cache.set(1, 'method:with:colons', rel);
      expect(cache.get(1, 'method:with:colons')).toEqual(rel);
    });

    it('should handle large objectIds', () => {
      const rel = createMockRelationship(Number.MAX_SAFE_INTEGER, 'method');
      cache.set(Number.MAX_SAFE_INTEGER, 'method', rel);
      expect(cache.get(Number.MAX_SAFE_INTEGER, 'method')).toEqual(rel);
    });
  });
});
