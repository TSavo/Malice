import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Watercraft prototype
 *
 * A vehicle that operates on water (and optionally underwater).
 * Uses $spatial for dynamic water room management.
 *
 * Coordinate system: 30m per x/y unit, 3m per z unit.
 * Water surface is z=0, underwater is z < 0.
 */
export class WatercraftBuilder implements Builder {
  static provides = ['watercraft'];
  static depends = ['vehicle', 'spatial', 'waterRoom', 'underwaterRoom'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('watercraft');
    if (existing) {
      this.obj = existing;
    } else {
      const vehicle = await this.manager.load('vehicle');
      if (!vehicle) throw new Error('Vehicle type not found');

      this.obj = await this.manager.define('watercraft', vehicle, {
        properties: {
          name: 'Watercraft',
          description: 'A vessel that operates on water',
          // Watercraft identification
          isWatercraft: true,
          // Water state
          inWater: false,
          mooredAt: null, // Ground room when docked (pier, beach)
          anchored: false,
          // Physical characteristics
          draft: 2, // Meters below waterline
          maxDepth: 0, // 0 = surface only, negative z = can dive
          buoyancy: 100, // 0-100, sinking resistance
          // Override required parts for watercraft
          requiredParts: [
            'engine',
            'fuelTank',
            'battery',
            'starter',
            'alternator',
            'ecu',
            'wiringHarness',
            'propeller',
            'rudder',
          ],
          // Seating
          seats: [
            { name: 'helm', capacity: 1, occupied: [] },
            { name: 'passenger', capacity: 2, occupied: [] },
          ],
          // AI-readable abilities
          abilities: `Water vessel. Operates on ocean surface. Fuel-powered engine.

NAVIGATION: Uses $spatial.ensureRoom(x,y,z,'water surface') for water rooms.
AI creates water rooms ONLY in water terrain (x < -15 = Elliott Bay).
If AI says no (returns null), cannot sail there.

launch() from coastal dock. moor() to return to land.
sail(heading) moves on surface (z=0).
dive(z) for submarines to go underwater (z < 0, max z >= -15).

HULL: 'draft' = depth below waterline. 'buoyancy' = sinking resistance.
Damage reduces buoyancy. Below 50% = sinking.
anchor() to hold position.

ROOMS ARE PERMANENT: Water rooms stay forever once created.
Don't sail aimlessly - AI won't create rooms in random deep ocean.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // ============== LAUNCH (enter water) ==============

    obj.setMethod(
      'launch',
      `
      /**
       * Launch into water from a coastal location.
       * @returns true on success, error string on failure
       */
      if (self.inWater) return 'Already in water';

      // Check can start
      const canStart = await self.canStart();
      if (canStart !== true) return canStart;

      // Get current ground location
      const room = self.location;
      if (!room) return 'Not in a valid location';

      const x = room.x ?? 0;
      const y = room.y ?? 0;

      // Check if adjacent to water
      const isCoastal = await $spatial.isCoastal(x, y);
      if (!isCoastal) return 'No water access here';

      // Find water column
      const directions = [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
      ];

      let waterX = null;
      let waterY = null;

      for (const dir of directions) {
        const testX = x + dir.dx;
        const testY = y + dir.dy;
        const isWater = await $spatial.isWater(testX, testY);
        if (isWater) {
          waterX = testX;
          waterY = testY;
          break;
        }
      }

      if (waterX === null) return 'Cannot find water';

      // Remember where we launched from
      self.mooredAt = room;

      // Get/create water surface room
      // AI decides if water makes sense here (must be water terrain)
      const waterRoom = await $spatial.ensureRoom(room, waterX, waterY, 0, 'vessel launching, water surface needed');
      if (!waterRoom) return 'Cannot launch here - no valid water';

      // Set water state
      self.inWater = true;

      // Start engine if not running
      if (!self.engineRunning) {
        await self.startEngine();
      }

      // Move to water
      await self.moveTo(waterRoom);

      // Announce
      if (room.announce) {
        await room.announce(self, null, {
          others: self.name + ' launches into the water.'
        });
      }

      // Tell passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('The vessel launches into the water.');
          }
        }
      }

      return true;
      `,
    );

    // ============== MOOR (return to land) ==============

    obj.setMethod(
      'moor',
      `
      /**
       * Moor at a coastal location.
       * @param direction - Optional direction to moor (north, south, east, west)
       * @returns true on success, error string on failure
       */
      if (!self.inWater) return 'Not in water';
      if (self.travelState) return 'Cannot moor while moving';

      const direction = args[0];
      const room = self.location;
      if (!room) return 'Invalid position';

      const x = room.x ?? 0;
      const y = room.y ?? 0;

      // If diving, must surface first
      if (room.z < 0) return 'Surface before mooring';

      // Find land
      const directions = {
        north: { dx: 0, dy: 1 },
        south: { dx: 0, dy: -1 },
        east: { dx: 1, dy: 0 },
        west: { dx: -1, dy: 0 },
        n: { dx: 0, dy: 1 },
        s: { dx: 0, dy: -1 },
        e: { dx: 1, dy: 0 },
        w: { dx: -1, dy: 0 },
      };

      let landRoom = null;

      if (direction) {
        const dir = directions[direction.toLowerCase()];
        if (!dir) return 'Invalid direction';

        const testX = x + dir.dx;
        const testY = y + dir.dy;
        const terrain = await $spatial.getTerrainAt(testX, testY);

        if (terrain === 'water') {
          return 'No land in that direction';
        }

        landRoom = await $spatial.getRoomDataAt(testX, testY, 0);
        if (!landRoom) {
          return 'No accessible dock in that direction';
        }
      } else {
        // Find any adjacent land
        for (const [name, dir] of Object.entries(directions)) {
          if (name.length > 1) continue; // Skip abbreviated versions
          const testX = x + dir.dx;
          const testY = y + dir.dy;
          const terrain = await $spatial.getTerrainAt(testX, testY);

          if (terrain !== 'water') {
            landRoom = await $spatial.getRoomDataAt(testX, testY, 0);
            if (landRoom) break;
          }
        }
      }

      if (!landRoom) return 'No accessible dock nearby';

      // Clear water state
      self.inWater = false;
      self.mooredAt = landRoom;
      self.anchored = false;

      // Move to land
      await self.moveTo(landRoom);

      // Note: Rooms are PERMANENT - water room stays for future voyages

      // Announce
      if (landRoom.announce) {
        await landRoom.announce(self, null, {
          others: self.name + ' moors at the dock.'
        });
      }

      // Tell passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('The vessel moors at ' + landRoom.name + '.');
          }
        }
      }

      return true;
      `,
    );

    // ============== SAIL ==============

    obj.setMethod(
      'sail',
      `
      /**
       * Sail in a direction on the water surface.
       * @param heading - Direction (north, south, east, west, etc.)
       * @returns true on success, error string on failure
       */
      const heading = args[0];

      if (!heading) return 'Specify a direction to sail';
      if (!self.inWater) return 'Not in water - use launch first';
      if (self.travelState) return 'Already moving';

      // Check parts functional
      const canStart = await self.canStart();
      if (canStart !== true) return 'Mechanical failure: ' + canStart;

      // Check driver
      if (!self.driver) return 'No one is at the helm';

      // Check anchored
      if (self.anchored) return 'Raise anchor first';

      const room = self.location;
      if (!room) return 'Invalid position';

      // Must be at surface to sail
      if (room.z !== 0) return 'Must be at surface to sail';

      const x = room.x ?? 0;
      const y = room.y ?? 0;

      // Calculate destination
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

      const dir = directions[heading.toLowerCase()];
      if (!dir) return 'Unknown heading: ' + heading;

      const destX = x + dir.dx;
      const destY = y + dir.dy;

      // Check destination is water
      const terrain = await $spatial.getTerrainAt(destX, destY);
      if (terrain !== 'water') {
        return 'Cannot sail into ' + terrain + ' - use moor to dock';
      }

      // Calculate distance and duration
      const dx = dir.dx * 30;
      const dy = dir.dy * 30;
      const distance = Math.sqrt(dx*dx + dy*dy);

      const maxSpeed = await self.getMaxSpeed();
      if (maxSpeed <= 0) return 'No engine power';

      const duration = Math.ceil((distance / maxSpeed) * 1000);

      // Get/create destination water room
      // AI decides if water makes sense here
      const destRoom = await $spatial.ensureRoom(room, destX, destY, 0, 'vessel sailing, water surface movement');
      if (!destRoom) return 'Cannot sail there - no valid water at that location';

      // Set travel state
      self.travelState = {
        destRoom: destRoom,
        startTime: Date.now(),
        duration: duration,
        distance: distance,
        schedulerJob: 'watercraft_' + self.id + '_' + Date.now()
      };

      // Schedule arrival
      await $scheduler.schedule(
        self.travelState.schedulerJob,
        duration,
        0,
        self,
        'arriveWater'
      );

      // Tell passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('Sailing ' + heading + '...');
          }
        }
      }

      return true;
      `,
    );

    // ============== ARRIVE (water movement) ==============

    obj.setMethod(
      'arriveWater',
      `
      /**
       * Called when watercraft arrives at destination.
       */
      if (!self.travelState) return;

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

      // Note: Rooms are PERMANENT - water stays for future voyages

      // Tell passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('Arrived at new position.');
          }
        }
      }
      `,
    );

    // ============== ANCHOR ==============

    obj.setMethod(
      'anchor',
      `
      /**
       * Drop or raise anchor.
       * @param action - 'drop' or 'raise' (toggles if not specified)
       * @returns true on success, error string on failure
       */
      const action = args[0];

      if (!self.inWater) return 'Not in water';
      if (self.travelState) return 'Cannot anchor while moving';

      if (action === 'raise') {
        if (!self.anchored) return 'Anchor not deployed';
        self.anchored = false;

        // Clear room persistence if we set it
        const room = self.location;
        if (room && room.persistent === self.id) {
          room.persistent = false;
        }

        // Tell passengers
        for (const seat of (self.seats || [])) {
          for (const passenger of (seat.occupied || [])) {
            if (passenger && passenger.tell) {
              await passenger.tell('Anchor raised.');
            }
          }
        }
        return true;
      }

      if (action === 'drop' || !action) {
        if (self.anchored) {
          // Toggle - raise anchor
          return await self.anchor('raise');
        }

        self.anchored = true;

        // Mark room as persistent (vessel is anchored here)
        const room = self.location;
        if (room) {
          room.persistent = self.id; // Track who set persistence
        }

        // Tell passengers
        for (const seat of (self.seats || [])) {
          for (const passenger of (seat.occupied || [])) {
            if (passenger && passenger.tell) {
              await passenger.tell('Anchor dropped. Vessel secured.');
            }
          }
        }
        return true;
      }

      return 'Unknown action: ' + action;
      `,
    );

    // ============== DIVE (submarines only) ==============

    obj.setMethod(
      'dive',
      `
      /**
       * Dive underwater (submarines only).
       * @param targetZ - Target z-level (negative for depth)
       * @returns true on success, error string on failure
       */
      const targetZ = args[0] ?? -1;

      if (!self.inWater) return 'Not in water';
      if (self.maxDepth === 0) return 'This vessel cannot dive';
      if (self.travelState) return 'Cannot dive while moving';
      if (self.anchored) return 'Raise anchor first';

      const room = self.location;
      if (!room) return 'Invalid position';

      const x = room.x ?? 0;
      const y = room.y ?? 0;
      const currentZ = room.z ?? 0;

      // Validate target depth
      if (targetZ >= 0) return 'Already at or above surface';
      if (targetZ < self.maxDepth) {
        return 'Exceeds maximum depth (z=' + self.maxDepth + ')';
      }

      // Calculate dive time (3m per z-level, 2 m/s descent)
      const depthChange = Math.abs(targetZ - currentZ) * 3;
      const duration = Math.ceil((depthChange / 2) * 1000);

      // Get/create underwater room
      // AI decides if underwater makes sense here (water terrain, reasonable depth)
      const destRoom = await $spatial.ensureRoom(room, x, y, targetZ, 'submarine diving, underwater room needed');
      if (!destRoom) return 'Cannot dive here - no valid underwater space';

      // Set travel state
      self.travelState = {
        destRoom: destRoom,
        startTime: Date.now(),
        duration: duration,
        distance: depthChange,
        schedulerJob: 'watercraft_dive_' + self.id + '_' + Date.now(),
        isDiving: true
      };

      // Schedule arrival
      await $scheduler.schedule(
        self.travelState.schedulerJob,
        duration,
        0,
        self,
        'arriveDive'
      );

      // Tell passengers
      const targetDepth = targetZ * -3;
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('Diving to ' + targetDepth + 'm...');
          }
        }
      }

      return true;
      `,
    );

    // ============== ARRIVE DIVE ==============

    obj.setMethod(
      'arriveDive',
      `
      /**
       * Called when vessel completes dive/surface.
       */
      if (!self.travelState) return;

      const oldRoom = self.location;
      const destRoom = self.travelState.destRoom;

      // Clear travel state
      self.travelState = null;

      // Move to new depth
      await self.moveTo(destRoom);

      // Note: Rooms are PERMANENT - underwater rooms stay for future dives

      // Tell passengers
      const depth = (destRoom.z || 0) * -3;
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            if (destRoom.z === 0) {
              await passenger.tell('Surfaced.');
            } else {
              await passenger.tell('Now at ' + depth + 'm depth.');
            }
          }
        }
      }
      `,
    );

    // ============== SURFACE ==============

    obj.setMethod(
      'surface',
      `
      /**
       * Surface from underwater.
       * @returns true on success, error string on failure
       */
      if (!self.inWater) return 'Not in water';
      if (self.travelState) return 'Cannot surface while moving';

      const room = self.location;
      if (!room) return 'Invalid position';

      if (room.z >= 0) return 'Already at surface';

      // Dive to z=0 (surface)
      const x = room.x ?? 0;
      const y = room.y ?? 0;
      const currentZ = room.z;

      // Calculate surface time
      const depthChange = Math.abs(currentZ) * 3;
      const duration = Math.ceil((depthChange / 3) * 1000); // 3 m/s ascent

      // Get surface room
      // AI should always allow surfacing in water terrain
      const surfaceRoom = await $spatial.ensureRoom(room, x, y, 0, 'submarine surfacing, water surface needed');
      if (!surfaceRoom) return 'Cannot surface here - no valid water surface';

      // Set travel state
      self.travelState = {
        destRoom: surfaceRoom,
        startTime: Date.now(),
        duration: duration,
        distance: depthChange,
        schedulerJob: 'watercraft_surface_' + self.id + '_' + Date.now(),
        isSurfacing: true
      };

      // Schedule arrival
      await $scheduler.schedule(
        self.travelState.schedulerJob,
        duration,
        0,
        self,
        'arriveDive'  // Reuse dive arrival handler
      );

      // Tell passengers
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('Surfacing...');
          }
        }
      }

      return true;
      `,
    );

    // ============== DESCRIBE OVERRIDE ==============

    obj.setMethod(
      'describe',
      `
      /**
       * Describe watercraft to a viewer.
       */
      const viewer = args[0];

      let output = 'Aboard ' + self.name + '\\r\\n';

      // Water status
      if (self.inWater) {
        const room = self.location;
        if (room && room.z < 0) {
          const depth = (room.z || 0) * -3;
          output += 'Status: Submerged at ' + depth + 'm\\r\\n';
        } else {
          output += 'Status: On the water\\r\\n';
        }

        if (self.anchored) {
          output += 'Anchor: Deployed\\r\\n';
        }

        if (self.travelState) {
          if (self.travelState.isDiving) {
            output += 'Diving...\\r\\n';
          } else if (self.travelState.isSurfacing) {
            output += 'Surfacing...\\r\\n';
          } else {
            output += 'Underway...\\r\\n';
          }
        }
      } else {
        output += 'Status: Docked\\r\\n';
      }

      // Engine
      const engineStatus = self.engineRunning ? 'running' : 'off';
      output += 'Engine: ' + engineStatus + '\\r\\n';

      // Fuel
      const fuel = await self.getFuel();
      const tank = await self.getFuelTank();
      const capacity = tank ? tank.capacity : 100;
      const fuelPercent = Math.round((fuel / capacity) * 100);
      output += 'Fuel: ' + fuelPercent + '%\\r\\n';

      // Buoyancy/damage
      const buoyancy = self.buoyancy || 100;
      if (buoyancy < 100) {
        output += 'Hull integrity: ' + buoyancy + '%\\r\\n';
        if (buoyancy < 50) {
          output += 'WARNING: Taking on water!\\r\\n';
        }
      }

      // Seats
      output += '\\r\\nPositions:\\r\\n';
      for (const seat of (self.seats || [])) {
        const occupied = seat.occupied || [];
        if (occupied.length > 0) {
          const names = occupied.map(p => p?.name || 'someone').join(', ');
          output += '  ' + seat.name + ': ' + names + '\\r\\n';
        } else {
          output += '  ' + seat.name + ': empty\\r\\n';
        }
      }

      return output;
      `,
    );

    // ============== LOOK OUTSIDE OVERRIDE ==============

    obj.setMethod(
      'lookOutside',
      `
      /**
       * Describe what's around the watercraft.
       */
      const viewer = args[0];
      const room = self.location;

      if (!room) return 'Nothing visible.';

      if (self.inWater) {
        let output = '';

        if (room.underwater || room.z < 0) {
          // Underwater view
          const depth = (room.z || 0) * -3;
          const visibility = room.visibility || 50;
          output += depth + 'm below the surface.\\r\\n';

          if (visibility < 20) {
            output += 'Near darkness surrounds the vessel.\\r\\n';
          } else if (visibility < 50) {
            output += 'Murky water limits visibility.\\r\\n';
          } else {
            output += 'Filtered light from above illuminates the water.\\r\\n';
          }
        } else {
          // Surface view
          output += 'On the open water.\\r\\n';

          const waveHeight = room.waveHeight || 0;
          if (waveHeight > 2) {
            output += 'Heavy waves rock the vessel.\\r\\n';
          } else if (waveHeight > 0) {
            output += 'Gentle swells roll past.\\r\\n';
          }

          // Check for nearby coast
          const x = room.x ?? 0;
          const y = room.y ?? 0;
          const coastal = await room.isCoastal();
          if (coastal && coastal.length > 0) {
            const dirs = coastal.map(c => c.direction).join(', ');
            output += 'Land visible to the ' + dirs + '.\\r\\n';
          }
        }

        // Other vessels
        const contents = room.contents || [];
        const others = contents.filter(c => c && c.isWatercraft && c.id !== self.id);
        if (others.length > 0) {
          output += '\\r\\nNearby vessels:\\r\\n';
          for (const other of others) {
            output += '  - ' + (other.name || 'vessel') + '\\r\\n';
          }
        }

        return output;
      }

      // Docked - show land location
      if (room.describe) {
        return await room.describe(viewer);
      }

      return room.name + '\\r\\n' + (room.description || '');
      `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'isWatercraft',
      'Flag identifying this as a watercraft.',
    );
    obj.setPropertyDescription(
      'inWater',
      'true if in water, false if docked on land.',
    );
    obj.setPropertyDescription(
      'mooredAt',
      'Land room where vessel is docked (when not in water).',
    );
    obj.setPropertyDescription('anchored', 'true if anchor is deployed.');
    obj.setPropertyDescription(
      'draft',
      'Meters below waterline. Deeper draft = more stable but needs deeper water.',
    );
    obj.setPropertyDescription(
      'maxDepth',
      'Maximum diving depth as z-level (0 = surface only, -100 = 300m depth).',
    );
    obj.setPropertyDescription(
      'buoyancy',
      'Hull integrity percentage. Below 50 = sinking.',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name
    if (!this.obj) return;
    console.log(`[WatercraftBuilder] Type 'watercraft' auto-aliased`);
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(WatercraftBuilder);
