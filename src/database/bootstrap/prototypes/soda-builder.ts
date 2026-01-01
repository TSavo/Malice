import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Soda prototype
 */
export class SodaBuilder implements Builder {
  static provides = ['soda'];
  static depends = ['drink'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('soda');
    if (existing) {
      this.obj = existing;
    } else {
      const drink = await this.manager.load('drink');
      if (!drink) throw new Error('Drink type not found');

      this.obj = await this.manager.define('soda', drink, {
        properties: {
          name: 'Soda',
          description: 'A carbonated soft drink',
          hydration: 180,
          calories: 140,
          carbonated: true,
          effects: {
            energy: { intensity: 5, decay: 0.3 },
          },

          abilities: `Sweet carbonated drink. High sugar, some hydration.

Fizzes when shaken - can spray on opening. Brief energy from sugar.`,
        },
        methods: {},
      });
    }

    this.obj.setPropertyDescription('carbonated', 'Fizzes when shaken');
  }

  async registerAliases(): Promise<void> {
    console.log("[SodaBuilder] Type 'soda' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SodaBuilder);
