// Smith Tower - Mall Floor (z=37)
// Upper retail level, automated services

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%PROMENADE' },
    },

    '%PROMENADE': {
      name: 'Shopping Promenade',
      description: 'An upper-level retail corridor with skylights that filter grey daylight through grime. Digital advertising panels cycle through product promos for no one. The floor is synthetic wood laminate, scuffed but intact. Security cameras swivel on their mounts, tracking movement through dead systems.',
      x: -4,
      y: 8,
      z: 37,
      population: 0,
      ambientNoise: 7,
      lighting: 65,
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
      name: 'Automated Salon',
      description: 'A hair and beauty service station. Articulated arms hang from ceiling rails above adjustable seats. A color-mixing carousel sits idle. The booking screen displays available appointments for a Thursday that already happened. Swept hair still lies in corners.',
      x: -4,
      y: 9,
      z: 37,
      population: 0,
      ambientNoise: 2,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%PROMENADE',
      },
      sittables: [
        {
          name: 'a salon chair',
          capacity: 1,
          emptyMsg: 'Adjustable salon chairs sit empty.',
          occupiedMsg: '%s sitting in a salon chair',
        },
      ],
    },

    '%PET': {
      name: 'Pet Care Station',
      description: 'A self-service pet grooming and supply shop. Washing stations with temperature controls line one wall. Vending dispensers are locked now, their displays dark. The air still smells faintly of wet fur and pet shampoo.',
      x: -4,
      y: 7,
      z: 37,
      population: 0,
      ambientNoise: 3,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PROMENADE',
      },
    },

    '%GYM': {
      name: 'Automated Fitness Center',
      description: 'An unmanned gym accessed by membership card. The turnstile is stuck open. Rows of cardio equipment with dead screens, weight racks still loaded, resistance machines waiting. Touchless water dispensers blink red. The air smells of rubber mats and disinfectant.',
      x: -3,
      y: 8,
      z: 37,
      population: 0,
      ambientNoise: 9,
      lighting: 85,
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
          emptyMsg: 'Weight benches sit ready.',
          occupiedMsg: '%s using a weight bench',
        },
      ],
    },

    '%SHOWER': {
      name: 'Shower Bay',
      description: 'A communal shower facility with touchless controls and privacy partitions. Water still drips from one showerhead, a slow leak that never got fixed. Tile walls, floor drains, frosted glass. The towel dispenser is empty.',
      x: -3,
      y: 9,
      z: 37,
      population: 0,
      ambientNoise: 11,
      lighting: 75,
      waterLevel: 1,
      outdoor: false,
      exits: {
        south: '%GYM',
      },
    },

    '%GROCERY': {
      name: 'Micro Market',
      description: 'An automated convenience store with refrigerated walls and smart shelving. Most shelves are empty, weight sensors blinking error codes. A few shelf-stable items remain—protein bars, instant noodles, canned coffee. The refrigeration units died—everything inside spoiled long ago. Self-checkout gates stand open, payment terminals dark.',
      x: -5,
      y: 8,
      z: 37,
      population: 0,
      ambientNoise: 4,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%PROMENADE',
        south: '%STORAGE',
      },
    },

    '%STORAGE': {
      name: 'Stock Room',
      description: 'A back room with industrial shelving and inventory tracking screens. Boxes of shelf-stable goods sit unopened, their expiration dates long past. The inventory system displays STOCKOUT warnings in red.',
      x: -5,
      y: 7,
      z: 37,
      population: 0,
      ambientNoise: 2,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%GROCERY',
      },
    },
  },
};
