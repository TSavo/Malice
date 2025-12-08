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
        // Consumption
        portions: 1, // Total portions to consume
        remaining: 1, // Portions left (starts full)
        // Status
        spoiled: false,
        poisoned: false,
        // Physical - default small item
        width: 5, // cm
        height: 5,
        depth: 5,
        weight: 100, // grams
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

    // Consume a portion - returns calories consumed or error
    // Handles weight reduction, stomach transfer, and recycling when fully consumed
    obj.setMethod('consume', `
      const consumer = args[0]; // The human consuming this
      const sourceType = args[1] || 'food'; // 'food', 'drink', etc.

      if (self.remaining <= 0) {
        return { error: 'There is nothing left.' };
      }

      // Check if spoiled/poisoned
      const warnings = [];
      if (self.spoiled) {
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
        self.set('originalWeight', originalWeight);
      }
      const containerWeight = self.containerWeight || 0; // For drinks with containers
      const consumableWeight = originalWeight - containerWeight;
      const remainingRatio = self.remaining / totalPortions;
      self.set('weight', containerWeight + Math.round(consumableWeight * remainingRatio));

      // Check if fully consumed
      const fullyConsumed = self.remaining <= 0;

      // Send THIS BITE's calories to stomach immediately
      if (consumer) {
        const torso = consumer.getTorso ? await consumer.getTorso() : null;
        if (torso) {
          const stomach = torso.getPart ? await torso.getPart('digestiveStomach') : null;
          if (stomach) {
            // Send partial calories for this bite (not full food)
            await self.sendBiteToStomach(stomach, sourceType, caloriesPerPortion);
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
        warnings,
        fullyConsumed,
        remaining: self.remaining,
      };
    `);

    // Check if there's any left
    obj.setMethod('hasRemaining', `
      return (self.remaining || 0) > 0;
    `);

    // Send a single bite's calories to stomach
    // Creates/aggregates StomachContents for this food type
    obj.setMethod('sendBiteToStomach', `
      const stomach = args[0]; // The digestive stomach
      const sourceType = args[1] || 'food'; // 'food', 'drink', etc.
      const biteCalories = args[2] || 0; // Calories for THIS bite only

      if (!stomach) {
        return { error: 'No stomach to send to.' };
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
        if (existing.sourceProto === protoId &&
            existing.spoiled === (self.spoiled || false) &&
            existing.poisoned === (self.poisoned || false)) {
          // Add this bite's calories to existing
          existing.set('calories', (existing.calories || 0) + biteCalories);
          existing.set('caloriesOriginal', (existing.caloriesOriginal || 0) + biteCalories);
          contents = existing;
          aggregated = true;
          break;
        }
      }

      if (!aggregated) {
        // Create new StomachContents for this food type
        contents = await $.create({
          parent: stomachContentsProto,
          properties: {
            sourceName: self.name || 'unknown',
            sourceProto: protoId,
            sourceType: sourceType,
            calories: biteCalories,
            caloriesOriginal: biteCalories,
            quantity: 1,
            spoiled: self.spoiled || false,
            poisoned: self.poisoned || false,
          },
        });

        // Add to stomach contents
        await contents.moveTo(stomach.id);
      }

      return { contents, aggregated, calories: biteCalories };
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
        if (existing.sourceProto === protoId &&
            existing.spoiled === (self.spoiled || false) &&
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
        contents = await $.create({
          parent: stomachContentsProto,
          properties: {
            sourceName: self.name || 'unknown',
            sourceProto: protoId,
            sourceType: sourceType,
            calories: self.calories || 0,
            caloriesOriginal: self.calories || 0,
            quantity: 1,
            spoiled: self.spoiled || false,
            poisoned: self.poisoned || false,
          },
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

      if (self.spoiled) {
        desc += '\\r\\nIt looks spoiled.';
      }

      return desc;
    `);

    return obj;
  }
}
