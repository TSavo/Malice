import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Decayable prototype
 * Base for anything that can decay over time (food, body parts, corpses, drugs)
 *
 * Decay model:
 * - decayRate: base rate of decay per tick (0-100% per tick)
 * - decayLevel: current decay state (0-100%)
 * - decayCondition: when decay starts (e.g., 'severed', 'harvested', 'dead')
 * - decayStarted: timestamp when decay began
 *
 * Storage modifiers affect decay rate:
 * - refrigerated: 0.1x decay (slows most decay)
 * - frozen: 0x decay (stops decay, may damage some items)
 * - vacuum: 0.2x decay (slows oxidation-based decay)
 * - heated: 2x decay (accelerates decay)
 * - preserved: 0x decay (salt, vinegar, etc.)
 *
 * Decay stages:
 * - 0-25%: Fresh
 * - 25-50%: Slightly decayed (minor effects)
 * - 50-75%: Decayed (significant effects, spoiled food)
 * - 75-99%: Severely decayed (dangerous to consume)
 * - 100%: Fully decayed (destroyed, unusable)
 */
export class DecayableBuilder {
  constructor(private manager: ObjectManager) {}

  async build(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Decayable',
        description: 'Base prototype for objects that decay over time',
        // Decay properties
        decayRate: 1, // Base decay rate (% per tick)
        decayLevel: 0, // Current decay (0-100%)
        decayCondition: null, // When decay starts (null = always decaying)
        decayStarted: null, // Timestamp when decay began
        decaying: false, // Whether currently decaying
        // Storage modifier sensitivities (how much each affects this item)
        storageSensitivity: {
          refrigerated: 0.1, // 10% of normal rate
          frozen: 0, // No decay
          vacuum: 0.2, // 20% of normal rate
          heated: 2.0, // 2x decay
          preserved: 0, // No decay (salt, vinegar, etc.)
        },
        // Damage from storage (some items are harmed by certain storage)
        storageDamage: {
          frozen: 0, // Some items (organs, certain drugs) damaged by freezing
        },
      },
      methods: {},
    });

    // Check if decay condition is met
    obj.setMethod('shouldDecay', `
      /** Check if this object should be decaying.
       *  Override in subclasses to define decay conditions.
       *  @returns true if decay should be active
       *  @example Body parts decay when severed, food decays after harvesting
       */
      // If no condition, always decay
      if (!self.decayCondition) {
        return true;
      }

      // Check specific conditions
      const condition = self.decayCondition;

      // Severed body parts
      if (condition === 'severed') {
        return self.severed === true || self.owner === null || self.owner === 0;
      }

      // Dead (for corpses)
      if (condition === 'dead') {
        return self.dead === true || self.alive === false;
      }

      // Harvested (for food)
      if (condition === 'harvested') {
        return self.harvested === true;
      }

      // Cooked (some foods decay faster after cooking)
      if (condition === 'cooked') {
        return self.cooked === true;
      }

      // Default: check if condition property is true
      return self[condition] === true;
    `);

    // Get current storage modifier
    obj.setMethod('getStorageModifier', `
      /** Get the decay rate modifier based on current storage.
       *  Checks parent containers for storage properties.
       *  @returns Multiplier for decay rate (0 = no decay, 1 = normal, 2 = accelerated)
       */
      let modifier = 1.0;
      const sensitivity = self.storageSensitivity || {};

      // Check if we're in a container with storage properties
      if (self.location && self.location !== 0) {
        const container = await $.load(self.location);
        if (container) {
          // Check for storage conditions
          if (container.refrigerated && sensitivity.refrigerated !== undefined) {
            modifier = Math.min(modifier, sensitivity.refrigerated);
          }
          if (container.frozen && sensitivity.frozen !== undefined) {
            modifier = Math.min(modifier, sensitivity.frozen);
          }
          if (container.vacuum && sensitivity.vacuum !== undefined) {
            modifier = Math.min(modifier, sensitivity.vacuum);
          }
          if (container.heated && sensitivity.heated !== undefined) {
            modifier = Math.max(modifier, sensitivity.heated);
          }
          if (container.preserved && sensitivity.preserved !== undefined) {
            modifier = Math.min(modifier, sensitivity.preserved);
          }

          // Recursively check parent containers
          if (container.getStorageModifier) {
            const parentMod = await container.getStorageModifier();
            modifier = modifier * parentMod;
          }
        }
      }

      return modifier;
    `);

    // Check for storage damage
    obj.setMethod('checkStorageDamage', `
      /** Check if current storage is damaging this item.
       *  Some items are harmed by certain storage (organs by freezing, etc.)
       *  @returns {damage: number, reason: string} or null if no damage
       */
      const storageDamage = self.storageDamage || {};

      if (self.location && self.location !== 0) {
        const container = await $.load(self.location);
        if (container) {
          if (container.frozen && storageDamage.frozen > 0) {
            return { damage: storageDamage.frozen, reason: 'freezing' };
          }
          if (container.heated && storageDamage.heated > 0) {
            return { damage: storageDamage.heated, reason: 'heat' };
          }
        }
      }

      return null;
    `);

    // Process decay tick
    obj.setMethod('decayTick', `
      /** Process one tick of decay.
       *  Called by scheduler or heartbeat.
       *  @returns {decayed: number, level: number, stage: string, destroyed: boolean}
       */
      // Check if should be decaying
      const shouldDecay = await self.shouldDecay();

      if (!shouldDecay) {
        // Not decaying - reset if we were
        if (self.decaying) {
          self.decaying = false;
          self.decayStarted = null;
        }
        return { decayed: 0, level: self.decayLevel || 0, stage: await self.getDecayStage(), destroyed: false };
      }

      // Start decay timer if not started
      if (!self.decayStarted) {
        self.decayStarted = Date.now();
        self.decaying = true;
      }

      // Already fully decayed
      if ((self.decayLevel || 0) >= 100) {
        return { decayed: 0, level: 100, stage: 'destroyed', destroyed: true };
      }

      // Get storage modifier
      const storageModifier = await self.getStorageModifier();

      // Calculate decay amount
      const baseRate = self.decayRate || 1;
      const decayAmount = baseRate * storageModifier;

      // Apply decay
      const oldLevel = self.decayLevel || 0;
      const newLevel = Math.min(100, oldLevel + decayAmount);
      self.decayLevel = newLevel;

      // Check for destruction
      const destroyed = newLevel >= 100;
      if (destroyed) {
        await self.onFullyDecayed();
      }

      // Check for storage damage
      const damage = await self.checkStorageDamage();
      if (damage) {
        await self.onStorageDamage(damage.damage, damage.reason);
      }

      return {
        decayed: newLevel - oldLevel,
        level: newLevel,
        stage: await self.getDecayStage(),
        destroyed,
      };
    `);

    // Get decay stage name
    obj.setMethod('getDecayStage', `
      /** Get the current decay stage name.
       *  @returns 'fresh' | 'slight' | 'decayed' | 'severe' | 'destroyed'
       */
      const level = self.decayLevel || 0;

      if (level <= 0) return 'fresh';
      if (level < 25) return 'fresh';
      if (level < 50) return 'slight';
      if (level < 75) return 'decayed';
      if (level < 100) return 'severe';
      return 'destroyed';
    `);

    // Get decay description for examine
    obj.setMethod('getDecayDescription', `
      /** Get a description of the decay state.
       *  @returns Description string or empty if fresh
       */
      const stage = await self.getDecayStage();

      if (stage === 'fresh') return '';
      if (stage === 'slight') return 'It looks slightly past its prime.';
      if (stage === 'decayed') return 'It is noticeably decayed.';
      if (stage === 'severe') return 'It is severely decayed and may be dangerous.';
      if (stage === 'destroyed') return 'It has completely decayed.';

      return '';
    `);

    // Hook for when fully decayed
    obj.setMethod('onFullyDecayed', `
      /** Called when item reaches 100% decay.
       *  Override to handle destruction, spawn flies, etc.
       */
      // Default: mark as destroyed
      self.destroyed = true;

      // Could spawn maggots, flies, etc.
      // Could announce decay smell to room
    `);

    // Hook for storage damage
    obj.setMethod('onStorageDamage', `
      /** Called when storage is damaging this item.
       *  @param amount - Damage amount
       *  @param reason - Reason for damage (e.g., 'freezing')
       */
      const amount = args[0];
      const reason = args[1];

      // Default: add to decay
      self.decayLevel = Math.min(100, (self.decayLevel || 0) + amount);
    `);

    // Preserve the item (stop decay)
    obj.setMethod('preserve', `
      /** Preserve this item, stopping decay.
       *  @param method - Preservation method ('salt', 'vinegar', 'vacuum', etc.)
       *  @returns true if preserved successfully
       */
      const method = args[0] || 'preserved';

      // Mark as preserved
      self.preserved = true;
      self.preservationMethod = method;

      // Reset decay if not too far gone
      if ((self.decayLevel || 0) < 50) {
        self.decayLevel = Math.max(0, (self.decayLevel || 0) - 10);
      }

      return true;
    `);

    // Receive calories to reduce decay (healing/undecay)
    // This is the inverse of decay - calories repair damage
    obj.setMethod('receiveCalories', `
      /** Receive calories to reduce decay level (healing).
       *  Calories reverse decay at the same rate decay consumes them.
       *  100 calories = 1% decay reduction (adjustable via healRate).
       *  Cannot heal past 0% decay.
       *  @param calories - Calories to apply to healing
       *  @returns {healed: number, level: number, caloriesUsed: number}
       */
      const calories = args[0] || 0;
      if (calories <= 0) {
        return { healed: 0, level: self.decayLevel || 0, caloriesUsed: 0 };
      }

      const currentDecay = self.decayLevel || 0;
      if (currentDecay <= 0) {
        return { healed: 0, level: 0, caloriesUsed: 0 };
      }

      // Heal rate: how many calories per 1% decay healed
      // Default 100 calories = 1% healing (same as decay costs)
      const healRate = self.healRate || 100;

      // Calculate how much we can heal
      const maxHeal = calories / healRate;
      const actualHeal = Math.min(maxHeal, currentDecay);
      const caloriesUsed = Math.round(actualHeal * healRate);

      // Apply healing
      const newLevel = Math.max(0, currentDecay - actualHeal);
      self.decayLevel = newLevel;

      // If we were decaying, reset the timer when fully healed
      if (newLevel <= 0 && self.decaying) {
        self.decaying = false;
        self.decayStarted = null;
      }

      return {
        healed: actualHeal,
        level: newLevel,
        caloriesUsed,
        stage: await self.getDecayStage(),
      };
    `);

    return obj;
  }
}
