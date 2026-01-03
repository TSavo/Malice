// Pioneer Building - Ground Floor (z=0)
// Richardsonian Romanesque landmark, Elmer Fisher 1892
// The anchor of Pioneer Square, survived the Great Fire, earthquakes, and the Event

export const building = {
  name: 'Pioneer Building',
  x: 1,
  y: 8,
  width: 4,
  height: 3,
  floors: 7,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN_LOCK': {
      prototype: 'lock',
      name: 'Pioneer Building Main Lock',
      description:
        'A massive brass mortise lock, the original 1892 hardware restored and maintained for over a century.',
      difficulty: 6,
    },
    '%MAIN_DOOR': {
      prototype: 'door',
      name: 'Triple-Arched Portal',
      description:
        'The main entrance to the Pioneer Building—three arched doorways of carved sandstone in the Richardsonian Romanesque style. The doors themselves are heavy oak, darkened by age, their brass hardware worn smooth by a century of hands.',
      locked: false,
      open: true,
      locks: ['%MAIN_LOCK'],
      material: 'wood',
      durability: 90,
    },

    '%ARCADE_LOCK': {
      prototype: 'lock',
      name: 'Arcade Gate Lock',
      description:
        'A simple padlock securing the accordion gate that closes off the arcade at night.',
      difficulty: 3,
    },

    '%SERVICE_LOCK': {
      prototype: 'biometricLock',
      name: 'Service Door Scanner',
      description:
        'A fingerprint scanner beside the service entrance, newer than the building around it.',
      scanners: [
        { type: 'fingerprint', part: 'hand', message: 'Staff access only.' },
      ],
      authorizedUsers: {},
    },

    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR
    // ═══════════════════════════════════════════════════════════════════

    '%E': {
      prototype: 'elevator',
      name: 'Pioneer Building - Elevator',
      description: `A vintage elevator car with brass accordion gates and a floor indicator dial—the kind that used to require an operator. The brass is tarnished but the mechanism works, modernized sometime in the last century while preserving the original aesthetic.

The car is paneled in dark wood, the ceiling fitted with a frosted glass light fixture that casts soft illumination. A brass plate lists the floors: LOBBY, 2-5 OFFICES, 6 EXECUTIVE. The executive floor is locked to the elevator—you'd need credentials to access it.`,
      x: 2,
      y: 9,
      z: 0,
      exits: {
        out: '%LOBBY',
      },
      elevator: {
        floors: [0, 1, 2, 3, 4, 5],
        currentFloor: 0,
        doorsOpen: true,
        floorRooms: {
          0: '%LOBBY',
          1: '%ELEV_LOBBY_Z1',
          2: '%ELEV_LOBBY_Z2',
          3: '%ELEV_LOBBY_Z3',
          4: '%ELEV_LOBBY_Z4',
          5: '%ELEV_LOBBY_Z5',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - LOBBY AND RETAIL ARCADE
    // ═══════════════════════════════════════════════════════════════════

    '%LOBBY': {
      name: 'Pioneer Building - Main Lobby',
      description: `The main lobby of the Pioneer Building is a cathedral to Gilded Age ambition—marble floors in checkerboard black and white, coffered ceilings twenty feet overhead, brass fixtures tarnished to the color of old money. The space was designed to impress, to communicate stability and permanence to the businessmen who once filled these corridors.

A grand staircase sweeps upward along the northern wall, its iron balusters wrought in patterns of oak leaves and acorns. The stair carpet is threadbare now, its pattern worn to ghosts by a century of ascending feet. The brass handrail remains, polished by use rather than maintenance.

The building directory hangs on the eastern wall—a glass-fronted case with white letters on black felt, listing tenants by floor. The letters are jumbled, some missing, the directory unmaintained since whoever last updated it stopped coming to work.

A vintage elevator with brass accordion gates occupies the southeast corner, its position indicator showing the car at lobby level.`,
      x: 2,
      y: 9,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 's-washington/x0.ts',
          description: 'The triple-arched portal leads to 2nd Ave S',
          door: '%MAIN_DOOR',
        },
        south: '%ARCADE_NORTH',
        east: '%OFFICES_GROUND',
        up: '%STAIR_Z1',
        in: '%E',
      },
      elevatorId: '%E',
      objects: [
        {
          prototype: 'describable',
          name: 'building directory',
          aliases: ['directory', 'tenant list'],
          description: `A glass-fronted directory case, the kind with removable letters on felt backing. The letters are jumbled now—some missing, some rearranged, the names of tenants from different eras mixed together:

FLOOR 2: PACIFIC MARITIME INS... (letters missing)
FLOOR 3: H NDERSON & ASSOCIATES
FLOOR 4: SE TTLE IMPORT/EXP RT
FLOOR 5: NORTHW ST TIMBER CO.
FLOOR 6: EXEC TIVE OFFICES (RESTRICTED)

The building had tenants until the end. No one removed their names. No one added the vacancy notices.`,
        },
        {
          prototype: 'describable',
          name: 'cornerstone',
          aliases: ['stone', 'plaque'],
          description: `A sandstone block set near the entrance, carved with the building's credentials:

PIONEER BUILDING
1892
ELMER FISHER, ARCHITECT

Fisher designed a third of Pioneer Square's post-fire buildings. This was his masterpiece. The building outlived him by a century and shows no sign of stopping.`,
        },
      ],
      sittables: [
        {
          name: 'a marble bench',
          capacity: 3,
          emptyMsg:
            'A marble bench sits against the wall, cold and hard and designed more for appearance than comfort.',
          occupiedMsg: '%s sitting on the marble bench in the lobby',
        },
      ],
    },

    '%ARCADE_NORTH': {
      name: 'Pioneer Building - North Arcade',
      description: `A covered walkway runs along the building's ground floor, its arched ceiling providing shelter from Seattle's perpetual rain. The arcade was a practical feature that became architectural signature—similar passages connect buildings throughout Pioneer Square, creating a network of covered sidewalks.

Storefronts line the inner wall, their display windows dark, their doors locked. PIONEER ANTIQUES reads one sign, the window crammed with furniture and curios. CARTOGRAPHER'S GUILD announces another, its window displaying maps of coastlines that no longer match reality.

The arcade floor is worn terrazzo, the pattern of brass and marble ground smooth by generations of foot traffic. The traffic stopped. The floor remains, waiting.`,
      x: 2,
      y: 8,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LOBBY',
        east: '%ARCADE_EAST',
        south: {
          to: 's-washington/x2.ts',
          description: 'An arched opening leads to S. Washington St',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'antique shop window',
          aliases: ['antiques', 'window display'],
          description: `The PIONEER ANTIQUES window is a maximalist fever dream—grandfather clocks and rolltop desks, oil paintings in gilded frames, a suit of decorative armor, crystal decanters, ceramic figurines, the accumulated flotsam of estate sales. A hand-lettered sign reads: "EVERYTHING MUST GO." The sign is yellowed. Nothing went.`,
        },
      ],
    },

    '%ARCADE_EAST': {
      name: 'Pioneer Building - East Arcade',
      description: `The arcade continues along the building's eastern face, the arched walkway providing covered passage between streets. This section is quieter, further from the main entrance, the storefronts here less prominent.

A coffee cart stands abandoned near the corner—one of those mobile espresso setups that fed caffeine to office workers. The chrome is dulled, the menu board faded, but the grinder and portafilter remain. Someone could theoretically make coffee here. No one does.

Through the eastern arches, the street is visible—Occidental Avenue and the buildings beyond, their facades matching the Pioneer Building's Romanesque vocabulary.`,
      x: 3,
      y: 8,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%ARCADE_NORTH',
        north: '%OFFICES_GROUND',
        east: {
          to: 'occidental-ave-s/y8.ts',
          description: 'Arched openings lead to Occidental Ave S',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'coffee cart',
          aliases: ['cart', 'espresso cart'],
          description: `A mobile espresso cart, the kind that fed caffeine addictions to office workers who couldn't wait for the coffee shop. The chrome is dulled, the steam wand crusted with old milk, but the equipment is intact—commercial grinder, dual-group espresso machine, a chalkboard menu offering drinks no one will order. "CORTADO $4" reads the last price written.`,
        },
      ],
    },

    '%OFFICES_GROUND': {
      name: 'Pioneer Building - Ground Floor Offices',
      description: `A corridor of ground-floor office suites, originally designed for businesses that needed street-level access—insurance agents, accountants, the professional services that supported Pioneer Square's commerce. The frosted glass doors bear names in gold leaf, most faded to illegibility.

The corridor is quieter than the arcade, more interior, the light dimmer. Office doors line both walls, their transoms dark, their occupants long departed. One door stands slightly ajar—Suite 102, whatever business once operated there having left without fully closing.

A service corridor branches south, leading to the building's mechanical systems and the loading dock beyond.`,
      x: 3,
      y: 9,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LOBBY',
        south: '%ARCADE_EAST',
        east: '%SERVICE_CORRIDOR',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'office doors',
          aliases: ['doors', 'suites'],
          description: `Frosted glass doors with gold-leaf lettering, the names of businesses that closed at various points over the building's history. Some are recent—"PIONEER SQUARE PROPERTY MANAGEMENT." Some are antique—"YUKON GOLD ASSAY OFFICE." The building accumulated tenants over a century. The tenants accumulated dust.`,
        },
      ],
    },

    '%SERVICE_CORRIDOR': {
      name: 'Pioneer Building - Service Corridor',
      description: `The utilitarian heart of the building—a narrow corridor lined with mechanical systems, electrical panels, and the infrastructure that keeps a century-old building functional. The walls are exposed brick, the floor bare concrete, the aesthetic purely practical.

A service elevator sits at the far end, its doors closed, its status indicator dark. The elevator was for freight and maintenance, not the brass-and-mahogany experience of the passenger lift. A heavy door marked LOADING DOCK leads to the alley.

The building's age shows here more than in the public spaces—pipes wrapped in insulation that might be asbestos, wiring that predates modern codes, repairs layered on repairs in a archaeology of maintenance.`,
      x: 4,
      y: 9,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%OFFICES_GROUND',
        south: {
          to: 'alley/y8.ts',
          locks: ['%SERVICE_LOCK'],
          description: 'A heavy door leads to the loading dock',
        },
        down: '%BASEMENT',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'electrical panels',
          aliases: ['panels', 'electrical', 'breakers'],
          description: `A wall of electrical panels spanning the building's history—the original knob-and-tube installation behind a locked cabinet, successive upgrades in grey steel boxes, the most recent panel digital and dark. The building's power history, preserved in hardware.`,
        },
      ],
    },

    '%BASEMENT': {
      name: 'Pioneer Building - Basement',
      description: `The basement of the Pioneer Building is a time capsule of urban infrastructure—the building's original mechanical systems preserved alongside their modern replacements. A massive coal furnace, converted to gas decades ago, squats in the center of the space. The conversion left the original hardware intact, a monument to the building's coal-burning past.

The walls are rough stone, the foundation laid in 1892, supporting the six stories of brick and iron above. Water stains mark the high-water level from floods that have come and gone over the decades. The building has always had water problems. The water table is high here, the bay close.

A door in the eastern wall leads to the Seattle Underground—the network of tunnels and buried sidewalks that runs beneath Pioneer Square, remnants of the city that was raised a full story after the Great Fire.`,
      x: 3,
      y: 9,
      z: -1,
      population: 0,
      ambientNoise: 10,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%SERVICE_CORRIDOR',
        east: {
          to: 'underground/entries/pioneer-building.ts',
          description: 'A heavy door leads into the Underground',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'coal furnace',
          aliases: ['furnace', 'boiler'],
          description: `A massive cast-iron furnace, ten feet tall, its surface covered in gauges and valves and the fossilized coal dust that never quite washes away. The coal doors are welded shut—the conversion to gas happened fifty years ago—but the original infrastructure remains. The building was heated by coal for its first century. The furnace remembers.`,
        },
        {
          prototype: 'describable',
          name: 'foundation stones',
          aliases: ['stones', 'foundation', 'walls'],
          description: `The rough-cut stone foundation, laid in 1892 by workers who understood that buildings should last. The stones are massive, fitted together with mortar that has hardened to the strength of the stone itself. Water stains mark the height of various floods. The foundation has survived them all.`,
        },
      ],
    },
  },
};
