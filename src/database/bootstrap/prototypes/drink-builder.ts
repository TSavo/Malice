import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the Drink type
 * Inherits from Edible. Liquid consumed by drinking.
 *
 * ABILITIES-FIRST ARCHITECTURE:
 * - Abilities describe drinking physics as prose for AI interpretation
 * - No verb registration - AI interprets "drink X" and calls drink() method
 * - The drink() method is infrastructure that handles state changes
 * - AI determines if drinking is possible based on abilities
 */
export class DrinkBuilder implements Builder {
  static provides = ['drink'];
  static depends = ['edible'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('drink');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const edible = await this.manager.load('edible');
      if (!edible) {
        throw new Error('Edible type not found - required for Drink');
      }

      this.obj = await this.manager.define('drink', edible, {
        properties: {
        name: 'Drink',
        description: 'Base type for liquid consumables',
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
        // Abilities - liquid consumption physics for AI interpretation
        abilities: `Liquid in a container that is consumed by drinking.

DRINKING: Liquid must be in a container (cup, bottle, glass). Bring container to mouth, tilt to pour liquid in, swallow. Each sip consumes one portion. Use 'remaining' to track sips left.

CONTAINER: Drinks require a vessel. The container persists after drinking (empty bottle remains). 'containerWeight' is the weight of the empty vessel.

POURING: Liquids can be poured from one container to another. Can be poured out onto ground or objects. Poured liquid spills and is lost unless caught.

SPILLING: Dropping or tipping a drink container spills the liquid. Hot drinks cause burns. Cold drinks cause shock. Spilled drinks leave puddles.

MIXING: Different liquids can be combined by pouring together. May create new effects or flavors. Some combinations are dangerous (poison + water dilutes).

HYDRATION: Drinks primarily restore hydration, not calories. Water has 0 calories but high hydration. Alcoholic drinks dehydrate despite being liquid.

TO CONSUME: Call consume(drinker, 'drink') method. It handles hydration, calorie transfer, weight reduction, and recycling when container is empty.`,
      },
      methods: {},
    });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    // Add property descriptions
    obj.setPropertyDescription(
      'containerWeight',
      'Weight in grams of the empty container. Subtracted from weight to get liquid weight.',
    );
    obj.setPropertyDescription(
      'portions',
      'Number of sips to finish this drink. Larger containers have more portions.',
    );
    obj.setPropertyDescription(
      'remaining',
      'Sips left. Each drink action reduces by 1. At 0, liquid is consumed.',
    );

    // The drink verb - registered when drink is in player's inventory or room
    // Pattern: drink %t (this drink) - player drinks self
    obj.setMethod(
      'drink',
      `
      // Args from verb pattern 'drink %t':
      //   args[0] = handler (the drink, same as self) - from %t
      // Direct variables:
      //   player = the player executing the command
      //   self = this drink object
      const drinker = player; // The player executing the command

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

      // Announce to room with proper message structure
      const location = drinker.location || null;
      if (location && location.announce) {
        const othersMsg = result.fullyConsumed
          ? await $.pronoun.sub('%N finishes drinking %t.', drinker, null, null, self)
          : await $.pronoun.sub('%N takes a sip of %t.', drinker, null, null, self);
        await location.announce(drinker, null, { others: othersMsg });
      }

      return msg;
    `,
    );

    // Shorthand: sip is same as drink
    obj.setMethod(
      'sip',
      `
      return await self.drink(args[0], args[1]);
    `,
    );

    // ABILITIES-FIRST: No verb registration needed.
    // AI interprets player intent and calls drink() method directly.
    // The onArrived hook from parent ($describable) handles location tracking.

    // Override describe to show liquid level
    obj.setMethod(
      'describe',
      `
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
    `,
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    console.log('[DrinkBuilder] Type \'drink\' auto-aliased');
  }
}

// Self-register
registerBuilder(DrinkBuilder);
