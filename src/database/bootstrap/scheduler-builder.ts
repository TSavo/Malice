import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Scheduler object (dynamic ID)
 * Global job scheduler for periodic tasks
 *
 * Usage from MOO code:
 *   // schedule(name, delay, interval, target, method, ...args)
 *   await $.scheduler.schedule('heartbeat', 0, 60000, $.system, 'tick');     // repeat every 60s
 *   await $.scheduler.schedule('delayed', 5000, 0, player, 'tell', 'Hi!');   // one-shot in 5s
 *   await $.scheduler.schedule('warmup', 10000, 60000, $.system, 'tick');    // first in 10s, then every 60s
 *   await $.scheduler.tick(); // Called by server every second
 *
 * Jobs are stored as properties, so they persist across restarts.
 * The server's game loop calls $.scheduler.tick() periodically.
 *
 * Parameters:
 *   delay    - ms until first run (0 = next tick)
 *   interval - ms between subsequent runs (0 = one-shot, deleted after first run)
 *
 * Job structure:
 * {
 *   delay: number,         // ms until first run
 *   interval: number,      // ms between runs (0 = one-shot)
 *   nextRun: number,       // timestamp of next scheduled run
 *   targetId: number,      // object ID to call method on
 *   method: string,        // method name to call
 *   args: any[],           // arguments to pass
 *   enabled: boolean,      // whether job is active
 * }
 */
