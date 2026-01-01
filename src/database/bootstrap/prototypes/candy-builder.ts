import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Candy prototype
 * Sweet confection
 */
export class CandyBuilder implements Builder {
  static provides = ['candy'];
  static depends = ['food'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('candy');
    if (existing) {
      this.obj = existing;
    } else {
      const food = await this.manager.load('food');
      if (!food) throw new Error('Food type not found');

      this.obj = await this.manager.define('candy', food, {
        properties: {
          name: 'Candy',
          description: 'A sweet treat',
          calories: 80,
          hydration: 0,
          portions: 1,
          remaining: 1,
          weight: 20,
          decayRate: 0.001, // Candy lasts a long time
          effects: {
            energy: { intensity: 5, decay: 0.4 },
          },

          abilities: `Sweet confection. Quick sugar rush.

Brief energy boost then crash. No nutritional value. Lasts long if wrapped.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CandyBuilder] Type 'candy' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CandyBuilder);
