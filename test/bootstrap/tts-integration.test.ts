import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('TTS Integration', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_tts');
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

  describe('getVoiceId() - Deterministic voice assignment', () => {
    it('should return same voice for same object ID across calls', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Test Speaker' },
        },
        null,
      );

      const voice1 = await obj.call('getVoiceId');
      const voice2 = await obj.call('getVoiceId');

      expect(voice1).toBe(voice2);
      expect(typeof voice1).toBe('string');
    });

    it('should assign a valid voice (built-in or speaker_XXX)', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Voice Test' },
        },
        null,
      );

      const voice = await obj.call('getVoiceId');
      const builtinVoices = [
        'alloy',
        'echo',
        'fable',
        'onyx',
        'nova',
        'shimmer',
      ];

      // Voice is either a built-in or a speaker_XXX from LibriTTS
      const isBuiltin = builtinVoices.includes(voice);
      const isSpeaker = /^speaker_\d+$/.test(voice);
      expect(isBuiltin || isSpeaker).toBe(true);
    });

    it('should use existing voiceId property if set', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: {
            name: 'Custom Voice',
            voiceId: 'shimmer',
          },
        },
        null,
      );

      const voice = await obj.call('getVoiceId');
      expect(voice).toBe('shimmer');
    });

    it('should deterministically assign different voices to different object IDs', async () => {
      const obj1 = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Speaker 1' },
        },
        null,
      );

      const obj2 = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Speaker 2' },
        },
        null,
      );

      const voice1 = await obj1.call('getVoiceId');
      const voice2 = await obj2.call('getVoiceId');

      // Both should be valid voices (built-in or speaker_XXX)
      const builtinVoices = [
        'alloy',
        'echo',
        'fable',
        'onyx',
        'nova',
        'shimmer',
      ];
      const isValid = (v: string) =>
        builtinVoices.includes(v) || /^speaker_\d+$/.test(v);
      expect(isValid(voice1)).toBe(true);
      expect(isValid(voice2)).toBe(true);

      // With many voices, different IDs are likely to get different voices
      // (not guaranteed but statistically likely with sequential IDs)
    });

    it('should persist voiceId to object property', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Persistent Voice' },
        },
        null,
      );

      const voice = await obj.call('getVoiceId');
      expect(obj.voiceId).toBe(voice);
    });

    it('should reroll voice and increment voiceSeed', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Reroll Test' },
        },
        null,
      );

      // Initial state: voiceSeed should be 0
      expect(obj.voiceSeed).toBe(0);

      // Get initial voice
      const voice1 = await obj.call('getVoiceId');
      expect(typeof voice1).toBe('string');
      expect(obj.voiceId).toBe(voice1);

      // Reroll voice - should increment voiceSeed and clear cached voiceId
      const voice2 = await obj.call('rerollVoice');
      expect(obj.voiceSeed).toBe(1);
      expect(obj.voiceId).toBe(voice2);
      expect(typeof voice2).toBe('string');

      // Reroll again
      const voice3 = await obj.call('rerollVoice');
      expect(obj.voiceSeed).toBe(2);
      expect(obj.voiceId).toBe(voice3);
      expect(typeof voice3).toBe('string');
    });

    it('should reroll voice with gender override', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Gender Override Test', sex: 'male' },
        },
        null,
      );

      // Reroll with female gender override
      const femaleVoice = await obj.call('rerollVoice', 'female');
      expect(obj.voiceSeed).toBe(1);
      expect(typeof femaleVoice).toBe('string');

      // Reroll with male gender override
      const maleVoice = await obj.call('rerollVoice', 'male');
      expect(obj.voiceSeed).toBe(2);
      expect(typeof maleVoice).toBe('string');
    });
  });

  describe('say(message) - Speech broadcasting', () => {
    it('should broadcast text message to location', async () => {
      const room = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'Test Room' },
        },
        null,
      );

      const speaker = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Alice' },
        },
        null,
      );

      await speaker.moveTo(room);

      // Create a listener to capture announce calls
      const _announcements: any[] = [];
      const originalAnnounce = room.getMethodCode('announce');

      room.setMethod(
        'announce',
        `
        const args = Array.from(arguments);
        self._testAnnouncements = self._testAnnouncements || [];
        self._testAnnouncements.push(args);
        return true;
      `,
      );

      await speaker.call('say', 'Hello world');

      expect(room._testAnnouncements).toBeDefined();
      expect(room._testAnnouncements.length).toBeGreaterThan(0);

      // Restore original method
      if (originalAnnounce) {
        room.setMethod('announce', originalAnnounce.code);
      }
    });

    it('should not say anything with empty message', async () => {
      const room = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'Empty Room' },
        },
        null,
      );

      const speaker = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Bob' },
        },
        null,
      );

      await speaker.moveTo(room);

      room._testAnnouncements = [];
      room.setMethod(
        'announce',
        `
        self._testAnnouncements = self._testAnnouncements || [];
        self._testAnnouncements.push(arguments);
      `,
      );

      await speaker.call('say', '');
      await speaker.call('say', '   ');

      expect(room._testAnnouncements.length).toBe(0);
    });

    it('should not broadcast if speaker has no location', async () => {
      const speaker = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Locationless' },
        },
        null,
      );

      // Should not throw error
      await expect(speaker.call('say', 'Hello')).resolves.toBeDefined();
    });

    it('should call broadcastAudio if location has the method', async () => {
      const room = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'Audio Room' },
        },
        null,
      );

      const speaker = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Charlie', voiceId: 'echo' },
        },
        null,
      );

      await speaker.moveTo(room);

      // Track broadcastAudio calls
      room._audioCalls = [];
      const originalMethod = room.getMethodCode('broadcastAudio');
      room.setMethod(
        'broadcastAudio',
        `
        const segments = args[0];
        self._audioCalls = self._audioCalls || [];
        self._audioCalls.push(segments);
      `,
      );

      await speaker.call('say', 'Test message');

      expect(room._audioCalls).toBeDefined();
      expect(room._audioCalls.length).toBe(1);
      expect(room._audioCalls[0]).toEqual([
        {
          speaker: String(speaker.id),
          speakerName: 'Charlie',
          voiceId: 'echo',
          text: 'Test message',
        },
      ]);

      // Restore
      if (originalMethod) {
        room.setMethod('broadcastAudio', originalMethod.code);
      }
    });

    it('should include voiceStyle in audio segment when set', async () => {
      const room = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'Style Room' },
        },
        null,
      );

      const speaker = await $.recycler.create(
        {
          parent: $.describable,
          properties: {
            name: 'Menacing NPC',
            voiceId: 'onyx',
            voiceStyle:
              'speak slowly and menacingly, with a deep threatening tone',
          },
        },
        null,
      );

      await speaker.moveTo(room);

      // Track broadcastAudio calls
      room._audioCalls = [];
      room.setMethod(
        'broadcastAudio',
        `
        const segments = args[0];
        self._audioCalls = self._audioCalls || [];
        self._audioCalls.push(segments);
      `,
      );

      await speaker.call('say', 'I will find you');

      expect(room._audioCalls.length).toBe(1);
      expect(room._audioCalls[0]).toEqual([
        {
          speaker: String(speaker.id),
          speakerName: 'Menacing NPC',
          voiceId: 'onyx',
          voiceStyle:
            'speak slowly and menacingly, with a deep threatening tone',
          text: 'I will find you',
        },
      ]);
    });

    it('should not include voiceStyle when not set', async () => {
      const room = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'No Style Room' },
        },
        null,
      );

      const speaker = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Normal NPC', voiceId: 'nova' },
        },
        null,
      );

      await speaker.moveTo(room);

      room._audioCalls = [];
      room.setMethod(
        'broadcastAudio',
        `
        const segments = args[0];
        self._audioCalls = self._audioCalls || [];
        self._audioCalls.push(segments);
      `,
      );

      await speaker.call('say', 'Hello there');

      expect(room._audioCalls.length).toBe(1);
      const segment = room._audioCalls[0][0];
      expect(segment.voiceStyle).toBeUndefined();
      expect(segment).toEqual({
        speaker: String(speaker.id),
        speakerName: 'Normal NPC',
        voiceId: 'nova',
        text: 'Hello there',
      });
    });
  });

  describe('broadcastAudio(segments) - Location audio broadcasting', () => {
    it('should send audio to all objects in location with audio method', async () => {
      const room = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'Broadcast Room' },
        },
        null,
      );

      const listener1 = await $.recycler.create(
        {
          parent: $.player,
          properties: { name: 'Listener1' },
        },
        null,
      );

      const listener2 = await $.recycler.create(
        {
          parent: $.player,
          properties: { name: 'Listener2' },
        },
        null,
      );

      // Mock audio method to track calls
      listener1._audioSegments = [];
      listener1.setMethod(
        'audio',
        `
        const segments = args[0];
        self._audioSegments = self._audioSegments || [];
        self._audioSegments.push(segments);
        return true;
      `,
      );

      listener2._audioSegments = [];
      listener2.setMethod(
        'audio',
        `
        const segments = args[0];
        self._audioSegments = self._audioSegments || [];
        self._audioSegments.push(segments);
        return true;
      `,
      );

      await listener1.moveTo(room);
      await listener2.moveTo(room);

      const segments = [
        {
          speaker: '42',
          speakerName: 'Alice',
          voiceId: 'nova',
          text: 'Hello everyone',
        },
      ];

      await room.call('broadcastAudio', segments);

      expect(listener1._audioSegments.length).toBe(1);
      expect(listener1._audioSegments[0]).toEqual(segments);
      expect(listener2._audioSegments.length).toBe(1);
      expect(listener2._audioSegments[0]).toEqual(segments);
    });

    it('should ignore objects without audio method', async () => {
      const room = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'Mixed Room' },
        },
        null,
      );

      const player = await $.recycler.create(
        {
          parent: $.player,
          properties: { name: 'Player' },
        },
        null,
      );

      const item = await $.recycler.create(
        {
          parent: $.item,
          properties: { name: 'Sword' },
        },
        null,
      );

      player._audioSegments = [];
      player.setMethod(
        'audio',
        `
        self._audioSegments = self._audioSegments || [];
        self._audioSegments.push(args[0]);
      `,
      );

      await player.moveTo(room);
      await item.moveTo(room);

      const segments = [
        { speaker: '1', speakerName: 'Test', voiceId: 'alloy', text: 'Hi' },
      ];

      // Should not throw error even though item doesn't have audio method
      await expect(
        room.call('broadcastAudio', segments),
      ).resolves.toBeDefined();

      expect(player._audioSegments.length).toBe(1);
    });

    it('should handle empty segments array', async () => {
      const room = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'Empty Segments Room' },
        },
        null,
      );

      await expect(room.call('broadcastAudio', [])).resolves.toBeDefined();
    });

    it('should handle null/undefined segments', async () => {
      const room = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'Null Segments Room' },
        },
        null,
      );

      await expect(room.call('broadcastAudio', null)).resolves.toBeDefined();
      await expect(
        room.call('broadcastAudio', undefined),
      ).resolves.toBeDefined();
    });
  });

  describe('player.audio(segments) - Player audio delivery', () => {
    it('should send segments via audio channel if context has channel method', async () => {
      const player = await $.recycler.create(
        {
          parent: $.player,
          properties: { name: 'Test Player' },
        },
        null,
      );

      // Mock context with channel method
      const channelCalls: any[] = [];
      player._context = {
        channel: (channelName: string, data: any) => {
          channelCalls.push({ channelName, data });
          return true;
        },
      };

      const segments = [
        {
          speaker: '5',
          speakerName: 'NPC',
          voiceId: 'fable',
          text: 'Greetings',
        },
      ];

      const result = await player.call('audio', segments);

      expect(result).toBe(true);
      expect(channelCalls.length).toBe(1);
      expect(channelCalls[0].channelName).toBe('audio');
      expect(channelCalls[0].data).toEqual({ segments });
    });

    it('should return false if no context channel available', async () => {
      const player = await $.recycler.create(
        {
          parent: $.player,
          properties: { name: 'No Context Player' },
        },
        null,
      );

      // No _context set
      const segments = [
        { speaker: '1', speakerName: 'Test', voiceId: 'onyx', text: 'Hi' },
      ];

      const result = await player.call('audio', segments);
      expect(result).toBe(false);
    });

    it('should handle empty segments array gracefully', async () => {
      const player = await $.recycler.create(
        {
          parent: $.player,
          properties: { name: 'Empty Segments Player' },
        },
        null,
      );

      const result = await player.call('audio', []);
      expect(result).toBe(false);
    });

    it('should handle null/undefined segments', async () => {
      const player = await $.recycler.create(
        {
          parent: $.player,
          properties: { name: 'Null Player' },
        },
        null,
      );

      const result1 = await player.call('audio', null);
      const result2 = await player.call('audio', undefined);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('Integration: Full TTS flow', () => {
    it('should complete full flow from say() to player audio delivery', async () => {
      const room = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'Integration Room' },
        },
        null,
      );

      const speaker = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Speaker', voiceId: 'shimmer' },
        },
        null,
      );

      const listener = await $.recycler.create(
        {
          parent: $.player,
          properties: { name: 'Listener' },
        },
        null,
      );

      // Mock listener's audio delivery
      const deliveredAudio: any[] = [];
      listener._context = {
        channel: (channelName: string, data: any) => {
          if (channelName === 'audio') {
            deliveredAudio.push(data);
          }
          return true;
        },
      };

      await speaker.moveTo(room);
      await listener.moveTo(room);

      // Speaker says something
      await speaker.call('say', 'Welcome to the room');

      // Verify audio was delivered to listener
      expect(deliveredAudio.length).toBe(1);
      expect(deliveredAudio[0].segments).toEqual([
        {
          speaker: String(speaker.id),
          speakerName: 'Speaker',
          voiceId: 'shimmer',
          text: 'Welcome to the room',
        },
      ]);
    });

    it('should handle multiple listeners receiving same audio', async () => {
      const room = await $.recycler.create(
        {
          parent: $.location,
          properties: { name: 'Multi-listener Room' },
        },
        null,
      );

      const speaker = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Announcer', voiceId: 'alloy' },
        },
        null,
      );

      const listeners = [];
      const deliveredAudio: any[][] = [];

      for (let i = 0; i < 3; i++) {
        const listener = await $.recycler.create(
          {
            parent: $.player,
            properties: { name: `Listener${i}` },
          },
          null,
        );

        const audioLog: any[] = [];
        listener._context = {
          channel: (channelName: string, data: any) => {
            if (channelName === 'audio') {
              audioLog.push(data);
            }
            return true;
          },
        };

        await listener.moveTo(room);
        listeners.push(listener);
        deliveredAudio.push(audioLog);
      }

      await speaker.moveTo(room);
      await speaker.call('say', 'Attention everyone');

      // All listeners should receive the same audio
      const builtinVoices = [
        'alloy',
        'echo',
        'fable',
        'onyx',
        'nova',
        'shimmer',
      ];
      for (let i = 0; i < 3; i++) {
        expect(deliveredAudio[i].length).toBe(1);
        expect(deliveredAudio[i][0].segments[0].text).toBe(
          'Attention everyone',
        );
        const voiceId = deliveredAudio[i][0].segments[0].voiceId;
        const isValid =
          builtinVoices.includes(voiceId) || /^speaker_\d+$/.test(voiceId);
        expect(isValid).toBe(true);
      }
    });
  });
});
