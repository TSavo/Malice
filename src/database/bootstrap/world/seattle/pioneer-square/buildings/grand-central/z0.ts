// Grand Central Arcade - Ground Floor (z=0)
// Seattle's first indoor shopping center, built 1891 after the Great Fire
// Romanesque Revival architecture with iron and glass roof

export const building = {
  name: 'Grand Central Arcade',
  x: -13,
  y: 2,
  width: 4,
  height: 3,
  floors: 4,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR
    // ═══════════════════════════════════════════════════════════════════

    '%GC_E': {
      prototype: 'elevator',
      name: 'Grand Central - Elevator',
      description: `An antique cage elevator from the building's 1897 hotel conversion. The brass fixtures have oxidized to a dark brown, the safety gate a lattice of wrought iron with decorative scrollwork. The car shudders and groans with each floor, cables complaining in the shaft above.

The control panel has four brass buttons, worn smooth by a century of fingers. The floor numbers are engraved rather than painted—1890s craftsmanship meant to last. The emergency stop is a lever, not a button, its wooden handle polished by decades of nervous hands that never needed to pull it.

The elevator works, barely. It moves with the deliberation of something that knows its age and resents the imposition.`,
      x: -10,
      y: 3,
      z: 0,
      exits: {
        out: '%GC_ELEV_LOBBY',
      },
      elevator: {
        floors: [0, 1, 2, 3],
        currentFloor: 0,
        doorsOpen: true,
        floorRooms: {
          0: '%GC_ELEV_LOBBY',
          1: '%GC_HALL_1',
          2: '%GC_HALL_2',
          3: '%GC_ROOF_ACCESS',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // SOUTH ROW (y=+2): Entrance, Arcade South, Shop SW, Shop SE
    // ═══════════════════════════════════════════════════════════════════

    '%GC_ENTRANCE': {
      name: 'Grand Central - Main Entrance',
      description: `The main entrance to Grand Central Arcade, framed by a Romanesque archway of carved sandstone. Stone eagles perch on the capitals, their features softened by a century of Seattle rain. The original doors—ten feet of oak and brass—hang askew on corroded hinges. One door is wedged permanently open; the other lies flat inside, having finally surrendered to gravity.

Above the archway, carved letters spell GRAND CENTRAL in a typeface that was fashionable in 1891. The C has fallen away, leaving GRAND ENTRAL, which seems appropriate somehow.

Beyond the threshold, the arcade stretches west into shadow, its iron framework just visible against the grey light filtering through broken skylights above.`,
      x: -10,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 15,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: 'alleys/x-9-y2.ts',
          description: 'Through the ornate archway to the street',
        },
        west: '%GC_ARCADE_S',
        north: '%GC_ELEV_LOBBY',
      },
      sittables: [
        {
          name: 'a fallen door',
          capacity: 2,
          emptyMsg:
            'One of the original oak doors lies flat on the floor, making an improvised bench.',
          occupiedMsg: '%s sitting on the fallen door',
        },
      ],
    },

    '%GC_ARCADE_S': {
      name: 'Grand Central - Southern Arcade',
      description: `The southern end of the Grand Central Arcade, where the covered passage begins its march toward the building's heart. Iron columns rise on either side—Corinthian capitals cast in foundry molds, their acanthus leaves now blackened by time. The columns support a framework of iron beams that once held a glass roof.

The glass is mostly gone now. Shards remain in the iron frames, catching light like broken teeth. Rain has stained the decorative tile floor in patterns that follow the gaps above. Moss grows in the grout lines where water pools.

Empty shop fronts line both sides. Display windows are shattered or boarded. Faded signage advertises businesses that died with the old world: PACIFIC JEWELERS, PIONEER HABERDASHERY, SQUIRE & SONS DRY GOODS.`,
      x: -11,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 12,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GC_ENTRANCE',
        west: '%GC_SHOP_SW',
        north: '%GC_ARCADE_C',
      },
      sittables: [
        {
          name: 'an iron bench',
          capacity: 3,
          emptyMsg:
            'A Victorian-era iron bench sits against the wall, its wooden slats rotted away leaving only the ornate metal frame.',
          occupiedMsg: '%s perched on the iron bench frame',
        },
      ],
    },

    '%GC_SHOP_SW': {
      name: 'Grand Central - Southwest Shop',
      description: `A former retail space in the arcade's southwest corner. The shop window facing the arcade is shattered, display cases visible inside like the ribs of a dead animal. HARRISON'S TOBACCONIST reads the faded gilt lettering above the door frame. The door itself is gone.

Inside, wooden shelving lines the walls, empty except for dust and rat droppings. A glass-topped counter lies on its side, cracked down the middle. The floor is wooden planks, warped by decades of moisture from the broken roof above.

The smell of old tobacco has long since faded, replaced by mildew and decay. Graffiti marks one wall: NOBODY COMES HERE ANYMORE, written in what might be charcoal or dried blood.`,
      x: -13,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GC_ARCADE_S',
        north: '%GC_SHOP_W',
      },
    },

    '%GC_SHOP_SE': {
      name: 'Grand Central - Southeast Shop',
      description: `The ground floor space at the arcade's southeast corner, tucked between the main entrance and the elevator lobby. The shop front is intact—a miracle of surviving glass in a wooden frame. Inside, empty display cases line the walls in neat rows, their velvet linings faded from red to pink to grey.

PACIFIC JEWELERS reads the sign, still legible. A heist or a looting—the cases are empty, locks broken, but the glass is carefully cut rather than smashed. Someone took their time here, knew what they wanted.

A safe sits in the back corner, door hanging open, interior gutted. Whatever was worth taking is long gone. What remains is the shell of commerce, a monument to transactions that will never resume.`,
      x: -12,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%GC_ARCADE_S',
        west: '%GC_ARCADE_S',
        east: '%GC_ENTRANCE',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // MIDDLE ROW (y=+3): Shop W, Arcade Central, Shop E, Elevator Lobby
    // ═══════════════════════════════════════════════════════════════════

    '%GC_SHOP_W': {
      name: 'Grand Central - West Shop',
      description: `A cavernous retail space along the arcade's western wall. SQUIRE & SONS DRY GOODS announces the painted sign, the ampersand rendered in elaborate Victorian script. The shop is deep, extending back into darkness where the skylights above have completely failed.

Wooden shelving units stand like sentinels in the gloom, some toppled, others still upright and empty. A counter runs the length of one wall, its surface scarred by knife marks where bolts of fabric were once measured and cut. Scattered fabric scraps have rotted to unidentifiable mulch on the floor.

Near the back, a staircase leads up—probably to storage or living quarters above. The stairs are blocked by collapsed debris, the upper floor having partially given way at some point.`,
      x: -13,
      y: 3,
      z: 0,
      population: 0,
      ambientNoise: 6,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GC_ARCADE_C',
        south: '%GC_SHOP_SW',
        north: '%GC_SHOP_NW',
      },
    },

    '%GC_ARCADE_C': {
      name: 'Grand Central - Central Arcade',
      description: `The heart of Grand Central Arcade, where the iron and glass ceiling reaches its highest point. The surviving glass panels create a patchwork of light and shadow, sun filtering through decades of grime and pigeon droppings. When it rains, water cascades through the gaps in intricate patterns.

The decorative tile floor is best preserved here, geometric patterns in terracotta and cream that would be beautiful if not covered in debris. A central fountain basin, long dry, contains a statue of a woman holding an urn—her face worn featureless by time, the urn cracked and sprouting weeds.

Iron balconies ring the upper floors, their railings rusted but intact. From below, you can see the ghost of what this place was: a palace of commerce, a temple to prosperity, now a cathedral of decay.`,
      x: -12,
      y: 3,
      z: 0,
      population: 0,
      ambientNoise: 15,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_SHOP_W',
        east: '%GC_SHOP_E',
        south: '%GC_ARCADE_S',
        north: '%GC_ARCADE_N',
      },
      sittables: [
        {
          name: 'the fountain rim',
          capacity: 6,
          emptyMsg:
            'The dry fountain basin has a wide stone rim, worn smooth by generations of shoppers who once rested here.',
          occupiedMsg: '%s sitting on the fountain rim',
        },
      ],
    },

    '%GC_SHOP_E': {
      name: 'Grand Central - East Shop',
      description: `A former food establishment along the arcade's eastern wall, identifiable by the rusted remains of a counter and stools. SEATTLE LUNCH COUNTER reads the painted sign above, the words barely visible beneath decades of grime. A menu board still hangs on the wall, its chalk offerings long since smeared to illegibility.

The kitchen area in back is a disaster of collapsed shelving and corroded appliances. The ice box—a genuine antique even before The Burning—lies on its side, door open to reveal nothing but rust and old ice trays.

The smell is surprisingly neutral—whatever food rotted here did so long ago, leaving only the dry scent of old grease and forgotten meals.`,
      x: -11,
      y: 3,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_ARCADE_C',
        east: '%GC_ELEV_LOBBY',
        south: '%GC_SHOP_SE',
        north: '%GC_SHOP_NE',
      },
      sittables: [
        {
          name: 'a lunch counter stool',
          capacity: 4,
          emptyMsg:
            'Four lunch counter stools remain bolted to the floor, their leather seats cracked but intact.',
          occupiedMsg: '%s sitting at the lunch counter',
        },
      ],
    },

    '%GC_ELEV_LOBBY': {
      name: 'Grand Central - Elevator Lobby',
      description: `A small vestibule at the arcade's eastern end, dominated by the ornate cage elevator that connects all four floors. The elevator's brass gate stands open, the car visible inside—a box of iron and wood paneling that somehow still functions.

The floor here is marble, cracked but impressive. A call button protrudes from the wall, its brass surface worn bright by use. The button still works, triggering a distant mechanical groan and the complaint of antique cables.

A directory board hangs on the wall, its glass cracked and contents faded: GROUND FLOOR - ARCADE, FIRST FLOOR - OFFICES, SECOND FLOOR - HOTEL, THIRD FLOOR - OBSERVATION. The hotel hasn't operated in decades. The observation deck is probably a death trap. The directory doesn't mention these updates.`,
      x: -10,
      y: 3,
      z: 0,
      population: 0,
      ambientNoise: 10,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_SHOP_E',
        south: '%GC_ENTRANCE',
        north: '%GC_SERVICE',
        in: '%GC_E',
      },
      elevatorId: '%GC_E',
    },

    // ═══════════════════════════════════════════════════════════════════
    // NORTH ROW (y=+4): Shop NW, Arcade North, Shop NE, Service Area
    // ═══════════════════════════════════════════════════════════════════

    '%GC_SHOP_NW': {
      name: 'Grand Central - Northwest Shop',
      description: `The northwest corner shop, its entrance marked by a wooden Indian that somehow survived both The Burning and subsequent lootings. The carved figure stands guard beside the door frame, one arm missing, paint flaked to bare wood, but still recognizably a cigar-store Indian from another century.

Inside, the shop is gutted but spacious. PIONEER TOBACCONIST & SUNDRIES reads the faded sign. Wooden cabinets with glass fronts line the walls, their contents long since taken. A potbelly stove sits cold in the corner, its chimney pipe hanging loose from the ceiling.

The wooden floor creaks ominously with each step. The building's age shows here more than anywhere—sagging joists, water stains on the pressed-tin ceiling, the smell of wood slowly returning to earth.`,
      x: -13,
      y: 4,
      z: 0,
      population: 0,
      ambientNoise: 6,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GC_ARCADE_N',
        south: '%GC_SHOP_W',
      },
    },

    '%GC_ARCADE_N': {
      name: 'Grand Central - Northern Arcade',
      description: `The northern terminus of the Grand Central Arcade, where the covered passage ends at a wall of windows looking out toward S. Washington Street. The windows are mostly intact here—leaded glass in geometric patterns, surprisingly beautiful despite the grime.

This section of arcade is darker than the rest, the skylights above having failed almost completely. Water damage is extensive, the decorative plaster ceiling hanging in strips. Iron brackets that once held gas lamps—later converted to electric—protrude from the walls at regular intervals, their fixtures stolen or destroyed.

A maintenance door in the north wall is chained shut, the chain new compared to everything else. Someone has secured this exit recently. The padlock looks modern, out of place amid the Victorian decay.`,
      x: -12,
      y: 4,
      z: 0,
      population: 0,
      ambientNoise: 10,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_SHOP_NW',
        east: '%GC_SHOP_NE',
        south: '%GC_ARCADE_C',
      },
    },

    '%GC_SHOP_NE': {
      name: 'Grand Central - Northeast Shop',
      description: `A corner shop that once served as a news stand and stationer. METROPOLITAN NEWS & TOBACCO announces the ghost of a painted sign. Wire racks that held newspapers stand empty and rusted, their contents rotted to nothing decades ago.

A glass display case, miraculously unbroken, shows a collection of fountain pens that no one bothered to loot—luxury items with no survival value, preserved behind glass while the world ended around them. The pens are tarnished, their rubber parts perished, but they remain as artifacts of a literate age.

The floor is covered in paper debris—old newspapers, magazines, books that swelled with moisture and burst their bindings. Walking through the shop kicks up clouds of paper dust and mold spores.`,
      x: -11,
      y: 4,
      z: 0,
      population: 0,
      ambientNoise: 6,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_ARCADE_N',
        south: '%GC_SHOP_E',
        east: '%GC_SERVICE',
      },
    },

    '%GC_SERVICE': {
      name: 'Grand Central - Service Area',
      description: `The back-of-house service area for the Grand Central Arcade, hidden from shoppers by a plain door now hanging off one hinge. The contrast with the decorative arcade is stark—bare brick walls, concrete floor, exposed pipes and conduits.

A stairwell in the corner leads up, but the stairs themselves have partially collapsed. The landing above is visible, but unreachable without climbing gear. Warning signs—hand-painted, recent—mark the stairwell: DANGER DO NOT CLIMB UNSTABLE.

Storage rooms line the corridor, their doors mostly open to reveal empty shelves. One room contains a collection of cleaning supplies from various eras—buckets, mops, bottles of chemicals with labels that predate modern safety regulations.`,
      x: -10,
      y: 4,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_SHOP_NE',
        south: '%GC_ELEV_LOBBY',
      },
    },
  },

  postProcessors: [],
};
