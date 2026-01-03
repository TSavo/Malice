import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the VectorThruster prototype
 * A thrust vectoring engine for VTOL aircraft (flying cars, AVs)
 */
export class VectorThrusterBuilder implements Builder {
  static provides = ['vectorThruster'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('vectorThruster');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('vectorThruster', vehiclePart, {
        properties: {
          name: 'Vector Thruster',
          description:
            'A thrust-vectoring engine for vertical takeoff and landing',
          partType: 'vectorThruster',
          // Performance
          thrust: 5000, // Newtons of thrust
          maxThrust: 8000, // Maximum thrust capacity
          efficiency: 0.85, // Power efficiency (affects battery drain)
          // State
          active: false, // Whether thruster is currently firing
          vectorAngle: 0, // 0 = straight down (hover), 90 = straight back (forward flight)
          // Physical
          weight: 25000, // 25kg
          // AI-readable abilities
          abilities: `Thrust-vectoring propulsion for VTOL flight.

THRUST: 'thrust' is current output in Newtons. 'maxThrust' is capacity.
Damaged thrusters produce less thrust (thrust * (condition/100)).

VECTOR: 'vectorAngle' controls thrust direction.
0° = vertical (hover/takeoff/landing)
45° = transitional (climbing forward)
90° = horizontal (cruise flight)

ACTIVATION: Set 'active' to true to fire thruster.
Consumes power from vehicle battery while active.

POWER: Draws from vehicle battery. Efficiency affects drain rate.
Higher thrust = more power consumption.

HOVER: To hover, thrust must equal vehicle weight.
To climb, thrust must exceed weight.

DAMAGE: High damage reduces max thrust output.
At damage > 80, thruster may cut out intermittently.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Get effective thrust (reduced by condition)
    obj.setMethod(
      'getEffectiveThrust',
      `
      /**
       * Get actual thrust output adjusted for condition.
       * @returns Thrust in Newtons
       */
      const thrust = self.thrust ?? 5000;
      const condition = self.condition ?? 100;
      return thrust * (condition / 100);
    `,
    );

    // Check if thruster can provide enough lift
    obj.setMethod(
      'canLift',
      `
      /**
       * Check if thruster can provide enough thrust for a given weight.
       * @param weight - Weight to lift in grams
       * @returns true if can lift
       */
      const weight = args[0] || 0;
      const weightNewtons = (weight / 1000) * 9.81; // Convert grams to N
      const effectiveThrust = await self.getEffectiveThrust();
      return effectiveThrust >= weightNewtons;
    `,
    );

    // Activate thruster
    obj.setMethod(
      'activate',
      `
      /**
       * Activate the thruster.
       * @returns true on success, error string on failure
       */
      if (self.active) return 'Already active';
      if (!self.isFunctional()) return 'Thruster is damaged';

      self.active = true;
      return true;
    `,
    );

    // Deactivate thruster
    obj.setMethod(
      'deactivate',
      `
      /**
       * Deactivate the thruster.
       */
      self.active = false;
      return true;
    `,
    );

    // Set vector angle
    obj.setMethod(
      'setVector',
      `
      /**
       * Set thrust vector angle.
       * @param angle - 0 (hover) to 90 (cruise)
       */
      const angle = args[0] ?? 0;
      self.vectorAngle = Math.max(0, Math.min(90, angle));
      return self.vectorAngle;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription('thrust', 'Current thrust output in Newtons.');
    obj.setPropertyDescription(
      'maxThrust',
      'Maximum thrust capacity in Newtons.',
    );
    obj.setPropertyDescription(
      'efficiency',
      'Power efficiency 0-1. Affects battery drain.',
    );
    obj.setPropertyDescription('active', 'true when thruster is firing.');
    obj.setPropertyDescription(
      'vectorAngle',
      'Thrust direction: 0=hover, 90=cruise.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(VectorThrusterBuilder);
