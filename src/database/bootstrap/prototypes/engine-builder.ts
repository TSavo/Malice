import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Engine prototype and engine variants
 * Engines determine vehicle speed and fuel efficiency
 */
export class EngineBuilder implements Builder {
  static provides = ['engine', 'v4Engine', 'v6Engine', 'v8Engine', 'electricMotor'];
  static depends = ['vehiclePart'];

  private engine: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    await this.buildEngine();
    await this.buildV4Engine();
    await this.buildV6Engine();
    await this.buildV8Engine();
    await this.buildElectricMotor();
  }

  private async buildEngine(): Promise<void> {
    const existing = await this.manager.load('engine');
    if (existing) {
      this.engine = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.engine = await this.manager.define('engine', vehiclePart, {
        properties: {
          name: 'Engine',
          description: 'Internal combustion or electric motor that powers a vehicle',
          partType: 'engine',
          // Performance characteristics
          horsepower: 100, // Base HP
          maxSpeed: 40, // m/s (~144 km/h, ~90 mph)
          fuelEfficiency: 0.12, // Liters per km (lower is better)
          // Physical
          weight: 150000, // grams (150kg)
          // Fuel compatibility
          fuelType: 'gasoline', // gasoline, diesel, electric
          // AI-readable abilities
          abilities: `Vehicle power unit. Determines speed and fuel consumption.

PERFORMANCE: 'horsepower' affects acceleration. 'maxSpeed' is top speed in m/s.
Higher condition = better performance. Damaged engine loses power.

FUEL: 'fuelEfficiency' is liters consumed per km. Must match fuelTank's fuelType.
Electric motors use 'electric' fuelType and measure in kWh/km.

STARTING: Engine requires battery charge >= 10 to start.
Non-functional engine (damage >= 80 or condition <= 20) won't start.

SOUND: Running engine makes noise. Louder at higher speeds.
Electric motors are quieter than combustion engines.`,
        },
        methods: {},
      });
    }

    const obj = this.engine;

    // Get effective max speed based on condition
    obj.setMethod(
      'getEffectiveMaxSpeed',
      `
      /**
       * Get max speed adjusted for engine condition.
       * @returns Effective max speed in m/s
       */
      const baseSpeed = self.maxSpeed ?? 40;
      const condition = self.condition ?? 100;

      // Performance scales with condition
      // At 100% condition: full speed
      // At 50% condition: 75% speed
      // At 20% condition: 50% speed
      const conditionFactor = 0.5 + (condition / 100) * 0.5;

      return baseSpeed * conditionFactor;
    `,
    );

    // Get effective fuel efficiency based on condition
    obj.setMethod(
      'getEffectiveFuelEfficiency',
      `
      /**
       * Get fuel efficiency adjusted for engine condition.
       * Damaged engines consume more fuel.
       * @returns Effective fuel consumption in liters/km
       */
      const baseEfficiency = self.fuelEfficiency ?? 0.12;
      const condition = self.condition ?? 100;
      const damage = self.damage ?? 0;

      // Worse condition = more fuel consumption
      // At 100% condition: base efficiency
      // At 50% condition: 125% fuel usage
      // At 20% condition: 150% fuel usage
      const conditionPenalty = 1 + ((100 - condition) / 100) * 0.5;

      // Damage also increases consumption
      const damagePenalty = 1 + (damage / 100) * 0.3;

      return baseEfficiency * conditionPenalty * damagePenalty;
    `,
    );

    obj.setMethod(
      'describe',
      `
      const hp = self.horsepower ?? 100;
      const speed = self.maxSpeed ?? 40;
      const speedKmh = Math.round(speed * 3.6);
      const efficiency = self.fuelEfficiency ?? 0.12;
      const fuelType = self.fuelType ?? 'gasoline';
      const condition = self.condition ?? 100;
      const damage = self.damage ?? 0;

      let state = '';
      if (!self.isFunctional()) state = ' [NON-FUNCTIONAL]';
      else if (damage > 50) state = ' (damaged)';
      else if (condition < 80) state = ' (worn)';

      const installed = self.installed
        ? \` [installed in \${self.installed.name}]\`
        : '';

      return \`\${self.name}\${state}\${installed}
\${self.description}
Horsepower: \${hp} HP
Max Speed: \${speedKmh} km/h
Fuel Type: \${fuelType}
Efficiency: \${(efficiency * 100).toFixed(1)} L/100km
Condition: \${condition}%\`;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'horsepower',
      'Engine power in HP. Affects acceleration.',
    );
    obj.setPropertyDescription(
      'maxSpeed',
      'Maximum speed in m/s. Multiply by 3.6 for km/h.',
    );
    obj.setPropertyDescription(
      'fuelEfficiency',
      'Fuel consumption in liters per km. Lower is better.',
    );
    obj.setPropertyDescription(
      'fuelType',
      'Required fuel type: gasoline, diesel, or electric.',
    );
  }

  private async buildV4Engine(): Promise<void> {
    const existing = await this.manager.load('v4Engine');
    if (existing) return;

    const engine = await this.manager.load('engine');
    if (!engine) throw new Error('Engine type not found');

    await this.manager.define('v4Engine', engine, {
        properties: {
          name: '4-Cylinder Engine',
          description: 'Economical 4-cylinder engine. Good fuel efficiency, modest power.',
          horsepower: 120,
          maxSpeed: 45, // ~162 km/h
          fuelEfficiency: 0.08, // 8 L/100km
          weight: 120000, // 120kg
        },
        methods: {},
      });
  }

  private async buildV6Engine(): Promise<void> {
    const existing = await this.manager.load('v6Engine');
    if (existing) return;

    const engine = await this.manager.load('engine');
    if (!engine) throw new Error('Engine type not found');

    await this.manager.define('v6Engine', engine, {
      properties: {
        name: 'V6 Engine',
        description: 'Balanced 6-cylinder engine. Good power and reasonable efficiency.',
        horsepower: 280,
        maxSpeed: 55, // ~198 km/h
        fuelEfficiency: 0.11, // 11 L/100km
        weight: 180000, // 180kg
      },
      methods: {},
    });
  }

  private async buildV8Engine(): Promise<void> {
    const existing = await this.manager.load('v8Engine');
    if (existing) return;

    const engine = await this.manager.load('engine');
    if (!engine) throw new Error('Engine type not found');

    await this.manager.define('v8Engine', engine, {
      properties: {
        name: 'V8 Engine',
        description: 'Powerful 8-cylinder engine. High performance, drinks fuel.',
        horsepower: 450,
        maxSpeed: 70, // ~252 km/h
        fuelEfficiency: 0.16, // 16 L/100km
        weight: 250000, // 250kg
      },
      methods: {},
    });
  }

  private async buildElectricMotor(): Promise<void> {
    const existing = await this.manager.load('electricMotor');
    if (existing) return;

    const engine = await this.manager.load('engine');
    if (!engine) throw new Error('Engine type not found');

    await this.manager.define('electricMotor', engine, {
        properties: {
          name: 'Electric Motor',
          description: 'Silent electric motor. Instant torque, zero emissions, quiet operation.',
          horsepower: 300,
          maxSpeed: 50, // ~180 km/h (often electronically limited)
          fuelEfficiency: 0.02, // 0.2 kWh/km equivalent (very efficient)
          fuelType: 'electric',
          weight: 80000, // 80kg (lighter than combustion)
          abilities: `Silent electric power unit.

PERFORMANCE: Instant torque from 0 RPM. Smooth, quiet acceleration.
'fuelType' is 'electric' - requires compatible battery/charging.

EFFICIENCY: Much more efficient than combustion. Lower operating costs.
Regenerative braking can recover some energy.

SOUND: Nearly silent operation. Harder to detect by sound.

CHARGING: Recharges from electrical sources, not fuel pumps.`,
        },
        methods: {},
      });
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
  }

  getObject(): RuntimeObject | null {
    return this.engine;
  }
}

registerBuilder(EngineBuilder);
