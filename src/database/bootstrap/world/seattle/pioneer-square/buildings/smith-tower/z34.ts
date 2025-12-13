// Smith Tower - Premium Residential (z=34)
// Continuum executive housing - prepared for high-value personnel

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%EL_z34' },
    },

    '%EL_z34': {
      name: 'Smith Tower - 34th Floor - Executive Lobby',
      description: `A high-floor lobby with floor-to-ceiling windows offering grey city views. The floor is dark polished stone. Indirect lighting provides soft illumination from recessed fixtures. A digital directory displays: PREMIUM HOUSING - ASSIGNMENT PENDING.

Six unit doors line the hallway, each marked with clean metal numbers. The space smells of new carpet and filtered air. Everything is pristine, untouched, waiting.`,
      x: -4,
      y: 8,
      z: 34,
      population: 0,
      ambientNoise: 3,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%A1',
        south: '%A2',
        east: '%B1',
        west: '%C1',
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
          const floorNumber = 34;
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
    // NORTH WING - Units A1, A2
    // ═══════════════════════════════════════════════════════════════════

    '%A1': {
      name: 'Smith Tower - 34th Floor - Unit A1 Foyer',
      description: `A unit entrance with a biometric scanner beside a seamless door. The panel displays: UNIT 34A1 - EXECUTIVE TIER - UNASSIGNED. The door is sealed, waiting for authorization.`,
      x: -4,
      y: 9,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%EL_z34',
      },
    },

    '%A2': {
      name: 'Smith Tower - 34th Floor - Unit A2 Foyer',
      description: `A unit entrance with a biometric scanner beside a seamless door. The panel displays: UNIT 34A2 - EXECUTIVE TIER - UNASSIGNED. The door is sealed, waiting for authorization.`,
      x: -4,
      y: 7,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%EL_z34',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // EAST WING - Units B1, B2
    // ═══════════════════════════════════════════════════════════════════

    '%B1': {
      name: 'Smith Tower - 34th Floor - Unit B1 Foyer',
      description: `A unit entrance with a biometric scanner beside a seamless door. The panel displays: UNIT 34B1 - EXECUTIVE TIER - UNASSIGNED. The door is sealed, waiting for authorization.`,
      x: -3,
      y: 8,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%EL_z34',
        north: '%B1_VIEW',
      },
    },

    '%B1_VIEW': {
      name: 'Smith Tower - 34th Floor - East Viewing Alcove',
      description: `A small windowed alcove with views of the grey city sprawl. The glass is clean, recently installed. A bench built into the wall sits empty. The lighting is soft, the space quiet.`,
      x: -3,
      y: 9,
      z: 34,
      population: 0,
      ambientNoise: 1,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%B1',
      },
      sittables: [
        {
          name: 'a viewing bench',
          capacity: 2,
          emptyMsg: 'A bench waits beneath the window.',
          occupiedMsg: '%s sitting at the window',
        },
      ],
    },

    '%B2': {
      name: 'Smith Tower - 34th Floor - Unit B2 Foyer',
      description: `A unit entrance with a biometric scanner beside a seamless door. The panel displays: UNIT 34B2 - EXECUTIVE TIER - UNASSIGNED. The door is sealed, waiting for authorization.`,
      x: -2,
      y: 8,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%B1',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // WEST WING - Units C1, C2
    // ═══════════════════════════════════════════════════════════════════

    '%C1': {
      name: 'Smith Tower - 34th Floor - Unit C1 Foyer',
      description: `A unit entrance with a biometric scanner beside a seamless door. The panel displays: UNIT 34C1 - EXECUTIVE TIER - UNASSIGNED. The door is sealed, waiting for authorization.`,
      x: -5,
      y: 8,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%EL_z34',
        south: '%C1_VIEW',
      },
    },

    '%C1_VIEW': {
      name: 'Smith Tower - 34th Floor - West Viewing Alcove',
      description: `A small windowed alcove with views of Pioneer Square below. The glass is clean, recently installed. A bench built into the wall sits empty. The lighting is soft, the space quiet.`,
      x: -5,
      y: 7,
      z: 34,
      population: 0,
      ambientNoise: 1,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%C1',
      },
      sittables: [
        {
          name: 'a viewing bench',
          capacity: 2,
          emptyMsg: 'A bench waits beneath the window.',
          occupiedMsg: '%s sitting at the window',
        },
      ],
    },

    '%C2': {
      name: 'Smith Tower - 34th Floor - Unit C2 Foyer',
      description: `A unit entrance with a biometric scanner beside a seamless door. The panel displays: UNIT 34C2 - EXECUTIVE TIER - UNASSIGNED. The door is sealed, waiting for authorization.`,
      x: -5,
      y: 9,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%C1',
      },
    },
  },
};
