// Colman Building - Floor 3 (z=3)
// Top residential floor with premium units

export const building = {
  rooms: {
    '%E': {
      // Elevator placeholder
      prototype: 'elevator',
      exits: { out: '%F3_LOBBY' },
    },

    // ═══════════════════════════════════════════════════════════════════
    // FLOOR 3: Residential Units (Top Floor)
    // ═══════════════════════════════════════════════════════════════════

    '%F3_LOBBY': {
      name: 'Colman Building - Floor 3 - Elevator Landing',
      description: `The top floor landing with sloped ceilings following the roofline. The air is warmer here, and the building's age shows in the creaking floorboards. A skylight provides natural illumination, though it's cloudy outside.`,
      x: -12,
      y: -2,
      z: 3,
      population: 0,
      ambientNoise: 4,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%F3_UNIT_A',
        south: '%F3_UNIT_C',
        east: '%F3_UNIT_B',
        west: '%F3_HALL',
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
          const floorNumber = 3;
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

    '%F3_HALL': {
      name: 'Colman Building - Floor 3 - Main Hallway',
      description: `A narrow top-floor hallway with exposed beams and sloped ceilings. The walls are painted white but show cracks from settling. A fire escape door leads to the roof, its sign reading: ROOF ACCESS - EMERGENCY ONLY.`,
      x: -13,
      y: -2,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%F3_LOBBY',
        up: '%ROOF_ACCESS',
      },
    },

    '%F3_UNIT_A': {
      name: 'Colman Building - Floor 3 - Unit A',
      description: `A penthouse studio with vaulted ceilings and large skylights. The space is bright and airy, with exposed wooden beams and brick walls. A spiral staircase leads to a small rooftop deck. The furnishings are simple but well-maintained.`,
      x: -12,
      y: -1,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%F3_LOBBY',
        up: '%F3_DECK',
      },
      objects: [
        { prototype: 'furniture', name: 'exposed beams', description: 'Wooden beams exposed in the vaulted ceiling, adding character to the space.', boltedDown: true },
        { prototype: 'furniture', name: 'skylights', description: 'Large skylights providing abundant natural light.', boltedDown: true },
        { prototype: 'bed', name: 'a four-poster bed', description: 'An antique four-poster bed that dominates the sleeping area.', quality: 'nice', boltedDown: false },
        { prototype: 'furniture', name: 'a spiral staircase', description: 'A wrought iron spiral staircase leading to the rooftop deck.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'an armchair',
          capacity: 1,
          emptyMsg: 'A comfortable armchair faces the windows.',
          occupiedMsg: '%s sitting in the armchair',
        },
      ],
    },

    '%F3_DECK': {
      name: 'Colman Building - Floor 3 - Rooftop Deck',
      description: `A small private deck on the roof, enclosed by a low wall. City views stretch in all directions, though the air is brisk and carries the scent of rain. A few potted plants struggle against the wind, and a weather-beaten chaise lounge offers outdoor seating.`,
      x: -12,
      y: 0,
      z: 3,
      population: 0,
      ambientNoise: 12,
      lighting: 95,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%F3_UNIT_A',
      },
      sittables: [
        {
          name: 'the chaise lounge',
          capacity: 1,
          emptyMsg: 'A weathered chaise lounge faces the city view.',
          occupiedMsg: '%s reclining on the chaise lounge',
        },
      ],
    },

    '%F3_UNIT_B': {
      name: 'Colman Building - Floor 3 - Unit B',
      description: `A corner unit with windows on two exposures, offering panoramic views. The space is divided into living and sleeping areas by a half-wall. Built-in bookshelves line one wall, and a small kitchen occupies the corner. The hardwood floors gleam despite their age.`,
      x: -11,
      y: -2,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%F3_LOBBY',
      },
      objects: [
        { prototype: 'furniture', name: 'built-in bookshelves', description: 'Floor-to-ceiling bookshelves built into the wall, filled with well-worn volumes.', boltedDown: true },
        { prototype: 'furniture', name: 'a half-wall divider', description: 'A partial wall dividing the space into living and sleeping areas.', boltedDown: true },
        { prototype: 'bed', name: 'a canopy bed', description: 'A bed with sheer curtains hanging from the ceiling.', quality: 'nice', boltedDown: false },
        { prototype: 'furniture', name: 'a small kitchen', description: 'An efficient kitchen with granite counters and stainless appliances.', boltedDown: true },
      ],
      sittables: [
        {
          name: 'a window seat',
          capacity: 2,
          emptyMsg: 'Built-in window seats provide comfortable seating with city views.',
          occupiedMsg: '%s sitting in the window seat',
        },
      ],
    },

    '%F3_UNIT_C': {
      name: 'Colman Building - Floor 3 - Unit C',
      description: `A cozy apartment with a working fireplace and deep window sills. The walls are painted soft colors, and area rugs cover the hardwood floors. A small balcony accessible through French doors offers outdoor space. The unit feels lived-in and comfortable.`,
      x: -12,
      y: -3,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%F3_LOBBY',
        south: '%F3_BALCONY',
      },
      objects: [
        { prototype: 'furniture', name: 'a working fireplace', description: 'A brick fireplace with a carved mantel, functional despite its age.', boltedDown: true },
        { prototype: 'furniture', name: 'deep window sills', description: 'Wide window sills perfect for sitting and enjoying the view.', boltedDown: true },
        { prototype: 'furniture', name: 'area rugs', description: 'Oriental rugs covering the hardwood floors.', boltedDown: false },
        { prototype: 'bed', name: 'a sleigh bed', description: 'An elegant sleigh bed with curved headboard and footboard.', quality: 'nice', boltedDown: false },
      ],
      sittables: [
        {
          name: 'the window sill',
          capacity: 1,
          emptyMsg: 'The deep window sill provides comfortable seating.',
          occupiedMsg: '%s sitting on the window sill',
        },
      ],
    },

    '%F3_BALCONY': {
      name: 'Colman Building - Floor 3 - Unit C Balcony',
      description: `A Juliette balcony with wrought iron railing, offering a view of the alley below. Two chairs and a small table create an outdoor dining area. Wind chimes tinkle softly, and the air smells of nearby restaurants and damp brick.`,
      x: -12,
      y: -4,
      z: 3,
      population: 0,
      ambientNoise: 10,
      lighting: 85,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%F3_UNIT_C',
      },
      sittables: [
        {
          name: 'balcony chairs',
          capacity: 2,
          emptyMsg: 'Wrought iron chairs surround a small glass table.',
          occupiedMsg: '%s sitting on the balcony',
        },
      ],
    },

    '%ROOF_ACCESS': {
      name: 'Colman Building - Roof Access',
      description: `A utility area at the top of the stairs, with access to the main roof. A heavy steel door leads outside, secured with a padlock. The space smells of tar and ozone from electrical equipment. Warning signs read: AUTHORIZED PERSONNEL ONLY.`,
      x: -13,
      y: -2,
      z: 4,
      population: 0,
      ambientNoise: 6,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%F3_HALL',
        out: '%ROOF',
      },
    },

    '%ROOF': {
      name: 'Colman Building - Roof',
      description: `The flat roof of the Colman Building, covered in tar and gravel. HVAC units hum steadily, and antenna masts reach skyward. The city spreads out below, a mix of intact and ruined structures. Wind whips across the surface, carrying the scent of salt and industry.`,
      x: -12,
      y: -2,
      z: 4,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        in: '%ROOF_ACCESS',
      },
    },
  },
};