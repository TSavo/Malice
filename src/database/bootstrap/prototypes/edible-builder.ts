import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Edible prototype
 * Base prototype for consumable items that provide calories (food, drink, etc.)
 * Inherits from Decayable - all edibles can decay/spoil over time.
 *
 * Edible items have:
 * - calories: How many calories this provides when consumed
 * - portions: How many portions to consume it (1 = consume whole)
 * - remaining: How many portions left
 * - spoiled: Whether it has gone bad (set automatically when decayed)
 * - poisoned: Whether it is poisoned
 *
 * Decay (1 tick = 1 minute):
 * - decayCondition: 'harvested' - decay starts when harvested from source
 * - decayRate: 0.01% per tick (food rots in ~7 days)
 * - Refrigeration: 0.2x rate (5x longer = 35 days)
 * - Freezing: 0x rate (no decay)
 * - When decay reaches 25%, item starts to spoil
 * - When decay reaches 50%, item provides 0 calories
 * - When decay reaches 100%, item is garbage (negative calories)
 *
 * Subclasses: Food, Drink, etc.
 * The subclasses provide the consume verb (eat for Food, drink for Drink)
 */
export class EdibleBuilder {
  constructor(private manager: ObjectManager) {}

  async build(decayableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: decayableId,
      properties: {
        name: 'Edible',
        description: 'Base prototype for consumable items',
        // Nutrition
        calories: 100, // kcal per whole item
        hydration: 20, // ml water equivalent (most food has some water)
        // Consumption
        portions: 1, // Total portions to consume
        remaining: 1, // Portions left (starts full)
        // Status
        spoiled: false,
        poisoned: false,
        // Status effects applied when consumed
        // Each effect: { intensity, decay } - applied per portion
        // e.g., { sedation: { intensity: 10, decay: 0.3 }, euphoria: { intensity: 5, decay: 0.5 } }
        effects: {},
        // Physical - default small item
        width: 5, // cm
        height: 5,
        depth: 5,
        weight: 100, // grams
        volume: 100, // ml (defaults to weight - water is 1g/ml)
        // Decay overrides for food (1 tick = 1 minute)
        // 7 days = 10080 ticks, 100% / 10080 = ~0.01% per tick
        decayCondition: 'harvested', // Start decay when harvested
        decayRate: 0.01, // ~7 days to fully rot at room temp
        harvested: false, // Set to true when picked/harvested
        // Storage sensitivity - refrigerated is 5x longer
        storageSensitivity: {
          refrigerated: 0.2, // 20% of normal rate (5x longer)
          frozen: 0, // No decay
          vacuum: 0.3, // 30% of normal rate
          heated: 3.0, // 3x decay (warm food spoils fast)
          preserved: 0, // No decay (salt, vinegar, etc.)
        },
      },
      methods: {},
    });

    // Get calories per portion, factoring in decay
    // Fresh = full calories, 50% decay = 0 calories, 100% decay = negative calories
    obj.setMethod('getCaloriesPerPortion', `
      /** Calculate calories per portion, adjusted for decay.
       *  - Fresh (0% decay): full calories
       *  - 50% decay: 0 calories (rotting, nutrients destroyed)
       *  - 100% decay: negative calories (toxic, causes harm)
       *  @returns Adjusted calories (can be negative)
       */
      const totalCal = self.calories || 100;
      const totalPortions = self.portions || 1;
      const baseCal = Math.ceil(totalCal / totalPortions);

      // Get decay level from Decayable parent
      const decayLevel = self.decayLevel || 0;

      // Linear scale: 0% decay = 100% calories, 50% = 0%, 100% = -100%
      // Formula: calories * (1 - decay/50)
      // At 0%: 1 - 0 = 1.0 (100%)
      // At 25%: 1 - 0.5 = 0.5 (50%)
      // At 50%: 1 - 1 = 0 (0%)
      // At 75%: 1 - 1.5 = -0.5 (-50%)
      // At 100%: 1 - 2 = -1.0 (-100%)
      const decayMultiplier = 1 - (decayLevel / 50);
      return Math.round(baseCal * decayMultiplier);
    `);

    // Get volume per portion (ml)
    obj.setMethod('getVolumePerPortion', `
      const totalVolume = self.volume || self.weight || 100;
      const totalPortions = self.portions || 1;
      return Math.ceil(totalVolume / totalPortions);
    `);

    // Get hydration per portion (ml water equivalent)
    obj.setMethod('getHydrationPerPortion', `
      const totalHydration = self.hydration || 0;
      const totalPortions = self.portions || 1;
      return Math.ceil(totalHydration / totalPortions);
    `);

    // Consume a portion - returns calories consumed or error
    // Handles weight reduction, stomach transfer, and recycling when fully consumed
    obj.setMethod('consume', `
      const consumer = args[0]; // The human consuming this
      const sourceType = args[1] || 'food'; // 'food', 'drink', etc.

      if (self.remaining <= 0) {
        return { error: 'There is nothing left.' };
      }

      // Calculate volume for this bite and check stomach capacity FIRST
      const biteVolume = await self.getVolumePerPortion();
      if (consumer) {
        const torso = consumer.getTorso ? await consumer.getTorso() : null;
        if (torso) {
          const stomach = torso.getPart ? await torso.getPart('digestiveStomach') : null;
          if (stomach && stomach.hasRoomFor) {
            const hasRoom = await stomach.hasRoomFor(biteVolume);
            if (!hasRoom) {
              return { error: 'Your stomach is too full.' };
            }
          }
        }
      }

      // Check if spoiled/poisoned based on decay level
      const warnings = [];
      const decayLevel = self.decayLevel || 0;
      // Spoilage starts at 25% decay (per Edible design)
      if (decayLevel >= 25 || self.spoiled) {
        warnings.push('spoiled');
      }
      if (self.poisoned) {
        warnings.push('poisoned');
      }

      // Calculate calories for this portion
      const caloriesPerPortion = await self.getCaloriesPerPortion();

      // Reduce remaining portions
      const totalPortions = self.portions || 1;
      self.remaining = (self.remaining || 1) - 1;

      // Update weight proportionally
      const originalWeight = self.originalWeight || self.weight || 100;
      if (!self.originalWeight) {
        self.originalWeight = originalWeight;
      }
      const containerWeight = self.containerWeight || 0; // For drinks with containers
      const consumableWeight = originalWeight - containerWeight;
      const remainingRatio = self.remaining / totalPortions;
      self.weight = containerWeight + Math.round(consumableWeight * remainingRatio);

      // Check if fully consumed
      const fullyConsumed = self.remaining <= 0;

      // Calculate hydration for this bite
      const hydrationPerPortion = await self.getHydrationPerPortion();

      // Send THIS BITE's calories and volume to stomach
      // Also restore hydration directly to body (water absorbs fast)
      if (consumer) {
        const torso = consumer.getTorso ? await consumer.getTorso() : null;
        if (torso) {
          const stomach = torso.getPart ? await torso.getPart('digestiveStomach') : null;
          if (stomach) {
            await self.sendBiteToStomach(stomach, sourceType, caloriesPerPortion);
          }

          // Restore hydration directly to body (water absorbs quickly)
          if (hydrationPerPortion !== 0) {
            const body = await consumer.getBody();
            if (body) {
              const currentHydration = body.hydration ?? 100;
              const maxHydration = body.maxHydration || 100;
              // Hydration can be negative (alcohol dehydrates)
              const newHydration = Math.max(0, Math.min(maxHydration, currentHydration + hydrationPerPortion));
              body.hydration = newHydration;
            }
          }
        }
      }

      // Apply status effects from this item
      const appliedEffects = [];
      const itemEffects = self.effects || {};
      if (consumer && consumer.addEffect) {
        for (const [effectName, effectData] of Object.entries(itemEffects)) {
          // Scale effect by portion (divide by total portions)
          const totalPortions = self.portions || 1;
          const effectIntensity = (effectData.intensity || 0) / totalPortions;
          const effectDecay = effectData.decay ?? 0.5;

          if (effectIntensity > 0) {
            await consumer.addEffect(effectName, effectIntensity, effectDecay);
            appliedEffects.push({ name: effectName, intensity: effectIntensity });
          }
        }
      }

      // When fully consumed, recycle the food item
      if (fullyConsumed) {
        const recycler = $.recycler;
        if (recycler && recycler.recycle) {
          await recycler.recycle(self);
        }
      }

      return {
        calories: caloriesPerPortion,
        hydration: hydrationPerPortion,
        effects: appliedEffects,
        warnings,
        fullyConsumed,
        remaining: self.remaining,
      };
    `);

    // Check if there's any left
    obj.setMethod('hasRemaining', `
      return (self.remaining || 0) > 0;
    `);

    // Send a single bite's calories and volume to stomach
    // Creates/aggregates StomachContents for this food type
    obj.setMethod('sendBiteToStomach', `
      const stomach = args[0]; // The digestive stomach
      const sourceType = args[1] || 'food'; // 'food', 'drink', etc.
      const biteCalories = args[2] || 0; // Calories for THIS bite only

      if (!stomach) {
        return { error: 'No stomach to send to.' };
      }

      // Calculate volume for this bite
      const biteVolume = await self.getVolumePerPortion();

      // Check if stomach has room for this bite
      if (stomach.hasRoomFor) {
        const hasRoom = await stomach.hasRoomFor(biteVolume);
        if (!hasRoom) {
          return { error: 'Your stomach is too full.' };
        }
      }

      // Get prototype ID for aggregation
      let protoId = self.parent;

      const stomachContentsProto = $.stomachContents;
      if (!stomachContentsProto) {
        return { error: 'StomachContents prototype not found.' };
      }

      // Check for existing compatible contents in stomach (aggregate by food type)
      const existingContents = stomach.contents || [];
      let aggregated = false;
      let contents = null;

      for (const id of existingContents) {
        const existing = await $.load(id);
        if (!existing) continue;

        // Aggregate if same food prototype and same spoiled/poisoned state
        const isSpoiled = (self.decayLevel || 0) >= 25 || self.spoiled;
        if (existing.sourceProto === protoId &&
            existing.spoiled === isSpoiled &&
            existing.poisoned === (self.poisoned || false)) {
          // Add this bite's calories and volume to existing
          existing.calories = (existing.calories || 0) + biteCalories;
          existing.caloriesOriginal = (existing.caloriesOriginal || 0) + biteCalories;
          existing.volume = (existing.volume || 0) + biteVolume;
          existing.volumeOriginal = (existing.volumeOriginal || 0) + biteVolume;
          contents = existing;
          aggregated = true;
          break;
        }
      }

      if (!aggregated) {
        // Create new StomachContents for this food type
        const isSpoiled = (self.decayLevel || 0) >= 25 || self.spoiled;
        contents = await $.recycler.create($.skeleton, {
          name: 'skeleton of ' + (self.originalName || 'unknown'),
          description: 'A skeleton that was once ' + (self.originalName || 'someone') + '.',
          contents: self.contents || [],
          owner: self.owner,
          decayLevel: 100,
          decayRate: 0,
          decayCondition: 'none',
        });


        // Add to stomach contents
        await contents.moveTo(stomach.id);
      }

      return { contents, aggregated, calories: biteCalories, volume: biteVolume };
    `);

    // Send this edible to stomach as StomachContents (DEPRECATED - use sendBiteToStomach)
    // Creates StomachContents object with metadata, handles aggregation
    // Returns the StomachContents object (new or aggregated)
    obj.setMethod('sendToStomach', `
      const stomach = args[0]; // The digestive stomach
      const sourceType = args[1] || 'food'; // 'food', 'drink', 'pill', etc.

      if (!stomach) {
        return { error: 'No stomach to send to.' };
      }

      // Get prototype ID for aggregation (walk up to first non-instance prototype)
      let protoId = self.parent;

      // Create StomachContents object
      const stomachContentsProto = $.stomachContents;
      if (!stomachContentsProto) {
        return { error: 'StomachContents prototype not found.' };
      }

      // Check for existing compatible contents in stomach
      const existingContents = stomach.contents || [];
      let aggregated = false;
      let contents = null;

      for (const id of existingContents) {
        const existing = await $.load(id);
        if (!existing) continue;

        // Check if same source prototype and compatible
        const isSpoiled = (self.decayLevel || 0) >= 25 || self.spoiled;
        if (existing.sourceProto === protoId &&
            existing.spoiled === isSpoiled &&
            existing.poisoned === (self.poisoned || false)) {
          // Aggregate into existing contents
          existing.calories = (existing.calories || 0) + (self.calories || 0);
          existing.caloriesOriginal = (existing.caloriesOriginal || 0) + (self.calories || 0);
          existing.quantity = (existing.quantity || 1) + 1;
          contents = existing;
          aggregated = true;
          break;
        }
      }

      if (!aggregated) {
        // Create new StomachContents
        const isSpoiled = (self.decayLevel || 0) >= 25 || self.spoiled;
        contents = await $.recycler.create($.humanRemains, {
          name: 'remains of ' + (self.originalName || 'unknown'),
          description: 'The remains of ' + (self.originalName || 'someone') + '. Dried tissue clings to the bones.',
          contents: self.contents || [],
          owner: self.owner,
          decayLevel: 70,
          decayRate: 0.0005,
          decayCondition: 'always',
          decayStart: Date.now(),
        });


        // Add to stomach contents
        await contents.moveTo(stomach.id);
      }

      return { contents, aggregated };
    `);

    // Describe with consumption status
    obj.setMethod('describe', `
      let desc = self.name + '\\r\\n' + self.description;

      const portions = self.portions || 1;
      const remaining = self.remaining || 0;

      if (portions > 1) {
        const statusMsg = await $.proportional.sub(
          ['It has been completely consumed.', 'It has been mostly consumed.', 'It has been partially consumed.', 'It is mostly whole.', 'It is whole.'],
          remaining,
          portions
        );
        desc += '\\r\\n' + statusMsg;
      }

      // Show decay state based on decayLevel
      const decayLevel = self.decayLevel || 0;
      if (decayLevel >= 75) {
        desc += '\\r\\nIt is severely rotted and looks dangerous to eat.';
      } else if (decayLevel >= 50) {
        desc += '\\r\\nIt is clearly rotten.';
      } else if (decayLevel >= 25) {
        desc += '\\r\\nIt looks a bit off - starting to spoil.';
      } else if (decayLevel > 0) {
        desc += '\\r\\nIt looks slightly past its prime.';
      }

      if (self.poisoned) {
        desc += '\\r\\nSomething about it seems wrong...';
      }

      return desc;
    `);

    return obj;
  }
}
