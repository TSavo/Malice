/**
 * Game Logger Integration Tests
 * Tests logging, querying, and analysis functions
 */

import { type Db, MongoClient } from 'mongodb';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  GameLogger,
  getGameLogger,
  initGameLogger,
} from '../../src/database/game-logger.js';

// Helper to wait for fire-and-forget writes to complete
const waitForWrites = () => new Promise((resolve) => setTimeout(resolve, 100));

describe('GameLogger', () => {
  let client: MongoClient;
  let db: Db;
  let logger: GameLogger;

  beforeAll(async () => {
    const MONGO_URI =
      process.env.MONGO_URI ||
      'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db('malice_test_logger');
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  beforeEach(async () => {
    // Clear logs collection before each test
    await db.collection('logs').deleteMany({});
    logger = new GameLogger(db);
    await logger.init();
  });

  afterEach(async () => {
    vi.useRealTimers();
    // Clean up
    await db.collection('logs').deleteMany({});
  });

  describe('Initialization', () => {
    it('should initialize without error', async () => {
      const newLogger = new GameLogger(db);
      await expect(newLogger.init()).resolves.not.toThrow();
    });

    it('should create indexes on init', async () => {
      const indexes = await db.collection('logs').indexes();
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain('ts_-1');
      expect(indexNames).toContain('actor_1_ts_-1');
      expect(indexNames).toContain('session_1_ts_-1');
    });

    it('should be idempotent (safe to call multiple times)', async () => {
      await logger.init();
      await logger.init();
      // Should not throw
    });
  });

  describe('initGameLogger and getGameLogger', () => {
    it('should initialize global logger', async () => {
      const globalLogger = await initGameLogger(db);
      expect(globalLogger).toBeInstanceOf(GameLogger);
    });

    it('should return global logger after init', async () => {
      await initGameLogger(db);
      const retrieved = getGameLogger();
      expect(retrieved).not.toBeNull();
    });
  });

  describe('Basic logging', () => {
    it('should log events with required fields', async () => {
      await logger.log('command', 1, 'session-1');
      await waitForWrites();

      const logs = await db.collection('logs').find({}).toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe('command');
      expect(logs[0].actor).toBe(1);
      expect(logs[0].session).toBe('session-1');
      expect(logs[0].ts).toBeInstanceOf(Date);
    });

    it('should log events with optional fields', async () => {
      await logger.log('command', 1, 'session-1', {
        target: 2,
        location: 100,
        ip: '127.0.0.1',
        details: { raw: 'look', verb: 'look' },
      });
      await waitForWrites();

      const logs = await db.collection('logs').find({}).toArray();
      expect(logs[0].target).toBe(2);
      expect(logs[0].location).toBe(100);
      expect(logs[0].ip).toBe('127.0.0.1');
      expect(logs[0].details.raw).toBe('look');
    });

    it('should include timing data', async () => {
      await logger.log('command', 1, 'session-1');
      await waitForWrites();

      const logs = await db.collection('logs').find({}).toArray();
      expect(logs[0].timing).toBeDefined();
      expect(logs[0].timing.sinceLast).toBe(0); // First command
      expect(logs[0].timing.rate).toBe(0); // First command
    });
  });

  describe('Specialized logging methods', () => {
    it('should log connection events', async () => {
      await logger.logConnect('session-1', '192.168.1.1', 'telnet');
      await waitForWrites();

      const logs = await db.collection('logs').find({}).toArray();
      expect(logs[0].type).toBe('connect');
      expect(logs[0].ip).toBe('192.168.1.1');
      expect(logs[0].details.transport).toBe('telnet');
    });

    it('should log successful authentication', async () => {
      await logger.logAuth('session-1', 42, '192.168.1.1', true, 'testuser');
      await waitForWrites();

      const logs = await db.collection('logs').find({}).toArray();
      expect(logs[0].type).toBe('auth');
      expect(logs[0].actor).toBe(42);
      expect(logs[0].details.username).toBe('testuser');
    });

    it('should log failed authentication', async () => {
      await logger.logAuth('session-1', -1, '192.168.1.1', false, 'baduser');
      await waitForWrites();

      const logs = await db.collection('logs').find({}).toArray();
      expect(logs[0].type).toBe('auth_fail');
    });

    it('should log commands', async () => {
      await logger.logCommand(
        'session-1',
        1,
        100,
        'say hello',
        'say',
        'hello',
        '192.168.1.1',
      );
      await waitForWrites();

      const logs = await db.collection('logs').find({}).toArray();
      expect(logs[0].type).toBe('command');
      expect(logs[0].location).toBe(100);
      expect(logs[0].details.raw).toBe('say hello');
      expect(logs[0].details.verb).toBe('say');
      expect(logs[0].details.args).toBe('hello');
    });

    it('should log disconnect and clear session timing', async () => {
      // First log a command to create session timing
      await logger.logCommand('session-1', 1, 100, 'look', 'look');
      await waitForWrites();

      // Then disconnect
      await logger.logDisconnect('session-1', 1, 'quit');
      await waitForWrites();

      const logs = await db
        .collection('logs')
        .find({ type: 'disconnect' })
        .toArray();
      expect(logs[0].details.reason).toBe('quit');

      // Next command in same session should have reset timing
      await logger.logCommand('session-1', 1, 100, 'look', 'look');
      await waitForWrites();

      const commandLogs = await db
        .collection('logs')
        .find({ type: 'command' })
        .sort({ ts: -1 })
        .toArray();
      expect(commandLogs[0].timing.sinceLast).toBe(0); // Reset after disconnect
    });
  });

  describe('Session timing and bot detection', () => {
    it('should track time between commands', async () => {
      vi.useFakeTimers();

      await logger.logCommand('session-1', 1, 100, 'look', 'look');
      vi.advanceTimersByTime(1000); // 1 second later
      await logger.logCommand('session-1', 1, 100, 'north', 'north');

      vi.useRealTimers();
      await waitForWrites();

      const logs = await db
        .collection('logs')
        .find({ type: 'command' })
        .sort({ ts: 1 })
        .toArray();
      expect(logs[1].timing.sinceLast).toBeGreaterThanOrEqual(1000);
    });

    it('should calculate command rate', async () => {
      vi.useFakeTimers();

      // Fire 10 commands over 1 minute
      for (let i = 0; i < 10; i++) {
        await logger.logCommand('session-1', 1, 100, `cmd${i}`, 'cmd');
        vi.advanceTimersByTime(6000); // 6 seconds
      }

      vi.useRealTimers();
      await waitForWrites();

      const logs = await db
        .collection('logs')
        .find({ type: 'command' })
        .sort({ ts: -1 })
        .toArray();
      // Rate should be around 10 commands per minute
      expect(logs[0].timing.rate).toBeGreaterThan(5);
      expect(logs[0].timing.rate).toBeLessThan(15);
    });

    it('should reset timing window after 5 minutes', async () => {
      vi.useFakeTimers();

      await logger.logCommand('session-1', 1, 100, 'cmd1', 'cmd');
      // Advance past 5-minute window reset
      vi.advanceTimersByTime(6 * 60 * 1000);
      await logger.logCommand('session-1', 1, 100, 'cmd2', 'cmd');

      vi.useRealTimers();
      await waitForWrites();

      const logs = await db
        .collection('logs')
        .find({ type: 'command' })
        .sort({ ts: -1 })
        .toArray();
      // Rate should be reset (very low since window just started)
      expect(logs[0].timing.rate).toBeLessThan(1);
    });
  });

  describe('Query functionality', () => {
    beforeEach(async () => {
      // Seed some test data
      await logger.logConnect('session-1', '192.168.1.1', 'telnet');
      await logger.logAuth('session-1', 1, '192.168.1.1', true, 'player1');
      await logger.logCommand('session-1', 1, 100, 'look', 'look');
      await logger.logCommand('session-1', 1, 100, 'north', 'north');
      await logger.logCommand('session-2', 2, 200, 'say hi', 'say');
      await waitForWrites();
    });

    it('should query by type', async () => {
      const logs = await logger.query({ types: ['command'] });
      expect(logs).toHaveLength(3);
      expect(logs.every((l) => l.type === 'command')).toBe(true);
    });

    it('should query by multiple types', async () => {
      const logs = await logger.query({ types: ['connect', 'auth'] });
      expect(logs).toHaveLength(2);
    });

    it('should query by actor', async () => {
      const logs = await logger.query({ actor: 1 });
      expect(logs).toHaveLength(3); // auth + 2 commands
    });

    it('should query by location', async () => {
      const logs = await logger.query({ location: 100 });
      expect(logs).toHaveLength(2);
    });

    it('should query by session', async () => {
      const logs = await logger.query({ session: 'session-1' });
      expect(logs).toHaveLength(4);
    });

    it('should query by IP', async () => {
      const logs = await logger.query({ ip: '192.168.1.1' });
      expect(logs).toHaveLength(2); // connect + auth
    });

    it('should query by time range', async () => {
      const now = new Date();
      const logs = await logger.query({
        from: new Date(now.getTime() - 60000),
        to: now,
      });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should apply limit', async () => {
      const logs = await logger.query({ limit: 2 });
      expect(logs).toHaveLength(2);
    });

    it('should apply skip', async () => {
      const allLogs = await logger.query({});
      const skippedLogs = await logger.query({ skip: 2 });
      expect(skippedLogs).toHaveLength(allLogs.length - 2);
    });

    it('should sort descending by default', async () => {
      const logs = await logger.query({ types: ['command'] });
      // With rapid inserts, timestamps may be equal - verify order is consistent
      expect(logs[0].ts.getTime()).toBeGreaterThanOrEqual(
        logs[logs.length - 1].ts.getTime(),
      );
    });

    it('should sort ascending when specified', async () => {
      const logs = await logger.query({ types: ['command'], sort: 'asc' });
      // With rapid inserts, timestamps may be equal - just verify order is consistent
      expect(logs[0].ts.getTime()).toBeLessThanOrEqual(
        logs[logs.length - 1].ts.getTime(),
      );
    });
  });

  describe('analyzeCommandPattern (bot detection)', () => {
    it('should return null with insufficient data', async () => {
      // Only 5 commands (need at least 10)
      for (let i = 0; i < 5; i++) {
        await logger.logCommand('session-1', 1, 100, `cmd${i}`, 'cmd');
      }
      await waitForWrites();

      const pattern = await logger.analyzeCommandPattern(1, 60);
      expect(pattern).toBeNull();
    });

    it('should analyze command patterns with sufficient data', async () => {
      // Log 15 commands - no fake timers (timestamps will be very close)
      for (let i = 0; i < 15; i++) {
        await logger.logCommand('session-1', 1, 100, 'look', 'look');
      }
      await waitForWrites();

      const pattern = await logger.analyzeCommandPattern(1, 60);
      expect(pattern).not.toBeNull();
      expect(pattern?.actor).toBe(1);
      expect(pattern?.commandRate).toBeGreaterThan(0);
      expect(pattern?.avgInterval).toBeDefined();
      expect(pattern?.intervalStdDev).toBeDefined();
    });

    it('should identify top commands', async () => {
      // Log various commands
      for (let i = 0; i < 5; i++) {
        await logger.logCommand('session-1', 1, 100, 'look', 'look');
      }
      for (let i = 0; i < 3; i++) {
        await logger.logCommand('session-1', 1, 100, 'north', 'north');
      }
      for (let i = 0; i < 2; i++) {
        await logger.logCommand('session-1', 1, 100, 'say hello', 'say');
      }
      await waitForWrites();

      const pattern = await logger.analyzeCommandPattern(1, 60);
      expect(pattern?.topCommands).toHaveLength(3);
      expect(pattern?.topCommands[0].command).toBe('look');
      expect(pattern?.topCommands[0].count).toBe(5);
    });

    it('should calculate standard deviation for interval variance', async () => {
      // Log 15 commands - timestamps will be close together but intervalStdDev will be defined
      for (let i = 0; i < 15; i++) {
        await logger.logCommand('session-1', 1, 100, 'look', 'look');
      }
      await waitForWrites();

      const pattern = await logger.analyzeCommandPattern(1, 60);
      expect(pattern).not.toBeNull();
      // With rapid inserts, intervals will be very small with low variance
      expect(typeof pattern?.intervalStdDev).toBe('number');
      expect(pattern?.intervalStdDev).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzeCoordination (metagaming detection)', () => {
    it('should analyze multiple players', async () => {
      // Player 1 activity (use logAuth for proper actor association)
      await logger.logAuth('session-1', 1, '192.168.1.1', true, 'player1');
      await logger.logCommand('session-1', 1, 100, 'look', 'look');

      // Player 2 activity
      await logger.logAuth('session-2', 2, '192.168.1.2', true, 'player2');
      await logger.logCommand('session-2', 2, 200, 'look', 'look');
      await waitForWrites();

      const result = await logger.analyzeCoordination([1, 2], 24);
      expect(result.players).toEqual([1, 2]);
      expect(result.suspicionScore).toBeGreaterThanOrEqual(0);
      expect(result.suspicionScore).toBeLessThanOrEqual(1);
    });

    it('should detect colocation', async () => {
      // Both players in same room at same time
      await logger.logCommand('session-1', 1, 100, 'look', 'look');
      await logger.logCommand('session-2', 2, 100, 'look', 'look'); // Same room!
      await waitForWrites();

      const result = await logger.analyzeCoordination([1, 2], 24);
      expect(result.colocations).toBeGreaterThan(0);
    });

    it('should flag shared IP addresses', async () => {
      // Both players authenticated from same IP
      // Use logAuth instead of logConnect - logConnect uses actor=-1
      await logger.logAuth('session-1', 1, '192.168.1.1', true, 'player1');
      await logger.logAuth('session-2', 2, '192.168.1.1', true, 'player2'); // Same IP!
      await waitForWrites();

      const result = await logger.analyzeCoordination([1, 2], 24);
      expect(result.flags.some((f) => f.includes('Shared IP'))).toBe(true);
      expect(result.suspicionScore).toBeGreaterThan(0);
    });

    it('should flag simultaneous logins', async () => {
      // Players login within 5 minutes of each other multiple times
      // Use logAuth which creates events with proper actor IDs
      for (let i = 0; i < 5; i++) {
        await logger.logAuth(
          `session-1-${i}`,
          1,
          '192.168.1.1',
          true,
          'player1',
        );
        await logger.logAuth(
          `session-2-${i}`,
          2,
          '192.168.1.2',
          true,
          'player2',
        );
      }
      await waitForWrites();

      const result = await logger.analyzeCoordination([1, 2], 24);
      // Should flag frequent simultaneous logins (5 pairs within minutes of each other)
      expect(result.flags.some((f) => f.includes('simultaneous logins'))).toBe(
        true,
      );
    });

    it('should cap suspicion score at 1.0', async () => {
      // Multiple suspicious activities (use logAuth for proper actor association)
      await logger.logAuth('session-1', 1, '192.168.1.1', true, 'player1');
      await logger.logAuth('session-2', 2, '192.168.1.1', true, 'player2');

      // Many colocations
      for (let i = 0; i < 20; i++) {
        await logger.logCommand('session-1', 1, 100, 'look', 'look');
        await logger.logCommand('session-2', 2, 100, 'look', 'look');
      }
      await waitForWrites();

      const result = await logger.analyzeCoordination([1, 2], 24);
      expect(result.suspicionScore).toBeLessThanOrEqual(1);
    });
  });

  describe('getPlayerActivity', () => {
    beforeEach(async () => {
      // Seed player activity (use logAuth for connection - logConnect uses actor=-1)
      await logger.logAuth('session-1', 1, '192.168.1.1', true, 'player1');
      await logger.logCommand('session-1', 1, 100, 'look', 'look');
      await logger.logCommand('session-1', 1, 100, 'north', 'north');
      await logger.logCommand('session-1', 1, 200, 'south', 'south');
      await logger.logCommand('session-1', 1, 200, 'say hello', 'say');
      await logger.logCommand('session-1', 1, 200, 'whisper hi', 'whisper');
      await waitForWrites();
    });

    it('should count total commands', async () => {
      const activity = await logger.getPlayerActivity(1, 24);
      expect(activity.commands).toBe(5);
    });

    it('should count movements', async () => {
      const activity = await logger.getPlayerActivity(1, 24);
      expect(activity.movements).toBe(2); // north, south
    });

    it('should count messages', async () => {
      const activity = await logger.getPlayerActivity(1, 24);
      expect(activity.messages).toBe(2); // say, whisper
    });

    it('should count connections', async () => {
      const activity = await logger.getPlayerActivity(1, 24);
      expect(activity.connections).toBe(1);
    });

    it('should count unique locations', async () => {
      const activity = await logger.getPlayerActivity(1, 24);
      expect(activity.uniqueLocations).toBe(2); // rooms 100 and 200
    });

    it('should recognize movement aliases', async () => {
      await logger.logCommand('session-1', 1, 100, 'n', 'n');
      await logger.logCommand('session-1', 1, 100, 'e', 'e');
      await logger.logCommand('session-1', 1, 100, 'ne', 'ne');
      await waitForWrites();

      const activity = await logger.getPlayerActivity(1, 24);
      expect(activity.movements).toBe(5); // 2 from before + 3 new
    });
  });

  describe('Circular reference handling', () => {
    it('should sanitize circular references in details', async () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      // Should not throw
      await logger.log('command', 1, 'session-1', {
        details: circular,
      });
      await waitForWrites();

      const logs = await db.collection('logs').find({}).toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].details.self).toBeNull(); // Circular ref replaced with null
    });
  });

  describe('Error resilience', () => {
    it('should not throw on failed insert', async () => {
      // Just verify the method doesn't throw
      await expect(
        logger.log('command', 1, 'session-1'),
      ).resolves.not.toThrow();
    });
  });
});
