import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the RationPack prototype
 * Military-style MRE / survival ration
 */
export class RationPackBuilder implements Builder {
  static provides = ['rationPack'];
  static depends = ['food'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('rationPack');
    if (existing) {
      this.obj = existing;
    } else {
      const food = await this.manager.load('food');
      if (!food) throw new Error('Food type not found');

      this.obj = await this.manager.define('rationPack', food, {
        properties: {
          name: 'Ration Pack',
          description: 'Military-style meal ready to eat',
          calories: 1200, // Full meal
          hydration: 50,
          portions: 6,
          remaining: 6,
          weight: 500,
          decayRate: 0, // Vacuum sealed, lasts years

          abilities: `Complete meal in vacuum-sealed pouch. Lasts years.

Contains main course, side, dessert, drink mix. Includes flameless heater.
Designed for survival - high calorie, compact, durable.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[RationPackBuilder] Type 'rationPack' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(RationPackBuilder);
