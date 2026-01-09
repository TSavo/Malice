// Colman Building - Floor 1 (z=1)
// Residential floor with small apartment units

export const building = {
  rooms: {
    '%E': {
      // Elevator placeholder
      prototype: 'elevator',
      exits: { out: '%F1_LOBBY' },
    },

    // ═══════════════════════════════════════════════════════════════════
    // FLOOR 1: Residential Units
    // ═══════════════════════════════════════════════════════════════════

    '%F1_LOBBY': {
      name: 'Colman Building - Floor 1 - Elevator Landing',
      description: `A small landing with worn carpet and brass fixtures. The walls are painted institutional green, chipped at the edges. A fire extinguisher hangs on the wall, its gauge showing FULL. The air smells of cooking oil and laundry detergent.`,
      x: -12,
      y: -2,
      z: 1,
      population: 0,
      ambientNoise: 6,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%F1_UNIT_A',
        south: '%F1_UNIT_C',
        east: '%F1_UNIT_B',
        west: '%F1_HALL',
        in: '%E',
      },
      elevatorId: '%E',
      methods: {
        onContentArrived: `
          const obj = args[0];
          if (!obj?.registerVerb) return;
          await obj.registerVerb(
            ['call elevator', 'summon elevator', 'press elevator button'],
            self,
            'callElevator'
          );
        `,
        onContentLeaving: `
          const obj = args[0];
          if (obj?.unregisterVerbsFrom) {
            await obj.unregisterVerbsFrom(self.id);
          }
        `,
        callElevator: `
          const player = args[0];
          const floorNumber = 1;
          const elevatorId = self.elevatorId || null;

          if (!elevatorId) {
            return 'The call button clicks uselessly. No power.';
          }

          const elevator = await $load(elevatorId);
          if (!elevator) {
            return 'Nothing answers the button press.';
          }

          if (elevator.currentFloor === floorNumber) {
            if (!elevator.doorsOpen && elevator.openDoors) {
              await elevator.openDoors();
            }
            return 'The elevator is already here.';
          }

          if (elevator.selectFloor) {
            const result = await elevator.selectFloor(player, floorNumber);
            return result?.message || 'You press the button. Machinery stirs above.';
          }

          return 'The button light flickers, but nothing happens.';
        `,
      },
    },

    '%F1_HALL': {
      name: 'Colman Building - Floor 1 - Main Hallway',
      description: `A narrow hallway with numbered apartment doors. The carpet is worn thin, showing the concrete beneath in places. Mail slots are built into each door, most overflowing with circulars. A single fluorescent tube buzzes overhead.`,
      x: -13,
      y: -2,
      z: 1,
      population: 0,
      ambientNoise: 4,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%F1_LOBBY',
      },
    },

    '%F1_UNIT_A': {
      name: 'Colman Building - Floor 1 - Unit A',
      description: `A small studio apartment with sloped ceilings and a single window overlooking the alley. The walls are painted white, stained yellow near the ceiling from old leaks. A Murphy bed is folded against one wall, and a hot plate sits on a Formica counter.`,
      x: -12,
      y: -1,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%F1_LOBBY',
      },
      objects: [
        { prototype: 'bed', name: 'a Murphy bed', description: 'A fold-down bed built into the wall, currently folded up to save space.', quality: 'cheap' },
        { prototype: 'furniture', name: 'a hot plate', description: 'A two-burner electric hot plate bolted to the counter, its coils glowing orange when in use.', boltedDown: true },
        { prototype: 'furniture', name: 'a metal chair', description: 'A simple metal folding chair, the kind used in cafeterias.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the metal chair',
          capacity: 1,
          emptyMsg: 'The metal chair sits by the window.',
          occupiedMsg: '%s sitting on the metal chair',
        },
      ],
    },

    '%F1_UNIT_B': {
      name: 'Colman Building - Floor 1 - Unit B',
      description: `A one-bedroom apartment with built-in bunk beds and minimal furnishings. The lower bunk holds a thin mattress, while the upper is stacked with storage boxes. A small refrigerator hums in the corner, its door held shut with duct tape.`,
      x: -11,
      y: -2,
      z: 1,
      population: 0,
      ambientNoise: 4,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%F1_LOBBY',
      },
      objects: [
        { prototype: 'bed', name: 'bunk beds', description: 'Built-in bunk beds with metal frames. The lower bunk has a mattress, the upper is used for storage.', quality: 'cheap', boltedDown: true },
        { prototype: 'furniture', name: 'a mini refrigerator', description: 'A small refrigerator with a dented door, held shut with duct tape.', boltedDown: false },
        { prototype: 'furniture', name: 'storage boxes', description: 'Cardboard boxes stacked on the upper bunk, containing personal belongings.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the lower bunk',
          capacity: 1,
          emptyMsg: 'The lower bunk awaits its occupant.',
          occupiedMsg: '%s sitting on the lower bunk',
        },
      ],
    },

    '%F1_UNIT_C': {
      name: 'Colman Building - Floor 1 - Unit C',
      description: `A corner apartment with windows on two sides, offering views of both the avenue and the alley. The space is divided by a partial wall, creating a sleeping alcove. A card table serves as both dining and work surface.`,
      x: -12,
      y: -3,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%F1_LOBBY',
      },
      objects: [
        { prototype: 'table', name: 'a card table', description: 'A folding card table that serves as dining and work space.', boltedDown: false },
        { prototype: 'furniture', name: 'a sleeping alcove', description: 'A partial wall creates a sleeping nook with a foam mattress on the floor.', boltedDown: true },
        { prototype: 'furniture', name: 'milk crates', description: 'Plastic milk crates serve as shelves and storage.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the card table',
          capacity: 2,
          emptyMsg: 'The card table has two folding chairs.',
          occupiedMsg: '%s sitting at the card table',
        },
      ],
    },
  },
};