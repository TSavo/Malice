// Colman Building - Floor 2 (z=2)
// Residential floor with varied apartment units

export const building = {
  rooms: {
    '%E': {
      // Elevator placeholder
      prototype: 'elevator',
      exits: { out: '%F2_LOBBY' },
    },

    // ═══════════════════════════════════════════════════════════════════
    // FLOOR 2: Residential Units
    // ═══════════════════════════════════════════════════════════════════

    '%F2_LOBBY': {
      name: 'Colman Building - Floor 2 - Elevator Landing',
      description: `A cramped landing with peeling wallpaper and scuffed baseboards. The carpet is threadbare, revealing the hardwood beneath. A bulletin board holds yellowed notices about building maintenance and tenant rules.`,
      x: -12,
      y: -2,
      z: 2,
      population: 0,
      ambientNoise: 5,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%F2_UNIT_A',
        south: '%F2_UNIT_C',
        east: '%F2_UNIT_B',
        west: '%F2_HALL',
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
          const floorNumber = 2;
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

    '%F2_HALL': {
      name: 'Colman Building - Floor 2 - Main Hallway',
      description: `A dimly lit hallway with apartment doors bearing faded numbers. The walls show water stains from old leaks, and the air smells of cooking spices and cigarette smoke. Emergency exit signs glow red at either end.`,
      x: -13,
      y: -2,
      z: 2,
      population: 0,
      ambientNoise: 5,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%F2_LOBBY',
      },
    },

    '%F2_UNIT_A': {
      name: 'Colman Building - Floor 2 - Unit A',
      description: `A one-room efficiency with a kitchenette in the corner and a sleeping loft above. The space is cluttered with personal belongings - clothes hanging from lines, books stacked on crates. A small window provides ventilation but little light.`,
      x: -12,
      y: -1,
      z: 2,
      population: 0,
      ambientNoise: 4,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%F2_LOBBY',
      },
      objects: [
        { prototype: 'furniture', name: 'a kitchenette', description: 'A small cooking area with a sink, mini-fridge, and two-burner stove.', boltedDown: true },
        { prototype: 'bed', name: 'a loft bed', description: 'A mattress on a platform loft, accessed by a wooden ladder.', quality: 'cheap', boltedDown: true },
        { prototype: 'furniture', name: 'clotheslines', description: 'Clotheslines strung across the room with laundry hanging to dry.', boltedDown: true },
        { prototype: 'furniture', name: 'book stacks', description: 'Piles of books and magazines serving as end tables.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'a wooden crate',
          capacity: 1,
          emptyMsg: 'A wooden crate serves as a makeshift chair.',
          occupiedMsg: '%s sitting on the wooden crate',
        },
      ],
    },

    '%F2_UNIT_B': {
      name: 'Colman Building - Floor 2 - Unit B',
      description: `A studio apartment with exposed brick walls and high ceilings. The space feels larger than it is due to the height. A futon is folded against one wall, and art prints are tacked to the brick. The floor is polished concrete, cold underfoot.`,
      x: -11,
      y: -2,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%F2_LOBBY',
      },
      objects: [
        { prototype: 'bed', name: 'a futon', description: 'A foldable futon that can serve as both bed and seating.', quality: 'standard', boltedDown: false },
        { prototype: 'furniture', name: 'art prints', description: 'Framed art prints tacked to the exposed brick walls.', boltedDown: true },
        { prototype: 'furniture', name: 'a standing lamp', description: 'A floor lamp with a stained glass shade, casting colored light.', boltedDown: false },
        { prototype: 'furniture', name: 'throw rugs', description: 'Several woven throw rugs covering the cold concrete floor.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the futon',
          capacity: 2,
          emptyMsg: 'The futon is currently folded as a couch.',
          occupiedMsg: '%s sitting on the futon',
        },
      ],
    },

    '%F2_UNIT_C': {
      name: 'Colman Building - Floor 2 - Unit C',
      description: `A narrow apartment running the depth of the building. The far end has a small balcony accessible through French doors. The space is divided by bookshelves, creating a bedroom area and a living area. Plants in pots line the windowsill.`,
      x: -12,
      y: -3,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%F2_LOBBY',
        south: '%F2_BALCONY',
      },
      objects: [
        { prototype: 'furniture', name: 'bookshelves', description: 'Floor-to-ceiling bookshelves dividing the space into rooms.', boltedDown: true },
        { prototype: 'bed', name: 'a platform bed', description: 'A low platform bed behind the bookshelves.', quality: 'standard', boltedDown: true },
        { prototype: 'furniture', name: 'potted plants', description: 'Various potted plants on the windowsill, some thriving, some wilted.', boltedDown: false },
        { prototype: 'furniture', name: 'a reading chair', description: 'An armchair with a floor lamp beside it.', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the reading chair',
          capacity: 1,
          emptyMsg: 'A comfortable armchair waits by the bookshelves.',
          occupiedMsg: '%s sitting in the reading chair',
        },
      ],
    },

    '%F2_BALCONY': {
      name: 'Colman Building - Floor 2 - Unit C Balcony',
      description: `A small balcony overlooking the alley, enclosed by a wrought iron railing. Two chairs and a small table occupy the space. The view is of brick walls and fire escapes, but the fresh air is welcome. Pigeons coo from nearby ledges.`,
      x: -12,
      y: -3,
      z: 2,
      population: 0,
      ambientNoise: 8,
      lighting: 90,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%F2_UNIT_C',
      },
      sittables: [
        {
          name: 'balcony chairs',
          capacity: 2,
          emptyMsg: 'Two metal chairs flank a small table on the balcony.',
          occupiedMsg: '%s sitting on the balcony',
        },
      ],
    },
  },
};