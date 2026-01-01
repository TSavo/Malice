import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AliasLoader } from '../../src/database/bootstrap/alias-loader.js';
import { MinimalBootstrap } from '../../src/database/bootstrap/minimal-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('MinimalBootstrap', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let bootstrap: MinimalBootstrap;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_bootstrap');
    await db.connect();

    // Clean database
    await db.objects.deleteMany({});

    manager = new ObjectManager(db);
    bootstrap = new MinimalBootstrap(manager);
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('bootstrap()', () => {
    it('should create Root type', async () => {
      await bootstrap.bootstrap();

      const root = await manager.load('root');
      expect(root).toBeTruthy();
      expect(root?.id).toBe('root');
      expect(root?.get('name')).toBe('Root');
      expect(root?.getParent()?.id).toBe('root'); // Parent is self (root type)
    });

    it('should create System object (#2)', async () => {
      await bootstrap.bootstrap();

      // Load aliases
      const aliasLoader = new AliasLoader(manager);
      await aliasLoader.loadAliases();

      const $ = manager as any;

      expect($.system).toBeTruthy();
      expect($.system.id).toBe(2);
      expect($.system.get('name')).toBe('System');
      expect($.system.getParent()).toBe($.root);
    });

    it('should initialize empty aliases in Root', async () => {
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const aliases = objectManager?.get('aliases') as Record<string, number>;

      expect(aliases).toBeTruthy();
      expect(typeof aliases).toBe('object');
    });

    it('should register core aliases in root.properties.aliases', async () => {
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const aliases = objectManager?.get('aliases') as Record<string, number>;

      expect(aliases.system).toBe(2);
    });

    it('should be idempotent (safe to run multiple times)', async () => {
      await bootstrap.bootstrap();
      await bootstrap.bootstrap();
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const system = await manager.load(2);

      expect(objectManager).toBeTruthy();
      expect(system).toBeTruthy();
    });

    it('should create root type with correct structure', async () => {
      await bootstrap.bootstrap();

      const root = await manager.load('root');
      const doc = root?._getRaw();

      expect(doc._id).toBe('root');
      expect(doc.parent).toEqual({
        type: 'objref',
        target: 'type',
        id: 'root',
      });
      expect(doc.properties).toBeTruthy();
      expect(doc.methods).toBeTruthy();
      expect(doc.created).toBeInstanceOf(Date);
      expect(doc.modified).toBeInstanceOf(Date);
    });
  });

  describe('Root type', () => {
    it('should be a type (not an object)', async () => {
      await bootstrap.bootstrap();

      const root = await manager.load('root');

      expect(root).toBeTruthy();
      expect(root?.isType).toBe(true);
      expect(root?.kind).toBe('type');
    });

    it('should have name and description', async () => {
      await bootstrap.bootstrap();

      const root = await manager.load('root');

      expect(root?.get('name')).toBe('Root');
      expect(root?.get('description')).toBe('Base of all types');
    });
  });

  describe('System object', () => {
    it('should have onConnection method', async () => {
      await bootstrap.bootstrap();

      const system = await manager.load(2);
      expect(system?.hasMethod('onConnection')).toBe(true);
    });

    it('should have functional onConnection method', async () => {
      await bootstrap.bootstrap();

      const system = await manager.load(2);
      const method = system?._getRaw().methods.onConnection;

      expect(method).toBeTruthy();
      const code = typeof method === 'string' ? method : method.code;
      expect(code).toContain('context');
      expect(code).toContain('authInfo');
    });
  });

  describe('Alias registration', () => {
    it('should not duplicate aliases on repeated bootstrap', async () => {
      await bootstrap.bootstrap();
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const aliases = objectManager?.get('aliases') as Record<string, number>;

      expect(aliases.nothing).toBe(-1);
      expect(aliases.object_manager).toBe(0);
      // Note: 'root' is a type now and auto-aliases, not in aliases map
      expect(aliases.system).toBe(2);
      expect(Object.keys(aliases).length).toBe(3);
    });

    it('should auto-alias root type', async () => {
      await bootstrap.bootstrap();

      // Root should be accessible via $root even though it's not in aliases
      const root = await manager.load('root');
      expect(root).toBeTruthy();
      expect(root?.isType).toBe(true);
    });

    it('should preserve existing aliases', async () => {
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const aliases = objectManager?.get('aliases') as Record<string, number>;
      aliases.custom = 999;
      objectManager?.set('aliases', aliases);
      await objectManager?.save();

      // Bootstrap again
      const bootstrap2 = new MinimalBootstrap(manager);
      await bootstrap2.bootstrap();

      const objectManager2 = await manager.load(0);
      const aliases2 = objectManager2?.get('aliases') as Record<string, number>;

      expect(aliases2.custom).toBe(999);
      expect(aliases2.system).toBe(2);
    });
  });
});
