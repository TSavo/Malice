// Zeitgeist Building - Third Floor (z=3)
// Artist lofts - live/work spaces

export const building = {
  name: 'Zeitgeist Building',
  x: -13,
  y: 1,
  width: 2,
  height: 2,
  floors: 5,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR (shared reference)
    // ═══════════════════════════════════════════════════════════════════

    '%E': {
      prototype: 'elevator',
      exits: {
        out: '%LOFT_LOBBY',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%LOCK_1': {
      prototype: 'rentableLock',
      name: 'Loft 1 Lock',
      description: 'A heavy-duty deadbolt with a worn keypad.',
      rentPeriodDays: 30,
      rentAmount: 250,
    },

    '%LOCK_2': {
      prototype: 'rentableLock',
      name: 'Loft 2 Lock',
      description: 'A heavy-duty deadbolt with a worn keypad.',
      rentPeriodDays: 30,
      rentAmount: 250,
    },

    '%LOCK_3': {
      prototype: 'rentableLock',
      name: 'Loft 3 Lock',
      description: 'A heavy-duty deadbolt with a worn keypad.',
      rentPeriodDays: 30,
      rentAmount: 250,
    },

    // ═══════════════════════════════════════════════════════════════════
    // DOORS
    // ═══════════════════════════════════════════════════════════════════

    '%DOOR_1': {
      prototype: 'door',
      name: 'Loft 1 Door',
      description: 'A heavy industrial door with a small window.',
      locked: true,
      open: false,
      locks: ['%LOCK_1'],
    },

    '%DOOR_2': {
      prototype: 'door',
      name: 'Loft 2 Door',
      description: 'A heavy industrial door with a small window.',
      locked: true,
      open: false,
      locks: ['%LOCK_2'],
    },

    '%DOOR_3': {
      prototype: 'door',
      name: 'Loft 3 Door',
      description: 'A heavy industrial door with a small window.',
      locked: true,
      open: false,
      locks: ['%LOCK_3'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // THIRD FLOOR (z=3) - ARTIST LOFTS
    // ═══════════════════════════════════════════════════════════════════

    '%LOFT_LOBBY': {
      name: 'Zeitgeist Building - Loft Level',
      description: `The third floor is residential—or what passes for residential in an artist building. The hallway is wider here than on the studio floor, the original warehouse space less subdivided. Three loft units occupy the floor, each a live/work hybrid that violates several building codes in the name of affordable rent.

A mail nook near the elevator holds three slots, each labeled with a loft number. The mail inside is old—catalogs, bills, the paper trail of lives interrupted. A community bulletin board displays faded posters for shows, calls for models, the social infrastructure of an art scene.

The freight elevator gate stands open. A metal fire escape on the east wall provides emergency egress—and, unofficially, roof access for those willing to climb.

A shared bathroom occupies a corner, its door marked GENDER NEUTRAL before that was common.`,
      x: -12,
      y: 1,
      z: 3,
      population: 0,
      ambientNoise: 5,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: { room: '%LOFT_1', door: '%DOOR_1', locks: ['%LOCK_1'] },
        east: { room: '%LOFT_2', door: '%DOOR_2', locks: ['%LOCK_2'] },
        west: { room: '%LOFT_3', door: '%DOOR_3', locks: ['%LOCK_3'] },
        down: '%STUDIO_LOBBY',
        up: '%ROOF_ACCESS',
        'in': '%E',
      },
      sittables: [
        {
          name: 'a hallway bench',
          capacity: 2,
          emptyMsg: 'A worn wooden bench sits by the mailboxes.',
          occupiedMsg: '%s sitting in the loft hallway',
        },
      ],
      methods: {
        onContentArrived: `
          const obj = args[0];
          if (!obj?.registerVerb) return;
          await obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button'], self, 'callElevator');
        `,
        onContentLeaving: `
          const obj = args[0];
          if (obj?.unregisterVerbsFrom) {
            await obj.unregisterVerbsFrom(self.id);
          }
        `,
        callElevator: `
          const player = args[0];
          const floorNumber = 3;
          const elevator = self.elevator || null;

          if (!elevator) {
            return 'The call button clicks uselessly. No power.';
          }

          if (elevator.currentFloor === floorNumber) {
            if (!elevator.doorsOpen && elevator.openDoors) {
              await elevator.openDoors();
            }
            return 'The elevator is already here at the loft level.';
          }

          if (elevator.selectFloor) {
            const result = await elevator.selectFloor(player, floorNumber);
            return result?.message || 'You press the button. The freight elevator shudders somewhere below.';
          }

          return 'The button clicks, but nothing responds.';
        `,
      },
      elevatorId: '%E',
    },

    '%LOFT_1': {
      name: 'Loft 1 - The Big One',
      description: `The largest of the three lofts, occupying the building's north side. The space is essentially one giant room with a sleeping loft built above the kitchen area, accessible by a ladder made from welded rebar. Industrial windows line the north wall, their frames painted shut decades ago.

The kitchen is minimal: a two-burner stove, a bar fridge, a sink that drains slowly. A partition wall of salvaged doors—mismatched sizes and colors—creates a semi-private sleeping nook beneath the loft. The bathroom is a corner affair, the shower just a curtain rod and drain in the floor.

Art covers every surface. Paintings lean against walls. Sculptures occupy corners. The inhabitant clearly couldn't stop making things, even in their living space. Whether they were successful or obsessed or both is visible in the accumulation.

A wood stove provides heat, its chimney jury-rigged through the window frame.`,
      x: -12,
      y: 2,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: { room: '%LOFT_LOBBY', door: '%DOOR_1', locks: ['%LOCK_1'] },
      },
      sittables: [
        {
          name: 'a sagging couch',
          capacity: 3,
          emptyMsg: 'A deeply sagging couch faces the windows, covered in blankets.',
          occupiedMsg: '%s sunk into the couch',
        },
        {
          name: 'kitchen stools',
          capacity: 2,
          emptyMsg: 'Metal stools sit at the kitchen counter.',
          occupiedMsg: '%s at the kitchen counter',
        },
        {
          name: 'a sleeping loft',
          capacity: 2,
          emptyMsg: 'A mattress on the sleeping loft is visible through the rebar railing.',
          occupiedMsg: '%s in the sleeping loft',
        },
      ],
    },

    '%LOFT_2': {
      name: 'Loft 2 - The Narrow One',
      description: `A narrower loft that makes up in height what it lacks in floor space. The ceiling soars here—the full height of the original warehouse—and someone built a two-level sleeping structure that looks more like scaffolding than furniture. The lower level is storage, the upper level is a mattress under a skylight.

The living area is efficient: a murphy bed folds against one wall, revealing a compact workspace when closed. A clothing rack serves as a closet. The kitchen is a hot plate and a mini-fridge, meals clearly an afterthought.

Bookshelves cover the south wall, floor to ceiling, filled with art books, philosophy texts, the collected paperbacks of someone who reads voraciously. A library ladder on a rail provides access to upper shelves. The collection suggests someone trying to understand everything, or at least everything related to making meaning in chaos.

A small balcony—really just a fire escape landing—connects to the east exterior.`,
      x: -11,
      y: 1,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: { room: '%LOFT_LOBBY', door: '%DOOR_2', locks: ['%LOCK_2'] },
      },
      sittables: [
        {
          name: 'a reading chair',
          capacity: 1,
          emptyMsg: 'A well-worn reading chair sits by the bookshelves.',
          occupiedMsg: '%s reading in the armchair',
        },
        {
          name: 'the murphy bed',
          capacity: 2,
          emptyMsg: 'The murphy bed is folded up, revealing a desk beneath.',
          occupiedMsg: '%s resting on the murphy bed',
        },
        {
          name: 'the loft bed',
          capacity: 1,
          emptyMsg: 'A mattress under the skylight occupies the upper loft.',
          occupiedMsg: '%s in the loft bed under the skylight',
        },
      ],
    },

    '%LOFT_3': {
      name: 'Loft 3 - The Shared One',
      description: `A corner loft clearly designed for multiple occupants—or one occupant with boundary issues. The space is divided by curtains on hospital tracks, creating zones that can be opened or closed depending on the needs of the moment. At full extension, it's four separate sleeping areas. Pulled back, it's one large room.

The kitchen is communal and well-equipped—the only proper kitchen in the building, with a four-burner stove, an actual oven, counter space. Whoever lived here cooked, really cooked, and probably fed the whole building. Spice jars line shelves. Cookware hangs from hooks.

A long dining table occupies the center of the space, mismatched chairs around it from various eras and styles. The table has seen arguments and celebrations and everyday meals and the slow accumulation of memory that objects acquire.

A bathroom off the kitchen is larger than the other units—a clawfoot tub, a separate shower, actual tiles.`,
      x: -13,
      y: 1,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: { room: '%LOFT_LOBBY', door: '%DOOR_3', locks: ['%LOCK_3'] },
      },
      sittables: [
        {
          name: 'the communal table',
          capacity: 8,
          emptyMsg: 'A long dining table surrounded by mismatched chairs dominates the space.',
          occupiedMsg: '%s seated at the communal table',
        },
        {
          name: 'sleeping nooks',
          capacity: 4,
          emptyMsg: 'Curtained sleeping areas line the walls.',
          occupiedMsg: '%s in one of the sleeping nooks',
        },
        {
          name: 'a kitchen bench',
          capacity: 2,
          emptyMsg: 'A wooden bench sits by the kitchen window.',
          occupiedMsg: '%s by the kitchen window',
        },
      ],
    },
  },

  postProcessors: [],
};
