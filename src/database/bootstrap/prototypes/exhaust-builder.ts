import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Exhaust prototype
 * Exhaust system for vehicles
 */
export class ExhaustBuilder implements Builder {
  static provides = ['exhaust'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('exhaust');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('exhaust', vehiclePart, {
        properties: {
          name: 'Exhaust System',
          description: 'Vents engine fumes and reduces noise',
          partType: 'exhaust',
          weight: 15000,
          condition: 100,
          damage: 0,

          abilities: `Routes exhaust gases out. Muffler reduces engine noise.
Holes = loud rumble, fumes leak into cabin (dangerous).
Rusts from underneath. Damaged exhaust is very loud - attracts attention.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ExhaustBuilder] Type 'exhaust' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ExhaustBuilder);
