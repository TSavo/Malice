import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Exit prototype
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
export class ExitBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Exit',
        description: 'A passage to another location',
        aliases: [],
        destRoom: null, // Destination room ID
        distance: 10, // Distance in meters
        hidden: false, // Hidden exits don't show in room description
        locked: false, // Locked exits require key/unlock
        lockKey: null, // Item that unlocks this exit
      },
      methods: {},
    });

    obj.setMethod('matches', `
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
    `);

    obj.setMethod('canUse', `
      /** Check if an agent can use this exit.
       *  @param agent - The agent trying to use the exit
       *  @returns { allowed, reason }
       */
      const agent = args[0];

      // Check if locked
      if (self.locked) {
        return { allowed: false, reason: 'The way ' + self.name + ' is locked.' };
      }

      return { allowed: true };
    `);

    obj.setMethod('unlock', `
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
      self.set('locked', false);
      return { success: true, message: 'You unlock the way ' + self.name + '.' };
    `);

    obj.setMethod('lock', `
      /** Lock this exit.
       *  @returns { success, message }
       */
      if (self.locked) {
        return { success: false, message: 'It is already locked.' };
      }
      self.set('locked', true);
      return { success: true, message: 'You lock the way ' + self.name + '.' };
    `);

    obj.setMethod('getDestination', `
      /** Get the destination room.
       *  @returns The destination room object or null
       */
      const destId = self.destRoom;
      if (!destId) return null;
      return await $.load(destId);
    `);

    obj.setMethod('describe', `
      /** Get description of this exit for room listing.
       *  @returns Description string like "north (10m)"
       */
      const aliases = self.aliases || [];
      const shortAlias = aliases.length > 0 ? ' [' + aliases[0] + ']' : '';
      const lockStr = self.locked ? ' (locked)' : '';
      return self.name + shortAlias + ' (' + self.distance + 'm)' + lockStr;
    `);

    return obj;
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
