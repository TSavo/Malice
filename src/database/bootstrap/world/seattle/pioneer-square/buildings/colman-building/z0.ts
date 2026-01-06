// Colman Building - Ground Floor (z=0)
// Historic 1889 Romanesque Revival commercial building
// Ground floor: Lobby and retail spaces

export const building = {
  rooms: {
    '%E': {
      // Elevator Car (shared across floors)
      prototype: 'elevator',
      name: 'Colman Building - Ground Floor - Elevator Car',
      description: `A compact elevator car with brass fittings and frosted glass panels. The control panel displays floor numbers in elegant serif font. The car smells of aged brass polish and recirculated air.`,
      x: -12,
      y: -2,
      z: 0,
      exits: {
        out: '%LOBBY',
      },
      elevator: {
        floors: [-1, 0, 1, 2, 3],
        currentFloor: 0,
        doorsOpen: true,
        floorRooms: {
          '-1': 'z-1.ts#%MAIN_AREA',
          '0': '%LOBBY',
          '1': '%F1_LOBBY',
          '2': '%F2_LOBBY',
          '3': '%F3_LOBBY',
        },
        locks: ['%LOCK_RESIDENTIAL'],
      },
    },

    '%LOCK_RESIDENTIAL': {
      // Residential access lock for upper floors
      prototype: 'biometricLock',
      name: 'Colman Building - Residential Access Scanner',
      description:
        'A recessed palm scanner beside the elevator, its indicator glowing soft blue.',
      scanners: [
        { type: 'palm', part: 'hand', message: 'Residential access denied.' },
      ],
      authorizedUsers: {
        1: [],
        2: [],
        3: [],
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR: Lobby and Retail Spaces
    // ═══════════════════════════════════════════════════════════════════

    '%LOBBY': {
      name: 'Colman Building - Ground Floor - Main Lobby',
      description: `The grand lobby of the historic Colman Building, its Romanesque Revival architecture preserved but showing signs of age. Terra cotta arches frame the entrance, and brass fixtures gleam dully. A directory board lists tenants, most entries blank or marked VACANT. The air smells of aged stone and faint mildew.`,
      x: -12,
      y: -2,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%NORTH_CORRIDOR',
        south: '%SOUTH_CORRIDOR',
        east: '%EAST_OFFICE',
        west: '%WEST_RETAIL',
        in: '%E',
        out: {
          to: '1st-ave-s/y-2.ts',
          description: 'Glass doors open onto 1st Ave',
        },
      },
      elevatorId: '%E',
      objects: [
        {
          prototype: 'sign',
          name: 'Building Directory',
          description:
            'A brass plaque listing building tenants, most entries blank or showing VACANT.',
          content: `COLMAN BUILDING - EST. 1889

GROUND FLOOR:
- Main Lobby
- West Retail Space: VACANT
- East Office: VACANT

UPPER FLOORS:
- Floor 1: Residential Units
- Floor 2: Residential Units
- Floor 3: Residential Units

Building systems maintained by Continuum Property Management.
For leasing information, contact Employment Terminal.`,
        },
      ],
    },

    '%NORTH_CORRIDOR': {
      name: 'Colman Building - Ground Floor - North Corridor',
      description: `A narrow corridor with arched doorways and worn marble floors. The walls are covered in faded wallpaper with gilt patterns, peeling at the edges. Overhead, brass light fixtures cast warm but dim illumination.`,
      x: -12,
      y: -1,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%LOBBY',
        east: '%NE_CORNER',
      },
    },

    '%SOUTH_CORRIDOR': {
      name: 'Colman Building - Ground Floor - South Corridor',
      description: `A service corridor with exposed brick walls and concrete floors. Utility pipes run along the ceiling, and a maintenance panel is bolted to one wall. The air is cooler here, carrying the scent of basement dampness. A staircase descends to the basement.`,
      x: -12,
      y: -3,
      z: 0,
      population: 0,
      ambientNoise: 4,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LOBBY',
        east: '%SE_CORNER',
        down: {
          to: 'z-1.ts#%MAIN_AREA',
          description: 'A staircase leads down to the basement',
        },
      },
    },

    '%WEST_RETAIL': {
      name: 'Colman Building - Ground Floor - West Retail Space',
      description: `An empty retail space with large display windows facing 1st Ave. The interior is stripped bare - just exposed brick walls, concrete floors, and dangling electrical conduits. A FOR LEASE sign hangs in the window, its edges curled with age.`,
      x: -13,
      y: -2,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LOBBY',
      },
    },

    '%EAST_OFFICE': {
      name: 'Colman Building - Ground Floor - East Office',
      description: `A small office space with built-in wooden cabinets and a large desk. The furniture is covered in dust, and cobwebs drape the corners. A terminal sits on the desk, its screen displaying: OFFICE SYSTEMS OFFLINE.`,
      x: -11,
      y: -2,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LOBBY',
      },
    },

    '%NE_CORNER': {
      name: 'Colman Building - Ground Floor - Northeast Corner',
      description: `A small utility room with cleaning supplies and maintenance equipment. Mops lean against the wall, and a utility sink shows signs of recent use. The window looks out on the alley, offering a view of brick walls and fire escapes.`,
      x: -11,
      y: -1,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%NORTH_CORRIDOR',
        south: '%EAST_OFFICE',
      },
    },

    '%SE_CORNER': {
      name: 'Colman Building - Ground Floor - Southeast Corner',
      description: `A storage room filled with empty boxes and discarded office supplies. The air is thick with dust, and water stains mark the ceiling where a leak has long since been repaired. A single bare bulb hangs from a cord.`,
      x: -11,
      y: -3,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%SOUTH_CORRIDOR',
        north: '%EAST_OFFICE',
      },
    },
  },
};
