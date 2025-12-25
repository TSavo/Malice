// Smith Tower - Executive Amenities (z=35)
// Continuum premium facilities - prepared for executive personnel

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%LOBBY_35' },
    },

    '%LOBBY_35': {
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
        north: '%LOUNGE_35',
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

    '%LOUNGE_35': {
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
        south: '%LOBBY_35',
        west: '%LIBRARY',
        east: '%MEETING2',
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
        east: '%LOUNGE_35',
        south: '%VIEW_DECK',
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
        north: '%LOBBY_35',
        west: '%YOGA',
        east: '%SPA',
      },
    },

    '%YOGA': {
      name: 'Smith Tower - 35th Floor - Wellness Studio',
      description: `An empty studio with polished wood floors and one mirrored wall. Rolled exercise mats stacked in the corner, still in packaging. A sound system bracket on the wall - no equipment installed. Floor-to-ceiling windows offer views south toward the waterfront.

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
        north: '%VIEW_DECK',
        east: '%FITNESS',
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

    // ═══════════════════════════════════════════════════════════════════
    // EAST - Meeting Rooms
    // ═══════════════════════════════════════════════════════════════════

    '%MEETING1': {
      name: 'Smith Tower - 35th Floor - Conference Room A',
      description: `A glass-walled meeting room with a long table and modern chairs. Wall-mounted displays show: ROOM AVAILABLE - NO RESERVATIONS. Presentation equipment installed but idle. The table surface is spotless.

The room has never been used. The chairs have never been sat in. Waiting for meetings that hasn't been scheduled.`,
      x: -11,
      y: 10,
      z: 35,
      population: 0,
      ambientNoise: 2,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LOBBY_35',
        north: '%MEETING2',
        south: '%SPA',
        east: '%BREAKROOM',
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
        west: '%LOUNGE_35',
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
        south: '%BREAKROOM',
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
    // SOUTHEAST - Spa & Wellness
    // ═══════════════════════════════════════════════════════════════════

    '%BREAKROOM': {
      name: 'Smith Tower - 35th Floor - Executive Break Room',
      description: `A small lounge with comfortable seating and a beverage station. The dispenser is installed but not stocked, its display reading: INVENTORY PENDING. A window offers eastern views of the grey city. Charging ports are built into every surface.

Clean, modern, empty. A break room with no one to take breaks.`,
      x: -10,
      y: 10,
      z: 35,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PRIVATE',
        west: '%MEETING1',
        south: '%STEAM',
      },
      sittables: [
        {
          name: 'a lounge chair',
          capacity: 4,
          emptyMsg: 'Comfortable chairs wait unused.',
          occupiedMsg: '%s relaxing in the break room',
        },
      ],
    },

    '%SPA': {
      name: 'Smith Tower - 35th Floor - Spa Treatment Room',
      description: `A treatment room with a massage table and wall-mounted equipment still in packaging. Soft lighting is pre-set. Aromatherapy dispensers are installed but empty. A terminal reads: SPA SERVICES - AWAITING STAFF CERTIFICATION.

The air is clean, neutral. The table has never been used.`,
      x: -11,
      y: 9,
      z: 35,
      population: 0,
      ambientNoise: 1,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%MEETING1',
        west: '%FITNESS',
        east: '%STEAM',
      },
      sittables: [
        {
          name: 'a treatment table',
          capacity: 1,
          emptyMsg: 'The treatment table waits.',
          occupiedMsg: '%s lying on the treatment table',
        },
      ],
    },

    '%STEAM': {
      name: 'Smith Tower - 35th Floor - Steam Room',
      description: `A tiled steam chamber with wooden benches. The steam generator is installed but dormant, its control panel dark. The space is clean and dry, smelling faintly of cedar. A sign reads: STEAM SERVICE - SYSTEM INITIALIZATION REQUIRED.

Ready for relaxation that hasn't begun.`,
      x: -10,
      y: 9,
      z: 35,
      population: 0,
      ambientNoise: 1,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%BREAKROOM',
        west: '%SPA',
      },
      sittables: [
        {
          name: 'a cedar bench',
          capacity: 4,
          emptyMsg: 'Wooden benches line the walls.',
          occupiedMsg: '%s sitting on a cedar bench',
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
        east: '%LOBBY_35',
        south: '%YOGA',
        north: '%LIBRARY',
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
  },
};
