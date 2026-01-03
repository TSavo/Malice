import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the FuelTank prototype
 * Stores fuel for the vehicle's engine
 */
export class FuelTankBuilder implements Builder {
  static provides = ['fuelTank'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('fuelTank');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('fuelTank', vehiclePart, {
        properties: {
          name: 'Fuel Tank',
          description: 'Container that stores fuel for the vehicle',
          partType: 'fuelTank',
          // Capacity and current level
          capacity: 60, // Liters
          fuel: 60, // Current fuel level in liters
          // Fuel type
          fuelType: 'gasoline', // gasoline, diesel, electric (for battery packs)
          // Physical
          weight: 15000, // grams (15kg empty, fuel adds weight)
          // AI-readable abilities
          abilities: `Fuel storage container for vehicles.

CAPACITY: 'capacity' is maximum liters. 'fuel' is current level.
Cannot exceed capacity when refueling.

FUEL TYPE: 'fuelType' must match engine's fuelType.
Gasoline and diesel are not interchangeable.
Electric vehicles use battery packs instead.

WEIGHT: Empty tank weight plus fuel weight (gasoline ~0.75 kg/L).
Full tank adds significant weight to vehicle.

DAMAGE: Damaged tank may leak fuel. Severe damage risks fire/explosion.
At damage > 80, tank leaks 1 liter per km.

REFUELING: Fill at gas stations. Electric 'tanks' charge at stations.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Get current fuel percentage
    obj.setMethod(
      'getFuelPercent',
      `
      /**
       * Get fuel level as percentage of capacity.
       * @returns Fuel percentage 0-100
       */
      const fuel = self.fuel ?? 0;
      const capacity = self.capacity ?? 60;
      return Math.round((fuel / capacity) * 100);
    `,
    );

    // Add fuel (refuel)
    obj.setMethod(
      'addFuel',
      `
      /**
       * Add fuel to the tank.
       * @param amount - Liters to add
       * @returns Actual amount added (may be less if tank nearly full)
       */
      const amount = args[0] ?? 0;
      const currentFuel = self.fuel ?? 0;
      const capacity = self.capacity ?? 60;

      const spaceAvailable = capacity - currentFuel;
      const actualAdded = Math.min(amount, spaceAvailable);

      self.fuel = currentFuel + actualAdded;

      return actualAdded;
    `,
    );

    // Consume fuel
    obj.setMethod(
      'consumeFuel',
      `
      /**
       * Consume fuel from the tank.
       * @param amount - Liters to consume
       * @returns Actual amount consumed (may be less if tank nearly empty)
       */
      const amount = args[0] ?? 0;
      const currentFuel = self.fuel ?? 0;

      const actualConsumed = Math.min(amount, currentFuel);
      self.fuel = currentFuel - actualConsumed;

      // Check for leaks due to damage
      const damage = self.damage ?? 0;
      if (damage > 80) {
        // Leaking tank loses extra fuel
        const leakage = Math.min(self.fuel, 0.5);
        self.fuel -= leakage;
      }

      return actualConsumed;
    `,
    );

    // Get total weight including fuel
    obj.setMethod(
      'getTotalWeight',
      `
      /**
       * Get total weight including fuel.
       * @returns Weight in grams
       */
      const baseWeight = self.weight ?? 15000;
      const fuel = self.fuel ?? 0;
      const fuelType = self.fuelType ?? 'gasoline';

      // Fuel weight per liter in grams
      const fuelDensity = fuelType === 'diesel' ? 850 : 750; // diesel heavier
      const fuelWeight = fuel * fuelDensity;

      return baseWeight + fuelWeight;
    `,
    );

    // Describe
    obj.setMethod(
      'describe',
      `
      const fuel = self.fuel ?? 0;
      const capacity = self.capacity ?? 60;
      const fuelType = self.fuelType ?? 'gasoline';
      const percent = Math.round((fuel / capacity) * 100);
      const damage = self.damage ?? 0;

      let state = '';
      if (damage > 80) state = ' [LEAKING]';
      else if (damage > 50) state = ' (damaged)';
      else if (damage > 20) state = ' (dented)';

      const installed = self.installed
        ? \` [installed in \${self.installed.name}]\`
        : '';

      let fuelBar = '';
      const bars = Math.round(percent / 10);
      fuelBar = '[' + '█'.repeat(bars) + '░'.repeat(10 - bars) + ']';

      return \`\${self.name}\${state}\${installed}
\${self.description}
Fuel: \${fuel.toFixed(1)}L / \${capacity}L (\${percent}%) \${fuelBar}
Type: \${fuelType}\`;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription('capacity', 'Maximum fuel capacity in liters.');
    obj.setPropertyDescription('fuel', 'Current fuel level in liters.');
    obj.setPropertyDescription(
      'fuelType',
      'Type of fuel: gasoline, diesel, or electric.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(FuelTankBuilder);
