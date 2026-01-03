import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Fuel prototype
 * Fuel as a stackable commodity
 */
export class FuelBuilder implements Builder {
  static provides = ['fuel'];
  static depends = ['stackable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('fuel');
    if (existing) {
      this.obj = existing;
    } else {
      const stackable = await this.manager.load('stackable');
      if (!stackable) throw new Error('Stackable type not found');

      this.obj = await this.manager.define('fuel', stackable, {
        properties: {
          name: 'Fuel',
          description: 'Liquid fuel',
          stackType: 'fuel:gasoline',
          quantity: 0, // Liters
          unit: 'L',
          fuelType: 'gasoline',
          contraband: false,

          abilities: `Fuel commodity. Pour into vehicles or containers.
Types must match. Flammable.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;
    obj.setPropertyDescription('fuelType', 'gasoline, diesel, avgas');
  }

  async registerAliases(): Promise<void> {
    console.log("[FuelBuilder] Type 'fuel' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(FuelBuilder);
