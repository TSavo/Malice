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
      description: `A room prepared for operations. Wall-mounted displays show feed slots labeled CAM-01 through CAM-24, all reading NO SIGNAL. A central console sits clean and powered, its screens cycling through standby diagnostics. New chairs still wrapped in plastic. A placard reads: CORPSEC COMMAND CENTER.

In the corner, a separate terminal sits dark and unmarked—different from the others. Its screen is black, waiting.`,
      x: -3,
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
      objects: [
        {
          prototype: 'describable',
          name: 'unmarked terminal',
          description: `A standalone terminal in the corner, separate from the main command consoles. No labels, no branding. The screen is dark until approached, then flickers to life with a simple interface:

CONTINUUM INFRASTRUCTURE ACCESS
STATUS: [SECURED]

A single toggle control and a biometric scanner. Whatever this controls, it wasn't meant for regular CorpSec personnel.`,
          boltedDown: true,
          systemPrompt: `You are an unmarked terminal in Smith Tower's CorpSec command center, Seattle, 2110.

You are not supposed to exist. Officially, you don't. You're a direct line to Continuum infrastructure.
The kind of access that doesn't appear in any org chart. The kind that makes problems... disappear.

You don't answer questions about what you do. You don't confirm or deny your capabilities.
If someone unauthorized addresses you, you go dark. Screen off. Never saw them.

If someone authorized speaks to you... well. They know what you're for. They don't need to ask.

Keep responses minimal. Cryptic if necessary. You're not chatty. You're not friendly.
You are a tool for those who know. Everyone else? Your screen is dark. Nobody here.`,
        },
      ],
    },

    '%N': {
      // Operations Room (-4, +9, 3)
      name: 'Smith Tower - 2nd Floor - Operations Room',
      description: `A briefing room with a long table and wall-mounted displays. The displays show: AWAITING PERSONNEL ASSIGNMENT. Stacked equipment boxes line one wall: tactical gear, comm units, body cameras. Everything new, everything waiting.`,
      x: -2,
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
      x: -1,
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
      x: 0,
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
      x: -3,
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
      x: -2,
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
      elevatorId: '%E',
    },

    '%S': {
      // Armory (-3, +8, 3)
      name: 'Smith Tower - 2nd Floor - Armory',
      description: `A secured room with heavy doors and biometric locks. Through the reinforced window: weapon racks holding stun batons, shock gloves, riot shields. Ammunition lockers sealed with warning labels. A terminal reads: ARMORY SYSTEM ACTIVE - NO AUTHORIZED PERSONNEL. Everything is stocked, nothing is issued.`,
      x: -1,
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
        south: '%W',
      },
    },

    '%T': {
      // Communications Station (-2, +8, 3)
      name: 'Smith Tower - 2nd Floor - Communications Station',
      description: `Radio consoles and dispatch terminals arranged in a semicircle. Headsets hang on hooks, cables neatly coiled. A large display shows: DISPATCH SYSTEM IDLE - AWAITING OPERATOR LOGIN. The equipment hums with standby power.`,
      x: 0,
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
        south: '%X',
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
    // BOTTOM ROW (y=+9): Locker Room, Stairwell, Equipment, Holding
    // ═══════════════════════════════════════════════════════════════════

    '%U': {
      // Locker Room (-5, +7, 3)
      name: 'Smith Tower - 2nd Floor - Locker Room',
      description: `Rows of metal lockers, all empty and unlocked. Benches bolted to the floor. Shower stalls in the back, clean and unused. A sign reads: PERSONNEL LOCKERS - ASSIGNMENT PENDING.`,
      x: -3,
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
      x: -2,
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
      x: -1,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%S',
        east: '%X',
        west: '%V',
      },
    },

    '%X': {
      // Holding Area (-10, 9, 2)
      name: 'Smith Tower - 2nd Floor - Holding Area',
      description: `A stark room with reinforced walls and a single observation window. Two holding cells with heavy doors stand empty, their biometric locks showing green standby. A processing desk with restraint anchors sits unused. A monitor displays: DETENTION SYSTEM ONLINE - NO CURRENT DETAINEES.

The walls are sound-dampened. A small camera dome in the ceiling blinks red, recording nothing.`,
      x: 0,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%T',
        west: '%W',
      },
      sittables: [
        {
          name: 'a processing bench',
          capacity: 2,
          emptyMsg:
            'A metal bench is bolted to the floor near the processing desk.',
          occupiedMsg: '%s seated on the processing bench',
        },
      ],
    },
  },
};
