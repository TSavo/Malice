import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Clothing prototype
 * Inherits from Wearable - clothing is wearable items.
 *
 * Clothing:
 * - Can be worn on body parts (covers slots)
 * - When held, grants the 'wear' verb to the holder
 * - When worn, grants the 'remove' verb to the wearer
 * - Provides warmth (protection from cold)
 * - May provide minimal protection (not like armor)
 *
 * Verb registration flow:
 * 1. Player picks up clothing -> onArrived registers 'wear' verb
 * 2. Player wears clothing -> wear() unregisters 'wear', registers 'remove'
 * 3. Player removes clothing -> remove() unregisters 'remove', registers 'wear'
 *
 * Subprototypes: $.shirt, $.pants, $.shoes, $.hat, etc.
 */
export class ClothingBuilder {
  constructor(private manager: ObjectManager) {}

  async build(wearableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: wearableId,
      properties: {
        name: 'Clothing',
        description: 'An article of clothing',
        // Default clothing covers torso
        covers: ['torso'],
        // Default layer - base layer (over underwear)
        layer: 2,
        // Clothing provides warmth, not protection
        warmth: 10,
        protection: 0,
        // Clothing-specific properties
        material: 'cotton', // fabric type
        color: 'white',
        condition: 100, // 0-100, degrades with wear
      },
      methods: {},
    });

    // The wear verb - registered when clothing is held
    obj.setMethod('doWear', `
      /** Wear this clothing item.
       *  Called by the verb system when player types 'wear <item>'.
       *  @param context - Command context
       *  @param wearer - The player wearing this
       *  @returns Result message
       */
      const context = args[0];
      const wearer = args[1];

      if (!wearer) {
        return 'Wear what?';
      }

      // Use the parent wear() method
      const result = await self.wear(wearer);

      if (!result.success) {
        return result.error || 'You cannot wear that.';
      }

      // Unregister the wear verb from the wearer
      if (wearer.unregisterVerbsFrom) {
        await wearer.unregisterVerbsFrom(self.id);
      }

      // Register the remove verb
      if (wearer.registerVerb) {
        await wearer.registerVerb(['remove ' + self.name, 'take off ' + self.name, 'remove %t', 'take off %t'], self, 'doRemove');
      }

      // Announce to room
      const location = wearer.location ? await $.load(wearer.location) : null;
      if (location && location.announce) {
        const msg = await $.pronoun.sub('%N puts on %t.', wearer, null, null, self);
        await location.announce(msg, wearer);
      }

      return result.message;
    `);

    // The remove verb - registered when clothing is worn
    obj.setMethod('doRemove', `
      /** Remove this clothing item.
       *  Called by the verb system when player types 'remove <item>'.
       *  @param context - Command context
       *  @param wearer - The player removing this
       *  @returns Result message
       */
      const context = args[0];
      const wearer = args[1];

      if (!wearer) {
        return 'Remove what?';
      }

      // Use the parent remove() method
      const result = await self.remove(wearer);

      if (!result.success) {
        return result.error || 'You cannot remove that.';
      }

      // Unregister the remove verb
      if (wearer.unregisterVerbsFrom) {
        await wearer.unregisterVerbsFrom(self.id);
      }

      // Move clothing to wearer's hand
      const hands = await wearer.getHands();
      let placed = false;

      // Try primary hand first
      if (hands.primary && hands.primary.addContent) {
        const canHold = await hands.primary.canContain(self);
        if (canHold !== false) {
          await hands.primary.addContent(self.id);
          self.location = hands.primary.id;
          placed = true;
        }
      }

      // Try secondary hand
      if (!placed && hands.secondary && hands.secondary.addContent) {
        const canHold = await hands.secondary.canContain(self);
        if (canHold !== false) {
          await hands.secondary.addContent(self.id);
          self.location = hands.secondary.id;
          placed = true;
        }
      }

      // Drop to ground if hands are full
      if (!placed && wearer.location) {
        const room = await $.load(wearer.location);
        if (room && room.addContent) {
          await room.addContent(self.id);
          self.location = room.id;
        }
      }

      // Register the wear verb again (via onArrived or manually)
      if (wearer.registerVerb) {
        await wearer.registerVerb(['wear ' + self.name, 'put on ' + self.name, 'wear %t', 'put on %t'], self, 'doWear');
      }

      // Announce to room
      const location = wearer.location ? await $.load(wearer.location) : null;
      if (location && location.announce) {
        const msg = await $.pronoun.sub('%N takes off %t.', wearer, null, null, self);
        await location.announce(msg, wearer);
      }

      return result.message;
    `);

    // Register wear verb when clothing arrives in a player's hand
    obj.setMethod('onArrived', `
      /** Called when this clothing arrives somewhere.
       *  Registers wear verb when arriving in a hand.
       */
      const dest = args[0];
      const source = args[1];
      const mover = args[2];

      // If arriving in a body part (hand) that has an owner
      if (dest && dest.owner) {
        const owner = await $.load(dest.owner);
        if (owner && owner.registerVerb) {
          // Only register wear if not already worn
          if (!self.wornBy) {
            await owner.registerVerb(['wear ' + self.name, 'put on ' + self.name, 'wear %t', 'put on %t'], self, 'doWear');
          }
        }
      }

      // If arriving in a room, players in the room can see it
      // but need to pick it up first to wear it
    `);

    // Unregister verbs when leaving
    obj.setMethod('onLeaving', `
      /** Called when this clothing is about to leave somewhere.
       *  Unregisters verbs from the owner.
       */
      const source = args[0];
      const dest = args[1];
      const mover = args[2];

      // If leaving a body part that has an owner
      if (source && source.owner) {
        const owner = await $.load(source.owner);
        if (owner && owner.unregisterVerbsFrom) {
          await owner.unregisterVerbsFrom(self.id);
        }
      }
    `);

    // Override describe to include material and color
    obj.setMethod('describe', `
      /** Get full description of this clothing.
       *  @returns Description string
       */
      let desc = self.name + '\\r\\n';

      // Color and material
      const color = self.color || 'plain';
      const material = self.material || 'cloth';
      desc += 'A ' + color + ' ' + material + ' garment.\\r\\n';

      if (self.description && self.description !== 'An article of clothing') {
        desc += self.description + '\\r\\n';
      }

      // Show what it covers
      const covers = self.covers || [];
      if (covers.length > 0) {
        desc += 'Covers: ' + covers.join(', ') + '\\r\\n';
      }

      // Show layer
      const layerNames = ['', 'underwear', 'base layer', 'mid layer', 'outer layer', 'outerwear'];
      const layerName = layerNames[self.layer] || 'layer ' + self.layer;
      desc += 'Layer: ' + layerName + '\\r\\n';

      // Show warmth
      if (self.warmth > 0) {
        desc += 'Warmth: ' + self.warmth + '\\r\\n';
      }

      // Show condition
      const condition = self.condition || 100;
      const conditionDesc = condition >= 90 ? 'pristine' :
                           condition >= 70 ? 'good' :
                           condition >= 50 ? 'worn' :
                           condition >= 30 ? 'tattered' : 'ragged';
      desc += 'Condition: ' + conditionDesc + '\\r\\n';

      // Show if worn
      if (self.wornBy) {
        const wearer = await $.load(self.wornBy);
        if (wearer) {
          desc += 'Currently worn by: ' + wearer.name + '\\r\\n';
        }
      }

      return desc.trim();
    `);

    return obj;
  }
}
