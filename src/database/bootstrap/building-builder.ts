import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

/**
 * Builds buildings from structured definitions with explicit exit connections.
 *
 * Buildings use a memento-like placeholder system (%0, %1, %2, etc.) to define
 * room graphs without relying on automatic grid connections.
 *
 * Building definition format:
 * {
 *   rooms: {
 *     '%0': {
 *       name: 'Room Name',
 *       description: 'Room description...',
 *       x: -5, y: 9, z: 1,
 *       population: 0,
 *       ambientNoise: 5,
 *       lighting: 80,
 *       waterLevel: 0,
 *       outdoor: false,
 *       exits: {
 *         north: '%1',      // Connects to room %1
 *         east: '%2',       // Connects to room %2
 *         up: { room: '%3', locked: true, lockKey: '%4' }, // With exit properties
 *         west: { to: '1st-ave-s/y10.ts', description: 'Doors lead west' }, // World room ref
 *       },
 *       objects: [
 *         { prototype: 'jobBoard', name: 'Employment Terminal' },
 *         { prototype: 'sign', name: 'Directory', text: 'Floor Guide...' },
 *       ]
 *     },
 *     '%1': { ... },
 *   }
 * }
 *
 * Exit types:
 * - Simple: '%1' - connects to room placeholder %1 within the building
 * - Complex: { room: '%1', locked: true } - placeholder with properties
 * - World ref: { to: 'path/file.ts', description: '...' } - connects to a world room
 *   The 'to' path is relative to pioneer-square/ and the room's coordinates are
 *   read from the file. Bidirectional exits are created automatically.
 *
 * Objects in rooms:
 * - prototype: Required. Name of the prototype alias (e.g., 'jobBoard', 'sign')
 * - All other properties are passed to the created object
 *
 * This allows precise control over building interiors where not every adjacent
 * coordinate should be connected (walls exist).
 */
interface DeferredWorldExit {
  sourceRoom: RuntimeObject;
  direction: string;
  toPath: string;
  exitProps: any;
  description?: string;
}

export class BuildingBuilder {
  private buildings: Map<string, Map<string, RuntimeObject>> = new Map();
  private deferredWorldExits: DeferredWorldExit[] = [];

  constructor(private manager: ObjectManager) {}

  /**
   * Build all buildings from definition files
   */
  async build(): Promise<void> {
    const $ = this.manager as any;

    if (!$.room || !$.exit || !$.recycler) {
      throw new Error('Room, Exit, and Recycler prototypes must exist before building buildings');
    }

    console.log('  🏢 Building structures...');

    await this.loadBuildings();

    // Connect buildings to world rooms (deferred exits with 'to:' paths)
    await this.connectWorldExits();

    console.log('  ✅ Buildings built');
  }

