// Smith Tower - Condo Floor (z=22) - 1950s Retro Theme
// Chrome dinette sets, boomerang patterns, pastel appliances, atomic age aesthetics

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z22' },
    },

    // Rentable locks
    '%RL_A2_z22': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z22': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z22': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z22': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z22'],
    },
    '%D_B2_z22': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z22'],
    },
    '%D_C3_z22': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z22'],
    },

    // Elevator landing
    '%EL_z22': {
      name: 'Smith Tower - 22th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 22,
      exits: {
        north: { room: '%A2_z22', door: '%D_A2_z22' },
        east: { room: '%B2_z22', door: '%D_B2_z22' },
        south: { room: '%C3_z22', door: '%D_C3_z22' },
        west: '%C1_z22',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z22': {
      name: 'Smith Tower - 22th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -3,
      y: 11,
      z: 22,
      exits: { east: '%A2_z22' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 22).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a boomerang coffee table', description: 'A kidney-shaped coffee table with tapered peg legs and a laminate top in faded turquoise. Boomerang patterns are still visible under the dust.', boltedDown: false },
        { prototype: 'furniture', name: 'a pastel kitchenette', description: 'A built-in kitchenette in mint green with chrome trim. The O\'Keefe & Merritt stove sits cold, its clock frozen at 2:15.', boltedDown: true },
        { prototype: 'furniture', name: 'floating wall shelves', description: 'Atomic-age floating shelves in blonde wood display a collection of Fiestaware in assorted colors, all dusty but unbroken.', boltedDown: true },
        { prototype: 'furniture', name: 'a console TV cabinet', description: 'A massive Zenith console television in mahogany veneer dominates one corner. Its round screen is dark, the tubes long dead.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a sectional sofa',
          capacity: 4,
          emptyMsg: 'A turquoise Naugahyde sectional curves around the coffee table, its chrome legs still gleaming.',
          occupiedMsg: '%s lounging on the atomic-age sectional.',
        },
      ],
    },

    '%A2_z22': {
      name: 'Smith Tower - 22th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 22,
      exits: {
        west: '%A1_z22',
        east: '%A3_z22',
        south: { room: '%EL_z22', door: '%D_A2_z22' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 22).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a princess phone bed', description: 'A blonde wood bed frame with built-in headboard shelves and a princess phone nook. The pink rotary phone sits silent.', quality: 'nice' },
        { prototype: 'furniture', name: 'a louvered closet', description: 'Built-in louvered closet doors in painted white hide an empty rod and a few plastic hangers in pastel colors.', boltedDown: true },
        { prototype: 'table', name: 'a tripod nightstand', description: 'A small tripod nightstand in blonde wood holds a Sputnik lamp, its chrome arms reaching out like frozen fireworks.', boltedDown: false },
        { prototype: 'furniture', name: 'a vanity with round mirror', description: 'A kidney-shaped vanity with a round mirror on a swivel arm. Dried lipstick and a cracked compact remain on its surface.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the blonde wood bed',
          capacity: 2,
          emptyMsg: 'The atomic-age bed waits, its chenille bedspread slightly faded.',
          occupiedMsg: '%s resting in mid-century comfort.',
        },
        {
          name: 'a vanity stool',
          capacity: 1,
          emptyMsg: 'A tufted pink vanity stool sits before the kidney-shaped vanity.',
          occupiedMsg: '%s seated at the vanity.',
        },
      ],
    },

    '%A3_z22': {
      name: 'Smith Tower - 22th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 22,
      exits: { west: '%A2_z22' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 22).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'an aqua appliance kitchen', description: 'A built-in galley kitchen with aqua blue appliances and chrome handles. The Frigidaire hums silently, long dead. A wall-mounted can opener remains.', boltedDown: true },
        { prototype: 'table', name: 'a chrome dinette table', description: 'A chrome and Formica dinette table in red speckle pattern. Its surface is scratched but the chrome legs still shine.', boltedDown: false },
        { prototype: 'furniture', name: 'a hi-fi console', description: 'A mahogany hi-fi console with fold-out turntable and radio dial. A stack of 45s gathers dust beside it.', boltedDown: false },
        { prototype: 'bed', name: 'a daybed', description: 'A tubular steel daybed with bolster pillows serves as both couch and sleeping space. The plaid upholstery is faded but intact.', quality: 'standard' },
      ],
      sittables: [
        {
          name: 'the daybed',
          capacity: 2,
          emptyMsg: 'The tubular steel daybed invites a rest, bolster pillows propped at each end.',
          occupiedMsg: '%s stretched out on the daybed.',
        },
        {
          name: 'a chrome dinette chair',
          capacity: 1,
          emptyMsg: 'A chrome dinette chair with red vinyl seat sits at the table.',
          occupiedMsg: '%s seated at the dinette.',
        },
      ],
    },

    '%B1_z22': {
      name: 'Smith Tower - 22th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 22,
      exits: { south: '%B2_z22' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 22).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a ship\'s ladder', description: 'A steep ship\'s ladder in chrome and rubber treads is bolted to the mezzanine. Very space-age, very dangerous.', boltedDown: true },
        { prototype: 'bed', name: 'a platform bed', description: 'A low platform bed in the mezzanine with built-in task lighting. The atomic-pattern sheets are faded but intact.', quality: 'standard' },
        { prototype: 'furniture', name: 'an Eames-style lounge', description: 'A leather and plywood lounge chair in the Eames style sits beneath the mezzanine, its rosewood veneer cracked.', boltedDown: false },
        { prototype: 'table', name: 'a sunburst clock table', description: 'A small side table holds a broken sunburst wall clock laying flat, its gold rays tarnished.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Eames lounge',
          capacity: 1,
          emptyMsg: 'The Eames-style lounge chair reclines invitingly, ottoman nearby.',
          occupiedMsg: '%s lounging in mid-century modern comfort.',
        },
        {
          name: 'the platform bed',
          capacity: 2,
          emptyMsg: 'The mezzanine platform bed awaits above, accessible by ladder.',
          occupiedMsg: '%s resting on the platform bed.',
        },
      ],
    },

    '%C1_z22': {
      name: 'Smith Tower - 22th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 22,
      exits: { south: '%C2_z22', east: '%EL_z22' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 22).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a fold-out cot', description: 'A tubular aluminum fold-out cot with a striped canvas mattress. Pure 1950s summer camp aesthetic.', quality: 'cheap' },
        { prototype: 'furniture', name: 'plastic wall hooks', description: 'Bright yellow plastic hooks in atomic starburst shapes are mounted to the wall. Very optimistic, very dusty.', boltedDown: true },
        { prototype: 'furniture', name: 'a metal utility shelf', description: 'A small metal utility shelf in aqua enamel is bolted above the cot. A dead transistor radio sits there.', boltedDown: true },
        { prototype: 'table', name: 'a TV tray', description: 'A folding TV tray with a laminate top showing a faded rural scene. Still functional for eating or working.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the fold-out cot',
          capacity: 1,
          emptyMsg: 'The striped canvas cot waits, its aluminum frame slightly bent.',
          occupiedMsg: '%s stretched out on the fold-out cot.',
        },
      ],
    },

    '%B2_z22': {
      name: 'Smith Tower - 22th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 22,
      exits: {
        north: '%B1_z22',
        east: '%B3_z22',
        west: { room: '%EL_z22', door: '%D_B2_z22' },
        south: '%B4_z22',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 22).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a curved sectional sofa', description: 'A dramatic curved sectional in coral pink with tapered wooden legs. The kind of sofa that defined 1950s glamour, now faded but still elegant.', boltedDown: false },
        { prototype: 'table', name: 'a biomorphic coffee table', description: 'An amoeba-shaped coffee table with a glass top on sculptural wooden legs. Pure Noguchi-inspired design.', boltedDown: false },
        { prototype: 'furniture', name: 'a built-in bar', description: 'A built-in wet bar with mirrored backsplash and chrome accents. Empty martini glasses and a shaker await a party that ended decades ago.', boltedDown: true },
        { prototype: 'furniture', name: 'a louvered coat closet', description: 'A built-in closet with louvered doors in blonde wood. Inside, a few plastic hangers in assorted colors.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the curved sectional',
          capacity: 4,
          emptyMsg: 'The coral pink sectional curves invitingly around the coffee table.',
          occupiedMsg: '%s lounging on the curved sectional.',
        },
        {
          name: 'a bar stool',
          capacity: 1,
          emptyMsg: 'A chrome bar stool with red vinyl seat waits at the built-in bar.',
          occupiedMsg: '%s perched at the bar.',
        },
      ],
    },

    '%B3_z22': {
      name: 'Smith Tower - 22th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 22,
      exits: { west: '%B2_z22' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 22).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'steel case bookcases', description: 'Industrial steel case bookcases in olive drab line the walls. They hold Popular Mechanics magazines and a model rocket collection.', boltedDown: true },
        { prototype: 'table', name: 'a tanker desk', description: 'A massive steel tanker desk in battleship grey dominates the room. Its green blotter is faded, a Bakelite phone sits silent.', boltedDown: false },
        { prototype: 'chair', name: 'a swivel desk chair', description: 'A green vinyl swivel chair on chrome casters waits at the desk. The pneumatic lift still works, surprisingly.', boltedDown: false },
        { prototype: 'furniture', name: 'a cone floor lamp', description: 'A fiberglass cone floor lamp in orange stands in the corner. Its glow once seemed futuristic.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the swivel chair',
          capacity: 1,
          emptyMsg: 'The green vinyl swivel chair waits at the tanker desk.',
          occupiedMsg: '%s seated at the tanker desk.',
        },
        {
          name: 'an inflatable chair',
          capacity: 1,
          emptyMsg: 'A deflated inflatable chair in clear plastic slumps in the corner—very space age.',
          occupiedMsg: '%s sinking into the inflatable chair.',
        },
      ],
    },

    '%C2_z22': {
      name: 'Smith Tower - 22th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 22,
      exits: { north: '%C1_z22', east: '%C3_z22' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 22).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a kidney-shaped loveseat', description: 'A kidney-shaped loveseat in chartreuse upholstery faces the window. Its tapered legs end in brass ferrules.', boltedDown: false },
        { prototype: 'table', name: 'a tile-top table', description: 'A small table with a mosaic tile top in abstract boomerang patterns. Very California modern.', boltedDown: false },
        { prototype: 'furniture', name: 'a metal radiator cover', description: 'A perforated metal radiator cover in white enamel hides the heating element. Atomic starburst cutouts decorate it.', boltedDown: true },
        { prototype: 'furniture', name: 'fiberglass curtains', description: 'Fiberglass drapes in gold threads hang from a chrome rod, their atomic pattern still visible despite sun damage.', boltedDown: true },
        { prototype: 'furniture', name: 'a pole lamp', description: 'A tension pole lamp stretches floor to ceiling, its three cone shades in orange, yellow, and avocado.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the kidney loveseat',
          capacity: 2,
          emptyMsg: 'The chartreuse kidney-shaped loveseat catches the afternoon light.',
          occupiedMsg: '%s nestled into the kidney loveseat.',
        },
      ],
    },

    '%C3_z22': {
      name: 'Smith Tower - 22th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 22,
      exits: {
        north: { room: '%EL_z22', door: '%D_C3_z22' },
        west: '%C2_z22',
        east: '%C4_z22',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 22).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a vinyl bench', description: 'A long vinyl bench in cherry red with chrome legs sits against the wall. Pure diner-booth aesthetic.', boltedDown: false },
        { prototype: 'furniture', name: 'an accordion door closet', description: 'A built-in closet with a vinyl accordion door in woodgrain print. Inside, a few wire hangers and a shoe rack.', boltedDown: true },
        { prototype: 'furniture', name: 'a chrome mail slot', description: 'A streamlined chrome mail slot is set into the door, its art deco lines still gleaming.', boltedDown: true },
        { prototype: 'table', name: 'a telephone table', description: 'A small telephone table with built-in seat holds a dead rotary phone in powder blue.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the vinyl bench',
          capacity: 3,
          emptyMsg: 'The cherry red vinyl bench awaits, chrome legs gleaming.',
          occupiedMsg: '%s seated on the diner-style bench.',
        },
        {
          name: 'the telephone seat',
          capacity: 1,
          emptyMsg: 'The telephone table\'s built-in seat waits for a call that will never come.',
          occupiedMsg: '%s seated at the telephone table.',
        },
      ],
    },

    '%C4_z22': {
      name: 'Smith Tower - 22th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 22,
      exits: { west: '%C3_z22' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 22).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a Hollywood bed', description: 'A low platform bed with a padded headboard in quilted pink vinyl. Pure Hollywood glamour from the Eisenhower era.', quality: 'nice' },
        { prototype: 'furniture', name: 'a mirrored dressing screen', description: 'A three-panel dressing screen with mirrored backs and pink fabric fronts conceals the corner.', boltedDown: false },
        { prototype: 'furniture', name: 'a starburst wall mirror', description: 'A large sunburst mirror with gold rays radiates from the wall above the bed. Very dramatic, very 1950s.', boltedDown: true },
        { prototype: 'table', name: 'a Heywood-Wakefield nightstand', description: 'A blonde wood nightstand in the Heywood-Wakefield style holds a Tiffany-style lamp with a pink glass shade.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the Hollywood bed',
          capacity: 2,
          emptyMsg: 'The pink Hollywood bed awaits beneath the starburst mirror.',
          occupiedMsg: '%s lounging on the Hollywood bed.',
        },
      ],
    },

    '%B4_z22': {
      name: 'Smith Tower - 22th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 22,
      exits: { north: '%B2_z22' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 22).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a trundle bed', description: 'A streamlined trundle bed with blonde wood frame and a hidden pull-out mattress. Space-efficient 1950s design.', quality: 'standard' },
        { prototype: 'furniture', name: 'a built-in wardrobe', description: 'A built-in wardrobe with sliding doors in blonde wood and chrome handles. Inside, a vintage suit bag hangs alone.', boltedDown: true },
        { prototype: 'furniture', name: 'shadow box shelving', description: 'Built-in shadow box shelving displays a collection of ceramic poodles and a ballerina figurine in various poses.', boltedDown: true },
        { prototype: 'table', name: 'a secretary desk', description: 'A compact secretary desk with a fold-down writing surface reveals pigeonholes and a dried-up inkpad inside.', boltedDown: true },
        { prototype: 'furniture', name: 'a Lane cedar chest', description: 'A Lane cedar chest in honey finish sits at the foot of the bed, once holding hope, now holding nothing.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the trundle bed',
          capacity: 2,
          emptyMsg: 'The trundle bed waits, its extra mattress hidden below.',
          occupiedMsg: '%s resting on the trundle bed.',
        },
        {
          name: 'the cedar chest',
          capacity: 1,
          emptyMsg: 'The Lane cedar chest can serve as a seat.',
          occupiedMsg: '%s sitting on the cedar chest.',
        },
      ],
    },
  },
};
