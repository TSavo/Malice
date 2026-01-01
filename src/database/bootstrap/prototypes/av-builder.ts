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
          abilities: `VTOL flying car. Takes off and lands vertically using vector thrust.

PROPULSION: Uses vectorThrusters instead of rotors. Quieter, more maneuverable.
Requires 2 functional vectorThrusters for stable flight.

FLIGHT MODES:
- Hover: thrusters at vectorAngle=0, stationary in air
- Cruise: thrusters at vectorAngle=90, forward flight
- Transition: thrusters between 0-90 during takeoff/landing

TAKEOFF: From any outdoor surface. Thrusters activate, vehicle rises.
No runway needed. Can take off from streets, rooftops, parking lots.

LANDING: Can land anywhere with clearance. Streets, rooftops, helipads.
More versatile than helicopters (no rotor wash concerns).

URBAN FLIGHT: Designed for city flying. Lower altitude than aircraft.
Can navigate between buildings, land on rooftops.

POWER: Electric-hybrid. Battery powers thrusters, fuel powers generator.
More efficient than pure fuel but battery limits range.

DRIVING: Can also drive on ground like a car when thrusters inactive.
Use drive() for ground movement, fly() for aerial movement.`,
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
      const airspaceRooms = await $query()
        .prop('isAirspace').equals(true)
        .prop('x').equals(x)
        .prop('y').equals(y)
        .prop('z').equals(z)
        .all();

      let airspace = airspaceRooms[0];
      if (!airspace && $.airspace && $.airspace.getOrCreate) {
        airspace = await $.airspace.getOrCreate(x, y, z);
      }

      if (airspace) {
        await self.moveTo(airspace);
      }

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
