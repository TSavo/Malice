// Smith Tower - Retail Level 1 (z=36)
// Continuum retail infrastructure - prepared spaces awaiting build-out

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%CONCOURSE' },
    },

    '%CONCOURSE': {
      name: 'Smith Tower - 36th Floor - Retail Concourse',
      description: `A wide corridor with fresh tile floors and overhead LED strips humming with new power. Storefronts line both sides, their security gates raised to show empty interiors. A directory screen displays: CONTINUUM RETAIL SERVICES - OPENINGS SOON. The air smells of fresh paint and cleaning solution.`,
      x: -4,
      y: 8,
      z: 36,
      population: 0,
      ambientNoise: 6,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%TECH',
        south: '%FASHION',
        east: '%FOOD_COURT',
        west: '%PHARMACY',
        in: '%E',
      },
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button'], self, 'callElevator');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        callElevator: "const player = args[0];\nconst floorNumber = 36;\nconst elevatorId = self.elevatorId || null;\n\nif (!elevatorId) {\n  return 'The call button clicks uselessly. No power.';\n}\n\nconst elevator = await $.load(elevatorId);\nif (!elevator) {\n  return 'Nothing answers the button press.';\n}\n\nif (elevator.currentFloor === floorNumber) {\n  if (!elevator.doorsOpen && elevator.openDoors) {\n    await elevator.openDoors();\n  }\n  return 'The elevator is already here.';\n}\n\nif (elevator.selectFloor) {\n  const result = await elevator.selectFloor(player, floorNumber);\n  return result?.message || 'You press the button. Machinery stirs above.';\n}\n\nreturn 'The button light flickers, but nothing happens.';",
      },
      elevatorId: '%E',
    },

    '%TECH': {
      name: 'Smith Tower - 36th Floor - Tech Shop',
      description: `An empty storefront with wall-mounted display brackets and power conduits terminated in clean boxes. Shelving frames stand unpopulated. A terminal by the entrance reads: ELECTRONICS RETAIL - INVENTORY PENDING - CONFIGURATION REQUIRED. The space is ready, waiting for stock.`,
      x: -4,
      y: 9,
      z: 36,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%CONCOURSE',
      },
    },

    '%FASHION': {
      name: 'Smith Tower - 36th Floor - Clothing Shop',
      description: `An empty retail space with clothing racks arranged but bare. Fitting room curtains hang clean and unused. A point-of-sale terminal displays: APPAREL RETAIL - AWAITING STOCK DELIVERY. Empty mannequin stands wait in the corners.`,
      x: -4,
      y: 7,
      z: 36,
      population: 0,
      ambientNoise: 2,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%CONCOURSE',
      },
    },

    '%FOOD_COURT': {
      name: 'Smith Tower - 36th Floor - Food Court',
      description: `A dining area with clean tables and charging ports at every surface. Service counter bays line one wall, each with a shuttered service window and terminal reading: VENDOR STATION - NOT CONFIGURED. The ventilation hums, ready for cooking that hasn't started. The floor is spotless.`,
      x: -3,
      y: 8,
      z: 36,
      population: 0,
      ambientNoise: 5,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%CONCOURSE',
        north: '%NOODLE',
        south: '%COFFEE',
      },
      sittables: [
        {
          name: 'a food court table',
          capacity: 4,
          emptyMsg: 'Clean tables wait for diners.',
          occupiedMsg: '%s sitting at a food court table',
        },
      ],
    },

    '%NOODLE': {
      name: 'Smith Tower - 36th Floor - Noodle Vendor',
      description: `A service counter with automated dispensary equipment mounted but not configured. Clean stainless steel surfaces. A screen displays: NOODLE SERVICE - SYSTEM NOT INITIALIZED - REQUIRES TECHNICIAN. Supply hoppers are empty and open.`,
      x: -3,
      y: 9,
      z: 36,
      population: 0,
      ambientNoise: 4,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%FOOD_COURT',
      },
    },

    '%COFFEE': {
      name: 'Smith Tower - 36th Floor - Coffee Vendor',
      description: `A coffee service wall with flavor modules in sealed packaging stacked nearby. The dispensers are clean and unused. A touchscreen reads: BEVERAGE SERVICE - CONFIGURATION INCOMPLETE - STOCK REQUIRED.`,
      x: -3,
      y: 7,
      z: 36,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%FOOD_COURT',
      },
    },

    '%PHARMACY': {
      name: 'Smith Tower - 36th Floor - Pharmacy',
      description: `A medical dispensary behind reinforced plexiglass. The automated retrieval system is installed but empty, robotic arms at rest. A terminal displays: PHARMACY SERVICES - INVENTORY NOT LOADED - PHARMACIST CERTIFICATION REQUIRED. The space is sterile and ready.`,
      x: -5,
      y: 8,
      z: 36,
      population: 0,
      ambientNoise: 4,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%CONCOURSE',
        south: '%WELLNESS',
      },
    },

    '%WELLNESS': {
      name: 'Smith Tower - 36th Floor - Medical Station',
      description: `A diagnostic booth with the door propped open. Medical sensors are installed but uncalibrated. The diagnostic screen shows: HEALTH SERVICES - SYSTEM CALIBRATION PENDING - MEDICAL STAFF REQUIRED.`,
      x: -5,
      y: 7,
      z: 36,
      population: 0,
      ambientNoise: 2,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PHARMACY',
      },
    },
  },
};
