import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Submarine prototype
 *
 * A diving vessel that can operate underwater.
 * Can dive to crush depth, has oxygen management.
 */
export class SubmarineBuilder implements Builder {
  static provides = ['submarine'];
  static depends = ['watercraft'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('submarine');
    if (existing) {
      this.obj = existing;
    } else {
      const watercraft = await this.manager.load('watercraft');
      if (!watercraft) throw new Error('Watercraft type not found');

      this.obj = await this.manager.define('submarine', watercraft, {
        properties: {
          name: 'Submarine',
          description: 'A vessel capable of underwater operation',
          // Submarine identification
          isSubmarine: true,
          // Diving capabilities
          maxDepth: -100, // z=-100 = 300m depth
          currentDepth: 0, // Current z-level
          crushDepth: -120, // Beyond this = hull damage
          // Ballast system
          ballastLevel: 0, // 0 = surface trim, 100 = full dive
          // Oxygen system
          oxygenCapacity: 100, // Hours of breathable air
          oxygenLevel: 100, // Current oxygen percentage
          oxygenConsumption: 0.1, // % per minute per passenger
          // Stealth
          isSilent: false, // Running silent (no active sonar, reduced speed)
          // Draft and buoyancy
          draft: 5, // Deeper draft than boats
          buoyancy: 100,
          // Seating
          seats: [
            { name: 'helm', capacity: 1, occupied: [] },
            { name: 'navigation', capacity: 1, occupied: [] },
            { name: 'sonar', capacity: 1, occupied: [] },
            { name: 'passenger', capacity: 4, occupied: [] },
          ],
          // Physical
          weight: 10000000, // 10 tons
          armor: 20, // Strong hull
          // AI abilities
          abilities: `Diving vessel for underwater operation.

NAVIGATION: Uses $spatial.ensureRoom(x,y,z,'submarine') for underwater rooms.
AI creates underwater rooms ONLY in water terrain at reasonable depth (z >= -15).
Deeper than z=-15 requires explicit "deep trench" hint or AI says no.
If AI refuses, dive is blocked - can't go there.

dive(z) to descend. surface() to return to z=0.
'maxDepth' = safe operating depth (z=-100 = 300m).
'crushDepth' = hull damage starts (z=-120 = 360m).

OXYGEN: Depletes while submerged. More passengers = faster drain.
Emergency surface if critical. Replenish at surface.

STEALTH: runSilent() reduces speed but avoids detection.
periscope() at z=-1 to observe surface. sonar() for contacts.

ROOMS ARE PERMANENT: Underwater rooms stay forever once created.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    // Factory method
    obj.setMethod(
      'create',
      `
      /**
       * Factory: Create a complete submarine with all parts.
       * @param options - Configuration options
       *   - name: Custom name
       *   - fuel: Starting fuel
       *   - location: Room to spawn in
       * @returns The created submarine
       */
      const options = args[0] || {};

      // Create instance
      const sub = await $recycler.create($submarine, {
        name: options.name || 'Submarine',
        description: options.description || 'A compact research submarine',
      });

      // Electric motor (quieter than combustion)
      const engine = await $recycler.create($engine, {
        name: 'Electric Motor',
        description: 'Silent electric propulsion system',
        horsepower: 200,
        maxSpeed: 10, // m/s underwater (~20 knots)
        fuelEfficiency: 0.05, // Efficient
        fuelType: 'electric', // Uses battery
      });
      await sub.installPart(engine);

      // Large fuel/battery capacity
      const tank = await $recycler.create($fuelTank, {
        name: 'Battery Bank',
        capacity: 200,
        fuel: options.fuel ?? 200,
        fuelType: 'electric',
      });
      await sub.installPart(tank);

      // Main battery
      const battery = await $recycler.create($vehicleBattery, {
        charge: 100,
      });
      await sub.installPart(battery);

      if (options.location) {
        await sub.moveTo(options.location);
      }

      return sub;
      `,
    );

    // Override dive to handle submarine specifics
    obj.setMethod(
      'dive',
      `
      /**
       * Dive to a specific depth.
       * @param targetZ - Target z-level (negative)
       * @returns true on success, error string on failure
       */
      const targetZ = args[0] ?? -1;

      // Check oxygen before diving deeper
      const oxygen = self.oxygenLevel || 100;
      if (oxygen < 10 && targetZ < (self.location?.z || 0)) {
        return 'Oxygen critical - cannot dive deeper';
      }

      // Warn about crush depth
      if (targetZ < self.crushDepth) {
        // Still allow but warn
        for (const seat of (self.seats || [])) {
          for (const passenger of (seat.occupied || [])) {
            if (passenger && passenger.tell) {
              await passenger.tell('WARNING: Exceeding crush depth!');
            }
          }
        }
      }

      // Call parent dive
      return await pass(targetZ);
      `,
    );

    // Periscope - observe surface from shallow depth
    obj.setMethod(
      'periscope',
      `
      /**
       * Use periscope to observe surface (only works at z=-1).
       * @returns Description of surface, or error
       */
      if (!self.inWater) return 'Not in water';

      const room = self.location;
      if (!room) return 'Invalid position';

      if (room.z !== -1) {
        return 'Periscope only works at periscope depth (3m below surface)';
      }

      const x = room.x ?? 0;
      const y = room.y ?? 0;

      // Look at surface room
      const surfaceRoom = await $spatial.getRoomDataAt(x, y, 0);
      let output = 'Periscope view:\\r\\n';

      if (surfaceRoom) {
        const contents = surfaceRoom.contents || [];
        const vessels = contents.filter(c => c && c.isWatercraft);

        if (vessels.length > 0) {
          output += 'Surface contacts:\\r\\n';
          for (const v of vessels) {
            output += '  - ' + (v.name || 'vessel') + '\\r\\n';
          }
        } else {
          output += 'No surface contacts.\\r\\n';
        }

        // Check for nearby coast
        const coastal = await surfaceRoom.isCoastal ? await surfaceRoom.isCoastal() : [];
        if (coastal && coastal.length > 0) {
          const dirs = coastal.map(c => c.direction).join(', ');
          output += 'Land visible: ' + dirs + '\\r\\n';
        }
      } else {
        output += 'Clear surface.\\r\\n';
      }

      return output;
      `,
    );

    // Sonar - detect underwater contacts
    obj.setMethod(
      'sonar',
      `
      /**
       * Use sonar to detect nearby contacts.
       * @param mode - 'active' (noisy, long range) or 'passive' (quiet, short range)
       * @returns List of contacts
       */
      const mode = args[0] || 'passive';
      if (!self.inWater) return 'Not in water';

      const room = self.location;
      if (!room) return 'Invalid position';

      const x = room.x ?? 0;
      const y = room.y ?? 0;
      const z = room.z ?? 0;

      // Detection range based on mode
      const range = mode === 'active' ? 5 : 2;
      const contacts = [];

      // Search nearby rooms
      for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
          for (let dz = -range; dz <= range; dz++) {
            if (dx === 0 && dy === 0 && dz === 0) continue;

            const checkRoom = await $spatial.getRoomDataAt(x + dx, y + dy, z + dz);
            if (!checkRoom) continue;

            const contents = checkRoom.contents || [];
            for (const obj of contents) {
              if (!obj) continue;
              if (obj.id === self.id) continue;

              // Detect watercraft
              if (obj.isWatercraft || obj.isSubmarine) {
                // Silent subs harder to detect passively
                if (mode === 'passive' && obj.isSilent) {
                  if (Math.random() > 0.3) continue; // 70% chance to miss
                }

                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                contacts.push({
                  name: mode === 'active' ? obj.name : 'contact',
                  distance: Math.round(dist * 30) + 'm',
                  direction: (dx > 0 ? 'E' : dx < 0 ? 'W' : '') +
                             (dy > 0 ? 'N' : dy < 0 ? 'S' : '') +
                             (dz > 0 ? 'above' : dz < 0 ? 'below' : ''),
                  depth: (z + dz) * -3 + 'm'
                });
              }
            }
          }
        }
      }

      let output = mode.charAt(0).toUpperCase() + mode.slice(1) + ' sonar:\\r\\n';

      if (contacts.length === 0) {
        output += 'No contacts.\\r\\n';
      } else {
        for (const c of contacts) {
          output += '  ' + c.name + ' - ' + c.distance + ' ' + c.direction;
          if (c.depth) output += ' (depth: ' + c.depth + ')';
          output += '\\r\\n';
        }
      }

      // Active sonar reveals our position
      if (mode === 'active') {
        output += '\\r\\n(Active ping may reveal our position)';
      }

      return output;
      `,
    );

    // Silent running
    obj.setMethod(
      'runSilent',
      `
      /**
       * Toggle silent running mode.
       * @returns Current silent state
       */
      self.isSilent = !self.isSilent;

      const status = self.isSilent ? 'engaged' : 'disengaged';

      // Tell crew
      for (const seat of (self.seats || [])) {
        for (const passenger of (seat.occupied || [])) {
          if (passenger && passenger.tell) {
            await passenger.tell('Silent running ' + status + '.');
          }
        }
      }

      return self.isSilent;
      `,
    );

    // Oxygen tick (called by scheduler)
    obj.setMethod(
      'oxygenTick',
      `
      /**
       * Consume oxygen while submerged.
       * Called periodically by scheduler.
       */
      if (!self.inWater) return;

      const room = self.location;
      if (!room || room.z >= 0) {
        // At surface - replenish oxygen
        self.oxygenLevel = Math.min(100, (self.oxygenLevel || 0) + 5);
        return;
      }

      // Count passengers
      let passengers = 0;
      for (const seat of (self.seats || [])) {
        passengers += (seat.occupied || []).length;
      }

      if (passengers === 0) return;

      // Consume oxygen
      const consumption = (self.oxygenConsumption || 0.1) * passengers;
      self.oxygenLevel = Math.max(0, (self.oxygenLevel || 100) - consumption);

      // Warnings
      const oxygen = self.oxygenLevel;
      if (oxygen <= 0) {
        // Crew suffocating - damage them
        for (const seat of (self.seats || [])) {
          for (const passenger of (seat.occupied || [])) {
            if (passenger && passenger.damage) {
              await passenger.damage({ type: 'suffocation', amount: 5 });
            }
          }
        }
      } else if (oxygen < 10) {
        for (const seat of (self.seats || [])) {
          for (const passenger of (seat.occupied || [])) {
            if (passenger && passenger.tell) {
              await passenger.tell('CRITICAL: Oxygen depleted! Surface immediately!');
            }
          }
        }
      } else if (oxygen < 25) {
        for (const seat of (self.seats || [])) {
          for (const passenger of (seat.occupied || [])) {
            if (passenger && passenger.tell) {
              await passenger.tell('Warning: Oxygen low (' + Math.round(oxygen) + '%)');
            }
          }
        }
      }
      `,
    );

    // Check crush depth damage
    obj.setMethod(
      'depthCheck',
      `
      /**
       * Check for crush depth damage.
       * Called periodically by scheduler.
       */
      if (!self.inWater) return;

      const room = self.location;
      if (!room) return;

      const depth = room.z || 0;
      const crushDepth = self.crushDepth || -120;

      if (depth < crushDepth) {
        // Taking damage from pressure
        const excess = crushDepth - depth;
        const damage = excess * 2; // 2 damage per z-level over

        self.damage = Math.min(100, (self.damage || 0) + damage);
        self.buoyancy = Math.max(0, (self.buoyancy || 100) - damage);

        // Hull groaning
        for (const seat of (self.seats || [])) {
          for (const passenger of (seat.occupied || [])) {
            if (passenger && passenger.tell) {
              await passenger.tell('The hull groans under extreme pressure!');
            }
          }
        }

        // Check for implosion
        if (self.damage >= 100) {
          // Catastrophic hull failure
          for (const seat of (self.seats || [])) {
            for (const passenger of (seat.occupied || [])) {
              if (passenger && passenger.tell) {
                await passenger.tell('The hull ruptures! Water floods in!');
              }
              if (passenger && passenger.damage) {
                await passenger.damage({ type: 'implosion', amount: 1000 });
              }
            }
          }

          self.destroyed = true;
          await $recycler.recycle(self);
        }
      }
      `,
    );

    // Override describe for submarine specifics
    obj.setMethod(
      'describe',
      `
      /**
       * Describe submarine interior.
       */
      const viewer = args[0];

      let output = 'Aboard ' + self.name + '\\r\\n';

      // Depth status
      if (self.inWater) {
        const room = self.location;
        const z = room?.z || 0;

        if (z < 0) {
          const depth = z * -3;
          output += 'Depth: ' + depth + 'm\\r\\n';

          // Crush depth warning
          if (z < (self.crushDepth || -120)) {
            output += 'WARNING: BELOW CRUSH DEPTH\\r\\n';
          } else if (z < (self.crushDepth || -120) + 20) {
            output += 'Approaching crush depth\\r\\n';
          }
        } else {
          output += 'Status: Surfaced\\r\\n';
        }

        // Silent running
        if (self.isSilent) {
          output += 'Running silent\\r\\n';
        }
      } else {
        output += 'Status: Docked\\r\\n';
      }

      // Oxygen
      const oxygen = Math.round(self.oxygenLevel || 100);
      output += 'Oxygen: ' + oxygen + '%\\r\\n';

      // Engine and fuel
      const engineStatus = self.engineRunning ? 'running' : 'off';
      output += 'Engines: ' + engineStatus + '\\r\\n';

      const fuel = await self.getFuel();
      const tank = await self.getFuelTank();
      const capacity = tank ? tank.capacity : 200;
      const fuelPercent = Math.round((fuel / capacity) * 100);
      output += 'Battery: ' + fuelPercent + '%\\r\\n';

      // Hull
      const damage = self.damage || 0;
      if (damage > 0) {
        const integrity = 100 - damage;
        output += 'Hull integrity: ' + integrity + '%\\r\\n';
      }

      // Crew positions
      output += '\\r\\nStations:\\r\\n';
      for (const seat of (self.seats || [])) {
        const occupied = seat.occupied || [];
        if (occupied.length > 0) {
          const names = occupied.map(p => p?.name || 'crew').join(', ');
          output += '  ' + seat.name + ': ' + names + '\\r\\n';
        } else {
          output += '  ' + seat.name + ': unmanned\\r\\n';
        }
      }

      return output;
      `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'isSubmarine',
      'Flag identifying this as a submarine.',
    );
    obj.setPropertyDescription(
      'crushDepth',
      'Z-level at which hull damage begins (e.g., -120 = 360m).',
    );
    obj.setPropertyDescription(
      'oxygenLevel',
      'Current oxygen percentage (0-100). Depletes while submerged.',
    );
    obj.setPropertyDescription(
      'oxygenCapacity',
      'Maximum hours of breathable air at full capacity.',
    );
    obj.setPropertyDescription(
      'oxygenConsumption',
      'Oxygen % consumed per minute per passenger.',
    );
    obj.setPropertyDescription(
      'isSilent',
      'true if running silent (harder to detect, slower speed).',
    );
    obj.setPropertyDescription(
      'ballastLevel',
      'Ballast tank fill level (0=surface trim, 100=full dive).',
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.obj) return;
    console.log(`[SubmarineBuilder] Type 'submarine' auto-aliased`);
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SubmarineBuilder);
