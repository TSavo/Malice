import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Sustain prototype
 * Inherits from Food - Continuum's nutritionally complete pills
 *
 * Sustain pills are manufactured at the Fabrication Factory biofarm
 * from processed organic waste. They're cheap, efficient, and keep
 * the city's population alive. Nobody asks what's in them.
 *
 * Properties:
 * - Single portion (one pill = one dose)
 * - High caloric density for size
 * - Minimal hydration (compressed pill)
 * - No real flavor - synthetic chemical taste
 * - Cheap and ubiquitous
 */
export class SustainBuilder {
  constructor(private manager: ObjectManager) {}

  async build(foodId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: foodId,
      properties: {
        name: 'Sustain',
        description: 'A small oblong pill, pale gray with a faint chemical sheen. The Continuum logo is pressed into one side. Nutritionally complete. Best not to think about the source material.',
        aliases: ['pill', 'nutrient pill', 'ration'],
        // Nutritional properties - one pill = one meal equivalent
        calories: 400,
        hydration: 10, // Very little moisture - compressed pill
        // Single portion - swallow whole
        portions: 1,
        remaining: 1,
        // No real ingredients to taste - synthetic
        ingredients: [
          { name: 'protein complex', flavor: 'chalky' },
          { name: 'nutrient paste', flavor: 'chemical' },
          { name: 'binding agent', flavor: 'metallic' },
        ],
        // Pill dimensions (mm) and weight (g)
        width: 8,
        height: 6,
        depth: 20,
        weight: 5,
        // Economic properties
        basePrice: 2, // Credits - cheap and subsidized
        // Decay properties - pills last a long time
        decayRate: 0.1, // Very slow decay
      },
      methods: {},
    });

    // Override tasteBite for Sustain's distinctive non-taste
    obj.setMethod('tasteBite', `
      const flavors = [
        'It tastes like nothing. That\\'s the point.',
        'A chalky texture coats your tongue. You try not to think about it.',
        'The chemical aftertaste lingers. Nutritionally complete.',
        'It goes down easy. That\\'s all that matters.',
        'You taste something faintly metallic. Best not to dwell on it.',
        'Bland. Efficient. Sustaining.',
      ];
      return flavors[Math.floor(Math.random() * flavors.length)];
    `);

    // Override eat for single-pill consumption
    obj.setMethod('eat', `
      // Args from verb pattern 'eat %t':
      //   args[0] = handler (the pill, same as self) - from %t
      // Direct variables:
      //   player = the player executing the command
      const eater = player;

      if (!eater) {
        return 'Eat what?';
      }

      // Check if eater is holding this or it's accessible
      const hands = await eater.getHands();
      let holdingPill = false;
      for (const hand of hands.both) {
        if (hand) {
          const contents = hand.contents || [];
          if (contents.includes(self.id)) {
            holdingPill = true;
            break;
          }
        }
      }

      if (!holdingPill) {
        if (self.location !== eater.location && self.location !== eater.id) {
          return 'You need to pick that up first.';
        }
      }

      // Consume the whole pill at once
      const result = await self.consume(eater, 'food');

      if (result.error) {
        return result.error;
      }

      // Get flavor message
      const flavorMsg = await self.tasteBite();

      // Build response
      let msg = 'You swallow the Sustain pill.';
      if (flavorMsg) {
        msg += ' ' + flavorMsg;
      }

      // Announce to room with proper message structure
      const location = eater.location || null;
      if (location && location.announce) {
        const othersMsg = await $.pronoun.sub('%N swallows a Sustain pill.', eater);
        await location.announce(eater, null, { others: othersMsg });
      }

      return msg;
    `);

    return obj;
  }
}
