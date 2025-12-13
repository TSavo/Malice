// Smith Tower - Job Center (z=1)
// Continuum's employment hub: AI-driven recruitment and job distribution

export const building = {
  rooms: {
    // Shared elevator car placeholder
    '%E': {
      prototype: 'elevator',
      exits: {
        out: '%F', // back to floor-2 elevator lobby
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // TOP ROW (y=+9): Screening, Assessment, Private Interview
    // ═══════════════════════════════════════════════════════════════════

    '%A': {
      // Bio-Scan Station (-5, +9, 2)
      name: 'Smith Tower - 1st Floor - Bio-Scan Station',
      description: `A narrow room with a single doorway. A scanning arch stands at the entrance, blinking red and amber LEDs tracing overhead. The floor is marked with footprints where thousands have stood waiting for clearance. The air smells of ozone and recycled breath.`,
      x: -5,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 7,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%B',
      },
    },

    '%B': {
      // Assessment Corridor (-4, +9, 2)
      name: 'Smith Tower - 1st Floor - Assessment Corridor',
      description: `A hallway with wall-mounted tablets displaying aptitude questions and personality metrics. Most screens are dark. The walls are institutional grey. Ceiling-mounted cameras track movement, their servos clicking faintly.`,
      x: -4,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%A',
        east: '%C',
        south: '%F',
      },
    },

    '%C': {
      // Interview Booth 1 (-3, +9, 2)
      name: 'Smith Tower - 1st Floor - Interview Booth 1',
      description: `A small room with frosted glass walls. A chair faces a screen. The screen displays: INTERVIEW SYSTEM OFFLINE - REFER TO JOB CENTER. The chair's armrests are worn smooth by nervous hands.`,
      x: -3,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%B',
        east: '%D',
        south: '%G',
      },
      sittables: [
        {
          name: 'an interview chair',
          capacity: 1,
          emptyMsg: 'The interview chair sits empty.',
          occupiedMsg: '%s sitting in the interview chair',
        },
      ],
    },

    '%D': {
      // Equipment Locker (-2, +9, 2)
      name: 'Smith Tower - 1st Floor - Equipment Locker',
      description: `Metal lockers line the walls, most with their doors ajar or missing. A few are locked, access panels blinking red. A sign reads: ISSUED EQUIPMENT MUST BE RETURNED UPON TERMINATION.`,
      x: -2,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%C',
        south: '%H',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // MIDDLE ROW (y=+8): Waiting, Elevator Lobby, Job Center, Dispatch
    // ═══════════════════════════════════════════════════════════════════

    '%E1': {
      // Waiting Area (-5, +8, 2)
      name: 'Smith Tower - 1st Floor - Waiting Area',
      description: `Rows of plastic chairs bolted to the floor face a dead display board. The chairs are scuffed and cracked. The floor is tracked with dirt. A vending machine in the corner blinks OFFLINE. The air smells stale.`,
      x: -5,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 6,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%F',
        south: '%I',
      },
      sittables: [
        {
          name: 'a waiting room chair',
          capacity: 12,
          emptyMsg: 'Empty chairs wait in rows.',
          occupiedMsg: '%s sitting in the waiting area',
        },
      ],
    },

    '%F': {
      // Elevator Lobby (-4, +8, 2)
      name: 'Smith Tower - 1st Floor - Elevator Lobby',
      description: `A compact landing with scuffed floors and walls marked by wheeled carts. The elevator doors bear a placard: SMITH TOWER JOB CENTER - FLOOR 2. Overhead, fluorescent tubes flicker irregularly.`,
      x: -4,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 10,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%E1',
        east: '%G',
        south: '%J',
        north: '%B',
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
          const floorNumber = 2;
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

    '%G': {
      // Job Center (MAIN AREA) (-3, +8, 2)
      name: 'Smith Tower - 1st Floor - Job Center',
      description: `The heart of Continuum's employment system. Three terminals stand in a row, their screens glowing pale blue. Each displays: CONTINUUM EMPLOYMENT SERVICES - TOUCH TO BEGIN. The terminals are bolted to the floor. Behind them, a large display cycles through recruitment slogans in corporate sans-serif.`,
      x: -3,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 8,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%F',
        east: '%H',
        south: '%K',
        north: '%C',
      },
      objects: [
        {
          prototype: 'jobBoard',
          name: 'Employment Terminal',
          description: 'A sleek terminal bolted to the floor. The screen glows pale blue with the Continuum logo. Touch to begin.',
        },
      ],
    },

    '%H': {
      // Dispatch Office (-2, +8, 2)
      name: 'Smith Tower - 1st Floor - Dispatch Office',
      description: `A room with wall-mounted displays showing job status boards. Most are blank. One flickers with assignment codes and sector designations. A desk with a terminal sits unmanned. The screen reads: AUTONOMOUS DISPATCH ACTIVE.`,
      x: -2,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 6,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%G',
        north: '%D',
        south: '%L',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // BOTTOM ROW (y=+7): Break, Storage, Info, Private Office
    // ═══════════════════════════════════════════════════════════════════

    '%I': {
      // Break Room (-5, +7, 2)
      name: 'Smith Tower - 1st Floor - Break Room',
      description: `A sparse room with a water dispenser blinking FILTER ALERT and a microwave that smells of burnt synthetic protein. Three tables are bolted to the floor. A poster reads: BREAKS ARE A PRIVILEGE.`,
      x: -5,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 4,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%E1',
        east: '%J',
      },
      sittables: [
        {
          name: 'a break table',
          capacity: 9,
          emptyMsg: 'Empty tables wait for workers.',
          occupiedMsg: '%s sitting at a break table',
        },
      ],
    },

    '%J': {
      // Storage / Supply (-4, +7, 2)
      name: 'Smith Tower - 1st Floor - Supply Room',
      description: `Metal shelving with boxed supplies: work gloves, safety vests, ID badge sleeves. Most shelves are empty. A clipboard hangs on the wall with a sign-out sheet, pages yellowed and blank.`,
      x: -4,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%F',
        east: '%K',
        west: '%I',
      },
    },

    '%K': {
      // Information Kiosk (-3, +7, 2)
      name: 'Smith Tower - 1st Floor - Information Kiosk',
      description: `A self-service information station with touchscreens displaying FAQs, housing policies, and wage schedules. One screen shows a map of Pioneer Square with Continuum-controlled zones highlighted in blue.`,
      x: -3,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%G',
        west: '%J',
        east: '%L',
      },
    },

    '%L': {
      // Supervisor's Office (-2, +7, 2)
      name: 'Smith Tower - 1st Floor - Supervisor Office',
      description: `A small office with frosted glass. The desk is empty except for a terminal displaying: SUPERVISOR ASSIGNED - NONE. The chair is clean, as if never used. The room smells of new plastic.`,
      x: -2,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%H',
        west: '%K',
      },
      sittables: [
        {
          name: 'a desk chair',
          capacity: 1,
          emptyMsg: 'The supervisor\'s chair sits empty.',
          occupiedMsg: '%s sitting at the supervisor desk',
        },
      ],
    },
  },
};
