import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds $world object
 * Provides API for accessing:
 * - All rooms with coordinates
 * - Authenticated connections (players)
 */
export class WorldApiBuilder implements Builder {
  static provides = ['world'];
  static depends: string[] = [];

  private world: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.world) {
      this.world = await this.manager.load(aliases.world);
      if (this.world) return;
    }

    if (!this.world) {
      const root = await this.manager.load('root');
      this.world = await this.manager.create({
        parent: root!,
        properties: {
          name: 'World',
          description: 'API for accessing world data and connections',
        },
        methods: {},
      });
    }

    this.addGetAllRoomsMethod();
    this.addGetAuthenticatedConnectionsMethod();
    this.addGetHighestRoomAtMethod();
    this.addGetLowestRoomAtMethod();
    this.addGetRoomAtHeightMethod();
    this.addCastRayMethod();
  }

  private addGetAllRoomsMethod(): void {
    if (!this.world) return;

    this.world.setMethod(
      'getAllRooms',
      `
      // Get all rooms that have coordinates (x, y, z properties)
      const allIds = $.getAllIds();
      const rooms = [];

      for (const id of allIds) {
        const obj = await $load(id);
        if (!obj) continue;

        // Check if object has coordinate properties
        const x = obj.x;
        const y = obj.y;
        const z = obj.z;

        if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
          rooms.push({
            id: obj.id,
            name: obj.name || '',
            x,
            y,
            z,
            outdoor: obj.outdoor || false,
          });
        }
      }

      return rooms;
    `,
    );
  }

  private addGetAuthenticatedConnectionsMethod(): void {
    if (!this.world) return;

    this.world.setMethod(
      'getAuthenticatedConnections',
      `
      // Get authenticated connections from the game coordinator
      const gameCoordinator = $.getGameCoordinator();
      if (!gameCoordinator) {
        console.error('[World] GameCoordinator not available');
        return [];
      }

      const connectionManager = gameCoordinator.getConnectionManager();
      if (!connectionManager) {
        console.error('[World] ConnectionManager not available');
        return [];
      }

      // Get authenticated connections
      const authConnections = connectionManager.getAuthenticatedConnections();
      const result = [];

      for (const conn of authConnections) {
        // Get the user ID
        const userId = conn.userId;
        if (!userId) continue;

        // Load the player object
        const player = await $load(parseInt(userId));
        if (!player) continue;

        result.push({
          connectionId: conn.id,
          userId: player.id,
          player: player,
        });
      }

      return result;
    `,
    );
  }

  private addGetHighestRoomAtMethod(): void {
    if (!this.world) return;

    this.world.setMethod(
      'getHighestRoomAt',
      `
      /** Find the highest (surface-level) room at a given x,y coordinate.
       *  Use when looking DOWN from above.
       *  @param x - X coordinate
       *  @param y - Y coordinate
       *  @returns Room object {id, name, x, y, z} or null if no room exists
       */
      const x = args[0];
      const y = args[1];
      const allRooms = await self.getAllRooms();
      const roomsAtCell = allRooms.filter(r => r.x === x && r.y === y);
      if (roomsAtCell.length === 0) return null;
      return roomsAtCell.reduce((highest, room) => room.z > highest.z ? room : highest);
      `,
    );
  }

  private addGetLowestRoomAtMethod(): void {
    if (!this.world) return;

    this.world.setMethod(
      'getLowestRoomAt',
      `
      /** Find the lowest room at a given x,y coordinate.
       *  Use when looking UP - finds the floor above.
       *  @param x - X coordinate
       *  @param y - Y coordinate
       *  @returns Room object {id, name, x, y, z} or null if no room exists
       */
      const x = args[0];
      const y = args[1];
      const allRooms = await self.getAllRooms();
      const roomsAtCell = allRooms.filter(r => r.x === x && r.y === y);
      if (roomsAtCell.length === 0) return null;
      return roomsAtCell.reduce((lowest, room) => room.z < lowest.z ? room : lowest);
      `,
    );
  }

  private addGetRoomAtHeightMethod(): void {
    if (!this.world) return;

    this.world.setMethod(
      'getRoomAtHeight',
      `
      /** Find room at x,y closest to targetZ in given direction.
       *  @param x - X coordinate
       *  @param y - Y coordinate
       *  @param targetZ - Target Z height
       *  @param direction - 'down' (highest room <= targetZ) or 'up' (lowest room >= targetZ)
       *  @returns Room object {id, name, x, y, z} or null
       */
      const x = args[0];
      const y = args[1];
      const targetZ = args[2];
      const direction = args[3] || 'down';
      const allRooms = await self.getAllRooms();
      const roomsAtCell = allRooms.filter(r => r.x === x && r.y === y);
      if (roomsAtCell.length === 0) return null;

      if (direction === 'up') {
        const above = roomsAtCell.filter(r => r.z >= targetZ);
        if (above.length === 0) return null;
        return above.reduce((lowest, r) => r.z < lowest.z ? r : lowest);
      } else {
        const below = roomsAtCell.filter(r => r.z <= targetZ);
        if (below.length === 0) return null;
        return below.reduce((highest, r) => r.z > highest.z ? r : highest);
      }
      `,
    );
  }

  private addCastRayMethod(): void {
    if (!this.world) return;

    this.world.setMethod(
      'castRay',
      `
      /** Cast a ray and gather visible rooms until blocked.
       *  @param fromX, fromY, fromZ - Starting position
       *  @param tilt - Vertical angle: 0=straight down, 90=horizontal, >90=up (degrees)
       *  @param swivel - Horizontal angle: 0=north, 90=east, 180=south, 270=west (degrees)
       *  @param maxDist - Maximum steps to trace (default: 50)
       *  @returns { rooms: [{id, name, x, y, z}...], distance, blocked: boolean }
       *
       *  BEHAVIOR:
       *  - If looking down (tilt < 45): Returns first surface room hit
       *    - If no room at target, spirals outward to find nearest room
       *  - If looking horizontal/up: Traces through outdoor rooms via exits
       *    - Stops at: indoor room (blocks view), gap (no room), no exit in direction
       */
      const fromX = args[0];
      const fromY = args[1];
      const fromZ = args[2];
      const tilt = args[3] ?? 0;
      const swivel = args[4] ?? 0;
      const maxDist = args[5] ?? 50;

      const tiltRad = tilt * Math.PI / 180;
      const swivelRad = swivel * Math.PI / 180;

      // Calculate direction vector
      const horizontal = Math.sin(tiltRad);
      const dx = horizontal * Math.sin(swivelRad);
      const dy = horizontal * Math.cos(swivelRad);

      const rooms = [];
      let distance = 0;
      let blocked = false;

      // If looking mostly down (tilt < 45), find first surface hit
      if (tilt < 45) {
        // Calculate where ray hits z=0
        const stepsToGround = fromZ / Math.cos(tiltRad);
        const targetX = Math.round(fromX + stepsToGround * dx);
        const targetY = Math.round(fromY + stepsToGround * dy);

        // Try target first
        let surfaceRoom = await self.getHighestRoomAt(targetX, targetY);
        let foundX = targetX, foundY = targetY;

        // If no room, spiral outward to find nearest
        if (!surfaceRoom) {
          const maxSpiral = 10;
          outer: for (let radius = 1; radius <= maxSpiral; radius++) {
            for (let offsetX = -radius; offsetX <= radius; offsetX++) {
              for (let offsetY = -radius; offsetY <= radius; offsetY++) {
                // Only check perimeter of this radius
                if (Math.abs(offsetX) !== radius && Math.abs(offsetY) !== radius) continue;

                const checkX = targetX + offsetX;
                const checkY = targetY + offsetY;
                const room = await self.getHighestRoomAt(checkX, checkY);
                if (room) {
                  surfaceRoom = room;
                  foundX = checkX;
                  foundY = checkY;
                  break outer;
                }
              }
            }
          }
        }

        if (surfaceRoom) {
          rooms.push(surfaceRoom);
          // Recalculate distance based on actual found position
          const actualDx = foundX - fromX;
          const actualDy = foundY - fromY;
          distance = Math.round(Math.sqrt(actualDx*actualDx + actualDy*actualDy + fromZ*fromZ));
        }
        return { rooms, distance, blocked: !surfaceRoom };
      }

      // Horizontal/upward: trace through rooms via exits
      const allRooms = await self.getAllRooms();
      const getExitDirection = (sw) => {
        const dirs = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
        return dirs[Math.round(sw / 45) % 8];
      };
      const exitDir = getExitDirection(swivel);

      let currentRoom = null;
      // Find starting room
      const startRooms = allRooms.filter(r => r.x === Math.round(fromX) && r.y === Math.round(fromY) && r.z === Math.round(fromZ));
      if (startRooms.length > 0) {
        currentRoom = await $load(startRooms[0].id);
      }

      for (let step = 0; step < maxDist && currentRoom; step++) {
        rooms.push({ id: currentRoom.id, name: currentRoom.name, x: currentRoom.x, y: currentRoom.y, z: currentRoom.z });
        distance = step + 1;

        // Check if indoor (blocks further view)
        if (!currentRoom.outdoor) {
          blocked = true;
          break;
        }

        // Check for exit in our direction
        const exits = currentRoom.exits || [];
        const exit = exits.find(e => e.direction === exitDir || (e.aliases && e.aliases.includes(exitDir)));
        if (!exit) {
          blocked = true; // No exit in this direction
          break;
        }

        // Load destination room
        const destRoom = await $load(exit.destination);
        if (!destRoom) {
          blocked = true; // Gap
          break;
        }

        currentRoom = destRoom;
      }

      return { rooms, distance, blocked };
      `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.world) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'world', this.world.id);
    console.log(`Registered world alias -> #${this.world.id}`);
  }
}

// Self-register
registerBuilder(WorldApiBuilder);
