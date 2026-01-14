import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import type { RuntimeObject } from '../../types/object.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
const TEST_DB_NAME = 'malice_test_sysop_builder';

describe('SysopBuilder', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let sysop: RuntimeObject | null;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, TEST_DB_NAME);
    await db.connect();
    await db.objects.deleteMany({});
    await db.ensureRoot();
    manager = new ObjectManager(db);

    // Bootstrap minimal objects needed for sysop
    const { bootstrapCore } = await import(
      '../../src/database/bootstrap/bootstrap-core.js'
    );
    await bootstrapCore(manager);

    await manager.loadAll();

    // Get sysop object
    const objectManager = await manager.load(0);
    const aliases = objectManager?.get('aliases') as Record<string, number>;
    sysop = aliases?.sysop ? await manager.load(aliases.sysop) : null;
  }, 30000);

  afterAll(async () => {
    // Disconnect if connected
    if (sysop && manager.runtime.client) {
      try {
        await sysop.call('disconnect');
      } catch (err) {
        // Ignore disconnect errors
      }
    }
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('sysop object creation', () => {
    it('should create sysop object', () => {
      expect(sysop).toBeDefined();
      expect(sysop?.get('name')).toBe('Sysop');
    });

    it('should register sysop alias', async () => {
      const objectManager = await manager.load(0);
      const aliases = objectManager?.get('aliases') as Record<string, number>;
      expect(aliases.sysop).toBe(sysop?.id);
    });

    it('should have required properties', () => {
      expect(sysop?.get('token')).toBeDefined();
      expect(sysop?.get('autoConnect')).toBe(false);
      expect(sysop?.get('connected')).toBe(false);
      expect(sysop?.get('outbox')).toEqual([]);
      expect(sysop?.get('reinforcementInterval')).toBe(25);
      expect(sysop?.get('primaryChannelId')).toBe(null);
      expect(sysop?.get('ignoreList')).toEqual([]);
      expect(sysop?.get('privilegedList')).toEqual([]);
      expect(sysop?.get('wakeOnMention')).toBe(true);
      expect(sysop?.get('wakeOnScheduler')).toBe(true);
      expect(sysop?.get('schedulerIntervalMs')).toBe(600000);
    });

    it('should have Discord configuration properties', () => {
      expect(sysop?.get('allowedChannels')).toBe(null);
      expect(sysop?.get('allowedUsers')).toBe(null);
    });
  });

  describe('sysop methods', () => {
    it('should have connect method', async () => {
      const code = await sysop?.getMethodCode('connect');
      expect(code).toBeDefined();
      expect(code?.code).toContain('discord.js');
    });

    it('should have disconnect method', async () => {
      const code = await sysop?.getMethodCode('disconnect');
      expect(code).toBeDefined();
      expect(code?.code).toContain('client.destroy');
    });

    it('should have status method', async () => {
      const code = await sysop?.getMethodCode('status');
      expect(code).toBeDefined();
      expect(code?.code).toContain('connected');
    });

    it('should have onDiscordMessage method', async () => {
      const code = await sysop?.getMethodCode('onDiscordMessage');
      expect(code).toBeDefined();
      expect(code?.code).toContain('$aiQuery');
    });

    it('should have prompt composition methods', async () => {
      expect(await sysop?.getMethodCode('prompt')).toBeDefined();
      expect(await sysop?.getMethodCode('promptPrefix')).toBeDefined();
      expect(await sysop?.getMethodCode('promptSuffix')).toBeDefined();
    });

    it('should have queueMessage method', async () => {
      const code = await sysop?.getMethodCode('queueMessage');
      expect(code).toBeDefined();
      expect(code?.code).toContain('outbox');
    });

    it('should have processQueue method', async () => {
      const code = await sysop?.getMethodCode('processQueue');
      expect(code).toBeDefined();
      expect(code?.code).toContain('sysopQueuedMessages');
    });

    it('should have say method', async () => {
      const code = await sysop?.getMethodCode('say');
      expect(code).toBeDefined();
      expect(code?.code).toContain('primaryChannelId');
    });

    it('should have send method', async () => {
      const code = await sysop?.getMethodCode('send');
      expect(code).toBeDefined();
      expect(code?.code).toContain('channel.send');
    });

    it('should have resetSession method', async () => {
      const code = await sysop?.getMethodCode('resetSession');
      expect(code).toBeDefined();
      expect(code?.code).toContain('interactionSession');
    });
  });

  describe('sysop configuration', () => {
    it('should allow setting token', () => {
      sysop?.set('token', 'test-token');
      expect(sysop?.get('token')).toBe('test-token');
    });

    it('should allow setting autoConnect', () => {
      sysop?.set('autoConnect', true);
      expect(sysop?.get('autoConnect')).toBe(true);
      sysop?.set('autoConnect', false);
    });

    it('should allow setting reinforcementInterval', () => {
      sysop?.set('reinforcementInterval', 50);
      expect(sysop?.get('reinforcementInterval')).toBe(50);
      sysop?.set('reinforcementInterval', 25); // Reset
    });

    it('should allow setting allowedChannels', () => {
      const channels = ['channel1', 'channel2'];
      sysop?.set('allowedChannels', channels);
      expect(sysop?.get('allowedChannels')).toEqual(channels);
      sysop?.set('allowedChannels', null); // Reset
    });

    it('should allow setting allowedUsers', () => {
      const users = ['user1', 'user2'];
      sysop?.set('allowedUsers', users);
      expect(sysop?.get('allowedUsers')).toEqual(users);
      sysop?.set('allowedUsers', null); // Reset
    });
  });

  describe('connect method behavior', () => {
    it('should reject connection without token', async () => {
      if (!sysop) throw new Error('Sysop not found');

      sysop.set('token', null);
      const result = await sysop.call('connect');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No token');
    });

    it('should reject double connection', async () => {
      if (!sysop) throw new Error('Sysop not found');

      // Simulate already connected
      manager.runtime.client = { destroy: () => {} };

      const result = await sysop.call('connect');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Already connected');

      // Clean up
      delete manager.runtime.client;
    });
  });

  describe('disconnect method behavior', () => {
    it('should reject disconnect when not connected', async () => {
      if (!sysop) throw new Error('Sysop not found');

      // Ensure not connected
      delete manager.runtime.client;

      const result = await sysop.call('disconnect');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Not connected');
    });
  });

  describe('status method behavior', () => {
    it('should return disconnected status when no client', async () => {
      if (!sysop) throw new Error('Sysop not found');

      delete manager.runtime.client;
      const status = await sysop.call('status');

      expect(status.connected).toBe(false);
      expect(status.ready).toBe(false);
      expect(status.user).toBe(null);
    });

    it('should return connected status when client exists', async () => {
      if (!sysop) throw new Error('Sysop not found');

      // Simulate connected client
      manager.runtime.client = {
        isReady: () => true,
        user: { id: '123', tag: 'TestBot#1234', username: 'TestBot' },
        destroy: () => {},
      };

      const status = await sysop.call('status');

      expect(status.connected).toBe(true);
      expect(status.ready).toBe(true);
      expect(status.user).toBeDefined();
      expect(status.user.tag).toBe('TestBot#1234');

      // Clean up
      delete manager.runtime.client;
    });
  });

  describe('queueMessage method', () => {
    it('should queue messages', async () => {
      if (!sysop) throw new Error('Sysop not found');

      sysop.set('outbox', []);
      await sysop.call('queueMessage', 'channel123', 'Test message');

      const outbox = sysop.get('outbox') as any[];
      expect(outbox).toHaveLength(1);
      expect(outbox[0].channel).toBe('channel123');
      expect(outbox[0].content).toBe('Test message');
    });

    it('should append to existing outbox', async () => {
      if (!sysop) throw new Error('Sysop not found');

      sysop.set('outbox', [{ channel: 'ch1', content: 'msg1' }]);
      await sysop.call('queueMessage', 'ch2', 'msg2');

      const outbox = sysop.get('outbox') as any[];
      expect(outbox).toHaveLength(2);
      expect(outbox[1].content).toBe('msg2');
    });
  });

  describe('resetSession method', () => {
    it('should clear session data', async () => {
      if (!sysop) throw new Error('Sysop not found');

      sysop.set('interactionSession', 'session123');
      sysop.set('aiMessageCount', 42);

      const result = await sysop.call('resetSession');

      expect(result.success).toBe(true);
      expect(sysop.get('interactionSession')).toBe(null);
      expect(sysop.get('aiMessageCount')).toBe(0);
    });
  });

  describe('prompt composition', () => {
    it('should build prompt with context', async () => {
      if (!sysop) throw new Error('Sysop not found');

      const context = {
        author: 'testuser',
        authorId: '123',
        channel: 'general',
      };

      const prompt = await sysop.call('prompt', context);

      expect(prompt).toContain('testuser');
      expect(prompt).toContain('123');
      expect(prompt).toContain('general');
    });

    it('should include reinforcement in prefix at interval', async () => {
      if (!sysop) throw new Error('Sysop not found');

      sysop.set('reinforcementInterval', 5);

      // At message 5, should include reinforcement
      const prefix5 = await sysop.call('promptPrefix', { messageCount: 5 });
      expect(prefix5).toBeDefined();

      // At message 10, should include reinforcement
      const prefix10 = await sysop.call('promptPrefix', { messageCount: 10 });
      expect(prefix10).toBeDefined();

      // At message 3, should not include reinforcement
      const prefix3 = await sysop.call('promptPrefix', { messageCount: 3 });
      expect(prefix3).toBe('');
    });

    it('should include privileged guidance when trigger is privileged', async () => {
      if (!sysop) throw new Error('Sysop not found');

      const prefix = await sysop.call('promptPrefix', {
        messageCount: 1,
        trigger: 'privileged',
      });
      expect(prefix).toContain('ACTUALLY god');
      expect(prefix).toContain('privlidged');
    });

    it('should include non-privileged guidance when trigger is set', async () => {
      if (!sysop) throw new Error('Sysop not found');

      const prefix = await sysop.call('promptPrefix', {
        messageCount: 1,
        trigger: 'mention',
      });
      expect(prefix).toContain('NOT a privlidged user');
      expect(prefix).toContain('$sysop.say');
    });

    it('should have concise response suffix', async () => {
      if (!sysop) throw new Error('Sysop not found');

      const suffix = await sysop.call('promptSuffix', {});
      expect(suffix).toContain('concise');
    });
  });

  describe('runtime client storage', () => {
    it('should store client in $.runtime', () => {
      const mockClient = { type: 'discord', id: 'test' };
      manager.runtime.client = mockClient;

      expect(manager.runtime.client).toBe(mockClient);
    });

    it('should clean up client on disconnect', async () => {
      if (!sysop) throw new Error('Sysop not found');

      manager.runtime.client = {
        destroy: () => {},
        isReady: () => true,
      };

      await sysop.call('disconnect');

      expect(manager.runtime.client).toBeUndefined();
    });
  });
});
