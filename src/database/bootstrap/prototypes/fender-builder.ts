import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Fender prototype
 * Wheel well covers - cosmetic/protective body panels
 */
export class FenderBuilder implements Builder {
  static provides = ['fender'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('fender');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('fender', vehiclePart, {
        properties: {
          name: 'Fender',
          description: 'A wheel well cover panel',
          partType: 'fender',
          position: 'front-left', // front-left, front-right, rear-left, rear-right
          weight: 8000, // 8kg

          abilities: `Wheel well cover panel. Cosmetic/protective.

'position' = which wheel: front-left, front-right, rear-left, rear-right.
Protects wheel from debris. Damageable, dents from impacts.
Optional - vehicle works without fenders.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    obj.setPropertyDescription('position', 'Fender position: front-left, front-right, rear-left, rear-right');
  }

  async registerAliases(): Promise<void> {
    console.log("[FenderBuilder] Type 'fender' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(FenderBuilder);
