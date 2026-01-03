import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Rotor prototype for helicopters
 * The spinning blade assembly that provides lift
 */
export class RotorBuilder implements Builder {
  static provides = ['rotor', 'mainRotor', 'tailRotor'];
  static depends = ['vehiclePart'];

  private rotor: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    await this.buildRotor();
    await this.buildMainRotor();
    await this.buildTailRotor();
  }

  private async buildRotor(): Promise<void> {
    const existing = await this.manager.load('rotor');
    if (existing) {
      this.rotor = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.rotor = await this.manager.define('rotor', vehiclePart, {
        properties: {
          name: 'Rotor',
          description:
            'Spinning blade assembly that provides lift for rotorcraft',
          partType: 'rotor',
          // Performance
          rpm: 0, // Current revolutions per minute (0 when stopped)
          maxRpm: 400, // Max operational RPM
          bladeCount: 4, // Number of blades
          // Physical
          weight: 50000, // grams (50kg)
          diameter: 10, // meters
          // AI-readable abilities
          abilities: `Rotor assembly providing lift for helicopters.

LIFT: Main rotor provides vertical lift. 'rpm' must reach 'maxRpm' threshold
for takeoff. Engine powers rotor through transmission.

CONDITION: Damaged rotor reduces lift efficiency. Severely damaged rotor
(damage > 60) cannot provide stable flight - emergency landing required.

NOISE: Rotor makes significant noise. Faster RPM = louder. Distinctive
whopping sound can be heard from a distance.

DANGER: Spinning rotor blades are lethal. Keep clear of rotor disc.
Objects entering rotor arc are destroyed.`,
        },
        methods: {},
      });
    }

    const obj = this.rotor;

    // Check if rotor can provide lift
    obj.setMethod(
      'canProvideLift',
      `
      /**
       * Check if rotor is capable of providing lift.
       * @returns true if rotor can lift, false otherwise
       */
      const condition = self.condition ?? 100;
      const damage = self.damage ?? 0;
      const rpm = self.rpm ?? 0;
      const maxRpm = self.maxRpm ?? 400;

      // Must be functional
      if (!self.isFunctional()) return false;

      // Must be spinning at sufficient speed
      const threshold = maxRpm * 0.8; // 80% of max RPM needed
      if (rpm < threshold) return false;

      return true;
      `,
    );

    // Spin up the rotor
    obj.setMethod(
      'spinUp',
      `
      /**
       * Start spinning the rotor (called by engine/transmission).
       * @param targetRpm - Target RPM to reach
       */
      const targetRpm = args[0] ?? self.maxRpm;
      const maxRpm = self.maxRpm ?? 400;

      // Cap at max RPM
      self.rpm = Math.min(maxRpm, targetRpm);
      return self.rpm;
      `,
    );

    // Spin down the rotor
    obj.setMethod(
      'spinDown',
      `
      /**
       * Stop the rotor (when engine stops).
       */
      self.rpm = 0;
      return 0;
      `,
    );

    // Override describe
    obj.setMethod(
      'describe',
      `
      const condition = self.condition ?? 100;
      const damage = self.damage ?? 0;
      const rpm = self.rpm ?? 0;
      const blades = self.bladeCount ?? 4;
      const diameter = self.diameter ?? 10;

      let state = '';
      if (!self.isFunctional()) state = ' [NON-FUNCTIONAL]';
      else if (damage > 40) state = ' (damaged)';
      else if (condition < 80) state = ' (worn)';

      let spinning = '';
      if (rpm > 0) {
        spinning = rpm >= (self.maxRpm * 0.8) ? ' [SPINNING]' : ' [spooling up]';
      }

      const installed = self.installed
        ? \` [installed in \${self.installed.name}]\`
        : '';

      return \`\${self.name}\${state}\${spinning}\${installed}
\${self.description}
Blades: \${blades} x \${diameter}m diameter
Condition: \${condition}%\`;
      `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'rpm',
      'Current revolutions per minute (0 = stopped)',
    );
    obj.setPropertyDescription('maxRpm', 'Maximum operational RPM');
    obj.setPropertyDescription('bladeCount', 'Number of rotor blades');
    obj.setPropertyDescription('diameter', 'Rotor disc diameter in meters');
  }

  private async buildMainRotor(): Promise<void> {
    const existing = await this.manager.load('mainRotor');
    if (existing) return;

    const rotor = await this.manager.load('rotor');
    if (!rotor) throw new Error('Rotor type not found');

    await this.manager.define('mainRotor', rotor, {
      properties: {
        name: 'Main Rotor',
        description: 'Primary lifting rotor mounted on top of helicopter',
        bladeCount: 4,
        diameter: 11, // meters
        maxRpm: 400,
        weight: 60000, // 60kg
      },
      methods: {},
    });
  }

  private async buildTailRotor(): Promise<void> {
    const existing = await this.manager.load('tailRotor');
    if (existing) return;

    const rotor = await this.manager.load('rotor');
    if (!rotor) throw new Error('Rotor type not found');

    await this.manager.define('tailRotor', rotor, {
      properties: {
        name: 'Tail Rotor',
        description:
          'Anti-torque rotor on the tail boom, prevents helicopter from spinning',
        partType: 'tailRotor', // Different partType for helicopters that need it
        bladeCount: 2,
        diameter: 2, // meters
        maxRpm: 1200, // Tail rotors spin faster
        weight: 15000, // 15kg
        abilities: `Anti-torque rotor on tail boom.

FUNCTION: Counters main rotor torque to prevent helicopter from spinning.
Provides yaw (turning left/right) control via pedals.

CRITICAL: Loss of tail rotor = uncontrollable spin. Emergency autorotation
landing required immediately.

SIZE: Smaller and faster-spinning than main rotor. Less visible.`,
      },
      methods: {},
    });
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.rotor) return;
    console.log(
      `[RotorBuilder] Types 'rotor', 'mainRotor', 'tailRotor' auto-aliased`,
    );
  }

  getObject(): RuntimeObject | null {
    return this.rotor;
  }
}

registerBuilder(RotorBuilder);
