// Smith Tower - Condo Floor (z=17)
// Traditional grandma's house - doilies, chintz, porcelain figurines, antimacassars

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z17' },
    },

    // Rentable locks
    '%RL_A2_z17': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z17': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z17': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z17': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z17'],
    },
    '%D_B2_z17': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z17'],
    },
    '%D_C3_z17': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z17'],
    },

    // Elevator landing
    '%EL_z17': {
      name: 'Smith Tower - 17th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 17,
      exits: {
        north: { room: '%A2_z17', door: '%D_A2_z17' },
        east: { room: '%B2_z17', door: '%D_B2_z17' },
        south: { room: '%C3_z17', door: '%D_C3_z17' },
        west: '%C1_z17',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z17': {
      name: 'Smith Tower - 17th Floor - North Suite - Living Room',
      description:
        "A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone's life—books, decorative objects, a dead potted plant.",
      x: -3,
      y: 11,
      z: 17,
      exits: { east: '%A2_z17' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 17).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a mahogany coffee table',
          description:
            'A low mahogany coffee table sits before the sofa, its polished surface protected by three crocheted doilies. A crystal candy dish filled with ancient ribbon candy occupies the center, flanked by porcelain figurines of shepherdesses.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a built-in china cabinet',
          description:
            'A floor-to-ceiling china cabinet is built into one wall, its glass doors revealing rows of depression glass, commemorative plates from state fairs, and a complete set of Blue Willow china that has never been used.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a console television cabinet',
          description:
            'An enormous wooden console TV cabinet dominates one corner, the television tube long dead but the cabinet too heavy to move. Family photos in ornate frames crowd its top.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a radiator cover',
          description:
            'An ornate brass radiator cover conceals the steam radiator. Ceramic cats in various poses are arranged along its top, guarding the room with painted eyes.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a plastic-covered sofa',
          capacity: 3,
          emptyMsg:
            'A floral chintz sofa wrapped in protective plastic sits against the wall, antimacassars draped over the back and arms.',
          occupiedMsg: '%s perched uncomfortably on the plastic-covered sofa.',
        },
      ],
    },

    '%A2_z17': {
      name: 'Smith Tower - 17th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 17,
      exits: {
        west: '%A1_z17',
        east: '%A3_z17',
        south: { room: '%EL_z17', door: '%D_A2_z17' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 17).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a brass bed',
          description:
            'An ornate brass bed dominates the room, its headboard and footboard gleaming with polish. A chenille bedspread in dusty rose covers a mountain of needlepoint pillows.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a built-in wardrobe',
          description:
            'A cedar-lined wardrobe is built into one wall, its doors adorned with decoupage flowers. The scent of mothballs wafts out when opened.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a vanity table',
          description:
            'A kidney-shaped vanity table with a triptych mirror holds an array of perfume bottles, a silver-backed brush set, and a jewelry box that plays a tinkling melody when opened.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a hope chest',
          description:
            'A carved cedar hope chest sits at the foot of the bed, its lid heavy with decades of accumulated linens and memories.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the brass bed',
          capacity: 2,
          emptyMsg:
            'The brass bed gleams beneath its chenille spread and army of decorative pillows.',
          occupiedMsg: '%s nestled among the needlepoint pillows.',
        },
        {
          name: 'a vanity bench',
          capacity: 1,
          emptyMsg:
            'A small upholstered bench sits before the vanity, its cushion worn from use.',
          occupiedMsg: '%s seated at the vanity.',
        },
      ],
    },

    '%A3_z17': {
      name: 'Smith Tower - 17th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 17,
      exits: { west: '%A2_z17' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 17).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a built-in sewing nook',
          description:
            'A sewing nook is built into the wall, complete with a treadle Singer sewing machine, thread organizer, and basket of fabric scraps. Half-finished quilt squares wait patiently.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a card table',
          description:
            'A folding card table covered with a crocheted tablecloth holds an unfinished jigsaw puzzle depicting kittens in a basket. Some pieces have fallen to the floor.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a curio cabinet',
          description:
            'A curved-glass curio cabinet displays Hummel figurines, spoon collections from every state, and a porcelain thimble collection mounted on tiny shelves.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a dried flower arrangement',
          description:
            'A massive dried flower arrangement in a copper pot sits on a doily-covered stand, shedding petals whenever anyone walks past.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'a rocking chair',
          capacity: 1,
          emptyMsg:
            'A wooden rocking chair with a crocheted seat cushion sits by the sewing machine, gently creaking.',
          occupiedMsg: '%s rocking gently in the chair.',
        },
        {
          name: 'folding card chairs',
          capacity: 3,
          emptyMsg:
            'Three padded folding chairs surround the card table, their vinyl seats patched with tape.',
          occupiedMsg: '%s seated at the puzzle table.',
        },
      ],
    },

    '%B1_z17': {
      name: 'Smith Tower - 17th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 17,
      exits: { south: '%B2_z17' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 17).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a built-in ladder',
          description:
            'A sturdy wooden ladder with carved spindles leads up to the sleeping loft, each rung covered with braided rug scraps for grip.',
          boltedDown: true,
        },
        {
          prototype: 'bed',
          name: 'a featherbed',
          description:
            'A thick featherbed covered in a handmade patchwork quilt fills the loft space. The ceiling is low and cozy, perfect for reading by the glow of a ceramic night light.',
          quality: 'standard',
        },
        {
          prototype: 'table',
          name: 'a TV tray collection',
          description:
            'A set of four metal TV trays with painted pastoral scenes stand ready for deployment, their legs slightly wobbly from decades of use.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a grandfather clock',
          description:
            'A tall grandfather clock stands against the wall, its pendulum still and its face stopped at 7:15. The wood is polished to a warm glow despite the silence.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'an overstuffed armchair',
          capacity: 1,
          emptyMsg:
            'An enormous overstuffed armchair in cabbage-rose fabric dominates the corner, antimacassars protecting every surface.',
          occupiedMsg: '%s sunk deep into the armchair.',
        },
        {
          name: 'the featherbed',
          capacity: 2,
          emptyMsg:
            'The loft bed is visible above, piled with quilts and crocheted afghans.',
          occupiedMsg: '%s nestled in the featherbed loft.',
        },
      ],
    },

    '%C1_z17': {
      name: 'Smith Tower - 17th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 17,
      exits: { south: '%C2_z17', east: '%EL_z17' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 17).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a daybed',
          description:
            'A narrow daybed with a white iron frame is wedged into the alcove, covered with a crocheted afghan in variegated pastels. A ceramic angel night light glows faintly in the outlet beside it.',
          quality: 'cheap',
        },
        {
          prototype: 'furniture',
          name: 'built-in coat hooks',
          description:
            'A row of ornate brass coat hooks is mounted on the wall, one still holding a clear plastic rain bonnet and a folded accordion-style rain scarf.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a prayer shelf',
          description:
            'A small wall shelf holds a collection of religious items: a crucifix, a small statue of the Virgin Mary, a dried palm frond, and a dog-eared prayer book.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a plant stand',
          description:
            'A wrought-iron plant stand holds an aspidistra in a ceramic pot painted with violets. The plant, miraculously, still lives.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the daybed',
          capacity: 1,
          emptyMsg:
            'The daybed waits beneath its pastel afghan, a needlepoint pillow reading "Bless This Home" propped against the iron headboard.',
          occupiedMsg: '%s curled up on the daybed.',
        },
      ],
    },

    '%B2_z17': {
      name: 'Smith Tower - 17th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 17,
      exits: {
        north: '%B1_z17',
        east: '%B3_z17',
        west: { room: '%EL_z17', door: '%D_B2_z17' },
        south: '%B4_z17',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 17).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a doily-covered end table',
          description:
            "A round end table drowns under layers of crocheted doilies, supporting a ceramic lamp shaped like a colonial woman, a dish of hard candies, and a collection of Reader's Digest Condensed Books.",
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a whatnot shelf',
          description:
            'A corner whatnot shelf displays ceramic collectibles: a Precious Moments wedding couple, a Lladro-style ballerina, commemorative bells from every national park, and a music box that plays "Somewhere My Love."',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a built-in bookcase',
          description:
            'A built-in bookcase holds a complete encyclopedia set from 1975, family photo albums with magnetic pages, and a collection of decorative plates depicting American landmarks.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a built-in entry closet',
          description:
            'An entry closet with louvered doors contains wire hangers, a plastic shoe organizer, and the lingering scent of lavender sachets.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a potpourri bowl',
          description:
            'A large china bowl on the bookshelf overflows with dried potpourri, its scent of rose and cinnamon still faintly present after all these years.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'a velveteen loveseat',
          capacity: 2,
          emptyMsg:
            'A dusty-rose velveteen loveseat sits beneath a painting of Jesus, plastic slipcovers crackling softly.',
          occupiedMsg: '%s perched on the velveteen loveseat.',
        },
        {
          name: 'a La-Z-Boy recliner',
          capacity: 1,
          emptyMsg:
            'A brown La-Z-Boy recliner faces the window, its lever worn smooth. A crocheted afghan is draped over the back.',
          occupiedMsg: '%s reclined in the La-Z-Boy.',
        },
      ],
    },

    '%B3_z17': {
      name: 'Smith Tower - 17th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 17,
      exits: { west: '%B2_z17' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 17).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'built-in curio shelves',
          description:
            'Built-in curio shelves display decades of accumulated treasures: carnival glass bowls, souvenir shot glasses, crocheted tissue box covers, and a complete set of Wade Whimsies from Red Rose Tea.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a secretary desk',
          description:
            'A drop-front secretary desk in cherry wood holds stationery with embossed flowers, a collection of ballpoint pens from insurance agencies, and a leather address book with names crossed out in different inks.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a yarn basket',
          description:
            'A wicker basket overflows with skeins of yarn in pastel colors, tangled with half-finished projects: a scarf, an afghan square, something that might have been a sweater sleeve.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a telephone table',
          description:
            'A small telephone table holds a rotary phone in harvest gold, a pad of paper for messages, and a ceramic cat whose eyes follow you around the room.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'a wingback chair',
          capacity: 1,
          emptyMsg:
            'A wingback chair in faded floral tapestry faces the window, a crocheted antimacassar protecting its headrest.',
          occupiedMsg: '%s settled into the wingback chair.',
        },
        {
          name: 'the secretary chair',
          capacity: 1,
          emptyMsg:
            'A needlepoint-cushioned chair sits before the secretary desk.',
          occupiedMsg: '%s seated at the secretary desk.',
        },
      ],
    },

    '%C2_z17': {
      name: 'Smith Tower - 17th Floor - South Suite - Living Room',
      description:
        'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 17,
      exits: { north: '%C1_z17', east: '%C3_z17' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 17).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a pie crust table',
          description:
            'A small pie crust table with a scalloped edge holds a milk glass candy dish, a porcelain bell, and a framed photo of a stern couple in sepia tones.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a spoon rack',
          description:
            'A wooden display rack on the wall holds commemorative spoons from every state plus several foreign countries, each in its designated slot.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a built-in radiator cover',
          description:
            'An ornate radiator cover painted cream white provides a shelf for a row of African violets in ceramic pots, still somehow blooming in the indirect light.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'built-in lace curtain rods',
          description:
            'Brass curtain rods span the windows, holding layers of lace sheers that filter the light into a warm glow. Heavier drapes in dusty rose frame the lace.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a ceramic cat collection',
          description:
            'A shelf of ceramic cats in various poses occupies one wall: sleeping cats, stretching cats, cats with yarn, cats with butterflies. At least thirty pairs of painted eyes watch the room.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'a camelback sofa',
          capacity: 3,
          emptyMsg:
            'A camelback sofa in sage green brocade faces the window, its curved back protected by a hand-crocheted antimacassar.',
          occupiedMsg: '%s seated primly on the camelback sofa.',
        },
      ],
    },

    '%C3_z17': {
      name: 'Smith Tower - 17th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 17,
      exits: {
        north: { room: '%EL_z17', door: '%D_C3_z17' },
        west: '%C2_z17',
        east: '%C4_z17',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 17).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a hall tree',
          description:
            'A Victorian hall tree with a mirror, brass hooks, and a lift-lid bench seat dominates the foyer. Umbrellas and canes fill the stand, and a needlepoint cushion covers the bench.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a built-in coat closet',
          description:
            'A built-in coat closet with louvered doors exhales the scent of cedar and mothballs when opened. Plastic garment bags protect unseen treasures within.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a built-in mail slot',
          description:
            'An ornate brass mail slot is set into the door, polished despite years of disuse. A small basket beneath catches nothing but dust now.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a blessing plaque',
          description:
            'A wooden plaque by the door reads "Bless This House and All Who Enter" in Gothic script, surrounded by painted roses and gilded edges.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a doily-covered console',
          description:
            'A narrow console table draped in crocheted doilies holds a crystal bowl of butterscotch candies, a ceramic goose with a bonnet, and a stack of coupons from 1971.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the hall tree bench',
          capacity: 2,
          emptyMsg:
            'The hall tree bench offers a place to sit while removing galoshes.',
          occupiedMsg: '%s seated on the hall tree bench.',
        },
      ],
    },

    '%C4_z17': {
      name: 'Smith Tower - 17th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 17,
      exits: { west: '%C3_z17' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 17).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a canopy bed',
          description:
            'A twin canopy bed fills the alcove, its white frame draped with pink ruffled fabric. A handmade quilt in the double wedding ring pattern covers layers of crisp white sheets.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a chifferobe',
          description:
            'A dark walnut chifferobe combines drawers and a wardrobe, its doors revealing dress patterns from the 1960s and sweaters wrapped in tissue paper.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a built-in wall mirror',
          description:
            'A beveled wall mirror in a gilded frame is mounted permanently to the wall, a dried corsage and a holy card tucked into its frame.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a marble-topped nightstand',
          description:
            'A marble-topped nightstand holds a glass of dusty water, a rosary, and a wind-up alarm clock still ticking faintly, frozen at 6:00 AM.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a prayer kneeler',
          description:
            'A small prayer kneeler upholstered in worn red velvet sits in one corner, a cross mounted on the wall above it.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the canopy bed',
          capacity: 2,
          emptyMsg:
            'The canopy bed waits beneath its pink ruffles, smelling faintly of lavender sachets.',
          occupiedMsg: '%s resting beneath the canopy.',
        },
      ],
    },

    '%B4_z17': {
      name: 'Smith Tower - 17th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 17,
      exits: { north: '%B2_z17' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 17).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a spool bed',
          description:
            'A Jenny Lind spool bed in honey maple is dressed with a candlewick bedspread, the bed skirt ruffled to hide storage boxes beneath.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a built-in Murphy ironing board',
          description:
            'A Murphy ironing board folds out from a cabinet in the wall, complete with a built-in sleeve board and a holder for the ancient steam iron.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'built-in display shelves',
          description:
            'Built-in shelves display a collection of porcelain dolls with real hair and glass eyes, their period costumes protected by the glass doors.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a dressing table',
          description:
            'A kidney-shaped dressing table with a gathered fabric skirt holds cold cream jars, a bone comb, bobby pins in a crystal dish, and a photo of grandchildren.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a cedar chest',
          description:
            'A Lane cedar chest at the foot of the bed holds wedding linens, baby blankets, and the lingering scent of moth crystals.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the spool bed',
          capacity: 2,
          emptyMsg:
            'The spool bed waits beneath its candlewick spread, throw pillows embroidered with flowers arranged just so.',
          occupiedMsg: '%s nestled in the spool bed.',
        },
        {
          name: 'a boudoir chair',
          capacity: 1,
          emptyMsg:
            'A small boudoir chair in dusty pink velvet sits before the dressing table.',
          occupiedMsg: '%s perched on the boudoir chair.',
        },
      ],
    },
  },
};
