// Smith Tower - Condo Floor (z=26) - Gothic Dark Romantic Theme
// Velvet drapes, wrought iron, candelabras, dark woods, Victorian mourning aesthetic

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z26' },
    },

    // Rentable locks
    '%RL_A2_z26': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z26': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z26': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z26': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z26'],
    },
    '%D_B2_z26': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z26'],
    },
    '%D_C3_z26': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z26'],
    },

    // Elevator landing
    '%EL_z26': {
      name: 'Smith Tower - 26th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -12,
      y: 10,
      z: 26,
      exits: {
        north: { room: '%A2_z26', door: '%D_A2_z26' },
        east: { room: '%B2_z26', door: '%D_B2_z26' },
        south: { room: '%C3_z26', door: '%D_C3_z26' },
        west: '%C1_z26',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z26': {
      name: 'Smith Tower - 26th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -13,
      y: 11,
      z: 26,
      exits: { east: '%A2_z26' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 26).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a claw-footed parlor table', description: 'A round parlor table of black-stained oak stands before the settee. Its carved claw feet grip glass orbs, and the surface holds a tarnished silver tea service frozen in time.', boltedDown: false },
        { prototype: 'furniture', name: 'a wrought iron candelabra', description: 'A tall wrought iron candelabra rises from the floor, its seven arms holding the melted stumps of black candles. Dried wax has pooled at its base like frozen tears.', boltedDown: false },
        { prototype: 'furniture', name: 'a Gothic kitchenette', description: 'The built-in kitchenette has been fitted with black iron hardware and dark wood cabinets. A collection of apothecary jars lines the counter, their contents long since dried to dust.', boltedDown: true },
        { prototype: 'furniture', name: 'velvet drapes', description: 'Heavy burgundy velvet drapes frame the windows, their fabric dusty but still luxurious. Gold tasseled tiebacks hold them open, allowing grey light to filter through.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a tufted velvet settee',
          capacity: 3,
          emptyMsg:
            'A settee upholstered in deep purple velvet sits against the wall, its button-tufted back rising high. The fabric is worn but maintains its somber elegance.',
          occupiedMsg: '%s arranged upon the velvet settee.',
        },
      ],
    },

    '%A2_z26': {
      name: 'Smith Tower - 26th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -12,
      y: 11,
      z: 26,
      exits: {
        west: '%A1_z26',
        east: '%A3_z26',
        south: { room: '%EL_z26', door: '%D_A2_z26' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 26).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a four-poster bed', description: 'A magnificent four-poster bed of carved ebony dominates the room. Dark velvet curtains hang from its canopy, and the bedding is black silk now grey with dust. Carved ravens perch atop each post.', quality: 'nice' },
        { prototype: 'furniture', name: 'a Gothic wardrobe', description: 'A massive wardrobe of dark oak stands against the wall, its doors carved with weeping willows. The mirrored interior reflects nothing but shadow.', boltedDown: true },
        { prototype: 'table', name: 'a marble-topped nightstand', description: 'A nightstand of black marble and wrought iron holds a skull-shaped candle holder, its single candle long burned to nothing.', boltedDown: false },
        { prototype: 'furniture', name: 'a mourning portrait', description: 'A gilt-framed portrait hangs on the wall, depicting a pale figure in Victorian mourning dress. The eyes seem to follow you across the room.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the four-poster bed',
          capacity: 2,
          emptyMsg:
            'The four-poster bed looms in the center of the room, its dark curtains half-drawn.',
          occupiedMsg: '%s ensconced within the four-poster bed.',
        },
      ],
    },

    '%A3_z26': {
      name: 'Smith Tower - 26th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -11,
      y: 11,
      z: 26,
      exits: { west: '%A2_z26' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 26).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a Victorian galley kitchen', description: 'The galley kitchen has been outfitted with black iron fixtures and dark wood cabinets. A collection of copper pots hangs from a wrought iron rack, tarnished to a dull green.', boltedDown: true },
        { prototype: 'table', name: 'an apothecary writing desk', description: 'A writing desk with dozens of small drawers sits under the window. Each drawer is labeled in faded copperplate script—herbs, inks, sealing wax. A raven-feather quill rests in a dried inkwell.', boltedDown: false },
        { prototype: 'furniture', name: 'taxidermy under glass', description: 'A glass dome covers a taxidermied raven perched on a branch of dead roses. Its glass eyes gleam in the dim light.', boltedDown: false },
        { prototype: 'furniture', name: 'a gargoyle bookend pair', description: 'Two stone gargoyles crouch at either end of a shelf, their wings folded, their expressions fierce. Between them lean antique books with cracked leather spines.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a fainting couch',
          capacity: 2,
          emptyMsg:
            'A fainting couch upholstered in black velvet curves elegantly in one corner, its carved mahogany frame ornate with acanthus leaves.',
          occupiedMsg: '%s draped upon the fainting couch.',
        },
        {
          name: 'a carved desk chair',
          capacity: 1,
          emptyMsg:
            'A high-backed chair of carved dark wood sits at the desk, its armrests shaped like coiled serpents.',
          occupiedMsg: '%s seated at the apothecary desk.',
        },
      ],
    },

    '%B1_z26': {
      name: 'Smith Tower - 26th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: -10,
      y: 11,
      z: 26,
      exits: { south: '%B2_z26' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 26).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a wrought iron spiral ladder', description: 'A black wrought iron spiral ladder winds up to the mezzanine, its rails shaped like thorny vines. Each step is worn smooth by countless ascents.', boltedDown: true },
        { prototype: 'bed', name: 'a canopied loft bed', description: 'The mezzanine holds a narrow bed draped in moth-eaten black lace. Tattered curtains of deep purple velvet hang from the low ceiling.', quality: 'standard' },
        { prototype: 'furniture', name: 'a Victorian settee', description: 'Beneath the mezzanine sits a horsehair settee of dark mahogany, its upholstery worn to a dull sheen. Carved roses adorn its curved back.', boltedDown: false },
        { prototype: 'table', name: 'a Gothic side table', description: 'A small table of black-lacquered wood holds a collection of antique mourning jewelry displayed on faded velvet—jet brooches, hair wreaths, a locket containing a faded photograph.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Victorian settee',
          capacity: 3,
          emptyMsg:
            'The Victorian settee waits beneath the mezzanine, its dark form elegant in the shadows.',
          occupiedMsg: '%s perched upon the Victorian settee.',
        },
        {
          name: 'the loft bed',
          capacity: 1,
          emptyMsg:
            'The canopied loft bed is visible above, accessible by the spiral ladder.',
          occupiedMsg: '%s hidden away in the loft bed.',
        },
      ],
    },

    '%C1_z26': {
      name: 'Smith Tower - 26th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -13,
      y: 10,
      z: 26,
      exits: { south: '%C2_z26', east: '%EL_z26' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 26).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a narrow iron bed', description: 'A narrow bed with a wrought iron frame is wedged into the corner. The headboard features Gothic arches, and the thin mattress is covered in a black wool blanket.', quality: 'cheap' },
        { prototype: 'furniture', name: 'iron wall hooks', description: 'Ornate iron hooks shaped like raven claws are mounted on the wall, designed for hanging cloaks and bags.', boltedDown: true },
        { prototype: 'furniture', name: 'a shrine shelf', description: 'A small shelf bolted above the bed holds a collection of melted candle stubs, a tarnished silver hand mirror, and a dried black rose in a crystal vase.', boltedDown: true },
        { prototype: 'furniture', name: 'a skull candle holder', description: 'A ceramic skull sits on a small ledge, a black candle melted into its cranium. Dried wax runs down like frozen thoughts.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the iron bed',
          capacity: 1,
          emptyMsg:
            'The narrow iron bed waits in its corner, Gothic and austere.',
          occupiedMsg: '%s curled up on the iron bed.',
        },
      ],
    },

    '%B2_z26': {
      name: 'Smith Tower - 26th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -11,
      y: 10,
      z: 26,
      exits: {
        north: '%B1_z26',
        east: '%B3_z26',
        west: { room: '%EL_z26', door: '%D_B2_z26' },
        south: '%B4_z26',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 26).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a Chesterfield sofa', description: 'A massive Chesterfield sofa dominates the room, its black leather cracked with age but still magnificent. The deep button-tufting creates shadowed wells, and the rolled arms are worn smooth.', boltedDown: false },
        { prototype: 'table', name: 'a coffin-shaped coffee table', description: 'A coffee table shaped like a miniature coffin sits before the sofa, its glass top revealing a collection of Victorian memento mori—photographs of the dead, locks of hair, wilted flowers.', boltedDown: false },
        { prototype: 'furniture', name: 'a Gothic entertainment alcove', description: 'A built-in alcove with pointed arch trim holds a dead television draped in black lace. Candelabras flank it on either side, their candles long since burned away.', boltedDown: true },
        { prototype: 'furniture', name: 'an armoire coat closet', description: 'A towering armoire serves as a coat closet, its doors carved with weeping angels. Inside hang moth-eaten velvet cloaks and a single top hat.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the Chesterfield sofa',
          capacity: 4,
          emptyMsg:
            'The Chesterfield sprawls across the room, a dark throne of cracked leather and faded grandeur.',
          occupiedMsg: '%s sunk into the Chesterfield\'s embrace.',
        },
      ],
    },

    '%B3_z26': {
      name: 'Smith Tower - 26th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: -10,
      y: 10,
      z: 26,
      exits: { west: '%B2_z26' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 26).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'Gothic built-in bookshelves', description: 'Floor-to-ceiling bookshelves with pointed Gothic arches are built into the walls, holding leather-bound volumes with gilt spines—Poe, Shelley, Stoker, and grimoires of uncertain origin.', boltedDown: true },
        { prototype: 'table', name: 'a secretary desk', description: 'An antique secretary desk of dark walnut sits in the window bay, its fold-down writing surface revealing dozens of tiny compartments. A human skull serves as a paperweight.', boltedDown: false },
        { prototype: 'chair', name: 'a throne-like reading chair', description: 'A massive reading chair with a high carved back sits angled toward the window. The burgundy velvet is worn, but the carved ravens on the armrests remain sharp.', boltedDown: false },
        { prototype: 'furniture', name: 'a cemetery urn', description: 'A decorative urn in the style of Victorian cemetery monuments stands in one corner, its brass surface green with verdigris. Whether it contains anything is best left unknown.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the throne chair',
          capacity: 1,
          emptyMsg:
            'The throne-like reading chair waits by the window, its carved ravens watching.',
          occupiedMsg: '%s enthroned in the Gothic reading chair.',
        },
        {
          name: 'the desk chair',
          capacity: 1,
          emptyMsg:
            'A carved wooden chair with a needlepoint seat depicting willow trees sits at the secretary desk.',
          occupiedMsg: '%s hunched over the secretary desk.',
        },
      ],
    },

    '%C2_z26': {
      name: 'Smith Tower - 26th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -13,
      y: 9,
      z: 26,
      exits: { north: '%C1_z26', east: '%C3_z26' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 26).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a Gothic loveseat', description: 'A loveseat of dark carved wood and deep purple velvet faces the window. The armrests end in carved bat wings, and the fabric is worn but still rich.', boltedDown: false },
        { prototype: 'table', name: 'a marble-topped side table', description: 'A small table with a black marble top and iron legs shaped like serpents holds a crystal decanter of something dark and a single wine glass filmed with dust.', boltedDown: false },
        { prototype: 'furniture', name: 'an ornate radiator cover', description: 'The steam radiator is hidden behind an iron screen with Gothic tracery. Heat still rises from it, the only warmth in this cold aesthetic.', boltedDown: true },
        { prototype: 'furniture', name: 'black velvet curtains', description: 'Floor-length curtains of black velvet frame the windows, held back by silver skull-shaped tiebacks. The fabric absorbs what little light enters.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the Gothic loveseat',
          capacity: 2,
          emptyMsg:
            'The Gothic loveseat faces the fading light, its bat-wing armrests spread wide.',
          occupiedMsg: '%s nestled into the Gothic loveseat.',
        },
      ],
    },

    '%C3_z26': {
      name: 'Smith Tower - 26th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -12,
      y: 9,
      z: 26,
      exits: {
        north: { room: '%EL_z26', door: '%D_C3_z26' },
        west: '%C2_z26',
        east: '%C4_z26',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 26).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a Gothic hall bench', description: 'A narrow hall bench of black oak sits against the wall, its back carved with intertwining thorns and roses. The seat cushion is tattered crimson velvet.', boltedDown: false },
        { prototype: 'furniture', name: 'a Gothic entry closet', description: 'A built-in closet with a pointed arch door holds velvet capes and wide-brimmed hats. A collection of walking sticks with silver handles leans in one corner.', boltedDown: true },
        { prototype: 'furniture', name: 'a Gothic arch mirror', description: 'A tall mirror in a pointed Gothic arch frame hangs by the door, its glass spotted with age. The black iron frame is worked with thorny vines.', boltedDown: true },
        { prototype: 'table', name: 'a memorial console table', description: 'A narrow console table holds a Victorian hair wreath in a shadow box and a collection of daguerreotypes in ornate frames depicting solemn figures long dead.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the hall bench',
          capacity: 2,
          emptyMsg:
            'The Gothic hall bench offers a place to compose oneself before entering or leaving.',
          occupiedMsg: '%s seated upon the thorned hall bench.',
        },
      ],
    },

    '%C4_z26': {
      name: 'Smith Tower - 26th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -11,
      y: 9,
      z: 26,
      exits: { west: '%C3_z26' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 26).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'an alcove bed with black drapes', description: 'The recessed alcove holds a bed swathed in heavy black curtains, creating a tomb-like sleeping chamber. The bedding is black silk, the pillows trimmed with black lace.', quality: 'nice' },
        { prototype: 'furniture', name: 'a mourning dress mannequin', description: 'A dressmaker\'s mannequin displays a Victorian mourning dress of black crepe and jet beads. The faceless form seems to watch the room.', boltedDown: false },
        { prototype: 'furniture', name: 'a vanity mirror', description: 'A full-length mirror in an ornate gilt frame leans against the wall, its surface tarnished. Dried roses and black ribbons are tucked into the frame.', boltedDown: true },
        { prototype: 'table', name: 'a Gothic nightstand', description: 'A nightstand of carved black wood holds a crystal ball on a stand of entwined serpents, a leather-bound journal, and a silver hand bell tarnished to black.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the alcove bed',
          capacity: 2,
          emptyMsg:
            'The bed waits within its curtained alcove, a private darkness within the room.',
          occupiedMsg: '%s hidden within the alcove bed\'s black curtains.',
        },
      ],
    },

    '%B4_z26': {
      name: 'Smith Tower - 26th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: -10,
      y: 9,
      z: 26,
      exits: { north: '%B2_z26' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 26).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a fold-down Gothic bed', description: 'A Murphy bed folds down from a cabinet carved with mourning angels. When deployed, it reveals a thin mattress covered in black damask.', quality: 'standard' },
        { prototype: 'furniture', name: 'a Gothic Murphy cabinet', description: 'The tall cabinet that conceals the bed is carved with weeping willows and cemetery urns. Candle sconces flank it on either side.', boltedDown: true },
        { prototype: 'furniture', name: 'Gothic built-in shelves', description: 'Shelves with pointed arch trim hold antique books, bottled specimens of uncertain provenance, and a collection of small skulls—animal, one hopes.', boltedDown: true },
        { prototype: 'table', name: 'a fold-down seance table', description: 'A small table folds down from the wall, its surface painted with a faded ouija board. Spirit letters barely visible beneath years of dust.', boltedDown: true },
        { prototype: 'furniture', name: 'a velvet jewelry cabinet', description: 'A narrow cabinet holds a collection of Victorian mourning jewelry—jet brooches, hair wreaths, lockets containing photographs of the dead.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Gothic Murphy bed',
          capacity: 2,
          emptyMsg:
            'The Gothic Murphy bed is folded down, its mourning angels watching over the sleeper\'s place.',
          occupiedMsg: '%s resting beneath the gaze of mourning angels.',
        },
      ],
    },
  },
};
