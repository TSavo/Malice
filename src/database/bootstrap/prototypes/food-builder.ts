import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Food prototype
 * Inherits from Edible, provides the 'eat' verb
 *
 * Food is consumed by eating, which:
 * 1. Takes a bite (via Edible.takeBite)
 * 2. When fully consumed, moves to stomach for digestion
 * 3. Stomach digests over time and releases calories
 */
export class FoodBuilder {
  constructor(private manager: ObjectManager) {}

  async build(edibleId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: edibleId,
      properties: {
        name: 'Food',
        description: 'Base prototype for solid food items',
        // Typical food calories
        calories: 200,
        // Food-specific properties
        portions: 4, // Takes 4 bites to eat
        remaining: 4,
        // Ingredients list - each has name and flavor
        // e.g. [{ name: 'beef', flavor: 'savory' }, { name: 'onion', flavor: 'sharp' }]
        ingredients: [],
        // Typical food size
        width: 8,
        height: 5,
        depth: 8,
        weight: 150, // grams
      },
      methods: {},
    });

    // Get a random flavor from ingredients for this bite
    obj.setMethod('tasteBite', `
      const ingredients = self.ingredients || [];
      if (ingredients.length === 0) {
        return null;
      }

      // Pick 1-2 random ingredients to taste this bite
      const count = Math.min(ingredients.length, Math.random() < 0.5 ? 1 : 2);
      const shuffled = [...ingredients].sort(() => Math.random() - 0.5);
      const tasted = shuffled.slice(0, count);

      if (tasted.length === 1) {
        return 'You taste ' + tasted[0].flavor + ' ' + tasted[0].name + '.';
      } else {
        return 'You taste ' + tasted[0].flavor + ' ' + tasted[0].name + ' and ' + tasted[1].flavor + ' ' + tasted[1].name + '.';
      }
    `);

    // The eat verb - registered when food is in player's inventory or room
    // Pattern: eat %t (this food) - player eats self
    obj.setMethod('eat', `
      const context = args[0];
      const eater = args[1]; // The player eating

      if (!eater) {
        return 'Eat what?';
      }

      // Check if eater is holding this food or it's accessible
      const hands = await eater.getHands();
      let holdingFood = false;
      for (const hand of hands.both) {
        if (hand) {
          const contents = hand.contents || [];
          if (contents.includes(self.id)) {
            holdingFood = true;
            break;
          }
        }
      }

      // If not holding, check if in same location
      if (!holdingFood) {
        if (self.location !== eater.location && self.location !== eater.id) {
          return 'You need to pick that up first.';
        }
      }

      // Consume a bite (Edible handles weight, stomach, and recycling)
      const result = await self.consume(eater, 'food');

      if (result.error) {
        return result.error;
      }

      // Process warnings
      let warnMsg = '';
      if (result.warnings.includes('spoiled')) {
        warnMsg += ' It tastes off...';
        // TODO: Apply spoiled food effects
      }
      if (result.warnings.includes('poisoned')) {
        warnMsg += ' A strange taste lingers...';
        // TODO: Apply poison effects
      }

      // Get flavor from ingredients
      const flavorMsg = await self.tasteBite();

      // Build response message
      let msg = 'You take a bite of ' + self.name + '.';
      if (result.fullyConsumed) {
        msg = 'You finish eating ' + self.name + '.';
      }

      // Add flavor description
      if (flavorMsg) {
        msg += ' ' + flavorMsg;
      }

      if (warnMsg) {
        msg += warnMsg;
      }

      // Announce to room
      const location = eater.location ? await $.load(eater.location) : null;
      if (location && location.announce) {
        const eatMsg = result.fullyConsumed
          ? await $.pronoun.sub('%N finishes eating %t.', eater, null, null, self)
          : await $.pronoun.sub('%N takes a bite of %t.', eater, null, null, self);
        await location.announce(eatMsg, eater);
      }

      return msg;
    `);

    // Override onArrived to register eat verb when picked up or entering room
    obj.setMethod('onArrived', `
      const dest = args[0];
      const source = args[1];
      const mover = args[2];

      // If arriving in a player's hand, register the eat verb
      if (dest && dest.owner) {
        const owner = await $.load(dest.owner);
        if (owner && owner.registerVerb) {
          await owner.registerVerb(['eat ' + self.name, 'eat %t'], self, 'eat');
        }
      }

      // If arriving in a room with a player, they can see it to eat
      if (dest && dest.contents) {
        for (const id of dest.contents) {
          const obj = await $.load(id);
          if (obj && obj.registerVerb) {
            await obj.registerVerb(['eat ' + self.name, 'eat %t'], self, 'eat');
          }
        }
      }
    `);

    return obj;
  }
}
