// Smith Tower - Condo Floor (z=29) - Mediterranean Theme
// Terracotta, wrought iron, mosaic tiles, olive wood, Greek and Italian influences

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z29' },
    },

    // Rentable locks
    '%RL_A2_z29': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z29': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z29': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z29': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z29'],
    },
    '%D_B2_z29': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z29'],
    },
    '%D_C3_z29': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z29'],
    },

    // Elevator landing
    '%EL_z29': {
      name: 'Smith Tower - 29th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 29,
      exits: {
        north: { room: '%A2_z29', door: '%D_A2_z29' },
        east: { room: '%B2_z29', door: '%D_B2_z29' },
        south: { room: '%C3_z29', door: '%D_C3_z29' },
        west: '%C1_z29',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z29': {
      name: 'Smith Tower - 29th Floor - North Suite - Living Room',
      description:
        'A corner unit with tall windows and warm terracotta tile floors. A kitchenette with hand-painted Majolica tiles occupies one wall. Built-in archway alcoves hold blue and white Greek pottery, dried lavender, and sun-bleached books.',
      x: -3,
      y: 11,
      z: 29,
      exits: { east: '%A2_z29' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 29).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a mosaic-topped coffee table',
          description:
            'A low coffee table features an intricate mosaic of blue, white, and gold tiles depicting a Mediterranean seascape. The grout is cracked but the tiny tesserae remain firmly set.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a Majolica-tiled kitchenette',
          description:
            'A built-in kitchenette runs along one wall, its backsplash covered in hand-painted Italian Majolica tiles depicting lemons and olive branches. The small sink is bone dry.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'archway alcoves',
          description:
            'Rounded archway alcoves are built into the walls, displaying blue and white Greek amphorae, a dried lavender bundle, and dust-covered books on Mediterranean history.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'an olive wood settee',
          capacity: 3,
          emptyMsg:
            'A settee of carved olive wood with faded linen cushions sits against the wall, its armrests worn smooth by countless hands.',
          occupiedMsg: '%s reclining on the olive wood settee.',
        },
      ],
    },

    '%A2_z29': {
      name: 'Smith Tower - 29th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A painted armoire with scenes of Tuscan countryside dominates one wall, its doors slightly ajar.',
      x: -2,
      y: 11,
      z: 29,
      exits: {
        west: '%A1_z29',
        east: '%A3_z29',
        south: { room: '%EL_z29', door: '%D_A2_z29' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 29).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a wrought iron bed',
          description:
            'A queen-sized bed with an ornate wrought iron frame featuring scrollwork vines and grape leaves. The linens are sun-faded but crisp with age.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a painted Tuscan armoire',
          description:
            'A tall armoire painted with faded scenes of cypress trees and rolling Tuscan hills. Its wooden doors creak when opened, revealing empty shelves and a lingering scent of cedar.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'an olive wood nightstand',
          description:
            'A small nightstand carved from olive wood sits beside the bed, its surface marked by the grain of the ancient tree. A ceramic oil lamp with a dusty wick rests atop it.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the wrought iron bed',
          capacity: 2,
          emptyMsg:
            'The wrought iron bed waits with its faded linens, scrollwork headboard catching the light.',
          occupiedMsg: '%s resting on the wrought iron bed.',
        },
      ],
    },

    '%A3_z29': {
      name: 'Smith Tower - 29th Floor - North Suite - Studio',
      description:
        'A long studio with whitewashed walls and terracotta floor tiles. A narrow galley kitchen features hand-painted tiles, while fishing nets hang decoratively from the ceiling beams.',
      x: -1,
      y: 11,
      z: 29,
      exits: { west: '%A2_z29' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 29).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a tiled galley kitchen',
          description:
            'A narrow galley kitchen runs along one wall, its surfaces covered in hand-painted tiles depicting fish and waves. The copper faucet is green with patina.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a rustic pine table',
          description:
            'A simple pine table serves as both workspace and dining surface. The wood is bleached pale from years of scrubbing, its surface marked with knife scars.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'fishing net decorations',
          description:
            'Old fishing nets are draped across the ceiling beams, tangled with glass floats in sea-green and amber. Dried starfish and shells are caught in the netting.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a daybed with striped cushions',
          capacity: 2,
          emptyMsg:
            'A low daybed with blue and white striped cushions serves as both couch and bed, reminiscent of a Greek island.',
          occupiedMsg: '%s lounging on the striped daybed.',
        },
        {
          name: 'a rush-seated chair',
          capacity: 1,
          emptyMsg:
            'A simple wooden chair with a woven rush seat sits at the table, its frame darkened with age.',
          occupiedMsg: '%s sitting at the pine table.',
        },
      ],
    },

    '%B1_z29': {
      name: 'Smith Tower - 29th Floor - East Suite - Loft',
      description:
        'A lofted corner with exposed ceiling beams painted in Mediterranean blue and a compact mezzanine. Terracotta tiles cover the floor, cool and smooth underfoot. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 29,
      exits: { south: '%B2_z29' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 29).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a weathered ladder',
          description:
            'A sturdy wooden ladder is bolted to the mezzanine edge, its rungs worn smooth and pale from decades of bare feet ascending to the loft.',
          boltedDown: true,
        },
        {
          prototype: 'bed',
          name: 'a loft mattress on rope frame',
          description:
            'A narrow mattress rests on a traditional rope-strung frame in the mezzanine. The ropes have stretched with age but still hold.',
          quality: 'cheap',
        },
        {
          prototype: 'furniture',
          name: 'a wicker settee',
          description:
            'A large wicker settee with faded floral cushions sits beneath the mezzanine. The wicker creaks pleasantly when sat upon.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a tile-topped side table',
          description:
            'A small iron table with a colorful tile mosaic top sits beside the settee, holding a terracotta oil lamp and a dried sprig of rosemary.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the wicker settee',
          capacity: 3,
          emptyMsg:
            'The wicker settee waits beneath the mezzanine, cushions soft and inviting.',
          occupiedMsg: '%s settled into the wicker settee.',
        },
        {
          name: 'the loft bed',
          capacity: 1,
          emptyMsg:
            'The loft bed is visible above, accessible by the weathered ladder.',
          occupiedMsg: '%s up in the loft bed.',
        },
      ],
    },

    '%C1_z29': {
      name: 'Smith Tower - 29th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The walls are whitewashed plaster, and a Moorish-style archway frames the sleeping area.',
      x: -3,
      y: 10,
      z: 29,
      exits: { south: '%C2_z29', east: '%EL_z29' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 29).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a narrow iron daybed',
          description:
            'A narrow daybed with a simple wrought iron frame is wedged into the Moorish archway alcove. A thin wool blanket in faded stripes covers the mattress.',
          quality: 'cheap',
        },
        {
          prototype: 'furniture',
          name: 'iron wall hooks',
          description:
            'Ornate wrought iron hooks shaped like olive branches are mounted on the wall, designed for hanging bags and clothing.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a carved wall niche',
          description:
            'A small arched niche is carved into the plaster wall, holding a blue glass evil eye amulet and a stub of candle in a brass holder.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the iron daybed',
          capacity: 1,
          emptyMsg:
            'The narrow daybed waits in its archway alcove, striped blanket neatly folded.',
          occupiedMsg: '%s resting on the iron daybed.',
        },
      ],
    },

    '%B2_z29': {
      name: 'Smith Tower - 29th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. Terracotta tiles and whitewashed walls give the space a villa-like warmth. Wrought iron sconces flank the windows.',
      x: -1,
      y: 10,
      z: 29,
      exits: {
        north: '%B1_z29',
        east: '%B3_z29',
        west: { room: '%EL_z29', door: '%D_B2_z29' },
        south: '%B4_z29',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 29).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a curved sectional in linen',
          description:
            'A large curved sectional upholstered in natural linen dominates the room, its cushions bleached by years of sunlight to a pale cream.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a hammered copper table',
          description:
            'A round coffee table with a hammered copper top sits before the sectional, its surface dented and patinated to a warm bronze.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'wrought iron wall sconces',
          description:
            'Ornate wrought iron sconces flank the windows, their candle holders empty but still dramatic against the white walls.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a terracotta pot stand',
          description:
            'A built-in corner shelf holds large terracotta pots, their contents long since dried to dust. Traces of olive trees that once grew here.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the linen sectional',
          capacity: 4,
          emptyMsg:
            'The curved linen sectional sprawls across the room, sun-bleached and inviting.',
          occupiedMsg: '%s sunk into the linen sectional.',
        },
      ],
    },

    '%B3_z29': {
      name: 'Smith Tower - 29th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-in shelving painted in faded Aegean blue. This was clearly a study, with Greek and Italian influences throughout.',
      x: 0,
      y: 10,
      z: 29,
      exits: { west: '%B2_z29' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 29).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'Aegean blue bookshelves',
          description:
            'Floor-to-ceiling bookshelves painted in faded Aegean blue line the walls, holding leather-bound classics, pottery shards displayed as art, and small amphora replicas.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'an olive wood writing desk',
          description:
            'A writing desk carved from a single piece of olive wood sits in the window bay, its surface swirled with the distinctive grain. An inkwell and quill pen remain, dried out.',
          boltedDown: false,
        },
        {
          prototype: 'chair',
          name: 'a leather X-frame chair',
          description:
            'A Savonarola chair with crossed wooden legs and worn leather seat and back sits at the desk. The Renaissance design feels timeless.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a Greek amphora',
          description:
            'A large terracotta amphora stands in the corner, its surface painted with faded black figures depicting a mythological scene.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the Savonarola chair',
          capacity: 1,
          emptyMsg:
            "The leather X-frame chair waits at the desk, a Renaissance scholar's seat.",
          occupiedMsg: '%s seated in the Savonarola chair.',
        },
        {
          name: 'a window bench',
          capacity: 2,
          emptyMsg:
            'A built-in window bench with faded blue cushions offers a view of the silent city.',
          occupiedMsg: '%s seated at the window bench.',
        },
      ],
    },

    '%C2_z29': {
      name: 'Smith Tower - 29th Floor - South Suite - Living Room',
      description:
        'A corner unit with western exposure and warm terracotta floor tiles. The afternoon sun has bleached the linen curtains to cream and highlighted the blue painted trim around doors and windows.',
      x: -3,
      y: 9,
      z: 29,
      exits: { north: '%C1_z29', east: '%C3_z29' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 29).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a cane-back loveseat',
          description:
            'A compact loveseat with a cane back and arms faces the window. The cushion is covered in faded blue and white fabric with a Greek key pattern.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a mosaic side table',
          description:
            'A small round table features a mosaic top of broken pottery pieces set in cement, creating an abstract pattern of blue, white, and terracotta.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a decorative radiator grate',
          description:
            'An old steam radiator is hidden behind an ornate iron grate with a geometric Mediterranean pattern. The metal is warm to the touch.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'blue-painted window frames',
          description:
            'The window frames are painted in traditional Greek blue, the color faded but still striking against the white walls. Sheer linen curtains hang from iron rods.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the cane-back loveseat',
          capacity: 2,
          emptyMsg:
            'The cane-back loveseat faces the fading afternoon light, its Greek key cushion inviting.',
          occupiedMsg: '%s curled up on the cane loveseat.',
        },
      ],
    },

    '%C3_z29': {
      name: 'Smith Tower - 29th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. Hand-painted tiles frame the doorway, depicting intertwined olive branches.',
      x: -2,
      y: 9,
      z: 29,
      exits: {
        north: { room: '%EL_z29', door: '%D_C3_z29' },
        west: '%C2_z29',
        east: '%C4_z29',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 29).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'an olive branch tile border',
          description:
            'Hand-painted ceramic tiles frame the doorway, depicting intertwined olive branches with silvery-green leaves and black olives. Several tiles are cracked but still beautiful.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a wall-mounted coat rack',
          description:
            'A wrought iron coat rack with scrollwork hooks is mounted beside the door. A faded straw sun hat still hangs from one hook.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a narrow console with mirror',
          description:
            'A narrow wooden console table stands against the wall, its surface inlaid with a compass rose pattern. An age-spotted mirror in an iron frame hangs above it.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a terracotta umbrella stand',
          description:
            'A tall terracotta cylinder decorated with painted grape vines serves as an umbrella stand. A weathered walking stick leans inside.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'a wooden bench',
          capacity: 2,
          emptyMsg:
            'A simple wooden bench with a rush seat offers a place to remove shoes before entering.',
          occupiedMsg: '%s sitting on the foyer bench.',
        },
      ],
    },

    '%C4_z29': {
      name: 'Smith Tower - 29th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed sleeping alcove framed by a Moorish-style archway. The terracotta floors are worn smooth, and whitewashed walls bear the ghost of sun-faded artwork.',
      x: -1,
      y: 9,
      z: 29,
      exits: { west: '%C3_z29' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 29).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'an alcove bed with iron frame',
          description:
            'A bed with an ornate wrought iron headboard fills the recessed Moorish archway. Sheer white curtains hang from the arch, half-concealing the sleeping space.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a painted wooden wardrobe',
          description:
            'A tall wardrobe painted in faded Aegean blue stands against one wall, its doors decorated with hand-painted pomegranates and fig leaves.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a wall-mounted oil lamp',
          description:
            'A brass oil lamp in the Moroccan style is mounted on the wall, its glass chimney dusty but intact. The wick is dry.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a carved cedar chest',
          description:
            'A cedar chest with carved geometric patterns serves as both storage and nightstand beside the bed. The wood still faintly smells of cedar.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the alcove bed',
          capacity: 2,
          emptyMsg:
            'The bed waits in its Moorish alcove, sheer curtains drifting in the still air.',
          occupiedMsg: '%s tucked away in the alcove bed.',
        },
      ],
    },

    '%B4_z29': {
      name: 'Smith Tower - 29th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving painted in terracotta and cream. Every inch is utilized, the room reflecting Mediterranean practicality.',
      x: 0,
      y: 9,
      z: 29,
      exits: { north: '%B2_z29' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 29).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: "a fold-down captain's bed",
          description:
            "A fold-down bed in the captain's style is hinged to the wall, its frame painted blue with white trim. The mechanism still works despite years of neglect.",
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: "a blue captain's bed cabinet",
          description:
            'When raised, the bed folds into a cabinet painted with a nautical compass rose and sea creatures in the Greek black-figure style.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'terracotta display shelves',
          description:
            'Built-in shelves painted in warm terracotta line the walls, holding sea glass in blue and green, small amphora reproductions, and sun-bleached books.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a fold-down writing shelf',
          description:
            'A fold-down shelf is hinged below the window, serving as a compact desk when lowered. The surface is painted with faded maritime charts.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a narrow pine dresser',
          description:
            'A narrow dresser of weathered pine is wedged into the corner, its brass handles tarnished green. Fishing floats in glass sit atop it.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: "the captain's bed",
          capacity: 2,
          emptyMsg:
            "The fold-down captain's bed is lowered, its blue and white frame cheerful against the terracotta walls.",
          occupiedMsg: "%s stretched out on the captain's bed.",
        },
      ],
    },
  },
};
