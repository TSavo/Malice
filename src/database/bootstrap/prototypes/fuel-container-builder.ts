import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the FuelContainer prototype
 * Jerry cans, barrels, drums - portable fuel storage
 */
export class FuelContainerBuilder implements Builder {
  static provides = ['fuelContainer'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('fuelContainer');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('fuelContainer', describable, {
        properties: {
          name: 'Jerry Can',
          description: 'A metal fuel container',
          capacity: 20, // Liters
          fuel: 0,
          fuelType: 'gasoline',
          weight: 2000, // grams empty

          abilities: `Portable fuel container.

To fill: set 'fuel' up to 'capacity'. Types must match existing fuel.
To pour: reduce 'fuel', increase target's 'fuel'.
To siphon: reverse of pour.

Flammable. Fire hazard if ignited.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    obj.setPropertyDescription('capacity', 'Max liters');
    obj.setPropertyDescription('fuel', 'Current liters');
    obj.setPropertyDescription('fuelType', 'gasoline, diesel, avgas');
  }

  async registerAliases(): Promise<void> {
    console.log("[FuelContainerBuilder] Type 'fuelContainer' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(FuelContainerBuilder);
