// Smith Tower - Condo Floor (z=25) - French Provincial Theme
// Toile patterns, cabriole legs, armoires, pastoral scenes, whitewashed furniture

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z25' },
    },

    // Rentable locks
    '%RL_A2_z25': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z25': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z25': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z25': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z25'],
    },
    '%D_B2_z25': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z25'],
    },
    '%D_C3_z25': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z25'],
    },

    // Elevator landing
    '%EL_z25': {
      name: 'Smith Tower - 25th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -12,
      y: 10,
      z: 25,
      exits: {
        north: { room: '%A2_z25', door: '%D_A2_z25' },
        east: { room: '%B2_z25', door: '%D_B2_z25' },
        south: { room: '%C3_z25', door: '%D_C3_z25' },
        west: '%C1_z25',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z25': {
      name: 'Smith Tower - 25th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -13,
      y: 11,
      z: 25,
      exits: { east: '%A2_z25' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a marble-top console table', description: 'A delicate console table with cabriole legs supports a slab of cream-veined marble. The wood is whitewashed and distressed, showing hints of pale blue paint beneath.', boltedDown: false },
        { prototype: 'furniture', name: 'a provincial kitchenette', description: 'A built-in kitchenette features whitewashed cabinets with carved shell motifs. The ceramic sink is dry, copper fixtures turned green with age.', boltedDown: true },
        { prototype: 'furniture', name: 'a carved wall shelf', description: 'An ornate wall shelf with scrollwork brackets holds a ceramic pitcher, a faded toile tea tin, and a dried lavender bouquet in a cracked vase.', boltedDown: true },
        { prototype: 'furniture', name: 'a gilt-framed mirror', description: 'An oval mirror in a tarnished gilt frame hangs above the console, its glass clouded at the edges with age spots.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a bergere armchair',
          capacity: 1,
          emptyMsg:
            'A bergere armchair with faded toile upholstery depicting pastoral scenes sits angled toward the window.',
          occupiedMsg: '%s nestled in the bergere.',
        },
        {
          name: 'a cane-back settee',
          capacity: 2,
          emptyMsg:
            'A delicate settee with a caned back and cream cushion sits against the wall, its cabriole legs ending in carved scrolls.',
          occupiedMsg: '%s perched on the settee.',
        },
      ],
    },

    '%A2_z25': {
      name: 'Smith Tower - 25th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -12,
      y: 11,
      z: 25,
      exits: {
        west: '%A1_z25',
        east: '%A3_z25',
        south: { room: '%EL_z25', door: '%D_A2_z25' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a French provincial bed', description: 'A queen bed with a curved headboard and footboard in whitewashed wood. Carved wheat sheaves and ribbons adorn the panels, the finish worn to show warm oak beneath.', quality: 'nice' },
        { prototype: 'furniture', name: 'a mirrored armoire', description: 'A tall armoire with a beveled mirror door stands against the wall. The whitewashed frame is carved with delicate acanthus leaves, the interior cedar-lined and empty.', boltedDown: true },
        { prototype: 'table', name: 'a marble-top nightstand', description: 'A petite nightstand with a single drawer and marble top sits beside the bed. A porcelain candlestick holder with dried wax drippings rests atop it.', boltedDown: false },
        { prototype: 'furniture', name: 'a ceramic washbasin set', description: 'A decorative pitcher and basin in blue and white provincial pottery sit on a wire stand, purely ornamental now.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the provincial bed',
          capacity: 2,
          emptyMsg:
            'The bed waits beneath faded toile curtains, coverlet smoothed flat.',
          occupiedMsg: '%s resting on the provincial bed.',
        },
        {
          name: 'a vanity stool',
          capacity: 1,
          emptyMsg:
            'A small vanity stool with curved legs and a needlepoint cushion depicting roses sits before a dusty mirror.',
          occupiedMsg: '%s seated at the vanity.',
        },
      ],
    },

    '%A3_z25': {
      name: 'Smith Tower - 25th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -11,
      y: 11,
      z: 25,
      exits: { west: '%A2_z25' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a provincial galley kitchen', description: 'Whitewashed cabinets with iron hardware line the narrow kitchen. A ceramic farmhouse sink is set into a butcher-block counter, the wood scrubbed pale from years of use.', boltedDown: true },
        { prototype: 'table', name: 'a writing desk', description: 'A ladies\' writing desk with slender cabriole legs and a tooled leather top sits under the window. Small drawers with brass pulls line the front.', boltedDown: false },
        { prototype: 'furniture', name: 'a provincial daybed', description: 'A daybed with scrolled ends and carved finials serves as both seating and sleeping. The mattress is covered in faded blue toile depicting shepherdesses and lambs.', boltedDown: false },
        { prototype: 'furniture', name: 'a floral tapestry', description: 'A small tapestry depicting a basket of provincial flowers hangs on the exposed brick, its colors muted by decades of dust.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the daybed',
          capacity: 2,
          emptyMsg:
            'The daybed offers a place for afternoon repose, bolster pillows at each end.',
          occupiedMsg: '%s reclining on the daybed.',
        },
        {
          name: 'a rush-seat chair',
          capacity: 1,
          emptyMsg:
            'A ladder-back chair with a woven rush seat sits at the writing desk.',
          occupiedMsg: '%s seated at the desk.',
        },
      ],
    },

    '%B1_z25': {
      name: 'Smith Tower - 25th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: -10,
      y: 11,
      z: 25,
      exits: { south: '%B2_z25' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a carved loft ladder', description: 'A sturdy wooden ladder with turned spindles is bolted to the mezzanine edge. The wood is painted cream with blue trim, worn at the handholds.', boltedDown: true },
        { prototype: 'bed', name: 'a provincial loft bed', description: 'A narrow bed with a carved headboard fills the mezzanine. A faded toile coverlet in rose and cream drapes over the thin mattress.', quality: 'standard' },
        { prototype: 'furniture', name: 'a camelback sofa', description: 'A camelback sofa with rolled arms sits beneath the mezzanine, upholstered in cream damask now yellowed with age. The cabriole legs end in carved pad feet.', boltedDown: false },
        { prototype: 'table', name: 'an oval side table', description: 'A small oval table with a scalloped edge and cabriole legs holds a provincial pottery vase, its painted flowers faded to soft pastels.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the camelback sofa',
          capacity: 3,
          emptyMsg:
            'The camelback sofa waits beneath the mezzanine, its damask upholstery still holding traces of elegance.',
          occupiedMsg: '%s settled into the sofa.',
        },
        {
          name: 'the loft bed',
          capacity: 1,
          emptyMsg:
            'The loft bed is visible above, toile coverlet neatly arranged.',
          occupiedMsg: '%s up in the loft bed.',
        },
      ],
    },

    '%C1_z25': {
      name: 'Smith Tower - 25th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -13,
      y: 10,
      z: 25,
      exits: { south: '%C2_z25', east: '%EL_z25' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a provincial cot', description: 'A narrow wooden cot with turned posts and a thin mattress is wedged into the corner. A faded quilt in provincial blue and yellow covers it.', quality: 'cheap' },
        { prototype: 'furniture', name: 'carved wall pegs', description: 'A row of hand-carved wooden pegs is mounted on the wall, shaped like acorns. One holds a dusty straw hat.', boltedDown: true },
        { prototype: 'furniture', name: 'a corner shelf', description: 'A small triangular shelf is bolted into the corner, holding a ceramic candlestick and a tiny provincial clock that stopped long ago.', boltedDown: true },
        { prototype: 'furniture', name: 'a provincial footstool', description: 'A small footstool with cabriole legs and needlepoint upholstery depicting a rooster sits beside the cot.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the provincial cot',
          capacity: 1,
          emptyMsg:
            'The narrow cot waits beneath its faded quilt, simple but inviting.',
          occupiedMsg: '%s resting on the cot.',
        },
      ],
    },

    '%B2_z25': {
      name: 'Smith Tower - 25th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -11,
      y: 10,
      z: 25,
      exits: {
        north: '%B1_z25',
        east: '%B3_z25',
        west: { room: '%EL_z25', door: '%D_B2_z25' },
        south: '%B4_z25',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a Louis XV sofa', description: 'A large sofa with a serpentine back and carved floral cresting dominates the room. The toile upholstery depicts romantic pastoral scenes in faded blue on cream.', boltedDown: false },
        { prototype: 'table', name: 'a provincial coffee table', description: 'A low table with cabriole legs and a shaped top in whitewashed oak sits before the sofa. A porcelain cachepot with dried flowers rests at its center.', boltedDown: false },
        { prototype: 'furniture', name: 'a provincial display cabinet', description: 'A built-in display cabinet with chicken-wire doors holds provincial pottery, faience plates, and a collection of ceramic roosters.', boltedDown: true },
        { prototype: 'furniture', name: 'a provincial coat closet', description: 'A small closet is built into the wall, its door painted with a faded floral motif. Wire hangers chime softly inside.', boltedDown: true },
        { prototype: 'furniture', name: 'an ornate gilt mirror', description: 'A large mirror in an elaborate gilt frame carved with roses and ribbons hangs above the sofa, its glass silvered at the edges.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the Louis XV sofa',
          capacity: 3,
          emptyMsg:
            'The serpentine sofa sprawls elegantly across the room, inviting lengthy conversations.',
          occupiedMsg: '%s ensconced on the Louis XV sofa.',
        },
        {
          name: 'a fauteuil armchair',
          capacity: 1,
          emptyMsg:
            'A fauteuil with open arms and a carved frame sits at an angle, its toile seat depicting shepherds at leisure.',
          occupiedMsg: '%s seated in the fauteuil.',
        },
      ],
    },

    '%B3_z25': {
      name: 'Smith Tower - 25th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: -10,
      y: 10,
      z: 25,
      exits: { west: '%B2_z25' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'provincial built-in shelves', description: 'Floor-to-ceiling shelving with carved molding is built into the walls. Leather-bound books with gilt spines share space with faience vases and a ceramic quail figurine.', boltedDown: true },
        { prototype: 'table', name: 'a bureau plat', description: 'A bureau plat with cabriole legs and ormolu mounts sits in the window bay. The leather writing surface is tooled with gold, now faded and cracked.', boltedDown: false },
        { prototype: 'chair', name: 'a caned bergere', description: 'A bergere with a caned back and sides sits angled toward the window. The loose cushion is covered in faded gold damask.', boltedDown: false },
        { prototype: 'furniture', name: 'a provincial floor lamp', description: 'A tall candlestand lamp with a carved wooden base and pleated fabric shade stands behind the chair. The bulb is dead.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the caned bergere',
          capacity: 1,
          emptyMsg:
            'The bergere waits by the window, caned back allowing light to filter through.',
          occupiedMsg: '%s relaxing in the bergere.',
        },
        {
          name: 'a desk chair',
          capacity: 1,
          emptyMsg:
            'A provincial desk chair with a rush seat and carved back is pushed under the bureau plat.',
          occupiedMsg: '%s seated at the bureau.',
        },
      ],
    },

    '%C2_z25': {
      name: 'Smith Tower - 25th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -13,
      y: 9,
      z: 25,
      exits: { north: '%C1_z25', east: '%C3_z25' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a provincial loveseat', description: 'A compact loveseat with carved fruitwood frame faces the window. The upholstery is toile de Jouy in faded rose, depicting a romantic garden scene.', boltedDown: false },
        { prototype: 'table', name: 'a bouillotte table', description: 'A small round table with a brass gallery rail and marble top holds a provincial oil lamp, its glass chimney dusty but intact.', boltedDown: false },
        { prototype: 'furniture', name: 'a cast-iron radiator', description: 'An ornate cast-iron radiator is built into the wall beneath the window, its curves echoing provincial scrollwork. It still radiates faint warmth.', boltedDown: true },
        { prototype: 'furniture', name: 'toile curtains', description: 'Sun-bleached toile curtains hang from carved wooden rods. The pastoral scenes have faded to ghostly outlines on cream fabric.', boltedDown: true },
        { prototype: 'furniture', name: 'a faience jardiniere', description: 'A large faience planter with painted provincial flowers holds the desiccated remains of what might have been a fern.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the provincial loveseat',
          capacity: 2,
          emptyMsg:
            'The loveseat faces the fading afternoon light, its toile upholstery telling silent pastoral stories.',
          occupiedMsg: '%s curled up on the loveseat.',
        },
      ],
    },

    '%C3_z25': {
      name: 'Smith Tower - 25th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -12,
      y: 9,
      z: 25,
      exits: {
        north: { room: '%EL_z25', door: '%D_C3_z25' },
        west: '%C2_z25',
        east: '%C4_z25',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a provincial settee', description: 'A small settee with a carved floral crest and cabriole legs sits against the wall. The toile upholstery depicts lavender fields in blue and cream.', boltedDown: false },
        { prototype: 'furniture', name: 'a provincial entry cabinet', description: 'A narrow cabinet with carved panels is built into the wall beside the door. Its interior is cedar-lined, still faintly fragrant.', boltedDown: true },
        { prototype: 'furniture', name: 'an antique mail slot', description: 'A brass mail slot with a decorative fleur-de-lis plate is set into the door, tarnished to a warm bronze.', boltedDown: true },
        { prototype: 'table', name: 'a demilune console', description: 'A half-moon console table with cabriole legs holds a faience bowl for keys and a small provincial clock that no longer ticks.', boltedDown: false },
        { prototype: 'furniture', name: 'a trumeau mirror', description: 'A trumeau mirror hangs above the console, its upper panel painted with a faded pastoral scene of peasants at harvest.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the provincial settee',
          capacity: 2,
          emptyMsg:
            'The settee offers a place to sit while removing shoes, its lavender-field toile a faded reminder of Provence.',
          occupiedMsg: '%s resting on the settee.',
        },
      ],
    },

    '%C4_z25': {
      name: 'Smith Tower - 25th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -11,
      y: 9,
      z: 25,
      exits: { west: '%C3_z25' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'an alcove lit en bateau', description: 'A boat-shaped bed with curved ends fills the recessed alcove. The whitewashed frame is carved with rope motifs, and faded toile curtains half-hide it from view.', quality: 'nice' },
        { prototype: 'furniture', name: 'a provincial wardrobe', description: 'A tall wardrobe with carved cornices and long iron hinges stands against the wall. The doors are painted with faded floral garlands.', boltedDown: false },
        { prototype: 'furniture', name: 'a cheval mirror', description: 'A full-length mirror on a carved stand is positioned near the window. The wood is whitewashed, the glass spotted with age.', boltedDown: false },
        { prototype: 'table', name: 'a provincial nightstand', description: 'A small nightstand with a shaped marble top and cabriole legs holds a ceramic candlestick and a water-stained book of poetry.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the lit en bateau',
          capacity: 2,
          emptyMsg:
            'The boat bed waits in its alcove, toile curtains drawn aside to reveal rumpled linens.',
          occupiedMsg: '%s ensconced in the alcove bed.',
        },
        {
          name: 'a prie-dieu',
          capacity: 1,
          emptyMsg:
            'A prie-dieu prayer bench with a needlepoint kneeler depicting the Virgin sits in the corner, its armrest worn smooth.',
          occupiedMsg: '%s kneeling at the prie-dieu.',
        },
      ],
    },

    '%B4_z25': {
      name: 'Smith Tower - 25th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: -10,
      y: 9,
      z: 25,
      exits: { north: '%B2_z25' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a lit clos bed', description: 'A box bed in the Breton style is built into a wall alcove, its carved panels painted with faded blue and white provincial motifs. Curtains can be drawn for privacy.', quality: 'standard' },
        { prototype: 'furniture', name: 'a lit clos cabinet', description: 'The box bed is set into carved woodwork with small cupboards below for storage. The painted finish shows wheat sheaves and birds.', boltedDown: true },
        { prototype: 'furniture', name: 'provincial wall shelving', description: 'Carved shelving with scalloped edges is built into the walls around the window, holding faience plates, a ceramic hen, and dusty books.', boltedDown: true },
        { prototype: 'table', name: 'a drop-leaf table', description: 'A small drop-leaf table with cabriole legs is hinged to the wall. When raised, it serves as a desk; when lowered, it disappears into the provincial paneling.', boltedDown: true },
        { prototype: 'furniture', name: 'a provincial commode', description: 'A serpentine-front commode with painted floral panels is wedged into the corner. Its drawers are fitted with brass teardrop pulls.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the lit clos',
          capacity: 2,
          emptyMsg:
            'The box bed waits within its carved alcove, curtains pushed aside.',
          occupiedMsg: '%s tucked into the lit clos.',
        },
        {
          name: 'a provincial stool',
          capacity: 1,
          emptyMsg:
            'A small stool with cabriole legs and a rush seat can be pulled up to the drop-leaf table.',
          occupiedMsg: '%s perched on the stool.',
        },
      ],
    },
  },
};
