import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Edible prototype
 * Base prototype for consumable items that provide calories (food, drink, etc.)
 *
 * Edible items have:
 * - calories: How many calories this provides when consumed
 * - portions: How many portions to consume it (1 = consume whole)
 * - remaining: How many portions left
 * - spoiled: Whether it has gone bad
 * - poisoned: Whether it is poisoned
 *
 * Subclasses: Food, Drink, etc.
 * The subclasses provide the consume verb (eat for Food, drink for Drink)
 */
export class EdibleBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
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
      },
      methods: {},
    });

    // Get calories per portion
    obj.setMethod('getCaloriesPerPortion', `
      const totalCal = self.calories || 100;
      const totalPortions = self.portions || 1;
      return Math.ceil(totalCal / totalPortions);
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

      // When fully consumed, send to stomach and recycle
      if (fullyConsumed && consumer) {
        // Get the consumer's stomach
        const torso = consumer.getTorso ? await consumer.getTorso() : null;
        if (torso) {
          const stomach = torso.getPart ? await torso.getPart('digestiveStomach') : null;
          if (stomach) {
            // Create/aggregate StomachContents
            await self.sendToStomach(stomach, sourceType);
          }
        }

        // Recycle the consumed item
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

    // Send this edible to stomach as StomachContents
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
