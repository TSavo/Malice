import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('GuardedExit', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_guarded_exit');
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

  describe('GuardedExit prototype', () => {
    it('should exist as a type', async () => {
      const guardedExit = await manager.load('guardedExit');
      expect(guardedExit).toBeTruthy();
      expect(guardedExit?.get('name')).toBe('Guarded Exit');
    });

    it('should inherit from exit', async () => {
      const guardedExit = await manager.load('guardedExit');
      const exit = await manager.load('exit');
      expect(guardedExit?.parent).toBe(exit);
    });

    it('should have allowedFaction property', async () => {
      const guardedExit = await manager.load('guardedExit');
      expect(guardedExit?.get('allowedFaction')).toBe(null);
    });

    it('should have denyMessage property', async () => {
      const guardedExit = await manager.load('guardedExit');
      expect(guardedExit?.get('denyMessage')).toBe(
        'You are not authorized to pass.',
      );
    });

    it('should have canUse method', async () => {
      const guardedExit = await manager.load('guardedExit');
      const method = await guardedExit?.getMethodCode('canUse');
      expect(method).toBeTruthy();
      expect(method?.code).toContain('$factionManager');
    });

    it('should have setAllowedFaction method', async () => {
      const guardedExit = await manager.load('guardedExit');
      const method = await guardedExit?.getMethodCode('setAllowedFaction');
      expect(method).toBeTruthy();
      expect(method?.code).toContain('allowedFaction');
    });

    it('should have setDenyMessage method', async () => {
      const guardedExit = await manager.load('guardedExit');
      const method = await guardedExit?.getMethodCode('setDenyMessage');
      expect(method).toBeTruthy();
      expect(method?.code).toContain('denyMessage');
    });

    it('should have describe method', async () => {
      const guardedExit = await manager.load('guardedExit');
      const method = await guardedExit?.getMethodCode('describe');
      expect(method).toBeTruthy();
      expect(method?.code).toContain('allowedFaction');
    });
  });

  describe('Faction-based access control', () => {
    let testRoom: any;
    let testDestination: any;
    let testExit: any;
    let testPlayer: any;
    let continuum: any;
    let cartel: any;

    beforeAll(async () => {
      // Create test rooms
      testRoom = await $.recycler.create($.room, {
        name: 'Test Room',
        description: 'A test room',
        x: 0,
        y: 0,
        z: 0,
      });

      testDestination = await $.recycler.create($.room, {
        name: 'Test Destination',
        description: 'A test destination',
        x: 1,
        y: 0,
        z: 0,
      });

      // Create test player
      testPlayer = await $.recycler.create($.player, {
        name: 'TestPlayer',
        playername: 'testplayer',
      });
      await testPlayer.moveTo(testRoom);

      // Get faction references
      continuum = await manager.load('continuum');
      cartel = await manager.load('cartel');
    });

    it('should allow unrestricted access when allowedFaction is null', async () => {
      // Create unrestricted exit
      testExit = await $.recycler.create($.guardedExit, {
        name: 'north',
        destination: testDestination.id,
        allowedFaction: null,
      });

      const result = await testExit.canUse(testPlayer);
      expect(result.allowed).toBe(true);
    });

    it('should deny access when player has no faction', async () => {
      // Create Continuum-restricted exit
      testExit = await $.recycler.create($.guardedExit, {
        name: 'north',
        destination: testDestination.id,
        allowedFaction: 'Continuum',
      });

      // Player has no faction
      const result = await testExit.canUse(testPlayer);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not authorized');
    });

    it('should allow access when player faction matches', async () => {
      // Assign player to Continuum
      await $.factionManager.setMembership(testPlayer, continuum);

      // Create Continuum-restricted exit
      testExit = await $.recycler.create($.guardedExit, {
        name: 'north',
        destination: testDestination.id,
        allowedFaction: 'Continuum',
      });

      const result = await testExit.canUse(testPlayer);
      expect(result.allowed).toBe(true);
    });

    it('should deny access when player faction does not match', async () => {
      // Assign player to Cartel
      await $.factionManager.setMembership(testPlayer, cartel);

      // Create Continuum-restricted exit
      testExit = await $.recycler.create($.guardedExit, {
        name: 'north',
        destination: testDestination.id,
        allowedFaction: 'Continuum',
      });

      const result = await testExit.canUse(testPlayer);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not authorized');
    });

    it('should allow Gray Cartel members through cartel exits', async () => {
      // Assign player to Gray Cartel
      await $.factionManager.setMembership(testPlayer, cartel);

      // Create Gray Cartel-restricted exit
      testExit = await $.recycler.create($.guardedExit, {
        name: 'down',
        destination: testDestination.id,
        allowedFaction: 'Gray Cartel',
      });

      const result = await testExit.canUse(testPlayer);
      expect(result.allowed).toBe(true);
    });

    it('should use custom deny message', async () => {
      // Create exit with custom message
      testExit = await $.recycler.create($.guardedExit, {
        name: 'north',
        destination: testDestination.id,
        allowedFaction: 'Continuum',
        denyMessage: 'A padlock secures the door. You lack the key.',
      });

      // Player has no faction
      await $.factionManager.setMembership(testPlayer, null);

      const result = await testExit.canUse(testPlayer);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        'A padlock secures the door. You lack the key.',
      );
    });
  });

  describe('setAllowedFaction method', () => {
    let testExit: any;
    let testDestination: any;

    beforeAll(async () => {
      testDestination = await $.recycler.create($.room, {
        name: 'Destination',
        x: 2,
        y: 0,
        z: 0,
      });

      testExit = await $.recycler.create($.guardedExit, {
        name: 'east',
        destination: testDestination.id,
      });
    });

    it('should set allowed faction', async () => {
      const result = await testExit.setAllowedFaction('Continuum');
      expect(result.success).toBe(true);
      expect(result.faction).toBe('Continuum');
      expect(testExit.allowedFaction).toBe('Continuum');
    });

    it('should clear allowed faction when passed null', async () => {
      await testExit.setAllowedFaction('Continuum');
      const result = await testExit.setAllowedFaction(null);
      expect(result.success).toBe(true);
      expect(result.faction).toBe(null);
      expect(testExit.allowedFaction).toBe(null);
    });
  });

  describe('setDenyMessage method', () => {
    let testExit: any;
    let testDestination: any;

    beforeAll(async () => {
      testDestination = await $.recycler.create($.room, {
        name: 'Destination',
        x: 3,
        y: 0,
        z: 0,
      });

      testExit = await $.recycler.create($.guardedExit, {
        name: 'west',
        destination: testDestination.id,
      });
    });

    it('should set custom deny message', async () => {
      await testExit.setDenyMessage('Access denied by security.');
      expect(testExit.denyMessage).toBe('Access denied by security.');
    });

    it('should reset to default when passed null', async () => {
      await testExit.setDenyMessage('Custom message');
      await testExit.setDenyMessage(null);
      expect(testExit.denyMessage).toBe('You are not authorized to pass.');
    });
  });

  describe('describe method', () => {
    let testExit: any;
    let testDestination: any;

    beforeAll(async () => {
      testDestination = await $.recycler.create($.room, {
        name: 'Destination',
        x: 4,
        y: 0,
        z: 0,
      });
    });

    it('should show faction restriction in description', async () => {
      testExit = await $.recycler.create($.guardedExit, {
        name: 'south',
        destination: testDestination.id,
        distance: 10,
        allowedFaction: 'Continuum',
      });

      const desc = await testExit.describe();
      expect(desc).toContain('Continuum only');
      expect(desc).toContain('10m');
    });

    it('should not show restriction when allowedFaction is null', async () => {
      testExit = await $.recycler.create($.guardedExit, {
        name: 'south',
        destination: testDestination.id,
        distance: 10,
        allowedFaction: null,
      });

      const desc = await testExit.describe();
      expect(desc).not.toContain('only');
      expect(desc).toContain('10m');
    });

    it('should show locked status', async () => {
      testExit = await $.recycler.create($.guardedExit, {
        name: 'south',
        destination: testDestination.id,
        distance: 10,
        allowedFaction: 'Gray Cartel',
        locked: true,
      });

      const desc = await testExit.describe();
      expect(desc).toContain('Gray Cartel only');
      expect(desc).toContain('locked');
    });
  });

  describe('Layered security (faction + lock)', () => {
    let testRoom: any;
    let testDestination: any;
    let testExit: any;
    let testPlayer: any;
    let cartel: any;

    beforeAll(async () => {
      testRoom = await $.recycler.create($.room, {
        name: 'Secure Room',
        x: 5,
        y: 0,
        z: 0,
      });

      testDestination = await $.recycler.create($.room, {
        name: 'Vault',
        x: 5,
        y: 1,
        z: 0,
      });

      testPlayer = await $.recycler.create($.player, {
        name: 'SecureTestPlayer',
        playername: 'securetestplayer',
      });
      await testPlayer.moveTo(testRoom);

      cartel = await manager.load('cartel');
    });

    it('should check faction before lock', async () => {
      // Create exit with both faction and lock
      testExit = await $.recycler.create($.guardedExit, {
        name: 'vault',
        destination: testDestination.id,
        allowedFaction: 'Gray Cartel',
        locked: true,
      });

      // Player has no faction - should fail on faction check
      const result = await testExit.canUse(testPlayer);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not authorized');
      expect(result.reason).not.toContain('locked');
    });

    it('should check lock after faction passes', async () => {
      // Assign player to correct faction
      await $.factionManager.setMembership(testPlayer, cartel);

      // Create locked exit
      testExit = await $.recycler.create($.guardedExit, {
        name: 'vault',
        destination: testDestination.id,
        allowedFaction: 'Gray Cartel',
        locked: true,
      });

      // Should fail on lock check
      const result = await testExit.canUse(testPlayer);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('locked');
    });

    it('should allow passage when both faction and lock pass', async () => {
      // Assign player to correct faction
      await $.factionManager.setMembership(testPlayer, cartel);

      // Create unlocked exit
      testExit = await $.recycler.create($.guardedExit, {
        name: 'vault',
        destination: testDestination.id,
        allowedFaction: 'Gray Cartel',
        locked: false,
      });

      const result = await testExit.canUse(testPlayer);
      expect(result.allowed).toBe(true);
    });
  });
});
