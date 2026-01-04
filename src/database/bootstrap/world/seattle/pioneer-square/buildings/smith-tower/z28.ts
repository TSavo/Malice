// Smith Tower - Condo Floor (z=28) - Steampunk Theme
// Brass gears, leather, industrial Victorian, dirigible aesthetic, clockwork

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z28' },
    },

    // Rentable locks
    '%RL_A2_z28': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z28': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z28': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z28': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z28'],
    },
    '%D_B2_z28': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z28'],
    },
    '%D_C3_z28': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z28'],
    },

    // Elevator landing
    '%EL_z28': {
      name: 'Smith Tower - 28th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -2,
      y: 10,
      z: 28,
      exits: {
        north: { room: '%A2_z28', door: '%D_A2_z28' },
        east: { room: '%B2_z28', door: '%D_B2_z28' },
        south: { room: '%C3_z28', door: '%D_C3_z28' },
        west: '%C1_z28',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z28': {
      name: 'Smith Tower - 28th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -3,
      y: 11,
      z: 28,
      exits: { east: '%A2_z28' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 28).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a gear-motif coffee table', description: 'A low table with a glass top reveals an intricate arrangement of interlocking brass gears beneath, frozen mid-turn. The copper frame is riveted at each joint.', boltedDown: false },
        { prototype: 'furniture', name: 'a brass pipe kitchenette', description: 'Exposed copper and brass pipes run along the wall, connecting a deep copper sink to overhead cabinets faced with riveted steel panels. Gas burners sit cold beneath brass fixtures.', boltedDown: true },
        { prototype: 'furniture', name: 'an apothecary cabinet', description: 'A tall mahogany cabinet with dozens of small glass-fronted drawers lines one wall. Faded labels in copperplate script mark each drawer: Cogs, Springs, Escapements, Mainsprings.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a tufted leather Chesterfield',
          capacity: 3,
          emptyMsg:
            'A deep-buttoned leather Chesterfield dominates the room, its oxblood leather worn to a rich patina. Brass nailheads trace its curves.',
          occupiedMsg: '%s sunk into the Chesterfield.',
        },
      ],
    },

    '%A2_z28': {
      name: 'Smith Tower - 28th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -2,
      y: 11,
      z: 28,
      exits: {
        west: '%A1_z28',
        east: '%A3_z28',
        south: { room: '%EL_z28', door: '%D_A2_z28' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 28).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a brass four-poster bed', description: 'An ornate brass bed frame with spiraling posts and gear-shaped finials. The headboard features an inlaid clockwork design, hands frozen at midnight. Heavy velvet curtains can be drawn around it.', quality: 'nice' },
        { prototype: 'furniture', name: 'a porthole closet', description: 'The closet doors are fitted with brass porthole windows, their glass thick and beveled. Through them, you glimpse empty brass hooks and dusty shelving.', boltedDown: true },
        { prototype: 'table', name: 'a steamer trunk nightstand', description: 'A battered leather steamer trunk serves as a nightstand, its brass fittings tarnished but intact. Travel stickers from airship lines peel at the corners.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the brass four-poster',
          capacity: 2,
          emptyMsg:
            'The brass bed gleams dully, velvet curtains half-drawn.',
          occupiedMsg: '%s reclining on the four-poster.',
        },
      ],
    },

    '%A3_z28': {
      name: 'Smith Tower - 28th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -1,
      y: 11,
      z: 28,
      exits: { west: '%A2_z28' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 28).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a copper galley kitchen', description: 'Hammered copper countertops and a deep farmhouse sink gleam beneath a rack of hanging brass pots. The gas range features ornate iron grates and porcelain knobs.', boltedDown: true },
        { prototype: 'table', name: 'a drafting table', description: 'A large drafting table with brass adjustment mechanisms holds yellowed blueprints of impossible machines. An articulated brass lamp is clamped to one edge.', boltedDown: false },
        { prototype: 'furniture', name: 'a brass telescope on tripod', description: 'A magnificent brass telescope stands on a mahogany tripod near the window, its lens cap missing. The focusing mechanism turns smoothly despite its age.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a leather campaign daybed',
          capacity: 2,
          emptyMsg:
            'A folding campaign daybed with leather straps and brass fittings sits against the wall, ready to collapse for transport.',
          occupiedMsg: '%s stretched out on the campaign daybed.',
        },
        {
          name: 'a swivel drafting stool',
          capacity: 1,
          emptyMsg:
            'A wooden stool with a brass swivel mechanism sits at the drafting table.',
          occupiedMsg: '%s perched at the drafting table.',
        },
      ],
    },

    '%B1_z28': {
      name: 'Smith Tower - 28th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: 0,
      y: 11,
      z: 28,
      exits: { south: '%B2_z28' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 28).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a brass spiral ladder', description: 'A spiral ladder of wrought iron and brass leads up to the sleeping loft, its steps worn smooth from decades of use. Gear-shaped brackets anchor it to the ceiling.', boltedDown: true },
        { prototype: 'bed', name: 'a dirigible-style loft bed', description: 'The loft bed is suspended from the ceiling by brass chains, its frame shaped like an airship gondola. Canvas and leather straps form the sleeping surface.', quality: 'standard' },
        { prototype: 'furniture', name: 'a tufted leather settee', description: 'A Victorian settee upholstered in distressed brown leather sits beneath the loft, brass casters on its feet. The tufting is held by brass buttons.', boltedDown: false },
        { prototype: 'table', name: 'a gear-topped side table', description: 'A small table made from a massive gear wheel mounted on iron pipe legs. The teeth have been filed smooth around the edges.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the leather settee',
          capacity: 2,
          emptyMsg:
            'The settee waits beneath the suspended loft bed, leather creaking softly.',
          occupiedMsg: '%s settled into the settee.',
        },
        {
          name: 'the dirigible loft bed',
          capacity: 1,
          emptyMsg:
            'The gondola-style loft bed sways almost imperceptibly on its brass chains.',
          occupiedMsg: '%s suspended in the loft bed above.',
        },
      ],
    },

    '%C1_z28': {
      name: 'Smith Tower - 28th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -3,
      y: 10,
      z: 28,
      exits: { south: '%C2_z28', east: '%EL_z28' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 28).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a folding brass cot', description: 'A compact brass-framed cot folds against the wall when not in use. Canvas stretched over the frame serves as the sleeping surface, military-efficient.', quality: 'cheap' },
        { prototype: 'furniture', name: 'a gauge cluster', description: 'A brass panel mounted on the wall displays a cluster of gauges and dials—pressure, temperature, humidity—their needles all frozen at different positions.', boltedDown: true },
        { prototype: 'furniture', name: 'brass coat pegs', description: 'A row of brass pegs shaped like gear teeth juts from the wall, designed for hanging coats and bags. One holds a dusty leather aviator cap.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the brass cot',
          capacity: 1,
          emptyMsg:
            'The folding cot is deployed, canvas taut across its brass frame.',
          occupiedMsg: '%s resting on the cot.',
        },
      ],
    },

    '%B2_z28': {
      name: 'Smith Tower - 28th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -1,
      y: 10,
      z: 28,
      exits: {
        north: '%B1_z28',
        east: '%B3_z28',
        west: { room: '%EL_z28', door: '%D_B2_z28' },
        south: '%B4_z28',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 28).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a massive leather sectional', description: 'An L-shaped sectional upholstered in tobacco-brown leather dominates the room. Brass rivets trace every seam, and the armrests are wide enough to set a drink on.', boltedDown: false },
        { prototype: 'table', name: 'an aviator trunk coffee table', description: 'A large steamer trunk reinforced with brass straps and corners serves as a coffee table. Faded airship line labels cover its leather surface.', boltedDown: false },
        { prototype: 'furniture', name: 'a clockwork entertainment cabinet', description: 'A tall mahogany cabinet with brass trim houses a complex arrangement of gears and cylinders behind beveled glass doors—some sort of automated music machine, long silent.', boltedDown: true },
        { prototype: 'furniture', name: 'an iron coat tree', description: 'A cast iron coat tree shaped like a stylized gas lamp stands near the entrance, its hooks shaped like small gears.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the leather sectional',
          capacity: 4,
          emptyMsg:
            'The massive sectional sprawls across the room, leather gleaming dully.',
          occupiedMsg: '%s sunk deep into the sectional.',
        },
      ],
    },

    '%B3_z28': {
      name: 'Smith Tower - 28th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: 0,
      y: 10,
      z: 28,
      exits: { west: '%B2_z28' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 28).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'floor-to-ceiling brass shelving', description: 'Industrial brass shelving with adjustable gear-track brackets lines the walls. Leather-bound volumes and mechanical curiosities fill every shelf.', boltedDown: true },
        { prototype: 'table', name: 'a roll-top writing desk', description: 'An oak roll-top desk with brass drawer pulls sits in the window bay. The tambour cover is half-open, revealing a chaos of yellowed papers and brass implements.', boltedDown: false },
        { prototype: 'chair', name: 'a wingback reading chair', description: 'A high-backed chair upholstered in bottle-green leather sits angled toward the light. Brass nailheads outline its shape, and the armrests are worn smooth.', boltedDown: false },
        { prototype: 'furniture', name: 'a Tesla coil lamp', description: 'A decorative lamp shaped like a miniature Tesla coil stands on a side table, its glass globe dark. The brass base is engraved with lightning motifs.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the wingback chair',
          capacity: 1,
          emptyMsg:
            'The green leather wingback awaits a reader, positioned for optimal light.',
          occupiedMsg: '%s ensconced in the reading chair.',
        },
        {
          name: 'the desk chair',
          capacity: 1,
          emptyMsg:
            'A swivel chair with brass casters sits at the roll-top desk.',
          occupiedMsg: '%s seated at the writing desk.',
        },
      ],
    },

    '%C2_z28': {
      name: 'Smith Tower - 28th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -3,
      y: 9,
      z: 28,
      exits: { north: '%C1_z28', east: '%C3_z28' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 28).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a button-tufted loveseat', description: 'A compact loveseat upholstered in burgundy velvet faces the window, its button-tufted back held by brass buttons. The legs are carved to resemble gas pipes.', boltedDown: false },
        { prototype: 'table', name: 'a brass lamp table', description: 'A small round table holds an Edison bulb lamp with exposed filament, its brass base shaped like a miniature boiler.', boltedDown: false },
        { prototype: 'furniture', name: 'a steam radiator', description: 'An ornate cast iron steam radiator with decorative brass fittings dominates one corner. Despite decades of disuse, the pipes still gurgle occasionally.', boltedDown: true },
        { prototype: 'furniture', name: 'brass porthole mirrors', description: 'Three porthole-shaped mirrors with thick brass frames are mounted in a row along one wall, their glass slightly warped with age.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the velvet loveseat',
          capacity: 2,
          emptyMsg:
            'The burgundy loveseat catches the fading afternoon light through the windows.',
          occupiedMsg: '%s squeezed onto the loveseat.',
        },
      ],
    },

    '%C3_z28': {
      name: 'Smith Tower - 28th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -2,
      y: 9,
      z: 28,
      exits: {
        north: { room: '%EL_z28', door: '%D_C3_z28' },
        west: '%C2_z28',
        east: '%C4_z28',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 28).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a leather club bench', description: 'A low bench upholstered in cracked brown leather sits against the wall, brass studs tracing its edges. Perfect for removing boots.', boltedDown: false },
        { prototype: 'furniture', name: 'a brass umbrella stand', description: 'A cylindrical brass umbrella stand shaped like an artillery shell casing stands by the door. A forgotten walking stick with a gear-shaped handle leans inside.', boltedDown: false },
        { prototype: 'furniture', name: 'pneumatic tube terminus', description: 'A brass pneumatic tube terminus is mounted on the wall, its capsule door hanging open. The tube runs up into the ceiling, part of some long-defunct message system.', boltedDown: true },
        { prototype: 'table', name: 'a console table with brass inlay', description: 'A narrow mahogany console table with brass gear inlays holds a tarnished silver calling card tray.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the leather bench',
          capacity: 2,
          emptyMsg:
            'The leather bench offers a seat while you deal with footwear.',
          occupiedMsg: '%s sitting on the entry bench.',
        },
      ],
    },

    '%C4_z28': {
      name: 'Smith Tower - 28th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -1,
      y: 9,
      z: 28,
      exits: { west: '%C3_z28' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 28).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'an iron canopy bed', description: 'A bed frame of wrought iron with brass joints fills the alcove, its canopy frame designed to hold mosquito netting or curtains. Velvet drapes hang heavy and dust-laden.', quality: 'nice' },
        { prototype: 'furniture', name: 'a brass valet stand', description: 'A standing valet with brass hooks and a trouser bar stands ready to receive a gentleman\'s attire. The wood is dark mahogany, polished smooth.', boltedDown: false },
        { prototype: 'furniture', name: 'a riveted porthole mirror', description: 'A large oval mirror set in a frame of riveted brass plates hangs on the wall, its surface slightly oxidized around the edges.', boltedDown: true },
        { prototype: 'table', name: 'a mechanical nightstand', description: 'A nightstand with a flip-top lid and internal compartments features tiny brass gears visible through a glass panel on its side. A pocket watch could be wound by the mechanism—once.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the iron canopy bed',
          capacity: 2,
          emptyMsg:
            'The canopy bed waits in its alcove, velvet drapes dusty but intact.',
          occupiedMsg: '%s resting behind the bed curtains.',
        },
      ],
    },

    '%B4_z28': {
      name: 'Smith Tower - 28th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: 0,
      y: 9,
      z: 28,
      exits: { north: '%B2_z28' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 28).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a fold-down brass bed', description: 'A Murphy-style bed with a brass frame folds down from an elaborate wall cabinet. The cabinet face is decorated with embossed gear patterns and leather straps hold the bed in place when stowed.', quality: 'standard' },
        { prototype: 'furniture', name: 'a clockwork wall cabinet', description: 'The wall cabinet that houses the fold-down bed features exposed clockwork on one side—a complex arrangement of gears and springs that assists with raising and lowering the bed.', boltedDown: true },
        { prototype: 'furniture', name: 'built-in brass shelving', description: 'Brass-framed shelving is built into the walls, each shelf adjustable via gear-track mechanisms. Technical manuals and brass instruments occupy most spaces.', boltedDown: true },
        { prototype: 'table', name: 'a fold-out writing surface', description: 'A hinged writing surface folds out from the wall, supported by brass chains. When not in use, it lies flat against the wall, secured by leather straps.', boltedDown: true },
        { prototype: 'furniture', name: 'a brass-bound wardrobe', description: 'A narrow wardrobe reinforced with brass corner brackets and leather straps stands in the corner. Its mirror is beveled and slightly foxed.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the brass Murphy bed',
          capacity: 2,
          emptyMsg:
            'The brass bed is folded down from its cabinet, gears visible through the mechanism panel.',
          occupiedMsg: '%s stretched out on the fold-down bed.',
        },
      ],
    },
  },
};
