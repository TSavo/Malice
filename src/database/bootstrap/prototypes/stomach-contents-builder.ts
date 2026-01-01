import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the StomachContents type
 * Created when food/drink is consumed, preserves metadata for autopsy
 *
 * Inherits from stackable type:
 * - Uses stackType = 'stomach:' + sourceProto for aggregation
 * - Inherits merge(), split(), add(), remove(), isEmpty()
 * - Overrides canStackWith() to also check spoiled/poisoned status
 *
 * StomachContents:
 * - Preserves original food name, type, and source prototype
 * - Aggregates similar items (3 apples = 1 contents with 3x calories)
 * - Tracks digestion progress
 * - Can be identified during autopsy
 *
 * Aggregation key: stackType based on sourceProto + spoiled/poisoned state
 */
export class StomachContentsBuilder implements Builder {
  static provides = ['stomachContents'];
  static depends = ['stackable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('stomachContents');
    if (existing) {
      this.obj = existing;
    } else {
      const parent = await this.manager.load('stackable');
      if (!parent)
        throw new Error('StomachContentsBuilder: stackable type not found');

      this.obj = await this.manager.define('stomachContents', parent, {
        properties: {
          name: 'StomachContents',
          description: 'Digesting food matter',
          abilities: `Represents consumed food/drink in stomach, preserves metadata for autopsy.

DIGESTION: digestTick(rate) extracts calories over time. Volume decreases
proportionally. isFullyDigested() returns true when calories exhausted.

STACKING: Similar items aggregate - 3 apples become 1 contents with 3x calories.
canStackWith() checks sourceProto + spoiled/poisoned status match.

AUTOPSY: describe() reveals food name, digestion %, spoiled/poisoned status.
Forensic evidence of poisoning survives in stomach contents.

POISONING: 'spoiled' causes food poisoning. 'poisoned' is deliberate toxin.
Both flags preserved through digestion for evidence.`,
          // Stackable properties
          // stackType is set dynamically: 'stomach:<sourceProto>:<spoiled>:<poisoned>'
          stackType: null,
          quantity: 1, // How many of this item were eaten (inherited from stackable)
          unit: 'servings',
          contraband: false,
          // Source tracking
          sourceName: '', // Original food name (e.g., "apple")
          sourceProto: 0, // Original food prototype ID
          sourceType: '', // 'food', 'drink', 'pill', etc.
          // Nutrition to extract
          calories: 0, // Total calories remaining
          caloriesOriginal: 0, // Original calories (for % digested)
          // Volume tracking (for stomach capacity)
          volume: 0, // ml - current volume in stomach
          volumeOriginal: 0, // ml - original volume consumed
          // Status
          spoiled: false,
          poisoned: false,
        },
        methods: {},
      });
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj!;

    // Override canStackWith to also check spoiled/poisoned status
    // This extends the parent stackable's stackType check
    obj.setMethod(
      'canStackWith',
      `
      const other = args[0];
      if (!other) return false;

      // Must be same source prototype
      if (self.sourceProto !== other.sourceProto) return false;

      // Must have same status (both spoiled or both not, etc.)
      if (self.spoiled !== other.spoiled) return false;
      if (self.poisoned !== other.poisoned) return false;

      return true;
    `,
    );

    // Alias for backward compatibility
    obj.setMethod(
      'canAggregateWith',
      `
      return await self.canStackWith(args[0]);
    `,
    );

    // Override merge to also combine calories and volume
    obj.setMethod(
      'merge',
      `
      const other = args[0];

      if (!other) {
        return { success: false, error: 'Nothing to merge.' };
      }

      if (!await self.canStackWith(other)) {
        return { success: false, error: 'Cannot stack different food types or states.' };
      }

      const otherQty = other.quantity || 1;

      // Combine calories, volume, and quantity
      self.calories = (self.calories || 0) + (other.calories || 0);
      self.caloriesOriginal = (self.caloriesOriginal || 0) + (other.caloriesOriginal || 0);
      self.volume = (self.volume || 0) + (other.volume || 0);
      self.volumeOriginal = (self.volumeOriginal || 0) + (other.volumeOriginal || 0);
      self.quantity = (self.quantity || 1) + otherQty;

      // Recycle the other stack
      const recycler = $.recycler;
      if (recycler) {
        await recycler.recycle(other);
      }

      return { success: true, quantity: self.quantity };
    `,
    );

    // Alias for backward compatibility
    obj.setMethod(
      'aggregate',
      `
      const other = args[0];
      if (!other) return false;

      const result = await self.merge(other);
      return result.success;
    `,
    );

    // Extract calories during digestion (one tick)
    // Returns { calories, volume } extracted
    obj.setMethod(
      'digestTick',
      `
      const rate = args[0] || 50; // Calories per tick

      const remaining = self.calories || 0;
      if (remaining <= 0) return { calories: 0, volume: 0 };

      const extracted = Math.min(rate, remaining);
      self.calories = remaining - extracted;

      // Reduce volume proportionally with calories
      const currentVolume = self.volume || 0;
      const originalCalories = self.caloriesOriginal || 1;
      const volumeRatio = extracted / originalCalories;
      const volumeExtracted = Math.ceil(currentVolume * volumeRatio);
      self.volume = Math.max(0, currentVolume - volumeExtracted);

      return { calories: extracted, volume: volumeExtracted };
    `,
    );

    // Check if fully digested
    obj.setMethod(
      'isFullyDigested',
      `
      return (self.calories || 0) <= 0;
    `,
    );

    // Get digestion percentage
    obj.setMethod(
      'getDigestionPercent',
      `
      const original = self.caloriesOriginal || 1;
      const remaining = self.calories || 0;
      const digested = original - remaining;
      return Math.round((digested / original) * 100);
    `,
    );

    // Describe for autopsy/examination
    obj.setMethod(
      'describe',
      `
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
    `,
    );

    // Short description for lists
    obj.setMethod(
      'shortDesc',
      `
      const qty = self.quantity || 1;
      const name = self.sourceName || 'unknown';
      if (qty > 1) {
        return qty + 'x ' + name;
      }
      return name;
    `,
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[StomachContentsBuilder] Type 'stomachContents' auto-aliased");
  }
}

// Self-register
registerBuilder(StomachContentsBuilder);
