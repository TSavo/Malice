// Smith Tower - 9th Floor Condos
// Corporate executive/yuppie style - leather, chrome, glass, Scandinavian minimalism, high-end 90s aesthetics

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z9' },
    },

    // Rentable locks
    '%RL_A2_z9': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z9': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z9': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z9': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z9'],
    },
    '%D_B2_z9': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z9'],
    },
    '%D_C3_z9': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z9'],
    },

    // Elevator landing
    '%EL_z9': {
      name: 'Smith Tower - 9th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -12,
      y: 10,
      z: 9,
      exits: {
        north: { room: '%A2_z9', door: '%D_A2_z9' },
        east: { room: '%B2_z9', door: '%D_B2_z9' },
        south: { room: '%C3_z9', door: '%D_C3_z9' },
        west: '%C1_z9',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z9': {
      name: 'Smith Tower - 9th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -13,
      y: 11,
      z: 9,
      exits: { east: '%A2_z9' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 9).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a glass and chrome coffee table', description: 'A sleek coffee table with a thick glass top and polished chrome frame. A few dust-covered copies of Forbes and Architectural Digest remain.', boltedDown: false },
        { prototype: 'furniture', name: 'a Euro-style kitchenette', description: 'A minimalist kitchenette with stainless steel appliances and black granite counters. An espresso machine sits gathering dust.', boltedDown: true },
        { prototype: 'furniture', name: 'a floating media console', description: 'A wall-mounted media console in blonde wood holds a dead flatscreen TV and a collection of boxed Criterion DVDs.', boltedDown: true },
        { prototype: 'furniture', name: 'a halogen floor lamp', description: 'A tall halogen torchiere in brushed nickel stands in the corner, its dimmer switch frozen at half.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a leather sectional',
          capacity: 4,
          emptyMsg:
            'A black leather sectional with chrome legs dominates the living area, still supple despite the years.',
          occupiedMsg: '%s lounging on the leather sectional.',
        },
      ],
    },

    '%A2_z9': {
      name: 'Smith Tower - 9th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -12,
      y: 11,
      z: 9,
      exits: {
        west: '%A1_z9',
        east: '%A3_z9',
        south: { room: '%EL_z9', door: '%D_A2_z9' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 9).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a platform bed', description: 'A low Japanese-style platform bed in black lacquer with a high-end Tempur-Pedic mattress. Egyptian cotton sheets, now grey with dust.', quality: 'nice', boltedDown: true },
        { prototype: 'furniture', name: 'a walk-in closet', description: 'A walk-in closet with custom California Closet organizers. Designer suits hang motionless, Italian leather shoes lined up below.', boltedDown: true },
        { prototype: 'table', name: 'a floating nightstand', description: 'A wall-mounted nightstand with a wireless charging pad (dead), a Bose clock radio (silent), and a copy of "The 7 Habits."', boltedDown: true },
        { prototype: 'furniture', name: 'a Poang chair', description: 'An IKEA Poang chair in black leather sits in the corner, a cashmere throw draped over its arm.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the platform bed',
          capacity: 2,
          emptyMsg:
            'The low platform bed awaits, its memory foam mattress still holding shape.',
          occupiedMsg: '%s resting on the platform bed.',
        },
        {
          name: 'the Poang chair',
          capacity: 1,
          emptyMsg:
            'The bentwood chair curves invitingly in the corner.',
          occupiedMsg: '%s reclining in the Poang chair.',
        },
      ],
    },

    '%A3_z9': {
      name: 'Smith Tower - 9th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -11,
      y: 11,
      z: 9,
      exits: { west: '%A2_z9' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 9).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a Sub-Zero kitchenette', description: 'A compact but high-end kitchenette with Sub-Zero refrigerator and Viking range. The granite counters gleam, unused for decades.', boltedDown: true },
        { prototype: 'table', name: 'a glass-top desk', description: 'A minimalist desk with a thick glass top and chrome trestle legs. A dead iMac G4 with its distinctive lamp-arm design sits forgotten.', boltedDown: false },
        { prototype: 'furniture', name: 'a Barcelona daybed', description: 'A Mies van der Rohe Barcelona daybed in white leather serves as both seating and sleeping. Still pristine.', boltedDown: false },
        { prototype: 'furniture', name: 'a wire Bertoia chair', description: 'A classic Bertoia wire chair sits near the window, its seat pad long since removed.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Barcelona daybed',
          capacity: 2,
          emptyMsg:
            'The iconic Barcelona daybed stretches along the wall, a study in modernist elegance.',
          occupiedMsg: '%s stretched out on the Barcelona daybed.',
        },
        {
          name: 'a Herman Miller chair',
          capacity: 1,
          emptyMsg:
            'An Aeron office chair sits at the desk, its mesh still taut.',
          occupiedMsg: '%s working at the glass desk.',
        },
      ],
    },

    '%B1_z9': {
      name: 'Smith Tower - 9th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: -10,
      y: 11,
      z: 9,
      exits: { south: '%B2_z9' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 9).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a steel ship ladder', description: 'A brushed steel ship ladder leads to the mezzanine, its industrial design matching the exposed ductwork above.', boltedDown: true },
        { prototype: 'bed', name: 'a loft platform bed', description: 'A custom-built platform bed with built-in reading lights and USB ports (dead) fills the mezzanine. The mattress is memory foam.', quality: 'nice', boltedDown: true },
        { prototype: 'furniture', name: 'an Eames lounge chair', description: 'A genuine Eames lounge chair and ottoman in black leather sits beneath the mezzanine, its rosewood shell gleaming.', boltedDown: false },
        { prototype: 'table', name: 'a Noguchi coffee table', description: 'An Isamu Noguchi coffee table with its distinctive biomorphic glass top. A copy of Wallpaper magazine lies on it.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Eames lounge',
          capacity: 1,
          emptyMsg:
            'The iconic Eames chair waits beneath the mezzanine, the ultimate in executive comfort.',
          occupiedMsg: '%s relaxing in the Eames lounge.',
        },
        {
          name: 'the loft bed',
          capacity: 2,
          emptyMsg:
            'The custom platform bed is visible in the mezzanine above.',
          occupiedMsg: '%s resting in the loft.',
        },
      ],
    },

    '%C1_z9': {
      name: 'Smith Tower - 9th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -13,
      y: 10,
      z: 9,
      exits: { south: '%C2_z9', east: '%EL_z9' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 9).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a Murphy bed system', description: 'A high-end Murphy bed system in maple veneer, with the bed currently folded away. A small desk is revealed when the bed is up.', quality: 'standard' },
        { prototype: 'furniture', name: 'chrome coat hooks', description: 'A minimalist row of polished chrome hooks is mounted on the wall, designer labels visible on the single remaining coat.', boltedDown: true },
        { prototype: 'furniture', name: 'a floating shelf', description: 'A sleek floating shelf holds a dead Bose Wave radio, a TAG Heuer watch (stopped), and a BlackBerry (ancient).', boltedDown: true },
        { prototype: 'furniture', name: 'a standing mirror', description: 'A full-length mirror in a chrome frame leans against the wall, still waiting for someone to check their tie.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Murphy bed',
          capacity: 2,
          emptyMsg:
            'The Murphy bed is folded up, revealing a small work surface.',
          occupiedMsg: '%s using the Murphy bed desk.',
        },
      ],
    },

    '%B2_z9': {
      name: 'Smith Tower - 9th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -11,
      y: 10,
      z: 9,
      exits: {
        north: '%B1_z9',
        east: '%B3_z9',
        west: { room: '%EL_z9', door: '%D_B2_z9' },
        south: '%B4_z9',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 9).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a B&B Italia sofa', description: 'A sleek B&B Italia modular sofa in charcoal wool fills the room. The cushions are still firm, the design timeless.', boltedDown: false },
        { prototype: 'table', name: 'a Knoll coffee table', description: 'A Florence Knoll coffee table with marble top sits on a chrome frame. A Taschen coffee table book on architecture rests upon it.', boltedDown: false },
        { prototype: 'furniture', name: 'a Bang & Olufsen system', description: 'A wall-mounted Bang & Olufsen audio system with its distinctive aluminum speakers. Beautiful but silent.', boltedDown: true },
        { prototype: 'furniture', name: 'a hidden closet', description: 'A closet door blends seamlessly with the wall panels, its handle a flush pull. Armani and Hugo Boss hang inside.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the B&B Italia sofa',
          capacity: 4,
          emptyMsg:
            'The modular sofa offers multiple seating configurations, all of them comfortable.',
          occupiedMsg: '%s lounging on the designer sofa.',
        },
      ],
    },

    '%B3_z9': {
      name: 'Smith Tower - 9th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: -10,
      y: 10,
      z: 9,
      exits: { west: '%B2_z9' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 9).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'USM Haller shelving', description: 'A modular USM Haller shelving unit in white fills one wall, holding business books, framed diplomas, and a Bloomberg terminal (dead).', boltedDown: true },
        { prototype: 'table', name: 'a USM Kitos desk', description: 'A USM Kitos desk with a height-adjustable mechanism sits before the window. Dual monitors (dark) flank a leather desk blotter.', boltedDown: false },
        { prototype: 'furniture', name: 'a Wassily chair', description: 'A Marcel Breuer Wassily chair in black leather and chrome tubing sits ready for meetings. Bauhaus perfection.', boltedDown: false },
        { prototype: 'furniture', name: 'an Artemide lamp', description: 'A Tolomeo Artemide desk lamp arcs over the desk, its springs still taut.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Wassily chair',
          capacity: 1,
          emptyMsg:
            'The tubular steel chair waits, a Bauhaus icon.',
          occupiedMsg: '%s perched on the Wassily chair.',
        },
        {
          name: 'the executive chair',
          capacity: 1,
          emptyMsg:
            'A high-backed Humanscale chair waits at the desk.',
          occupiedMsg: '%s working at the executive desk.',
        },
      ],
    },

    '%C2_z9': {
      name: 'Smith Tower - 9th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -13,
      y: 9,
      z: 9,
      exits: { north: '%C1_z9', east: '%C3_z9' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 9).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a Ligne Roset Togo sofa', description: 'A sculptural Ligne Roset Togo sofa in caramel leather undulates against the wall, its ergonomic curves still inviting.', boltedDown: false },
        { prototype: 'table', name: 'an Eileen Gray side table', description: 'A chrome and glass Eileen Gray E-1027 side table holds a drained Riedel wine glass and a Montblanc pen.', boltedDown: false },
        { prototype: 'furniture', name: 'a concealed radiator', description: 'The radiator is hidden behind a custom walnut grille that matches the millwork throughout the unit.', boltedDown: true },
        { prototype: 'furniture', name: 'motorized shades', description: 'Motorized blackout shades (frozen half-open) are integrated into the window frame. The remote sits dead on the sill.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the Togo sofa',
          capacity: 2,
          emptyMsg:
            'The sculptural Togo sofa undulates invitingly.',
          occupiedMsg: '%s sunk into the Togo\'s curves.',
        },
      ],
    },

    '%C3_z9': {
      name: 'Smith Tower - 9th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -12,
      y: 9,
      z: 9,
      exits: {
        north: { room: '%EL_z9', door: '%D_C3_z9' },
        west: '%C2_z9',
        east: '%C4_z9',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 9).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a leather bench', description: 'A Knoll leather bench sits against the wall for removing shoes. A few pairs of Allen Edmonds remain beneath it.', boltedDown: false },
        { prototype: 'furniture', name: 'a flush-panel closet', description: 'A closet with push-to-open panels blends into the wall. Inside, Burberry trenches and Ferragamo shoes wait for their owner.', boltedDown: true },
        { prototype: 'furniture', name: 'a keyless entry panel', description: 'A high-tech keyless entry panel (dead) is mounted beside the door, its touchscreen blank.', boltedDown: true },
        { prototype: 'table', name: 'a Vitra console', description: 'A minimalist Vitra console holds a Georg Jensen key tray and a dead Nest thermostat.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the leather bench',
          capacity: 2,
          emptyMsg:
            'The Knoll bench offers a place to change from street shoes.',
          occupiedMsg: '%s seated on the entry bench.',
        },
      ],
    },

    '%C4_z9': {
      name: 'Smith Tower - 9th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -11,
      y: 9,
      z: 9,
      exits: { west: '%C3_z9' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 9).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a Hastens bed', description: 'A Hastens queen bed with horsehair mattress fills the alcove. The blue-check fabric is barely visible under Egyptian cotton sheets.', quality: 'nice' },
        { prototype: 'furniture', name: 'a custom wardrobe', description: 'A built-in wardrobe with soft-close drawers and interior lighting (dead). Suits from Brioni and Zegna hang inside.', boltedDown: true },
        { prototype: 'furniture', name: 'a wall-mounted TV', description: 'A flush-mounted flatscreen TV (dark) is integrated into the wall above a low media console.', boltedDown: true },
        { prototype: 'table', name: 'a Cassina nightstand', description: 'A Cassina nightstand in walnut holds a Kindle (dead), a Maratac pilot watch (stopped), and a half-empty bottle of Ambien.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Hastens bed',
          capacity: 2,
          emptyMsg:
            'The Swedish-made bed promises the sleep of the successful.',
          occupiedMsg: '%s resting on the luxury mattress.',
        },
      ],
    },

    '%B4_z9': {
      name: 'Smith Tower - 9th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: -10,
      y: 9,
      z: 9,
      exits: { north: '%B2_z9' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 9).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a Resource wall bed', description: 'A Resource Furniture wall bed with integrated sofa. Currently in bed mode, the Dux mattress exposed. A clever space solution.', quality: 'nice' },
        { prototype: 'furniture', name: 'a lacquered cabinet', description: 'The wall bed folds into a lacquered cabinet with subtle lighting (dead) and integrated USB ports (also dead).', boltedDown: true },
        { prototype: 'furniture', name: 'Vitsoe shelving', description: 'Dieter Rams-designed Vitsoe 606 shelving lines the walls, holding design books, awards, and a Leica M camera.', boltedDown: true },
        { prototype: 'table', name: 'a cantilever desk', description: 'A wall-mounted cantilever desk in white lacquer folds down when needed. A dead MacBook Air sits upon it.', boltedDown: true },
        { prototype: 'furniture', name: 'a Muji dresser', description: 'A minimalist Muji chest of drawers in ash holds neatly folded cashmere and Egyptian cotton.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the wall bed',
          capacity: 2,
          emptyMsg:
            'The multifunctional wall bed is down, ready for rest.',
          occupiedMsg: '%s resting on the convertible bed.',
        },
      ],
    },
  },
};
