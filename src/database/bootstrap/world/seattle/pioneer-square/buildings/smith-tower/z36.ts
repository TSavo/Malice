// Smith Tower - Mall Floor (z=36)
// Automated retail level, post-Event rebuilding

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%CONCOURSE' },
    },

    '%CONCOURSE': {
      name: 'Mall Concourse',
      description: 'A wide corridor with polished tile floors and overhead LED strips, half of them dead. Storefronts line both sides, their security shutters frozen in various states. A directory screen flickers near the elevator, displaying mall hours that no longer apply. The air smells of recycled ventilation and old plastics.',
      x: -4,
      y: 8,
      z: 36,
      population: 0,
      ambientNoise: 8,
      lighting: 60,
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
      name: 'Electronics Shop',
      description: 'A darkened storefront with wall-mounted displays showing dead screens. The security shutter is half-raised, stuck. Empty product pedestals line the walls. The air smells of dust and old plastic.',
      x: -4,
      y: 9,
      z: 36,
      population: 0,
      ambientNoise: 3,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%CONCOURSE',
      },
    },

    '%FASHION': {
      name: 'Clothing Boutique',
      description: 'An unmanned shop with racks of synthetic fabrics hanging in neat rows—athleisure, workwear, going-out clothes for a nightlife that ended. Price tags glow faintly. The checkout area blinks red: PAYMENT SYSTEM OFFLINE.',
      x: -4,
      y: 7,
      z: 36,
      population: 0,
      ambientNoise: 2,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%CONCOURSE',
      },
    },

    '%FOOD_COURT': {
      name: 'Food Court',
      description: 'A dining area with charging ports built into every surface. Service counters line one wall—noodles, protein synthesis, coffee. The air smells of synthetic teriyaki and burnt coffee. The floor is grimy, scattered with packaging from the last service day.',
      x: -3,
      y: 8,
      z: 36,
      population: 0,
      ambientNoise: 6,
      lighting: 65,
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
          emptyMsg: 'Empty tables are bolted to the floor.',
          occupiedMsg: '%s sitting at a food court table',
        },
      ],
    },

    '%NOODLE': {
      name: 'Noodle Counter',
      description: 'An automated noodle service counter. The dispensary sits silent, its last order still displayed on a screen—timestamp from three years ago. The drain below still smells faintly of broth.',
      x: -3,
      y: 9,
      z: 36,
      population: 0,
      ambientNoise: 1,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%FOOD_COURT',
      },
    },

    '%COFFEE': {
      name: 'Coffee Counter',
      description: 'A coffee service wall with numerous flavor modules. The touchscreen cycles boot errors in six languages. The dispensers are empty, their transparent sides showing dust and residue.',
      x: -3,
      y: 7,
      z: 36,
      population: 0,
      ambientNoise: 4,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%FOOD_COURT',
      },
    },

    '%PHARMACY': {
      name: 'Automated Pharmacy',
      description: 'A robotic dispensary behind reinforced plexiglass. The system is locked down—red lights pulse slowly. Prescription slots remain sealed. Behind the glass: rows of medication in automated retrieval, untouched. A screen reads PHARMACIST OVERRIDE REQUIRED.',
      x: -5,
      y: 8,
      z: 36,
      population: 0,
      ambientNoise: 5,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%CONCOURSE',
        south: '%WELLNESS',
      },
    },

    '%WELLNESS': {
      name: 'Medical Diagnostic Station',
      description: 'A self-service medical booth. The door hangs open, interior lights cycling through startup sequence endlessly. The diagnostic screen shows a pixelated anatomical diagram awaiting patient input.',
      x: -5,
      y: 7,
      z: 36,
      population: 0,
      ambientNoise: 3,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PHARMACY',
      },
    },
  },
};
