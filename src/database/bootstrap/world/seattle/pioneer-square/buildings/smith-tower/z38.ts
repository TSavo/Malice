// Smith Tower - Thirty-Eighth Floor (z=38)
// Upper office/rebroadcast level: hushed telecom room, dead lounge, roof service

export const building = {
  rooms: {
    // Shared elevator car placeholder
    '%E': {
      prototype: 'elevator',
      exits: {
        out: '%ZL', // back to floor-38 elevator landing
      },
    },

    '%ZL': {
      // Elevator Landing (-4, +8, 38)
      name: '38th-Floor Elevator Landing',
      description: `A narrow landing pressed against the outer wall of the tower's crown. Tarnished brass call buttons sit under a fogged plastic guard. Air vents in the ceiling leak a low electrical hum, and the plaster shows hairline cracks from settling. A metal hatch overhead is stenciled ROOF ACCESS and looks frozen in place by corrosion.`,
      x: -4,
      y: 8,
      z: 38,
      population: 0,
      ambientNoise: 9,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%ZR',
        east: '%ZS',
        south: '%ZT',
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
          const floorNumber = 38;
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

    '%ZR': {
      // Relay/Telecom Room (-5, +8, 38)
      name: 'Relay Room',
      description: `Metal relay racks march along the walls, most gutted, a few still holding anonymous black boxes with dark LEDs. Bundles of coax and armored pairs dive into overhead conduit that disappears toward the spire. A laminated repeater chart curls on a clipboard, entries crossed out in red grease pencil. The air is dry, sharp with old solder and dust.`,
      x: -5,
      y: 8,
      z: 38,
      population: 0,
      ambientNoise: 11,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ZL',
      },
    },

    '%ZS': {
      // Service Closet (-3, +8, 38)
      name: 'Service Closet',
      description: `A narrow service closet with a rust-stained utility sink, empty mop hooks, and a dented metal cabinet stenciled SPARE PARTS. The linoleum is tacky underfoot from spilled solvent that never fully evaporated.`,
      x: -3,
      y: 8,
      z: 38,
      population: 0,
      ambientNoise: 3,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%ZL',
      },
    },

    '%ZT': {
      // Lounge Stub (-4, +7, 38)
      name: 'Abandoned Lounge',
      description: `A cramped lounge carved out beside the shaft. Painted-over windows turn the room into a dusk-blue box. A cracked leather bench slumps under peeling varnish, and an unplugged neon sign reads OBS DECK in flaking glass. A fire door marked STAIRS TO DECK is chained and padlocked to the south.`,
      x: -4,
      y: 7,
      z: 38,
      population: 0,
      ambientNoise: 5,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ZL',
        south: { room: '%ZSTAIR', locked: true },
      },
    },

    '%ZSTAIR': {
      // Stub object for stairs up toward observation deck
      name: 'Stairwell to Deck',
      description: `A steep steel stair cuts upward through a shaft lined in peeling paint. Dust halos each tread. Above, a chained door rattles faintly when the building shifts.`,
      x: -4,
      y: 6,
      z: 38,
      population: 0,
      ambientNoise: 4,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ZT',
        up: '%ODL',
      },
    },
  },
};
