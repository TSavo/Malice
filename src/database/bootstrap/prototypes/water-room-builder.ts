import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the WaterRoom prototype
 *
 * Temporary location at water surface (z=0). Created dynamically by $spatial
 * when watercraft sail to new coordinates, recycled when empty.
 *
 * Inherits from Location and auto-registers with $spatial via hooks.
 * Coordinate system: 30m per x/y unit, always z=0 for surface.
 */
export class WaterRoomBuilder implements Builder {
  static provides = ['waterRoom'];
  static depends = ['location'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('waterRoom');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const location = await this.manager.load('location');
      if (!location) {
        throw new Error('Location type not found - required for WaterRoom');
      }

      this.obj = await this.manager.define('waterRoom', location, {
        properties: {
          name: 'Ocean Surface',
          description: 'Open water.',
          // Coordinates (set on creation)
          x: 0,
          y: 0,
          z: 0, // Always 0 for surface
          // Flags
          water: true,
          outdoor: true,
          // Wave and current conditions
          waveHeight: 0, // 0-5 meters, affects small boats
          current: null, // { dx, dy, strength } for drift
          // AI-readable abilities
          abilities: `Ocean surface at z=0. Watercraft sail freely here.

COORDINATES: Same x,y grid as land (30m per unit). Always z=0 for surface.
Vessels at same x,y share this room.

WAVES: waveHeight (0-5m) affects small boats. Calm=0, choppy=2, storm=4+.
Small boats capsize risk increases with wave height.

CURRENT: current { dx, dy, strength } causes drift if not anchored.
Vessels without power or anchor drift with current each tick.

CONTENTS: Other vessels at same coordinates are visible.
Look down to see depths below. Shore visible at coastal edges.

MOVEMENT: Watercraft sail to adjacent coordinates (not via exits).
No land vehicles or pedestrians on water.

ACCESS: Enter from coastal land rooms. sail(heading) to move.
moor() at coastal edge to exit water back to land.

LIFECYCLE: Created by AI via $spatial.ensureRoom() when vessels sail there.
AI only creates water rooms in water terrain (x < -15 = Elliott Bay).
Rooms are PERMANENT once created - they stay forever for future voyages.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods
    const obj = this.obj!;

    // Override describe to show water conditions and nearby land
    obj.setMethod(
      'describe',
      `
      /**
       * Describe this water room to a viewer.
       * Shows conditions, nearby land, and other vessels.
       */
      const viewer = args[0];

      // Check for nearby coastal rooms
      const directions = [
        { dx: 1, dy: 0, name: 'east' },
        { dx: -1, dy: 0, name: 'west' },
        { dx: 0, dy: 1, name: 'north' },
        { dx: 0, dy: -1, name: 'south' },
      ];

      let coastalDirs = [];
      for (const dir of directions) {
        const terrain = await $spatial.getTerrainAt(self.x + dir.dx, self.y + dir.dy);
        if (terrain !== 'water') {
          coastalDirs.push(dir.name);
        }
      }

      let output = self.name + '\\r\\n';

      // Wave conditions
      const waves = self.waveHeight || 0;
      if (waves === 0) {
        output += 'The water is calm and glassy.\\r\\n';
      } else if (waves <= 1) {
        output += 'Gentle swells roll across the surface.\\r\\n';
      } else if (waves <= 2) {
        output += 'Moderate waves chop the water.\\r\\n';
      } else if (waves <= 3) {
        output += 'Heavy waves crash and spray.\\r\\n';
      } else {
        output += 'Violent waves toss about dangerously.\\r\\n';
      }

      // Show nearby coast
      if (coastalDirs.length > 0) {
        output += 'Land is visible to the ' + coastalDirs.join(', ') + '.\\r\\n';
      } else {
        output += 'Open ocean stretches to all horizons.\\r\\n';
      }

      // Current
      const current = self.current;
      if (current && current.strength > 0) {
        output += 'A current pulls ' + (current.dx > 0 ? 'east' : current.dx < 0 ? 'west' : '') + (current.dy > 0 ? 'north' : current.dy < 0 ? 'south' : '') + '.\\r\\n';
      }

      // Show contents (other vessels)
      const contents = self.contents || [];
      const others = contents.filter(c => c && c.id !== viewer?.id);
      if (others.length > 0) {
        output += '\\r\\nVessels here:\\r\\n';
        for (const obj of others) {
          if (obj) {
            const name = obj.name || 'vessel';
            output += '  - ' + name + '\\r\\n';
          }
        }
      }

      // Show navigation directions
      let navDirs = ['north', 'south', 'east', 'west'];
      if (coastalDirs.length > 0) {
        output += '\\r\\nSail: ' + navDirs.join(', ');
        output += '\\r\\nMoor: ' + coastalDirs.join(', ') + ' (to land)';
      } else {
        output += '\\r\\nSail: ' + navDirs.join(', ');
      }
      output += '\\r\\nDive: down (to depths)';

      return output;
      `,
    );

    // Get wave description
    obj.setMethod(
      'getWaveDescription',
      `
      /** Get textual description of wave conditions */
      const waves = self.waveHeight || 0;
      if (waves === 0) return 'calm';
      if (waves <= 1) return 'gentle swells';
      if (waves <= 2) return 'choppy';
      if (waves <= 3) return 'rough';
      if (waves <= 4) return 'heavy seas';
      return 'storm conditions';
      `,
    );

    // Check if a vessel can safely operate here
    obj.setMethod(
      'isSafeFor',
      `
      /**
       * Check if conditions are safe for a vessel.
       * @param vessel - The watercraft to check
       * @returns true if safe, or warning string
       */
      const vessel = args[0];
      if (!vessel) return 'No vessel specified';

      const waves = self.waveHeight || 0;
      const vesselSize = vessel.weight || 1000000; // grams

      // Small boats (< 500kg) struggle in waves
      if (vesselSize < 500000 && waves > 2) {
        return 'Waves too rough for small vessel';
      }

      // Medium vessels (< 5000kg) struggle in storms
      if (vesselSize < 5000000 && waves > 4) {
        return 'Storm conditions dangerous for this vessel';
      }

      return true;
      `,
    );

    // Apply drift from current to unanchored vessels
    obj.setMethod(
      'applyDrift',
      `
      /**
       * Apply current drift to unanchored vessels.
       * Called by scheduler tick.
       */
      const current = self.current;
      if (!current || current.strength <= 0) return;

      const contents = self.contents || [];
      for (const obj of contents) {
        if (!obj || !obj.isWatercraft) continue;
        if (obj.anchored) continue; // Anchored vessels don't drift
        if (obj.engineRunning) continue; // Under power resists drift

        // Calculate drift destination
        const newX = self.x + (current.dx || 0);
        const newY = self.y + (current.dy || 0);

        // Get or create destination water room
        // AI decides if drift destination is valid water
        const destRoom = await $spatial.ensureRoom(self, newX, newY, 0, 'vessel drifting with current');
        if (destRoom) {
          await obj.moveTo(destRoom);
          if (destRoom.announce) {
            await destRoom.announce(obj, null, {
              others: obj.name + ' drifts in from the ' + (current.dx < 0 ? 'east' : 'west') + '.'
            });
          }
        }
        // If AI says no, vessel stays put (hit the shore?)
      }
      `,
    );

    // Check if adjacent to land
    obj.setMethod(
      'isCoastal',
      `
      /**
       * Check if this water room is adjacent to land.
       * @returns Array of directions where land is accessible
       */
      const directions = [
        { dx: 1, dy: 0, name: 'east' },
        { dx: -1, dy: 0, name: 'west' },
        { dx: 0, dy: 1, name: 'north' },
        { dx: 0, dy: -1, name: 'south' },
      ];

      const coastal = [];
      for (const dir of directions) {
        const terrain = await $spatial.getTerrainAt(self.x + dir.dx, self.y + dir.dy);
        if (terrain !== 'water') {
          // Check if there's actually a room there
          const landRoom = await $spatial.getRoomDataAt(self.x + dir.dx, self.y + dir.dy, 0);
          if (landRoom) {
            coastal.push({ direction: dir.name, room: landRoom });
          }
        }
      }
      return coastal;
      `,
    );

    // Get depth below (checks for underwater rooms)
    obj.setMethod(
      'getDepth',
      `
      /**
       * Get the depth of water at this location.
       * @returns Depth in meters (based on lowest z with underwaterRoom)
       */
      // For now, assume standard ocean depth
      // In future, could check terrain data or bathymetry
      return 100; // 100m default depth
      `,
    );

    // Property descriptions
    obj.setPropertyDescription(
      'water',
      'Flag indicating this is a water surface room',
    );
    obj.setPropertyDescription('x', 'X coordinate (30m per unit)');
    obj.setPropertyDescription('y', 'Y coordinate (30m per unit)');
    obj.setPropertyDescription('z', 'Z coordinate (always 0 for surface)');
    obj.setPropertyDescription(
      'waveHeight',
      'Wave height in meters (0-5). Affects small boat stability.',
    );
    obj.setPropertyDescription(
      'current',
      'Ocean current as { dx, dy, strength }. Causes drift for unanchored vessels.',
    );

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[WaterRoomBuilder] Type 'waterRoom' auto-aliased`);
  }
}

// Self-register
registerBuilder(WaterRoomBuilder);
