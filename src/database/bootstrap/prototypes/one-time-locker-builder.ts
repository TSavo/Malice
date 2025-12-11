import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the OneTimeLocker prototype
 * Implementation prototype for courier-friendly locker banks.
 * Inherits from Locker (bank) - handles verbs, messaging, and hooks.
 *
 * This adds player-facing verbs to interact with the locker bank:
 * - "rent locker" - claim an available compartment
 * - "open locker A1" - unlock and open a compartment
 * - "close locker A1" - close and lock
 * - "get code from locker A1" - generate one-time code (owner only)
 * - "set code on locker A1" - set master code (owner only)
 * - "check locker A1" - view status (owner only)
 * - "release locker A1" - give up ownership
 */
export class OneTimeLockerBuilder {
  constructor(private manager: ObjectManager) {}

  async build(lockerId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: lockerId,
      properties: {
        name: 'One-Time Locker Bank',
        description: 'A bank of storage lockers that support one-time access codes for couriers.',
        // Override rental duration - courier lockers are shorter term (24 hours default)
        rentalDurationMs: 24 * 60 * 60 * 1000,
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // VERB HANDLERS
    // ═══════════════════════════════════════════════════════════════════

    // doRent - rent an available compartment
    obj.setMethod('doRent', `
      const context = args[0];
      const player = args[1];

      if (!player) return 'Rent what?';

      const available = await self.listAvailable();

      if (available.length === 0) {
        return 'No compartments available.';
      }

      // Prompt for choice if multiple
      let compId;
      if (available.length === 1) {
        compId = available[0];
      } else {
        if (!$.prompt) {
          return 'Available compartments: ' + available.join(', ') + '. Specify which one.';
        }

        const options = {};
        for (const id of available.slice(0, 10)) {  // Limit to 10
          options[id] = 'Compartment ' + id;
        }

        compId = await $.prompt.choice(player, 'Select compartment:', options);
        if (!compId) return 'Cancelled.';
      }

      const result = await self.rentCompartment(compId, player);
      if (!result.success) {
        return result.error;
      }

      // Announce
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You rent locker ' + compId + '.',
          others: player.name + ' rents a locker.',
        });
      }

      return 'You now own compartment ' + compId + '. Set a master code with: set code on locker ' + compId;
    `);

    // doOpen - open a compartment
    obj.setMethod('doOpen', `
      const context = args[0];
      const player = args[1];
      const compId = args[2];  // Compartment ID from verb parsing

      if (!player) return 'Open what?';
      if (!compId) return 'Which compartment? Try: open locker [number]';

      const comp = await self.getCompartment(compId);
      if (!comp) {
        return 'No compartment ' + compId + '.';
      }

      // If not locked, just show contents
      if (!comp.locked) {
        return await self.describeCompartment(compId, player);
      }

      // Need code
      if (!$.prompt) {
        return 'Compartment ' + compId + ' is locked. You need a code.';
      }

      const code = await $.prompt.question(player, 'Enter code: ');
      if (!code) return 'Cancelled.';

      const result = await self.unlock(compId, code);
      if (!result.success) {
        return result.error || 'Invalid code.';
      }

      // Announce
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You unlock and open locker ' + compId + '.',
          others: player.name + ' unlocks and opens a locker.',
        });
      }

      // Trigger plot hooks
      await self.triggerPlotHooks('opened', {
        compartment: compId,
        player: player.id,
        playerName: player.name,
        usedOneTimeCode: result.usedOneTime || false,
        code: result.codeUsed || null,
      });

      if (result.usedOneTime) {
        await self.triggerPlotHooks('oneTimeCodeUsed', {
          compartment: compId,
          player: player.id,
          playerName: player.name,
          code: result.codeUsed,
        });
      }

      return await self.describeCompartment(compId, player);
    `);

    // doClose - close and lock a compartment
    obj.setMethod('doClose', `
      const context = args[0];
      const player = args[1];
      const compId = args[2];

      if (!player) return 'Close what?';
      if (!compId) return 'Which compartment? Try: close locker [number]';

      const comp = await self.getCompartment(compId);
      if (!comp) {
        return 'No compartment ' + compId + '.';
      }

      if (comp.locked) {
        return 'Compartment ' + compId + ' is already locked.';
      }

      const result = await self.lock(compId);
      if (!result.success) {
        return result.error;
      }

      // Announce
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You close and lock locker ' + compId + '.',
          others: player.name + ' closes and locks a locker.',
        });
      }

      // Trigger plot hooks
      await self.triggerPlotHooks('closed', {
        compartment: compId,
        player: player.id,
        playerName: player.name,
      });

      return 'Compartment ' + compId + ' is now locked.';
    `);

    // doSetCode - set master code (owner only)
    obj.setMethod('doSetCode', `
      const context = args[0];
      const player = args[1];
      const compId = args[2];

      if (!player) return 'Set code on what?';
      if (!compId) return 'Which compartment? Try: set code on locker [number]';

      // Check ownership
      if (!await self.isOwner(compId, player)) {
        return 'You do not own compartment ' + compId + '.';
      }

      if (!$.prompt) {
        return 'Cannot set code - prompt system unavailable.';
      }

      const code = await $.prompt.question(player, 'Enter new master code (at least 4 characters): ');
      if (!code) return 'Cancelled.';

      const result = await self.setMasterCode(compId, code);
      if (!result.success) {
        return result.error;
      }

      return 'Master code set for compartment ' + compId + '.';
    `);

    // doGetCode - generate one-time code (owner only)
    obj.setMethod('doGetCode', `
      const context = args[0];
      const player = args[1];
      const compId = args[2];

      if (!player) return 'Get code from what?';
      if (!compId) return 'Which compartment? Try: get code from locker [number]';

      // Check ownership
      if (!await self.isOwner(compId, player)) {
        return 'You do not own compartment ' + compId + '.';
      }

      // Check master code is set
      const comp = await self.getCompartment(compId);
      if (!comp.masterCode) {
        return 'Set a master code first: set code on locker ' + compId;
      }

      const result = await self.createOneTimeCode(compId);
      if (!result.success) {
        return result.error;
      }

      // Tell player privately
      await player.tell('One-time code for ' + compId + ': ' + result.code);
      await player.tell('Give this to a courier. It can only be used once.');

      return '';
    `);

    // doCheck - view status (owner only)
    obj.setMethod('doCheck', `
      const context = args[0];
      const player = args[1];
      const compId = args[2];

      if (!player) return 'Check what?';
      if (!compId) return 'Which compartment? Try: check locker [number]';

      // Check ownership
      if (!await self.isOwner(compId, player)) {
        return 'You do not own compartment ' + compId + '.';
      }

      const comp = await self.getCompartment(compId);

      let status = 'Compartment ' + compId + ' Status:\\r\\n';
      status += 'State: ' + (comp.locked ? 'Locked' : 'Unlocked') + '\\r\\n';
      status += 'Master code: ' + (comp.masterCode ? 'Set' : 'Not set') + '\\r\\n';

      const activeCount = await self.getActiveCodeCount(compId);
      status += 'Active one-time codes: ' + activeCount + '\\r\\n';

      const contents = comp.contents || [];
      status += 'Items inside: ' + contents.length + '\\r\\n';

      // Show expiration
      const expInfo = await self.getExpirationInfo(compId);
      if (expInfo) {
        if (expInfo.expired) {
          status += 'EXPIRED - renew now to avoid losing contents!';
        } else {
          status += 'Expires in: ' + expInfo.timeRemaining;
        }
      }

      return status;
    `);

    // doRelease - give up ownership
    obj.setMethod('doRelease', `
      const context = args[0];
      const player = args[1];
      const compId = args[2];

      if (!player) return 'Release what?';
      if (!compId) return 'Which compartment? Try: release locker [number]';

      // Check ownership
      if (!await self.isOwner(compId, player)) {
        return 'You do not own compartment ' + compId + '.';
      }

      // Check if empty
      const contents = await self.getContents(compId);
      if (contents.length > 0) {
        return 'Empty the compartment first.';
      }

      const result = await self.releaseCompartment(compId, player);
      if (!result.success) {
        return result.error;
      }

      return 'You no longer own compartment ' + compId + '.';
    `);

    // doRenew - extend rental period
    obj.setMethod('doRenew', `
      const context = args[0];
      const player = args[1];
      const compId = args[2];

      if (!player) return 'Renew what?';
      if (!compId) return 'Which compartment? Try: renew locker [number]';

      // Check ownership
      if (!await self.isOwner(compId, player)) {
        return 'You do not own compartment ' + compId + '.';
      }

      const result = await self.renewCompartment(compId);
      if (!result.success) {
        return result.error;
      }

      const info = await self.getExpirationInfo(compId);
      return 'Rental extended. Expires in ' + info.timeRemaining + '.';
    `);

    // doLook - look at locker bank or specific compartment
    obj.setMethod('doLook', `
      const context = args[0];
      const player = args[1];
      const compId = args[2];

      if (compId) {
        return await self.describeCompartment(compId, player);
      }

      return await self.describe();
    `);

    // doPut - put item in compartment
    obj.setMethod('doPut', `
      const context = args[0];
      const player = args[1];
      const item = args[2];
      const compId = args[3];

      if (!player) return 'Put what where?';
      if (!item) return 'Put what in the locker?';
      if (!compId) return 'Which compartment?';

      const canAdd = await self.canAddContent(compId, item);
      if (canAdd !== true) {
        return canAdd;
      }

      // Move item
      const result = await self.addContent(compId, item);
      if (!result.success) {
        return result.error;
      }

      // Update item's location
      item.location = self.id;

      // Announce
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You put ' + item.name + ' in locker ' + compId + '.',
          others: player.name + ' puts something in a locker.',
        });
      }

      return 'You put ' + item.name + ' in compartment ' + compId + '.';
    `);

    // doGet - get item from compartment
    obj.setMethod('doGet', `
      const context = args[0];
      const player = args[1];
      const itemName = args[2];
      const compId = args[3];

      if (!player) return 'Get what?';
      if (!itemName) return 'Get what from the locker?';
      if (!compId) return 'Which compartment?';

      const comp = await self.getCompartment(compId);
      if (!comp) return 'No compartment ' + compId + '.';

      if (comp.locked) {
        return 'Compartment ' + compId + ' is locked.';
      }

      // Find item by name
      const contents = comp.contents || [];
      let foundItem = null;
      for (const itemRef of contents) {
        const item = typeof itemRef === 'object' ? itemRef : await $.load(itemRef);
        if (item && item.name && item.name.toLowerCase().includes(itemName.toLowerCase())) {
          foundItem = item;
          break;
        }
      }

      if (!foundItem) {
        return 'No ' + itemName + ' in compartment ' + compId + '.';
      }

      // Remove from compartment
      const result = await self.removeContent(compId, foundItem);
      if (!result.success) {
        return result.error;
      }

      // Move to player
      foundItem.location = player.id;

      // Announce
      const location = player.location ? await $.load(player.location) : null;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You take ' + foundItem.name + ' from locker ' + compId + '.',
          others: player.name + ' takes something from a locker.',
        });
      }

      return 'You take ' + foundItem.name + '.';
    `);

    // ═══════════════════════════════════════════════════════════════════
    // VERB REGISTRATION HOOKS
    // ═══════════════════════════════════════════════════════════════════

    // registerVerbsFor - register verbs for a player
    obj.setMethod('registerVerbsFor', `
      const player = args[0];
      if (!player || !player.registerVerb) return;

      // Basic verbs (no compartment ID needed)
      await player.registerVerb(['rent locker', 'rent compartment'], self, 'doRent');
      await player.registerVerb(['look at locker', 'examine locker', 'look locker'], self, 'doLook');

      // Compartment-specific verbs (ID captured as args[2])
      await player.registerVerb(['open locker %w', 'unlock locker %w'], self, 'doOpen');
      await player.registerVerb(['close locker %w', 'lock locker %w'], self, 'doClose');
      await player.registerVerb(['set code on locker %w', 'change code on locker %w'], self, 'doSetCode');
      await player.registerVerb(['get code from locker %w', 'generate code for locker %w'], self, 'doGetCode');
      await player.registerVerb(['check locker %w', 'status locker %w'], self, 'doCheck');
      await player.registerVerb(['release locker %w', 'abandon locker %w'], self, 'doRelease');
      await player.registerVerb(['renew locker %w', 'extend locker %w'], self, 'doRenew');
      await player.registerVerb(['look at locker %w', 'examine locker %w', 'look locker %w'], self, 'doLook');

      // Put/get verbs
      await player.registerVerb(['put %d in locker %w', 'place %d in locker %w'], self, 'doPut');
      await player.registerVerb(['get %w from locker %w', 'take %w from locker %w'], self, 'doGet');
    `);

    // onArrived - register verbs when placed in room
    obj.setMethod('onArrived', `
      const dest = args[0];
      const source = args[1];
      const mover = args[2];

      if (dest && dest.contents) {
        for (const objId of dest.contents) {
          const obj = await $.load(objId);
          if (obj && obj.isPlayer && obj.registerVerb) {
            await self.registerVerbsFor(obj);
          }
        }
      }
    `);

    // onLeaving - unregister verbs when leaving
    obj.setMethod('onLeaving', `
      const source = args[0];
      const dest = args[1];
      const mover = args[2];

      if (source && source.contents) {
        for (const objId of source.contents) {
          const obj = await $.load(objId);
          if (obj && obj.isPlayer && obj.unregisterVerbsFrom) {
            await obj.unregisterVerbsFrom(self.id);
          }
        }
      }
    `);

    // onPlayerArrived - register verbs when player enters room
    obj.setMethod('onPlayerArrived', `
      const player = args[0];
      await self.registerVerbsFor(player);
    `);

    return obj;
  }
}
