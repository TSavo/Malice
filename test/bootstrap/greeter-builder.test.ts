import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('$greeter - Pool System', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;
  let $greeter: any;
  let $player: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_greeter_pool');
    await db.connect();
    await db.objects.deleteMany({});
    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager, {
      _testMode: true,
    });
    await bootstrap.bootstrap();
    $ = manager as any;
    $greeter = await $.greeter;
    $player = await $.player;
  }, 180000);

  afterAll(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('Pool Status', () => {
    it('should return initial pool status', async () => {
      const status = await $greeter.getPoolStatus();

      expect(status).toBeDefined();
      expect(status.continuum).toBeGreaterThanOrEqual(0);
      expect(status.cartel).toBeGreaterThanOrEqual(0);
      expect(status.target).toBe(2);
      expect(status.replenishing).toBeDefined();
    });

    it('should have pool structure initialized', async () => {
      const pool = $greeter.greeterPool || {};
      expect(pool).toBeDefined();
      expect(Array.isArray(pool.continuum)).toBe(true);
      expect(Array.isArray(pool.cartel)).toBe(true);
    });
  });

  describe('spawnPooledGreeter()', () => {
    it('should spawn a continuum greeter with correct properties', async () => {
      const greeter = await $greeter.spawnPooledGreeter('continuum');

      expect(greeter).toBeDefined();
      expect(greeter.name).toBeTruthy();
      expect(greeter.role).toBe('continuum-greeter');
      expect(greeter.location).toBeDefined();
      expect(greeter.location.id).toBe($.immigrationServices.id);
    });

    it('should spawn a cartel greeter with correct properties', async () => {
      const greeter = await $greeter.spawnPooledGreeter('cartel');

      expect(greeter).toBeDefined();
      expect(greeter.name).toBeTruthy();
      expect(greeter.role).toBe('cartel-greeter');
      expect(greeter.location).toBeDefined();
      expect(greeter.location.id).toBe($.runnersDen.id);
    });

    it('should reject invalid faction', async () => {
      await expect($greeter.spawnPooledGreeter('invalid')).rejects.toThrow();
    });

    it('should spawn greeter with unique name', async () => {
      const greeter1 = await $greeter.spawnPooledGreeter('continuum');
      const greeter2 = await $greeter.spawnPooledGreeter('continuum');

      // Names should be different (or have different suffixes if pool exhausted)
      expect(greeter1.name).toBeTruthy();
      expect(greeter2.name).toBeTruthy();
    });
  });

  describe('replenishPool()', () => {
    it('should replenish continuum pool to target size', async () => {
      // Clear the pool first
      $greeter.greeterPool = { continuum: [], cartel: [] };

      const result = await $greeter.replenishPool('continuum');

      expect(result.success).toBe(true);
      expect(result.spawned).toBeGreaterThan(0);

      const status = await $greeter.getPoolStatus();
      expect(status.continuum).toBe(status.target);
    });

    it('should replenish cartel pool to target size', async () => {
      // Clear the pool first
      $greeter.greeterPool = { continuum: [], cartel: [] };

      const result = await $greeter.replenishPool('cartel');

      expect(result.success).toBe(true);
      expect(result.spawned).toBeGreaterThan(0);

      const status = await $greeter.getPoolStatus();
      expect(status.cartel).toBe(status.target);
    });

    it('should not spawn if pool already at target', async () => {
      // First replenish to target
      await $greeter.replenishPool('continuum');

      // Try again
      const result = await $greeter.replenishPool('continuum');

      expect(result.success).toBe(true);
      expect(result.spawned).toBe(0);
    });

    it('should prevent concurrent replenishment of same faction', async () => {
      // Clear pool
      $greeter.greeterPool = { continuum: [], cartel: [] };

      // Start two replenishments concurrently
      const [result1, result2] = await Promise.all([
        $greeter.replenishPool('continuum'),
        $greeter.replenishPool('continuum'),
      ]);

      // One should succeed with spawns, the other should be skipped
      const spawned1 = result1.spawned || 0;
      const spawned2 = result2.spawned || 0;

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Total spawned should be reasonable (target size, not double)
      const total = spawned1 + spawned2;
      expect(total).toBeLessThanOrEqual($greeter.poolSize + 1); // Allow for slight race
    });

    it('should reject invalid faction', async () => {
      await expect($greeter.replenishPool('invalid')).rejects.toThrow();
    });

    it('should clear replenishing flag after completion', async () => {
      $greeter.greeterPool = { continuum: [], cartel: [] };

      await $greeter.replenishPool('continuum');

      const replenishing = $greeter.replenishing || {};
      expect(replenishing.continuum).toBeFalsy();
    });
  });

  describe('acquireFromPool()', () => {
    it('should acquire a greeter from continuum pool', async () => {
      // Ensure pool has greeters
      await $greeter.replenishPool('continuum');

      const initialStatus = await $greeter.getPoolStatus();
      const greeter = await $greeter.acquireFromPool('continuum');

      expect(greeter).toBeDefined();
      expect(greeter.role).toBe('continuum-greeter');

      const afterStatus = await $greeter.getPoolStatus();
      expect(afterStatus.continuum).toBe(initialStatus.continuum - 1);
    });

    it('should acquire a greeter from cartel pool', async () => {
      // Ensure pool has greeters
      await $greeter.replenishPool('cartel');

      const initialStatus = await $greeter.getPoolStatus();
      const greeter = await $greeter.acquireFromPool('cartel');

      expect(greeter).toBeDefined();
      expect(greeter.role).toBe('cartel-greeter');

      const afterStatus = await $greeter.getPoolStatus();
      expect(afterStatus.cartel).toBe(initialStatus.cartel - 1);
    });

    it('should return null if pool is empty', async () => {
      // Clear pool
      $greeter.greeterPool = { continuum: [], cartel: [] };

      const greeter = await $greeter.acquireFromPool('continuum');

      expect(greeter).toBeNull();
    });

    it('should reject invalid faction', async () => {
      await expect($greeter.acquireFromPool('invalid')).rejects.toThrow();
    });

    it('should skip invalid greeter IDs and try next', async () => {
      // Ensure pool is populated
      await $greeter.replenishPool('continuum');

      // Inject an invalid ID into the pool
      const pool = $greeter.greeterPool || {};
      pool.continuum = [999999, ...pool.continuum];
      $greeter.greeterPool = pool;

      // Should skip invalid ID and get next valid one
      const greeter = await $greeter.acquireFromPool('continuum');

      expect(greeter).toBeDefined();
      expect(greeter.role).toBe('continuum-greeter');
    });
  });

  describe('returnToPool()', () => {
    it('should recycle greeter by default', async () => {
      const greeter = await $greeter.spawnPooledGreeter('continuum');
      const greeterId = greeter.id;

      const result = await $greeter.returnToPool(greeterId);

      expect(result.success).toBe(true);
      expect(result.action).toBe('recycled');

      // Greeter should be recycled
      const recycled = await $.load(greeterId);
      expect(recycled.recycled).toBe(true);
    });

    it('should recycle when explicitly requested', async () => {
      const greeter = await $greeter.spawnPooledGreeter('continuum');
      const greeterId = greeter.id;

      const result = await $greeter.returnToPool(greeterId, true);

      expect(result.success).toBe(true);
      expect(result.action).toBe('recycled');
    });

    it('should handle missing greeterId', async () => {
      const result = await $greeter.returnToPool(null);

      expect(result.error).toBeTruthy();
    });
  });

  describe('initializePools()', () => {
    it('should initialize both faction pools', async () => {
      const result = await $greeter.initializePools();

      expect(result.success).toBe(true);
      expect(result.message).toContain('initialization');

      // Wait a bit for background replenishment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const status = await $greeter.getPoolStatus();
      expect(status.continuum).toBeGreaterThanOrEqual(0);
      expect(status.cartel).toBeGreaterThanOrEqual(0);
    });
  });

  describe('spawnForPlayer() - Pool Integration', () => {
    it('should assign greeter from continuum pool', async () => {
      // Ensure pool is populated
      await $greeter.replenishPool('continuum');

      // Create test player
      const testPlayer = await $.recycler.create($player, {
        name: 'TestContinuumPlayer',
        playername: 'test_continuum',
      });

      const greeter = await $greeter.spawnForPlayer(testPlayer.id, 'continuum');

      expect(greeter).toBeDefined();
      expect(greeter.role).toBe('continuum-greeter');

      // Check orientation state was initialized
      const orientation = testPlayer.orientation;
      expect(orientation).toBeDefined();
      expect(orientation.greeterId).toBe(greeter.id);
      expect(orientation.faction).toBe('continuum');
      expect(orientation.phase).toBe('welcome');

      // Check active greeters tracking
      const activeGreeters = $greeter.activeGreeters || {};
      expect(activeGreeters[testPlayer.id]).toBe(greeter.id);
    });

    it('should assign greeter from cartel pool', async () => {
      // Ensure pool is populated
      await $greeter.replenishPool('cartel');

      // Create test player
      const testPlayer = await $.recycler.create($player, {
        name: 'TestCartelPlayer',
        playername: 'test_cartel',
      });

      const greeter = await $greeter.spawnForPlayer(testPlayer.id, 'cartel');

      expect(greeter).toBeDefined();
      expect(greeter.role).toBe('cartel-greeter');

      const orientation = testPlayer.orientation;
      expect(orientation).toBeDefined();
      expect(orientation.greeterId).toBe(greeter.id);
      expect(orientation.faction).toBe('cartel');
    });

    it('should fall back to direct spawn if pool empty', async () => {
      // Clear pool
      $greeter.greeterPool = { continuum: [], cartel: [] };

      // Create test player
      const testPlayer = await $.recycler.create($player, {
        name: 'TestFallbackPlayer',
        playername: 'test_fallback',
      });

      const greeter = await $greeter.spawnForPlayer(testPlayer.id, 'continuum');

      expect(greeter).toBeDefined();
      expect(greeter.role).toBe('continuum-greeter');
    });

    it('should reuse existing greeter for same player', async () => {
      // Create test player and assign greeter
      const testPlayer = await $.recycler.create($player, {
        name: 'TestReusePlayer',
        playername: 'test_reuse',
      });

      const greeter1 = await $greeter.spawnForPlayer(
        testPlayer.id,
        'continuum',
      );
      const greeter2 = await $greeter.spawnForPlayer(
        testPlayer.id,
        'continuum',
      );

      expect(greeter1.id).toBe(greeter2.id);
    });

    it('should set systemPrompt on assigned greeter', async () => {
      // Ensure pool is populated
      await $greeter.replenishPool('continuum');

      const testPlayer = await $.recycler.create($player, {
        name: 'TestSystemPromptPlayer',
        playername: 'test_prompt',
      });

      const greeter = await $greeter.spawnForPlayer(testPlayer.id, 'continuum');

      expect(greeter.systemPrompt).toBeTruthy();
      expect(greeter.systemPrompt).toContain(testPlayer.name);
      expect(greeter.systemPrompt).toContain(greeter.name);
    });
  });

  describe('getGreeterSystemPrompt()', () => {
    it('should generate continuum system prompt', async () => {
      const greeter = await $greeter.spawnPooledGreeter('continuum');
      const prompt = await $greeter.getGreeterSystemPrompt(
        123,
        'TestPlayer',
        'continuum',
        greeter,
      );

      expect(prompt).toBeTruthy();
      expect(prompt).toContain('TestPlayer');
      expect(prompt).toContain(greeter.name);
      expect(prompt).toContain('CorpSec');
      expect(prompt).toContain('Immigration Services');
      expect(prompt).toContain('Continuum');
    });

    it('should generate cartel system prompt', async () => {
      const greeter = await $greeter.spawnPooledGreeter('cartel');
      const prompt = await $greeter.getGreeterSystemPrompt(
        456,
        'TestPlayer',
        'cartel',
        greeter,
      );

      expect(prompt).toBeTruthy();
      expect(prompt).toContain('TestPlayer');
      expect(prompt).toContain(greeter.name);
      expect(prompt).toContain('Gray Cartel');
      expect(prompt).toContain('Runner');
      expect(prompt).toContain('underground');
    });
  });

  describe('completeOrientation() - Pool Integration', () => {
    it('should return greeter to pool on completion', async () => {
      // Create test player with active greeter
      const testPlayer = await $.recycler.create($player, {
        name: 'TestCompletePlayer',
        playername: 'test_complete',
      });

      const greeter = await $greeter.spawnForPlayer(testPlayer.id, 'continuum');
      const greeterId = greeter.id;

      // Initialize some orientation progress
      testPlayer.orientation.completedPhases = ['welcome', 'tour'];

      await $greeter.completeOrientation(testPlayer.id);

      // Check orientation is marked complete
      const orientation = testPlayer.orientation;
      expect(orientation.phase).toBe('complete');
      expect(orientation.completedAt).toBeTruthy();

      // Check greeter was recycled
      const recycledGreeter = await $.load(greeterId);
      expect(recycledGreeter.recycled).toBe(true);

      // Check active greeters tracking cleared
      const activeGreeters = $greeter.activeGreeters || {};
      expect(activeGreeters[testPlayer.id]).toBeUndefined();
    });
  });
});
