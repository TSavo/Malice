import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('$.scheduler', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_scheduler');
    await db.connect();
    await db['objects'].deleteMany({});
    manager = new ObjectManager(db);
    const bootstrap = new GameBootstrap(manager);
    await bootstrap.bootstrap();
    $ = manager as any;
  }, 30000);

  afterAll(async () => {
    await db.disconnect();
  });

  describe('schedule()', () => {
    it('should schedule a one-shot job', async () => {
      const result = await $.scheduler.schedule('testOneShot', 1000, 0, $.system, 'describe');

      expect(result.success).toBe(true);
      expect(result.name).toBe('testOneShot');
      expect(result.interval).toBe(0);
    });

    it('should schedule a repeating job', async () => {
      const result = await $.scheduler.schedule('testRepeating', 0, 5000, $.system, 'describe');

      expect(result.success).toBe(true);
      expect(result.name).toBe('testRepeating');
      expect(result.interval).toBe(5000);
    });

    it('should reject interval less than 1 second', async () => {
      const result = await $.scheduler.schedule('tooFast', 0, 500, $.system, 'describe');

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('at least 1000ms');
    });

    it('should allow 0 interval for one-shot', async () => {
      const result = await $.scheduler.schedule('zeroInterval', 1000, 0, $.system, 'describe');

      expect(result.success).toBe(true);
    });

    it('should accept object ID as target', async () => {
      const result = await $.scheduler.schedule('idTarget', 1000, 0, $.system.id, 'describe');

      expect(result.success).toBe(true);
    });

    it('should store job with correct structure', async () => {
      await $.scheduler.schedule('structureTest', 2000, 3000, $.system, 'testMethod', 'arg1', 'arg2');

      const job = await $.scheduler.getJob('structureTest');

      expect(job).toBeTruthy();
      expect(job.interval).toBe(3000);
      expect(job.targetId).toBe($.system.id);
      expect(job.method).toBe('testMethod');
      expect(job.args).toEqual(['arg1', 'arg2']);
      expect(job.enabled).toBe(true);
      expect(job.nextRun).toBeDefined();
    });

    it('should return error on missing parameters', async () => {
      const result = await $.scheduler.schedule('incomplete', 0);

      expect(result.error).toBeTruthy();
    });

    it('should reject negative delay', async () => {
      const result = await $.scheduler.schedule('negDelay', -1000, 0, $.system, 'describe');

      expect(result.error).toBeTruthy();
    });
  });

  describe('unschedule()', () => {
    it('should remove a scheduled job', async () => {
      await $.scheduler.schedule('toRemove', 5000, 0, $.system, 'describe');
      const result = await $.scheduler.unschedule('toRemove');

      expect(result.success).toBe(true);

      const job = await $.scheduler.getJob('toRemove');
      expect(job).toBeNull();
    });

    it('should return error for non-existent job', async () => {
      const result = await $.scheduler.unschedule('nonExistent');

      expect(result.error).toBeTruthy();
    });
  });

  describe('setEnabled()', () => {
    it('should disable a job', async () => {
      await $.scheduler.schedule('toDisable', 5000, 1000, $.system, 'describe');
      const result = await $.scheduler.setEnabled('toDisable', false);

      expect(result.success).toBe(true);
      expect(result.enabled).toBe(false);

      const job = await $.scheduler.getJob('toDisable');
      expect(job.enabled).toBe(false);
    });

    it('should enable a disabled job', async () => {
      await $.scheduler.schedule('toEnable', 5000, 1000, $.system, 'describe');
      await $.scheduler.setEnabled('toEnable', false);
      const result = await $.scheduler.setEnabled('toEnable', true);

      expect(result.success).toBe(true);
      expect(result.enabled).toBe(true);
    });

    it('should return error for non-existent job', async () => {
      const result = await $.scheduler.setEnabled('noJob', false);

      expect(result.error).toBeTruthy();
    });
  });

  describe('getJob()', () => {
    it('should return job details', async () => {
      await $.scheduler.schedule('getJobTest', 1000, 2000, $.system, 'describe');

      const job = await $.scheduler.getJob('getJobTest');

      expect(job).toBeTruthy();
      expect(job.interval).toBe(2000);
      expect(job.method).toBe('describe');
    });

    it('should return null for non-existent job', async () => {
      const job = await $.scheduler.getJob('noSuchJob');

      expect(job).toBeNull();
    });
  });

  describe('listJobs()', () => {
    it('should return all job names', async () => {
      // Clear existing jobs first
      const existingJobs = await $.scheduler.listJobs();
      for (const name of existingJobs) {
        await $.scheduler.unschedule(name);
      }

      await $.scheduler.schedule('listJob1', 1000, 0, $.system, 'describe');
      await $.scheduler.schedule('listJob2', 2000, 0, $.system, 'describe');
      await $.scheduler.schedule('listJob3', 3000, 0, $.system, 'describe');

      const jobs = await $.scheduler.listJobs();

      expect(jobs).toContain('listJob1');
      expect(jobs).toContain('listJob2');
      expect(jobs).toContain('listJob3');
    });
  });

  describe('getNextRun()', () => {
    it('should return next run timestamp', async () => {
      const before = Date.now();
      await $.scheduler.schedule('nextRunTest', 5000, 0, $.system, 'describe');

      const nextRun = await $.scheduler.getNextRun('nextRunTest');

      expect(nextRun).toBeGreaterThanOrEqual(before + 5000);
    });

    it('should return null for disabled job', async () => {
      await $.scheduler.schedule('disabledNext', 5000, 0, $.system, 'describe');
      await $.scheduler.setEnabled('disabledNext', false);

      const nextRun = await $.scheduler.getNextRun('disabledNext');

      expect(nextRun).toBeNull();
    });

    it('should return null for non-existent job', async () => {
      const nextRun = await $.scheduler.getNextRun('noNextJob');

      expect(nextRun).toBeNull();
    });
  });

  describe('tick()', () => {
    it('should run jobs whose time has come', async () => {
      // Create a test object with a method that sets a flag
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'TickTest', wasRun: false },
      }, null);

      testObj.setMethod('markRun', `
        self.wasRun = true;
        return 'executed';
      `);

      // Schedule for immediate execution
      await $.scheduler.schedule('tickTest', 0, 0, testObj, 'markRun');

      // Run tick
      const results = await $.scheduler.tick();

      expect(results).toBeInstanceOf(Array);
      const tickResult = results.find((r: any) => r.job === 'tickTest');
      expect(tickResult).toBeTruthy();
      expect(tickResult.success).toBe(true);
      expect(testObj.wasRun).toBe(true);
    });

    it('should delete one-shot jobs after execution', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'OneShotTest' },
      }, null);

      testObj.setMethod('noop', `return 'done';`);

      await $.scheduler.schedule('oneShotDelete', 0, 0, testObj, 'noop');
      await $.scheduler.tick();

      const job = await $.scheduler.getJob('oneShotDelete');
      expect(job).toBeNull();
    });

    it('should reschedule repeating jobs', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'RepeatTest' },
      }, null);

      testObj.setMethod('noop', `return 'done';`);

      const beforeSchedule = Date.now();
      await $.scheduler.schedule('repeatReschedule', 0, 2000, testObj, 'noop');
      await $.scheduler.tick();

      const job = await $.scheduler.getJob('repeatReschedule');
      expect(job).toBeTruthy();
      expect(job.nextRun).toBeGreaterThanOrEqual(beforeSchedule + 2000);
    });

    it('should not run disabled jobs', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'DisabledTest', wasRun: false },
      }, null);

      testObj.setMethod('markRun', `
        self.wasRun = true;
      `);

      await $.scheduler.schedule('disabledTick', 0, 0, testObj, 'markRun');
      await $.scheduler.setEnabled('disabledTick', false);
      await $.scheduler.tick();

      expect(testObj.wasRun).toBe(false);
    });

    it('should not run jobs whose time has not come', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'FutureTest', wasRun: false },
      }, null);

      testObj.setMethod('markRun', `
        self.wasRun = true;
      `);

      await $.scheduler.schedule('futureTick', 60000, 0, testObj, 'markRun');
      await $.scheduler.tick();

      expect(testObj.wasRun).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'ErrorTest' },
      }, null);

      testObj.setMethod('throwError', `
        throw new Error('Test error');
      `);

      await $.scheduler.schedule('errorTick', 0, 0, testObj, 'throwError');
      const results = await $.scheduler.tick();

      const errorResult = results.find((r: any) => r.job === 'errorTick');
      expect(errorResult).toBeTruthy();
      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toContain('Test error');
    });

    it('should pass arguments to job method', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'ArgsTest', receivedArgs: null },
      }, null);

      testObj.setMethod('receiveArgs', `
        self.receivedArgs = [...args];
        return self.receivedArgs;
      `);

      await $.scheduler.schedule('argsTick', 0, 0, testObj, 'receiveArgs', 'hello', 42, true);
      await $.scheduler.tick();

      expect(testObj.receivedArgs).toEqual(['hello', 42, true]);
    });
  });

  describe('runNow()', () => {
    it('should run job immediately', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'RunNowTest', wasRun: false },
      }, null);

      testObj.setMethod('markRun', `
        self.wasRun = true;
        return 'immediate';
      `);

      // Schedule for far future
      await $.scheduler.schedule('runNowTest', 60000, 0, testObj, 'markRun');

      // But run now
      const result = await $.scheduler.runNow('runNowTest');

      expect(result.success).toBe(true);
      expect(result.result).toBe('immediate');
      expect(testObj.wasRun).toBe(true);
    });

    it('should delete one-shot after runNow', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'RunNowDelete' },
      }, null);

      testObj.setMethod('noop', `return 'done';`);

      await $.scheduler.schedule('runNowDelete', 60000, 0, testObj, 'noop');
      await $.scheduler.runNow('runNowDelete');

      const job = await $.scheduler.getJob('runNowDelete');
      expect(job).toBeNull();
    });

    it('should reschedule repeating job after runNow', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'RunNowRepeat' },
      }, null);

      testObj.setMethod('noop', `return 'done';`);

      const before = Date.now();
      await $.scheduler.schedule('runNowRepeat', 60000, 3000, testObj, 'noop');
      await $.scheduler.runNow('runNowRepeat');

      const job = await $.scheduler.getJob('runNowRepeat');
      expect(job).toBeTruthy();
      expect(job.nextRun).toBeGreaterThanOrEqual(before + 3000);
    });

    it('should return error for non-existent job', async () => {
      const result = await $.scheduler.runNow('noSuchRunNow');

      expect(result.error).toBeTruthy();
    });
  });

  describe('describe()', () => {
    it('should return description of scheduler state', async () => {
      // Clear existing jobs
      const existingJobs = await $.scheduler.listJobs();
      for (const name of existingJobs) {
        await $.scheduler.unschedule(name);
      }

      await $.scheduler.schedule('descJob1', 5000, 0, $.system, 'describe');
      await $.scheduler.schedule('descJob2', 0, 10000, $.system, 'describe');

      const desc = await $.scheduler.describe();

      expect(desc).toContain('2 job(s)');
      expect(desc).toContain('descJob1');
      expect(desc).toContain('descJob2');
      expect(desc).toContain('one-shot');
      expect(desc).toContain('every');
    });

    it('should indicate no jobs when empty', async () => {
      const existingJobs = await $.scheduler.listJobs();
      for (const name of existingJobs) {
        await $.scheduler.unschedule(name);
      }

      const desc = await $.scheduler.describe();

      expect(desc).toContain('No jobs');
    });
  });

  describe('persistence', () => {
    it('should persist jobs across scheduler reload', async () => {
      const schedulerId = $.scheduler.id;

      await $.scheduler.schedule('persistJob', 10000, 5000, $.system, 'describe');

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reload scheduler from database
      const reloadedScheduler = await $.load(schedulerId);
      const jobs = reloadedScheduler.jobs;

      expect(jobs.persistJob).toBeTruthy();
      expect(jobs.persistJob.interval).toBe(5000);
    });
  });
});
