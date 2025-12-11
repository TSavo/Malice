import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Door prototype
 * Shared object for bidirectional access between rooms, used by exits and elevators.
 * Holds lock(s), state, code, and all messages as properties.
 *
 * Properties:
 * - name: Door name (e.g., 'Suite 1 Door')
 * - description: Description
 * - locked: Boolean (legacy/simple lock)
 * - locks: Array of composable lock objects
 * - code: Access code (optional)
 * - open: Boolean (is door open)
 * - messages: { locked, unlocked, open, closed, denied, prompt, ... }
 *
 * Methods:
 * - canAccess(agent, target, code?): Checks all locks, code, and open/closed state
 * - openDoor(agent): Opens the door
 * - closeDoor(agent): Closes the door
 * - lockDoor(agent): Locks the door
 * - unlockDoor(agent, code?): Unlocks the door (checks code/locks)
 * - promptForCode(agent): Uses $.prompt and messages.prompt
 */
export class DoorBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: parentId,
      properties: {
        name: 'Door',
        description: 'A sturdy door between rooms.',
        locked: false,
        locks: [],
        code: null,
        open: true,
        autolockOnClose: false,
        messages: {
          locked: 'The door is locked.',
          unlocked: 'The door is unlocked.',
          open: 'The door swings open.',
          closed: 'The door closes.',
          denied: 'Access denied.',
          prompt: 'Enter the door code:'
        }
      },
      methods: {},
    });

    obj.setMethod('canAccess', `
      /** Check if agent can access (open/unlock) the door. */
      const agent = args[0];
      const target = args[1];
      const inputCode = args[2];
      if (self.locked) {
        if (self.code && inputCode !== self.code) {
          return self.messages.denied;
        }
        // Composable locks
        const locks = self.locks || [];
        for (const lock of locks) {
          if (!lock) continue;
          const lockObj = typeof lock === 'number' ? await $.load(lock) : lock;
          if (!lockObj || !lockObj.canAccess) continue;
          const result = await lockObj.canAccess(agent, target);
          if (result !== true) {
            return result;
          }
        }
        // If all locks pass, allow
      }
      if (!self.open) {
        return self.messages.closed;
      }
      return true;
    `);

    obj.setMethod('openDoor', `
      /** Open the door. */
      self.open = true;
      return self.messages.open;
    `);

    obj.setMethod('closeDoor', `
      /** Close the door. Autolock if enabled. */
      self.open = false;
      let msg = self.messages.closed;
      if (self.autolockOnClose) {
        self.locked = true;
        msg += ' ' + (self.messages.locked || 'The door is locked.');
      }
      return msg;
    `);

    obj.setMethod('lockDoor', `
      /** Lock the door. */
      self.locked = true;
      return self.messages.locked;
    `);

    obj.setMethod('unlockDoor', `
      /** Unlock the door (checks code/locks). */
      const agent = args[0];
      const inputCode = args[1];
      if (self.code && inputCode !== self.code) {
        return self.messages.denied;
      }
      // Composable locks
      const locks = self.locks || [];
      for (const lock of locks) {
        if (!lock) continue;
        const lockObj = typeof lock === 'number' ? await $.load(lock) : lock;
        if (!lockObj || !lockObj.canAccess) continue;
        const result = await lockObj.canAccess(agent, self);
        if (result !== true) {
          return result;
        }
      }
      self.locked = false;
      return self.messages.unlocked;
    `);

    obj.setMethod('promptForCode', `
      /** Prompt agent for code using $.prompt and messages.prompt. */
      const agent = args[0];
      const promptMsg = self.messages.prompt || 'Enter code:';
      const inputCode = await $.prompt(agent, promptMsg);
      return inputCode;
    `);

    return obj;
  }
}
