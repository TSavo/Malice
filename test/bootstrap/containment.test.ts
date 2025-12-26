import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('Containment System', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  const toId = (value: any): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && typeof value.id === 'number')
      return value.id;
    return null;
  };

  const contentsIds = (container: any): number[] => {
    const contents = container?.contents || [];
    return contents
      .map((c: any) => toId(c))
      .filter((id: number | null): id is number => typeof id === 'number');
  };

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_containment');
    await db.connect();
    await db.objects.deleteMany({});
    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager, {
      worldBuildMode: 'systems',
      disableDefaultJobs: true,
    });
    await bootstrap.bootstrap();
    $ = manager as any;
  }, 30000);

  afterAll(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('moveTo()', () => {
    it('should move object to a room', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Target Room' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Test Item' },
        },
        null,
      );

      await item.moveTo(room);

      expect(toId(item.location)).toBe(room.id);
      expect(contentsIds(room)).toContain(item.id);
    });

    it('should update source contents when moving', async () => {
      const room1 = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Source Room' },
        },
        null,
      );

      const room2 = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Dest Room' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Moving Item' },
        },
        null,
      );

      await item.moveTo(room1);
      expect(contentsIds(room1)).toContain(item.id);

      await item.moveTo(room2);
      expect(contentsIds(room1)).not.toContain(item.id);
      expect(contentsIds(room2)).toContain(item.id);
      expect(toId(item.location)).toBe(room2.id);
    });

    it('should accept object ID as destination', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'ID Target Room' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'ID Test Item' },
        },
        null,
      );

      await item.moveTo(room.id);

      expect(toId(item.location)).toBe(room.id);
    });

    it('should throw on invalid destination', async () => {
      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Invalid Dest Item' },
        },
        null,
      );

      await expect(item.moveTo(null)).rejects.toThrow('Invalid destination');
    });

    it('should throw on non-existent destination', async () => {
      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Non-existent Dest Item' },
        },
        null,
      );

      await expect(item.moveTo(99999)).rejects.toThrow('Invalid destination');
    });
  });

  describe('canContain()', () => {
    it('should allow rooms to contain anything', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Accepting Room' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Test Item' },
        },
        null,
      );

      const result = await room.canContain(item);
      expect(result).toBe(true);
    });

    it('should prevent basic describable from containing', async () => {
      const container = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Not a Container' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Test Item' },
        },
        null,
      );

      const result = await container.canContain(item);
      expect(typeof result).toBe('string'); // Returns rejection reason
      expect(result).toContain('cannot contain');
    });

    it('should respect custom canContain overrides', async () => {
      const container = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Custom Container' },
        },
        null,
      );

      container.setMethod(
        'canContain',
        `
        const obj = args[0];
        if (obj.name === 'Allowed Item') return true;
        return 'Only allowed items can go in here.';
      `,
      );

      const allowed = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Allowed Item' },
        },
        null,
      );

      const forbidden = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Forbidden Item' },
        },
        null,
      );

      expect(await container.canContain(allowed)).toBe(true);
      expect(await container.canContain(forbidden)).toContain('Only allowed');
    });
  });

  describe('Location hooks', () => {
    it('should call onLeaving before move', async () => {
      const room1 = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Hook Source Room' },
        },
        null,
      );

      const room2 = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Hook Dest Room' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Hook Item', leavingCalled: false },
        },
        null,
      );

      item.setMethod(
        'onLeaving',
        `
        self.leavingCalled = true;
      `,
      );

      await item.moveTo(room1);
      await item.moveTo(room2);

      expect(item.leavingCalled).toBe(true);
    });

    it('should call onArrived after move', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Arrival Room' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Arriving Item', arrivedCalled: false },
        },
        null,
      );

      item.setMethod(
        'onArrived',
        `
        self.arrivedCalled = true;
      `,
      );

      await item.moveTo(room);

      expect(item.arrivedCalled).toBe(true);
    });

    it('should call onContentLeft on source', async () => {
      const room1 = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Content Left Room', contentLeftCalled: false },
        },
        null,
      );

      room1.setMethod(
        'onContentLeft',
        `
        self.contentLeftCalled = true;
      `,
      );

      const room2 = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Dest Room' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Leaving Item' },
        },
        null,
      );

      await item.moveTo(room1);
      await item.moveTo(room2);

      expect(room1.contentLeftCalled).toBe(true);
    });

    it('should call onContentArrived on destination', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: {
            name: 'Content Arrived Room',
            contentArrivedCalled: false,
          },
        },
        null,
      );

      room.setMethod(
        'onContentArrived',
        `
        self.contentArrivedCalled = true;
      `,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Arriving Item' },
        },
        null,
      );

      await item.moveTo(room);

      expect(room.contentArrivedCalled).toBe(true);
    });

    it('should pass mover argument to hooks', async () => {
      const room1 = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Mover Test Source' },
        },
        null,
      );

      const room2 = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Mover Test Dest', receivedMover: null },
        },
        null,
      );

      room2.setMethod(
        'onContentArrived',
        `
        const obj = args[0];
        const source = args[1];
        const mover = args[2];
        self.receivedMover = mover?.id;
      `,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Moved Item' },
        },
        null,
      );

      const mover = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'The Mover' },
        },
        null,
      );

      await item.moveTo(room1);
      await item.moveTo(room2, mover);

      expect(room2.receivedMover).toBe(mover.id);
    });
  });

  describe('Containment chain', () => {
    it('should track nested containment', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Outer Room' },
        },
        null,
      );

      const box = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'Box' },
        },
        null,
      );

      // Make box containable
      box.setMethod('canContain', `return true;`);

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Small Item' },
        },
        null,
      );

      await box.moveTo(room);
      await item.moveTo(box);

      expect(toId(box.location)).toBe(room.id);
      expect(toId(item.location)).toBe(box.id);
      expect(contentsIds(room)).toContain(box.id);
      expect(contentsIds(box)).toContain(item.id);
    });
  });

  describe('Location addContent/removeContent', () => {
    it('should add content via addContent', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Add Content Room' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Added Item' },
        },
        null,
      );

      await room.addContent(item.id);

      expect(contentsIds(room)).toContain(item.id);
    });

    it('should remove content via removeContent', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Remove Content Room' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Removed Item' },
        },
        null,
      );

      await room.addContent(item.id);
      await room.removeContent(item.id);

      expect(contentsIds(room)).not.toContain(item.id);
    });

    it('should not duplicate content on multiple adds', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'No Dup Content Room' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Single Item' },
        },
        null,
      );

      await room.addContent(item.id);
      await room.addContent(item.id);
      await room.addContent(item.id);

      const count = contentsIds(room).filter(
        (id: number) => id === item.id,
      ).length;
      expect(count).toBe(1);
    });
  });

  describe('Physical dimensions', () => {
    it('should calculate volume', async () => {
      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Volume Item', width: 10, height: 20, depth: 5 },
        },
        null,
      );

      const volume = await item.getVolume();
      expect(volume).toBe(1000); // 10 * 20 * 5
    });

    it('should return 0 volume for unset dimensions', async () => {
      const item = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'No Dims Item' },
        },
        null,
      );

      const volume = await item.getVolume();
      expect(volume).toBe(0);
    });
  });

  describe('Dimension-based containment', () => {
    it('should check if object fits in container', async () => {
      const container = await $.recycler.create(
        {
          parent: $.describable,
          properties: {
            name: 'Big Container',
            width: 100,
            height: 100,
            depth: 100,
          },
        },
        null,
      );

      const smallItem = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Small Item', width: 10, height: 10, depth: 10 },
        },
        null,
      );

      const bigItem = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Big Item', width: 200, height: 200, depth: 200 },
        },
        null,
      );

      expect(await smallItem.canFitIn(container)).toBe(true);
      expect(await bigItem.canFitIn(container)).toBe(false);
    });
  });
});
