// Smith Tower - Condo Floor (z=34)
// Artist-themed floor with creative spaces

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%EL_z34' },
    },

    // Rentable locks
    '%RL_A2_z34': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2500,
      duration: 2678400000,
    },
    '%RL_B2_z34': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2500,
      duration: 2678400000,
    },
    '%RL_C2_z34': {
      prototype: 'rentableLock',
      name: 'C2 Rentable Lock',
      description: 'A rentable keypad/lock for unit C2.',
      price: 2500,
      duration: 2678400000,
    },

    // Doors
    '%D_A2_z34': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A sliding door with frosted glass panels.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z34'],
    },
    '%D_B2_z34': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted door with creative murals.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z34'],
    },
    '%D_C2_z34': {
      prototype: 'door',
      name: 'C2 Door',
      description: 'A door with layered paint in bright colors.',
      locked: true,
      open: false,
      locks: ['%RL_C2_z34'],
    },

    // Elevator landing
    '%EL_z34': {
      name: 'Condo Elevator Landing',
      description: 'A landing with paint-splattered concrete floors and track lighting overhead. The walls are exposed brick, marked with old sketches and color tests.',
      x: 1, y: 1, z: 34,
      exits: {
        north: { room: '%A2_z34', door: '%D_A2_z34' },
        east: { room: '%B2_z34', door: '%D_B2_z34' },
        south: { room: '%C2_z34', door: '%D_C2_z34' },
        in: '%E',
      },
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button'], self, 'callElevator');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        callElevator: "const player = args[0];\nconst floorNumber = 34;\nconst elevatorId = self.elevatorId || null;\n\nif (!elevatorId) {\n  return 'The call button clicks uselessly. No power.';\n}\n\nconst elevator = await $.load(elevatorId);\nif (!elevator) {\n  return 'Nothing answers the button press.';\n}\n\nif (elevator.currentFloor === floorNumber) {\n  if (!elevator.doorsOpen && elevator.openDoors) {\n    await elevator.openDoors();\n  }\n  return 'The elevator is already here.';\n}\n\nif (elevator.selectFloor) {\n  const result = await elevator.selectFloor(player, floorNumber);\n  return result?.message || 'You press the button. Machinery stirs above.';\n}\n\nreturn 'The button light flickers, but nothing happens.';",
      },
      elevatorId: '%E',
    },

    // Condo units

    '%A1_z34': {
      name: 'Condo A1',
      description: 'A studio with tall north-facing windows and polished concrete floors.',
      x: 0, y: 2, z: 34,
      exits: {"east":"%A2_z34"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 34).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%A2_z34': {
      name: 'Condo A2',
      description: 'A bright loft with high ceilings and skylights, hall-facing door to the south.',
      x: 1, y: 2, z: 34,
      exits: {"west":"%A1_z34","east":"%A3_z34","south":{"room":"%EL_z34","door":"%D_A2_z34"}},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 34).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%A3_z34': {
      name: 'Condo A3',
      description: 'A narrow room with exposed brick and wide windows.',
      x: 2, y: 2, z: 34,
      exits: {"west":"%A2_z34"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 34).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%B1_z34': {
      name: 'Condo B1',
      description: 'A corner space with vaulted ceilings and natural light.',
      x: 3, y: 2, z: 34,
      exits: {"south":"%B2_z34"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 34).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%C1_z34': {
      name: 'Condo C1',
      description: 'A quiet unit with painted walls and soft lighting.',
      x: 0, y: 1, z: 34,
      exits: {"south":"%C2_z34"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 34).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%B2_z34': {
      name: 'Condo B2',
      description: 'An open-plan suite with gallery walls, west-facing door toward the elevator.',
      x: 2, y: 1, z: 34,
      exits: {"north":"%B1_z34","east":"%B3_z34","west":{"room":"%EL_z34","door":"%D_B2_z34"},"south":"%B4_z34"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 34).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%B3_z34': {
      name: 'Condo B3',
      description: 'A small room with minimalist white walls and hardwood.',
      x: 3, y: 1, z: 34,
      exits: {"west":"%B2_z34"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 34).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%C2_z34': {
      name: 'Condo C2',
      description: 'A one-bedroom with creative finishes and a view, north-facing door to the elevator.',
      x: 0, y: 0, z: 34,
      exits: {"north":{"room":"%EL_z34","door":"%D_C2_z34"},"east":"%C3_z34"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 34).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%C3_z34': {
      name: 'Condo C3',
      description: 'A sunlit room with pale floors and large windows.',
      x: 1, y: 0, z: 34,
      exits: {"west":"%C2_z34","east":"%C4_z34"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 34).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%C4_z34': {
      name: 'Condo C4',
      description: 'A deep space with industrial finishes and vintage details.',
      x: 2, y: 0, z: 34,
      exits: {"west":"%C3_z34"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 34).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },

    '%B4_z34': {
      name: 'Condo B4',
      description: 'A compact end unit with clean lines and good light.',
      x: 3, y: 0, z: 34,
      exits: {"north":"%B2_z34"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you catch the street below: scooters weaving between delivery vans, bus brakes sighing, late-night sirens, and pedestrians threading past food carts. The wind rattles the glass as you watch the city shift far beneath you (floor 34).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
    },
  },
};
