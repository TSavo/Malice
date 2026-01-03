import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MinimalBootstrap } from '../../src/database/bootstrap/minimal-bootstrap.js';
import { NeuralScannerBuilder } from '../../src/database/bootstrap/prototypes/neural-scanner-builder.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('NeuralScannerBuilder', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_neural_scanner');
    await db.connect();

    // Clean database
    await db.objects.deleteMany({});

    manager = new ObjectManager(db);

    // Set up minimal bootstrap (Root, System, and core aliases)
    const bootstrap = new MinimalBootstrap(manager);
    await bootstrap.bootstrap();

    // Create furniture prototype (dependency)
    const root = await manager.load(1);
    await manager.define('furniture', root, {
      properties: {
        name: 'Furniture',
        description: 'Base furniture type',
      },
    });
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('build()', () => {
    it('should create neuralScanner type with correct properties', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const scanner = await manager.load('neuralScanner');

      expect(scanner).toBeTruthy();
      expect(scanner?.get('name')).toBe('Neural Scanner');
      expect(scanner?.get('powered')).toBe(true);
      expect(scanner?.get('operational')).toBe(true);
      expect(scanner?.get('calibrated')).toBe(true);
      expect(scanner?.get('lastCalibration')).toBe(null);
      expect(scanner?.get('scanInProgress')).toBe(false);
      expect(scanner?.get('cooldownUntil')).toBe(0);
      expect(scanner?.get('weight')).toBe(850000);
    });

    it('should set property descriptions correctly', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const scanner = await manager.load('neuralScanner');

      expect(scanner?.getPropertyDescription('powered')).toBe(
        'Whether main power is connected. Requires industrial 50kW supply',
      );
      expect(scanner?.getPropertyDescription('operational')).toBe(
        'Whether machine is functioning. False if damaged or missing components',
      );
      expect(scanner?.getPropertyDescription('calibrated')).toBe(
        'Whether sensors are calibrated. Requires quarterly maintenance',
      );
      expect(scanner?.getPropertyDescription('lastCalibration')).toBe(
        'Timestamp of most recent calibration. Null if never calibrated',
      );
      expect(scanner?.getPropertyDescription('scanInProgress')).toBe(
        'Whether a scan is currently running. Subject must remain still',
      );
      expect(scanner?.getPropertyDescription('cooldownUntil')).toBe(
        'Timestamp when machine will be ready for next scan. 15 minute cooldown',
      );
    });

    it('should have furniture as parent', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const scanner = await manager.load('neuralScanner');
      const furniture = await manager.load('furniture');

      expect(scanner?.parent).toBe(furniture?.id);
    });

    it('should include abilities text', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const scanner = await manager.load('neuralScanner');
      const abilities = scanner?.get('abilities') as string;

      expect(abilities).toBeTruthy();
      expect(abilities).toContain('NEURAL SCANNING INSTALLATION');
      expect(abilities).toContain('isArtificialHuman');
      expect(abilities).toContain('THE MASK');
    });

    it('should store created object in builder.obj', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const obj = builder.getObject();
      expect(obj).toBeTruthy();
      expect(obj?.get('name')).toBe('Neural Scanner');
    });

    it('should throw if furniture dependency is missing', async () => {
      // Remove furniture
      const furniture = await manager.load('furniture');
      if (furniture) {
        await manager.db.objects.deleteOne({ _id: furniture.id });
        manager.cache.delete(furniture.id);
      }

      const builder = new NeuralScannerBuilder(manager);
      await expect(builder.build()).rejects.toThrow('Furniture type not found');
    });
  });

  describe('idempotency', () => {
    it('should reuse existing neuralScanner when build() called multiple times', async () => {
      const builder = new NeuralScannerBuilder(manager);

      // First build
      await builder.build();
      await builder.registerAliases();

      const scanner1 = await manager.load('neuralScanner');
      const firstId = scanner1?.id;

      // Second build - should detect existing
      await builder.build();

      const scanner2 = await manager.load('neuralScanner');
      expect(scanner2?.id).toBe(firstId);

      // Verify only one scanner exists
      const allObjects = await db.listAll();
      const scanners = allObjects.filter(
        (obj) =>
          (obj.properties.name?.value || obj.properties.name) ===
          'Neural Scanner',
      );
      expect(scanners.length).toBe(1);
    });

    it('should use existing object on second build() call', async () => {
      const builder1 = new NeuralScannerBuilder(manager);
      await builder1.build();

      const firstId = (await manager.load('neuralScanner'))?.id;

      const builder2 = new NeuralScannerBuilder(manager);
      await builder2.build();

      const secondId = (await manager.load('neuralScanner'))?.id;

      expect(secondId).toBe(firstId);
    });

    it('should not duplicate neuralScanner on repeated builds', async () => {
      const builder = new NeuralScannerBuilder(manager);

      // Build multiple times
      await builder.build();
      await builder.build();
      await builder.build();

      const allObjects = await db.listAll();
      const scanners = allObjects.filter(
        (obj) =>
          (obj.properties.name?.value || obj.properties.name) ===
          'Neural Scanner',
      );

      expect(scanners.length).toBe(1);
    });
  });

  describe('registerAliases()', () => {
    it('should log auto-alias message', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      // Should not throw
      await expect(builder.registerAliases()).resolves.toBeUndefined();
    });

    it('should allow neuralScanner to be loaded by alias after build', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const scanner = await manager.load('neuralScanner');
      expect(scanner).toBeTruthy();
      expect(scanner?.get('name')).toBe('Neural Scanner');
    });
  });

  describe('static metadata', () => {
    it('should declare provides = ["neuralScanner"]', () => {
      expect(NeuralScannerBuilder.provides).toEqual(['neuralScanner']);
    });

    it('should declare depends = ["furniture"]', () => {
      expect(NeuralScannerBuilder.depends).toEqual(['furniture']);
    });
  });

  describe('getObject()', () => {
    it('should return null before build()', () => {
      const builder = new NeuralScannerBuilder(manager);
      expect(builder.getObject()).toBe(null);
    });

    it('should return RuntimeObject after build()', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const obj = builder.getObject();
      expect(obj).toBeTruthy();
      expect(obj?.get('name')).toBe('Neural Scanner');
    });
  });

  describe('property values', () => {
    it('should have massive weight (850kg)', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const scanner = await manager.load('neuralScanner');
      expect(scanner?.get('weight')).toBe(850000); // 850kg in grams
    });

    it('should start powered and operational', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const scanner = await manager.load('neuralScanner');
      expect(scanner?.get('powered')).toBe(true);
      expect(scanner?.get('operational')).toBe(true);
    });

    it('should start calibrated with null lastCalibration', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const scanner = await manager.load('neuralScanner');
      expect(scanner?.get('calibrated')).toBe(true);
      expect(scanner?.get('lastCalibration')).toBe(null);
    });

    it('should start with no scan in progress', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const scanner = await manager.load('neuralScanner');
      expect(scanner?.get('scanInProgress')).toBe(false);
    });

    it('should start with zero cooldown', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const scanner = await manager.load('neuralScanner');
      expect(scanner?.get('cooldownUntil')).toBe(0);
    });
  });

  describe('description', () => {
    it('should have detailed description', async () => {
      const builder = new NeuralScannerBuilder(manager);
      await builder.build();

      const scanner = await manager.load('neuralScanner');
      const desc = scanner?.get('description') as string;

      expect(desc).toBeTruthy();
      expect(desc).toContain('massive cylindrical chamber');
      expect(desc).toContain('brushed steel');
      expect(desc).toContain('motorized bed');
      expect(desc).toContain('reading minds');
    });
  });
});
