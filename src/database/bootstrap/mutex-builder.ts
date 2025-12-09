import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Mutex utility object ($.mutex)
 * Provides object-based mutex locks with optional data storage and timed expiration
 *
 * Usage from MOO code:
 *   // Acquire a lock on an object (returns false if acquired, data if blocked)
 *   const blocked = await $.mutex.acquire(room, 'movement', { player: 123 });
 *   if (blocked) {
 *     await player.tell('Room is busy: player #' + blocked.player + ' is moving');
 *     return;
 *   }
 *
 *   // Got the lock, do work...
 *
 *   // Release the lock
 *   await $.mutex.release(room, 'movement');
 *
 *   // Acquire with timeout (auto-releases after 30 seconds via scheduler)
 *   await $.mutex.acquire(player, 'crafting', { item: 'sword' }, 30000);
 *
 *   // Objects store their locks in _mutexes property
 */
export class MutexBuilder {
  private mutex: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.mutex) {
      this.mutex = await this.manager.load(aliases.mutex);
      if (this.mutex) return; // Already exists
    }

    // Create new Mutex utility
    this.mutex = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Mutex',
        description: 'Object-based mutex lock system with data storage and timed expiration',
      },
      methods: {},
    });

    // Acquire a named lock on an object
    // Returns false if lock acquired, or stored data if already locked (truthy)
    // obj: the object to lock
    // name: string - the mutex name on that object
    // data: any - data to store with the lock (should be truthy for if-check to work)
    // timeout: number - optional duration in ms before auto-release via scheduler
    this.mutex.setMethod('acquire', `
      const obj = args[0];
      const name = args[1];
      const data = args[2] !== undefined ? args[2] : true;
      const timeout = args[3] !== undefined ? args[3] : null;

      if (!obj) {
        throw new Error('Object is required');
      }
      if (!name || typeof name !== 'string') {
        throw new Error('Mutex name must be a non-empty string');
      }

      const locks = obj._mutexes || {};

      // Check if lock exists
      if (locks[name]) {
        // Lock is held, return stored data
        return locks[name].data;
      }

      // Acquire the lock
      const now = Date.now();
      locks[name] = {
        data: data,
        acquiredAt: now,
      };
      obj._mutexes = locks;

      // Schedule auto-release if timeout specified
      // schedule(name, delay, interval, target, method, ...args)
      if (timeout !== null && timeout > 0) {
        const jobName = 'mutex:' + obj.id + ':' + name;
        await $.scheduler.schedule(jobName, timeout, 0, self, 'release', obj.id, name);
      }

      return false; // Lock acquired
    `);

    // Release a named lock on an object
    // obj can be object or object ID (scheduler passes ID)
    // Returns true if released, false if wasn't locked
    this.mutex.setMethod('release', `
      let obj = args[0];
      const name = args[1];

      // Load object if ID was passed
      if (typeof obj === 'number') {
        obj = await $.load(obj);
      }

      if (!obj) {
        throw new Error('Object is required');
      }
      if (!name || typeof name !== 'string') {
        throw new Error('Mutex name must be a non-empty string');
      }

      const locks = obj._mutexes || {};

      if (!locks[name]) {
        return false; // Wasn't locked
      }

      delete locks[name];
      obj._mutexes = locks;

      // Cancel any scheduled auto-release (in case manual release before timeout)
      const jobName = 'mutex:' + obj.id + ':' + name;
      await $.scheduler.unschedule(jobName);

      return true;
    `);

    // Check if a mutex is locked on an object without acquiring
    // Returns false if not locked, or stored data if locked
    this.mutex.setMethod('check', `
      const obj = args[0];
      const name = args[1];

      if (!obj) {
        throw new Error('Object is required');
      }
      if (!name || typeof name !== 'string') {
        throw new Error('Mutex name must be a non-empty string');
      }

      const locks = obj._mutexes || {};

      if (!locks[name]) {
        return false;
      }

      return locks[name].data;
    `);

    // Update data on an existing lock (without releasing/reacquiring)
    // Returns true if updated, false if not locked
    this.mutex.setMethod('update', `
      const obj = args[0];
      const name = args[1];
      const data = args[2];

      if (!obj) {
        throw new Error('Object is required');
      }
      if (!name || typeof name !== 'string') {
        throw new Error('Mutex name must be a non-empty string');
      }

      const locks = obj._mutexes || {};

      if (!locks[name]) {
        return false;
      }

      locks[name].data = data;
      obj._mutexes = locks;
      return true;
    `);

    // Extend/reset the timeout on a lock
    // Returns true if extended, false if not locked
    this.mutex.setMethod('extend', `
      const obj = args[0];
      const name = args[1];
      const timeout = args[2];

      if (!obj) {
        throw new Error('Object is required');
      }
      if (!name || typeof name !== 'string') {
        throw new Error('Mutex name must be a non-empty string');
      }

      const locks = obj._mutexes || {};

      if (!locks[name]) {
        return false;
      }

      // Cancel existing and schedule new timeout
      const jobName = 'mutex:' + obj.id + ':' + name;
      await $.scheduler.unschedule(jobName);

      if (timeout !== null && timeout > 0) {
        await $.scheduler.schedule(jobName, timeout, 0, self, 'release', obj.id, name);
      }

      return true;
    `);

    // List all active locks on an object (for debugging/admin)
    // Returns { name: { data, acquiredAt }, ... }
    this.mutex.setMethod('list', `
      const obj = args[0];

      if (!obj) {
        throw new Error('Object is required');
      }

      return obj._mutexes || {};
    `);

    // Force release a lock (admin use)
    // Same as release but named differently for clarity
    this.mutex.setMethod('forceRelease', `
      const obj = args[0];
      const name = args[1];
      return await self.release(obj, name);
    `);

    // Release all locks on an object
    // Returns number of locks released
    this.mutex.setMethod('releaseAll', `
      const obj = args[0];

      if (!obj) {
        throw new Error('Object is required');
      }

      const locks = obj._mutexes || {};
      const names = Object.keys(locks);

      // Cancel all scheduled auto-releases
      for (const name of names) {
        const jobName = 'mutex:' + obj.id + ':' + name;
        await $.scheduler.unschedule(jobName);
      }

      obj._mutexes = {};
      return names.length;
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.mutex) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'mutex', this.mutex.id);
    console.log(`Registered mutex alias -> #${this.mutex.id}`);
  }
}
