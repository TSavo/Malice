import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the FuelPump prototype
 * Gas station fuel dispenser with payment
 */
export class FuelPumpBuilder implements Builder {
  static provides = ['fuelPump'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('fuelPump');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('fuelPump', describable, {
        properties: {
          name: 'Fuel Pump',
          description: 'A gas station fuel dispenser',
          fuelType: 'gasoline',
          pricePerLiter: 2.50, // dollars
          reservoir: null, // objref to supply tank (unlimited if null)
          enabled: true,

          abilities: `Gas station fuel pump. Insert nozzle, pay, dispense fuel.

Payment: 'pricePerLiter' × liters. Pay with $cash (has .owner, .amount) or $bank account.
Vehicle 'fuel' increases, payment deducted.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;
    obj.setPropertyDescription('pricePerLiter', 'Cost per liter');
    obj.setPropertyDescription('reservoir', 'Supply tank (null = unlimited)');
  }

  async registerAliases(): Promise<void> {
    console.log("[FuelPumpBuilder] Type 'fuelPump' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(FuelPumpBuilder);
