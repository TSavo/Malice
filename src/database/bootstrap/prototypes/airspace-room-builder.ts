import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the AirspaceRoom prototype
 *
 * Temporary location at altitude for aircraft. Created dynamically by $spatial
 * when aircraft fly to new coordinates, recycled when empty.
 *
 * Inherits from Location and auto-registers with $spatial via hooks.
 * Coordinate system: 30m per x/y unit, 3m per z unit (same as ground).
 */
export class AirspaceRoomBuilder implements Builder {
  static provides = ['airspaceRoom'];
  static depends = ['location'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists
    const existing = await this.manager.load('airspaceRoom');
    if (existing) {
      this.obj = existing;
    } else {
      // Get parent type
      const location = await this.manager.load('location');
      if (!location) {
        throw new Error('Location type not found - required for AirspaceRoom');
      }

      this.obj = await this.manager.define('airspaceRoom', location, {
        properties: {
          name: 'Airspace',
          description: 'Open sky.',
          // Coordinates (set on creation)
          x: 0,
          y: 0,
          z: 1,
          // Flags
          airspace: true,
          outdoor: true,
          // AI-readable abilities
          abilities: `Open airspace at altitude. Aircraft can fly through freely.

ALTITUDE: Altitude is z * 3 meters above ground.
z=10 = 30m (above low buildings), z=33 = ~100m (above most buildings), z=100 = 300m (cruising).

COORDINATES: Same x,y grid as ground (30m per unit).
Aircraft at same x,y,z share this room.

CONTENTS: Other aircraft at same coordinates are visible.
Look down to see ground rooms below.

MOVEMENT: Aircraft fly to adjacent coordinates (not via exits).
No ground vehicles or pedestrians at altitude.

LIFECYCLE: Created by AI via $spatial.ensureRoom() when aircraft fly there.
AI only creates airspace if outdoor room exists below.
Rooms are PERMANENT once created - they stay forever for future flights.`,
        },
        methods: {},
      });
    }

    // Always rebuild methods
    const obj = this.obj!;

    // Override describe to show altitude and ground below
    obj.setMethod(
      'describe',
      `
      /**
       * Describe this airspace room to a viewer.
       * Shows altitude, ground below, and other aircraft.
       */
      const viewer = args[0];
      const altitude = (self.z || 1) * 3;

      // Find ground room directly below
      let groundDesc = 'empty terrain';
      const groundRoom = await $spatial.getRoomDataAt(self.x, self.y, 0);
      if (groundRoom) {
        groundDesc = groundRoom.name || 'the ground';
      }

      let output = self.name + '\\r\\n';
      output += altitude + 'm above ' + groundDesc + '.\\r\\n';
      output += 'Open sky stretches in all directions.\\r\\n';

      // Show contents (other aircraft)
      const contents = self.contents || [];
      const others = contents.filter(c => c && c.id !== viewer?.id);
      if (others.length > 0) {
        output += '\\r\\nAircraft here:\\r\\n';
        for (const obj of others) {
          if (obj) {
            const name = obj.name || 'aircraft';
            output += '  - ' + name + '\\r\\n';
          }
        }
      }

      // Show cardinal directions as potential flight paths
      output += '\\r\\nFlight paths: north, south, east, west, up, down';

      return output;
      `,
    );

    // Method to get altitude in meters
    obj.setMethod(
      'getAltitude',
      `
      /** Get altitude in meters (z * 3) */
      return (self.z || 1) * 3;
      `,
    );

    // Method to check if another aircraft is present
    obj.setMethod(
      'hasAircraft',
      `
      /** Check if any aircraft are in this airspace */
      const contents = self.contents || [];
      return contents.some(obj => obj && obj.isAircraft);
      `,
    );

    // Property descriptions
    obj.setPropertyDescription('airspace', 'Flag indicating this is an airspace room');
    obj.setPropertyDescription('x', 'X coordinate (30m per unit)');
    obj.setPropertyDescription('y', 'Y coordinate (30m per unit)');
    obj.setPropertyDescription('z', 'Z coordinate (3m per unit, altitude = z * 3)');

    this.obj = obj;
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[AirspaceRoomBuilder] Type 'airspaceRoom' auto-aliased`);
  }
}

// Self-register
registerBuilder(AirspaceRoomBuilder);
