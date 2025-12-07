import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { AliasLoader } from '../../src/database/bootstrap/alias-loader.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('AliasLoader', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let loader: AliasLoader;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_alias_loader');
    await db.connect();

    // Clean database
    await db['objects'].deleteMany({});

    manager = new ObjectManager(db);
    loader = new AliasLoader(manager);
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('loadAliases()', () => {
    it('should handle missing root object gracefully', async () => {
      await expect(loader.loadAliases()).resolves.not.toThrow();
    });

    it('should handle empty aliases', async () => {
      // Create ObjectManager #0 with no aliases
      await db.create({
        _id: 0,
        parent: 0,
        properties: {
          name: 'ObjectManager',
          aliases: {},
        },
        methods: {},
      });

      await expect(loader.loadAliases()).resolves.not.toThrow();
    });

    it('should load aliases from root.properties.aliases', async () => {
      // Create ObjectManager #0 with aliases
      await db.create({
        _id: 0,
        parent: 0,
        properties: {
          name: 'ObjectManager',
          aliases: {
            test: 1,
            example: 2,
          },
        },
        methods: {},
      });

      // Create referenced objects with explicit IDs
      await db.create({
        _id: 1,
        parent: 0,
        properties: { name: 'Test' },
        methods: {},
      });
      await db.create({
        _id: 2,
        parent: 0,
        properties: { name: 'Example' },
        methods: {},
      });

      await loader.loadAliases();

      // Check aliases are registered (nothing, object_manager auto-loaded + test, example)
      const aliases = manager.getAliases();
      expect(aliases.size).toBe(2);
      expect(aliases.has('test')).toBe(true);
      expect(aliases.has('example')).toBe(true);
    });

    it('should register alias objects in ObjectManager', async () => {
      await db.create({
        _id: 0,
        parent: 0,
        properties: {
          name: 'ObjectManager',
          aliases: { foo: 1 },
        },
        methods: {},
      });

      await db.create({
        _id: 1,
        parent: 0,
        properties: { name: 'Foo' },
        methods: {},
      });

      await loader.loadAliases();

      const aliases = manager.getAliases();
      const fooAlias = aliases.get('foo');

      expect(fooAlias).toBeTruthy();
      expect(fooAlias!.id).toBe(1);
      expect(fooAlias!.get('name')).toBe('Foo');
    });

    it('should handle non-existent object references', async () => {
      await db.create({
        _id: 0,
        parent: 0,
        properties: {
          name: 'ObjectManager',
          aliases: {
            valid: 1,
            invalid: 999, // Doesn't exist
          },
        },
        methods: {},
      });

      await db.create({
        _id: 1,
        parent: 0,
        properties: { name: 'Valid' },
        methods: {},
      });

      await loader.loadAliases();

      const aliases = manager.getAliases();
      expect(aliases.size).toBe(1); // Only valid alias registered
      expect(aliases.has('valid')).toBe(true);
      expect(aliases.has('invalid')).toBe(false);
    });

    it('should handle multiple aliases to same object', async () => {
      await db.create({
        _id: 0,
        parent: 0,
        properties: {
          name: 'ObjectManager',
          aliases: {
            sys: 1,
            system: 1,
          },
        },
        methods: {},
      });

      await db.create({
        _id: 1,
        parent: 0,
        properties: { name: 'System' },
        methods: {},
      });

      await loader.loadAliases();

      const aliases = manager.getAliases();
      expect(aliases.size).toBe(2);

      const sys = aliases.get('sys');
      const system = aliases.get('system');

      expect(sys).toBeTruthy();
      expect(system).toBeTruthy();
      expect(sys!.id).toBe(system!.id);
    });

    it('should load numeric IDs correctly', async () => {
      await db.create({
        _id: 0,
        parent: 0,
        properties: {
          name: 'ObjectManager',
          aliases: {
            obj1: 100,
            obj2: 200,
            obj3: 300,
          },
        },
        methods: {},
      });

      // Create objects with specific IDs
      for (const id of [100, 200, 300]) {
        await db.create({
          _id: id,
          parent: 0,
          properties: { name: `Object ${id}` },
          methods: {},
        });
      }

      await loader.loadAliases();

      const aliases = manager.getAliases();
      expect(aliases.size).toBe(3);

      expect(aliases.get('obj1')!.id).toBe(100);
      expect(aliases.get('obj2')!.id).toBe(200);
      expect(aliases.get('obj3')!.id).toBe(300);
    });
  });

  describe('Integration with ObjectManager proxy', () => {
    it('should enable $.alias access after loading', async () => {
      await db.create({
        _id: 0,
        parent: 0,
        properties: {
          name: 'ObjectManager',
          aliases: { testObj: 1 },
        },
        methods: {},
      });

      await db.create({
        _id: 1,
        parent: 0,
        properties: { name: 'Test Object' },
        methods: {},
      });

      await loader.loadAliases();

      // Access via proxy
      const testObj = (manager as any).testObj;
      expect(testObj).toBeTruthy();
      expect(testObj.id).toBe(1);
      expect(testObj.get('name')).toBe('Test Object');
    });

    it('should update when aliases change', async () => {
      await db.create({
        _id: 0,
        parent: 0,
        properties: {
          name: 'ObjectManager',
          aliases: { v1: 1 },
        },
        methods: {},
      });

      await db.create({
        _id: 1,
        parent: 0,
        properties: { name: 'Version 1' },
        methods: {},
      });

      await loader.loadAliases();

      expect((manager as any).v1).toBeTruthy();
      expect((manager as any).v2).toBeUndefined();

      // Update aliases in MongoDB
      const objectManager = await manager.load(0);
      objectManager!.set('aliases', { v1: 1, v2: 1 });
      await objectManager!.save();

      // Reload aliases
      const loader2 = new AliasLoader(manager);
      await loader2.loadAliases();

      expect((manager as any).v1).toBeTruthy();
      expect((manager as any).v2).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should handle corrupt alias data', async () => {
      await db.create({
        _id: 0,
        parent: 0,
        properties: {
          name: 'ObjectManager',
          aliases: null, // Corrupt data
        },
        methods: {},
      });

      await expect(loader.loadAliases()).resolves.not.toThrow();
    });

    it('should handle non-object aliases property', async () => {
      await db.create({
        _id: 0,
        parent: 0,
        properties: {
          name: 'ObjectManager',
          aliases: 'not an object', // Wrong type
        },
        methods: {},
      });

      await expect(loader.loadAliases()).resolves.not.toThrow();
    });
  });
});
