import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Transmission prototype
 * Transfers power from engine to wheels
 */
export class TransmissionBuilder implements Builder {
  static provides = ['transmission'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('transmission');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('transmission', vehiclePart, {
        properties: {
          name: 'Transmission',
          description: 'Gearbox that transfers engine power to the wheels',
          partType: 'transmission',
          // Type
          automatic: true, // true = automatic, false = manual
          gears: 6, // Number of forward gears
          // Current state
          currentGear: 0, // 0 = park/neutral, -1 = reverse, 1-6 = forward gears
          // Physical
          weight: 80000, // grams (80kg)
          // AI-readable abilities
          abilities: `Gearbox that transfers engine power to wheels.

TYPE: 'automatic' true = automatic shifting, false = manual (requires clutch).
'gears' is number of forward gears available.

GEARS: 'currentGear' is current gear state:
  0 = Park/Neutral (engine disconnected from wheels)
  -1 = Reverse
  1-6 = Forward gears (higher = faster, less torque)

OPERATION: Must be in gear to move. Automatic shifts by itself.
Manual requires driver to shift - grinding gears damages transmission.

DAMAGE: Damaged transmission may slip gears, grind, or fail to engage.
Severe damage prevents vehicle from moving even with running engine.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Shift to a gear
    obj.setMethod(
      'shift',
      `
      /**
       * Shift to a specific gear.
       * @param gear - Target gear (0=neutral, -1=reverse, 1-6=forward)
       * @returns true if successful, error string if failed
       */
      const gear = args[0] ?? 0;
      const gears = self.gears ?? 6;
      const damage = self.damage ?? 0;

      // Validate gear
      if (gear < -1 || gear > gears) {
        return \`Invalid gear: \${gear}\`;
      }

      // Damaged transmission may fail to shift
      if (damage > 70 && Math.random() < (damage - 70) / 100) {
        return 'The transmission grinds and fails to engage.';
      }

      self.currentGear = gear;
      return true;
    `,
    );

    // Check if transmission allows movement
    obj.setMethod(
      'canMove',
      `
      /**
       * Check if transmission is in a gear that allows movement.
       * @returns true if in drive gear, false if neutral/park
       */
      const gear = self.currentGear ?? 0;
      const damage = self.damage ?? 0;

      // Neutral/park doesn't move
      if (gear === 0) return false;

      // Severely damaged transmission slips
      if (damage >= 80) return false;

      return true;
    `,
    );

    // Describe
    obj.setMethod(
      'describe',
      `
      const automatic = self.automatic ?? true;
      const gears = self.gears ?? 6;
      const currentGear = self.currentGear ?? 0;
      const damage = self.damage ?? 0;
      const condition = self.condition ?? 100;

      let state = '';
      if (damage > 80) state = ' [SLIPPING]';
      else if (damage > 50) state = ' (grinding)';
      else if (condition < 50) state = ' (worn)';

      const installed = self.installed
        ? \` [installed in \${self.installed.name}]\`
        : '';

      const typeStr = automatic ? 'Automatic' : 'Manual';
      let gearStr = 'N';
      if (currentGear === -1) gearStr = 'R';
      else if (currentGear > 0) gearStr = \`D\${currentGear}\`;

      return \`\${self.name}\${state}\${installed}
\${self.description}
Type: \${typeStr} \${gears}-speed
Current: \${gearStr}\`;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'automatic',
      'true = automatic shifting, false = manual transmission.',
    );
    obj.setPropertyDescription(
      'gears',
      'Number of forward gears available.',
    );
    obj.setPropertyDescription(
      'currentGear',
      'Current gear: 0=neutral, -1=reverse, 1+=forward.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(TransmissionBuilder);
