import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

interface ExitData {
  to?: string; // Target file path (for building connections, ignored by world-builder)
  room?: string; // Target placeholder (for building connections, ignored by world-builder)
  prototype?: string; // Exit prototype name (e.g., 'guardedExit')
  allowedFaction?: string; // For guardedExit
  denyMessage?: string; // For guardedExit
  description?: string; // Exit description
  hidden?: boolean;
  locked?: boolean;
  vehicleAllowed?: boolean; // Whether vehicles can use this exit (default true for world exits)
}

interface RoomData {
  name: string;
  description: string;
  x: number;
  y: number;
  z: number;
  intersection?: string[];
  blocked?: boolean;
  exits?: Record<string, ExitData | string>; // Custom exit definitions
}

interface StreetConfig {
  dir: string;
  y: number;
  prefix: string;
}

/**
 * Builds the game world from room data files.
 *
 * Reads room definitions from src/database/bootstrap/world/ and creates:
 * - Room objects with coordinates
 * - Exit connections between adjacent rooms
 *
 * Coordinate system (Pioneer Square):
 * - X: West (-) to East (+), Waterfront=-15 to 4th Ave=+15
 * - Y: South (-) to North (+), S.King=-10 to Yesler=+10
 * - Z: Vertical, street=0, underground negative, upper floors positive
 *
 * Rooms are connected by cardinal directions based on coordinates:
 * - North/South: rooms with same X, Y differs by 1
 * - East/West: rooms with same Y, X differs by 1
 */
export class WorldBuilder implements Builder {
  static provides = ['startRoom'];
  static depends = ['room', 'exit', 'recycler']; // Needs these prototypes

  private rooms: Map<string, RuntimeObject> = new Map();
  private roomData: Map<string, RoomData> = new Map();

  constructor(private manager: ObjectManager) {}

  /**
   * Build the world from room data files
   */
  async build(): Promise<void> {
    const $ = this.manager as any;

    // Check if world already built
    if ($.startRoom) {
      console.log('  ✅ World already built ($.startRoom exists)');
      return;
    }

    if (!$.room || !$.exit || !$.recycler) {
      throw new Error(
        'Room, Exit, and Recycler prototypes must exist before building world',
      );
    }

    console.log('  📍 Building Pioneer Square...');

    // Load room data from files
    await this.loadRoomData();
    console.log(`    Loaded ${this.roomData.size} room definitions`);

    // Create room objects
    await this.createRooms();
    console.log(`    Created ${this.rooms.size} rooms`);

    // Connect rooms with exits
    await this.connectRooms();

    // Register starting room alias
    await this.registerStartRoom();

    console.log('  ✅ Pioneer Square built');
  }

