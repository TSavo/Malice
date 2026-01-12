// Smith Tower - Condo Floor (z=30) - Asian Fusion Theme
// Shoji screens, tatami mats, tansu chests, Chinese ceramics, lacquered furniture

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z30' },
    },

    // Rentable locks
    '%RL_A2_z30': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z30': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z30': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z30': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z30'],
    },
    '%D_B2_z30': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z30'],
    },
    '%D_C3_z30': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z30'],
    },

    // Elevator landing
    '%EL_z30': {
      name: 'Smith Tower - 30th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 30,
      exits: {
        north: { room: '%A2_z30', door: '%D_A2_z30' },
        east: { room: '%B2_z30', door: '%D_B2_z30' },
        south: { room: '%C3_z30', door: '%D_C3_z30' },
        west: '%C1_z30',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z30': {
      name: 'Smith Tower - 30th Floor - North Suite - Living Room',
      description:
        "A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone's life—books, decorative objects, a dead potted plant.",
      x: -3,
      y: 11,
      z: 30,
      exits: { east: '%A2_z30' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 30).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a low kotatsu table',
          description:
            'A traditional kotatsu table sits in the center of the room, its lacquered surface dulled by age. The heating element beneath is long dead, but the quilted blanket tucked around its edges remains intact.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a built-in kitchenette',
          description:
            'A compact kitchenette runs along one wall, its cabinets decorated with brushed brass pulls in a bamboo motif. The small sink and burners are cold and dry.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a shoji screen room divider',
          description:
            'A four-panel shoji screen with rice paper panels divides the living area. Several panels are torn, letting light filter through in ragged patterns.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a Chinese calligraphy scroll',
          description:
            'A vertical scroll hangs on the wall, its brushwork characters faded but still legible. The mounting silk has yellowed with age.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'silk floor cushions',
          capacity: 4,
          emptyMsg:
            'Several silk zabuton cushions are arranged around the kotatsu, their embroidered surfaces worn smooth.',
          occupiedMsg: '%s seated on the floor cushions.',
        },
      ],
    },

    '%A2_z30': {
      name: 'Smith Tower - 30th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 30,
      exits: {
        west: '%A1_z30',
        east: '%A3_z30',
        south: { room: '%EL_z30', door: '%D_A2_z30' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 30).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a tatami platform bed',
          description:
            'A low platform bed rests on tatami mat flooring, its simple wooden frame darkened with age. A silk duvet in faded crane patterns covers the thin futon mattress.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a tansu step chest',
          description:
            'A traditional Japanese tansu chest with asymmetrical drawers serves as both storage and display. The ironwork handles are tarnished but intact.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a mirrored closet',
          description:
            'Built-in closet doors with age-spotted mirrors run the length of one wall. Inside, a few silk robes hang alongside empty wooden hangers.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a lacquered nightstand',
          description:
            'A small black-lacquered nightstand holds a paper lantern lamp and a ceramic incense holder, both coated in dust.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the platform bed',
          capacity: 2,
          emptyMsg:
            'The low platform bed waits, its silk covering smoothed flat.',
          occupiedMsg: '%s resting on the platform bed.',
        },
      ],
    },

    '%A3_z30': {
      name: 'Smith Tower - 30th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 30,
      exits: { west: '%A2_z30' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 30).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a galley kitchen with bamboo accents',
          description:
            'A narrow galley kitchen features bamboo drawer fronts and ceramic tile counters with a wave pattern. The appliances are silent, the gas disconnected years ago.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a Ming-style writing desk',
          description:
            'An elegant horseshoe-back writing desk in dark rosewood sits beneath the window. Ink stains mark the leather blotter, and a dried-out brush rests in a porcelain holder.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a folding futon',
          description:
            'A simple wooden futon frame holds a cotton shikibuton mattress, currently folded into a low couch configuration. The fabric shows wear but no tears.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a dead bonsai tree',
          description:
            'A once-magnificent juniper bonsai sits on a carved wooden stand, its branches now bare and brittle. The shallow ceramic pot is cracked.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the futon',
          capacity: 2,
          emptyMsg:
            'The futon sits folded in couch position, cushions compressed.',
          occupiedMsg: '%s lounging on the futon.',
        },
        {
          name: 'a horseshoe-back chair',
          capacity: 1,
          emptyMsg:
            'A Ming-style horseshoe-back chair sits at the writing desk, its curved armrest worn smooth.',
          occupiedMsg: '%s seated at the writing desk.',
        },
      ],
    },

    '%B1_z30': {
      name: 'Smith Tower - 30th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 30,
      exits: { south: '%B2_z30' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 30).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a bamboo loft ladder',
          description:
            'A sturdy bamboo ladder with rope bindings leads up to the sleeping loft. The rungs are worn smooth from years of climbing.',
          boltedDown: true,
        },
        {
          prototype: 'bed',
          name: 'a loft futon',
          description:
            'A traditional shikibuton futon lies flat on the mezzanine floor, covered with a faded indigo quilt. The low ceiling requires ducking.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a pair of ceramic ginger jars',
          description:
            'Two large blue-and-white ginger jars flank the ladder base, their lids missing. One has a crack running down its side.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a low chabudai table',
          description:
            'A folding chabudai table sits beneath the mezzanine, surrounded by flat cushions. Tea stains mark its lacquered surface.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the chabudai cushions',
          capacity: 4,
          emptyMsg:
            'Flat zabuton cushions surround the low table, arranged for conversation.',
          occupiedMsg: '%s seated at the chabudai.',
        },
        {
          name: 'the loft futon',
          capacity: 2,
          emptyMsg:
            'The futon is visible in the loft above, accessible by ladder.',
          occupiedMsg: '%s resting in the loft.',
        },
      ],
    },

    '%C1_z30': {
      name: 'Smith Tower - 30th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 30,
      exits: { south: '%C2_z30', east: '%EL_z30' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 30).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a roll-up tatami mat',
          description:
            'A thin tatami sleeping mat lies directly on the floor, a buckwheat pillow at its head. Monastic in its simplicity.',
          quality: 'cheap',
        },
        {
          prototype: 'furniture',
          name: 'wall-mounted bamboo hooks',
          description:
            'A row of bamboo hooks is mounted on the wall, designed for hanging robes and bags. A faded silk obi dangles from one.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a small tokonoma alcove',
          description:
            'A recessed tokonoma alcove is built into the wall, displaying a cracked ceramic vase and a scroll with water damage.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a paper lantern',
          description:
            'A collapsed paper lantern hangs from a hook in the ceiling, its bamboo ribs broken and the rice paper torn.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the tatami mat',
          capacity: 1,
          emptyMsg: 'The tatami mat lies flat, offering austere rest.',
          occupiedMsg: '%s seated on the tatami.',
        },
      ],
    },

    '%B2_z30': {
      name: 'Smith Tower - 30th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 30,
      exits: {
        north: '%B1_z30',
        east: '%B3_z30',
        west: { room: '%EL_z30', door: '%D_B2_z30' },
        south: '%B4_z30',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 30).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a Chinese daybed',
          description:
            'A traditional Chinese daybed with carved wooden railings dominates the room, its silk cushions faded from red to dusty pink. It serves as both seating and lounging area.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a red lacquered coffee table',
          description:
            'A low table in crackled red lacquer sits before the daybed, its surface decorated with gold-leaf chrysanthemums now mostly worn away.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a tall lacquered cabinet',
          description:
            'A black lacquered cabinet with brass butterfly hinges stands against one wall. Its doors hang slightly open, revealing empty shelves within.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'an entry shoe cabinet',
          description:
            'A low wooden cabinet near the entrance was meant for removing shoes. Several pairs of worn slippers remain inside.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a Japanese woodblock print',
          description:
            'A framed ukiyo-e print depicts a wave under Mount Fuji. The colors have faded but the composition remains striking.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the Chinese daybed',
          capacity: 3,
          emptyMsg:
            'The daybed sprawls elegantly, its carved railings framing faded silk cushions.',
          occupiedMsg: '%s reclining on the daybed.',
        },
      ],
    },

    '%B3_z30': {
      name: 'Smith Tower - 30th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 30,
      exits: { west: '%B2_z30' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 30).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'built-in display shelves',
          description:
            'Built-in shelving holds a collection of Asian antiquities—jade figurines, ceramic bowls, and a bronze Buddha with a missing hand.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: "a scholar's desk",
          description:
            "A traditional Chinese scholar's desk in elmwood sits in the window bay. The Four Treasures—brush, ink, paper, and inkstone—are arranged on its surface, all dried and unusable.",
          boltedDown: false,
        },
        {
          prototype: 'chair',
          name: 'a yoke-back armchair',
          description:
            'A classic Chinese yoke-back chair in dark huanghuali wood sits at the desk. The woven seat shows wear but holds firm.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a carved jade ornament',
          description:
            'A pale green jade carving of a qilin sits on a rosewood stand. The mythical creature is missing one antler.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the yoke-back chair',
          capacity: 1,
          emptyMsg: "The elegant huanghuali chair waits at the scholar's desk.",
          occupiedMsg: "%s seated at the scholar's desk.",
        },
        {
          name: 'a meditation cushion',
          capacity: 1,
          emptyMsg:
            'A round zafu meditation cushion sits in the corner by the window.',
          occupiedMsg: '%s sitting in meditation.',
        },
      ],
    },

    '%C2_z30': {
      name: 'Smith Tower - 30th Floor - South Suite - Living Room',
      description:
        'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 30,
      exits: { north: '%C1_z30', east: '%C3_z30' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 30).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a bamboo settee',
          description:
            'A Chinese bamboo settee with silk cushions faces the window. The bamboo is darkened with age, the silk sun-bleached to ivory.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a round drum table',
          description:
            'A Chinese drum table in carved rosewood serves as an end table. Its surface is ringed with old water stains.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a radiator with carved screen',
          description:
            'An old steam radiator is hidden behind a carved wooden screen with a geometric fretwork pattern. Warmth still radiates through.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'silk curtains',
          description:
            'Heavy silk curtains in a plum blossom pattern hang from brass rods. The sun has bleached them to near-white on the window side.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a ceramic umbrella stand',
          description:
            'A tall blue-and-white ceramic umbrella stand sits by the door, holding two broken paper parasols.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the bamboo settee',
          capacity: 2,
          emptyMsg:
            'The bamboo settee faces the pale afternoon light, its cushions sun-faded.',
          occupiedMsg: '%s relaxing on the settee.',
        },
      ],
    },

    '%C3_z30': {
      name: 'Smith Tower - 30th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 30,
      exits: {
        north: { room: '%EL_z30', door: '%D_C3_z30' },
        west: '%C2_z30',
        east: '%C4_z30',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 30).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'an opium-style daybed',
          description:
            'A narrow Chinese opium-style daybed sits against the wall, its black lacquer chipped at the edges. A cylindrical neck pillow remains.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'an entry cabinet',
          description:
            'A small tansu-style cabinet is built into the wall beside the door, designed for storing shoes and outdoor items.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a bronze door knocker',
          description:
            'A decorative bronze door knocker in the shape of a foo dog is mounted on the door, tarnished to a deep patina.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a red lacquer console',
          description:
            'A narrow console table in worn red lacquer holds a ceramic bowl for keys and a small bronze bell.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the opium daybed',
          capacity: 2,
          emptyMsg:
            'The narrow daybed offers a place to recline while removing shoes.',
          occupiedMsg: '%s lounging on the opium daybed.',
        },
      ],
    },

    '%C4_z30': {
      name: 'Smith Tower - 30th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 30,
      exits: { west: '%C3_z30' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 30).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a canopy platform bed',
          description:
            'A low platform bed with a simple wooden canopy frame fills the alcove. Sheer silk panels hang from the frame, most now torn or missing.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a Korean clothing chest',
          description:
            'A traditional Korean bandaji chest with iron hardware serves as storage. Its hinged front panel drops down to reveal interior drawers.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a wall-mounted silk painting',
          description:
            'A horizontal silk painting of misty mountains hangs on the wall. The silk has water stains at one corner but the brushwork remains visible.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a pair of matching nightstands',
          description:
            'Two small tables in black lacquer flank the bed, each holding a ceramic oil lamp with a cracked glass chimney.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the canopy bed',
          capacity: 2,
          emptyMsg:
            'The canopy bed waits in its alcove, silk panels stirring in the draft.',
          occupiedMsg: '%s resting beneath the canopy.',
        },
      ],
    },

    '%B4_z30': {
      name: 'Smith Tower - 30th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 30,
      exits: { north: '%B2_z30' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 30).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a fold-away futon',
          description:
            'A tri-fold shikibuton futon can be stored in a wall cabinet when not in use. Currently it lies unfolded on the floor, covered with a faded indigo quilt.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a futon storage cabinet',
          description:
            'A deep wall cabinet with sliding shoji-panel doors is designed to store the futon during the day. The rice paper panels are yellowed but intact.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'built-in tansu shelving',
          description:
            'Asymmetrical shelving in the tansu style is built into the walls, holding books, a cracked celadon vase, and a small bronze incense burner.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a fold-down tea shelf',
          description:
            'A hinged shelf folds down from the wall, creating a small surface for tea preparation. A cast-iron tetsubin teapot and two handleless cups remain.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a kimono rack',
          description:
            'A simple wooden kimono rack holds a faded blue yukata, its cotton fabric soft from many washings.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the futon',
          capacity: 2,
          emptyMsg:
            'The futon lies unfolded, its indigo covering faded at the edges.',
          occupiedMsg: '%s resting on the futon.',
        },
      ],
    },
  },
};
