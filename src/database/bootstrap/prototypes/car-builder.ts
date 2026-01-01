import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Car prototype
 * A 4-door vehicle with trunk
 */
export class CarBuilder implements Builder {
  static provides = ['car'];
  static depends = ['vehicle', 'engine', 'fuelTank', 'vehicleBattery', 'wheel', 'transmission', 'pocket'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('car');
    if (existing) {
      this.obj = existing;
    } else {
      const vehicle = await this.manager.load('vehicle');
      if (!vehicle) throw new Error('Vehicle type not found');

      this.obj = await this.manager.define('car', vehicle, {
        properties: {
          name: 'Car',
          description: 'A four-door sedan with trunk space',
          // Override required parts for ground vehicle
          requiredParts: [
            'engine',
            'fuelTank',
            'battery',
            'transmission',
            'wheel', 'wheel', 'wheel', 'wheel', // 4 wheels
          ],
          // 4 doors
          doors: [
            { name: 'driver door', side: 'left', locked: false, lock: null },
            { name: 'passenger door', side: 'right', locked: false, lock: null },
            { name: 'rear left door', side: 'left', locked: false, lock: null },
            { name: 'rear right door', side: 'right', locked: false, lock: null },
          ],
          // 4 seats
          seats: [
            { name: 'driver', capacity: 1, occupied: [] },
            { name: 'passenger', capacity: 1, occupied: [] },
            { name: 'back-left', capacity: 1, occupied: [] },
            { name: 'back-right', capacity: 1, occupied: [] },
          ],
          // Trunk (created by factory)
          trunk: null, // Will be a pocket/container objref
          // Physical
          weight: 1400000, // 1400kg base
          armor: 5,
          // Abilities
          abilities: `Four-door sedan. Gasoline engine, ~60L tank, ~0.08 L/km.

4 seats, 4 doors, trunk storage. Needs engine, tank, battery, transmission, 4 wheels.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Factory method to create a fully-equipped car
    obj.setMethod(
      'create',
      `
      /**
       * Factory method to create a complete car with all parts installed.
       * @param options - Optional configuration
       *   - engineType: 'v4Engine' | 'v6Engine' | 'v8Engine' | 'electricMotor' (default: 'v4Engine')
       *   - name: Custom name for the car
       *   - location: Room to spawn in
       * @returns The created car object
       */
      const options = args[0] || {};

      // Create the car instance
      const car = await $recycler.create($car, {
        name: options.name || 'Car',
        description: options.description || 'A four-door sedan',
      });

      // Create and install engine
      const engineType = options.engineType || 'v4Engine';
      const engineProto = await $load(engineType);
      const engine = await $recycler.create(engineProto, {});
      await car.installPart(engine);

      // Create and install fuel tank
      const tank = await $recycler.create($fuelTank, {
        fuel: options.fuel ?? 60, // Full tank by default
      });
      await car.installPart(tank);

      // Create and install battery
      const battery = await $recycler.create($vehicleBattery, {
        charge: 100,
      });
      await car.installPart(battery);

      // Create and install transmission
      const trans = await $recycler.create($transmission, {
        automatic: options.automatic ?? true,
      });
      await car.installPart(trans);

      // Create and install 4 wheels
      const positions = ['front-left', 'front-right', 'rear-left', 'rear-right'];
      for (const pos of positions) {
        const wheel = await $recycler.create($wheel, {
          position: pos,
        });
        await car.installPart(wheel);
      }

      // Create trunk as a pocket/container
      const trunk = await $recycler.create($pocket, {
        name: 'trunk',
        maxWeight: 50000, // 50kg
        maxVolume: 400000, // 400 liters
      });
      await trunk.moveTo(car);
      car.trunk = trunk;

      // Move to location if specified
      if (options.location) {
        await car.moveTo(options.location);
      }

      return car;
    `,
    );

    // Override describe to show trunk
    obj.setMethod(
      'describe',
      `
      const viewer = args[0];

      // Get base description from parent
      let output = await pass(viewer);

      // Add trunk info
      const trunk = self.trunk;
      if (trunk) {
        const contents = trunk.contents || [];
        if (contents.length > 0) {
          output += '\\r\\nTrunk contains:\\r\\n';
          for (const item of contents) {
            if (item) {
              const desc = item.shortDesc ? await item.shortDesc() : item.name;
              output += \`  - \${desc}\\r\\n\`;
            }
          }
        } else {
          output += '\\r\\nTrunk: empty\\r\\n';
        }
      }

      return output;
    `,
    );

    // Access trunk
    obj.setMethod(
      'openTrunk',
      `
      /**
       * Get the trunk container.
       * @returns The trunk object or error string
       */
      if (self.travelState) {
        return 'Cannot access trunk while moving';
      }
      return self.trunk;
    `,
    );

    // Put item in trunk
    obj.setMethod(
      'putInTrunk',
      `
      /**
       * Put an item in the trunk.
       * @param item - The item to store
       * @returns true on success, error string on failure
       */
      const item = args[0];
      if (!item) return 'No item specified';

      if (self.travelState) {
        return 'Cannot access trunk while moving';
      }

      const trunk = self.trunk;
      if (!trunk) return 'This vehicle has no trunk';

      const result = await item.moveTo(trunk);
      return result || true;
    `,
    );

    // Take item from trunk
    obj.setMethod(
      'takeFromTrunk',
      `
      /**
       * Take an item from the trunk.
       * @param item - The item to take
       * @param taker - The agent taking the item
       * @returns true on success, error string on failure
       */
      const item = args[0];
      const taker = args[1];

      if (!item) return 'No item specified';

      if (self.travelState) {
        return 'Cannot access trunk while moving';
      }

      const trunk = self.trunk;
      if (!trunk) return 'This vehicle has no trunk';

      // Check item is in trunk
      const trunkContents = trunk.contents || [];
      if (!trunkContents.some(c => c && c.id === item.id)) {
        return 'That item is not in the trunk';
      }

      // Move to taker (if specified) or room
      const destination = taker || self.location;
      const result = await item.moveTo(destination, taker);
      return result || true;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'trunk',
      'Objref to trunk storage container (pocket).',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CarBuilder);
