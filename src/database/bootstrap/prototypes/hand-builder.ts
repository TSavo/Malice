import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Hand prototype
 * Specialized body part that can hold items
 */
export class HandBuilder {
  constructor(private manager: ObjectManager) {}

  async build(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Hand',
        description: 'A hand',
        bones: ['wrist', 'metacarpals', 'phalanges'],
        coverable: true,
        removable: true,
        critical: false,
        maxCapacity: 1, // How many items this hand can hold (1 = single item, or 0.5 for two-handed)
      },
      methods: {},
    });

    // Hand can contain items, but limited capacity
    obj.setMethod('canContain', `
      const obj = args[0];

      // Check if we already have something
      const contents = self.contents || [];
      if (contents.length > 0) {
        return 'Your hand is already holding something.';
      }

      // Check if the item requires two hands
      if (obj.twoHanded) {
        // This is handled by the holdInHands method on the body
        return true;
      }

      return true;
    `);

    // Check if hand is free
    obj.setMethod('isFree', `
      return (self.contents || []).length === 0;
    `);

    // Get what this hand is holding
    obj.setMethod('getHeld', `
      const contents = self.contents || [];
      if (contents.length > 0) {
        return await $.load(contents[0]);
      }
      return null;
    `);

    // Drop what's in this hand
    obj.setMethod('drop', `
      const destination = args[0]; // Where to drop it
      const held = await self.getHeld();
      if (!held) {
        return 'Your hand is empty.';
      }
      await held.moveTo(destination);
      return held;
    `);

    return obj;
  }
}
