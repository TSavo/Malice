// Smith Tower - 4th Floor Condos
// Lower floor - more wear, older furnishings, some water damage from the years

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z4' },
    },

    // Rentable locks
    '%RL_A2_z4': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z4': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z4': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z4': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z4'],
    },
    '%D_B2_z4': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z4'],
    },
    '%D_C3_z4': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z4'],
    },

    // Elevator landing
    '%EL_z4': {
      name: 'Smith Tower - 4th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -12,
      y: 10,
      z: 4,
      exits: {
        north: { room: '%A2_z4', door: '%D_A2_z4' },
        east: { room: '%B2_z4', door: '%D_B2_z4' },
        south: { room: '%C3_z4', door: '%D_C3_z4' },
        west: '%C1_z4',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z4': {
      name: 'Smith Tower - 4th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -13,
      y: 11,
      z: 4,
      exits: { east: '%A2_z4' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 4).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a water-damaged coffee table', description: 'A once-fine coffee table shows the ravages of a long-ago leak. The veneer has bubbled and peeled, revealing particleboard beneath.', boltedDown: false },
        { prototype: 'furniture', name: 'an avocado-green kitchenette', description: 'The kitchenette dates from the 1970s renovation, its avocado appliances a time capsule. The laminate counters are chipped at the edges, cabinet hinges rusted.', boltedDown: true },
        { prototype: 'furniture', name: 'a warped wall unit', description: 'Built-in shelving sags visibly in the middle, the wood warped by decades of humidity. A few moldy paperbacks and a shattered picture frame remain.', boltedDown: true },
        { prototype: 'furniture', name: 'a standing radiator', description: 'An old cast-iron radiator stands beneath the window, its paint flaking. It still works, clicking and groaning as it heats.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a threadbare armchair',
          capacity: 1,
          emptyMsg: 'A once-plush armchair sits by the window, its upholstery worn through to the stuffing in places.',
          occupiedMsg: '%s sunk into the threadbare armchair.',
        },
      ],
    },

    '%A2_z4': {
      name: 'Smith Tower - 4th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -12,
      y: 11,
      z: 4,
      exits: {
        west: '%A1_z4',
        east: '%A3_z4',
        south: { room: '%EL_z4', door: '%D_A2_z4' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 4).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a sagging double bed', description: 'An old double bed with a brass headboard sits against the wall. The mattress dips dramatically in the center, springs visible through worn fabric.', quality: 'cheap' },
        { prototype: 'furniture', name: 'a cracked closet mirror', description: 'The closet doors have mirrored panels, but one is cracked from corner to corner. A spider web of fractures distorts any reflection.', boltedDown: true },
        { prototype: 'furniture', name: 'a steamer trunk', description: 'An old steamer trunk serves as both storage and nightstand. Its leather straps are cracked, brass fittings green with oxidation.', boltedDown: false },
        { prototype: 'furniture', name: 'a wall-mounted coat rack', description: 'A simple wooden coat rack is screwed into the wall, its pegs worn smooth. One peg is broken off.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the brass bed',
          capacity: 2,
          emptyMsg: 'The old bed waits, its brass headboard tarnished to a dull brown.',
          occupiedMsg: '%s sprawled on the sagging mattress.',
        },
      ],
    },

    '%A3_z4': {
      name: 'Smith Tower - 4th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -11,
      y: 11,
      z: 4,
      exits: { west: '%A2_z4' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 4).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a rust-stained kitchen', description: 'The galley kitchen shows decades of water damage. The sink is stained orange with rust, faucet handles frozen in place. Upper cabinet doors hang at angles.', boltedDown: true },
        { prototype: 'table', name: 'a folding card table', description: 'A battered card table serves as both dining and work surface. Its legs are uneven, propped with folded cardboard.', boltedDown: false },
        { prototype: 'furniture', name: 'a cot with army blankets', description: 'A military surplus cot holds scratchy wool blankets. Functional but cheerless.', boltedDown: false },
        { prototype: 'furniture', name: 'stacked milk crates', description: 'Plastic milk crates are stacked against the wall, serving as improvised shelving for canned goods and random supplies.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a folding metal chair',
          capacity: 1,
          emptyMsg: 'A dented folding chair sits at the card table.',
          occupiedMsg: '%s perched on the wobbly folding chair.',
        },
        {
          name: 'the cot',
          capacity: 1,
          emptyMsg: 'The cot waits, blankets neatly folded.',
          occupiedMsg: '%s resting on the cot.',
        },
      ],
    },

    '%B1_z4': {
      name: 'Smith Tower - 4th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: -10,
      y: 11,
      z: 4,
      exits: { south: '%B2_z4' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 4).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a rickety loft ladder', description: 'A wooden ladder leads to the mezzanine, its rungs worn thin and one cracked down the middle. It creaks alarmingly with each step.', boltedDown: true },
        { prototype: 'bed', name: 'a bare loft mattress', description: 'A stained mattress sits directly on the loft platform. No sheets, just a balled-up sleeping bag in one corner.', quality: 'cheap', boltedDown: true },
        { prototype: 'furniture', name: 'a broken recliner', description: 'A La-Z-Boy recliner sits below the loft, its footrest permanently extended and mechanism jammed. The vinyl is split along every seam.', boltedDown: false },
        { prototype: 'furniture', name: 'a standing lamp skeleton', description: 'A floor lamp stands in the corner, its shade long gone, bare bulb socket exposed. The wiring looks questionable.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the broken recliner',
          capacity: 1,
          emptyMsg: 'The recliner sits frozen in reclined position, footrest jutting out.',
          occupiedMsg: '%s wedged into the broken recliner.',
        },
        {
          name: 'the loft mattress',
          capacity: 1,
          emptyMsg: 'The bare mattress is visible on the loft above.',
          occupiedMsg: '%s curled up on the loft mattress.',
        },
      ],
    },

    '%C1_z4': {
      name: 'Smith Tower - 4th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -13,
      y: 10,
      z: 4,
      exits: { south: '%C2_z4', east: '%EL_z4' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 4).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a hammock', description: 'A canvas hammock is strung between bolted wall hooks, sagging low in the middle. The fabric is frayed at the edges.', boltedDown: false },
        { prototype: 'furniture', name: 'industrial wall hooks', description: 'Heavy-duty industrial hooks are bolted into the concrete wall, originally meant for some commercial purpose. Repurposed for hanging clothes and gear.', boltedDown: true },
        { prototype: 'furniture', name: 'a wooden crate', description: 'An old shipping crate serves as a nightstand. Stenciled letters on the side read FRAGILE - HANDLE WITH CARE.', boltedDown: false },
        { prototype: 'furniture', name: 'a pipe shelf', description: 'Rough shelving made from plumbing pipe and raw boards is mounted to the wall. Utilitarian but stable.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the hammock',
          capacity: 1,
          emptyMsg: 'The hammock hangs empty, swaying slightly in the stale air.',
          occupiedMsg: '%s swaying gently in the hammock.',
        },
      ],
    },

    '%B2_z4': {
      name: 'Smith Tower - 4th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -11,
      y: 10,
      z: 4,
      exits: {
        north: '%B1_z4',
        east: '%B3_z4',
        west: { room: '%EL_z4', door: '%D_B2_z4' },
        south: '%B4_z4',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 4).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a gutted sofa', description: 'A large sofa has been stripped of its cushions, revealing the wooden frame and springs beneath. Someone used the foam for something else.', boltedDown: false },
        { prototype: 'table', name: 'a door-on-sawhorses', description: 'An old wooden door balanced on sawhorses serves as a table. Surprisingly stable, if crude.', boltedDown: false },
        { prototype: 'furniture', name: 'a bricked-up fireplace', description: 'A decorative fireplace has been bricked up, the mortar newer than the surrounding brickwork. A mantle above holds a few dead candles.', boltedDown: true },
        { prototype: 'furniture', name: 'a hall closet', description: 'A built-in closet near the entrance has no door, just an empty frame. Wire hangers and dust bunnies within.', boltedDown: true },
        { prototype: 'furniture', name: 'window bars', description: 'Someone installed iron security bars on the inside of the windows. They cast grid shadows across the floor.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the sofa frame',
          capacity: 2,
          emptyMsg: 'The bare sofa frame offers uncomfortable seating on exposed springs.',
          occupiedMsg: '%s perched awkwardly on the gutted sofa.',
        },
      ],
    },

    '%B3_z4': {
      name: 'Smith Tower - 4th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: -10,
      y: 10,
      z: 4,
      exits: { west: '%B2_z4' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 4).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'stripped bookshelves', description: 'The built-in bookshelves have been picked clean, only a few moldering paperbacks remaining. Water stains mark the bottom shelves.', boltedDown: true },
        { prototype: 'table', name: 'a salvaged school desk', description: 'An old school desk, the kind with the attached chair, sits near the window. Initials are carved into every surface.', boltedDown: false },
        { prototype: 'furniture', name: 'a filing cabinet', description: 'A dented metal filing cabinet stands in the corner. The drawers are jammed shut, contents unknown.', boltedDown: false },
        { prototype: 'furniture', name: 'a wall safe', description: 'A small wall safe is mounted behind where a picture once hung. The combination lock is rusted solid.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the school desk',
          capacity: 1,
          emptyMsg: 'The old school desk waits, covered in decades of carved graffiti.',
          occupiedMsg: '%s squeezed into the school desk chair.',
        },
      ],
    },

    '%C2_z4': {
      name: 'Smith Tower - 4th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -13,
      y: 9,
      z: 4,
      exits: { north: '%C1_z4', east: '%C3_z4' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 4).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a car seat sofa', description: 'Someone has bolted two car seats together into a makeshift sofa. The vinyl is cracked but surprisingly comfortable.', boltedDown: false },
        { prototype: 'table', name: 'a cable spool table', description: 'A large wooden cable spool serves as a coffee table. Burn marks from cigarettes dot its surface.', boltedDown: false },
        { prototype: 'furniture', name: 'an exposed radiator', description: 'The radiator cover has been removed, exposing rusted iron fins. It works, filling the room with dry heat.', boltedDown: true },
        { prototype: 'furniture', name: 'boarded windows', description: 'The windows have been partially boarded over, thin strips of light leaking through the gaps.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the car seat sofa',
          capacity: 2,
          emptyMsg: 'The improvised car-seat sofa faces the boarded windows.',
          occupiedMsg: '%s lounging on the car seats.',
        },
      ],
    },

    '%C3_z4': {
      name: 'Smith Tower - 4th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -12,
      y: 9,
      z: 4,
      exits: {
        north: { room: '%EL_z4', door: '%D_C3_z4' },
        west: '%C2_z4',
        east: '%C4_z4',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 4).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bench', name: 'a church pew', description: 'A wooden church pew has been installed along one wall. The varnish is worn smooth, hymnal holders empty.', boltedDown: true },
        { prototype: 'furniture', name: 'a sealed closet', description: 'The entry closet has been sealed shut with nails and boards. Whatever is inside stays inside.', boltedDown: true },
        { prototype: 'furniture', name: 'a mail slot', description: 'The brass mail slot is welded shut from the inside. No deliveries accepted.', boltedDown: true },
        { prototype: 'furniture', name: 'a shoe rack', description: 'A tilted shoe rack holds several pairs of worn boots, all roughly the same size.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the church pew',
          capacity: 4,
          emptyMsg: 'The church pew offers hard seating along the wall.',
          occupiedMsg: '%s seated on the wooden pew.',
        },
      ],
    },

    '%C4_z4': {
      name: 'Smith Tower - 4th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -11,
      y: 9,
      z: 4,
      exits: { west: '%C3_z4' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 4).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a mattress on pallets', description: 'A mattress rests on stacked wooden pallets, elevating it off the cold concrete floor. The sheets are military surplus.', quality: 'cheap' },
        { prototype: 'furniture', name: 'a tarp privacy curtain', description: 'A blue tarp hangs from the ceiling on baling wire, creating a crude privacy curtain around the sleeping area.', boltedDown: true },
        { prototype: 'furniture', name: 'a shattered mirror', description: 'Fragments of a mirror remain bolted to the wall. Most of the glass is gone, sharp edges glinting.', boltedDown: true },
        { prototype: 'furniture', name: 'a bucket', description: 'A five-gallon bucket with a lid sits in the corner. Best not to ask what it is used for.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the pallet bed',
          capacity: 2,
          emptyMsg: 'The mattress on pallets offers bare-minimum comfort.',
          occupiedMsg: '%s sprawled on the pallet bed.',
        },
      ],
    },

    '%B4_z4': {
      name: 'Smith Tower - 4th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: -10,
      y: 9,
      z: 4,
      exits: { north: '%B2_z4' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 4).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a broken Murphy bed', description: 'The Murphy bed is stuck halfway out of its cabinet, mechanism jammed. The mattress hangs at an angle, springs exposed.', quality: 'cheap' },
        { prototype: 'furniture', name: 'a jammed Murphy cabinet', description: 'The Murphy bed cabinet is wedged open, its counterweight system broken. Tools of unknown origin are wedged in the mechanism.', boltedDown: true },
        { prototype: 'furniture', name: 'ransacked shelving', description: 'The built-in shelves have been torn through. A few items remain: a cracked snow globe, a VHS tape, a single shoe.', boltedDown: true },
        { prototype: 'furniture', name: 'graffiti wall', description: 'One wall is covered in old graffiti, layers upon layers of spray paint and marker. Some of it might be art.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the tilted Murphy bed',
          capacity: 1,
          emptyMsg: 'The broken Murphy bed hangs at an awkward angle.',
          occupiedMsg: '%s perched precariously on the tilted bed.',
        },
      ],
    },
  },
};
