import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Drink prototype
 * Inherits from Edible, provides the 'drink' verb
 *
 * Drink is consumed by drinking, which:
 * 1. Takes a sip (via Edible.consume)
 * 2. When fully consumed, moves to stomach for digestion
 * 3. Stomach digests over time and releases calories
 *
 * Decay (1 tick = 1 minute):
 * - decayRate: 0.005% per tick (~14 days to spoil at room temp)
 * - Drinks last longer than solid food due to less surface area
 * - Refrigeration: 5x longer (70 days)
 */
export class DrinkBuilder {
  constructor(private manager: ObjectManager) {}

  async build(edibleId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: edibleId,
      properties: {
        name: 'Drink',
        description: 'Base prototype for liquid consumables',
        // Typical drink nutrition
        calories: 50, // Some drinks have calories (juice, soda)
        hydration: 200, // ml water equivalent - drinks are very hydrating
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
        // Decay overrides - drinks last longer than food (14 days vs 7)
        // 14 days = 20160 ticks, 100% / 20160 = ~0.005% per tick
        decayRate: 0.005, // ~14 days to fully spoil at room temp
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

      // Process warnings and apply effects
      let warnMsg = '';
      if (result.warnings.includes('spoiled')) {
        warnMsg += ' It tastes off...';
        // Spoiled drink: chance of nausea based on how spoiled
        const decayLevel = self.decayLevel || 0;
        const nauseaChance = Math.min(0.8, decayLevel / 100); // Up to 80% at full rot
        if (Math.random() < nauseaChance) {
          // Nausea - lose some of what you just drank
          const torso = drinker.getTorso ? await drinker.getTorso() : null;
          if (torso) {
            const stomach = torso.getPart ? await torso.getPart('digestiveStomach') : null;
            if (stomach && stomach.contents) {
              // Reduce calories in stomach by 10-50%
              const lossPercent = 0.1 + (Math.random() * 0.4);
              for (const itemId of stomach.contents) {
                const item = await $.load(itemId);
                if (item && item.calories !== undefined) {
                  const newCal = Math.floor(item.calories * (1 - lossPercent));
                  item.calories = newCal;
                }
              }
            }
          }
          warnMsg += ' You feel nauseous...';
        }
      }
      if (result.warnings.includes('poisoned')) {
        warnMsg += ' A strange taste lingers...';
        // Poison: damage internal organs and potentially sedate
        const body = await drinker.getBody();
        if (body) {
          const torso = await body.getPart('torso');
          if (torso) {
            // Damage torso directly (bypasses calories, goes to decay)
            const currentDecay = torso.decayLevel || 0;
            const poisonDamage = 5 + Math.floor(Math.random() * 10); // 5-15% decay
            torso.decayLevel = Math.min(100, currentDecay + poisonDamage);

            // Chance of sedation (50% chance, 1-3 sedation level)
            if (Math.random() < 0.5) {
              const currentSedation = drinker.sedation || 0;
              drinker.sedation = currentSedation + 1 + Math.floor(Math.random() * 3);
              warnMsg += ' You feel woozy...';
            }
          }
        }
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
