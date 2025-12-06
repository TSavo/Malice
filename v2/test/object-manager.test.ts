import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectDatabase } from '../src/database/object-db.js';
import { ObjectManager } from '../src/database/object-manager.js';
import type { RuntimeObject } from '../types/object.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
const TEST_DB_NAME = 'malice_test_object_manager';

describe('ObjectManager', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, TEST_DB_NAME);
    await db.connect();

    // Clean up test database
    await db['objects'].deleteMany({});

    // Ensure root object exists
    await db.ensureRoot();

    // Create ObjectManager
    manager = new ObjectManager(db);

    // Give change streams time to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, 15000);

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    // Clear cache before each test
    manager.clearCache();
  });

  describe('findByProperty()', () => {
    it('should find objects by property value', async () => {
      // Create test objects
      const obj1 = await manager.create({
        parent: 1,
        properties: { name: 'Alice', role: 'admin' },
      });

      const obj2 = await manager.create({
        parent: 1,
        properties: { name: 'Bob', role: 'admin' },
      });

      const obj3 = await manager.create({
        parent: 1,
        properties: { name: 'Charlie', role: 'user' },
      });

      // Find all admins
      const admins = await manager.findByProperty('role', 'admin');

      expect(admins.length).toBe(2);
      expect(admins.map(o => o.get('name')).sort()).toEqual(['Alice', 'Bob']);
    });

    it('should return empty array when no matches found', async () => {
      const results = await manager.findByProperty('nonexistent', 'value');

      expect(results).toEqual([]);
    });

    it('should handle multiple matches with different property types', async () => {
      await manager.create({
        parent: 1,
        properties: { level: 5 },
      });

      await manager.create({
        parent: 1,
        properties: { level: 5 },
      });

      await manager.create({
        parent: 1,
        properties: { level: 10 },
      });

      const results = await manager.findByProperty('level', 5);

      expect(results.length).toBe(2);
      expect(results.every(obj => obj.get('level') === 5)).toBe(true);
    });

    it('should only search cached objects', async () => {
      // Create object but don't load it (not in cache)
      const obj = await manager.create({
        parent: 1,
        properties: { cached: false },
      });

      // Clear cache so object is not in memory
      manager.clearCache();

      // findByProperty only searches cache, so won't find it
      const results = await manager.findByProperty('cached', false);
      expect(results.length).toBe(0);

      // Load it into cache
      await manager.load(obj.id);

      // Now it should be found
      const resultsAfterLoad = await manager.findByProperty('cached', false);
      expect(resultsAfterLoad.length).toBe(1);
    });
  });

  describe('getChildren()', () => {
    it('should get all children of a parent object', async () => {
      // Create parent
      const parent = await manager.create({
        parent: 1,
        properties: { name: 'Parent' },
      });

      // Create children
      const child1 = await manager.create({
        parent: parent.id,
        properties: { name: 'Child1' },
      });

      const child2 = await manager.create({
        parent: parent.id,
        properties: { name: 'Child2' },
      });

      const child3 = await manager.create({
        parent: parent.id,
        properties: { name: 'Child3' },
      });

      // Get children
      const children = await manager.getChildren(parent.id);

      expect(children.length).toBe(3);
      expect(children.map(c => c.get('name')).sort()).toEqual(['Child1', 'Child2', 'Child3']);
    });

    it('should return empty array for objects with no children', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Lonely' },
      });

      const children = await manager.getChildren(obj.id);

      expect(children).toEqual([]);
    });

    it('should cache children after loading', async () => {
      // Clear cache first
      manager.clearCache();

      // Create parent and child
      const parent = await manager.create({
        parent: 1,
        properties: { name: 'Parent' },
      });

      const child = await manager.create({
        parent: parent.id,
        properties: { name: 'Child' },
      });

      // Get children (should load into cache)
      const children = await manager.getChildren(parent.id);

      expect(children.length).toBe(1);

      // Verify child is now in cache
      const cachedChild = manager.getSync(child.id);
      expect(cachedChild).toBeDefined();
      expect(cachedChild?.get('name')).toBe('Child');
    });

    it('should use cached children if already loaded', async () => {
      const parent = await manager.create({
        parent: 1,
        properties: { name: 'Parent' },
      });

      const child = await manager.create({
        parent: parent.id,
        properties: { name: 'OriginalName' },
      });

      // Load child into cache
      await manager.load(child.id);

      // Get initial cache size
      const initialCacheSize = manager.getCacheSize();

      // Get children (should use cached objects)
      const children = await manager.getChildren(parent.id);

      // Cache size shouldn't increase (already cached)
      expect(manager.getCacheSize()).toBe(initialCacheSize);
      expect(children[0].get('name')).toBe('OriginalName');
    });
  });

  describe('clearCache()', () => {
    it('should clear all cached objects', async () => {
      // Create and load some objects
      await manager.create({ parent: 1, properties: { name: 'Obj1' } });
      await manager.create({ parent: 1, properties: { name: 'Obj2' } });
      await manager.create({ parent: 1, properties: { name: 'Obj3' } });

      expect(manager.getCacheSize()).toBeGreaterThan(0);

      // Clear cache
      manager.clearCache();

      expect(manager.getCacheSize()).toBe(0);
    });

    it('should force reload from database after clearing', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { hp: 100 },
      });

      // Modify directly in database
      await db.update(obj.id, { properties: { hp: 50 } });

      // Clear cache to force reload
      manager.clearCache();

      // Load should fetch fresh data
      const reloaded = await manager.load(obj.id);
      expect(reloaded?.get('hp')).toBe(50);
    });
  });

  describe('getCacheStats()', () => {
    it('should return cache statistics', async () => {
      // Create some objects
      await manager.create({ parent: 1, properties: { name: 'Obj1' } });
      await manager.create({ parent: 1, properties: { name: 'Obj2' } });

      const stats = manager.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.objectsCached).toBeGreaterThan(0);
      expect(typeof stats.cacheHits).toBe('number');
      expect(typeof stats.cacheMisses).toBe('number');
      expect(typeof stats.invalidations).toBe('number');
    });

    it('should track cache hits and misses', async () => {
      manager.clearCache();

      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Test' },
      });

      // Cache hit
      await manager.load(obj.id);

      // Cache miss
      await manager.load(999999);

      const stats = manager.getCacheStats();

      expect(stats.cacheHits).toBeGreaterThan(0);
      expect(stats.cacheMisses).toBeGreaterThan(0);
    });
  });

  describe('getCompiledMethod() / setCompiledMethod()', () => {
    it('should store and retrieve compiled method code', () => {
      const objId = 123;
      const methodName = 'greet';
      const compiledCode = 'console.log("Hello");';

      // Initially undefined
      expect(manager.getCompiledMethod(objId, methodName)).toBeUndefined();

      // Set compiled code
      manager.setCompiledMethod(objId, methodName, compiledCode);

      // Should retrieve it
      expect(manager.getCompiledMethod(objId, methodName)).toBe(compiledCode);
    });

    it('should cache multiple methods for the same object', () => {
      const objId = 456;

      manager.setCompiledMethod(objId, 'greet', 'code1');
      manager.setCompiledMethod(objId, 'farewell', 'code2');
      manager.setCompiledMethod(objId, 'emote', 'code3');

      expect(manager.getCompiledMethod(objId, 'greet')).toBe('code1');
      expect(manager.getCompiledMethod(objId, 'farewell')).toBe('code2');
      expect(manager.getCompiledMethod(objId, 'emote')).toBe('code3');
    });

    it('should cache methods for different objects separately', () => {
      manager.setCompiledMethod(1, 'test', 'code1');
      manager.setCompiledMethod(2, 'test', 'code2');

      expect(manager.getCompiledMethod(1, 'test')).toBe('code1');
      expect(manager.getCompiledMethod(2, 'test')).toBe('code2');
    });

    it('should return undefined for non-existent compiled methods', () => {
      expect(manager.getCompiledMethod(999, 'nonexistent')).toBeUndefined();
    });
  });

  describe('preload()', () => {
    it('should preload multiple objects into cache', async () => {
      manager.clearCache();

      // Create objects
      const obj1 = await manager.create({ parent: 1, properties: { name: 'Obj1' } });
      const obj2 = await manager.create({ parent: 1, properties: { name: 'Obj2' } });
      const obj3 = await manager.create({ parent: 1, properties: { name: 'Obj3' } });

      // Clear cache
      manager.clearCache();

      // Preload
      await manager.preload([obj1.id, obj2.id, obj3.id]);

      // All should be in cache now
      expect(manager.getSync(obj1.id)).toBeDefined();
      expect(manager.getSync(obj2.id)).toBeDefined();
      expect(manager.getSync(obj3.id)).toBeDefined();
    });

    it('should mark preloaded objects in statistics', async () => {
      manager.clearCache();

      const obj = await manager.create({ parent: 1, properties: { name: 'Preloaded' } });

      manager.clearCache();

      const statsBefore = manager.getCacheStats();
      const preloadedBefore = statsBefore.preloadedObjects;

      await manager.preload([obj.id]);

      const statsAfter = manager.getCacheStats();
      const preloadedAfter = statsAfter.preloadedObjects;

      expect(preloadedAfter).toBeGreaterThan(preloadedBefore);
    });

    it('should handle empty preload list', async () => {
      await manager.preload([]);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle preloading non-existent objects gracefully', async () => {
      await manager.preload([999999]);

      // Should not throw, just won't load anything
      expect(manager.getSync(999999)).toBeNull();
    });
  });

  describe('registerAlias() / removeAlias() / getAliases()', () => {
    it('should register an alias for an object', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'TestObject' },
      });

      manager.registerAlias('testAlias', obj);

      const aliases = manager.getAliases();
      expect(aliases.has('testAlias')).toBe(true);
      expect(aliases.get('testAlias')).toBe(obj);
    });

    it('should remove an alias', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'TestObject' },
      });

      manager.registerAlias('tempAlias', obj);
      expect(manager.getAliases().has('tempAlias')).toBe(true);

      manager.removeAlias('tempAlias');
      expect(manager.getAliases().has('tempAlias')).toBe(false);
    });

    it('should get all aliases', async () => {
      const obj1 = await manager.create({ parent: 1, properties: { name: 'Obj1' } });
      const obj2 = await manager.create({ parent: 1, properties: { name: 'Obj2' } });

      manager.registerAlias('alias1', obj1);
      manager.registerAlias('alias2', obj2);

      const aliases = manager.getAliases();

      expect(aliases.size).toBeGreaterThanOrEqual(2);
      expect(aliases.get('alias1')).toBe(obj1);
      expect(aliases.get('alias2')).toBe(obj2);
    });

    it('should return a copy of aliases map', async () => {
      const obj = await manager.create({ parent: 1, properties: { name: 'Test' } });

      manager.registerAlias('original', obj);

      const aliases = manager.getAliases();
      aliases.set('modified', obj);

      // Original should not be affected
      expect(manager.getAliases().has('modified')).toBe(false);
      expect(manager.getAliases().has('original')).toBe(true);
    });

    it('should overwrite existing alias with same name', async () => {
      const obj1 = await manager.create({ parent: 1, properties: { name: 'First' } });
      const obj2 = await manager.create({ parent: 1, properties: { name: 'Second' } });

      manager.registerAlias('shared', obj1);
      expect(manager.getAliases().get('shared')).toBe(obj1);

      manager.registerAlias('shared', obj2);
      expect(manager.getAliases().get('shared')).toBe(obj2);
    });
  });

  describe('recycle()', () => {
    it('should recycle an object by RuntimeObject', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'ToRecycle' },
      });

      const id = obj.id;

      // Recycle
      await manager.recycle(obj);

      // Should be marked as recycled in database
      const dbObj = await db.get(id);
      expect(dbObj?.recycled).toBe(true);
    });

    it('should recycle an object by ID', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'ToRecycle' },
      });

      const id = obj.id;

      // Recycle by ID
      await manager.recycle(id);

      // Should be marked as recycled in database
      const dbObj = await db.get(id);
      expect(dbObj?.recycled).toBe(true);
    });

    it('should invalidate cache when recycling', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'ToRecycle' },
      });

      const id = obj.id;

      // Verify it's in cache
      expect(manager.getSync(id)).toBeDefined();

      // Recycle
      await manager.recycle(obj);

      // Should be removed from cache
      expect(manager.getSync(id)).toBeNull();
    });

    it('should remove aliases when recycling', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'ToRecycle' },
      });

      // Register alias
      manager.registerAlias('recycleMe', obj);
      expect(manager.getAliases().has('recycleMe')).toBe(true);

      // Recycle
      await manager.recycle(obj);

      // Alias should be removed
      expect(manager.getAliases().has('recycleMe')).toBe(false);
    });

    it('should remove multiple aliases for the same object', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'MultiAlias' },
      });

      // Register multiple aliases
      manager.registerAlias('alias1', obj);
      manager.registerAlias('alias2', obj);
      manager.registerAlias('alias3', obj);

      expect(manager.getAliases().has('alias1')).toBe(true);
      expect(manager.getAliases().has('alias2')).toBe(true);
      expect(manager.getAliases().has('alias3')).toBe(true);

      // Recycle
      await manager.recycle(obj);

      // All aliases should be removed
      expect(manager.getAliases().has('alias1')).toBe(false);
      expect(manager.getAliases().has('alias2')).toBe(false);
      expect(manager.getAliases().has('alias3')).toBe(false);
    });
  });

  describe('Proxy behavior', () => {
    it('should allow dynamic alias access via proxy get', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'DynamicAccess' },
      });

      manager.registerAlias('dynamic', obj);

      // Access via proxy
      const accessed = (manager as any).dynamic;

      expect(accessed).toBeDefined();
      expect(accessed.id).toBe(obj.id);
      expect(accessed.get('name')).toBe('DynamicAccess');
    });

    it('should allow dynamic alias registration via proxy set', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'ProxySet' },
      });

      // Set via proxy
      (manager as any).proxyAlias = obj;

      // Should be registered
      expect(manager.getAliases().has('proxyAlias')).toBe(true);
      expect((manager as any).proxyAlias).toBe(obj);
    });

    it('should prevent overwriting internal properties via proxy', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Test' },
      });

      // Try to overwrite internal property
      const result = Reflect.set(manager, 'db', obj);

      // Should fail
      expect(result).toBe(false);
    });

    it('should return undefined for non-existent aliases via proxy', () => {
      const accessed = (manager as any).nonExistentAlias;

      expect(accessed).toBeUndefined();
    });

    it('should reject non-object values via proxy set', () => {
      const result = Reflect.set(manager, 'invalidAlias', 'string value');

      expect(result).toBe(false);
    });

    it('should reject objects without id property via proxy set', () => {
      const result = Reflect.set(manager, 'invalidAlias', { name: 'test' });

      expect(result).toBe(false);
    });
  });

  describe('Change stream invalidation', () => {
    it('should invalidate cache when external change detected', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { value: 'original' },
      });

      const id = obj.id;

      // Load into cache
      await manager.load(id);

      // Verify in cache
      expect(manager.getSync(id)).toBeDefined();

      // Modify directly in database (simulating external change)
      await db.update(id, { properties: { value: 'modified' } });

      // Wait for change stream to propagate
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Cache should be invalidated
      expect(manager.getSync(id)).toBeNull();

      // Reload should get fresh data
      const reloaded = await manager.load(id);
      expect(reloaded?.get('value')).toBe('modified');
    }, 10000);

    it('should log when external change detected for cached object', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { value: 'original' },
      });

      const id = obj.id;

      // Load into cache
      await manager.load(id);

      const consoleSpy = vi.spyOn(console, 'log');

      // Modify directly in database
      await db.update(id, { properties: { value: 'modified' } });

      // Wait for change stream
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should have logged the external change
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[ObjectManager] External change detected for object #${id}`)
      );

      consoleSpy.mockRestore();
    }, 10000);

    it('should not log when external change for non-cached object', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { value: 'original' },
      });

      const id = obj.id;

      // Clear cache so object is not cached
      manager.clearCache();

      const consoleSpy = vi.spyOn(console, 'log');

      // Modify directly in database
      await db.update(id, { properties: { value: 'modified' } });

      // Wait for change stream
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should not log (object wasn't cached)
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(`[ObjectManager] External change detected for object #${id}`)
      );

      consoleSpy.mockRestore();
    }, 10000);

    it('should remove aliases when object deleted via change stream', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'ToDelete' },
      });

      const id = obj.id;

      // Register alias
      manager.registerAlias('deleteMe', obj);
      expect(manager.getAliases().has('deleteMe')).toBe(true);

      // Delete directly in database
      await db.delete(id);

      // Wait for change stream
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Alias should be removed
      expect(manager.getAliases().has('deleteMe')).toBe(false);
    }, 10000);

    it('should handle replace operations via change stream', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { status: 'active' },
      });

      const id = obj.id;

      // Load into cache
      await manager.load(id);
      expect(manager.getSync(id)).toBeDefined();

      // Replace document in database
      await db['objects'].replaceOne(
        { _id: id },
        {
          _id: id,
          parent: 1,
          properties: { status: 'replaced' },
          methods: {},
          created: new Date(),
          modified: new Date(),
        }
      );

      // Wait for change stream
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Cache should be invalidated
      expect(manager.getSync(id)).toBeNull();

      // Reload should get replaced data
      const reloaded = await manager.load(id);
      expect(reloaded?.get('status')).toBe('replaced');
    }, 10000);
  });

  describe('invalidate() method', () => {
    it('should invalidate cache for specific object', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Test' },
      });

      const id = obj.id;

      // Verify in cache
      expect(manager.getSync(id)).toBeDefined();

      // Invalidate
      manager.invalidate(id);

      // Should be removed from cache
      expect(manager.getSync(id)).toBeNull();
    });

    it('should log when invalidating cached object', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Test' },
      });

      const id = obj.id;

      // Should log when object is in cache
      const consoleSpy = vi.spyOn(console, 'log');

      manager.invalidate(id);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[ObjectManager] Invalidating cache for object #${id}`)
      );

      consoleSpy.mockRestore();
    });

    it('should not log when invalidating non-cached object', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      // Invalidate non-existent object
      manager.invalidate(999999);

      // Should not log
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[ObjectManager] Invalidating cache for object')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('registerAliasById()', () => {
    it('should register alias by loading object ID', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'AliasTest' },
      });

      await manager.registerAliasById('testById', obj.id);

      const aliases = manager.getAliases();
      expect(aliases.has('testById')).toBe(true);
      expect(aliases.get('testById')?.id).toBe(obj.id);
    });

    it('should handle registering alias for non-existent object', async () => {
      await manager.registerAliasById('nonExistent', 999999);

      const aliases = manager.getAliases();
      expect(aliases.has('nonExistent')).toBe(false);
    });
  });

  describe('update() and delete()', () => {
    it('should update object and invalidate cache', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { status: 'active' },
      });

      const id = obj.id;

      // Verify cached
      expect(manager.getSync(id)).toBeDefined();

      // Update
      await manager.update(id, {
        properties: { status: 'updated' },
      });

      // Cache should be invalidated
      expect(manager.getSync(id)).toBeNull();

      // Reload should show updated value
      const updated = await manager.load(id);
      expect(updated?.get('status')).toBe('updated');
    });

    it('should delete object and invalidate cache', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'ToDelete' },
      });

      const id = obj.id;

      // Verify cached
      expect(manager.getSync(id)).toBeDefined();

      // Delete
      await manager.delete(id);

      // Cache should be invalidated
      expect(manager.getSync(id)).toBeNull();

      // Should not exist in database
      const reloaded = await manager.load(id);
      expect(reloaded).toBeNull();
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle loading special object #0 (ObjectManager)', async () => {
      const root = await manager.load(0);

      expect(root).toBeDefined();
      expect(root?.id).toBe(0);
      expect(root?.get('name')).toBe('ObjectManager');
    });

    it('should cache special object #0', async () => {
      manager.clearCache();

      // Load special object
      await manager.load(0);

      // Should be in cache
      expect(manager.getSync(0)).toBeDefined();
    });

    it('should return cached #0 on subsequent loads', async () => {
      manager.clearCache();

      // First load
      const first = await manager.load(0);

      // Second load should return cached version
      const second = await manager.load(0);

      expect(second).toBe(first);
      expect(second?.id).toBe(0);
    });

    it('should handle findByProperty with inherited properties', async () => {
      // Create parent with property
      const parent = await manager.create({
        parent: 1,
        properties: { inherited: 'value' },
      });

      // Create child that inherits
      const child = await manager.create({
        parent: parent.id,
        properties: { own: 'data' },
      });

      // Load into cache
      await manager.load(child.id);

      // findByProperty should find by inherited value
      const results = await manager.findByProperty('inherited', 'value');

      // Should find parent
      expect(results.some(obj => obj.id === parent.id)).toBe(true);
      // Child also has the property via inheritance
      expect(results.some(obj => obj.id === child.id)).toBe(true);
    });

    it('should handle multiple objects with complex property queries', async () => {
      // Create objects with various property types
      await manager.create({
        parent: 1,
        properties: { type: 'weapon', damage: 10 },
      });

      await manager.create({
        parent: 1,
        properties: { type: 'weapon', damage: 15 },
      });

      await manager.create({
        parent: 1,
        properties: { type: 'armor', defense: 5 },
      });

      // Find all weapons
      const weapons = await manager.findByProperty('type', 'weapon');
      expect(weapons.length).toBe(2);

      // Find armor
      const armor = await manager.findByProperty('type', 'armor');
      expect(armor.length).toBe(1);
    });
  });
});
