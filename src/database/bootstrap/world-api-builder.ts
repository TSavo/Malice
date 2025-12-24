import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds $world object
 * Provides API for accessing:
 * - All rooms with coordinates
 * - Authenticated connections (players)
 */
export class WorldApiBuilder {
  private world: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.world) {
      this.world = await this.manager.load(aliases.world);
      if (this.world && !forceRebuild) return;
    }

    if (!this.world) {
      const root = await this.manager.load(1);
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
  }

  private addGetAllRoomsMethod(): void {
    if (!this.world) return;

    this.world.setMethod('getAllRooms', `
      // Get all rooms that have coordinates (x, y, z properties)
      const allIds = await $.objectManager.getAllIds();
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
    `);
  }

  private addGetAuthenticatedConnectionsMethod(): void {
    if (!this.world) return;

    this.world.setMethod('getAuthenticatedConnections', `
      // Get authenticated connections from the game coordinator
      const gameCoordinator = $.objectManager.getGameCoordinator();
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
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.world) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'world', this.world.id);
    console.log(`✅ Registered world alias -> #${this.world.id}`);
  }
}
