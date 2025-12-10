import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the OneTimeLocker prototype
 * Implementation prototype for courier-friendly lockers.
 * Inherits from Locker - handles verbs, messaging, and hooks.
 *
 * OneTimeLocker:
 * - Owner can set/change master code
 * - Owner can generate one-time codes for couriers
 * - Anyone with a valid code can open and deposit/retrieve items
 * - One-time codes are consumed on use
 *
 * Verb registration flow:
 * 1. Locker placed in room -> onArrived registers verbs for players in room
 * 2. Player opens locker -> can put/get items
 * 3. Player closes/locks locker -> items secured
 *
 * Usage flow for couriers:
 * 1. Owner gets a one-time code from locker: "get code from locker"
 * 2. Owner gives code to courier out-of-band
 * 3. Courier opens locker with code: "open locker" then enters code
 * 4. Courier deposits package
 * 5. Courier closes locker: "close locker"
 * 6. One-time code is now consumed
 */
export class OneTimeLockerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(lockerId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: lockerId,
      properties: {
        name: 'One-Time Locker',
        description: 'A locker that supports one-time access codes for couriers.',
      },
      methods: {},
    });

    // Verb: open the locker
    obj.setMethod('doOpen', `
      /** Open this locker.
       *  If locked, prompts for code.
       *  @param context - Command context
       *  @param player - The player opening this
       *  @returns Result message
       */
      const context = args[0];
      const player = args[1];

      if (!player) {
        return 'Open what?';
      }

      // If not locked, just open
      if (!self.locked) {
        // Show contents
        const desc = await self.describe();
        return 'The locker is already open.\\r\\n' + desc;
      }

      // Need to prompt for code
      if (!$.prompt) {
        return 'The locker is locked. You need a code to open it.';
      }

      const code = await $.prompt.question(player, 'Enter code: ');

      if (!code) {
        return 'Cancelled.';
      }

      // Try to unlock
      const result = await self.unlock(code);

      if (!result.success) {
        return result.error || 'Invalid code.';
      }

      // Announce to room
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You unlock and open the locker.',
          others: player.name + ' unlocks and opens a locker.',
        });
      }

      // Trigger plot hooks - include the code used for filtering
      await self.triggerPlotHooks('opened', {
        player: player.id,
        playerName: player.name,
        usedOneTimeCode: result.usedOneTime || false,
        code: result.codeUsed || null,
      });

      // If a one-time code was used, trigger that hook too
      if (result.usedOneTime) {
        await self.triggerPlotHooks('oneTimeCodeUsed', {
          player: player.id,
          playerName: player.name,
          code: result.codeUsed,
        });
      }

      // Show contents
      const contents = self.contents || [];
      if (contents.length > 0) {
        let msg = 'The locker contains:\\r\\n';
        for (const objId of contents) {
          const item = await $.load(objId);
          if (item) {
            msg += '  - ' + (item.name || 'something') + '\\r\\n';
          }
        }
        return msg;
      } else {
        return 'The locker is empty.';
      }
    `);

    // Verb: close the locker
    obj.setMethod('doClose', `
      /** Close and lock this locker.
       *  @param context - Command context
       *  @param player - The player closing this
       *  @returns Result message
       */
      const context = args[0];
      const player = args[1];

      if (!player) {
        return 'Close what?';
      }

      if (self.locked) {
        return 'The locker is already closed and locked.';
      }

      // Lock it
      const result = await self.lock();

      if (!result.success) {
        return result.error || 'Could not close the locker.';
      }

      // Announce to room
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You close and lock the locker.',
          others: player.name + ' closes and locks a locker.',
        });
      }

      // Trigger plot hooks
      await self.triggerPlotHooks('closed', {
        player: player.id,
        playerName: player.name,
      });

      return 'You close and lock the locker.';
    `);

    // Verb: look at locker contents
    obj.setMethod('doLook', `
      /** Look inside the locker.
       *  @param context - Command context
       *  @param player - The player looking
       *  @returns Result message
       */
      const context = args[0];
      const player = args[1];

      return await self.describe();
    `);

    // Verb: set master code (owner only)
    obj.setMethod('doSetCode', `
      /** Set or change the master code.
       *  @param context - Command context
       *  @param player - The player (must be owner)
       *  @returns Result message
       */
      const context = args[0];
      const player = args[1];

      if (!player) {
        return 'Set code on what?';
      }

      // Check ownership
      if (self.ownerId && !await self.isOwner(player)) {
        return 'You are not the owner of this locker.';
      }

      // Prompt for new code
      if (!$.prompt) {
        return 'Cannot set code - prompt system unavailable.';
      }

      const code = await $.prompt.question(player, 'Enter new master code (at least 4 characters): ');

      if (!code) {
        return 'Cancelled.';
      }

      const result = await self.setMasterCode(code);

      if (!result.success) {
        return result.error || 'Could not set code.';
      }

      // If no owner, set this player as owner
      if (!self.ownerId) {
        await self.setOwner(player);
      }

      return 'Master code set successfully.';
    `);

    // Verb: get a one-time code (owner only)
    obj.setMethod('doGetCode', `
      /** Generate a one-time code for a courier.
       *  @param context - Command context
       *  @param player - The player (must be owner)
       *  @returns Result message
       */
      const context = args[0];
      const player = args[1];

      if (!player) {
        return 'Get code from what?';
      }

      // Check ownership
      if (!await self.isOwner(player)) {
        return 'You are not the owner of this locker.';
      }

      // Check if master code is set
      if (!self.masterCode) {
        return 'You must set a master code first. Use: set code on locker';
      }

      // Generate one-time code
      const result = await self.createOneTimeCode();

      if (!result.success) {
        return result.error || 'Could not generate code.';
      }

      // Only tell the owner
      await player.tell('One-time code generated: ' + result.code);
      await player.tell('Give this code to a courier. It can only be used once.');

      return '';  // Already told the player
    `);

    // Verb: check locker status (owner only)
    obj.setMethod('doStatus', `
      /** Check locker status and active codes.
       *  @param context - Command context
       *  @param player - The player (must be owner)
       *  @returns Result message
       */
      const context = args[0];
      const player = args[1];

      if (!player) {
        return 'Check status of what?';
      }

      // Check ownership
      if (!await self.isOwner(player)) {
        return 'You are not the owner of this locker.';
      }

      let status = 'Locker Status:\\r\\n';
      status += 'State: ' + (self.locked ? 'Locked' : 'Unlocked') + '\\r\\n';
      status += 'Master code: ' + (self.masterCode ? 'Set' : 'Not set') + '\\r\\n';

      const activeCount = await self.getActiveCodeCount();
      status += 'Active one-time codes: ' + activeCount + '\\r\\n';

      const contents = self.contents || [];
      status += 'Items inside: ' + contents.length + '\\r\\n';

      return status;
    `);

    // Verb: claim ownership of an unclaimed locker
    obj.setMethod('doClaim', `
      /** Claim ownership of an unclaimed locker.
       *  @param context - Command context
       *  @param player - The player claiming
       *  @returns Result message
       */
      const context = args[0];
      const player = args[1];

      if (!player) {
        return 'Claim what?';
      }

      if (self.ownerId) {
        if (await self.isOwner(player)) {
          return 'You already own this locker.';
        }
        return 'This locker is already owned by someone else.';
      }

      await self.setOwner(player);
      return 'You now own this locker. Set a master code with: set code on locker';
    `);

    // Hook: register verbs when in a room
    obj.setMethod('onArrived', `
      /** Called when this locker arrives somewhere.
       *  Registers verbs for players in the location.
       */
      const dest = args[0];
      const source = args[1];
      const mover = args[2];

      // If arriving in a room, register verbs for all players there
      if (dest && dest.contents) {
        for (const objId of dest.contents) {
          const obj = await $.load(objId);
          if (obj && obj.isPlayer && obj.registerVerb) {
            await self.registerVerbsFor(obj);
          }
        }
      }
    `);

    // Hook: unregister verbs when leaving
    obj.setMethod('onLeaving', `
      /** Called when this locker is about to leave somewhere.
       *  Unregisters verbs from players.
       */
      const source = args[0];
      const dest = args[1];
      const mover = args[2];

      // Unregister verbs from all players in the source location
      if (source && source.contents) {
        for (const objId of source.contents) {
          const obj = await $.load(objId);
          if (obj && obj.isPlayer && obj.unregisterVerbsFrom) {
            await obj.unregisterVerbsFrom(self.id);
          }
        }
      }
    `);

    // Helper: register verbs for a specific player
    obj.setMethod('registerVerbsFor', `
      /** Register locker verbs for a player.
       *  @param player - The player to register verbs for
       */
      const player = args[0];

      if (!player || !player.registerVerb) return;

      // Basic interaction verbs for everyone
      await player.registerVerb(['open %t', 'unlock %t'], self, 'doOpen');
      await player.registerVerb(['close %t', 'lock %t'], self, 'doClose');
      await player.registerVerb(['look at %t', 'examine %t', 'look in %t'], self, 'doLook');

      // Owner-only verbs (will check ownership in handler)
      await player.registerVerb(['set code on %t', 'change code on %t'], self, 'doSetCode');
      await player.registerVerb(['get code from %t', 'get one-time code from %t', 'generate code for %t'], self, 'doGetCode');
      await player.registerVerb(['check %t', 'status of %t', 'locker status %t'], self, 'doStatus');
      await player.registerVerb(['claim %t'], self, 'doClaim');
    `);

    // Room arrival hook - register verbs when player enters room with locker
    obj.setMethod('onPlayerArrived', `
      /** Called by room when a player arrives.
       *  Registers verbs for the player.
       */
      const player = args[0];

      await self.registerVerbsFor(player);
    `);

    // Override describe to include owner info for owner
    obj.setMethod('describe', `
      /** Get description of this locker.
       *  Shows extra info for owner.
       *  @param viewer - Optional viewer for context
       *  @returns Description string
       */
      const viewer = args[0];

      let desc = self.name + '\\r\\n';

      if (self.description && self.description !== 'A locker that supports one-time access codes for couriers.') {
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

      // Owner-only info
      if (viewer && await self.isOwner(viewer)) {
        const activeCount = await self.getActiveCodeCount();
        desc += '\\r\\n[Owner: ' + activeCount + ' active one-time codes]\\r\\n';
      }

      // Show if unclaimed
      if (!self.ownerId) {
        desc += '\\r\\nThis locker is unclaimed. Use "claim locker" to own it.\\r\\n';
      }

      return desc.trim();
    `);

    return obj;
  }
}
