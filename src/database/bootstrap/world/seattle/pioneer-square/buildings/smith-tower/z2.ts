// Smith Tower - CorpSec Floor (z=2)
// Prepared space for Continuum's security division - infrastructure ready, personnel needed

export const building = {
  rooms: {
    // Shared elevator car placeholder
    '%E': {
      prototype: 'elevator',
      exits: {
        out: '%P', // back to floor-3 elevator lobby
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // TOP ROW (y=+9): Command, Operations, Records, Comms
    // ═══════════════════════════════════════════════════════════════════

    '%M': {
      // Security Command (-5, +9, 3)
      name: 'Smith Tower - 2nd Floor - Security Command',
      description: `A room prepared for operations. Wall-mounted displays show feed slots labeled CAM-01 through CAM-24, all reading NO SIGNAL. A central console sits clean and powered, its screens cycling through standby diagnostics. New chairs still wrapped in plastic. A placard reads: CORPSEC COMMAND CENTER.`,
      x: -13,
      y: 11,
      z: 2,
      population: 0,
      ambientNoise: 7,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%N',
      },
      sittables: [
        {
          name: 'a command console chair',
          capacity: 3,
          emptyMsg: 'Three operator chairs sit empty, still wrapped.',
          occupiedMsg: '%s sitting at the command console',
        },
      ],
    },

    '%N': {
      // Operations Room (-4, +9, 3)
      name: 'Smith Tower - 2nd Floor - Operations Room',
      description: `A briefing room with a long table and wall-mounted displays. The displays show: AWAITING PERSONNEL ASSIGNMENT. Stacked equipment boxes line one wall: tactical gear, comm units, body cameras. Everything new, everything waiting.`,
      x: -12,
      y: 11,
      z: 2,
      population: 0,
      ambientNoise: 5,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%M',
        east: '%O',
        south: '%P',
      },
      sittables: [
        {
          name: 'a briefing table',
          capacity: 8,
          emptyMsg: 'Eight chairs around the briefing table, empty.',
          occupiedMsg: '%s sitting at the briefing table',
        },
      ],
    },

    '%O': {
      // Records & Evidence (-3, +9, 3)
      name: 'Smith Tower - 2nd Floor - Records & Evidence',
      description: `Secure filing cabinets with digital locks, all sealed and empty. Evidence lockers with clear doors show pristine interiors. A terminal displays: EVIDENCE MANAGEMENT SYSTEM - NO CASES LOGGED. The room smells of new paint and fresh plastic.`,
      x: -11,
      y: 11,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%N',
        east: '%Q',
        south: '%S',
      },
    },

    '%Q': {
      // Server & Communications (-2, +9, 3)
      name: 'Smith Tower - 2nd Floor - Server Room',
      description: `Climate-controlled and humming with active cooling. Rack-mounted servers blink with activity, LEDs showing green across the board. Cable management is immaculate. The equipment is enterprise-grade, recently installed. A screen reads: CORPSEC NETWORK - 47 NODES AWAITING CONNECTION.`,
      x: -10,
      y: 11,
      z: 2,
      population: 0,
      ambientNoise: 11,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%O',
        south: '%T',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // MIDDLE ROW (y=+8): Mechanical, Lobby, Armory, Comms Station
    // ═══════════════════════════════════════════════════════════════════

    '%R': {
      // Mechanical & Power (-5, +8, 3)
      name: 'Smith Tower - 2nd Floor - Mechanical Room',
      description: `Breakers, backup generators, and power distribution. Everything is labeled with fresh tags. A maintenance log clipboard shows recent installation dates. The backup generator reads: TEST CYCLE PENDING - REQUIRES TECHNICIAN.`,
      x: -13,
      y: 10,
      z: 2,
      population: 0,
      ambientNoise: 13,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%P',
        south: '%U',
      },
    },

    '%P': {
      // Elevator Lobby (-4, +8, 3)
      name: 'Smith Tower - 2nd Floor - Elevator Lobby',
      description: `A clean landing with new floor tiles. The wall displays a directory: FLOOR 3 - CORPSEC DIVISION. Below it, a digital notice board reads: RECRUITMENT ACTIVE - REPORT TO JOB CENTER FL.2. The air smells faintly of fresh paint.`,
      x: -12,
      y: 10,
      z: 2,
      population: 0,
      ambientNoise: 10,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%R',
        east: '%S',
        south: '%V',
        north: '%N',
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
          const floorNumber = 3;
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

    '%S': {
      // Armory (-3, +8, 3)
      name: 'Smith Tower - 2nd Floor - Armory',
      description: `A secured room with heavy doors and biometric locks. Through the reinforced window: weapon racks holding stun batons, shock gloves, riot shields. Ammunition lockers sealed with warning labels. A terminal reads: ARMORY SYSTEM ACTIVE - NO AUTHORIZED PERSONNEL. Everything is stocked, nothing is issued.`,
      x: -11,
      y: 10,
      z: 2,
      population: 0,
      ambientNoise: 4,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%P',
        east: '%T',
        north: '%O',
      },
    },

    '%T': {
      // Communications Station (-2, +8, 3)
      name: 'Smith Tower - 2nd Floor - Communications Station',
      description: `Radio consoles and dispatch terminals arranged in a semicircle. Headsets hang on hooks, cables neatly coiled. A large display shows: DISPATCH SYSTEM IDLE - AWAITING OPERATOR LOGIN. The equipment hums with standby power.`,
      x: -10,
      y: 10,
      z: 2,
      population: 0,
      ambientNoise: 8,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%S',
        north: '%Q',
        south: '%W',
      },
      sittables: [
        {
          name: 'a dispatch console',
          capacity: 2,
          emptyMsg: 'Two dispatch stations sit unmanned.',
          occupiedMsg: '%s sitting at a dispatch console',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // BOTTOM ROW (y=+7): Locker Room, Stairwell, Equipment
    // ═══════════════════════════════════════════════════════════════════

    '%U': {
      // Locker Room (-5, +7, 3)
      name: 'Smith Tower - 2nd Floor - Locker Room',
      description: `Rows of metal lockers, all empty and unlocked. Benches bolted to the floor. Shower stalls in the back, clean and unused. A sign reads: PERSONNEL LOCKERS - ASSIGNMENT PENDING.`,
      x: -13,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%R',
        east: '%V',
      },
      sittables: [
        {
          name: 'a locker room bench',
          capacity: 6,
          emptyMsg: 'Empty benches wait for personnel.',
          occupiedMsg: '%s sitting on a bench',
        },
      ],
    },

    '%V': {
      // Stairwell Access (-4, +7, 3)
      name: 'Smith Tower - 2nd Floor - Stairwell Access',
      description: `A emergency exit with new safety lighting. The concrete stairs are clean, recently swept. A sign reads: EMERGENCY EGRESS - FLOOR 3 CORPSEC.`,
      x: -12,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%P',
        east: '%W',
        down: '%5', // connects to floor 1
      },
    },

    '%W': {
      // Equipment Storage (-3, +7, 3)
      name: 'Smith Tower - 2nd Floor - Equipment Storage',
      description: `Shelving stocked with sealed boxes: radios, flashlights, restraints, med kits, batteries. Everything is inventoried and labeled. A clipboard shows: EQUIPMENT INVENTORY - FULL STOCK - NO ASSIGNMENTS.`,
      x: -11,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%T',
        west: '%V',
      },
    },
  },
};
