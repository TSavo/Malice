import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ObjectDatabase } from '../src/database/object-db.js';
import { ObjectManager } from '../src/database/object-manager.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('MongoDB Change Stream Cache Invalidation', () => {
  let db1: ObjectDatabase;
  let db2: ObjectDatabase;
  let manager1: ObjectManager;
  let manager2: ObjectManager;

  beforeAll(async () => {
    // Create two separate database connections (simulating two servers)
    db1 = new ObjectDatabase(MONGO_URI, 'malice_test_changestream');
    db2 = new ObjectDatabase(MONGO_URI, 'malice_test_changestream');

    await db1.connect();
    await db2.connect();

    // Clean up test database
    await db1['objects'].deleteMany({});

    // Create root object
    await db1.ensureRoot();

    // Create two ObjectManagers (simulating two game servers)
    manager1 = new ObjectManager(db1);
    manager2 = new ObjectManager(db2);

    // Give change streams time to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, 15000);

  afterAll(async () => {
    await db1.disconnect();
    await db2.disconnect();
  });

  it('should invalidate cache when another server modifies an object', async () => {
    // Server 1: Create an object
    const obj1 = await manager1.create({
      parent: 1,
      properties: { hp: 100 },
      methods: {},
    });

    const id = obj1.id;

    // Server 2: Load the same object (caches it)
    const obj2 = await manager2.load(id);
    expect(obj2?.get('hp')).toBe(100);

    // Verify Server 2 has it cached
    expect(manager2.getCacheSize()).toBeGreaterThan(0);

    // Server 1: Modify the object directly in database (properties are typed Values)
    await db1.update(id, {
      properties: { hp: { type: 'number', value: 50 } },
    });

    // Wait for change stream to propagate
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Server 2: Cache should be invalidated
    // Next load should fetch fresh data from MongoDB
    const obj2Updated = await manager2.load(id);
    expect(obj2Updated?.get('hp')).toBe(50);
  }, 10000);

  it('should invalidate cache when DevTools modifies a method', async () => {
    // Server 1: Create an object with a method
    const obj1 = await manager1.create({
      parent: 1,
      properties: {},
      methods: {},
    });
    obj1.setMethod('greet', 'return "Hello";');
    await obj1.save();

    const id = obj1.id;

    // Server 2: Load and execute method (caches it)
    const obj2 = await manager2.load(id);
    const result1 = await obj2!.call('greet');
    expect(result1).toBe('Hello');

    // DevTools: Modify the method directly (simulating VS Code edit)
    await db1.update(id, {
      methods: {
        greet: { code: 'return "Hello, World!";' },
      },
    });

    // Invalidate Server 1's cache (DevTools would do this)
    manager1.invalidate(id);

    // Wait for change stream to propagate to Server 2
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Server 2: Load again (should have fresh code)
    const obj2Updated = await manager2.load(id);
    const result2 = await obj2Updated!.call('greet');
    expect(result2).toBe('Hello, World!');
  }, 10000);

  it('should handle concurrent writes to different objects', async () => {
    // Create two objects
    const obj1 = await manager1.create({
      parent: 1,
      properties: { name: 'Object A' },
      methods: {},
    });

    const obj2 = await manager1.create({
      parent: 1,
      properties: { name: 'Object B' },
      methods: {},
    });

    // Wait for write tracking to clear (trackWrite has 2 second timeout)
    await new Promise((resolve) => setTimeout(resolve, 2100));

    // Server 1: Modify object A (properties are typed Values)
    const updatePromise1 = db1.update(obj1.id, {
      properties: { name: { type: 'string', value: 'Object A Modified' } },
    });

    // Server 2: Modify object B (at the same time, properties are typed Values)
    const updatePromise2 = db2.update(obj2.id, {
      properties: { name: { type: 'string', value: 'Object B Modified' } },
    });

    // Wait for both updates to complete
    await Promise.all([updatePromise1, updatePromise2]);

    // Wait for change streams
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Both servers should see both changes
    const objA1 = await manager1.load(obj1.id);
    const objB1 = await manager1.load(obj2.id);
    const objA2 = await manager2.load(obj1.id);
    const objB2 = await manager2.load(obj2.id);

    expect(objA1?.get('name')).toBe('Object A Modified');
    expect(objB1?.get('name')).toBe('Object B Modified');
    expect(objA2?.get('name')).toBe('Object A Modified');
    expect(objB2?.get('name')).toBe('Object B Modified');
  }, 10000);
});
