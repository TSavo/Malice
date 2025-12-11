// Smith Tower - Third Floor (z=3)
// Security & Operations: HQ, armory cage, server/comms, mechanical, secured records

export const building = {
  rooms: {
    // Shared elevator car (declared in z1), reuse placeholder
    '%E': {
      prototype: 'elevator',
      exits: {
        out: '%P', // back to floor-3 elevator lobby
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // TOP ROW (y=+9)
    // ═══════════════════════════════════════════════════════════════════

    '%M': {
      // Security HQ (-5, +9, 3)
      name: 'Security HQ',
      description: `A central security room lined with empty monitor mounts. A few screens still hang, dark but intact. A rack-mounted DVR blinks a lone amber light, fan whining weakly. A laminated evacuation map curls on the wall.`,
      x: -5,
      y: 9,
      z: 3,
      population: 0,
      ambientNoise: 6,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%N',
      },
    },

    '%N': {
      // Incident Response Room (-4, +9, 3)
      name: 'Incident Response Room',
      description: `A long table with overturned chairs, a wallboard listing shifts and radio call signs. Markers lie dried on the floor. Someone circled FLOOR 5 POWER in red ink.`,
      x: -4,
      y: 9,
      z: 3,
      population: 0,
      ambientNoise: 4,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%M',
        east: '%O',
        south: '%P',
      },
    },

    '%O': {
      // Secure Records (-3, +9, 3)
      name: 'Secure Records',
      description: `Tall cabinets with combination dials stand against the wall, many already pried open. A few drawers remain locked. Red-striped folders lie scattered, pages blacked out with marker.`,
      x: -3,
      y: 9,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%N',
        east: '%Q',
        south: '%S',
      },
    },

    '%Q': {
      // Server/Comms Room (-2, +9, 3)
      name: 'Server/Comms Room',
      description: `A narrow server room with cage doors left unlocked. Half the racks are stripped; the remainder host silent switches and a single UPS humming with an amber warning LED. Cable trays overhead droop under their own weight.`,
      x: -2,
      y: 9,
      z: 3,
      population: 0,
      ambientNoise: 10,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%O',
        south: '%T',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // MIDDLE ROW (y=+8)
    // ═══════════════════════════════════════════════════════════════════

    '%R': {
      // Mechanical/Service (-5, +8, 3)
      name: 'Mechanical Room',
      description: `Pumps, conduits, and a breaker panel line the walls. Labels for ELEV 1/2/3 are handwritten. A service cart holds tools and spare fuses.`,
      x: -5,
      y: 8,
      z: 3,
      population: 0,
      ambientNoise: 12,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%P',
        south: '%U',
      },
    },

    '%P': {
      // Elevator Lobby (-4, +8, 3)
      name: 'Elevator Lobby',
      description: `A tight landing with scuffed floor tiles and a brass call panel. The machinery noise is close and insistent here.`,
      x: -4,
      y: 8,
      z: 3,
      population: 0,
      ambientNoise: 11,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%R',
        east: '%S',
        south: '%V',
        in: '%E',
      },
      methods: {
        onContentArrived: `
          const obj = args[0];
          if (!obj?.registerVerb) return;
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
          const floorNumber = 3;
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

    '%S': {
      // Armory Cage (-3, +8, 3)
      name: 'Armory Cage',
      description: `A chain-link cage with a heavy hasp stands open. Weapon racks inside are mostly bare, a few empty holsters and broken batons remain. A checklist clipboard hangs by a frayed string.`,
      x: -3,
      y: 8,
      z: 3,
      population: 0,
      ambientNoise: 5,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%P',
        east: '%T',
        north: '%O',
      },
    },

    '%T': {
      // Comms Annex (-2, +8, 3)
      name: 'Comms Annex',
      description: `A side room with wall jacks and an old patch panel labeled RF BACKBONE. An equipment rack lies on its side, cabling spilling out like intestines.`,
      x: -2,
      y: 8,
      z: 3,
      population: 0,
      ambientNoise: 6,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%S',
        north: '%Q',
        south: '%W',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // BOTTOM ROW (y=+7)
    // ═══════════════════════════════════════════════════════════════════

    '%U': {
      // Janitor Closet (-5, +7, 3)
      name: 'Janitor Closet',
      description: `Mops hardened in their buckets, a rusted sink, and shelves of cleaners that have separated into layers. The air is sharp with ammonia.`,
      x: -5,
      y: 7,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%R',
        east: '%V',
      },
    },

    '%V': {
      // Stairwell Access (-4, +7, 3)
      name: 'Stairwell Access',
      description: `A metal door with a crash bar opens to concrete stairs. Painted numbers read FLOOR 3. Emergency lighting glows dimly along the tread edges.`,
      x: -4,
      y: 7,
      z: 3,
      population: 0,
      ambientNoise: 4,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%P',
        east: '%W',
        down: '%5', // aligns with floor 1 elevator bank footprint
      },
    },

    '%W': {
      // Equipment Storage (-3, +7, 3)
      name: 'Equipment Storage',
      description: `Metal shelving with labeled bins: RADIOS, FLASHLIGHTS, FILTERS. Most bins are empty; a few cracked flashlights and dead batteries remain.`,
      x: -3,
      y: 7,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%S',
        west: '%V',
      },
    },
  },
};
