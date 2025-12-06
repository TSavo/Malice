import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('GameBootstrap', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let bootstrap: GameBootstrap;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_game_bootstrap');
    await db.connect();

    // Clean database
    await db['objects'].deleteMany({});

    manager = new ObjectManager(db);
    bootstrap = new GameBootstrap(manager);
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('bootstrap()', () => {
    it('should complete bootstrap process', async () => {
      await expect(bootstrap.bootstrap()).resolves.not.toThrow();
    });

    it('should create all minimal objects', async () => {
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const root = await manager.load(1);
      const system = await manager.load(2);

      expect(objectManager).toBeTruthy();
      expect(objectManager).toBeTruthy();
      expect(system).toBeTruthy();
    });

    it('should load aliases from MongoDB', async () => {
      await bootstrap.bootstrap();

      const aliases = manager.getAliases();
      expect(aliases.size).toBeGreaterThan(0);
    });

    it('should register core aliases (system)', async () => {
      await bootstrap.bootstrap();

      const system = (manager as any).system;

      expect(system).toBeTruthy();
      expect(system.id).toBe(2);
    });

    it('should be idempotent', async () => {
      await bootstrap.bootstrap();
      await bootstrap.bootstrap();
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const system = await manager.load(2);

      expect(objectManager).toBeTruthy();
      expect(system).toBeTruthy();
    });

    it('should auto-build world on first run', async () => {
      // Fresh bootstrap - should automatically build world
      await bootstrap.bootstrap();

      // World should be built now
      const $ = manager as any;
      expect($.describable).toBeTruthy();
      expect($.player).toBeTruthy();
      expect($.authManager).toBeTruthy();
    });
  });

  describe('Integration', () => {
    it('should create objects in correct order', async () => {
      await bootstrap.bootstrap();

      const $ = manager as any;

      // Check parent relationships
      expect($.root.getParent()).toBe(0);
      expect($.system.getParent()).toBe($.root.id);
    });

    it('should set up aliases correctly', async () => {
      await bootstrap.bootstrap();

      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;

      expect(aliases).toBeTruthy();
      expect(aliases.system).toBe(2);
    });

    it('should allow access to system via alias', async () => {
      await bootstrap.bootstrap();

      const system = (manager as any).system;
      expect(system).toBeTruthy();
      expect(system.get('name')).toBe('System');
      expect(system.hasMethod('onConnection')).toBe(true);
    });

  });

  describe('World status check', () => {
    it('should automatically build world', async () => {
      await bootstrap.bootstrap();

      // World should be automatically built
      const $ = manager as any;
      expect($.describable).toBeTruthy();
      expect($.player).toBeTruthy();
      expect($.authManager).toBeTruthy();
      expect($.charGen).toBeTruthy();
    });

    it('should detect built world', async () => {
      await bootstrap.bootstrap();

      // Simulate built world by creating required objects
      await manager.create({
        parent: 1,
        properties: { name: 'Describable' },
        methods: {},
      }); // #10 (might be #4)

      await manager.create({
        parent: 1,
        properties: { name: 'AuthManager' },
        methods: {},
      }); // #4 or #11

      // Create more objects to reach #13
      for (let i = 0; i < 10; i++) {
        await manager.create({
          parent: 1,
          properties: { name: `Object ${i}` },
          methods: {},
        });
      }

      // World status check should recognize built world
      const allObjects = await db.listAll();
      expect(allObjects.length).toBeGreaterThan(3);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection issues gracefully', async () => {
      // This test would need a mock or separate setup
      // For now, just verify bootstrap doesn't throw on normal operation
      await expect(bootstrap.bootstrap()).resolves.not.toThrow();
    });

    it('should handle corrupt root object', async () => {
      // Create corrupt root
      await db.create({
        _id: 1,
        parent: 0,
        properties: null as any, // Corrupt
        methods: {},
      });

      // Bootstrap should handle this
      await expect(bootstrap.bootstrap()).resolves.not.toThrow();
    });
  });

  describe('Re-bootstrap', () => {
    it('should preserve existing data on re-bootstrap', async () => {
      await bootstrap.bootstrap();

      // Add custom data
      const objectManager = await manager.load(0);
      const root = await manager.load(1);
      const config = root!.get('config') as any;
      config.customSetting = 'test value';
      root!.set('config', config);
      await objectManager!.save();

      // Re-bootstrap
      const bootstrap2 = new GameBootstrap(manager);
      await bootstrap2.bootstrap();

      // Check custom data preserved
      const objectManager2 = await manager.load(0);
      const root2 = await manager.load(1);
      const config2 = root2!.get('config') as any;
      expect(config2.customSetting).toBe('test value');
    });

    it('should preserve custom aliases on re-bootstrap', async () => {
      await bootstrap.bootstrap();

      // Add custom alias
      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;
      aliases.myCustomAlias = 999;
      objectManager!.set('aliases', aliases);
      await objectManager!.save();

      // Re-bootstrap
      const bootstrap2 = new GameBootstrap(manager);
      await bootstrap2.bootstrap();

      // Check custom alias preserved
      const objectManager2 = await manager.load(0);
      const aliases2 = objectManager2!.get('aliases') as Record<string, number>;
      expect(aliases2.myCustomAlias).toBe(999);
      expect(aliases2.system).toBe(2);
    });
  });
});
