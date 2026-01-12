import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('Scheduler Auto-Fixer Integration', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;
  let $scheduler: any;
  let $autoFixer: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_scheduler_autofixer');
    await db.connect();
    await db.objects.deleteMany({});
    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager, {
      _testMode: true,
    });
    await bootstrap.bootstrap();
    $ = manager as any;
    $scheduler = await $.scheduler;
    $autoFixer = await $.autoFixer;
  }, 180000);

  afterAll(async () => {
    await manager.flushWrites();
    await db.disconnect();
  });

  describe('Auto-Fixer Scheduler Job Registration', () => {
    it('should register autoFixerTick job during bootstrap', async () => {
      const job = await $scheduler.getJob('autoFixerTick');

      expect(job).toBeDefined();
      expect(job).toHaveProperty('interval');
      expect(job).toHaveProperty('nextRun');
      expect(job).toHaveProperty('targetId');
      expect(job).toHaveProperty('method');
      expect(job).toHaveProperty('enabled');
    });

    it('should have correct job configuration', async () => {
      const job = await $scheduler.getJob('autoFixerTick');

      expect(job.interval).toBe(3600000); // 1 hour in ms
      expect(job.method).toBe('tick');
      expect(job.targetId).toBe($autoFixer.id);
      expect(job.enabled).toBe(true);
      expect(Array.isArray(job.args)).toBe(true);
      expect(job.args.length).toBe(0);
    });

    it('should schedule job to run on quarter-hour (:15 past the hour)', async () => {
      const job = await $scheduler.getJob('autoFixerTick');

      // nextRun should be a timestamp
      expect(typeof job.nextRun).toBe('number');
      expect(job.nextRun).toBeGreaterThan(Date.now() - 3600000); // Not more than 1h ago
      expect(job.nextRun).toBeLessThan(Date.now() + 3600000); // Not more than 1h in future

      // Calculate what minute mark it should run on
      const nextRunDate = new Date(job.nextRun);
      const minutes = nextRunDate.getMinutes();

      // Should be scheduled for :15 past the hour
      expect(minutes).toBe(15);
    });

    it('should target the autoFixer object', async () => {
      const job = await $scheduler.getJob('autoFixerTick');

      // Load the target object
      const target = await manager.load(job.targetId);

      expect(target).toBeDefined();
      expect(target?.id).toBe($autoFixer.id);
      expect(target?.name).toBe('Auto-Fixer');
    });

    it('should be included in scheduler job list', async () => {
      const allJobs = await $scheduler.listJobs();

      expect(Array.isArray(allJobs)).toBe(true);

      const autoFixerJob = allJobs.find(
        (job: any) => job.name === 'autoFixerTick'
      );

      expect(autoFixerJob).toBeDefined();
      expect(autoFixerJob.enabled).toBe(true);
    });

    it('should be enabled by default', async () => {
      const job = await $scheduler.getJob('autoFixerTick');

      expect(job.enabled).toBe(true);
    });

    it('should run every hour (3600000ms)', async () => {
      const job = await $scheduler.getJob('autoFixerTick');

      const expectedInterval = 3600000; // 1 hour
      expect(job.interval).toBe(expectedInterval);
    });

    it('should call tick method on autoFixer', async () => {
      const job = await $scheduler.getJob('autoFixerTick');

      expect(job.method).toBe('tick');

      // Verify autoFixer has tick method
      const methods = $autoFixer.getMethods();
      expect(methods).toHaveProperty('tick');
    });

    it('should pass no arguments to tick method', async () => {
      const job = await $scheduler.getJob('autoFixerTick');

      expect(job.args).toEqual([]);
    });
  });

  describe('Auto-Fixer Job Interaction with Scheduler', () => {
    it('should be pausable via scheduler', async () => {
      await $scheduler.setEnabled('autoFixerTick', false);

      const job = await $scheduler.getJob('autoFixerTick');
      expect(job.enabled).toBe(false);

      // Re-enable for other tests
      await $scheduler.setEnabled('autoFixerTick', true);
    });

    it('should be resumable via scheduler', async () => {
      await $scheduler.setEnabled('autoFixerTick', false);
      await $scheduler.setEnabled('autoFixerTick', true);

      const job = await $scheduler.getJob('autoFixerTick');
      expect(job.enabled).toBe(true);
    });

    it('should be manually runnable via scheduler', async () => {
      // Disable autoFixer to prevent actual AI calls during test
      await $autoFixer.setEnabled(false);

      try {
        const result = await $scheduler.runNow('autoFixerTick');

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.skipped).toBe(true); // Should skip because disabled
        expect(result.reason).toBe('disabled');
      } finally {
        // Re-enable for other tests
        await $autoFixer.setEnabled(true);
      }
    });

    it('should be unschedulable and re-schedulable', async () => {
      // Unschedule
      await $scheduler.unschedule('autoFixerTick');

      let job = await $scheduler.getJob('autoFixerTick');
      expect(job).toBeNull();

      // Re-schedule manually (simulating what registerAutoFixerJob does)
      const now = Date.now();
      const msPerHour = 3600000;
      const msPerQuarterHour = 900000; // 15 minutes
      const msSinceHour = now % msPerHour;
      const msUntilNextQuarter =
        msSinceHour < msPerQuarterHour
          ? msPerQuarterHour - msSinceHour
          : msPerHour - msSinceHour + msPerQuarterHour;

      await $scheduler.schedule(
        'autoFixerTick',
        msUntilNextQuarter,
        msPerHour,
        $autoFixer,
        'tick'
      );

      job = await $scheduler.getJob('autoFixerTick');
      expect(job).toBeDefined();
      expect(job.method).toBe('tick');
    });
  });

  describe('Time Calculation Logic', () => {
    it('should correctly calculate next quarter-hour from various times', () => {
      const msPerHour = 3600000;
      const msPerQuarterHour = 900000; // 15 minutes

      // Test at various times within an hour
      const testCases = [
        { minute: 0, expected: 15 },   // :00 -> :15
        { minute: 10, expected: 15 },  // :10 -> :15
        { minute: 14, expected: 15 },  // :14 -> :15
        { minute: 15, expected: 15 },  // :15 -> :15 (next hour)
        { minute: 20, expected: 15 },  // :20 -> :15 (next hour)
        { minute: 45, expected: 15 },  // :45 -> :15 (next hour)
        { minute: 59, expected: 15 },  // :59 -> :15 (next hour)
      ];

      for (const testCase of testCases) {
        // Create a fake timestamp at the test minute
        const now = Date.now();
        const currentDate = new Date(now);
        currentDate.setMinutes(testCase.minute);
        currentDate.setSeconds(0);
        currentDate.setMilliseconds(0);
        const fakeNow = currentDate.getTime();

        const msSinceHour = fakeNow % msPerHour;
        const msUntilNextQuarter =
          msSinceHour < msPerQuarterHour
            ? msPerQuarterHour - msSinceHour
            : msPerHour - msSinceHour + msPerQuarterHour;

        const nextRun = fakeNow + msUntilNextQuarter;
        const nextRunDate = new Date(nextRun);
        const resultMinute = nextRunDate.getMinutes();

        expect(resultMinute).toBe(testCase.expected);
      }
    });

    it('should ensure nextRun is always in the future', async () => {
      const job = await $scheduler.getJob('autoFixerTick');
      const now = Date.now();

      expect(job.nextRun).toBeGreaterThan(now - 1000); // Allow 1s tolerance for test execution time
    });
  });
});