  /**
   * Load buildings from TypeScript definition files
   */
  private async loadBuildings(): Promise<void> {
    const worldDir = path.join(
      process.cwd(),
      'src/database/bootstrap/world/seattle/pioneer-square/buildings'
    );

    if (!fs.existsSync(worldDir)) {
      return; // No buildings directory yet
    }

    // Each subdirectory is a building
    const buildingDirs = fs.readdirSync(worldDir).filter(f => {
      const fullPath = path.join(worldDir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    for (const buildingName of buildingDirs) {
      const buildingPath = path.join(worldDir, buildingName);
      await this.loadBuilding(buildingName, buildingPath);
    }
  }

  /**
   * Load a single building from its directory
   */
  private async loadBuilding(buildingName: string, buildingPath: string): Promise<void> {
    // Look for floor definition files (z0.ts, z1.ts, z2.ts, etc.)
    const files = fs.readdirSync(buildingPath).filter(f => f.match(/^z-?\d+\.ts$/));

    // Shared placeholder map (cross-floor), and deferred processors
    const sharedPlaceholders = new Map<string, RuntimeObject>();
    const postProcessors: Array<() => Promise<void>> = [];

    for (const file of files) {
      try {
        const filePath = path.join(buildingPath, file);
        const fileUrl = pathToFileURL(filePath).href;
        const module = await import(fileUrl);

        if (module.building) {
          const floorName = file.replace('.ts', '');
          await this.buildFloor(buildingName, floorName, module.building, sharedPlaceholders, postProcessors);
        }
      } catch (err) {
        console.warn(`    Warning: Could not load ${buildingName}/${file}: ${err}`);
      }
    }

    // Run any deferred processors now that all floors are loaded
    for (const fn of postProcessors) {
      await fn();
    }
  }

  /**
   * Build a floor from its definition
   */
  private async buildFloor(
    buildingName: string,
    floorName: string,
    definition: any,
    sharedPlaceholders: Map<string, RuntimeObject>,
    postProcessors: Array<() => Promise<void>>
  ): Promise<void> {
    const $ = this.manager as any;
    const objectManager = await this.manager.load(0);
    const recycler = $.recycler;
    const roomProto = $.room;
    const exitProto = $.exit;
    const elevatorProto = $.elevator;

    if (!definition.rooms || typeof definition.rooms !== 'object') {
      throw new Error(`Building ${buildingName}/${floorName}: missing rooms object`);
    }

    // First pass: create all rooms and map placeholders to room objects
    const placeholderToRoom = new Map<string, RuntimeObject>();

    for (const [placeholder, roomDef] of Object.entries(definition.rooms)) {
      if (!placeholder.startsWith('%')) {
        throw new Error(`Invalid placeholder ${placeholder}: must start with %`);
      }

      // Reuse shared placeholder if already created (cross-floor objects like elevators/doors/locks)
      if (sharedPlaceholders.has(placeholder)) {
        const existing = sharedPlaceholders.get(placeholder)!;
        placeholderToRoom.set(placeholder, existing);
        continue;
      }

      const def = roomDef as any;

      // Decide prototype (default room; allow elevator + arbitrary aliases)
      let parentProto = roomProto;
      if (def.prototype) {
        const protoName = def.prototype;
        const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};
        if (protoName === 'elevator' && elevatorProto) {
          parentProto = elevatorProto;
        } else if (aliases[protoName]) {
          // Load the prototype by ID from aliases
          const loaded = await this.manager.load(aliases[protoName]);
          if (loaded) {
            parentProto = loaded;
          } else {
            console.warn(`    Warning: could not load prototype '${protoName}' (ID ${aliases[protoName]}) for ${placeholder}, defaulting to room.`);
          }
        } else {
          console.warn(`    Warning: prototype alias '${protoName}' not found for ${placeholder}, defaulting to room.`);
        }
      }

      // Copy additional properties (excluding control fields)
      const extraProps = { ...def } as any;
      delete extraProps.exits;
      delete extraProps.methods;
      delete extraProps.prototype;
      delete extraProps.elevator;

      const room = await recycler.create({
        parent: parentProto.id ? parentProto.id : parentProto,
        properties: {
          name: def.name || 'Unnamed Room',
          description: def.description || 'An empty room.',
          x: def.x || 0,
          y: def.y || 0,
          z: def.z || 0,
          exits: [],
          population: def.population ?? 0,
          ambientNoise: def.ambientNoise ?? 5,
          lighting: def.lighting ?? 80,
          waterLevel: def.waterLevel ?? 0,
          outdoor: def.outdoor ?? false,
          ...extraProps,
        },
      });

      placeholderToRoom.set(placeholder, room);
      sharedPlaceholders.set(placeholder, room);
    }

    const resolvePlaceholder = (ph: string): RuntimeObject | undefined => {
      return placeholderToRoom.get(ph) || sharedPlaceholders.get(ph);
    };

    const resolveValue = (val: any) => {
      if (typeof val === 'string' && val.startsWith('%')) {
        const target = resolvePlaceholder(val);
        return target || val;
      }
      return val;
    };

    // Second pass: create exits based on connections
    let exitCount = 0;

    for (const [placeholder, roomDef] of Object.entries(definition.rooms)) {
      const def = roomDef as any;
      const sourceRoom = placeholderToRoom.get(placeholder) || resolvePlaceholder(placeholder);
      if (!sourceRoom) continue;

      if (!def.exits) continue;

      for (const [direction, exitDef] of Object.entries(def.exits)) {
        // Exit definition can be:
        // - Simple: '%1' (just a room placeholder)
        // - Complex: { room: '%1', locked: true, hidden: false, distance: 10 }
        // - World ref: { to: 'path/file.ts', description: '...' } - deferred until world rooms exist
        let destPlaceholder: string;
        let exitProps: any = {};

        if (typeof exitDef === 'string') {
          // Simple form
          destPlaceholder = exitDef;
        } else if (typeof exitDef === 'object' && exitDef !== null) {
          // Check for world reference (to: path.ts)
          if ((exitDef as any).to && typeof (exitDef as any).to === 'string') {
            // Defer this exit - will be resolved after all buildings are built
            this.deferredWorldExits.push({
              sourceRoom,
              direction,
              toPath: (exitDef as any).to,
              exitProps: exitDef,
              description: (exitDef as any).description,
            });
            continue;
          }
          // Complex form with room placeholder
          destPlaceholder = (exitDef as any).room;
          exitProps = exitDef;
        } else {
          console.warn(`    Invalid exit definition in ${placeholder}.${direction}`);
          continue;
        }

        const destRoom = resolvePlaceholder(destPlaceholder);
        if (!destRoom) {
          console.warn(`    Warning: Room ${placeholder} exit ${direction} references unknown room ${destPlaceholder}`);
          continue;
        }

        // Get standard aliases for direction
        const aliases = this.getDirectionAliases(direction);

        // Calculate distance if not specified
        const distance = exitProps.distance || this.calculateDistance(
          (sourceRoom.get('x') as number) || 0, (sourceRoom.get('y') as number) || 0, (sourceRoom.get('z') as number) || 0,
          (destRoom.get('x') as number) || 0, (destRoom.get('y') as number) || 0, (destRoom.get('z') as number) || 0
        );

        const doorResolved = resolveValue(exitProps.door);
        const locksResolved = Array.isArray(exitProps.locks)
          ? exitProps.locks.map((l: string | number) => resolveValue(l)).filter(Boolean)
          : undefined;

        // Create exit
        const exit = await recycler.create({
          parent: exitProto.id,
          properties: {
            name: direction,
            aliases: aliases,
            destRoom: destRoom,
            distance: distance,
            hidden: exitProps.hidden ?? false,
            locked: exitProps.locked ?? false,
            lockKey: exitProps.lockKey ?? null,
            door: doorResolved || undefined,
            locks: locksResolved || [],
            code: exitProps.code ?? undefined,
          },
        });

        // Add exit to source room
        await sourceRoom.call('addExit', exit);
        exitCount++;
      }
    }

    // Third pass: attach methods, resolve placeholders for special props, and elevator configs
    for (const [placeholder, roomDef] of Object.entries(definition.rooms)) {
      const def = roomDef as any;
      const room = placeholderToRoom.get(placeholder) || resolvePlaceholder(placeholder);
      if (!room) continue;

      // Resolve elevatorId if provided as placeholder
      if (typeof def.elevatorId === 'string' && def.elevatorId.startsWith('%')) {
        const targetPh = def.elevatorId;
        const apply = async () => {
          const target = resolvePlaceholder(targetPh);
          if (target) {
            room.set('elevatorId', target.id);
          }
        };
        postProcessors.push(apply);
      }

      // Attach custom methods
      if (def.methods && typeof def.methods === 'object') {
        for (const [methodName, body] of Object.entries(def.methods)) {
          if (typeof body === 'string') {
            room.setMethod(methodName, body);
          }
        }
      }

      // Resolve door/lock placeholders on rooms if present
      if (def.door) {
        const resolvedDoor = resolveValue(def.door);
        if (resolvedDoor && resolvedDoor.id) room.set('door', resolvedDoor.id);
        else if (resolvedDoor) room.set('door', resolvedDoor);
      }
      if (Array.isArray(def.locks)) {
        const resolvedLocks = def.locks.map((l: string | number) => resolveValue(l)).filter(Boolean).map((l: any) => (l.id ? l.id : l));
        room.set('locks', resolvedLocks);
      }

      // Elevator-specific config (only applied if object exists)
      if (def.elevator && typeof def.elevator === 'object') {
        const cfg = def.elevator;
        postProcessors.push(async () => {
          if (cfg.floors) room.set('floors', cfg.floors);
          if (cfg.currentFloor !== undefined) room.set('currentFloor', cfg.currentFloor);
          if (cfg.doorsOpen !== undefined) room.set('doorsOpen', cfg.doorsOpen);
          if (cfg.travelTimePerFloor !== undefined) room.set('travelTimePerFloor', cfg.travelTimePerFloor);
          if (cfg.capacity !== undefined) room.set('capacity', cfg.capacity);

          if (cfg.floorRooms && typeof cfg.floorRooms === 'object') {
            const mapped: Record<number, RuntimeObject> = {} as any;
            for (const [floor, ph] of Object.entries(cfg.floorRooms)) {
              if (typeof ph !== 'string') continue;
              const target = resolvePlaceholder(ph);
              if (target) {
                mapped[Number(floor)] = target;
              }
            }
            room.set('floorRooms', mapped);
          }
        });
      }

      // Spawn objects inside the room
      if (Array.isArray(def.objects)) {
        const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};
        for (const objDef of def.objects) {
          if (!objDef.prototype) {
            console.warn(`    Warning: object in ${placeholder} missing prototype, skipping`);
            continue;
          }

          const protoId = aliases[objDef.prototype];
          if (!protoId) {
            console.warn(`    Warning: prototype '${objDef.prototype}' not found for object in ${placeholder}`);
            continue;
          }

          // Extract properties (everything except 'prototype')
          const objProps = { ...objDef };
          delete objProps.prototype;

          // Create the object
          const obj = await recycler.create({
            parent: protoId,
            properties: objProps,
          });

          // Move object into the room
          obj.set('location', room.id);
          if (room.call) {
            await room.call('addContent', obj.id);
          } else {
            // Fallback: directly set contents
            const contents = room.get('contents') || [];
            if (Array.isArray(contents)) {
              contents.push(obj.id);
              room.set('contents', contents);
            }
          }
        }
      }
    }

    // Store building floor
    if (!this.buildings.has(buildingName)) {
      this.buildings.set(buildingName, new Map());
    }
    this.buildings.get(buildingName)!.set(floorName, placeholderToRoom.get('%0')!);

    console.log(`    Built ${buildingName}/${floorName}: ${placeholderToRoom.size} rooms, ${exitCount} exits`);
  }

  /**
   * Get standard aliases for a direction
   */
  private getDirectionAliases(direction: string): string[] {
    const aliasMap: Record<string, string[]> = {
      north: ['n'],
      south: ['s'],
      east: ['e'],
      west: ['w'],
      northeast: ['ne'],
      northwest: ['nw'],
      southeast: ['se'],
      southwest: ['sw'],
      up: ['u'],
      down: ['d', 'dn'],
      in: ['i'],
      out: ['o'],
    };
    return aliasMap[direction.toLowerCase()] || [];
  }

  /**
   * Calculate distance between coordinates (in meters)
   */
  private calculateDistance(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
    const dx = (x2 - x1) * 30; // 30m per grid unit horizontal
    const dy = (y2 - y1) * 30;
    const dz = (z2 - z1) * 3; // 3m per floor vertical
    return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
  }

  /**
   * Connect building rooms to world rooms via deferred exits
   * Resolves { to: 'path/file.ts' } references by finding world rooms by coordinates
   */
  private async connectWorldExits(): Promise<void> {
    if (this.deferredWorldExits.length === 0) {
      return;
    }

    const $ = this.manager as any;
    const recycler = $.recycler;
    const exitProto = $.exit;

    console.log(`    Connecting ${this.deferredWorldExits.length} building-to-world exits...`);

    let connectedCount = 0;

    for (const deferred of this.deferredWorldExits) {
      const { sourceRoom, direction, toPath, exitProps, description } = deferred;

      // Parse the path to extract coordinates
      // Format: "yesler-way/x-12.ts" or "1st-ave-s/y10.ts"
      const targetCoords = await this.parsePathToCoordinates(toPath);
      if (!targetCoords) {
        console.warn(`    Warning: Could not parse coordinates from path: ${toPath}`);
        continue;
      }

      // Find the world room by coordinates
      const worldRoom = await this.findRoomByCoordinates(targetCoords.x, targetCoords.y, targetCoords.z);
      if (!worldRoom) {
        console.warn(`    Warning: No world room found at (${targetCoords.x}, ${targetCoords.y}, ${targetCoords.z}) for path: ${toPath}`);
        continue;
      }

      // Calculate distance
      const distance = exitProps.distance || this.calculateDistance(
        (sourceRoom.get('x') as number) || 0,
        (sourceRoom.get('y') as number) || 0,
        (sourceRoom.get('z') as number) || 0,
        targetCoords.x,
        targetCoords.y,
        targetCoords.z
      );

      // Create exit from building room to world room
      const exitToWorld = await recycler.create({
        parent: exitProto.id,
        properties: {
          name: direction,
          aliases: this.getDirectionAliases(direction),
          destRoom: worldRoom.id,
          distance: distance,
          hidden: exitProps.hidden ?? false,
          locked: exitProps.locked ?? false,
          description: description,
        },
      });

      await sourceRoom.call('addExit', exitToWorld);

      // Create reverse exit from world room back to building room
      const reverseDirection = this.getOppositeDirection(direction);
      const exitToBuilding = await recycler.create({
        parent: exitProto.id,
        properties: {
          name: reverseDirection,
          aliases: this.getDirectionAliases(reverseDirection),
          destRoom: sourceRoom.id,
          distance: distance,
          hidden: exitProps.hidden ?? false,
          locked: exitProps.locked ?? false,
          description: description ? description.replace(/lead[s]? (\w+) to/, `lead $1 into`) : undefined,
        },
      });

      await worldRoom.call('addExit', exitToBuilding);

      connectedCount++;
    }

    console.log(`    Connected ${connectedCount} building-to-world exits`);
  }

  /**
   * Parse a file path to extract room coordinates
   * Examples: "yesler-way/x-12.ts" -> x=-12, y=12, z=0
   *           "1st-ave-s/y10.ts" -> x=-14, y=10, z=0
   */
  private async parsePathToCoordinates(toPath: string): Promise<{ x: number; y: number; z: number } | null> {
    // Try to load the file and get coordinates directly
    const worldDir = path.join(
      process.cwd(),
      'src/database/bootstrap/world/seattle/pioneer-square'
    );

    const filePath = path.join(worldDir, toPath);

    try {
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      const roomDef = module.room;

      if (roomDef && typeof roomDef.x === 'number' && typeof roomDef.y === 'number') {
        return {
          x: roomDef.x,
          y: roomDef.y,
          z: roomDef.z || 0,
        };
      }
    } catch (err) {
      console.warn(`    Warning: Could not load room file ${toPath}: ${err}`);
    }

    return null;
  }

  /**
   * Find a world room by its coordinates
   */
  private async findRoomByCoordinates(x: number, y: number, z: number): Promise<RuntimeObject | null> {
    // Find rooms with matching coordinates
    const rooms = await this.manager.findByProperty('x', x);

    for (const room of rooms) {
      if (room.get('y') === y && room.get('z') === z) {
        // Verify it's a world room (not a building room) by checking if it has outdoor or is named after a street
        const name = room.get('name') as string || '';
        const outdoor = room.get('outdoor') as boolean;

        // World rooms are typically streets/avenues and are outdoor
        if (outdoor || name.includes('Way') || name.includes('Ave') || name.includes('St')) {
          return room;
        }
      }
    }

    return null;
  }

  /**
   * Get the opposite direction for bidirectional exits
   */
  private getOppositeDirection(direction: string): string {
    const opposites: Record<string, string> = {
      north: 'south',
      south: 'north',
      east: 'west',
      west: 'east',
      northeast: 'southwest',
      northwest: 'southeast',
      southeast: 'northwest',
      southwest: 'northeast',
      up: 'down',
      down: 'up',
      in: 'out',
      out: 'in',
    };
    return opposites[direction.toLowerCase()] || direction;
  }

  /**
   * Get all buildings (for testing/debugging)
   */
  getBuildings(): Map<string, Map<string, RuntimeObject>> {
    return this.buildings;
  }
}
