import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Brakes prototype
 * Stopping system for vehicles
 */
export class BrakesBuilder implements Builder {
  static provides = ['brakes'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('brakes');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('brakes', vehiclePart, {
        properties: {
          name: 'Brakes',
          description: 'Vehicle stopping system',
          partType: 'brakes',
          weight: 12000,
          condition: 100,
          damage: 0,
          padWear: 0,

          abilities: `Stops the vehicle. Pads wear from use, squeal when low.
Damaged brakes = longer stopping distance. Can fail completely.
Hydraulic system - leaks from damage. Wet brakes work poorly.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('padWear', 'Brake pad wear 0-100. High = needs replacement');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[BrakesBuilder] Type 'brakes' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BrakesBuilder);
