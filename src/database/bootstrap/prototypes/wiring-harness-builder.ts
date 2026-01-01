import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the WiringHarness prototype
 * Electrical wiring that connects all vehicle systems
 */
export class WiringHarnessBuilder implements Builder {
  static provides = ['wiringHarness'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('wiringHarness');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('wiringHarness', vehiclePart, {
        properties: {
          name: 'Wiring Harness',
          description: 'Electrical wiring connecting all vehicle systems',
          partType: 'wiringHarness',
          weight: 3000,
          condition: 100,
          damage: 0,

          abilities: `Carries power and signals to all components.
Damaged wires = random electrical failures. Short circuits cause fires.
Rodents chew wires. Old insulation cracks. Hard to diagnose, tedious to fix.
Complete harness replacement is major work.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[WiringHarnessBuilder] Type 'wiringHarness' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(WiringHarnessBuilder);
