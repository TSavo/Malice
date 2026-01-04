// Smith Tower - Condo Floor (z=15)
// Industrial loft - exposed pipes, metal, reclaimed wood, factory fixtures

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z15' },
    },

    // Rentable locks
    '%RL_A2_z15': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z15': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z15': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z15': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z15'],
    },
    '%D_B2_z15': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z15'],
    },
    '%D_C3_z15': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z15'],
    },

    // Elevator landing
    '%EL_z15': {
      name: 'Smith Tower - 15th Floor - Elevator Landing',
      description:
        'A compact landing with scuffed brass trim and a single call panel.',
      x: -12,
      y: 10,
      z: 15,
      exits: {
        north: { room: '%A2_z15', door: '%D_A2_z15' },
        east: { room: '%B2_z15', door: '%D_B2_z15' },
        south: { room: '%C3_z15', door: '%D_C3_z15' },
        west: '%C1_z15',
        in: '%E',
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z15': {
      name: 'Smith Tower - 15th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors. A kitchenette occupies one wall, its appliances dark and silent. Built-in shelving holds the remnants of someone\'s life—books, decorative objects, a dead potted plant.',
      x: -13,
      y: 11,
      z: 15,
      exits: { east: '%A2_z15' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 15).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'table', name: 'a factory cart coffee table', description: 'An old factory cart has been repurposed as a coffee table, its cast iron wheels rusted but decorative. The wooden planks on top are scarred with industrial history.', boltedDown: false },
        { prototype: 'furniture', name: 'an industrial kitchenette', description: 'A kitchenette with brushed steel countertops and open pipe shelving runs along one wall. The exposed plumbing adds to the industrial aesthetic.', boltedDown: true },
        { prototype: 'furniture', name: 'pipe shelving unit', description: 'Floor-to-ceiling shelving made from black iron pipes and reclaimed barn wood holds an assortment of mechanical parts, old tools, and dusty mason jars.', boltedDown: true },
        { prototype: 'furniture', name: 'exposed ductwork', description: 'Large galvanized ductwork snakes across the ceiling, exposed and industrial. The metal is dented and patinated with age.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a distressed leather sofa',
          capacity: 3,
          emptyMsg:
            'A distressed brown leather sofa sits on hairpin legs, its cushions cracked but supple.',
          occupiedMsg: '%s lounging on the leather sofa.',
        },
        {
          name: 'a metal stool',
          capacity: 1,
          emptyMsg:
            'A swiveling metal shop stool sits near the kitchenette, its seat worn smooth.',
          occupiedMsg: '%s perched on the metal stool.',
        },
      ],
    },

    '%A2_z15': {
      name: 'Smith Tower - 15th Floor - North Suite - Bedroom',
      description:
        'A bright one-bedroom overlooking the skyline, hall-facing door to the south. A built-in closet with mirrored doors dominates one wall, its reflection multiplying the dusty light.',
      x: -12,
      y: 11,
      z: 15,
      exits: {
        west: '%A1_z15',
        east: '%A3_z15',
        south: { room: '%EL_z15', door: '%D_A2_z15' },
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 15).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a steel frame bed', description: 'A queen bed with an industrial steel pipe frame sits against exposed brick. The mattress is dressed in grey linen, utilitarian but comfortable.', quality: 'standard' },
        { prototype: 'furniture', name: 'a metal wardrobe', description: 'A tall metal wardrobe with mesh doors stands against the wall, the kind once used in factory locker rooms. A few garments hang inside.', boltedDown: true },
        { prototype: 'table', name: 'a reclaimed wood nightstand', description: 'A nightstand made from salvaged factory floor planks holds a gooseneck lamp with an Edison bulb and a few scattered coins.', boltedDown: false },
        { prototype: 'furniture', name: 'cast iron radiator', description: 'An ornate cast iron radiator stands beneath the window, its pipes exposed and painted matte black. It still radiates warmth.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the steel frame bed',
          capacity: 2,
          emptyMsg:
            'The industrial bed frame holds a surprisingly comfortable mattress.',
          occupiedMsg: '%s resting on the steel frame bed.',
        },
      ],
    },

    '%A3_z15': {
      name: 'Smith Tower - 15th Floor - North Suite - Studio',
      description:
        'A long studio with exposed brick and a narrow galley kitchen. The space is multipurpose—work area, living space, kitchen all compressed into one room.',
      x: -11,
      y: 11,
      z: 15,
      exits: { west: '%A2_z15' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 15).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'an industrial galley kitchen', description: 'A galley kitchen with stainless steel counters and open shelving runs along one wall. Commercial-grade fixtures hang from a ceiling-mounted pot rack.', boltedDown: true },
        { prototype: 'table', name: 'a workbench desk', description: 'A heavy workbench serves as a desk, its maple top scarred from decades of use. Metal drawers hang beneath, filled with miscellaneous hardware.', boltedDown: false },
        { prototype: 'furniture', name: 'a daybed frame', description: 'A daybed with a welded steel frame and canvas cushions serves as seating by day. The canvas is faded olive drab, military surplus perhaps.', boltedDown: false },
        { prototype: 'furniture', name: 'factory pendant lights', description: 'Green enamel factory pendant lights hang from the ceiling on black cords, their shades dented and chipped.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the daybed',
          capacity: 2,
          emptyMsg:
            'The canvas daybed offers industrial comfort beneath the pendant lights.',
          occupiedMsg: '%s stretched out on the daybed.',
        },
        {
          name: 'a shop stool',
          capacity: 1,
          emptyMsg:
            'A wooden shop stool sits at the workbench, its legs splattered with old paint.',
          occupiedMsg: '%s hunched over the workbench.',
        },
      ],
    },

    '%B1_z15': {
      name: 'Smith Tower - 15th Floor - East Suite - Loft',
      description:
        'A lofted corner with sloped ceiling beams and a compact mezzanine. The high ceilings make the small footprint feel larger. A wooden ladder leads up to the sleeping loft.',
      x: -10,
      y: 11,
      z: 15,
      exits: { south: '%B2_z15' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 15).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a steel mezzanine ladder', description: 'A welded steel ladder with crosshatched treads leads up to the sleeping mezzanine. The handrails are cold pipe.', boltedDown: true },
        { prototype: 'bed', name: 'a platform loft bed', description: 'A mattress rests on a steel-grate platform in the mezzanine, surrounded by exposed I-beams. Industrial and intimate.', quality: 'cheap' },
        { prototype: 'furniture', name: 'a Chesterfield sofa', description: 'A tufted leather Chesterfield sits beneath the mezzanine, incongruously elegant against the raw industrial space. The leather is cracked but dignified.', boltedDown: false },
        { prototype: 'table', name: 'a steel drum side table', description: 'A cleaned oil drum with a glass top serves as a side table, mechanical parts visible through the glass.', boltedDown: false },
        { prototype: 'furniture', name: 'exposed ceiling beams', description: 'Heavy timber ceiling beams are left exposed, their surfaces weathered and bolted together with industrial hardware.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the Chesterfield',
          capacity: 3,
          emptyMsg:
            'The leather Chesterfield offers unexpected refinement beneath the industrial beams.',
          occupiedMsg: '%s sunk into the Chesterfield.',
        },
        {
          name: 'the platform loft bed',
          capacity: 1,
          emptyMsg:
            'The loft bed platform is visible above, accessible by steel ladder.',
          occupiedMsg: '%s up on the mezzanine bed.',
        },
      ],
    },

    '%C1_z15': {
      name: 'Smith Tower - 15th Floor - South Suite - Alcove',
      description:
        'A snug unit tucked behind the shaft, with one frosted window. The space is barely larger than a closet, intimate or claustrophobic depending on your temperament.',
      x: -13,
      y: 10,
      z: 15,
      exits: { south: '%C2_z15', east: '%EL_z15' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 15).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a pallet bed', description: 'A mattress rests on stacked wooden shipping pallets, the industrial equivalent of a bed frame. A wool army blanket is folded at the foot.', quality: 'cheap' },
        { prototype: 'furniture', name: 'pipe coat hooks', description: 'Black iron pipe fittings form an industrial coat rack mounted to the wall, various hooks at different heights for bags and clothing.', boltedDown: true },
        { prototype: 'furniture', name: 'a mesh locker', description: 'A narrow wire mesh locker is bolted to the wall, the kind once used in factories. A padlock hangs open from the hasp.', boltedDown: true },
        { prototype: 'furniture', name: 'exposed conduit', description: 'Electrical conduit runs visibly along the walls, junction boxes exposed. Someone painted it all matte black.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the pallet bed',
          capacity: 1,
          emptyMsg:
            'The pallet bed offers bare-bones industrial sleeping.',
          occupiedMsg: '%s sprawled on the pallet bed.',
        },
      ],
    },

    '%B2_z15': {
      name: 'Smith Tower - 15th Floor - East Suite - Living Room',
      description:
        'A two-room suite with a west-facing door toward the elevator. This is clearly the main living space, larger than the other units on the floor.',
      x: -11,
      y: 10,
      z: 15,
      exits: {
        north: '%B1_z15',
        east: '%B3_z15',
        west: { room: '%EL_z15', door: '%D_B2_z15' },
        south: '%B4_z15',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 15).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a modular leather sectional', description: 'A massive modular sectional in worn cognac leather dominates the space, its steel legs bolted to reclaimed wood blocks.', boltedDown: true },
        { prototype: 'table', name: 'a pallet coffee table', description: 'A sanded shipping pallet on casters serves as a coffee table, its surface bearing the stamps of distant ports.', boltedDown: false },
        { prototype: 'furniture', name: 'an industrial media console', description: 'A console made from angle iron and barn wood holds a dead television and vintage stereo equipment. Vacuum tubes glow faintly in the components.', boltedDown: true },
        { prototype: 'furniture', name: 'a rolling garment rack', description: 'A chrome garment rack on wheels stands near the entrance, holding jackets and a few vintage work shirts.', boltedDown: false },
        { prototype: 'furniture', name: 'exposed brick wall', description: 'One wall is exposed brick, the mortar crumbling in places, industrial and raw.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the leather sectional',
          capacity: 4,
          emptyMsg:
            'The massive leather sectional offers industrial luxury.',
          occupiedMsg: '%s sunk deep into the leather sectional.',
        },
      ],
    },

    '%B3_z15': {
      name: 'Smith Tower - 15th Floor - East Suite - Den',
      description:
        'A narrow end unit with a bay of small windows and built-ins. This was clearly a home office or study, the walls lined with shelving.',
      x: -10,
      y: 10,
      z: 15,
      exits: { west: '%B2_z15' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 15).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'pipe and plank shelving', description: 'Industrial shelving made from black iron pipes and reclaimed scaffold planks lines the walls, holding technical manuals, old blueprints, and mechanical curiosities.', boltedDown: true },
        { prototype: 'table', name: 'a drafting table', description: 'A vintage drafting table with a cast iron base sits in the window bay, its surface adjustable. Architectural drawings are pinned to the surface.', boltedDown: false },
        { prototype: 'furniture', name: 'an articulated task lamp', description: 'A massive articulated task lamp clamps to the drafting table, its multiple joints allowing precise positioning.', boltedDown: false },
        { prototype: 'furniture', name: 'a factory floor lamp', description: 'A repurposed factory inspection lamp on a wheeled tripod stands in the corner, its cone shade directing light downward.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a drafting stool',
          capacity: 1,
          emptyMsg:
            'A tall drafting stool with a footrest ring sits at the table.',
          occupiedMsg: '%s perched at the drafting table.',
        },
        {
          name: 'a butterfly chair',
          capacity: 1,
          emptyMsg:
            'A leather butterfly chair on a welded frame offers casual seating.',
          occupiedMsg: '%s reclined in the butterfly chair.',
        },
      ],
    },

    '%C2_z15': {
      name: 'Smith Tower - 15th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting. The afternoon sun has bleached everything near the windows to a uniform pale.',
      x: -13,
      y: 9,
      z: 15,
      exits: { north: '%C1_z15', east: '%C3_z15' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 15).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a vintage factory bench', description: 'A long wooden bench salvaged from a factory break room sits against the wall, its surface worn smooth by generations of workers.', boltedDown: true },
        { prototype: 'table', name: 'a cable spool table', description: 'A large wooden cable spool serves as a side table, its industrial origins stamped into the wood.', boltedDown: false },
        { prototype: 'furniture', name: 'a steam radiator', description: 'An exposed cast iron steam radiator clanks and hisses beneath the window, its pipes running visibly along the baseboard.', boltedDown: true },
        { prototype: 'furniture', name: 'steel cable curtain rods', description: 'Aircraft cable stretched between wall-mounted cleats serves as curtain rods, holding canvas drop cloths instead of proper curtains.', boltedDown: true },
        { prototype: 'furniture', name: 'a metal storage trunk', description: 'A battered metal storage trunk sits beneath the window, its corners reinforced with riveted steel. Old shipping labels cover one side.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the factory bench',
          capacity: 3,
          emptyMsg:
            'The factory bench offers utilitarian seating along the wall.',
          occupiedMsg: '%s seated on the factory bench.',
        },
      ],
    },

    '%C3_z15': {
      name: 'Smith Tower - 15th Floor - South Suite - Foyer',
      description:
        'The single entrance to the C block, with a stout fire door to the elevator. A small entryway opens into the rest of the unit.',
      x: -12,
      y: 9,
      z: 15,
      exits: {
        north: { room: '%EL_z15', door: '%D_C3_z15' },
        west: '%C2_z15',
        east: '%C4_z15',
      },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 15).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'furniture', name: 'a canvas director\'s chair', description: 'A heavy-duty director\'s chair with a steel frame and black canvas sits near the entrance, the kind used on film sets.', boltedDown: false },
        { prototype: 'furniture', name: 'a gym locker', description: 'A narrow vintage gym locker is bolted to the wall, its vented door slightly ajar. The interior smells faintly of old metal.', boltedDown: true },
        { prototype: 'furniture', name: 'an industrial mail slot', description: 'A heavy brass mail slot with a steel flap is set into the fire door, industrial and functional.', boltedDown: true },
        { prototype: 'table', name: 'a sawbuck table', description: 'A small sawbuck table made from crossed wooden legs and a thick plank serves as a console, holding a tray of old keys and spare hardware.', boltedDown: false },
        { prototype: 'furniture', name: 'a coat hook board', description: 'A piece of reclaimed barn wood with mismatched vintage hooks serves as a coat rack, mounted at eye level.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the director\'s chair',
          capacity: 1,
          emptyMsg:
            'The canvas director\'s chair offers a place to sit while removing boots.',
          occupiedMsg: '%s seated in the director\'s chair.',
        },
      ],
    },

    '%C4_z15': {
      name: 'Smith Tower - 15th Floor - South Suite - Bedroom',
      description:
        'A deep plan with a recessed alcove and polished concrete floors. The industrial aesthetic is softened by remnants of personal touches.',
      x: -11,
      y: 9,
      z: 15,
      exits: { west: '%C3_z15' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 15).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a platform bed', description: 'A low platform bed made from welded steel angle iron and reclaimed timber fills the alcove. Heavy canvas curtains on a pipe rod can close off the sleeping area.', quality: 'standard' },
        { prototype: 'furniture', name: 'a pipe clothing rack', description: 'A freestanding clothing rack made from black iron pipes and industrial fittings serves as an open closet. Work shirts and denim hang from the crossbar.', boltedDown: false },
        { prototype: 'furniture', name: 'a factory window mirror', description: 'An old factory window frame with mirror glass mounted behind it hangs on the wall, the panes creating a grid of reflections.', boltedDown: true },
        { prototype: 'table', name: 'a machinist\'s cabinet', description: 'A small machinist\'s cabinet with tiny labeled drawers serves as a nightstand, each drawer meant for storing small parts. Now holds personal items.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the platform bed',
          capacity: 2,
          emptyMsg:
            'The low platform bed waits in its alcove, industrial curtains drawn back.',
          occupiedMsg: '%s resting on the platform bed.',
        },
      ],
    },

    '%B4_z15': {
      name: 'Smith Tower - 15th Floor - East Suite - Bedroom',
      description:
        'A compact end-cap with a single long window and built-in shelving. Every inch is utilized, the room a study in efficient living.',
      x: -10,
      y: 9,
      z: 15,
      exits: { north: '%B2_z15' },
      methods: {
        onContentArrived:
          "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving:
          'const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}',
        lookOutWindow:
          "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 15).';",
        onAnnounce:
          'const msg = args[0];\nawait self.tell("Through the window you notice below: " + msg);',
      },
      objects: [
        { prototype: 'bed', name: 'a wall-mounted fold-down bed', description: 'A heavy-duty fold-down bed on gas struts descends from a steel-framed wall cabinet. The mechanism is industrial, meant for a factory infirmary perhaps.', quality: 'standard' },
        { prototype: 'furniture', name: 'the bed cabinet', description: 'The bed folds up into a riveted steel cabinet painted industrial grey. Stenciled numbers mark the side.', boltedDown: true },
        { prototype: 'furniture', name: 'wire basket shelving', description: 'Industrial wire basket shelving is mounted to the walls, the kind used in warehouse storage. Various items are sorted into the mesh containers.', boltedDown: true },
        { prototype: 'table', name: 'a drop-leaf work table', description: 'A wall-mounted drop-leaf table with steel brackets serves as a desk when extended. Folded flat, it\'s nearly invisible.', boltedDown: true },
        { prototype: 'furniture', name: 'a steel tool cabinet', description: 'A narrow steel tool cabinet with many small drawers sits in the corner, each drawer labeled with embossed metal tags.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'the fold-down bed',
          capacity: 2,
          emptyMsg:
            'The industrial fold-down bed is lowered, ready for use.',
          occupiedMsg: '%s stretched out on the fold-down bed.',
        },
        {
          name: 'a machinist stool',
          capacity: 1,
          emptyMsg:
            'A low machinist stool on casters sits near the work table.',
          occupiedMsg: '%s perched on the machinist stool.',
        },
      ],
    },
  },
};
