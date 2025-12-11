import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Locker prototype
 * A BANK of lockers - like at a train station or gym.
 * Contains multiple compartments, each rentable by different users.
 *
 * Structure:
 *   compartments: {
 *     "A1": { owner, masterCode, oneTimeCodes[], locked, contents[] },
 *     "A2": { ... },
 *     ...
 *   }
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
        name: 'Locker Bank',
        description: 'A wall of storage lockers.',
        // Compartments keyed by ID (e.g., "A1", "B2", "1", "2")
        // Each: { owner: objref, masterCode: string, oneTimeCodes: [], locked: bool, contents: [], rentedAt: ISO, expiresAt: ISO }
        compartments: {},
        // Configuration
        compartmentPrefix: '', // e.g., "A" for A1, A2, A3...
        nextCompartmentNum: 1,
        // Rental duration in milliseconds (default: 7 days)
        rentalDurationMs: 7 * 24 * 60 * 60 * 1000,
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // COMPARTMENT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    // createCompartment(id?) - create a new empty compartment
    // If id not provided, auto-generates one
    obj.setMethod('createCompartment', `
      let id = args[0];

      if (!id) {
        // Auto-generate ID
        const prefix = self.compartmentPrefix || '';
        const num = self.nextCompartmentNum || 1;
        id = prefix + num;
        self.nextCompartmentNum = num + 1;
      }

      const compartments = self.compartments || {};
      if (compartments[id]) {
        return { success: false, error: 'Compartment ' + id + ' already exists.' };
      }

      compartments[id] = {
        owner: null,
        masterCode: null,
        oneTimeCodes: [],
        locked: true,
        contents: [],
      };
      self.compartments = compartments;

      return { success: true, id: id };
    `);

    // getCompartment(id) - get compartment data
    obj.setMethod('getCompartment', `
      const id = args[0];
      if (!id) return null;

      const compartments = self.compartments || {};
      return compartments[id] || null;
    `);

    // listCompartments() - list all compartment IDs
    obj.setMethod('listCompartments', `
      const compartments = self.compartments || {};
      return Object.keys(compartments);
    `);

    // listAvailable() - list unrented compartments (auto-expires old ones first)
    obj.setMethod('listAvailable', `
      // Check for expired rentals first
      await self.checkExpired();

      const compartments = self.compartments || {};
      const available = [];

      for (const [id, comp] of Object.entries(compartments)) {
        if (!comp.owner) {
          available.push(id);
        }
      }

      return available;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // OWNERSHIP
    // ═══════════════════════════════════════════════════════════════════

    // rentCompartment(id, player) - assign ownership to player
    obj.setMethod('rentCompartment', `
      const id = args[0];
      const player = args[1];

      if (!id || !player) {
        return { success: false, error: 'Requires compartment ID and player.' };
      }

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return { success: false, error: 'Compartment ' + id + ' does not exist.' };
      }

      if (comp.owner) {
        // Check if same owner
        const ownerId = typeof comp.owner === 'object' ? comp.owner.id : comp.owner;
        if (ownerId === player.id) {
          return { success: false, error: 'You already own this compartment.' };
        }
        return { success: false, error: 'Compartment ' + id + ' is already rented.' };
      }

      const now = Date.now();
      const duration = self.rentalDurationMs || (7 * 24 * 60 * 60 * 1000);

      comp.owner = player;  // Stored as objref
      comp.rentedAt = new Date(now).toISOString();
      comp.expiresAt = new Date(now + duration).toISOString();
      self.compartments = compartments;

      return { success: true, expiresAt: comp.expiresAt };
    `);

    // releaseCompartment(id, player) - release ownership (must be owner or empty)
    obj.setMethod('releaseCompartment', `
      const id = args[0];
      const player = args[1];

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return { success: false, error: 'Compartment ' + id + ' does not exist.' };
      }

      if (comp.owner) {
        const ownerId = typeof comp.owner === 'object' ? comp.owner.id : comp.owner;
        if (player && ownerId !== player.id) {
          return { success: false, error: 'You do not own this compartment.' };
        }
      }

      // Clear ownership, codes, and timestamps
      comp.owner = null;
      comp.masterCode = null;
      comp.oneTimeCodes = [];
      comp.rentedAt = null;
      comp.expiresAt = null;
      self.compartments = compartments;

      return { success: true };
    `);

    // isOwner(id, player) - check if player owns compartment
    obj.setMethod('isOwner', `
      const id = args[0];
      const player = args[1];

      if (!id || !player) return false;

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp || !comp.owner) return false;

      const ownerId = typeof comp.owner === 'object' ? comp.owner.id : comp.owner;
      return ownerId === player.id;
    `);

    // getOwner(id) - get owner of compartment
    obj.setMethod('getOwner', `
      const id = args[0];
      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) return null;
      return comp.owner;
    `);

    // renewCompartment(id) - extend rental by another duration
    obj.setMethod('renewCompartment', `
      const id = args[0];
      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return { success: false, error: 'Compartment not found.' };
      }

      if (!comp.owner) {
        return { success: false, error: 'Compartment is not rented.' };
      }

      const duration = self.rentalDurationMs || (7 * 24 * 60 * 60 * 1000);
      const now = Date.now();
      const currentExpiry = comp.expiresAt ? new Date(comp.expiresAt).getTime() : now;
      const newExpiry = Math.max(currentExpiry, now) + duration;

      comp.expiresAt = new Date(newExpiry).toISOString();
      self.compartments = compartments;

      return { success: true, expiresAt: comp.expiresAt };
    `);

    // isExpired(id) - check if compartment rental has expired
    obj.setMethod('isExpired', `
      const id = args[0];
      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp || !comp.owner) return false;
      if (!comp.expiresAt) return false;

      return new Date(comp.expiresAt) <= new Date();
    `);

    // expireCompartment(id) - force expire, recycle contents, clear ownership
    obj.setMethod('expireCompartment', `
      const id = args[0];
      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return { success: false, error: 'Compartment not found.' };
      }

      const recycler = $.recycler;
      const recycledItems = [];

      // Recycle all contents
      const contents = comp.contents || [];
      for (const itemRef of contents) {
        const item = typeof itemRef === 'object' ? itemRef : await $.load(itemRef);
        if (item && recycler) {
          await recycler.recycle(item);
          recycledItems.push(item.name || 'item');
        }
      }

      // Clear the compartment
      comp.owner = null;
      comp.masterCode = null;
      comp.oneTimeCodes = [];
      comp.locked = true;
      comp.contents = [];
      comp.rentedAt = null;
      comp.expiresAt = null;
      self.compartments = compartments;

      return { success: true, recycledItems: recycledItems };
    `);

    // checkExpired() - check all compartments for expiration, expire any past due
    // Returns list of expired compartment IDs
    obj.setMethod('checkExpired', `
      const compartments = self.compartments || {};
      const now = new Date();
      const expired = [];

      for (const [id, comp] of Object.entries(compartments)) {
        if (comp.owner && comp.expiresAt && new Date(comp.expiresAt) <= now) {
          await self.expireCompartment(id);
          expired.push(id);
        }
      }

      return expired;
    `);

    // getExpirationInfo(id) - get time remaining on rental
    obj.setMethod('getExpirationInfo', `
      const id = args[0];
      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp || !comp.owner || !comp.expiresAt) {
        return null;
      }

      const now = Date.now();
      const expiry = new Date(comp.expiresAt).getTime();
      const remaining = expiry - now;

      if (remaining <= 0) {
        return { expired: true, remaining: 0, expiresAt: comp.expiresAt };
      }

      // Calculate human-readable time
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;

      let timeStr;
      if (days > 0) {
        timeStr = days + ' day' + (days !== 1 ? 's' : '');
        if (remainingHours > 0) {
          timeStr += ', ' + remainingHours + ' hour' + (remainingHours !== 1 ? 's' : '');
        }
      } else {
        timeStr = hours + ' hour' + (hours !== 1 ? 's' : '');
      }

      return {
        expired: false,
        remaining: remaining,
        expiresAt: comp.expiresAt,
        timeRemaining: timeStr,
      };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // CODES
    // ═══════════════════════════════════════════════════════════════════

    // setMasterCode(id, code) - set master code for compartment
    obj.setMethod('setMasterCode', `
      const id = args[0];
      const code = args[1];

      if (!id) {
        return { success: false, error: 'Compartment ID required.' };
      }

      if (!code || typeof code !== 'string' || code.length < 4) {
        return { success: false, error: 'Code must be at least 4 characters.' };
      }

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return { success: false, error: 'Compartment ' + id + ' does not exist.' };
      }

      comp.masterCode = code;
      self.compartments = compartments;

      return { success: true };
    `);

    // generateCode() - generate a random 6-character code
    obj.setMethod('generateCode', `
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    `);

    // createOneTimeCode(id) - create one-time code for compartment
    obj.setMethod('createOneTimeCode', `
      const id = args[0];

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return { success: false, error: 'Compartment ' + id + ' does not exist.' };
      }

      // Generate unique code
      let code;
      let attempts = 0;
      const existingCodes = (comp.oneTimeCodes || []).map(c => c.code);

      do {
        code = await self.generateCode();
        attempts++;
      } while (existingCodes.includes(code) && attempts < 10);

      if (attempts >= 10) {
        return { success: false, error: 'Failed to generate unique code.' };
      }

      comp.oneTimeCodes = comp.oneTimeCodes || [];
      comp.oneTimeCodes.push({
        code: code,
        used: false,
        createdAt: new Date().toISOString(),
      });
      self.compartments = compartments;

      return { success: true, code: code };
    `);

    // validateCode(id, code) - check if code is valid for compartment
    // Returns { valid: bool, isMaster: bool, isOneTime: bool }
    obj.setMethod('validateCode', `
      const id = args[0];
      const code = args[1];

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp || !code) {
        return { valid: false };
      }

      // Check master code
      if (comp.masterCode && comp.masterCode === code) {
        return { valid: true, isMaster: true, isOneTime: false };
      }

      // Check one-time codes
      const otc = (comp.oneTimeCodes || []).find(c => c.code === code && !c.used);
      if (otc) {
        return { valid: true, isMaster: false, isOneTime: true };
      }

      return { valid: false };
    `);

    // consumeOneTimeCode(id, code) - mark one-time code as used
    obj.setMethod('consumeOneTimeCode', `
      const id = args[0];
      const code = args[1];

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return { success: false, error: 'Compartment not found.' };
      }

      const otc = (comp.oneTimeCodes || []).find(c => c.code === code && !c.used);
      if (!otc) {
        return { success: false, error: 'Invalid or already used code.' };
      }

      otc.used = true;
      otc.usedAt = new Date().toISOString();
      self.compartments = compartments;

      return { success: true };
    `);

    // getActiveCodeCount(id) - count unused one-time codes
    obj.setMethod('getActiveCodeCount', `
      const id = args[0];
      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) return 0;

      return (comp.oneTimeCodes || []).filter(c => !c.used).length;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // LOCK STATE
    // ═══════════════════════════════════════════════════════════════════

    // isLocked(id) - check if compartment is locked
    obj.setMethod('isLocked', `
      const id = args[0];
      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) return true;  // Non-existent = locked
      return comp.locked !== false;
    `);

    // lock(id) - lock a compartment
    obj.setMethod('lock', `
      const id = args[0];
      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return { success: false, error: 'Compartment not found.' };
      }

      if (comp.locked) {
        return { success: false, error: 'Already locked.' };
      }

      comp.locked = true;
      self.compartments = compartments;

      return { success: true };
    `);

    // unlock(id, code) - unlock with code
    obj.setMethod('unlock', `
      const id = args[0];
      const code = args[1];

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return { success: false, error: 'Compartment not found.' };
      }

      if (!comp.locked) {
        return { success: true, alreadyOpen: true };
      }

      if (!code) {
        return { success: false, error: 'Code required.' };
      }

      const validation = await self.validateCode(id, code);
      if (!validation.valid) {
        return { success: false, error: 'Invalid code.' };
      }

      // Consume one-time code if used
      if (validation.isOneTime) {
        await self.consumeOneTimeCode(id, code);
      }

      comp.locked = false;
      self.compartments = compartments;

      return {
        success: true,
        usedOneTime: validation.isOneTime,
        codeUsed: validation.isOneTime ? code : null,
      };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // CONTENTS
    // ═══════════════════════════════════════════════════════════════════

    // getContents(id) - get contents of compartment
    obj.setMethod('getContents', `
      const id = args[0];
      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) return [];
      return comp.contents || [];
    `);

    // canAddContent(id, item) - check if item can be added
    obj.setMethod('canAddContent', `
      const id = args[0];
      const item = args[1];

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return 'Compartment does not exist.';
      }

      if (comp.locked) {
        return 'The compartment is locked.';
      }

      return true;
    `);

    // addContent(id, item) - add item to compartment
    obj.setMethod('addContent', `
      const id = args[0];
      const item = args[1];

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return { success: false, error: 'Compartment not found.' };
      }

      if (comp.locked) {
        return { success: false, error: 'Compartment is locked.' };
      }

      comp.contents = comp.contents || [];
      // Store as objref
      comp.contents.push(item);
      self.compartments = compartments;

      // Trigger plot hooks
      await self.triggerPlotHooks('itemDeposited', {
        compartment: id,
        item: item.id,
        itemName: item.name,
      });

      return { success: true };
    `);

    // removeContent(id, item) - remove item from compartment
    obj.setMethod('removeContent', `
      const id = args[0];
      const item = args[1];

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return { success: false, error: 'Compartment not found.' };
      }

      if (comp.locked) {
        return { success: false, error: 'Compartment is locked.' };
      }

      const contents = comp.contents || [];
      const itemId = typeof item === 'object' ? item.id : item;

      const idx = contents.findIndex(c => {
        const cId = typeof c === 'object' ? c.id : c;
        return cId === itemId;
      });

      if (idx === -1) {
        return { success: false, error: 'Item not in compartment.' };
      }

      contents.splice(idx, 1);
      comp.contents = contents;
      self.compartments = compartments;

      // Trigger plot hooks
      await self.triggerPlotHooks('itemRemoved', {
        compartment: id,
        item: itemId,
        itemName: item.name || 'item',
      });

      return { success: true };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DESCRIPTION
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('describe', `
      let desc = self.name + '\\r\\n';

      if (self.description) {
        desc += self.description + '\\r\\n';
      }

      const compartments = self.compartments || {};
      const ids = Object.keys(compartments);

      if (ids.length === 0) {
        desc += '\\r\\nNo compartments available.';
      } else {
        const available = ids.filter(id => !compartments[id].owner).length;
        desc += '\\r\\n' + ids.length + ' compartments (' + available + ' available).';
      }

      return desc;
    `);

    // describeCompartment(id, viewer) - describe a specific compartment
    obj.setMethod('describeCompartment', `
      const id = args[0];
      const viewer = args[1];

      const compartments = self.compartments || {};
      const comp = compartments[id];

      if (!comp) {
        return 'No compartment ' + id + '.';
      }

      let desc = 'Compartment ' + id + '\\r\\n';
      desc += comp.locked ? 'Status: Locked\\r\\n' : 'Status: Unlocked\\r\\n';

      if (comp.owner) {
        const ownerId = typeof comp.owner === 'object' ? comp.owner.id : comp.owner;
        const viewerId = viewer ? (typeof viewer === 'object' ? viewer.id : viewer) : null;

        if (viewerId === ownerId) {
          desc += 'Owner: You\\r\\n';
          const activeCount = await self.getActiveCodeCount(id);
          desc += 'Active one-time codes: ' + activeCount + '\\r\\n';
        } else {
          desc += 'Status: Rented\\r\\n';
        }
      } else {
        desc += 'Status: Available\\r\\n';
      }

      // Show contents if unlocked
      if (!comp.locked) {
        const contents = comp.contents || [];
        if (contents.length > 0) {
          desc += '\\r\\nContents:\\r\\n';
          for (const itemRef of contents) {
            const item = typeof itemRef === 'object' ? itemRef : await $.load(itemRef);
            if (item) {
              desc += '  - ' + (item.name || 'something') + '\\r\\n';
            }
          }
        } else {
          desc += '\\r\\nEmpty.\\r\\n';
        }
      }

      return desc.trim();
    `);

    return obj;
  }
}
