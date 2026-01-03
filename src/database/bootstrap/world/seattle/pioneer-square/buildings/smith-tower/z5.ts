// Smith Tower - Condo Floor (z=10)
// Condo layout repeated across floors 4–33

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z5' },
    },

    // Rentable locks
    '%RL_A2_z5': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z5': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z5': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z5': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z5'],
    },
    '%D_B2_z5': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z5'],
    },
    '%D_C3_z5': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z5'],
    },

    // Elevator landing
    '%EL_z5': {
      name: 'Smith Tower - 5th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -12,
      y: 10,
      z: 5,
      exits: {
        north: { room: '%A2_z5', door: '%D_A2_z5' },
        east: { room: '%B2_z5', door: '%D_B2_z5' },
        south: { room: '%C3_z5', door: '%D_C3_z5' },
        west: '%C1_z5',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z5': {
      name: 'Smith Tower - 5th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -13,
      y: 11,
      z: 5,
      exits: { east: '%A2_z5' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 5).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a coffee table', description: 'A low wooden coffee table sits before the couch, its surface ringed with water stains from forgotten glasses.', boltedDown: false },
        { prototype: 'furniture', name: 'a kitchenette counter', description: 'A built-in kitchenette counter runs along one wall. The small sink is dry, the electric burners cold. Cabinet doors hang slightly open.', boltedDown: true },
        { prototype: 'furniture', name: 'a wall-mounted shelf unit', description: 'Floor-to-ceiling shelving is built into the wall, holding dusty books, a ceramic vase, and a desiccated fern in a cracked pot.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a worn couch',
          capacity: 3,
          emptyMsg:
            'A faded couch sits against the wall, cushions compressed from years of use.',
          occupiedMsg: '%s sprawled on the couch.',
        },
      ],
    },

    '%A2_z5': {
      name: 'Smith Tower - 5th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -12,
      y: 11,
      z: 5,
      exits: {
        west: '%A1_z5',
        east: '%A3_z5',
        south: { room: '%EL_z5', door: '%D_A2_z5' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 5).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a queen bed', description: 'A queen bed sits against the wall, sheets grey with age but still intact. The mattress sags in the middle from years of use.', quality: 'standard' },
        { prototype: 'furniture', name: 'a mirrored closet', description: 'Built-in closet doors with age-spotted mirrors run the length of one wall. The closet is mostly empty, a few wire hangers dangling inside.', boltedDown: true },
        { prototype: 'table', name: 'a bedside table', description: 'A small bedside table holds a dead lamp and an empty water glass, both coated in dust.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the queen bed',
          capacity: 2,
          emptyMsg:
            'The bed waits, sheets rumpled as if someone just left.',
          occupiedMsg: '%s resting on the bed.',
        },
      ],
    },

    '%A3_z5': {
      name: 'Smith Tower - 5th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -11,
      y: 11,
      z: 5,
      exits: { west: '%A2_z5' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 5).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a galley kitchen', description: 'A narrow galley kitchen runs along one wall—sink, stove, small refrigerator, upper cabinets. Everything is built-in and dated, the appliances a harvest gold that screams 1970s renovation.', boltedDown: true },
        { prototype: 'table', name: 'a work desk', description: 'A simple desk sits under the window, its surface scratched and stained. An ancient desk lamp with a cracked shade perches on one corner.', boltedDown: false },
        { prototype: 'furniture', name: 'a futon frame', description: 'A wooden futon frame holds a thin mattress, serving as both couch and bed. The mattress is lumpy but serviceable.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the futon',
          capacity: 2,
          emptyMsg:
            'The futon sits folded in couch position.',
          occupiedMsg: '%s lounging on the futon.',
        },
        {
          name: 'a desk chair',
          capacity: 1,
          emptyMsg:
            'A rolling office chair sits at the desk, its vinyl cracked.',
          occupiedMsg: '%s sitting at the desk.',
        },
      ],
    },

    '%B1_z5': {
      name: 'Smith Tower - 5th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: -10,
      y: 11,
      z: 5,
      exits: { south: '%B2_z5' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 5).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a loft ladder', description: 'A sturdy wooden ladder is bolted to the mezzanine edge, leading up to the sleeping loft. The rungs are worn smooth from use.', boltedDown: true },
        { prototype: 'bed', name: 'a loft bed', description: 'A narrow mattress on a simple platform fills the mezzanine space. The ceiling is low enough to require ducking.', quality: 'cheap' },
        { prototype: 'furniture', name: 'a sagging couch', description: 'An old couch sits beneath the mezzanine, its fabric worn smooth at the armrests. Springs creak ominously when sat upon.', boltedDown: false },
        { prototype: 'table', name: 'a low bookshelf', description: 'A low bookshelf serves double duty as a side table. A few paperbacks and magazines remain, their covers faded.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the couch',
          capacity: 3,
          emptyMsg:
            'The couch waits beneath the mezzanine, cushions sagging invitingly.',
          occupiedMsg: '%s settled into the couch.',
        },
        {
          name: 'the loft bed',
          capacity: 1,
          emptyMsg:
            'The loft bed is visible above, accessible by ladder.',
          occupiedMsg: '%s up in the loft bed.',
        },
      ],
    },

    '%C1_z5': {
      name: 'Smith Tower - 5th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -13,
      y: 10,
      z: 5,
      exits: { south: '%C2_z5', east: '%EL_z5' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 5).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a military cot', description: 'A military-style cot is wedged into the corner, a wool blanket folded precisely at the foot. Spartan but functional.', quality: 'cheap' },
        { prototype: 'furniture', name: 'wall hooks', description: 'A row of brass hooks is mounted on the wall, designed for hanging coats and bags. One still holds an empty wire hanger.', boltedDown: true },
        { prototype: 'furniture', name: 'a small wall shelf', description: 'A narrow shelf is bolted above the cot, just wide enough for a few personal items. A dead flashlight and a cracked mug sit there now.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the cot',
          capacity: 1,
          emptyMsg:
            'The cot waits, blanket folded with military precision.',
          occupiedMsg: '%s lying on the cot.',
        },
      ],
    },

    '%B2_z5': {
      name: 'Smith Tower - 5th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -11,
      y: 10,
      z: 5,
      exits: {
        north: '%B1_z5',
        east: '%B3_z5',
        west: { room: '%EL_z5', door: '%D_B2_z5' },
        south: '%B4_z5',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 5).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a sectional sofa', description: 'A large L-shaped sectional dominates the room, its cushions sunken from years of use. The fabric is a nondescript brown that hides stains well.', boltedDown: false },
        { prototype: 'table', name: 'a glass coffee table', description: 'A glass-topped coffee table sits before the sectional, its metal frame tarnished. A few old magazines are fanned across its surface.', boltedDown: false },
        { prototype: 'furniture', name: 'an entertainment center', description: 'A built-in entertainment center fills one wall, its shelves holding a dead television and a collection of dusty DVDs. The power light hasn\'t blinked in years.', boltedDown: true },
        { prototype: 'furniture', name: 'a coat closet', description: 'A small coat closet is built into the wall near the entrance, its door slightly ajar. Wire hangers clink softly when the door moves.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the sectional',
          capacity: 4,
          emptyMsg:
            'The sectional sprawls across the room, waiting to swallow anyone who sits.',
          occupiedMsg: '%s sunk into the sectional.',
        },
      ],
    },

    '%B3_z5': {
      name: 'Smith Tower - 5th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: -10,
      y: 10,
      z: 5,
      exits: { west: '%B2_z5' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 5).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'built-in bookshelves', description: 'Floor-to-ceiling bookshelves are built into the walls, still holding a modest collection of hardbacks—classics, reference books, a few dog-eared mysteries.', boltedDown: true },
        { prototype: 'table', name: 'a writing desk', description: 'An antique writing desk sits in the window bay, its leather blotter cracked with age. A brass lamp with a green glass shade stands dark.', boltedDown: false },
        { prototype: 'chair', name: 'a wingback reading chair', description: 'A deep wingback chair in burgundy leather sits angled toward the window. The upholstery is cracked but the cushion still has life.', boltedDown: false },
        { prototype: 'furniture', name: 'a floor lamp', description: 'A tall floor lamp stands behind the chair, its shade yellowed. The bulb is dead.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the wingback chair',
          capacity: 1,
          emptyMsg:
            'The wingback chair waits by the window, inviting contemplation.',
          occupiedMsg: '%s curled up in the reading chair.',
        },
        {
          name: 'the desk chair',
          capacity: 1,
          emptyMsg:
            'A wooden desk chair is pushed under the writing desk.',
          occupiedMsg: '%s seated at the desk.',
        },
      ],
    },

    '%C2_z5': {
      name: 'Smith Tower - 5th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -13,
      y: 9,
      z: 5,
      exits: { north: '%C1_z5', east: '%C3_z5' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 5).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a loveseat', description: 'A compact loveseat faces the window, its fabric faded to an indeterminate beige. The cushions are flat but clean.', boltedDown: false },
        { prototype: 'table', name: 'a side table', description: 'A small side table holds a ceramic lamp with a beige shade. A water ring marks where a glass once sat.', boltedDown: false },
        { prototype: 'furniture', name: 'a radiator cover', description: 'An old steam radiator is hidden behind a decorative metal cover. The metal is warm to the touch—the heating still works, somehow.', boltedDown: true },
        { prototype: 'furniture', name: 'curtain rods', description: 'Brass curtain rods span the windows, holding sun-bleached curtains that were once a floral pattern.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the loveseat',
          capacity: 2,
          emptyMsg:
            'The loveseat faces the fading afternoon light.',
          occupiedMsg: '%s squeezed onto the loveseat.',
        },
      ],
    },

    '%C3_z5': {
      name: 'Smith Tower - 5th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -12,
      y: 9,
      z: 5,
      exits: {
        north: { room: '%EL_z5', door: '%D_C3_z5' },
        west: '%C2_z5',
        east: '%C4_z5',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 5).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a checkered couch', description: 'A couch with a faded checkered pattern sits against the wall, its cushions worn but structurally sound.', boltedDown: false },
        { prototype: 'furniture', name: 'an entry closet', description: 'A small closet is built into the wall beside the door, its interior dark. A few empty hangers dangle inside.', boltedDown: true },
        { prototype: 'furniture', name: 'a mail slot', description: 'An old brass mail slot is set into the door, tarnished with age. Letters haven\'t come this way in decades.', boltedDown: true },
        { prototype: 'table', name: 'a console table', description: 'A narrow console table holds a ceramic bowl for keys and a dead phone charging dock.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the couch',
          capacity: 3,
          emptyMsg:
            'The checkered couch offers a place to remove shoes before entering.',
          occupiedMsg: '%s relaxing on the checkered couch.',
        },
      ],
    },

    '%C4_z5': {
      name: 'Smith Tower - 5th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -11,
      y: 9,
      z: 5,
      exits: { west: '%C3_z5' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 5).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'an alcove bed', description: 'A bed fills the recessed alcove, half-hidden by a moth-eaten curtain on a tension rod. The mattress is lumpy but dry.', quality: 'standard' },
        { prototype: 'furniture', name: 'a clothing rack', description: 'A freestanding metal clothing rack serves as an open closet, a few hangers still holding faded garments.', boltedDown: false },
        { prototype: 'furniture', name: 'a wall mirror', description: 'A full-length mirror is mounted on the wall, its frame simple metal. The glass is spotted with age but still functional.', boltedDown: true },
        { prototype: 'table', name: 'a nightstand', description: 'A simple nightstand holds a dead alarm clock frozen at 3:47 and a paperback splayed open to a long-forgotten page.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the alcove bed',
          capacity: 2,
          emptyMsg:
            'The bed waits in its alcove, curtain half-drawn.',
          occupiedMsg: '%s tucked away in the alcove bed.',
        },
      ],
    },

    '%B4_z5': {
      name: 'Smith Tower - 5th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: -10,
      y: 9,
      z: 5,
      exits: { north: '%B2_z5' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 5).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a Murphy bed', description: 'A Murphy bed folds down from the wall cabinet, its mechanism still functional despite years of neglect. The mattress is thin but intact.', quality: 'standard' },
        { prototype: 'furniture', name: 'a Murphy bed cabinet', description: 'The Murphy bed folds into a tall wooden cabinet when not in use. The cabinet doors are scuffed from decades of opening and closing.', boltedDown: true },
        { prototype: 'furniture', name: 'built-in shelving', description: 'Shelving is built into the walls around the window, holding a mix of books, decorative items, and dust.', boltedDown: true },
        { prototype: 'table', name: 'a fold-down desk', description: 'A fold-down desk is hinged to the wall, its surface scarred with old scratches. When folded up, it disappears into the wall.', boltedDown: true },
        { prototype: 'furniture', name: 'a narrow dresser', description: 'A narrow dresser is wedged into the corner, its drawers sticking slightly when pulled.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Murphy bed',
          capacity: 2,
          emptyMsg:
            'The Murphy bed is folded down, its mattress exposed.',
          occupiedMsg: '%s stretched out on the Murphy bed.',
        },
      ],
    },
  },
};
