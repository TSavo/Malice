// Smith Tower - Condo Floor (z=23) - Bohemian/Hippie Theme
// Macramé, floor cushions, tapestries, incense, tie-dye, peacock chairs, crystals, dream catchers

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z23' },
    },

    // Rentable locks
    '%RL_A2_z23': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z23': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z23': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z23': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z23'],
    },
    '%D_B2_z23': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z23'],
    },
    '%D_C3_z23': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z23'],
    },

    // Elevator landing
    '%EL_z23': {
      name: 'Smith Tower - 23th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 23,
      exits: {
        north: { room: '%A2_z23', door: '%D_A2_z23' },
        east: { room: '%B2_z23', door: '%D_B2_z23' },
        south: { room: '%C3_z23', door: '%D_C3_z23' },
        west: '%C1_z23',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z23': {
      name: 'Smith Tower - 23th Floor - North Suite - Living Room',
      description:
        "A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone's life—books, decorative objects, a dead potted plant.",
      x: -3,
      y: 11,
      z: 23,
      exits: { east: '%A2_z23' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 23).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a carved wooden mandala table',
          description:
            "A low round table with an intricate mandala pattern carved into its surface sits at the room's center. Candle wax has dripped into the grooves, creating colorful rivers of hardened paraffin.",
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a bohemian kitchenette',
          description:
            'A built-in kitchenette features hand-painted cabinet doors in swirling psychedelic patterns. Bundles of dried herbs hang from hooks beneath the cabinets, their scent long faded.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a macramé wall hanging',
          description:
            'An elaborate macramé wall hanging spans nearly the entire wall, its knotted cotton strands woven with wooden beads and feathers. Dusty but intact.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'crystal display shelf',
          description:
            'A shelf mounted near the window holds an array of crystals—amethyst clusters, rose quartz spheres, and selenite wands—all dulled by dust but still catching light.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a pile of floor cushions',
          capacity: 4,
          emptyMsg:
            'A heap of embroidered floor cushions in jewel tones spills across one corner, their silk covers faded but still rich.',
          occupiedMsg: '%s sprawled among the floor cushions.',
        },
        {
          name: 'a rattan peacock chair',
          capacity: 1,
          emptyMsg:
            'A dramatic peacock chair with a fanned rattan back holds court in the corner, draped with a faded tie-dye throw.',
          occupiedMsg: '%s enthroned in the peacock chair.',
        },
      ],
    },

    '%A2_z23': {
      name: 'Smith Tower - 23rd Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. Tapestries cover the walls in rich reds and purples, and a dream catcher hangs in the window, its feathers stirring with any breeze.',
      x: -2,
      y: 11,
      z: 23,
      exits: {
        west: '%A1_z23',
        east: '%A3_z23',
        south: { room: '%EL_z23', door: '%D_A2_z23' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 23).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a low platform bed with canopy',
          description:
            'A low wooden platform bed is draped with sheer fabric in sunset colors, creating a gauzy canopy. Moroccan-style pillows in embroidered silk are piled against the headboard.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a beaded curtain closet',
          description:
            'The built-in closet is hidden behind cascading strands of wooden beads and glass crystals that click softly with any movement of air.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a carved elephant nightstand',
          description:
            'A wooden nightstand carved to resemble an elephant holds an incense burner shaped like a lotus flower. The ash inside is decades old.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a dream catcher',
          description:
            'A large dream catcher hangs in the window, its web woven with turquoise beads and wrapped in leather. Hawk feathers dangle from the bottom.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the platform bed',
          capacity: 2,
          emptyMsg:
            'The canopy bed awaits beneath its gossamer drapes, silk pillows inviting rest.',
          occupiedMsg: '%s resting on the platform bed.',
        },
      ],
    },

    '%A3_z23': {
      name: 'Smith Tower - 23rd Floor - North Suite - Studio',
      description:
        'A long studio awash in tie-dye and tapestries. Prayer flags are strung across the ceiling beams, their faded colors still vibrant against the exposed brick. The space smells faintly of old patchouli.',
      x: -1,
      y: 11,
      z: 23,
      exits: { west: '%A2_z23' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 23).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a hippie galley kitchen',
          description:
            'A narrow galley kitchen features cabinet doors painted with peace symbols and sunflowers. Dried herbs hang from the ceiling, and a collection of handmade pottery mugs lines the counter.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a low tea table',
          description:
            'A low wooden tea table is set for a ceremony that never came, with ceramic cups and a cast iron teapot covered in dust. Meditation cushions surround it.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'prayer flags',
          description:
            'Tibetan prayer flags are strung across the ceiling beams, their blues, whites, reds, greens, and yellows faded but still carrying their mantras.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a lava lamp collection',
          description:
            'A row of lava lamps in various colors sits on a shelf, their wax long since solidified into bizarre shapes. One might still work.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'a meditation cushion pile',
          capacity: 3,
          emptyMsg:
            'Round meditation cushions in saffron and burgundy are arranged around the tea table.',
          occupiedMsg: '%s seated cross-legged on the cushions.',
        },
        {
          name: 'a hanging basket chair',
          capacity: 1,
          emptyMsg:
            'A woven basket chair hangs from a ceiling hook, lined with a sheepskin throw.',
          occupiedMsg: '%s swaying gently in the hanging chair.',
        },
      ],
    },

    '%B1_z23': {
      name: 'Smith Tower - 23rd Floor - East Suite - Loft',
      description:
        'A lofted corner with string lights wound around the ceiling beams and a compact mezzanine draped in Indian block-print fabrics. The space feels like a secret treehouse for flower children.',
      x: 0,
      y: 11,
      z: 23,
      exits: { south: '%B2_z23' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 23).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a rope ladder',
          description:
            'A rope ladder with wooden rungs is tied to the mezzanine edge, leading up to the sleeping loft. Macramé plant hangers dangle nearby.',
          boltedDown: true,
        },
        {
          prototype: 'bed',
          name: 'a loft nest',
          description:
            'The mezzanine is filled with layered mattresses, quilts, and pillows creating a cozy nest. A tie-dye tapestry serves as a canopy.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a bean bag collection',
          description:
            'Several oversized bean bags in earth tones are scattered beneath the mezzanine, their vinyl faded but still holding their shape.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a tree stump coffee table',
          description:
            'A massive tree stump, polished smooth on top, serves as a coffee table. Candle stubs in various colors ring its surface.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the bean bags',
          capacity: 3,
          emptyMsg:
            'The bean bags sprawl beneath the mezzanine, inviting lounging.',
          occupiedMsg: '%s sunk into a bean bag.',
        },
        {
          name: 'the loft nest',
          capacity: 2,
          emptyMsg:
            'The loft nest is visible above, accessible by rope ladder.',
          occupiedMsg: '%s nested up in the loft.',
        },
      ],
    },

    '%C1_z23': {
      name: 'Smith Tower - 23rd Floor - South Suite - Alcove',
      description:
        'A snug unit transformed into a meditation nook. Tapestries cover every wall in rich jewel tones, and the frosted window filters light through a sun-catcher crystal.',
      x: -3,
      y: 10,
      z: 23,
      exits: { south: '%C2_z23', east: '%EL_z23' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 23).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a floor mattress with tapestry',
          description:
            'A thin mattress is laid directly on the floor, covered in a woven Guatemalan blanket. A meditation cushion sits at its head.',
          quality: 'cheap',
        },
        {
          prototype: 'furniture',
          name: 'macramé hanging hooks',
          description:
            'A row of hooks is mounted on the wall, draped with small macramé pouches and a string of prayer beads.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a crystal sun-catcher',
          description:
            'A large crystal prism hangs in the window, its facets designed to scatter rainbows across the room when light hits it.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'an incense altar',
          description:
            'A small shelf holds an altar of incense sticks, a Buddha statue, and a brass singing bowl, all covered in a fine layer of dust.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the floor mattress',
          capacity: 1,
          emptyMsg:
            'The floor mattress waits beneath its colorful blanket, meditation cushion at the ready.',
          occupiedMsg: '%s resting on the floor mattress.',
        },
      ],
    },

    '%B2_z23': {
      name: 'Smith Tower - 23rd Floor - East Suite - Living Room',
      description:
        'A two-room suite draped in flowing fabrics and woven textures. Batik prints hang from the ceiling, and the air holds the ghost of patchouli and sandalwood. This was clearly a gathering space for seekers.',
      x: -1,
      y: 10,
      z: 23,
      exits: {
        north: '%B1_z23',
        east: '%B3_z23',
        west: { room: '%EL_z23', door: '%D_B2_z23' },
        south: '%B4_z23',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 23).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a massive floor pillow pit',
          description:
            'The center of the room is dominated by a sunken arrangement of enormous floor pillows in paisley and velvet, creating a conversation pit for communal gatherings.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a Moroccan brass tray table',
          description:
            "A large brass tray table with intricate hammered patterns sits at the pit's center. Candle wax has pooled in its depressions.",
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a record player cabinet',
          description:
            'A wooden cabinet holds an old record player, its turntable dusty. Vinyl records lean against it in worn sleeves—Grateful Dead, Joni Mitchell, Ravi Shankar.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'hanging tapestries',
          description:
            'Batik tapestries in swirling patterns of orange, purple, and gold hang from the walls and ceiling, creating a fabric cave effect.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the pillow pit',
          capacity: 5,
          emptyMsg:
            'The sunken pillow pit invites communal lounging, its paisley and velvet cushions scattered invitingly.',
          occupiedMsg: '%s sunk into the pillow pit.',
        },
      ],
    },

    '%B3_z23': {
      name: 'Smith Tower - 23rd Floor - East Suite - Den',
      description:
        'A narrow end unit converted into a spiritual library. The built-in shelves overflow with books on astrology, tarot, Eastern philosophy, and consciousness expansion. Crystals cluster on every surface.',
      x: 0,
      y: 10,
      z: 23,
      exits: { west: '%B2_z23' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 23).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'esoteric bookshelves',
          description:
            'Floor-to-ceiling bookshelves hold worn paperbacks on tarot, astrology, Ram Dass, Carlos Castaneda, and Tibetan Buddhism. Crystal clusters sit atop each shelf.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a tarot reading table',
          description:
            'A round table covered in a purple velvet cloth is set up for tarot readings. A faded Rider-Waite deck sits in the center, cards scattered.',
          boltedDown: false,
        },
        {
          prototype: 'chair',
          name: 'a wicker throne chair',
          description:
            "A high-backed wicker chair with a peacock fan design serves as the reader's seat. Cushions in deep purple are piled on its seat.",
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a salt lamp',
          description:
            'A large Himalayan salt lamp sits on a shelf, its pinkish crystal dark but still emanating a faint mineral scent.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the wicker throne',
          capacity: 1,
          emptyMsg:
            'The wicker throne awaits the reader, purple cushions inviting.',
          occupiedMsg: '%s seated in the wicker throne.',
        },
        {
          name: 'a floor cushion',
          capacity: 2,
          emptyMsg:
            'Large floor cushions sit opposite the throne for querants.',
          occupiedMsg: '%s seated on a floor cushion.',
        },
      ],
    },

    '%C2_z23': {
      name: 'Smith Tower - 23rd Floor - South Suite - Living Room',
      description:
        "A corner unit transformed into an artist's commune. Canvases lean against every wall, paint-spattered and half-finished. The western light pours through windows hung with tie-dyed curtains.",
      x: -3,
      y: 9,
      z: 23,
      exits: { north: '%C1_z23', east: '%C3_z23' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 23).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a velvet fainting couch',
          description:
            'A Victorian fainting couch reupholstered in deep purple velvet sits beneath the window. Its curves are both dramatic and surprisingly comfortable.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a painted spool table',
          description:
            'A large wooden spool that once held industrial cable has been painted with mandalas and serves as a coffee table. Paint jars still sit atop it.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a radiator with painted cover',
          description:
            'An old steam radiator is hidden behind a cover painted with swirling psychedelic patterns in orange and pink.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'tie-dye curtains',
          description:
            'Homemade tie-dye curtains in spiraling rainbows hang from the windows, sun-bleached but still vibrant where the fabric folds.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the fainting couch',
          capacity: 2,
          emptyMsg:
            'The purple velvet fainting couch catches the afternoon light dramatically.',
          occupiedMsg: '%s draped across the fainting couch.',
        },
      ],
    },

    '%C3_z23': {
      name: 'Smith Tower - 23rd Floor - South Suite - Foyer',
      description:
        'The entrance to the C block, its doorway hung with a beaded curtain that clicks and sways. Hand-painted peace symbols decorate the walls, and a shoe rack overflows with dusty sandals.',
      x: -2,
      y: 9,
      z: 23,
      exits: {
        north: { room: '%EL_z23', door: '%D_C3_z23' },
        west: '%C2_z23',
        east: '%C4_z23',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 23).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a bamboo shoe bench',
          description:
            'A bamboo bench with woven seat serves for removing shoes. Dusty Birkenstocks and leather sandals are scattered beneath it.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a beaded curtain closet',
          description:
            'The entry closet is hidden behind a curtain of wooden beads and glass baubles that click musically with any movement.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'peace symbol murals',
          description:
            'Peace symbols, yin-yangs, and third-eye motifs are painted directly on the walls in faded but cheerful colors.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a driftwood console',
          description:
            'A console table made from a piece of polished driftwood holds a collection of stones, feathers, and a dusty bowl for keys.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the bamboo bench',
          capacity: 2,
          emptyMsg: 'The bamboo bench waits for guests to remove their shoes.',
          occupiedMsg: '%s sitting on the bamboo bench.',
        },
      ],
    },

    '%C4_z23': {
      name: 'Smith Tower - 23rd Floor - South Suite - Bedroom',
      description:
        'A deep bedroom transformed into a bohemian boudoir. The recessed alcove is draped in sheer fabrics and fairy lights, while Indian textile wall hangings soften every surface.',
      x: -1,
      y: 9,
      z: 23,
      exits: { west: '%C3_z23' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 23).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a canopy floor bed',
          description:
            'A low platform bed fills the alcove, draped in sheer fabrics and strung with fairy lights that no longer work. Silk pillows in jewel tones are piled high.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a vintage trunk wardrobe',
          description:
            'A battered steamer trunk serves as both storage and statement piece, covered in travel stickers and peace symbols. Scarves spill from its half-open lid.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a beaded mirror',
          description:
            'A full-length mirror is framed with strands of beads, feathers, and dried flowers, creating an altar-like effect.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a carved elephant stool',
          description:
            'A wooden stool carved to resemble an elephant serves as a nightstand. A sandalwood incense holder and a worn copy of "Be Here Now" sit atop it.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the canopy bed',
          capacity: 2,
          emptyMsg:
            'The canopy bed waits in its alcove, draped in sheer romance.',
          occupiedMsg: '%s nestled in the canopy bed.',
        },
      ],
    },

    '%B4_z23': {
      name: 'Smith Tower - 23rd Floor - East Suite - Bedroom',
      description:
        'A compact bedroom converted into a creative sanctuary. Every surface is covered in tapestries, and the built-in shelving holds jars of dried flowers, crystals, and hand-bound journals.',
      x: 0,
      y: 9,
      z: 23,
      exits: { north: '%B2_z23' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 23).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a fold-down tapestry bed',
          description:
            'A fold-down bed is hidden behind a large woven tapestry depicting a mandala. When lowered, it reveals layers of colorful quilts and embroidered pillows.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a tapestry-covered cabinet',
          description:
            'The Murphy bed mechanism is hidden behind a floor-to-ceiling tapestry showing the Tree of Life. Pulling the tapestry aside reveals the fold-down bed.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'apothecary shelving',
          description:
            'Built-in shelving holds glass jars of dried herbs, crystals, seed pods, and hand-labeled tinctures. A mortar and pestle sits among them.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a fold-down altar desk',
          description:
            "A fold-down desk doubles as an altar when raised, with a small Buddha, candles, and offerings space. When lowered, it's a writing surface.",
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a painted dresser',
          description:
            'A narrow dresser has been hand-painted with flowers, moons, and stars in a folk art style. Crystals sit atop it like sentinels.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the tapestry bed',
          capacity: 2,
          emptyMsg:
            'The tapestry bed is folded down, revealing its colorful quilt layers.',
          occupiedMsg: '%s cocooned in the tapestry bed.',
        },
      ],
    },
  },
};
