import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('Perception Filter System', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_perception');
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

  describe('Agent perceptionFilters property', () => {
    it('should have perceptionFilters as empty array by default', async () => {
      const agent = await $.recycler.create(
        {
          parent: $.agent,
          properties: { name: 'Test Agent' },
        },
        null,
      );

      expect(agent.perceptionFilters).toEqual([]);
    });

    it('should add perception filter via addPerceptionFilter', async () => {
      const agent = await $.recycler.create(
        {
          parent: $.agent,
          properties: { name: 'Filter Agent' },
        },
        null,
      );

      const filter = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Test Filter' },
        },
        null,
      );

      const result = await agent.addPerceptionFilter(filter, filter);

      expect(result.success).toBe(true);
      expect(agent.perceptionFilters.length).toBe(1);
      expect(agent.perceptionFilters[0].source.id).toBe(filter.id);
    });

    it('should prevent duplicate filters from same source', async () => {
      const agent = await $.recycler.create(
        {
          parent: $.agent,
          properties: { name: 'Dup Filter Agent' },
        },
        null,
      );

      const filter = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Dup Filter' },
        },
        null,
      );

      await agent.addPerceptionFilter(filter, filter);
      const result = await agent.addPerceptionFilter(filter, filter);

      expect(result.success).toBe(false);
      expect(result.message).toContain('already active');
    });

    it('should remove perception filter via removePerceptionFilter', async () => {
      const agent = await $.recycler.create(
        {
          parent: $.agent,
          properties: { name: 'Remove Filter Agent' },
        },
        null,
      );

      const filter = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Remove Filter' },
        },
        null,
      );

      await agent.addPerceptionFilter(filter, filter);
      expect(agent.perceptionFilters.length).toBe(1);

      const result = await agent.removePerceptionFilter(filter);

      expect(result.success).toBe(true);
      expect(agent.perceptionFilters.length).toBe(0);
    });

    it('should return filters via getPerceptionFilters', async () => {
      const agent = await $.recycler.create(
        {
          parent: $.agent,
          properties: { name: 'Get Filter Agent' },
        },
        null,
      );

      const filter1 = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Filter 1' },
        },
        null,
      );

      const filter2 = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Filter 2' },
        },
        null,
      );

      await agent.addPerceptionFilter(filter1, filter1);
      await agent.addPerceptionFilter(filter2, filter2);

      const filters = await agent.getPerceptionFilters();

      expect(filters.length).toBe(2);
    });

    it('should return failure when removing non-existent filter', async () => {
      const agent = await $.recycler.create(
        {
          parent: $.agent,
          properties: { name: 'NoFilter Agent' },
        },
        null,
      );

      const filter = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'NonExistent Filter' },
        },
        null,
      );

      const result = await agent.removePerceptionFilter(filter);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No filter');
    });
  });

  describe('Room describe() with perception filters', () => {
    it('should call modifyRoomDescription on filters', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: {
            name: 'Test Room',
            description: 'A simple room.',
          },
        },
        null,
      );

      // Create a filter that modifies room description
      const filter = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Visual Filter' },
          methods: {
            modifyRoomDescription: `
            const output = args[0];
            return output + '\\r\\n[FILTER OVERLAY]';
          `,
          },
        },
        null,
      );

      const viewer = await $.recycler.create(
        {
          parent: $.agent,
          properties: { name: 'Viewer' },
        },
        null,
      );

      // Add filter to viewer
      await viewer.addPerceptionFilter(filter, filter);

      // Describe room from viewer's perspective
      const description = await room.describe(viewer);

      expect(description).toContain('Test Room');
      expect(description).toContain('[FILTER OVERLAY]');
    });

    it('should not modify description for viewers without filters', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: {
            name: 'Normal Room',
            description: 'An ordinary room.',
          },
        },
        null,
      );

      const viewer = await $.recycler.create(
        {
          parent: $.agent,
          properties: { name: 'Normal Viewer' },
        },
        null,
      );

      const description = await room.describe(viewer);

      expect(description).toContain('Normal Room');
      expect(description).not.toContain('[FILTER');
    });

    it('should apply multiple filters in order', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: {
            name: 'Multi Filter Room',
            description: 'Base description.',
          },
        },
        null,
      );

      const filter1 = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Filter A' },
          methods: {
            modifyRoomDescription: `
            return args[0] + ' [A]';
          `,
          },
        },
        null,
      );

      const filter2 = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Filter B' },
          methods: {
            modifyRoomDescription: `
            return args[0] + ' [B]';
          `,
          },
        },
        null,
      );

      const viewer = await $.recycler.create(
        {
          parent: $.agent,
          properties: { name: 'Multi Viewer' },
        },
        null,
      );

      await viewer.addPerceptionFilter(filter1, filter1);
      await viewer.addPerceptionFilter(filter2, filter2);

      const description = await room.describe(viewer);

      expect(description).toContain('[A]');
      expect(description).toContain('[B]');
      // Filters apply in order, so A then B
      expect(description.indexOf('[A]')).toBeLessThan(
        description.indexOf('[B]'),
      );
    });
  });

  describe('to verb with perception filters', () => {
    it('should check filters for addressable entities', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Chat Room' },
        },
        null,
      );

      // Create a filter that provides addressable entity
      const filter = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Entity Filter' },
          methods: {
            getAddressableEntities: `
            return ['ghost'];
          `,
            onAddressed: `
            const speaker = args[0];
            const target = args[1];
            const message = args[2];
            return 'The ghost hears: ' + message;
          `,
          },
        },
        null,
      );

      const speaker = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Speaker' },
        },
        null,
      );

      await speaker.moveTo(room);
      await speaker.addPerceptionFilter(filter, filter);

      // Use the to verb to address the ghost
      const result = await speaker.callVerb(
        'to',
        {},
        speaker,
        'to ghost hello there',
        [],
      );

      expect(result).toContain('The ghost hears: hello there');
    });

    it('should fall back to room lookup if no filter claims target', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Fallback Room' },
        },
        null,
      );

      const speaker = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Fallback Speaker' },
        },
        null,
      );

      await speaker.moveTo(room);

      // No filter, no target in room
      const result = await speaker.callVerb(
        'to',
        {},
        speaker,
        'to nobody hello',
        [],
      );

      expect(result).toContain("don't see");
    });

    it('should handle multiple filters with different addressable entities', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: { name: 'Multi Entity Room' },
        },
        null,
      );

      const ghostFilter = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Ghost Filter' },
          methods: {
            getAddressableEntities: `return ['ghost'];`,
            onAddressed: `return 'Ghost responds: ' + args[2];`,
          },
        },
        null,
      );

      const demonFilter = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Demon Filter' },
          methods: {
            getAddressableEntities: `return ['demon'];`,
            onAddressed: `return 'Demon responds: ' + args[2];`,
          },
        },
        null,
      );

      const speaker = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Multi Entity Speaker' },
        },
        null,
      );

      await speaker.moveTo(room);
      await speaker.addPerceptionFilter(ghostFilter, ghostFilter);
      await speaker.addPerceptionFilter(demonFilter, demonFilter);

      const ghostResult = await speaker.callVerb(
        'to',
        {},
        speaker,
        'to ghost hello',
        [],
      );
      const demonResult = await speaker.callVerb(
        'to',
        {},
        speaker,
        'to demon greetings',
        [],
      );

      expect(ghostResult).toContain('Ghost responds: hello');
      expect(demonResult).toContain('Demon responds: greetings');
    });
  });

  describe('Sensory hooks', () => {
    it('should call onSee hook when agent sees something', async () => {
      // Create a filter that tracks what was seen
      const filter = await $.recycler.create(
        {
          parent: $.describable,
          properties: {
            name: 'See Tracker',
            seenMessages: [],
          },
          methods: {
            onSee: `
            const message = args[0];
            const seen = self.seenMessages || [];
            seen.push(message);
            self.seenMessages = seen;
          `,
          },
        },
        null,
      );

      const agent = await $.recycler.create(
        {
          parent: $.human,
          properties: {
            name: 'Seeing Agent',
            conscious: true,
          },
        },
        null,
      );

      // Give agent a body with eyes
      await $.bodyFactory.createHumanBody(agent);
      await agent.addPerceptionFilter(filter, filter);

      // Make agent see something
      await agent.see('A bright flash!', null);

      // Check filter received the hook
      expect(filter.seenMessages).toContain('A bright flash!');
    });

    it('should call onHear hook when agent hears something', async () => {
      const filter = await $.recycler.create(
        {
          parent: $.describable,
          properties: {
            name: 'Hear Tracker',
            heardMessages: [],
          },
          methods: {
            onHear: `
            const message = args[0];
            const heard = self.heardMessages || [];
            heard.push(message);
            self.heardMessages = heard;
          `,
          },
        },
        null,
      );

      const agent = await $.recycler.create(
        {
          parent: $.human,
          properties: {
            name: 'Hearing Agent',
            conscious: true,
          },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(agent);
      await agent.addPerceptionFilter(filter, filter);

      await agent.hear('A loud noise!', null, null);

      expect(filter.heardMessages.length).toBeGreaterThan(0);
    });

    it('should call onFeel hook when agent feels something', async () => {
      const filter = await $.recycler.create(
        {
          parent: $.describable,
          properties: {
            name: 'Feel Tracker',
            feltMessages: [],
          },
          methods: {
            onFeel: `
            const message = args[0];
            const felt = self.feltMessages || [];
            felt.push(message);
            self.feltMessages = felt;
          `,
          },
        },
        null,
      );

      const agent = await $.recycler.create(
        {
          parent: $.human,
          properties: {
            name: 'Feeling Agent',
            conscious: true,
          },
        },
        null,
      );

      await agent.addPerceptionFilter(filter, filter);

      await agent.feel('A cold breeze', null);

      expect(filter.feltMessages).toContain('A cold breeze');
    });

    it('should call onSmell hook when agent smells something', async () => {
      const filter = await $.recycler.create(
        {
          parent: $.describable,
          properties: {
            name: 'Smell Tracker',
            smelledMessages: [],
          },
          methods: {
            onSmell: `
            const message = args[0];
            const smelled = self.smelledMessages || [];
            smelled.push(message);
            self.smelledMessages = smelled;
          `,
          },
        },
        null,
      );

      const agent = await $.recycler.create(
        {
          parent: $.human,
          properties: {
            name: 'Smelling Agent',
            conscious: true,
          },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(agent);
      await agent.addPerceptionFilter(filter, filter);

      await agent.smell('Fresh coffee', null);

      expect(filter.smelledMessages).toContain('Fresh coffee');
    });

    it('should call onTaste hook when agent tastes something', async () => {
      const filter = await $.recycler.create(
        {
          parent: $.describable,
          properties: {
            name: 'Taste Tracker',
            tastedMessages: [],
          },
          methods: {
            onTaste: `
            const message = args[0];
            const tasted = self.tastedMessages || [];
            tasted.push(message);
            self.tastedMessages = tasted;
          `,
          },
        },
        null,
      );

      const agent = await $.recycler.create(
        {
          parent: $.human,
          properties: {
            name: 'Tasting Agent',
            conscious: true,
          },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(agent);
      await agent.addPerceptionFilter(filter, filter);

      await agent.taste('Sweet honey', null);

      expect(filter.tastedMessages).toContain('Sweet honey');
    });

    it('should call hooks on multiple filters', async () => {
      const filter1 = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Filter 1', sawCount: 0 },
          methods: {
            onSee: `self.sawCount = (self.sawCount || 0) + 1;`,
          },
        },
        null,
      );

      const filter2 = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Filter 2', sawCount: 0 },
          methods: {
            onSee: `self.sawCount = (self.sawCount || 0) + 1;`,
          },
        },
        null,
      );

      const agent = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Multi Filter Agent', conscious: true },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(agent);
      await agent.addPerceptionFilter(filter1, filter1);
      await agent.addPerceptionFilter(filter2, filter2);

      await agent.see('Something', null);

      expect(filter1.sawCount).toBe(1);
      expect(filter2.sawCount).toBe(1);
    });
  });
});

