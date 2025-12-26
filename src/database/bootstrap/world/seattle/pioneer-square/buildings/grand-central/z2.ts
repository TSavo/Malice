// Grand Central Arcade - Second Floor (z=2)
// Rentable hotel rooms from the 1897 conversion

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR (shared reference)
    // ═══════════════════════════════════════════════════════════════════

    '%GC_E': {
      prototype: 'elevator',
      exits: {
        out: '%GC_HALL_2',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // RENTABLE LOCKS AND DOORS
    // ═══════════════════════════════════════════════════════════════════

    '%GC_RL_1': {
      prototype: 'rentableLock',
      name: 'Room 201 Lock',
      description:
        'An antique mortise lock on the door of Room 201. The brass is tarnished but the mechanism still works.',
      price: 500,
      duration: 2678400000, // 1 month
    },
    '%GC_D_1': {
      prototype: 'door',
      name: 'Room 201 Door',
      description: 'A solid oak door with a brass number plate reading 201.',
      locked: true,
      open: false,
      locks: ['%GC_RL_1'],
    },

    '%GC_RL_2': {
      prototype: 'rentableLock',
      name: 'Room 202 Lock',
      description:
        'A brass mortise lock on Room 202, well-worn but functional.',
      price: 500,
      duration: 2678400000,
    },
    '%GC_D_2': {
      prototype: 'door',
      name: 'Room 202 Door',
      description: 'An oak door with 202 in tarnished brass numerals.',
      locked: true,
      open: false,
      locks: ['%GC_RL_2'],
    },

    '%GC_RL_3': {
      prototype: 'rentableLock',
      name: 'Room 203 Lock',
      description:
        'The lock on Room 203, its keyhole worn smooth by decades of use.',
      price: 500,
      duration: 2678400000,
    },
    '%GC_D_3': {
      prototype: 'door',
      name: 'Room 203 Door',
      description: 'A heavy oak door marked 203.',
      locked: true,
      open: false,
      locks: ['%GC_RL_3'],
    },

    '%GC_RL_4': {
      prototype: 'rentableLock',
      name: 'Room 204 Lock',
      description: 'A functional lock on the door of Room 204.',
      price: 500,
      duration: 2678400000,
    },
    '%GC_D_4': {
      prototype: 'door',
      name: 'Room 204 Door',
      description: "Room 204's door, its oak panels darkened with age.",
      locked: true,
      open: false,
      locks: ['%GC_RL_4'],
    },

    '%GC_RL_5': {
      prototype: 'rentableLock',
      name: 'Room 205 Lock',
      description: 'The lock for Room 205, one of the cheaper corner rooms.',
      price: 500,
      duration: 2678400000,
    },
    '%GC_D_5': {
      prototype: 'door',
      name: 'Room 205 Door',
      description: 'A plain door with 205 painted rather than plated.',
      locked: true,
      open: false,
      locks: ['%GC_RL_5'],
    },

    '%GC_RL_6': {
      prototype: 'rentableLock',
      name: 'Room 206 Lock',
      description: 'A brass lock on Room 206, positioned near the elevator.',
      price: 500,
      duration: 2678400000,
    },
    '%GC_D_6': {
      prototype: 'door',
      name: 'Room 206 Door',
      description: 'The door to Room 206, closest to the elevator landing.',
      locked: true,
      open: false,
      locks: ['%GC_RL_6'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // SOUTH ROW (y=+2): Room 5, Hall 2S, Room 6, Stairs 2
    // ═══════════════════════════════════════════════════════════════════

    '%GC_STAIRS_2': {
      name: 'Grand Central - Second Floor Stairwell',
      description: `The stairwell's second-floor landing, where the iron stairs turn and continue upward to the roof. Water damage is extensive here—the ceiling above shows dark stains, and a bucket on the landing catches an intermittent drip. The air smells of wet plaster and age.

Looking up, the third floor is visible but concerning. The stairs continue, but the landing above shows signs of structural damage—cracked supports, a visible sag in the floor. A hand-painted sign reads ROOF ACCESS - CAUTION - UNSTABLE.

Looking down, the first-floor stairwell is visible through the iron grating. The way down is clear; the way up requires faith.`,
      x: -10,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 10,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%GC_STAIRS_1',
        up: '%GC_ROOF_ACCESS',
        north: '%GC_HALL_2',
        west: '%GC_HALL_2S',
      },
    },

    '%GC_HALL_2S': {
      name: 'Grand Central - South Hall',
      description: `The southern segment of the second-floor corridor, connecting the hotel rooms to the stairwell. The hallway is narrow, barely wide enough for two people to pass. Wallpaper—a faded floral pattern in burgundy and gold—peels in strips, revealing older paper beneath, and older still beneath that.

Gas light fixtures converted to electric line the walls, their bulbs dead but shades intact. A threadbare carpet runner muffles footsteps, its original pattern lost to decades of traffic. Room numbers are painted on the doors in gilt that has mostly flaked away.

A window at the corridor's end looks out onto an airshaft between buildings—a view of brick and drainpipes and the accumulated debris of a century.`,
      x: -12,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 6,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GC_STAIRS_2',
        west: '%GC_ROOM_5',
        north: '%GC_HALL_2',
      },
    },

    '%GC_ROOM_5': {
      name: 'Grand Central - Room 205',
      description: `A corner hotel room at the building's southwest, small but with two windows. The room contains what every residential hotel room contained in 1897: an iron bed frame (mattress rotted to springs and stuffing), a washstand with a cracked porcelain basin, a wardrobe with a missing door, and a single wooden chair.

The wallpaper is the same burgundy floral as the hallway, faded to near-pink near the windows. A framed print hangs askew—a pastoral scene of sheep and shepherds, utterly disconnected from urban Seattle.

Personal effects are absent, but the room shows signs of occupation at various points. Names and dates carved into the bed frame. A collection of bottle caps in the washstand basin. Candle wax pooled on the windowsill.`,
      x: -13,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 4,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        out: { room: '%GC_HALL_2S', door: '%GC_D_5', locks: ['%GC_RL_5'] },
      },
      sittables: [
        {
          name: 'an iron bed frame',
          capacity: 2,
          emptyMsg:
            'An iron bed frame sits against the wall, its mattress long since rotted to springs and stuffing.',
          occupiedMsg: '%s resting on the bed frame',
        },
        {
          name: 'a wooden chair',
          capacity: 1,
          emptyMsg: 'A single wooden chair sits by the window.',
          occupiedMsg: '%s sitting in the chair',
        },
      ],
    },

    '%GC_ROOM_6': {
      name: 'Grand Central - Room 206',
      description: `A hotel room adjacent to the elevator, the most convenient location on this floor. The proximity to the elevator meant this was either premium or cursed, depending on how well the machinery slept. The walls still vibrate faintly when the elevator moves.

The room is slightly larger than the corner units, with space for a small desk in addition to the standard bed and washstand. The desk remains—a writing table with an inkwell stand (empty) and a blotter (stained). Someone spent time here writing, once.

A transom window above the door provided ventilation; it's jammed open now, letting sounds from the hallway filter in. The main window overlooks S. Main Street, offering a view of the ornate archway that marks the building's entrance below.`,
      x: -11,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 8,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        out: { room: '%GC_HALL_2S', door: '%GC_D_6', locks: ['%GC_RL_6'] },
      },
      sittables: [
        {
          name: 'an iron bed',
          capacity: 2,
          emptyMsg: 'An iron-framed bed sits against the interior wall.',
          occupiedMsg: '%s on the bed',
        },
        {
          name: 'a writing desk chair',
          capacity: 1,
          emptyMsg: 'A wooden chair is pushed under the writing desk.',
          occupiedMsg: '%s sitting at the desk',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // MIDDLE ROW (y=+3): Room 3, Hall 2, Room 4, Bath
    // ═══════════════════════════════════════════════════════════════════

    '%GC_ROOM_3': {
      name: 'Grand Central - Room 203',
      description: `An interior room on the building's western side, its single window looking out onto an airshaft. The room is dark even at midday, dependent on artificial light that no longer exists. A candle stub in a brass holder on the washstand suggests how previous occupants coped.

The room is small—six paces by four—with just enough space for the narrow bed, the washstand, and a person changing clothes. The wardrobe is built into the wall, a space-saving measure from an era when hotel rooms were measured in pennies per night.

Strangely, this room is in better condition than its neighbors. The wallpaper is intact, the floor unwarped. Someone maintained it, or used it, more recently than the others. A faint smell of tobacco smoke lingers, though that might be imagination.`,
      x: -13,
      y: 3,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        out: { room: '%GC_HALL_2', door: '%GC_D_3', locks: ['%GC_RL_3'] },
      },
      sittables: [
        {
          name: 'a narrow bed',
          capacity: 1,
          emptyMsg: 'A narrow iron bed occupies most of the room.',
          occupiedMsg: '%s lying on the narrow bed',
        },
      ],
    },

    '%GC_HALL_2': {
      name: 'Grand Central - Second Floor Hall',
      description: `The main corridor of Grand Central's hotel floor, running the length of the building with rooms branching off on both sides. The ceiling is pressed tin, painted cream that has aged to tobacco brown. The walls are the inevitable burgundy floral, punctuated by doors every few paces.

The elevator stands at the corridor's eastern end, its brass cage gate visible through an archway. A call button beside the arch still glows faintly—the building's mysterious power supply serving even here.

The hallway floor is hardwood beneath the carpet runner, creaking with each step in patterns that could probably be mapped and memorized. No one walks quietly on this floor.`,
      x: -12,
      y: 3,
      z: 2,
      population: 0,
      ambientNoise: 8,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: { room: '%GC_ROOM_3', door: '%GC_D_3', locks: ['%GC_RL_3'] },
        east: { room: '%GC_ROOM_4', door: '%GC_D_4', locks: ['%GC_RL_4'] },
        south: '%GC_HALL_2S',
        north: '%GC_HALL_2N',
        in: '%GC_E',
      },
      methods: {
        onContentArrived: `
          const obj = args[0];
          if (!obj?.registerVerb) return;
          await obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button', 'press button'], self, 'callElevator');
        `,
        onContentLeaving: `
          const obj = args[0];
          if (obj?.unregisterVerbsFrom) {
            await obj.unregisterVerbsFrom(self.id);
          }
        `,
        callElevator: `
          const player = args[0];
          const floorNumber = 2;
          const elevator = self.elevator || null;

          if (!elevator) {
            return 'The call button clicks uselessly. No power.';
          }

          if (elevator.currentFloor === floorNumber) {
            if (!elevator.doorsOpen && elevator.openDoors) {
              await elevator.openDoors();
            }
            return 'The elevator is already here.';
          }

          if (elevator.selectFloor) {
            const result = await elevator.selectFloor(player, floorNumber);
            return result?.message || 'You press the button. The elevator machinery engages somewhere in the shaft.';
          }

          return 'The button clicks, but nothing happens.';
        `,
      },
      elevatorId: '%GC_E',
    },

    '%GC_ROOM_4': {
      name: 'Grand Central - Room 204',
      description: `A hotel room on the building's eastern side, its window overlooking the alley between Grand Central and the neighboring building. The view is a brick wall, close enough that you could pass objects to someone in the opposite window—if anyone lived there, which they don't.

This room shows signs of violence. The bed frame is bent, one leg broken. The washstand is overturned. A dark stain on the floor might be old blood, or might be something spilled decades ago. Either way, it adds to the room's atmosphere of unease.

Despite the damage, the room is fundamentally sound. The floor is solid, the ceiling intact, the window functional. Someone could live here. Someone probably has, despite what happened to leave those stains.`,
      x: -11,
      y: 3,
      z: 2,
      population: 0,
      ambientNoise: 4,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        out: { room: '%GC_HALL_2', door: '%GC_D_4', locks: ['%GC_RL_4'] },
      },
      sittables: [
        {
          name: 'a damaged bed',
          capacity: 2,
          emptyMsg: 'A bent iron bed frame sits at an angle, one leg broken.',
          occupiedMsg: '%s on the tilted bed',
        },
      ],
    },

    '%GC_BATH': {
      name: 'Grand Central - Communal Bathroom',
      description: `The second floor's shared bathroom, a concession to the building's 1897 conversion from offices to hotel. Three claw-foot tubs line one wall, their porcelain stained but intact. Brass fixtures—dry now—protrude from the wall above each tub.

A row of sinks faces the tubs, each with its own cracked mirror above. The mirrors create a strange effect, reflecting reflections into infinity, multiplying the decay.

The floor is hexagonal tile, black and white, missing in patches but surprisingly clean where it remains. A drain in the center suggests this room was regularly flooded for cleaning. Now it just collects dust and the occasional pigeon feather that drifts in through a broken window.`,
      x: -10,
      y: 3,
      z: 2,
      population: 0,
      ambientNoise: 6,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GC_HALL_2',
        north: '%GC_LINEN',
      },
      sittables: [
        {
          name: 'a claw-foot tub',
          capacity: 1,
          emptyMsg:
            'Three claw-foot tubs line the wall, their porcelain stained yellow-brown.',
          occupiedMsg: '%s sitting in one of the dry tubs',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // NORTH ROW (y=+4): Room 1, Hall 2N, Room 2, Linen
    // ═══════════════════════════════════════════════════════════════════

    '%GC_ROOM_1': {
      name: 'Grand Central - Room 201',
      description: `The northwest corner room, the largest and once most expensive on the hotel floor. Two windows provide views of Washington Street and the buildings to the north. The room has space for actual furniture: the standard bed and washstand, but also a settee and a small table with two chairs.

The settee remains, its velvet upholstery rotted to threads that reveal the horsehair stuffing beneath. The table is gone—probably burned for fuel at some point. The chairs remain, spindly Victorian things with cane seats that have given way to holes.

Crown molding decorates the ceiling, water-stained but intact. This was where businessmen stayed when visiting Seattle, where drummers unpacked their sample cases, where deals were made over cigars and whiskey. Now it's just another box with a number.`,
      x: -13,
      y: 4,
      z: 2,
      population: 0,
      ambientNoise: 5,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        out: { room: '%GC_HALL_2N', door: '%GC_D_1', locks: ['%GC_RL_1'] },
      },
      sittables: [
        {
          name: 'a rotted settee',
          capacity: 2,
          emptyMsg:
            'A Victorian settee molders against one wall, its velvet rotted to reveal horsehair beneath.',
          occupiedMsg: '%s reclining on the decrepit settee',
        },
        {
          name: 'a cane-seat chair',
          capacity: 1,
          emptyMsg:
            'A spindly chair with a hole in its cane seat sits by the window.',
          occupiedMsg: '%s perched carefully on the broken chair',
        },
        {
          name: 'an iron bed',
          capacity: 2,
          emptyMsg: "A larger iron bed frame occupies the room's center.",
          occupiedMsg: '%s on the bed',
        },
      ],
    },

    '%GC_HALL_2N': {
      name: 'Grand Central - North Hall',
      description: `The northern segment of the second-floor corridor, ending at a window that looks down toward the arcade's glass-roofed atrium. The view is striking—you can see the iron framework from above, the pattern of surviving and missing glass panels, the central fountain far below.

The hallway here is darker than the southern section, the window providing the only natural light. The wallpaper has been stripped away in places, revealing layers of older paper and bare plaster. Someone was looking for something in the walls, or hiding something.

The last door before the window leads to the linen storage—or what was linen storage when the hotel operated.`,
      x: -12,
      y: 4,
      z: 2,
      population: 0,
      ambientNoise: 6,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: { room: '%GC_ROOM_1', door: '%GC_D_1', locks: ['%GC_RL_1'] },
        east: { room: '%GC_ROOM_2', door: '%GC_D_2', locks: ['%GC_RL_2'] },
        south: '%GC_HALL_2',
      },
    },

    '%GC_ROOM_2': {
      name: 'Grand Central - Room 202',
      description: `A corner room at the building's northeast, with windows overlooking both Washington Street and the alley to the east. The view is better than most—you can see the street, the neighboring buildings, a slice of sky above the rooflines.

The room is unusual in that it's almost completely empty. No bed frame, no washstand, no furniture at all. Just bare floor, bare walls, and empty windows. Either someone removed everything, or this room was abandoned before it was ever furnished.

Marks on the floor suggest where a bed once stood. Holes in the walls show where hooks held pictures or mirrors. The room is a void, waiting to be filled by whoever claims it next.`,
      x: -11,
      y: 4,
      z: 2,
      population: 0,
      ambientNoise: 5,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        out: { room: '%GC_HALL_2N', door: '%GC_D_2', locks: ['%GC_RL_2'] },
      },
    },

    '%GC_LINEN': {
      name: 'Grand Central - Linen Storage',
      description: `A narrow room that once stored the hotel's linens—sheets, towels, tablecloths for a restaurant that may or may not have existed. Metal shelving lines the walls, still holding a few items: towels stiff with age and mildew, sheets that have become homes for mice, pillowcases that crumble at a touch.

The smell is intense—old fabric, mold, mouse droppings, the concentrated decay of a century's textiles. The floor is covered in debris that might once have been bedding.

A small window, high on the wall, provides minimal light. The room is oppressive, claustrophobic, filled with the ghosts of domestic labor. Maids hauled armloads up the stairs, made beds, replaced towels, and left no mark except these rotting remnants of their work.`,
      x: -10,
      y: 4,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%GC_BATH',
        west: '%GC_HALL_2N',
      },
    },
  },
};
