import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { PrototypeBuilder } from '../../src/database/bootstrap/prototype-builder.js';
import { AliasLoader } from '../../src/database/bootstrap/alias-loader.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('PrototypeBuilder', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let builder: PrototypeBuilder;

  beforeEach(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_prototype_builder');
    await db.connect();

    // Clean database
    await db['objects'].deleteMany({});

    // Create ObjectManager #0 and Root #1
    await db.create({
      _id: 0,
      parent: 0,
      properties: {
        name: 'ObjectManager',
        aliases: { object_manager: 0, root: 1 }
      },
      methods: {},
    });

    await db.create({
      _id: 1,
      parent: 0,
      properties: { name: 'Root' },
      methods: {},
    });

    manager = new ObjectManager(db);
    builder = new PrototypeBuilder(manager);
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('buildPrototypes()', () => {
    it('should create all prototype objects', async () => {
      await builder.buildPrototypes();

      // Load aliases to access objects
      const aliasLoader = new AliasLoader(manager);
      await aliasLoader.loadAliases();

      const describable = (manager as any).describable;
      const agent = (manager as any).agent;
      const human = (manager as any).human;
      const player = (manager as any).player;

      expect(describable).toBeTruthy();
      expect(agent).toBeTruthy();
      expect(human).toBeTruthy();
      expect(player).toBeTruthy();
    });

    it('should set correct parent relationships', async () => {
      await builder.buildPrototypes();

      const aliasLoader = new AliasLoader(manager);
      await aliasLoader.loadAliases();

      const $ = manager as any;

      const describableParent = $.describable.getParent();
      const agentParent = $.agent.getParent();
      const humanParent = $.human.getParent();
      const playerParent = $.player.getParent();

      expect(describableParent).toBe($.root.id);
      expect(agentParent).toBe($.describable.id);
      expect(humanParent).toBe($.agent.id);
      expect(playerParent).toBe($.human.id);
    });

    it('should register aliases in root', async () => {
      await builder.buildPrototypes();

      const objectManager = await manager.load(0);
      const aliases = objectManager!.get('aliases') as Record<string, number>;

      expect(aliases.describable).toBeTruthy();
      expect(aliases.agent).toBeTruthy();
      expect(aliases.human).toBeTruthy();
      expect(aliases.player).toBeTruthy();
    });

    it('should be idempotent', async () => {
      await builder.buildPrototypes();
      await builder.buildPrototypes();
      await builder.buildPrototypes();

      const aliasLoader = new AliasLoader(manager);
      await aliasLoader.loadAliases();

      const $ = manager as any;

      expect($.describable).toBeTruthy();
      expect($.agent).toBeTruthy();
      expect($.human).toBeTruthy();
      expect($.player).toBeTruthy();
    });
  });

  describe('Describable prototype', () => {
    beforeEach(async () => {
      await builder.buildPrototypes();
      const aliasLoader = new AliasLoader(manager);
      await aliasLoader.loadAliases();
    });

    it('should have correct properties', async () => {
      const $ = manager as any;
      const describable = $.describable;

      expect(describable.get('name')).toBe('Describable');
      expect(describable.get('description')).toBeTruthy();
      expect(describable.get('aliases')).toEqual([]);
    });

    it('should have describe method', async () => {
      const $ = manager as any;
      expect($.describable.hasMethod('describe')).toBe(true);
    });

    it('should have shortDesc method', async () => {
      const $ = manager as any;
      expect($.describable.hasMethod('shortDesc')).toBe(true);
    });
  });

  describe('Agent prototype', () => {
    beforeEach(async () => {
      await builder.buildPrototypes();
      const aliasLoader = new AliasLoader(manager);
      await aliasLoader.loadAliases();
    });

    it('should have correct properties', async () => {
      const $ = manager as any;
      const agent = $.agent;

      expect(agent.get('name')).toBe('Agent');
      expect(agent.get('location')).toBeNull(); // Inherited from Describable
      // inventory is not set on the prototype - would be set on instances
    });

    it('should have moveTo method', async () => {
      const $ = manager as any;
      expect($.agent.hasMethod('moveTo')).toBe(true);
    });

    it('should have say method', async () => {
      const $ = manager as any;
      expect($.agent.hasMethod('say')).toBe(true);
    });

    it('should have emote method', async () => {
      const $ = manager as any;
      expect($.agent.hasMethod('emote')).toBe(true);
    });

    it('should inherit from Describable', async () => {
      const $ = manager as any;
      expect($.agent.getParent()).toBe($.describable.id);
    });
  });

  describe('Human prototype', () => {
    beforeEach(async () => {
      await builder.buildPrototypes();
      const aliasLoader = new AliasLoader(manager);
      await aliasLoader.loadAliases();
    });

    it('should have correct properties', async () => {
      const $ = manager as any;
      const human = $.human;

      expect(human.get('name')).toBe('Human');
      expect(human.get('sex')).toBe('non-binary');
      expect(human.get('age')).toBe(25);
      expect(human.get('species')).toBe('human');
    });

    it('should have pronouns property', async () => {
      const $ = manager as any;
      const pronouns = $.human.get('pronouns') as any;

      expect(pronouns.subject).toBe('they');
      expect(pronouns.object).toBe('them');
      expect(pronouns.possessive).toBe('their');
    });

    it('should have pronoun method', async () => {
      const $ = manager as any;
      expect($.human.hasMethod('pronoun')).toBe(true);
    });

    it('should inherit from Agent', async () => {
      const $ = manager as any;
      expect($.human.getParent()).toBe($.agent.id);
    });
  });

  describe('Player prototype', () => {
    beforeEach(async () => {
      await builder.buildPrototypes();
      const aliasLoader = new AliasLoader(manager);
      await aliasLoader.loadAliases();
    });

    it('should have authentication properties', async () => {
      const $ = manager as any;
      const player = $.player;

      expect(player.get('playername')).toBe('');
      expect(player.get('email')).toBe('');
      expect(player.get('passwordHash')).toBe('');
    });

    it('should have permission properties', async () => {
      const $ = manager as any;
      const player = $.player;

      expect(player.get('canUseDevTools')).toBe(false);
      expect(player.get('isWizard')).toBe(false);
      expect(player.get('isSuspended')).toBe(false);
    });

    it('should have stat properties', async () => {
      const $ = manager as any;
      const player = $.player;

      expect(player.get('createdAt')).toBeNull();
      expect(player.get('lastLogin')).toBeNull();
      expect(player.get('totalPlaytime')).toBe(0);
    });

    it('should have connect method', async () => {
      const $ = manager as any;
      expect($.player.hasMethod('connect')).toBe(true);
    });

    it('should have disconnect method', async () => {
      const $ = manager as any;
      expect($.player.hasMethod('disconnect')).toBe(true);
    });

    it('should have checkPassword method', async () => {
      const $ = manager as any;
      expect($.player.hasMethod('checkPassword')).toBe(true);
    });

    it('should have setPassword method', async () => {
      const $ = manager as any;
      expect($.player.hasMethod('setPassword')).toBe(true);
    });

    it('should inherit from Human', async () => {
      const $ = manager as any;
      const player = $.player;
      const human = $.human;

      expect(player).toBeTruthy();
      expect(human).toBeTruthy();
      expect(player.getParent()).toBe(human.id);
    });
  });

  describe('Inheritance chain', () => {
    beforeEach(async () => {
      await builder.buildPrototypes();
      const aliasLoader = new AliasLoader(manager);
      await aliasLoader.loadAliases();
    });

    it('should create proper inheritance hierarchy', async () => {
      const $ = manager as any;

      // Player -> Human -> Agent -> Describable -> Root
      expect($.player.getParent()).toBe($.human.id);
      expect($.human.getParent()).toBe($.agent.id);
      expect($.agent.getParent()).toBe($.describable.id);
      expect($.describable.getParent()).toBe($.root.id);
    });
  });
});
