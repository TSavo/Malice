// Smith Tower - Condo Floor (z=12)
// Art Deco glamour - geometric patterns, mirrored surfaces, chrome and black lacquer

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z12' },
    },

    // Rentable locks
    '%RL_A2_z12': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z12': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z12': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z12': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z12'],
    },
    '%D_B2_z12': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z12'],
    },
    '%D_C3_z12': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z12'],
    },

    // Elevator landing
    '%EL_z12': {
      name: 'Smith Tower - 12th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 12,
      exits: {
        north: { room: '%A2_z12', door: '%D_A2_z12' },
        east: { room: '%B2_z12', door: '%D_B2_z12' },
        south: { room: '%C3_z12', door: '%D_C3_z12' },
        west: '%C1_z12',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z12': {
      name: 'Smith Tower - 12th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -3,
      y: 11,
      z: 12,
      exits: { east: '%A2_z12' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 12).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a sunburst coffee table', description: 'A circular coffee table with a sunburst pattern inlaid in different wood veneers. The geometric rays radiate from a mirrored center, now clouded with age.', boltedDown: false },
        { prototype: 'furniture', name: 'a black lacquer kitchenette', description: 'A kitchenette in glossy black lacquer with chrome hardware. The geometric cabinet fronts are trimmed with silver leaf that has begun to tarnish.', boltedDown: true },
        { prototype: 'furniture', name: 'a stepped display shelf', description: 'A ziggurat-shaped display shelf in tiered walnut holds a collection of frosted glass figurines and a cracked Bakelite radio.', boltedDown: true },
        { prototype: 'furniture', name: 'a chrome torchiere', description: 'A tall chrome floor lamp with a frosted glass bowl shade stands in the corner, its streamlined form echoing a rocket ship.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a curved velvet sofa',
          capacity: 3,
          emptyMsg: 'A kidney-shaped sofa in dusty rose velvet curves toward the window, its chrome legs tarnished but still gleaming.',
          occupiedMsg: '%s lounging on the curved velvet sofa.',
        },
      ],
    },

    '%A2_z12': {
      name: 'Smith Tower - 12th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 12,
      exits: {
        west: '%A1_z12',
        east: '%A3_z12',
        south: { room: '%EL_z12', door: '%D_A2_z12' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 12).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'an Art Deco bed', description: 'A glamorous bed with a curved headboard in quilted champagne satin. Chrome rails accent the frame, and the dusty silk sheets still hint at luxury.', quality: 'nice' },
        { prototype: 'furniture', name: 'a mirrored armoire', description: 'A tall armoire with geometric mirrored panels reflects the room in fractured angles. The silver backing has begun to spot with age.', boltedDown: true },
        { prototype: 'table', name: 'a waterfall nightstand', description: 'A streamlined nightstand with curved waterfall edges holds a chrome lamp with a frosted glass shade shaped like a calla lily.', boltedDown: false },
        { prototype: 'furniture', name: 'a vanity table', description: 'A curved vanity with a triptych mirror is built into the corner. The glass is clouded but the chrome fixtures still catch the light.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the Art Deco bed',
          capacity: 2,
          emptyMsg: 'The glamorous bed awaits, its satin headboard still catching dusty light.',
          occupiedMsg: '%s reclining on the Art Deco bed.',
        },
        {
          name: 'a padded vanity stool',
          capacity: 1,
          emptyMsg: 'A round stool upholstered in faded pink velvet sits before the vanity.',
          occupiedMsg: '%s seated at the vanity.',
        },
      ],
    },

    '%A3_z12': {
      name: 'Smith Tower - 12th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 12,
      exits: { west: '%A2_z12' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 12).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a streamlined kitchenette', description: 'A kitchenette with rounded corners and chrome trim runs along the wall. The Bakelite handles are cracked but the geometric tile backsplash remains striking.', boltedDown: true },
        { prototype: 'table', name: 'a curved writing desk', description: 'A kidney-shaped desk in burled walnut with chrome legs sits under the window. A frosted glass desk lamp shaped like a nude figure stands dark.', boltedDown: false },
        { prototype: 'furniture', name: 'a geometric room divider', description: 'A folding screen with geometric sunburst patterns in gold and black lacquer divides the space, its hinges creaking with age.', boltedDown: false },
        { prototype: 'furniture', name: 'a cocktail bar cabinet', description: 'A curved bar cabinet with mirrored interior and chrome rails holds dusty crystal glassware and bottles of evaporated spirits.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a curved daybed',
          capacity: 2,
          emptyMsg: 'A sleek daybed with tufted velvet upholstery in faded coral curves against the wall.',
          occupiedMsg: '%s draped across the daybed.',
        },
        {
          name: 'a chrome and leather chair',
          capacity: 1,
          emptyMsg: 'A tubular chrome chair with cracked leather cushions sits at the desk.',
          occupiedMsg: '%s seated at the curved desk.',
        },
      ],
    },

    '%B1_z12': {
      name: 'Smith Tower - 12th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 12,
      exits: { south: '%B2_z12' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 12).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a chrome spiral staircase', description: 'A narrow spiral staircase in polished chrome winds up to the mezzanine, its geometric railings catching what light filters through the windows.', boltedDown: true },
        { prototype: 'bed', name: 'an elevated platform bed', description: 'The mezzanine holds a low platform bed with a sunburst headboard in gold leaf, now flaking. The silk coverlet is dusty but intact.', quality: 'nice' },
        { prototype: 'furniture', name: 'a chrome and glass console', description: 'A console table with chrome legs and a smoked glass top holds a collection of perfume bottles and a tarnished silver hand mirror.', boltedDown: false },
        { prototype: 'furniture', name: 'an etched glass pendant light', description: 'A large pendant light with etched geometric patterns hangs from the high ceiling, its chrome chain tarnished.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a circular settee',
          capacity: 3,
          emptyMsg: 'A circular settee in teal velvet sits beneath the mezzanine, its button-tufted back rising dramatically.',
          occupiedMsg: '%s arranged on the circular settee.',
        },
        {
          name: 'the platform bed',
          capacity: 2,
          emptyMsg: 'The platform bed gleams above, its gold sunburst headboard visible from below.',
          occupiedMsg: '%s reclining on the platform bed above.',
        },
      ],
    },

    '%C1_z12': {
      name: 'Smith Tower - 12th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 12,
      exits: { south: '%C2_z12', east: '%EL_z12' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 12).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a narrow daybed', description: 'A slim daybed with a curved chrome frame and faded peach velvet cushions is wedged into the alcove. A geometric throw pillow adds color.', quality: 'standard' },
        { prototype: 'furniture', name: 'chrome coat hooks', description: 'A row of streamlined chrome hooks is mounted on the wall in a geometric pattern, designed to hold hats and coats.', boltedDown: true },
        { prototype: 'furniture', name: 'a stepped wall shelf', description: 'A small tiered shelf in black lacquer is bolted above the daybed, holding a frosted glass perfume atomizer and a ceramic figurine of a greyhound.', boltedDown: true },
        { prototype: 'furniture', name: 'a round vanity mirror', description: 'A small round mirror with a sunburst chrome frame is mounted on the wall, its glass beginning to desilver at the edges.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the daybed',
          capacity: 1,
          emptyMsg: 'The narrow daybed gleams in its chrome frame, velvet cushions still inviting despite the dust.',
          occupiedMsg: '%s reclining on the daybed.',
        },
      ],
    },

    '%B2_z12': {
      name: 'Smith Tower - 12th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 12,
      exits: {
        north: '%B1_z12',
        east: '%B3_z12',
        west: { room: '%EL_z12', door: '%D_B2_z12' },
        south: '%B4_z12',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 12).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a curved sectional', description: 'A sweeping curved sectional in emerald velvet dominates the room, its chrome legs tarnished but elegant. The geometric pattern of the upholstery is faded but discernible.', boltedDown: true },
        { prototype: 'table', name: 'a mirrored coffee table', description: 'A hexagonal coffee table with a mirrored top and chrome frame sits before the sectional. The mirror is clouded with age spots.', boltedDown: false },
        { prototype: 'furniture', name: 'a built-in radio cabinet', description: 'An elaborate built-in cabinet houses a vintage radio with a half-circle dial and cloth speaker grille. The tubes are surely dead.', boltedDown: true },
        { prototype: 'furniture', name: 'a lacquered coat closet', description: 'A coat closet with black lacquer doors and chrome pulls is built into the wall, its geometric pattern echoing the room\'s decor.', boltedDown: true },
        { prototype: 'furniture', name: 'a standing ashtray', description: 'A chrome standing ashtray with a geometric base stands near the sofa, still holding decades-old cigarette butts.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the curved sectional',
          capacity: 5,
          emptyMsg: 'The emerald sectional sweeps around the room in an elegant arc.',
          occupiedMsg: '%s lounging on the curved sectional.',
        },
      ],
    },

    '%B3_z12': {
      name: 'Smith Tower - 12th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 12,
      exits: { west: '%B2_z12' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 12).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'geometric bookcases', description: 'Floor-to-ceiling bookcases with geometric compartments in alternating sizes line the walls. Leather-bound volumes and decorative objects fill the asymmetric spaces.', boltedDown: true },
        { prototype: 'table', name: 'a streamlined desk', description: 'A sleek desk with chrome legs and a burled walnut top sits in the window bay. A chrome lamp with a frosted glass shade stands dark.', boltedDown: false },
        { prototype: 'furniture', name: 'a globe and stand', description: 'A terrestrial globe on a chrome stand shows the world as it was before everything changed. The oceans are a deep azure, the continents gilded.', boltedDown: false },
        { prototype: 'furniture', name: 'geometric wall sconces', description: 'Paired wall sconces with geometric frosted glass shades flank the window, their chrome fixtures tarnished.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a leather club chair',
          capacity: 1,
          emptyMsg: 'A streamlined club chair in burgundy leather with chrome armrests sits angled toward the window.',
          occupiedMsg: '%s settled into the club chair.',
        },
        {
          name: 'a chrome desk chair',
          capacity: 1,
          emptyMsg: 'A chrome and leather desk chair on casters is pushed under the streamlined desk.',
          occupiedMsg: '%s seated at the desk.',
        },
      ],
    },

    '%C2_z12': {
      name: 'Smith Tower - 12th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 12,
      exits: { north: '%C1_z12', east: '%C3_z12' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 12).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a tuxedo sofa', description: 'A sleek tuxedo sofa in faded mauve velvet faces the window, its geometric lines and low profile unmistakably Art Deco.', boltedDown: true },
        { prototype: 'table', name: 'a chrome and glass side table', description: 'A two-tiered side table with smoked glass shelves and chrome frame holds a geometric table lamp and a crystal ashtray.', boltedDown: false },
        { prototype: 'furniture', name: 'a sunburst radiator cover', description: 'An ornate radiator cover in brass with a sunburst pattern conceals the steam radiator. Heat still rises from its geometric openings.', boltedDown: true },
        { prototype: 'furniture', name: 'chrome curtain hardware', description: 'Chrome curtain rods with geometric finials span the windows, holding velvet drapes in faded gold that pool on the floor.', boltedDown: true },
        { prototype: 'furniture', name: 'a chrome floor lamp', description: 'A chrome arc lamp with a frosted glass dome shade curves over the seating area, its chrome pitted but still elegant.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the tuxedo sofa',
          capacity: 3,
          emptyMsg: 'The mauve tuxedo sofa faces the western light, its geometric lines casting sharp shadows.',
          occupiedMsg: '%s arranged on the tuxedo sofa.',
        },
      ],
    },

    '%C3_z12': {
      name: 'Smith Tower - 12th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 12,
      exits: {
        north: { room: '%EL_z12', door: '%D_C3_z12' },
        west: '%C2_z12',
        east: '%C4_z12',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 12).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a settee bench', description: 'A curved settee bench in jade velvet with chrome legs sits against the wall, designed for putting on shoes or waiting.', boltedDown: false },
        { prototype: 'furniture', name: 'a mirrored entry closet', description: 'A small closet with mirrored doors and chrome handles is built into the wall, reflecting fractured geometric patterns.', boltedDown: true },
        { prototype: 'furniture', name: 'an ornate mail slot', description: 'An Art Deco mail slot in polished brass with a geometric sunburst pattern is set into the door, tarnished but handsome.', boltedDown: true },
        { prototype: 'table', name: 'a demi-lune console', description: 'A half-moon console table in black lacquer with chrome legs holds a geometric vase and a tarnished silver card tray.', boltedDown: false },
        { prototype: 'furniture', name: 'a geometric umbrella stand', description: 'A chrome umbrella stand with geometric openwork pattern holds a single mildewed umbrella with a Bakelite handle.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the settee bench',
          capacity: 2,
          emptyMsg: 'The jade settee curves elegantly, offering a place to pause before entering.',
          occupiedMsg: '%s perched on the settee bench.',
        },
      ],
    },

    '%C4_z12': {
      name: 'Smith Tower - 12th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 12,
      exits: { west: '%C3_z12' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 12).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a glamour bed', description: 'A bed with a curved, padded headboard in dusty silver velvet fills the alcove. Chrome rails and a mirrored footboard complete the Art Deco statement.', quality: 'nice' },
        { prototype: 'furniture', name: 'a chrome valet stand', description: 'A chrome valet stand with geometric lines holds a moth-eaten dinner jacket and a tarnished tie bar.', boltedDown: false },
        { prototype: 'furniture', name: 'a full-length mirror', description: 'A tall mirror with a sunburst chrome frame is mounted in the corner, its glass fogging around the edges but still serviceable.', boltedDown: true },
        { prototype: 'table', name: 'a waterfall nightstand', description: 'A streamlined nightstand with waterfall edges holds a chrome desk lamp and a cracked Bakelite telephone.', boltedDown: false },
        { prototype: 'furniture', name: 'a built-in wardrobe', description: 'A built-in wardrobe with geometric paneling and chrome pulls lines one wall. Moth-eaten garments hang within, smelling faintly of cedar.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the glamour bed',
          capacity: 2,
          emptyMsg: 'The glamour bed gleams in its alcove, silver velvet headboard catching what light remains.',
          occupiedMsg: '%s reclining on the glamour bed.',
        },
      ],
    },

    '%B4_z12': {
      name: 'Smith Tower - 12th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 12,
      exits: { north: '%B2_z12' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 12).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a concealed bed', description: 'A Murphy bed with a sunburst panel front folds down from its geometric cabinet. The chrome hardware still works smoothly, revealing a dusty silk-covered mattress.', quality: 'nice' },
        { prototype: 'furniture', name: 'a lacquered Murphy cabinet', description: 'The Murphy bed folds into a striking black lacquer cabinet with geometric chrome inlays. When closed, it appears to be an elaborate armoire.', boltedDown: true },
        { prototype: 'furniture', name: 'geometric display niches', description: 'Built-in niches with geometric shapes are carved into the walls around the window, displaying frosted glass figurines and chrome sculptures.', boltedDown: true },
        { prototype: 'table', name: 'a chrome fold-down desk', description: 'A fold-down desk with a chrome frame and burled walnut surface is hinged to the wall. When closed, only a geometric chrome panel shows.', boltedDown: true },
        { prototype: 'furniture', name: 'a streamlined dresser', description: 'A low dresser in blonde wood with waterfall edges and Bakelite pulls is wedged into the corner. A chrome-framed mirror stands atop it.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the concealed bed',
          capacity: 2,
          emptyMsg: 'The Murphy bed is folded down, its sunburst panel hidden and silk mattress exposed.',
          occupiedMsg: '%s reclining on the Murphy bed.',
        },
      ],
    },
  },
};
