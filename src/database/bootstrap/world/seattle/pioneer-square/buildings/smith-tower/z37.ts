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
      x: -4,
      y: 8,
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
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button'], self, 'callElevator');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        callElevator: "const player = args[0];\nconst floorNumber = 37;\nconst elevatorId = self.elevatorId || null;\n\nif (!elevatorId) {\n  return 'The call button clicks uselessly. No power.';\n}\n\nconst elevator = await $.load(elevatorId);\nif (!elevator) {\n  return 'Nothing answers the button press.';\n}\n\nif (elevator.currentFloor === floorNumber) {\n  if (!elevator.doorsOpen && elevator.openDoors) {\n    await elevator.openDoors();\n  }\n  return 'The elevator is already here.';\n}\n\nif (elevator.selectFloor) {\n  const result = await elevator.selectFloor(player, floorNumber);\n  return result?.message || 'You press the button. Machinery stirs above.';\n}\n\nreturn 'The button light flickers, but nothing happens.';",
      },
      elevatorId: '%E',
    },

    '%SALON': {
      name: 'Smith Tower - 37th Floor - Salon',
      description: `A beauty service space with articulated robotic arms mounted on ceiling rails but locked in maintenance position. Adjustable salon chairs are covered in protective plastic. A booking screen displays: AUTOMATED SALON - EQUIPMENT CALIBRATION REQUIRED - PRODUCT INVENTORY NEEDED.`,
      x: -4,
      y: 9,
      z: 37,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%PROMENADE',
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
      x: -4,
      y: 7,
      z: 37,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PROMENADE',
      },
    },

    '%GYM': {
      name: 'Smith Tower - 37th Floor - Fitness Center',
      description: `An unmanned gym space with cardio equipment still in shipping wrap. Weight racks are installed but unloaded. Resistance machines have protective covers. A turnstile stands unlocked. A screen displays: FITNESS CENTER - EQUIPMENT SETUP INCOMPLETE - MEMBERSHIP SYSTEM NOT ACTIVE.`,
      x: -3,
      y: 8,
      z: 37,
      population: 0,
      ambientNoise: 4,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PROMENADE',
        north: '%SHOWER',
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
      x: -3,
      y: 9,
      z: 37,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%GYM',
      },
    },

    '%GROCERY': {
      name: 'Smith Tower - 37th Floor - Market',
      description: `An automated convenience store with refrigerated wall units powered but empty. Smart shelving displays error codes for missing inventory. Self-checkout gates are installed but show: MARKET SERVICES - INVENTORY LOADING REQUIRED - PRICING DATABASE NOT CONFIGURED. The space is ready, waiting for stock.`,
      x: -5,
      y: 8,
      z: 37,
      population: 0,
      ambientNoise: 6,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%PROMENADE',
        south: '%STORAGE',
      },
    },

    '%STORAGE': {
      name: 'Smith Tower - 37th Floor - Stock Room',
      description: `A back room with industrial shelving installed but empty. Inventory tracking screens display: NO STOCK LOADED. The space is clean, organized, ready for deliveries that haven't arrived.`,
      x: -5,
      y: 7,
      z: 37,
      population: 0,
      ambientNoise: 2,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%GROCERY',
      },
    },
  },
};
