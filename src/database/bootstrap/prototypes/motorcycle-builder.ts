import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Motorcycle prototype
 * Two-wheeled ground vehicle
 */
export class MotorcycleBuilder implements Builder {
  static provides = ['motorcycle'];
  static depends = ['vehicle', 'engine', 'fuelTank', 'vehicleBattery', 'wheel', 'transmission', 'pocket'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('motorcycle');
    if (existing) {
      this.obj = existing;
    } else {
      const vehicle = await this.manager.load('vehicle');
      if (!vehicle) throw new Error('Vehicle type not found');

      this.obj = await this.manager.define('motorcycle', vehicle, {
        properties: {
          name: 'Motorcycle',
          description: 'A two-wheeled vehicle',
          requiredParts: [
            'engine',
            'fuelTank',
            'battery',
            'transmission',
            'wheel', 'wheel',
          ],
          doors: [], // No doors
          seats: [
            { name: 'driver', capacity: 1, occupied: [] },
            { name: 'pillion', capacity: 1, occupied: [] },
          ],
          saddlebags: null,
          weight: 200000, // 200kg
          armor: 0, // No protection
          speed: 180, // Faster than car
          fuelEfficiency: 0.04, // Better fuel economy

          abilities: `Two-wheeled vehicle. Fast, maneuverable, exposed.
1-2 riders, no doors. Rider and passenger fully exposed to elements and gunfire.
Can lane-split, fit through narrow gaps. Tips over if hit hard or rider shot.
Kickstand when parked. Helmet recommended.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    obj.setMethod(
      'create',
      `
      const options = args[0] || {};

      const bike = await $recycler.create($motorcycle, {
        name: options.name || 'Motorcycle',
        description: options.description || 'A two-wheeled vehicle',
      });

      // Engine (smaller, v4 default)
      const engineType = options.engineType || 'v4Engine';
      const engineProto = await $load(engineType);
      const engine = await $recycler.create(engineProto, {});
      await bike.installPart(engine);

      // Small fuel tank
      const tank = await $recycler.create($fuelTank, {
        capacity: 15,
        fuel: options.fuel ?? 15,
      });
      await bike.installPart(tank);

      // Battery
      const battery = await $recycler.create($vehicleBattery, { charge: 100 });
      await bike.installPart(battery);

      // Transmission
      const trans = await $recycler.create($transmission, { automatic: false });
      await bike.installPart(trans);

      // 2 wheels
      for (const pos of ['front', 'rear']) {
        const wheel = await $recycler.create($wheel, { position: pos });
        await bike.installPart(wheel);
      }

      // Saddlebags (small storage)
      const bags = await $recycler.create($pocket, {
        name: 'saddlebags',
        maxWeight: 10000,
        maxVolume: 40000,
      });
      await bags.moveTo(bike);
      bike.saddlebags = bags;

      if (options.location) {
        await bike.moveTo(options.location);
      }

      return bike;
    `,
    );

    obj.setPropertyDescription('saddlebags', 'Small storage containers on sides');
  }

  async registerAliases(): Promise<void> {
    console.log("[MotorcycleBuilder] Type 'motorcycle' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(MotorcycleBuilder);
