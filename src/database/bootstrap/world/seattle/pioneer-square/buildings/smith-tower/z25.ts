// Smith Tower - Condo Floor (z=25)
// Condo layout repeated across floors 4–33

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      // elevator core; config defined on z1
      exits: { out: '%EL_z25' },
    },


    // Rentable locks
    '%RL_A2_z25': {
      prototype: 'rentableLock',
      name: 'A2 Rentable Lock',
      description: 'A rentable keypad/lock for unit A2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_B2_z25': {
      prototype: 'rentableLock',
      name: 'B2 Rentable Lock',
      description: 'A rentable keypad/lock for unit B2.',
      price: 2000,
      duration: 2678400000,
    },
    '%RL_C3_z25': {
      prototype: 'rentableLock',
      name: 'C3 Rentable Lock',
      description: 'A rentable keypad/lock for unit C3.',
      price: 2000,
      duration: 2678400000,
    },


    // Doors
    '%D_A2_z25': {
      prototype: 'door',
      name: 'A2 Door',
      description: 'A solid condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_A2_z25'],
    },
    '%D_B2_z25': {
      prototype: 'door',
      name: 'B2 Door',
      description: 'A painted condo door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_B2_z25'],
    },
    '%D_C3_z25': {
      prototype: 'door',
      name: 'C3 Door',
      description: 'A steel fire door with a rental keypad.',
      locked: true,
      open: false,
      locks: ['%RL_C3_z25'],
    },


    // Elevator landing
    '%EL_z25': {
      name: 'Smith Tower - 25th Floor - Elevator Landing',
      description: 'A compact landing with scuffed brass trim and a single call panel.',
      x: -4, y: 8, z: 25,
      exits: {
        north: { room: '%A2_z25', door: '%D_A2_z25' },
        east: { room: '%B2_z25', door: '%D_B2_z25' },
        south: { room: '%C3_z25', door: '%D_C3_z25' },
        in: '%E',
      },
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button'], self, 'callElevator');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        callElevator: "const player = args[0];\nconst floorNumber = 25;\nconst elevatorId = self.elevatorId || null;\n\nif (!elevatorId) {\n  return 'The call button clicks uselessly. No power.';\n}\n\nconst elevator = await $.load(elevatorId);\nif (!elevator) {\n  return 'Nothing answers the button press.';\n}\n\nif (elevator.currentFloor === floorNumber) {\n  if (!elevator.doorsOpen && elevator.openDoors) {\n    await elevator.openDoors();\n  }\n  return 'The elevator is already here.';\n}\n\nif (elevator.selectFloor) {\n  const result = await elevator.selectFloor(player, floorNumber);\n  return result?.message || 'You press the button. Machinery stirs above.';\n}\n\nreturn 'The button light flickers, but nothing happens.';",
      },
      elevatorId: '%E',
    },


    // Condo units


    '%A1_z25': {
      name: 'Smith Tower - 25th Floor - North Suite - Living Room',
      description: 'A corner unit with tall windows and pale wood floors.',
      x: -5, y: 9, z: 25,
      exits: {"east":"%A2_z25"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
      sittables: [
        {
          name: 'a worn couch',
          capacity: 3,
          emptyMsg: 'A faded couch sits against the wall, cushions compressed from years of use.',
          occupiedMsg: '%s sprawled on the couch.',
        },
      ],
    },

    '%A2_z25': {
      name: 'Smith Tower - 25th Floor - North Suite - Bedroom',
      description: 'A bright one-bedroom overlooking the skyline, hall-facing door to the south.',
      x: -4, y: 9, z: 25,
      exits: {"west":"%A1_z25","east":"%A3_z25","south":{"room":"%EL_z25","door":"%D_A2_z25"}},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
      sittables: [
        {
          name: 'a dusty bed',
          capacity: 2,
          emptyMsg: 'A queen bed sits against the wall, sheets grey with age but still intact.',
          occupiedMsg: '%s resting on the bed.',
        },
      ],
    },

    '%A3_z25': {
      name: 'Smith Tower - 25th Floor - North Suite - Studio',
      description: 'A long studio with exposed brick and a narrow galley kitchen.',
      x: -3, y: 9, z: 25,
      exits: {"west":"%A2_z25"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
      sittables: [
        {
          name: 'a threadbare futon',
          capacity: 2,
          emptyMsg: 'A futon frame holds a thin mattress, serving as both couch and bed.',
          occupiedMsg: '%s lounging on the futon.',
        },
      ],
    },

    '%B1_z25': {
      name: 'Smith Tower - 25th Floor - East Suite - Loft',
      description: 'A lofted corner with sloped ceiling beams and a compact mezzanine.',
      x: -2, y: 9, z: 25,
      exits: {"south":"%B2_z25"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
      sittables: [
        {
          name: 'a sagging couch',
          capacity: 3,
          emptyMsg: 'A couch sits beneath the mezzanine, fabric worn smooth at the armrests.',
          occupiedMsg: '%s settled into the couch.',
        },
        {
          name: 'a loft bed',
          capacity: 1,
          emptyMsg: 'A narrow bed occupies the mezzanine above, accessible by ladder.',
          occupiedMsg: '%s up in the loft bed.',
        },
      ],
    },

    '%C1_z25': {
      name: 'Smith Tower - 25th Floor - South Suite - Alcove',
      description: 'A snug unit tucked behind the shaft, with one frosted window.',
      x: -5, y: 8, z: 25,
      exits: {"south":"%C2_z25"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
      sittables: [
        {
          name: 'a narrow cot',
          capacity: 1,
          emptyMsg: 'A military-style cot is wedged into the corner, blanket folded at the foot.',
          occupiedMsg: '%s lying on the cot.',
        },
      ],
    },

    '%B2_z25': {
      name: 'Smith Tower - 25th Floor - East Suite - Living Room',
      description: 'A two-room suite with a west-facing door toward the elevator.',
      x: -3, y: 8, z: 25,
      exits: {"north":"%B1_z25","east":"%B3_z25","west":{"room":"%EL_z25","door":"%D_B2_z25"},"south":"%B4_z25"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
      sittables: [
        {
          name: 'a faded sectional',
          capacity: 4,
          emptyMsg: 'A large sectional sofa dominates the main room, cushions sunken but serviceable.',
          occupiedMsg: '%s sunk into the sectional.',
        },
      ],
    },

    '%B3_z25': {
      name: 'Smith Tower - 25th Floor - East Suite - Den',
      description: 'A narrow end unit with a bay of small windows and built-ins.',
      x: -2, y: 8, z: 25,
      exits: {"west":"%B2_z25"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
      sittables: [
        {
          name: 'a reading chair',
          capacity: 1,
          emptyMsg: 'A wingback chair sits by the window bay, upholstery cracked but comfortable.',
          occupiedMsg: '%s curled up in the reading chair.',
        },
      ],
    },

    '%C2_z25': {
      name: 'Smith Tower - 25th Floor - South Suite - Living Room',
      description: 'A corner unit with western exposure and aged carpeting.',
      x: -5, y: 7, z: 25,
      exits: {"east":"%C3_z25"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
      sittables: [
        {
          name: 'an old loveseat',
          capacity: 2,
          emptyMsg: 'A compact loveseat faces the window, fabric faded to an indeterminate beige.',
          occupiedMsg: '%s squeezed onto the loveseat.',
        },
      ],
    },

    '%C3_z25': {
      name: 'Smith Tower - 25th Floor - South Suite - Foyer',
      description: 'The single entrance to the C block, with a stout fire door to the elevator.',
      x: -4, y: 7, z: 25,
      exits: {"north":{"room":"%EL_z25","door":"%D_C3_z25"},"west":"%C2_z25","east":"%C4_z25"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
      sittables: [
        {
          name: 'a checkered couch',
          capacity: 3,
          emptyMsg: 'A couch with a faded checkered pattern sits against the wall.',
          occupiedMsg: '%s relaxing on the checkered couch.',
        },
      ],
    },

    '%C4_z25': {
      name: 'Smith Tower - 25th Floor - South Suite - Bedroom',
      description: 'A deep plan with a recessed alcove and polished concrete floors.',
      x: -3, y: 7, z: 25,
      exits: {"west":"%C3_z25"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
      sittables: [
        {
          name: 'an alcove bed',
          capacity: 2,
          emptyMsg: 'A bed fills the recessed alcove, half-hidden by a moth-eaten curtain.',
          occupiedMsg: '%s tucked away in the alcove bed.',
        },
      ],
    },

    '%B4_z25': {
      name: 'Smith Tower - 25th Floor - East Suite - Bedroom',
      description: 'A compact end-cap with a single long window and built-in shelving.',
      x: -2, y: 7, z: 25,
      exits: {"north":"%B2_z25"},
      methods: {
        onContentArrived: "const obj = args[0];\nif (!obj?.registerVerb) return;\nawait obj.registerVerb(['look out window', 'look through window', 'gaze out window', 'look down'], self, 'lookOutWindow');",
        onContentLeaving: "const obj = args[0];\nif (obj?.unregisterVerbsFrom) {\n  await obj.unregisterVerbsFrom(self.id);\n}",
        lookOutWindow: "const player = args[0];\nreturn 'From this height above Pioneer Square, you see nothing. Empty streets, rusted vehicles frozen mid-journey, weeds claiming the pavement. The only movement is wind stirring debris and the occasional bird cutting across the grey sky. The glass rattles in its frame as you stare down at fifty-five years of silence (floor 25).';",
        onAnnounce: "const msg = args[0];\nawait self.tell(\"Through the window you notice below: \" + msg);",
      },
      sittables: [
        {
          name: 'a Murphy bed',
          capacity: 2,
          emptyMsg: 'A Murphy bed folds down from the wall, its mechanism still functional.',
          occupiedMsg: '%s stretched out on the Murphy bed.',
        },
      ],
    },
  },
};
