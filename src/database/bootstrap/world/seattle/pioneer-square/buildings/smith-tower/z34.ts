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
      x: -2,
      y: 10,
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
      elevatorId: '%E',
    },

    // ═══════════════════════════════════════════════════════════════════
    // NORTH WING - Units A1, A2
    // ═══════════════════════════════════════════════════════════════════

    '%A1': {
      name: 'Smith Tower - 34th Floor - Unit A1 Foyer',
      description: `A unit entrance with a biometric scanner beside a seamless door. The panel displays: UNIT 34A1 - EXECUTIVE TIER - UNASSIGNED. The door is sealed, waiting for authorization.`,
      x: -2,
      y: 11,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%EL_z34',
        east: '%B1_VIEW',
        west: '%C2',
      },
    },

    '%A2': {
      name: 'Smith Tower - 34th Floor - Unit A2 Foyer',
      description: `A unit entrance with a biometric scanner beside a seamless door. The panel displays: UNIT 34A2 - EXECUTIVE TIER - UNASSIGNED. The door is sealed, waiting for authorization.`,
      x: -2,
      y: 9,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%EL_z34',
        east: '%B1_STUDY',
        west: '%C1_VIEW',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // EAST WING - Units B1, B2
    // ═══════════════════════════════════════════════════════════════════

    '%B1': {
      name: 'Smith Tower - 34th Floor - Unit B1 Foyer',
      description: `A unit entrance with a biometric scanner beside a seamless door. The panel displays: UNIT 34B1 - EXECUTIVE TIER - UNASSIGNED. The door is sealed, waiting for authorization.`,
      x: -1,
      y: 10,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%EL_z34',
        north: '%B1_VIEW',
        east: '%B2',
        south: '%B1_STUDY',
      },
    },

    '%B1_VIEW': {
      name: 'Smith Tower - 34th Floor - Northeast Viewing Alcove',
      description: `A small windowed alcove with views of the grey city sprawl. The glass is clean, recently installed. A bench built into the wall sits empty. The lighting is soft, the space quiet.`,
      x: -1,
      y: 11,
      z: 34,
      population: 0,
      ambientNoise: 1,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%B1',
        east: '%B2_VIEW',
        west: '%A1',
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
      x: 0,
      y: 10,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%B1',
        north: '%B2_VIEW',
        south: '%B2_LOUNGE',
      },
    },

    '%B2_VIEW': {
      name: 'Smith Tower - 34th Floor - East Corner Alcove',
      description: `A corner alcove with panoramic windows offering sweeping views east and north. The glass wraps around two walls, floor to ceiling. Built-in seating follows the window line. The space is bright, quiet, untouched.`,
      x: 0,
      y: 11,
      z: 34,
      population: 0,
      ambientNoise: 1,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%B2',
        west: '%B1_VIEW',
      },
      sittables: [
        {
          name: 'corner window seating',
          capacity: 4,
          emptyMsg: 'Built-in seating wraps the corner windows.',
          occupiedMsg: '%s sitting at the corner windows',
        },
      ],
    },

    '%B1_STUDY': {
      name: 'Smith Tower - 34th Floor - Executive Study',
      description: `A quiet study with built-in bookshelves and a compact desk station. The shelves are empty, awaiting occupant preference. A terminal sits dark on the desk. The lighting is warm, the space designed for focus and concentration.`,
      x: -1,
      y: 9,
      z: 34,
      population: 0,
      ambientNoise: 1,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%B1',
        east: '%B2_LOUNGE',
        west: '%A2',
      },
      sittables: [
        {
          name: 'a study desk',
          capacity: 1,
          emptyMsg: 'A desk waits for someone to work.',
          occupiedMsg: '%s working at the study desk',
        },
      ],
    },

    '%B2_LOUNGE': {
      name: 'Smith Tower - 34th Floor - Southeast Lounge',
      description: `A small lounge with comfortable seating and a beverage station. The dispenser is installed but not stocked. Floor-to-ceiling windows offer views south and east. A terminal displays: AMENITY SERVICE - CONFIGURATION PENDING.`,
      x: 0,
      y: 9,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%B2',
        west: '%B1_STUDY',
      },
      sittables: [
        {
          name: 'a lounge chair',
          capacity: 3,
          emptyMsg: 'Comfortable chairs wait unused.',
          occupiedMsg: '%s relaxing in the lounge',
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // WEST WING - Units C1, C2
    // ═══════════════════════════════════════════════════════════════════

    '%C1': {
      name: 'Smith Tower - 34th Floor - Unit C1 Foyer',
      description: `A unit entrance with a biometric scanner beside a seamless door. The panel displays: UNIT 34C1 - EXECUTIVE TIER - UNASSIGNED. The door is sealed, waiting for authorization.`,
      x: -3,
      y: 10,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%EL_z34',
        north: '%C2',
        south: '%C1_VIEW',
      },
    },

    '%C1_VIEW': {
      name: 'Smith Tower - 34th Floor - West Viewing Alcove',
      description: `A small windowed alcove with views of Pioneer Square below. The glass is clean, recently installed. A bench built into the wall sits empty. The lighting is soft, the space quiet.`,
      x: -3,
      y: 9,
      z: 34,
      population: 0,
      ambientNoise: 1,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%C1',
        east: '%A2',
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
      x: -3,
      y: 11,
      z: 34,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%C1',
        east: '%A1',
      },
    },
  },
};