describe('Pluribus System Object', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_pluribus');
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

  it('should have pluribus alias registered', async () => {
    expect($.pluribus).toBeDefined();
    expect($.pluribus.name).toBe('Pluribus');
  });

  it('should have systemPrompt property', async () => {
    expect($.pluribus.systemPrompt).toBeDefined();
    expect($.pluribus.systemPrompt).toContain('Pluribus');
    expect($.pluribus.systemPrompt).toContain('infrastructure');
  });

  it('should have empty sensoryHistory initially', async () => {
    expect($.pluribus.sensoryHistory).toEqual([]);
  });

  it('should record sensory events', async () => {
    await $.pluribus.recordSensory('see', 'A person walks by', null);
    await $.pluribus.recordSensory('hear', 'Footsteps echo', null);

    const history = $.pluribus.sensoryHistory;
    expect(history.length).toBe(2);
    expect(history[0].type).toBe('see');
    expect(history[0].content).toBe('A person walks by');
    expect(history[1].type).toBe('hear');
  });

  it('should get recent history', async () => {
    // Clear history first
    $.pluribus.sensoryHistory = [];

    await $.pluribus.recordSensory('see', 'Event 1', null);
    await $.pluribus.recordSensory('see', 'Event 2', null);
    await $.pluribus.recordSensory('see', 'Event 3', null);

    const recent = await $.pluribus.getRecentHistory(2);
    expect(recent.length).toBe(2);
  });

  it('should skip "You" messages in recording', async () => {
    $.pluribus.sensoryHistory = [];

    await $.pluribus.recordSensory('see', 'You walk north.', null);
    await $.pluribus.recordSensory('see', 'Someone else walks by.', null);

    expect($.pluribus.sensoryHistory.length).toBe(1);
    expect($.pluribus.sensoryHistory[0].content).toBe('Someone else walks by.');
  });

  it('should format history for prompt', async () => {
    $.pluribus.sensoryHistory = [];

    await $.pluribus.recordSensory('see', 'Test event', null);

    const formatted = await $.pluribus.formatHistoryForPrompt(10);
    expect(formatted).toContain('SENSORY AWARENESS');
    expect(formatted).toContain('SEE');
    expect(formatted).toContain('Test event');
  });

  it('should respect history limit', async () => {
    $.pluribus.sensoryHistory = [];
    $.pluribus.historyLimit = 5;

    for (let i = 0; i < 10; i++) {
      await $.pluribus.recordSensory('see', `Event ${i}`, null);
    }

    expect($.pluribus.sensoryHistory.length).toBe(5);
    // Should have the last 5 events
    expect($.pluribus.sensoryHistory[0].content).toBe('Event 5');
    expect($.pluribus.sensoryHistory[4].content).toBe('Event 9');
  });

  it('should skip empty messages', async () => {
    $.pluribus.sensoryHistory = [];

    await $.pluribus.recordSensory('see', '', null);
    await $.pluribus.recordSensory('see', '   ', null);
    await $.pluribus.recordSensory('see', 'Valid message', null);

    expect($.pluribus.sensoryHistory.length).toBe(1);
  });

  it('should describe Pluribus conceptually', async () => {
    const desc = await $.pluribus.describe();
    expect(desc).toContain('presence');
    expect(desc).toContain('infrastructure');
  });
});

