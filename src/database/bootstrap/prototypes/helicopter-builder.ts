import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Helicopter prototype
 * A rotorcraft that can take off/land vertically and fly in 3D
 */
export class HelicopterBuilder implements Builder {
  static provides = ['helicopter'];
  static depends = [
    'aircraft',
    'engine',
    'fuelTank',
    'vehicleBattery',
    'rotor',
    'mainRotor',
    'tailRotor',
    'pocket',
  ];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('helicopter');
    if (existing) {
      this.obj = existing;
    } else {
      const aircraft = await this.manager.load('aircraft');
      if (!aircraft) throw new Error('Aircraft type not found');

      this.obj = await this.manager.define('helicopter', aircraft, {
        properties: {
          name: 'Helicopter',
          description: 'A rotorcraft capable of vertical takeoff and landing',
          // Override required parts for helicopter
          requiredParts: [
            'engine',
            'fuelTank',
            'battery',
            'rotor', // Main rotor
            'tailRotor', // Tail rotor for stability
          ],
          // Helicopter-specific doors
          doors: [
            { name: 'pilot door', side: 'left', locked: false, lock: null },
            { name: 'co-pilot door', side: 'right', locked: false, lock: null },
            { name: 'cargo door', side: 'rear', locked: false, lock: null },
          ],
          // Helicopter seating
          seats: [
            { name: 'pilot', capacity: 1, occupied: [] },
            { name: 'co-pilot', capacity: 1, occupied: [] },
            { name: 'passenger-left', capacity: 1, occupied: [] },
            { name: 'passenger-right', capacity: 1, occupied: [] },
          ],
          // Cargo hold
          cargo: null, // Will be a pocket/container objref
          // Physical
          weight: 2500000, // 2500kg base (light helicopter)
          armor: 3, // Less armored than cars
          // Flight characteristics
          cruiseAltitude: 50, // 150m default (lower than fixed-wing)
          maxAltitude: 100, // 300m (helicopters fly lower)
          maxSpeed: 60, // m/s (~216 km/h)
          // Abilities
          abilities: `Rotorcraft with VTOL. Jet fuel, ~200L tank, ~0.25 L/km. High idle burn.

Main + tail rotor required. Lands anywhere outdoors. Loud.
4 seats (pilot, co-pilot, 2 passengers), cargo hold.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Factory method to create a fully-equipped helicopter
    obj.setMethod(
      'create',
      `
      /**
       * Factory method to create a complete helicopter with all parts.
       * @param options - Optional configuration
       *   - name: Custom name (default: 'Helicopter')
       *   - engineType: 'engine' (default) - helicopters use specialized engines
       *   - fuel: Starting fuel (default: 100)
       *   - location: Room to spawn in
       * @returns The created helicopter object
       */
      const options = args[0] || {};

      // Create the helicopter instance
      const heli = await $recycler.create($helicopter, {
        name: options.name || 'Helicopter',
        description: options.description || 'A light utility helicopter',
      });

      // Create and install engine (helicopter turboshaft)
      const engine = await $recycler.create($engine, {
        name: 'Turboshaft Engine',
        description: 'Helicopter turboshaft engine powering the rotors',
        horsepower: 500,
        maxSpeed: 60, // m/s
        fuelEfficiency: 0.25, // Helicopters use more fuel
        fuelType: 'jet fuel',
      });
      await heli.installPart(engine);

      // Create and install fuel tank
      const tank = await $recycler.create($fuelTank, {
        capacity: 200, // Larger tank for flight
        fuel: options.fuel ?? 200,
        fuelType: 'jet fuel',
      });
      await heli.installPart(tank);

      // Create and install battery
      const battery = await $recycler.create($vehicleBattery, {
        charge: 100,
      });
      await heli.installPart(battery);

      // Create and install main rotor
      const mainRotor = await $recycler.create($mainRotor, {});
      await heli.installPart(mainRotor);

      // Create and install tail rotor
      const tailRotor = await $recycler.create($tailRotor, {});
      await heli.installPart(tailRotor);

      // Create cargo hold as a pocket/container
      const cargo = await $recycler.create($pocket, {
        name: 'cargo hold',
        maxWeight: 200000, // 200kg
        maxVolume: 1000000, // 1000 liters
      });
      await cargo.moveTo(heli);
      heli.cargo = cargo;

      // Move to location if specified
      if (options.location) {
        await heli.moveTo(options.location);
      }

      return heli;
      `,
    );

    // Override startEngine to spin up rotors
    obj.setMethod(
      'startEngine',
      `
      /**
       * Start the engine and spin up rotors.
       */
      // Call parent startEngine
      const result = await pass();
      if (result !== true) return result;

      // Spin up rotors
      const rotors = await self.getParts('rotor');
      const tailRotors = await self.getParts('tailRotor');
      const allRotors = [...rotors, ...tailRotors];

      for (const rotor of allRotors) {
        if (rotor && rotor.spinUp) {
          await rotor.spinUp();
        }
      }

      return true;
      `,
    );

    // Override stopEngine to spin down rotors
    obj.setMethod(
      'stopEngine',
      `
      /**
       * Stop the engine and spin down rotors.
       */
      // Spin down rotors
      const rotors = await self.getParts('rotor');
      const tailRotors = await self.getParts('tailRotor');
      const allRotors = [...rotors, ...tailRotors];

      for (const rotor of allRotors) {
        if (rotor && rotor.spinDown) {
          await rotor.spinDown();
        }
      }

      // Call parent stopEngine
      return await pass();
      `,
    );

    // Override canStart to check rotors
    obj.setMethod(
      'canStart',
      `
      /**
       * Check if helicopter can start (all parts including rotors functional).
       */
      // Check base vehicle requirements first
      const baseResult = await pass();
      if (baseResult !== true) return baseResult;

      // Check tail rotor specifically
      const tailRotors = await self.getParts('tailRotor');
      const functionalTail = tailRotors.filter(r => r && r.isFunctional && r.isFunctional());
      if (functionalTail.length === 0) {
        if (tailRotors.length === 0) {
          return 'Missing tail rotor';
        } else {
          return 'Tail rotor is damaged';
        }
      }

      return true;
      `,
    );

    // Override describe to show helicopter-specific info
    obj.setMethod(
      'describe',
      `
      const viewer = args[0];

      // Get base aircraft description
      let output = await pass(viewer);

      // Add cargo info
      const cargo = self.cargo;
      if (cargo) {
        const contents = cargo.contents || [];
        if (contents.length > 0) {
          output += '\\r\\nCargo hold contains:\\r\\n';
          for (const item of contents) {
            if (item) {
              const desc = item.shortDesc ? await item.shortDesc() : item.name;
              output += '  - ' + desc + '\\r\\n';
            }
          }
        } else {
          output += '\\r\\nCargo hold: empty\\r\\n';
        }
      }

      // Show rotor status
      const mainRotor = await self.getPart('rotor');
      const tailRotor = await self.getPart('tailRotor');

      if (mainRotor) {
        const rpm = mainRotor.rpm || 0;
        const maxRpm = mainRotor.maxRpm || 400;
        const status = rpm > 0 ? (rpm >= maxRpm * 0.8 ? 'spinning' : 'spooling') : 'stopped';
        output += '\\r\\nMain rotor: ' + status;
      }

      if (tailRotor) {
        const rpm = tailRotor.rpm || 0;
        const maxRpm = tailRotor.maxRpm || 1200;
        const status = rpm > 0 ? (rpm >= maxRpm * 0.8 ? 'spinning' : 'spooling') : 'stopped';
        output += '\\r\\nTail rotor: ' + status;
      }

      return output;
      `,
    );

    // Access cargo hold
    obj.setMethod(
      'openCargo',
      `
      /**
       * Get the cargo container.
       * @returns The cargo hold or error string
       */
      if (self.travelState) {
        return 'Cannot access cargo while in flight';
      }
      if (self.inFlight) {
        return 'Cannot access cargo while airborne';
      }
      return self.cargo;
      `,
    );

    // Put item in cargo
    obj.setMethod(
      'putInCargo',
      `
      /**
       * Put an item in the cargo hold.
       * @param item - The item to store
       * @returns true on success, error string on failure
       */
      const item = args[0];
      if (!item) return 'No item specified';

      if (self.travelState || self.inFlight) {
        return 'Cannot access cargo in flight';
      }

      const cargo = self.cargo;
      if (!cargo) return 'This helicopter has no cargo hold';

      const result = await item.moveTo(cargo);
      return result || true;
      `,
    );

    // Take item from cargo
    obj.setMethod(
      'takeFromCargo',
      `
      /**
       * Take an item from the cargo hold.
       * @param item - The item to take
       * @param taker - The agent taking the item
       * @returns true on success, error string on failure
       */
      const item = args[0];
      const taker = args[1];

      if (!item) return 'No item specified';

      if (self.travelState || self.inFlight) {
        return 'Cannot access cargo in flight';
      }

      const cargo = self.cargo;
      if (!cargo) return 'This helicopter has no cargo hold';

      // Check item is in cargo
      const cargoContents = cargo.contents || [];
      if (!cargoContents.some(c => c && c.id === item.id)) {
        return 'That item is not in the cargo hold';
      }

      // Move to taker or room
      const destination = taker || self.location;
      const result = await item.moveTo(destination, taker);
      return result || true;
      `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'cargo',
      'Objref to cargo hold storage container.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[HelicopterBuilder] Type 'helicopter' auto-aliased`);
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(HelicopterBuilder);
