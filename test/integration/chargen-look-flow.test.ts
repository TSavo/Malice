import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { MinimalBootstrap } from '../../src/database/bootstrap/minimal-bootstrap.js';
import { PrototypeBuilder } from '../../src/database/bootstrap/prototype-builder.js';
import { AliasLoader } from '../../src/database/bootstrap/alias-loader.js';
import type { RuntimeObject } from '../../types/object.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

/**
 * Integration tests for complete character creation and look flow
 * Tests the interaction between Player, Room, Location, and look command
 */
describe('Character Creation and Look Flow Integration', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let mockContext: any;
  let sentMessages: string[];

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_chargen_look');
    await db.connect();
    await db['objects'].deleteMany({});

    // Create ObjectManager first
    manager = new ObjectManager(db);

    // Bootstrap the system
    const minimal = new MinimalBootstrap(manager);
    await minimal.bootstrap();

    const builder = new PrototypeBuilder(manager);
    await builder.buildPrototypes();

    const aliasLoader = new AliasLoader(manager);
    await aliasLoader.loadAliases();

    // Mock connection context
    sentMessages = [];
    mockContext = {
      send: (msg: string) => { sentMessages.push(msg); },
      question: async () => '',
      choice: async () => '',
      yesorno: async () => false,
      setHandler: () => {},
    };
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('Look Command Flow', () => {
    let room: RuntimeObject;
    let player: RuntimeObject;

    beforeEach(async () => {
      const $ = manager as any;

      // Create exits first
      const northExit = await manager.create({
        parent: $.exit.id,
        properties: { name: 'north', destRoom: null },
        methods: {},
      });
      const westExit = await manager.create({
        parent: $.exit.id,
        properties: { name: 'west', destRoom: null },
        methods: {},
      });

      // Create room with exits
      room = await manager.create({
        parent: $.room.id,
        properties: {
          name: 'Tavern',
          description: 'A cozy tavern with wooden tables and a roaring fireplace.',
          exits: [northExit.id, westExit.id],
          contents: [],
        },
        methods: {},
      });

      // Create player
      player = await manager.create({
        parent: $.player.id,
        properties: {
          playername: 'Diana',
          name: 'Diana the Bold',
          description: 'A fearless warrior',
          location: room.id,
        },
        methods: {},
      });

      // Add player to room
      await room.call('addContent', player.id);
    });

    it('should execute look command and get room description', async () => {
      // Use callVerb to properly pass player context (as verb system would)
      const result = await player.callVerb('look', mockContext, player, 'look', []) as string;

      expect(result).toContain('Tavern');
      expect(result).toContain('A cozy tavern with wooden tables and a roaring fireplace.');
      // Exits include distance by default
      expect(result).toContain('Obvious exits:');
      expect(result).toContain('north');
      expect(result).toContain('west');
    });

    it('should not show the player in their own room description', async () => {
      const result = await player.callVerb('look', mockContext, player, 'look', []) as string;

      // Player should NOT see themselves in the room
      expect(result).not.toContain('Diana the Bold');
    });

    it('should show other players in the room', async () => {
      const $ = manager as any;

      // Create another player in the same room
      const otherPlayer = await manager.create({
        parent: $.player.id,
        properties: {
          playername: 'Eve',
          name: 'Eve the Clever',
          description: 'A cunning rogue',
          location: room.id,
        },
        methods: {},
      });

      await room.call('addContent', otherPlayer.id);

      const result = await player.callVerb('look', mockContext, player, 'look', []) as string;

      // Should see the other player
      expect(result).toContain('You see:');
      expect(result).toContain('Eve the Clever');

      // Should NOT see themselves
      expect(result).not.toContain('Diana the Bold');
    });
  });

  describe('Full Chargen to Look Flow', () => {
    it('should complete full flow: create character → place in room → connect → look', async () => {
      const $ = manager as any;

      // Create exits first
      const northExit = await manager.create({
        parent: $.exit.id,
        properties: { name: 'north', destRoom: null },
        methods: {},
      });
      const southExit = await manager.create({
        parent: $.exit.id,
        properties: { name: 'south', destRoom: null },
        methods: {},
      });
      const eastExit = await manager.create({
        parent: $.exit.id,
        properties: { name: 'east', destRoom: null },
        methods: {},
      });
      const westExit = await manager.create({
        parent: $.exit.id,
        properties: { name: 'west', destRoom: null },
        methods: {},
      });

      // Step 1: Create starting room with exits
      const startRoom = await manager.create({
        parent: $.room.id,
        properties: {
          name: 'Newbie Landing',
          description: 'A safe haven for new adventurers. A signpost points to various destinations.',
          exits: [northExit.id, southExit.id, eastExit.id, westExit.id],
          contents: [],
        },
        methods: {},
      });

      // Step 2: Create new player character
      const newPlayer = await manager.create({
        parent: $.player.id,
        properties: {
          playername: 'henry',
          name: 'Henry',
          description: 'A fresh-faced adventurer, eager to explore the world.',
          location: startRoom.id,
          sex: 'male',
          pronouns: { subject: 'he', object: 'him', possessive: 'his' },
          age: 22,
        },
        methods: {},
      });

      // Step 3: Place in room
      await startRoom.call('addContent', newPlayer.id);

      // Step 4: Connect player
      sentMessages = [];
      await newPlayer.call('connect', mockContext);

      const connectOutput = sentMessages.join('');
      expect(connectOutput).toContain('Welcome back, Henry!');

      // Step 5: Execute look command directly (not via onInput, to test core look functionality)
      const lookResult = await newPlayer.callVerb('look', mockContext, newPlayer, 'look', []) as string;

      expect(lookResult).toContain('Newbie Landing');
      expect(lookResult).toContain('A safe haven for new adventurers.');
      expect(lookResult).toContain('Obvious exits:');
      expect(lookResult).toContain('north');
      expect(lookResult).not.toContain('Henry'); // Should not see self
    });
  });
});
