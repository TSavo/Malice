// Smith Tower - Retail Level 2 (z=37)
// Continuum service infrastructure - prepared spaces awaiting build-out

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%PROMENADE' },
    },

    '%PROMENADE': {
      name: 'Smith Tower - 37th Floor - Service Promenade',
      description: `An upper retail corridor with skylights showing grey daylight. Service storefronts display digital signs reading COMING SOON. The floor is clean synthetic laminate. Security cameras are installed but show standby lights. Everything is new, nothing is operational.`,
      x: -12,
      y: 10,
      z: 37,
      population: 0,
      ambientNoise: 5,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%SALON',
        south: '%PET',
        east: '%GYM',
        west: '%GROCERY',
        in: '%E',
      },
      elevatorId: '%E',
    },

    '%SALON': {
      name: 'Smith Tower - 37th Floor - Salon',
      description: `A beauty service space with articulated robotic arms mounted on ceiling rails but locked in maintenance position. Adjustable salon chairs are covered in protective plastic. A booking screen displays: AUTOMATED SALON - EQUIPMENT CALIBRATION REQUIRED - PRODUCT INVENTORY NEEDED.`,
      x: -12,
      y: 11,
      z: 37,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%PROMENADE',
        west: '%LAUNDRY',
        east: '%SHOWER',
      },
      sittables: [
        {
          name: 'a salon chair',
          capacity: 1,
          emptyMsg: 'Salon chairs sit wrapped in plastic.',
          occupiedMsg: '%s sitting in a salon chair',
        },
      ],
    },

    '%PET': {
      name: 'Smith Tower - 37th Floor - Pet Services',
      description: `A pet care facility with washing stations installed but dry. Vending dispensers are mounted but empty, their displays dark. Supply racks are bare. A terminal reads: PET CARE SERVICES - SUPPLY LOADING REQUIRED - SYSTEM CONFIGURATION PENDING.`,
      x: -12,
      y: 9,
      z: 37,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PROMENADE',
        west: '%STORAGE',
        east: '%SAUNA',
      },
    },

    '%GYM': {
      name: 'Smith Tower - 37th Floor - Fitness Center',
      description: `An unmanned gym space with cardio equipment still in shipping wrap. Weight racks are installed but unloaded. Resistance machines have protective covers. A turnstile stands unlocked. A screen displays: FITNESS CENTER - EQUIPMENT SETUP INCOMPLETE - MEMBERSHIP SYSTEM NOT ACTIVE.`,
      x: -11,
      y: 10,
      z: 37,
      population: 0,
      ambientNoise: 4,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PROMENADE',
        north: '%SHOWER',
        south: '%SAUNA',
        east: '%RECREATION',
      },
      sittables: [
        {
          name: 'a weight bench',
          capacity: 1,
          emptyMsg: 'Weight benches sit covered in plastic.',
          occupiedMsg: '%s using a weight bench',
        },
      ],
    },

    '%SHOWER': {
      name: 'Smith Tower - 37th Floor - Shower Facility',
      description: `A communal shower area with touchless controls installed but not programmed. Tile walls are clean and new. Privacy partitions are in place. The towel dispenser is empty. A notice reads: FACILITY SETUP INCOMPLETE - WATER SYSTEM TESTING REQUIRED.`,
      x: -11,
      y: 11,
      z: 37,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%GYM',
        west: '%SALON',
        east: '%LOCKERS',
      },
    },

    '%GROCERY': {
      name: 'Smith Tower - 37th Floor - Market',
      description: `An automated convenience store with refrigerated wall units powered but empty. Smart shelving displays error codes for missing inventory. Self-checkout gates are installed but show: MARKET SERVICES - INVENTORY LOADING REQUIRED - PRICING DATABASE NOT CONFIGURED. The space is ready, waiting for stock.`,
      x: -13,
      y: 10,
      z: 37,
      population: 0,
      ambientNoise: 6,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%PROMENADE',
        south: '%STORAGE',
        north: '%LAUNDRY',
      },
    },

    '%STORAGE': {
      name: 'Smith Tower - 37th Floor - Stock Room',
      description: `A back room with industrial shelving installed but empty. Inventory tracking screens display: NO STOCK LOADED. The space is clean, organized, ready for deliveries that haven't arrived.`,
      x: -13,
      y: 9,
      z: 37,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%GROCERY',
        east: '%PET',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // CORNER SERVICES
    // ═══════════════════════════════════════════════════════════════════

    '%LAUNDRY': {
      name: 'Smith Tower - 37th Floor - Laundry Center',
      description: `A self-service laundry with rows of industrial washers and dryers - all new, all silent. Folding tables line one wall. A payment terminal displays: LAUNDRY SERVICES - WATER CONNECTION PENDING - PAYMENT SYSTEM NOT CONFIGURED. Detergent dispensers sit empty.`,
      x: -13,
      y: 11,
      z: 37,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%GROCERY',
        east: '%SALON',
      },
    },

    '%LOCKERS': {
      name: 'Smith Tower - 37th Floor - Personal Storage',
      description: `A wall of smart lockers with biometric readers. Each unit displays: AVAILABLE - REGISTRATION REQUIRED. The space smells of new metal and plastic. A kiosk reads: LOCKER SERVICES - ENROLLMENT SYSTEM NOT ACTIVE.`,
      x: -10,
      y: 11,
      z: 37,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%RECREATION',
        west: '%SHOWER',
      },
    },

    '%RECREATION': {
      name: 'Smith Tower - 37th Floor - Recreation Room',
      description: `A leisure space with gaming tables covered in plastic and wall-mounted screens still in boxes. Comfortable seating arranged in clusters. A terminal reads: RECREATION SERVICES - ENTERTAINMENT SYSTEM CONFIGURATION REQUIRED. The space is bright, modern, waiting.`,
      x: -10,
      y: 10,
      z: 37,
      population: 0,
      ambientNoise: 3,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LOCKERS',
        south: '%CHANGING',
        west: '%GYM',
      },
      sittables: [
        {
          name: 'a gaming chair',
          capacity: 4,
          emptyMsg: 'Gaming chairs wait unused.',
          occupiedMsg: '%s relaxing in the recreation room',
        },
      ],
    },

    '%SAUNA': {
      name: 'Smith Tower - 37th Floor - Dry Sauna',
      description: `A cedar-lined sauna chamber with tiered benches. The heating elements are installed but cold. A thermometer reads room temperature. A sign states: SAUNA SERVICES - HEATING SYSTEM TEST REQUIRED - DO NOT OPERATE.`,
      x: -11,
      y: 9,
      z: 37,
      population: 0,
      ambientNoise: 1,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%GYM',
        west: '%PET',
        east: '%CHANGING',
      },
      sittables: [
        {
          name: 'a sauna bench',
          capacity: 4,
          emptyMsg: 'Wooden benches line the walls.',
          occupiedMsg: '%s sitting in the sauna',
        },
      ],
    },

    '%CHANGING': {
      name: 'Smith Tower - 37th Floor - Changing Room',
      description: `A private changing area with individual stalls and benches. Mirrors are clean and new. Towel hooks are empty. A dispenser reads: AMENITY SUPPLIES NOT LOADED. The space is quiet, bright, and unused.`,
      x: -10,
      y: 9,
      z: 37,
      population: 0,
      ambientNoise: 1,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%RECREATION',
        west: '%SAUNA',
      },
      sittables: [
        {
          name: 'a changing bench',
          capacity: 2,
          emptyMsg: 'Benches wait in the stalls.',
          occupiedMsg: '%s using a changing stall',
        },
      ],
    },
  },
};
