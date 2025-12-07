import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('Room Navigation', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_room_navigation');
    await db.connect();
    await db['objects'].deleteMany({});
    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager);
    await bootstrap.bootstrap();
    $ = manager as any;
  }, 30000);

  afterAll(async () => {
    await db.disconnect();
  });

  describe('Room creation', () => {
    it('should create a room with default properties', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Test Room', description: 'A test room.' },
      }, null);

      expect(room.name).toBe('Test Room');
      expect(room.description).toBe('A test room.');
      expect(room.exits).toEqual([]);
      expect(room.contents).toEqual([]);
      expect(room.x).toBe(0);
      expect(room.y).toBe(0);
      expect(room.z).toBe(0);
    });

    it('should create a room with coordinates', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Positioned Room', x: 10, y: 20, z: -5 },
      }, null);

      expect(room.x).toBe(10);
      expect(room.y).toBe(20);
      expect(room.z).toBe(-5);
    });
  });

  describe('Exit creation and linking', () => {
    it('should create an exit with destination', async () => {
      const room1 = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Room 1' },
      }, null);

      const room2 = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Room 2' },
      }, null);

      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: {
          name: 'north',
          aliases: ['n'],
          destRoom: room2.id,
          distance: 10,
        },
      }, null);

      await room1.addExit(exit);

      expect(room1.exits).toContain(exit.id);
      expect(exit.destRoom).toBe(room2.id);
    });

    it('should find exit by name', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Find Exit Room' },
      }, null);

      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'south', aliases: ['s'], destRoom: 999 },
      }, null);

      await room.addExit(exit);

      const found = await room.findExit('south');
      expect(found).toBeTruthy();
      expect(found.id).toBe(exit.id);
    });

    it('should find exit by alias', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Alias Exit Room' },
      }, null);

      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'northeast', aliases: ['ne'], destRoom: 999 },
      }, null);

      await room.addExit(exit);

      const found = await room.findExit('ne');
      expect(found).toBeTruthy();
      expect(found.id).toBe(exit.id);
    });

    it('should return null for non-existent exit', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'No Exit Room' },
      }, null);

      const found = await room.findExit('up');
      expect(found).toBeNull();
    });

    it('should remove exit by direction', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Remove Exit Room' },
      }, null);

      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'west', aliases: ['w'], destRoom: 999 },
      }, null);

      await room.addExit(exit);
      expect(room.exits).toContain(exit.id);

      await room.removeExit('west');
      expect(room.exits).not.toContain(exit.id);
    });

    it('should get all exits as objects', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'All Exits Room' },
      }, null);

      const exit1 = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'north', destRoom: 999 },
      }, null);

      const exit2 = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'south', destRoom: 998 },
      }, null);

      await room.addExit(exit1);
      await room.addExit(exit2);

      const exits = await room.getExits();
      expect(exits).toHaveLength(2);
      expect(exits.map((e: any) => e.name)).toContain('north');
      expect(exits.map((e: any) => e.name)).toContain('south');
    });
  });

  describe('Exit matching', () => {
    it('should match case-insensitively', async () => {
      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'North', aliases: ['N'], destRoom: 999 },
      }, null);

      expect(await exit.matches('north')).toBe(true);
      expect(await exit.matches('NORTH')).toBe(true);
      expect(await exit.matches('n')).toBe(true);
      expect(await exit.matches('N')).toBe(true);
    });

    it('should not match unrelated directions', async () => {
      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'north', aliases: ['n'], destRoom: 999 },
      }, null);

      expect(await exit.matches('south')).toBe(false);
      expect(await exit.matches('s')).toBe(false);
      expect(await exit.matches('no')).toBe(false);
    });
  });

  describe('Exit canUse', () => {
    it('should allow using unlocked exit', async () => {
      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'door', locked: false, destRoom: 999 },
      }, null);

      const result = await exit.canUse(null);
      expect(result.allowed).toBe(true);
    });

    it('should prevent using locked exit', async () => {
      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'locked door', locked: true, destRoom: 999 },
      }, null);

      const result = await exit.canUse(null);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('locked');
    });
  });

  describe('Exit lock/unlock', () => {
    it('should unlock a locked exit', async () => {
      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'gate', locked: true, destRoom: 999 },
      }, null);

      const result = await exit.unlock(null, null);

      expect(result.success).toBe(true);
      expect(exit.locked).toBe(false);
    });

    it('should not unlock already unlocked exit', async () => {
      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'open gate', locked: false, destRoom: 999 },
      }, null);

      const result = await exit.unlock(null, null);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not locked');
    });

    it('should lock an unlocked exit', async () => {
      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'door', locked: false, destRoom: 999 },
      }, null);

      const result = await exit.lock();

      expect(result.success).toBe(true);
      expect(exit.locked).toBe(true);
    });

    it('should require correct key if lockKey is set', async () => {
      const key = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'brass key' },
      }, null);

      const wrongKey = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'iron key' },
      }, null);

      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'locked door', locked: true, lockKey: key.id, destRoom: 999 },
      }, null);

      const wrongResult = await exit.unlock(null, wrongKey);
      expect(wrongResult.success).toBe(false);
      expect(wrongResult.message).toContain('does not fit');

      const rightResult = await exit.unlock(null, key);
      expect(rightResult.success).toBe(true);
    });
  });

  describe('Room coordinates', () => {
    it('should get coordinates', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Coord Room', x: 5, y: 10, z: -2 },
      }, null);

      const coords = await room.getCoordinates();

      expect(coords).toEqual({ x: 5, y: 10, z: -2 });
    });

    it('should set coordinates', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Set Coord Room' },
      }, null);

      await room.setCoordinates(15, 25, 3);

      expect(room.x).toBe(15);
      expect(room.y).toBe(25);
      expect(room.z).toBe(3);
    });

    it('should round coordinates to integers', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Round Coord Room' },
      }, null);

      await room.setCoordinates(5.7, 10.3, -2.9);

      expect(room.x).toBe(6);
      expect(room.y).toBe(10);
      expect(room.z).toBe(-3);
    });

    it('should calculate distance between rooms', async () => {
      const room1 = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Room 1', x: 0, y: 0, z: 0 },
      }, null);

      const room2 = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Room 2', x: 3, y: 4, z: 0 },
      }, null);

      const distance = await room1.distanceTo(room2);

      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('should calculate 3D distance', async () => {
      const room1 = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Room 1', x: 0, y: 0, z: 0 },
      }, null);

      const room2 = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Room 2', x: 2, y: 2, z: 1 },
      }, null);

      const distance = await room1.distanceTo(room2);

      expect(distance).toBe(3); // sqrt(4+4+1) = 3
    });

    it('should determine direction to another room', async () => {
      const center = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Center', x: 0, y: 0, z: 0 },
      }, null);

      const north = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'North', x: 0, y: 10, z: 0 },
      }, null);

      const southeast = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Southeast', x: 10, y: -10, z: 0 },
      }, null);

      const above = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Above', x: 0, y: 0, z: 20 },
      }, null);

      expect(await center.directionTo(north)).toBe('n');
      expect(await center.directionTo(southeast)).toBe('se');
      expect(await center.directionTo(above)).toBe('up');
    });
  });

  describe('Room describe', () => {
    it('should describe room with exits', async () => {
      const room1 = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Grand Hall', description: 'A magnificent hall.' },
      }, null);

      const room2 = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Kitchen' },
      }, null);

      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'north', aliases: ['n'], destRoom: room2.id, distance: 5 },
      }, null);

      await room1.addExit(exit);

      const desc = await room1.describe(null);

      expect(desc).toContain('Grand Hall');
      expect(desc).toContain('magnificent hall');
      expect(desc).toContain('north');
    });

    it('should not show hidden exits', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Secret Room', description: 'Looks ordinary.' },
      }, null);

      const visibleExit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'door', hidden: false, destRoom: 999 },
      }, null);

      const hiddenExit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'secret passage', hidden: true, destRoom: 998 },
      }, null);

      await room.addExit(visibleExit);
      await room.addExit(hiddenExit);

      const desc = await room.describe(null);

      expect(desc).toContain('door');
      expect(desc).not.toContain('secret passage');
    });

    it('should show locked status in exit description', async () => {
      const exit = await $.recycler.create({
        parent: $.exit.id,
        properties: { name: 'gate', locked: true, distance: 5, destRoom: 999 },
      }, null);

      const desc = await exit.describe();

      expect(desc).toContain('locked');
    });
  });

  describe('Room crowd mechanics', () => {
    it('should return base population as crowd level', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Busy Room', population: 50 },
      }, null);

      const crowd = await room.getCrowdLevel();

      expect(crowd).toBe(50);
    });

    it('should return noise level based on ambient and crowd', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Noisy Room', population: 40, ambientNoise: 20 },
      }, null);

      const noise = await room.getNoiseLevel();

      // 20 ambient + (40 * 0.5) crowd noise = 40
      expect(noise).toBe(40);
    });

    it('should describe crowd level', async () => {
      const emptyRoom = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Empty', population: 5 },
      }, null);

      const packedRoom = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Packed', population: 90 },
      }, null);

      const emptyDesc = await emptyRoom.getCrowdDescription();
      const packedDesc = await packedRoom.getCrowdDescription();

      expect(emptyDesc).toContain('quiet');
      expect(packedDesc).toContain('packed');
    });
  });

  describe('Room contents', () => {
    it('should add content to room', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Container Room' },
      }, null);

      const item = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Item' },
      }, null);

      await room.addContent(item.id);

      expect(room.contents).toContain(item.id);
    });

    it('should remove content from room', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'Remove Content Room' },
      }, null);

      const item = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Item' },
      }, null);

      await room.addContent(item.id);
      await room.removeContent(item.id);

      expect(room.contents).not.toContain(item.id);
    });

    it('should not add duplicate content', async () => {
      const room = await $.recycler.create({
        parent: $.room.id,
        properties: { name: 'No Dup Room' },
      }, null);

      const item = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Item' },
      }, null);

      await room.addContent(item.id);
      await room.addContent(item.id);
      await room.addContent(item.id);

      expect(room.contents.filter((id: number) => id === item.id)).toHaveLength(1);
    });
  });
});
