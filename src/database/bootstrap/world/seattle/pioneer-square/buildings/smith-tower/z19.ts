// Smith Tower - Condo Floor (z=19)
// Hunting lodge - antler chandeliers, plaid, knotty pine, taxidermy, log furniture, rustic cabin vibes

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z19' },
    },

    // Rentable locks
    '%RL_A2_z19': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z19': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z19': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z19': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z19'],
    },
    '%D_B2_z19': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z19'],
    },
    '%D_C3_z19': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z19'],
    },

    // Elevator landing
    '%EL_z19': {
      name: 'Smith Tower - 19th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 19,
      exits: {
        north: { room: '%A2_z19', door: '%D_A2_z19' },
        east: { room: '%B2_z19', door: '%D_B2_z19' },
        south: { room: '%C3_z19', door: '%D_C3_z19' },
        west: '%C1_z19',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z19': {
      name: 'Smith Tower - 19th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -3,
      y: 11,
      z: 19,
      exits: { east: '%A2_z19' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 19).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a log slice coffee table', description: 'A massive cross-section of an old-growth cedar serves as a coffee table, its rings telling centuries of stories. The surface is lacquered to a high shine.', boltedDown: false },
        { prototype: 'furniture', name: 'a hunting kitchenette', description: 'A rustic kitchenette features knotty pine cabinets with antler drawer pulls. A cast iron skillet still hangs from a hook, seasoned black.', boltedDown: true },
        { prototype: 'furniture', name: 'a gun rack', description: 'An empty gun rack is mounted on the wall, its felt-lined slots long vacant. Brass shell casings serve as decorative accents.', boltedDown: true },
        { prototype: 'furniture', name: 'antler chandelier', description: 'A massive antler chandelier hangs from the ceiling, its multiple racks intertwined. The bulbs are dead but the antlers remain impressive.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a leather club chair',
          capacity: 1,
          emptyMsg:
            'A worn leather club chair in oxblood sits near the window, a buffalo plaid blanket draped over its arm.',
          occupiedMsg: '%s settled into the leather club chair.',
        },
        {
          name: 'a log bench',
          capacity: 3,
          emptyMsg:
            'A bench made from a halved log sits against the wall, its surface worn smooth by use.',
          occupiedMsg: '%s perched on the log bench.',
        },
      ],
    },

    '%A2_z19': {
      name: 'Smith Tower - 19th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 19,
      exits: {
        west: '%A1_z19',
        east: '%A3_z19',
        south: { room: '%EL_z19', door: '%D_A2_z19' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 19).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a log bed frame', description: 'A queen bed with a frame made from peeled pine logs dominates the room. A wool Pendleton blanket in earthy stripes covers the mattress.', quality: 'nice' },
        { prototype: 'furniture', name: 'a pine wardrobe', description: 'A massive knotty pine wardrobe is built into one wall, its doors carved with pinecone motifs. Mothballs and cedar chips scent the interior.', boltedDown: true },
        { prototype: 'table', name: 'a twig nightstand', description: 'A nightstand constructed from bent willow twigs holds an oil lantern (empty) and a dog-eared copy of Jack London stories.', boltedDown: false },
        { prototype: 'furniture', name: 'a bearskin rug', description: 'A faded bearskin rug lies at the foot of the bed, its glass eyes staring at nothing. The fur is matted but the hide is intact.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the log bed',
          capacity: 2,
          emptyMsg:
            'The rustic log bed waits beneath its Pendleton blanket.',
          occupiedMsg: '%s nestled in the log bed.',
        },
      ],
    },

    '%A3_z19': {
      name: 'Smith Tower - 19th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 19,
      exits: { west: '%A2_z19' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 19).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a camp kitchen', description: 'A rustic kitchen area features an old wood-burning cookstove (cold now), a ceramic pitcher and basin, and hand-hewn butcher block counters.', boltedDown: true },
        { prototype: 'table', name: 'a fly-tying desk', description: 'A desk covered in feathers, thread, and hooks suggests someone spent hours tying fishing flies here. A magnifying lamp is clamped to the edge.', boltedDown: false },
        { prototype: 'furniture', name: 'a fishing rod rack', description: 'A handmade rod rack holds three vintage bamboo fly rods, their cork handles worn from use. Reels still attached, lines long rotted.', boltedDown: true },
        { prototype: 'furniture', name: 'a plaid daybed', description: 'A daybed covered in red and black buffalo plaid serves as both couch and guest bed. A quilted throw is folded at one end.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the plaid daybed',
          capacity: 2,
          emptyMsg:
            'The plaid daybed invites an afternoon nap after a morning of (imaginary) fishing.',
          occupiedMsg: '%s stretched out on the daybed.',
        },
        {
          name: 'a Windsor chair',
          capacity: 1,
          emptyMsg:
            'A simple Windsor chair sits at the fly-tying desk.',
          occupiedMsg: '%s at the fly-tying desk.',
        },
      ],
    },

    '%B1_z19': {
      name: 'Smith Tower - 19th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 19,
      exits: { south: '%B2_z19' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 19).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a rope ladder', description: 'A rope ladder with wooden rungs leads up to the sleeping loft, secured with iron cleats to the wall.', boltedDown: true },
        { prototype: 'bed', name: 'a bunk platform', description: 'The loft holds a simple bunk platform with a straw-tick mattress covered in Hudson Bay blankets—cream with colored stripes.', quality: 'standard' },
        { prototype: 'furniture', name: 'a moose head', description: 'A massive moose head is mounted on the wall, its antlers spanning nearly six feet. Dust coats its snout.', boltedDown: true },
        { prototype: 'table', name: 'a steamer trunk table', description: 'An old steamer trunk serves as both storage and coffee table. Faded travel stickers from National Parks decorate its sides.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a twig sofa',
          capacity: 3,
          emptyMsg:
            'A rustic sofa with a bent twig frame and leather cushions sits beneath the moose head.',
          occupiedMsg: '%s lounging under the moose head.',
        },
        {
          name: 'the bunk platform',
          capacity: 2,
          emptyMsg:
            'The loft bunk is visible above, blankets neatly folded.',
          occupiedMsg: '%s resting in the loft bunk.',
        },
      ],
    },

    '%C1_z19': {
      name: 'Smith Tower - 19th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 19,
      exits: { south: '%C2_z19', east: '%EL_z19' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 19).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a canvas cot', description: 'An old-fashioned canvas camp cot fits snugly in this space, a wool trade blanket folded at the foot. Simple as a hunting camp.', quality: 'cheap' },
        { prototype: 'furniture', name: 'antler hooks', description: 'A row of deer antler points serves as coat hooks, still holding a moth-eaten canvas hunting jacket and an old felt hat.', boltedDown: true },
        { prototype: 'furniture', name: 'a powder horn shelf', description: 'A narrow shelf holds a decorative powder horn, an antique compass, and a faded topographical map in a cracked frame.', boltedDown: true },
        { prototype: 'table', name: 'an ammunition crate', description: 'A wooden ammunition crate serves as a nightstand, its stenciled lettering still visible: "WINCHESTER .30-30."', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the canvas cot',
          capacity: 1,
          emptyMsg:
            'The canvas cot waits, trade blanket neatly folded.',
          occupiedMsg: '%s resting on the camp cot.',
        },
      ],
    },

    '%B2_z19': {
      name: 'Smith Tower - 19th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 19,
      exits: {
        north: '%B1_z19',
        east: '%B3_z19',
        west: { room: '%EL_z19', door: '%D_B2_z19' },
        south: '%B4_z19',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 19).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a stone fireplace', description: 'A massive river-stone fireplace dominates one wall, its hearth cold and dark. A moose antler mantle holds hunting trophies and old photographs.', boltedDown: true },
        { prototype: 'table', name: 'a bear claw table', description: 'A coffee table with legs carved to resemble bear claws holds a glass kerosene lamp and a stack of outdoor magazines from the 1960s.', boltedDown: false },
        { prototype: 'furniture', name: 'a trophy wall', description: 'One wall is covered in mounted animal heads—a ten-point buck, a bighorn sheep, a pronghorn antelope—all watching with dusty glass eyes.', boltedDown: true },
        { prototype: 'furniture', name: 'a coat closet', description: 'A small closet built from knotty pine panels holds canvas hunting jackets, hip waders, and a tackle box.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'leather hunting chairs',
          capacity: 2,
          emptyMsg:
            'Two deep leather chairs face the fireplace, positioned for swapping hunting stories.',
          occupiedMsg: '%s settled into a leather hunting chair.',
        },
        {
          name: 'a log loveseat',
          capacity: 2,
          emptyMsg:
            'A loveseat made from peeled logs with leather cushions faces the trophy wall.',
          occupiedMsg: '%s on the log loveseat.',
        },
      ],
    },

    '%B3_z19': {
      name: 'Smith Tower - 19th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 19,
      exits: { west: '%B2_z19' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 19).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'trophy shelves', description: 'Pine shelving holds a collection of taxidermied game birds—pheasant, grouse, quail—frozen in poses of eternal flight.', boltedDown: true },
        { prototype: 'table', name: 'a campaign desk', description: 'An antique campaign desk with brass corners and leather top holds log books filled with handwritten hunting records dating back decades.', boltedDown: false },
        { prototype: 'furniture', name: 'a gun cabinet', description: 'A tall glass-fronted gun cabinet stands empty but locked, its interior lined with green felt. Cleaning supplies remain in the drawer.', boltedDown: true },
        { prototype: 'furniture', name: 'a kerosene floor lamp', description: 'A converted kerosene floor lamp stands in the corner, its brass reservoir polished but empty.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a Morris chair',
          capacity: 1,
          emptyMsg:
            'A Mission-style Morris chair with an adjustable back sits angled for reading by the window.',
          occupiedMsg: '%s reclining in the Morris chair.',
        },
        {
          name: 'a captain\'s chair',
          capacity: 1,
          emptyMsg:
            'A solid oak captain\'s chair is pushed under the campaign desk.',
          occupiedMsg: '%s at the campaign desk.',
        },
      ],
    },

    '%C2_z19': {
      name: 'Smith Tower - 19th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 19,
      exits: { north: '%C1_z19', east: '%C3_z19' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 19).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a potbelly stove', description: 'A cast iron potbelly stove sits in one corner, its chimney running up into the ceiling. Cold ashes fill the firebox.', boltedDown: true },
        { prototype: 'table', name: 'a pine side table', description: 'A rough-hewn pine side table holds a hurricane lamp and a wooden box of strike-anywhere matches (damp and useless now).', boltedDown: false },
        { prototype: 'furniture', name: 'mounted fishing creel', description: 'A woven willow fishing creel hangs on the wall as decoration, its leather straps cracked with age.', boltedDown: true },
        { prototype: 'furniture', name: 'plaid curtains', description: 'Heavy wool plaid curtains in muted greens and browns hang from wooden rings, blocking the afternoon sun.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'an Adirondack settee',
          capacity: 2,
          emptyMsg:
            'A wide Adirondack-style settee faces the window, built from natural branches with a slatted back.',
          occupiedMsg: '%s sprawled on the Adirondack settee.',
        },
      ],
    },

    '%C3_z19': {
      name: 'Smith Tower - 19th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 19,
      exits: {
        north: { room: '%EL_z19', door: '%D_C3_z19' },
        west: '%C2_z19',
        east: '%C4_z19',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 19).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a boot bench', description: 'A sturdy pine bench for removing muddy boots sits near the door, its surface worn and stained. A boot jack is tucked underneath.', boltedDown: false },
        { prototype: 'furniture', name: 'a gear closet', description: 'A closet lined with cedar holds waders, hip boots, and rain slickers on wooden pegs. A faint smell of canvas and old rubber lingers.', boltedDown: true },
        { prototype: 'furniture', name: 'a snowshoe display', description: 'A pair of antique wooden snowshoes hangs crossed on the wall like a trophy, their rawhide webbing dried but intact.', boltedDown: true },
        { prototype: 'table', name: 'a hall tree', description: 'A rustic hall tree made from a single forked branch holds hats, scarves, and a canvas game bag.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the boot bench',
          capacity: 2,
          emptyMsg:
            'The boot bench waits for someone to sit and remove their muddy boots.',
          occupiedMsg: '%s seated on the boot bench.',
        },
      ],
    },

    '%C4_z19': {
      name: 'Smith Tower - 19th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 19,
      exits: { west: '%C3_z19' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 19).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a rope bed', description: 'An antique rope bed fills the alcove, its frame made of hand-hewn timber. The mattress is stuffed with wool and surprisingly supportive.', quality: 'standard' },
        { prototype: 'furniture', name: 'a cedar armoire', description: 'A tall cedar armoire holds wool hunting shirts, canvas pants, and hand-knit sweaters. The scent of cedar is still faintly present.', boltedDown: false },
        { prototype: 'furniture', name: 'a mounted bass', description: 'A large mounted largemouth bass hangs on the wall, its taxidermied mouth frozen in a perpetual gape. A brass plate reads "Lake Union, 1962."', boltedDown: true },
        { prototype: 'table', name: 'a barrel nightstand', description: 'Half a whiskey barrel serves as a nightstand, holding a candlestick, a pocket knife, and a battered harmonica.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the rope bed',
          capacity: 2,
          emptyMsg:
            'The antique rope bed looks surprisingly comfortable.',
          occupiedMsg: '%s resting on the rope bed.',
        },
      ],
    },

    '%B4_z19': {
      name: 'Smith Tower - 19th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 19,
      exits: { north: '%B2_z19' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 19).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a trundle bed', description: 'A pine trundle bed is pushed against the wall, its lower bunk hidden underneath. Wool blankets in forest green cover both mattresses.', quality: 'standard' },
        { prototype: 'furniture', name: 'a pine storage chest', description: 'A hand-built pine chest at the foot of the bed holds extra blankets, a lantern, and coils of rope—emergency supplies for a cabin dweller.', boltedDown: false },
        { prototype: 'furniture', name: 'field guide shelves', description: 'Shelving around the window holds field guides to birds, mammals, and edible plants. A pair of binoculars hangs from a nail.', boltedDown: true },
        { prototype: 'table', name: 'a split-log desk', description: 'A desk made from a halved log with the flat side up is mounted to the wall. A nature journal lies open, its entries ending mid-sentence.', boltedDown: true },
        { prototype: 'furniture', name: 'a washstand', description: 'An antique washstand with ceramic pitcher and basin stands in the corner, its wood dark with age and water stains.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the trundle bed',
          capacity: 2,
          emptyMsg:
            'The trundle bed waits, its lower bunk tucked away.',
          occupiedMsg: '%s resting on the trundle bed.',
        },
      ],
    },
  },
};
