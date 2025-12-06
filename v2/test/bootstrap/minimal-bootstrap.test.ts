import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { MinimalBootstrap } from '../../src/database/bootstrap/minimal-bootstrap.js';
import { AliasLoader } from '../../src/database/bootstrap/alias-loader.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('MinimalBootstrap', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let bootstrap: MinimalBootstrap;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_bootstrap');
    await db.connect();

    // Clean database
    await db['objects'].deleteMany({});

    manager = new ObjectManager(db);
    bootstrap = new MinimalBootstrap(manager);
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('bootstrap()', () => {
    it('should create Root object (#1)', async () => {
      await bootstrap.bootstrap();

      const root = await manager.load(1);
      expect(root).toBeTruthy();
      expect(root!.id).toBe(1);
      expect(root!.get('name')).toBe('Root');
      expect(root!.getParent()).toBe(0);
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
      expect($.system.getParent()).toBe($.root.id);
    });


    it('should initialize empty aliases in Root', async () => {
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;

      expect(aliases).toBeTruthy();
      expect(typeof aliases).toBe('object');
    });

    it('should register core aliases in root.properties.aliases', async () => {
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;

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

    it('should create objects with correct structure', async () => {
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const root = await manager.load(1);
      const doc = root!['_getRaw']();

      expect(doc._id).toBe(1);
      expect(doc.parent).toBe(0);
      expect(doc.properties).toBeTruthy();
      expect(doc.methods).toBeTruthy();
      expect(doc.created).toBeInstanceOf(Date);
      expect(doc.modified).toBeInstanceOf(Date);
    });
  });

  describe('Root object', () => {
    it('should have config property', async () => {
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const root = await manager.load(1);
      const config = root!.get('config');

      expect(config).toBeTruthy();
      expect(typeof config).toBe('object');
    });

    it('should have default site configuration', async () => {
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const root = await manager.load(1);
      const config = root!.get('config') as any;

      expect(config.siteName).toBe('Malice');
      expect(config.motd).toBeTruthy();
      expect(config.maxConnections).toBeGreaterThan(0);
    });
  });

  describe('System object', () => {
    it('should have onConnection method', async () => {
      await bootstrap.bootstrap();

      const system = await manager.load(2);
      expect(system!.hasMethod('onConnection')).toBe(true);
    });

    it('should have functional onConnection method', async () => {
      await bootstrap.bootstrap();

      const system = await manager.load(2);
      const method = system!['_getRaw']().methods.onConnection;

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
      const aliases = objectManager!.get('aliases') as Record<string, number>;

      expect(aliases.nothing).toBe(-1);
      expect(aliases.object_manager).toBe(0);
      expect(aliases.root).toBe(1);
      expect(aliases.system).toBe(2);
      expect(Object.keys(aliases).length).toBe(4);
    });

    it('should preserve existing aliases', async () => {
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;
      aliases.custom = 999;
      objectManager!.set('aliases', aliases);
      await objectManager!.save();

      // Bootstrap again
      const bootstrap2 = new MinimalBootstrap(manager);
      await bootstrap2.bootstrap();

      const objectManager2 = await manager.load(0);
      const aliases2 = objectManager2!.get('aliases') as Record<string, number>;

      expect(aliases2.custom).toBe(999);
      expect(aliases2.system).toBe(2);
    });
  });
});
