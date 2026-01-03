// Smith Tower - Condo Floor (z=24) - Minimalist Modern Theme
// Clean lines, platform beds, white and neutral tones, sparse but intentional

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z24' },
    },

    // Rentable locks
    '%RL_A2_z24': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z24': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z24': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z24': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z24'],
    },
    '%D_B2_z24': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z24'],
    },
    '%D_C3_z24': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z24'],
    },

    // Elevator landing
    '%EL_z24': {
      name: 'Smith Tower - 24th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -12,
      y: 10,
      z: 24,
      exits: {
        north: { room: '%A2_z24', door: '%D_A2_z24' },
        east: { room: '%B2_z24', door: '%D_B2_z24' },
        south: { room: '%C3_z24', door: '%D_C3_z24' },
        west: '%C1_z24',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z24': {
      name: 'Smith Tower - 24th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -13,
      y: 11,
      z: 24,
      exits: { east: '%A2_z24' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 24).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a white lacquered coffee table', description: 'A low rectangular coffee table in glossy white lacquer. Its surface is pristine, reflecting the light from the windows.', boltedDown: false },
        { prototype: 'furniture', name: 'a built-in kitchenette', description: 'A seamless white kitchenette runs along one wall—induction cooktop, integrated sink, handleless cabinets. Everything flush, everything clean.', boltedDown: true },
        { prototype: 'furniture', name: 'floating wall shelves', description: 'Three floating white shelves are mounted asymmetrically on the wall. One holds a single ceramic vase. The others are empty.', boltedDown: true },
        { prototype: 'furniture', name: 'a geometric floor lamp', description: 'A tall angular floor lamp with a brass frame and frosted glass shade stands in the corner. Its lines are sharp and deliberate.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a modular white sofa',
          capacity: 3,
          emptyMsg:
            'A low-profile modular sofa in white bouclé fabric stretches beneath the windows. No cushions, no throw pillows—just clean lines.',
          occupiedMsg: '%s arranged on the modular sofa.',
        },
      ],
    },

    '%A2_z24': {
      name: 'Smith Tower - 24th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -12,
      y: 11,
      z: 24,
      exits: {
        west: '%A1_z24',
        east: '%A3_z24',
        south: { room: '%EL_z24', door: '%D_A2_z24' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 24).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a walnut platform bed', description: 'A low platform bed in dark walnut sits centered on the wall. The mattress rests directly on the wooden frame—no box spring, no headboard. White linen sheets lie smooth and unwrinkled.', quality: 'nice' },
        { prototype: 'furniture', name: 'a floor-to-ceiling wardrobe', description: 'Built-in wardrobe panels in matte white span one wall. Push-to-open mechanisms replace visible handles. Inside, empty space waits.', boltedDown: true },
        { prototype: 'table', name: 'a concrete cube nightstand', description: 'A small concrete cube serves as a nightstand. A single wireless charging pad sits on its surface, dormant.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the platform bed',
          capacity: 2,
          emptyMsg:
            'The platform bed floats low to the ground, an exercise in horizontal restraint.',
          occupiedMsg: '%s resting on the platform bed.',
        },
      ],
    },

    '%A3_z24': {
      name: 'Smith Tower - 24th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -11,
      y: 11,
      z: 24,
      exits: { west: '%A2_z24' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 24).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a streamlined galley kitchen', description: 'A galley kitchen in white Corian with integrated appliances. No visible seams, no protruding handles. A single bamboo cutting board provides the only warmth.', boltedDown: true },
        { prototype: 'table', name: 'a glass-and-steel desk', description: 'A minimalist desk—tempered glass top on slender chrome legs. Nothing on the surface except faint dust patterns.', boltedDown: false },
        { prototype: 'bed', name: 'a Japanese futon', description: 'A thin Japanese futon lies flat on a bamboo mat. No frame, no excess—just a place to sleep close to the ground.', quality: 'standard' },
      ],
      sittables: [
        {
          name: 'the futon',
          capacity: 2,
          emptyMsg:
            'The futon rests flat on bamboo, awaiting use.',
          occupiedMsg: '%s seated on the futon.',
        },
        {
          name: 'a wire mesh chair',
          capacity: 1,
          emptyMsg:
            'A Bertoia-style wire mesh chair sits at the desk, its diamond pattern casting grid shadows.',
          occupiedMsg: '%s perched on the wire chair.',
        },
      ],
    },

    '%B1_z24': {
      name: 'Smith Tower - 24th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: -10,
      y: 11,
      z: 24,
      exits: { south: '%B2_z24' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 24).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a steel loft ladder', description: 'A powder-coated white steel ladder is bolted to the mezzanine edge. Each rung is perfectly cylindrical, perfectly spaced.', boltedDown: true },
        { prototype: 'bed', name: 'a loft mattress', description: 'A memory foam mattress lies directly on the mezzanine floor. White sheets. No pillows visible—they must be stored elsewhere.', quality: 'nice' },
        { prototype: 'furniture', name: 'a single canvas print', description: 'One large canvas hangs on the exposed brick—an abstract composition of grey and white rectangles. No frame.', boltedDown: true },
        { prototype: 'table', name: 'a nesting side table', description: 'A set of white nesting tables—only the largest is in use. The smaller ones stack invisibly beneath.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a Scandinavian armchair',
          capacity: 1,
          emptyMsg:
            'A pale oak armchair with white cushions sits beneath the mezzanine, its form simple and inviting.',
          occupiedMsg: '%s settled in the Scandinavian armchair.',
        },
        {
          name: 'the loft mattress',
          capacity: 1,
          emptyMsg:
            'The loft mattress is visible above, accessible by the steel ladder.',
          occupiedMsg: '%s resting up in the loft.',
        },
      ],
    },

    '%C1_z24': {
      name: 'Smith Tower - 24th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -13,
      y: 10,
      z: 24,
      exits: { south: '%C2_z24', east: '%EL_z24' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 24).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a tatami sleeping mat', description: 'A thin tatami mat lies on the polished concrete floor. A folded grey blanket rests at its foot. Monastic in its simplicity.', quality: 'cheap' },
        { prototype: 'furniture', name: 'wall-mounted coat hooks', description: 'Three minimalist coat hooks in brushed steel are mounted in a vertical line. Chrome spheres, nothing more.', boltedDown: true },
        { prototype: 'furniture', name: 'a recessed wall niche', description: 'A small rectangular niche is carved into the wall, lit from within by a dim LED strip. A single ceramic bowl sits inside.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the tatami mat',
          capacity: 1,
          emptyMsg:
            'The tatami mat lies flat on concrete, a rectangle of calm.',
          occupiedMsg: '%s seated on the tatami.',
        },
      ],
    },

    '%B2_z24': {
      name: 'Smith Tower - 24th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -11,
      y: 10,
      z: 24,
      exits: {
        north: '%B1_z24',
        east: '%B3_z24',
        west: { room: '%EL_z24', door: '%D_B2_z24' },
        south: '%B4_z24',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 24).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a sectional in grey linen', description: 'A large L-shaped sectional in dove grey linen dominates the room. Low-slung, deep-seated, almost architectural in its simplicity.', boltedDown: false },
        { prototype: 'table', name: 'a marble coffee table', description: 'A rectangular coffee table with a Carrara marble top on a matte black steel base. The marble is cool to the touch.', boltedDown: false },
        { prototype: 'furniture', name: 'a built-in media wall', description: 'One wall is covered in white lacquered panels hiding storage compartments and what was once an entertainment system. Push-to-open mechanisms, no visible hardware.', boltedDown: true },
        { prototype: 'furniture', name: 'a flush entry closet', description: 'Near the entrance, a full-height closet door blends seamlessly into the wall. Only a narrow shadow gap reveals its presence.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the grey sectional',
          capacity: 4,
          emptyMsg:
            'The grey sectional spans the room, an invitation to horizontal living.',
          occupiedMsg: '%s sprawled across the sectional.',
        },
      ],
    },

    '%B3_z24': {
      name: 'Smith Tower - 24th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: -10,
      y: 10,
      z: 24,
      exits: { west: '%B2_z24' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 24).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a wall of white built-ins', description: 'Floor-to-ceiling built-in shelving in matte white lines the walls. Books are arranged by height, spines color-coordinated in muted tones. Intentionally curated emptiness.', boltedDown: true },
        { prototype: 'table', name: 'a floating desk', description: 'A white floating desk is cantilevered from the wall beneath the window bay. No legs, no drawers—just a clean horizontal surface.', boltedDown: true },
        { prototype: 'furniture', name: 'a paper floor lamp', description: 'A tall paper lantern floor lamp stands in the corner. Its soft glow diffuses through rice paper, casting no shadows.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a white leather Eames chair',
          capacity: 1,
          emptyMsg:
            'A white leather Eames lounge chair and ottoman sit angled toward the windows. Classic, pristine, barely used.',
          occupiedMsg: '%s reclined in the Eames chair.',
        },
        {
          name: 'a mesh desk chair',
          capacity: 1,
          emptyMsg:
            'A high-backed mesh ergonomic chair is tucked under the floating desk.',
          occupiedMsg: '%s seated at the desk.',
        },
      ],
    },

    '%C2_z24': {
      name: 'Smith Tower - 24th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -13,
      y: 9,
      z: 24,
      exits: { north: '%C1_z24', east: '%C3_z24' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 24).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a daybed', description: 'A low daybed in natural linen faces the windows. No arms, no back—just a rectangular cushion on a slim steel frame.', boltedDown: false },
        { prototype: 'table', name: 'a glass side table', description: 'A cylindrical glass side table stands beside the daybed. Clear glass, invisible almost.', boltedDown: false },
        { prototype: 'furniture', name: 'a concealed radiator', description: 'The old steam radiator is hidden behind a custom white metal grille. Warm air rises through the horizontal slats.', boltedDown: true },
        { prototype: 'furniture', name: 'sheer white curtains', description: 'Floor-length sheer white curtains hang from a concealed ceiling track. They soften the light without blocking it.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the daybed',
          capacity: 2,
          emptyMsg:
            'The daybed stretches toward the windows, bathed in diffused light.',
          occupiedMsg: '%s reclining on the daybed.',
        },
      ],
    },

    '%C3_z24': {
      name: 'Smith Tower - 24th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -12,
      y: 9,
      z: 24,
      exits: {
        north: { room: '%EL_z24', door: '%D_C3_z24' },
        west: '%C2_z24',
        east: '%C4_z24',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 24).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a concrete bench', description: 'A low concrete bench is built into the wall beside the entrance. Its surface is smooth and cold—a place to remove shoes, nothing more.', boltedDown: true },
        { prototype: 'furniture', name: 'a hidden coat closet', description: 'A full-height door panel conceals a coat closet. The push-latch mechanism opens silently, revealing an empty interior with white hangers.', boltedDown: true },
        { prototype: 'table', name: 'a slim console shelf', description: 'A thin floating shelf in white runs beneath a frameless mirror. Room for keys. Nothing else.', boltedDown: true },
        { prototype: 'furniture', name: 'a frameless wall mirror', description: 'A large frameless mirror is flush-mounted to the wall. No decorative edge, just reflection meeting wall.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the concrete bench',
          capacity: 2,
          emptyMsg:
            'The concrete bench offers a cool, minimal place to sit.',
          occupiedMsg: '%s perched on the concrete bench.',
        },
      ],
    },

    '%C4_z24': {
      name: 'Smith Tower - 24th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -11,
      y: 9,
      z: 24,
      exits: { west: '%C3_z24' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 24).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'an oak platform bed', description: 'A platform bed in light oak floats in the alcove. The mattress is wrapped in white cotton. A single grey throw folded at the foot.', quality: 'nice' },
        { prototype: 'furniture', name: 'a garment rack', description: 'A minimalist chrome garment rack stands against one wall. Bare metal, no hangers—just negative space.', boltedDown: false },
        { prototype: 'furniture', name: 'a floor-standing mirror', description: 'A tall rectangular mirror leans against the wall at a slight angle. Its frame is thin black metal.', boltedDown: false },
        { prototype: 'table', name: 'a cylindrical nightstand', description: 'A white cylindrical nightstand sits beside the platform bed. Its surface holds nothing but a small succulent, desiccated.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the oak platform bed',
          capacity: 2,
          emptyMsg:
            'The platform bed hovers in its alcove, serene and low.',
          occupiedMsg: '%s resting on the platform bed.',
        },
      ],
    },

    '%B4_z24': {
      name: 'Smith Tower - 24th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: -10,
      y: 9,
      z: 24,
      exits: { north: '%B2_z24' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 24).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a wall bed', description: 'A wall bed folds down from white lacquered panels. When deployed, it reveals a clean mattress on a simple metal frame. When stored, it vanishes entirely.', quality: 'standard' },
        { prototype: 'furniture', name: 'a wall bed cabinet', description: 'The wall bed stores into seamless white cabinet panels. No handles, no seams visible when closed—just a blank white wall.', boltedDown: true },
        { prototype: 'furniture', name: 'integrated shelving', description: 'Narrow white shelves are built into the wall beside the window. Their contents are sparse: a few books arranged by size, a glass paperweight, empty space.', boltedDown: true },
        { prototype: 'table', name: 'a drop-leaf wall desk', description: 'A hinged desktop folds down from the wall—white laminate on a steel bracket. When not in use, it folds flush and disappears.', boltedDown: true },
        { prototype: 'furniture', name: 'a tower dresser', description: 'A narrow six-drawer tower dresser in white stands in the corner. Soft-close drawers open with a gentle push.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the wall bed',
          capacity: 2,
          emptyMsg:
            'The wall bed is folded down, its mattress exposed and inviting.',
          occupiedMsg: '%s stretched out on the wall bed.',
        },
      ],
    },
  },
};
