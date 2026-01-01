import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the CannedFood prototype
 */
export class CannedFoodBuilder implements Builder {
  static provides = ['cannedFood'];
  static depends = ['food'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('cannedFood');
    if (existing) {
      this.obj = existing;
    } else {
      const food = await this.manager.load('food');
      if (!food) throw new Error('Food type not found');

      this.obj = await this.manager.define('cannedFood', food, {
        properties: {
          name: 'Canned Food',
          description: 'Preserved food in a sealed can',
          calories: 300,
          portions: 4,
          remaining: 4,
          weight: 400,
          opened: false,
          decayRate: 0, // Doesn't decay until opened

          abilities: `Preserved in sealed can. Lasts years until opened.

Must open can first (can opener, knife, or brute force). Once opened, decays normally.
Can is metal - can be used as container or weapon after.`,
        },
        methods: {},
      });
    }

    this.obj.setPropertyDescription('opened', 'Must be true to eat contents');
  }

  async registerAliases(): Promise<void> {
    console.log("[CannedFoodBuilder] Type 'cannedFood' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CannedFoodBuilder);
