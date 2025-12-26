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
    const parentObj = await this.manager.load(drinkId);
    const obj = await this.manager.create({
      parent: parentObj!,
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

        abilities: `Sealed bottle of purified water. Cheap, essential hydration.

SEALED: 'sealed' true = no decay, can't drink. Must open() first. Breaking seal enables decay.

HYDRATION: Pure water, no calories. 500ml 'hydration'. 5 'portions' - each sip restores some hydration.

CONSUMPTION: drink() takes a sip if open. Shows fullness via $.proportional.

DECAY: Once opened, 'openedDecayRate' kicks in (~23 days). Sealed bottles last indefinitely.

VERBS: 'drink water', 'open bottle'. Registered when picked up or in room.

ECONOMY: 'basePrice' 1 credit. Ubiquitous vending machine item.`,
      },
      methods: {},
    });

    // Override drink to handle sealed bottles
    obj.setMethod('drink', `
      // Args from verb pattern 'drink %t':
      //   args[0] = handler (the drink, same as self) - from %t
      // Direct variables:
      //   player = the player executing the command
      const drinker = player;

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
      const location = drinker.location || null;
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
      // Args from verb pattern 'open %t':
      //   args[0] = handler (the bottle, same as self) - from %t
      // Direct variables:
      //   player = the player executing the command
      const opener = player;

      if (!self.sealed) {
        return 'The bottle is already open.';
      }

      self.sealed = false;
      self.decayRate = self.openedDecayRate || 0.003;

      // Announce with proper message structure
      const location = opener?.location || null;
      if (location && location.announce && opener) {
        const othersMsg = await $.pronoun.sub('%N opens a bottle of water.', opener);
        await location.announce(opener, null, { others: othersMsg });
      }

      return 'You twist off the cap. The seal breaks with a soft crack.';
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

    // Add property descriptions
    obj.setPropertyDescription('sealed', 'Whether the bottle is still sealed (must open before drinking, prevents decay)');
    obj.setPropertyDescription('openedDecayRate', 'Decay rate applied once the bottle seal is broken');
    obj.setPropertyDescription('hydration', 'Total hydration value in milliliters (500ml for standard bottle)');
    obj.setPropertyDescription('containerWeight', 'Weight of the empty bottle container in grams');

    return obj;
  }
}
