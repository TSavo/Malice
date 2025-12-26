import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Pocket prototype
 * A container that attaches to clothing for storing small items.
 *
 * Pockets are created by clothing builders and attached to clothing items.
 * They have weight and volume limits for what they can hold.
 *
 * Usage:
 *   const pocket = await $.recycler.create({
 *     parent: $.pocket,
 *     properties: {
 *       name: 'left pocket',
 *       maxWeight: 500,
 *       maxVolume: 500,
 *     }
 *   });
 *   jacket.pockets = [pocket];
 *   pocket.attachedTo = jacket;
 */
export class PocketBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(describableId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Pocket',
        description: 'A pocket sewn into clothing',
        aliases: ['pocket'],

        // Capacity limits
        maxWeight: 500, // grams
        maxVolume: 500, // cubic cm

        // What clothing this pocket is part of
        attachedTo: null, // ObjRef to clothing item

        // contents: [] inherited from describable

        abilities: `Container attached to clothing for storing small items.

CAPACITY: 'maxWeight' (grams) and 'maxVolume' (cubic cm) limit what fits. canContain() checks both.

ATTACHED: 'attachedTo' points to parent clothing. Pocket goes with the garment.

CONCEALMENT: Contents are hidden from casual observation. Requires searching to find. Good for hiding contraband.

ACCESS: Put/take items via standard container mechanics. Quick access for wearer.

BULGE: Overloading pockets makes them visibly bulge. Heavy items sag. Can be noticed.

HOLES: Damaged pockets may have holes. Items can fall out unnoticed.

TYPES: Side pockets, breast pocket, back pocket, cargo pocket. Different sizes and access.`,
      },
      methods: {},
    });

    // ═══════════════════════════════════════════════════════════════════
    // CONTAINMENT
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('canContain', `
      /** Check if this pocket can hold an object.
       *  @param obj - The object to check
       *  @returns true if allowed, or error string
       */
      const item = args[0];
      if (!item) return 'Nothing to put in pocket.';

      const maxWeight = self.maxWeight || 500;
      const maxVolume = self.maxVolume || 500;
      const contents = self.contents || [];

      // Calculate current weight
      let currentWeight = 0;
      for (const c of contents) {
        if (c) currentWeight += c.weight || 0;
      }

      // Calculate current volume
      let currentVolume = 0;
      for (const c of contents) {
        if (c && c.getVolume) {
          currentVolume += await c.getVolume();
        } else if (c) {
          // Fallback: estimate from dimensions or use weight as proxy
          currentVolume += (c.width || 0) * (c.height || 0) * (c.depth || 0) || c.weight || 0;
        }
      }

      // Check item weight
      const itemWeight = item.weight || 0;
      if (currentWeight + itemWeight > maxWeight) {
        return 'That is too heavy for this pocket.';
      }

      // Check item volume
      let itemVolume = 0;
      if (item.getVolume) {
        itemVolume = await item.getVolume();
      } else {
        itemVolume = (item.width || 0) * (item.height || 0) * (item.depth || 0) || item.weight || 0;
      }

      if (currentVolume + itemVolume > maxVolume) {
        return 'That is too bulky for this pocket.';
      }

      return true;
    `);

    // ═══════════════════════════════════════════════════════════════════
    // DISPLAY
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('describe', `
      /** Describe the pocket and its contents. */
      const contents = self.contents || [];
      
      if (contents.length === 0) {
        return self.name + ' (empty)';
      }

      const itemNames = [];
      for (const item of contents) {
        if (item) {
          if (item.shortDesc) {
            itemNames.push(await item.shortDesc());
          } else {
            itemNames.push(item.name || 'something');
          }
        }
      }

      if (itemNames.length === 0) {
        return self.name + ' (empty)';
      }

      return self.name + ' containing ' + itemNames.join(', ');
    `);

    obj.setMethod('shortDesc', `
      /** Short description for lists. */
      const contents = self.contents || [];
      const count = contents.filter(c => c).length;
      
      if (count === 0) {
        return self.name + ' (empty)';
      } else if (count === 1) {
        return self.name + ' (1 item)';
      } else {
        return self.name + ' (' + count + ' items)';
      }
    `);

    // ═══════════════════════════════════════════════════════════════════
    // UTILITY
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod('getRemainingCapacity', `
      /** Get remaining weight and volume capacity.
       *  @returns { weight: number, volume: number }
       */
      const maxWeight = self.maxWeight || 500;
      const maxVolume = self.maxVolume || 500;
      const contents = self.contents || [];

      let usedWeight = 0;
      let usedVolume = 0;

      for (const c of contents) {
        if (c) {
          usedWeight += c.weight || 0;
          if (c.getVolume) {
            usedVolume += await c.getVolume();
          } else {
            usedVolume += (c.width || 0) * (c.height || 0) * (c.depth || 0) || c.weight || 0;
          }
        }
      }

      return {
        weight: maxWeight - usedWeight,
        volume: maxVolume - usedVolume,
      };
    `);

    obj.setPropertyDescription('maxWeight', 'Maximum weight capacity in grams. Items exceeding this cannot be placed in pocket.');
    obj.setPropertyDescription('maxVolume', 'Maximum volume capacity in cubic centimeters. Prevents oversized items from fitting.');
    obj.setPropertyDescription('attachedTo', 'The clothing item this pocket is sewn into. Pocket moves with the garment.');

    return obj;
  }
}
