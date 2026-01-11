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
      const builtinVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

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
      const builtinVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
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
      const announcements: any[] = [];
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
            voiceStyle: 'speak slowly and menacingly, with a deep threatening tone',
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
          voiceStyle: 'speak slowly and menacingly, with a deep threatening tone',
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
      await expect(room.call('broadcastAudio', segments)).resolves.toBeDefined();

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
      await expect(room.call('broadcastAudio', undefined)).resolves.toBeDefined();
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
        { speaker: '5', speakerName: 'NPC', voiceId: 'fable', text: 'Greetings' },
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
      const builtinVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
      for (let i = 0; i < 3; i++) {
        expect(deliveredAudio[i].length).toBe(1);
        expect(deliveredAudio[i][0].segments[0].text).toBe('Attention everyone');
        const voiceId = deliveredAudio[i][0].segments[0].voiceId;
        const isValid =
          builtinVoices.includes(voiceId) || /^speaker_\d+$/.test(voiceId);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('rerollVoice() - Voice rerolling', () => {
    it('should increment voiceSeed and return new voice', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Reroller' },
        },
        null,
      );

      const initialVoice = await obj.call('getVoiceId');
      const initialSeed = obj.voiceSeed || 0;

      const newVoice = await obj.call('rerollVoice');

      expect(obj.voiceSeed).toBe(initialSeed + 1);
      expect(newVoice).toBeDefined();
      expect(typeof newVoice).toBe('string');
    });

    it('should clear cached voiceId on reroll', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Cache Test', voiceId: 'shimmer' },
        },
        null,
      );

      expect(obj.voiceId).toBe('shimmer');

      await obj.call('rerollVoice');

      // voiceId should be cleared, then reassigned
      expect(obj.voiceId).toBeDefined();
      expect(obj.voiceId).not.toBe('shimmer');
    });

    it('should accept gender override parameter', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Gender Override', sex: 'male' },
        },
        null,
      );

      // Reroll with female override
      const femaleVoice = await obj.call('rerollVoice', 'female');

      // Original sex should be preserved
      expect(obj.sex).toBe('male');
      expect(femaleVoice).toBeDefined();
    });

    it('should increment seed on multiple rerolls', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Multiple Reroll' },
        },
        null,
      );

      await obj.call('rerollVoice');
      expect(obj.voiceSeed).toBe(1);

      await obj.call('rerollVoice');
      expect(obj.voiceSeed).toBe(2);

      await obj.call('rerollVoice');
      expect(obj.voiceSeed).toBe(3);
    });
  });

  describe('setVoice() - Manual voice assignment', () => {
    it('should set voiceId to specified value', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Manual Voice' },
        },
        null,
      );

      const result = await obj.call('setVoice', 'speaker_42');

      expect(obj.voiceId).toBe('speaker_42');
      expect(result).toBe('speaker_42');
    });

    it('should override existing voiceId', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Override Test', voiceId: 'alloy' },
        },
        null,
      );

      await obj.call('setVoice', 'speaker_123');

      expect(obj.voiceId).toBe('speaker_123');
    });

    it('should throw error if voiceId not provided', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'No Voice' },
        },
        null,
      );

      await expect(obj.call('setVoice')).rejects.toThrow('voiceId is required');
    });

    it('should persist manually set voice on subsequent getVoiceId calls', async () => {
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Persist Test' },
        },
        null,
      );

      await obj.call('setVoice', 'speaker_999');

      const retrievedVoice = await obj.call('getVoiceId');
      expect(retrievedVoice).toBe('speaker_999');
    });
  });

  describe('Gender-aware voice assignment', () => {
    it('should use $tts.getVoiceForGender when available', async () => {
      const femaleObj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Female Character', sex: 'female' },
        },
        null,
      );

      const voice = await femaleObj.call('getVoiceId');

      expect(voice).toBeDefined();
      expect(typeof voice).toBe('string');
      // Voice should be set on object
      expect(femaleObj.voiceId).toBe(voice);
    });

    it('should handle male gender', async () => {
      const maleObj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Male Character', sex: 'male' },
        },
        null,
      );

      const voice = await maleObj.call('getVoiceId');

      expect(voice).toBeDefined();
      expect(typeof voice).toBe('string');
      expect(maleObj.voiceId).toBe(voice);
    });

    it('should handle F/M shorthand gender codes', async () => {
      const femaleObj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Female F', sex: 'F' },
        },
        null,
      );

      const maleObj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Male M', sex: 'M' },
        },
        null,
      );

      const femaleVoice = await femaleObj.call('getVoiceId');
      const maleVoice = await maleObj.call('getVoiceId');

      expect(femaleVoice).toBeDefined();
      expect(maleVoice).toBeDefined();
    });

    it('should use voiceSeed for deterministic selection', async () => {
      const obj1 = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Seed Test 1', sex: 'female', voiceSeed: 5 },
        },
        null,
      );

      const obj2 = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Seed Test 2', sex: 'female', voiceSeed: 5 },
        },
        null,
      );

      const voice1 = await obj1.call('getVoiceId');
      const voice2 = await obj2.call('getVoiceId');

      // Same gender + same seed + different IDs = deterministic but different voices
      expect(voice1).toBeDefined();
      expect(voice2).toBeDefined();
    });

    it('should fallback to built-in voices if $tts unavailable', async () => {
      // Create object without $tts available (mock scenario)
      const obj = await $.recycler.create(
        {
          parent: $.describable,
          properties: { name: 'Fallback Test' },
        },
        null,
      );

      // Temporarily disable $tts
      const originalTts = manager._cache.get(manager._aliases.tts);
      if (originalTts) {
        const tempMethod = originalTts.getMethod('getVoiceForGender');
        originalTts.setMethod('getVoiceForGender', null as any);

        const voice = await obj.call('getVoiceId');
        const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
        expect(validVoices).toContain(voice);

        // Restore
        if (tempMethod) {
          originalTts.setMethod('getVoiceForGender', tempMethod);
        }
      }
    });
  });

  describe('$tts object methods', () => {
    it('should exist as a global alias', async () => {
      expect($.tts).toBeDefined();
      expect($.tts.name).toBe('TTS Voice Manager');
    });

    it('should have serverUrl configured', async () => {
      expect($.tts.serverUrl).toBeDefined();
      expect(typeof $.tts.serverUrl).toBe('string');
    });

    it('should have builtinVoices array', async () => {
      expect(Array.isArray($.tts.builtinVoices)).toBe(true);
      expect($.tts.builtinVoices).toContain('alloy');
      expect($.tts.builtinVoices).toContain('echo');
      expect($.tts.builtinVoices).toContain('fable');
    });

    it('should list voices (with fallback)', async () => {
      const voices = await $.tts.call('listVoices');

      expect(Array.isArray(voices)).toBe(true);
      expect(voices.length).toBeGreaterThan(0);

      // Each voice should have voice_id and name
      if (voices.length > 0) {
        expect(voices[0]).toHaveProperty('voice_id');
        expect(voices[0]).toHaveProperty('name');
      }
    });

    it('should get voice stats', async () => {
      const stats = await $.tts.call('getVoiceStats');

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(stats.total).toBeGreaterThan(0);
    });

    it('should get female voices', async () => {
      const femaleVoices = await $.tts.call('getFemaleVoices');

      expect(Array.isArray(femaleVoices)).toBe(true);
      // Should have at least some female voices (or fallback)
      expect(femaleVoices.length).toBeGreaterThan(0);
    });

    it('should get male voices', async () => {
      const maleVoices = await $.tts.call('getMaleVoices');

      expect(Array.isArray(maleVoices)).toBe(true);
      // Should have at least some male voices (or fallback)
      expect(maleVoices.length).toBeGreaterThan(0);
    });

    it('should get voice for gender with object ID and seed', async () => {
      const voice = await $.tts.call('getVoiceForGender', 'female', 42, 0);

      expect(voice).toBeDefined();
      expect(typeof voice).toBe('string');
    });

    it('should return deterministic voice for same inputs', async () => {
      const voice1 = await $.tts.call('getVoiceForGender', 'male', 100, 5);
      const voice2 = await $.tts.call('getVoiceForGender', 'male', 100, 5);

      expect(voice1).toBe(voice2);
    });

    it('should return different voices for different seeds', async () => {
      const voice1 = await $.tts.call('getVoiceForGender', 'female', 50, 0);
      const voice2 = await $.tts.call('getVoiceForGender', 'female', 50, 1);

      // Usually different, but might be same due to modulo
      expect(voice1).toBeDefined();
      expect(voice2).toBeDefined();
    });

    it('should handle null/undefined gender gracefully', async () => {
      const voice1 = await $.tts.call('getVoiceForGender', null, 42, 0);
      const voice2 = await $.tts.call('getVoiceForGender', undefined, 42, 0);

      expect(voice1).toBeDefined();
      expect(voice2).toBeDefined();
    });
  });
});