describe('The Mask Wearable', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_mask');
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

  describe('Basic properties', () => {
    it('should have theMask alias registered', async () => {
      expect($.theMask).toBeDefined();
      expect($.theMask.name).toBe('The Mask');
    });

    it('should cover face slot', async () => {
      expect($.theMask.covers).toContain('face');
    });

    it('should be inactive initially', async () => {
      expect($.theMask.bondState).toBe('inactive');
      expect($.theMask.wearer).toBeNull();
    });
  });

  describe('Wearing the Mask', () => {
    it('should add perception filter when worn', async () => {
      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Mask Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);

      const result = await $.theMask.wear(wearer);

      expect(result.success).toBe(true);
      expect($.theMask.bondState).toBe('bonded');
      expect($.theMask.wearer.id).toBe(wearer.id);
      expect(wearer.perceptionFilters.length).toBe(1);

      // Cleanup
      await $.theMask.remove(wearer);
    });

    it('should register think verb on wearer', async () => {
      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Think Verb Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);

      // Check that think verb is registered
      const verbs = wearer.verbs || {};
      const hasThinkVerb = Object.keys(verbs).some((pattern) =>
        pattern.includes('think'),
      );
      expect(hasThinkVerb).toBe(true);

      // Cleanup
      await $.theMask.remove(wearer);
    });

    it('should fail if already worn by someone else', async () => {
      const wearer1 = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'First Wearer' },
        },
        null,
      );

      const wearer2 = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Second Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer1);
      await $.bodyFactory.createHumanBody(wearer2);

      await $.theMask.wear(wearer1);
      const result = await $.theMask.wear(wearer2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already bonded');

      // Cleanup
      await $.theMask.remove(wearer1);
    });

    it('should fail if already worn by same person', async () => {
      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Double Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);
      const result = await $.theMask.wear(wearer);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already wearing');

      // Cleanup
      await $.theMask.remove(wearer);
    });
  });

  describe('Perception filter interface', () => {
    let wearer: any;

    beforeEach(async () => {
      // Ensure mask is not worn
      if ($.theMask.wearer) {
        await $.theMask.remove($.theMask.wearer);
      }

      wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Filter Test Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);
    });

    it('should provide pluribus as addressable entity when bonded', async () => {
      const entities = await $.theMask.getAddressableEntities();
      expect(entities).toContain('pluribus');
    });

    it('should return empty array when not bonded', async () => {
      await $.theMask.remove(wearer);
      const entities = await $.theMask.getAddressableEntities();
      expect(entities).toEqual([]);
    });

    it('should modify room description to show Pluribus', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: {
            name: 'Mask Test Room',
            description: 'A test room.',
          },
        },
        null,
      );

      await wearer.moveTo(room);

      const description = await room.describe(wearer);

      expect(description).toContain('Pluribus');
      expect(description).toContain('perception');
    });

    it('should not modify description for non-wearers', async () => {
      const room = await $.recycler.create(
        {
          parent: $.room,
          properties: {
            name: 'Non Wearer Room',
            description: 'A normal room.',
          },
        },
        null,
      );

      const nonWearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Non Wearer' },
        },
        null,
      );

      await nonWearer.moveTo(room);

      const description = await room.describe(nonWearer);

      expect(description).not.toContain('Pluribus');
    });
  });

  describe('Removing the Mask', () => {
    beforeEach(async () => {
      // Ensure mask is not worn from previous tests
      if ($.theMask.wearer) {
        await $.theMask.remove($.theMask.wearer);
      }
    });

    it('should remove perception filter when removed', async () => {
      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Remove Filter Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);

      expect(wearer.perceptionFilters.length).toBe(1);

      const result = await $.theMask.remove(wearer);

      expect(result.success).toBe(true);
      expect($.theMask.bondState).toBe('inactive');
      expect($.theMask.wearer).toBeNull();
      expect(wearer.perceptionFilters.length).toBe(0);
    });

    it('should unregister think verb when removed', async () => {
      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Unregister Verb Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);

      // Verify think verb exists
      const verbsBefore = wearer.verbs || {};
      const hasThinkBefore = Object.keys(verbsBefore).some((p) =>
        p.includes('think'),
      );
      expect(hasThinkBefore).toBe(true);

      await $.theMask.remove(wearer);

      // Verify think verb removed
      const verbsAfter = wearer.verbs || {};
      const hasThinkAfter = Object.keys(verbsAfter).some((p) =>
        p.includes('think'),
      );
      expect(hasThinkAfter).toBe(false);
    });

    it('should fail if not worn', async () => {
      // Ensure not worn
      if ($.theMask.wearer) {
        await $.theMask.remove($.theMask.wearer);
      }

      const result = await $.theMask.remove(null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not being worn');
    });

    it('should fail if someone else tries to remove it', async () => {
      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Removal Victim' },
        },
        null,
      );

      const thief = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Mask Thief' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);

      const result = await $.theMask.remove(thief);

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot remove');

      // Cleanup
      await $.theMask.remove(wearer);
    });
  });

  describe('Sensory forwarding to Pluribus', () => {
    it('should forward sensory events to Pluribus when bonded', async () => {
      // Reset Pluribus history
      $.pluribus.sensoryHistory = [];

      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Sensory Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);

      // Trigger a see event via the mask's onSee hook
      await $.theMask.onSee('Test visual input', null);

      expect($.pluribus.sensoryHistory.length).toBeGreaterThan(0);
      expect($.pluribus.sensoryHistory[0].content).toBe('Test visual input');

      // Cleanup
      await $.theMask.remove(wearer);
    });

    it('should forward hear events to Pluribus', async () => {
      $.pluribus.sensoryHistory = [];

      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Hear Sensory Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);

      await $.theMask.onHear('Test audio input', null);

      expect(
        $.pluribus.sensoryHistory.some((e) => e.content === 'Test audio input'),
      ).toBe(true);

      await $.theMask.remove(wearer);
    });

    it('should forward smell events to Pluribus', async () => {
      $.pluribus.sensoryHistory = [];

      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Smell Sensory Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);

      await $.theMask.onSmell('Burning ozone', null);

      expect(
        $.pluribus.sensoryHistory.some((e) => e.content === 'Burning ozone'),
      ).toBe(true);

      await $.theMask.remove(wearer);
    });

    it('should forward taste events to Pluribus', async () => {
      $.pluribus.sensoryHistory = [];

      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Taste Sensory Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);

      await $.theMask.onTaste('Metallic tang', null);

      expect(
        $.pluribus.sensoryHistory.some((e) => e.content === 'Metallic tang'),
      ).toBe(true);

      await $.theMask.remove(wearer);
    });

    it('should forward feel events to Pluribus', async () => {
      $.pluribus.sensoryHistory = [];

      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Feel Sensory Wearer' },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);

      await $.theMask.onFeel('Cold metal', null);

      expect(
        $.pluribus.sensoryHistory.some((e) => e.content === 'Cold metal'),
      ).toBe(true);

      await $.theMask.remove(wearer);
    });

    it('should not forward events when not bonded', async () => {
      $.pluribus.sensoryHistory = [];

      // Ensure mask is not worn
      if ($.theMask.wearer) {
        await $.theMask.remove($.theMask.wearer);
      }

      await $.theMask.onSee('Should not appear', null);

      expect($.pluribus.sensoryHistory.length).toBe(0);
    });
  });

  describe('onThink for silent communication', () => {
    beforeEach(async () => {
      // Ensure mask is not worn from previous tests
      if ($.theMask.wearer) {
        await $.theMask.remove($.theMask.wearer);
      }
    });

    it('should handle silent thinking when bonded', async () => {
      const wearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'Think Wearer', messages: [] },
          methods: {
            tell: `
            const messages = self.messages || [];
            messages.push(args[0]);
            self.messages = messages;
          `,
          },
        },
        null,
      );

      await $.bodyFactory.createHumanBody(wearer);
      await $.theMask.wear(wearer);

      // Simulate onThink being called (normally via verb dispatch)
      // Use callVerb to properly pass player in context
      await $.theMask.callVerb('onThink', {}, wearer, 'think Hello Pluribus', [
        'Hello Pluribus',
      ]);

      // Check the thinker received the echo
      expect(wearer.messages.some((m: string) => m.includes('You think'))).toBe(
        true,
      );

      await $.theMask.remove(wearer);
    });

    it('should return failure message when not bonded', async () => {
      // Ensure not worn
      if ($.theMask.wearer) {
        await $.theMask.remove($.theMask.wearer);
      }

      const nonWearer = await $.recycler.create(
        {
          parent: $.human,
          properties: { name: 'NonWearer' },
        },
        null,
      );

      const result = await $.theMask.callVerb(
        'onThink',
        {},
        nonWearer,
        'think Hello',
        ['Hello'],
      );

      expect(result).toContain('silence');
    });
  });
});
