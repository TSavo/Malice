import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Food prototype
 * Inherits from Edible. Solid food consumed by eating.
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * - Abilities describe eating physics as prose for AI interpretation
 * - No verb registration - AI interprets "eat X" and calls eat() method
 * - The eat() method is infrastructure that handles state changes
 * - AI determines if eating is possible based on abilities
 */
export class FoodBuilder {
  constructor(private manager: ObjectManager) {}

  async build(edibleId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(edibleId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Food',
        description: 'Base prototype for solid food items',
        // Typical food nutrition
        calories: 200,
        hydration: 50, // ml water equivalent - solid food has some moisture
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
        // Abilities - solid food physics for AI interpretation
        abilities: `Solid food that must be chewed and swallowed.

EATING: Food must be accessible - in hand, on table, or in reach. Bring food to mouth, bite off portion, chew thoroughly, swallow. Each bite consumes one portion. Use 'remaining' to track bites left.

HOLDING: Food is typically held in one hand while eating. Messy foods may require both hands or utensils. Some foods (soup, stew) need a container.

TASTE: The 'ingredients' array lists components with flavors. Eating reveals flavor notes. Spoilage adds off-tastes. Poison may have bitter/chemical taste.

SHARING: Food with multiple portions can be shared - one person takes bites while another waits. Or food can be split/cut into pieces.

CHOKING HAZARD: Eating too fast or while talking risks choking. Large bites harder to swallow. Unconscious people cannot eat safely.

TO CONSUME: Call consume(eater, 'food') method. It handles calorie transfer to stomach, weight reduction, portion tracking, and recycling when empty.`,
      },
      methods: {},
    });

    // Add property descriptions
    obj.setPropertyDescription('ingredients', "Array of {name, flavor} objects. Each bite may reveal different flavors.");
    obj.setPropertyDescription('portions', "Number of bites to finish this food. Larger foods have more portions.");
    obj.setPropertyDescription('remaining', "Bites left. Each eat action reduces by 1. At 0, food is consumed.");

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
      // Args from verb pattern 'eat %t':
      //   args[0] = handler (the food, same as self) - from %t
      // Direct variables:
      //   player = the player executing the command
      //   self = this food object
      const eater = player; // The player executing the command

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

      // Process warnings and apply effects
      let warnMsg = '';
      if (result.warnings.includes('spoiled')) {
        warnMsg += ' It tastes off...';
        // Spoiled food: chance of nausea based on how spoiled
        const decayLevel = self.decayLevel || 0;
        const nauseaChance = Math.min(0.8, decayLevel / 100); // Up to 80% at full rot
        if (Math.random() < nauseaChance) {
          // Nausea - lose some of what you just ate
          const torso = eater.getTorso ? await eater.getTorso() : null;
          if (torso) {
            const stomach = torso.getPart ? await torso.getPart('digestiveStomach') : null;
            if (stomach && stomach.contents) {
              // Reduce calories in stomach by 10-50%
              const lossPercent = 0.1 + (Math.random() * 0.4);
              for (const item of stomach.contents) {
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
        const body = await eater.getBody();
        if (body) {
          const torso = await body.getPart('torso');
          if (torso) {
            // Damage torso directly (bypasses calories, goes to decay)
            const currentDecay = torso.decayLevel || 0;
            const poisonDamage = 5 + Math.floor(Math.random() * 10); // 5-15% decay
            torso.decayLevel = Math.min(100, currentDecay + poisonDamage);

            // Chance of sedation (50% chance, 1-3 sedation level)
            if (Math.random() < 0.5) {
              const currentSedation = eater.sedation || 0;
              eater.sedation = currentSedation + 1 + Math.floor(Math.random() * 3);
              warnMsg += ' You feel woozy...';
            }
          }
        }
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

      // Announce to room with proper message structure
      const location = eater.location || null;
      if (location && location.announce) {
        const othersMsg = result.fullyConsumed
          ? await $.pronoun.sub('%N finishes eating %t.', eater, null, null, self)
          : await $.pronoun.sub('%N takes a bite of %t.', eater, null, null, self);
        await location.announce(eater, null, { others: othersMsg });
      }

      return msg;
    `);

    // ABILITIES-FIRST: No verb registration needed.
    // AI interprets player intent and calls eat() method directly.
    // The onArrived hook from parent ($describable) handles location tracking.

    return obj;
  }
}