export class SchedulerBuilder {
  private scheduler: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.scheduler) {
      this.scheduler = await this.manager.load(aliases.scheduler);
      if (this.scheduler) return; // Already exists
    }

    // Create new Scheduler
    this.scheduler = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Scheduler',
        description: 'Global job scheduler for periodic tasks',
        // Jobs stored by name
        jobs: {},
      },
      methods: {},
    });

    // Schedule a new job
    // schedule(name, delay, interval, target, method, ...args)
    // delay: ms until first run (0 = next tick)
    // interval: ms between runs (0 = one-shot)
    this.scheduler.setMethod('schedule', `
      const name = args[0];
      const delay = args[1]; // ms until first run
      const interval = args[2]; // ms between runs (0 = one-shot)
      const target = args[3]; // object or object ID
      const method = args[4];
      const jobArgs = args.slice(5);

      if (!name || delay === undefined || interval === undefined || !target || !method) {
        return { error: 'Usage: schedule(name, delay, interval, target, method, ...args)' };
      }

      if (delay < 0) {
        return { error: 'Delay must be >= 0' };
      }

      // Minimum 1 second interval for repeating jobs
      if (interval > 0 && interval < 1000) {
        return { error: 'Interval must be at least 1000ms (1 second) for repeating jobs, or 0 for one-shot.' };
      }

      const targetId = typeof target === 'number' ? target : target.id;
      const now = Date.now();

      const jobs = self.jobs || {};
      jobs[name] = {
        interval: interval,
        nextRun: now + delay,
        targetId: targetId,
        method: method,
        args: jobArgs,
        enabled: true,
      };
      self.set('jobs', jobs);

      return { success: true, name: name, nextRun: now + delay, interval: interval };
    `);

    // Unschedule a job
    this.scheduler.setMethod('unschedule', `
      const name = args[0];

      const jobs = self.jobs || {};
      if (!jobs[name]) {
        return { error: 'Job not found: ' + name };
      }

      delete jobs[name];
      self.set('jobs', jobs);

      return { success: true, name: name };
    `);

    // Enable/disable a job without removing it
    this.scheduler.setMethod('setEnabled', `
      const name = args[0];
      const enabled = args[1] !== false;

      const jobs = self.jobs || {};
      if (!jobs[name]) {
        return { error: 'Job not found: ' + name };
      }

      jobs[name].enabled = enabled;
      self.set('jobs', jobs);

      return { success: true, name: name, enabled: enabled };
    `);

    // Get info about a job
    this.scheduler.setMethod('getJob', `
      const name = args[0];
      const jobs = self.jobs || {};
      return jobs[name] || null;
    `);

    // Get all job names
    this.scheduler.setMethod('listJobs', `
      const jobs = self.jobs || {};
      return Object.keys(jobs);
    `);

    // Get next run time for a job
    this.scheduler.setMethod('getNextRun', `
      const name = args[0];
      const jobs = self.jobs || {};
      const job = jobs[name];

      if (!job) return null;
      if (!job.enabled) return null;

      return job.nextRun;
    `);

    // Main tick - called by server periodically
    // Returns array of job results
    this.scheduler.setMethod('tick', `
      const now = Date.now();
      const jobs = self.jobs || {};
      const results = [];
      let modified = false;
      const toDelete = [];

      for (const name of Object.keys(jobs)) {
        const job = jobs[name];
        if (!job.enabled) continue;

        if (now >= job.nextRun) {
          // Time to run this job
          try {
            const target = await $.load(job.targetId);
            if (target && target[job.method]) {
              const result = await target[job.method](...(job.args || []));
              results.push({ job: name, success: true, result: result });
            } else {
              results.push({ job: name, success: false, error: 'Target or method not found' });
            }
          } catch (err) {
            results.push({ job: name, success: false, error: String(err) });
          }

          // One-shot (interval=0) gets deleted, recurring jobs schedule next run
          if (job.interval === 0) {
            toDelete.push(name);
          } else {
            job.nextRun = now + job.interval;
          }
          modified = true;
        }
      }

      // Delete one-shot jobs that ran
      for (const name of toDelete) {
        delete jobs[name];
      }

      if (modified) {
        self.set('jobs', jobs);
      }

      return results;
    `);

    // Force run a job immediately (for testing/admin)
    this.scheduler.setMethod('runNow', `
      const name = args[0];
      const jobs = self.jobs || {};
      const job = jobs[name];

      if (!job) {
        return { error: 'Job not found: ' + name };
      }

      try {
        const target = await $.load(job.targetId);
        if (!target || !target[job.method]) {
          return { error: 'Target or method not found' };
        }

        const result = await target[job.method](...(job.args || []));
        const now = Date.now();

        // One-shot jobs get deleted, recurring jobs schedule next run
        if (job.interval === 0) {
          delete jobs[name];
        } else {
          job.nextRun = now + job.interval;
        }
        self.set('jobs', jobs);

        return { success: true, result: result };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    `);

    // Decay tick - process decay for all decayable objects
    // Called periodically (every game minute) to update decay levels
    this.scheduler.setMethod('decayTick', `
      /** Process decay for all objects that inherit from Decayable.
       *  Iterates through all objects and calls decayTick() on those
       *  that have the method (i.e., inherit from Decayable).
       *  @returns {processed: number, decayed: number, destroyed: number}
       */
      let processed = 0;
      let decayed = 0;
      let destroyed = 0;

      // Get the decayable prototype ID from aliases
      const aliases = $.aliases || {};
      const decayableId = aliases.decayable;
      if (!decayableId) {
        return { error: 'Decayable prototype not found in aliases' };
      }

      // Iterate all objects - use $.objectManager to iterate
      // This is expensive, so we rely on shouldDecay() to skip most objects
      const allIds = await $.objectManager.getAllIds();

      for (const id of allIds) {
        const obj = await $.load(id);
        if (!obj) continue;

        // Check if object has decayTick method (inherits from Decayable)
        if (obj.decayTick) {
          processed++;
          try {
            const result = await obj.decayTick();
            if (result && result.decayed > 0) {
              decayed++;
            }
            if (result && result.destroyed) {
              destroyed++;
            }
          } catch (err) {
            // Log but don't stop processing
            console.log('Decay error on #' + id + ': ' + String(err));
          }
        }
      }

      return { processed, decayed, destroyed };
    `);

    // Describe scheduler state
    this.scheduler.setMethod('describe', `
      const jobs = self.jobs || {};
      const jobNames = Object.keys(jobs);

      if (jobNames.length === 0) {
        return 'Scheduler: No jobs scheduled.';
      }

      const now = Date.now();
      const lines = ['Scheduler: ' + jobNames.length + ' job(s)'];

      for (const name of jobNames) {
        const job = jobs[name];
        const inMs = job.nextRun - now;
        const inSec = Math.round(inMs / 1000);

        let status = job.enabled ? '' : ' [disabled]';
        let timing = inMs > 0 ? 'in ' + inSec + 's' : 'overdue';
        let repeat = job.interval > 0 ? 'every ' + (job.interval / 1000) + 's' : 'one-shot';

        lines.push('  ' + name + ': ' + repeat + ', next ' + timing + status);
      }

      return lines.join('\\\\r\\\\n');
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.scheduler) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'scheduler', this.scheduler.id);
    console.log(`✅ Registered scheduler alias -> #${this.scheduler.id}`);

    // Register default jobs
    await this.registerDefaultJobs(objectManager);
  }

  /**
   * Register default scheduled jobs
   */
  private async registerDefaultJobs(objectManager: RuntimeObject): Promise<void> {
    if (!this.scheduler) return;

    const jobs = (this.scheduler.get('jobs') as Record<string, unknown>) || {};
    const systemId = (await objectManager.call('getAlias', 'system') as number | undefined) || 2;
    let modified = false;

    // Player heartbeat - every 60 seconds
    if (!jobs.playerHeartbeat) {
      (jobs as Record<string, unknown>).playerHeartbeat = {
        interval: 60000, // 1 minute repeat
        nextRun: Date.now() + 60000, // first run in 60s
        targetId: systemId,
        method: 'tickAllPlayers',
        args: [],
        enabled: true,
      };
      modified = true;
      console.log('✅ Registered playerHeartbeat job (every 60s)');
    }

    // Decay tick - every 60 seconds (1 game minute)
    // Processes all decayable objects (food, drinks, severed body parts)
    if (!jobs.decayTick) {
      (jobs as Record<string, unknown>).decayTick = {
        interval: 60000, // 1 minute repeat (1 tick = 1 game minute)
        nextRun: Date.now() + 60000, // first run in 60s
        targetId: this.scheduler.id, // scheduler calls itself
        method: 'decayTick',
        args: [],
        enabled: true,
      };
      modified = true;
      console.log('✅ Registered decayTick job (every 60s)');
    }

    if (modified) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.scheduler.set('jobs', jobs as any);
    }
  }
}
