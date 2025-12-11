import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Lock prototype
 * Base prototype for access control systems.
 *
 * Inherits from Describable.
 *
 * Locks can be attached to elevators, doors, containers, etc.
 * Each lock implements canAccess() to approve or deny access.
 *
 * Properties:
 * - name: Lock type name
 * - description: What the lock looks like
 *
 * Methods:
 * - canAccess(agent, target): Returns true or rejection string
 *
 * Subclasses override canAccess() for specific authorization logic:
 * - $.biometricLock: Scans body parts
 * - $.keycardLock: Requires keycard item
 * - $.passwordLock: Requires password knowledge
 * - $.timeLock: Restricts by time of day
 */
export class LockBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Lock',
        description: 'A basic lock mechanism.',
      },
      methods: {},
    });

    obj.setMethod('canAccess', `
      /** Check if agent can access target via this lock.
       *  @param agent - The agent requesting access
       *  @param target - The target (floor number, room, etc.)
       *  @returns true to allow, or rejection string to deny
       */
      // Base lock allows all access
      return true;
    `);

    return obj;
  }
}
