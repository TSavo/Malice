// Smith Tower - First Floor (z=1)
// Corporate-controlled building with bank, offices, and secured areas

export const building = {
  rooms: {
    '%E': {
      // Elevator Car (shared across floors)
      prototype: 'elevator',
      name: 'Elevator Car',
      description: `A metal elevator car with tarnished brass panels and a scuffed linoleum floor. The indicator above the door flickers between numbers but settles on something legible when it stops. The control panel still has power—most of the buttons light when pressed, a few are dead.

The car smells of machine oil and old dust. The doors are dented but intact, and the safety glass in the window is crazed with hairline fractures.`,
      x: -4,
      y: 8,
      z: 1,
      exits: {
        out: '%5', // Back to Elevator Bank (floor-specific lobby via floorRooms)
      },
      elevator: {
        floors: [1, 2, 3, 38, 39, 40],
        currentFloor: 1,
        doorsOpen: true,
        floorRooms: {
          1: '%5', // Floor 1 lobby/bank
          2: '%F', // Floor 2 lobby/bank (defined in z2)
          3: '%P', // Floor 3 lobby/bank (defined in z3)
          38: '%ZL', // Floor 38 landing (defined in z38)
          39: '%ODL', // Observation deck lobby (defined in z39)
          40: '%PHL', // Penthouse landing (defined in z40)
        },
        locks: ['%L1'],
      },
    },

    '%L1': {
      // Elevator biometric lock
      prototype: 'biometricLock',
      name: 'Elevator Retina Scanner',
      description: 'A recessed retinal scanner with a faint red glow.',
      scanners: [
        { type: 'retinal', part: 'eye', message: 'Retinal scan failed.' },
      ],
      authorizedUsers: {
        2: [],
        3: [],
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // TOP ROW (y=+9): Security Office, North Lobby, Office, Conference Room
    // ═══════════════════════════════════════════════════════════════════

    '%0': {
      // Security Office (-5, +9, 1)
      name: 'Security Office',
      description: `A small office, walls institutional grey and scuffed, marked where equipment was once bolted. The mounting brackets remain—empty metal arms reaching toward nothing where monitors used to hang. The fluorescent lights overhead flicker occasionally, their ballasts slowly dying. One fixture is dead entirely, the tubes removed or broken.

The air smells stale, circulated by vents that haven't been cleaned in years. This was building security once. Now it's just a room with empty walls and the ghost of purpose.`,
      x: -5,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%1', // To North Lobby
      },
    },

    '%1': {
      // North Lobby (-4, +9, 1)
      name: 'North Lobby',
      description: `The main entrance lobby, where visitors once checked in before being allowed further into the building. The space has high ceilings and marble floors, but the marble is cracked in places, the grout darkened with decades of grime. The ceiling tiles sag in spots where water has leaked through from above.

The back wall shows mounting holes and discolored paint where a company logo once hung. The lighting is uneven—some fixtures work, others flicker or stay dark. The air moves sluggishly through vents that haven't been cleaned in years. You can hear the building's systems humming faintly, struggling to maintain themselves.`,
      x: -4,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 8,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%0', // To Security Office
        east: '%2', // To Office
        south: '%4', // To West Lobby
      },
    },

    '%2': {
      // Office (-3, +9, 1)
      name: 'Office',
      description: `A mid-sized office with a window facing north toward the street. The window is grimy, filtering the daylight into a grey haze that barely illuminates the room. The walls are beige, or were once—now they're a mottled grey-brown, marked where pictures or certificates once hung.

The carpet is industrial grade, worn thin in paths where people walked repeatedly over the years. The air smells of dust and old paper. The ventilation hums quietly, circulating stale air that hasn't been fresh in years.`,
      x: -3,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%1', // To North Lobby
        east: '%3', // To Conference Room
        south: '%6', // To Bank Entry
      },
    },

    '%3': {
      // Conference Room (-2, +9, 1)
      name: 'Conference Room',
      description: `A meeting room, frozen in whatever configuration it held when the last meeting ended. The north wall has windows overlooking the street, but the glass is dirty enough to reduce the outside world to vague shapes and grey light. The other walls are bare, showing mounting brackets where screens or displays once hung.

The projector mount on the ceiling is empty, the equipment long since removed. The ventilation system hums quietly, circulating air that smells of old furniture and accumulated dust.`,
      x: -2,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%2', // To Office
        south: '%7', // To Hallway
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // MIDDLE ROW (y=+8): West Lobby, Elevator Bank, Bank Entry, Hallway
    // ═══════════════════════════════════════════════════════════════════

    '%4': {
      // West Lobby (-5, +8, 1)
      name: 'West Lobby',
      description: `A smaller lobby space that connects the main entrance to the western service areas. The floor is linoleum tile, scuffed and cracked, cheaper than the marble in the north lobby but functional enough. The walls are institutional grey, marked where furniture once stood against them.

This was a waiting area once, where people sat before meetings or appointments. The lighting here is dimmer than the main lobby, several fixtures either dead or removed. The working lights cast uneven pools of yellowish illumination. The ventilation hums steadily, a constant background noise. The western wall is solid exterior.`,
      x: -5,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 6,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%1', // To North Lobby
        east: '%5', // To Elevator Bank
        south: '%8', // To Vault
      },
    },

    '%5': {
      // Elevator Bank (-4, +8, 1)
      name: 'Elevator Bank',
      description: `A corridor lined with elevator doors, their brass surfaces tarnished green-brown with age. Three elevator shafts serve this floor—two for general access, one marked 'Freight Only' in faded lettering above its doors. The doors are scratched and dented, showing decades of use and neglect.

Above each elevator, indicator lights sit dark or flicker weakly. One set of doors stands slightly ajar, revealing the dark shaft beyond and the cables that still run up and down through the building. The elevators work—sometimes. You can hear machinery grinding somewhere above, the sound of motors that should have been replaced years ago.

The floor here is scuffed linoleum, marked with rubber scuffs and stains. The walls are institutional beige, decorated with nothing except faded fire evacuation diagrams behind scratched plastic.

The air smells faintly of machine oil and old metal. The ventilation is louder here, competing with the occasional groan of elevator machinery.`,
      x: -4,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 12,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%4', // To West Lobby
        east: '%6', // To Bank Entry
        in: '%E', // Into elevator car
      },
      methods: {
        onContentArrived: `
          const obj = args[0];
          if (!obj?.registerVerb) return;
          // Call elevator verbs
          await obj.registerVerb(['call elevator', 'summon elevator', 'press elevator button'], self, 'callElevator');
        `,
        onContentLeaving: `
          const obj = args[0];
          if (obj?.unregisterVerbsFrom) {
            await obj.unregisterVerbsFrom(self.id);
          }
        `,
        callElevator: `
          const player = args[0];
          const floorNumber = 1;
          const elevatorId = self.elevatorId || null;

          if (!elevatorId) {
            return 'The call button clicks uselessly. No power.';
          }

          const elevator = await $.load(elevatorId);
          if (!elevator) {
            return 'Nothing answers the button press.';
          }

          if (elevator.currentFloor === floorNumber) {
            if (!elevator.doorsOpen && elevator.openDoors) {
              await elevator.openDoors();
            }
            return 'The elevator is already here.';
          }

          if (elevator.selectFloor) {
            const result = await elevator.selectFloor(player, floorNumber);
            return result?.message || 'You press the button. Machinery stirs above.';
          }

          return 'The button light flickers, but nothing happens.';
        `,
      },
      elevatorId: '%E',
    },

    '%6': {
      // Bank Entry (-3, +8, 1)
      name: 'Bank Entry',
      description: `The entrance to the bank, marked by a change in flooring from linoleum to worn carpet. The air here smells different, less of dust and more of old paper and the faint chemical smell of whatever they used to clean the carpets back when cleaning happened regularly.

A camera mount in the ceiling corner is empty, its cable dangling loose. Someone removed the camera for parts or sale. The mounting bracket remains, a small metal arm reaching toward nothing.

The lighting is slightly better here than in the lobbies, as if the bank maintained its fixtures more carefully. Or maybe they just had better bulbs.`,
      x: -3,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 7,
      lighting: 80,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%2', // To Office
        west: '%5', // To Elevator Bank
        east: '%7', // To Hallway
        south: '%10', // To Bank Security
      },
    },

    '%7': {
      // Hallway (-2, +8, 1)
      name: 'Hallway',
      description: `A narrow corridor running north-south, connecting the conference room to the operations areas in the back. The walls are institutional grey, scuffed at hand-height where people steadied themselves while walking. The floor is linoleum, worn through to the underlayment in a path down the center.

The ceiling is drop-tile, several panels missing or hanging askew, revealing pipes and conduit above. The lighting is uneven—some fixtures work, others flicker or stay dark. The working lights cast pools of yellowish illumination that don't quite reach the corners.

Doorways open north and south, unmarked except for room numbers stenciled on the walls beside them in faded paint. The numbers are bureaucratic, meaningless without context. Room 108. Room 112. As if anyone cares.

The air is stale, circulated by a ventilation system that hums constantly but doesn't seem to refresh anything. It just moves the same air around, mixing the smell of dust with the faint chemical tang of old carpet.`,
      x: -2,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 4,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%3', // To Conference Room
        west: '%6', // To Bank Entry
        south: '%11', // To Operations
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // BOTTOM ROW (y=+7): Vault, Vault Antechamber, Security, Operations
    // ═══════════════════════════════════════════════════════════════════

    '%8': {
      // Vault (-5, +7, 1)
      name: 'Bank Vault',
      description: `The vault itself, a reinforced room with concrete walls two feet thick. The floor is bare concrete, stained in places with rust from water that leaked through the ceiling at some point. The ceiling itself is concrete too, pocked and cracked, showing the rebar beneath in spots.

The air is cold and still, almost dead. The vault has its own ventilation system, but it runs only occasionally, when power is available. A tomb for abandoned property.`,
      x: -5,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%4', // To West Lobby
        east: '%9', // To Vault Antechamber
      },
    },

    '%9': {
      // Vault Antechamber (-4, +7, 1)
      name: 'Vault Antechamber',
      description: `The security checkpoint before the vault, a small room with reinforced walls. This is where guards would have sat, watching monitors and checking credentials before allowing anyone into the vault. The monitors are gone now, just mounting brackets remaining on the wall.

The lighting is harsh fluorescent, all fixtures working, as if this space gets more maintenance than the rest of the building. Or maybe someone just replaced the bulbs recently because they needed to see what they were doing.`,
      x: -4,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 85,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%8', // To Vault
        north: '%6', // To Bank Entry
        east: '%10', // To Bank Security
      },
    },

    '%10': {
      // Bank Security (-3, +7, 1)
      name: 'Bank Security',
      description: `The bank's security operations room, where monitoring and alarm systems were once controlled. The walls are lined with empty equipment racks, their shelves bare, cables hanging loose where hardware was removed. A few mounting brackets remain, but the equipment itself is long gone—sold, scrapped, or cannibalized for parts.

The floor is linoleum tile, worn and cracked. One section near the door is stained dark where something spilled years ago and was never properly cleaned. The stain has the organic look of coffee or blood, but it's impossible to tell which after this long.

The lighting is uneven, several fixtures dark, the working ones casting harsh shadows across the empty racks. The ventilation hums steadily, circulating air that smells of dust and old electronics.`,
      x: -3,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 6,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%9', // To Vault Antechamber
        east: '%11', // To Operations
      },
    },

    '%11': {
      // Operations (-2, +7, 1)
      name: 'Operations',
      description: `The operations control room for the bank floor, where systems and procedures were managed. The walls show where equipment once stood, mounting holes and cable runs that lead to nothing now.

The lighting here is better than most rooms, possibly because someone still uses this space occasionally for something. Or maybe the fixtures just haven't failed yet. The ventilation works, circulating air that smells faintly of old paper and dust.`,
      x: -2,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%7', // To Hallway
        west: '%10', // To Bank Security
      },
    },
  },
};
