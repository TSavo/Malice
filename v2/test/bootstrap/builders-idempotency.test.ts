import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { MinimalBootstrap } from '../../src/database/bootstrap/minimal-bootstrap.js';
import { AuthManagerBuilder } from '../../src/database/bootstrap/auth-manager-builder.js';
import { CharGenBuilder } from '../../src/database/bootstrap/chargen-builder.js';
import { PreAuthHandlerBuilder } from '../../src/database/bootstrap/preauth-handler-builder.js';
import { RecyclerBuilder } from '../../src/database/bootstrap/recycler-builder.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('Bootstrap Builders Idempotency', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_builders_idempotency');
    await db.connect();

    // Clean database
    await db['objects'].deleteMany({});

    manager = new ObjectManager(db);

    // Set up minimal bootstrap (Root, System, and core aliases)
    const bootstrap = new MinimalBootstrap(manager);
    await bootstrap.bootstrap();
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('AuthManagerBuilder idempotency', () => {
    it('should use early return when authManager alias already exists (lines 21-22)', async () => {
      const builder = new AuthManagerBuilder(manager);

      // First build - creates new AuthManager
      await builder.build();
      await builder.registerAlias();

      // Get the created object ID
      const objectManager = await manager.load(0);
      const aliases1 = objectManager!.get('aliases') as Record<string, number>;
      const firstAuthManagerId = aliases1.authManager;

      expect(firstAuthManagerId).toBeTruthy();
      expect(firstAuthManagerId).toBeGreaterThan(0);

      // Second build - should take early return path
      const builder2 = new AuthManagerBuilder(manager);
      await builder2.build();

      // Verify alias still points to same object (no duplicate created)
      const objectManager2 = await manager.load(0);
      const aliases2 = objectManager2!.get('aliases') as Record<string, number>;
      const secondAuthManagerId = aliases2.authManager;

      expect(secondAuthManagerId).toBe(firstAuthManagerId);

      // Verify only one AuthManager exists in database
      const allObjects = await db.listAll();
      const authManagers = allObjects.filter(obj => obj.properties.name === 'AuthManager');
      expect(authManagers.length).toBe(1);
      expect(authManagers[0]._id).toBe(firstAuthManagerId);
    });

    it('should reuse existing object when build() called multiple times', async () => {
      const builder = new AuthManagerBuilder(manager);

      // Build and register
      await builder.build();
      await builder.registerAlias();

      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;
      const authManagerId = aliases.authManager;

      // Call build multiple times
      await builder.build();
      await builder.build();
      await builder.build();

      // Verify object count hasn't changed
      const allObjects = await db.listAll();
      const authManagers = allObjects.filter(obj => obj.properties.name === 'AuthManager');
      expect(authManagers.length).toBe(1);
      expect(authManagers[0]._id).toBe(authManagerId);
    });
  });

  describe('CharGenBuilder idempotency', () => {
    it('should use early return when charGen alias already exists (lines 21-22)', async () => {
      const builder = new CharGenBuilder(manager);

      // First build - creates new CharGen
      await builder.build();
      await builder.registerAlias();

      // Get the created object ID
      const objectManager = await manager.load(0);
      const aliases1 = objectManager!.get('aliases') as Record<string, number>;
      const firstCharGenId = aliases1.charGen;

      expect(firstCharGenId).toBeTruthy();
      expect(firstCharGenId).toBeGreaterThan(0);

      // Second build - should take early return path
      const builder2 = new CharGenBuilder(manager);
      await builder2.build();

      // Verify alias still points to same object (no duplicate created)
      const objectManager2 = await manager.load(0);
      const aliases2 = objectManager2!.get('aliases') as Record<string, number>;
      const secondCharGenId = aliases2.charGen;

      expect(secondCharGenId).toBe(firstCharGenId);

      // Verify only one CharGen exists in database
      const allObjects = await db.listAll();
      const charGens = allObjects.filter(obj => obj.properties.name === 'CharGen');
      expect(charGens.length).toBe(1);
      expect(charGens[0]._id).toBe(firstCharGenId);
    });

    it('should reuse existing object when build() called multiple times', async () => {
      const builder = new CharGenBuilder(manager);

      // Build and register
      await builder.build();
      await builder.registerAlias();

      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;
      const charGenId = aliases.charGen;

      // Call build multiple times
      await builder.build();
      await builder.build();
      await builder.build();

      // Verify object count hasn't changed
      const allObjects = await db.listAll();
      const charGens = allObjects.filter(obj => obj.properties.name === 'CharGen');
      expect(charGens.length).toBe(1);
      expect(charGens[0]._id).toBe(charGenId);
    });
  });

  describe('PreAuthHandlerBuilder idempotency', () => {
    it('should use early return when preAuthHandler alias already exists (lines 21-22)', async () => {
      const builder = new PreAuthHandlerBuilder(manager);

      // First build - creates new PreAuthHandler
      await builder.build();
      await builder.registerAlias();

      // Get the created object ID
      const objectManager = await manager.load(0);
      const aliases1 = objectManager!.get('aliases') as Record<string, number>;
      const firstPreAuthHandlerId = aliases1.preAuthHandler;

      expect(firstPreAuthHandlerId).toBeTruthy();
      expect(firstPreAuthHandlerId).toBeGreaterThan(0);

      // Second build - should take early return path
      const builder2 = new PreAuthHandlerBuilder(manager);
      await builder2.build();

      // Verify alias still points to same object (no duplicate created)
      const objectManager2 = await manager.load(0);
      const aliases2 = objectManager2!.get('aliases') as Record<string, number>;
      const secondPreAuthHandlerId = aliases2.preAuthHandler;

      expect(secondPreAuthHandlerId).toBe(firstPreAuthHandlerId);

      // Verify only one PreAuthHandler exists in database
      const allObjects = await db.listAll();
      const preAuthHandlers = allObjects.filter(obj => obj.properties.name === 'PreAuthHandler');
      expect(preAuthHandlers.length).toBe(1);
      expect(preAuthHandlers[0]._id).toBe(firstPreAuthHandlerId);
    });

    it('should reuse existing object when build() called multiple times', async () => {
      const builder = new PreAuthHandlerBuilder(manager);

      // Build and register
      await builder.build();
      await builder.registerAlias();

      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;
      const preAuthHandlerId = aliases.preAuthHandler;

      // Call build multiple times
      await builder.build();
      await builder.build();
      await builder.build();

      // Verify object count hasn't changed
      const allObjects = await db.listAll();
      const preAuthHandlers = allObjects.filter(obj => obj.properties.name === 'PreAuthHandler');
      expect(preAuthHandlers.length).toBe(1);
      expect(preAuthHandlers[0]._id).toBe(preAuthHandlerId);
    });
  });

  describe('RecyclerBuilder idempotency', () => {
    it('should use early return when recycler alias already exists (lines 21-22)', async () => {
      const builder = new RecyclerBuilder(manager);

      // First build - creates new Recycler
      await builder.build();
      await builder.registerAlias();

      // Get the created object ID
      const objectManager = await manager.load(0);
      const aliases1 = objectManager!.get('aliases') as Record<string, number>;
      const firstRecyclerId = aliases1.recycler;

      expect(firstRecyclerId).toBeTruthy();
      expect(firstRecyclerId).toBeGreaterThan(0);

      // Second build - should take early return path
      const builder2 = new RecyclerBuilder(manager);
      await builder2.build();

      // Verify alias still points to same object (no duplicate created)
      const objectManager2 = await manager.load(0);
      const aliases2 = objectManager2!.get('aliases') as Record<string, number>;
      const secondRecyclerId = aliases2.recycler;

      expect(secondRecyclerId).toBe(firstRecyclerId);

      // Verify only one Recycler exists in database
      const allObjects = await db.listAll();
      const recyclers = allObjects.filter(obj => obj.properties.name === 'Recycler');
      expect(recyclers.length).toBe(1);
      expect(recyclers[0]._id).toBe(firstRecyclerId);
    });

    it('should reuse existing object when build() called multiple times', async () => {
      const builder = new RecyclerBuilder(manager);

      // Build and register
      await builder.build();
      await builder.registerAlias();

      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;
      const recyclerId = aliases.recycler;

      // Call build multiple times
      await builder.build();
      await builder.build();
      await builder.build();

      // Verify object count hasn't changed
      const allObjects = await db.listAll();
      const recyclers = allObjects.filter(obj => obj.properties.name === 'Recycler');
      expect(recyclers.length).toBe(1);
      expect(recyclers[0]._id).toBe(recyclerId);
    });
  });

  describe('Cross-builder idempotency', () => {
    it('should maintain idempotency across all builders when run multiple times', async () => {
      // Create all builders
      const authBuilder = new AuthManagerBuilder(manager);
      const charGenBuilder = new CharGenBuilder(manager);
      const preAuthBuilder = new PreAuthHandlerBuilder(manager);
      const recyclerBuilder = new RecyclerBuilder(manager);

      // First pass - build all and register aliases
      await authBuilder.build();
      await authBuilder.registerAlias();

      await charGenBuilder.build();
      await charGenBuilder.registerAlias();

      await preAuthBuilder.build();
      await preAuthBuilder.registerAlias();

      await recyclerBuilder.build();
      await recyclerBuilder.registerAlias();

      // Get initial state
      const objectManager1 = await manager.load(0);
      const aliases1 = objectManager1!.get('aliases') as Record<string, number>;
      const initialAuthId = aliases1.authManager;
      const initialCharGenId = aliases1.charGen;
      const initialPreAuthId = aliases1.preAuthHandler;
      const initialRecyclerId = aliases1.recycler;

      // Second pass - build all again (should take early return paths)
      await authBuilder.build();
      await charGenBuilder.build();
      await preAuthBuilder.build();
      await recyclerBuilder.build();

      // Verify all aliases unchanged
      const objectManager2 = await manager.load(0);
      const aliases2 = objectManager2!.get('aliases') as Record<string, number>;

      expect(aliases2.authManager).toBe(initialAuthId);
      expect(aliases2.charGen).toBe(initialCharGenId);
      expect(aliases2.preAuthHandler).toBe(initialPreAuthId);
      expect(aliases2.recycler).toBe(initialRecyclerId);

      // Verify object counts
      const allObjects = await db.listAll();
      const authManagers = allObjects.filter(obj => obj.properties.name === 'AuthManager');
      const charGens = allObjects.filter(obj => obj.properties.name === 'CharGen');
      const preAuthHandlers = allObjects.filter(obj => obj.properties.name === 'PreAuthHandler');
      const recyclers = allObjects.filter(obj => obj.properties.name === 'Recycler');

      expect(authManagers.length).toBe(1);
      expect(charGens.length).toBe(1);
      expect(preAuthHandlers.length).toBe(1);
      expect(recyclers.length).toBe(1);
    });

    it('should handle interleaved build operations without creating duplicates', async () => {
      const authBuilder1 = new AuthManagerBuilder(manager);
      const authBuilder2 = new AuthManagerBuilder(manager);
      const charGenBuilder1 = new CharGenBuilder(manager);
      const charGenBuilder2 = new CharGenBuilder(manager);

      // Build with first instances and register
      await authBuilder1.build();
      await authBuilder1.registerAlias();
      await charGenBuilder1.build();
      await charGenBuilder1.registerAlias();

      // Build with second instances (should detect existing)
      await authBuilder2.build();
      await charGenBuilder2.build();

      // Verify no duplicates
      const allObjects = await db.listAll();
      const authManagers = allObjects.filter(obj => obj.properties.name === 'AuthManager');
      const charGens = allObjects.filter(obj => obj.properties.name === 'CharGen');

      expect(authManagers.length).toBe(1);
      expect(charGens.length).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle alias pointing to deleted object', async () => {
      const builder = new AuthManagerBuilder(manager);

      // Build and register
      await builder.build();
      await builder.registerAlias();

      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;
      const authManagerId = aliases.authManager;

      // Verify object exists
      const authManager1 = await manager.load(authManagerId);
      expect(authManager1).toBeTruthy();

      // Delete the object (but leave the alias)
      await db['objects'].deleteOne({ _id: authManagerId });

      // Clear cache so load will actually query the database
      manager['cache'].clear();

      // Verify object is gone
      const authManager2 = await manager.load(authManagerId);
      expect(authManager2).toBeNull();

      // Build again - should create new object since old one doesn't exist
      const builder2 = new AuthManagerBuilder(manager);
      await builder2.build();
      await builder2.registerAlias();

      // Verify a new object was created
      const allObjects = await db.listAll();
      const authManagers = allObjects.filter(obj => obj.properties.name === 'AuthManager');
      expect(authManagers.length).toBe(1);

      const objectManager2 = await manager.load(0);
      const aliases2 = objectManager2!.get('aliases') as Record<string, number>;
      const newAuthManagerId = aliases2.authManager;

      // New object should exist
      expect(newAuthManagerId).toBeGreaterThan(0);
      const newAuthManager = await manager.load(newAuthManagerId);
      expect(newAuthManager).toBeTruthy();
      expect(newAuthManager!.get('name')).toBe('AuthManager');
    });

    it('should handle empty aliases object', async () => {
      // Clear aliases
      const objectManager = await manager.load(0);
      objectManager!.set('aliases', {});
      await objectManager!.save();

      const builder = new AuthManagerBuilder(manager);

      // Should create new object when no alias exists
      await builder.build();
      await builder.registerAlias();

      const allObjects = await db.listAll();
      const authManagers = allObjects.filter(obj => obj.properties.name === 'AuthManager');
      expect(authManagers.length).toBe(1);
    });

    it('should work when aliases property is missing entirely', async () => {
      // Remove aliases property
      const objectManager = await manager.load(0);
      const raw = objectManager!['_getRaw']();
      delete raw.properties.aliases;
      await db['objects'].updateOne(
        { _id: 0 },
        { $unset: { 'properties.aliases': '' } }
      );

      const builder = new RecyclerBuilder(manager);

      // Should handle missing aliases gracefully
      await builder.build();
      await builder.registerAlias();

      const objectManager2 = await manager.load(0);
      const aliases = objectManager2!.get('aliases') as Record<string, number>;
      expect(aliases).toBeTruthy();
      expect(aliases.recycler).toBeGreaterThan(0);
    });
  });

  describe('Isolation between builders', () => {
    it('should not interfere with each other when building sequentially', async () => {
      const authBuilder = new AuthManagerBuilder(manager);
      const charGenBuilder = new CharGenBuilder(manager);
      const preAuthBuilder = new PreAuthHandlerBuilder(manager);
      const recyclerBuilder = new RecyclerBuilder(manager);

      // Build all sequentially
      await authBuilder.build();
      await charGenBuilder.build();
      await preAuthBuilder.build();
      await recyclerBuilder.build();

      // Register all aliases
      await authBuilder.registerAlias();
      await charGenBuilder.registerAlias();
      await preAuthBuilder.registerAlias();
      await recyclerBuilder.registerAlias();

      // Verify all created successfully
      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;

      expect(aliases.authManager).toBeTruthy();
      expect(aliases.charGen).toBeTruthy();
      expect(aliases.preAuthHandler).toBeTruthy();
      expect(aliases.recycler).toBeTruthy();

      // Verify no duplicates
      const allObjects = await db.listAll();
      expect(allObjects.filter(obj => obj.properties.name === 'AuthManager').length).toBe(1);
      expect(allObjects.filter(obj => obj.properties.name === 'CharGen').length).toBe(1);
      expect(allObjects.filter(obj => obj.properties.name === 'PreAuthHandler').length).toBe(1);
      expect(allObjects.filter(obj => obj.properties.name === 'Recycler').length).toBe(1);
    });
  });
});
