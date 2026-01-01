import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Exit type
 * Represents a connection between rooms with aliases and distance.
 *
 * Inherits from Describable for name/description/aliases.
 *
 * Properties:
 * - name: Primary direction name (e.g., 'north', 'door')
 * - aliases: Shorthand aliases (e.g., ['n'] for north, ['d', 'dn'] for down)
 * - destRoom: Destination room ID
 * - distance: Distance in meters
 * - hidden: If true, not shown in room description
 * - locked: If true, requires unlocking to use
 * - lockKey: Item ID that can unlock this exit (if locked)
 *
 * Standard direction aliases:
 * - north/n, south/s, east/e, west/w
 * - northeast/ne, northwest/nw, southeast/se, southwest/sw
 * - up/u, down/d/dn
 * - in/i, out/o
 */
export class ExitBuilder implements Builder {
  static provides = ['exit'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('exit');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const describable = await this.manager.load('describable');
      if (!describable) {
        throw new Error('Describable type not found - required for Exit');
      }

      this.obj = await this.manager.define('exit', describable, {
        properties: {
          name: 'Exit',
          description: 'A passage to another location',
          aliases: [],
          destRoom: null, // Destination room ID
          distance: 10, // Distance in meters
          hidden: false, // Hidden exits don't show in room description
          locked: false, // Legacy simple lock
          lockKey: null, // Legacy key-based lock
          locks: [], // Composable lock objects
          door: null, // Reference to $.door object
          vehicleAllowed: false, // Whether vehicles can use this exit (roads, not stairs/ladders)

          abilities: `Passage connecting one room to another.

DIRECTION: 'name' is primary direction (north, south, door). 'aliases' are shortcuts ([n], [s]).

DESTINATION: 'destRoom' points to target room. 'distance' in meters affects travel time.

HIDDEN: If 'hidden' is true, exit doesn't appear in room description. Secret passages, concealed doors.

LOCKING: Three systems:
- Simple: 'locked' boolean, 'lockKey' item that unlocks it
- Composable: 'locks' array of lock objects, each with canAccess() method
- Door: 'door' points to $.door object with full door mechanics

ACCESS: canUse(agent) checks all lock systems. Returns { allowed, reason }.

MATCHING: matches(direction) checks name and aliases. Case-insensitive.

USAGE: Room.go() finds exit via findExit(), checks canUse(), queues movement to destRoom.

VEHICLES: 'vehicleAllowed' (default false) determines if vehicles can use this exit.
Set true for roads, streets, driveways. Leave false for stairs, ladders, narrow alleys, indoor doors.
Vehicles check this before driving through an exit.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;
    obj.setMethod(
      'matches',
      `
      /** Check if a direction string matches this exit.
       *  @param direction - Direction to check (e.g., 'n', 'north')
       *  @returns true if matches name or any alias
       */
      const direction = args[0]?.toLowerCase();
      if (!direction) return false;

      // Check primary name
      if (self.name.toLowerCase() === direction) return true;

      // Check aliases
      const aliases = self.aliases || [];
      return aliases.some(a => a.toLowerCase() === direction);
    `,
    );

    obj.setMethod(
      'canUse',
      `
      /** Check if an agent can use this exit.
       *  @param agent - The agent trying to use the exit
       *  @returns { allowed, reason }
       */
      const agent = args[0];
      // If a door is present, delegate access check
      if (self.door && self.door.canAccess) {
        const result = await self.door.canAccess(agent, self);
        if (result !== true) {
          return { allowed: false, reason: result };
        }
      }
      // Legacy simple lock
      if (self.locked) {
        return { allowed: false, reason: 'The way ' + self.name + ' is locked.' };
      }
      // Composable locks
      const locks = self.locks || [];
      for (const lock of locks) {
        if (!lock || !lock.canAccess) continue;
        const result = await lock.canAccess(agent, self);
        if (result !== true) {
          return { allowed: false, reason: result };
        }
      }
      return { allowed: true };
    `,
    );
    // Add composable lock management
    obj.setMethod(
      'addLock',
      `
      /** Add a lock object to this exit.
       *  @param lock - Lock object or ID
       */
      const lock = args[0];
      const locks = self.locks || [];
      locks.push(lock);
      self.locks = locks;
    `,
    );

    obj.setMethod(
      'removeLock',
      `
      /** Remove a lock object from this exit.
       *  @param lock - Lock object or ID to remove
       */
      const lock = args[0];
      const lockId = typeof lock === 'number' ? lock : lock.id;
      const locks = (self.locks || []).filter(l => {
        const id = typeof l === 'number' ? l : l.id;
        return id !== lockId;
      });
      self.locks = locks;
    `,
    );

    obj.setMethod(
      'unlock',
      `
      /** Attempt to unlock this exit with an item.
       *  @param agent - The agent trying to unlock
       *  @param item - The item being used as a key
       *  @returns { success, message }
       */
      const agent = args[0];
      const item = args[1];

      if (!self.locked) {
        return { success: false, message: 'It is not locked.' };
      }

      // Check if item is the key
      const keyId = self.lockKey;
      const itemId = typeof item === 'number' ? item : item?.id;

      if (keyId && itemId !== keyId) {
        return { success: false, message: 'That does not fit.' };
      }

      // If no specific key required, any key works (or just unlock)
      self.locked = false;
      return { success: true, message: 'You unlock the way ' + self.name + '.' };
    `,
    );

    obj.setMethod(
      'lock',
      `
      /** Lock this exit.
       *  @returns { success, message }
       */
      if (self.locked) {
        return { success: false, message: 'It is already locked.' };
      }
      self.locked = true;
      return { success: true, message: 'You lock the way ' + self.name + '.' };
    `,
    );

    obj.setMethod(
      'getDestination',
      `
      /** Get the destination room.
       *  @returns The destination room object or null
       */
      return self.destRoom || null;
    `,
    );

    obj.setMethod(
      'describe',
      `
      /** Get description of this exit for room listing.
       *  @returns Description string like "north (10m)"
       */
      const aliases = self.aliases || [];
      const shortAlias = aliases.length > 0 ? ' [' + aliases[0] + ']' : '';
      const lockStr = self.locked ? ' (locked)' : '';
      return self.name + shortAlias + ' (' + self.distance + 'm)' + lockStr;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'destRoom',
      'Destination room object that this exit leads to',
    );
    obj.setPropertyDescription(
      'distance',
      'Distance in meters that affects travel time',
    );
    obj.setPropertyDescription(
      'hidden',
      'Whether this exit is hidden from room descriptions (secret passages)',
    );
    obj.setPropertyDescription(
      'locked',
      'Legacy simple lock - whether exit is currently locked',
    );
    obj.setPropertyDescription(
      'lockKey',
      'Legacy key-based lock - ID of item that can unlock this exit',
    );
    obj.setPropertyDescription(
      'locks',
      'Array of composable lock objects that control access',
    );
    obj.setPropertyDescription(
      'door',
      'Reference to $.door object with full door mechanics',
    );
    obj.setPropertyDescription(
      'vehicleAllowed',
      'Whether vehicles can drive through this exit. True for roads, false for stairs/ladders/indoor.',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[ExitBuilder] Type 'exit' auto-aliased`);
  }

  /**
   * Create standard direction aliases
   */
  static getStandardAliases(direction: string): string[] {
    const aliasMap: Record<string, string[]> = {
      north: ['n'],
      south: ['s'],
      east: ['e'],
      west: ['w'],
      northeast: ['ne'],
      northwest: ['nw'],
      southeast: ['se'],
      southwest: ['sw'],
      up: ['u'],
      down: ['d', 'dn'],
      in: ['i'],
      out: ['o'],
    };
    return aliasMap[direction.toLowerCase()] || [];
  }
}

// Self-register
registerBuilder(ExitBuilder);
