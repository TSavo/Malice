import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { ObjectDatabase } from '../src/database/object-db.js';
import type { GameObject } from '../types/object.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
const TEST_DB_NAME = 'malice_test_object_db';

describe('ObjectDatabase', () => {
  let db: ObjectDatabase;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, TEST_DB_NAME);
    await db.connect();

    // Clean up test database before running tests
    await db['objects'].deleteMany({});
  }, 15000);

  afterAll(async () => {
    // Clean up test database after all tests
    await db['objects'].deleteMany({});
    await db.disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await db['objects'].deleteMany({});
  });

  describe('connect()', () => {
    it('should connect to MongoDB successfully', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_connect');
      await testDb.connect();

      // Verify connection by creating an object
      const obj = await testDb.create({
        _id: 1,
        parent: 0,
        properties: { test: true },
        methods: {},
      });

      expect(obj._id).toBe(1);

      await testDb['objects'].deleteMany({});
      await testDb.disconnect();
    });

    it('should return early when already connected (line 20)', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_double_connect');

      // First connect
      await testDb.connect();
      expect(testDb['connected']).toBe(true);

      // Second connect should return early
      await testDb.connect();
      expect(testDb['connected']).toBe(true);

      await testDb['objects'].deleteMany({});
      await testDb.disconnect();
    });

    it('should create indexes on connect', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_indexes');
      await testDb.connect();

      // Verify parent index exists
      const indexes = await testDb['objects'].indexes();
      const parentIndex = indexes.find((idx) => idx.key.parent === 1);
      expect(parentIndex).toBeDefined();

      await testDb['objects'].deleteMany({});
      await testDb.disconnect();
    });
  });

  describe('disconnect()', () => {
    it('should disconnect from MongoDB successfully', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_disconnect');
      await testDb.connect();

      expect(testDb['connected']).toBe(true);

      await testDb.disconnect();
      expect(testDb['connected']).toBe(false);
    });

    it('should close change stream before disconnecting (lines 38-40)', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_stream_disconnect');
      await testDb.connect();

      // Set up a change stream
      let changeReceived = false;
      testDb.watch(() => {
        changeReceived = true;
      });

      // Wait for change stream to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(testDb['changeStream']).toBeDefined();

      // Disconnect should close the change stream
      await testDb.disconnect();

      expect(testDb['changeStream']).toBeUndefined();
      expect(testDb['connected']).toBe(false);
    });

    it('should return early when not connected (line 42)', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_not_connected');

      // Try to disconnect without connecting first
      expect(testDb['connected']).toBe(false);

      // Should not throw, just return early
      await expect(testDb.disconnect()).resolves.not.toThrow();

      expect(testDb['connected']).toBe(false);
    });

    it('should handle multiple disconnects gracefully', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_multi_disconnect');
      await testDb.connect();

      await testDb.disconnect();
      expect(testDb['connected']).toBe(false);

      // Second disconnect should return early
      await testDb.disconnect();
      expect(testDb['connected']).toBe(false);
    });
  });

  describe('create()', () => {
    it('should create a new object', async () => {
      const obj = await db.create({
        _id: 100,
        parent: 0,
        properties: { name: 'Test Object' },
        methods: {},
      });

      expect(obj._id).toBe(100);
      expect(obj.parent).toBe(0);
      expect(obj.properties.name).toBe('Test Object');
      expect(obj.created).toBeInstanceOf(Date);
      expect(obj.modified).toBeInstanceOf(Date);
      expect(obj.recycled).toBeUndefined();
    });

    it('should reuse recycled object ID (lines 62-74)', async () => {
      // Create an object
      const original = await db.create({
        _id: 200,
        parent: 0,
        properties: { name: 'Original' },
        methods: {},
      });

      const originalCreated = original.created;

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Recycle it
      await db.recycle(200);

      // Verify it's recycled
      const recycledObj = await db.get(200);
      expect(recycledObj?.recycled).toBe(true);

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Create a new object with the same ID (reusing recycled ID)
      const reused = await db.create({
        _id: 200,
        parent: 1,
        properties: { name: 'Reused' },
        methods: { greet: { code: 'return "hello";' } },
      });

      expect(reused._id).toBe(200);
      expect(reused.parent).toBe(1);
      expect(reused.properties.name).toBe('Reused');
      expect(reused.recycled).toBe(false);

      // Created date should be preserved from original
      expect(reused.created.getTime()).toBe(originalCreated.getTime());

      // Modified date should be newer
      expect(reused.modified.getTime()).toBeGreaterThan(originalCreated.getTime());

      // Verify it was replaced, not inserted
      const count = await db['objects'].countDocuments({ _id: 200 });
      expect(count).toBe(1);
    });

    it('should create new object when ID is not recycled', async () => {
      const obj = await db.create({
        _id: 300,
        parent: 0,
        properties: { fresh: true },
        methods: {},
      });

      expect(obj._id).toBe(300);
      expect(obj.created).toBeInstanceOf(Date);
      expect(obj.modified).toBeInstanceOf(Date);
      expect(obj.created.getTime()).toBe(obj.modified.getTime());
    });
  });

  describe('getNextId()', () => {
    it('should return 1 for empty database', async () => {
      const nextId = await db.getNextId();
      expect(nextId).toBe(1);
    });

    it('should return next sequential ID', async () => {
      await db.create({
        _id: 10,
        parent: 0,
        properties: {},
        methods: {},
      });

      await db.create({
        _id: 15,
        parent: 0,
        properties: {},
        methods: {},
      });

      const nextId = await db.getNextId();
      expect(nextId).toBe(16); // One more than highest ID
    });

    it('should prioritize recycled IDs (lines 146-148)', async () => {
      // Create objects with IDs 20, 21, 22
      await db.create({ _id: 20, parent: 0, properties: {}, methods: {} });
      await db.create({ _id: 21, parent: 0, properties: {}, methods: {} });
      await db.create({ _id: 22, parent: 0, properties: {}, methods: {} });

      // Recycle object 21
      await db.recycle(21);

      // getNextId should return the recycled ID (21), not 23
      const nextId = await db.getNextId();
      expect(nextId).toBe(21);
    });

    it('should return lowest recycled ID when multiple are recycled', async () => {
      // Create objects
      await db.create({ _id: 30, parent: 0, properties: {}, methods: {} });
      await db.create({ _id: 31, parent: 0, properties: {}, methods: {} });
      await db.create({ _id: 32, parent: 0, properties: {}, methods: {} });
      await db.create({ _id: 33, parent: 0, properties: {}, methods: {} });

      // Recycle 32 and 31 (in that order)
      await db.recycle(32);
      await db.recycle(31);

      // Should return 31 (lowest recycled ID)
      const nextId = await db.getNextId();
      expect(nextId).toBe(31);
    });
  });

  describe('recycle()', () => {
    it('should mark object as recycled', async () => {
      await db.create({
        _id: 40,
        parent: 0,
        properties: { name: 'To Recycle' },
        methods: {},
      });

      await db.recycle(40);

      const obj = await db.get(40);
      expect(obj?.recycled).toBe(true);
      expect(obj?.modified).toBeInstanceOf(Date);
    });

    it('should not delete the object, only mark it', async () => {
      await db.create({
        _id: 41,
        parent: 0,
        properties: { data: 'preserved' },
        methods: {},
      });

      await db.recycle(41);

      const obj = await db.get(41);
      expect(obj).not.toBeNull();
      expect(obj?.properties.data).toBe('preserved');
      expect(obj?.recycled).toBe(true);
    });
  });

  describe('watch()', () => {
    it('should watch for changes to objects', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_watch');
      await testDb.connect();

      // Clean up any existing data
      await testDb['objects'].deleteMany({});

      const changes: any[] = [];
      testDb.watch((change) => {
        changes.push(change);
      });

      // Wait for change stream to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create an object (properties are typed Values)
      await testDb.create({
        _id: 50,
        parent: 0,
        properties: { test: { type: 'boolean', value: true } },
        methods: {},
      });

      // Wait for change to propagate
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should have received at least one change event
      expect(changes.length).toBeGreaterThan(0);
      expect(changes[0].operationType).toBe('insert');

      await testDb['objects'].deleteMany({});
      await testDb.disconnect();
    }, 10000);

    it('should warn when already watching (lines 187-190)', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_double_watch');
      await testDb.connect();

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Set up first watch
      testDb.watch(() => {});

      // Wait for change stream to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Try to watch again - should warn
      testDb.watch(() => {});

      expect(consoleWarnSpy).toHaveBeenCalledWith('[ObjectDatabase] Already watching for changes');

      consoleWarnSpy.mockRestore();
      await testDb['objects'].deleteMany({});
      await testDb.disconnect();
    }, 10000);

    it('should handle change stream errors and reconnect (lines 206-214)', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_error');
      await testDb.connect();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let reconnectAttempted = false;

      testDb.watch(() => {});

      // Wait for change stream to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulate an error
      const originalChangeStream = testDb['changeStream'];
      expect(originalChangeStream).toBeDefined();

      // Emit an error
      originalChangeStream?.emit('error', new Error('Simulated error'));

      // Wait for error handler and reconnect attempt
      await new Promise((resolve) => setTimeout(resolve, 5500));

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ObjectDatabase] Change stream error:',
        expect.any(Error)
      );

      // Should have attempted to reconnect (change stream recreated)
      reconnectAttempted = testDb['changeStream'] !== undefined;
      expect(reconnectAttempted).toBe(true);

      consoleErrorSpy.mockRestore();
      await testDb['objects'].deleteMany({});
      await testDb.disconnect();
    }, 15000);

    it('should handle change stream close event (lines 218-219)', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_close');
      await testDb.connect();

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      testDb.watch(() => {});

      // Wait for change stream to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Close the change stream
      const changeStream = testDb['changeStream'];
      expect(changeStream).toBeDefined();

      await changeStream?.close();

      // Wait for close event
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should have logged close message
      expect(consoleLogSpy).toHaveBeenCalledWith('[ObjectDatabase] Change stream closed');

      consoleLogSpy.mockRestore();
      await testDb['objects'].deleteMany({});
      await testDb.disconnect();
    }, 10000);

    it('should handle watch initialization errors (lines 221-228)', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, TEST_DB_NAME + '_init_error');
      await testDb.connect();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock the objects.watch to throw an error
      const originalWatch = testDb['objects'].watch;
      testDb['objects'].watch = vi.fn(() => {
        throw new Error('Failed to start change stream');
      });

      // Try to watch - should catch error and retry
      testDb.watch(() => {});

      // Wait for error and retry attempt
      await new Promise((resolve) => setTimeout(resolve, 5500));

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ObjectDatabase] Failed to start change stream:',
        expect.any(Error)
      );

      // Restore original watch
      testDb['objects'].watch = originalWatch;

      consoleErrorSpy.mockRestore();
      await testDb['objects'].deleteMany({});
      await testDb.disconnect();
    }, 10000);
  });

  describe('get()', () => {
    it('should retrieve object by ID', async () => {
      await db.create({
        _id: 60,
        parent: 0,
        properties: { name: 'Get Test' },
        methods: {},
      });

      const obj = await db.get(60);
      expect(obj).not.toBeNull();
      expect(obj?._id).toBe(60);
      expect(obj?.properties.name).toBe('Get Test');
    });

    it('should return null for non-existent object', async () => {
      const obj = await db.get(99999);
      expect(obj).toBeNull();
    });
  });

  describe('update()', () => {
    it('should update object properties', async () => {
      await db.create({
        _id: 70,
        parent: 0,
        properties: { hp: 100 },
        methods: {},
      });

      const beforeUpdate = await db.get(70);
      const beforeModified = beforeUpdate?.modified;

      // Wait to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await db.update(70, {
        properties: { hp: 50 },
      });

      const obj = await db.get(70);
      expect(obj?.properties.hp).toBe(50);
      expect(obj?.modified.getTime()).toBeGreaterThan(beforeModified!.getTime());
    });

    it('should update object methods', async () => {
      await db.create({
        _id: 71,
        parent: 0,
        properties: {},
        methods: {},
      });

      await db.update(71, {
        methods: {
          greet: { code: 'return "Hello";' },
        },
      });

      const obj = await db.get(71);
      expect(obj?.methods.greet).toBeDefined();
      expect(obj?.methods.greet.code).toBe('return "Hello";');
    });
  });

  describe('delete()', () => {
    it('should delete object permanently', async () => {
      await db.create({
        _id: 80,
        parent: 0,
        properties: { temp: true },
        methods: {},
      });

      expect(await db.exists(80)).toBe(true);

      await db.delete(80);

      expect(await db.exists(80)).toBe(false);
      expect(await db.get(80)).toBeNull();
    });
  });

  describe('getChildren()', () => {
    it('should return all children of a parent object', async () => {
      // Create parent
      await db.create({
        _id: 90,
        parent: 0,
        properties: { type: 'parent' },
        methods: {},
      });

      // Create children
      await db.create({
        _id: 91,
        parent: 90,
        properties: { type: 'child1' },
        methods: {},
      });

      await db.create({
        _id: 92,
        parent: 90,
        properties: { type: 'child2' },
        methods: {},
      });

      await db.create({
        _id: 93,
        parent: 90,
        properties: { type: 'child3' },
        methods: {},
      });

      const children = await db.getChildren(90);
      expect(children.length).toBe(3);
      expect(children.map((c) => c._id).sort()).toEqual([91, 92, 93]);
    });

    it('should return empty array when no children exist', async () => {
      await db.create({
        _id: 94,
        parent: 0,
        properties: {},
        methods: {},
      });

      const children = await db.getChildren(94);
      expect(children).toEqual([]);
    });

    it('should not return grandchildren', async () => {
      // Create hierarchy: 95 -> 96 -> 97
      await db.create({ _id: 95, parent: 0, properties: {}, methods: {} });
      await db.create({ _id: 96, parent: 95, properties: {}, methods: {} });
      await db.create({ _id: 97, parent: 96, properties: {}, methods: {} });

      const children = await db.getChildren(95);
      expect(children.length).toBe(1);
      expect(children[0]._id).toBe(96);
    });
  });

  describe('exists()', () => {
    it('should return true for existing object', async () => {
      await db.create({
        _id: 100,
        parent: 0,
        properties: {},
        methods: {},
      });

      expect(await db.exists(100)).toBe(true);
    });

    it('should return false for non-existent object', async () => {
      expect(await db.exists(99999)).toBe(false);
    });

    it('should return true for recycled objects', async () => {
      await db.create({
        _id: 101,
        parent: 0,
        properties: {},
        methods: {},
      });

      await db.recycle(101);

      // Recycled objects still exist in the database
      expect(await db.exists(101)).toBe(true);
    });
  });

  describe('ensureRoot()', () => {
    it('should create root object if not exists', async () => {
      // Ensure no root exists
      await db.delete(1);
      expect(await db.exists(1)).toBe(false);

      await db.ensureRoot();

      const root = await db.get(1);
      expect(root).not.toBeNull();
      expect(root?._id).toBe(1);
      expect(root?.parent).toBe(0);
    });

    it('should not create root if it already exists', async () => {
      // Create root with custom properties
      await db.create({
        _id: 1,
        parent: 0,
        properties: { custom: 'data' },
        methods: {},
      });

      const beforeEnsure = await db.get(1);
      const createdDate = beforeEnsure?.created;

      // Wait to ensure different timestamp if recreated
      await new Promise((resolve) => setTimeout(resolve, 10));

      await db.ensureRoot();

      const afterEnsure = await db.get(1);

      // Should be same object (not recreated)
      expect(afterEnsure?.created.getTime()).toBe(createdDate?.getTime());
      expect(afterEnsure?.properties.custom).toBe('data');
    });
  });

  describe('listAll()', () => {
    it('should list all non-recycled objects', async () => {
      // Clean database
      await db['objects'].deleteMany({});

      await db.create({ _id: 110, parent: 0, properties: { a: 1 }, methods: {} });
      await db.create({ _id: 111, parent: 0, properties: { b: 2 }, methods: {} });
      await db.create({ _id: 112, parent: 0, properties: { c: 3 }, methods: {} });

      const all = await db.listAll();
      expect(all.length).toBe(3);
      expect(all.map((o) => o._id).sort()).toEqual([110, 111, 112]);
    });

    it('should exclude recycled objects', async () => {
      // Clean database
      await db['objects'].deleteMany({});

      await db.create({ _id: 120, parent: 0, properties: {}, methods: {} });
      await db.create({ _id: 121, parent: 0, properties: {}, methods: {} });
      await db.create({ _id: 122, parent: 0, properties: {}, methods: {} });

      // Recycle one object
      await db.recycle(121);

      const all = await db.listAll();
      expect(all.length).toBe(2);
      expect(all.map((o) => o._id).sort()).toEqual([120, 122]);
    });

    it('should return empty array when all objects are recycled', async () => {
      // Clean database
      await db['objects'].deleteMany({});

      await db.create({ _id: 130, parent: 0, properties: {}, methods: {} });
      await db.recycle(130);

      const all = await db.listAll();
      expect(all).toEqual([]);
    });
  });

  describe('Integration: Complete object lifecycle', () => {
    it('should handle create, update, recycle, reuse cycle', async () => {
      // Create object
      const obj1 = await db.create({
        _id: 200,
        parent: 0,
        properties: { name: 'Original', hp: 100 },
        methods: { attack: { code: 'return "slash";' } },
      });

      expect(obj1._id).toBe(200);
      expect(obj1.properties.name).toBe('Original');

      // Update object
      await db.update(200, {
        properties: { name: 'Updated', hp: 50 },
      });

      const obj2 = await db.get(200);
      expect(obj2?.properties.name).toBe('Updated');
      expect(obj2?.properties.hp).toBe(50);

      // Recycle object
      await db.recycle(200);

      const obj3 = await db.get(200);
      expect(obj3?.recycled).toBe(true);

      // Get next ID should return recycled ID
      const nextId = await db.getNextId();
      expect(nextId).toBe(200);

      // Reuse recycled ID
      const obj4 = await db.create({
        _id: 200,
        parent: 1,
        properties: { name: 'Reused', hp: 100 },
        methods: { defend: { code: 'return "block";' } },
      });

      expect(obj4._id).toBe(200);
      expect(obj4.properties.name).toBe('Reused');
      expect(obj4.recycled).toBe(false);

      // Created date preserved, modified date updated
      expect(obj4.created.getTime()).toBe(obj1.created.getTime());
      expect(obj4.modified.getTime()).toBeGreaterThan(obj1.modified.getTime());

      // Verify old methods are gone, new ones present
      expect(obj4.methods.attack).toBeUndefined();
      expect(obj4.methods.defend).toBeDefined();
    });

    it('should maintain parent-child relationships', async () => {
      // Create parent
      const parent = await db.create({
        _id: 300,
        parent: 0,
        properties: { type: 'container' },
        methods: {},
      });

      // Create children
      const child1 = await db.create({
        _id: 301,
        parent: 300,
        properties: { name: 'item1' },
        methods: {},
      });

      const child2 = await db.create({
        _id: 302,
        parent: 300,
        properties: { name: 'item2' },
        methods: {},
      });

      // Get children
      const children = await db.getChildren(300);
      expect(children.length).toBe(2);
      expect(children.map((c) => c._id).sort()).toEqual([301, 302]);

      // Update parent reference
      await db.update(301, { parent: 0 });

      // Children should be updated
      const newChildren = await db.getChildren(300);
      expect(newChildren.length).toBe(1);
      expect(newChildren[0]._id).toBe(302);

      const orphanedChildren = await db.getChildren(0);
      expect(orphanedChildren.some((c) => c._id === 301)).toBe(true);
    });
  });
});
