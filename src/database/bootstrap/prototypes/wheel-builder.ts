import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Wheel prototype
 * Vehicles require functional wheels to drive
 */
export class WheelBuilder implements Builder {
  static provides = ['wheel'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('wheel');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('wheel', vehiclePart, {
        properties: {
          name: 'Wheel',
          description: 'Tire and rim assembly for vehicle locomotion',
          partType: 'wheel',
          // Position on vehicle
          position: null, // 'front-left', 'front-right', 'rear-left', 'rear-right'
          // Tire condition (separate from part condition)
          tireCondition: 100, // 0-100, affects grip and puncture risk
          tirePressure: 100, // 0-100, affects handling and fuel efficiency
          // Physical
          weight: 25000, // grams (25kg for wheel+tire)
          // AI-readable abilities
          abilities: `Wheel and tire assembly for vehicle movement.

POSITION: 'position' indicates where mounted: front-left, front-right,
rear-left, rear-right. Vehicle needs all positions filled.

TIRE CONDITION: 'tireCondition' (0-100) is tire wear level.
Low condition = less grip, higher puncture risk.
At 0, tire is bald - dangerous and possibly illegal.

TIRE PRESSURE: 'tirePressure' (0-100) affects handling.
Low pressure = poor handling, higher fuel consumption.
At 0, tire is flat - vehicle cannot drive.

FLAT TIRE: If tireCondition < 10 or tirePressure < 10, wheel is non-functional.
Vehicle cannot drive with a flat tire.

REPAIR: Tires can be patched or replaced. Punctures lower pressure.
Spare tires may have limited speed rating.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Override isFunctional to check tire state
    obj.setMethod(
      'isFunctional',
      `
      /**
       * Check if wheel is functional (not flat, not destroyed).
       * @returns true if wheel can be used, false if flat/damaged
       */
      const condition = self.condition ?? 100;
      const damage = self.damage ?? 0;
      const tireCondition = self.tireCondition ?? 100;
      const tirePressure = self.tirePressure ?? 100;

      // Base functionality from parent
      if (condition <= 20 || damage >= 80) return false;

      // Tire-specific checks
      if (tireCondition < 10) return false; // Destroyed tire
      if (tirePressure < 10) return false; // Flat tire

      return true;
    `,
    );

    // Check if tire is flat
    obj.setMethod(
      'isFlat',
      `
      /**
       * Check if tire is flat (low pressure).
       * @returns true if flat
       */
      const tirePressure = self.tirePressure ?? 100;
      return tirePressure < 10;
    `,
    );

    // Puncture the tire
    obj.setMethod(
      'puncture',
      `
      /**
       * Puncture the tire, causing rapid pressure loss.
       * @param severity - How bad the puncture is (1-100)
       */
      const severity = args[0] ?? 50;

      // Lose pressure based on severity
      const pressureLoss = Math.min(severity, self.tirePressure ?? 100);
      self.tirePressure = (self.tirePressure ?? 100) - pressureLoss;

      // Severe punctures damage the tire too
      if (severity > 50) {
        self.tireCondition = Math.max(0, (self.tireCondition ?? 100) - (severity - 50));
      }

      return { tirePressure: self.tirePressure, tireCondition: self.tireCondition };
    `,
    );

    // Inflate tire
    obj.setMethod(
      'inflate',
      `
      /**
       * Inflate the tire (if not punctured).
       * @param amount - Pressure to add
       */
      const amount = args[0] ?? 100;
      const tireCondition = self.tireCondition ?? 100;

      // Can't fully inflate a damaged tire (it leaks)
      const maxPressure = tireCondition < 50 ? 50 : 100;

      self.tirePressure = Math.min(maxPressure, (self.tirePressure ?? 0) + amount);
      return self.tirePressure;
    `,
    );

    // Wear from driving
    obj.setMethod(
      'wear',
      `
      /**
       * Apply wear from driving.
       * @param distance - Kilometers driven
       */
      const distance = args[0] ?? 1;

      // Tires wear about 1% per 1000km under normal conditions
      const wearAmount = distance / 1000;
      self.tireCondition = Math.max(0, (self.tireCondition ?? 100) - wearAmount);

      return self.tireCondition;
    `,
    );

    // Describe
    obj.setMethod(
      'describe',
      `
      const position = self.position ?? 'unassigned';
      const tireCondition = self.tireCondition ?? 100;
      const tirePressure = self.tirePressure ?? 100;
      const damage = self.damage ?? 0;

      let state = '';
      if (tirePressure < 10) state = ' [FLAT]';
      else if (tireCondition < 20) state = ' [BALD]';
      else if (damage > 50) state = ' (damaged)';
      else if (tireCondition < 50) state = ' (worn)';

      const installed = self.installed
        ? \` [installed in \${self.installed.name}]\`
        : '';

      const posStr = position ? \`Position: \${position}\` : 'Not installed';

      return \`\${self.name}\${state}\${installed}
\${self.description}
\${posStr}
Tire: \${tireCondition}% tread, \${tirePressure}% pressure\`;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'position',
      'Where wheel is mounted: front-left, front-right, rear-left, rear-right.',
    );
    obj.setPropertyDescription(
      'tireCondition',
      'Tire tread wear 0-100. Below 10 = bald/destroyed.',
    );
    obj.setPropertyDescription(
      'tirePressure',
      'Tire pressure 0-100. Below 10 = flat tire.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(WheelBuilder);
