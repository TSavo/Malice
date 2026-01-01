import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds the $airspace system object
 *
 * Manages dynamic airspace rooms for aircraft. Airspace rooms are created
 * on-demand when aircraft fly to new coordinates and recycled when empty.
 *
 * Uses $spatial for O(1) lookups and $recycler for room lifecycle.
 * Coordinates use the same grid as ground (30m x/y, 3m z per unit).
 *
 * Airspace starts at z > 0. Ground is z=0, underground is z<0.
 */
export class AirspaceBuilder implements Builder {
  static provides = ['airspace'];
  static depends = ['spatial', 'recycler', 'airspaceRoom'];

  private airspace: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.airspace) {
      this.airspace = await this.manager.load(aliases.airspace);
      if (this.airspace) return; // Already exists
    }

    // Create new $airspace only if it doesn't exist
    if (!this.airspace) {
      const root = await this.manager.load('root');
      this.airspace = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Airspace Manager',
          description:
            'Manages dynamic airspace rooms for aircraft at altitude',
          // Track active airspace rooms for cleanup reference
          airspaceRooms: {},
          abilities: `Airspace management system for aircraft.

COORDINATE SYSTEM: Same grid as ground (30m per x/y unit, 3m per z unit).
Airspace starts at z > 0. z=10 = 30m altitude. z=100 = 300m (cruising).

LIFECYCLE: Airspace rooms are created on-demand when aircraft arrive.
Rooms are recycled when all aircraft leave (empty).

METHODS:
- getOrCreateRoom(x, y, z) - Get existing room or create new airspace room
- releaseRoom(room) - Check if room is empty and recycle it
- getRoomCount() - Count of active airspace rooms

USAGE: Aircraft call getOrCreateRoom() when flying to new coordinates.
On arrival, aircraft call releaseRoom() on their old location.
$spatial handles coordinate indexing automatically via hooks.`,
        },
        methods: {},
      });
    }

    // getOrCreateRoom(x, y, z) - Main entry point for aircraft movement
    this.airspace.setMethod(
      'getOrCreateRoom',
      `
      /** Get or create an airspace room at coordinates.
       *  @param x - X coordinate
       *  @param y - Y coordinate
       *  @param z - Z coordinate (must be > 0 for airspace)
       *  @returns The airspace room object, or null if z <= 0
       */
      const x = args[0];
      const y = args[1];
      const z = args[2];

      // Airspace only exists above ground
      if (z <= 0) {
        return null;
      }

      // 1. Check $spatial first (O(1) lookup)
      const existing = await $spatial.getRoomDataAt(x, y, z);
      if (existing) {
        return existing;  // Room already exists at these coords
      }

      // 2. Create new airspace room
      const altitude = z * 3;  // 3m per z-level
      const room = await $recycler.create({
        parent: $airspaceRoom,
        properties: {
          x: x,
          y: y,
          z: z,
          name: 'Airspace (' + x + ', ' + y + ') ' + altitude + 'm',
          description: 'Open sky.',
          airspace: true,
          outdoor: true,
        },
      });

      // 3. Track for cleanup
      const key = x + ',' + y + ',' + z;
      const rooms = self.airspaceRooms || {};
      rooms[key] = room;
      self.airspaceRooms = rooms;

      return room;
      `,
    );

    // releaseRoom(room) - Called when aircraft leaves a room
    this.airspace.setMethod(
      'releaseRoom',
      `
      /** Release an airspace room, recycling it if empty.
       *  @param room - The airspace room to potentially recycle
       */
      const room = args[0];
      if (!room || !room.airspace) return;  // Not an airspace room

      // Check if room has any aircraft
      const contents = room.contents || [];
      const hasAircraft = contents.some(obj => obj && obj.isAircraft);

      if (!hasAircraft) {
        // Room empty, recycle it
        const key = room.x + ',' + room.y + ',' + room.z;
        const rooms = self.airspaceRooms || {};
        delete rooms[key];
        self.airspaceRooms = rooms;

        // Recycle the room ($spatial auto-unregisters via beforeRecycle hook)
        await $recycler.recycle(room);
      }
      `,
    );

    // getRoomCount() - Get count of active airspace rooms
    this.airspace.setMethod(
      'getRoomCount',
      `
      /** Get count of active airspace rooms */
      const rooms = self.airspaceRooms || {};
      return Object.keys(rooms).length;
      `,
    );

    // describe() - Human-readable status
    this.airspace.setMethod(
      'describe',
      `
      /** Get human-readable status of the airspace system */
      const rooms = self.airspaceRooms || {};
      const roomCount = Object.keys(rooms).length;

      let status = 'Airspace Manager\\n';
      status += '  Active airspace rooms: ' + roomCount + '\\n';

      if (roomCount > 0) {
        status += '  Locations:\\n';
        for (const key of Object.keys(rooms)) {
          const room = rooms[key];
          if (room) {
            const altitude = (room.z || 0) * 3;
            status += '    ' + key + ' (' + altitude + 'm)\\n';
          }
        }
      }

      return status;
      `,
    );

    // Property descriptions
    this.airspace.setPropertyDescription(
      'airspaceRooms',
      'Map of "x,y,z" to active airspace room objrefs for cleanup tracking',
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.airspace) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'airspace', this.airspace.id);
    console.log(`  ✅ Registered $.airspace -> #${this.airspace.id}`);
  }
}

// Self-register
registerBuilder(AirspaceBuilder);
