import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Boat prototype
 *
 * A surface watercraft that cannot dive. Simpler than submarines,
 * vulnerable to waves and can sink if damaged.
 */
export class BoatBuilder implements Builder {
  static provides = ['boat'];
  static depends = ['watercraft'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('boat');
    if (existing) {
      this.obj = existing;
    } else {
      const watercraft = await this.manager.load('watercraft');
      if (!watercraft) throw new Error('Watercraft type not found');

      this.obj = await this.manager.define('boat', watercraft, {
        properties: {
          name: 'Boat',
          description: 'A small surface vessel',
          // Boat characteristics
          isBoat: true,
          maxDepth: 0, // Surface only - cannot dive
          draft: 1, // Shallow draft
          buoyancy: 100,
          // Size category affects wave tolerance
          sizeCategory: 'small', // small, medium, large
          maxWaveHeight: 3, // Maximum wave height before capsize risk
          // Seating for small boat
          seats: [
            { name: 'helm', capacity: 1, occupied: [] },
            { name: 'bow', capacity: 2, occupied: [] },
            { name: 'stern', capacity: 2, occupied: [] },
          ],
          // Physical
          weight: 500000, // 500kg (small boat)
          // AI abilities
          abilities: `Small surface vessel. Cannot dive. Fuel-powered engine.

Shallow draft allows access to coastal shallows.
Vulnerable to waves - 'maxWaveHeight' determines safe conditions.
High waves risk capsize. Storm = stay in port.

sizeCategory affects stability: small < medium < large.
Damage reduces buoyancy. Below 50% buoyancy = sinking.

launch() to enter water, sail() to move, moor() to dock.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Factory method to create a complete boat
    obj.setMethod(
      'create',
      `
      /**
       * Factory: Create a complete boat with all parts.
       * @param options - Configuration options
       *   - name: Custom name (default: 'Boat')
       *   - fuel: Starting fuel (default: 50)
       *   - location: Room to spawn in
       * @returns The created boat
       */
      const options = args[0] || {};

      // Create the boat instance
      const boat = await $recycler.create($boat, {
        name: options.name || 'Boat',
        description: options.description || 'A small motorboat',
      });

      // Create and install engine
      const engine = await $recycler.create($engine, {
        name: 'Outboard Motor',
        description: 'A compact outboard engine',
        horsepower: 50,
        maxSpeed: 15, // m/s (~30 knots)
        fuelEfficiency: 0.1, // L/km
        fuelType: 'gasoline',
      });
      await boat.installPart(engine);

      // Create fuel tank
      const tank = await $recycler.create($fuelTank, {
        capacity: 60,
        fuel: options.fuel ?? 50,
        fuelType: 'gasoline',
      });
      await boat.installPart(tank);

      // Create battery
      const battery = await $recycler.create($vehicleBattery, {
        charge: 100,
      });
      await boat.installPart(battery);

      // Move to location if specified
      if (options.location) {
        await boat.moveTo(options.location);
      }

      return boat;
      `,
    );

    // Check if conditions are safe to sail
    obj.setMethod(
      'checkConditions',
      `
      /**
       * Check if current conditions are safe for this boat.
       * @returns true if safe, warning string if risky
       */
      const room = self.location;
      if (!room || !self.inWater) return true;

      const waves = room.waveHeight || 0;
      const maxWaves = self.maxWaveHeight || 3;

      if (waves > maxWaves) {
        return 'DANGER: Waves too high for this vessel!';
      }

      if (waves > maxWaves * 0.7) {
        return 'Warning: Rough conditions';
      }

      return true;
      `,
    );

    // Override sail to check conditions
    obj.setMethod(
      'sail',
      `
      /**
       * Sail with wave condition check.
       */
      const heading = args[0];

      // Check conditions before sailing
      const conditions = await self.checkConditions();
      if (conditions !== true) {
        // Still allow sailing but warn
        for (const seat of (self.seats || [])) {
          for (const passenger of (seat.occupied || [])) {
            if (passenger && passenger.tell) {
              await passenger.tell(conditions);
            }
          }
        }
      }

      // Call parent sail
      return await pass(heading);
      `,
    );

    // Capsize check (called by scheduler or wave events)
    obj.setMethod(
      'checkCapsize',
      `
      /**
       * Check for capsize in rough conditions.
       * @returns true if capsized
       */
      if (!self.inWater) return false;

      const room = self.location;
      if (!room) return false;

      const waves = room.waveHeight || 0;
      const maxWaves = self.maxWaveHeight || 3;
      const buoyancy = self.buoyancy || 100;

      // Calculate capsize risk
      // Higher waves + lower buoyancy = more risk
      const waveRisk = waves / maxWaves;
      const buoyancyFactor = 100 / buoyancy;
      const capsizeRisk = waveRisk * buoyancyFactor;

      // Random capsize check when risk > 1
      if (capsizeRisk > 1) {
        const roll = Math.random();
        if (roll < (capsizeRisk - 1) / 2) {
          // Capsize!
          await self.capsize();
          return true;
        }
      }

      return false;
      `,
    );

    // Capsize event
    obj.setMethod(
      'capsize',
      `
      /**
       * Boat capsizes. Ejects all passengers, starts sinking.
       */
      const room = self.location;

      // Announce
      if (room && room.announce) {
        await room.announce(self, null, {
          others: self.name + ' capsizes!'
        });
      }

      // Eject all passengers into the water
      for (const seat of (self.seats || [])) {
        const passengers = [...(seat.occupied || [])];
        seat.occupied = [];

        for (const passenger of passengers) {
          if (passenger) {
            await passenger.moveTo(room);
            if (passenger.tell) {
              await passenger.tell('You are thrown into the water as the boat capsizes!');
            }
          }
        }
      }

      self.driver = null;
      self.buoyancy = Math.max(0, (self.buoyancy || 100) - 50);

      // If buoyancy too low, sink
      if (self.buoyancy < 20) {
        await self.sink();
      }
      `,
    );

    // Sink event
    obj.setMethod(
      'sink',
      `
      /**
       * Boat sinks. Recycled after brief delay.
       */
      const room = self.location;

      // Announce
      if (room && room.announce) {
        await room.announce(self, null, {
          others: self.name + ' slips beneath the waves.'
        });
      }

      // Mark as destroyed
      self.destroyed = true;
      self.inWater = false;

      // Recycle after delay (let players see the message)
      await $scheduler.schedule(
        'sink_' + self.id,
        3000,
        0,
        $recycler,
        'recycle',
        self
      );
      `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'isBoat',
      'Flag identifying this as a boat.',
    );
    obj.setPropertyDescription(
      'sizeCategory',
      'Size: small, medium, large. Affects wave tolerance.',
    );
    obj.setPropertyDescription(
      'maxWaveHeight',
      'Maximum safe wave height in meters.',
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    console.log(`[BoatBuilder] Type 'boat' auto-aliased`);
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BoatBuilder);
