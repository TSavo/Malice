// Smith Tower - Condo Floor (z=21) - Victorian Parlor Theme
// Fainting couches, antimacassars, aspidistras, heavy drapes, ornate picture frames

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z21' },
    },

    // Rentable locks
    '%RL_A2_z21': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z21': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z21': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z21': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z21'],
    },
    '%D_B2_z21': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z21'],
    },
    '%D_C3_z21': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z21'],
    },

    // Elevator landing
    '%EL_z21': {
      name: 'Smith Tower - 21th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 21,
      exits: {
        north: { room: '%A2_z21', door: '%D_A2_z21' },
        east: { room: '%B2_z21', door: '%D_B2_z21' },
        south: { room: '%C3_z21', door: '%D_C3_z21' },
        west: '%C1_z21',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z21': {
      name: 'Smith Tower - 21th Floor - North Suite - Living Room',
      description:
        "A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone's life—books, decorative objects, a dead potted plant.",
      x: -3,
      y: 11,
      z: 21,
      exits: { east: '%A2_z21' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 21).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a marble-topped parlor table',
          description:
            'An ornate parlor table with carved mahogany legs supports a heavy marble top. A dusty aspidistra in a brass jardinière sits atop it, its leaves brown and crisp.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a Victorian kitchenette',
          description:
            'A built-in kitchenette with dark wood cabinets and brass hardware. The porcelain sink is dry, the gas range long cold. A decorative tile backsplash depicts hunting scenes.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a curio cabinet',
          description:
            'A tall curio cabinet with curved glass doors is built into the wall. Inside, a collection of curiosities gathers dust—seashells, mineral specimens, a taxidermied songbird.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'heavy velvet drapes',
          description:
            'Floor-length burgundy velvet drapes hang from ornate brass rods, their gold fringe moth-eaten and tangled. They block most of the light.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a tufted Chesterfield sofa',
          capacity: 3,
          emptyMsg:
            'A green leather Chesterfield sofa with button-tufted back sits beneath a faded oil painting. Antimacassars drape the armrests.',
          occupiedMsg: '%s perched properly on the Chesterfield.',
        },
      ],
    },

    '%A2_z21': {
      name: 'Smith Tower - 21th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 21,
      exits: {
        west: '%A1_z21',
        east: '%A3_z21',
        south: { room: '%EL_z21', door: '%D_A2_z21' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 21).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a Victorian brass bed',
          description:
            'An ornate brass bed with decorative scrollwork dominates the room. The mattress is covered in faded brocade, a crocheted coverlet draped across the foot.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'an armoire with mirrored doors',
          description:
            'A massive mahogany armoire with beveled mirror doors is built into the alcove. The warped glass distorts reflections into strange shapes.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a marble-topped washstand',
          description:
            'A Victorian washstand with a marble top holds a chipped porcelain pitcher and basin. A dried cake of lavender soap sits in a dish.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a needlepoint screen',
          description:
            'A wooden folding screen with needlepoint panels depicts pastoral scenes. It partially conceals the corner of the room.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the brass bed',
          capacity: 2,
          emptyMsg:
            'The brass bed gleams dully beneath layers of dust, its linens yellowed with age.',
          occupiedMsg: '%s reclining on the brass bed.',
        },
      ],
    },

    '%A3_z21': {
      name: 'Smith Tower - 21th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 21,
      exits: { west: '%A2_z21' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 21).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a cast-iron range',
          description:
            'A built-in cast-iron cooking range with ornate scrollwork sits cold and unused. The ceramic tiles behind it depict willow patterns in faded blue.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a slant-top secretary desk',
          description:
            'A mahogany secretary desk with a slanted writing surface and pigeon-hole compartments. Dried inkwells and yellowed stationery remain inside.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a horsehair settee',
          description:
            'A small horsehair-stuffed settee with carved rosewood frame. The fabric is worn smooth and shiny from generations of use.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'an étagère',
          description:
            'A tall étagère with multiple shelves displays a collection of dusty figurines, daguerreotypes in tarnished frames, and a broken music box.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the horsehair settee',
          capacity: 2,
          emptyMsg:
            'The small horsehair settee sits stiffly by the window, its cushion unyielding.',
          occupiedMsg: '%s perched on the horsehair settee.',
        },
        {
          name: 'a balloon-back chair',
          capacity: 1,
          emptyMsg:
            'A delicate balloon-back chair with needlepoint seat sits at the secretary desk.',
          occupiedMsg: '%s seated at the secretary desk.',
        },
      ],
    },

    '%B1_z21': {
      name: 'Smith Tower - 21th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 21,
      exits: { south: '%B2_z21' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 21).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'an ornate spiral staircase',
          description:
            'A narrow cast-iron spiral staircase leads to the mezzanine, its railings cast with grape leaves and vines. Each step rings hollow underfoot.',
          boltedDown: true,
        },
        {
          prototype: 'bed',
          name: 'a trundle bed',
          description:
            'A carved walnut bed in the mezzanine with a hidden trundle beneath. Faded silk bed hangings gather dust.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a fainting couch',
          description:
            'A velvet fainting couch in faded mauve sits beneath the mezzanine, its curved back designed for dramatic reclines.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a whatnot shelf',
          description:
            'A corner whatnot shelf with spiral-turned columns holds an assortment of shells, pressed flowers, and a stuffed owl under a cracked glass dome.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the fainting couch',
          capacity: 2,
          emptyMsg:
            'The fainting couch awaits, its velvet worn thin where countless heads have rested.',
          occupiedMsg: '%s draped across the fainting couch.',
        },
        {
          name: 'the trundle bed',
          capacity: 2,
          emptyMsg:
            'The carved walnut bed rests above, accessible by spiral stair.',
          occupiedMsg: '%s retiring in the trundle bed.',
        },
      ],
    },

    '%C1_z21': {
      name: 'Smith Tower - 21th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 21,
      exits: { south: '%C2_z21', east: '%EL_z21' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 21).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a narrow iron bedstead',
          description:
            "A servant's iron bedstead with a thin straw mattress is pushed against the wall. A patchwork quilt provides meager comfort.",
          quality: 'cheap',
        },
        {
          prototype: 'furniture',
          name: 'a row of coat pegs',
          description:
            "Brass coat pegs march along the wall, meant for a servant's modest wardrobe. A single empty wire hanger dangles from one.",
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a tin washbasin stand',
          description:
            'A simple tin washbasin on a wooden stand is bolted to the corner. The basin is dented and dry.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a pine blanket chest',
          description:
            'A small pine blanket chest serves as storage and seat. The wood is worn smooth from use.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the blanket chest',
          capacity: 1,
          emptyMsg:
            'The pine blanket chest doubles as a seat, its lid worn smooth.',
          occupiedMsg: '%s sitting on the blanket chest.',
        },
      ],
    },

    '%B2_z21': {
      name: 'Smith Tower - 21th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 21,
      exits: {
        north: '%B1_z21',
        east: '%B3_z21',
        west: { room: '%EL_z21', door: '%D_B2_z21' },
        south: '%B4_z21',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 21).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a Rococo Revival parlor suite',
          description:
            'An elaborate parlor suite with carved frames and tufted velvet upholstery in dusty rose. The camelback sofa anchors a matching pair of gentleman and lady chairs.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a pier table with marble top',
          description:
            'A gilt pier table with ornate carvings supports a heavy marble top. A tarnished girandole mirror hangs above it, its candle brackets empty.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'an ebonized cabinet',
          description:
            'A built-in ebonized display cabinet with mother-of-pearl inlay holds a collection of china plates and silver spoons, all tarnished.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a hall tree',
          description:
            'A massive hall tree with mirror, hooks, and umbrella stand guards the entrance. Its brass drip pan is empty.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the camelback sofa',
          capacity: 3,
          emptyMsg:
            'The Rococo camelback sofa waits beneath portraits of stern ancestors, its velvet slightly crushed.',
          occupiedMsg: '%s seated formally on the camelback sofa.',
        },
        {
          name: "the gentleman's chair",
          capacity: 1,
          emptyMsg:
            "A high-backed gentleman's chair sits beside the fireplace.",
          occupiedMsg: "%s ensconced in the gentleman's chair.",
        },
      ],
    },

    '%B3_z21': {
      name: 'Smith Tower - 21th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 21,
      exits: { west: '%B2_z21' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 21).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'barrister bookcases',
          description:
            'Glass-fronted barrister bookcases line the walls, their leaded glass doors protecting leather-bound legal tomes and natural history volumes.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a partners desk',
          description:
            'A massive partners desk with green leather inlay dominates the room. Inkwells, blotters, and a bronze letter opener still rest upon it.',
          boltedDown: false,
        },
        {
          prototype: 'chair',
          name: "a gentleman's library chair",
          description:
            'A deep leather library chair with brass nailhead trim sits by the window, a reading stand positioned nearby.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a terrestrial globe',
          description:
            'A floor-standing terrestrial globe in a mahogany cradle shows political boundaries from the 1890s. India is pink.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the library chair',
          capacity: 1,
          emptyMsg:
            "The gentleman's library chair awaits, positioned for optimal reading light.",
          occupiedMsg: '%s sunk into the library chair.',
        },
        {
          name: 'the desk chair',
          capacity: 1,
          emptyMsg:
            'A swivel office chair with wooden arms sits behind the partners desk.',
          occupiedMsg: '%s seated at the partners desk.',
        },
      ],
    },

    '%C2_z21': {
      name: 'Smith Tower - 21th Floor - South Suite - Living Room',
      description:
        'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 21,
      exits: { north: '%C1_z21', east: '%C3_z21' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 21).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a medallion-back settee',
          description:
            'A small medallion-back settee in faded pink damask faces the window, its carved walnut frame still elegant despite dust.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a parlor lamp table',
          description:
            'A spindly parlor table holds a Gone With The Wind lamp, its painted glass globe depicting roses. The wick is dry.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'an ornate radiator',
          description:
            'A decorative cast-iron radiator with scrollwork and paw feet is built into the wall. It still gives off faint warmth.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'lace curtain panels',
          description:
            'Nottingham lace curtain panels hang from tarnished brass rods, their intricate patterns frayed and yellowed.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a stereoscope stand',
          description:
            'A mahogany stereoscope on a pedestal stand holds a card depicting Niagara Falls. A box of additional cards sits beside it.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the medallion-back settee',
          capacity: 2,
          emptyMsg:
            'The delicate settee waits primly, its damask upholstery catching afternoon light.',
          occupiedMsg: '%s perched on the medallion-back settee.',
        },
      ],
    },

    '%C3_z21': {
      name: 'Smith Tower - 21th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 21,
      exits: {
        north: { room: '%EL_z21', door: '%D_C3_z21' },
        west: '%C2_z21',
        east: '%C4_z21',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 21).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a hall bench',
          description:
            'A carved oak hall bench with lift-seat storage and a mirror back. The velvet seat cushion is worn through to the horsehair.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a vestibule wardrobe',
          description:
            'A built-in vestibule wardrobe with carved acorn finials. Inside, empty brass hooks and a shelf for hats.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a speaking tube',
          description:
            'A tarnished brass speaking tube is set into the wall beside the door, its whistle long silent.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a calling card tray',
          description:
            'A silver calling card tray on a marble-topped console holds a few yellowed cards with faded copperplate script.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'an umbrella stand',
          description:
            'A ceramic umbrella stand decorated with hand-painted herons holds a single broken parasol.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the hall bench',
          capacity: 2,
          emptyMsg:
            'The carved oak hall bench invites visitors to sit while removing galoshes.',
          occupiedMsg: '%s seated on the hall bench.',
        },
      ],
    },

    '%C4_z21': {
      name: 'Smith Tower - 21th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 21,
      exits: { west: '%C3_z21' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 21).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a half-tester bed',
          description:
            'A mahogany half-tester bed fills the alcove, its partial canopy draped with dusty brocade. Carved acanthus leaves crown the headboard.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: "a gentleman's valet",
          description:
            "A wooden gentleman's valet with trouser press and coat hanger stands ready for morning dressing.",
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a cheval glass',
          description:
            'A full-length cheval mirror on a tilting stand is bolted to the wall. The glass reflects a wavy, yellowed image.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a spool-turned nightstand',
          description:
            'A spool-turned nightstand holds a chamberstick candle holder and a leather-bound Bible, both dusty.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a slipper chair',
          description:
            'A low slipper chair in faded chintz sits by the window, designed for putting on shoes.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the half-tester bed',
          capacity: 2,
          emptyMsg:
            'The canopied bed waits in state, its brocade hangings still.',
          occupiedMsg: '%s resting beneath the half-tester canopy.',
        },
        {
          name: 'the slipper chair',
          capacity: 1,
          emptyMsg: 'The low slipper chair awaits by the window.',
          occupiedMsg: '%s perched on the slipper chair.',
        },
      ],
    },

    '%B4_z21': {
      name: 'Smith Tower - 21th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 21,
      exits: { north: '%B2_z21' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 21).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a folding campaign bed',
          description:
            'A brass campaign bed with leather straps and folding mechanism. A wool blanket with satin binding covers the thin mattress.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a campaign chest',
          description:
            'A campaign chest with brass corners and recessed handles is built into the wall. Its compartments still hold faded maps and dried ink.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a linen press',
          description:
            'A tall linen press with graduated drawers is bolted into the corner. Inside, yellowed linens with drawn-thread work.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a folding campaign desk',
          description:
            'A portable campaign desk unfolds from the wall, revealing pigeon-holes, a writing slope, and a dried inkwell.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a shaving stand',
          description:
            'A mahogany shaving stand with adjustable mirror and basin holder. A straight razor case sits in the drawer.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the campaign bed',
          capacity: 2,
          emptyMsg:
            'The campaign bed stands ready for bivouac, its leather straps still sound.',
          occupiedMsg: '%s resting on the campaign bed.',
        },
      ],
    },
  },
};
