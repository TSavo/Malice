import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds the $spatial system object
 *
 * Provides O(1) spatial queries for rooms via coordinate-indexed lookups.
 * Maintains two indexes:
 * - roomIndex: { "x,y,z": { id, outdoor, name } } - coordinate to room data
 * - columnIndex: { "x,y": [{ id, z, outdoor }] } - column to z-sorted rooms
 *
 * Used by telescope, world.castRay(), and anywhere that needs fast spatial queries.
 * Rooms self-register via onCreate/beforeRecycle hooks on the Location prototype.
 */
export class SpatialBuilder implements Builder {
  static provides = ['spatial'];
  static depends: string[] = [];

  private spatial: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.spatial) {
      this.spatial = await this.manager.load(aliases.spatial);
      if (this.spatial && !forceRebuild) return; // Already exists
    }

    // Create new $spatial only if it doesn't exist
    if (!this.spatial) {
      const root = await this.manager.load(1);
      this.spatial = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Spatial Index',
          description: 'O(1) spatial queries for rooms via coordinate indexing',
          // roomIndex: { "x,y,z": { id, outdoor, name } }
          roomIndex: {},
          // columnIndex: { "x,y": [{ id, z, outdoor }, ...] } sorted by z desc
          columnIndex: {},
          // Last rebuild timestamp
          lastRebuild: null,
          abilities: `Spatial indexing system for O(1) coordinate lookups.

INDEXES:
- roomIndex: Maps "x,y,z" strings to { id, outdoor, name }
- columnIndex: Maps "x,y" strings to arrays of { id, z, outdoor } sorted by z descending

METHODS:
- rebuild() - Full index rebuild from all objects with coordinates
- add(obj) - Register a single room (called by Location.onCreate)
- remove(obj) - Unregister a room (called by Location.beforeRecycle)
- getRoomDataAt(x, y, z) - O(1) lookup, returns { id, outdoor, name } or null
- isOutdoor(x, y, z) - Quick outdoor check
- getHighestRoomAt(x, y) - Find topmost room at column
- castRay(fromX, fromY, fromZ, tilt, swivel, maxDist) - Trace ray using index lookups

USAGE: Rooms auto-register via onCreate hook when created through $recycler.
Bootstrap calls rebuild() after world geometry is built.`,
        },
        methods: {},
      });
    }

    // rebuild() - Full index rebuild from all objects with coordinates
    this.spatial.setMethod(
      'rebuild',
      `
      /** Rebuild the spatial index from all objects with coordinates.
       *  Stores objrefs directly for proper object reference handling.
       */
      const allIds = $.getAllIds();
      const roomIndex = {};
      const columnIndex = {};
      let count = 0;

      for (const objId of allIds) {
        const obj = await $load(objId);
        if (!obj) continue;

        const x = obj.x;
        const y = obj.y;
        const z = obj.z;

        if (x !== undefined && y !== undefined && z !== undefined) {
          const key = x + ',' + y + ',' + z;
          // Store the objref directly - accessing .outdoor/.name is fast on cached objects
          roomIndex[key] = obj;

          const colKey = x + ',' + y;
          if (!columnIndex[colKey]) {
            columnIndex[colKey] = [];
          }
          columnIndex[colKey].push(obj);
          count++;
        }
      }

      // Sort column entries by z descending (highest first)
      for (const colKey of Object.keys(columnIndex)) {
        columnIndex[colKey].sort((a, b) => (b.z || 0) - (a.z || 0));
      }

      self.roomIndex = roomIndex;
      self.columnIndex = columnIndex;
      self.lastRebuild = Date.now();

      return { indexed: count };
      `,
    );

    // add(obj) - Register a single room
    this.spatial.setMethod(
      'add',
      `
      /** Register a room in the spatial index
       * @param obj - Room object with x, y, z coordinates
       */
      const obj = args[0];
      if (!obj) return;

      const x = obj.x;
      const y = obj.y;
      const z = obj.z;

      if (x === undefined || y === undefined || z === undefined) return;

      // Update room index - store objref directly
      const key = x + ',' + y + ',' + z;
      const roomIndex = self.roomIndex || {};
      roomIndex[key] = obj;
      self.roomIndex = roomIndex;

      // Update column index
      const colKey = x + ',' + y;
      const columnIndex = self.columnIndex || {};
      const col = columnIndex[colKey] || [];

      // Remove any existing entry for this object (in case of update)
      const filtered = col.filter(r => r.id !== obj.id);
      filtered.push(obj);

      // Sort by z descending
      filtered.sort((a, b) => (b.z || 0) - (a.z || 0));
      columnIndex[colKey] = filtered;
      self.columnIndex = columnIndex;
      `,
    );

    // remove(obj) - Unregister a room
    this.spatial.setMethod(
      'remove',
      `
      /** Remove a room from the spatial index
       * @param obj - Room object with x, y, z coordinates
       */
      const obj = args[0];
      if (!obj) return;

      const x = obj.x;
      const y = obj.y;
      const z = obj.z;

      if (x === undefined || y === undefined || z === undefined) return;

      // Remove from room index
      const key = x + ',' + y + ',' + z;
      const roomIndex = self.roomIndex || {};
      delete roomIndex[key];
      self.roomIndex = roomIndex;

      // Remove from column index
      const colKey = x + ',' + y;
      const columnIndex = self.columnIndex || {};
      if (columnIndex[colKey]) {
        columnIndex[colKey] = columnIndex[colKey].filter(r => r.id !== obj.id);
        if (columnIndex[colKey].length === 0) {
          delete columnIndex[colKey];
        }
        self.columnIndex = columnIndex;
      }
      `,
    );

    // getRoomDataAt(x, y, z) - O(1) lookup
    this.spatial.setMethod(
      'getRoomDataAt',
      `
      /** Get room data at coordinates (O(1) lookup)
       * @param x - X coordinate
       * @param y - Y coordinate
       * @param z - Z coordinate
       * @returns { id, outdoor, name } or null
       */
      const x = args[0];
      const y = args[1];
      const z = args[2];

      const key = x + ',' + y + ',' + z;
      const roomIndex = self.roomIndex || {};
      return roomIndex[key] || null;
      `,
    );

    // isOutdoor(x, y, z) - Quick outdoor check
    this.spatial.setMethod(
      'isOutdoor',
      `
      /** Check if coordinates are outdoor (O(1) lookup)
       * @param x - X coordinate
       * @param y - Y coordinate
       * @param z - Z coordinate
       * @returns true if outdoor, false if indoor, null if no room at coordinates
       */
      const x = args[0];
      const y = args[1];
      const z = args[2];

      const key = x + ',' + y + ',' + z;
      const roomIndex = self.roomIndex || {};
      const room = roomIndex[key];
      return room ? room.outdoor : null;
      `,
    );

    // getHighestRoomAt(x, y) - Find topmost room at column
    this.spatial.setMethod(
      'getHighestRoomAt',
      `
      /** Get the highest room at x,y column (O(1) lookup)
       * @param x - X coordinate
       * @param y - Y coordinate
       * @returns { id, z, outdoor } or null
       */
      const x = args[0];
      const y = args[1];

      const colKey = x + ',' + y;
      const columnIndex = self.columnIndex || {};
      const col = columnIndex[colKey];
      return col && col.length > 0 ? col[0] : null;
      `,
    );

    // getLowestRoomAt(x, y) - Find lowest room at column
    this.spatial.setMethod(
      'getLowestRoomAt',
      `
      /** Get the lowest room at x,y column (O(1) lookup)
       * @param x - X coordinate
       * @param y - Y coordinate
       * @returns { id, z, outdoor } or null
       */
      const x = args[0];
      const y = args[1];

      const colKey = x + ',' + y;
      const columnIndex = self.columnIndex || {};
      const col = columnIndex[colKey];
      return col && col.length > 0 ? col[col.length - 1] : null;
      `,
    );

    // getRoomsInColumn(x, y) - Get all rooms at column
    this.spatial.setMethod(
      'getRoomsInColumn',
      `
      /** Get all rooms at x,y column sorted by z descending
       * @param x - X coordinate
       * @param y - Y coordinate
       * @returns Array of { id, z, outdoor }
       */
      const x = args[0];
      const y = args[1];

      const colKey = x + ',' + y;
      const columnIndex = self.columnIndex || {};
      return columnIndex[colKey] || [];
      `,
    );

    // castRay(fromX, fromY, fromZ, tilt, swivel, maxDist) - Trace ray using index
    this.spatial.setMethod(
      'castRay',
      `
      /** Trace a ray from coordinates and return first hit
       * @param fromX - Starting X
       * @param fromY - Starting Y
       * @param fromZ - Starting Z
       * @param tilt - Tilt angle in degrees (0=down, 90=horizontal, 180=up)
       * @param swivel - Swivel angle in degrees (0=north, 90=east, 180=south, 270=west)
       * @param maxDist - Maximum distance to trace
       * @returns { hit: boolean, room?: { id, outdoor, name }, distance: number, x?: number, y?: number, z?: number }
       */
      const fromX = args[0];
      const fromY = args[1];
      const fromZ = args[2];
      const tilt = args[3];
      const swivel = args[4];
      const maxDist = args[5] || 50;

      const roomIndex = self.roomIndex || {};

      // Convert tilt/swivel to direction vector
      const tiltRad = tilt * Math.PI / 180;
      const swivelRad = swivel * Math.PI / 180;

      // Direction components
      const horizontal = Math.sin(tiltRad);
      const vertical = -Math.cos(tiltRad);
      const dx = horizontal * Math.sin(swivelRad);
      const dy = horizontal * Math.cos(swivelRad);
      const dz = vertical;

      // Trace ray step by step
      for (let dist = 1; dist <= maxDist; dist++) {
        const x = Math.round(fromX + dx * dist);
        const y = Math.round(fromY + dy * dist);
        const z = Math.round(fromZ + dz * dist);

        const key = x + ',' + y + ',' + z;
        const room = roomIndex[key];

        if (room) {
          return {
            hit: true,
            room: room,
            distance: dist,
            x: x,
            y: y,
            z: z
          };
        }
      }

      // No hit within maxDist
      return {
        hit: false,
        distance: maxDist
      };
      `,
    );

    // describe() - Human-readable status
    this.spatial.setMethod(
      'describe',
      `
      /** Get human-readable status of the spatial index */
      const roomIndex = self.roomIndex || {};
      const columnIndex = self.columnIndex || {};
      const roomCount = Object.keys(roomIndex).length;
      const columnCount = Object.keys(columnIndex).length;
      const lastRebuild = self.lastRebuild;

      let status = 'Spatial Index\\n';
      status += '  Rooms indexed: ' + roomCount + '\\n';
      status += '  Unique columns: ' + columnCount + '\\n';

      if (lastRebuild) {
        const ago = Math.round((Date.now() - lastRebuild) / 1000);
        status += '  Last rebuild: ' + ago + 's ago\\n';
      } else {
        status += '  Last rebuild: never\\n';
      }

      return status;
      `,
    );

    // Property descriptions
    this.spatial.setPropertyDescription(
      'roomIndex',
      'Map of "x,y,z" to { id, outdoor, name }',
    );
    this.spatial.setPropertyDescription(
      'columnIndex',
      'Map of "x,y" to array of { id, z, outdoor } sorted by z desc',
    );
    this.spatial.setPropertyDescription(
      'lastRebuild',
      'Timestamp of last full rebuild',
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.spatial) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'spatial', this.spatial.id);
    console.log(`  ✅ Registered $.spatial -> #${this.spatial.id}`);
  }
}

// Self-register
registerBuilder(SpatialBuilder);
