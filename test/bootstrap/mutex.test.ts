import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ObjectDatabase } from '../../src/database/object-db.js';
import { ObjectManager } from '../../src/database/object-manager.js';
import { GameBootstrap } from '../../src/database/game-bootstrap.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/?replicaSet=rs0&directConnection=true';

describe('$.mutex', () => {
  let db: ObjectDatabase;
  let manager: ObjectManager;
  let $: any;

  beforeAll(async () => {
    db = new ObjectDatabase(MONGO_URI, 'malice_test_mutex');
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

  describe('acquire()', () => {
    it('should acquire a lock and return false', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      const result = await $.mutex.acquire(testObj, 'testLock', { owner: 'test' });
      expect(result).toBe(false); // false means lock acquired
    });

    it('should return lock data when already locked', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'testLock', { owner: 'first' });
      const result = await $.mutex.acquire(testObj, 'testLock', { owner: 'second' });

      expect(result).toEqual({ owner: 'first' }); // Returns existing lock data
    });

    it('should allow different lock names on same object', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      const result1 = await $.mutex.acquire(testObj, 'lockA', { type: 'A' });
      const result2 = await $.mutex.acquire(testObj, 'lockB', { type: 'B' });

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should store lock in object _mutexes property', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'storedLock', { data: 123 });

      const mutexes = testObj._mutexes;
      expect(mutexes).toBeTruthy();
      expect(mutexes.storedLock).toBeTruthy();
      expect(mutexes.storedLock.data).toEqual({ data: 123 });
      expect(mutexes.storedLock.acquiredAt).toBeDefined();
    });

    it('should throw on missing object', async () => {
      await expect($.mutex.acquire(null, 'test')).rejects.toThrow('Object is required');
    });

    it('should throw on missing or invalid name', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await expect($.mutex.acquire(testObj, '')).rejects.toThrow('Mutex name must be a non-empty string');
      await expect($.mutex.acquire(testObj, null)).rejects.toThrow('Mutex name must be a non-empty string');
    });

    it('should use true as default data if none provided', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'defaultData');

      const mutexes = testObj._mutexes;
      expect(mutexes.defaultData.data).toBe(true);
    });
  });

  describe('release()', () => {
    it('should release an existing lock', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'releaseLock', { owner: 'test' });
      const result = await $.mutex.release(testObj, 'releaseLock');

      expect(result).toBe(true);
      expect(testObj._mutexes.releaseLock).toBeUndefined();
    });

    it('should return false when releasing non-existent lock', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      const result = await $.mutex.release(testObj, 'nonExistent');
      expect(result).toBe(false);
    });

    it('should allow re-acquiring after release', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'reacquireLock', { round: 1 });
      await $.mutex.release(testObj, 'reacquireLock');
      const result = await $.mutex.acquire(testObj, 'reacquireLock', { round: 2 });

      expect(result).toBe(false);
      expect(testObj._mutexes.reacquireLock.data).toEqual({ round: 2 });
    });

    it('should work with object ID instead of object', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'idRelease', { test: true });
      const result = await $.mutex.release(testObj.id, 'idRelease');

      expect(result).toBe(true);
    });
  });

  describe('check()', () => {
    it('should return false for unlocked mutex', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      const result = await $.mutex.check(testObj, 'checkLock');
      expect(result).toBe(false);
    });

    it('should return lock data for locked mutex', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'checkLock', { status: 'locked' });
      const result = await $.mutex.check(testObj, 'checkLock');

      expect(result).toEqual({ status: 'locked' });
    });

    it('should not modify lock state', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'checkOnly', { count: 1 });
      await $.mutex.check(testObj, 'checkOnly');
      await $.mutex.check(testObj, 'checkOnly');

      expect(testObj._mutexes.checkOnly.data).toEqual({ count: 1 });
    });
  });

  describe('update()', () => {
    it('should update data on existing lock', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'updateLock', { version: 1 });
      const result = await $.mutex.update(testObj, 'updateLock', { version: 2 });

      expect(result).toBe(true);
      expect(testObj._mutexes.updateLock.data).toEqual({ version: 2 });
    });

    it('should return false for non-existent lock', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      const result = await $.mutex.update(testObj, 'noLock', { data: 'new' });
      expect(result).toBe(false);
    });

    it('should preserve acquiredAt timestamp', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'preserveTime', { v: 1 });
      const originalTime = testObj._mutexes.preserveTime.acquiredAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      await $.mutex.update(testObj, 'preserveTime', { v: 2 });

      expect(testObj._mutexes.preserveTime.acquiredAt).toBe(originalTime);
    });
  });

  describe('list()', () => {
    it('should return empty object when no locks', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      const result = await $.mutex.list(testObj);
      expect(result).toEqual({});
    });

    it('should return all locks on object', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'lock1', { n: 1 });
      await $.mutex.acquire(testObj, 'lock2', { n: 2 });
      await $.mutex.acquire(testObj, 'lock3', { n: 3 });

      const result = await $.mutex.list(testObj);

      expect(Object.keys(result)).toHaveLength(3);
      expect(result.lock1.data).toEqual({ n: 1 });
      expect(result.lock2.data).toEqual({ n: 2 });
      expect(result.lock3.data).toEqual({ n: 3 });
    });
  });

  describe('releaseAll()', () => {
    it('should release all locks on object', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'allLock1', { n: 1 });
      await $.mutex.acquire(testObj, 'allLock2', { n: 2 });
      await $.mutex.acquire(testObj, 'allLock3', { n: 3 });

      const count = await $.mutex.releaseAll(testObj);

      expect(count).toBe(3);
      expect(testObj._mutexes).toEqual({});
    });

    it('should return 0 when no locks exist', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      const count = await $.mutex.releaseAll(testObj);
      expect(count).toBe(0);
    });
  });

  describe('forceRelease()', () => {
    it('should work same as release', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'forceLock', { owner: 'test' });
      const result = await $.mutex.forceRelease(testObj, 'forceLock');

      expect(result).toBe(true);
      expect(testObj._mutexes.forceLock).toBeUndefined();
    });
  });

  describe('timed locks with scheduler', () => {
    it('should schedule auto-release when timeout specified', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'timedLock', { owner: 'test' }, 5000);

      // Check that a job was scheduled
      const jobName = `mutex:${testObj.id}:timedLock`;
      const job = await $.scheduler.getJob(jobName);

      expect(job).toBeTruthy();
      expect(job.method).toBe('release');
    });

    it('should cancel scheduled release on manual release', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'cancelLock', { owner: 'test' }, 10000);
      await $.mutex.release(testObj, 'cancelLock');

      const jobName = `mutex:${testObj.id}:cancelLock`;
      const job = await $.scheduler.getJob(jobName);

      expect(job).toBeNull();
    });
  });

  describe('extend()', () => {
    it('should extend timeout on existing lock', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      await $.mutex.acquire(testObj, 'extendLock', { owner: 'test' }, 5000);
      const result = await $.mutex.extend(testObj, 'extendLock', 10000);

      expect(result).toBe(true);

      const jobName = `mutex:${testObj.id}:extendLock`;
      const job = await $.scheduler.getJob(jobName);
      expect(job).toBeTruthy();
    });

    it('should return false for non-existent lock', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);

      const result = await $.mutex.extend(testObj, 'noExtend', 5000);
      expect(result).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist locks across object reload', async () => {
      const testObj = await $.recycler.create({
        parent: $.root.id,
        properties: { name: 'Test Object' },
      }, null);
      const testId = testObj.id;

      await $.mutex.acquire(testObj, 'persistLock', { persistent: true });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reload from database
      const reloaded = await $.load(testId);
      const mutexes = reloaded._mutexes;

      expect(mutexes).toBeTruthy();
      expect(mutexes.persistLock).toBeTruthy();
      expect(mutexes.persistLock.data).toEqual({ persistent: true });
    });
  });
});
