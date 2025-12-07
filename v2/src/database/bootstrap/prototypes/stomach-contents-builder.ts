import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the StomachContents prototype
 * Created when food/drink is consumed, preserves metadata for autopsy
 *
 * StomachContents:
 * - Preserves original food name, type, and source prototype
 * - Aggregates similar items (3 apples = 1 contents with 3x calories)
 * - Tracks digestion progress
 * - Can be identified during autopsy
 *
 * Aggregation key: sourceProto (the prototype ID of the original food)
 * Two apple instances with same prototype = aggregate together
 */
export class StomachContentsBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'StomachContents',
        description: 'Digesting food matter',
        // Source tracking
        sourceName: '', // Original food name (e.g., "apple")
        sourceProto: 0, // Original food prototype ID (for aggregation)
        sourceType: '', // 'food', 'drink', 'pill', etc.
        // Nutrition to extract
        calories: 0, // Total calories remaining
        caloriesOriginal: 0, // Original calories (for % digested)
        // Aggregation
        quantity: 1, // How many of this item were eaten
        // Status
        spoiled: false,
        poisoned: false,
      },
      methods: {},
    });

    // Check if this can aggregate with another StomachContents
    // Returns true if they have the same sourceProto
    obj.setMethod('canAggregateWith', `
      const other = args[0];
      if (!other) return false;

      // Must be same source prototype
      if (self.sourceProto !== other.sourceProto) return false;

      // Must have same status (both spoiled or both not, etc.)
      if (self.spoiled !== other.spoiled) return false;
      if (self.poisoned !== other.poisoned) return false;

      return true;
    `);

    // Aggregate another StomachContents into this one
    obj.setMethod('aggregate', `
      const other = args[0];
      if (!other) return false;

      if (!await self.canAggregateWith(other)) return false;

      // Combine calories and quantity
      self.calories = (self.calories || 0) + (other.calories || 0);
      self.caloriesOriginal = (self.caloriesOriginal || 0) + (other.caloriesOriginal || 0);
      self.quantity = (self.quantity || 1) + (other.quantity || 1);

      return true;
    `);

    // Extract calories during digestion (one tick)
    // Returns calories extracted
    obj.setMethod('digestTick', `
      const rate = args[0] || 50; // Calories per tick

      const remaining = self.calories || 0;
      if (remaining <= 0) return 0;

      const extracted = Math.min(rate, remaining);
      self.calories = remaining - extracted;

      return extracted;
    `);

    // Check if fully digested
    obj.setMethod('isFullyDigested', `
      return (self.calories || 0) <= 0;
    `);

    // Get digestion percentage
    obj.setMethod('getDigestionPercent', `
      const original = self.caloriesOriginal || 1;
      const remaining = self.calories || 0;
      const digested = original - remaining;
      return Math.round((digested / original) * 100);
    `);

    // Describe for autopsy/examination
    obj.setMethod('describe', `
      const qty = self.quantity || 1;
      const name = self.sourceName || 'unknown food';
      const percent = await self.getDigestionPercent();

      let desc = '';
      if (qty > 1) {
        desc = qty + ' servings of ' + name;
      } else {
        desc = name;
      }

      // Digestion status
      if (percent >= 100) {
        desc += ' (fully digested)';
      } else if (percent >= 75) {
        desc += ' (mostly digested)';
      } else if (percent >= 50) {
        desc += ' (partially digested)';
      } else if (percent >= 25) {
        desc += ' (slightly digested)';
      } else {
        desc += ' (recently consumed)';
      }

      if (self.spoiled) {
        desc += ' [spoiled]';
      }
      if (self.poisoned) {
        desc += ' [poisoned]';
      }

      return desc;
    `);

    // Short description for lists
    obj.setMethod('shortDesc', `
      const qty = self.quantity || 1;
      const name = self.sourceName || 'unknown';
      if (qty > 1) {
        return qty + 'x ' + name;
      }
      return name;
    `);

    return obj;
  }
}
