import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Locker prototype
 * Base prototype for lockable containers with code-based access.
 * Inherits from Location - lockers can contain things.
 *
 * Lockers:
 * - Have a master code that can always open them
 * - Can generate one-time codes for temporary access
 * - One-time codes are consumed on first use
 * - Support locked/unlocked state
 *
 * This is the BASE prototype - handles state and validation only.
 * NO verbs, NO messaging.
 *
 * Subprototypes: $.oneTimeLocker (adds verbs/messaging for courier use)
 */
export class LockerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(locationId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: locationId,
      properties: {
        name: 'Locker',
        description: 'A lockable container',
        // Lock state
        locked: true,
        // Master code (string) - always works
        masterCode: null,
        // One-time codes array: [{ code: string, used: boolean, createdAt: string, usedAt?: string }]
        oneTimeCodes: [],
        // Owner player ID (who can set codes and get one-time codes)
        ownerId: null,
      },
      methods: {},
    });

    // Set the master code
    obj.setMethod('setMasterCode', `
      /** Set or change the master code.
       *  @param code - The new master code (string)
       *  @returns { success: boolean, error?: string }
       */
      const code = args[0];

      if (!code || typeof code !== 'string') {
        return { success: false, error: 'Code must be a non-empty string.' };
      }

      if (code.length < 4) {
        return { success: false, error: 'Code must be at least 4 characters.' };
      }

      self.masterCode = code;
      return { success: true };
    `);

    // Validate master code
    obj.setMethod('validateMasterCode', `
      /** Check if the given code matches the master code.
       *  @param code - The code to validate
       *  @returns boolean
       */
      const code = args[0];

      if (!self.masterCode) return false;
      return self.masterCode === code;
    `);

    // Generate a random one-time code
    obj.setMethod('generateCode', `
      /** Generate a random alphanumeric code.
       *  @returns string - A 6-character code
       */
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    `);

    // Create a new one-time code
    obj.setMethod('createOneTimeCode', `
      /** Create a new one-time code for temporary access.
       *  @returns { success: boolean, code?: string, error?: string }
       */
      // Generate a unique code
      let code;
      let attempts = 0;
      const existingCodes = (self.oneTimeCodes || []).map(c => c.code);

      do {
        code = await self.generateCode();
        attempts++;
      } while (existingCodes.includes(code) && attempts < 10);

      if (attempts >= 10) {
        return { success: false, error: 'Failed to generate unique code.' };
      }

      // Add to list
      const oneTimeCodes = self.oneTimeCodes || [];
      oneTimeCodes.push({
        code: code,
        used: false,
        createdAt: new Date().toISOString(),
      });
      self.oneTimeCodes = oneTimeCodes;

      return { success: true, code: code };
    `);

    // Validate a one-time code (without consuming it)
    obj.setMethod('validateOneTimeCode', `
      /** Check if a one-time code is valid (exists and not used).
       *  @param code - The code to validate
       *  @returns boolean
       */
      const code = args[0];

      if (!code) return false;

      const oneTimeCodes = self.oneTimeCodes || [];
      const entry = oneTimeCodes.find(c => c.code === code && !c.used);

      return !!entry;
    `);

    // Consume (mark as used) a one-time code
    obj.setMethod('consumeOneTimeCode', `
      /** Mark a one-time code as used.
       *  @param code - The code to consume
       *  @returns { success: boolean, error?: string }
       */
      const code = args[0];

      if (!code) {
        return { success: false, error: 'No code provided.' };
      }

      const oneTimeCodes = self.oneTimeCodes || [];
      const entry = oneTimeCodes.find(c => c.code === code && !c.used);

      if (!entry) {
        return { success: false, error: 'Invalid or already used code.' };
      }

      entry.used = true;
      entry.usedAt = new Date().toISOString();
      self.oneTimeCodes = oneTimeCodes;

      return { success: true };
    `);

    // Lock the locker
    obj.setMethod('lock', `
      /** Lock the locker.
       *  @returns { success: boolean, error?: string }
       */
      if (self.locked) {
        return { success: false, error: 'Already locked.' };
      }

      self.locked = true;
      return { success: true };
    `);

    // Unlock the locker with a code
    obj.setMethod('unlock', `
      /** Unlock the locker with a code.
       *  @param code - The code to use (master or one-time)
       *  @returns { success: boolean, usedOneTime?: boolean, codeUsed?: string, error?: string }
       */
      const code = args[0];

      if (!self.locked) {
        return { success: true, error: 'Already unlocked.' };
      }

      if (!code) {
        return { success: false, error: 'Code required.' };
      }

      // Try master code first
      if (await self.validateMasterCode(code)) {
        self.locked = false;
        self.lastCodeUsed = null; // Master code doesn't get tracked for hooks
        self.lastOpenedBy = null;
        return { success: true, usedOneTime: false, codeUsed: null };
      }

      // Try one-time code
      if (await self.validateOneTimeCode(code)) {
        await self.consumeOneTimeCode(code);
        self.locked = false;
        self.lastCodeUsed = code; // Track which one-time code was used
        return { success: true, usedOneTime: true, codeUsed: code };
      }

      return { success: false, error: 'Invalid code.' };
    `);

    // Check if a player is the owner
    obj.setMethod('isOwner', `
      /** Check if a player is the owner of this locker.
       *  @param player - The player to check
       *  @returns boolean
       */
      const player = args[0];

      if (!player) return false;
      return self.ownerId === player.id;
    `);

    // Set the owner
    obj.setMethod('setOwner', `
      /** Set the owner of this locker.
       *  @param player - The new owner
       *  @returns { success: boolean }
       */
      const player = args[0];

      if (!player) {
        self.ownerId = null;
        return { success: true };
      }

      self.ownerId = player.id;
      return { success: true };
    `);

    // Check if locker can be opened (validates code)
    obj.setMethod('canOpen', `
      /** Check if the locker can be opened with the given code.
       *  @param code - The code to validate (optional if unlocked)
       *  @returns { success: boolean, error?: string }
       */
      const code = args[0];

      // If not locked, anyone can open
      if (!self.locked) {
        return { success: true };
      }

      // Need a valid code
      if (!code) {
        return { success: false, error: 'This locker is locked. You need a code to open it.' };
      }

      // Check master code
      if (await self.validateMasterCode(code)) {
        return { success: true };
      }

      // Check one-time code
      if (await self.validateOneTimeCode(code)) {
        return { success: true };
      }

      return { success: false, error: 'Invalid code.' };
    `);

    // Override canContain to check if locker is open
    obj.setMethod('canContain', `
      /** Check if an object can be placed in this locker.
       *  @param item - The item to check
       *  @returns true or error string
       */
      const item = args[0];

      // Can't put things in a locked locker
      if (self.locked) {
        return 'The locker is locked.';
      }

      // Default container checks (size, etc.) would go here
      return true;
    `);

    // Override onContentLeaving to check if locker is open
    obj.setMethod('onContentLeaving', `
      /** Called when something is about to leave the locker.
       *  Throws if locker is locked.
       */
      const obj = args[0];
      const dest = args[1];
      const mover = args[2];

      if (self.locked) {
        throw new Error('The locker is locked.');
      }
    `);

    // Hook: called after content arrives - trigger plot hooks
    obj.setMethod('onContentArrived', `
      /** Called when something arrives in the locker.
       *  Triggers itemDeposited plot hook.
       */
      const obj = args[0];
      const source = args[1];
      const mover = args[2];

      // Trigger plot hooks
      await self.triggerPlotHooks('itemDeposited', {
        item: obj.id,
        itemName: obj.name,
        mover: mover?.id,
        moverName: mover?.name,
      });
    `);

    // Hook: called after content leaves - trigger plot hooks
    obj.setMethod('onContentLeft', `
      /** Called when something leaves the locker.
       *  Triggers itemRemoved plot hook.
       */
      const obj = args[0];
      const dest = args[1];
      const mover = args[2];

      // Trigger plot hooks
      await self.triggerPlotHooks('itemRemoved', {
        item: obj.id,
        itemName: obj.name,
        mover: mover?.id,
        moverName: mover?.name,
        destination: dest?.id,
      });
    `);

    // Get active (unused) one-time codes count
    obj.setMethod('getActiveCodeCount', `
      /** Get the number of active (unused) one-time codes.
       *  @returns number
       */
      const oneTimeCodes = self.oneTimeCodes || [];
      return oneTimeCodes.filter(c => !c.used).length;
    `);

    // Clean up old used codes (housekeeping)
    obj.setMethod('cleanupCodes', `
      /** Remove used one-time codes older than the specified age.
       *  @param maxAgeMs - Maximum age in milliseconds (default: 24 hours)
       *  @returns number - Number of codes removed
       */
      const maxAgeMs = args[0] || 24 * 60 * 60 * 1000; // Default 24 hours
      const cutoff = new Date(Date.now() - maxAgeMs).toISOString();

      const oneTimeCodes = self.oneTimeCodes || [];
      const before = oneTimeCodes.length;

      // Keep unused codes and recently used codes
      const filtered = oneTimeCodes.filter(c => {
        if (!c.used) return true; // Keep unused
        if (!c.usedAt) return false; // Remove used without timestamp
        return c.usedAt > cutoff; // Keep recently used
      });

      self.oneTimeCodes = filtered;
      return before - filtered.length;
    `);

    // Describe the locker
    obj.setMethod('describe', `
      /** Get description of this locker.
       *  @returns Description string
       */
      let desc = self.name + '\\r\\n';

      if (self.description && self.description !== 'A lockable container') {
        desc += self.description + '\\r\\n';
      }

      // Show lock state
      desc += self.locked ? 'It is locked.\\r\\n' : 'It is unlocked.\\r\\n';

      // Show contents if unlocked
      if (!self.locked) {
        const contents = self.contents || [];
        if (contents.length > 0) {
          desc += '\\r\\nContents:\\r\\n';
          for (const objId of contents) {
            const obj = await $.load(objId);
            if (obj) {
              desc += '  - ' + (obj.name || 'something') + '\\r\\n';
            }
          }
        } else {
          desc += '\\r\\nIt is empty.\\r\\n';
        }
      }

      return desc.trim();
    `);

    return obj;
  }
}
