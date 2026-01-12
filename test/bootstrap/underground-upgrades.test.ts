import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MinimalBootstrap } from '../../src/database/bootstrap/minimal-bootstrap.js';
import { UndergroundUpgradesBuilder } from '../../src/database/bootstrap/underground-upgrades-builder.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('UndergroundUpgradesBuilder', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_underground_upgrades');
    await db.connect();
    await (db as any).objects.deleteMany({});

    manager = new ObjectManager(db);
    const bootstrap = new MinimalBootstrap(manager);
    await bootstrap.bootstrap();
  });

  afterEach(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('Builder setup', () => {
    it('should declare correct dependencies', () => {
      expect(UndergroundUpgradesBuilder.depends).toContain('room');
      expect(UndergroundUpgradesBuilder.depends).toContain('recycler');
      expect(UndergroundUpgradesBuilder.depends).toContain('spatial');
      expect(UndergroundUpgradesBuilder.depends).toContain('door');
      expect(UndergroundUpgradesBuilder.depends).toContain('lock');
      expect(UndergroundUpgradesBuilder.depends).toContain('biometricLock');
      expect(UndergroundUpgradesBuilder.depends).toContain('bed');
      expect(UndergroundUpgradesBuilder.depends).toContain('table');
      expect(UndergroundUpgradesBuilder.depends).toContain('chair');
      expect(UndergroundUpgradesBuilder.depends).toContain('sisterGray');
    });

    it('should provide no aliases (creates instances, not singletons)', () => {
      expect(UndergroundUpgradesBuilder.provides).toEqual([]);
    });
  });

  describe('build() without dependencies', () => {
    it('should not throw when Sister Gray is missing', async () => {
      const builder = new UndergroundUpgradesBuilder(manager);

      // Should exit early gracefully when sisterGray not found
      await expect(builder.build()).resolves.not.toThrow();
    });

    it('should not create objects when dependencies missing', async () => {
      const builder = new UndergroundUpgradesBuilder(manager);
      await builder.build();

      const allObjects = await db.listAll();
      const _objectCount = allObjects.length;

      // Should not create any furniture/locks
      const furniture = allObjects.filter(
        (obj: any) =>
          obj.properties?.name?.value?.includes('Bunk') ||
          obj.properties?.name?.value?.includes('Gate') ||
          obj.properties?.name?.includes('Bunk') ||
          obj.properties?.name?.includes('Gate'),
      );
      expect(furniture.length).toBe(0);
    });
  });

  describe('Idempotency checks', () => {
    it('should complete without throwing', async () => {
      const builder = new UndergroundUpgradesBuilder(manager);
      await expect(builder.build()).resolves.not.toThrow();
    });

    it('should be idempotent when run multiple times', async () => {
      const builder1 = new UndergroundUpgradesBuilder(manager);
      await builder1.build();

      const firstRun = await db.listAll();
      const firstCount = firstRun.length;

      // Run again
      const builder2 = new UndergroundUpgradesBuilder(manager);
      await builder2.build();

      const secondRun = await db.listAll();
      const secondCount = secondRun.length;

      // Should have same number of objects
      expect(secondCount).toBe(firstCount);
    });
  });
});
