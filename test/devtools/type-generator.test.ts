/**
 * TypeGenerator Tests
 * Tests TypeScript .d.ts generation from MongoDB objects
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TypeGenerator } from '../../src/devtools/type-generator.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { ObjectDatabase } from '../../src/database/object-db.js';

describe('TypeGenerator', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let generator: TypeGenerator;

  beforeAll(async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
    db = new ObjectDatabase(MONGO_URI, 'malice_test_typegen');

    await Promise.race([
      db.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000))
    ]);

    manager = new ObjectManager(db);
  }, 20000);

  afterAll(async () => {
    if (db) {
      await db.disconnect();
    }
  });

  beforeEach(async () => {
    // Clear test data
    await db['objects'].deleteMany({});
    await db.ensureRoot();
    manager.clearCache();

    generator = new TypeGenerator(manager);
  });

  describe('Basic Type Generation', () => {
    it('should generate header and base types', async () => {
      const types = await generator.generate();

      expect(types).toContain('// Auto-generated from MongoDB - DO NOT EDIT');
      expect(types).toContain('interface RuntimeObject');
      expect(types).toContain('interface GameObject');
      expect(types).toContain('interface ConnectionContext');
      expect(types).toContain('interface ObjectManager');
    });

    it('should include global declarations', async () => {
      const types = await generator.generate();

      expect(types).toContain('declare const self: RuntimeObject');
      expect(types).toContain('declare const $: ObjectManager');
      expect(types).toContain('declare const args: any[]');
    });
  });

  describe('Property Type Inference', () => {
    it('should infer string type', async () => {
      await manager.create({
        parent: 1,
        properties: { name: 'TestObject' },
        methods: {},
      });

      const types = await generator.generate();

      expect(types).toContain('name: string');
    });

    it('should infer number type', async () => {
      await manager.create({
        parent: 1,
        properties: { count: 42 },
        methods: {},
      });

      const types = await generator.generate();

      expect(types).toContain('count: number');
    });

    it('should infer boolean type', async () => {
      await manager.create({
        parent: 1,
        properties: { enabled: true },
        methods: {},
      });

      const types = await generator.generate();

      expect(types).toContain('enabled: boolean');
    });

    it('should infer null type', async () => {
      await manager.create({
        parent: 1,
        properties: { value: null },
        methods: {},
      });

      const types = await generator.generate();

      expect(types).toContain('value: null');
    });

    it('should infer array type', async () => {
      await manager.create({
        parent: 1,
        properties: { items: [1, 2, 3] },
        methods: {},
      });

      const types = await generator.generate();

      expect(types).toContain('items: number[]');
    });

    it('should infer generic array for mixed types', async () => {
      await manager.create({
        parent: 1,
        properties: { mixed: [1, 'two', true] },
        methods: {},
      });

      const types = await generator.generate();

      expect(types).toContain('mixed: any[]');
    });

    it('should infer empty array as any[]', async () => {
      await manager.create({
        parent: 1,
        properties: { empty: [] },
        methods: {},
      });

      const types = await generator.generate();

      expect(types).toContain('empty: any[]');
    });

    it('should infer object type as Record<string, any>', async () => {
      await manager.create({
        parent: 1,
        properties: { config: { timeout: 5000 } },
        methods: {},
      });

      const types = await generator.generate();

      expect(types).toContain('config: Record<string, any>');
    });

    it('should handle undefined as null (MongoDB converts undefined to null)', async () => {
      await manager.create({
        parent: 1,
        properties: { undef: undefined },
        methods: {},
      });

      const types = await generator.generate();

      // MongoDB converts undefined to null when storing documents
      expect(types).toContain('undef: null');
    });

    it('should handle multiple properties', async () => {
      await manager.create({
        parent: 1,
        properties: {
          name: 'Test',
          count: 10,
          enabled: true,
          items: [1, 2, 3],
        },
        methods: {},
      });

      const types = await generator.generate();

      expect(types).toContain('name: string');
      expect(types).toContain('count: number');
      expect(types).toContain('enabled: boolean');
      expect(types).toContain('items: number[]');
    });
  });

  describe('Method Type Generation', () => {
    it('should generate method signatures', async () => {
      await manager.create({
        parent: 1,
        properties: {},
        methods: { onInput: { code: 'return 42;' } },
      });

      const types = await generator.generate();

      expect(types).toContain('onInput(...args: any[]): Promise<any>');
    });

    it('should generate multiple method signatures', async () => {
      await manager.create({
        parent: 1,
        properties: {},
        methods: {
          onCreate: { code: 'console.log("created");' },
          onDestroy: { code: 'console.log("destroyed");' },
          doSomething: { code: 'return true;' },
        },
      });

      const types = await generator.generate();

      expect(types).toContain('onCreate(...args: any[]): Promise<any>');
      expect(types).toContain('onDestroy(...args: any[]): Promise<any>');
      expect(types).toContain('doSomething(...args: any[]): Promise<any>');
    });
  });

  describe('Object Interface Generation', () => {
    it('should generate interface for each object', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Test' },
        methods: { test: { code: 'return 1;' } },
      });

      const types = await generator.generate();

      expect(types).toContain(`/** Object #${obj.id} */`);
      expect(types).toContain(`interface MaliceObject_${obj.id}`);
      expect(types).toContain('name: string');
      expect(types).toContain('test(...args: any[]): Promise<any>');
    });

    it('should sort properties and methods alphabetically', async () => {
      await manager.create({
        parent: 1,
        properties: {
          zebra: 1,
          alpha: 2,
          middle: 3,
        },
        methods: {
          zMethod: { code: '' },
          aMethod: { code: '' },
          mMethod: { code: '' },
        },
      });

      const types = await generator.generate();

      // Check order: properties should be alpha, middle, zebra
      const alphaPos = types.indexOf('alpha: number');
      const middlePos = types.indexOf('middle: number');
      const zebraPos = types.indexOf('zebra: number');

      expect(alphaPos).toBeLessThan(middlePos);
      expect(middlePos).toBeLessThan(zebraPos);

      // Check order: methods should be aMethod, mMethod, zMethod
      const aMethodPos = types.indexOf('aMethod(');
      const mMethodPos = types.indexOf('mMethod(');
      const zMethodPos = types.indexOf('zMethod(');

      expect(aMethodPos).toBeLessThan(mMethodPos);
      expect(mMethodPos).toBeLessThan(zMethodPos);
    });

    it('should skip recycled objects', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'ToDelete' },
        methods: {},
      });

      await manager.db.recycle(obj.id);

      const types = await generator.generate();

      expect(types).not.toContain(`MaliceObject_${obj.id}`);
      expect(types).not.toContain('ToDelete');
    });
  });

  describe('ObjectManager Interface', () => {
    it('should generate ObjectManager interface', async () => {
      const types = await generator.generate();

      expect(types).toContain('interface ObjectManager');
      expect(types).toContain('load(id: number): Promise<RuntimeObject>');
      expect(types).toContain('[key: string]: any');
    });

    it('should include registered aliases', async () => {
      const system = await manager.create({
        parent: 1,
        properties: { name: 'System' },
        methods: {},
      });

      manager.registerAlias('system', system);

      const types = await generator.generate();

      expect(types).toContain(`/** Alias for object #${system.id} */`);
      expect(types).toContain('readonly system: RuntimeObject');
    });

    it('should include multiple aliases', async () => {
      const system = await manager.create({ parent: 1, properties: {}, methods: {} });
      const auth = await manager.create({ parent: 1, properties: {}, methods: {} });

      manager.registerAlias('system', system);
      manager.registerAlias('authManager', auth);

      const types = await generator.generate();

      expect(types).toContain('readonly system: RuntimeObject');
      expect(types).toContain('readonly authManager: RuntimeObject');
    });
  });

  describe('Object-Specific Generation', () => {
    it('should generate enhanced types for specific object', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: { name: 'Test' },
        methods: { test: { code: 'return 1;' } },
      });

      const types = await generator.generateForObject(obj.id);

      // Should include base types
      expect(types).toContain('interface RuntimeObject');

      // Should include object-specific override
      expect(types).toContain(`// Context-specific type override for Object #${obj.id}`);
      expect(types).toContain(`declare const self: RuntimeObject & MaliceObject_${obj.id}`);
    });

    it('should throw error for non-existent object', async () => {
      await expect(generator.generateForObject(99999)).rejects.toThrow('not found');
    });
  });

  describe('Edge Cases', () => {
    it('should escape invalid property names', async () => {
      await manager.create({
        parent: 1,
        properties: {
          'valid-name': 1,
          '123-starts-with-number': 2,
          'has spaces': 3,
          'has"quotes': 4,
        },
        methods: {},
      });

      const types = await generator.generate();

      expect(types).toContain('"valid-name": number');
      expect(types).toContain('"123-starts-with-number": number');
      expect(types).toContain('"has spaces": number');
      expect(types).toContain('"has\\"quotes": number');
    });

    it('should handle objects with no properties or methods', async () => {
      const obj = await manager.create({
        parent: 1,
        properties: {},
        methods: {},
      });

      const types = await generator.generate();

      expect(types).toContain(`interface MaliceObject_${obj.id}`);
      // Interface should still be created, just empty
      expect(types).toMatch(new RegExp(`interface MaliceObject_${obj.id} \\{\\s*\\}`));
    });

    it('should handle large number of objects', async () => {
      // Create 10 objects
      for (let i = 0; i < 10; i++) {
        await manager.create({
          parent: 1,
          properties: { index: i },
          methods: { test: { code: 'return 1;' } },
        });
      }

      const types = await generator.generate();

      // Should contain all 10 object interfaces
      for (let i = 2; i <= 11; i++) { // IDs start at 2 (1 is root)
        expect(types).toContain(`interface MaliceObject_${i}`);
      }
    });
  });

  describe('TypeScript Syntax Validity', () => {
    it('should generate syntactically valid TypeScript', async () => {
      await manager.create({
        parent: 1,
        properties: {
          name: 'Test',
          count: 42,
          enabled: true,
          items: [1, 2, 3],
          config: { timeout: 5000 },
        },
        methods: {
          onCreate: { code: 'console.log("created");' },
          onDestroy: { code: 'console.log("destroyed");' },
        },
      });

      const types = await generator.generate();

      // Basic syntax checks
      expect(types).not.toContain('undefined');
      expect(types.match(/interface \w+/g)).toBeTruthy();

      // Should have balanced braces
      const openBraces = (types.match(/{/g) || []).length;
      const closeBraces = (types.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });
});
