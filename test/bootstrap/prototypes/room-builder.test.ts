import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RoomBuilder } from '../../../src/database/bootstrap/prototypes/room-builder.js';
import { MinimalBootstrap } from '../../../src/database/bootstrap/minimal-bootstrap.js';
import { ObjectDatabase } from '../../../src/database/object-db.js';
import { ObjectManager } from '../../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('RoomBuilder', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let builder: RoomBuilder;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_room_builder');
    await db.connect();

    // Clean database
    await (db as any).objects.deleteMany({});

    manager = new ObjectManager(db);

    // Set up minimal bootstrap (Root, System, and core aliases)
    const bootstrap = new MinimalBootstrap(manager);
    await bootstrap.bootstrap();

    builder = new RoomBuilder(manager);
  });

  afterEach(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('build()', () => {
    it('should create room prototype without throwing', async () => {
      await expect(builder.build()).resolves.not.toThrow();
    });

    it('should register $room alias', async () => {
      await builder.build();
      await builder.registerAliases();

      const $ = manager as any;
      expect($.room).toBeDefined();
      expect($.room.id).toBeGreaterThan(0);
    });

    it('should create room with default imagePrompt property', async () => {
      await builder.build();
      await builder.registerAliases();

      const $ = manager as any;
      const room = $.room;

      const imagePrompt = room.get('imagePrompt');
      expect(imagePrompt).toBeDefined();
      expect(typeof imagePrompt).toBe('string');
      expect(imagePrompt).toContain('${name}');
      expect(imagePrompt).toContain('${description}');
    });

    it('should have imagePrompt with room-specific details first', async () => {
      await builder.build();
      await builder.registerAliases();

      const $ = manager as any;
      const room = $.room;

      const imagePrompt = room.get('imagePrompt');
      // Room-specific template should come before generic setting
      const lines = imagePrompt.split('\n');
      expect(lines[0]).toContain('${name}');
      expect(lines[0]).toContain('${description}');
    });

    it('should have imageNegativePrompt property', async () => {
      await builder.build();
      await builder.registerAliases();

      const $ = manager as any;
      const room = $.room;

      const negPrompt = room.get('imageNegativePrompt');
      expect(negPrompt).toBeDefined();
      expect(typeof negPrompt).toBe('string');
      expect(negPrompt).toContain('people');
    });
  });

  describe('getImagePrompt() method', () => {
    beforeEach(async () => {
      await builder.build();
      await builder.registerAliases();
    });

    it('should exist on room prototype', async () => {
      const $ = manager as any;
      const room = $.room;

      expect(room.getMethod('getImagePrompt')).toBeDefined();
    });

    it('should return prompt with room-specific details first', async () => {
      const $ = manager as any;
      const room = $.room;

      // Create a test room instance
      const testRoom = await manager.create({
        parent: room,
        properties: {
          name: 'Test Room',
          description: 'A simple test room',
          outdoor: true,
        },
      });

      // Call getImagePrompt
      const result = await testRoom.call('getImagePrompt');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.prompt).toBeDefined();

      // Room-specific content should appear BEFORE generic context
      const prompt = result.prompt;
      const testRoomIndex = prompt.indexOf('Test Room');
      const seattleIndex = prompt.indexOf('Seattle 2110');

      expect(testRoomIndex).toBeGreaterThan(-1);
      expect(seattleIndex).toBeGreaterThan(-1);
      expect(testRoomIndex).toBeLessThan(seattleIndex);
    });
  });

  describe('imageOnDisk property support', () => {
    it('should allow imageOnDisk property on room instances', async () => {
      await builder.build();
      await builder.registerAliases();

      const $ = manager as any;
      const room = $.room;

      const testRoom = await manager.create({
        parent: room,
        properties: {
          name: 'Test Room',
          imageOnDisk: 'test-room-x0-y0-z0.png',
        },
      });

      expect(testRoom.get('imageOnDisk')).toBe('test-room-x0-y0-z0.png');
    });
  });
});
