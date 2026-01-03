// Smith Tower - 6th Floor Condos
// Mid-century modern restoration - sleek lines, teak, atomic-age aesthetics, architect's vision abandoned

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z6' },
    },

    // Rentable locks
    '%RL_A2_z6': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z6': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z6': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z6': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z6'],
    },
    '%D_B2_z6': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z6'],
    },
    '%D_C3_z6': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z6'],
    },

    // Elevator landing
    '%EL_z6': {
      name: 'Smith Tower - 6th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -12,
      y: 10,
      z: 6,
      exits: {
        north: { room: '%A2_z6', door: '%D_A2_z6' },
        east: { room: '%B2_z6', door: '%D_B2_z6' },
        south: { room: '%C3_z6', door: '%D_C3_z6' },
        west: '%C1_z6',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z6': {
      name: 'Smith Tower - 6th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -13,
      y: 11,
      z: 6,
      exits: { east: '%A2_z6' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 6).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a teak coffee table', description: 'A low teak coffee table with tapered legs and a kidney-bean shape. Classic mid-century design, still beautiful despite scratches.', boltedDown: false },
        { prototype: 'furniture', name: 'a minimalist kitchenette', description: 'The kitchenette features clean lines, stainless steel, and teak cabinetry. An Atomic-era Sunbeam toaster sits on the counter.', boltedDown: true },
        { prototype: 'furniture', name: 'a Danish wall unit', description: 'A modular teak wall unit spans the room, its shelves holding a Eames House bird, art books, and a dusty Noguchi lamp.', boltedDown: true },
        { prototype: 'furniture', name: 'a sunburst clock', description: 'A George Nelson sunburst clock hangs on the wall, its brass rays tarnished. The hands are frozen at 4:20.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'an Eames lounge',
          capacity: 1,
          emptyMsg: 'A genuine Eames lounge chair and ottoman in black leather and rosewood waits by the window.',
          occupiedMsg: '%s reclined in the Eames lounge.',
        },
        {
          name: 'a Barcelona sofa',
          capacity: 2,
          emptyMsg: 'A Mies van der Rohe Barcelona sofa in white leather sits against the wall.',
          occupiedMsg: '%s seated on the Barcelona sofa.',
        },
      ],
    },

    '%A2_z6': {
      name: 'Smith Tower - 6th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -12,
      y: 11,
      z: 6,
      exits: {
        west: '%A1_z6',
        east: '%A3_z6',
        south: { room: '%EL_z6', door: '%D_A2_z6' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 6).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a platform bed', description: 'A low teak platform bed with clean lines. The headboard integrates floating nightstands. White linen bedding is grey with dust.', quality: 'nice' },
        { prototype: 'furniture', name: 'teak sliding closet', description: 'Sliding closet doors in teak with recessed pulls. Inside, a few suits hang on wooden hangers, mothballs scattered on the floor.', boltedDown: true },
        { prototype: 'furniture', name: 'a Nakashima dresser', description: 'A George Nakashima-style dresser in walnut with live-edge drawer fronts. A masterpiece of woodworking, dusty but intact.', boltedDown: false },
        { prototype: 'furniture', name: 'a pendant lamp', description: 'A white Artichoke pendant lamp hangs over the bed, its leaves slightly askew. Danish design at its finest.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the platform bed',
          capacity: 2,
          emptyMsg: 'The low platform bed waits, its integrated nightstands empty.',
          occupiedMsg: '%s resting on the teak platform bed.',
        },
      ],
    },

    '%A3_z6': {
      name: 'Smith Tower - 6th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -11,
      y: 11,
      z: 6,
      exits: { west: '%A2_z6' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 6).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a streamlined kitchen', description: 'The galley kitchen is all clean lines and stainless steel, with teak cabinet fronts. A vintage Jetsons-style blender sits on the counter.', boltedDown: true },
        { prototype: 'table', name: 'an Aalto desk', description: 'An Alvar Aalto desk in birch with curved legs sits beneath the window. An Anglepoise lamp perches on one corner.', boltedDown: false },
        { prototype: 'furniture', name: 'a daybed', description: 'A teak daybed with clean lines serves as both couch and bed. The original wool upholstery has faded but holds together.', boltedDown: false },
        { prototype: 'furniture', name: 'an Arco lamp', description: 'A Castiglioni Arco floor lamp arches over the seating area, its marble base anchoring the stainless steel arc.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the daybed',
          capacity: 2,
          emptyMsg: 'The teak daybed waits, a single Marimekko pillow at one end.',
          occupiedMsg: '%s lounging on the daybed.',
        },
        {
          name: 'an Eames DCW chair',
          capacity: 1,
          emptyMsg: 'A molded plywood DCW chair sits at the desk.',
          occupiedMsg: '%s seated at the Aalto desk.',
        },
      ],
    },

    '%B1_z6': {
      name: 'Smith Tower - 6th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: -10,
      y: 11,
      z: 6,
      exits: { south: '%B2_z6' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 6).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a steel ship ladder', description: 'A steep industrial ship ladder in brushed steel leads to the mezzanine. The perforated treads are slip-resistant.', boltedDown: true },
        { prototype: 'bed', name: 'a Japanese futon', description: 'A traditional Japanese futon rests on a low teak platform in the loft. Minimalist and intentional.', quality: 'standard' },
        { prototype: 'furniture', name: 'an Egg chair', description: 'An Arne Jacobsen Egg chair in orange wool sits beneath the loft, its curved shell inviting.', boltedDown: false },
        { prototype: 'table', name: 'a Noguchi coffee table', description: 'An Isamu Noguchi coffee table with its distinctive curved wood base and glass top. Dusty but undamaged.', boltedDown: false },
        { prototype: 'furniture', name: 'a mobile sculpture', description: 'A Calder-style mobile hangs from the ceiling, its shapes gently rotating in any breeze.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the Egg chair',
          capacity: 1,
          emptyMsg: 'The orange Egg chair curves invitingly.',
          occupiedMsg: '%s cocooned in the Egg chair.',
        },
        {
          name: 'the loft futon',
          capacity: 2,
          emptyMsg: 'The Japanese futon is visible in the loft above.',
          occupiedMsg: '%s resting on the futon.',
        },
      ],
    },

    '%C1_z6': {
      name: 'Smith Tower - 6th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -13,
      y: 10,
      z: 6,
      exits: { south: '%C2_z6', east: '%EL_z6' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 6).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a built-in sleeping niche', description: 'A sleeping niche is recessed into the wall, Japanese-style. The thin mattress fits precisely, a single reading light recessed above.', quality: 'standard' },
        { prototype: 'furniture', name: 'a Shaker peg rail', description: 'A long peg rail in the Shaker style runs the length of one wall. Elegant hooks hold nothing now.', boltedDown: true },
        { prototype: 'furniture', name: 'floating shelves', description: 'Teak floating shelves project from the wall in an asymmetric arrangement. A few small sculptures remain.', boltedDown: true },
        { prototype: 'furniture', name: 'rice paper panels', description: 'Shoji-style rice paper panels cover the window, filtering light softly. Some panels are torn.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the sleeping niche',
          capacity: 1,
          emptyMsg: 'The recessed sleeping niche is intimate, almost womb-like.',
          occupiedMsg: '%s curled in the sleeping niche.',
        },
      ],
    },

    '%B2_z6': {
      name: 'Smith Tower - 6th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -11,
      y: 10,
      z: 6,
      exits: {
        north: '%B1_z6',
        east: '%B3_z6',
        west: { room: '%EL_z6', door: '%D_B2_z6' },
        south: '%B4_z6',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 6).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a modular sofa', description: 'A modular sofa in burnt orange wool can be reconfigured at will. Currently arranged in a loose conversation grouping.', boltedDown: false },
        { prototype: 'table', name: 'a stone slab table', description: 'A massive stone slab rests on a simple metal frame, serving as a coffee table. Brutalist and beautiful.', boltedDown: false },
        { prototype: 'furniture', name: 'a media credenza', description: 'A long teak credenza with sliding doors hides a vintage hi-fi system. The turntable still has a record on it.', boltedDown: false },
        { prototype: 'furniture', name: 'a built-in bar', description: 'A compact bar is built into one corner, its mirrored back reflecting dusty bottles of vintage spirits.', boltedDown: true },
        { prototype: 'furniture', name: 'a Saarinen tulip table', description: 'A small Saarinen tulip dining table with matching chairs occupies the window bay.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the modular sofa',
          capacity: 4,
          emptyMsg: 'The orange modular sofa invites rearrangement.',
          occupiedMsg: '%s settled into the modular sofa.',
        },
        {
          name: 'tulip chairs',
          capacity: 2,
          emptyMsg: 'White tulip chairs surround the matching table.',
          occupiedMsg: '%s seated at the tulip table.',
        },
      ],
    },

    '%B3_z6': {
      name: 'Smith Tower - 6th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: -10,
      y: 10,
      z: 6,
      exits: { west: '%B2_z6' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 6).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'teak bookshelves', description: 'Built-in teak bookshelves hold architecture monographs, design magazines, and a few Penguin classics with orange spines.', boltedDown: true },
        { prototype: 'table', name: 'a partners desk', description: 'A large partners desk in teak with leather inlay seats two. Architectural drawings are rolled in a brass stand.', boltedDown: false },
        { prototype: 'chair', name: 'a Swan chair', description: 'An Arne Jacobsen Swan chair in grey wool sits angled toward the bay window. Sculptural and comfortable.', boltedDown: false },
        { prototype: 'furniture', name: 'a Sputnik chandelier', description: 'A brass Sputnik chandelier hangs from the ceiling, its many arms radiating outward. Half the bulbs are burned out.', boltedDown: true },
        { prototype: 'furniture', name: 'a drafting table', description: 'An adjustable drafting table with a built-in light stands by the window. A T-square rests on its surface.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Swan chair',
          capacity: 1,
          emptyMsg: 'The sculptural Swan chair invites contemplation.',
          occupiedMsg: '%s curved into the Swan chair.',
        },
        {
          name: 'desk chairs',
          capacity: 2,
          emptyMsg: 'Matching teak desk chairs wait at the partners desk.',
          occupiedMsg: '%s working at the partners desk.',
        },
      ],
    },

    '%C2_z6': {
      name: 'Smith Tower - 6th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -13,
      y: 9,
      z: 6,
      exits: { north: '%C1_z6', east: '%C3_z6' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 6).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a Womb chair', description: 'An Eero Saarinen Womb chair in persimmon wool with its matching ottoman. Enveloping and sculptural.', boltedDown: false },
        { prototype: 'table', name: 'a boomerang table', description: 'A boomerang-shaped side table in walnut and formica. Peak atomic age design.', boltedDown: false },
        { prototype: 'furniture', name: 'a modern radiator', description: 'A sleek panel radiator has replaced the old steam unit. Still functional, still warm.', boltedDown: true },
        { prototype: 'furniture', name: 'floor-to-ceiling drapes', description: 'Simple linen drapes in off-white run floor to ceiling. The fabric is faded but the hardware is polished brass.', boltedDown: true },
        { prototype: 'furniture', name: 'a Nelson bench', description: 'A George Nelson platform bench in birch and steel serves as a coffee table and display surface.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Womb chair',
          capacity: 1,
          emptyMsg: 'The persimmon Womb chair invites curling up.',
          occupiedMsg: '%s enveloped in the Womb chair.',
        },
      ],
    },

    '%C3_z6': {
      name: 'Smith Tower - 6th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -12,
      y: 9,
      z: 6,
      exits: {
        north: { room: '%EL_z6', door: '%D_C3_z6' },
        west: '%C2_z6',
        east: '%C4_z6',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 6).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bench', name: 'a slatted bench', description: 'A simple slatted bench in teak lines one wall, its design echoing Scandinavian spa furniture.', boltedDown: false },
        { prototype: 'furniture', name: 'a teak closet', description: 'A closet with teak slatted doors conceals storage. The interior is lined with cedar.', boltedDown: true },
        { prototype: 'furniture', name: 'a mail slot', description: 'A sleek brushed steel mail slot is set into the door. Minimalist and modern.', boltedDown: true },
        { prototype: 'furniture', name: 'a Bertoia sculpture', description: 'A small Harry Bertoia metal sculpture sits on a walnut pedestal, its wires catching light.', boltedDown: false },
        { prototype: 'furniture', name: 'terrazzo flooring', description: 'The floor is polished terrazzo with brass dividers. Original to the building but beautifully restored.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the teak bench',
          capacity: 2,
          emptyMsg: 'The slatted teak bench offers minimal seating.',
          occupiedMsg: '%s perched on the teak bench.',
        },
      ],
    },

    '%C4_z6': {
      name: 'Smith Tower - 6th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -11,
      y: 9,
      z: 6,
      exits: { west: '%C3_z6' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 6).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a cantilevered bed', description: 'A platform bed cantilevered from the wall, appearing to float. The effect is dramatic, the engineering sound.', quality: 'nice' },
        { prototype: 'furniture', name: 'a walnut wardrobe', description: 'A freestanding wardrobe in walnut with butterfly joints. The doors open to reveal a cedar-lined interior.', boltedDown: false },
        { prototype: 'furniture', name: 'a floor-to-ceiling mirror', description: 'A frameless mirror runs floor to ceiling, making the room feel twice its size.', boltedDown: true },
        { prototype: 'table', name: 'floating nightstands', description: 'Floating nightstands in walnut bracket the bed. A ceramic Akari lamp sits on one.', boltedDown: true },
        { prototype: 'furniture', name: 'wool carpet', description: 'A large wool area rug in cream with geometric patterns softens the concrete floor.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the floating bed',
          capacity: 2,
          emptyMsg: 'The cantilevered bed appears to hover above the floor.',
          occupiedMsg: '%s resting on the floating bed.',
        },
      ],
    },

    '%B4_z6': {
      name: 'Smith Tower - 6th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: -10,
      y: 9,
      z: 6,
      exits: { north: '%B2_z6' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 6).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a built-in captain bed', description: 'A captain bed is built into the wall, drawers beneath for storage. The teak frame is integrated seamlessly.', quality: 'standard' },
        { prototype: 'furniture', name: 'integrated storage', description: 'Floor-to-ceiling storage with teak fronts conceals everything. Recessed pulls maintain clean lines.', boltedDown: true },
        { prototype: 'furniture', name: 'clerestory shelving', description: 'High shelving runs above the window, holding a collection of pottery and small sculptures.', boltedDown: true },
        { prototype: 'table', name: 'a drop-leaf desk', description: 'A drop-leaf desk in walnut folds from the wall. When extended, it provides generous workspace.', boltedDown: true },
        { prototype: 'furniture', name: 'a wire dresser', description: 'A low dresser with wire frame and walnut top. Industrial materials, refined execution.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the captain bed',
          capacity: 2,
          emptyMsg: 'The built-in captain bed offers efficient comfort.',
          occupiedMsg: '%s resting on the captain bed.',
        },
      ],
    },
  },
};
