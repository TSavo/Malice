import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

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
  static depends = ['airspaceRoom']; // Dynamic room types (waterRoom, underwaterRoom added later)

  private spatial: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.spatial) {
      this.spatial = await this.manager.load(aliases.spatial);
      if (this.spatial) return; // Already exists
    }

    // Create new $spatial only if it doesn't exist
    if (!this.spatial) {
      const root = await this.manager.load('root');
      this.spatial = await this.manager.create({
        parent: root!,
        properties: {
          name: 'Spatial Index',
          description:
            'Unified spatial manager: coordinate indexing, terrain types, dynamic room lifecycle',
          // roomIndex: { "x,y,z": room } - coordinate to room
          roomIndex: {},
          // columnIndex: { "x,y": [room, ...] } sorted by z desc
          columnIndex: {},
          // terrainIndex: { "x,y": terrainType } - sparse overrides
          terrainIndex: {},
          // dynamicRooms: { "x,y,z": room } - track dynamic rooms for cleanup
          dynamicRooms: {},
          // Last rebuild timestamp
          lastRebuild: null,
          abilities: `Unified spatial manager. Coordinate indexing + terrain + dynamic rooms.

INDEXES: O(1) lookup by "x,y,z". Column queries by "x,y".

TERRAIN: getTerrainAt(x, y) → 'urban', 'water', 'badlands'.
  - x < -15: water (Elliott Bay)
  - x > 20 or |y| > 15: badlands
  - Otherwise: urban
  - Use setTerrain(x, y, type) to override specific columns.

DYNAMIC ROOMS: getOrCreateRoom(x, y, z) creates room based on terrain.
  - Water terrain: $waterRoom (z=0) or $underwaterRoom (z<0)
  - Any terrain z>0: $airspaceRoom
  - Urban z<=0: returns null (must be pre-built)

PERSISTENCE: Rooms with persistent=true or hasModifications=true survive cleanup.
releaseRoom(room) recycles empty, non-persistent rooms.`,
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

    // ============== TERRAIN METHODS ==============

    // getTerrainAt(x, y) - Get terrain type for column
    this.spatial.setMethod(
      'getTerrainAt',
      `
      /** Get terrain type for a column.
       * @param x - X coordinate
       * @param y - Y coordinate
       * @returns 'urban' | 'water' | 'badlands'
       */
      const x = args[0];
      const y = args[1];

      // Check sparse overrides first
      const terrainIndex = self.terrainIndex || {};
      const key = x + ',' + y;
      const override = terrainIndex[key];
      if (override) return override;

      // Default regions
      if (x < -15) return 'water';  // Elliott Bay (west)
      if (x > 20 || y > 15 || y < -15) return 'badlands';  // Outside city
      return 'urban';  // City
      `,
    );

    // isWater(x, y) - Check if column is water
    this.spatial.setMethod(
      'isWater',
      `
      /** Check if column is water terrain.
       * @param x - X coordinate
       * @param y - Y coordinate
       * @returns true if water
       */
      const terrain = await self.getTerrainAt(args[0], args[1]);
      return terrain === 'water';
      `,
    );

    // isCoastal(x, y) - Check if column is adjacent to water
    this.spatial.setMethod(
      'isCoastal',
      `
      /** Check if column is adjacent to water (can access ocean).
       * @param x - X coordinate
       * @param y - Y coordinate
       * @returns true if coastal
       */
      const x = args[0];
      const y = args[1];

      // Check if any adjacent column is water
      const adjacent = [
        [x - 1, y], [x + 1, y],
        [x, y - 1], [x, y + 1],
      ];

      for (const [ax, ay] of adjacent) {
        const terrain = await self.getTerrainAt(ax, ay);
        if (terrain === 'water') return true;
      }
      return false;
      `,
    );

    // setTerrain(x, y, type) - Override terrain for specific column
    this.spatial.setMethod(
      'setTerrain',
      `
      /** Override terrain type for a specific column.
       * @param x - X coordinate
       * @param y - Y coordinate
       * @param type - Terrain type ('urban', 'water', 'badlands', null to clear)
       */
      const x = args[0];
      const y = args[1];
      const type = args[2];

      const terrainIndex = self.terrainIndex || {};
      const key = x + ',' + y;

      if (type === null || type === undefined) {
        delete terrainIndex[key];
      } else {
        terrainIndex[key] = type;
      }

      self.terrainIndex = terrainIndex;
      `,
    );

    // ============== DYNAMIC ROOM METHODS ==============

    // getOrCreateRoom(x, y, z) - Get or create dynamic room based on terrain
    this.spatial.setMethod(
      'getOrCreateRoom',
      `
      /** Get existing room or create dynamic room based on terrain.
       * @param x - X coordinate
       * @param y - Y coordinate
       * @param z - Z coordinate
       * @returns Room object or null if cannot create
       */
      const x = args[0];
      const y = args[1];
      const z = args[2];

      // Check if room already exists
      const existing = await self.getRoomDataAt(x, y, z);
      if (existing) return existing;

      // Determine room type from terrain + z
      const terrain = await self.getTerrainAt(x, y);
      let roomType = null;

      if (terrain === 'water') {
        if (z === 0) {
          roomType = $waterRoom;
        } else if (z < 0) {
          roomType = $underwaterRoom;
        } else {
          roomType = $airspaceRoom;  // Above water
        }
      } else if (z > 0) {
        roomType = $airspaceRoom;  // Any terrain can have airspace
      } else {
        // Urban/badlands at z <= 0 - must be pre-built
        return null;
      }

      if (!roomType) return null;

      // Create the dynamic room
      const room = await $recycler.create(roomType, {
        x: x,
        y: y,
        z: z,
      });

      // Track for cleanup
      const key = x + ',' + y + ',' + z;
      const dynamicRooms = self.dynamicRooms || {};
      dynamicRooms[key] = room;
      self.dynamicRooms = dynamicRooms;

      return room;
      `,
    );

    // releaseRoom(room) - Release a dynamic room for potential recycling
    this.spatial.setMethod(
      'releaseRoom',
      `
      /** Release a dynamic room, recycling if empty and not persistent.
       * @param room - The room to potentially recycle
       */
      const room = args[0];
      if (!room) return;

      // Only dynamic rooms can be released
      const key = room.x + ',' + room.y + ',' + room.z;
      const dynamicRooms = self.dynamicRooms || {};
      if (!dynamicRooms[key]) return;  // Not a dynamic room

      // Check persistence
      if (room.persistent) return;  // Never recycle persistent rooms
      if (room.hasModifications) return;  // Keep modified rooms

      // Check if room has contents
      const contents = room.contents || [];
      if (contents.length > 0) return;  // Still has contents

      // Safe to recycle
      delete dynamicRooms[key];
      self.dynamicRooms = dynamicRooms;

      await $recycler.recycle(room);
      `,
    );

    // getDynamicRoomCount() - Get count of active dynamic rooms
    this.spatial.setMethod(
      'getDynamicRoomCount',
      `
      /** Get count of active dynamic rooms */
      const dynamicRooms = self.dynamicRooms || {};
      return Object.keys(dynamicRooms).length;
      `,
    );

    // describe() - Human-readable status
    this.spatial.setMethod(
      'describe',
      `
      /** Get human-readable status of the spatial index */
      const roomIndex = self.roomIndex || {};
      const columnIndex = self.columnIndex || {};
      const terrainIndex = self.terrainIndex || {};
      const dynamicRooms = self.dynamicRooms || {};

      const roomCount = Object.keys(roomIndex).length;
      const columnCount = Object.keys(columnIndex).length;
      const terrainOverrides = Object.keys(terrainIndex).length;
      const dynamicCount = Object.keys(dynamicRooms).length;
      const lastRebuild = self.lastRebuild;

      let status = 'Spatial Index\\n';
      status += '  Rooms indexed: ' + roomCount + '\\n';
      status += '  Unique columns: ' + columnCount + '\\n';
      status += '  Terrain overrides: ' + terrainOverrides + '\\n';
      status += '  Dynamic rooms: ' + dynamicCount + '\\n';

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
      'Map of "x,y,z" to room objref',
    );
    this.spatial.setPropertyDescription(
      'columnIndex',
      'Map of "x,y" to array of room objrefs sorted by z desc',
    );
    this.spatial.setPropertyDescription(
      'terrainIndex',
      'Map of "x,y" to terrain type override (sparse)',
    );
    this.spatial.setPropertyDescription(
      'dynamicRooms',
      'Map of "x,y,z" to dynamically created room objrefs',
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
