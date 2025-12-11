import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Stackable prototype
 * Physical goods that can be combined and split.
 * Enables commodity-based value transfer outside the banking system.
 *
 * Examples:
 * - cash:usd, cash:mxn (illegal physical currency)
 * - drug:synth, drug:stim
 * - ammo:9mm, ammo:shotgun
 * - scrap:copper, scrap:steel
 *
 * Key behaviors:
 * - Auto-merge: When arriving in a location, finds matching stacks and combines
 * - Splittable: Can peel off a quantity into a new stack
 * - Integer quantities only (no fractions)
 */
export class StackableBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: parentId,
      properties: {
        name: 'Stackable',
        description: 'A quantity of something.',
        // What type of stackable (e.g., "cash:usd", "ammo:9mm", "drug:synth")
        stackType: null,
        // How much (integer only)
        quantity: 0,
        // Display unit (e.g., "USD", "rounds", "g", "oz")
        unit: '',
        // Contraband flag - illegal to possess
        contraband: false,
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // CORE STACK OPERATIONS
    // ═══════════════════════════════════════════════════════════════════

    // canStackWith(other) - check if two stacks can merge
    obj.setMethod('canStackWith', `
      const other = args[0];

      if (!other) return false;
      if (!self.stackType || !other.stackType) return false;

      return self.stackType === other.stackType;
    `);

    // merge(other) - combine quantities, recycle the other stack
    obj.setMethod('merge', `
      const other = args[0];

      if (!other) {
        return { success: false, error: 'Nothing to merge.' };
      }

      if (!await self.canStackWith(other)) {
        return { success: false, error: 'Cannot stack different types.' };
      }

      const otherQty = other.quantity || 0;
      if (otherQty <= 0) {
        return { success: false, error: 'Nothing to merge.' };
      }

      // Add to our quantity
      self.quantity = (self.quantity || 0) + otherQty;

      // Recycle the other stack
      const recycler = $.recycler;
      if (recycler) {
        await recycler.recycle(other);
      }

      return { success: true, quantity: self.quantity };
    `);

    // split(amount) - create a new stack with the given amount
    obj.setMethod('split', `
      const amount = args[0];

      // Validate amount
      if (amount === undefined || amount === null) {
        return { success: false, error: 'Amount required.' };
      }

      if (typeof amount !== 'number' || !Number.isInteger(amount)) {
        return { success: false, error: 'Amount must be an integer.' };
      }

      if (amount <= 0) {
        return { success: false, error: 'Amount must be positive.' };
      }

      const currentQty = self.quantity || 0;
      if (amount > currentQty) {
        return { success: false, error: 'Not enough to split.', available: currentQty };
      }

      if (amount === currentQty) {
        return { success: false, error: 'Cannot split entire stack. Just move it.' };
      }

      // Create new stack
      const recycler = $.recycler;
      if (!recycler) {
        return { success: false, error: 'Cannot create new stack.' };
      }

      const newStack = await recycler.create({
        parent: self.id,  // Inherit from same prototype chain
        properties: {
          name: self.name,
          description: self.description,
          stackType: self.stackType,
          quantity: amount,
          unit: self.unit,
          contraband: self.contraband,
        },
      });

      // Reduce our quantity
      self.quantity = currentQty - amount;

      // Place new stack in same location
      if (self.location) {
        newStack.location = self.location;
      }

      return { success: true, newStack: newStack, remaining: self.quantity };
    `);

    // ═══════════════════════════════════════════════════════════════════
    // AUTO-MERGE ON ARRIVAL
    // ═══════════════════════════════════════════════════════════════════

    // onArrived - check for matching stacks and merge
    obj.setMethod('onArrived', `
      const dest = args[0];
      const source = args[1];
      const mover = args[2];

      if (!dest || !dest.contents) return;

      // Look for other stacks of same type
      for (const objId of dest.contents) {
        if (objId === self.id) continue;  // Skip self

        const other = await $.load(objId);
        if (!other) continue;

        // Check if it's a matching stack
        if (await self.canStackWith(other)) {
          // Merge into the existing stack (other absorbs us)
          await other.merge(self);
          return;  // We've been recycled, stop
        }
      }
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════

    // describe - show quantity and type
    obj.setMethod('describe', `
      const qty = self.quantity || 0;
      const unit = self.unit || '';
      const type = self.stackType || 'unknown';

      let desc = self.name || 'Stack';
      desc += '\\r\\n';

      // Format quantity with unit
      if (unit) {
        desc += qty + ' ' + unit;
      } else {
        desc += qty + ' units';
      }

      if (self.contraband) {
        desc += ' [CONTRABAND]';
      }

      if (self.description && self.description !== 'A quantity of something.') {
        desc += '\\r\\n' + self.description;
      }

      return desc;
    `);

    // shortDesc - brief description for lists
    obj.setMethod('shortDesc', `
      const qty = self.quantity || 0;
      const unit = self.unit || '';
      const name = self.name || 'stack';

      if (unit) {
        return qty + ' ' + unit + ' ' + name;
      }
      return qty + 'x ' + name;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════

    // isEmpty - check if stack is empty (should be recycled)
    obj.setMethod('isEmpty', `
      return (self.quantity || 0) <= 0;
    `);

    // add(amount) - increase quantity (for creation/spawning)
    obj.setMethod('add', `
      const amount = args[0];

      if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
        return { success: false, error: 'Amount must be a positive integer.' };
      }

      self.quantity = (self.quantity || 0) + amount;
      return { success: true, quantity: self.quantity };
    `);

    // remove(amount) - decrease quantity, return success
    obj.setMethod('remove', `
      const amount = args[0];

      if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
        return { success: false, error: 'Amount must be a positive integer.' };
      }

      const current = self.quantity || 0;
      if (amount > current) {
        return { success: false, error: 'Not enough.', available: current };
      }

      self.quantity = current - amount;

      // If empty, should be recycled by caller
      return { success: true, quantity: self.quantity, empty: self.quantity === 0 };
    `);

    return obj;
  }
}
