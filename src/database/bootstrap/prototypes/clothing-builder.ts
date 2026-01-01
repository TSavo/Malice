import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the Clothing type
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
export class ClothingBuilder implements Builder {
  static provides = ['clothing'];
  static depends = ['wearable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('clothing');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const wearable = await this.manager.load('wearable');
      if (!wearable) {
        throw new Error('Wearable type not found - required for Clothing');
      }

      this.obj = await this.manager.define('clothing', wearable, {
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
        // Pockets - array of $.pocket ObjRefs (empty by default)
        pockets: [],

        abilities: `Wearable fabric garment for covering body.

WEARING: doWear(player) equips on body. doRemove(player) takes off and places in hand or drops.

MATERIAL: 'material' (cotton, wool, leather, synthetic) affects warmth, durability, water resistance.

COLOR: 'color' for appearance. Can be dyed/stained. Blood stains are incriminating.

CONDITION: 'condition' (0-100) degrades with wear and damage. Ragged clothing provides less warmth. Can be repaired.

POCKETS: 'pockets' array contains $.pocket objects. Pockets store small items. Access via getPocket(name).

CONCEALMENT: Items in pockets are hidden from casual observation. Searched to find.

BLOOD/STAINS: Combat can stain clothing. Evidence of violence. Wash or destroy to remove.

FIRE: Most fabrics burn. Fire damage destroys clothing, may injure wearer.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!

    // Wear this clothing item (AI calls this directly)
    obj.setMethod(
      'doWear',
      `
      /** Wear this clothing item.
       *  @param wearer - The agent wearing the item (defaults to player)
       *  @returns Message string or error
       */
      const wearer = args[0] || player;

      if (!wearer) {
        return 'Wear what?';
      }

      // Use the parent wear() method
      const result = await self.wear(wearer);

      if (!result.success) {
        return result.error || 'You cannot wear that.';
      }

      // Announce to room with proper message structure
      const location = wearer.location || null;
      if (location && location.announce) {
        const othersMsg = await $.pronoun.sub('%N puts on %t.', wearer, null, null, self);
        await location.announce(wearer, null, { others: othersMsg });
      }

      return result.message;
    `,
    );

    // Remove clothing - AI calls this directly
    obj.setMethod(
      'doRemove',
      `
      /** Remove this clothing item.
       *  @param wearer - The agent removing the item (defaults to player)
       *  @returns Message string or error
       */
      const wearer = args[0] || player;

      if (!wearer) {
        return 'Remove what?';
      }

      // Use the parent remove() method
      const result = await self.remove(wearer);

      if (!result.success) {
        return result.error || 'You cannot remove that.';
      }

      // Move clothing to wearer's hand
      const hands = await wearer.getHands();
      let placed = false;

      // Try primary hand first
      if (hands.primary && hands.primary.addContent) {
        const canHold = await hands.primary.canContain(self);
        if (canHold !== false) {
          await self.moveTo(hands.primary);
          placed = true;
        }
      }

      // Try secondary hand
      if (!placed && hands.secondary && hands.secondary.addContent) {
        const canHold = await hands.secondary.canContain(self);
        if (canHold !== false) {
          await self.moveTo(hands.secondary);
          placed = true;
        }
      }

      // Drop to ground if hands are full
      if (!placed && wearer.location) {
        const room = wearer.location;
        if (room) {
          await self.moveTo(room);
        }
      }

      // Announce to room with proper message structure
      const loc = wearer.location || null;
      if (loc && loc.announce) {
        const othersMsg = await $.pronoun.sub('%N takes off %t.', wearer, null, null, self);
        await loc.announce(wearer, null, { others: othersMsg });
      }

      return result.message;
    `,
    );

    // Hook called when clothing arrives somewhere
    obj.setMethod(
      'onArrived',
      `
      /** Called when this clothing arrives somewhere.
       *  Can be used for location-based effects.
       */
      const dest = args[0];
      const source = args[1];
      const mover = args[2];
      // No verb registration - AI handles wear/remove commands directly
    `,
    );

    // Hook called when clothing leaves somewhere
    obj.setMethod(
      'onLeaving',
      `
      /** Called when this clothing is about to leave somewhere.
       *  Can be used for cleanup effects.
       */
      const source = args[0];
      const dest = args[1];
      const mover = args[2];
      // No verb unregistration - AI handles wear/remove commands directly
    `,
    );

    // Override describe to include material and color
    obj.setMethod(
      'describe',
      `
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
        desc += 'Currently worn by: ' + self.wornBy.name + '\\r\\n';
      }

      return desc.trim();
    `,
    );

    // ═══════════════════════════════════════════════════════════════════
    // POCKET ACCESS
    // ═══════════════════════════════════════════════════════════════════

    obj.setMethod(
      'getPocket',
      `
      /** Find a pocket by name (case-insensitive partial match).
       *  @param name - The pocket name to search for (e.g., "left", "right pocket")
       *  @returns The pocket object, or null if not found
       */
      const searchName = (args[0] || '').toLowerCase().trim();
      const pockets = self.pockets || [];

      if (pockets.length === 0) return null;

      // Try exact match first
      for (const pocket of pockets) {
        if (pocket && pocket.name && pocket.name.toLowerCase() === searchName) {
          return pocket;
        }
      }

      // Try partial match (contains)
      for (const pocket of pockets) {
        if (pocket && pocket.name && pocket.name.toLowerCase().includes(searchName)) {
          return pocket;
        }
      }

      // Try matching just "left" or "right"
      for (const pocket of pockets) {
        if (pocket && pocket.name) {
          const pocketName = pocket.name.toLowerCase();
          if (searchName.includes('left') && pocketName.includes('left')) {
            return pocket;
          }
          if (searchName.includes('right') && pocketName.includes('right')) {
            return pocket;
          }
        }
      }

      return null;
    `,
    );

    obj.setMethod(
      'listPockets',
      `
      /** Get descriptions of all pockets.
       *  @returns Array of pocket descriptions
       */
      const pockets = self.pockets || [];
      const descriptions = [];

      for (const pocket of pockets) {
        if (pocket && pocket.describe) {
          descriptions.push(await pocket.describe());
        } else if (pocket && pocket.name) {
          descriptions.push(pocket.name);
        }
      }

      return descriptions;
    `,
    );

    obj.setPropertyDescription(
      'material',
      'Fabric type (cotton, wool, leather, synthetic). Affects warmth, durability, and water resistance.',
    );
    obj.setPropertyDescription(
      'color',
      'Color of the garment. Can be dyed or stained. Blood stains are incriminating evidence.',
    );
    obj.setPropertyDescription(
      'condition',
      'Wear condition (0-100). Degrades with use and damage. Low condition reduces warmth and can be repaired.',
    );
    obj.setPropertyDescription(
      'pockets',
      'Array of pocket objects attached to this garment. Use getPocket(name) to access.',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[ClothingBuilder] Type 'clothing' auto-aliased`);
  }
}

// Self-register
registerBuilder(ClothingBuilder);
