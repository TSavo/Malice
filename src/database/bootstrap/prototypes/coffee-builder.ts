import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Coffee prototype
 */
export class CoffeeBuilder implements Builder {
  static provides = ['coffee'];
  static depends = ['drink'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('coffee');
    if (existing) {
      this.obj = existing;
    } else {
      const drink = await this.manager.load('drink');
      if (!drink) throw new Error('Drink type not found');

      this.obj = await this.manager.define('coffee', drink, {
        properties: {
          name: 'Coffee',
          description: 'A hot caffeinated beverage',
          hydration: 150,
          calories: 5,
          hot: true,
          effects: {
            alertness: { intensity: 20, decay: 0.15 },
            focus: { intensity: 10, decay: 0.2 },
          },

          abilities: `Hot caffeinated drink. Increases alertness and focus.

Hot liquid - can burn if spilled. Mild diuretic. Addictive (caffeine withdrawal = headache).`,
        },
        methods: {},
      });
    }

    this.obj.setPropertyDescription('hot', 'Can cause burns if spilled');
  }

  async registerAliases(): Promise<void> {
    console.log("[CoffeeBuilder] Type 'coffee' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CoffeeBuilder);
