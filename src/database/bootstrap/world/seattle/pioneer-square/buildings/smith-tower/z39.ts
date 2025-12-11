// Smith Tower - Observation Deck Level (z=39)
// Public-ish observation deck with speakeasy remnants and chained access

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: {
        out: '%ODL',
      },
    },

    '%ODL': {
      // Observation Deck Landing (-4, +8, 39)
      name: 'Observation Deck Landing',
      description: `A cramped landing tucked just under the glass crown. Brass plaques listing emergency numbers are gouged by pocketknives. The air is cool and smells of stale liquor and metal polish. A chain-link gate blocks the stair down, and the elevator doors here are scarred by pry marks and boot dents.`,
      x: -4,
      y: 8,
      z: 39,
      population: 0,
      ambientNoise: 7,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%ODECK',
        east: '%ODB',
        in: '%E',
        down: '%ZSTAIR',
        up: '%PHL',
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
          const floorNumber = 39;
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

    '%ODECK': {
      // Observation Deck (-5, +8, 39)
      name: 'Observation Deck',
      description: `Tall glass panes arc around a slim walkway, offering a vertigo-inducing view of rooftops and freeways far below. Sun-faded placards point out landmarks that no longer match the skyline. Several cracked panes are backed by plywood screwed in from the inside.`,
      x: -5,
      y: 8,
      z: 39,
      population: 0,
      ambientNoise: 6,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ODL',
      },
    },

    '%ODB': {
      // Temperance Bar remnant (-3, +8, 39)
      name: 'Shuttered Speakeasy',
      description: `A narrow barroom with a curved counter and a shuttered backbar that still smells faintly of bitters. A fractured mirror clouds the wall behind it. Tap handles are zip-tied in place; an undercounter fridge hums weakly off a jury-rigged battery pack.`,
      x: -3,
      y: 8,
      z: 39,
      population: 0,
      ambientNoise: 5,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%ODL',
      },
    },
  },
};
