import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BenchBuilder } from '../../src/database/bootstrap/prototypes/bench-builder.js';
import { LamppostBuilder } from '../../src/database/bootstrap/prototypes/lamppost-builder.js';
import { ParkLampBuilder } from '../../src/database/bootstrap/prototypes/park-lamp-builder.js';
import { StreetSignBuilder } from '../../src/database/bootstrap/prototypes/street-sign-builder.js';
import { StreetSignalBuilder } from '../../src/database/bootstrap/prototypes/street-signal-builder.js';
import { MinimalBootstrap } from '../../src/database/bootstrap/minimal-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('Street Furniture and Sittables', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_street_furniture');
    await db.connect();
    await db.objects.deleteMany({});

    manager = new ObjectManager(db);
    const bootstrap = new MinimalBootstrap(manager);
    await bootstrap.bootstrap();
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('BenchBuilder', () => {
    it('should create bench type with correct properties', async () => {
      // Need to create furniture parent first
      const describableType = await manager.load('describable');
      const furnitureType = await manager.define('furniture', describableType!, {
        properties: { name: 'Furniture', description: 'A piece of furniture', weight: 20000 },
      });

      const builder = new BenchBuilder(manager);
      await builder.build();
      await builder.registerAliases();

      const bench = await manager.load('bench');
      expect(bench).toBeTruthy();
      expect(bench?.get('name')).toBe('Bench');
      expect(bench?.get('capacity')).toBe(3);
      expect(bench?.get('material')).toBe('wood');
      expect(bench?.get('boltedDown')).toBe(true);
      expect(bench?.get('occupants')).toEqual([]);
    });

    it('should be idempotent when built multiple times', async () => {
      const describableType = await manager.load('describable');
      const furnitureType = await manager.define('furniture', describableType!, {
        properties: { name: 'Furniture', description: 'A piece of furniture', weight: 20000 },
      });

      const builder = new BenchBuilder(manager);
      await builder.build();
      await builder.registerAliases();

      const firstBench = await manager.load('bench');
      const firstId = firstBench?.id;

      // Build again
      const builder2 = new BenchBuilder(manager);
      await builder2.build();

      const secondBench = await manager.load('bench');
      expect(secondBench?.id).toBe(firstId);

      // Verify no duplicates
      const allObjects = await db.listAll();
      const benches = allObjects.filter(
        (obj) => (obj.properties.name?.value || obj.properties.name) === 'Bench'
      );
      expect(benches.length).toBe(1);
    });
  });

  describe('LamppostBuilder', () => {
    it('should create lamppost type with lighting and surveillance properties', async () => {
      const builder = new LamppostBuilder(manager);
      await builder.build();
      await builder.registerAliases();

      const lamppost = await manager.load('lamppost');
      expect(lamppost).toBeTruthy();
      expect(lamppost?.get('name')).toBe('Lamppost');
      expect(lamppost?.get('lit')).toBe(true);
      expect(lamppost?.get('lightType')).toBe('led');
      expect(lamppost?.get('hasSurveillance')).toBe(false);
      expect(lamppost?.get('durability')).toBe(100);
      expect(lamppost?.get('boltedDown')).toBe(true);
    });

    it('should have damage method that reduces durability', async () => {
      const builder = new LamppostBuilder(manager);
      await builder.build();

      const lamppost = await manager.load('lamppost');
      expect(lamppost).toBeTruthy();

      // Apply damage
      const result = await lamppost?.executeMethod('damage', [30]);
      expect(lamppost?.get('durability')).toBe(70);
      expect(result).toContain('shudders');
    });

    it('should set flickering when durability drops below 30', async () => {
      const builder = new LamppostBuilder(manager);
      await builder.build();

      const lamppost = await manager.load('lamppost');

      // Damage to 29 durability (100 - 71)
      await lamppost?.executeMethod('damage', [71]);

      expect(lamppost?.get('durability')).toBe(29);
      expect(lamppost?.get('flickering')).toBe(true);
      expect(lamppost?.get('reportedMalfunction')).toBe(true);
    });

    it('should turn off light when durability reaches 0', async () => {
      const builder = new LamppostBuilder(manager);
      await builder.build();

      const lamppost = await manager.load('lamppost');

      // Destroy the lamppost
      await lamppost?.executeMethod('damage', [100]);

      expect(lamppost?.get('durability')).toBe(0);
      expect(lamppost?.get('lit')).toBe(false);
      expect(lamppost?.get('damaged')).toBe(true);
      expect(lamppost?.get('cameraStatus')).toBe('destroyed');
    });

    it('should repair lamppost and restore functionality', async () => {
      const builder = new LamppostBuilder(manager);
      await builder.build();

      const lamppost = await manager.load('lamppost');

      // Damage and then repair
      await lamppost?.executeMethod('damage', [100]);
      const result = await lamppost?.executeMethod('repair', []);

      expect(lamppost?.get('durability')).toBe(100);
      expect(lamppost?.get('lit')).toBe(true);
      expect(lamppost?.get('damaged')).toBe(false);
      expect(lamppost?.get('flickering')).toBe(false);
      expect(lamppost?.get('reportedMalfunction')).toBe(false);
      expect(result).toContain('repaired');
    });

    it('should log observations when surveillance is active', async () => {
      const builder = new LamppostBuilder(manager);
      await builder.build();

      const lamppost = await manager.load('lamppost');

      // Enable surveillance
      lamppost?.set('hasSurveillance', true);
      lamppost?.set('cameraStatus', 'active');

      // Log an observation
      const observation = await lamppost?.executeMethod('observe', [
        'person_detected',
        { who: 'Unknown', action: 'walking' }
      ]);

      expect(observation).toBeTruthy();
      expect(observation?.event).toBe('person_detected');
      expect(lamppost?.get('lastObservation')).toBeTruthy();
    });

    it('should not log observations when surveillance is disabled', async () => {
      const builder = new LamppostBuilder(manager);
      await builder.build();

      const lamppost = await manager.load('lamppost');

      // Surveillance off by default
      const observation = await lamppost?.executeMethod('observe', [
        'person_detected',
        { who: 'Unknown' }
      ]);

      expect(observation).toBeNull();
    });

    it('should disable surveillance camera', async () => {
      const builder = new LamppostBuilder(manager);
      await builder.build();

      const lamppost = await manager.load('lamppost');

      // Enable surveillance first
      lamppost?.set('hasSurveillance', true);
      lamppost?.set('cameraStatus', 'active');

      // Disable it
      const result = await lamppost?.executeMethod('disableSurveillance', []);

      expect(lamppost?.get('cameraStatus')).toBe('disabled');
      expect(result).toContain('disable');
    });
  });

  describe('ParkLampBuilder', () => {
    it('should create park lamp type inheriting from lamppost', async () => {
      const lamppostBuilder = new LamppostBuilder(manager);
      await lamppostBuilder.build();

      const builder = new ParkLampBuilder(manager);
      await builder.build();
      await builder.registerAliases();

      const parkLamp = await manager.load('parkLamp');
      expect(parkLamp).toBeTruthy();
      expect(parkLamp?.get('name')).toBe('Park Lamp');
      expect(parkLamp?.get('lightType')).toBe('warm');
      expect(parkLamp?.get('height')).toBe(300); // Shorter than street lamps
    });

    it('should inherit damage behavior from lamppost', async () => {
      const lamppostBuilder = new LamppostBuilder(manager);
      await lamppostBuilder.build();

      const builder = new ParkLampBuilder(manager);
      await builder.build();

      const parkLamp = await manager.load('parkLamp');

      // Should have damage method from parent
      const result = await parkLamp?.executeMethod('damage', [50]);
      expect(parkLamp?.get('durability')).toBe(50);
    });
  });

  describe('StreetSignBuilder', () => {
    it('should create street sign type with sign properties', async () => {
      // Need to create sign parent first
      const describableType = await manager.load('describable');
      const signType = await manager.define('sign', describableType!, {
        properties: { name: 'Sign', description: 'A sign', text: '' },
      });

      const builder = new StreetSignBuilder(manager);
      await builder.build();
      await builder.registerAliases();

      const streetSign = await manager.load('streetSign');
      expect(streetSign).toBeTruthy();
      expect(streetSign?.get('name')).toBe('Street Sign');
      expect(streetSign?.get('streetName')).toBe('Unknown Street');
      expect(streetSign?.get('signType')).toBe('metal');
      expect(streetSign?.get('legible')).toBe(true);
      expect(streetSign?.get('bulletHoles')).toBe(0);
    });

    it('should read street name correctly', async () => {
      const describableType = await manager.load('describable');
      const signType = await manager.define('sign', describableType!, {
        properties: { name: 'Sign', description: 'A sign', text: '' },
      });

      const builder = new StreetSignBuilder(manager);
      await builder.build();

      const streetSign = await manager.load('streetSign');
      streetSign?.set('streetName', 'Pike Street');
      streetSign?.set('direction', ['E', 'W']);
      streetSign?.set('blockNumber', '100');

      const text = await streetSign?.executeMethod('read', []);
      expect(text).toContain('100');
      expect(text).toContain('Pike Street');
      expect(text).toContain('E/W');
    });

    it('should handle graffiti vandalism', async () => {
      const describableType = await manager.load('describable');
      const signType = await manager.define('sign', describableType!, {
        properties: { name: 'Sign', description: 'A sign', text: '' },
      });

      const builder = new StreetSignBuilder(manager);
      await builder.build();

      const streetSign = await manager.load('streetSign');

      const result = await streetSign?.executeMethod('vandalize', ['graffiti', 'ANARCHY']);

      expect(streetSign?.get('graffiti')).toBe('ANARCHY');
      expect(streetSign?.get('damaged')).toBe(true);
      expect(result).toContain('spray paint');
    });

    it('should become illegible after too many bullet holes', async () => {
      const describableType = await manager.load('describable');
      const signType = await manager.define('sign', describableType!, {
        properties: { name: 'Sign', description: 'A sign', text: '' },
      });

      const builder = new StreetSignBuilder(manager);
      await builder.build();

      const streetSign = await manager.load('streetSign');

      // Shoot it 5 times
      for (let i = 0; i < 5; i++) {
        await streetSign?.executeMethod('vandalize', ['shoot']);
      }

      expect(streetSign?.get('bulletHoles')).toBe(5);
      expect(streetSign?.get('legible')).toBe(false);
    });

    it('should repair damaged signs', async () => {
      const describableType = await manager.load('describable');
      const signType = await manager.define('sign', describableType!, {
        properties: { name: 'Sign', description: 'A sign', text: '' },
      });

      const builder = new StreetSignBuilder(manager);
      await builder.build();

      const streetSign = await manager.load('streetSign');

      // Damage it
      await streetSign?.executeMethod('vandalize', ['graffiti', 'TAGGED']);
      await streetSign?.executeMethod('vandalize', ['shoot']);

      // Repair
      await streetSign?.executeMethod('repair', []);

      expect(streetSign?.get('damaged')).toBe(false);
      expect(streetSign?.get('legible')).toBe(true);
      expect(streetSign?.get('graffiti')).toBeNull();
      expect(streetSign?.get('bulletHoles')).toBe(0);
    });
  });

  describe('StreetSignalBuilder', () => {
    it('should create street signal type with traffic states', async () => {
      const builder = new StreetSignalBuilder(manager);
      await builder.build();
      await builder.registerAliases();

      const signal = await manager.load('streetSignal');
      expect(signal).toBeTruthy();
      expect(signal?.get('name')).toBe('Traffic Signal');
      expect(signal?.get('state')).toBe('red');
      expect(signal?.get('pedestrianState')).toBe('dont_walk');
      expect(signal?.get('hasSurveillance')).toBe(true);
      expect(signal?.get('cycleTime')).toBe(30);
    });

    it('should cycle through traffic light states', async () => {
      const builder = new StreetSignalBuilder(manager);
      await builder.build();

      const signal = await manager.load('streetSignal');

      // Start at red
      expect(signal?.get('state')).toBe('red');

      // Cycle to green
      await signal?.executeMethod('cycle', []);
      expect(signal?.get('state')).toBe('green');

      // Cycle to yellow
      await signal?.executeMethod('cycle', []);
      expect(signal?.get('state')).toBe('yellow');

      // Cycle back to red
      await signal?.executeMethod('cycle', []);
      expect(signal?.get('state')).toBe('red');
    });

    it('should override signal state with authorization', async () => {
      const builder = new StreetSignalBuilder(manager);
      await builder.build();

      const signal = await manager.load('streetSignal');

      const result = await signal?.executeMethod('override', ['green', true]);

      expect(signal?.get('state')).toBe('green');
      expect(result).toContain('green');
    });

    it('should log surveillance observations', async () => {
      const builder = new StreetSignalBuilder(manager);
      await builder.build();

      const signal = await manager.load('streetSignal');

      const observation = await signal?.executeMethod('observe', [
        'vehicle_detected',
        { type: 'sedan', license: 'ABC123' }
      ]);

      expect(observation).toBeTruthy();
      expect(observation?.event).toBe('vehicle_detected');
    });

    it('should malfunction when damaged', async () => {
      const builder = new StreetSignalBuilder(manager);
      await builder.build();

      const signal = await manager.load('streetSignal');

      // Damage the signal
      await signal?.executeMethod('damage', [100]);

      expect(signal?.get('malfunctioning')).toBe(true);
      expect(signal?.get('state')).toBe('flashing');
    });

    it('should report traffic violations', async () => {
      const builder = new StreetSignalBuilder(manager);
      await builder.build();

      const signal = await manager.load('streetSignal');

      // Report a red light runner
      const violation = await signal?.executeMethod('reportViolation', [
        'ran_red_light',
        { vehicle: 'sedan', license: 'XYZ789' }
      ]);

      expect(violation).toBeTruthy();

      const violations = signal?.get('violationLog') || [];
      expect(violations.length).toBeGreaterThan(0);
    });
  });

  describe('Integration tests', () => {
    it('should build all street furniture types together', async () => {
      // Create dependencies
      const describableType = await manager.load('describable');
      await manager.define('furniture', describableType!, {
        properties: { name: 'Furniture', description: 'A piece of furniture', weight: 20000 },
      });
      await manager.define('sign', describableType!, {
        properties: { name: 'Sign', description: 'A sign', text: '' },
      });

      // Build all street furniture
      const benchBuilder = new BenchBuilder(manager);
      await benchBuilder.build();

      const lamppostBuilder = new LamppostBuilder(manager);
      await lamppostBuilder.build();

      const parkLampBuilder = new ParkLampBuilder(manager);
      await parkLampBuilder.build();

      const streetSignBuilder = new StreetSignBuilder(manager);
      await streetSignBuilder.build();

      const streetSignalBuilder = new StreetSignalBuilder(manager);
      await streetSignalBuilder.build();

      // Verify all types exist
      expect(await manager.load('bench')).toBeTruthy();
      expect(await manager.load('lamppost')).toBeTruthy();
      expect(await manager.load('parkLamp')).toBeTruthy();
      expect(await manager.load('streetSign')).toBeTruthy();
      expect(await manager.load('streetSignal')).toBeTruthy();
    });
  });
});
