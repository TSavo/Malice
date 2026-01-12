// Smith Tower - Condo Floor (z=18)
// Tech startup - standing desks, beanbags, whiteboards, exposed cables, startup culture remnants

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z18' },
    },

    // Rentable locks
    '%RL_A2_z18': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z18': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z18': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z18': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z18'],
    },
    '%D_B2_z18': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z18'],
    },
    '%D_C3_z18': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z18'],
    },

    // Elevator landing
    '%EL_z18': {
      name: 'Smith Tower - 18th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 18,
      exits: {
        north: { room: '%A2_z18', door: '%D_A2_z18' },
        east: { room: '%B2_z18', door: '%D_B2_z18' },
        south: { room: '%C3_z18', door: '%D_C3_z18' },
        west: '%C1_z18',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z18': {
      name: 'Smith Tower - 18th Floor - North Suite - Living Room',
      description:
        "A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone's life—books, decorative objects, a dead potted plant.",
      x: -3,
      y: 11,
      z: 18,
      exits: { east: '%A2_z18' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 18).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'table',
          name: 'a ping pong table',
          description:
            'A ping pong table dominates the center of the room, its green surface faded and warped. One paddle lies on the table, its rubber peeling. The net sags in defeat.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a snack bar kitchenette',
          description:
            'A built-in kitchenette has been repurposed as a snack bar. Empty Red Bull cans and kombucha bottles line the counter. A dusty espresso machine sits silent.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a wall of whiteboards',
          description:
            'Floor-to-ceiling whiteboards cover one wall, still marked with faded sprint planning notes, user flow diagrams, and the words "SHIP IT!" in multiple colors.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'tangled ethernet cables',
          description:
            "A rat's nest of ethernet cables spills from a hole in the ceiling, hanging like technological vines. Some still connect to nothing.",
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a giant beanbag',
          capacity: 2,
          emptyMsg:
            'An enormous beanbag in startup-orange sits deflated but inviting, branded with a defunct company logo.',
          occupiedMsg: '%s sunk into the giant beanbag.',
        },
        {
          name: 'an Aeron chair',
          capacity: 1,
          emptyMsg:
            'A high-end Aeron chair sits askew, its mesh back still intact despite years of neglect.',
          occupiedMsg: '%s ergonomically positioned in the Aeron chair.',
        },
      ],
    },

    '%A2_z18': {
      name: 'Smith Tower - 18th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 18,
      exits: {
        west: '%A1_z18',
        east: '%A3_z18',
        south: { room: '%EL_z18', door: '%D_A2_z18' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 18).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a nap pod',
          description:
            'A futuristic nap pod sits in the corner, its curved white shell designed for power naps between coding sprints. The mattress inside is surprisingly comfortable.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a smart closet',
          description:
            'A built-in closet has been converted to "smart storage" with QR-coded bins and a faded label reading "Swag Inventory." The bins are mostly empty.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a charging station nightstand',
          description:
            'A nightstand bristles with dead charging cables—micro-USB, Lightning, USB-C, proprietary connectors for devices long obsolete.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a motivational poster',
          description:
            'A framed poster on the wall reads "MOVE FAST AND BREAK THINGS" in bold sans-serif. The glass is cracked.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the nap pod',
          capacity: 1,
          emptyMsg:
            "The nap pod's shell is raised, revealing its cushioned interior.",
          occupiedMsg: '%s curled up in the nap pod.',
        },
      ],
    },

    '%A3_z18': {
      name: 'Smith Tower - 18th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 18,
      exits: { west: '%A2_z18' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 18).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a micro-kitchen',
          description:
            'A cramped kitchen area holds a cold-brew coffee station, an unplugged mini-fridge covered in startup stickers, and a microwave optimized for reheating takeout.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a standing desk',
          description:
            'An adjustable standing desk is frozen at standing height, its motorized base long dead. Dual monitor arms hold nothing but dust.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a treadmill desk',
          description:
            'A treadmill desk sits in the corner, the belt cracked and immobile. A laptop stand is mounted on the console.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a server rack',
          description:
            "A small server rack hums silently—wait, no. It's been dead for decades. Blinking LED lights are just a memory.",
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a wobble stool',
          capacity: 1,
          emptyMsg:
            'A curved wobble stool promises active sitting, though it now just collects dust.',
          occupiedMsg: '%s balancing on the wobble stool.',
        },
        {
          name: 'a gaming chair',
          capacity: 1,
          emptyMsg:
            'A racing-style gaming chair in black and neon green sits before the standing desk, clearly for when you need to sit anyway.',
          occupiedMsg: '%s gaming in the racing chair.',
        },
      ],
    },

    '%B1_z18': {
      name: 'Smith Tower - 18th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 18,
      exits: { south: '%B2_z18' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 18).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a climbing wall',
          description:
            'A small indoor climbing wall is bolted to the mezzanine, its colorful holds faded but still grippable. The startup believed in "disrupting fitness."',
          boltedDown: true,
        },
        {
          prototype: 'bed',
          name: 'a hammock bed',
          description:
            'A hammock is strung across the loft space, its fabric sun-bleached but holding. Someone really committed to the startup lifestyle.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a meditation cushion pile',
          description:
            'A pile of meditation cushions and yoga mats sits beneath the loft, remnants of mandatory mindfulness sessions.',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a bamboo shelf',
          description:
            'A sustainable bamboo bookshelf holds copies of "The Lean Startup," "Zero to One," and several dust-covered copies of the company\'s own unread memoir.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the meditation cushions',
          capacity: 4,
          emptyMsg:
            'The meditation cushions are arranged in a circle, awaiting the next standup meeting.',
          occupiedMsg: '%s cross-legged on the meditation cushions.',
        },
        {
          name: 'the hammock bed',
          capacity: 1,
          emptyMsg: 'The hammock sways gently in a draft from the window.',
          occupiedMsg: '%s swaying in the hammock bed.',
        },
      ],
    },

    '%C1_z18': {
      name: 'Smith Tower - 18th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 18,
      exits: { south: '%C2_z18', east: '%EL_z18' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 18).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a sleeping bag',
          description:
            'A high-end sleeping bag rated for Arctic conditions is spread on a camping pad. Apparently someone took "living the startup life" literally.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a pegboard wall',
          description:
            'A pegboard organizer covers one wall, its hooks holding headphones, stress balls, and fidget spinners. Everything is branded.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a wall-mounted monitor',
          description:
            'A large flat-screen monitor is mounted at eye level, its screen dark. A faded sticky note on the bezel reads "Analytics Dashboard."',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a floating shelf desk',
          description:
            'A minimalist floating shelf serves as a desk, barely wide enough for a laptop. A dead MacBook Pro sits there still.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the sleeping bag',
          capacity: 1,
          emptyMsg:
            'The sleeping bag is unzipped and ready for another late night.',
          occupiedMsg: '%s cocooned in the sleeping bag.',
        },
      ],
    },

    '%B2_z18': {
      name: 'Smith Tower - 18th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 18,
      exits: {
        north: '%B1_z18',
        east: '%B3_z18',
        west: { room: '%EL_z18', door: '%D_B2_z18' },
        south: '%B4_z18',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 18).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'modular lounge pods',
          description:
            'A cluster of modular lounge pods in primary colors can be rearranged into different configurations. Someone left them in "collaboration mode."',
          boltedDown: false,
        },
        {
          prototype: 'table',
          name: 'a foosball table',
          description:
            'A professional-grade foosball table occupies the center of the room. The little players are frozen mid-kick, their paint chipped.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a media wall',
          description:
            "A wall-mounted array of screens was meant for presentations and Slack channels. Now they're all dark, reflecting the empty room.",
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a swag closet',
          description:
            'A built-in closet is packed with branded hoodies, t-shirts, and tote bags. The company name nobody remembers is printed on everything.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the lounge pods',
          capacity: 4,
          emptyMsg:
            'The colorful lounge pods are arranged in a conversation circle, ready for impromptu brainstorming.',
          occupiedMsg: '%s settled into the lounge pods.',
        },
      ],
    },

    '%B3_z18': {
      name: 'Smith Tower - 18th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 18,
      exits: { west: '%B2_z18' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 18).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a patent wall',
          description:
            'Framed patent certificates and startup award plaques cover one wall—"Most Innovative Disruption 2019," "Best Pivot 2020." The achievements mean nothing now.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a hot desk cluster',
          description:
            'Three narrow desks are pushed together in a cluster, designed for hot-desking. Headphone hooks and monitor arms remain, monitors long gone.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a phone booth pod',
          description:
            'A soundproof phone booth pod stands in the corner for private calls. The acoustic foam inside is dusty but intact.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a idea board',
          description:
            'A corkboard labeled "THE IDEA WALL" holds faded sticky notes with illegible product ideas and a few dead Post-its curled at the edges.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a hot desk chair',
          capacity: 1,
          emptyMsg:
            'One of the matching task chairs waits at the hot desk cluster.',
          occupiedMsg: '%s working at the hot desk.',
        },
        {
          name: 'the phone booth pod',
          capacity: 1,
          emptyMsg:
            'The phone booth pod door is ajar, revealing a small seat inside.',
          occupiedMsg: '%s having a private moment in the phone booth.',
        },
      ],
    },

    '%C2_z18': {
      name: 'Smith Tower - 18th Floor - South Suite - Living Room',
      description:
        'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 18,
      exits: { north: '%C1_z18', east: '%C3_z18' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 18).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a kombucha bar',
          description:
            'A small bar area holds a kombucha brewing station with several glass jars. The SCOBYs inside have long since died, leaving murky liquid.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a reclaimed wood table',
          description:
            'A communal table made from reclaimed barnwood and industrial pipe legs seats six. Someone carved "HUSTLE" into the edge.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a smart radiator',
          description:
            'The old steam radiator has been fitted with a "smart" thermostat cover that no longer connects to anything.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'macrame plant hangers',
          description:
            'Macrame plant hangers dangle from ceiling hooks, their pots holding only dust and desiccated succulents.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'a communal bench',
          capacity: 3,
          emptyMsg:
            'A long bench lines one side of the communal table, meant for collaborative lunches.',
          occupiedMsg: '%s seated at the communal bench.',
        },
        {
          name: 'mismatched chairs',
          capacity: 3,
          emptyMsg:
            'An assortment of thrifted chairs sits opposite the bench—no two alike.',
          occupiedMsg: '%s in one of the mismatched chairs.',
        },
      ],
    },

    '%C3_z18': {
      name: 'Smith Tower - 18th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 18,
      exits: {
        north: { room: '%EL_z18', door: '%D_C3_z18' },
        west: '%C2_z18',
        east: '%C4_z18',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 18).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'a welcome wall',
          description:
            'A neon sign reading "WELCOME TO THE FUTURE" hangs dead on the entry wall. Below it, a row of hooks holds forgotten lanyards and conference badges.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a scooter rack',
          description:
            'A wall-mounted rack designed for Razor scooters holds two dusty models. Apparently walking was too slow for this startup.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'a bike repair station',
          description:
            'A bike repair station with tools and a pump is mounted on one wall. A single flat tire leans against it.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a standing meeting table',
          description:
            'A tall, narrow standing meeting table is designed to keep meetings short. A few sticky notes are stuck to its surface.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'a modular bench',
          capacity: 3,
          emptyMsg:
            'A modular entry bench in startup teal offers seating while you swap shoes for slippers.',
          occupiedMsg: '%s on the modular entry bench.',
        },
      ],
    },

    '%C4_z18': {
      name: 'Smith Tower - 18th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 18,
      exits: { west: '%C3_z18' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 18).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a platform bed',
          description:
            'A minimalist platform bed with built-in USB charging ports fills the alcove. The ports are dead, of course, but the memory foam mattress has held up.',
          quality: 'nice',
        },
        {
          prototype: 'furniture',
          name: 'a capsule wardrobe rack',
          description:
            'A minimal clothing rack holds exactly 33 items—someone took the capsule wardrobe trend seriously. The clothes are dated but well-chosen.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a smart mirror',
          description:
            'A "smart" mirror is mounted on the wall, its display long dead. It was supposed to show weather and calendar. Now it just reflects.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a wireless charging pad nightstand',
          description:
            'A nightstand with a built-in wireless charging surface holds nothing to charge. A dead Alexa sits there, eternally waiting.',
          boltedDown: false,
        },
      ],
      sittables: [
        {
          name: 'the platform bed',
          capacity: 2,
          emptyMsg: 'The platform bed sits low and modern in its alcove.',
          occupiedMsg: '%s lounging on the platform bed.',
        },
      ],
    },

    '%B4_z18': {
      name: 'Smith Tower - 18th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 18,
      exits: { north: '%B2_z18' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 18).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a convertible sofa bed',
          description:
            'A space-saving sofa bed unfolds from the wall, its clever mechanism still working. The mattress is surprisingly supportive for a dual-purpose piece.',
          quality: 'standard',
        },
        {
          prototype: 'furniture',
          name: 'a wall bed cabinet',
          description:
            'The sofa bed folds into a sleek white cabinet with "ORI" branding—a robotic furniture startup that outlived its parent company.',
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'modular wall storage',
          description:
            'A modular shelving system holds books, a dead Bluetooth speaker, and several participation trophies from hackathons.',
          boltedDown: true,
        },
        {
          prototype: 'table',
          name: 'a motorized standing desk',
          description:
            'A small motorized standing desk is stuck halfway between sitting and standing height, its motor burned out mid-adjustment.',
          boltedDown: false,
        },
        {
          prototype: 'furniture',
          name: 'a VR headset dock',
          description:
            'A charging dock for VR headsets is mounted on the wall. One headset remains, its lenses cracked and straps deteriorated.',
          boltedDown: true,
        },
      ],
      sittables: [
        {
          name: 'the sofa bed',
          capacity: 2,
          emptyMsg:
            'The convertible sofa bed is currently in sofa mode, compact and inviting.',
          occupiedMsg: '%s crashed on the sofa bed.',
        },
      ],
    },
  },
};
