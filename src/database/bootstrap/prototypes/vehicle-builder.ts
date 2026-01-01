import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Vehicle prototype
 * A location that can move between rooms via exits
 */
export class VehicleBuilder implements Builder {
  static provides = ['vehicle'];
  static depends = ['location', 'vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('vehicle');
    if (existing) {
      this.obj = existing;
    } else {
      const location = await this.manager.load('location');
      if (!location) throw new Error('Location type not found');

      this.obj = await this.manager.define('vehicle', location, {
        properties: {
          name: 'Vehicle',
          description: 'A vehicle that can transport passengers between locations',
          // Parts system
          parts: [], // objrefs to installed $vehiclePart instances
          requiredParts: [
            'engine',
            'fuelTank',
            'battery',
            'starter',
            'alternator',
            'ecu',
            'wiringHarness',
            'brakes',
            'steering',
          ], // partTypes needed to function
          // State
          engineRunning: false,
          travelState: null, // { exit, destRoom, startTime, duration, distance, schedulerJob }
          // Driver and passengers
          driver: null, // objref to agent in driver seat
          seats: [
            { name: 'driver', capacity: 1, occupied: [] },
            { name: 'passenger', capacity: 1, occupied: [] },
          ],
          // Doors
          doors: [
            { name: 'driver door', side: 'left', locked: false, lock: null },
            { name: 'passenger door', side: 'right', locked: false, lock: null },
          ],
          // Multi-room support (all vehicles are multi-room by default)
          internalRooms: [], // Array of room refs - for simple vehicles, populated with [self] after creation
          entryRoom: null, // Which room to enter when boarding - for simple vehicles, set to self after creation
          // Combat/damage
          damage: 0, // Body damage 0-100
          armor: 5, // Damage reduction from exterior attacks
          windowsBroken: [], // Which windows are broken (no cover)
          disabled: false, // At 80+ damage
          destroyed: false, // At 100 damage
          // Physical
          weight: 1500000, // grams (1500kg base, parts add more)
          // AI abilities
          abilities: `Vehicle carrying passengers between outdoor locations.

FUEL: Engine consumes fuel while running (idle or driving). Empty tank = engine dies.
Driving consumes 'fuelEfficiency' L/km. Idle consumes ~0.05 L/min.

PARTS: Needs 'requiredParts' functional. Damaged parts (>80) fail.

DRIVING: Driver seat + engine running + fuel. Travel time = distance / speed.

ENTERING/EXITING: Through doors when stopped. Doors can be locked.

DAMAGE: 'armor' reduces incoming. 80+ = disabled. 100 = destroyed.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // ============== PARTS MANAGEMENT ==============

    obj.setMethod(
      'getPart',
      `
      /**
       * Get first installed part of given type.
       * @param partType - The partType to find (e.g., 'engine', 'fuelTank')
       * @returns The part object or null
       */
      const partType = args[0];
      const parts = self.parts || [];
      for (const part of parts) {
        if (part && part.partType === partType) {
          return part;
        }
      }
      return null;
    `,
    );

    obj.setMethod(
      'getParts',
      `
      /**
       * Get all installed parts of given type.
       * @param partType - The partType to find (e.g., 'wheel')
       * @returns Array of matching parts
       */
      const partType = args[0];
      const parts = self.parts || [];
      return parts.filter(p => p && p.partType === partType);
    `,
    );

    obj.setMethod(
      'getEngine',
      `
      /** Shorthand for getPart('engine') */
      return await self.getPart('engine');
    `,
    );

    obj.setMethod(
      'getFuelTank',
      `
      /** Shorthand for getPart('fuelTank') */
      return await self.getPart('fuelTank');
    `,
    );

    obj.setMethod(
      'getBattery',
      `
      /** Shorthand for getPart('battery') */
      return await self.getPart('battery');
    `,
    );

    obj.setMethod(
      'installPart',
      `
      /**
       * Install a part into this vehicle.
       * @param part - The part to install
       * @returns true on success, error string on failure
       */
      const part = args[0];
      if (!part) return 'No part specified';

      // Check if traveling
      if (self.travelState) return 'Cannot install parts while moving';

      // Check if part is already installed elsewhere
      if (part.installed && part.installed.id !== self.id) {
        return 'Part is already installed in another vehicle';
      }

      // Move part into vehicle and add to parts array
      await part.moveTo(self);
      if (!self.parts) self.parts = [];
      if (!self.parts.includes(part)) {
        self.parts.push(part);
      }
      part.installed = self;

      return true;
    `,
    );

    obj.setMethod(
      'removePart',
      `
      /**
       * Remove a part from this vehicle.
       * @param part - The part to remove
       * @returns true on success, error string on failure
       */
      const part = args[0];
      if (!part) return 'No part specified';

      // Check if traveling
      if (self.travelState) return 'Cannot remove parts while moving';

      // Remove from parts array
      self.parts = (self.parts || []).filter(p => p && p.id !== part.id);
      part.installed = null;

      // Move part to current room
      const room = self.location;
      if (room) {
        await part.moveTo(room);
      }

      return true;
    `,
    );

    // ============== REQUIRED PARTS CHECK ==============

    obj.setMethod(
      'canStart',
      `
      /**
       * Check if all required parts are present and functional.
       * @returns true if can start, or error string explaining why not
       */
      const required = self.requiredParts || [];
      const parts = self.parts || [];

      for (const partType of required) {
        // Find all parts of this type
        const matching = parts.filter(p => p && p.partType === partType);
        const functional = matching.filter(p => p.isFunctional && p.isFunctional());

        if (functional.length === 0) {
          if (matching.length === 0) {
            return \`Missing \${partType}\`;
          } else {
            return \`\${partType} is broken\`;
          }
        }
      }

      // Check battery charge
      const battery = await self.getBattery();
      if (battery && !battery.canStart()) {
        return 'Battery is dead';
      }

      // Check fuel
      const tank = await self.getFuelTank();
      if (tank && tank.fuel <= 0) {
        return 'Out of fuel';
      }

      // Check if vehicle is disabled/destroyed
      if (self.destroyed) return 'Vehicle is destroyed';
      if (self.disabled) return 'Vehicle is disabled';

      return true;
    `,
    );

    obj.setMethod(
      'hasFunctionalParts',
      `
      /**
       * Check if all required parts are functional.
       * @returns true if all parts functional, false otherwise
       */
      const result = await self.canStart();
      return result === true;
    `,
    );

    // ============== SPEED AND FUEL ==============

    obj.setMethod(
      'getMaxSpeed',
      `
      /**
       * Get max speed from engine (adjusted for condition).
       * @returns Speed in m/s
       */
      const engine = await self.getEngine();
      if (!engine) return 0;
      if (engine.getEffectiveMaxSpeed) {
        return engine.getEffectiveMaxSpeed();
      }
      return engine.maxSpeed || 0;
    `,
    );

    obj.setMethod(
      'getFuelEfficiency',
      `
      /**
       * Get fuel efficiency from engine.
       * @returns Liters per km
       */
      const engine = await self.getEngine();
      if (!engine) return 0.2; // Default bad efficiency
      if (engine.getEffectiveFuelEfficiency) {
        return engine.getEffectiveFuelEfficiency();
      }
      return engine.fuelEfficiency || 0.12;
    `,
    );

    obj.setMethod(
      'getFuel',
      `
      /**
       * Get current fuel level from tank.
       * @returns Liters of fuel
       */
      const tank = await self.getFuelTank();
      return tank ? (tank.fuel || 0) : 0;
    `,
    );

    obj.setMethod(
      'consumeFuel',
      `
      /**
       * Consume fuel from tank.
       * @param amount - Liters to consume
       */
      const amount = args[0] || 0;
      const tank = await self.getFuelTank();
      if (tank && tank.consumeFuel) {
        await tank.consumeFuel(amount);
      }
    `,
    );

    obj.setMethod(
      'refuel',
      `
      /**
       * Add fuel to tank.
       * @param amount - Liters to add
       * @returns Actual amount added
       */
      const amount = args[0] || 0;
      const tank = await self.getFuelTank();
      if (tank && tank.addFuel) {
        return await tank.addFuel(amount);
      }
      return 0;
    `,
    );

    // ============== ENGINE CONTROL ==============

    obj.setMethod(
      'startEngine',
      `
      /**
       * Attempt to start the engine.
       * @returns true on success, error string on failure
       */
      if (self.engineRunning) return 'Engine is already running';

      const canStart = await self.canStart();
      if (canStart !== true) {
        return canStart; // Return the error message
      }

      // Drain some battery to start
      const battery = await self.getBattery();
      if (battery && battery.drain) {
        await battery.drain(2);
      }

      self.engineRunning = true;

      // Put transmission in neutral
      const trans = await self.getPart('transmission');
      if (trans && trans.shift) {
        await trans.shift(0);
      }

      // Schedule engine tick for idle fuel consumption
      const tickJob = 'engine_tick_' + self.id;
      await $scheduler.schedule(tickJob, 60000, 60000, self, 'engineTick');

      return true;
    `,
    );

    obj.setMethod(
      'stopEngine',
      `
      /**
       * Turn off the engine.
       */
      self.engineRunning = false;

      // Unschedule engine tick
      const tickJob = 'engine_tick_' + self.id;
      await $scheduler.unschedule(tickJob);

      return true;
    `,
    );

    obj.setMethod(
      'engineTick',
      `
      /**
       * Called every minute when engine is running.
       * Consumes idle fuel and checks for depletion.
       */
      if (!self.engineRunning) return;

      // Get idle fuel consumption rate (liters per minute)
      const engine = await self.getEngine();
      const idleRate = engine?.idleFuelRate || 0.05; // Default 0.05 L/min

      // Consume fuel
      await self.consumeFuel(idleRate);

      // Check if out of fuel
      const fuel = await self.getFuel();
      if (fuel <= 0) {
        // Engine dies
        self.engineRunning = false;

        // Unschedule this tick
        const tickJob = 'engine_tick_' + self.id;
        await $scheduler.unschedule(tickJob);

        // Tell occupants
        for (const seat of (self.seats || [])) {
          for (const passenger of (seat.occupied || [])) {
            if (passenger && passenger.tell) {
              await passenger.tell('The engine sputters and dies. Out of fuel.');
            }
          }
        }
      }
    `,
    );

    // ============== MOVEMENT ==============

    obj.setMethod(
      'drive',
      `
      /**
       * Drive in a direction (follow an exit).
       * @param direction - Exit direction (north, south, etc.)
       * @returns true on success, error string on failure
       */
      const direction = args[0];
      if (!direction) return 'Specify a direction to drive';

      // Check if already traveling
      if (self.travelState) return 'Already traveling';

      // Check engine
      if (!self.engineRunning) return 'Engine is not running';

      // Check can start (parts functional)
      const canStart = await self.canStart();
      if (canStart !== true) {
        await self.stopEngine();
        return canStart;
      }

      // Check driver
      if (!self.driver) return 'No one is driving';

      // Find exit in current room
      const room = self.location;
      if (!room) return 'Vehicle is not in a valid location';

      const exit = room.findExit ? await room.findExit(direction) : null;
      if (!exit) return \`No road \${direction}\`;

      // Check if exit allows vehicles
      if (exit.vehicleAllowed === false) {
        return "Can't drive through there";
      }

      // Get exit distance
      const distance = exit.distance || 10; // meters

      // Get vehicle speed
      const maxSpeed = await self.getMaxSpeed();
      if (maxSpeed <= 0) return 'Engine has no power';

      // Calculate travel time
      const duration = Math.ceil((distance / maxSpeed) * 1000); // ms

      // Get destination room
      const destRoom = exit.destRoom || exit.destination;
      if (!destRoom) return 'Exit leads nowhere';

      // Put transmission in drive
      const trans = await self.getPart('transmission');
      if (trans && trans.shift) {
        await trans.shift(1);
      }

      // Set travel state
      self.travelState = {
        exit: exit,
        destRoom: destRoom,
        startTime: Date.now(),
        duration: duration,
        distance: distance,
        schedulerJob: 'vehicle_' + self.id + '_' + Date.now()
      };

      // Start exclusions for passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && $.exclusions) {
            await $.exclusions.start(passenger, 'in_vehicle:' + self.id, {
              vehicle: self,
              message: "You're in a moving vehicle"
            });
          }
        }
      }

      // Schedule arrival
      await $.scheduler.schedule(
        self.travelState.schedulerJob,
        duration,
        0,
        self,
        'arrive'
      );

      // Announce departure
      if (room.announce) {
        await room.announce(self, null, {
          others: \`\${self.name} drives \${direction}.\`
        });
      }

      // Tell passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell(\`The vehicle heads \${direction}.\`);
          }
        }
      }

      return true;
    `,
    );

    obj.setMethod(
      'arrive',
      `
      /**
       * Called when vehicle arrives at destination.
       */
      if (!self.travelState) return;

      const destRoom = self.travelState.destRoom;
      const distance = self.travelState.distance || 0;

      // Consume fuel
      const efficiency = await self.getFuelEfficiency();
      const fuelUsed = (distance / 1000) * efficiency;
      await self.consumeFuel(fuelUsed);

      // Wear tires slightly
      const wheels = await self.getParts('wheel');
      for (const wheel of wheels) {
        if (wheel && wheel.wear) {
          await wheel.wear(distance / 1000);
        }
      }

      // Recharge battery slightly while driving
      const battery = await self.getBattery();
      if (battery && battery.recharge) {
        await battery.recharge(1);
      }

      // Clear travel state before move
      const jobName = self.travelState.schedulerJob;
      self.travelState = null;

      // Move vehicle to destination
      await self.moveTo(destRoom);

      // Put in neutral
      const trans = await self.getPart('transmission');
      if (trans && trans.shift) {
        await trans.shift(0);
      }

      // Announce arrival
      if (destRoom.announce) {
        await destRoom.announce(self, null, {
          others: \`\${self.name} arrives.\`
        });
      }

      // Tell passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            const roomName = destRoom.name || 'somewhere';
            await passenger.tell(\`You arrive at \${roomName}.\`);
          }
        }
      }
    `,
    );

    obj.setMethod(
      'stop',
      `
      /**
       * Stop the vehicle mid-travel.
       * @returns true on success
       */
      if (!self.travelState) return 'Not traveling';

      // Cancel the scheduled arrival
      if (self.travelState.schedulerJob && $.scheduler) {
        await $.scheduler.unschedule(self.travelState.schedulerJob);
      }

      // Calculate partial fuel consumption
      const elapsed = Date.now() - self.travelState.startTime;
      const progress = Math.min(1, elapsed / self.travelState.duration);
      const distance = (self.travelState.distance || 0) * progress;

      const efficiency = await self.getFuelEfficiency();
      const fuelUsed = (distance / 1000) * efficiency;
      await self.consumeFuel(fuelUsed);

      // Clear travel state
      self.travelState = null;

      // Put in neutral
      const trans = await self.getPart('transmission');
      if (trans && trans.shift) {
        await trans.shift(0);
      }

      // Tell passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('The vehicle stops.');
          }
        }
      }

      return true;
    `,
    );

    // ============== COORDINATES ==============

    obj.setMethod(
      'getCurrentCoordinates',
      `
      /**
       * Get vehicle's current coordinates (interpolated if traveling).
       * @returns {x, y, z} coordinates
       */
      const room = self.location;
      if (!room) return { x: 0, y: 0, z: 0 };

      const roomCoords = room.getCoordinates
        ? await room.getCoordinates()
        : { x: room.x || 0, y: room.y || 0, z: room.z || 0 };

      if (!self.travelState) {
        return roomCoords;
      }

      // Interpolate between origin and destination
      const elapsed = Date.now() - self.travelState.startTime;
      const progress = Math.min(1, elapsed / self.travelState.duration);

      const destRoom = self.travelState.destRoom;
      const destCoords = destRoom.getCoordinates
        ? await destRoom.getCoordinates()
        : { x: destRoom.x || 0, y: destRoom.y || 0, z: destRoom.z || 0 };

      return {
        x: roomCoords.x + (destCoords.x - roomCoords.x) * progress,
        y: roomCoords.y + (destCoords.y - roomCoords.y) * progress,
        z: roomCoords.z + (destCoords.z - roomCoords.z) * progress
      };
    `,
    );

    // ============== PASSENGER MANAGEMENT ==============

    obj.setMethod(
      'getSeat',
      `
      /**
       * Get a seat by name.
       * @param seatName - Name of seat to find
       * @returns Seat object or null
       */
      const seatName = args[0];
      const seats = self.seats || [];
      return seats.find(s => s.name === seatName) || null;
    `,
    );

    obj.setMethod(
      'getAvailableSeat',
      `
      /**
       * Find an available seat.
       * @param preferredSeat - Optional preferred seat name
       * @returns Seat object or null if all full
       */
      const preferredSeat = args[0];
      const seats = self.seats || [];

      // Try preferred seat first
      if (preferredSeat) {
        const pref = seats.find(s => s.name === preferredSeat);
        if (pref && (pref.occupied || []).length < (pref.capacity || 1)) {
          return pref;
        }
      }

      // Find any available seat
      for (const seat of seats) {
        if ((seat.occupied || []).length < (seat.capacity || 1)) {
          return seat;
        }
      }

      return null;
    `,
    );

    obj.setMethod(
      'enterVehicle',
      `
      /**
       * Have an agent enter the vehicle.
       * @param agent - The agent entering
       * @param seatName - Optional preferred seat
       * @returns true on success, error string on failure
       */
      const agent = args[0];
      const seatName = args[1];

      if (!agent) return 'No agent specified';

      // Check if traveling
      if (self.travelState) return 'Cannot enter a moving vehicle';

      // Find available seat
      const seat = await self.getAvailableSeat(seatName);
      if (!seat) return 'No available seats';

      // TODO: Check door is unlocked

      // Determine entry room (multi-room support)
      // entryRoom is where the agent enters - for simple vehicles, this is self
      const entry = self.entryRoom || self;

      // Move agent into entry room
      const moveResult = await agent.moveTo(entry, agent);
      if (moveResult && typeof moveResult === 'string') {
        return moveResult; // Return error from moveTo
      }

      // Add to seat
      if (!seat.occupied) seat.occupied = [];
      seat.occupied.push(agent);

      // Set as driver if driver seat
      if (seat.name === 'driver') {
        self.driver = agent;
      }

      // Start exclusion
      if ($.exclusions) {
        await $.exclusions.start(agent, 'in_vehicle:' + self.id, {
          vehicle: self,
          message: "You're in a vehicle"
        });
      }

      return true;
    `,
    );

    obj.setMethod(
      'exitVehicle',
      `
      /**
       * Have an agent exit the vehicle.
       * @param agent - The agent exiting
       * @returns true on success, error string on failure
       */
      const agent = args[0];
      if (!agent) return 'No agent specified';

      // Check if traveling
      if (self.travelState) return 'Cannot exit a moving vehicle';

      // Find which seat they're in
      let foundSeat = null;
      for (const seat of (self.seats || [])) {
        const occupied = seat.occupied || [];
        const idx = occupied.findIndex(p => p && p.id === agent.id);
        if (idx >= 0) {
          foundSeat = seat;
          seat.occupied.splice(idx, 1);
          break;
        }
      }

      if (!foundSeat) return 'Agent is not in this vehicle';

      // Clear driver if was driving
      if (self.driver && self.driver.id === agent.id) {
        self.driver = null;
      }

      // End exclusion
      if ($.exclusions) {
        await $.exclusions.end(agent, 'in_vehicle:' + self.id);
      }

      // Move to room
      const room = self.location;
      if (room) {
        await agent.moveTo(room, agent);
      }

      return true;
    `,
    );

    // ============== PERCEPTION ==============

    obj.setMethod(
      'describe',
      `
      /**
       * Describe vehicle interior to a viewer.
       */
      const viewer = args[0];

      let output = \`Inside \${self.name}\\r\\n\`;

      // Engine status
      const engineStatus = self.engineRunning ? 'running' : 'off';
      output += \`Engine: \${engineStatus}\\r\\n\`;

      // Fuel level
      const fuel = await self.getFuel();
      const tank = await self.getFuelTank();
      const capacity = tank ? tank.capacity : 60;
      const fuelPercent = Math.round((fuel / capacity) * 100);
      output += \`Fuel: \${fuelPercent}%\\r\\n\`;

      // Travel status
      if (self.travelState) {
        const destName = self.travelState.destRoom?.name || 'destination';
        output += \`Traveling to \${destName}...\\r\\n\`;
      }

      // Seats and occupants
      output += '\\r\\nSeats:\\r\\n';
      for (const seat of (self.seats || [])) {
        const occupied = seat.occupied || [];
        if (occupied.length > 0) {
          const names = occupied.map(p => p?.name || 'someone').join(', ');
          output += \`  \${seat.name}: \${names}\\r\\n\`;
        } else {
          output += \`  \${seat.name}: empty\\r\\n\`;
        }
      }

      // Contents (items in vehicle, excluding passengers)
      const contents = self.contents || [];
      const items = contents.filter(c => {
        if (!c) return false;
        // Exclude passengers
        for (const seat of (self.seats || [])) {
          for (const p of (seat.occupied || [])) {
            if (p && p.id === c.id) return false;
          }
        }
        // Exclude parts
        for (const part of (self.parts || [])) {
          if (part && part.id === c.id) return false;
        }
        return true;
      });

      if (items.length > 0) {
        output += '\\r\\nItems:\\r\\n';
        for (const item of items) {
          const desc = item.shortDesc ? await item.shortDesc() : item.name;
          output += \`  - \${desc}\\r\\n\`;
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
        output += \`\\r\\nCondition: \${damageDesc}\\r\\n\`;
      }

      return output;
    `,
    );

    obj.setMethod(
      'lookOutside',
      `
      /**
       * Describe what's outside the vehicle (current room).
       */
      const viewer = args[0];
      const room = self.location;

      if (!room) return 'Nothing visible outside.';

      if (self.travelState) {
        // Moving - blurred view
        const destName = self.travelState.destRoom?.name || 'somewhere';
        return \`The world rushes by as you head toward \${destName}.\`;
      }

      // Parked - show room
      if (room.describe) {
        return await room.describe(viewer);
      }

      return room.name + '\\r\\n' + (room.description || '');
    `,
    );

    // ============== DAMAGE ==============

    obj.setMethod(
      'takeDamage',
      `
      /**
       * Apply damage to the vehicle.
       * @param amount - Damage amount
       * @param hitLocation - Where the hit landed (optional)
       */
      const amount = args[0] || 0;
      const hitLocation = args[1];

      // Apply armor reduction
      const armor = self.armor || 0;
      const actualDamage = Math.max(0, amount - armor);

      self.damage = Math.min(100, (self.damage || 0) + actualDamage);

      // Random chance to damage a part
      const parts = self.parts || [];
      if (parts.length > 0 && Math.random() < 0.3) {
        const part = parts[Math.floor(Math.random() * parts.length)];
        if (part && part.takeDamage) {
          await part.takeDamage(actualDamage * 0.5);
        }
      }

      // Check for disabled/destroyed
      if (self.damage >= 100) {
        self.destroyed = true;
        self.disabled = true;
        self.engineRunning = false;
      } else if (self.damage >= 80) {
        self.disabled = true;
        self.engineRunning = false;
      }

      return { damage: self.damage, disabled: self.disabled, destroyed: self.destroyed };
    `,
    );

    // ============== MULTI-ROOM SETUP ==============

    obj.setMethod(
      'initAsSimpleVehicle',
      `
      /**
       * Initialize this vehicle as a simple single-room vehicle.
       * Sets internalRooms = [self] and entryRoom = self.
       * Creates a default 'door' vehicleExit.
       * Call this after creating a new vehicle instance.
       */
      // Set defaults
      self.internalRooms = [self];
      self.entryRoom = self;

      // Create default vehicle exit (door leading outside)
      if ($vehicleExit) {
        const door = await $recycler.create($vehicleExit, {
          name: 'door',
          aliases: ['out', 'outside', 'exit', 'leave'],
          source: self
        });
        // Add to exits
        self.exits = self.exits || [];
        self.exits.push(door);
      }

      return true;
    `,
    );

    obj.setMethod(
      'getInternalRooms',
      `
      /**
       * Get all internal rooms in this vehicle.
       * @returns Array of room objects
       */
      return self.internalRooms || [self];
    `,
    );

    obj.setMethod(
      'addInternalRoom',
      `
      /**
       * Add an internal room to this vehicle.
       * For multi-room vehicles, also set room.vehicle = self.
       * @param room - The $vehicleRoom to add
       */
      const room = args[0];
      if (!room) return;

      // Set room's vehicle reference
      room.vehicle = self;

      // Add to internalRooms
      self.internalRooms = self.internalRooms || [];
      if (!self.internalRooms.includes(room)) {
        self.internalRooms.push(room);
      }

      return true;
    `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'internalRooms',
      'Array of rooms inside this vehicle. Simple vehicles: [self]. Multi-room: [$vehicleRoom, ...]',
    );
    obj.setPropertyDescription(
      'entryRoom',
      'The room where passengers enter when boarding. Simple vehicles: self.',
    );
    obj.setPropertyDescription(
      'parts',
      'Array of installed $vehiclePart objrefs.',
    );
    obj.setPropertyDescription(
      'requiredParts',
      'Array of partType strings needed for vehicle to function.',
    );
    obj.setPropertyDescription(
      'engineRunning',
      'true if engine is on, false if off.',
    );
    obj.setPropertyDescription(
      'travelState',
      'Travel info when moving, null when parked.',
    );
    obj.setPropertyDescription(
      'driver',
      'Objref to agent in driver seat.',
    );
    obj.setPropertyDescription(
      'seats',
      'Array of seat objects with name, capacity, occupied[].',
    );
    obj.setPropertyDescription(
      'doors',
      'Array of door objects with name, side, locked, lock.',
    );
    obj.setPropertyDescription(
      'damage',
      'Body damage 0-100. At 80+ disabled, at 100 destroyed.',
    );
    obj.setPropertyDescription(
      'armor',
      'Damage reduction from exterior attacks.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(VehicleBuilder);