  /**
   * Load room data from TypeScript files
   */
  private async loadRoomData(): Promise<void> {
    const worldDir = path.join(
      process.cwd(),
      'src/database/bootstrap/world/seattle/pioneer-square',
    );

    // Street directories (east-west, files named x*.ts)
    const streets: StreetConfig[] = [
      { dir: 'yesler-way', y: 10, prefix: 'Yesler Way' },
      { dir: 's-washington', y: 5, prefix: 'S. Washington St' },
      { dir: 's-main', y: 0, prefix: 'S. Main St' },
      { dir: 's-jackson', y: -5, prefix: 'S. Jackson St' },
      { dir: 's-king', y: -10, prefix: 'S. King St' },
    ];

    // Avenue directories (north-south, files named y*.ts)
    const avenues = [
      { dir: 'waterfront', x: -15 },
      { dir: 'alley', x: -17 },
      { dir: '1st-ave-s', x: -9 },
      { dir: 'occidental-ave-s', x: -3 },
      { dir: '2nd-ave-s', x: 3 },
      { dir: '3rd-ave-s', x: 9 },
      { dir: '4th-ave-s', x: 15 },
    ];

    // Load street rooms (x*.ts files)
    for (const street of streets) {
      const streetDir = path.join(worldDir, street.dir);

      if (!fs.existsSync(streetDir)) {
        continue;
      }

      const files = fs
        .readdirSync(streetDir)
        .filter((f) => f.endsWith('.ts') && f.startsWith('x'));

      for (const file of files) {
        try {
          const filePath = path.join(streetDir, file);
          const fileUrl = pathToFileURL(filePath).href;
          const module = await import(fileUrl);
          const roomDef = module.room as RoomData;

          if (roomDef && typeof roomDef.x === 'number') {
            const key = this.coordKey(roomDef.x, roomDef.y, roomDef.z || 0);
            this.roomData.set(key, roomDef);
          }
        } catch (err) {
          console.warn(`    Warning: Could not load ${file}: ${err}`);
        }
      }
    }

    // Load avenue rooms (y*.ts files)
    for (const avenue of avenues) {
      const avenueDir = path.join(worldDir, avenue.dir);

      if (!fs.existsSync(avenueDir)) {
        continue;
      }

      const files = fs
        .readdirSync(avenueDir)
        .filter((f) => f.endsWith('.ts') && f.startsWith('y'));

      for (const file of files) {
        try {
          const filePath = path.join(avenueDir, file);
          const fileUrl = pathToFileURL(filePath).href;
          const module = await import(fileUrl);
          const roomDef = module.room as RoomData;

          if (roomDef && typeof roomDef.x === 'number') {
            const key = this.coordKey(roomDef.x, roomDef.y, roomDef.z || 0);
            this.roomData.set(key, roomDef);
          }
        } catch (err) {
          console.warn(`    Warning: Could not load ${file}: ${err}`);
        }
      }
    }

    // Load alley rooms (all *.ts files in alleys directory)
    const alleysDir = path.join(worldDir, 'alleys');
    if (fs.existsSync(alleysDir)) {
      const files = fs.readdirSync(alleysDir).filter((f) => f.endsWith('.ts'));

      for (const file of files) {
        try {
          const filePath = path.join(alleysDir, file);
          const fileUrl = pathToFileURL(filePath).href;
          const module = await import(fileUrl);
          const roomDef = module.room as RoomData;

          if (roomDef && typeof roomDef.x === 'number') {
            const key = this.coordKey(roomDef.x, roomDef.y, roomDef.z || 0);
            this.roomData.set(key, roomDef);
          }
        } catch (err) {
          console.warn(`    Warning: Could not load alley ${file}: ${err}`);
        }
      }
    }

    // Load Occidental Park rooms (all *.ts files in occidental-park directory)
    const parkDir = path.join(worldDir, 'occidental-park');
    if (fs.existsSync(parkDir)) {
      const files = fs.readdirSync(parkDir).filter((f) => f.endsWith('.ts'));

      for (const file of files) {
        try {
          const filePath = path.join(parkDir, file);
          const fileUrl = pathToFileURL(filePath).href;
          const module = await import(fileUrl);
          const roomDef = module.room as RoomData;

          if (roomDef && typeof roomDef.x === 'number') {
            const key = this.coordKey(roomDef.x, roomDef.y, roomDef.z || 0);
            this.roomData.set(key, roomDef);
          }
        } catch (err) {
          console.warn(`    Warning: Could not load park ${file}: ${err}`);
        }
      }
    }

    // Load Underground rooms (all *.ts files in underground subdirectories)
    const undergroundDir = path.join(worldDir, 'underground');
    if (fs.existsSync(undergroundDir)) {
      const subdirs = fs
        .readdirSync(undergroundDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      for (const subdir of subdirs) {
        const dir = path.join(undergroundDir, subdir);
        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts'));

        for (const file of files) {
          try {
            const filePath = path.join(dir, file);
            const fileUrl = pathToFileURL(filePath).href;
            const module = await import(fileUrl);
            const roomDef = module.room as RoomData;

            if (roomDef && typeof roomDef.x === 'number') {
              const key = this.coordKey(roomDef.x, roomDef.y, roomDef.z || 0);
              this.roomData.set(key, roomDef);
            }
          } catch (err) {
            console.warn(
              `    Warning: Could not load underground ${subdir}/${file}: ${err}`,
            );
          }
        }
      }
    }
  }

  /**
   * Create room objects from loaded data
   */
  private async createRooms(): Promise<void> {
    const $ = this.manager as any;
    const recycler = $.recycler;
    const roomProto = $.room;

    for (const [key, data] of this.roomData) {
      if (data.blocked) {
        continue; // Skip blocked areas
      }

      const room = await recycler.create({
        parent: roomProto,
        properties: {
          name: data.name,
          description: data.description,
          x: data.x,
          y: data.y,
          z: data.z || 0,
          exits: [],
        },
      });

      this.rooms.set(key, room);
    }
  }

  /**
   * Connect rooms with exits based on adjacency
   * Supports custom exit definitions with prototypes (e.g., guardedExit)
   */
  private async connectRooms(): Promise<void> {
    const $ = this.manager as any;
    const recycler = $.recycler;
    const exitProto = $.exit;
    const guardedExitProto = $.guardedExit;

    let exitCount = 0;

    for (const [key, room] of this.rooms) {
      const [x, y, z] = this.parseKey(key);
      const data = this.roomData.get(key);

      // Check each cardinal direction
      const directions: Array<{
        dx: number;
        dy: number;
        dz: number;
        name: string;
        aliases: string[];
      }> = [
        { dx: 0, dy: 1, dz: 0, name: 'north', aliases: ['n'] },
        { dx: 0, dy: -1, dz: 0, name: 'south', aliases: ['s'] },
        { dx: 1, dy: 0, dz: 0, name: 'east', aliases: ['e'] },
        { dx: -1, dy: 0, dz: 0, name: 'west', aliases: ['w'] },
        { dx: 0, dy: 0, dz: 1, name: 'up', aliases: ['u'] },
        { dx: 0, dy: 0, dz: -1, name: 'down', aliases: ['d', 'dn'] },
      ];

      for (const dir of directions) {
        const neighborKey = this.coordKey(x + dir.dx, y + dir.dy, z + dir.dz);
        const neighbor = this.rooms.get(neighborKey);

        if (neighbor) {
          // Check for custom exit definition
          const customExit = data?.exits?.[dir.name];
          const exitData: ExitData | undefined =
            typeof customExit === 'object' ? customExit : undefined;

          // Determine exit prototype
          let parent = exitProto;
          if (exitData?.prototype === 'guardedExit' && guardedExitProto) {
            parent = guardedExitProto;
          }

          // Calculate distance between rooms
          const distance = this.calculateDistance(
            x,
            y,
            z,
            x + dir.dx,
            y + dir.dy,
            z + dir.dz,
          );

          // Build exit properties
          const properties: Record<string, unknown> = {
            name: dir.name,
            aliases: dir.aliases,
            destRoom: neighbor,
            distance: distance,
            hidden: exitData?.hidden ?? false,
            locked: exitData?.locked ?? false,
            // Vehicles allowed on surface streets only (z=0, horizontal movement)
            vehicleAllowed: exitData?.vehicleAllowed ?? (z >= 0 && dir.dz === 0),
          };

          // Add custom properties from exit definition
          if (exitData?.description) {
            properties.description = exitData.description;
          }
          if (exitData?.allowedFaction) {
            properties.allowedFaction = exitData.allowedFaction;
          }
          if (exitData?.denyMessage) {
            properties.denyMessage = exitData.denyMessage;
          }

          // Create exit
          const exit = await recycler.create({
            parent,
            properties,
          });

          // Add exit to room
          await room.call('addExit', exit);
          exitCount++;
        }
      }
    }

    console.log(`    Created ${exitCount} exits`);
  }

  /**
   * Calculate distance between coordinates (in meters)
   * Grid spacing: ~30m per coordinate unit
   */
  private calculateDistance(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
  ): number {
    const dx = (x2 - x1) * 30; // 30m per grid unit horizontal
    const dy = (y2 - y1) * 30;
    const dz = (z2 - z1) * 3; // 3m per floor vertical
    return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
  }

  /**
   * Register the starting room as an alias
   */
  private async registerStartRoom(): Promise<void> {
    const objectManager = await this.manager.load(0);

    // Use (0, 0, 0) as the starting point - S. Main & Occidental intersection
    const startKey = this.coordKey(-3, 0, 0);
    const startRoom = this.rooms.get(startKey);

    if (startRoom && objectManager) {
      await objectManager.call('addAlias', 'startRoom', startRoom.id);
      console.log(
        `    Registered $.startRoom = #${startRoom.id} (${startRoom.get('name')})`,
      );
    } else {
      // Fallback: use first room
      const firstRoom = this.rooms.values().next().value;
      if (firstRoom && objectManager) {
        await objectManager.call('addAlias', 'startRoom', firstRoom.id);
        console.log(`    Registered $.startRoom = #${firstRoom.id} (fallback)`);
      }
    }
  }

  /**
   * Create coordinate key string
   */
  private coordKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  /**
   * Parse coordinate key string
   */
  private parseKey(key: string): [number, number, number] {
    const [x, y, z] = key.split(',').map(Number);
    return [x, y, z];
  }

  /**
   * Get all rooms (for testing/debugging)
   */
  getRooms(): Map<string, RuntimeObject> {
    return this.rooms;
  }

  async registerAliases(): Promise<void> {
    // startRoom alias is registered in registerStartRoom() during build()
    // This is a no-op since the alias is already registered
  }
}

// Self-register
registerBuilder(WorldBuilder);
