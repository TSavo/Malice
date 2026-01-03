// Smith Tower - Condo Floor (z=14)
// Nautical/maritime theme - ship captain's quarters, brass fittings, rope, porthole mirrors

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z14' },
    },

    // Rentable locks
    '%RL_A2_z14': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z14': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z14': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z14': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z14'],
    },
    '%D_B2_z14': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z14'],
    },
    '%D_C3_z14': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z14'],
    },

    // Elevator landing
    '%EL_z14': {
      name: 'Smith Tower - 14th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -12,
      y: 10,
      z: 14,
      exits: {
        north: { room: '%A2_z14', door: '%D_A2_z14' },
        east: { room: '%B2_z14', door: '%D_B2_z14' },
        south: { room: '%C3_z14', door: '%D_C3_z14' },
        west: '%C1_z14',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z14': {
      name: 'Smith Tower - 14th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -13,
      y: 11,
      z: 14,
      exits: { east: '%A2_z14' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 14).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a sea chest coffee table', description: 'An old sea chest serves as a coffee table, its brass corners dented and tar-stained rope handles frayed. Faded labels from distant ports still cling to its sides.', boltedDown: false },
        { prototype: 'furniture', name: 'a galley kitchenette', description: 'A compact kitchenette is fitted into one wall like a ship\'s galley, with brass hooks, a deep porcelain sink, and fiddle rails to keep items from sliding.', boltedDown: true },
        { prototype: 'furniture', name: 'a navigation shelf', description: 'Built-in shelving holds rolled nautical charts, a dusty sextant, tide tables, and volumes on celestial navigation. A brass ship\'s clock hangs silent above.', boltedDown: true },
        { prototype: 'furniture', name: 'a porthole mirror', description: 'A large brass porthole frame has been converted into a mirror, its glass fogged with age. The brass has gone green in places.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a captain\'s settee',
          capacity: 3,
          emptyMsg: 'A curved settee in navy canvas is built against the wall, its cushions firm and nautically striped.',
          occupiedMsg: '%s seated on the captain\'s settee.',
        },
      ],
    },

    '%A2_z14': {
      name: 'Smith Tower - 14th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -12,
      y: 11,
      z: 14,
      exits: {
        west: '%A1_z14',
        east: '%A3_z14',
        south: { room: '%EL_z14', door: '%D_A2_z14' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 14).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a captain\'s berth', description: 'A substantial bed with rope-wrapped bedposts and a carved headboard depicting sailing ships. The wool blankets are navy blue with anchor patterns.', quality: 'nice' },
        { prototype: 'furniture', name: 'a locker closet', description: 'Built-in ship\'s lockers line the wall, their varnished teak doors fitted with brass latches. Inside, moth-eaten peacoats hang beside faded uniforms.', boltedDown: true },
        { prototype: 'table', name: 'a brass ship\'s lamp table', description: 'A small table bolted to the floor holds a brass gimbal lamp and a leather-bound ship\'s log, its pages yellowed.', boltedDown: true },
        { prototype: 'furniture', name: 'a framed maritime chart', description: 'A framed nautical chart of the Puget Sound hangs on the wall, its depths marked in fathoms and its coastlines now inaccurate.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the captain\'s berth',
          capacity: 2,
          emptyMsg: 'The captain\'s berth awaits, its navy blankets neatly tucked.',
          occupiedMsg: '%s resting in the captain\'s berth.',
        },
      ],
    },

    '%A3_z14': {
      name: 'Smith Tower - 14th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -11,
      y: 11,
      z: 14,
      exits: { west: '%A2_z14' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 14).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a ship\'s galley kitchen', description: 'A narrow galley is fitted out like a ship\'s kitchen, with brass rails, a gimbaled stovetop, and canvas curtains covering the cabinets.', boltedDown: true },
        { prototype: 'table', name: 'a chart table', description: 'A slanted chart table sits under the window, its surface scored with compass points and covered in faded maritime maps.', boltedDown: false },
        { prototype: 'furniture', name: 'a hammock frame', description: 'A hammock is slung between two structural posts, its canvas stained with age but still sturdy. Perfect for swaying in imaginary seas.', boltedDown: true },
        { prototype: 'furniture', name: 'a brass ship\'s barometer', description: 'A large brass barometer and thermometer set hangs on the wall, its needles frozen at readings from decades past.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the hammock',
          capacity: 1,
          emptyMsg: 'The canvas hammock sways slightly, waiting for an occupant.',
          occupiedMsg: '%s swaying gently in the hammock.',
        },
        {
          name: 'a captain\'s chair',
          capacity: 1,
          emptyMsg: 'A wooden captain\'s chair with arms sits at the chart table.',
          occupiedMsg: '%s seated at the chart table.',
        },
      ],
    },

    '%B1_z14': {
      name: 'Smith Tower - 14th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: -10,
      y: 11,
      z: 14,
      exits: { south: '%B2_z14' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 14).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a ship\'s companionway', description: 'A steep ship\'s ladder with rope handrails leads to the upper berth, its brass fittings polished smooth from countless hands.', boltedDown: true },
        { prototype: 'bed', name: 'an upper berth', description: 'The elevated sleeping area is fitted out like a ship\'s upper berth, with canvas privacy curtains and a narrow mattress wrapped in nautical striped sheets.', quality: 'standard' },
        { prototype: 'furniture', name: 'a bench locker', description: 'A built-in bench with rope handles conceals storage beneath. The seat is covered in worn navy canvas.', boltedDown: true },
        { prototype: 'table', name: 'a rope-wrapped chest', description: 'A small chest wrapped in decorative rope work serves as a side table, holding a brass compass and a collection of sea glass.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the bench locker',
          capacity: 3,
          emptyMsg: 'The navy canvas bench offers firm seating with hidden storage below.',
          occupiedMsg: '%s seated on the bench locker.',
        },
        {
          name: 'the upper berth',
          capacity: 1,
          emptyMsg: 'The ship\'s berth is visible above, accessible by the companionway.',
          occupiedMsg: '%s resting in the upper berth.',
        },
      ],
    },

    '%C1_z14': {
      name: 'Smith Tower - 14th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -13,
      y: 10,
      z: 14,
      exits: { south: '%C2_z14', east: '%EL_z14' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 14).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a sailor\'s bunk', description: 'A narrow ship\'s bunk is built into the wall, barely wide enough for one person. Canvas straps can be pulled across to prevent rolling out in rough seas.', quality: 'cheap' },
        { prototype: 'furniture', name: 'belaying pin hooks', description: 'Wooden belaying pins mounted on a rack serve as coat hooks, their rope still wrapped around some of them.', boltedDown: true },
        { prototype: 'furniture', name: 'a rope shelf', description: 'A narrow shelf suspended by knotted rope holds a brass oil lamp and a tin mug with a faded maritime insignia.', boltedDown: true },
        { prototype: 'furniture', name: 'a small porthole', description: 'A tiny porthole-style window lets in limited light, its brass frame green with verdigris.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the sailor\'s bunk',
          capacity: 1,
          emptyMsg: 'The narrow bunk waits, its canvas safety straps loose.',
          occupiedMsg: '%s squeezed into the sailor\'s bunk.',
        },
      ],
    },

    '%B2_z14': {
      name: 'Smith Tower - 14th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -11,
      y: 10,
      z: 14,
      exits: {
        north: '%B1_z14',
        east: '%B3_z14',
        west: { room: '%EL_z14', door: '%D_B2_z14' },
        south: '%B4_z14',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 14).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a curved stern bench', description: 'A curved built-in bench follows the contour of the wall like a ship\'s stern, upholstered in salt-stained canvas with rope trim.', boltedDown: true },
        { prototype: 'table', name: 'a helm wheel table', description: 'An old ship\'s wheel has been converted into a coffee table with a glass top, its spokes worn smooth by generations of hands.', boltedDown: false },
        { prototype: 'furniture', name: 'a maritime display case', description: 'A built-in display case with brass-framed doors holds model ships, nautical instruments, and faded photographs of vessels.', boltedDown: true },
        { prototype: 'furniture', name: 'a bosun\'s locker', description: 'A compact coat closet is fitted with brass hooks and rope handles, containing moldering oilskins and a moth-eaten captain\'s cap.', boltedDown: true },
        { prototype: 'furniture', name: 'a ship\'s bell', description: 'A brass ship\'s bell hangs by the door, its clapper tied silent. The name "SS SEATTLE MIST" is engraved around its rim.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the stern bench',
          capacity: 5,
          emptyMsg: 'The curved stern bench follows the wall like the aft of a great ship.',
          occupiedMsg: '%s seated on the stern bench.',
        },
      ],
    },

    '%B3_z14': {
      name: 'Smith Tower - 14th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: -10,
      y: 10,
      z: 14,
      exits: { west: '%B2_z14' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 14).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'maritime bookshelves', description: 'Built-in bookshelves with brass fiddle rails hold volumes on navigation, maritime law, and adventure stories. A bottle ship sits on one shelf.', boltedDown: true },
        { prototype: 'table', name: 'a navigator\'s desk', description: 'A slanted desk with brass corners and a green leather top is fitted for chart work. Parallel rulers and dividers still rest in their proper places.', boltedDown: false },
        { prototype: 'furniture', name: 'a ship\'s telescope', description: 'A brass telescope on a wooden tripod stands by the window, its lenses clouded but still functional. It points out toward where the harbor used to be.', boltedDown: false },
        { prototype: 'furniture', name: 'a rope-hung oil lamp', description: 'A brass oil lamp hangs from the ceiling on rope and pulleys, its glass chimney blackened with old soot.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a leather captain\'s chair',
          capacity: 1,
          emptyMsg: 'A revolving captain\'s chair in cracked brown leather sits at the navigator\'s desk.',
          occupiedMsg: '%s seated at the navigator\'s desk.',
        },
        {
          name: 'a stern window bench',
          capacity: 2,
          emptyMsg: 'A narrow bench with cushions is built into the window bay.',
          occupiedMsg: '%s looking out from the window bench.',
        },
      ],
    },

    '%C2_z14': {
      name: 'Smith Tower - 14th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -13,
      y: 9,
      z: 14,
      exits: { north: '%C1_z14', east: '%C3_z14' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 14).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a wicker settee', description: 'A wicker settee in the style of a steamship deck chair faces the window, its cushions covered in faded blue canvas.', boltedDown: false },
        { prototype: 'table', name: 'a lobster trap table', description: 'An old lobster trap has been converted into a side table with a driftwood top, holding a brass lantern lamp.', boltedDown: false },
        { prototype: 'furniture', name: 'a decorative anchor', description: 'A small ship\'s anchor is mounted on the wall as decoration, its flukes crossed and chain coiled artfully. Rust has begun to bloom.', boltedDown: true },
        { prototype: 'furniture', name: 'sailcloth curtains', description: 'Heavy canvas sailcloth curtains hang from wooden rings on a brass rod, sun-bleached to a pale cream.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the wicker settee',
          capacity: 2,
          emptyMsg: 'The wicker settee faces the fading western light like a ship\'s sun deck.',
          occupiedMsg: '%s lounging on the wicker settee.',
        },
      ],
    },

    '%C3_z14': {
      name: 'Smith Tower - 14th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -12,
      y: 9,
      z: 14,
      exits: {
        north: { room: '%EL_z14', door: '%D_C3_z14' },
        west: '%C2_z14',
        east: '%C4_z14',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 14).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a built-in bench', description: 'A built-in bench with rope handles and a hinged top for storage sits against the wall, its canvas cushion stenciled with an anchor.', boltedDown: true },
        { prototype: 'furniture', name: 'a sea locker', description: 'A narrow sea locker is built into the wall, its teak door fitted with brass hinges. Inside hang oilskin coats and a cork life preserver.', boltedDown: true },
        { prototype: 'furniture', name: 'a brass mail slot', description: 'A brass mail slot shaped like a ship\'s porthole is set into the door, its hinge squeaking with age.', boltedDown: true },
        { prototype: 'table', name: 'a rope-edged console', description: 'A narrow console table with a rope-wrapped edge holds a brass bowl for keys and a collection of sea shells.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the entry bench',
          capacity: 2,
          emptyMsg: 'The nautical bench offers a place to sit while removing sea boots.',
          occupiedMsg: '%s resting on the entry bench.',
        },
      ],
    },

    '%C4_z14': {
      name: 'Smith Tower - 14th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -11,
      y: 9,
      z: 14,
      exits: { west: '%C3_z14' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 14).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a captain\'s cabin bed', description: 'A substantial bed is built into the alcove like a ship\'s cabin, with heavy canvas curtains for privacy and wool blankets in a maritime stripe pattern.', quality: 'nice' },
        { prototype: 'furniture', name: 'a wardrobe sea chest', description: 'A tall sea chest with brass corners serves as a wardrobe, its interior fitted with cedar and smelling faintly of camphor.', boltedDown: false },
        { prototype: 'furniture', name: 'a porthole mirror', description: 'A brass porthole frame has been converted into a wall mirror, complete with working dogs and hinges.', boltedDown: true },
        { prototype: 'table', name: 'a brass ship\'s lamp table', description: 'A small table bolted to the floor holds a brass gimbal lamp, a worn leather journal, and a faded photograph in a rope frame.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the captain\'s cabin bed',
          capacity: 2,
          emptyMsg: 'The cabin bed awaits behind its canvas curtains, wool blankets folded neatly.',
          occupiedMsg: '%s resting in the captain\'s cabin bed.',
        },
      ],
    },

    '%B4_z14': {
      name: 'Smith Tower - 14th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: -10,
      y: 9,
      z: 14,
      exits: { north: '%B2_z14' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 14).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a fold-down berth', description: 'A ship\'s berth folds down from the wall, its canvas straps securing the mattress. When stowed, the berth is hidden behind a teak panel.', quality: 'standard' },
        { prototype: 'furniture', name: 'a teak berth cabinet', description: 'The fold-down berth is concealed in a teak cabinet with brass latches. When closed, it displays a carved seascape of ships and waves.', boltedDown: true },
        { prototype: 'furniture', name: 'nautical display shelves', description: 'Built-in shelving with brass fiddle rails displays model ships, a brass sextant, and books on maritime history.', boltedDown: true },
        { prototype: 'table', name: 'a bulkhead fold-down desk', description: 'A small desk folds down from the bulkhead on brass hinges, fitted with a chart light and compass rose inlay.', boltedDown: true },
        { prototype: 'furniture', name: 'a sea bag dresser', description: 'A compact chest of drawers with brass ring pulls is designed like a ship\'s quartermaster desk, each drawer labeled with brass plates.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the fold-down berth',
          capacity: 2,
          emptyMsg: 'The berth is lowered, its canvas mattress exposed and ready.',
          occupiedMsg: '%s resting in the fold-down berth.',
        },
      ],
    },
  },
};
