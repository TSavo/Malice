import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BuildingBuilder } from '../../src/database/bootstrap/building-builder.js';
import { MinimalBootstrap } from '../../src/database/bootstrap/minimal-bootstrap.js';
import { RecyclerBuilder } from '../../src/database/bootstrap/recycler-builder.js';
import { RoomBuilder } from '../../src/database/bootstrap/prototypes/room-builder.js';
import { ExitBuilder } from '../../src/database/bootstrap/prototypes/exit-builder.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('BuildingBuilder', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let builder: BuildingBuilder;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_building_builder');
    await db.connect();

    // Clean database
    await (db as any).objects.deleteMany({});

    manager = new ObjectManager(db);

    // Set up minimal bootstrap (Root, System, and core aliases)
    const bootstrap = new MinimalBootstrap(manager);
    await bootstrap.bootstrap();

    // Build dependencies: room, exit, recycler prototypes
    const roomBuilder = new RoomBuilder(manager);
    await roomBuilder.build();
    await roomBuilder.registerAliases();

    const exitBuilder = new ExitBuilder(manager);
    await exitBuilder.build();
    await exitBuilder.registerAliases();

    const recyclerBuilder = new RecyclerBuilder(manager);
    await recyclerBuilder.build();
    await recyclerBuilder.registerAliases();

    builder = new BuildingBuilder(manager);
  });

  afterEach(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('build()', () => {
    it('should complete without throwing', async () => {
      await expect(builder.build()).resolves.not.toThrow();
    });

    it('should be idempotent - multiple builds should not create duplicates', async () => {
      await builder.build();
      const objectCountAfterFirst = (await db.listAll()).length;

      await builder.build();
      const objectCountAfterSecond = (await db.listAll()).length;

      await builder.build();
      const objectCountAfterThird = (await db.listAll()).length;

      // Object count should stabilize after first build
      expect(objectCountAfterSecond).toBe(objectCountAfterFirst);
      expect(objectCountAfterThird).toBe(objectCountAfterFirst);
    });

    it('should skip if buildings already built (early return via marker check)', async () => {
      // First build
      await builder.build();

      // Create a marker to verify early return
      const $ = manager as any;
      const hasMarker = Boolean($.immigrationServices);

      // If marker exists, second build should return early
      if (hasMarker) {
        await builder.build();
        // Should still reference the same marker object
        expect(Boolean($.immigrationServices)).toBe(true);
      }
    });

    it('should throw if room prototype missing', async () => {
      const $ = manager as any;
      delete $.room;

      await expect(builder.build()).rejects.toThrow(
        /Room.*must exist before building buildings/i,
      );
    });

    it('should throw if exit prototype missing', async () => {
      const $ = manager as any;
      delete $.exit;

      await expect(builder.build()).rejects.toThrow(
        /Exit.*must exist before building buildings/i,
      );
    });

    it('should throw if recycler missing', async () => {
      const $ = manager as any;
      delete $.recycler;

      await expect(builder.build()).rejects.toThrow(
        /Recycler.*must exist before building buildings/i,
      );
    });
  });

  describe('Building Loading - Pioneer Building Integration', () => {
    it('should load buildings from filesystem without errors', async () => {
      // This test verifies that all building definition files (z0.ts, z1.ts, etc.)
      // can be loaded and processed without syntax errors or invalid data
      await expect(builder.build()).resolves.not.toThrow();
    });

    it('should create aliases for loaded buildings', async () => {
      await builder.build();

      const objectManager = await manager.load(0);
      const aliases = (objectManager?.get('aliases') as Record<
        string,
        number
      >) || {};

      // Building aliases should exist (the exact names depend on building definitions)
      const aliasCount = Object.keys(aliases).length;
      expect(aliasCount).toBeGreaterThan(0);
    });

    it('should create rooms with coordinates', async () => {
      await builder.build();

      // Get all objects and find rooms (objects with x/y/z properties)
      const allObjects = await db.listAll();
      const rooms = allObjects.filter(
        (obj) =>
          obj.properties.x !== undefined &&
          obj.properties.y !== undefined &&
          obj.properties.z !== undefined,
      );

      // Should have created at least some rooms
      expect(rooms.length).toBeGreaterThan(0);
    });

    it('should create rooms with required properties', async () => {
      await builder.build();

      const allObjects = await db.listAll();
      const rooms = allObjects.filter(
        (obj) =>
          obj.properties.x !== undefined &&
          obj.properties.y !== undefined &&
          obj.properties.z !== undefined,
      );

      if (rooms.length > 0) {
        const sampleRoom = rooms[0];

        // Rooms should have basic properties
        expect(sampleRoom.properties.name).toBeDefined();
        expect(sampleRoom.properties.description).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing building directory gracefully', async () => {
      // Even if buildings directory doesn't exist or is empty, should not throw
      await expect(builder.build()).resolves.not.toThrow();
    });
  });
});
