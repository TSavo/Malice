// Smith Tower - Condo Floor (z=27) - Tropical Tiki Theme
// Rattan furniture, bamboo accents, tiki mugs, palm fronds, mid-century Polynesian

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z27' },
    },

    // Rentable locks
    '%RL_A2_z27': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z27': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z27': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z27': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z27'],
    },
    '%D_B2_z27': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z27'],
    },
    '%D_C3_z27': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z27'],
    },

    // Elevator landing
    '%EL_z27': {
      name: 'Smith Tower - 27th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -12,
      y: 10,
      z: 27,
      exits: {
        north: { room: '%A2_z27', door: '%D_A2_z27' },
        east: { room: '%B2_z27', door: '%D_B2_z27' },
        south: { room: '%C3_z27', door: '%D_C3_z27' },
        west: '%C1_z27',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z27': {
      name: 'Smith Tower - 27th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -13,
      y: 11,
      z: 27,
      exits: { east: '%A2_z27' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 27).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a rattan coffee table', description: 'A low rattan coffee table with a glass top sits before the seating area, its woven frame darkened with age. Tiki coasters are scattered across the surface.', boltedDown: false },
        { prototype: 'furniture', name: 'a bamboo bar counter', description: 'A built-in bamboo bar counter runs along one wall, its surface scored with countless drink rings. Shelves behind hold dusty tiki mugs shaped like grimacing gods and hula girls.', boltedDown: true },
        { prototype: 'furniture', name: 'a palm frond ceiling fan', description: 'A ceiling fan with palm-frond-shaped blades hangs motionless overhead, its pull chain a miniature tiki head.', boltedDown: true },
        { prototype: 'furniture', name: 'outrigger canoe paddles', description: 'Two weathered outrigger canoe paddles are mounted in an X pattern on the wall, their surfaces carved with traditional Polynesian patterns.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a rattan peacock chair',
          capacity: 1,
          emptyMsg:
            'A dramatic peacock chair with a fanned rattan back dominates one corner, its cushion covered in faded hibiscus print.',
          occupiedMsg: '%s enthroned in the peacock chair.',
        },
        {
          name: 'a wicker loveseat',
          capacity: 2,
          emptyMsg:
            'A wicker loveseat with tropical-print cushions faces the window.',
          occupiedMsg: '%s lounging on the wicker loveseat.',
        },
      ],
    },

    '%A2_z27': {
      name: 'Smith Tower - 27th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -12,
      y: 11,
      z: 27,
      exits: {
        west: '%A1_z27',
        east: '%A3_z27',
        south: { room: '%EL_z27', door: '%D_A2_z27' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 27).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a bamboo four-poster bed', description: 'A queen-sized bed with a bamboo four-poster frame dominates the room. Sheer mosquito netting drapes from the canopy, yellowed with age but still intact.', quality: 'nice' },
        { prototype: 'furniture', name: 'a capiz shell closet', description: 'Built-in closet doors are inlaid with rows of translucent capiz shells, catching what light filters through the windows. The closet is mostly empty.', boltedDown: true },
        { prototype: 'table', name: 'a carved tiki nightstand', description: 'A nightstand carved to resemble a squat tiki god holds a pufferfish lamp, its dried body preserved under shellac.', boltedDown: false },
        { prototype: 'furniture', name: 'a volcano lamp', description: 'A volcano lamp sits on the dresser, its ceramic cone dormant. When powered, it would have glowed with bubbling red light.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the bamboo bed',
          capacity: 2,
          emptyMsg:
            'The bamboo bed waits beneath its canopy of mosquito netting.',
          occupiedMsg: '%s resting beneath the mosquito netting.',
        },
      ],
    },

    '%A3_z27': {
      name: 'Smith Tower - 27th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -11,
      y: 11,
      z: 27,
      exits: { west: '%A2_z27' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 27).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a tiki-themed galley kitchen', description: 'A narrow galley kitchen runs along one wall, its cabinets faced with split bamboo. Tiki mug hooks hang below the upper cabinets, a few ceramic faces still dangling there.', boltedDown: true },
        { prototype: 'table', name: 'a bamboo writing desk', description: 'A desk built from thick bamboo poles sits under the window. Its surface is a woven rattan mat under glass, decorated with pressed tropical leaves.', boltedDown: false },
        { prototype: 'furniture', name: 'a rattan daybed', description: 'A rattan daybed with a thick cushion serves as both couch and guest bed. Tropical-print throw pillows are piled at one end.', boltedDown: false },
        { prototype: 'furniture', name: 'fish netting decor', description: 'Fish netting is draped across one corner of the ceiling, tangled with glass floats and dried starfish.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the rattan daybed',
          capacity: 2,
          emptyMsg:
            'The rattan daybed sits piled with tropical pillows.',
          occupiedMsg: '%s lounging on the daybed.',
        },
        {
          name: 'a bamboo stool',
          capacity: 1,
          emptyMsg:
            'A bamboo stool with a woven seat is tucked under the desk.',
          occupiedMsg: '%s perched on the bamboo stool.',
        },
      ],
    },

    '%B1_z27': {
      name: 'Smith Tower - 27th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: -10,
      y: 11,
      z: 27,
      exits: { south: '%B2_z27' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 27).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a bamboo loft ladder', description: 'A sturdy bamboo ladder is lashed to the mezzanine edge with hemp rope, leading up to the sleeping loft. The rungs are smooth from use.', boltedDown: true },
        { prototype: 'bed', name: 'a platform bed with palm mat', description: 'A low platform bed on the mezzanine is covered with a woven palm mat and a thin futon. Mosquito netting can be drawn around it.', quality: 'standard' },
        { prototype: 'furniture', name: 'a double-hulled canoe shelf', description: 'A decorative shelf built to resemble a miniature double-hulled canoe hangs on the wall, holding carved wooden figures and shells.', boltedDown: true },
        { prototype: 'table', name: 'a drum table', description: 'A low table made from an actual Polynesian drum sits before the seating area. The drumhead is covered with glass.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a papasan chair',
          capacity: 1,
          emptyMsg:
            'A large papasan chair with a faded tropical cushion sits beneath the mezzanine.',
          occupiedMsg: '%s curled up in the papasan.',
        },
        {
          name: 'the loft bed',
          capacity: 2,
          emptyMsg:
            'The loft bed is visible above, accessible by the bamboo ladder.',
          occupiedMsg: '%s up in the loft.',
        },
      ],
    },

    '%C1_z27': {
      name: 'Smith Tower - 27th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -13,
      y: 10,
      z: 27,
      exits: { south: '%C2_z27', east: '%EL_z27' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 27).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a bamboo cot', description: 'A narrow cot with a bamboo frame is wedged into the corner, covered with a thin mat and a batik-print blanket.', quality: 'cheap' },
        { prototype: 'furniture', name: 'bamboo wall hooks', description: 'A row of bamboo hooks is mounted on the wall, carved to resemble tiki faces. One holds a faded lei.', boltedDown: true },
        { prototype: 'furniture', name: 'a carved coconut ashtray', description: 'A large carved coconut serves as an ashtray on a tiny shelf, its interior smooth and blackened with use.', boltedDown: false },
        { prototype: 'furniture', name: 'shell curtains', description: 'Strings of small shells hang in the doorway, clicking softly with any movement of air.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the bamboo cot',
          capacity: 1,
          emptyMsg:
            'The bamboo cot waits in its corner, batik blanket neatly folded.',
          occupiedMsg: '%s resting on the bamboo cot.',
        },
      ],
    },

    '%B2_z27': {
      name: 'Smith Tower - 27th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -11,
      y: 10,
      z: 27,
      exits: {
        north: '%B1_z27',
        east: '%B3_z27',
        west: { room: '%EL_z27', door: '%D_B2_z27' },
        south: '%B4_z27',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 27).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a curved rattan sectional', description: 'A large curved rattan sectional with thick floral cushions dominates the room, arranged around a central point.', boltedDown: false },
        { prototype: 'table', name: 'a tiki log coffee table', description: 'A coffee table made from a hollowed log sits at the center of the sectional. Carved tiki faces ring its circumference, grimacing at anyone who approaches.', boltedDown: false },
        { prototype: 'furniture', name: 'a bamboo entertainment hutch', description: 'A built-in bamboo hutch fills one wall, its shelves holding a dead television, a collection of Hawaiian vinyl records, and ceramic hula dancers.', boltedDown: true },
        { prototype: 'furniture', name: 'a tiki god umbrella stand', description: 'A tall ceramic tiki god serves as an umbrella stand near the entrance, its hollow head ready to receive offerings or umbrellas.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the rattan sectional',
          capacity: 4,
          emptyMsg:
            'The curved sectional embraces the room, its floral cushions faded but inviting.',
          occupiedMsg: '%s sunk into the rattan sectional.',
        },
      ],
    },

    '%B3_z27': {
      name: 'Smith Tower - 27th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: -10,
      y: 10,
      z: 27,
      exits: { west: '%B2_z27' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 27).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'bamboo bookshelves', description: 'Floor-to-ceiling bamboo shelving is built into the walls, holding books on Polynesian history, travel guides to the South Pacific, and vintage tiki bar recipes.', boltedDown: true },
        { prototype: 'table', name: 'a carved koa wood desk', description: 'A beautiful desk carved from dark koa wood sits in the window bay. Its surface is inlaid with mother-of-pearl in wave patterns.', boltedDown: false },
        { prototype: 'furniture', name: 'a hanging pufferfish lamp', description: 'A dried pufferfish has been converted into a lamp, hanging from the ceiling by a brass chain. Its spines cast spiky shadows when lit.', boltedDown: true },
        { prototype: 'furniture', name: 'a collection of tiki mugs', description: 'A glass display case holds dozens of vintage tiki mugs in various shapes—skulls, moai heads, coconuts, mermaids, and volcano bowls.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a high-backed rattan chair',
          capacity: 1,
          emptyMsg:
            'A high-backed rattan throne chair sits by the window, fit for a Polynesian king.',
          occupiedMsg: '%s seated regally in the rattan throne.',
        },
        {
          name: 'a koa wood desk chair',
          capacity: 1,
          emptyMsg:
            'A matching koa wood chair is tucked under the desk.',
          occupiedMsg: '%s seated at the koa wood desk.',
        },
      ],
    },

    '%C2_z27': {
      name: 'Smith Tower - 27th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -13,
      y: 9,
      z: 27,
      exits: { north: '%C1_z27', east: '%C3_z27' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 27).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a wicker settee', description: 'A wicker settee with sun-bleached cushions faces the window, its frame creaking with age but still sturdy.', boltedDown: false },
        { prototype: 'table', name: 'a coconut shell side table', description: 'A side table with a base made from clustered coconut shells holds a ceramic hula girl lamp, her grass skirt frozen mid-sway.', boltedDown: false },
        { prototype: 'furniture', name: 'a bamboo room divider', description: 'A folding bamboo room divider painted with tropical birds stands in one corner, its panels sun-faded to pastels.', boltedDown: false },
        { prototype: 'furniture', name: 'lauhala wall mats', description: 'Woven lauhala mats are hung on the walls as decoration, their geometric patterns typical of Hawaiian craft.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the wicker settee',
          capacity: 2,
          emptyMsg:
            'The wicker settee faces the fading afternoon light, cushions bleached pale.',
          occupiedMsg: '%s settled into the wicker settee.',
        },
      ],
    },

    '%C3_z27': {
      name: 'Smith Tower - 27th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -12,
      y: 9,
      z: 27,
      exits: {
        north: { room: '%EL_z27', door: '%D_C3_z27' },
        west: '%C2_z27',
        east: '%C4_z27',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 27).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a rattan bench', description: 'A rattan bench with a woven seat sits against the wall, convenient for removing shoes. A faded lei hangs from one arm.', boltedDown: false },
        { prototype: 'furniture', name: 'a tiki mask coat rack', description: 'A carved tiki mask is mounted on the wall, its elongated nose and brow serving as hooks for coats and bags.', boltedDown: true },
        { prototype: 'furniture', name: 'a capiz shell mail basket', description: 'A basket inlaid with capiz shells hangs by the door for collecting mail that will never come.', boltedDown: true },
        { prototype: 'table', name: 'a bamboo console', description: 'A narrow bamboo console holds a ceramic bowl shaped like a clamshell, meant for keys and small items.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the rattan bench',
          capacity: 2,
          emptyMsg:
            'The rattan bench offers a place to remove shoes, a faded lei draped over one arm.',
          occupiedMsg: '%s waiting on the rattan bench.',
        },
      ],
    },

    '%C4_z27': {
      name: 'Smith Tower - 27th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -11,
      y: 9,
      z: 27,
      exits: { west: '%C3_z27' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 27).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a platform bed with tapa canopy', description: 'A low platform bed fills the recessed alcove, its headboard made of woven bamboo. A tapa cloth canopy drapes overhead, printed with traditional Polynesian patterns.', quality: 'nice' },
        { prototype: 'furniture', name: 'a bamboo wardrobe', description: 'A freestanding bamboo wardrobe serves as a closet, its doors decorated with carved tropical flowers. A few vintage aloha shirts still hang inside.', boltedDown: false },
        { prototype: 'furniture', name: 'a shell-framed mirror', description: 'A full-length mirror is framed with an elaborate arrangement of shells—cowries, conchs, and starfish glued in spiraling patterns.', boltedDown: true },
        { prototype: 'table', name: 'a carved tiki nightstand', description: 'A nightstand carved from a single piece of dark wood features a tiki face as its front panel. A conch shell sits atop it, ready to be used as a horn.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the platform bed',
          capacity: 2,
          emptyMsg:
            'The platform bed waits beneath its tapa cloth canopy, inviting tropical dreams.',
          occupiedMsg: '%s resting beneath the tapa canopy.',
        },
      ],
    },

    '%B4_z27': {
      name: 'Smith Tower - 27th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: -10,
      y: 9,
      z: 27,
      exits: { north: '%B2_z27' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 27).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a fold-down bamboo bed', description: 'A Murphy-style bed with a bamboo frame folds down from a cabinet decorated with carved palm trees. The mattress is covered with a batik-print spread.', quality: 'standard' },
        { prototype: 'furniture', name: 'a bamboo bed cabinet', description: 'The fold-down bed hides within a tall bamboo cabinet painted with a sunset beach scene. When closed, the room feels twice as large.', boltedDown: true },
        { prototype: 'furniture', name: 'bamboo floating shelves', description: 'Floating bamboo shelves are mounted around the window, holding carved wooden birds, coral pieces, and a collection of sand from different beaches in small jars.', boltedDown: true },
        { prototype: 'table', name: 'a fold-down rattan desk', description: 'A fold-down desk with a rattan-wrapped frame is hinged to the wall. When open, its surface is just large enough for writing.', boltedDown: true },
        { prototype: 'furniture', name: 'a small bamboo dresser', description: 'A compact bamboo dresser is wedged into the corner, its drawer pulls shaped like small tiki faces.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the bamboo bed',
          capacity: 2,
          emptyMsg:
            'The bamboo bed is folded down, batik spread smoothed neatly.',
          occupiedMsg: '%s stretched out on the bamboo bed.',
        },
      ],
    },
  },
};
