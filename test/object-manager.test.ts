import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { ObjectDatabase } from '../src/database/object-db.js';
import { ObjectManager } from '../src/database/object-manager.js';
import type { RuntimeObject } from '../types/object.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
const TEST_DB_NAME = 'malice_test_object_manager';

describe('ObjectManager', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let root: RuntimeObject;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, TEST_DB_NAME);
    await db.connect();

    // Clean up test database
    await db['objects'].deleteMany({});

    // Ensure root object exists
    await db.ensureRoot();

    // Create ObjectManager and load all objects
    manager = new ObjectManager(db);
    await manager.loadAll();

    // Load root object for use as parent
    root = (await manager.load(0))!;
  }, 15000);

  afterAll(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('findByProperty()', () => {
    it('should find objects by property value', async () => {
      // Create test objects
      const obj1 = await manager.create({
        parent: root,
        properties: { name: 'Alice', role: 'admin' },
      });

      const obj2 = await manager.create({
        parent: root,
        properties: { name: 'Bob', role: 'admin' },
      });

      const obj3 = await manager.create({
        parent: root,
        properties: { name: 'Charlie', role: 'user' },
      });

      // Find all admins
      const admins = await manager.findByProperty('role', 'admin');

      expect(admins.length).toBeGreaterThanOrEqual(2);
      const names = admins.map(o => o.get('name'));
      expect(names).toContain('Alice');
      expect(names).toContain('Bob');
    });

    it('should return empty array when no matches found', async () => {
      const results = await manager.findByProperty('nonexistent_unique_prop_12345', 'value');

      expect(results).toEqual([]);
    });

    it('should handle multiple matches with different property types', async () => {
      const uniqueLevel = 999888;
      
      await manager.create({
        parent: root,
        properties: { level: uniqueLevel },
      });

      await manager.create({
        parent: root,
        properties: { level: uniqueLevel },
      });

      await manager.create({
        parent: root,
        properties: { level: uniqueLevel + 1 },
      });

      const results = await manager.findByProperty('level', uniqueLevel);

      expect(results.length).toBe(2);
      expect(results.every(obj => obj.get('level') === uniqueLevel)).toBe(true);
    });
  });

  describe('getChildren()', () => {
    it('should get all children of a parent object', async () => {
      // Create parent
      const parent = await manager.create({
        parent: root,
        properties: { name: 'ParentForChildren' },
      });

      // Create children
      await manager.create({
        parent: parent,
        properties: { name: 'Child1' },
      });

      await manager.create({
        parent: parent,
        properties: { name: 'Child2' },
      });

      await manager.create({
        parent: parent,
        properties: { name: 'Child3' },
      });

      // Get children
      const children = await manager.getChildren(parent.id);

      expect(children.length).toBe(3);
      expect(children.map(c => c.get('name')).sort()).toEqual(['Child1', 'Child2', 'Child3']);
    });

    it('should return empty array for objects with no children', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { name: 'Lonely' },
      });

      const children = await manager.getChildren(obj.id);

      expect(children).toEqual([]);
    });

    it('should return cached children', async () => {
      // Create parent and child
      const parent = await manager.create({
        parent: root,
        properties: { name: 'ParentCached' },
      });

      const child = await manager.create({
        parent: parent,
        properties: { name: 'ChildCached' },
      });

      // Get children
      const children = await manager.getChildren(parent.id);

      expect(children.length).toBe(1);

      // Verify child is in cache (getSync returns cached proxy)
      const cachedChild = manager.getSync(child.id);
      expect(cachedChild).toBeDefined();
      expect(cachedChild?.get('name')).toBe('ChildCached');
    });
  });

  describe('getCacheStats()', () => {
    it('should return cache statistics', async () => {
      // Create some objects
      await manager.create({ parent: root, properties: { name: 'StatsObj1' } });
      await manager.create({ parent: root, properties: { name: 'StatsObj2' } });

      const stats = manager.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.objectsCached).toBeGreaterThan(0);
      expect(typeof stats.cacheHits).toBe('number');
      expect(typeof stats.cacheMisses).toBe('number');
      expect(typeof stats.invalidations).toBe('number');
    });

    it('should track cache hits', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { name: 'CacheHitTest' },
      });

      const statsBefore = manager.getCacheStats();

      // Cache hit - object already in cache from create
      await manager.load(obj.id);

      const statsAfter = manager.getCacheStats();

      expect(statsAfter.cacheHits).toBeGreaterThan(statsBefore.cacheHits);
    });
  });

  describe('getCompiledMethod() / setCompiledMethod()', () => {
    it('should store and retrieve compiled method code', () => {
      const objId = 123456;
      const methodName = 'greetUnique';
      const compiledCode = 'console.log("Hello");';

      // Initially undefined
      expect(manager.getCompiledMethod(objId, methodName)).toBeUndefined();

      // Set compiled code
      manager.setCompiledMethod(objId, methodName, compiledCode);

      // Should retrieve it
      expect(manager.getCompiledMethod(objId, methodName)).toBe(compiledCode);
    });

    it('should cache multiple methods for the same object', () => {
      const objId = 456789;

      manager.setCompiledMethod(objId, 'greet', 'code1');
      manager.setCompiledMethod(objId, 'farewell', 'code2');
      manager.setCompiledMethod(objId, 'emote', 'code3');

      expect(manager.getCompiledMethod(objId, 'greet')).toBe('code1');
      expect(manager.getCompiledMethod(objId, 'farewell')).toBe('code2');
      expect(manager.getCompiledMethod(objId, 'emote')).toBe('code3');
    });

    it('should cache methods for different objects separately', () => {
      manager.setCompiledMethod(111111, 'test', 'codeA');
      manager.setCompiledMethod(222222, 'test', 'codeB');

      expect(manager.getCompiledMethod(111111, 'test')).toBe('codeA');
      expect(manager.getCompiledMethod(222222, 'test')).toBe('codeB');
    });

    it('should return undefined for non-existent compiled methods', () => {
      expect(manager.getCompiledMethod(999999, 'nonexistent')).toBeUndefined();
    });
  });

  describe('preload()', () => {
    it('should preload multiple objects into cache', async () => {
      // Create objects
      const obj1 = await manager.create({ parent: root, properties: { name: 'PreloadObj1' } });
      const obj2 = await manager.create({ parent: root, properties: { name: 'PreloadObj2' } });
      const obj3 = await manager.create({ parent: root, properties: { name: 'PreloadObj3' } });

      // Preload (they're already cached from create, but this tests the method)
      await manager.preload([obj1.id, obj2.id, obj3.id]);

      // All should be in cache
      expect(manager.getSync(obj1.id)).toBeDefined();
      expect(manager.getSync(obj2.id)).toBeDefined();
      expect(manager.getSync(obj3.id)).toBeDefined();
    });

    it('should handle empty preload list', async () => {
      await manager.preload([]);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle preloading non-existent objects gracefully', async () => {
      await manager.preload([999999999]);

      // Should not throw, just won't load anything
      expect(manager.getSync(999999999)).toBeNull();
    });
  });

  describe('registerAlias() / removeAlias() / getAliases()', () => {
    it('should register an alias for an object', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { name: 'TestObjectAlias' },
      });

      manager.registerAlias('testAliasUnique', obj);

      const aliases = manager.getAliases();
      expect(aliases.has('testAliasUnique')).toBe(true);
      expect(aliases.get('testAliasUnique')).toBe(obj);
    });

    it('should remove an alias', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { name: 'TestObjectRemove' },
      });

      manager.registerAlias('tempAliasRemove', obj);
      expect(manager.getAliases().has('tempAliasRemove')).toBe(true);

      manager.removeAlias('tempAliasRemove');
      expect(manager.getAliases().has('tempAliasRemove')).toBe(false);
    });

    it('should get all aliases', async () => {
      const obj1 = await manager.create({ parent: root, properties: { name: 'AliasObj1' } });
      const obj2 = await manager.create({ parent: root, properties: { name: 'AliasObj2' } });

      manager.registerAlias('aliasGetAll1', obj1);
      manager.registerAlias('aliasGetAll2', obj2);

      const aliases = manager.getAliases();

      expect(aliases.size).toBeGreaterThanOrEqual(2);
      expect(aliases.get('aliasGetAll1')).toBe(obj1);
      expect(aliases.get('aliasGetAll2')).toBe(obj2);
    });

    it('should return a copy of aliases map', async () => {
      const obj = await manager.create({ parent: root, properties: { name: 'AliasCopy' } });

      manager.registerAlias('originalAlias', obj);

      const aliases = manager.getAliases();
      aliases.set('modifiedAlias', obj);

      // Original should not be affected
      expect(manager.getAliases().has('modifiedAlias')).toBe(false);
      expect(manager.getAliases().has('originalAlias')).toBe(true);
    });

    it('should overwrite existing alias with same name', async () => {
      const obj1 = await manager.create({ parent: root, properties: { name: 'First' } });
      const obj2 = await manager.create({ parent: root, properties: { name: 'Second' } });

      manager.registerAlias('sharedAlias', obj1);
      expect(manager.getAliases().get('sharedAlias')).toBe(obj1);

      manager.registerAlias('sharedAlias', obj2);
      expect(manager.getAliases().get('sharedAlias')).toBe(obj2);
    });
  });

  describe('Proxy behavior', () => {
    it('should allow dynamic alias access via proxy get', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { name: 'DynamicAccessProxy' },
      });

      manager.registerAlias('dynamicProxy', obj);

      // Access via proxy
      const accessed = (manager as any).dynamicProxy;

      expect(accessed).toBeDefined();
      expect(accessed.id).toBe(obj.id);
      expect(accessed.get('name')).toBe('DynamicAccessProxy');
    });

    it('should allow dynamic alias registration via proxy set', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { name: 'ProxySetTest' },
      });

      // Set via proxy
      (manager as any).proxyAliasSet = obj;

      // Should be registered
      expect(manager.getAliases().has('proxyAliasSet')).toBe(true);
      expect((manager as any).proxyAliasSet).toBe(obj);
    });

    it('should prevent overwriting internal properties via proxy', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { name: 'TestInternal' },
      });

      // Try to overwrite internal property
      const result = Reflect.set(manager, 'db', obj);

      // Should fail
      expect(result).toBe(false);
    });

    it('should return undefined for non-existent aliases via proxy', () => {
      const accessed = (manager as any).nonExistentAliasProxy;

      expect(accessed).toBeUndefined();
    });

    it('should reject non-object values via proxy set', () => {
      const result = Reflect.set(manager, 'invalidAliasProxy', 'string value');

      expect(result).toBe(false);
    });

    it('should reject objects without id property via proxy set', () => {
      const result = Reflect.set(manager, 'invalidAliasProxy2', { name: 'test' });

      expect(result).toBe(false);
    });
  });

  describe('invalidate() method', () => {
    it('should invalidate transient caches for specific object', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { name: 'InvalidateTest' },
        methods: { greet: { code: 'return "hello";' } },
      });

      const id = obj.id;

      // Store some compiled method in cache
      manager.setCompiledMethod(id, 'greet', 'compiled code');
      expect(manager.getCompiledMethod(id, 'greet')).toBe('compiled code');

      // Invalidate
      manager.invalidate(id);

      // Compiled method should be cleared
      expect(manager.getCompiledMethod(id, 'greet')).toBeUndefined();

      // But proxy should still exist (stable proxy pattern)
      expect(manager.getSync(id)).toBeDefined();
    });
  });

  describe('registerAliasById()', () => {
    it('should register alias by loading object ID', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { name: 'AliasTestById' },
      });

      await manager.registerAliasById('testByIdUnique', obj.id);

      const aliases = manager.getAliases();
      expect(aliases.has('testByIdUnique')).toBe(true);
      expect(aliases.get('testByIdUnique')?.id).toBe(obj.id);
    });

    it('should handle registering alias for non-existent object', async () => {
      await manager.registerAliasById('nonExistentById', 999999999);

      const aliases = manager.getAliases();
      expect(aliases.has('nonExistentById')).toBe(false);
    });
  });

  describe('Stable Proxy Pattern', () => {
    it('should return same proxy reference on multiple loads', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { name: 'StableProxy' },
      });

      const first = await manager.load(obj.id);
      const second = await manager.load(obj.id);
      const third = manager.getSync(obj.id);

      expect(first).toBe(second);
      expect(second).toBe(third);
    });

    it('should reflect property changes on existing proxy', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { value: 'original' },
      });

      const proxy1 = await manager.load(obj.id);
      
      // Modify via the proxy
      proxy1!.set('value', 'modified');

      // Get the same proxy again
      const proxy2 = await manager.load(obj.id);

      // Should be same reference and reflect the change
      expect(proxy1).toBe(proxy2);
      expect(proxy2!.get('value')).toBe('modified');
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle loading special object #0 (ObjectManager)', async () => {
      const root = await manager.load(0);

      expect(root).toBeDefined();
      expect(root?.id).toBe(0);
      expect(root?.get('name')).toBe('ObjectManager');
    });

    it('should return cached #0 on subsequent loads', async () => {
      // First load
      const first = await manager.load(0);

      // Second load should return cached version
      const second = await manager.load(0);

      expect(second).toBe(first);
      expect(second?.id).toBe(0);
    });

    it('should handle loading special object #-1 (nothing)', async () => {
      const nothing = await manager.load(-1);

      expect(nothing).toBeDefined();
      expect(nothing?.id).toBe(-1);
      expect(nothing?.get('name')).toBe('nothing');
    });

    it('should handle findByProperty with inherited properties', async () => {
      const uniqueValue = 'inherited_value_' + Date.now();
      
      // Create parent with property
      const parent = await manager.create({
        parent: root,
        properties: { inheritedProp: uniqueValue },
      });

      // Create child that inherits
      const child = await manager.create({
        parent: parent,
        properties: { own: 'data' },
      });

      // findByProperty should find by inherited value
      const results = await manager.findByProperty('inheritedProp', uniqueValue);

      // Should find parent
      expect(results.some(obj => obj.id === parent.id)).toBe(true);
      // Child also has the property via inheritance
      expect(results.some(obj => obj.id === child.id)).toBe(true);
    });

    it('should handle multiple objects with complex property queries', async () => {
      const uniqueType = 'weapon_' + Date.now();
      
      // Create objects with various property types
      await manager.create({
        parent: root,
        properties: { type: uniqueType, damage: 10 },
      });

      await manager.create({
        parent: root,
        properties: { type: uniqueType, damage: 15 },
      });

      await manager.create({
        parent: root,
        properties: { type: 'armor_' + Date.now(), defense: 5 },
      });

      // Find all weapons
      const weapons = await manager.findByProperty('type', uniqueType);
      expect(weapons.length).toBe(2);
    });
  });
});
