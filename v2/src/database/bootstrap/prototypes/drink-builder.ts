import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Drink prototype
 * Inherits from Edible, provides the 'drink' verb
 *
 * Drink is consumed by drinking, which:
 * 1. Takes a sip (via Edible.takeBite)
 * 2. When fully consumed, moves to stomach for digestion
 * 3. Stomach digests over time and releases calories
 */
export class DrinkBuilder {
  constructor(private manager: ObjectManager) {}

  async build(edibleId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: edibleId,
      properties: {
        name: 'Drink',
        description: 'Base prototype for liquid consumables',
        // Typical drink calories
        calories: 50,
        // Drink-specific properties
        portions: 5, // Takes 5 sips to drink
        remaining: 5,
        // Typical drink container size
        width: 7,
        height: 15,
        depth: 7,
        weight: 300, // grams (with liquid)
        // Drink-specific
        containerWeight: 50, // Weight of empty container
      },
      methods: {},
    });

    // The drink verb - registered when drink is in player's inventory or room
    // Pattern: drink %t (this drink) - player drinks self
    obj.setMethod('drink', `
      const context = args[0];
      const drinker = args[1]; // The player drinking

      if (!drinker) {
        return 'Drink what?';
      }

      // Check if drinker is holding this drink or it's accessible
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

      // If not holding, check if in same location
      if (!holdingDrink) {
        if (self.location !== drinker.location && self.location !== drinker.id) {
          return 'You need to pick that up first.';
        }
      }

      // Consume a sip (Edible handles weight, stomach, and recycling)
      const result = await self.consume(drinker, 'drink');

      if (result.error) {
        return result.error;
      }

      // Process warnings
      let warnMsg = '';
      if (result.warnings.includes('spoiled')) {
        warnMsg += ' It tastes off...';
        // TODO: Apply spoiled drink effects
      }
      if (result.warnings.includes('poisoned')) {
        warnMsg += ' A strange taste lingers...';
        // TODO: Apply poison effects
      }

      // Build response message
      let msg = 'You take a sip of ' + self.name + '.';
      if (result.fullyConsumed) {
        msg = 'You finish drinking ' + self.name + '.';
      }

      if (warnMsg) {
        msg += warnMsg;
      }

      // Announce to room
      const location = drinker.location ? await $.load(drinker.location) : null;
      if (location && location.announce) {
        const drinkMsg = result.fullyConsumed
          ? await $.pronoun.sub('%N finishes drinking %t.', drinker, null, null, self)
          : await $.pronoun.sub('%N takes a sip of %t.', drinker, null, null, self);
        await location.announce(drinkMsg, drinker);
      }

      return msg;
    `);

    // Shorthand: sip is same as drink
    obj.setMethod('sip', `
      return await self.drink(args[0], args[1]);
    `);

    // Override onArrived to register drink verb when picked up or entering room
    obj.setMethod('onArrived', `
      const dest = args[0];
      const source = args[1];
      const mover = args[2];

      // If arriving in a player's hand, register the drink verb
      if (dest && dest.owner) {
        const owner = await $.load(dest.owner);
        if (owner && owner.registerVerb) {
          await owner.registerVerb(['drink ' + self.name, 'drink %t', 'sip ' + self.name, 'sip %t'], self, 'drink');
        }
      }

      // If arriving in a room with a player, they can see it to drink
      if (dest && dest.contents) {
        for (const id of dest.contents) {
          const obj = await $.load(id);
          if (obj && obj.registerVerb) {
            await obj.registerVerb(['drink ' + self.name, 'drink %t', 'sip ' + self.name, 'sip %t'], self, 'drink');
          }
        }
      }
    `);

    // Override describe to show liquid level
    obj.setMethod('describe', `
      let desc = self.name + '\\\\r\\\\n' + self.description;

      const portions = self.portions || 1;
      const remaining = self.remaining || 0;

      if (portions > 1) {
        const levelMsg = await $.proportional.sub(
          ['It is empty.', 'It is almost empty.', 'It is about half full.', 'It is mostly full.', 'It is full.'],
          remaining,
          portions
        );
        desc += '\\\\r\\\\n' + levelMsg;
      }

      if (self.spoiled) {
        desc += '\\\\r\\\\nIt looks spoiled.';
      }

      return desc;
    `);

    return obj;
  }
}
