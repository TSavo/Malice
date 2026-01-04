// Smith Tower - Condo Floor (z=13)
// Japanese minimalist - tatami, shoji screens, low furniture, natural materials

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z13' },
    },

    // Rentable locks
    '%RL_A2_z13': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z13': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z13': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z13': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z13'],
    },
    '%D_B2_z13': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z13'],
    },
    '%D_C3_z13': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z13'],
    },

    // Elevator landing
    '%EL_z13': {
      name: 'Smith Tower - 13th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 13,
      exits: {
        north: { room: '%A2_z13', door: '%D_A2_z13' },
        east: { room: '%B2_z13', door: '%D_B2_z13' },
        south: { room: '%C3_z13', door: '%D_C3_z13' },
        west: '%C1_z13',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z13': {
      name: 'Smith Tower - 13th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -3,
      y: 11,
      z: 13,
      exits: { east: '%A2_z13' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 13).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a chabudai table', description: 'A low Japanese chabudai table in dark wood sits on the tatami, its legs folded but functional. Tea stains mark its surface.', boltedDown: false },
        { prototype: 'furniture', name: 'a minimalist kitchenette', description: 'A simple kitchenette in light ash wood runs along the wall, its design clean and unadorned. A ceramic tea set sits on the counter, gathering dust.', boltedDown: true },
        { prototype: 'furniture', name: 'a tokonoma alcove', description: 'A built-in tokonoma alcove displays a faded hanging scroll with calligraphy and a single ceramic vase holding dried flowers.', boltedDown: true },
        { prototype: 'furniture', name: 'shoji screen panels', description: 'Paper shoji screens divide the space, their translucent panels yellowed with age. A few have small tears from decades of neglect.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'zabuton cushions',
          capacity: 4,
          emptyMsg: 'Several zabuton floor cushions in faded indigo are arranged around the low table.',
          occupiedMsg: '%s kneeling on a zabuton cushion.',
        },
      ],
    },

    '%A2_z13': {
      name: 'Smith Tower - 13th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 13,
      exits: {
        west: '%A1_z13',
        east: '%A3_z13',
        south: { room: '%EL_z13', door: '%D_A2_z13' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 13).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a shikibuton', description: 'A traditional Japanese futon mattress lies directly on the tatami floor, its cotton cover faded but clean. A buckwheat hull pillow rests at its head.', quality: 'standard' },
        { prototype: 'furniture', name: 'a tansu closet', description: 'A stepped tansu chest with multiple drawers and a small cabinet is built into the wall. Its iron hardware is tarnished but the wood grain glows warmly.', boltedDown: true },
        { prototype: 'table', name: 'a low bedside tray', description: 'A simple wooden tray on short legs serves as a nightstand, holding a ceramic tea cup and a book of haiku in Japanese.', boltedDown: false },
        { prototype: 'furniture', name: 'a paper lantern', description: 'A delicate paper lantern hangs from the ceiling, its wooden frame intact but the paper yellowed and brittle.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the shikibuton',
          capacity: 2,
          emptyMsg: 'The futon lies on the tatami, ready for rest.',
          occupiedMsg: '%s resting on the futon.',
        },
      ],
    },

    '%A3_z13': {
      name: 'Smith Tower - 13th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 13,
      exits: { west: '%A2_z13' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 13).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a zen kitchen', description: 'A simple kitchen in natural bamboo runs along the wall. Rice paper covers the cabinet doors, and a cast iron tetsubin sits cold on the stovetop.', boltedDown: true },
        { prototype: 'table', name: 'a writing desk', description: 'A low writing desk in dark paulownia wood sits under the window, designed for sitting on the floor. Brushes and an inkstone rest on its surface.', boltedDown: false },
        { prototype: 'furniture', name: 'a folding screen', description: 'A six-panel byobu folding screen painted with mountains and pines creates a sense of separation in the open space. The silk is faded but the gilding still catches light.', boltedDown: false },
        { prototype: 'furniture', name: 'a bamboo shelf', description: 'Open bamboo shelving holds a collection of ceramic tea bowls and a small bonsai tree, long dead but still artfully shaped.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'floor zaisu chairs',
          capacity: 2,
          emptyMsg: 'Legless zaisu floor chairs with cushioned backs are arranged around the low desk.',
          occupiedMsg: '%s seated on a zaisu floor chair.',
        },
      ],
    },

    '%B1_z13': {
      name: 'Smith Tower - 13th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 13,
      exits: { south: '%B2_z13' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 13).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a cedar ladder', description: 'A simple cedar ladder leads to the mezzanine sleeping platform, its rungs worn smooth with use. Rope bindings hold the joints.', boltedDown: true },
        { prototype: 'bed', name: 'an elevated futon', description: 'A thick shikibuton futon lies on the tatami-covered mezzanine platform, with a light silk kakebuton quilt draped over it.', quality: 'standard' },
        { prototype: 'furniture', name: 'an engawa bench', description: 'A low wooden engawa bench sits beneath the mezzanine, designed for contemplation. Its simple design emphasizes the grain of the cypress wood.', boltedDown: false },
        { prototype: 'table', name: 'a hibachi brazier', description: 'A small hibachi charcoal brazier on a low stand sits cold and unused, its copper basin green with patina.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the engawa bench',
          capacity: 2,
          emptyMsg: 'The cypress bench offers a place for seated meditation.',
          occupiedMsg: '%s seated on the engawa bench.',
        },
        {
          name: 'the elevated futon',
          capacity: 1,
          emptyMsg: 'The loft futon is visible above, covered in faded silk.',
          occupiedMsg: '%s resting on the loft futon.',
        },
      ],
    },

    '%C1_z13': {
      name: 'Smith Tower - 13th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 13,
      exits: { south: '%C2_z13', east: '%EL_z13' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 13).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a simple futon', description: 'A thin futon mattress lies on the tatami floor, barely wide enough for one person. A cylindrical wooden pillow rests at its head.', quality: 'cheap' },
        { prototype: 'furniture', name: 'bamboo wall pegs', description: 'Simple bamboo pegs are mounted on the wall for hanging garments and bags, their natural texture worn smooth.', boltedDown: true },
        { prototype: 'furniture', name: 'a floating shelf', description: 'A single floating shelf in natural wood holds a small ceramic incense burner and a carved wooden Buddha figure.', boltedDown: true },
        { prototype: 'furniture', name: 'a meditation cushion', description: 'A round zafu meditation cushion in faded saffron sits in the corner, stuffed with kapok that has compressed over the years.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the zafu cushion',
          capacity: 1,
          emptyMsg: 'The meditation cushion waits in the corner for contemplation.',
          occupiedMsg: '%s seated in meditation on the zafu.',
        },
      ],
    },

    '%B2_z13': {
      name: 'Smith Tower - 13th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 13,
      exits: {
        north: '%B1_z13',
        east: '%B3_z13',
        west: { room: '%EL_z13', door: '%D_B2_z13' },
        south: '%B4_z13',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 13).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a low platform sofa', description: 'A low wooden platform with thick cushions upholstered in natural linen serves as seating, surrounded by scattered zabuton for extra guests.', boltedDown: false },
        { prototype: 'table', name: 'a kotatsu table', description: 'A low kotatsu table with a blanket-covered frame sits in the center. The electric heater beneath is long dead, but the blanket offers psychological warmth.', boltedDown: false },
        { prototype: 'furniture', name: 'a butsudan cabinet', description: 'A small butsudan altar cabinet is built into the wall, its doors closed. Inside, dust covers the offerings and the small Buddha figure.', boltedDown: true },
        { prototype: 'furniture', name: 'a genkan entry', description: 'A small genkan entry area with a slightly lower floor level has a row of cubbies for shoes, all empty now.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the platform sofa',
          capacity: 4,
          emptyMsg: 'The low platform offers comfortable floor-level seating with ample cushions.',
          occupiedMsg: '%s settled onto the platform sofa.',
        },
      ],
    },

    '%B3_z13': {
      name: 'Smith Tower - 13th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 13,
      exits: { west: '%B2_z13' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 13).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'stepped tansu shelving', description: 'Built-in tansu-style stepped shelving with alternating drawers and open compartments lines the walls, holding books in Japanese binding and ceramic tea ware.', boltedDown: true },
        { prototype: 'table', name: 'a low writing desk', description: 'A black-lacquered writing desk barely six inches off the floor sits in the window bay. An inkstone, brushes, and a roll of rice paper remain from the previous occupant.', boltedDown: false },
        { prototype: 'furniture', name: 'a shoji floor lamp', description: 'A floor lamp made of bent bamboo with a washi paper shade stands in the corner, its form organic and artful even in darkness.', boltedDown: false },
        { prototype: 'furniture', name: 'ikebana vases', description: 'Several ceramic vases designed for ikebana flower arrangement sit on the shelves, their dried arrangements now brittle sculptural relics.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a zaisu chair',
          capacity: 1,
          emptyMsg: 'A legless zaisu chair with a backrest waits at the writing desk.',
          occupiedMsg: '%s seated at the writing desk.',
        },
        {
          name: 'meditation cushions',
          capacity: 2,
          emptyMsg: 'Several zafu cushions are stacked in the corner for meditation.',
          occupiedMsg: '%s sitting in quiet contemplation.',
        },
      ],
    },

    '%C2_z13': {
      name: 'Smith Tower - 13th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 13,
      exits: { north: '%C1_z13', east: '%C3_z13' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 13).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a tatami platform', description: 'A raised tatami platform fills the corner by the window, designed for sitting or sleeping. The woven rush is faded but still fragrant.', boltedDown: true },
        { prototype: 'table', name: 'a natural wood side table', description: 'A small table made from a single cross-section of zelkova wood with its bark edge intact holds a ceramic cup and a book.', boltedDown: false },
        { prototype: 'furniture', name: 'a sudare blind', description: 'A bamboo sudare blind covers the window, its slats sun-bleached to pale gold. It filters the western light into stripes.', boltedDown: true },
        { prototype: 'furniture', name: 'a ceramic hibachi', description: 'A large ceramic hibachi brazier sits cold on the floor, designed for heat and atmosphere. Ash from its last fire remains undisturbed.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the tatami platform',
          capacity: 3,
          emptyMsg: 'The raised tatami platform offers floor-level seating with a view.',
          occupiedMsg: '%s relaxing on the tatami platform.',
        },
      ],
    },

    '%C3_z13': {
      name: 'Smith Tower - 13th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 13,
      exits: {
        north: { room: '%EL_z13', door: '%D_C3_z13' },
        west: '%C2_z13',
        east: '%C4_z13',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 13).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'an entry bench', description: 'A simple wooden bench in the genkan area offers a place to sit while removing shoes, its wood worn smooth with use.', boltedDown: false },
        { prototype: 'furniture', name: 'a getabako cabinet', description: 'A getabako shoe cabinet is built into the wall with slatted doors for ventilation. Inside, wooden shoe forms wait patiently.', boltedDown: true },
        { prototype: 'furniture', name: 'a noren curtain', description: 'A split noren curtain in faded indigo hangs in the doorway, its fabric printed with a wave pattern now barely visible.', boltedDown: true },
        { prototype: 'table', name: 'a key tray', description: 'A simple wooden tray on the console holds a collection of old keys and a small brass bell.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the entry bench',
          capacity: 2,
          emptyMsg: 'The wooden bench waits in the genkan for shoe removal.',
          occupiedMsg: '%s seated on the entry bench.',
        },
      ],
    },

    '%C4_z13': {
      name: 'Smith Tower - 13th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 13,
      exits: { west: '%C3_z13' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 13).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a tatami sleeping area', description: 'The alcove is floored with tatami mats and holds a thick shikibuton futon with a silk coverlet. Shoji screens can be slid closed for privacy.', quality: 'nice' },
        { prototype: 'furniture', name: 'a tansu wardrobe', description: 'A stepped tansu chest with iron handles serves as a wardrobe, its drawers holding neatly folded garments that smell of cedar.', boltedDown: true },
        { prototype: 'furniture', name: 'a round hand mirror', description: 'A simple hand mirror in a bamboo frame hangs on the wall, its glass clouded but still functional.', boltedDown: true },
        { prototype: 'table', name: 'an andon lamp table', description: 'A small table holds an andon paper lantern lamp, its wooden frame delicate and its paper shade yellowed.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the tatami sleeping area',
          capacity: 2,
          emptyMsg: 'The sleeping alcove awaits behind its shoji screens.',
          occupiedMsg: '%s resting in the tatami sleeping area.',
        },
      ],
    },

    '%B4_z13': {
      name: 'Smith Tower - 13th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 13,
      exits: { north: '%B2_z13' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 13).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a oshiire futon closet', description: 'The wall conceals an oshiire closet where the futon is stored during the day. Currently unrolled on the tatami, the thick cotton mattress offers simple comfort.', quality: 'standard' },
        { prototype: 'furniture', name: 'an oshiire closet', description: 'A built-in oshiire closet with sliding fusuma doors stores bedding and seasonal items. The paper doors are painted with a subtle bamboo grove motif.', boltedDown: true },
        { prototype: 'furniture', name: 'open timber shelving', description: 'Simple open shelving in natural timber frames the window, holding a collection of tea ware and folded textiles.', boltedDown: true },
        { prototype: 'table', name: 'a foldable chabudai', description: 'A small chabudai table with folding legs sits against the wall, ready to be set up for meals or work.', boltedDown: false },
        { prototype: 'furniture', name: 'a mizuya cabinet', description: 'A small mizuya tea cabinet holds cups, a teapot, and dried tea leaves in ceramic containers.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the unrolled futon',
          capacity: 2,
          emptyMsg: 'The futon lies unrolled on the tatami, simple and welcoming.',
          occupiedMsg: '%s resting on the futon.',
        },
      ],
    },
  },
};
