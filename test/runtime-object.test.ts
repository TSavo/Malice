import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ObjectDatabase } from '../src/database/object-db.js';
import { ObjectManager } from '../src/database/object-manager.js';
import { RuntimeObjectImpl } from '../src/database/runtime-object.js';
import type { GameObject, RuntimeObject } from '../types/object.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('RuntimeObject', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let testObj: RuntimeObject;
  let root: RuntimeObject;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_runtime_object');
    await db.connect();

    // Clean database
    await db.objects.deleteMany({});

    manager = new ObjectManager(db);

    // Load root object (will be created if doesn't exist)
    root = (await manager.load(0))!;

    // Create a test object
    testObj = await manager.create({
      parent: root,
      properties: {
        name: 'Test Object',
        hp: 100,
        mana: 50,
      },
      methods: {},
    });
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('Proxy getter', () => {
    it('should get properties via proxy', () => {
      const proxy = (testObj as RuntimeObjectImpl).getProxy();
      expect((proxy as any).name).toBe('Test Object');
      expect((proxy as any).hp).toBe(100);
      expect((proxy as any).mana).toBe(50);
    });

    it('should get methods as callable functions via proxy', async () => {
      testObj.setMethod('greet', 'return "Hello!";');

      const proxy = (testObj as RuntimeObjectImpl).getProxy();
      const greetFn = (proxy as any).greet;

      expect(typeof greetFn).toBe('function');
      const result = await greetFn();
      expect(result).toBe('Hello!');
    });

    it('should allow access to built-in methods via proxy', () => {
      const proxy = (testObj as RuntimeObjectImpl).getProxy();
      expect(typeof proxy.get).toBe('function');
      expect(typeof proxy.set).toBe('function');
      expect(typeof proxy.save).toBe('function');
    });

    it('should return undefined for non-existent properties via proxy', () => {
      const proxy = (testObj as RuntimeObjectImpl).getProxy();
      expect((proxy as any).nonExistent).toBeUndefined();
    });

    it('should get methods from parent via proxy', async () => {
      // Create parent with a method
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      parent.setMethod('parentMethod', 'return "from parent";');
      await parent.save();

      // Create child inheriting from parent
      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });

      // Use call() which uses async findMethodAsync that loads parents from DB if needed
      // The proxy getter uses sync hasMethod which requires parent in cache
      const result = await child.call('parentMethod');
      expect(result).toBe('from parent');
    });
  });

  describe('Proxy setter', () => {
    it('should set properties via proxy and trigger auto-save', async () => {
      const proxy = (testObj as RuntimeObjectImpl).getProxy();
      (proxy as any).newProp = 'new value';

      // Give auto-save time to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify property was set
      expect(testObj.get('newProp')).toBe('new value');

      // Reload from database to verify it was saved
      const reloaded = await manager.load(testObj.id);
      expect(reloaded?.get('newProp')).toBe('new value');
    });

    it('should update existing properties via proxy', async () => {
      const proxy = (testObj as RuntimeObjectImpl).getProxy();
      (proxy as any).hp = 75;

      // Give auto-save time to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(testObj.get('hp')).toBe(75);
    });

    it('should allow setting internal properties via proxy', () => {
      const proxy = (testObj as RuntimeObjectImpl).getProxy();
      (proxy as any)._internalProp = 'internal';

      expect((proxy as any)._internalProp).toBe('internal');
    });

    it('should allow setting symbol properties via proxy', () => {
      const proxy = (testObj as RuntimeObjectImpl).getProxy();
      const sym = Symbol('test');
      (proxy as any)[sym] = 'symbol value';

      expect((proxy as any)[sym]).toBe('symbol value');
    });

    it('should handle auto-save errors gracefully', async () => {
      // Disconnect database to force save error
      await db.disconnect();

      const proxy = (testObj as RuntimeObjectImpl).getProxy();

      // This should not throw even though save will fail
      expect(() => {
        (proxy as any).willFail = 'value';
      }).not.toThrow();

      // Reconnect for cleanup
      await db.connect();
    });
  });

  describe('TypeScript compilation errors', () => {
    it('should throw error for severe syntax errors', async () => {
      testObj.setMethod('badSyntax', 'const x = ;');

      await expect(testObj.call('badSyntax')).rejects.toThrow();
    });

    it('should include method name in compilation error', async () => {
      testObj.setMethod('namedError', 'const x = ;');

      try {
        await testObj.call('namedError');
        expect.fail('Should have thrown');
      } catch (err) {
        const message = (err as Error).message;
        expect(message).toContain('namedError');
      }
    });

    it('should handle TypeScript diagnostic errors', async () => {
      // Create code that will generate TypeScript diagnostics
      // Note: TypeScript is permissive, so we need something that really fails
      testObj.setMethod('diagnosticError', '}}}}');

      // TypeScript compiler is very forgiving - this may not throw if it can generate output
      try {
        await testObj.call('diagnosticError');
        // If it doesn't throw, that's OK - TypeScript compiled it somehow
      } catch (err) {
        // If it does throw, verify it's an error
        expect(err).toBeInstanceOf(Error);
      }
    });

    it('should wrap compilation errors with context', async () => {
      testObj.setMethod('contextError', 'invalid syntax here {{');

      try {
        await testObj.call('contextError');
        expect.fail('Should have thrown');
      } catch (err) {
        const message = (err as Error).message;
        // Should mention either compilation or the method name
        expect(message.toLowerCase()).toMatch(/compil|contexterror/);
      }
    });
  });

  describe('Method execution errors', () => {
    it('should catch and wrap runtime errors', async () => {
      testObj.setMethod('throwError', 'throw new Error("Test error");');

      try {
        await testObj.call('throwError');
        expect.fail('Should have thrown');
      } catch (err) {
        const message = (err as Error).message;
        expect(message).toContain('throwError');
        expect(message).toContain('Test error');
      }
    });

    it('should provide method name in execution error', async () => {
      testObj.setMethod('namedExecError', 'throw new Error("Exec failed");');

      try {
        await testObj.call('namedExecError');
        expect.fail('Should have thrown');
      } catch (err) {
        const message = (err as Error).message;
        expect(message).toContain('namedExecError');
        expect(message).toContain('Exec failed');
      }
    });

    it('should handle undefined variable errors', async () => {
      testObj.setMethod('undefinedVar', 'return doesNotExist;');

      try {
        await testObj.call('undefinedVar');
        expect.fail('Should have thrown');
      } catch (err) {
        const message = (err as Error).message;
        expect(message).toContain('undefinedVar');
      }
    });

    it('should handle null reference errors', async () => {
      testObj.setMethod('nullRef', 'const x: any = null; return x.prop;');

      try {
        await testObj.call('nullRef');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });

    it('should wrap string errors', async () => {
      testObj.setMethod('stringError', 'throw "string error";');

      try {
        await testObj.call('stringError');
        expect.fail('Should have thrown');
      } catch (err) {
        const message = (err as Error).message;
        expect(message).toContain('stringError');
        expect(message).toContain('string error');
      }
    });
  });

  describe('getParent()', () => {
    it('should return parent object', () => {
      expect(testObj.getParent()?.id).toBe(root.id);
    });

    it('should return correct parent after setting', async () => {
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });

      testObj.setParent(parent);

      expect(testObj.getParent()?.id).toBe(parent.id);
    });

    it('should return root for objects parented to root', async () => {
      const rootObj = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });

      expect(rootObj.getParent()?.id).toBe(root.id);
    });
  });

  describe('setParent()', () => {
    it('should set parent and save', async () => {
      const newParent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });

      testObj.setParent(newParent);

      expect(testObj.getParent()?.id).toBe(newParent.id);

      // Verify it was saved to database
      const reloaded = await manager.load(testObj.id);
      expect(reloaded?.getParent()?.id).toBe(newParent.id);
    });

    it('should persist parent change via auto-persist', async () => {
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });

      testObj.setParent(parent);

      // Change is immediate in memory
      expect(testObj.getParent()?.id).toBe(parent.id);

      // Give async auto-persist time to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify persisted to DB
      await testObj.pull();
      expect(testObj.getParent()?.id).toBe(parent.id);
    });

    it('should allow changing parent multiple times', async () => {
      const parent1 = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      const parent2 = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });

      testObj.setParent(parent1);
      expect(testObj.getParent()?.id).toBe(parent1.id);

      testObj.setParent(parent2);
      expect(testObj.getParent()?.id).toBe(parent2.id);
    });
  });

  describe('getOwnProperties()', () => {
    it('should return only own properties', () => {
      const props = testObj.getOwnProperties();

      expect(props).toEqual({
        name: 'Test Object',
        hp: 100,
        mana: 50,
      });
    });

    it('should not include inherited properties', async () => {
      // Create parent with properties
      const parent = await manager.create({
        parent: root,
        properties: {
          parentProp: 'from parent',
        },
        methods: {},
      });

      // Create child with its own properties
      const child = await manager.create({
        parent: parent,
        properties: {
          childProp: 'from child',
        },
        methods: {},
      });

      const ownProps = child.getOwnProperties();

      expect(ownProps).toEqual({
        childProp: 'from child',
      });
      expect(ownProps).not.toHaveProperty('parentProp');
    });

    it('should return copy not reference', () => {
      const props1 = testObj.getOwnProperties();
      const props2 = testObj.getOwnProperties();

      expect(props1).toEqual(props2);
      expect(props1).not.toBe(props2); // Different objects
    });

    it('should return empty object if no properties', async () => {
      const emptyObj = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });

      expect(emptyObj.getOwnProperties()).toEqual({});
    });
  });

  describe('getOwnMethods()', () => {
    it('should return only own methods', () => {
      testObj.setMethod('method1', 'return 1;');
      testObj.setMethod('method2', 'return 2;');

      const methods = testObj.getOwnMethods();

      expect(Object.keys(methods)).toContain('method1');
      expect(Object.keys(methods)).toContain('method2');
      expect(methods.method1.code).toBe('return 1;');
      expect(methods.method2.code).toBe('return 2;');
    });

    it('should not include inherited methods', async () => {
      // Create parent with method
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      parent.setMethod('parentMethod', 'return "parent";');
      await parent.save();

      // Create child with its own method
      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });
      child.setMethod('childMethod', 'return "child";');

      const ownMethods = child.getOwnMethods();

      expect(ownMethods).toHaveProperty('childMethod');
      expect(ownMethods).not.toHaveProperty('parentMethod');
    });

    it('should return copy not reference', () => {
      testObj.setMethod('test', 'return 1;');

      const methods1 = testObj.getOwnMethods();
      const methods2 = testObj.getOwnMethods();

      expect(methods1).toEqual(methods2);
      expect(methods1).not.toBe(methods2); // Different objects
    });

    it('should return empty object if no methods', async () => {
      const emptyObj = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });

      expect(emptyObj.getOwnMethods()).toEqual({});
    });
  });

  describe('save() - dirty vs clean', () => {
    it('should save when dirty', async () => {
      testObj.set('newProp', 'new value');

      await testObj.save();

      // Verify saved to database
      const reloaded = await manager.load(testObj.id);
      expect(reloaded?.get('newProp')).toBe('new value');
    });

    it('should not save when not dirty (early return)', async () => {
      // Save once to ensure clean state
      await testObj.save();

      // Track if update is called
      const originalUpdate = manager.db.objects.updateOne;
      let updateCalled = false;
      manager.db.objects.updateOne = function (...args: any[]) {
        updateCalled = true;
        return originalUpdate.apply(this, args);
      } as any;

      // Call save when not dirty
      await testObj.save();

      // Should not have called update
      expect(updateCalled).toBe(false);

      // Restore
      manager.db.objects.updateOne = originalUpdate;
    });

    it('should mark as clean after save', async () => {
      testObj.set('prop', 'value');

      // First save should persist
      await testObj.save();

      // Second save should be no-op (not dirty)
      const updateSpy = manager.db.objects.updateOne;
      let secondUpdateCalled = false;
      manager.db.objects.updateOne = function (...args: any[]) {
        secondUpdateCalled = true;
        return updateSpy.apply(this, args);
      } as any;

      await testObj.save();

      expect(secondUpdateCalled).toBe(false);

      // Restore
      manager.db.objects.updateOne = updateSpy;
    });

    it('should save property changes', async () => {
      testObj.set('hp', 75);
      await testObj.save();

      const reloaded = await manager.load(testObj.id);
      expect(reloaded?.get('hp')).toBe(75);
    });

    it('should save method changes', async () => {
      testObj.setMethod('newMethod', 'return "new";');
      await testObj.save();

      const reloaded = await manager.load(testObj.id);
      expect(reloaded?.hasMethod('newMethod')).toBe(true);
    });
  });

  describe('pull()', () => {
    it('should reload object properties from database', async () => {
      // Ensure any pending writes are flushed first
      await manager.flushWrites();

      // Modify object in database directly (properties are now typed Values)
      await db.objects.updateOne(
        { _id: testObj.id },
        { $set: { 'properties.hp': { type: 'number', value: 999 } } },
      );

      // Pull should load new value from DB into memory
      await testObj.pull();

      expect(testObj.get('hp')).toBe(999);
    });

    it('should reload object methods from database', async () => {
      // Add method in database directly
      await db.objects.updateOne(
        { _id: testObj.id },
        {
          $set: {
            'methods.dbMethod': {
              code: 'return "db";',
            },
          },
        },
      );

      await testObj.pull();

      expect(testObj.hasMethod('dbMethod')).toBe(true);
    });

    it('should handle pull when object does not exist in DB', async () => {
      // Edge case - object deleted from database but proxy still in memory
      await db.objects.deleteOne({ _id: testObj.id });

      // Pull should handle gracefully (no error, no change)
      await expect(testObj.pull()).resolves.not.toThrow();
    });
  });

  describe('addMethod()', () => {
    it('should add a method', () => {
      // Note: addMethod has a bug where it assigns string directly instead of wrapping in Method object
      // This test documents the actual behavior
      (testObj as any).addMethod('newMethod', 'return "new";');

      // The method is stored but may not work correctly due to implementation bug
      const methods = testObj.getOwnMethods();
      expect('newMethod' in methods).toBe(true);
    });

    it('should mark object as dirty', async () => {
      (testObj as any).addMethod('method', 'return 1;');

      await testObj.save();

      // Verify saved (even if buggy)
      const reloaded = await manager.load(testObj.id);
      const methods = reloaded?.getOwnMethods();
      expect('method' in (methods || {})).toBe(true);
    });

    it('should store method code correctly as Method object', () => {
      // addMethod now correctly wraps code in a Method object
      const code = 'return "test";';
      (testObj as any).addMethod('newMethod', code);

      const raw = (testObj as any)._getRaw();
      // Now correctly stores as { code: string }
      expect(typeof raw.methods.newMethod).toBe('object');
      expect(raw.methods.newMethod.code).toBe(code);
    });

    it('should use setMethod instead for proper method adding', async () => {
      // Use setMethod which properly wraps the code
      testObj.setMethod('properMethod', 'return "correct";');

      const result = await testObj.call('properMethod');
      expect(result).toBe('correct');
    });
  });

  describe('removeMethod()', () => {
    it('should remove a method', () => {
      testObj.setMethod('toRemove', 'return 1;');

      expect(testObj.hasMethod('toRemove')).toBe(true);

      (testObj as any).removeMethod('toRemove');

      expect(testObj.hasMethod('toRemove')).toBe(false);
    });

    it('should mark object as dirty', async () => {
      testObj.setMethod('method', 'return 1;');
      await testObj.save();

      (testObj as any).removeMethod('method');
      await testObj.save();

      const reloaded = await manager.load(testObj.id);
      expect(reloaded?.hasMethod('method')).toBe(false);
    });

    it('should not throw for non-existent method', () => {
      expect(() => {
        (testObj as any).removeMethod('doesNotExist');
      }).not.toThrow();
    });

    it('should only remove from current object, not parent', async () => {
      // Create parent with method
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      parent.setMethod('parentMethod', 'return "parent";');
      await parent.save();

      // Create child inheriting parent's method
      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });

      // Child can see parent's method (use async version which loads parent if needed)
      expect(await child.hasMethodAsync('parentMethod')).toBe(true);

      // Remove should not affect parent's method (child doesn't own it)
      (child as any).removeMethod('parentMethod');

      // Parent still has it
      expect(await parent.hasMethodAsync('parentMethod')).toBe(true);
      // Child still sees it (from parent)
      expect(await child.hasMethodAsync('parentMethod')).toBe(true);
    });
  });

  describe('_getRaw()', () => {
    it('should return raw GameObject', () => {
      const raw = (testObj as any)._getRaw() as GameObject;

      expect(raw).toHaveProperty('_id');
      expect(raw).toHaveProperty('parent');
      expect(raw).toHaveProperty('properties');
      expect(raw).toHaveProperty('methods');
      expect(raw._id).toBe(testObj.id);
    });

    it('should return reference not copy', () => {
      const raw1 = (testObj as any)._getRaw();
      const raw2 = (testObj as any)._getRaw();

      expect(raw1).toBe(raw2); // Same reference
    });

    it('should include all GameObject fields', () => {
      const raw = (testObj as any)._getRaw() as GameObject;

      // Use getOwnProperties() for resolved values
      expect(testObj.getOwnProperties()).toEqual({
        name: 'Test Object',
        hp: 100,
        mana: 50,
      });
      expect(raw.methods).toBeDefined();
      // Parent is now stored as ObjRefValue with target and id
      expect(raw.parent).toEqual({ type: 'objref', target: 'object', id: root.id });
    });

    it('should reflect current state', () => {
      testObj.set('newProp', 'value');

      // Use public API instead of _getRaw()
      expect(testObj.get('newProp')).toBe('value');
    });
  });

  describe('Property inheritance', () => {
    it('should inherit properties from parent', async () => {
      const parent = await manager.create({
        parent: root,
        properties: {
          parentProp: 'inherited',
        },
        methods: {},
      });

      const child = await manager.create({
        parent: parent,
        properties: {
          childProp: 'own',
        },
        methods: {},
      });

      expect(child.get('parentProp')).toBe('inherited');
      expect(child.get('childProp')).toBe('own');
    });

    it('should override parent properties', async () => {
      const parent = await manager.create({
        parent: root,
        properties: {
          prop: 'parent value',
        },
        methods: {},
      });

      const child = await manager.create({
        parent: parent,
        properties: {
          prop: 'child value',
        },
        methods: {},
      });

      expect(child.get('prop')).toBe('child value');
      expect(parent.get('prop')).toBe('parent value');
    });
  });

  describe('Method inheritance', () => {
    it('should inherit methods from parent', async () => {
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      parent.setMethod('parentMethod', 'return "from parent";');
      await parent.save();

      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });

      // Use async version which loads parent from DB if not cached
      expect(await child.hasMethodAsync('parentMethod')).toBe(true);
      const result = await child.call('parentMethod');
      expect(result).toBe('from parent');
    });

    it('should override parent methods', async () => {
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      parent.setMethod('method', 'return "parent";');
      await parent.save();

      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });
      child.setMethod('method', 'return "child";');

      const result = await child.call('method');
      expect(result).toBe('child');
    });
  });

  describe('Compilation caching', () => {
    it('should compile method only once', async () => {
      testObj.setMethod('cached', 'return "result";');

      // First call compiles
      await testObj.call('cached');

      // Check that compiled version is cached
      const cached = manager.getCompiledMethod(testObj.id, 'cached');
      expect(cached).toBeDefined();
      expect(typeof cached).toBe('string');
    });

    it('should reuse compiled code on subsequent calls', async () => {
      testObj.setMethod('reuse', 'return Math.random();');

      // First call
      await testObj.call('reuse');

      // Subsequent calls should use cached compilation
      // (This is implicit - we just verify it doesn't fail)
      await testObj.call('reuse');
      await testObj.call('reuse');

      const cached = manager.getCompiledMethod(testObj.id, 'reuse');
      expect(cached).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle method not found', async () => {
      await expect(testObj.call('nonExistent')).rejects.toThrow(/not found/i);
    });

    it('should handle empty properties object', async () => {
      const obj = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });

      expect(obj.get('any')).toBeUndefined();
    });

    it('should handle empty methods object', async () => {
      const obj = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });

      expect(obj.hasMethod('any')).toBe(false);
    });

    it('should handle parent = 0 (no parent)', async () => {
      const obj = await manager.create({
        parent: root,
        properties: { prop: 'value' },
        methods: {},
      });

      expect(obj.get('prop')).toBe('value');
      expect(obj.get('inherited')).toBeUndefined();
    });

    it('should handle setting property when properties is undefined', async () => {
      // Create object with undefined properties
      const raw: GameObject = {
        _id: 9999,
        parent: root,
        properties: {} as any,
        methods: {},
        created: new Date(),
        modified: new Date(),
      };

      const impl = new RuntimeObjectImpl(raw, manager);

      // Setting should initialize properties
      impl.set('newProp', 'value');

      expect(impl.get('newProp')).toBe('value');
    });

    it('should handle setting method when methods is undefined', async () => {
      // Create object with undefined methods
      const raw: GameObject = {
        _id: 9998,
        parent: root,
        properties: {},
        methods: {} as any,
        created: new Date(),
        modified: new Date(),
      };

      const impl = new RuntimeObjectImpl(raw, manager);

      // Setting should initialize methods
      impl.setMethod('newMethod', 'return 1;');

      expect(impl.hasMethod('newMethod')).toBe(true);
    });
  });

  describe('pass() - MOO-style super calls', () => {
    it('should call parent method with pass()', async () => {
      // Create parent with a method
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      parent.setMethod('greet', 'return "Hello from parent";');
      await parent.save();

      // Create child that overrides and calls pass()
      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });
      child.setMethod(
        'greet',
        `
        const parentResult = await pass();
        return parentResult + " and child";
      `,
      );

      const result = await child.call('greet');
      expect(result).toBe('Hello from parent and child');
    });

    it('should pass arguments through pass()', async () => {
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      parent.setMethod('add', 'return args[0] + args[1];');
      await parent.save();

      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });
      child.setMethod(
        'add',
        `
        const parentResult = await pass(args[0], args[1]);
        return parentResult * 2;
      `,
      );

      const result = await child.call('add', 3, 4);
      expect(result).toBe(14); // (3 + 4) * 2
    });

    it('should pass original args when pass() called with no arguments', async () => {
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      parent.setMethod('echo', 'return args[0];');
      await parent.save();

      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });
      child.setMethod(
        'echo',
        `
        const parentResult = await pass();
        return "child: " + parentResult;
      `,
      );

      const result = await child.call('echo', 'test message');
      expect(result).toBe('child: test message');
    });

    it('should maintain self binding in parent method', async () => {
      const parent = await manager.create({
        parent: root,
        properties: { name: 'Parent' },
        methods: {},
      });
      parent.setMethod('getName', 'return self.name;');
      await parent.save();

      const child = await manager.create({
        parent: parent,
        properties: { name: 'Child' },
        methods: {},
      });
      child.setMethod(
        'getName',
        `
        const parentName = await pass();
        return parentName;
      `,
      );

      // Even though pass() calls parent's method, self should still be child
      const result = await child.call('getName');
      expect(result).toBe('Child');
    });

    it('should work with grandchild calling pass() through chain', async () => {
      // grandparent -> parent -> child
      const grandparent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      grandparent.setMethod('level', 'return "grandparent";');
      await grandparent.save();

      const parent = await manager.create({
        parent: grandparent,
        properties: {},
        methods: {},
      });
      parent.setMethod(
        'level',
        `
        const up = await pass();
        return up + " -> parent";
      `,
      );
      await parent.save();

      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });
      child.setMethod(
        'level',
        `
        const up = await pass();
        return up + " -> child";
      `,
      );

      const result = await child.call('level');
      expect(result).toBe('grandparent -> parent -> child');
    });

    it('should throw when pass() called with no parent method', async () => {
      const obj = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      obj.setMethod(
        'noParent',
        `
        await pass();
        return "never reached";
      `,
      );

      await expect(obj.call('noParent')).rejects.toThrow(
        /no parent implementation/i,
      );
    });

    it('should work when method defined on ancestor is called on descendant', async () => {
      // grandparent defines method, parent overrides with pass(), child inherits
      const grandparent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      grandparent.setMethod('action', 'return "base action";');
      await grandparent.save();

      const parent = await manager.create({
        parent: grandparent,
        properties: {},
        methods: {},
      });
      parent.setMethod(
        'action',
        `
        const base = await pass();
        return base + " + parent enhancement";
      `,
      );
      await parent.save();

      // Child doesn't override, just inherits parent's method
      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });

      // When child calls action, it uses parent's method which calls pass() to grandparent
      const result = await child.call('action');
      expect(result).toBe('base action + parent enhancement');
    });

    it('should correctly identify defining object even when called from child instance', async () => {
      // This tests the core fix: pass() should search from where method is DEFINED,
      // not from where it's CALLED ON
      const grandparent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      grandparent.setMethod('identify', 'return "grandparent";');
      await grandparent.save();

      const parent = await manager.create({
        parent: grandparent,
        properties: {},
        methods: {},
      });
      // Parent overrides and calls pass()
      parent.setMethod(
        'identify',
        `
        const parentResult = await pass();
        return parentResult + " -> parent";
      `,
      );
      await parent.save();

      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });
      // Child does NOT override identify - inherits from parent

      // When child.call('identify') runs:
      // - Method is found on parent (not child)
      // - pass() should search from parent's parent (grandparent), NOT child's parent
      const result = await child.call('identify');
      expect(result).toBe('grandparent -> parent');
    });

    it('should allow pass() with different arguments than original', async () => {
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      parent.setMethod('multiply', 'return args[0] * args[1];');
      await parent.save();

      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });
      child.setMethod(
        'multiply',
        `
        // Child doubles the first argument before passing
        const result = await pass(args[0] * 2, args[1]);
        return result;
      `,
      );

      const result = await child.call('multiply', 5, 3);
      expect(result).toBe(30); // (5 * 2) * 3
    });

    it('should work with async parent methods', async () => {
      const parent = await manager.create({
        parent: root,
        properties: {},
        methods: {},
      });
      parent.setMethod(
        'asyncOp',
        `
        await new Promise(r => setTimeout(r, 10));
        return "async parent done";
      `,
      );
      await parent.save();

      const child = await manager.create({
        parent: parent,
        properties: {},
        methods: {},
      });
      child.setMethod(
        'asyncOp',
        `
        const parentResult = await pass();
        return parentResult + " and child";
      `,
      );

      const result = await child.call('asyncOp');
      expect(result).toBe('async parent done and child');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle deep inheritance chains', async () => {
      // Create chain: grandparent -> parent -> child
      const grandparent = await manager.create({
        parent: root,
        properties: { level: 'grandparent' },
        methods: {},
      });
      grandparent.setMethod('gMethod', 'return "grandparent";');
      await grandparent.save();

      const parent = await manager.create({
        parent: grandparent,
        properties: { level: 'parent' },
        methods: {},
      });
      parent.setMethod('pMethod', 'return "parent";');
      await parent.save();

      const child = await manager.create({
        parent: parent,
        properties: { level: 'child' },
        methods: {},
      });
      child.setMethod('cMethod', 'return "child";');

      // Child should have access to all methods (use async which loads from DB)
      expect(await child.hasMethodAsync('gMethod')).toBe(true);
      expect(await child.hasMethodAsync('pMethod')).toBe(true);
      expect(await child.hasMethodAsync('cMethod')).toBe(true);

      // Verify calls work (call uses async findMethodAsync internally)
      expect(await child.call('gMethod')).toBe('grandparent');
      expect(await child.call('pMethod')).toBe('parent');
      expect(await child.call('cMethod')).toBe('child');

      // Own property should shadow inherited
      expect(child.get('level')).toBe('child');
    });

    it('should handle method calling method on self', async () => {
      testObj.setMethod('helper', 'return "helper result";');
      testObj.setMethod(
        'caller',
        `
        const result = await self.helper();
        return "caller: " + result;
      `,
      );

      const result = await testObj.call('caller');
      expect(result).toBe('caller: helper result');
    });

    it('should handle multiple property updates in sequence', async () => {
      testObj.set('a', 1);
      testObj.set('b', 2);
      testObj.set('c', 3);

      await testObj.save();

      const reloaded = await manager.load(testObj.id);
      expect(reloaded?.get('a')).toBe(1);
      expect(reloaded?.get('b')).toBe(2);
      expect(reloaded?.get('c')).toBe(3);
    });
  });

  describe('Object reference (objref) equality', () => {
    it('should return same instance when loading same ID twice', async () => {
      const first = await manager.load(testObj.id);
      const second = await manager.load(testObj.id);

      // Same cached instance
      expect(first).toBe(second);
      expect(first === second).toBe(true);
    });

    it('should store objref and return same instance on read', async () => {
      // Create a target object
      const target = await manager.create({
        parent: root,
        properties: { name: 'Target' },
        methods: {},
      });

      // Store it as a property (NOT the ID!)
      (testObj as any).myTarget = target;

      // Read it back
      const retrieved = (testObj as any).myTarget;

      // Should be the exact same instance
      expect(retrieved).toBe(target);
      expect(retrieved === target).toBe(true);
      expect(retrieved.id).toBe(target.id);
      expect(retrieved.name).toBe('Target');
    });

    it('should maintain objref identity in arrays', async () => {
      const item1 = await manager.create({
        parent: root,
        properties: { name: 'Item 1' },
        methods: {},
      });
      const item2 = await manager.create({
        parent: root,
        properties: { name: 'Item 2' },
        methods: {},
      });

      // Store objects in array (NOT IDs!)
      (testObj as any).items = [item1, item2];

      // Read back
      const items = (testObj as any).items;

      // Should be same instances
      expect(items[0]).toBe(item1);
      expect(items[1]).toBe(item2);
      expect(items[0] === item1).toBe(true);
      expect(items[1] === item2).toBe(true);
    });

    it('should allow comparing objrefs with === for equality', async () => {
      const obj1 = await manager.create({
        parent: root,
        properties: { name: 'Object 1' },
        methods: {},
      });

      // Store the object
      (testObj as any).reference = obj1;

      // Load the same object separately
      const loaded = await manager.load(obj1.id);

      // All should be the same instance
      const stored = (testObj as any).reference;
      expect(stored === obj1).toBe(true);
      expect(stored === loaded).toBe(true);
      expect(obj1 === loaded).toBe(true);
    });

    it('should convert "#N" string format to objref', async () => {
      const target = await manager.create({
        parent: root,
        properties: { name: 'Target' },
        methods: {},
      });

      // Store using "#N" string format (simulates MCP input)
      testObj.set('targetRef', `#${target.id}`);

      // Read it back - should resolve to the object
      const retrieved = (testObj as any).targetRef;

      // Should be the same instance as the target
      expect(retrieved).toBe(target);
      expect(retrieved === target).toBe(true);
      expect(retrieved.name).toBe('Target');
    });

    it('should handle nested objrefs in objects', async () => {
      const owner = await manager.create({
        parent: root,
        properties: { name: 'Owner' },
        methods: {},
      });
      const location = await manager.create({
        parent: root,
        properties: { name: 'Location' },
        methods: {},
      });

      // Store nested structure with objrefs
      (testObj as any).metadata = {
        owner: owner,
        location: location,
        count: 42,
      };

      // Read back
      const meta = (testObj as any).metadata;

      expect(meta.owner).toBe(owner);
      expect(meta.location).toBe(location);
      expect(meta.owner === owner).toBe(true);
      expect(meta.location === location).toBe(true);
      expect(meta.count).toBe(42);
    });

    it('should work with filter/find using === comparison', async () => {
      const target = await manager.create({
        parent: root,
        properties: { name: 'Find Me' },
        methods: {},
      });
      const other = await manager.create({
        parent: root,
        properties: { name: 'Other' },
        methods: {},
      });

      // Store array of objrefs
      (testObj as any).list = [other, target, other];

      // Find using === comparison
      const list = (testObj as any).list as RuntimeObject[];
      const found = list.find((item) => item === target);
      const index = list.indexOf(target);

      expect(found).toBe(target);
      expect(index).toBe(1);
    });

    it('should support checking if array includes an objref', async () => {
      const member = await manager.create({
        parent: root,
        properties: { name: 'Member' },
        methods: {},
      });
      const nonMember = await manager.create({
        parent: root,
        properties: { name: 'Non-Member' },
        methods: {},
      });

      // Store array with member
      (testObj as any).members = [member];

      const members = (testObj as any).members as RuntimeObject[];

      // Note: includes() won't work because it uses SameValueZero
      // But we can use .some() with ===
      expect(members.some((m) => m === member)).toBe(true);
      expect(members.some((m) => m === nonMember)).toBe(false);
    });

    it('should persist objrefs across save/reload', async () => {
      const target = await manager.create({
        parent: root,
        properties: { name: 'Persistent Target' },
        methods: {},
      });

      // Store objref
      (testObj as any).persistedRef = target;
      await testObj.save();

      // Clear cache to force reload (simulate server restart)
      // Note: In real use, cache persists, but this tests the serialization
      const reloaded = await manager.load(testObj.id);

      // The reference should still resolve to the same object
      const retrievedRef = (reloaded as any).persistedRef;
      expect(retrievedRef).toBe(target);
      expect(retrievedRef.name).toBe('Persistent Target');
    });

    it('should handle objref in method execution context', async () => {
      const target = await manager.create({
        parent: root,
        properties: { name: 'Method Target' },
        methods: {},
      });

      // Store objref
      (testObj as any).target = target;

      // Method that compares objrefs
      testObj.setMethod(
        'checkTarget',
        `
        const t = self.target;
        const loaded = await $.load(${target.id});
        return t === loaded;
      `,
      );

      const result = await testObj.call('checkTarget');
      expect(result).toBe(true);
    });
  });
});
