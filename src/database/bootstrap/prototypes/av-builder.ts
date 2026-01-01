import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the AV (Aerial Vehicle) prototype
 * A flying car / VTOL vehicle using vector thrust
 */
export class AvBuilder implements Builder {
  static provides = ['av'];
  static depends = [
    'aircraft',
    'fuelTank',
    'vehicleBattery',
    'vectorThruster',
    'starter',
    'alternator',
    'ecu',
    'wiringHarness',
  ];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('av');
    if (existing) {
      this.obj = existing;
    } else {
      const aircraft = await this.manager.load('aircraft');
      if (!aircraft) throw new Error('Aircraft type not found');

      this.obj = await this.manager.define('av', aircraft, {
        properties: {
          name: 'Aerial Vehicle',
          description: 'A sleek flying car with vector thrust propulsion',
          // AV identification
          isAV: true,
          // Override required parts - AVs use vector thrusters, not rotors
          requiredParts: [
            'fuelTank',
            'battery',
            'starter',
            'alternator',
            'ecu',
            'wiringHarness',
            'vectorThruster',
            'vectorThruster', // Dual thrusters for stability
          ],
          // Seating like a car
          seats: [
            { name: 'driver', capacity: 1, occupied: [] },
            { name: 'passenger', capacity: 1, occupied: [] },
            { name: 'rear', capacity: 2, occupied: [] },
          ],
          // Doors
          doors: [
            { name: 'driver door', side: 'left', locked: false, lock: null },
            { name: 'passenger door', side: 'right', locked: false, lock: null },
          ],
          // Flight characteristics
          maxSpeed: 80, // m/s (~288 km/h)
          cruiseAltitude: 50, // Lower than aircraft - urban flight
          maxAltitude: 100, // Stay below major air traffic
          // Physical
          weight: 1200000, // 1200kg (lighter than car, needs to fly)
          armor: 3, // Less armor than ground car
          // AI-readable abilities
          abilities: `VTOL flying car. Electric-hybrid: battery + fuel generator.

FLIGHT: Uses $spatial.ensureRoom(x,y,z,'AV flying') for airspace rooms.
AI creates airspace ONLY if outdoor room exists below (ground or lower airspace).
If AI says no (returns null), cannot fly there.

2 vector thrusters required. Quiet. Lands anywhere outdoors.
Battery limits flight time. Low battery = forced landing. Recharge at stations.

ROOMS ARE PERMANENT: Airspace stays forever once created.
Can drive on ground when not flying. Urban flight, low altitude.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Check if AV can fly (both thrusters functional)
    obj.setMethod(
      'canFly',
      `
      /**
       * Check if AV has enough thrust to fly.
       * @returns true if can fly, or error string
       */
      const thrusters = await self.getParts('vectorThruster');
      const functional = thrusters.filter(t => t && t.isFunctional && t.isFunctional());

      if (functional.length < 2) {
        return 'Need 2 functional thrusters to fly (have ' + functional.length + ')';
      }

      // Check total thrust vs weight
      let totalThrust = 0;
      for (const t of functional) {
        totalThrust += await t.getEffectiveThrust();
      }

      const weightNewtons = (self.weight || 1200000) / 1000 * 9.81;
      if (totalThrust < weightNewtons) {
        return 'Insufficient thrust for weight';
      }

      // Check battery
      const battery = await self.getBattery();
      if (!battery || battery.charge < 10) {
        return 'Battery too low for flight';
      }

      return true;
    `,
    );

    // Activate thrusters for flight
    obj.setMethod(
      'activateThrusters',
      `
      /**
       * Activate all thrusters for flight.
       * @returns true on success
       */
      const thrusters = await self.getParts('vectorThruster');
      for (const t of thrusters) {
        if (t && t.activate) {
          await t.activate();
        }
      }
      return true;
    `,
    );

    // Deactivate thrusters
    obj.setMethod(
      'deactivateThrusters',
      `
      /**
       * Deactivate all thrusters.
       */
      const thrusters = await self.getParts('vectorThruster');
      for (const t of thrusters) {
        if (t && t.deactivate) {
          await t.deactivate();
        }
      }
      return true;
    `,
    );

    // Set thrust vector for all thrusters
    obj.setMethod(
      'setThrustVector',
      `
      /**
       * Set thrust vector angle on all thrusters.
       * @param angle - 0 (hover) to 90 (cruise)
       */
      const angle = args[0] ?? 0;
      const thrusters = await self.getParts('vectorThruster');
      for (const t of thrusters) {
        if (t && t.setVector) {
          await t.setVector(angle);
        }
      }
      return angle;
    `,
    );

    // Override takeoff for AV-specific behavior
    obj.setMethod(
      'takeoff',
      `
      /**
       * Take off using vector thrust.
       * @returns true on success, error string on failure
       */
      if (self.inFlight) return 'Already airborne';

      const canFly = await self.canFly();
      if (canFly !== true) return canFly;

      // Activate thrusters in hover mode
      await self.activateThrusters();
      await self.setThrustVector(0); // Vertical thrust

      // Rise to altitude
      self.inFlight = true;

      // Create/join airspace above current location
      const currentRoom = self.location;
      if (!currentRoom) return 'No location';

      const x = currentRoom.x ?? 0;
      const y = currentRoom.y ?? 0;
      const z = 1; // Just above ground

      // Find or create airspace room
      // AI decides if airspace makes sense (needs outdoor ground below)
      const airspace = await $spatial.ensureRoom(currentRoom, x, y, z, 'AV taking off, needs airspace above outdoor ground');
      if (!airspace) {
        self.inFlight = false;
        return 'Cannot take off here - no valid airspace';
      }

      await self.moveTo(airspace);

      // Announce
      if (currentRoom.announce) {
        await currentRoom.announce(self, null, {
          others: self.name + ' rises into the air on pillars of thrust.'
        });
      }

      return true;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'isAV',
      'true for aerial vehicles with vector thrust.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(AvBuilder);
