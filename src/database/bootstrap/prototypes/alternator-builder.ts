import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Alternator prototype
 * Charges the battery while engine runs
 */
export class AlternatorBuilder implements Builder {
  static provides = ['alternator'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('alternator');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('alternator', vehiclePart, {
        properties: {
          name: 'Alternator',
          description: 'Generates power and charges the battery',
          partType: 'alternator',
          weight: 6000,
          condition: 100,
          damage: 0,

          abilities: `Charges battery while engine runs. Powers electrical systems.
Broken alternator = battery drains. Vehicle dies when battery empty.
Belt-driven - damaged belt = no charge. Whining noise when failing.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[AlternatorBuilder] Type 'alternator' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(AlternatorBuilder);
