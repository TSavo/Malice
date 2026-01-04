// Smith Tower - Condo Floor (z=33) - Penthouse Luxury Theme
// Marble and gold, crystal chandeliers, silk upholstery, museum-quality antiques

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z33' },
    },

    // Rentable locks
    '%RL_A2_z33': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z33': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z33': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z33': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z33'],
    },
    '%D_B2_z33': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z33'],
    },
    '%D_C3_z33': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z33'],
    },

    // Elevator landing
    '%EL_z33': {
      name: 'Smith Tower - 33th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -12,
      y: 10,
      z: 33,
      exits: {
        north: { room: '%A2_z33', door: '%D_A2_z33' },
        east: { room: '%B2_z33', door: '%D_B2_z33' },
        south: { room: '%C3_z33', door: '%D_C3_z33' },
        west: '%C1_z33',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z33': {
      name: 'Smith Tower - 33th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -13,
      y: 11,
      z: 33,
      exits: { east: '%A2_z33' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 33).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a Steinway grand piano', description: 'A full concert grand piano in polished ebony dominates one corner, its lid propped open to reveal pristine ivory keys. Sheet music for Chopin nocturnes rests on the stand.', boltedDown: true },
        { prototype: 'table', name: 'an onyx coffee table', description: 'A massive onyx coffee table with gold-leaf legs sits before the seating area. The stone surface reflects light like still water, its deep black veins mesmerizing.', boltedDown: false },
        { prototype: 'furniture', name: 'a built-in bar with wine cellar', description: 'A custom bar with marble countertops spans one wall, backed by a temperature-controlled wine cellar visible through glass doors. Baccarat crystal decanters line the counter.', boltedDown: true },
        { prototype: 'furniture', name: 'a gilt-framed oil painting', description: 'A large oil painting in an ornate gilt frame dominates the wall - a moody seascape by an old master, museum-quality and priceless.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a silk damask sofa',
          capacity: 4,
          emptyMsg:
            'A sumptuous sofa upholstered in pale gold silk damask curves gracefully before the windows, its cushions impossibly plush.',
          occupiedMsg: '%s reclining on the silk damask sofa.',
        },
        {
          name: 'the piano bench',
          capacity: 2,
          emptyMsg:
            'A padded piano bench in matching leather waits before the Steinway.',
          occupiedMsg: '%s seated at the grand piano.',
        },
      ],
    },

    '%A2_z33': {
      name: 'Smith Tower - 33th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -12,
      y: 11,
      z: 33,
      exits: {
        west: '%A1_z33',
        east: '%A3_z33',
        south: { room: '%EL_z33', door: '%D_A2_z33' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 33).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a California king bed with silk canopy', description: 'An enormous California king bed draped in ivory silk canopy billows from a gilded corona mounted to the ceiling. Egyptian cotton sheets with a thread count in the thousands shimmer beneath.', quality: 'nice' },
        { prototype: 'furniture', name: 'a walk-in closet with cedar paneling', description: 'Double doors open to a walk-in closet paneled in aromatic cedar, with built-in shoe racks, velvet-lined jewelry drawers, and a center island for folding.', boltedDown: true },
        { prototype: 'table', name: 'a pair of Louis XVI nightstands', description: 'Matching Louis XVI nightstands in gilded wood flank the bed, their marble tops holding Lalique crystal lamps with silk shades.', boltedDown: false },
        { prototype: 'furniture', name: 'a crystal chandelier', description: 'A Venetian crystal chandelier hangs from the ceiling, its hundreds of hand-cut prisms catching light and scattering rainbows across the walls.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the silk-canopied bed',
          capacity: 2,
          emptyMsg:
            'The magnificent canopied bed awaits, silk curtains tied back with gold cord.',
          occupiedMsg: '%s ensconced in the luxurious bed.',
        },
        {
          name: 'a velvet chaise longue',
          capacity: 1,
          emptyMsg:
            'A midnight blue velvet chaise longue curves by the window, perfect for reading or daydreaming.',
          occupiedMsg: '%s draped across the velvet chaise.',
        },
      ],
    },

    '%A3_z33': {
      name: 'Smith Tower - 33th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -11,
      y: 11,
      z: 33,
      exits: { west: '%A2_z33' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 33).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a gourmet kitchen with marble island', description: 'A chef-grade kitchen with Calacatta marble countertops and island, Sub-Zero refrigeration, and a La Cornue range in cobalt blue enamel. Copper pots hang from a ceiling rack.', boltedDown: true },
        { prototype: 'table', name: 'a partners desk in burled walnut', description: 'An antique partners desk in burled walnut fills the study area, its leather writing surface embossed with gold. A Tiffany lamp casts warm amber light.', boltedDown: false },
        { prototype: 'furniture', name: 'a hand-knotted Persian rug', description: 'A museum-quality Persian rug in deep burgundy and gold covers most of the floor, its silk threads gleaming. The pattern depicts hunting scenes from ancient Persia.', boltedDown: false },
        { prototype: 'furniture', name: 'a bronze sculpture', description: 'A Rodin bronze sculpture of "The Thinker" stands on a marble pedestal, the patina rich and dark from a century of careful handling.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a tufted leather daybed',
          capacity: 2,
          emptyMsg:
            'A tufted Chesterfield daybed in oxblood leather offers repose, its brass nail-head trim catching the light.',
          occupiedMsg: '%s reclining on the leather daybed.',
        },
        {
          name: 'an Eames executive chair',
          capacity: 1,
          emptyMsg:
            'An original Eames executive chair in rosewood and leather sits at the desk, the epitome of mid-century luxury.',
          occupiedMsg: '%s seated at the partners desk.',
        },
      ],
    },

    '%B1_z33': {
      name: 'Smith Tower - 33th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: -10,
      y: 11,
      z: 33,
      exits: { south: '%B2_z33' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 33).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a spiral staircase in wrought iron', description: 'An elegant spiral staircase in hand-forged wrought iron with gold leaf accents ascends to the mezzanine level, each step topped with white marble.', boltedDown: true },
        { prototype: 'bed', name: 'a loft bed with cashmere bedding', description: 'The mezzanine holds a platform bed dressed in Scottish cashmere blankets and Hungarian goose down pillows, a cocoon of impossible softness.', quality: 'nice' },
        { prototype: 'furniture', name: 'a Murano glass chandelier', description: 'A spectacular Murano glass chandelier in coral and gold cascades from the vaulted ceiling, its organic forms resembling frozen flames.', boltedDown: true },
        { prototype: 'table', name: 'a pietra dura side table', description: 'A Florentine pietra dura table displays intricate inlays of semi-precious stones forming flowers and birds against black marble.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a curved sectional in white leather',
          capacity: 4,
          emptyMsg:
            'A sweeping curved sectional in butter-soft white Italian leather embraces the conversation area below the mezzanine.',
          occupiedMsg: '%s lounging on the white leather sectional.',
        },
        {
          name: 'the cashmere-draped loft bed',
          capacity: 2,
          emptyMsg:
            'The loft bed above beckons with its mountain of cashmere and down.',
          occupiedMsg: '%s nestled in the loft bed.',
        },
      ],
    },

    '%C1_z33': {
      name: 'Smith Tower - 33th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -13,
      y: 10,
      z: 33,
      exits: { south: '%C2_z33', east: '%EL_z33' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 33).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a built-in sleeping niche', description: 'A sleeping niche is recessed into the wall, lined with padded silk in powder blue and fitted with a custom mattress. Gold trim frames the opening like a jewel box.', quality: 'nice' },
        { prototype: 'furniture', name: 'a vanity with gilded mirror', description: 'A French vanity with a tri-fold gilded mirror is built into the opposite wall, its marble top holding crystal perfume bottles and silver brushes.', boltedDown: true },
        { prototype: 'furniture', name: 'a collection of miniature portraits', description: 'A gallery of miniature portraits in oval gilt frames lines the wall - aristocratic faces from another century, each in a velvet-lined frame.', boltedDown: true },
        { prototype: 'table', name: 'a marquetry jewelry cabinet', description: 'A delicate jewelry cabinet with intricate marquetry depicting pastoral scenes holds countless tiny drawers lined in burgundy velvet.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the silk-lined sleeping niche',
          capacity: 1,
          emptyMsg:
            'The sleeping niche glows softly, its silk lining catching the light like the interior of a seashell.',
          occupiedMsg: '%s tucked into the sleeping niche.',
        },
        {
          name: 'a vanity stool',
          capacity: 1,
          emptyMsg:
            'A small stool upholstered in pale blue velvet sits before the vanity.',
          occupiedMsg: '%s seated at the vanity.',
        },
      ],
    },

    '%B2_z33': {
      name: 'Smith Tower - 33th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -11,
      y: 10,
      z: 33,
      exits: {
        north: '%B1_z33',
        east: '%B3_z33',
        west: { room: '%EL_z33', door: '%D_B2_z33' },
        south: '%B4_z33',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 33).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a tiered crystal chandelier', description: 'A magnificent three-tiered crystal chandelier dominates the ceiling, hundreds of hand-cut prisms cascading like frozen waterfalls. Even dormant, it catches and multiplies light.', boltedDown: true },
        { prototype: 'table', name: 'a marble-topped console', description: 'A serpentine console table with a Portoro marble top holds a collection of Chinese export porcelain - famille rose vases and ginger jars from the Qing dynasty.', boltedDown: false },
        { prototype: 'furniture', name: 'floor-to-ceiling silk drapes', description: 'Heavy silk drapes in champagne gold frame the windows, their fabric so fine it seems to glow. Gold tassels secure them to gilded holdbacks.', boltedDown: true },
        { prototype: 'furniture', name: 'an Art Deco drinks cabinet', description: 'A shagreen-covered drinks cabinet in the Art Deco style opens to reveal mirrored interior shelves holding Lalique glasses and vintage spirits.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a pair of bergere chairs',
          capacity: 2,
          emptyMsg:
            'Two Louis XV bergere chairs in cream silk face each other across a small table, their carved frames bright with gold leaf.',
          occupiedMsg: '%s seated in one of the bergere chairs.',
        },
        {
          name: 'a velvet Knole sofa',
          capacity: 3,
          emptyMsg:
            'A deep Knole sofa in forest green velvet anchors the room, its high sides and rope-tied arms creating an intimate enclosure.',
          occupiedMsg: '%s ensconced in the Knole sofa.',
        },
      ],
    },

    '%B3_z33': {
      name: 'Smith Tower - 33th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: -10,
      y: 10,
      z: 33,
      exits: { west: '%B2_z33' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 33).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a library with rolling ladder', description: 'Built-in mahogany bookshelves line every wall, accessible via a brass rolling ladder. First editions and leather-bound volumes fill every shelf.', boltedDown: true },
        { prototype: 'table', name: 'a Chippendale writing desk', description: 'An eighteenth-century Chippendale writing desk in flame mahogany holds an antique inkwell, quill pens, and blotter. The brass hardware gleams.', boltedDown: false },
        { prototype: 'furniture', name: 'a globe bar', description: 'A vintage floor globe opens to reveal a hidden bar inside, its interior lined with quilted leather and fitted for bottles and glasses.', boltedDown: false },
        { prototype: 'furniture', name: 'a pair of gilt-framed landscapes', description: 'Two Hudson River School landscapes in elaborate gilt frames flank the windows - pastoral American scenes rendered in luminous detail.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a tufted leather club chair',
          capacity: 1,
          emptyMsg:
            'A deep club chair in tobacco-colored leather sits by the window, worn to buttery softness over decades of use.',
          occupiedMsg: '%s settled into the club chair.',
        },
        {
          name: 'a Georgian desk chair',
          capacity: 1,
          emptyMsg:
            'A Georgian desk chair with carved arms and leather seat is pushed under the writing desk.',
          occupiedMsg: '%s working at the Chippendale desk.',
        },
      ],
    },

    '%C2_z33': {
      name: 'Smith Tower - 33th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -13,
      y: 9,
      z: 33,
      exits: { north: '%C1_z33', east: '%C3_z33' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 33).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'an Aubusson tapestry', description: 'A seventeenth-century Aubusson tapestry covers one wall, depicting a romantic garden scene with shepherdesses and peacocks. The colors remain remarkably vibrant.', boltedDown: true },
        { prototype: 'table', name: 'a malachite-topped table', description: 'A Russian Empire side table with a malachite top gleams with veins of green - the stone was quarried from the Urals two centuries ago.', boltedDown: false },
        { prototype: 'furniture', name: 'a chinoiserie secretary', description: 'A lacquered chinoiserie secretary in black and gold depicts scenes of pagodas and bridges. The fall-front opens to reveal countless small drawers and cubbyholes.', boltedDown: false },
        { prototype: 'furniture', name: 'a rock crystal obelisk', description: 'A pair of rock crystal obelisks on gilt bronze bases flank the windows, their faceted surfaces splitting light into rainbows.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a Napoleon III settee',
          capacity: 2,
          emptyMsg:
            'A Napoleon III settee upholstered in rose silk waits by the tapestry, its ebonized frame inlaid with brass.',
          occupiedMsg: '%s perched on the Napoleon III settee.',
        },
        {
          name: 'a pair of slipper chairs',
          capacity: 2,
          emptyMsg:
            'Two slipper chairs in coral velvet sit at angles by the window, inviting intimate conversation.',
          occupiedMsg: '%s seated in a slipper chair.',
        },
      ],
    },

    '%C3_z33': {
      name: 'Smith Tower - 33th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -12,
      y: 9,
      z: 33,
      exits: {
        north: { room: '%EL_z33', door: '%D_C3_z33' },
        west: '%C2_z33',
        east: '%C4_z33',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 33).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a Venetian etched mirror', description: 'An enormous Venetian mirror with an etched and beveled frame dominates the entry wall, its antique glass giving reflections a dreamlike quality.', boltedDown: true },
        { prototype: 'table', name: 'a boulle console', description: 'A French boulle console in tortoiseshell and brass marquetry holds a Sevres porcelain bowl filled with silk flowers that look perpetually fresh.', boltedDown: false },
        { prototype: 'furniture', name: 'a coat closet with cedar lining', description: 'A built-in coat closet lined with aromatic cedar holds velvet hangers and has a drawer for gloves. The brass hardware is original nineteenth century.', boltedDown: true },
        { prototype: 'furniture', name: 'an ormolu wall sconce', description: 'A pair of French ormolu wall sconces with crystal drops flank the mirror, their candle forms now fitted for electricity.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'an Empire bench',
          capacity: 2,
          emptyMsg:
            'An Empire bench in mahogany with lion\'s paw feet and leopard print upholstery offers a place to sit while removing shoes.',
          occupiedMsg: '%s seated on the Empire bench.',
        },
      ],
    },

    '%C4_z33': {
      name: 'Smith Tower - 33th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -11,
      y: 9,
      z: 33,
      exits: { west: '%C3_z33' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 33).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a four-poster bed with silk hangings', description: 'A magnificent four-poster bed in carved mahogany rises nearly to the ceiling, its posts wrapped in silk hangings of deep burgundy. The mattress is layered with down and the finest Irish linen.', quality: 'nice' },
        { prototype: 'furniture', name: 'an armoire with inlaid panels', description: 'A massive armoire with doors inlaid in mother-of-pearl and ebony depicts birds among flowering branches. Inside, velvet-lined compartments await.', boltedDown: false },
        { prototype: 'table', name: 'a dressing table with silver appointments', description: 'A kidney-shaped dressing table with a triple mirror holds a complete set of silver grooming appointments - brushes, mirrors, and crystal jars with silver lids.', boltedDown: false },
        { prototype: 'furniture', name: 'a silk Kirman carpet', description: 'A palace-sized silk Kirman carpet in ivory and rose covers most of the floor, its million knots per square inch creating a surface like velvet.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the four-poster bed',
          capacity: 2,
          emptyMsg:
            'The four-poster bed awaits like a throne, silk curtains drawn back with tasseled cords.',
          occupiedMsg: '%s resting in the four-poster bed.',
        },
        {
          name: 'a crapaud chair',
          capacity: 1,
          emptyMsg:
            'A tufted crapaud chair in dusty rose velvet sits near the dressing table, its low back perfect for applying cosmetics.',
          occupiedMsg: '%s seated at the dressing table.',
        },
      ],
    },

    '%B4_z33': {
      name: 'Smith Tower - 33th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: -10,
      y: 9,
      z: 33,
      exits: { north: '%B2_z33' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 33).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a sleigh bed in burl walnut', description: 'An Empire sleigh bed in burled walnut with ormolu mounts holds a mattress of the finest construction. Monogrammed linens in cream and gold complete the picture.', quality: 'nice' },
        { prototype: 'furniture', name: 'a built-in wardrobe with beveled mirrors', description: 'A full wall of built-in wardrobes features beveled mirror panels and brass fittings. Inside, velvet-covered hangers and cedar-lined drawers await.', boltedDown: true },
        { prototype: 'table', name: 'a marble-topped commode', description: 'A Louis XV commode with a rose marble top and elaborate bronze mounts serves as a nightstand. Its bombay front holds two drawers with original hardware.', boltedDown: false },
        { prototype: 'furniture', name: 'a gilt-bronze cartel clock', description: 'An eighteenth-century cartel clock in gilt bronze hangs on the wall, its face painted with pastoral scenes. The mechanism still keeps perfect time.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the sleigh bed',
          capacity: 2,
          emptyMsg:
            'The elegant sleigh bed curves like a wave frozen in walnut.',
          occupiedMsg: '%s reclining in the sleigh bed.',
        },
        {
          name: 'a fauteuil armchair',
          capacity: 1,
          emptyMsg:
            'A Louis XVI fauteuil in pale blue silk sits by the window, its carved frame touched with gold.',
          occupiedMsg: '%s seated in the fauteuil.',
        },
      ],
    },
  },
};
