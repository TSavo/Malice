import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds the $.cash utility object
 * Singleton utility for cash operations across player inventory.
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * - Abilities describe how to use this utility for AI interpretation
 * - AI calls these methods when handling cash transactions
 */
export class CashBuilder {
  constructor(private manager: ObjectManager) {}

  async build(): Promise<RuntimeObject> {
    const root = await this.manager.load(1);
    const obj = await this.manager.create({
      parent: root!, // Root object
      properties: {
        name: 'Cash Utility',
        description: 'Utility object for cash operations',
        // Abilities - cash handling for AI interpretation
        abilities: `Utility for handling physical cash (contraband US dollars) on players.

FINDING CASH: Call find(player) to locate all cash on a player.
Returns { total: amount, stacks: [{item, location, quantity}] }.
Searches hands first, then pockets in worn clothing.

CHECKING: Call has(player, amount) to check if player has enough cash. Returns boolean.

TAKING: Call take(player, amount) to remove cash from player.
Returns { success, taken, message }. Fails if insufficient funds.
Automatically recycles empty stacks.

GIVING: Call give(player, amount) to add cash to player.
Returns { success, location, message }. Adds to existing stack if found, otherwise creates new in free hand or pocket.

TRANSFERRING: Call transfer(from, to, amount) to move cash between players.
Atomic - if give fails, refunds the take.

NOTE: Physical cash is contraband. Possession is illegal. Use $bank for legal credit transactions.`,
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // FIND CASH
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'find',
      `
      /** Find all cash on a player.
       *  @param player - The player to search
       *  @returns { total: number, stacks: [{item, location, quantity}] }
       */
      const player = args[0];
      if (!player) return { total: 0, stacks: [] };

      const stacks = [];
      let total = 0;

      // Helper to check contents for cash
      const checkContents = (container) => {
        const contents = container.contents || [];
        for (const item of contents) {
          if (item && item.stackType === 'cash:usd') {
            const qty = item.quantity || 0;
            stacks.push({ item, location: container, quantity: qty });
            total += qty;
          }
        }
      };

      // 1. Check hands
      if (player.getHands) {
        const hands = await player.getHands();
        if (hands.primary) checkContents(hands.primary);
        if (hands.secondary) checkContents(hands.secondary);
      }

      // 2. Check pockets in worn clothing
      if (player.getWornItems) {
        const wornItems = await player.getWornItems();
        for (const { item: worn } of wornItems) {
          const pockets = worn.pockets || [];
          for (const pocket of pockets) {
            if (pocket) checkContents(pocket);
          }
        }
      }

      return { total, stacks };
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // HAS CASH
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'has',
      `
      /** Check if player has at least a certain amount of cash.
       *  @param player - The player to check
       *  @param amount - The amount needed
       *  @returns boolean
       */
      const player = args[0];
      const amount = args[1] || 0;

      const found = await self.find(player);
      return found.total >= amount;
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // TAKE CASH
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'take',
      `
      /** Take cash from a player.
       *  Modifies stack quantities directly, recycles empty stacks.
       *  @param player - The player to take from
       *  @param amount - The amount to take
       *  @returns { success, taken, message }
       */
      const player = args[0];
      const amount = args[1] || 0;

      if (amount <= 0) {
        return { success: true, taken: 0, message: 'Nothing to take.' };
      }

      const found = await self.find(player);

      if (found.total < amount) {
        return {
          success: false,
          taken: 0,
          message: 'Insufficient cash. Need $' + amount + ', have $' + found.total + '.',
        };
      }

      let remaining = amount;

      for (const { item, location, quantity } of found.stacks) {
        if (remaining <= 0) break;

        if (quantity <= remaining) {
          // Take entire stack - recycle it
          remaining -= quantity;

          // Remove from container
          if (location && location.removeContent) {
            await location.removeContent(item);
          }

          // Recycle the item
          if ($.recycler && $.recycler.recycle) {
            await $.recycler.recycle(item);
          }
        } else {
          // Take partial - just reduce quantity
          item.quantity = quantity - remaining;
          remaining = 0;
        }
      }

      return {
        success: true,
        taken: amount,
        message: 'Took $' + amount + '.',
      };
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // GIVE CASH
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'give',
      `
      /** Give cash to a player/target.
       *  Tries to add to existing stack, otherwise creates new.
       *  @param target - The player/entity to give cash to
       *  @param amount - The amount to give
       *  @returns { success, location, message }
       */
      const target = args[0];
      const amount = args[1] || 0;

      if (amount <= 0) {
        return { success: true, location: null, message: 'Nothing to give.' };
      }

      // First, look for existing cash stacks to add to
      const found = await self.find(target);

      if (found.stacks.length > 0) {
        // Add to first existing stack
        const { item, location } = found.stacks[0];
        item.quantity = (item.quantity || 0) + amount;
        return {
          success: true,
          location: location,
          message: 'Added $' + amount + ' to existing cash.',
        };
      }

      // No existing cash - need to create new stack and place it

      // Try hands first
      let targetLocation = null;

      if (target.getHands) {
        const hands = await target.getHands();

        // Try primary hand
        if (hands.primary) {
          const canContain = await hands.primary.canContain({ weight: 10, stackType: 'cash:usd' });
          if (canContain === true) {
            targetLocation = hands.primary;
          }
        }

        // Try secondary hand
        if (!targetLocation && hands.secondary) {
          const canContain = await hands.secondary.canContain({ weight: 10, stackType: 'cash:usd' });
          if (canContain === true) {
            targetLocation = hands.secondary;
          }
        }
      }

      // Try pockets
      if (!targetLocation && target.getWornItems) {
        const wornItems = await target.getWornItems();
        for (const { item: worn } of wornItems) {
          const pockets = worn.pockets || [];
          for (const pocket of pockets) {
            if (pocket) {
              const canContain = await pocket.canContain({ weight: 10, stackType: 'cash:usd' });
              if (canContain === true) {
                targetLocation = pocket;
                break;
              }
            }
          }
          if (targetLocation) break;
        }
      }

      if (!targetLocation) {
        return {
          success: false,
          location: null,
          message: 'No place to put the cash (hands full, no pockets).',
        };
      }

      // Create the cash stack
      if (!$.recycler || !$.dollar) {
        return {
          success: false,
          location: null,
          message: 'Cash system unavailable.',
        };
      }

      const cash = await $.recycler.create({
        parent: $.dollar,
        properties: {
          quantity: amount,
          location: targetLocation,
        },
      });

      // Add to container
      if (targetLocation.addContent) {
        await targetLocation.addContent(cash);
      }

      const locationName = targetLocation.name || 'inventory';
      return {
        success: true,
        location: targetLocation,
        message: 'Placed $' + amount + ' in ' + locationName + '.',
      };
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // TRANSFER CASH
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'transfer',
      `
      /** Transfer cash from one player to another.
       *  @param from - The player to take from
       *  @param to - The player to give to
       *  @param amount - The amount to transfer
       *  @returns { success, message }
       */
      const from = args[0];
      const to = args[1];
      const amount = args[2] || 0;

      if (amount <= 0) {
        return { success: true, message: 'Nothing to transfer.' };
      }

      // Take from source
      const takeResult = await self.take(from, amount);
      if (!takeResult.success) {
        return { success: false, message: takeResult.message };
      }

      // Give to target
      const giveResult = await self.give(to, amount);
      if (!giveResult.success) {
        // Refund! Give back to source
        await self.give(from, amount);
        return { success: false, message: giveResult.message };
      }

      return {
        success: true,
        message: 'Transferred $' + amount + '.',
      };
    `,
    );

    return obj;
  }
}
