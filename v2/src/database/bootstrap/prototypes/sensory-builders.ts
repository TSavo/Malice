import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Eye prototype
 */
export class EyeBuilder {
  constructor(private manager: ObjectManager) {}

  async build(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Eye',
        description: 'An eye',
        coverable: true,
        removable: true,
        critical: false,
      },
      methods: {},
    });

    // Returns { max: number, percent: number }
    // max = trained capacity minus permanent decay damage
    // percent = current function (100 = fully rested, 0 = exhausted)
    obj.setMethod('canSee', `
      const condition = self.condition || {};
      // Can't see if blinded, destroyed, or missing
      if (condition.blind || condition.destroyed || condition.missing) {
        return { max: 0, percent: 0 };
      }
      // Can't see if something is blocking it
      const contents = self.contents || [];
      if (contents.length > 0) {
        return { max: 0, percent: 0 };
      }

      // Max capacity = trained level minus permanent decay damage
      const trainedMax = self.maxCalories || 100;
      const permanentDamage = self.decayLevel || 0;
      const max = Math.max(0, trainedMax - permanentDamage);

      // Percent = current calories as percentage of max
      const currentCalories = self.calories || max;
      const percent = max > 0 ? Math.round((currentCalories / max) * 100) : 0;

      return { max, percent };
    `);

    return obj;
  }
}

/**
 * Builds the Ear prototype
 */
export class EarBuilder {
  constructor(private manager: ObjectManager) {}

  async build(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Ear',
        description: 'An ear',
        coverable: true,
        removable: true,
        critical: false,
      },
      methods: {},
    });

    // Returns { max: number, percent: number }
    // max = trained capacity minus permanent decay damage
    // percent = current function (100 = fully rested, 0 = exhausted)
    obj.setMethod('canHear', `
      const condition = self.condition || {};
      if (condition.deaf || condition.destroyed || condition.missing) {
        return { max: 0, percent: 0 };
      }

      // Max capacity = trained level minus permanent decay damage
      const trainedMax = self.maxCalories || 100;
      const permanentDamage = self.decayLevel || 0;
      let max = Math.max(0, trainedMax - permanentDamage);

      // Earplugs or contents muffle - reduce effective max
      const contents = self.contents || [];
      if (contents.length > 0) {
        max = Math.floor(max * 0.3); // Heavily muffled
      }

      // Percent = current calories as percentage of max
      const currentCalories = self.calories || max;
      const percent = max > 0 ? Math.round((currentCalories / max) * 100) : 0;

      return { max, percent };
    `);

    return obj;
  }
}

/**
 * Builds the Tongue prototype
 */
export class TongueBuilder {
  constructor(private manager: ObjectManager) {}

  async build(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Tongue',
        description: 'A tongue',
        coverable: false,
        removable: true,
        critical: false,
      },
      methods: {},
    });

    // Can speak if tongue exists and not damaged
    obj.setMethod('canSpeak', `
      const condition = self.condition || {};
      if (condition.destroyed || condition.missing || condition.mute) {
        return false;
      }
      return true;
    `);

    // Can taste if tongue exists
    obj.setMethod('canTaste', `
      const condition = self.condition || {};
      if (condition.destroyed || condition.missing) {
        return false;
      }
      return true;
    `);

    return obj;
  }
}

/**
 * Builds the Nose prototype
 */
export class NoseBuilder {
  constructor(private manager: ObjectManager) {}

  async build(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Nose',
        description: 'A nose',
        coverable: true,
        removable: true,
        critical: false,
      },
      methods: {},
    });

    // Can smell if nose exists and not blocked
    obj.setMethod('canSmell', `
      const condition = self.condition || {};
      if (condition.destroyed || condition.missing || condition.stuffed) {
        return false;
      }
      // Can't smell if something is shoved up there
      const contents = self.contents || [];
      if (contents.length > 0) {
        return false;
      }
      return true;
    `);

    return obj;
  }
}

/**
 * Builds the Mouth prototype (container for tongue, can hold food, etc.)
 */
export class MouthBuilder {
  constructor(private manager: ObjectManager) {}

  async build(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Mouth',
        description: 'A mouth',
        coverable: true,
        removable: false,
        critical: false,
      },
      methods: {},
    });

    // Mouth can contain things (food, gag, etc.)
    obj.setMethod('canContain', `
      return true;
    `);

    return obj;
  }
}

/**
 * Builds the Stomach prototype (internal container for consumed items)
 */
export class StomachBuilder {
  constructor(private manager: ObjectManager) {}

  async build(bodyPartId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: bodyPartId,
      properties: {
        name: 'Stomach',
        description: 'A stomach',
        coverable: false, // Internal organ
        removable: false,
        critical: true,
      },
      methods: {},
    });

    // Stomach can contain consumed items
    obj.setMethod('canContain', `
      return true;
    `);

    return obj;
  }
}
