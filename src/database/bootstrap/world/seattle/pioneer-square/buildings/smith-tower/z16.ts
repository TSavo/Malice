// Smith Tower - Condo Floor (z=16)
// Southwestern desert - terracotta, turquoise accents, Native American textiles, adobe style

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z16' },
    },

    // Rentable locks
    '%RL_A2_z16': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z16': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z16': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z16': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z16'],
    },
    '%D_B2_z16': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z16'],
    },
    '%D_C3_z16': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z16'],
    },

    // Elevator landing
    '%EL_z16': {
      name: 'Smith Tower - 16th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 16,
      exits: {
        north: { room: '%A2_z16', door: '%D_A2_z16' },
        east: { room: '%B2_z16', door: '%D_B2_z16' },
        south: { room: '%C3_z16', door: '%D_C3_z16' },
        west: '%C1_z16',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z16': {
      name: 'Smith Tower - 16th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -3,
      y: 11,
      z: 16,
      exits: { east: '%A2_z16' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 16).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a kiva fireplace', description: 'A rounded adobe kiva fireplace fills one corner, its smooth plaster cracked in places. Cold ashes and a dried chili ristra hang nearby.', boltedDown: true },
        { prototype: 'table', name: 'a mesquite coffee table', description: 'A low table of twisted mesquite wood sits before the seating area, its natural edges preserved. Turquoise inlay traces the grain.', boltedDown: false },
        { prototype: 'furniture', name: 'a trastero cabinet', description: 'A tall wooden trastero stands against the wall, its carved doors depicting desert flowers. Shelves inside hold pueblo-style pottery and a dead cactus.', boltedDown: true },
        { prototype: 'furniture', name: 'a Navajo rug', description: 'A faded Navajo rug in reds and ochres covers the saltillo tile floor, its geometric patterns still visible despite decades of dust.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a leather equipale chair',
          capacity: 1,
          emptyMsg:
            'A pigskin equipale chair sits near the kiva fireplace, its barrel shape and woven leather strips faded but intact.',
          occupiedMsg: '%s settled in the equipale chair.',
        },
        {
          name: 'a leather banco',
          capacity: 3,
          emptyMsg:
            'A built-in adobe banco lines the wall beneath the window, topped with faded serape cushions.',
          occupiedMsg: '%s resting on the banco.',
        },
      ],
    },

    '%A2_z16': {
      name: 'Smith Tower - 16th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 16,
      exits: {
        west: '%A1_z16',
        east: '%A3_z16',
        south: { room: '%EL_z16', door: '%D_A2_z16' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 16).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a carved pine bed', description: 'A massive bed frame of carved pine features desert motifs—saguaros, roadrunners, sun symbols. A faded Chimayo blanket serves as a bedspread.', quality: 'standard' },
        { prototype: 'furniture', name: 'adobe wall niches', description: 'Rounded niches are built into the adobe-style walls, displaying turquoise-studded crosses and dried desert flowers in clay pots.', boltedDown: true },
        { prototype: 'table', name: 'a wrought iron nightstand', description: 'A nightstand of twisted wrought iron and mesquite wood holds a dead oil lamp with a copper shade.', boltedDown: false },
        { prototype: 'furniture', name: 'a cowhide rug', description: 'A genuine cowhide rug in brown and white patches lies beside the bed, its edges curling with age.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the carved pine bed',
          capacity: 2,
          emptyMsg:
            'The carved pine bed waits beneath its Chimayo blanket, the wool still vibrant with reds and golds.',
          occupiedMsg: '%s resting on the carved pine bed.',
        },
      ],
    },

    '%A3_z16': {
      name: 'Smith Tower - 16th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 16,
      exits: { west: '%A2_z16' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 16).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a saltillo tile kitchen', description: 'The galley kitchen features hand-painted Talavera tile backsplashes in cobalt and yellow. Copper pots hang from a wrought iron rack, tarnished green with age.', boltedDown: true },
        { prototype: 'table', name: 'a mission-style desk', description: 'A heavy oak mission desk sits near the window, its clean lines and exposed joinery unmistakably Arts and Crafts. A dead cactus in a terra cotta pot decorates one corner.', boltedDown: false },
        { prototype: 'furniture', name: 'a serape-draped daybed', description: 'A wrought iron daybed is draped with layered serape blankets in stripes of orange, red, and brown. The iron is worked into a pattern of desert flowers.', boltedDown: false },
        { prototype: 'furniture', name: 'a dried chili ristra', description: 'A long ristra of dried red chilies hangs from a ceiling beam, its peppers shriveled and dusty but still holding their crimson color.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the serape daybed',
          capacity: 2,
          emptyMsg:
            'The wrought iron daybed waits beneath its serape blankets, surprisingly inviting.',
          occupiedMsg: '%s lounging on the serape daybed.',
        },
        {
          name: 'a rawhide desk chair',
          capacity: 1,
          emptyMsg:
            'A mission-style chair with a woven rawhide seat sits at the desk.',
          occupiedMsg: '%s sitting at the mission desk.',
        },
      ],
    },

    '%B1_z16': {
      name: 'Smith Tower - 16th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 16,
      exits: { south: '%B2_z16' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 16).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a juniper log ladder', description: 'A rustic ladder of twisted juniper logs leads up to the sleeping loft, its bark still clinging in places. The rungs are worn smooth by hands.', boltedDown: true },
        { prototype: 'bed', name: 'a loft sleeping platform', description: 'The mezzanine holds a sleeping platform covered in sheepskins and a faded Zapotec weaving. Kachina dolls line a narrow shelf.', quality: 'cheap' },
        { prototype: 'furniture', name: 'a pueblo-style banco', description: 'A curved adobe banco is built beneath the mezzanine, its surface worn smooth. Faded cushions in terracotta and sage green line it.', boltedDown: true },
        { prototype: 'table', name: 'a carved santos shelf', description: 'A low shelf of carved pine holds santos figurines and a collection of pueblo pottery, all coated in decades of dust.', boltedDown: false },
        { prototype: 'furniture', name: 'a bleached cow skull', description: 'A bleached cow skull with curving horns hangs above the banco, a turquoise stone wedged in one eye socket.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the pueblo banco',
          capacity: 3,
          emptyMsg:
            'The curved banco waits beneath the mezzanine, its cushions faded but comfortable.',
          occupiedMsg: '%s settled into the adobe banco.',
        },
        {
          name: 'the loft platform',
          capacity: 1,
          emptyMsg:
            'The sleeping platform is visible above, accessible by the juniper ladder.',
          occupiedMsg: '%s up in the loft on sheepskins.',
        },
      ],
    },

    '%C1_z16': {
      name: 'Smith Tower - 16th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 16,
      exits: { south: '%C2_z16', east: '%EL_z16' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 16).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a hide-covered cot', description: 'A simple cot is covered with a worn elk hide, the hair rubbed off in patches. A woven Navajo saddle blanket serves as bedding.', quality: 'cheap' },
        { prototype: 'furniture', name: 'antler hooks', description: 'Deer antlers mounted on the wall serve as coat hooks, their tines worn smooth. A leather satchel dangles from one.', boltedDown: true },
        { prototype: 'furniture', name: 'a wall niche with santos', description: 'A small rounded niche holds a carved wooden santo—a faded Saint Francis with missing fingers and flaking paint.', boltedDown: true },
        { prototype: 'furniture', name: 'a woven basket', description: 'A large Tohono O\'odham basket sits in the corner, its coiled patterns depicting a man-in-the-maze motif. Empty now, dusty.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the hide-covered cot',
          capacity: 1,
          emptyMsg:
            'The cot waits beneath its elk hide, surprisingly warm-looking.',
          occupiedMsg: '%s lying on the hide-covered cot.',
        },
      ],
    },

    '%B2_z16': {
      name: 'Smith Tower - 16th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 16,
      exits: {
        north: '%B1_z16',
        east: '%B3_z16',
        west: { room: '%EL_z16', door: '%D_B2_z16' },
        south: '%B4_z16',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 16).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a massive leather sofa', description: 'An enormous leather sofa in worn saddle brown dominates the room. Branded into the leather are subtle cattle brand patterns—Circle K, Lazy J, Double Bar.', boltedDown: true },
        { prototype: 'table', name: 'a petrified wood table', description: 'A coffee table made from a cross-section of petrified wood sits before the sofa, its ancient rings polished smooth. Turquoise fills the cracks.', boltedDown: false },
        { prototype: 'furniture', name: 'a built-in kiva entertainment niche', description: 'A rounded adobe-style niche holds a dead television and shelves of dusty Western DVDs. Carved vigas frame the opening.', boltedDown: true },
        { prototype: 'furniture', name: 'a Southwestern blanket chest', description: 'A painted pine blanket chest features geometric Southwestern designs in turquoise and terracotta. The hinges are rusty but functional.', boltedDown: true },
        { prototype: 'furniture', name: 'a wrought iron coat tree', description: 'A tall coat tree of twisted wrought iron stands near the door, its hooks shaped like saguaro arms. A dusty felt cowboy hat hangs from one.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the leather sofa',
          capacity: 4,
          emptyMsg:
            'The massive leather sofa sprawls across the room, its brands telling stories of forgotten ranches.',
          occupiedMsg: '%s sunk into the saddle leather sofa.',
        },
      ],
    },

    '%B3_z16': {
      name: 'Smith Tower - 16th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 16,
      exits: { west: '%B2_z16' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 16).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'built-in vigas shelving', description: 'Shelves supported by rough-hewn vigas line the walls, holding books on Southwestern art, Anasazi archaeology, and desert ecology. All dusty, all untouched.', boltedDown: true },
        { prototype: 'table', name: 'a Santa Fe writing desk', description: 'A painted pine desk in sun-bleached turquoise sits in the window bay. Desert scenes are hand-painted on its sides—mesas, coyotes, thunderbirds.', boltedDown: false },
        { prototype: 'chair', name: 'a tooled leather armchair', description: 'A deep armchair upholstered in tooled leather features desert rose patterns. The leather is cracked but supple.', boltedDown: false },
        { prototype: 'furniture', name: 'a wrought iron floor lamp', description: 'A tall floor lamp of twisted wrought iron stands behind the chair, its mica shade casting a warm amber glow when it worked.', boltedDown: false },
        { prototype: 'furniture', name: 'a Hopi kachina collection', description: 'A glass-fronted case displays a collection of Hopi kachina dolls—Eagle Dancer, Mudhead, Crow Mother—all draped in dust and silence.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the tooled leather armchair',
          capacity: 1,
          emptyMsg:
            'The tooled leather armchair waits by the window, its rose patterns catching the light.',
          occupiedMsg: '%s curled up in the leather armchair.',
        },
        {
          name: 'the painted desk chair',
          capacity: 1,
          emptyMsg:
            'A matching painted chair is pushed under the Santa Fe desk.',
          occupiedMsg: '%s seated at the painted desk.',
        },
      ],
    },

    '%C2_z16': {
      name: 'Smith Tower - 16th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 16,
      exits: { north: '%C1_z16', east: '%C3_z16' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 16).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a corner kiva fireplace', description: 'A traditional corner kiva fireplace bulges from the wall, its beehive shape plastered smooth. A collection of dried gourds rests on the hearth.', boltedDown: true },
        { prototype: 'table', name: 'an ironwood side table', description: 'A small table of dense desert ironwood holds a terra cotta lamp shaped like a howling coyote. The shade is made of pierced tin.', boltedDown: false },
        { prototype: 'furniture', name: 'a Navajo Chief\'s blanket', description: 'A faded Chief\'s blanket in the classic third-phase pattern hangs on the wall—reds and indigos muted by decades of dust and light.', boltedDown: true },
        { prototype: 'furniture', name: 'a collection of olla pottery', description: 'Large pueblo olla jars sit in a row beneath the window, their painted designs depicting rain clouds and corn maidens.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a hide-covered loveseat',
          capacity: 2,
          emptyMsg:
            'A loveseat draped in cowhide faces the kiva fireplace, its spots worn smooth.',
          occupiedMsg: '%s squeezed onto the hide loveseat.',
        },
      ],
    },

    '%C3_z16': {
      name: 'Smith Tower - 16th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 16,
      exits: {
        north: { room: '%EL_z16', door: '%D_C3_z16' },
        west: '%C2_z16',
        east: '%C4_z16',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 16).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a carved mesquite bench', description: 'A heavy bench of carved mesquite sits against the wall, its seat polished smooth by years of use. Desert animals are carved into the legs.', boltedDown: false },
        { prototype: 'furniture', name: 'an adobe entry niche', description: 'A rounded adobe niche is built into the wall, designed for removing boots. A pair of dusty cowboy boots still wait there.', boltedDown: true },
        { prototype: 'furniture', name: 'a copper-clad mail slot', description: 'The mail slot is framed in hammered copper with a patina of verdigris. A sun symbol is embossed above it.', boltedDown: true },
        { prototype: 'table', name: 'a turquoise-inlay console', description: 'A narrow pine console features turquoise chips inlaid in a thunderbird pattern. A painted gourd bowl holds ancient keys.', boltedDown: false },
        { prototype: 'furniture', name: 'a saguaro rib hat rack', description: 'A hat rack made from dried saguaro ribs leans in the corner, its pale wood bleached silver. A dusty straw hat hangs from one arm.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the mesquite bench',
          capacity: 3,
          emptyMsg:
            'The carved mesquite bench offers a place to sit and remove boots.',
          occupiedMsg: '%s sitting on the mesquite bench.',
        },
      ],
    },

    '%C4_z16': {
      name: 'Smith Tower - 16th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 16,
      exits: { west: '%C3_z16' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 16).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a pueblo-style platform bed', description: 'A low platform bed built of adobe-colored stucco fills the alcove, draped with a faded Rio Grande weaving in stripes of rust and gold.', quality: 'standard' },
        { prototype: 'furniture', name: 'a rustic pine armoire', description: 'A tall armoire of distressed pine features carved sunbursts and painted desert flowers. Its doors hang slightly open.', boltedDown: true },
        { prototype: 'furniture', name: 'a sun mirror', description: 'A full-length mirror is framed in hammered tin shaped like a radiating sun. The metal has darkened to pewter.', boltedDown: true },
        { prototype: 'table', name: 'a terracotta nightstand', description: 'A nightstand of painted terracotta holds a dead candle in a punched tin holder and a collection of small turquoise stones.', boltedDown: false },
        { prototype: 'furniture', name: 'a dreamcatcher', description: 'A large dreamcatcher hangs above the bed, its willow hoop wrapped in leather. The feathers are dusty, the web intact.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the pueblo platform bed',
          capacity: 2,
          emptyMsg:
            'The platform bed waits in its alcove beneath the dreamcatcher.',
          occupiedMsg: '%s tucked away on the pueblo bed.',
        },
      ],
    },

    '%B4_z16': {
      name: 'Smith Tower - 16th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 16,
      exits: { north: '%B2_z16' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 16).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a Murphy bed with Chimayo blanket', description: 'A Murphy bed folds down from a cabinet painted with Kokopelli dancers. A faded Chimayo blanket in sunset colors covers the mattress.', quality: 'standard' },
        { prototype: 'furniture', name: 'a painted Murphy cabinet', description: 'The Murphy bed cabinet is painted in the distinctive New Mexican style—turquoise, terra cotta, and ochre with geometric patterns.', boltedDown: true },
        { prototype: 'furniture', name: 'nichos with santos', description: 'Small rounded nichos are built into the walls, each holding a carved wooden santo or a collection of milagros—tiny tin charms of body parts.', boltedDown: true },
        { prototype: 'table', name: 'a fold-down mesquite desk', description: 'A fold-down desk of mesquite wood is hinged to the wall, its live edge preserved. Burn marks suggest someone once used it for leather work.', boltedDown: true },
        { prototype: 'furniture', name: 'a painted pine dresser', description: 'A narrow dresser painted in faded desert rose features carved pulls shaped like roadrunners. The drawers stick in the humidity.', boltedDown: true },
        { prototype: 'furniture', name: 'a Zuni fetish collection', description: 'A small shelf holds a collection of Zuni stone fetishes—bear, wolf, eagle—each bound with offerings of turquoise and shell.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the Chimayo Murphy bed',
          capacity: 2,
          emptyMsg:
            'The Murphy bed is folded down, its Chimayo blanket warm and inviting.',
          occupiedMsg: '%s stretched out on the Chimayo bed.',
        },
      ],
    },
  },
};
