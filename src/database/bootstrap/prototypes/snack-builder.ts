import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Snack prototype
 * Quick, small food items
 */
export class SnackBuilder implements Builder {
  static provides = ['snack'];
  static depends = ['food'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('snack');
    if (existing) {
      this.obj = existing;
    } else {
      const food = await this.manager.load('food');
      if (!food) throw new Error('Food type not found');

      this.obj = await this.manager.define('snack', food, {
        properties: {
          name: 'Snack',
          description: 'A small quick bite',
          calories: 150,
          portions: 2,
          remaining: 2,
          weight: 50,

          abilities: `Quick, portable food. Eat on the go.

Not a full meal. Staves off hunger temporarily. Often packaged.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[SnackBuilder] Type 'snack' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SnackBuilder);
