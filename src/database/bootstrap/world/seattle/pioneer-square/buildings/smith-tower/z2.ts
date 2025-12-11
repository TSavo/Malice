// Smith Tower - Second Floor (z=2)
// Corporate support: executive offices, accounting, records, IT, break area

export const building = {
  rooms: {
    // Shared elevator car placeholder, reused from z1 via sharedPlaceholders
    '%E': {
      prototype: 'elevator',
      // no per-floor overrides here; z1 sets the elevator config
      exits: {
        out: '%F', // back to floor-2 elevator lobby
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // TOP ROW (y=+9)
    // ═══════════════════════════════════════════════════════════════════

    '%A': {
      // Corner Office North (-5, +9, 2)
      name: 'Corner Office (North)',
      description: `A corner office with north-facing windows looking over Washington Street. The glass is dirty but intact, muting the daylight to a diffuse grey. The desk is gone; indentations in the carpet show where it once stood. A credenza against the wall bears ring stains from long-evaporated coffee.`,
      x: -5,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%B',
      },
    },

    '%B': {
      // North Corridor Node (-4, +9, 2)
      name: 'North Corridor',
      description: `A short stretch of hallway with ceiling tiles ajar, showing conduit and sprinkler pipes. The carpet is commercial grade, worn thin. Dust has collected in the corners.`,
      x: -4,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 4,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%A',
        east: '%C',
        south: '%F',
      },
    },

    '%C': {
      // Conference B (-3, +9, 2)
      name: 'Conference Room B',
      description: `Glass walls on two sides give this room a view of the corridor and the street beyond. The table is gone; impressions in the carpet trace its outline. A wall-mount for a display hangs empty, cables snaked back into the wall.`,
      x: -3,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%B',
        east: '%D',
        south: '%G',
      },
    },

    '%D': {
      // Records Staging (-2, +9, 2)
      name: 'Records Staging',
      description: `Rolling carts and empty banker boxes are scattered across the floor. Labels read QUARTERLIES and AUDIT 3Y RETAIN, faded to grey. Metal shelving lines one wall, mostly bare, a few binders slumped and mildewed.`,
      x: -2,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%C',
        south: '%H',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // MIDDLE ROW (y=+8)
    // ═══════════════════════════════════════════════════════════════════

    '%E1': {
      // Break Room (-5, +8, 2)
      name: 'Break Room',
      description: `A small break room with a dead microwave, a coffee maker missing its carafe, and a refrigerator wedged open to prevent the smell from becoming worse. Cabinet doors hang slightly ajar. Someone scrawled DO NOT CLEAN on the whiteboard long ago.`,
      x: -5,
      y: 8,
      z: 2,
      population: 0,
      ambientNoise: 5,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%F',
        south: '%I',
      },
    },

    '%F': {
      // Elevator Lobby (-4, +8, 2)
      name: 'Elevator Lobby',
      description: `A compact elevator lobby with tarnished brass call buttons and a narrow landing. The carpet is threadbare near the doors. A wall panel lists tenants no longer here. The machinery hum is louder here, just behind the walls.`,
      x: -4,
      y: 8,
      z: 2,
      population: 0,
      ambientNoise: 10,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%E1',
        east: '%G',
        south: '%J',
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
          const floorNumber = 2;
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

    '%G': {
      // Accounting Pit (-3, +8, 2)
      name: 'Accounting Pit',
      description: `Rows of low cubicles fill the space, their fabric walls stained and sagging. Desktop mounts are empty, power strips dangle. The air smells faintly of stale coffee and dust.`,
      x: -3,
      y: 8,
      z: 2,
      population: 0,
      ambientNoise: 6,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%F',
        east: '%H',
        south: '%K',
        north: '%C',
      },
    },

    '%H': {
      // Records Archive (-2, +8, 2)
      name: 'Records Archive',
      description: `Compactor shelves line the walls, some still jammed in half-closed positions. A few drawers remain locked; others hang open, their folders curled and dusty. The air is dry, with a faint ozone tang from old dehumidifiers.`,
      x: -2,
      y: 8,
      z: 2,
      population: 0,
      ambientNoise: 4,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%G',
        north: '%D',
        south: '%L',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // BOTTOM ROW (y=+7)
    // ═══════════════════════════════════════════════════════════════════

    '%I': {
      // Copy/Print & Supplies (-5, +7, 2)
      name: 'Copy Room',
      description: `Two dead copiers dominate the room, their access panels open and toner streaked across the floor. Shelves of paper reams are mostly empty; a few packs remain, edges rippled from humidity.`,
      x: -5,
      y: 7,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%E1',
        east: '%J',
      },
    },

    '%J': {
      // IT Closet (-4, +7, 2)
      name: 'IT Closet',
      description: `A narrow room of metal racks, most of them stripped for parts. One UPS still hums faintly, its single LED winking amber. Patch panels are labeled but half the punchdowns are gone.`,
      x: -4,
      y: 7,
      z: 2,
      population: 0,
      ambientNoise: 8,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%F',
        east: '%K',
      },
    },

    '%K': {
      // Shared Offices (-3, +7, 2)
      name: 'Shared Offices',
      description: `A pair of small offices carved out of a larger open space. Glass sidelights on the doors are cracked. The carpet is cleaner here, as if someone tried to keep this area presentable longer.`,
      x: -3,
      y: 7,
      z: 2,
      population: 0,
      ambientNoise: 4,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%G',
        west: '%J',
        east: '%L',
      },
    },

    '%L': {
      // Corner Office South (-2, +7, 2)
      name: 'Corner Office (South)',
      description: `Windows along two walls face south and east. The view takes in Washington Street and the debris toward Yesler. A floor lamp lies on its side; its shade is dented.`,
      x: -2,
      y: 7,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%H',
        west: '%K',
      },
    },
  },
};
