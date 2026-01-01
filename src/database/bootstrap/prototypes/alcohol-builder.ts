import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Alcohol prototype
 * Alcoholic beverages - beer, wine, liquor
 */
export class AlcoholBuilder implements Builder {
  static provides = ['alcohol'];
  static depends = ['drink'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('alcohol');
    if (existing) {
      this.obj = existing;
    } else {
      const drink = await this.manager.load('drink');
      if (!drink) throw new Error('Drink type not found');

      this.obj = await this.manager.define('alcohol', drink, {
        properties: {
          name: 'Alcohol',
          description: 'An alcoholic beverage',
          hydration: -50, // Dehydrating
          calories: 100,
          abv: 5, // Alcohol by volume %
          effects: {
            drunk: { intensity: 10, decay: 0.1 },
            calm: { intensity: 5, decay: 0.2 },
          },

          abilities: `Alcoholic drink. Dehydrates despite being liquid.

'abv' = alcohol %. Higher = stronger effect, faster drunk.
Impairs coordination, judgment. Addictive with heavy use.`,
        },
        methods: {},
      });
    }

    this.obj.setPropertyDescription('abv', 'Alcohol by volume percentage');
  }

  async registerAliases(): Promise<void> {
    console.log("[AlcoholBuilder] Type 'alcohol' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(AlcoholBuilder);
