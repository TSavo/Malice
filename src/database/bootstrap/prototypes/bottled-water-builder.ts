import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the BottledWater prototype
 * Inherits from Drink - sealed water bottles
 *
 * Basic hydration sold throughout the city. Continuum-branded
 * water sourced from the municipal purification system. Sealed
 * bottles last indefinitely until opened.
 */
export class BottledWaterBuilder {
  constructor(private manager: ObjectManager) {}

  async build(drinkId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: drinkId,
      properties: {
        name: 'Bottled Water',
        description: 'A clear plastic bottle of purified water. The Continuum logo is embossed on the cap. 500ml of municipal tap, filtered and sealed.',
        aliases: ['water', 'water bottle', 'bottle'],
        // Pure water - no calories, maximum hydration
        calories: 0,
        hydration: 500, // ml - full bottle
        // Standard bottle
        portions: 5,
        remaining: 5,
        // Bottle dimensions (mm) and weight (g)
        width: 65,
        height: 200,
        depth: 65,
        weight: 520, // 500ml water + 20g bottle
        containerWeight: 20,
        // Economic properties
        basePrice: 1, // Credit - cheap and essential
        // Sealed bottles don't decay until opened
        decayRate: 0, // No decay while sealed
        sealed: true,
        // When opened, normal decay applies
        openedDecayRate: 0.003, // ~23 days once opened
      },
      methods: {},
    });

    // Override drink to handle sealed bottles
    obj.setMethod('drink', `
      const context = args[0];
      const drinker = args[1];

      if (!drinker) {
        return 'Drink what?';
      }

      // Check if sealed - need to open first
      if (self.sealed) {
        return 'The bottle is sealed. You need to open it first.';
      }

      // Check if drinker is holding this or it's accessible
      const hands = await drinker.getHands();
      let holdingDrink = false;
      for (const hand of hands.both) {
        if (hand) {
          const contents = hand.contents || [];
          if (contents.includes(self.id)) {
            holdingDrink = true;
            break;
          }
        }
      }

      if (!holdingDrink) {
        if (self.location !== drinker.location && self.location !== drinker.id) {
          return 'You need to pick that up first.';
        }
      }

      // Consume a sip
      const result = await self.consume(drinker, 'drink');

      if (result.error) {
        return result.error;
      }

      // Build response
      let msg = 'You drink some water.';
      if (result.fullyConsumed) {
        msg = 'You finish the bottle of water.';
      }

      // Announce to room with proper message structure
      const location = drinker.location ? await $.load(drinker.location) : null;
      if (location && location.announce) {
        const othersMsg = result.fullyConsumed
          ? await $.pronoun.sub('%N finishes a bottle of water.', drinker)
          : await $.pronoun.sub('%N drinks some water.', drinker);
        await location.announce(drinker, null, { others: othersMsg });
      }

      return msg;
    `);

    // Open the bottle
    obj.setMethod('open', `
      const context = args[0];
      const opener = args[1];

      if (!self.sealed) {
        return 'The bottle is already open.';
      }

      self.sealed = false;
      self.decayRate = self.openedDecayRate || 0.003;

      // Announce with proper message structure
      const location = opener?.location ? await $.load(opener.location) : null;
      if (location && location.announce && opener) {
        const othersMsg = await $.pronoun.sub('%N opens a bottle of water.', opener);
        await location.announce(opener, null, { others: othersMsg });
      }

      return 'You twist off the cap. The seal breaks with a soft crack.';
    `);

    // Register open verb when acquired
    obj.setMethod('onArrived', `
      const dest = args[0];
      const source = args[1];
      const mover = args[2];

      // Register verbs with the owner
      if (dest && dest.owner) {
        const owner = await $.load(dest.owner);
        if (owner && owner.registerVerb) {
          await owner.registerVerb(['drink ' + self.name, 'drink water', 'drink %t'], self, 'drink');
          if (self.sealed) {
            await owner.registerVerb(['open ' + self.name, 'open water', 'open bottle', 'open %t'], self, 'open');
          }
        }
      }

      // If arriving in a room with players
      if (dest && dest.contents) {
        for (const id of dest.contents) {
          const obj = await $.load(id);
          if (obj && obj.registerVerb) {
            await obj.registerVerb(['drink ' + self.name, 'drink water', 'drink %t'], self, 'drink');
            if (self.sealed) {
              await obj.registerVerb(['open ' + self.name, 'open water', 'open bottle', 'open %t'], self, 'open');
            }
          }
        }
      }
    `);

    // Override describe to show sealed/open status
    obj.setMethod('describe', `
      let desc = self.name + '\\r\\n' + self.description;

      if (self.sealed) {
        desc += '\\r\\nThe cap is sealed.';
      } else {
        const portions = self.portions || 1;
        const remaining = self.remaining || 0;

        if (portions > 1) {
          const levelMsg = await $.proportional.sub(
            ['It is empty.', 'It is almost empty.', 'It is about half full.', 'It is mostly full.', 'It is full.'],
            remaining,
            portions
          );
          desc += '\\r\\n' + levelMsg;
        }
      }

      return desc;
    `);

    return obj;
  }
}
