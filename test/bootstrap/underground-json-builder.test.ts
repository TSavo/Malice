/**
 * Tests for UndergroundJsonBuilder
 */

import * as fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UndergroundJsonBuilder } from '../../src/database/bootstrap/underground-json-builder.js';
import type { ObjectManager } from '../../src/database/object-manager.js';
import type { RuntimeObject } from '../../types/object.js';

// Mock fs module
vi.mock('node:fs');

describe('UndergroundJsonBuilder', () => {
  let builder: UndergroundJsonBuilder;
  let mockManager: any;
  let mockSpatial: any;
  let mockRecycler: any;
  let mockRoom: any;
  let mockExit: any;
  let mockGuardedExit: any;
  let createdRooms: Map<string, RuntimeObject>;
  let createdExits: RuntimeObject[];

  beforeEach(() => {
    // Reset mocks
    createdRooms = new Map();
    createdExits = [];

    // Mock room prototype
    mockRoom = {
      id: 1,
      get: vi.fn((prop) => {
        if (prop === 'name') return 'Room Prototype';
        return undefined;
      }),
    };

    // Mock exit prototypes
    mockExit = {
      id: 2,
      get: vi.fn((prop) => {
        if (prop === 'name') return 'Exit Prototype';
        return undefined;
      }),
    };

    mockGuardedExit = {
      id: 3,
      get: vi.fn((prop) => {
        if (prop === 'name') return 'Guarded Exit Prototype';
        return undefined;
      }),
    };

    // Mock recycler
    mockRecycler = {
      create: vi.fn(async ({ parent, properties }: any) => {
        const isExit = parent === mockExit || parent === mockGuardedExit;
        const id = isExit ? createdExits.length + 100 : createdRooms.size + 10;

        const room: any = {
          id,
          properties: { ...properties },
          get: vi.fn((prop: string) => properties[prop]),
          set: vi.fn((prop: string, value: any) => {
            properties[prop] = value;
          }),
          call: vi.fn(async (method: string, ...args: any[]) => {
            if (method === 'addExit') {
              const exit = args[0];
              const exits = properties.exits || [];
              exits.push(exit);
              properties.exits = exits;
            }
          }),
        };

        if (isExit) {
          createdExits.push(room);
        } else if (properties.x !== undefined) {
          const key = `${properties.x},${properties.y},${properties.z}`;
          createdRooms.set(key, room);
        }

        return room;
      }),
    };

    // Mock spatial index
    mockSpatial = {
      getRoomDataAt: vi.fn(async (x: number, y: number, z: number) => {
        const key = `${x},${y},${z}`;
        return createdRooms.get(key);
      }),
      rebuild: vi.fn(async () => {}),
    };

    // Mock ObjectManager
    mockManager = {
      room: mockRoom,
      exit: mockExit,
      guardedExit: mockGuardedExit,
      recycler: mockRecycler,
      spatial: mockSpatial,
    } as any;

    builder = new UndergroundJsonBuilder(mockManager as ObjectManager);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Static properties', () => {
    it('should declare provides', () => {
      expect(UndergroundJsonBuilder.provides).toEqual(['undergroundRooms']);
    });

    it('should declare dependencies', () => {
      expect(UndergroundJsonBuilder.depends).toContain('room');
      expect(UndergroundJsonBuilder.depends).toContain('exit');
      expect(UndergroundJsonBuilder.depends).toContain('guardedExit');
      expect(UndergroundJsonBuilder.depends).toContain('recycler');
      expect(UndergroundJsonBuilder.depends).toContain('spatial');
      expect(UndergroundJsonBuilder.depends).toContain('buildings');
      expect(UndergroundJsonBuilder.depends).toContain('basements');
    });
  });

  describe('build()', () => {
    it('should skip if already built', async () => {
      // Create a room with underground flag
      const existingRoom = await mockRecycler.create({
        parent: mockRoom,
        properties: { x: -15, y: 4, z: -2, underground: true },
      });
      createdRooms.set('-15,4,-2', existingRoom);

      await builder.build();

      // Should not create any new rooms
      expect(createdRooms.size).toBe(1);
    });

    it('should throw if required dependencies missing', async () => {
      mockManager.room = null;

      await expect(builder.build()).rejects.toThrow(
        'Room, Exit, Recycler, and Spatial must exist',
      );
    });

    it('should skip if JSON file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await builder.build();

      expect(mockRecycler.create).not.toHaveBeenCalled();
    });

    it('should load and create rooms from JSON', async () => {
      const mockJson = {
        rooms: [
          {
            id: 'room-1',
            pos: { x: -15, y: 4, z: -2 },
            roomType: 'corridor',
            topology: 'linear',
            era: 'victorian',
            condition: 'deteriorated',
            atmosphere: 'dank',
            exits: { north: true, south: true, east: false, west: false },
            exitCount: 2,
            depth: 2,
            features: ['exposed brick', 'water damage'],
            nearWater: false,
            nearSurface: true,
            isDeep: false,
            neighborTypes: ['corridor', 'junction'],
            description: 'A deteriorated Victorian passage.',
          },
          {
            id: 'room-2',
            pos: { x: -15, y: 5, z: -2 },
            roomType: 'junction',
            topology: 'cross',
            era: 'modern',
            condition: 'maintained',
            atmosphere: 'sterile',
            exits: { north: true, south: true, east: true, west: true },
            exitCount: 4,
            depth: 2,
            features: ['lighting', 'clean'],
            nearWater: false,
            nearSurface: true,
            isDeep: false,
            neighborTypes: ['corridor'],
            description: 'A modern junction.',
          },
        ],
        meta: {
          generated: '2024-01-01',
          roomCount: 2,
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJson));

      await builder.build();

      // Should create 2 rooms
      expect(mockRecycler.create).toHaveBeenCalledTimes(4); // 2 rooms + 2 exits
      expect(createdRooms.size).toBe(2);

      // Check room properties
      const room1 = createdRooms.get('-15,4,-2');
      expect(room1).toBeDefined();
      expect(room1?.get('name')).toBe('Victorian Passage');
      expect(room1?.get('description')).toBe(
        'A deteriorated Victorian passage.',
      );
      expect(room1?.get('underground')).toBe(true);
      expect(room1?.get('undergroundEra')).toBe('victorian');
      expect(room1?.get('outdoor')).toBe(false);

      const room2 = createdRooms.get('-15,5,-2');
      expect(room2).toBeDefined();
      expect(room2?.get('name')).toBe('Modern Junction');
    });

    it('should connect adjacent rooms with exits', async () => {
      const mockJson = {
        rooms: [
          {
            id: 'room-1',
            pos: { x: 0, y: 0, z: -2 },
            roomType: 'corridor',
            topology: 'linear',
            era: 'victorian',
            condition: 'good',
            atmosphere: 'musty',
            exits: { north: true, south: false, east: false, west: false },
            exitCount: 1,
            depth: 2,
            features: [],
            nearWater: false,
            nearSurface: false,
            isDeep: false,
            neighborTypes: [],
            description: 'Room 1',
          },
          {
            id: 'room-2',
            pos: { x: 0, y: 1, z: -2 },
            roomType: 'corridor',
            topology: 'linear',
            era: 'victorian',
            condition: 'good',
            atmosphere: 'musty',
            exits: { north: false, south: true, east: false, west: false },
            exitCount: 1,
            depth: 2,
            features: [],
            nearWater: false,
            nearSurface: false,
            isDeep: false,
            neighborTypes: [],
            description: 'Room 2',
          },
        ],
        meta: { generated: '2024-01-01', roomCount: 2 },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJson));

      await builder.build();

      // Should create bidirectional exits between the rooms
      const room1 = createdRooms.get('0,0,-2');
      const room2 = createdRooms.get('0,1,-2');

      expect(room1).toBeDefined();
      expect(room2).toBeDefined();

      // Check that exits were created
      expect(createdExits.length).toBeGreaterThan(0);

      // Should have called spatial.rebuild()
      expect(mockSpatial.rebuild).toHaveBeenCalled();
    });

    it('should honor JSON exit flags and not create blocked exits', async () => {
      const mockJson = {
        rooms: [
          {
            id: 'room-1',
            pos: { x: 0, y: 0, z: -2 },
            roomType: 'dead_end',
            topology: 'dead_end',
            era: 'victorian',
            condition: 'blocked',
            atmosphere: 'musty',
            exits: { north: false, south: false, east: false, west: false }, // All blocked
            exitCount: 0,
            depth: 2,
            features: ['collapsed wall'],
            nearWater: false,
            nearSurface: false,
            isDeep: false,
            neighborTypes: [],
            description: 'A dead end with collapsed walls.',
          },
          {
            id: 'room-2',
            pos: { x: 0, y: 1, z: -2 },
            roomType: 'corridor',
            topology: 'linear',
            era: 'victorian',
            condition: 'good',
            atmosphere: 'musty',
            exits: { north: true, south: false, east: false, west: false }, // South blocked (toward room-1)
            exitCount: 1,
            depth: 2,
            features: [],
            nearWater: false,
            nearSurface: false,
            isDeep: false,
            neighborTypes: [],
            description: 'A corridor.',
          },
        ],
        meta: { generated: '2024-01-01', roomCount: 2 },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJson));

      await builder.build();

      // Should not create any exits between the rooms (both sides blocked)
      const exitsToRoom1 = createdExits.filter(
        (e) => e.get('destRoom')?.id === createdRooms.get('0,0,-2')?.id,
      );
      const exitsToRoom2 = createdExits.filter(
        (e) => e.get('destRoom')?.id === createdRooms.get('0,1,-2')?.id,
      );

      expect(exitsToRoom1.length).toBe(0);
      expect(exitsToRoom2.length).toBe(0);
    });

    it('should create guarded exits to Sister Gray domain', async () => {
      const mockJson = {
        rooms: [
          {
            id: 'normal-room',
            pos: { x: -14, y: 5, z: -3 }, // Directly above the secured room
            roomType: 'corridor',
            topology: 'linear',
            era: 'modern',
            condition: 'good',
            atmosphere: 'neutral',
            exits: {
              north: true,
              south: true,
              east: false,
              west: false,
              down: true,
            },
            exitCount: 3,
            depth: 3,
            features: [],
            nearWater: false,
            nearSurface: false,
            isDeep: false,
            neighborTypes: [],
            description: 'A corridor above the junction.',
          },
          {
            id: 'secured-room',
            pos: { x: -14, y: 5, z: -4 }, // Lower Junction - Sister Gray territory
            roomType: 'junction',
            topology: 'hub',
            era: 'modern',
            condition: 'secured',
            atmosphere: 'guarded',
            exits: {
              north: true,
              south: true,
              east: true,
              west: true,
              up: true,
            },
            exitCount: 5,
            depth: 4,
            features: ['guards', 'cameras'],
            nearWater: false,
            nearSurface: false,
            isDeep: true,
            neighborTypes: [],
            description: 'The Lower Junction. Heavily guarded.',
          },
        ],
        meta: { generated: '2024-01-01', roomCount: 2 },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJson));

      await builder.build();

      // Find exit going DOWN INTO the secured room
      const guardedExit = createdExits.find(
        (e) =>
          e.get('destRoom')?.id === createdRooms.get('-14,5,-4')?.id &&
          e.get('name') === 'down',
      );

      // Should use guardedExit prototype and have faction properties
      expect(guardedExit).toBeDefined();
      expect(guardedExit?.get('allowedFaction')).toBe('cartel');
      expect(guardedExit?.get('denyMessage')).toContain('Cartel territory');
    });

    it('should connect to building basements at z=-1', async () => {
      // Create a building basement room at z=-1
      const basementRoom = await mockRecycler.create({
        parent: mockRoom,
        properties: {
          name: 'Building Basement',
          x: 0,
          y: 0,
          z: -1,
          outdoor: false,
        },
      });

      const mockJson = {
        rooms: [
          {
            id: 'underground-room',
            pos: { x: 0, y: 0, z: -2 },
            roomType: 'corridor',
            topology: 'linear',
            era: 'victorian',
            condition: 'good',
            atmosphere: 'dank',
            exits: {
              north: true,
              south: true,
              east: true,
              west: true,
              up: true,
            },
            exitCount: 5,
            depth: 2,
            features: [],
            nearWater: false,
            nearSurface: true,
            isDeep: false,
            neighborTypes: [],
            description: 'An underground passage.',
          },
        ],
        meta: { generated: '2024-01-01', roomCount: 1 },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJson));

      await builder.build();

      // Should create bidirectional exits between underground and basement
      const exitToBasement = createdExits.find(
        (e) =>
          e.get('destRoom')?.id === basementRoom.id && e.get('name') === 'up',
      );
      const exitToUnderground = createdExits.find(
        (e) =>
          e.get('destRoom')?.id === createdRooms.get('0,0,-2')?.id &&
          e.get('name') === 'down',
      );

      expect(exitToBasement).toBeDefined();
      expect(exitToUnderground).toBeDefined();
    });

    it('should skip existing rooms and reuse them', async () => {
      // Pre-create a room at the same coordinates (from building-builder)
      const _existingRoom = await mockRecycler.create({
        parent: mockRoom,
        properties: {
          name: 'Existing Basement Room',
          x: 0,
          y: 0,
          z: -2,
          outdoor: false,
        },
      });

      const mockJson = {
        rooms: [
          {
            id: 'duplicate-room',
            pos: { x: 0, y: 0, z: -2 },
            roomType: 'corridor',
            topology: 'linear',
            era: 'victorian',
            condition: 'good',
            atmosphere: 'musty',
            exits: { north: true, south: false, east: false, west: false },
            exitCount: 1,
            depth: 2,
            features: [],
            nearWater: false,
            nearSurface: false,
            isDeep: false,
            neighborTypes: [],
            description: 'Should not be created.',
          },
        ],
        meta: { generated: '2024-01-01', roomCount: 1 },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJson));

      const createCallsBefore = mockRecycler.create.mock.calls.length;
      await builder.build();
      const createCallsAfter = mockRecycler.create.mock.calls.length;

      // Should not create a new room (only reuse existing)
      const roomCreateCalls = createCallsAfter - createCallsBefore;
      expect(roomCreateCalls).toBe(0); // No new rooms created
      expect(createdRooms.get('0,0,-2')?.get('name')).toBe(
        'Existing Basement Room',
      );
    });
  });

  describe('Room name generation', () => {
    it('should generate proper room names from era and type', async () => {
      const mockJson = {
        rooms: [
          {
            id: 'r1',
            pos: { x: 0, y: 0, z: -2 },
            roomType: 'corridor',
            era: 'victorian',
            condition: 'good',
            atmosphere: 'musty',
            topology: 'linear',
            exits: {},
            exitCount: 0,
            depth: 2,
            features: [],
            nearWater: false,
            nearSurface: false,
            isDeep: false,
            neighborTypes: [],
            description: 'Victorian corridor',
          },
          {
            id: 'r2',
            pos: { x: 0, y: 1, z: -3 },
            roomType: 'junction',
            era: 'industrial',
            condition: 'good',
            atmosphere: 'musty',
            topology: 'cross',
            exits: {},
            exitCount: 0,
            depth: 3,
            features: [],
            nearWater: false,
            nearSurface: false,
            isDeep: false,
            neighborTypes: [],
            description: 'Industrial junction',
          },
          {
            id: 'r3',
            pos: { x: 0, y: 2, z: -5 },
            roomType: 'chamber',
            era: 'ancient',
            condition: 'good',
            atmosphere: 'musty',
            topology: 'hub',
            exits: {},
            exitCount: 0,
            depth: 5,
            features: [],
            nearWater: false,
            nearSurface: false,
            isDeep: true,
            neighborTypes: [],
            description: 'Ancient chamber',
          },
        ],
        meta: { generated: '2024-01-01', roomCount: 3 },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockJson));

      await builder.build();

      expect(createdRooms.get('0,0,-2')?.get('name')).toBe('Victorian Passage');
      expect(createdRooms.get('0,1,-3')?.get('name')).toBe(
        'Industrial Junction',
      );
      expect(createdRooms.get('0,2,-5')?.get('name')).toBe('Ancient Chamber');
    });
  });

  describe('registerAliases()', () => {
    it('should not register any aliases', async () => {
      await builder.registerAliases();
      // No-op method - just verify it doesn't throw
      expect(true).toBe(true);
    });
  });
});
