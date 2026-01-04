// Smith Tower - 5th Floor Condos
// 1980s time capsule - dated decor but better preserved, pastel colors and brass

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
      x: -2,
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
      x: -3,
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
        { prototype: 'table', name: 'a brass and glass coffee table', description: 'A low table with brass legs and a smoked glass top. Very 1980s. The glass is scratched but intact.', boltedDown: false },
        { prototype: 'furniture', name: 'a mauve kitchenette', description: 'The kitchenette features mauve laminate counters and oak-front cabinets. A microwave with a rotary dial sits on the counter.', boltedDown: true },
        { prototype: 'furniture', name: 'a brass etagere', description: 'A brass and glass etagere displays dusty crystal figurines and a collection of Hummel figurines.', boltedDown: true },
        { prototype: 'furniture', name: 'a ceiling fan', description: 'A brass ceiling fan with wicker blades hangs motionless. The pull chains dangle, one broken short.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a mauve sectional',
          capacity: 4,
          emptyMsg: 'A mauve leather sectional dominates the room, brass nail-head trim still gleaming.',
          occupiedMsg: '%s sunk into the mauve sectional.',
        },
      ],
    },

    '%A2_z5': {
      name: 'Smith Tower - 5th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
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
        { prototype: 'bed', name: 'a waterbed frame', description: 'A waterbed frame sits against the wall, its bladder long since drained and removed. The padded rails are covered in dusty rose velour.', quality: 'standard' },
        { prototype: 'furniture', name: 'mirrored closet doors', description: 'Floor-to-ceiling mirrored closet doors reflect the room. The glass is beveled at the edges, very upscale for its era.', boltedDown: true },
        { prototype: 'table', name: 'brass nightstands', description: 'Matching brass and glass nightstands flank the bed. One still holds a touch-lamp and a clock radio frozen at 11:47.', boltedDown: false },
        { prototype: 'furniture', name: 'a ceiling mirror', description: 'A mirror is mounted on the ceiling above where the bed sits. The adhesive has yellowed but it remains attached.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the waterbed frame',
          capacity: 2,
          emptyMsg: 'The empty waterbed frame offers only its padded rails to sit on.',
          occupiedMsg: '%s perched on the waterbed frame.',
        },
      ],
    },

    '%A3_z5': {
      name: 'Smith Tower - 5th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
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
        { prototype: 'furniture', name: 'an almond kitchenette', description: 'The galley kitchen features almond-colored appliances and peach formica counters. A Mr. Coffee machine sits unplugged on the counter.', boltedDown: true },
        { prototype: 'table', name: 'a glass-top desk', description: 'A glass-topped desk with chrome legs holds an ancient IBM PC, its beige plastic yellowed with age. The monitor is a small green-screen CRT.', boltedDown: false },
        { prototype: 'furniture', name: 'a daybed', description: 'A daybed with a brass frame and floral cushions serves as both seating and sleeping space. Throw pillows are piled high.', boltedDown: false },
        { prototype: 'furniture', name: 'venetian blinds', description: 'Dusty venetian blinds cover the windows, their cords tangled. A few slats are bent at odd angles.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the daybed',
          capacity: 2,
          emptyMsg: 'The daybed is piled with decorative pillows in peach and teal.',
          occupiedMsg: '%s nestled among the throw pillows.',
        },
        {
          name: 'a chrome desk chair',
          capacity: 1,
          emptyMsg: 'A chrome and leather desk chair waits at the computer.',
          occupiedMsg: '%s seated at the vintage computer.',
        },
      ],
    },

    '%B1_z5': {
      name: 'Smith Tower - 5th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
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
        { prototype: 'furniture', name: 'a spiral staircase', description: 'A tight spiral staircase with brass rails leads to the loft. The steps are carpeted in mauve shag.', boltedDown: true },
        { prototype: 'bed', name: 'a platform bed', description: 'A low platform bed with a lacquered black frame fills the loft. The geometric bedding is very Memphis Design.', quality: 'standard', boltedDown: true },
        { prototype: 'furniture', name: 'a leather pit group', description: 'A sunken conversation pit with modular leather seating in cream. Very Dynasty. The cushions are surprisingly intact.', boltedDown: true },
        { prototype: 'furniture', name: 'track lighting', description: 'Track lighting runs across the ceiling, its halogen bulbs long dead. The brass fixtures are tarnished.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the conversation pit',
          capacity: 4,
          emptyMsg: 'The sunken seating area invites intimate conversation.',
          occupiedMsg: '%s lounging in the conversation pit.',
        },
        {
          name: 'the platform bed',
          capacity: 2,
          emptyMsg: 'The low platform bed waits in the loft above.',
          occupiedMsg: '%s sprawled on the platform bed.',
        },
      ],
    },

    '%C1_z5': {
      name: 'Smith Tower - 5th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
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
        { prototype: 'bed', name: 'a trundle bed', description: 'A compact trundle bed with a brass frame. The lower bed slides out on casters, doubling the sleeping capacity.', quality: 'standard' },
        { prototype: 'furniture', name: 'a built-in vanity', description: 'A small vanity is built into one wall, its mirror surrounded by round bulb sockets. Most bulbs are burned out.', boltedDown: true },
        { prototype: 'furniture', name: 'peach wallpaper', description: 'The walls are covered in peach-colored wallpaper with a subtle geometric pattern. It is peeling at the seams.', boltedDown: true },
        { prototype: 'table', name: 'a wicker nightstand', description: 'A white wicker nightstand holds a ceramic lamp shaped like a swan.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the trundle bed',
          capacity: 1,
          emptyMsg: 'The trundle bed is made up with a dusty rose comforter.',
          occupiedMsg: '%s curled up on the trundle bed.',
        },
        {
          name: 'the vanity stool',
          capacity: 1,
          emptyMsg: 'A small upholstered stool sits at the vanity.',
          occupiedMsg: '%s seated at the vanity.',
        },
      ],
    },

    '%B2_z5': {
      name: 'Smith Tower - 5th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
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
        { prototype: 'furniture', name: 'a teal leather sofa', description: 'A bold teal leather sofa dominates the room, its angular shape very 1980s. Gold throw pillows are arranged precisely.', boltedDown: false },
        { prototype: 'table', name: 'a lucite coffee table', description: 'A clear lucite coffee table sits before the sofa, making the room feel larger. A glass bowl of dusty potpourri sits atop it.', boltedDown: false },
        { prototype: 'furniture', name: 'an oak entertainment center', description: 'A massive oak entertainment center with smoked glass doors holds a projection TV and a VCR. A stack of VHS tapes sits beside it.', boltedDown: true },
        { prototype: 'furniture', name: 'a wet bar', description: 'A built-in wet bar occupies one corner, its mirrored back reflecting dusty bottles. The brass rail is tarnished.', boltedDown: true },
        { prototype: 'furniture', name: 'vertical blinds', description: 'Floor-to-ceiling vertical blinds cover the windows in a dusty mauve. Several slats are bent or missing.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the teal sofa',
          capacity: 3,
          emptyMsg: 'The bold teal sofa waits, gold pillows precisely arranged.',
          occupiedMsg: '%s lounging on the teal leather.',
        },
        {
          name: 'bar stools',
          capacity: 2,
          emptyMsg: 'Chrome bar stools with cream leather seats line the wet bar.',
          occupiedMsg: '%s perched at the wet bar.',
        },
      ],
    },

    '%B3_z5': {
      name: 'Smith Tower - 5th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
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
        { prototype: 'furniture', name: 'oak bookshelves', description: 'Built-in oak bookshelves with brass hardware hold a collection of Reader\'s Digest condensed books and National Geographic magazines.', boltedDown: true },
        { prototype: 'table', name: 'a roll-top desk', description: 'A roll-top desk in golden oak dominates the bay window area. The tambour cover is jammed halfway open.', boltedDown: false },
        { prototype: 'chair', name: 'a swivel rocker', description: 'A plush swivel rocker in salmon velour sits angled for reading. It still swivels smoothly.', boltedDown: false },
        { prototype: 'furniture', name: 'a grandfather clock', description: 'A grandfather clock stands in the corner, its pendulum still. The face reads 2:17, frozen in time.', boltedDown: true },
        { prototype: 'furniture', name: 'shag carpet', description: 'Thick shag carpet in cream covers the floor, matted in the high-traffic areas.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the swivel rocker',
          capacity: 1,
          emptyMsg: 'The salmon velour rocker invites relaxation.',
          occupiedMsg: '%s rocking gently in the swivel chair.',
        },
        {
          name: 'the desk chair',
          capacity: 1,
          emptyMsg: 'A wooden swivel chair waits at the roll-top desk.',
          occupiedMsg: '%s seated at the roll-top desk.',
        },
      ],
    },

    '%C2_z5': {
      name: 'Smith Tower - 5th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
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
        { prototype: 'furniture', name: 'a floral sofa', description: 'A sofa upholstered in a busy floral chintz pattern. Plastic covers protect the arms. Very country-grandma aesthetic.', boltedDown: false },
        { prototype: 'table', name: 'a glass-topped end table', description: 'A glass-topped end table with brass legs holds a ceramic lamp with a pleated shade.', boltedDown: false },
        { prototype: 'furniture', name: 'a decorative radiator', description: 'A steam radiator is painted to match the wall. Dried flowers in a basket sit atop it.', boltedDown: true },
        { prototype: 'furniture', name: 'lace curtains', description: 'Lace curtains hang in the windows, yellowed with age but still delicate. Heavier drapes in rose brocade frame them.', boltedDown: true },
        { prototype: 'furniture', name: 'a curio cabinet', description: 'A curio cabinet with glass doors displays a collection of porcelain figurines and decorative plates.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the chintz sofa',
          capacity: 3,
          emptyMsg: 'The floral sofa waits under its protective plastic.',
          occupiedMsg: '%s seated carefully on the protected cushions.',
        },
      ],
    },

    '%C3_z5': {
      name: 'Smith Tower - 5th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
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
        { prototype: 'bench', name: 'an upholstered bench', description: 'An upholstered bench in seafoam green sits against one wall, its brass legs slightly tarnished.', boltedDown: false },
        { prototype: 'furniture', name: 'a mirrored closet', description: 'A closet with mirrored bi-fold doors reflects the small entry. The brass handles are ornate.', boltedDown: true },
        { prototype: 'furniture', name: 'a brass mail slot', description: 'An ornate brass mail slot is set into the door, matching the closet hardware. Still functional.', boltedDown: true },
        { prototype: 'table', name: 'a demilune table', description: 'A half-moon console table in white lacquer holds a decorative mirror and a dried floral arrangement.', boltedDown: false },
        { prototype: 'furniture', name: 'wallpaper border', description: 'A decorative wallpaper border runs along the ceiling, featuring a geometric pattern in mauve and teal.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the seafoam bench',
          capacity: 2,
          emptyMsg: 'The upholstered bench offers a place to sit while removing shoes.',
          occupiedMsg: '%s perched on the seafoam bench.',
        },
      ],
    },

    '%C4_z5': {
      name: 'Smith Tower - 5th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
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
        { prototype: 'bed', name: 'a four-poster bed', description: 'A white lacquered four-poster bed fills the alcove, its posts topped with brass finials. Dusty peach canopy fabric drapes between them.', quality: 'nice' },
        { prototype: 'furniture', name: 'an armoire', description: 'A large armoire in pickled oak serves as the closet. The doors creak on brass hinges.', boltedDown: false },
        { prototype: 'furniture', name: 'a full-length mirror', description: 'A full-length mirror in a gilt frame leans against one wall. The glass is foxed at the corners.', boltedDown: false },
        { prototype: 'table', name: 'matching nightstands', description: 'White lacquered nightstands with brass drawer pulls flank the bed. Crystal lamps with pleated shades top each.', boltedDown: false },
        { prototype: 'furniture', name: 'plush carpet', description: 'Thick wall-to-wall carpet in dusty rose covers the floor. The pile is matted but still soft.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the canopy bed',
          capacity: 2,
          emptyMsg: 'The four-poster bed waits beneath its peach canopy.',
          occupiedMsg: '%s resting on the canopy bed.',
        },
      ],
    },

    '%B4_z5': {
      name: 'Smith Tower - 5th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
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
        { prototype: 'bed', name: 'a sofa sleeper', description: 'A queen-size sofa sleeper in taupe corduroy. The pull-out mechanism works smoothly, the mattress bar-free.', quality: 'standard' },
        { prototype: 'furniture', name: 'a wall unit', description: 'A massive wall unit in golden oak fills one wall with shelving, cabinets, and a drop-down desk. A boom box sits on one shelf.', boltedDown: true },
        { prototype: 'furniture', name: 'mirrored wall tiles', description: 'Mirrored tiles cover one wall, making the small room feel larger. Several tiles are cracked.', boltedDown: true },
        { prototype: 'table', name: 'nesting tables', description: 'A set of glass and brass nesting tables are stacked by the sofa. Very practical.', boltedDown: false },
        { prototype: 'furniture', name: 'a tall dresser', description: 'A tall dresser in oak veneer with brass-tone hardware. A jewelry box sits on top.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the sofa sleeper',
          capacity: 2,
          emptyMsg: 'The sofa sleeper is folded into couch mode, cushions neat.',
          occupiedMsg: '%s lounging on the corduroy sofa.',
        },
      ],
    },
  },
};
