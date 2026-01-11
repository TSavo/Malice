import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MinimalBootstrap } from '../../src/database/bootstrap/minimal-bootstrap.js';
import { AudioManagerBuilder } from '../../src/database/bootstrap/client/audio-manager-builder.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('AudioManagerBuilder', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_audio_manager');
    await db.connect();

    // Clean database
    await (db as any).objects.deleteMany({});

    manager = new ObjectManager(db);

    // Set up minimal bootstrap (Root, System, and core aliases)
    const bootstrap = new MinimalBootstrap(manager);
    await bootstrap.bootstrap();
  }, 30000);

  afterAll(async () => {
    await db.disconnect();
  });

  describe('build()', () => {
    it('should create audioManagerJs object with correct properties', async () => {
      const builder = new AudioManagerBuilder(manager);
      await builder.build();

      const audioManagerJs = await manager.load('audioManagerJs');

      expect(audioManagerJs).toBeTruthy();
      expect(audioManagerJs?.get('name')).toBe('AudioManager JS Module');
      expect(audioManagerJs?.get('description')).toContain('TTS audio playback');
    });

    it('should have getScript method', async () => {
      const builder = new AudioManagerBuilder(manager);
      await builder.build();

      const audioManagerJs = await manager.load('audioManagerJs');
      const methodCode = audioManagerJs?.getMethod('getScript');

      expect(methodCode).toBeTruthy();
      expect(methodCode).toContain('AudioManager');
      expect(methodCode).toContain('setMasterVolume');
      expect(methodCode).toContain('setObjectVolume');
    });

    it('should be idempotent (safe to run twice)', async () => {
      const builder = new AudioManagerBuilder(manager);
      await builder.build();
      await builder.registerAliases();

      const firstId = (await manager.load('audioManagerJs'))?.id;

      // Build again
      await builder.build();
      await builder.registerAliases();

      const secondId = (await manager.load('audioManagerJs'))?.id;

      expect(firstId).toBe(secondId);
    });
  });

  describe('registerAliases()', () => {
    it('should register $audioManagerJs alias', async () => {
      const builder = new AudioManagerBuilder(manager);
      await builder.build();
      await builder.registerAliases();

      const objectManager = await manager.load(0);
      const aliases = objectManager?.get('aliases') as Record<string, number>;

      expect(aliases.audioManagerJs).toBeTruthy();

      const audioManagerJs = await manager.load('audioManagerJs');
      expect(audioManagerJs?.id).toBe(aliases.audioManagerJs);
    });
  });

  describe('getScript() validation checks', () => {
    it('should include isFinite validation in setMasterVolume', async () => {
      const builder = new AudioManagerBuilder(manager);
      await builder.build();

      const audioManagerJs = await manager.load('audioManagerJs');
      const script = await audioManagerJs?.call('getScript');

      expect(script).toContain('setMasterVolume');
      expect(script).toContain('isFinite(volume)');
      expect(script).toContain('Invalid volume value, ignoring');
    });

    it('should include isFinite validation in setObjectVolume', async () => {
      const builder = new AudioManagerBuilder(manager);
      await builder.build();

      const audioManagerJs = await manager.load('audioManagerJs');
      const script = await audioManagerJs?.call('getScript');

      expect(script).toContain('setObjectVolume');
      expect(script).toContain('isFinite(volume)');
      expect(script).toContain('Invalid volume value for object');
    });

    it('should include isFinite validation in loadSettings for masterVolume', async () => {
      const builder = new AudioManagerBuilder(manager);
      await builder.build();

      const audioManagerJs = await manager.load('audioManagerJs');
      const script = await audioManagerJs?.call('getScript');

      // Check that loadSettings validates masterVolume with isFinite
      expect(script).toContain('loadSettings');
      expect(script).toContain('isFinite(data.masterVolume)');
      expect(script).toContain('masterVolume >= 0');
      expect(script).toContain('masterVolume <= 1');
    });

    it('should include isFinite validation in loadSettings for objectVolumes', async () => {
      const builder = new AudioManagerBuilder(manager);
      await builder.build();

      const audioManagerJs = await manager.load('audioManagerJs');
      const script = await audioManagerJs?.call('getScript');

      // Check that loadSettings validates objectVolumes.volume with isFinite
      expect(script).toContain('loadSettings');
      expect(script).toContain('isFinite(settings.volume)');
      expect(script).toContain('settings.volume >= 0');
      expect(script).toContain('settings.volume <= 1');
    });

    it('should include mute behavior clarification comment', async () => {
      const builder = new AudioManagerBuilder(manager);
      await builder.build();

      const audioManagerJs = await manager.load('audioManagerJs');
      const script = await audioManagerJs?.call('getScript');

      expect(script).toContain('Resume playback when unmuting');
      expect(script).toContain('segments that arrived while muted are discarded');
    });
  });

  describe('AudioManager class structure', () => {
    it('should define AudioManager class with all required methods', async () => {
      const builder = new AudioManagerBuilder(manager);
      await builder.build();

      const audioManagerJs = await manager.load('audioManagerJs');
      const script = await audioManagerJs?.call('getScript');

      // Check for key methods
      expect(script).toContain('class AudioManager');
      expect(script).toContain('constructor(');
      expect(script).toContain('loadSettings()');
      expect(script).toContain('saveSettings()');
      expect(script).toContain('setMasterVolume(');
      expect(script).toContain('setObjectVolume(');
      expect(script).toContain('toggleMute()');
      expect(script).toContain('toggleObjectMute(');
    });

    it('should export AudioManager class', async () => {
      const builder = new AudioManagerBuilder(manager);
      await builder.build();

      const audioManagerJs = await manager.load('audioManagerJs');
      const script = await audioManagerJs?.call('getScript');

      // Should have export statement or window assignment
      expect(script).toMatch(/export.*AudioManager|window\.AudioManager/);
    });
  });
});
