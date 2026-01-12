// Smith Tower - Condo Floor (z=31) - Rustic Farmhouse Theme
// Distressed wood, galvanized metal, mason jars, shiplap walls, barn doors

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z31' },
    },

    // Rentable locks
    '%RL_A2_z31': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z31': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z31': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z31': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z31'],
    },
    '%D_B2_z31': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z31'],
    },
    '%D_C3_z31': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z31'],
    },

    // Elevator landing
    '%EL_z31': {
      name: 'Smith Tower - 31th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 31,
      exits: {
        north: { room: '%A2_z31', door: '%D_A2_z31' },
        east: { room: '%B2_z31', door: '%D_B2_z31' },
        south: { room: '%C3_z31', door: '%D_C3_z31' },
        west: '%C1_z31',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z31': {
      name: 'Smith Tower - 31th Floor - North Suite - Living Room',
      description:
        'A corner unit with tall windows and wide-plank pine floors weathered to a honey gold. A farmhouse kitchenette occupies one wall, its apron sink and open shelving lending a country charm. Shiplap paneling painted cream white covers the interior walls, softening the urban view beyond.',
      x: -3,
      y: 11,
      z: 31,
      exits: { east: '%A2_z31' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 31).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a distressed wood farm table',
          description:
            'A large farm table dominates the space, its surface showing decades of wear with knife marks and water stains that tell stories. The milk paint finish has worn through in places, revealing older layers beneath.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a farmhouse kitchenette',
          description:
            'A built-in kitchenette with an apron-front sink, butcher block counters, and open shelving holds enamelware dishes and vintage crocks. Mason jars line the shelves, some still containing dried herbs.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'shiplap accent wall',
          description:
            'Horizontal shiplap boards cover the main wall, painted a soft cream that has yellowed gracefully with age. The slight gaps between boards create pleasing shadow lines.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a galvanized metal bucket',
          description:
            'A large galvanized metal bucket sits in the corner, repurposed as a planter. A dried arrangement of wheat stalks and cotton stems fills it.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'a ladder-back bench',
          capacity: 3,
          emptyMsg:
            'A long ladder-back bench with a woven rush seat runs along one side of the farm table, worn smooth from years of use.',
          occupiedMsg: '%s seated on the ladder-back bench.',
        },
      ],
    },

    '%A2_z31': {
      name: 'Smith Tower - 31th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A sliding barn door on iron hardware serves as the closet, its reclaimed wood weathered to a silvery gray. The room smells faintly of cedar and old linen.',
      x: -2,
      y: 11,
      z: 31,
      exits: {
        west: '%A1_z31',
        east: '%A3_z31',
        south: { room: '%EL_z31', door: '%D_A2_z31' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 31).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a cast iron bed frame',
          description:
            'A queen-sized cast iron bed frame in antique white holds a thick mattress topped with a hand-stitched quilt in a wedding ring pattern. The iron scrollwork is ornate but not fussy.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a barn door closet',
          description:
            'A sliding barn door on black iron hardware conceals the closet. The reclaimed wood planks are weathered silver-gray, still bearing old nail holes and saw marks.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a milk paint nightstand',
          description:
            "A small nightstand painted in robin's egg blue milk paint sits beside the bed. The finish is intentionally distressed, showing raw wood at the edges.",
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a vintage crock',
          description:
            'A stoneware crock with blue decorations sits on the nightstand, holding a bundle of dried lavender that still carries a faint scent.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the cast iron bed',
          capacity: 2,
          emptyMsg:
            'The cast iron bed waits beneath a quilted spread, its springs creaking softly.',
          occupiedMsg: '%s resting on the cast iron bed.',
        },
      ],
    },

    '%A3_z31': {
      name: 'Smith Tower - 31th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen appointed in farmhouse style. Open shelving displays mason jars of dry goods and enamelware. A butcher block island provides workspace in the center.',
      x: -1,
      y: 11,
      z: 31,
      exits: { west: '%A2_z31' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 31).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a farmhouse galley kitchen',
          description:
            'A narrow galley kitchen features open pine shelving, an apron sink, and a vintage-style stove. Mason jars hold flour, sugar, and other dry goods. The counters are worn butcher block.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a butcher block island',
          description:
            'A heavy butcher block island on turned legs provides workspace in the center of the kitchen. The surface is scarred from years of chopping, its maple top darkened with use.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a daybed with burlap cushions',
          description:
            'A wooden daybed frame holds cushions covered in natural burlap and linen. Throw pillows with grain sack stripes add comfort.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'mason jar light fixtures',
          description:
            'A trio of mason jar pendant lights hangs from the ceiling on twisted cloth cords. The glass is clouded with age but still catches light beautifully.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the daybed',
          capacity: 2,
          emptyMsg:
            'The daybed sits against the wall, burlap cushions stacked invitingly.',
          occupiedMsg: '%s lounging on the daybed.',
        },
        {
          name: 'a ladder-back chair',
          capacity: 1,
          emptyMsg:
            'A ladder-back chair with a woven seat sits at the butcher block island.',
          occupiedMsg: '%s sitting at the island.',
        },
      ],
    },

    '%B1_z31': {
      name: 'Smith Tower - 31th Floor - East Suite - Loft',
      description:
        'A lofted corner with exposed beam ceilings and a compact mezzanine sleeping area. Weathered barn wood covers the loft railing, and a chicken wire cabinet displays vintage dishware. A wooden ladder leads to the sleeping loft above.',
      x: 0,
      y: 11,
      z: 31,
      exits: { south: '%B2_z31' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 31).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a barn wood loft ladder',
          description:
            'A sturdy ladder built from reclaimed barn wood leads up to the sleeping mezzanine. The rungs are worn smooth from countless climbs, the wood silvered with age.',
          boltedDown: true,
        },
        {
          prototype: 'bed',
          name: 'a straw tick mattress',
          description:
            'A simple mattress on a wooden platform fills the mezzanine, covered with a patchwork quilt in faded calico prints. The bedding smells of dried grass.',
          quality: 'cheap',
        },
        {
          prototype: 'furniture',
          name: 'a chicken wire cabinet',
          description:
            'A tall cabinet with chicken wire doors displays vintage enamelware plates, chipped ironstone bowls, and an assortment of mason jars. The pine frame is painted in worn white.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a canvas drop cloth couch',
          description:
            'An old wooden couch is draped in canvas drop cloth, its cushions lumpy but serviceable. Burlap pillows soften the rustic seating.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the drop cloth couch',
          capacity: 3,
          emptyMsg:
            'The canvas-covered couch waits beneath the mezzanine, inviting rest.',
          occupiedMsg: '%s settled into the drop cloth couch.',
        },
        {
          name: 'the loft bed',
          capacity: 1,
          emptyMsg:
            'The loft bed is visible above through the chicken wire railing.',
          occupiedMsg: '%s up in the loft bed.',
        },
      ],
    },

    '%C1_z31': {
      name: 'Smith Tower - 31th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. Shiplap walls painted buttermilk yellow make the small space feel cheerful despite its size. A wrought iron coat rack stands by the entrance.',
      x: -3,
      y: 10,
      z: 31,
      exits: { south: '%C2_z31', east: '%EL_z31' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 31).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a rope bed frame',
          description:
            'An antique rope bed frame is wedged into the alcove, its hemp rope supports still taut. A thin tick mattress and homespun wool blanket provide simple comfort.',
          quality: 'cheap',
        },
        {
          prototype: 'furniture',
          name: 'wrought iron wall hooks',
          description:
            'A row of wrought iron hooks is mounted on the shiplap wall, designed for hanging coats and hats. A worn leather strap hangs from one.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a small pie safe',
          description:
            'A narrow pie safe with punched tin panels stands against the wall, its interior dark. The tin panels show a star pattern, tarnished green with age.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a hooked rag rug',
          description:
            'A hand-hooked rug in faded stripes covers the floor beside the bed, its fabric strips worn soft from years of feet.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the rope bed',
          capacity: 1,
          emptyMsg:
            'The rope bed waits in the alcove, wool blanket folded at the foot.',
          occupiedMsg: '%s lying on the rope bed.',
        },
      ],
    },

    '%B2_z31': {
      name: 'Smith Tower - 31th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, dominated by a massive reclaimed wood coffee table and plank flooring. Galvanized metal accents catch the light throughout.',
      x: -1,
      y: 10,
      z: 31,
      exits: {
        north: '%B1_z31',
        east: '%B3_z31',
        west: { room: '%EL_z31', door: '%D_B2_z31' },
        south: '%B4_z31',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 31).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a grain sack sectional',
          description:
            'A large L-shaped sectional is upholstered in antique grain sack fabric, the faded blue stripes and stenciled markings adding character. The cushions are deep and comfortable.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a reclaimed barn door coffee table',
          description:
            'A massive coffee table made from an old barn door sits before the sectional. The weathered red paint is mostly worn away, revealing gray wood beneath. Iron corner brackets reinforce the edges.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a galvanized metal entertainment shelf',
          description:
            'Industrial galvanized metal shelving holds a dead television and stacks of old books. Galvanized buckets serve as decorative accents, holding dried cotton bolls and pine cones.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a barn door coat closet',
          description:
            'A sliding barn door on iron track hardware conceals the coat closet near the entrance. The door is built from mismatched reclaimed planks, each weathered differently.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the grain sack sectional',
          capacity: 4,
          emptyMsg:
            'The sectional sprawls across the room, grain sack fabric soft from years of use.',
          occupiedMsg: '%s sunk into the grain sack sectional.',
        },
      ],
    },

    '%B3_z31': {
      name: 'Smith Tower - 31th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and floor-to-ceiling shelving. This cozy study features whitewashed pine walls and furniture finished in milk paint, creating a light-filled country retreat.',
      x: 0,
      y: 10,
      z: 31,
      exits: { west: '%B2_z31' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 31).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'whitewashed pine bookshelves',
          description:
            'Floor-to-ceiling pine bookshelves whitewashed to a pale gray hold books, vintage jugs, and antique glass bottles. The shelves sag slightly under their burden.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a trestle desk',
          description:
            'A simple trestle desk in honey-stained pine sits in the window bay. The surface is worn smooth, marked by ink stains and the impressions of countless handwritten pages.',
          boltedDown: false,
        },
        {
          prototype: 'chair',
          name: 'a Windsor armchair',
          description:
            'A classic Windsor armchair in dark green milk paint sits at the desk. The spindles are worn where hands have gripped them, the seat scooped from generations of sitters.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'an oil lamp',
          description:
            'An antique oil lamp with a glass chimney sits on the desk, its brass base polished. A faint kerosene smell lingers.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the Windsor armchair',
          capacity: 1,
          emptyMsg:
            'The Windsor chair waits at the desk, its spindles casting shadows.',
          occupiedMsg: '%s working at the trestle desk.',
        },
        {
          name: 'a cane-seat rocker',
          capacity: 1,
          emptyMsg:
            'A cane-seat rocking chair sits by the window, ready for contemplation.',
          occupiedMsg: '%s rocking gently by the window.',
        },
      ],
    },

    '%C2_z31': {
      name: 'Smith Tower - 31th Floor - South Suite - Living Room',
      description:
        'A corner unit with western exposure and wide pine plank floors. The afternoon sun has faded the homespun curtains to a uniform cream, and shiplap walls painted sage green give the space a garden cottage feel.',
      x: -3,
      y: 9,
      z: 31,
      exits: { north: '%C1_z31', east: '%C3_z31' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 31).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a camelback settee',
          description:
            'A small camelback settee in faded floral chintz sits against the sage green shiplap wall. The wooden legs are turned in a traditional style, the upholstery worn but clean.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a painted blanket chest',
          description:
            'A blanket chest in chipped blue milk paint serves as a coffee table. The interior still holds a moth-eaten quilt and dried sachets of lavender.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a cast iron radiator cover',
          description:
            'The old steam radiator is hidden behind a cover made from reclaimed barn wood slats. The metal beneath still throws warmth into the room.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'homespun linen curtains',
          description:
            'Simple homespun linen curtains hang from hand-forged iron rods. The fabric is sun-bleached to a creamy white, the weave loose and rustic.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the camelback settee',
          capacity: 2,
          emptyMsg:
            'The settee faces the fading afternoon light, chintz faded but inviting.',
          occupiedMsg: '%s perched on the settee.',
        },
      ],
    },

    '%C3_z31': {
      name: 'Smith Tower - 31th Floor - South Suite - Foyer',
      description:
        "The single entrance to the C block, with a stout fire door to the elevator. A mudroom-style entryway features peg rails and a deacon's bench, all in weathered farmhouse style.",
      x: -2,
      y: 9,
      z: 31,
      exits: {
        north: { room: '%EL_z31', door: '%D_C3_z31' },
        west: '%C2_z31',
        east: '%C4_z31',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 31).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a shaker peg rail',
          description:
            'A Shaker-style peg rail runs along the entry wall, the wooden pegs spaced evenly. A few hang empty, one holds a dusty straw hat.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'an entry bench storage',
          description:
            'A built-in bench with cubbies beneath provides storage for shoes and baskets. The pine seat is worn smooth, the cubbies holding forgotten items.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a braided rag rug',
          description:
            'A large braided rug in muted earth tones covers the entryway floor, its fabric strips worn soft from years of traffic.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a washstand console',
          description:
            'An antique washstand serves as an entry console, its marble top holding a ceramic basin and pitcher for decoration. The towel bar still holds a faded linen hand towel.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: "the deacon's bench",
          capacity: 3,
          emptyMsg:
            "A long deacon's bench with high back sits against the wall, offering a place to rest while removing boots.",
          occupiedMsg: "%s resting on the deacon's bench.",
        },
      ],
    },

    '%C4_z31': {
      name: 'Smith Tower - 31th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and worn pine plank floors. The farmhouse aesthetic creates warmth despite the industrial bones, with a wrought iron bed filling the alcove behind gathered cotton curtains.',
      x: -1,
      y: 9,
      z: 31,
      exits: { west: '%C3_z31' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 31).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a wrought iron alcove bed',
          description:
            'A wrought iron bed fills the recessed alcove, hidden behind gathered cotton curtains on an iron tension rod. A log cabin quilt in faded reds and blues covers the mattress.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a ladder-back clothes valet',
          description:
            'A wooden ladder repurposed as a clothes valet leans against the wall, its rungs holding a faded flannel shirt and a leather belt.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a farmhouse wall mirror',
          description:
            'A large mirror in a whitewashed frame is mounted on the wall. The glass is foxed with age but still serviceable, the frame showing wear at the corners.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a spool table nightstand',
          description:
            'A small table made from an old thread spool serves as a nightstand, its wooden top holding a chamber stick candleholder and a tattered paperback.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the alcove bed',
          capacity: 2,
          emptyMsg:
            'The iron bed waits in its alcove, curtains half-drawn to reveal the log cabin quilt.',
          occupiedMsg: '%s tucked away in the alcove bed.',
        },
      ],
    },

    '%B4_z31': {
      name: 'Smith Tower - 31th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in storage. Every inch is utilized in farmhouse fashion, with a fold-down sewing table and a Murphy bed that disappears into whitewashed bead board paneling.',
      x: 0,
      y: 9,
      z: 31,
      exits: { north: '%B2_z31' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 31).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a bead board Murphy bed',
          description:
            'A Murphy bed folds down from whitewashed bead board paneling, its mechanism hidden behind a facade of vintage window frames. The mattress is thin but covered with a lovely Dresden plate quilt.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a bead board Murphy cabinet',
          description:
            'The Murphy bed folds into a tall cabinet faced with whitewashed bead board and vintage six-pane window sashes. When closed, it looks like a charming wall feature.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'open pine shelving',
          description:
            'Rough-sawn pine shelving is built into the walls around the window, holding woven baskets, vintage tins, and a collection of blue Ball mason jars.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a fold-down sewing table',
          description:
            'A fold-down table hinged to the wall reveals a scarred pine surface, originally used for sewing. A pincushion shaped like a tomato still sits in one corner.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a painted blanket box',
          description:
            'A narrow blanket box painted in mustard yellow milk paint is wedged into the corner, its interior cedar-scented and holding moth-eaten woolens.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the Murphy bed',
          capacity: 2,
          emptyMsg:
            'The Murphy bed is folded down, its Dresden plate quilt smoothed and waiting.',
          occupiedMsg: '%s stretched out on the Murphy bed.',
        },
      ],
    },
  },
};
