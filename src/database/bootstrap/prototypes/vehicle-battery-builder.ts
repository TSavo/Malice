import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the VehicleBattery prototype
 * Required to start the engine
 */
export class VehicleBatteryBuilder implements Builder {
  static provides = ['vehicleBattery'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('vehicleBattery');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('vehicleBattery', vehiclePart, {
        properties: {
          name: 'Vehicle Battery',
          description:
            '12V lead-acid battery for starting the engine and powering electronics',
          partType: 'battery',
          // Charge level
          charge: 100, // 0-100 percentage
          // Physical
          weight: 15000, // grams (15kg typical car battery)
          // AI-readable abilities
          abilities: `Electrical power storage for vehicle starting and electronics.

CHARGE: 'charge' (0-100) is current charge level. Depletes over time when
parked, recharges while driving.

STARTING: Engine requires battery charge >= 10 to start.
Dead battery (charge < 5) needs jump start or replacement.

DRAIN: Electronics and lights drain battery when engine off.
Cold weather drains faster. Leaving lights on kills battery.

CHARGING: Alternator recharges while engine running.
Can also be charged externally with charger.

LIFESPAN: Batteries degrade over time. Low condition = shorter charge life.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Check if battery can start engine
    obj.setMethod(
      'canStart',
      `
      /**
       * Check if battery has enough charge to start engine.
       * @returns true if can start, false otherwise
       */
      const charge = self.charge ?? 0;
      const damage = self.damage ?? 0;

      // Need at least 10% charge and not severely damaged
      return charge >= 10 && damage < 90;
    `,
    );

    // Drain battery
    obj.setMethod(
      'drain',
      `
      /**
       * Drain charge from battery.
       * @param amount - Percentage to drain
       */
      const amount = args[0] ?? 1;
      self.charge = Math.max(0, (self.charge ?? 100) - amount);
      return self.charge;
    `,
    );

    // Charge battery
    obj.setMethod(
      'recharge',
      `
      /**
       * Add charge to battery.
       * @param amount - Percentage to add
       */
      const amount = args[0] ?? 1;
      const condition = self.condition ?? 100;

      // Degraded batteries can't hold full charge
      const maxCharge = 50 + (condition / 2);

      self.charge = Math.min(maxCharge, (self.charge ?? 0) + amount);
      return self.charge;
    `,
    );

    // Describe
    obj.setMethod(
      'describe',
      `
      const charge = self.charge ?? 100;
      const condition = self.condition ?? 100;
      const damage = self.damage ?? 0;

      let state = '';
      if (charge < 5) state = ' [DEAD]';
      else if (charge < 20) state = ' (low)';
      else if (damage > 50) state = ' (damaged)';

      const installed = self.installed
        ? \` [installed in \${self.installed.name}]\`
        : '';

      let chargeBar = '';
      const bars = Math.round(charge / 10);
      chargeBar = '[' + '█'.repeat(bars) + '░'.repeat(10 - bars) + ']';

      return \`\${self.name}\${state}\${installed}
\${self.description}
Charge: \${charge}% \${chargeBar}
Condition: \${condition}%\`;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'charge',
      'Current charge level 0-100. Need >= 10 to start engine.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(VehicleBatteryBuilder);
