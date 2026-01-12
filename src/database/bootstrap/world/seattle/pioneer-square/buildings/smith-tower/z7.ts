// Smith Tower - 7th Floor Condos
// Victorian grandeur, faded elegance - ornate furnishings, velvet, crystal, moth-eaten splendor

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z7' },
    },

    // Rentable locks
    '%RL_A2_z7': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z7': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z7': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z7': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z7'],
    },
    '%D_B2_z7': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z7'],
    },
    '%D_C3_z7': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z7'],
    },

    // Elevator landing
    '%EL_z7': {
      name: 'Smith Tower - 7th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 7,
      exits: {
        north: { room: '%A2_z7', door: '%D_A2_z7' },
        east: { room: '%B2_z7', door: '%D_B2_z7' },
        south: { room: '%C3_z7', door: '%D_C3_z7' },
        west: '%C1_z7',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z7': {
      name: 'Smith Tower - 7th Floor - North Suite - Living Room',
      description:
        "A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone's life—books, decorative objects, a dead potted plant.",
      x: -3,
      y: 11,
      z: 7,
      exits: { east: '%A2_z7' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 7).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a marble-topped parlor table',
          description:
            'An ornate parlor table with carved mahogany legs and a grey-veined marble top. The marble is cracked but still elegant, a testament to Victorian craftsmanship.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'an antiquated kitchenette',
          description:
            "A kitchenette with dark oak cabinetry and brass hardware, clearly retrofitted into what was once a butler's pantry. The porcelain sink is stained with age.",
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a curio cabinet',
          description:
            'A tall glass-fronted curio cabinet displays dusty porcelain figurines, tarnished silver spoons, and a collection of ceramic thimbles.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'an ornate radiator cover',
          description:
            'A cast-iron radiator is concealed behind an elaborate brass grille with scrollwork patterns. Heat still seeps through its decorative openings.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a fainting couch',
          capacity: 2,
          emptyMsg:
            'A burgundy velvet fainting couch curves elegantly against the wall, its tufted upholstery moth-eaten in places.',
          occupiedMsg: '%s draped across the fainting couch.',
        },
      ],
    },

    '%A2_z7': {
      name: 'Smith Tower - 7th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 7,
      exits: {
        west: '%A1_z7',
        east: '%A3_z7',
        south: { room: '%EL_z7', door: '%D_A2_z7' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 7).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a four-poster bed',
          description:
            'A massive mahogany four-poster bed dominates the room, its canopy frame draped with tattered damask curtains. The mattress is horsehair, lumpy but surprisingly resilient.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a wardrobe armoire',
          description:
            'A towering oak armoire with beveled mirrors and carved acanthus details serves as the closet. Its doors creak dramatically when opened.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a marble-topped washstand',
          description:
            'An antique washstand with a marble top holds a chipped porcelain basin and pitcher. A tarnished brass towel bar is attached to the side.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a dressing screen',
          description:
            'A three-panel dressing screen with faded silk panels depicts pastoral scenes. The wooden frame is worm-eaten but standing.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the four-poster bed',
          capacity: 2,
          emptyMsg:
            'The canopied bed waits like a throne, its damask curtains pooling on the floor.',
          occupiedMsg: '%s ensconced in the four-poster bed.',
        },
        {
          name: 'a tufted vanity stool',
          capacity: 1,
          emptyMsg:
            'A small velvet stool with carved cabriole legs sits before a dark vanity mirror.',
          occupiedMsg: '%s perched on the vanity stool.',
        },
      ],
    },

    '%A3_z7': {
      name: 'Smith Tower - 7th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 7,
      exits: { west: '%A2_z7' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 7).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a cast-iron stove',
          description:
            'A retrofitted Victorian coal stove has been converted for gas, its ornate black iron body decorated with scrollwork. The flue pipe runs up through the brick.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a secretary desk',
          description:
            'A mahogany secretary desk with a drop-front writing surface and pigeonhole compartments. Yellowed letters and dried ink bottles remain inside.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a brass coal scuttle',
          description:
            'A decorative brass coal scuttle sits beside the stove, now holding dried flowers and forgotten keys.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a pier mirror',
          description:
            'A tall pier mirror in a gilded frame hangs between the windows, its glass foxed with age but still reflective.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a horsehair settee',
          capacity: 2,
          emptyMsg:
            'A narrow horsehair settee with carved rosewood trim waits primly against the wall.',
          occupiedMsg: '%s seated stiffly on the horsehair settee.',
        },
        {
          name: 'a balloon-back chair',
          capacity: 1,
          emptyMsg:
            'A delicate balloon-back chair with worn velvet upholstery sits at the desk.',
          occupiedMsg: '%s writing at the secretary desk.',
        },
      ],
    },

    '%B1_z7': {
      name: 'Smith Tower - 7th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 7,
      exits: { south: '%B2_z7' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 7).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'an ornate spiral stair',
          description:
            'A narrow cast-iron spiral staircase with fleur-de-lis balusters leads to the mezzanine. The treads are worn concave from a century of footsteps.',
          boltedDown: true,
        },
        {
          prototype: 'bed',
          name: 'a brass sleigh bed',
          description:
            'A small brass sleigh bed with an oxidized patina fills the mezzanine. The mattress is thin but the frame is gorgeous.',
          quality: 'standard',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a crystal chandelier',
          description:
            'A small crystal chandelier hangs from the exposed beams, its pendants clouded and dusty. A few are missing entirely.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a whatnot shelf',
          description:
            'A corner whatnot shelf displays a collection of dusty daguerreotypes, a broken pocket watch, and a taxidermied songbird under glass.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a Chesterfield sofa',
          capacity: 3,
          emptyMsg:
            'A cracked leather Chesterfield sofa with deep button tufting sits beneath the mezzanine, springs complaining audibly.',
          occupiedMsg: '%s sunk into the Chesterfield.',
        },
        {
          name: 'the brass sleigh bed',
          capacity: 1,
          emptyMsg: 'The brass bed gleams dully in the mezzanine above.',
          occupiedMsg: '%s resting in the sleigh bed.',
        },
      ],
    },

    '%C1_z7': {
      name: 'Smith Tower - 7th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 7,
      exits: { south: '%C2_z7', east: '%EL_z7' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 7).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: "a servant's cot",
          description:
            'A narrow iron cot with a thin straw mattress, the kind once used by household servants. A faded quilt provides the only softness.',
          quality: 'cheap',
        },
        {
          prototype: 'furniture',
          name: 'a brass hat stand',
          description:
            'A tall brass hat stand with multiple arms stands sentinel by the door, one arm still holding a moth-eaten bowler.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a corner washstand',
          description:
            'A small corner washstand with a porcelain bowl is built into the alcove. A cracked shaving mirror hangs above.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a prayer kneeler',
          description:
            'A worn velvet prayer kneeler with carved oak armrests is tucked against the wall, testament to the faith of a former occupant.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: "the servant's cot",
          capacity: 1,
          emptyMsg: 'The narrow cot awaits with monastic simplicity.',
          occupiedMsg: "%s resting on the servant's cot.",
        },
      ],
    },

    '%B2_z7': {
      name: 'Smith Tower - 7th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 7,
      exits: {
        north: '%B1_z7',
        east: '%B3_z7',
        west: { room: '%EL_z7', door: '%D_B2_z7' },
        south: '%B4_z7',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 7).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a parlor grand piano',
          description:
            'A small parlor grand piano with an elaborately carved rosewood case sits shrouded in dust. The ivory keys are yellowed, several missing entirely.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'an inlaid tea table',
          description:
            'A delicate tea table with mother-of-pearl inlay and spindly turned legs. A tarnished silver tea service sits upon it, still waiting for guests.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a fireplace mantel',
          description:
            'An ornate marble fireplace mantel frames a bricked-up hearth. Candelabras and a stopped ormolu clock adorn the mantelpiece.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a tall case clock',
          description:
            'A grandfather clock with a painted moon phase dial and carved finials stands in the corner. Its pendulum is frozen mid-swing.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a medallion-back sofa',
          capacity: 3,
          emptyMsg:
            'A curved medallion-back sofa upholstered in faded rose silk presides over the parlor.',
          occupiedMsg: '%s arranged elegantly on the medallion sofa.',
        },
        {
          name: 'the piano bench',
          capacity: 2,
          emptyMsg:
            'A tapestry-cushioned piano bench waits before the silent instrument.',
          occupiedMsg: '%s seated at the piano.',
        },
      ],
    },

    '%B3_z7': {
      name: 'Smith Tower - 7th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 7,
      exits: { west: '%B2_z7' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 7).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a barrister bookcase',
          description:
            'A walnut barrister bookcase with glass-fronted sections and brass hinges. Leather-bound volumes on law, medicine, and natural philosophy fill its shelves.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a partners desk',
          description:
            'A massive partners desk with green leather writing surfaces on both sides. The drawers are carved with grape clusters and acanthus leaves.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a globe stand',
          description:
            'An antique terrestrial globe on a mahogany tripod shows political boundaries that ceased to exist decades ago. The oceans have faded to brown.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a library ladder',
          description:
            'A brass library ladder on rails allows access to the upper shelves. The rails are slightly corroded but the ladder still rolls.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a tufted library chair',
          capacity: 1,
          emptyMsg:
            'A deep tufted leather library chair with brass studs awaits a reader.',
          occupiedMsg: '%s ensconced in the library chair.',
        },
        {
          name: 'the desk chair',
          capacity: 1,
          emptyMsg:
            'A swivel chair with carved armrests sits at the partners desk.',
          occupiedMsg: '%s working at the partners desk.',
        },
      ],
    },

    '%C2_z7': {
      name: 'Smith Tower - 7th Floor - South Suite - Living Room',
      description:
        'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 7,
      exits: { north: '%C1_z7', east: '%C3_z7' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 7).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a marble-topped console',
          description:
            'A serpentine console table with cabriole legs and a white marble top. The gilt has worn from the carved apron, revealing gesso beneath.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a tiled fireplace',
          description:
            'A small fireplace with blue Delft tiles depicting windmills and ships. The grate is cold, filled with decades of ash.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'velvet draperies',
          description:
            'Heavy velvet draperies in faded burgundy frame the windows, their fringe tattered and moth-eaten. Dust motes swirl in the light.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a canterbury',
          description:
            'A mahogany canterbury with turned spindles once held sheet music. Now it contains yellowed newspapers from 1969.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'a cameo-back settee',
          capacity: 2,
          emptyMsg:
            'A small cameo-back settee with needlepoint upholstery faces the fireplace.',
          occupiedMsg: '%s perched on the cameo-back settee.',
        },
      ],
    },

    '%C3_z7': {
      name: 'Smith Tower - 7th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 7,
      exits: {
        north: { room: '%EL_z7', door: '%D_C3_z7' },
        west: '%C2_z7',
        east: '%C4_z7',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 7).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a hall tree',
          description:
            'An ornate hall tree with a beveled mirror, brass hooks, and a marble-topped bench. Umbrellas and walking sticks fill the stand below.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a coat closet',
          description:
            'A small built-in closet with a carved oak door. Inside hang moth-eaten coats and a collapsed top hat.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'an etched glass transom',
          description:
            'Above the door, an etched glass transom depicts intertwined vines. The afternoon light casts leaf-shadows across the floor.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a card receiver',
          description:
            'A small silver tray on a marble pedestal once received calling cards. A few yellowed cards remain, names of people long dead.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the hall tree bench',
          capacity: 2,
          emptyMsg:
            'The velvet-cushioned bench of the hall tree awaits visitors.',
          occupiedMsg: '%s seated on the hall tree bench.',
        },
      ],
    },

    '%C4_z7': {
      name: 'Smith Tower - 7th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 7,
      exits: { west: '%C3_z7' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 7).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'an alcove daybed',
          description:
            'A built-in daybed fills the alcove, its heavy brocade curtains drawn back with tasseled cords. The featherbed is surprisingly well-preserved.',
          quality: 'nice',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a cheval mirror',
          description:
            'A full-length cheval mirror on a mahogany swivel frame. The glass is spotted with age, reflecting the room in fragments.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: "a gentleman's wardrobe",
          description:
            "A massive gentleman's wardrobe with drawers, shelves, and a mirror inside the door. Cedar-lined, it still faintly perfumes the air.",
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a bow-fronted nightstand',
          description:
            'A small bow-fronted nightstand with brass pulls. A porcelain chamber pot peeks from its lower shelf.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the alcove daybed',
          capacity: 2,
          emptyMsg: 'The curtained daybed awaits like a secret bower.',
          occupiedMsg: '%s nestled in the alcove daybed.',
        },
      ],
    },

    '%B4_z7': {
      name: 'Smith Tower - 7th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 7,
      exits: { north: '%B2_z7' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 7).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a half-tester bed',
          description:
            'A single half-tester bed with a carved headboard and partial canopy. The silk canopy is tattered, but the carved cherubs still smile down.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a bonheur-du-jour',
          description:
            "A petite lady's writing desk with brass gallery and multiple secret compartments. Its marquetry depicts birds among blossoms.",
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a corner cabinet',
          description:
            'A bow-fronted corner cabinet with glass doors displays dusty china figurines and a collection of snuff boxes.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a needlepoint firescreen',
          description:
            'A decorative firescreen on a tripod base, its needlepoint panel depicting a hunting scene. It stands before a long-cold grate.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a cabriole-leg nightstand',
          description:
            'A small nightstand with curved cabriole legs and brass sabots. A tarnished candlestick sits upon it.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the half-tester bed',
          capacity: 2,
          emptyMsg: 'The canopied bed waits beneath its carved cherubs.',
          occupiedMsg: '%s resting beneath the tattered silk canopy.',
        },
        {
          name: 'a slipper chair',
          capacity: 1,
          emptyMsg:
            'A low slipper chair with worn brocade upholstery sits in the corner.',
          occupiedMsg: '%s perched on the slipper chair.',
        },
      ],
    },
  },
};
