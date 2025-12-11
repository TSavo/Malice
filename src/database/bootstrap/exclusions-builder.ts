import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds Exclusions utility object ($.exclusions)
 * Uses $.mutex to prevent incompatible simultaneous actions
 *
 * Defines which actions exclude which other actions.
 * For example: sitting excludes walking, crafting excludes fighting, etc.
 *
 * Usage from MOO code:
 *   // Check if an action can be performed (returns false or message string)
 *   const blocked = await $.exclusions.check(player, 'walk');
 *   if (blocked) {
 *     return blocked; // "You'll need to stand up first."
 *   }
 *
 *   // Start an action (returns false on success, or blocking message string)
 *   const result = await $.exclusions.start(player, 'sit', "You'll need to stand up first.");
 *   if (result) {
 *     return result; // Was blocked by another action
 *   }
 *
 *   // End an action (releases mutex)
 *   await $.exclusions.end(player, 'sit');
 *
 *   // Define custom exclusions (admin/builder use)
 *   await $.exclusions.define('fly', ['walk', 'sit', 'swim']);
 */
export class ExclusionsBuilder {
  private exclusions: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.exclusions) {
      this.exclusions = await this.manager.load(aliases.exclusions);
      if (this.exclusions) return; // Already exists
    }

    // Create new Exclusions utility
    this.exclusions = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Exclusions',
        description: 'Action exclusion system using mutexes to prevent incompatible simultaneous actions',
        // Map of action -> array of actions it excludes
        // Each action implicitly excludes itself
        rules: {
          // Movement exclusions
          walk: ['sit', 'sleep', 'crafting', 'operating'],
          run: ['sit', 'sleep', 'crafting', 'operating'],
          crawl: ['sit', 'sleep', 'crafting', 'operating'],
          swim: ['sit', 'sleep', 'crafting', 'operating'],

          // Positional exclusions
          sit: ['walk', 'run', 'crawl', 'swim', 'sleep', 'operating'],
          sleep: ['walk', 'run', 'crawl', 'swim', 'sit', 'crafting', 'operating'],
          
          // Activity exclusions
          crafting: ['walk', 'run', 'swim', 'sleep', 'fighting', 'operating'],
          fighting: ['crafting', 'sleep', 'operating'],
          operating: ['walk', 'run', 'swim', 'sit', 'sleep', 'crafting', 'fighting'], // Using terminals/machines
          
          // Less restrictive activities (can do while sitting/standing)
          eating: ['sleep'],
          drinking: ['sleep'],
          talking: [], // Can talk while doing almost anything
          watching: [], // Can watch while doing anything
        },
      },
      methods: {},
    });

    // Check if an action is blocked by current exclusions
    // Returns false if not blocked, or the blocking message string if blocked
    this.exclusions.setMethod('check', `
      const obj = args[0]; // The object (usually player) to check
      const action = args[1]; // The action they want to perform

      if (!obj || !action) {
        throw new Error('Object and action are required');
      }

      const rules = self.rules || {};
      const excludedBy = rules[action] || [];

      // Check each action that would block this one
      for (const blocking of excludedBy) {
        const blocked = await $.mutex.check(obj, 'action:' + blocking);
        if (blocked) {
          // If blocked data is a string, return it
          if (typeof blocked === 'string') {
            return blocked;
          }
          // Otherwise generate fallback message
          return \`You can't do that while \${blocking}.\`;
        }
      }

      // Also check if this action is already in progress (self-exclusion)
      const alreadyDoing = await $.mutex.check(obj, 'action:' + action);
      if (alreadyDoing) {
        // If data is a string, return it
        if (typeof alreadyDoing === 'string') {
          return alreadyDoing;
        }
        // Otherwise generate fallback message
        return \`You're already \${action}ing.\`;
      }

      return false; // Not blocked
    `);

    // Start an action (acquires exclusion mutex)
    // Returns false if started successfully, or blocking message string if prevented
    this.exclusions.setMethod('start', `
      const obj = args[0];
      const action = args[1];
      const data = args[2] !== undefined ? args[2] : true;
      const timeout = args[3] !== undefined ? args[3] : null;

      if (!obj || !action) {
        throw new Error('Object and action are required');
      }

      // First check if blocked
      const blocked = await self.check(obj, action);
      if (blocked) {
        return blocked; // Return the message string
      }

      // Not blocked, acquire the lock
      await $.mutex.acquire(obj, 'action:' + action, data, timeout);
      return false; // Success
    `);

    // End an action (releases exclusion mutex)
    // Returns true if ended, false if wasn't active
    this.exclusions.setMethod('end', `
      const obj = args[0];
      const action = args[1];

      if (!obj || !action) {
        throw new Error('Object and action are required');
      }

      return await $.mutex.release(obj, 'action:' + action);
    `);

    // Update data on an active action without ending it
    // Returns true if updated, false if action not active
    this.exclusions.setMethod('update', `
      const obj = args[0];
      const action = args[1];
      const data = args[2];

      if (!obj || !action) {
        throw new Error('Object and action are required');
      }

      return await $.mutex.update(obj, 'action:' + action, data);
    `);

    // Extend/reset timeout on an active action
    // Returns true if extended, false if action not active
    this.exclusions.setMethod('extend', `
      const obj = args[0];
      const action = args[1];
      const timeout = args[2];

      if (!obj || !action) {
        throw new Error('Object and action are required');
      }

      return await $.mutex.extend(obj, 'action:' + action, timeout);
    `);

    // Get current action (or actions) for an object
    // Returns array of { action, data } for all active exclusion mutexes
    this.exclusions.setMethod('current', `
      const obj = args[0];

      if (!obj) {
        throw new Error('Object is required');
      }

      const locks = await $.mutex.list(obj);
      const actions = [];

      for (const [lockName, lockData] of Object.entries(locks)) {
        // Filter for action: prefixed locks
        if (lockName.startsWith('action:')) {
          const action = lockName.slice(7); // Remove 'action:' prefix
          actions.push({
            action: action,
            data: lockData.data,
            acquiredAt: lockData.acquiredAt,
          });
        }
      }

      return actions;
    `);

    // Define or update exclusion rules for an action
    // Admin/builder use for custom actions
    this.exclusions.setMethod('define', `
      const action = args[0];
      const excludes = args[1]; // Array of action names this excludes

      if (!action || !Array.isArray(excludes)) {
        throw new Error('Action name and excludes array are required');
      }

      const rules = self.rules || {};
      rules[action] = excludes;
      self.rules = rules;
    `);

    // Get exclusion rules for an action
    // Returns array of action names that this action excludes
    this.exclusions.setMethod('get', `
      const action = args[0];

      if (!action) {
        throw new Error('Action name is required');
      }

      const rules = self.rules || {};
      return rules[action] || [];
    `);

    // Remove exclusion rules for an action
    // Returns true if removed, false if didn't exist
    this.exclusions.setMethod('undefine', `
      const action = args[0];

      if (!action) {
        throw new Error('Action name is required');
      }

      const rules = self.rules || {};
      if (!rules[action]) {
        return false;
      }

      delete rules[action];
      self.rules = rules;
      return true;
    `);

    // List all defined exclusion rules
    // Returns the rules object { action: [excludes...], ... }
    this.exclusions.setMethod('list', `
      return self.rules || {};
    `);

    // Force end all actions on an object (admin use)
    // Returns number of actions ended
    this.exclusions.setMethod('clearAll', `
      const obj = args[0];

      if (!obj) {
        throw new Error('Object is required');
      }

      const locks = await $.mutex.list(obj);
      let count = 0;

      for (const lockName of Object.keys(locks)) {
        if (lockName.startsWith('action:')) {
          await $.mutex.release(obj, lockName);
          count++;
        }
      }

      return count;
    `);


  }

  async registerAlias(): Promise<void> {
    if (!this.exclusions) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'exclusions', this.exclusions.id);
    console.log(`✅ Registered exclusions alias -> #${this.exclusions.id}`);
  }
}
