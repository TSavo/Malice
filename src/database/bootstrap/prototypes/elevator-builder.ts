import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Elevator prototype
 * Vertical transport between floors with composable lock system.
 *
 * Inherits from Location (can contain passengers).
 *
 * Properties:
 * - currentFloor: Current floor number
 * - floors: Array of accessible floor numbers (e.g., [1, 2, 11, 35, 42])
 * - floorRooms: Map of floor number to room object { 1: room1, 2: room2, ... }
 * - moving: Boolean, true while elevator is in motion
 * - destination: Floor number being traveled to (or null)
 * - locks: Array of lock objects that control access
 * - doorsOpen: Boolean, true when doors are open
 * - travelTimePerFloor: Milliseconds per floor traveled (default 2000)
 *
 * Lock System:
 * - Elevators have a locks[] property containing lock objects
 * - Each lock can approve/deny access via canAccess(agent, floor)
 * - If any lock denies, access is denied
 * - Compose security: add $.biometricLock, $.keycardLock, etc.
 */
export class ElevatorBuilder {
  constructor(private manager: ObjectManager) {}

  async build(locationId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: locationId,
      properties: {
        name: 'Elevator',
        description: 'A metal elevator car with a control panel.',
        currentFloor: 1,
        floors: [1, 2, 3], // Available floors
        floorRooms: {}, // Map floor number to room objref
        moving: false,
        destination: null,
        locks: [], // Array of lock objects
        doorsOpen: true,
        travelTimePerFloor: 2000, // 2 seconds per floor
        capacity: 10, // Max passengers
          door: null, // Reference to $.door object
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // LOCK SYSTEM
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('canAccessFloor', `
      /** Check if agent can access a floor via lock system.
       *  @param agent - The agent requesting access
       *  @param floor - The floor number
       *  @returns true or rejection string
       */
      const agent = args[0];
      const floor = args[1];

      // Check if floor exists in available floors
      if (!self.floors.includes(floor)) {
        return 'That floor is not accessible.';
      }

        // If a door is present, delegate access check
        if (self.door) {
          const doorObj = typeof self.door === 'number' ? await $.load(self.door) : self.door;
          if (doorObj && doorObj.canAccess) {
            const result = await doorObj.canAccess(agent, self);
            if (result !== true) {
              return result;
            }
          }
        }
      // Check all locks
      const locks = self.locks || [];
      for (const lock of locks) {
        if (!lock) continue;
        const lockObj = typeof lock === 'number' ? await $.load(lock) : lock;
        if (!lockObj || !lockObj.canAccess) continue;

        const result = await lockObj.canAccess(agent, floor);
        if (result !== true) {
          return result; // Return rejection string
        }
      }

      return true; // All locks approved
    `);

    obj.setMethod('addLock', `
      /** Add a lock object to this elevator.
       *  @param lock - Lock object or ID
       */
      const lock = args[0];
      const locks = self.locks || [];
      locks.push(lock);
      self.locks = locks;
    `);

    obj.setMethod('removeLock', `
      /** Remove a lock object from this elevator.
       *  @param lock - Lock object or ID to remove
       */
      const lock = args[0];
      const lockId = typeof lock === 'number' ? lock : lock.id;
      const locks = (self.locks || []).filter(l => {
        const id = typeof l === 'number' ? l : l.id;
        return id !== lockId;
      });
      self.locks = locks;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // MOVEMENT
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('selectFloor', `
      /** Agent requests to go to a floor.
       *  @param agent - The agent pressing the button
       *  @param floor - The floor number
       *  @returns { success, message }
       */
      const agent = args[0];
      const floor = args[1];

      // Check if moving
      if (self.moving) {
        return { success: false, message: 'The elevator is already in motion.' };
      }

      // Check if already at floor
      if (self.currentFloor === floor) {
        return { success: false, message: 'You are already on floor ' + floor + '.' };
      }

      // Check access via lock system
      const accessCheck = await self.canAccessFloor(agent, floor);
      if (accessCheck !== true) {
        return { success: false, message: accessCheck };
      }

      // Close doors and start moving
      await self.closeDoors();
      await self.startMovement(floor);

      return { success: true, message: 'The elevator begins moving to floor ' + floor + '.' };
    `);

    obj.setMethod('startMovement', `
      /** Start elevator movement to destination floor.
       *  @param floor - Destination floor
       */
      const floor = args[0];

      self.moving = true;
      self.destination = floor;

      // Calculate travel time
      const distance = Math.abs(floor - self.currentFloor);
      const travelTime = distance * (self.travelTimePerFloor || 2000);

      // Announce departure
      await self.announce('The elevator lurches and begins moving.');

      // Schedule arrival
      const jobName = 'elevator_' + self.id + '_arrive';
      await $.scheduler.schedule(jobName, travelTime, 0, self, 'arrive');
    `);

    obj.setMethod('arrive', `
      /** Called when elevator reaches destination floor.
       */
      const floor = self.destination;
      self.currentFloor = floor;
      self.moving = false;
      self.destination = null;

      // Announce arrival
      await self.announce('The elevator stops smoothly. You have arrived at floor ' + floor + '.');

      // Open doors
      await self.openDoors();
    `);

    obj.setMethod('openDoors', `
      /** Open the elevator doors.
       */
      if (self.doorsOpen) return;

      self.doorsOpen = true;
      await self.announce('The elevator doors slide open.');
    `);

    obj.setMethod('closeDoors', `
      /** Close the elevator doors.
       */
      if (!self.doorsOpen) return;

      self.doorsOpen = false;
      await self.announce('The elevator doors slide closed.');
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DESCRIPTION
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('describe', `
      /** Describe the elevator interior.
       *  @param viewer - The agent looking
       *  @returns Description string
       */
      const viewer = args[0];

      let text = await pass(viewer); // Get location description

      // Add floor indicator
      text += '\\n\\nFloor indicator: ' + self.currentFloor;

      // Add control panel
      const floors = self.floors || [];
      text += '\\nControl panel buttons: ' + floors.join(', ');

      // Add door status
      if (self.moving) {
        text += '\\nThe elevator is in motion.';
      } else if (self.doorsOpen) {
        text += '\\nThe doors are open.';
      } else {
        text += '\\nThe doors are closed.';
      }

      return text;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // CAPACITY CHECKING
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('canContain', `
      /** Check if elevator can accept another passenger.
       *  @param obj - Object trying to enter
       *  @returns true or rejection string
       */
      const obj = args[0];

      // Check if doors are open
      if (!self.doorsOpen) {
        return 'The elevator doors are closed.';
      }

      // Check capacity
      const occupants = (self.contents || []).length;
      const capacity = self.capacity || 10;
      if (occupants >= capacity) {
        return 'The elevator is at maximum capacity.';
      }

      return true;
    `);

    return obj;
  }
}
