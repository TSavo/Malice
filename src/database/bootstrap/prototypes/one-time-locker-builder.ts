import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

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
 * - "put <item> in locker A1" - store an item
 * - "get from locker A1" - then choose item to take
 */
export class OneTimeLockerBuilder implements Builder {
  static provides = ['oneTimeLocker'];
  static depends = ['locker'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const $ = this.manager as any;

    if ($.oneTimeLocker && !forceRebuild) {
      this.obj = $.oneTimeLocker;
      return;
    }

    const parentObj = $.locker;
    if (!parentObj) throw new Error('OneTimeLockerBuilder: $locker not found');

    this.obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'One-Time Locker Bank',
        description:
          'A bank of storage lockers that support one-time access codes for couriers.',
        // Override rental duration - courier lockers are shorter term (24 hours default)
        rentalDurationMs: 24 * 60 * 60 * 1000,

        abilities: `Locker bank optimized for courier dead-drops. Adds verbs to base $.locker.

VERBS: rent locker, open/close locker [id], set code, get code, check, release, renew, put/get from locker.

COURIER WORKFLOW:
1. Owner rents locker, sets master code
2. Owner deposits item, generates one-time code
3. Owner gives code to courier out-of-band
4. Courier unlocks with one-time code (consumed on use)
5. Courier takes item, locker auto-locks

SHORT RENTAL: 24-hour default rental (vs 7-day base). Courier jobs are quick.

PLOT HOOKS: Triggers 'opened', 'closed', 'oneTimeCodeUsed' for story tracking.

VERB REGISTRATION: Registers verbs when placed in room or player enters. Unregisters on leave.`,
      },
      methods: {},
    });

    const obj = this.obj;

    // ═══════════════════════════════════════════════════════════════════
    // VERB HANDLERS
    // ═══════════════════════════════════════════════════════════════════

    // doRent - rent an available compartment
    obj.setMethod(
      'doRent',
      `
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
      const location = player.location;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You rent locker ' + compId + '.',
          others: player.name + ' rents a locker.',
        });
      }

      return 'You now own compartment ' + compId + '. Set a master code with: set code on locker ' + compId;
    `,
    );

    // doOpen - open a compartment
    obj.setMethod(
      'doOpen',
      `
      const compId = (args[0] || '').trim();


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
      const location = player.location;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You unlock and open locker ' + compId + '.',
          others: player.name + ' unlocks and opens a locker.',
        });
      }

      // Trigger plot hooks
      await self.triggerPlotHooks('opened', {
        compartment: compId,
        player: player,
        playerName: player.name,
        usedOneTimeCode: result.usedOneTime || false,
        code: result.codeUsed || null,
      });

      if (result.usedOneTime) {
        await self.triggerPlotHooks('oneTimeCodeUsed', {
          compartment: compId,
          player: player,
          playerName: player.name,
          code: result.codeUsed,
        });
      }

      return await self.describeCompartment(compId, player);
    `,
    );

    // doClose - close and lock a compartment
    obj.setMethod(
      'doClose',
      `
      const compId = ((args[0] || '').trim().split(/s+/)[0]) || '';


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
      const location = player.location;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You close and lock locker ' + compId + '.',
          others: player.name + ' closes and locks a locker.',
        });
      }

      // Trigger plot hooks
      await self.triggerPlotHooks('closed', {
        compartment: compId,
        player: player,
        playerName: player.name,
      });

      return 'Compartment ' + compId + ' is now locked.';
    `,
    );

    // doSetCode - set master code (owner only)
    obj.setMethod(
      'doSetCode',
      `
      const compId = ((args[0] || '').trim().split(/s+/)[0]) || '';


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
    `,
    );

    // doGetCode - generate one-time code (owner only)
    obj.setMethod(
      'doGetCode',
      `
      const compId = ((args[0] || '').trim().split(/s+/)[0]) || '';


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
    `,
    );

    // doCheck - view status (owner only)
    obj.setMethod(
      'doCheck',
      `
      const compId = ((args[0] || '').trim().split(/s+/)[0]) || '';


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
    `,
    );

    // doRelease - give up ownership
    obj.setMethod(
      'doRelease',
      `
      const compId = ((args[0] || '').trim().split(/s+/)[0]) || '';


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
    `,
    );

    // doRenew - extend rental period
    obj.setMethod(
      'doRenew',
      `
      const compId = ((args[0] || '').trim().split(/s+/)[0]) || '';


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
    `,
    );

    // doLook - look at locker bank or specific compartment
    obj.setMethod(
      'doLook',
      `
      const compId = ((args[0] || '').trim().split(/s+/)[0]) || '';


      if (compId) {
        return await self.describeCompartment(compId, player);
      }

      return await self.describe();
    `,
    );

    // doPut - put item in compartment
    obj.setMethod(
      'doPut',
      `
      /** Store an item in a locker compartment.
       *  Usage: put <item> in locker <compartment>
       *  Example: put apple in locker A1
       */
      const item = args[0];
      const compId = ((args[1] || '').trim().split(/s+/)[0]) || '';


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
      const location = player.location;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You put ' + item.name + ' in locker ' + compId + '.',
          others: player.name + ' puts something in a locker.',
        });
      }

      return 'You put ' + item.name + ' in compartment ' + compId + '.';
    `,
    );

    // doGet - take an item from a compartment
    obj.setMethod(
      'doGet',
      `
      /** Take something out of a locker compartment.
       *  Usage: get from locker <compartment>
       *  Notes:
       *  - If multiple items are inside, you'll be prompted to choose.
       */
      const compId = ((args[0] || '').trim().split(/s+/)[0]) || '';

      if (!player) return 'Get what?';
      if (!compId) return 'Which compartment?';

      const comp = await self.getCompartment(compId);
      if (!comp) return 'No compartment ' + compId + '.';

      if (comp.locked) {
        return 'Compartment ' + compId + ' is locked.';
      }

      const contents = comp.contents || [];
      if (contents.length === 0) {
        return 'Compartment ' + compId + ' is empty.';
      }

      let foundItem = null;
      if (contents.length === 1) {
        foundItem = contents[0];
      } else {
        if (!$.prompt) {
          const list = contents.map((it, i) => (i + 1) + '. ' + (it?.name || 'unknown')).join(', ');
          return 'Which item? (' + list + ')';
        }

        const options = {};
        const byKey = {};
        for (let i = 0; i < contents.slice(0, 10).length; i++) {
          const it = contents[i];
          const key = String(i + 1);
          options[key] = it?.name || 'unknown';
          byKey[key] = it;
        }

        const choice = await $.prompt.choice(player, 'Take which item?', options);
        if (!choice) return 'Cancelled.';
        foundItem = byKey[choice] || null;
      }

      if (!foundItem) {
        return 'Nothing to take.';
      }


      // Remove from compartment
      const result = await self.removeContent(compId, foundItem);
      if (!result.success) {
        return result.error;
      }

      // Move to player
      foundItem.location = player.id;

      // Announce
      const location = player.location;
      if (location && location.announce) {
        await location.announce(player, null, {
          actor: 'You take ' + foundItem.name + ' from locker ' + compId + '.',
          others: player.name + ' takes something from a locker.',
        });
      }

      return 'You take ' + foundItem.name + '.';
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'rentalDurationMs',
      'Rental period in milliseconds (24 hours for courier lockers vs 7 days for base)',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Register in memory for immediate access
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'oneTimeLocker', this.obj.id);
  }
}

// Self-register
registerBuilder(OneTimeLockerBuilder);
