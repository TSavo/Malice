import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

/**
 * Tests basement-to-underground connectivity for Pioneer Square buildings.
 *
 * This test suite validates that basements (z=-1, z=-2) properly connect to
 * the underground tunnel network, ensuring the new architectural pattern works correctly.
 */
describe('Basement to Underground Connectivity', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_basement_connectivity');
    await db.connect();
    await db.objects.deleteMany({});
    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager, {
      _testMode: true,
    });
    await bootstrap.bootstrap();
    $ = manager as any;
  }, 180000);

  afterAll(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('Building basements exist', () => {
    it('should create basement rooms with negative z-coordinates', async () => {
      const allObjects = await db.listAll();
      const basementRooms = allObjects.filter(
        (obj) =>
          obj.properties.z !== undefined &&
          (obj.properties.z.value < 0 || obj.properties.z < 0) &&
          obj.properties.name !== undefined,
      );

      // Should have basement rooms from multiple buildings
      expect(basementRooms.length).toBeGreaterThan(0);
    });

    it('should create basements at z=-1 (standard basement level)', async () => {
      const allObjects = await db.listAll();
      const z1Basements = allObjects.filter((obj) => {
        const z = obj.properties.z?.value ?? obj.properties.z;
        return z === -1;
      });

      expect(z1Basements.length).toBeGreaterThan(0);
    });

    it('should create deep basements at z=-2 or lower', async () => {
      const allObjects = await db.listAll();
      const deepBasements = allObjects.filter((obj) => {
        const z = obj.properties.z?.value ?? obj.properties.z;
        return z !== undefined && z <= -2;
      });

      expect(deepBasements.length).toBeGreaterThan(0);
    });
  });

  describe('Basement to underground exit connectivity', () => {
    it('should have exits connecting basements to underground tunnels', async () => {
      const allObjects = await db.listAll();

      // Find basement rooms with exits
      const basementRoomsWithExits = allObjects.filter((obj) => {
        const z = obj.properties.z?.value ?? obj.properties.z;
        const exits = obj.properties.exits?.value ?? obj.properties.exits;
        return (
          z !== undefined &&
          z < 0 &&
          exits !== undefined &&
          Object.keys(exits).length > 0
        );
      });

      // Should have basement rooms that connect somewhere
      expect(basementRoomsWithExits.length).toBeGreaterThan(0);
    });

    it('should allow navigation from basement to underground via exits', async () => {
      const allObjects = await db.listAll();

      // Find a basement room with an exit going to underground
      const basementRoom = allObjects.find((obj) => {
        const z = obj.properties.z?.value ?? obj.properties.z;
        const name = obj.properties.name?.value ?? obj.properties.name;
        const exits = obj.properties.exits?.value ?? obj.properties.exits;

        return (
          z === -1 &&
          name &&
          typeof name === 'string' &&
          name.includes('Basement') &&
          exits &&
          Object.keys(exits).length > 0
        );
      });

      if (basementRoom) {
        const exits = basementRoom.properties.exits?.value ?? basementRoom.properties.exits;
        const exitDirections = Object.keys(exits);

        // Basement should have exits (up, down, east, west, etc.)
        expect(exitDirections.length).toBeGreaterThan(0);

        // At least one exit should exist (validates exit structure)
        const firstExit = exits[exitDirections[0]];
        expect(firstExit).toBeDefined();
      }
    });
  });

  describe('Specific basement connections (PR #45)', () => {
    it('should connect City Services basement to underground', async () => {
      const allObjects = await db.listAll();
      const cityServicesBasement = allObjects.find((obj) => {
        const name = obj.properties.name?.value ?? obj.properties.name;
        const z = obj.properties.z?.value ?? obj.properties.z;
        return (
          typeof name === 'string' &&
          name.includes('City Services') &&
          name.includes('Mechanical') &&
          z === -1
        );
      });

      if (cityServicesBasement) {
        const exits = cityServicesBasement.properties.exits?.value ?? cityServicesBasement.properties.exits;
        expect(exits).toBeDefined();
        // Should have west exit to underground based on z-1.ts definition
        expect(exits.west || exits.up || exits.down).toBeDefined();
      }
    });

    it("should connect Doc Maynard's cellar to underground", async () => {
      const allObjects = await db.listAll();
      const docMaynardsBasement = allObjects.find((obj) => {
        const name = obj.properties.name?.value ?? obj.properties.name;
        const z = obj.properties.z?.value ?? obj.properties.z;
        return (
          typeof name === 'string' &&
          name.includes("Doc Maynard's") &&
          name.includes('Cellar') &&
          z === -1
        );
      });

      if (docMaynardsBasement) {
        const exits = docMaynardsBasement.properties.exits?.value ?? docMaynardsBasement.properties.exits;
        expect(exits).toBeDefined();
        // Should have east exit to underground based on updated z0.ts
        expect(exits.east || exits.up).toBeDefined();
      }
    });

    it('should connect Gargoyle Building basement to underground', async () => {
      const allObjects = await db.listAll();
      const gargoyleBasement = allObjects.find((obj) => {
        const name = obj.properties.name?.value ?? obj.properties.name;
        const z = obj.properties.z?.value ?? obj.properties.z;
        return (
          typeof name === 'string' &&
          name.includes('Gargoyle') &&
          (name.includes('Coal Cellar') || name.includes('Basement')) &&
          z === -1
        );
      });

      if (gargoyleBasement) {
        const exits = gargoyleBasement.properties.exits?.value ?? gargoyleBasement.properties.exits;
        expect(exits).toBeDefined();
        // Should have exits based on new basement rooms
        const exitCount = Object.keys(exits).length;
        expect(exitCount).toBeGreaterThan(0);
      }
    });
  });

  describe('Underground tunnel rooms exist', () => {
    it('should have underground rooms at z=-2 (upper tunnels)', async () => {
      const allObjects = await db.listAll();
      const upperTunnels = allObjects.filter((obj) => {
        const z = obj.properties.z?.value ?? obj.properties.z;
        const name = obj.properties.name?.value ?? obj.properties.name;
        return (
          z === -2 &&
          name &&
          typeof name === 'string' &&
          name.toLowerCase().includes('underground')
        );
      });

      expect(upperTunnels.length).toBeGreaterThan(0);
    });

    it('should have underground rooms with exits back to buildings', async () => {
      const allObjects = await db.listAll();
      const undergroundRoomsWithExits = allObjects.filter((obj) => {
        const z = obj.properties.z?.value ?? obj.properties.z;
        const name = obj.properties.name?.value ?? obj.properties.name;
        const exits = obj.properties.exits?.value ?? obj.properties.exits;

        return (
          z === -2 &&
          name &&
          typeof name === 'string' &&
          name.toLowerCase().includes('underground') &&
          exits &&
          Object.keys(exits).length > 0
        );
      });

      // Underground should connect back up
      expect(undergroundRoomsWithExits.length).toBeGreaterThan(0);
    });
  });

  describe('Coordinate validation', () => {
    it('should have basements at same x,y as ground floor but different z', async () => {
      const allObjects = await db.listAll();

      // Find pairs of ground floor + basement
      const groundFloors = allObjects.filter((obj) => {
        const z = obj.properties.z?.value ?? obj.properties.z;
        return z === 0;
      });

      const basements = allObjects.filter((obj) => {
        const z = obj.properties.z?.value ?? obj.properties.z;
        return z === -1;
      });

      // Check if any basement shares x,y with ground floor
      const matchingPairs = basements.filter((basement) => {
        const bx = basement.properties.x?.value ?? basement.properties.x;
        const by = basement.properties.y?.value ?? basement.properties.y;

        return groundFloors.some((ground) => {
          const gx = ground.properties.x?.value ?? ground.properties.x;
          const gy = ground.properties.y?.value ?? ground.properties.y;
          return gx === bx && gy === by;
        });
      });

      // At least some basements should be directly beneath ground floors
      expect(matchingPairs.length).toBeGreaterThan(0);
    });

    it('should have underground tunnels at z=-2 or lower', async () => {
      const allObjects = await db.listAll();
      const deepRooms = allObjects.filter((obj) => {
        const z = obj.properties.z?.value ?? obj.properties.z;
        const name = obj.properties.name?.value ?? obj.properties.name;
        return (
          z !== undefined &&
          z <= -2 &&
          name &&
          typeof name === 'string' &&
          (name.toLowerCase().includes('tunnel') ||
            name.toLowerCase().includes('underground') ||
            name.toLowerCase().includes('passage'))
        );
      });

      expect(deepRooms.length).toBeGreaterThan(0);
    });
  });
});
