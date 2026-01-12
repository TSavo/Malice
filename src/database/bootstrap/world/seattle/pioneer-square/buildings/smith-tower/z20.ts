// Smith Tower - Condo Floor (z=20)
// Hollywood Regency - glamorous mirrors, velvet, gold accents, dramatic lighting, Old Hollywood elegance

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z20' },
    },

    // Rentable locks
    '%RL_A2_z20': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z20': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z20': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z20': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z20'],
    },
    '%D_B2_z20': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z20'],
    },
    '%D_C3_z20': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z20'],
    },

    // Elevator landing
    '%EL_z20': {
      name: 'Smith Tower - 20th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 20,
      exits: {
        north: { room: '%A2_z20', door: '%D_A2_z20' },
        east: { room: '%B2_z20', door: '%D_B2_z20' },
        south: { room: '%C3_z20', door: '%D_C3_z20' },
        west: '%C1_z20',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z20': {
      name: 'Smith Tower - 20th Floor - North Suite - Living Room',
      description:
        "A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone's life—books, decorative objects, a dead potted plant.",
      x: -3,
      y: 11,
      z: 20,
      exits: { east: '%A2_z20' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 20).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a mirrored cocktail table',
          description:
            'A low cocktail table with a mirrored top and gold bamboo legs reflects the light from the windows. Ring marks from cocktail glasses pattern its surface.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a lacquered bar cabinet',
          description:
            'A built-in bar cabinet in black lacquer features gold leaf trim and smoked glass shelves. Crystal decanters sit empty, awaiting refills that will never come.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a sunburst mirror wall',
          description:
            'A collection of gold sunburst mirrors covers one wall in various sizes, their rays overlapping like a glamorous constellation.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a chinoiserie screen',
          description:
            'A folding screen painted with cranes and cherry blossoms on gold leaf divides the space, its lacquer cracked but still luminous.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'a tufted velvet sofa',
          capacity: 3,
          emptyMsg:
            'A deep-tufted sofa in dusty emerald velvet curves dramatically, its gold claw feet gleaming.',
          occupiedMsg: '%s draped elegantly on the velvet sofa.',
        },
        {
          name: 'a slipper chair',
          capacity: 1,
          emptyMsg:
            'An armless slipper chair in faded pink silk perches near the window.',
          occupiedMsg: '%s perched on the slipper chair.',
        },
      ],
    },

    '%A2_z20': {
      name: 'Smith Tower - 20th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 20,
      exits: {
        west: '%A1_z20',
        east: '%A3_z20',
        south: { room: '%EL_z20', door: '%D_A2_z20' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 20).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a Hollywood bed',
          description:
            'A queen bed with an upholstered headboard in tufted ivory silk dominates the room. The satin sheets have yellowed but retain their sheen.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'mirrored closet doors',
          description:
            'Floor-to-ceiling mirrored closet doors multiply the room into infinity. The glass is foxed with age, adding a dreamlike quality.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a lucite nightstand',
          description:
            'A clear lucite nightstand holds a crystal lamp with a pleated silk shade and an empty perfume bottle.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a faux fur throw',
          description:
            'A white faux fur throw is draped across the foot of the bed, now more grey than white but still luxuriously soft.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the Hollywood bed',
          capacity: 2,
          emptyMsg: 'The glamorous bed awaits, satin sheets slightly rumpled.',
          occupiedMsg: '%s lounging in Hollywood style.',
        },
      ],
    },

    '%A3_z20': {
      name: 'Smith Tower - 20th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 20,
      exits: { west: '%A2_z20' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 20).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a glamour kitchenette',
          description:
            'A kitchenette features black lacquered cabinets with gold bamboo handles. A pink refrigerator sits silent, its color faded to dusty rose.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a secretary desk',
          description:
            'A drop-front secretary desk in white lacquer with gold trim holds faded stationery and a silver letter opener.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a zebra daybed',
          description:
            'A daybed upholstered in faded zebra print serves as both seating and sleeping, with gold tasseled bolster pillows at each end.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a palm frond lamp',
          description:
            'A floor lamp with a base shaped like palm fronds in gold metal stands in the corner, its shade long since disintegrated.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the zebra daybed',
          capacity: 2,
          emptyMsg:
            'The zebra daybed reclines dramatically, bolsters perfectly arranged.',
          occupiedMsg: '%s reclining on the zebra daybed.',
        },
        {
          name: 'a vanity stool',
          capacity: 1,
          emptyMsg:
            'A small vanity stool with a pink cushion sits before the secretary desk.',
          occupiedMsg: '%s poised at the desk.',
        },
      ],
    },

    '%B1_z20': {
      name: 'Smith Tower - 20th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 20,
      exits: { south: '%B2_z20' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 20).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a spiral staircase',
          description:
            'A gilded spiral staircase with velvet-wrapped handrail leads up to the loft, far more glamorous than a ladder.',
          boltedDown: true,
        },
        {
          prototype: 'bed',
          name: 'a canopy platform',
          description:
            'The loft holds a low platform bed with sheer gold curtains draped from the ceiling, creating a romantic bower.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a curved sectional',
          description:
            'A curved white sectional sofa sits beneath the loft, its velvet upholstery stained but still dramatic.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a glass drum table',
          description:
            'A drum-shaped glass table with gold edging holds a collection of coffee table books about Old Hollywood stars.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the curved sectional',
          capacity: 4,
          emptyMsg:
            'The white sectional curves invitingly beneath the glamorous loft.',
          occupiedMsg: '%s lounging on the curved sectional.',
        },
        {
          name: 'the canopy platform',
          capacity: 2,
          emptyMsg: 'The loft bed awaits behind its golden curtains.',
          occupiedMsg: '%s hidden behind the golden curtains above.',
        },
      ],
    },

    '%C1_z20': {
      name: 'Smith Tower - 20th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 20,
      exits: { south: '%C2_z20', east: '%EL_z20' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 20).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a chaise longue bed',
          description:
            'A velvet chaise longue in faded coral serves as both seating and sleeping, surprisingly comfortable for its dramatic pose.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'crystal wall sconces',
          description:
            'A pair of crystal wall sconces flank the alcove, their prisms dusty but still catching what light enters.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a mirrored shelf',
          description:
            'A narrow mirrored shelf holds a collection of vintage perfume bottles and a silver hand mirror.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a petite console',
          description:
            'A tiny gold console table holds a telephone with a rotary dial and a little black book that crumbles when touched.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the chaise longue',
          capacity: 1,
          emptyMsg: 'The coral chaise longue awaits a dramatic swoon.',
          occupiedMsg: '%s draped across the chaise longue.',
        },
      ],
    },

    '%B2_z20': {
      name: 'Smith Tower - 20th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 20,
      exits: {
        north: '%B1_z20',
        east: '%B3_z20',
        west: { room: '%EL_z20', door: '%D_B2_z20' },
        south: '%B4_z20',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 20).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a Venetian mirror',
          description:
            'An enormous Venetian mirror in an ornate etched frame dominates one wall, its silvering spotted but still magnificent.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a lacquered coffee table',
          description:
            'A black lacquered coffee table with gold Grecian key trim holds a silver cigarette box and a crystal ashtray.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a bar cart',
          description:
            'A gold bar cart with smoked glass shelves displays crystal barware and empty bottles of champagne and vermouth.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'silk draperies',
          description:
            'Heavy silk draperies in champagne gold frame the windows, their fabric shattered by age but still holding their drape.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'channel-tufted sofas',
          capacity: 4,
          emptyMsg:
            'A pair of channel-tufted sofas in dusty plum velvet face each other across the coffee table.',
          occupiedMsg: '%s ensconced in the plum velvet.',
        },
        {
          name: 'a barrel chair',
          capacity: 1,
          emptyMsg:
            'A barrel-back chair in leopard print velvet sits by the bar cart.',
          occupiedMsg: '%s relaxing in the leopard chair.',
        },
      ],
    },

    '%B3_z20': {
      name: 'Smith Tower - 20th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 20,
      exits: { west: '%B2_z20' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 20).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'mirrored bookshelves',
          description:
            'Floor-to-ceiling bookshelves with mirrored backs hold leather-bound classics and framed photos of people who might have been movie stars.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a Louis XV desk',
          description:
            'A delicate white and gold desk in the Louis XV style holds monogrammed stationery and a white rotary telephone.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a screen goddess lamp',
          description:
            'A floor lamp shaped like a golden female figure holding an orb provides no light but ample drama.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'framed headshots',
          description:
            'A wall of framed 8x10 headshots features men and women in dramatic lighting, all signed with illegible autographs.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a bergère chair',
          capacity: 1,
          emptyMsg:
            'An upholstered bergère chair in ivory damask sits by the window, perfect for reading scripts.',
          occupiedMsg: '%s posed in the bergère chair.',
        },
        {
          name: 'a gilt desk chair',
          capacity: 1,
          emptyMsg: 'A small gilt chair is tucked under the Louis XV desk.',
          occupiedMsg: '%s seated at the glamorous desk.',
        },
      ],
    },

    '%C2_z20': {
      name: 'Smith Tower - 20th Floor - South Suite - Living Room',
      description:
        'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 20,
      exits: { north: '%C1_z20', east: '%C3_z20' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 20).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a swan fainting couch',
          description:
            'A fainting couch with a curved back carved to resemble swan wings reclines near the window, its velvet upholstery faded from dusty rose to pale pink.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a mirrored side table',
          description:
            'A small mirrored side table holds a crystal lamp with dangling prisms and an ivory cigarette holder in an ashtray.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'gilded radiator cover',
          description:
            'The radiator is hidden behind an ornate gilded grate, its scrollwork still elegant despite decades of tarnish.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'ostrich feather curtains',
          description:
            'Sheer curtains trimmed with what might be ostrich feathers hang from brass rods, the feathers now bedraggled and dusty.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the fainting couch',
          capacity: 2,
          emptyMsg: 'The swan fainting couch awaits someone feeling dramatic.',
          occupiedMsg: '%s swooning on the fainting couch.',
        },
      ],
    },

    '%C3_z20': {
      name: 'Smith Tower - 20th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 20,
      exits: {
        north: { room: '%EL_z20', door: '%D_C3_z20' },
        west: '%C2_z20',
        east: '%C4_z20',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 20).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a curved settee',
          description:
            'A curved entrance settee in teal velvet with gold piping offers an elegant place to pause before entering.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a fur closet',
          description:
            'A closet lined with cedar holds the ghosts of fur coats—one moth-eaten stole remains on a padded hanger.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'an Art Deco mailbox',
          description:
            'A brass mailbox built into the wall features stepped geometric patterns in the Art Deco style.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a demilune console',
          description:
            'A half-moon console table in white lacquer with gold trim holds a silver tray for calling cards and a crystal vase (empty).',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the curved settee',
          capacity: 2,
          emptyMsg: 'The teal settee curves invitingly in the entrance.',
          occupiedMsg: '%s poised on the entrance settee.',
        },
      ],
    },

    '%C4_z20': {
      name: 'Smith Tower - 20th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 20,
      exits: { west: '%C3_z20' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 20).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a theatrical bed',
          description:
            'A dramatic bed with a tall padded headboard in pale blue velvet fills the alcove, its silk curtains now dust-colored but still theatrical.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a dressing screen',
          description:
            'A three-panel dressing screen covered in faded toile depicts pastoral scenes, providing privacy for costume changes.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a Hollywood mirror',
          description:
            'A vanity mirror surrounded by (dead) lightbulbs is mounted on the wall—the kind starlets used before going on camera.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a mirrored nightstand',
          description:
            'A mirrored nightstand with beveled edges holds a satin sleep mask and a script for a play that was never produced.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the theatrical bed',
          capacity: 2,
          emptyMsg: 'The dramatic bed awaits behind its dusty silk curtains.',
          occupiedMsg: '%s lost in theatrical dreams.',
        },
      ],
    },

    '%B4_z20': {
      name: 'Smith Tower - 20th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 20,
      exits: { north: '%B2_z20' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 20).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a hidden wall bed',
          description:
            'A wall bed folds down from a mirrored cabinet, its mechanism gilded and its mattress covered in champagne satin.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'the mirrored cabinet',
          description:
            'When closed, the bed disappears behind a floor-to-ceiling mirrored panel with gold bamboo trim.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'glamour shelving',
          description:
            'Glass shelving with gold brackets holds crystal perfume bottles, framed photos of parties, and a dead orchid in a gold pot.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a floating vanity',
          description:
            'A floating vanity with a lit mirror (bulbs dead) holds makeup brushes in crystal cups and a jewelry box playing silent music.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a velvet ottoman',
          description:
            'A round velvet ottoman in mauve serves as both seating and storage, its lid revealing empty champagne bottles.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the wall bed',
          capacity: 2,
          emptyMsg:
            'The champagne satin wall bed is folded down, ready for glamorous sleep.',
          occupiedMsg: '%s resting in Hollywood elegance.',
        },
      ],
    },
  },
};
