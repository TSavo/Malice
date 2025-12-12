// Smith Tower - Top Floor (z=38)
// Observation deck, penthouse, and crown service

export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: {
        out: '%ODL',
      },
    },

    '%LR': {
      // Roof hatch biometric lock
      prototype: 'biometricLock',
      name: 'Roof Hatch Scanner',
      description: 'A recessed retinal scanner set into the hatch frame.',
      scanners: [
        { type: 'retinal', part: 'eye', message: 'Roof access denied: retinal scan failed.' },
      ],
      authorizedUsers: {},
    },

    '%DROOF': {
      // Shared door object for the roof hatch (both directions use this door)
      prototype: 'door',
      name: 'Roof Hatch',
      description: 'A square steel hatch with an integrated biometric reader.',
      locked: true,
      locks: ['%LR'],
      open: false,
      messages: {
        locked: 'The roof hatch is locked.',
        unlocked: 'The roof hatch unlocks with a solid thunk.',
        open: 'You swing the roof hatch open.',
        closed: 'You pull the roof hatch closed.',
        denied: 'Access denied.',
        prompt: 'Enter code for the roof hatch:'
      },
    },

    '%ODL': {
      // Observation Deck Landing (-4, +8, 38)
      name: 'Observation Deck Landing',
      description: `A cramped landing tucked just under the glass crown. Brass plaques listing emergency numbers are gouged by pocketknives. The air is cool and smells of stale liquor and metal polish. A chain-link gate blocks the stair down, and the elevator doors here are scarred by pry marks and boot dents.`,
      x: -4,
      y: 8,
      z: 38,
      population: 0,
      ambientNoise: 7,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%ODECK',
        east: '%ODB',
        south: '%PHL',
        in: '%E',
        down: '%ZSTAIR',
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

    '%ODECK': {
      // Observation Deck (-5, +8, 38)
      name: 'Observation Deck',
      description: `Tall glass panes arc around a slim walkway, offering a vertigo-inducing view of rooftops and freeways far below. Sun-faded placards point out landmarks that no longer match the skyline. Several cracked panes are backed by plywood screwed in from the inside.`,
      x: -5,
      y: 8,
      z: 38,
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
      // Temperance Bar remnant (-3, +8, 38)
      name: 'Shuttered Speakeasy',
      description: `A narrow barroom with a curved counter and a shuttered backbar that still smells faintly of bitters. A fractured mirror clouds the wall behind it. Tap handles are zip-tied in place; an undercounter fridge hums weakly off a jury-rigged battery pack.`,
      x: -3,
      y: 8,
      z: 38,
      population: 0,
      ambientNoise: 5,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%ODL',
      },
    },

    '%PHL': {
      // Penthouse Landing (-4, +7, 38)
      name: 'Penthouse Landing',
      description: `A narrow landing wrapped in scuffed brass trim. A heavy oak door leads west into the penthouse, its handle worn to bright metal. Overhead, a square hatch labeled ROOF ACCESS sits flush with the plaster; a recessed ladder disappears into it. The air is warm and carries the scent of old polish and trapped heat.`,
      x: -4,
      y: 7,
      z: 38,
      population: 0,
      ambientNoise: 6,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ODL',
        west: '%PH',
        up: { room: '%RH5', door: '%DROOF' },
      },
    },

    '%PH': {
      // Penthouse Suite (-5, +7, 38)
      name: 'Penthouse Suite',
      description: `A low-ceilinged suite pressed under the pyramid roof. Dark wood paneling wraps the room; a built-in bar of dull brass and glass sits dry and dusty. A narrow view slit is cut into the terracotta skin, framing a sliver of skyline. Most furniture is draped in canvas sheets. A tight spiral stair winds up toward the dome framing.`,
      x: -5,
      y: 7,
      z: 38,
      population: 0,
      ambientNoise: 4,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%PHL',
        up: '%PHDOME',
      },
    },

    '%PHDOME': {
      // Dome Service (-4, +9, 38) – inside the glass dome
      name: 'Glass Dome Catwalk',
      description: `A narrow metal catwalk circles the inside of the glass dome, every step ringing against the frame. A string of tired blue LEDs washes the beams in cold light. An access panel hums softly, and through the glass the city glitters in distorted reflections.`,
      x: -4,
      y: 9,
      z: 38,
      population: 0,
      ambientNoise: 8,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%PHL',
        south: '%PH',
      },
    },
  },
};
