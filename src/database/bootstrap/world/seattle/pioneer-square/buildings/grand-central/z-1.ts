// Grand Central Arcade - Basement (z=-1)
// Original basement level from 1891, now accessed through the service area

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Lock',
      description:
        'A heavy iron padlock, its mechanism stiff with age but still functional.',
      difficulty: 5,
    },
    '%BASEMENT_HATCH': {
      prototype: 'door',
      name: 'Basement Hatch',
      description:
        'A heavy iron hatch set into the floor, its surface worn smooth by decades of foot traffic. A padlock secures the hasp.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'metal',
      durability: 80,
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_STAIRS': {
      name: 'Grand Central - Basement Stairs',
      description: `Iron stairs descend from the service area above into the building's original basement—the 1891 foundation level that predates the arcade's construction. The stairs are narrow, steep, built for utility rather than comfort. Gas light fixtures line the walls, their jets cold, their purpose ended decades before electricity made them obsolete.

The basement stretches beneath the entire arcade footprint, a maze of storage rooms, mechanical spaces, and forgotten passages. The air is cool and damp, the smell of old brick and older earth. Water stains on the walls mark the high points of floods that have come and gone.

The stairwell opens into a main corridor that runs the length of the building, rooms branching off to either side.`,
      x: -10,
      y: 4,
      z: -1,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts:%GC_SERVICE',
          description: 'Iron stairs lead up to the service area',
          door: '%BASEMENT_HATCH',
          locks: ['%BASEMENT_LOCK'],
        },
        west: '%MAIN_CORRIDOR',
        south: '%BOILER_ROOM',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'gas fixtures',
          aliases: ['fixtures', 'lights', 'jets'],
          description:
            'Brass gas light fixtures line the walls, their jets cold and empty. The fixtures are beautiful in their Victorian way—decorative ironwork holding glass globes that once glowed with burning gas. They became decorative when electricity arrived and stayed decorative as everything else failed.',
        },
      ],
    },

    '%MAIN_CORRIDOR': {
      name: 'Grand Central - Basement Corridor',
      description: `The main basement corridor runs east-west beneath the arcade above, roughly following the path of the ground-floor promenade. The ceiling is low—perhaps seven feet—supported by iron columns that mirror the Corinthian columns above. Down here, the columns are plain, functional, without pretense.

Doors line both sides of the corridor, most closed, some hanging open to reveal storage rooms beyond. The doors are heavy oak, their brass hardware tarnished, their locks long since surrendered. Whatever these rooms stored has been gone for decades.

Electrical conduit runs along the ceiling, a later addition that brought power to the basement spaces. The wiring is ancient, insulation cracked, a fire hazard that never quite caught fire.`,
      x: -11,
      y: 4,
      z: -1,
      population: 0,
      ambientNoise: 6,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%BASEMENT_STAIRS',
        west: '%STORAGE_WEST',
        south: '%CISTERN',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'iron columns',
          aliases: ['columns', 'supports'],
          description:
            'Iron columns support the basement ceiling at regular intervals, plain cylinders without the decorative capitals of their ground-floor counterparts. The columns are load-bearing, essential, doing their work without acknowledgment.',
        },
      ],
    },

    '%BOILER_ROOM': {
      name: 'Grand Central - Boiler Room',
      description: `The mechanical heart of the building, where steam heat was generated for the arcade and hotel above. The boiler is enormous—a cast iron beast that consumed coal and exhaled steam through a network of pipes that thread through the ceiling. The boiler is cold now, its firebox empty, its pressure gauges reading zero.

Coal bins line one wall, still holding the remnants of the last delivery—black dust and scattered lumps that will never burn. A coal chute leads up to the alley, its iron door rusted shut from above.

The floor is concrete, stained with decades of coal dust and oil. A drain in the center is clogged with debris, causing water to pool in the low spots. The room smells of rust and old industry.`,
      x: -10,
      y: 3,
      z: -1,
      population: 0,
      ambientNoise: 3,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%BASEMENT_STAIRS',
        west: '%CISTERN',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'cast iron boiler',
          aliases: ['boiler', 'furnace'],
          description:
            'A massive cast iron boiler, its riveted construction a monument to Victorian engineering. The firebox door hangs open, revealing decades of accumulated ash. Steam pipes radiate from the top like metal tentacles, disappearing into the ceiling above.',
        },
        {
          prototype: 'crate',
          name: 'coal bins',
          aliases: ['bins', 'coal'],
          description:
            'Wooden bins along the wall, still holding the remnants of coal that was never burned. The coal has degraded into dust and small chunks, useless for heating but evidence of how the building once stayed warm.',
        },
      ],
    },

    '%CISTERN': {
      name: 'Grand Central - Cistern Room',
      description: `A large chamber dominated by a brick cistern—a water storage tank from before municipal water reached this neighborhood. The cistern is circular, perhaps fifteen feet across, its walls rising to a domed ceiling that disappears into darkness. The tank is empty now, or nearly so—a few inches of dark water reflect whatever light reaches them.

The room served as water storage, fire suppression, and probably other purposes the city records don't acknowledge. Pipes lead from the cistern in multiple directions, some to the building above, others disappearing into the walls.

One pipe is larger than the others, a culvert of sorts that leads south into the underground. The passage is narrow but navigable—clearly used, the brick around its opening worn smooth by shoulders brushing past.`,
      x: -11,
      y: 3,
      z: -1,
      population: 0,
      ambientNoise: 8,
      lighting: 5,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%MAIN_CORRIDOR',
        east: '%BOILER_ROOM',
        west: '%STORAGE_WEST',
        south: {
          to: 'underground/upper-tunnels/x-11-y3.ts',
          description: 'A culvert leads into the underground passages',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'brick cistern',
          aliases: ['cistern', 'tank', 'reservoir'],
          description:
            'A circular brick cistern, its walls rising to a domed ceiling. The tank once held water for the building above—drinking water, fire suppression, whatever was needed. Now it holds only a few inches of dark water and the echoes of drops falling from somewhere above.',
        },
        {
          prototype: 'describable',
          name: 'culvert passage',
          aliases: ['culvert', 'passage', 'tunnel'],
          description:
            'A large pipe or culvert leads south from the cistern room, wide enough for a person to walk through hunched. The brick around the opening is worn smooth, polished by use. Cold air flows from the passage, carrying the smell of the underground.',
        },
      ],
    },

    '%STORAGE_WEST': {
      name: 'Grand Central - West Storage',
      description: `The western end of the basement, where the building meets its neighbor. Storage cages line the walls, their wire mesh doors hanging open, their contents long since removed. The cages are labeled with numbers that once corresponded to shop tenants above: 7, 12, 23, the taxonomy of commercial storage.

One cage still holds merchandise—crates of china marked SQUIRE & SONS, the dry goods store that operated above. The china is intact, protected by its crate, a treasure trove of Victorian dinnerware that no one has thought to claim.

The ceiling is lower here, the floor uneven. Water has pooled in the southwest corner, seeping through the wall from some unknown source. The pool never quite dries, never quite grows—just persists.`,
      x: -13,
      y: 3,
      z: -1,
      population: 0,
      ambientNoise: 4,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: '%CISTERN',
        north: '%MAIN_CORRIDOR',
      },
      objects: [
        {
          prototype: 'locker',
          name: 'storage cages',
          aliases: ['cages', 'storage', 'lockers'],
          description:
            'Wire mesh storage cages, the kind used by tenants for overflow inventory. Most are empty, their doors hanging open. Numbers painted on the mesh—7, 12, 23—identify which shops rented which spaces. The shops are gone. The cages remain.',
        },
        {
          prototype: 'crate',
          name: 'china crates',
          aliases: ['crates', 'china', 'merchandise'],
          description:
            'Wooden crates marked SQUIRE & SONS DRY GOODS, their contents protected by straw packing. Inside, Victorian-era china waits in perfect condition—plates, cups, saucers in delicate patterns. The dry goods store closed decades ago. The china never sold. It waits still.',
        },
      ],
    },
  },
};
