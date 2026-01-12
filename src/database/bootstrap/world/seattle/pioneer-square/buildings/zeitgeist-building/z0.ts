// Zeitgeist Building - Ground Floor (z=0)
// Art gallery and coffee shop in a converted warehouse

export const building = {
  name: 'Zeitgeist Building',
  x: -13,
  y: 1,
  width: 3,
  height: 3,
  floors: 5,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%STAFF_LOCK': {
      prototype: 'biometricLock',
      name: 'Staff Door Scanner',
      description:
        'A small keypad beside a metal door, the numbers worn smooth.',
      scanners: [
        { type: 'fingerprint', part: 'hand', message: 'Staff access only.' },
      ],
      authorizedUsers: {},
    },

    '%SERVICE_LOCK': {
      prototype: 'biometricLock',
      name: 'Service Entrance Scanner',
      description: 'A weathered keypad beside the loading door.',
      scanners: [
        {
          type: 'fingerprint',
          part: 'hand',
          message: 'Authorized personnel only.',
        },
      ],
      authorizedUsers: {},
    },

    // ═══════════════════════════════════════════════════════════════════
    // DOORS
    // ═══════════════════════════════════════════════════════════════════

    '%STAFF_DOOR': {
      prototype: 'door',
      name: 'Staff Door',
      description: 'A metal door marked STAFF ONLY in stenciled letters.',
      locked: true,
      open: false,
      locks: ['%STAFF_LOCK'],
    },

    '%SERVICE_DOOR': {
      prototype: 'door',
      name: 'Service Entrance',
      description: 'A heavy loading door with industrial hardware.',
      locked: true,
      open: false,
      locks: ['%SERVICE_LOCK'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR
    // ═══════════════════════════════════════════════════════════════════

    '%E': {
      prototype: 'elevator',
      name: 'Zeitgeist Building - Freight Elevator',
      description: `A converted freight elevator, the kind that once hauled goods between warehouse floors. The cage is iron mesh, the controls a brass lever with positions marked by hand-painted numbers. It groans when moving, settling into each floor with a definitive clunk.

The walls show decades of graffiti—band stickers, art show flyers, declarations of love and rebellion layered over each other like archaeological strata. Someone painted GOING UP? on the ceiling in dripping red letters.

A small sign reads: CAPACITY 8 PERSONS OR 1500 LBS. The elevator has opinions about both.`,
      x: -12,
      y: 1,
      z: 0,
      exits: {
        out: '%LOBBY',
      },
      elevator: {
        floors: [0, 1, 2, 3, 4],
        currentFloor: 0,
        doorsOpen: true,
        floorRooms: {
          0: '%LOBBY',
          1: '%GALLERY_LOBBY',
          2: '%STUDIO_LOBBY',
          3: '%LOFT_LOBBY',
          4: '%ROOF_ACCESS',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0)
    // ═══════════════════════════════════════════════════════════════════

    '%LOBBY': {
      name: 'Zeitgeist Building - Lobby',
      description: `The building's lobby is a study in contrasts—exposed brick walls from 1892 meeting a coffee bar installed sometime in the 2010s. The original freight loading doors, now sealed, are visible as architectural fossils beneath coats of paint. The ceiling is pressed tin, painted white, showing rust stains where the roof leaked for decades.

A freight elevator occupies the south wall, its iron cage gate standing open. A staircase winds upward beside it, industrial iron steps with a railing that's more decorative than functional. The stairs are marked: GALLERY ACCESS - MIND THE STEPS.

The smell is espresso and old wood and that particular mustiness of buildings that have survived too long to give up now. Light enters through tall windows facing First Avenue, the glass old enough to have ripples.`,
      x: -12,
      y: 1,
      z: 0,
      population: 0,
      ambientNoise: 10,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: '1st-ave-s/y1.ts',
          description: 'Glass doors lead west to 1st Ave S',
        },
        north: '%COFFEE',
        southwest: '%STORAGE',
        up: '%GALLERY_LOBBY',
        in: '%E',
      },
      sittables: [
        {
          name: 'a worn leather bench',
          capacity: 3,
          emptyMsg:
            'A leather bench sits against the wall, its cushions shaped by countless visitors.',
          occupiedMsg: '%s waiting on the lobby bench',
        },
      ],
    },

    '%COFFEE': {
      name: 'Zeitgeist - Coffee Bar',
      description: `The coffee shop occupies what was once the building's main office. The original tin ceiling remains, pressed into elaborate floral patterns now painted matte black. Mismatched furniture fills the space—church pews repurposed as seating, industrial spools serving as tables, chairs that look rescued from a dozen different estate sales.

The bar itself is a slab of reclaimed wood on steel pipe legs, the espresso machine a chrome Italian beast that looks like it belongs on a submarine. Behind it, the chalk menu board lists drinks with names like "The Manifesto" and "Deconstructed Americano" and "Just Coffee, Please."

Art hangs on every wall—photographs, paintings, prints—all for sale, price tags dangling from frames. This is the gallery's retail arm, the place where impulse purchases happen over lattes. The smell is fresh-roasted beans and steamed milk and the ghost of countless creative conversations.`,
      x: -12,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 15,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%LOBBY',
        north: {
          room: '%KITCHEN',
          door: '%STAFF_DOOR',
          locks: ['%STAFF_LOCK'],
        },
      },
      sittables: [
        {
          name: 'a church pew',
          capacity: 4,
          emptyMsg: 'A repurposed church pew offers seating along the window.',
          occupiedMsg: '%s sitting in the church pew',
        },
        {
          name: 'a spool table seat',
          capacity: 2,
          emptyMsg:
            'Stools surround an industrial spool repurposed as a table.',
          occupiedMsg: '%s at the spool table',
        },
        {
          name: 'bar stools',
          capacity: 4,
          emptyMsg: 'Metal stools line the coffee bar.',
          occupiedMsg: '%s perched at the coffee bar',
        },
        {
          name: 'a wingback chair',
          capacity: 1,
          emptyMsg:
            'A threadbare wingback chair occupies the corner, its velvet worn thin.',
          occupiedMsg: '%s ensconced in the wingback chair',
        },
      ],
      objects: [
        {
          prototype: 'sign',
          name: 'chalk menu board',
          description: `A large chalkboard behind the counter, the menu handwritten in colors that change weekly:

THE MANIFESTO.............$4
  (Double shot, steamed oat milk, righteous indignation)
DECONSTRUCTED AMERICANO...$5
  (We give you the parts. You make meaning.)
JUST COFFEE, PLEASE.......$3
  (We won't judge. Much.)
ZEITGEIST SPECIAL.........$6
  (Ask. We'll decide if you're ready.)

CASH OR TRADE. NO CRYPTO. NO EXCEPTIONS.`,
        },
      ],
    },

    '%KITCHEN': {
      name: 'Zeitgeist - Kitchen',
      description: `The back of house for the coffee operation—a narrow galley kitchen crammed with industrial appliances. Coffee roaster dominates one wall, its drum still holding the acrid-sweet smell of its last batch. Sacks of beans stack in corners, their origins marked in hand-scrawled Sharpie: ETHIOPIA YIRGACHEFFE, GUATEMALA ANTIGUA, LOCAL BLEND (???).

Shelving holds supplies—cups, lids, straws, napkins, all the disposable detritus of café culture. A small prep area has cutting boards and knives for the simple food menu: pastries from somewhere, sandwiches from somewhere else.

A time clock on the wall has punch cards still in their slots. The last punches are from dates before The Burning. No one clocks in anymore.`,
      x: -12,
      y: 3,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: { room: '%COFFEE', door: '%STAFF_DOOR', locks: ['%STAFF_LOCK'] },
        southwest: {
          room: '%STORAGE',
          door: '%SERVICE_DOOR',
          locks: ['%SERVICE_LOCK'],
        },
      },
    },

    '%STORAGE': {
      name: 'Zeitgeist Building - Storage',
      description: `A ground-floor storage area that serves the entire building. The space is divided by industrial shelving—wire racks holding boxes of gallery supplies, old frames, packing materials. One section is clearly art storage: wrapped canvases lean against walls, sculptures shrouded in moving blankets wait for exhibition.

A sealed loading dock door shows where deliveries once arrived. The chain hoist above it is rusted in place, the door itself bolted shut from the inside—someone decided to secure this entrance when security started to matter more than convenience.

The air is cool and dry, climate-controlled even now—someone understood that art needs protecting from Seattle's humidity. A trapdoor in the floor leads to the basement storage below.`,
      x: -13,
      y: 1,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LOBBY',
        north: {
          room: '%KITCHEN',
          door: '%SERVICE_DOOR',
          locks: ['%SERVICE_LOCK'],
          distance: 30,
        },
        down: {
          to: 'z-1.ts#%ART_STORAGE',
          description: 'A trapdoor leads down to basement storage',
          door: 'z-1.ts#%BASEMENT_DOOR',
          locks: ['z-1.ts#%BASEMENT_LOCK'],
        },
      },
    },
  },

  postProcessors: [],
};
