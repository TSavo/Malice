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
 *       }
 *     },
 *     '%1': { ... },
 *   }
 * }
 *
 * This allows precise control over building interiors where not every adjacent
 * coordinate should be connected (walls exist).
 */
export class BuildingBuilder {
  private buildings: Map<string, Map<string, RuntimeObject>> = new Map();

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

      // Reuse shared placeholder if already created (cross-floor objects like elevators)
      if (sharedPlaceholders.has(placeholder)) {
        const existing = sharedPlaceholders.get(placeholder)!;
        placeholderToRoom.set(placeholder, existing);
        continue;
      }

      const def = roomDef as any;

      // Decide prototype (default room; allow elevator)
      let parentProto = roomProto;
      if (def.prototype === 'elevator') {
        if (elevatorProto) {
          parentProto = elevatorProto;
        } else {
          console.warn(`    Warning: elevator prototype not found for ${placeholder}, defaulting to room.`);
        }
      }

      // Copy additional properties (excluding control fields)
      const extraProps = { ...def } as any;
      delete extraProps.exits;
      delete extraProps.methods;
      delete extraProps.prototype;
      delete extraProps.elevator;

      const room = await recycler.create({
        parent: parentProto.id,
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
        let destPlaceholder: string;
        let exitProps: any = {};

        if (typeof exitDef === 'string') {
          // Simple form
          destPlaceholder = exitDef;
        } else if (typeof exitDef === 'object' && exitDef !== null) {
          // Complex form
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
          sourceRoom.get('x'), sourceRoom.get('y'), sourceRoom.get('z'),
          destRoom.get('x'), destRoom.get('y'), destRoom.get('z')
        );

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
   * Get all buildings (for testing/debugging)
   */
  getBuildings(): Map<string, Map<string, RuntimeObject>> {
    return this.buildings;
  }
}
