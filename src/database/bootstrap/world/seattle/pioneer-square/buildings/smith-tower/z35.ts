// Smith Tower - Executive Amenities (z=35)
// Continuum premium facilities - prepared for executive personnel

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%LOBBY' },
    },

    '%LOBBY': {
      name: 'Smith Tower - 35th Floor - Amenities Lobby',
      description: `A high-floor landing with polished floors and soft lighting. Wall panels display: EXECUTIVE AMENITIES - FLOOR 35. Direction signs point to the fitness center, lounge, and meeting rooms. Everything is clean, modern, unmanned.

The space echoes with emptiness. The air circulation hums steadily. Waiting for executives who haven't arrived.`,
      x: -12,
      y: 10,
      z: 35,
      population: 0,
      ambientNoise: 4,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LOUNGE',
        south: '%FITNESS',
        east: '%MEETING1',
        west: '%VIEW_DECK',
        in: '%E',
      },
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
          const floorNumber = 35;
          const elevatorId = self.elevatorId || null;

          if (!elevatorId) {
            return 'The call button clicks uselessly. No power.';
          }

          const elevator = await $.load(elevatorId);
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
      elevatorId: '%E',
    },

    // ═══════════════════════════════════════════════════════════════════
    // NORTH - Executive Lounge
    // ═══════════════════════════════════════════════════════════════════

    '%LOUNGE': {
      name: 'Smith Tower - 35th Floor - Executive Lounge',
      description: `A spacious lounge with floor-to-ceiling windows overlooking the grey city. Modern seating arranged in conversational clusters - clean lines, minimalist design. A beverage station stands ready but unstocked, its display reading: INVENTORY PENDING.

No one sits in the chairs. The lighting is warm but the space feels cold. A showroom waiting for occupants.`,
      x: -12,
      y: 11,
      z: 35,
      population: 0,
      ambientNoise: 3,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%LOBBY',
        west: '%LIBRARY',
      },
      sittables: [
        {
          name: 'a lounge chair',
          capacity: 6,
          emptyMsg: 'Empty chairs wait in clusters.',
          occupiedMsg: '%s sitting in the lounge',
        },
      ],
    },

    '%LIBRARY': {
      name: 'Smith Tower - 35th Floor - Digital Library',
      description: `A quiet reading space with built-in shelving - empty except for a few sample books wrapped in plastic. Study carrels with integrated terminals line one wall. A sign reads: DIGITAL ARCHIVE ACCESS - CONFIGURATION PENDING.

The lighting is soft, conducive to reading. The air is silent. No one studies here.`,
      x: -13,
      y: 11,
      z: 35,
      population: 0,
      ambientNoise: 1,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LOUNGE',
      },
      sittables: [
        {
          name: 'a study carrel',
          capacity: 4,
          emptyMsg: 'Empty carrels wait in rows.',
          occupiedMsg: '%s sitting at a study carrel',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // SOUTH - Fitness Center
    // ═══════════════════════════════════════════════════════════════════

    '%FITNESS': {
      name: 'Smith Tower - 35th Floor - Fitness Center',
      description: `A gym space with modern equipment still wrapped in protective plastic. Treadmills, resistance machines, free weight racks - all new, all unused. Mirrored walls reflect empty space. A terminal displays: FITNESS CENTER - EQUIPMENT CALIBRATION REQUIRED.

The air smells of new rubber and cleaning solution. The floor is pristine. No one works out here.`,
      x: -12,
      y: 9,
      z: 35,
      population: 0,
      ambientNoise: 2,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LOBBY',
        west: '%YOGA',
      },
    },

    '%YOGA': {
      name: 'Smith Tower - 35th Floor - Wellness Studio',
      description: `An empty studio with polished wood floors and one mirrored wall. Rolled exercise mats stacked in the corner, still in packaging. A sound system bracket on the wall - no equipment installed. The lighting is adjustable, currently set to soft daylight simulation.

The space echoes. Everything ready, nothing used.`,
      x: -13,
      y: 9,
      z: 35,
      population: 0,
      ambientNoise: 1,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%FITNESS',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // EAST - Meeting Rooms
    // ═══════════════════════════════════════════════════════════════════

    '%MEETING1': {
      name: 'Smith Tower - 35th Floor - Conference Room A',
      description: `A glass-walled meeting room with a long table and modern chairs. Wall-mounted displays show: ROOM AVAILABLE - NO RESERVATIONS. Presentation equipment installed but idle. The table surface is spotless.

The room has never been used. The chairs have never been sat in. Waiting for meetings that haven't been scheduled.`,
      x: -11,
      y: 10,
      z: 35,
      population: 0,
      ambientNoise: 2,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LOBBY',
        north: '%MEETING2',
      },
      sittables: [
        {
          name: 'a conference chair',
          capacity: 8,
          emptyMsg: 'Empty chairs surround the table.',
          occupiedMsg: '%s sitting at the conference table',
        },
      ],
    },

    '%MEETING2': {
      name: 'Smith Tower - 35th Floor - Conference Room B',
      description: `A smaller meeting space with a round table and six chairs. A wall screen displays collaboration software in demo mode. The table has integrated power and data ports - all functional, none used.

Clean, modern, empty. A space for decisions that haven't been made.`,
      x: -11,
      y: 11,
      z: 35,
      population: 0,
      ambientNoise: 2,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%MEETING1',
        east: '%PRIVATE',
      },
      sittables: [
        {
          name: 'a meeting chair',
          capacity: 6,
          emptyMsg: 'Empty chairs circle the table.',
          occupiedMsg: '%s sitting at the meeting table',
        },
      ],
    },

    '%PRIVATE': {
      name: 'Smith Tower - 35th Floor - Private Office',
      description: `A small executive office with a desk, chair, and credenza. Windows offer city views. The desk surface is bare except for a terminal displaying: WORKSPACE AVAILABLE - UNASSIGNED. The chair is new, never sat in.

A space for an executive who hasn't been hired.`,
      x: -10,
      y: 11,
      z: 35,
      population: 0,
      ambientNoise: 1,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%MEETING2',
      },
      sittables: [
        {
          name: 'an executive chair',
          capacity: 1,
          emptyMsg: 'An empty desk waits.',
          occupiedMsg: '%s sitting at the desk',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // WEST - Viewing Deck
    // ═══════════════════════════════════════════════════════════════════

    '%VIEW_DECK': {
      name: 'Smith Tower - 35th Floor - Observation Terrace',
      description: `A wraparound terrace behind floor-to-ceiling windows. Views of grey Seattle stretch in all directions. Built-in seating runs along the windows. The floor is polished concrete. The lighting is natural, filtered through the windows.

A peaceful space. Entirely empty. The city visible but distant below.`,
      x: -13,
      y: 10,
      z: 35,
      population: 0,
      ambientNoise: 2,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LOBBY',
        south: '%VIEW_SOUTH',
      },
      sittables: [
        {
          name: 'window seating',
          capacity: 8,
          emptyMsg: 'Built-in benches line the windows.',
          occupiedMsg: '%s sitting at the window',
        },
      ],
    },

    '%VIEW_SOUTH': {
      name: 'Smith Tower - 35th Floor - South Terrace',
      description: `The southern section of the observation terrace. Windows show the industrial waterfront and distant hills. The view is grey, muted, real. A small plant - artificial - sits in a corner planter.

Quiet. Empty. Waiting.`,
      x: -13,
      y: 9,
      z: 35,
      population: 0,
      ambientNoise: 2,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%VIEW_DECK',
      },
      sittables: [
        {
          name: 'window seating',
          capacity: 4,
          emptyMsg: 'Built-in benches line the windows.',
          occupiedMsg: '%s sitting at the window',
        },
      ],
    },
  },
};
