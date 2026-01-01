import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the ECU prototype
 * Engine Control Unit - the vehicle's computer brain
 */
export class EcuBuilder implements Builder {
  static provides = ['ecu'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('ecu');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('ecu', vehiclePart, {
        properties: {
          name: 'Engine Control Unit',
          description: 'Computer that manages engine operation',
          partType: 'ecu',
          weight: 500,
          condition: 100,
          damage: 0,

          abilities: `Brain of the vehicle. Controls fuel injection, timing, emissions.
Damaged ECU = engine runs poorly or not at all. Check engine light.
Can be reprogrammed (tuned) for more power. Water damage is fatal.
Modern vehicles won't run without ECU. Stores error codes.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[EcuBuilder] Type 'ecu' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(EcuBuilder);
