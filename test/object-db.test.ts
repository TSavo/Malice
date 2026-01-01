import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ObjectDatabase } from '../src/database/object-db.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
const TEST_DB_NAME = 'malice_test_object_db';

describe('ObjectDatabase', () => {
  let db: ObjectDatabase;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, TEST_DB_NAME);
    await db.connect();

    // Clean up test database before running tests
    await db.objects.deleteMany({});
  }, 15000);

  afterAll(async () => {
    // Clean up test database after all tests
    await db.objects.deleteMany({});
    await db.disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await db.objects.deleteMany({});
  });

  describe('connect()', () => {
    it('should connect to MongoDB successfully', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, `${TEST_DB_NAME}_connect`);
      await testDb.connect();

      // Verify connection by creating an object
      const obj = await testDb.create({
        _id: 1,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: { test: true },
        methods: {},
      });

      expect(obj._id).toBe(1);

      await testDb.objects.deleteMany({});
      await testDb.disconnect();
    });

    it('should return early when already connected (line 20)', async () => {
      const testDb = new ObjectDatabase(
        MONGO_URI,
        `${TEST_DB_NAME}_double_connect`,
      );

      // First connect
      await testDb.connect();
      expect(testDb.connected).toBe(true);

      // Second connect should return early
      await testDb.connect();
      expect(testDb.connected).toBe(true);

      await testDb.objects.deleteMany({});
      await testDb.disconnect();
    });

    it('should create indexes on connect', async () => {
      const testDb = new ObjectDatabase(MONGO_URI, `${TEST_DB_NAME}_indexes`);
      await testDb.connect();

      // Verify parent.value index exists
      const indexes = await testDb.objects.indexes();
      const parentIndex = indexes.find((idx) => idx.key['parent.value'] === 1);
      expect(parentIndex).toBeDefined();

      await testDb.objects.deleteMany({});
      await testDb.disconnect();
    });
  });

  describe('disconnect()', () => {
    it('should disconnect from MongoDB successfully', async () => {
      const testDb = new ObjectDatabase(
        MONGO_URI,
        `${TEST_DB_NAME}_disconnect`,
      );
      await testDb.connect();

      expect(testDb.connected).toBe(true);

      await testDb.disconnect();
      expect(testDb.connected).toBe(false);
    });

    it('should return early when not connected', async () => {
      const testDb = new ObjectDatabase(
        MONGO_URI,
        `${TEST_DB_NAME}_not_connected`,
      );

      // Try to disconnect without connecting first
      expect(testDb.connected).toBe(false);

      // Should not throw, just return early
      await expect(testDb.disconnect()).resolves.not.toThrow();

      expect(testDb.connected).toBe(false);
    });

    it('should handle multiple disconnects gracefully', async () => {
      const testDb = new ObjectDatabase(
        MONGO_URI,
        `${TEST_DB_NAME}_multi_disconnect`,
      );
      await testDb.connect();

      await testDb.disconnect();
      expect(testDb.connected).toBe(false);

      // Second disconnect should return early
      await testDb.disconnect();
      expect(testDb.connected).toBe(false);
    });
  });

  describe('create()', () => {
    it('should create a new object', async () => {
      const obj = await db.create({
        _id: 100,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: { name: 'Test Object' },
        methods: {},
      });

      expect(obj._id).toBe(100);
      expect(obj.parent).toEqual({ type: 'objref', target: 'object', id: 0 });
      expect(obj.properties.name).toBe('Test Object');
      expect(obj.created).toBeInstanceOf(Date);
      expect(obj.modified).toBeInstanceOf(Date);
      expect(obj.recycled).toBeUndefined();
    });

    it('should create new object when ID is not recycled', async () => {
      const obj = await db.create({
        _id: 300,
        parent: { type: 'objref', target: 'object', id: 0 },
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
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: {},
        methods: {},
      });

      await db.create({
        _id: 15,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: {},
        methods: {},
      });

      const nextId = await db.getNextId();
      expect(nextId).toBe(16); // One more than highest ID
    });
  });

  describe('get()', () => {
    it('should retrieve object by ID', async () => {
      await db.create({
        _id: 60,
        parent: { type: 'objref', target: 'object', id: 0 },
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
        parent: { type: 'objref', target: 'object', id: 0 },
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
      expect(obj?.modified.getTime()).toBeGreaterThan(
        beforeModified?.getTime(),
      );
    });

    it('should update object methods', async () => {
      await db.create({
        _id: 71,
        parent: { type: 'objref', target: 'object', id: 0 },
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

  describe('getChildren()', () => {
    it('should return all children of a parent object', async () => {
      // Create parent
      await db.create({
        _id: 90,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: { type: 'parent' },
        methods: {},
      });

      // Create children
      await db.create({
        _id: 91,
        parent: { type: 'objref', target: 'object', id: 90 },
        properties: { type: 'child1' },
        methods: {},
      });

      await db.create({
        _id: 92,
        parent: { type: 'objref', target: 'object', id: 90 },
        properties: { type: 'child2' },
        methods: {},
      });

      await db.create({
        _id: 93,
        parent: { type: 'objref', target: 'object', id: 90 },
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
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: {},
        methods: {},
      });

      const children = await db.getChildren(94);
      expect(children).toEqual([]);
    });

    it('should not return grandchildren', async () => {
      // Create hierarchy: 95 -> 96 -> 97
      await db.create({
        _id: 95,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: {},
        methods: {},
      });
      await db.create({
        _id: 96,
        parent: { type: 'objref', target: 'object', id: 95 },
        properties: {},
        methods: {},
      });
      await db.create({
        _id: 97,
        parent: { type: 'objref', target: 'object', id: 96 },
        properties: {},
        methods: {},
      });

      const children = await db.getChildren(95);
      expect(children.length).toBe(1);
      expect(children[0]._id).toBe(96);
    });
  });

  describe('exists()', () => {
    it('should return true for existing object', async () => {
      await db.create({
        _id: 100,
        parent: { type: 'objref', target: 'object', id: 0 },
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
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: {},
        methods: {},
      });

      // Mark as recycled via raw MongoDB (recycling is handled by $.recycler in game)
      await db.objects.updateOne({ _id: 101 }, { $set: { recycled: true } });

      // Recycled objects still exist in the database
      expect(await db.exists(101)).toBe(true);
    });
  });

  describe('ensureRoot()', () => {
    it('should create root object if not exists', async () => {
      // Ensure no root exists
      await db.objects.deleteOne({ _id: 1 });
      expect(await db.exists(1)).toBe(false);

      await db.ensureRoot();

      const root = await db.get(1);
      expect(root).not.toBeNull();
      expect(root?._id).toBe(1);
      expect(root?.parent).toEqual({ type: 'objref', target: 'object', id: 0 });
    });

    it('should not create root if it already exists', async () => {
      // Create root with custom properties
      await db.create({
        _id: 1,
        parent: { type: 'objref', target: 'object', id: 0 },
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
      await db.objects.deleteMany({});

      await db.create({
        _id: 110,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: { a: 1 },
        methods: {},
      });
      await db.create({
        _id: 111,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: { b: 2 },
        methods: {},
      });
      await db.create({
        _id: 112,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: { c: 3 },
        methods: {},
      });

      const all = await db.listAll();
      expect(all.length).toBe(3);
      expect(all.map((o) => o._id).sort()).toEqual([110, 111, 112]);
    });

    it('should exclude recycled objects', async () => {
      // Clean database
      await db.objects.deleteMany({});

      await db.create({
        _id: 120,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: {},
        methods: {},
      });
      await db.create({
        _id: 121,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: {},
        methods: {},
      });
      await db.create({
        _id: 122,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: {},
        methods: {},
      });

      // Mark as recycled via raw MongoDB (recycling is handled by $.recycler in game)
      await db.objects.updateOne({ _id: 121 }, { $set: { recycled: true } });

      const all = await db.listAll();
      expect(all.length).toBe(2);
      expect(all.map((o) => o._id).sort()).toEqual([120, 122]);
    });

    it('should return empty array when all objects are recycled', async () => {
      // Clean database
      await db.objects.deleteMany({});

      await db.create({
        _id: 130,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: {},
        methods: {},
      });
      // Mark as recycled via raw MongoDB (recycling is handled by $.recycler in game)
      await db.objects.updateOne({ _id: 130 }, { $set: { recycled: true } });

      const all = await db.listAll();
      expect(all).toEqual([]);
    });
  });

  describe('Integration: Complete object lifecycle', () => {
    it('should handle create and update cycle', async () => {
      // Create object
      const obj1 = await db.create({
        _id: 200,
        parent: { type: 'objref', target: 'object', id: 0 },
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

      // Verify modification timestamp updated
      expect(obj2?.modified.getTime()).toBeGreaterThan(obj1.created.getTime());
    });

    it('should maintain parent-child relationships', async () => {
      // Create parent
      const _parent = await db.create({
        _id: 300,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: { type: 'container' },
        methods: {},
      });

      // Create children
      const _child1 = await db.create({
        _id: 301,
        parent: { type: 'objref', target: 'object', id: 300 },
        properties: { name: 'item1' },
        methods: {},
      });

      const _child2 = await db.create({
        _id: 302,
        parent: { type: 'objref', target: 'object', id: 300 },
        properties: { name: 'item2' },
        methods: {},
      });

      // Get children
      const children = await db.getChildren(300);
      expect(children.length).toBe(2);
      expect(children.map((c) => c._id).sort()).toEqual([301, 302]);

      // Update parent reference
      await db.update(301, { parent: { type: 'objref', target: 'object', id: 0 } });

      // Children should be updated
      const newChildren = await db.getChildren(300);
      expect(newChildren.length).toBe(1);
      expect(newChildren[0]._id).toBe(302);

      const orphanedChildren = await db.getChildren(0);
      expect(orphanedChildren.some((c) => c._id === 301)).toBe(true);
    });
  });
});
