import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ObjectDatabase } from '../src/database/object-db.js';
import { ObjectManager } from '../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
const TEST_DB_NAME = 'malice_test_runtime_storage';

describe('ObjectManager.runtime', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, TEST_DB_NAME);
    await db.connect();
    await db.objects.deleteMany({});
    await db.ensureRoot();
    manager = new ObjectManager(db);
    await manager.loadAll();
  }, 15000);

  afterAll(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('runtime storage basics', () => {
    it('should store and retrieve runtime values', () => {
      manager.runtime.testKey = 'testValue';
      expect(manager.runtime.testKey).toBe('testValue');
    });

    it('should store objects', () => {
      const testObj = { id: 123, name: 'test' };
      manager.runtime.myObject = testObj;
      expect(manager.runtime.myObject).toEqual(testObj);
    });

    it('should store arrays', () => {
      const testArray = [1, 2, 3, 4];
      manager.runtime.myArray = testArray;
      expect(manager.runtime.myArray).toEqual(testArray);
    });

    it('should store null and undefined', () => {
      manager.runtime.nullValue = null;
      manager.runtime.undefinedValue = undefined;
      expect(manager.runtime.nullValue).toBe(null);
      expect(manager.runtime.undefinedValue).toBe(undefined);
    });

    it('should return undefined for non-existent keys', () => {
      expect(manager.runtime.nonExistentKey).toBeUndefined();
    });
  });

  describe('runtime storage operations', () => {
    it('should delete properties', () => {
      manager.runtime.toDelete = 'value';
      expect(manager.runtime.toDelete).toBe('value');

      delete manager.runtime.toDelete;
      expect(manager.runtime.toDelete).toBeUndefined();
    });

    it('should check property existence with "in" operator', () => {
      manager.runtime.existenceCheck = 123;
      expect('existenceCheck' in manager.runtime).toBe(true);
      expect('nonExistent' in manager.runtime).toBe(false);
    });

    it('should list keys with Object.keys', () => {
      manager.runtime.key1 = 'value1';
      manager.runtime.key2 = 'value2';
      manager.runtime.key3 = 'value3';

      const keys = Object.keys(manager.runtime);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should support getOwnPropertyDescriptor', () => {
      manager.runtime.descriptorTest = 'value';
      const descriptor = Object.getOwnPropertyDescriptor(
        manager.runtime,
        'descriptorTest',
      );

      expect(descriptor).toBeDefined();
      expect(descriptor?.configurable).toBe(true);
      expect(descriptor?.enumerable).toBe(true);
      expect(descriptor?.value).toBe('value');
    });

    it('should return undefined descriptor for non-existent keys', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        manager.runtime,
        'doesNotExist',
      );
      expect(descriptor).toBeUndefined();
    });
  });

  describe('runtime storage isolation', () => {
    it('should not persist across manager instances', async () => {
      // Store in first manager
      manager.runtime.isolationTest = 'should not persist';

      // Create new manager with same database
      const manager2 = new ObjectManager(db);
      await manager2.loadAll();

      // Should not have the runtime value
      expect(manager2.runtime.isolationTest).toBeUndefined();
    });

    it('should be separate from object properties', async () => {
      const root = await manager.load(0);
      expect(root).toBeDefined();

      // Store in runtime
      manager.runtime.testProp = 'runtime value';

      // Object should not have this property
      expect(root?.get('testProp')).toBeUndefined();
    });

    it('should not interfere with aliases', async () => {
      const root = await manager.load(0);
      if (!root) throw new Error('Root not found');

      const testObj = await manager.create({
        parent: root,
        properties: { name: 'RuntimeTest' },
      });

      manager.registerAlias('runtimeAliasTest', testObj);

      // Store something with similar name in runtime
      manager.runtime.runtimeAliasTest = 'runtime value';

      // Alias should still work correctly
      const aliasedObj = (manager as any).runtimeAliasTest;
      expect(aliasedObj.id).toBe(testObj.id);
      expect(aliasedObj.get('name')).toBe('RuntimeTest');

      // Runtime value should be separate
      expect(manager.runtime.runtimeAliasTest).toBe('runtime value');
    });
  });

  describe('runtime storage use cases', () => {
    it('should store Discord client references', () => {
      // Simulate Discord client storage
      const mockClient = {
        user: { id: '123', tag: 'Bot#1234' },
        isReady: () => true,
        destroy: () => {},
      };

      manager.runtime.client = mockClient;
      expect(manager.runtime.client).toBe(mockClient);
      expect((manager.runtime.client as any).user.tag).toBe('Bot#1234');
    });

    it('should store WebSocket connections', () => {
      const mockConnections = new Map();
      mockConnections.set('user1', { socket: 'ws1', active: true });
      mockConnections.set('user2', { socket: 'ws2', active: false });

      manager.runtime.connections = mockConnections;
      expect(manager.runtime.connections).toBe(mockConnections);
      expect((manager.runtime.connections as Map<string, any>).size).toBe(2);
    });

    it('should store multiple independent runtime states', () => {
      manager.runtime.discordClient = { type: 'discord' };
      manager.runtime.wsServer = { type: 'websocket' };
      manager.runtime.taskQueue = ['task1', 'task2'];
      manager.runtime.cache = new Map();

      expect(manager.runtime.discordClient).toBeDefined();
      expect(manager.runtime.wsServer).toBeDefined();
      expect(manager.runtime.taskQueue).toBeDefined();
      expect(manager.runtime.cache).toBeDefined();

      expect((manager.runtime.taskQueue as any[]).length).toBe(2);
    });
  });

  describe('runtime storage edge cases', () => {
    it('should handle rapid updates to same key', () => {
      for (let i = 0; i < 100; i++) {
        manager.runtime.counter = i;
      }
      expect(manager.runtime.counter).toBe(99);
    });

    it('should handle storing functions', () => {
      const testFn = () => 'hello';
      manager.runtime.myFunction = testFn;
      expect(manager.runtime.myFunction).toBe(testFn);
      expect((manager.runtime.myFunction as any)()).toBe('hello');
    });

    it('should handle storing class instances', () => {
      class TestClass {
        constructor(public value: string) {}
        getValue() {
          return this.value;
        }
      }

      const instance = new TestClass('test');
      manager.runtime.classInstance = instance;

      expect(manager.runtime.classInstance).toBe(instance);
      expect((manager.runtime.classInstance as TestClass).getValue()).toBe(
        'test',
      );
    });

    it('should handle overwriting values', () => {
      manager.runtime.overwrite = 'original';
      expect(manager.runtime.overwrite).toBe('original');

      manager.runtime.overwrite = 'updated';
      expect(manager.runtime.overwrite).toBe('updated');

      manager.runtime.overwrite = { nested: 'object' };
      expect((manager.runtime.overwrite as any).nested).toBe('object');
    });
  });
});
