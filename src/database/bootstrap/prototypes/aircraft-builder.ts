import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Aircraft prototype
 *
 * A vehicle that can fly in 3D space, using $airspace for dynamic
 * airspace room management. Extends $vehicle with flight capabilities.
 *
 * Coordinate system: 30m per x/y unit, 3m per z unit.
 * Airspace starts at z > 0 (ground is z=0).
 */
export class AircraftBuilder implements Builder {
  static provides = ['aircraft'];
  static depends = ['vehicle', 'airspace', 'airspaceRoom'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('aircraft');
    if (existing) {
      this.obj = existing;
    } else {
      const vehicle = await this.manager.load('vehicle');
      if (!vehicle) throw new Error('Vehicle type not found');

      this.obj = await this.manager.define('aircraft', vehicle, {
        properties: {
          name: 'Aircraft',
          description: 'An aircraft capable of flight',
          // Aircraft identification
          isAircraft: true,
          // Flight state
          inFlight: false,
          landedIn: null, // Ground room when landed (helipad, airport)
          // Altitude settings
          cruiseAltitude: 100, // Default z-level (300m)
          maxAltitude: 200, // Maximum z-level (600m)
          climbRate: 1, // z-levels per minute (not used for instant movement)
          // Override required parts for aircraft
          requiredParts: ['engine', 'fuelTank', 'battery', 'rotor'],
          // AI-readable abilities
          abilities: `Aircraft capable of 3D flight through airspace.

FLIGHT vs GROUND: Unlike ground vehicles that use exits, aircraft fly
directly between coordinates. Use takeoff(), fly(), and land().

TAKEOFF: Call takeoff() when parked on ground (helipad, airport).
Creates/joins airspace room at z=1 above current position.
Sets inFlight=true.

FLYING: Call fly(heading) with direction: north, south, east, west,
northeast, northwest, southeast, southwest, up, down.
Or fly(heading, targetAltitude) to specify exact z-level.
Movement is scheduled like ground vehicles.

LANDING: Call land() to descend to ground directly below.
Or land(destination) for specific landing zone.
Returns to ground room, sets inFlight=false.

COORDINATES: Same 30m grid as ground. z is 3m per unit.
z=10 = 30m altitude. z=100 = 300m (cruising). z=200 = 600m (max).

AIRSPACE ROOMS: Dynamic rooms at altitude managed by $airspace.
Aircraft at same x,y,z share the room (can see each other).
Rooms recycled when last aircraft leaves.

PARTS: Requires engine, fuelTank, battery, and rotor (or jet).
Damaged rotor = can't maintain flight.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // ============== TAKEOFF ==============

    obj.setMethod(
      'takeoff',
      `
      /**
       * Take off from ground into airspace.
       * @returns true on success, error string on failure
       */
      if (self.inFlight) return 'Already airborne';

      // Check can start (all parts functional)
      const canStart = await self.canStart();
      if (canStart !== true) return canStart;

      // Must have engine running
      if (!self.engineRunning) {
        const startResult = await self.startEngine();
        if (startResult !== true) return startResult;
      }

      // Get current ground coordinates
      const room = self.location;
      if (!room) return 'Not in a valid location';

      const x = room.x ?? 0;
      const y = room.y ?? 0;

      // Remember where we took off from
      self.landedIn = room;

      // Get/create airspace room at z=1 (initial altitude)
      const airRoom = await $airspace.getOrCreateRoom(x, y, 1);
      if (!airRoom) return 'Cannot enter airspace here';

      // Set flight state
      self.inFlight = true;

      // Move to airspace
      await self.moveTo(airRoom);

      // Announce to ground
      if (room.announce) {
        await room.announce(self, null, {
          others: self.name + ' lifts off into the sky.'
        });
      }

      // Tell passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('The aircraft lifts off. The ground drops away below.');
          }
        }
      }

      return true;
      `,
    );

    // ============== FLY ==============

    obj.setMethod(
      'fly',
      `
      /**
       * Fly in a direction or to a target altitude.
       * @param heading - Direction (north, south, east, west, up, down, etc.)
       * @param targetAltitude - Optional z-level to fly to
       * @returns true on success, error string on failure
       */
      const heading = args[0];
      const targetAltitude = args[1];

      if (!heading) return 'Specify a direction to fly';
      if (!self.inFlight) return 'Not airborne - use takeoff first';
      if (self.travelState) return 'Already moving';

      // Check parts still functional
      const canStart = await self.canStart();
      if (canStart !== true) {
        // Emergency - parts failed mid-flight
        return 'Mechanical failure: ' + canStart;
      }

      // Check driver/pilot
      if (!self.driver) return 'No one is piloting';

      // Get current position
      const room = self.location;
      if (!room) return 'Invalid position';

      const x = room.x ?? 0;
      const y = room.y ?? 0;
      const z = room.z ?? 1;

      // Calculate destination from heading
      const directions = {
        north: { dx: 0, dy: 1 },
        south: { dx: 0, dy: -1 },
        east: { dx: 1, dy: 0 },
        west: { dx: -1, dy: 0 },
        northeast: { dx: 1, dy: 1 },
        northwest: { dx: -1, dy: 1 },
        southeast: { dx: 1, dy: -1 },
        southwest: { dx: -1, dy: -1 },
        n: { dx: 0, dy: 1 },
        s: { dx: 0, dy: -1 },
        e: { dx: 1, dy: 0 },
        w: { dx: -1, dy: 0 },
        ne: { dx: 1, dy: 1 },
        nw: { dx: -1, dy: 1 },
        se: { dx: 1, dy: -1 },
        sw: { dx: -1, dy: -1 },
      };

      const lowerHeading = heading.toLowerCase();
      const dir = directions[lowerHeading];

      let destX = x;
      let destY = y;
      let destZ = targetAltitude ?? z;

      if (dir) {
        destX = x + dir.dx;
        destY = y + dir.dy;
      } else if (lowerHeading === 'up' || lowerHeading === 'u') {
        destZ = z + 1;
      } else if (lowerHeading === 'down' || lowerHeading === 'd') {
        destZ = Math.max(1, z - 1); // Can't go below z=1 in flight
      } else {
        return 'Unknown heading: ' + heading;
      }

      // Check altitude limits
      const maxAlt = self.maxAltitude || 200;
      if (destZ > maxAlt) {
        return 'Maximum altitude reached';
      }

      // Calculate distance and duration
      // 30m horizontal, 3m vertical (consistent with buildings)
      const dx = (destX - x) * 30;
      const dy = (destY - y) * 30;
      const dz = (destZ - z) * 3;
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

      const maxSpeed = await self.getMaxSpeed();
      if (maxSpeed <= 0) return 'No engine power';

      const duration = Math.ceil((distance / maxSpeed) * 1000); // ms

      // Get/create destination airspace room
      const destRoom = await $airspace.getOrCreateRoom(destX, destY, destZ);
      if (!destRoom) {
        return 'Cannot fly there';
      }

      // Set travel state
      self.travelState = {
        destRoom: destRoom,
        startTime: Date.now(),
        duration: duration,
        distance: distance,
        schedulerJob: 'aircraft_' + self.id + '_' + Date.now()
      };

      // Schedule arrival
      await $scheduler.schedule(
        self.travelState.schedulerJob,
        duration,
        0,
        self,
        'arrive'
      );

      // Tell passengers
      const altitude = destZ * 3;
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            if (dir) {
              await passenger.tell('Flying ' + heading + '...');
            } else {
              await passenger.tell('Adjusting altitude to ' + altitude + 'm...');
            }
          }
        }
      }

      return true;
      `,
    );

    // ============== ARRIVE (Override for aircraft) ==============

    obj.setMethod(
      'arrive',
      `
      /**
       * Called when aircraft arrives at destination.
       * Overrides vehicle arrive() to handle airspace cleanup.
       */
      if (!self.travelState) return;

      // Get current room before moving (for cleanup)
      const oldRoom = self.location;
      const destRoom = self.travelState.destRoom;
      const distance = self.travelState.distance || 0;

      // Clear travel state
      self.travelState = null;

      // Move to destination
      await self.moveTo(destRoom);

      // Consume fuel
      const efficiency = await self.getFuelEfficiency();
      const fuelUsed = (distance / 1000) * efficiency;
      await self.consumeFuel(fuelUsed);

      // Release old airspace room if it was airspace
      if (oldRoom && oldRoom.airspace) {
        await $airspace.releaseRoom(oldRoom);
      }

      // Tell passengers
      const altitude = (destRoom.z || 1) * 3;
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('Arrived at ' + altitude + 'm altitude.');
          }
        }
      }
      `,
    );

    // ============== LAND ==============

    obj.setMethod(
      'land',
      `
      /**
       * Land the aircraft.
       * @param destination - Optional specific ground room to land at
       * @returns true on success, error string on failure
       */
      const destination = args[0];

      if (!self.inFlight) return 'Already on the ground';
      if (self.travelState) return 'Cannot land while moving - stop first';

      // Get current airspace position
      const airRoom = self.location;
      if (!airRoom) return 'Invalid position';

      const x = airRoom.x ?? 0;
      const y = airRoom.y ?? 0;
      const z = airRoom.z ?? 1;

      // Find landing spot
      let landingSpot = destination;
      if (!landingSpot) {
        // Find ground room directly below (z=0)
        landingSpot = await $spatial.getRoomDataAt(x, y, 0);
        if (!landingSpot) {
          return 'No safe landing zone below';
        }
      }

      // Check valid landing surface
      if (!landingSpot.outdoor) {
        return 'Cannot land indoors';
      }

      // Calculate descent time (altitude * 3m per z-level)
      const altitude = z * 3;
      const descentSpeed = 10; // m/s vertical descent
      const duration = Math.ceil((altitude / descentSpeed) * 1000);

      // Set travel state for descent
      self.travelState = {
        destRoom: landingSpot,
        startTime: Date.now(),
        duration: duration,
        distance: altitude,
        schedulerJob: 'aircraft_land_' + self.id + '_' + Date.now(),
        isLanding: true
      };

      // Schedule landing arrival
      await $scheduler.schedule(
        self.travelState.schedulerJob,
        duration,
        0,
        self,
        'arriveLanding'
      );

      // Tell passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('Descending to ' + landingSpot.name + '...');
          }
        }
      }

      return true;
      `,
    );

    // ============== ARRIVE LANDING ==============

    obj.setMethod(
      'arriveLanding',
      `
      /**
       * Called when aircraft completes landing.
       */
      if (!self.travelState) return;

      const oldRoom = self.location;
      const destRoom = self.travelState.destRoom;

      // Clear travel state
      self.travelState = null;
      self.inFlight = false;

      // Move to ground
      await self.moveTo(destRoom);

      // Consume some fuel for landing
      await self.consumeFuel(0.5);

      // Release airspace room
      if (oldRoom && oldRoom.airspace) {
        await $airspace.releaseRoom(oldRoom);
      }

      // Announce landing
      if (destRoom.announce) {
        await destRoom.announce(self, null, {
          others: self.name + ' touches down.'
        });
      }

      // Tell passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('You have landed at ' + destRoom.name + '.');
          }
        }
      }
      `,
    );

    // ============== COORDINATE OVERRIDE ==============

    obj.setMethod(
      'getCurrentCoordinates',
      `
      /**
       * Get aircraft's current 3D coordinates (interpolated if traveling).
       * @returns {x, y, z} coordinates
       */
      const room = self.location;
      if (!room) return { x: 0, y: 0, z: 0 };

      const roomCoords = { x: room.x || 0, y: room.y || 0, z: room.z || 0 };

      if (!self.travelState) {
        return roomCoords;
      }

      // Interpolate between origin and destination
      const elapsed = Date.now() - self.travelState.startTime;
      const progress = Math.min(1, elapsed / self.travelState.duration);

      const destRoom = self.travelState.destRoom;
      const destCoords = { x: destRoom.x || 0, y: destRoom.y || 0, z: destRoom.z || 0 };

      return {
        x: roomCoords.x + (destCoords.x - roomCoords.x) * progress,
        y: roomCoords.y + (destCoords.y - roomCoords.y) * progress,
        z: roomCoords.z + (destCoords.z - roomCoords.z) * progress
      };
      `,
    );

    // ============== ALTITUDE METHODS ==============

    obj.setMethod(
      'getAltitude',
      `
      /**
       * Get current altitude in meters.
       * @returns Altitude in meters (z * 3)
       */
      const coords = await self.getCurrentCoordinates();
      return coords.z * 3;
      `,
    );

    obj.setMethod(
      'setAltitude',
      `
      /**
       * Fly to a specific altitude.
       * @param altitudeMeters - Target altitude in meters
       * @returns true on success, error string on failure
       */
      const altitudeMeters = args[0];
      if (typeof altitudeMeters !== 'number') return 'Specify altitude in meters';

      const targetZ = Math.round(altitudeMeters / 3);
      return await self.fly('up', targetZ); // Uses targetAltitude override
      `,
    );

    // ============== DESCRIBE OVERRIDE ==============

    obj.setMethod(
      'describe',
      `
      /**
       * Describe aircraft to a viewer (enhanced for flight info).
       */
      const viewer = args[0];

      let output = 'Inside ' + self.name + '\\r\\n';

      // Flight status
      if (self.inFlight) {
        const altitude = await self.getAltitude();
        output += 'Status: Airborne at ' + altitude + 'm\\r\\n';

        if (self.travelState) {
          if (self.travelState.isLanding) {
            output += 'Descending...\\r\\n';
          } else {
            output += 'In flight...\\r\\n';
          }
        }
      } else {
        output += 'Status: Landed\\r\\n';
      }

      // Engine status
      const engineStatus = self.engineRunning ? 'running' : 'off';
      output += 'Engine: ' + engineStatus + '\\r\\n';

      // Fuel level
      const fuel = await self.getFuel();
      const tank = await self.getFuelTank();
      const capacity = tank ? tank.capacity : 60;
      const fuelPercent = Math.round((fuel / capacity) * 100);
      output += 'Fuel: ' + fuelPercent + '%\\r\\n';

      // Seats and occupants
      output += '\\r\\nSeats:\\r\\n';
      for (const seat of (self.seats || [])) {
        const occupied = seat.occupied || [];
        if (occupied.length > 0) {
          const names = occupied.map(p => p?.name || 'someone').join(', ');
          output += '  ' + seat.name + ': ' + names + '\\r\\n';
        } else {
          output += '  ' + seat.name + ': empty\\r\\n';
        }
      }

      // Damage
      if (self.damage > 0) {
        let damageDesc = '';
        if (self.destroyed) damageDesc = 'DESTROYED';
        else if (self.disabled) damageDesc = 'disabled';
        else if (self.damage > 50) damageDesc = 'heavily damaged';
        else if (self.damage > 20) damageDesc = 'damaged';
        else damageDesc = 'minor damage';
        output += '\\r\\nCondition: ' + damageDesc + '\\r\\n';
      }

      return output;
      `,
    );

    // ============== LOOK OUTSIDE OVERRIDE ==============

    obj.setMethod(
      'lookOutside',
      `
      /**
       * Describe what's below the aircraft.
       */
      const viewer = args[0];
      const room = self.location;

      if (!room) return 'Nothing visible.';

      if (self.inFlight) {
        // In flight - describe airspace and ground below
        const altitude = await self.getAltitude();
        let output = altitude + 'm above the ground.\\r\\n';
        output += 'Open sky in all directions.\\r\\n';

        // Find ground below
        const x = room.x ?? 0;
        const y = room.y ?? 0;
        const groundRoom = await $spatial.getRoomDataAt(x, y, 0);
        if (groundRoom) {
          output += '\\r\\nBelow: ' + groundRoom.name;
        }

        // Show other aircraft
        const contents = room.contents || [];
        const others = contents.filter(c => c && c.isAircraft && c.id !== self.id);
        if (others.length > 0) {
          output += '\\r\\n\\r\\nNearby aircraft:';
          for (const other of others) {
            output += '\\r\\n  - ' + (other.name || 'aircraft');
          }
        }

        return output;
      }

      // On ground - show room
      if (room.describe) {
        return await room.describe(viewer);
      }

      return room.name + '\\r\\n' + (room.description || '');
      `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'isAircraft',
      'Flag identifying this as an aircraft.',
    );
    obj.setPropertyDescription(
      'inFlight',
      'true if airborne, false if landed.',
    );
    obj.setPropertyDescription(
      'landedIn',
      'Ground room where aircraft is parked (when not flying).',
    );
    obj.setPropertyDescription(
      'cruiseAltitude',
      'Default z-level for cruising (100 = 300m).',
    );
    obj.setPropertyDescription(
      'maxAltitude',
      'Maximum z-level aircraft can fly (200 = 600m).',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[AircraftBuilder] Type 'aircraft' auto-aliased`);
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(AircraftBuilder);
