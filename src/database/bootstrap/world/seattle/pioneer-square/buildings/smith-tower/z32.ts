// Smith Tower - Condo Floor (z=32) - Art Nouveau Theme
// Flowing organic lines, dragonfly motifs, Tiffany glass, whiplash curves, nature forms

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z32' },
    },

    // Rentable locks
    '%RL_A2_z32': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z32': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z32': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z32': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z32'],
    },
    '%D_B2_z32': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z32'],
    },
    '%D_C3_z32': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z32'],
    },

    // Elevator landing
    '%EL_z32': {
      name: 'Smith Tower - 32th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 32,
      exits: {
        north: { room: '%A2_z32', door: '%D_A2_z32' },
        east: { room: '%B2_z32', door: '%D_B2_z32' },
        south: { room: '%C3_z32', door: '%D_C3_z32' },
        west: '%C1_z32',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z32': {
      name: 'Smith Tower - 32th Floor - North Suite - Living Room',
      description:
        "A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone's life—books, decorative objects, a dead potted plant.",
      x: -3,
      y: 11,
      z: 32,
      exits: { east: '%A2_z32' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 32).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a bronze and glass coffee table',
          description:
            'A low table with sinuous bronze legs that curl like lily stems, supporting an oval glass top etched with water lily patterns. The glass has a faint amber tint.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'an Art Nouveau kitchenette',
          description:
            'Built-in cabinetry with carved wooden panels depicting flowing vines and morning glories. The cabinet pulls are cast bronze in the shape of unfurling leaves.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a Tiffany-style floor lamp',
          description:
            'A tall floor lamp with a bronze base shaped like intertwined tree roots. The shade is leaded glass in shades of amber, green, and gold, depicting dragonflies among rushes.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'carved wall panels',
          description:
            'Wooden panels with deeply carved reliefs of peacock feathers and twisting vines are set into the walls, their organic curves catching the light.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a velvet settee',
          capacity: 3,
          emptyMsg:
            'A curved settee in deep moss-green velvet features a carved mahogany frame with whiplash curves and lily pad motifs.',
          occupiedMsg: '%s reclining on the velvet settee.',
        },
      ],
    },

    '%A2_z32': {
      name: 'Smith Tower - 32th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 32,
      exits: {
        west: '%A1_z32',
        east: '%A3_z32',
        south: { room: '%EL_z32', door: '%D_A2_z32' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 32).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'an iris headboard bed',
          description:
            'A queen bed with an elaborately carved headboard depicting irises in full bloom, their petals curving outward in the whiplash style. The wood is dark walnut, polished to a deep gleam.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a gilt mirror armoire',
          description:
            'A tall armoire with mirrored doors framed in gilt wood carved with flowing organic lines. The mirror glass is foxed with age but still reflects.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a majolica-topped nightstand',
          description:
            'A small nightstand with a majolica tile top depicting a stylized sunflower. The wooden legs curve gracefully downward like flower stems.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'wall sconces with floral shades',
          description:
            'Pair of bronze wall sconces shaped like curving stems, holding frosted glass shades molded to resemble tulip blooms.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the iris bed',
          capacity: 2,
          emptyMsg:
            'The bed with its carved iris headboard waits beneath a canopy of dusty silk.',
          occupiedMsg: '%s resting on the iris bed.',
        },
      ],
    },

    '%A3_z32': {
      name: 'Smith Tower - 32th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 32,
      exits: { west: '%A2_z32' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 32).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'an Art Nouveau galley kitchen',
          description:
            'The galley kitchen features cabinets with stained glass inserts depicting ginkgo leaves in green and gold. Bronze hardware shaped like dragonflies adorns each door.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a writing desk with whiplash curves',
          description:
            'An elegant desk of pale fruitwood with legs that flow in dramatic whiplash curves. The desktop is inlaid with mother-of-pearl in an abstract floral pattern.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a daybed with peacock carvings',
          description:
            'A narrow daybed with carved peacock feathers along its curved back, upholstered in faded blue-green velvet that echoes the peacock theme.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a bronze desk lamp',
          description:
            'A desk lamp with a slender bronze base shaped like a dancing woman, her flowing hair becoming the lamp stem. The shade is amber glass with embedded air bubbles.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the peacock daybed',
          capacity: 2,
          emptyMsg:
            'The daybed with its carved peacock motifs sits beneath the window.',
          occupiedMsg: '%s lounging on the peacock daybed.',
        },
        {
          name: 'a bentwood desk chair',
          capacity: 1,
          emptyMsg:
            'A bentwood chair with a woven cane seat curves elegantly at the desk.',
          occupiedMsg: '%s sitting at the writing desk.',
        },
      ],
    },

    '%B1_z32': {
      name: 'Smith Tower - 32th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 32,
      exits: { south: '%B2_z32' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 32).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a wrought iron spiral ladder',
          description:
            'A spiral ladder of wrought iron leads to the mezzanine, its railings twisting like climbing vines with cast iron leaves and tendrils.',
          boltedDown: true,
        },
        {
          prototype: 'bed',
          name: 'a loft bed with lily carvings',
          description:
            'A narrow bed in the mezzanine space features a headboard carved with calla lilies, their elegant curves echoing the Art Nouveau style.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a curved settee',
          description:
            'A serpentine settee with an asymmetrical back, upholstered in amber silk with embroidered chrysanthemums. The carved frame suggests flowing water.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a bronze lily pad table',
          description:
            'A small side table with a bronze base of overlapping lily pads, supporting a round glass top with beveled edges.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the serpentine settee',
          capacity: 3,
          emptyMsg:
            'The curved settee undulates beneath the mezzanine, its amber silk catching the light.',
          occupiedMsg: '%s settled into the serpentine settee.',
        },
        {
          name: 'the loft bed',
          capacity: 1,
          emptyMsg: 'The lily-carved bed is visible in the mezzanine above.',
          occupiedMsg: '%s resting in the loft bed above.',
        },
      ],
    },

    '%C1_z32': {
      name: 'Smith Tower - 32th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 32,
      exits: { south: '%C2_z32', east: '%EL_z32' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 32).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a narrow bed with vine carvings',
          description:
            'A compact bed frame carved with twisting morning glory vines, the flowers picked out in traces of faded gilt. The headboard curves like a breaking wave.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'bronze coat hooks',
          description:
            'A row of bronze coat hooks shaped like unfurling fern fronds, mounted on a carved wooden backplate depicting forest undergrowth.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a stained glass wall sconce',
          description:
            'A single wall sconce with a shade of leaded glass in purple and green, depicting wisteria blossoms cascading downward.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a small majolica vase',
          description:
            'A decorative majolica vase glazed in iridescent greens and blues, shaped like an unfurling leaf. A few dried stems remain inside.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the vine-carved bed',
          capacity: 1,
          emptyMsg:
            'The narrow bed with its carved morning glory vines waits in the alcove.',
          occupiedMsg: '%s curled up on the vine-carved bed.',
        },
      ],
    },

    '%B2_z32': {
      name: 'Smith Tower - 32th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 32,
      exits: {
        north: '%B1_z32',
        east: '%B3_z32',
        west: { room: '%EL_z32', door: '%D_B2_z32' },
        south: '%B4_z32',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 32).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a grand Tiffany lamp',
          description:
            'A large table lamp with an elaborate Tiffany shade depicting a landscape of wisteria vines against a sunset sky. The bronze base is a tree trunk with spreading roots.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a marble-topped console',
          description:
            'A console table with legs of carved walnut depicting entwined serpents, supporting a veined rose marble top. A gilt-framed mirror once hung above it.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'an Art Nouveau display cabinet',
          description:
            'A tall display cabinet with leaded glass doors featuring stylized tulips. Inside, dusty shelves hold remnants of a collection—an empty vase, a tarnished candlestick.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a carved entry closet',
          description:
            'Built-in closet doors are carved with flowing organic lines suggesting seaweed and waves, the handles cast bronze shaped like seahorses.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a curved parlor sofa',
          capacity: 4,
          emptyMsg:
            'A generously curved sofa in burgundy velvet dominates the room, its carved frame featuring intertwined roses and thorns.',
          occupiedMsg: '%s sunk into the curved parlor sofa.',
        },
      ],
    },

    '%B3_z32': {
      name: 'Smith Tower - 32th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 32,
      exits: { west: '%B2_z32' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 32).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'built-in ginkgo bookshelves',
          description:
            'Floor-to-ceiling bookshelves with carved ginkgo leaf motifs frame each shelf. The wood is golden oak, the leaves picked out in subtle green stain.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a dragonfly writing desk',
          description:
            'An exquisite writing desk with bronze dragonfly inlays on its leather-topped surface. The legs curve dramatically in the whiplash style, terminating in bronze lily pad feet.',
          boltedDown: false,
        },
        {
          prototype: 'chair',
          name: 'a carved oak armchair',
          description:
            'A substantial armchair with a high back carved to resemble a stylized tree, branches spreading to form the frame. The seat is worn green leather.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a bronze desk lamp with glass shade',
          description:
            'A desk lamp with a patinated bronze base of intertwined stems supporting a green glass shade shaped like an unfurling leaf.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the tree armchair',
          capacity: 1,
          emptyMsg:
            'The carved oak armchair with its tree-branch frame stands by the window.',
          occupiedMsg: '%s ensconced in the tree armchair.',
        },
        {
          name: 'a carved desk chair',
          capacity: 1,
          emptyMsg:
            'A matching desk chair with carved organic motifs is pushed under the writing desk.',
          occupiedMsg: '%s seated at the dragonfly desk.',
        },
      ],
    },

    '%C2_z32': {
      name: 'Smith Tower - 32th Floor - South Suite - Living Room',
      description:
        'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 32,
      exits: { north: '%C1_z32', east: '%C3_z32' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 32).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a fainting couch',
          description:
            'An asymmetrical fainting couch with one raised end, upholstered in faded rose silk. The carved mahogany frame flows like waves, terminating in scroll feet.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a bronze heron side table',
          description:
            'A small side table with a base of two bronze herons standing in cast bronze cattails, their necks curved to support the oval glass top.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a decorative radiator cover',
          description:
            'The steam radiator is concealed by an ornate cover of pierced bronze in a pattern of overlapping ginkgo leaves.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'embroidered silk curtains',
          description:
            'Heavy silk curtains with embroidered poppies and flowing stems frame the windows, their colors faded by decades of afternoon sun.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the fainting couch',
          capacity: 2,
          emptyMsg:
            'The rose silk fainting couch reclines beneath the sun-faded curtains.',
          occupiedMsg: '%s draped across the fainting couch.',
        },
      ],
    },

    '%C3_z32': {
      name: 'Smith Tower - 32th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 32,
      exits: {
        north: { room: '%EL_z32', door: '%D_C3_z32' },
        west: '%C2_z32',
        east: '%C4_z32',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 32).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a hall bench with iris carvings',
          description:
            'A narrow hall bench with a carved backrest depicting stylized irises, the wood stained in shades of purple and green that have mellowed with age.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'an Art Nouveau entry closet',
          description:
            'Built-in closet doors feature carved reliefs of flowing feminine figures surrounded by swirling hair and drapery in the Mucha style.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a decorative brass mail slot',
          description:
            'The mail slot is framed in cast brass depicting intertwined serpents, their scales individually detailed, their eyes tiny glass beads.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a copper-topped console',
          description:
            'A slender console table with a hammered copper top showing a patina of verdigris. The wooden legs curve in opposing whiplash spirals.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the iris bench',
          capacity: 2,
          emptyMsg:
            'The hall bench with its carved iris backrest offers a place to pause.',
          occupiedMsg: '%s resting on the iris bench.',
        },
      ],
    },

    '%C4_z32': {
      name: 'Smith Tower - 32th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 32,
      exits: { west: '%C3_z32' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 32).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'an alcove bed with poppy headboard',
          description:
            'The alcove holds a bed with an ornate headboard carved with California poppies, their petals flowing in Art Nouveau curves. Traces of original orange and gold paint remain.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a bentwood coat rack',
          description:
            'A freestanding coat rack of bent beechwood in graceful curves, its hooks shaped like the curling tendrils of sweet pea vines.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a gilt-framed cheval mirror',
          description:
            'A full-length mirror in a gilt frame carved with sinuous feminine figures and flowing drapery, mounted on a pivoting stand with claw feet.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a marquetry nightstand',
          description:
            'A nightstand with intricate marquetry depicting a moonlit landscape with stylized trees, crafted from various exotic woods in subtle gradations.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the poppy bed',
          capacity: 2,
          emptyMsg:
            'The bed with its carved poppy headboard waits in the alcove, silk curtain half-drawn.',
          occupiedMsg: '%s nestled in the poppy bed.',
        },
      ],
    },

    '%B4_z32': {
      name: 'Smith Tower - 32th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 32,
      exits: { north: '%B2_z32' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 32).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a Murphy bed with orchid carvings',
          description:
            'A Murphy bed that folds from an elaborately carved cabinet featuring orchids with long, trailing roots. When lowered, the carved flowers frame the sleeping surface.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'an orchid Murphy cabinet',
          description:
            'The Murphy bed cabinet is a masterwork of carved walnut, depicting tropical orchids with impossibly long stems that wind across its surface.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'built-in shelving with moth motifs',
          description:
            'The built-in shelving features carved luna moths at each corner bracket, their wings spread as if about to take flight.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a fold-down desk with water lily inlay',
          description:
            'A hinged desk folds down from the wall, its surface inlaid with mother-of-pearl water lilies floating on an implied pond of darker wood.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a narrow chest with butterfly handles',
          description:
            'A slender chest of drawers with handles cast as bronze butterflies, their wings slightly raised as if ready to flutter away.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the orchid Murphy bed',
          capacity: 2,
          emptyMsg:
            'The Murphy bed is lowered, its carved orchid frame embracing the mattress.',
          occupiedMsg: '%s resting in the orchid Murphy bed.',
        },
      ],
    },
  },
};
