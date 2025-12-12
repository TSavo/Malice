// Smith Tower - Condo Floor (z=26)
// Condo layout repeated across floors 4–33

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z26' },
    },


    // Rentable locks
    '%RL_A2_z26': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z26': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C2_z26': {
      prototype: 'rentableLock',
      name: 'C2 Rentable Lock',
      description: 'A rentable keypad/lock for unit C2.',
      price: 2000,
      duration: 2678400000,
    },


    // Doors
    '%D_A2_z26': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z26'],
    },
    '%D_B2_z26': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z26'],
    },
    '%D_C2_z26': {
      prototype: 'door',
      name: 'C2 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C2_z26'],
    },


    // Elevator landing
    '%EL_z26': {
      name: 'Condo Elevator Landing',
      description: 'A compact landing with scuffed brass trim and a single call panel.',
      x: 1, y: 1, z: 26,
      exits: {
        north: { room: '%A2_z26', door: '%D_A2_z26' },
        east: { room: '%B2_z26', door: '%D_B2_z26' },
        south: { room: '%C2_z26', door: '%D_C2_z26' },
        in: '%E',
      },
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button'], self, 'callElevator');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        callElevator: "const player = args[0];\nconst floorNumber = 26;\nconst elevatorId = self.elevatorId || null;\n\nif (!elevatorId) {\n  return 'The call button clicks uselessly. No power.';\n}\n\nconst elevator = await $.load(elevatorId);\nif (!elevator) {\n  return 'Nothing answers the button press.';\n}\n\nif (elevator.currentFloor === floorNumber) {\n  if (!elevator.doorsOpen && elevator.openDoors) {\n    await elevator.openDoors();\n  }\n  return 'The elevator is already here.';\n}\n\nif (elevator.selectFloor) {\n  const result = await elevator.selectFloor(player, floorNumber);\n  return result?.message || 'You press the button. Machinery stirs above.';\n}\n\nreturn 'The button light flickers, but nothing happens.';",
      },
      elevatorId: '%E',
    },


    // Condo units


    '%A1_z26': {
      name: 'Condo A1',
      description: 'A corner unit with tall windows and pale wood floors.',
      x: 0, y: 2, z: 26,
      exits: {\"east\":\"%A2_z26\"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 26).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%A2_z26': {
      name: 'Condo A2',
      description: 'A bright one-bedroom overlooking the skyline, hall-facing door to the south.',
      x: 1, y: 2, z: 26,
      exits: {\"west\":\"%A1_z26\",\"east\":\"%A3_z26\",\"south\":{\"room\":\"%EL_z26\",\"door\":\"%D_A2_z26\"}},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 26).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%A3_z26': {
      name: 'Condo A3',
      description: 'A long studio with exposed brick and a narrow galley kitchen.',
      x: 2, y: 2, z: 26,
      exits: {\"west\":\"%A2_z26\"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 26).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%B1_z26': {
      name: 'Condo B1',
      description: 'A lofted corner with sloped ceiling beams and a compact mezzanine.',
      x: 3, y: 2, z: 26,
      exits: {\"south\":\"%B2_z26\"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 26).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%C1_z26': {
      name: 'Condo C1',
      description: 'A snug unit tucked behind the shaft, with one frosted window.',
      x: 0, y: 1, z: 26,
      exits: {\"south\":\"%C2_z26\"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 26).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%B2_z26': {
      name: 'Condo B2',
      description: 'A two-room suite with a west-facing door toward the elevator.',
      x: 2, y: 1, z: 26,
      exits: {\"north\":\"%B1_z26\",\"east\":\"%B3_z26\",\"west\":{\"room\":\"%EL_z26\",\"door\":\"%D_B2_z26\"},\"south\":\"%B4_z26\"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 26).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%B3_z26': {
      name: 'Condo B3',
      description: 'A narrow end unit with a bay of small windows and built-ins.',
      x: 3, y: 1, z: 26,
      exits: {\"west\":\"%B2_z26\"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 26).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%C2_z26': {
      name: 'Condo C2',
      description: 'The single entrance to the C block, with a stout fire door to the elevator.',
      x: 0, y: 0, z: 26,
      exits: {\"north\":{\"room\":\"%EL_z26\",\"door\":\"%D_C2_z26\"},\"east\":\"%C3_z26\"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 26).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%C3_z26': {
      name: 'Condo C3',
      description: 'A mid-size unit with a checkerboard tile foyer and south light.',
      x: 1, y: 0, z: 26,
      exits: {\"west\":\"%C2_z26\",\"east\":\"%C4_z26\"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 26).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%C4_z26': {
      name: 'Condo C4',
      description: 'A deep plan with a recessed alcove and polished concrete floors.',
      x: 2, y: 0, z: 26,
      exits: {\"west\":\"%C3_z26\"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 26).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%B4_z26': {
      name: 'Condo B4',
      description: 'A compact end-cap with a single long window and built-in shelving.',
      x: 3, y: 0, z: 26,
      exits: {\"north\":\"%B2_z26\"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 26).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },
  },
};
