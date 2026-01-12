// Smith Tower - 8th Floor Condos
// Bohemian artist loft theme - eclectic furniture, art supplies, kilim rugs, tapestries, creative chaos

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z8' },
    },

    // Rentable locks
    '%RL_A2_z8': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z8': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z8': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z8': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z8'],
    },
    '%D_B2_z8': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z8'],
    },
    '%D_C3_z8': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z8'],
    },

    // Elevator landing
    '%EL_z8': {
      name: 'Smith Tower - 8th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 8,
      exits: {
        north: { room: '%A2_z8', door: '%D_A2_z8' },
        east: { room: '%B2_z8', door: '%D_B2_z8' },
        south: { room: '%C3_z8', door: '%D_C3_z8' },
        west: '%C1_z8',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z8': {
      name: 'Smith Tower - 8th Floor - North Suite - Living Room',
      description:
        "A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone's life—books, decorative objects, a dead potted plant.",
      x: -3,
      y: 11,
      z: 8,
      exits: { east: '%A2_z8' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 8).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a steamer trunk coffee table',
          description:
            'A battered leather steamer trunk serves as a coffee table, its brass corners dented and labels from distant ports still visible.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a paint-spattered kitchenette',
          description:
            'The kitchenette is covered in drips and splatters of dried paint. Mason jars hold turpentine-stained brushes, and coffee cans overflow with palette knives.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a gallery wall',
          description:
            'Every inch of wall is covered with paintings, sketches, photos, and postcards. Some are framed, others simply tacked up, a riot of color and memory.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a macrame plant holder',
          description:
            'A macrame plant holder dangles from the ceiling, its pot holding the dried remains of something once green.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a kilim-covered daybed',
          capacity: 3,
          emptyMsg:
            'A low daybed covered in layered kilim rugs and Moroccan pillows sprawls against the wall.',
          occupiedMsg: '%s lounging on the kilim daybed.',
        },
      ],
    },

    '%A2_z8': {
      name: 'Smith Tower - 8th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 8,
      exits: {
        west: '%A1_z8',
        east: '%A3_z8',
        south: { room: '%EL_z8', door: '%D_A2_z8' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 8).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a floor mattress',
          description:
            'A mattress lies directly on the floor, surrounded by stacks of art books and crumpled sketches. Indian print fabric drapes over the headboard area.',
          quality: 'cheap',
        },
        {
          prototype: 'furniture',
          name: 'a beaded curtain closet',
          description:
            'A built-in closet is hidden behind strands of wooden beads that click softly in any breeze. Inside, vintage dresses and paint-stained overalls hang together.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'an upturned crate nightstand',
          description:
            'A wooden fruit crate serves as a nightstand, holding melted candles, incense ash, and a collection of crystals and stones.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a silk sari canopy',
          description:
            'Lengths of faded silk saris are draped from the ceiling, creating a tent-like canopy over the sleeping area.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the floor mattress',
          capacity: 2,
          emptyMsg:
            'The mattress nest awaits among scattered cushions and art books.',
          occupiedMsg: '%s curled up on the floor mattress.',
        },
        {
          name: 'a meditation cushion',
          capacity: 1,
          emptyMsg:
            'A round zafu meditation cushion sits in a corner, worn shiny from use.',
          occupiedMsg: '%s sitting cross-legged on the meditation cushion.',
        },
      ],
    },

    '%A3_z8': {
      name: 'Smith Tower - 8th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 8,
      exits: { west: '%A2_z8' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 8).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: "a potter's kitchenette",
          description:
            'The kitchenette has been commandeered for pottery. A small kiln sits on the counter, bags of clay stacked beneath. The sink is permanently stained with slip.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a door-on-sawhorses table',
          description:
            'An old door laid across sawhorses serves as a massive work table, its surface carved with years of X-Acto cuts and paint rings.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a pottery wheel',
          description:
            'A kick-wheel pottery wheel sits near the window, dried clay crusted on its splash pan. Unfinished bowls wait on a nearby shelf.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'string light canopy',
          description:
            'Strings of fairy lights drape across the ceiling, dark now but suggesting cozy evenings of creative work.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a papasan chair',
          capacity: 1,
          emptyMsg:
            'A papasan chair with a faded batik cushion sits in the corner, perfect for reading.',
          occupiedMsg: '%s curled in the papasan chair.',
        },
        {
          name: 'floor cushions',
          capacity: 3,
          emptyMsg:
            'A pile of mismatched floor cushions creates a casual seating area.',
          occupiedMsg: '%s sprawled on the floor cushions.',
        },
      ],
    },

    '%B1_z8': {
      name: 'Smith Tower - 8th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 8,
      exits: { south: '%B2_z8' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 8).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a rope ladder',
          description:
            'A knotted rope ladder hangs from the mezzanine, swaying slightly. It looks like something from a treehouse.',
          boltedDown: true,
        },
        {
          prototype: 'bed',
          name: 'a hammock bed',
          description:
            'A wide canvas hammock is strung across the mezzanine space, piled with woven blankets and embroidered pillows.',
          quality: 'standard',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a hanging chair',
          description:
            'A wicker hanging chair suspended from a ceiling beam swings gently. A tattered patchwork quilt is draped over its cushion.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a milk crate bookshelf',
          description:
            'Stacked milk crates serve as bookshelves, stuffed with dog-eared paperbacks, vinyl records, and dried sage bundles.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the hanging chair',
          capacity: 1,
          emptyMsg: 'The wicker swing chair sways gently, waiting.',
          occupiedMsg: '%s swaying in the hanging chair.',
        },
        {
          name: 'the hammock bed',
          capacity: 2,
          emptyMsg:
            'The hammock stretches across the loft above, invitingly cocoon-like.',
          occupiedMsg: '%s swinging in the loft hammock.',
        },
      ],
    },

    '%C1_z8': {
      name: 'Smith Tower - 8th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 8,
      exits: { south: '%C2_z8', east: '%EL_z8' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 8).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a tatami mat',
          description:
            'A thin tatami sleeping mat with a buckwheat pillow. A rolled futon leans in the corner for colder nights.',
          quality: 'cheap',
        },
        {
          prototype: 'furniture',
          name: 'a driftwood hook rack',
          description:
            'A piece of driftwood has been mounted to the wall, nails driven in at angles to serve as hooks. Dream catchers and bead necklaces dangle from it.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'an altar shelf',
          description:
            'A small shelf holds a brass Buddha, incense holders, a singing bowl, and photos of departed loved ones. Wax has pooled from countless candles.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a woven wall hanging',
          description:
            'A large fiber art wall hanging in earthy tones dominates one wall, its warp threads trailing like an unfinished thought.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the tatami mat',
          capacity: 1,
          emptyMsg: 'The tatami mat waits, a space for rest or meditation.',
          occupiedMsg: '%s resting on the tatami mat.',
        },
      ],
    },

    '%B2_z8': {
      name: 'Smith Tower - 8th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 8,
      exits: {
        north: '%B1_z8',
        east: '%B3_z8',
        west: { room: '%EL_z8', door: '%D_B2_z8' },
        south: '%B4_z8',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 8).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a velvet thrift-store couch',
          description:
            'A massive velvet couch in faded purple, rescued from some thrift store. Its arms are worn, springs uneven, but it has character.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a cable spool table',
          description:
            'A large wooden cable spool serves as a coffee table, its surface covered in ring stains, candle wax, and carved initials.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a vintage record player',
          description:
            'An old console record player sits against the wall, a stack of vinyl LPs leaning beside it. The needle is probably shot.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a tapestry curtain',
          description:
            'An Indian tapestry with elephants and mandalas hangs over a closet door, its edges fraying but colors still vibrant.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the velvet couch',
          capacity: 4,
          emptyMsg:
            'The purple velvet couch sprawls invitingly, slightly lopsided but comfortable.',
          occupiedMsg: '%s sunk into the purple velvet.',
        },
      ],
    },

    '%B3_z8': {
      name: 'Smith Tower - 8th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 8,
      exits: { west: '%B2_z8' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 8).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'overflowing bookshelves',
          description:
            'Bookshelves are crammed with poetry collections, art theory, esoteric texts, and stacks of Zines. Books overflow onto the floor in precarious towers.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a drafting table',
          description:
            'A tilted drafting table faces the window, its surface covered in half-finished drawings, dried-out pens, and a jar of murky water.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: "an artist's stool",
          description:
            'A tall wooden stool with splatters of paint in every color sits before the drafting table.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a coat rack tree',
          description:
            'A bentwood coat rack tree holds scarves, vintage hats, and a moth-eaten fur stole.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'a beanbag chair',
          capacity: 1,
          emptyMsg:
            'A shapeless corduroy beanbag chair slumps in the corner, losing its beans.',
          occupiedMsg: '%s sinking into the beanbag.',
        },
        {
          name: "the artist's stool",
          capacity: 1,
          emptyMsg: 'The paint-spattered stool awaits at the drafting table.',
          occupiedMsg: "%s perched on the artist's stool.",
        },
      ],
    },

    '%C2_z8': {
      name: 'Smith Tower - 8th Floor - South Suite - Living Room',
      description:
        'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 8,
      exits: { north: '%C1_z8', east: '%C3_z8' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 8).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a wicker peacock chair',
          description:
            'A massive wicker peacock chair with a fan-shaped back dominates one corner. Its cushion is tie-dyed and stained.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a Moroccan tea table',
          description:
            'A brass Moroccan tea table with intricate hammered patterns sits low to the ground, surrounded by floor pillows.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a painted radiator',
          description:
            'The old radiator has been painted with swirling psychedelic patterns in blues and oranges.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'tie-dye curtains',
          description:
            'Tie-dyed curtains in sunset colors filter the western light into warm waves.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the peacock chair',
          capacity: 1,
          emptyMsg:
            'The wicker throne awaits, its fan back casting dramatic shadows.',
          occupiedMsg: '%s enthroned in the peacock chair.',
        },
        {
          name: 'floor pillows',
          capacity: 3,
          emptyMsg: 'Embroidered floor pillows surround the Moroccan table.',
          occupiedMsg: '%s lounging on the floor pillows.',
        },
      ],
    },

    '%C3_z8': {
      name: 'Smith Tower - 8th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 8,
      exits: {
        north: { room: '%EL_z8', door: '%D_C3_z8' },
        west: '%C2_z8',
        east: '%C4_z8',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 8).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a salvage church pew',
          description:
            'A short church pew painted turquoise serves as entry seating. LOVE is stenciled across its back in gold.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a bead curtain closet',
          description:
            'Strands of glass beads hang over the closet door, clicking musically. Vintage coats and capes are visible through the beads.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a peace sign sculpture',
          description:
            'A wire peace sign sculpture hangs above the door, strung with crystals that catch the light.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a potting bench console',
          description:
            'A repurposed potting bench serves as an entryway table, holding keys in a clay pot and a collection of found feathers.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the church pew',
          capacity: 3,
          emptyMsg:
            'The turquoise pew offers humble seating beneath the word LOVE.',
          occupiedMsg: '%s seated on the painted church pew.',
        },
      ],
    },

    '%C4_z8': {
      name: 'Smith Tower - 8th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 8,
      exits: { west: '%C3_z8' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 8).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a canopy nest',
          description:
            'The alcove is transformed into a nest-like sleeping space with mosquito netting draped from above and the mattress piled with vintage quilts.',
          quality: 'standard',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a painted armoire',
          description:
            'A folk-art painted armoire covered in flowers and birds serves as a wardrobe. Its inside is papered with magazine pages.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a mirror mosaic',
          description:
            'The wall is covered in a mosaic of broken mirror pieces, reflecting the room in a thousand fragments.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'an apple crate nightstand',
          description:
            'A wooden apple crate serves as a nightstand, holding beeswax candles, a journal, and a collection of sea glass.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the canopy nest',
          capacity: 2,
          emptyMsg:
            'The mosquito-net canopy drapes over the quilted nest, inviting dreams.',
          occupiedMsg: '%s cocooned in the canopy nest.',
        },
      ],
    },

    '%B4_z8': {
      name: 'Smith Tower - 8th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 8,
      exits: { north: '%B2_z8' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 8).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a brass daybed',
          description:
            "An ornate brass daybed with a thin mattress, covered in crochet blankets made by someone's grandmother.",
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a decoupaged cabinet',
          description:
            'The Murphy bed cabinet has been decoupaged with images from vintage magazines, creating a collage of 1960s fashion and advertising.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'found object shelving',
          description:
            'The shelves are crammed with found objects: driftwood, old bottles, bird nests, pressed flowers, and photos of strangers from estate sales.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'an easel desk',
          description:
            'A small easel has been converted into a standing desk, its ledge holding sketchbooks and charcoal pencils.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a vintage suitcase dresser',
          description:
            'Stacked vintage suitcases serve as a dresser, their leather faded and stickers from distant travels still visible.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the brass daybed',
          capacity: 2,
          emptyMsg: "The brass daybed waits under its grandmother's blankets.",
          occupiedMsg: '%s nestled in the brass daybed.',
        },
      ],
    },
  },
};
