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
      name: 'Smith Tower - 38th Floor - Roof Hatch Scanner',
      description: 'A recessed retinal scanner set into the hatch frame.',
      scanners: [
        {
          type: 'retinal',
          part: 'eye',
          message: 'Roof access denied: retinal scan failed.',
        },
      ],
      authorizedUsers: {},
    },

    '%DROOF': {
      // Shared door object for the roof hatch (both directions use this door)
      prototype: 'door',
      name: 'Smith Tower - 38th Floor - Roof Hatch',
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
        prompt: 'Enter code for the roof hatch:',
      },
    },

    '%ODL': {
      // Observation Deck Landing (-12, +10, 38)
      name: 'Smith Tower - 38th Floor - Observation Deck Landing',
      description: `A cramped landing tucked just under the glass crown. Brass plaques listing emergency numbers are gouged by pocketknives. The air is cool and smells of stale liquor and metal polish. A chain-link gate blocks the stair down, and the elevator doors here are scarred by pry marks and boot dents.`,
      x: -12,
      y: 10,
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
        north: '%PHDOME',
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
          const elevator = self.elevator || null;

          if (!elevator) {
            return 'The call button clicks uselessly. No power.';
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
      // Observation Deck (-13, +10, 38)
      name: 'Smith Tower - 38th Floor - Observation Deck',
      description: `Tall glass panes arc around a slim walkway, offering a vertigo-inducing view of rooftops and freeways far below. Sun-faded placards point out landmarks that no longer match the skyline. Several cracked panes are backed by plywood screwed in from the inside.`,
      x: -13,
      y: 10,
      z: 38,
      population: 0,
      ambientNoise: 6,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ODL',
        north: '%DOME_MECH',
      },
    },

    '%ODB': {
      // Temperance Bar remnant (-11, +10, 38)
      name: 'Smith Tower - 38th Floor - Shuttered Speakeasy',
      description: `A narrow barroom with a curved counter and a shuttered backbar that still smells faintly of bitters. A fractured mirror clouds the wall behind it. Tap handles are zip-tied in place; an undercounter fridge hums weakly off a jury-rigged battery pack.`,
      x: -11,
      y: 10,
      z: 38,
      population: 0,
      ambientNoise: 5,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%ODL',
        north: '%DOME_VIEW',
        south: '%SERVICE',
        east: '%EAST_NOOK',
      },
    },

    '%PHL': {
      // Penthouse Landing (-12, +9, 38)
      name: 'Smith Tower - 38th Floor - Penthouse Landing',
      description: `A narrow landing wrapped in scuffed brass trim. A heavy oak door leads west into the penthouse, its handle worn to bright metal. Overhead, a square hatch labeled ROOF ACCESS sits flush with the plaster; a recessed ladder disappears into it. The air is warm and carries the scent of old polish and trapped heat.`,
      x: -12,
      y: 9,
      z: 38,
      population: 0,
      ambientNoise: 6,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ODL',
        west: '%PH',
        east: '%SERVICE',
        up: { room: '%RH5', door: '%DROOF' },
      },
    },

    '%PH': {
      // Penthouse Suite (-5, +7, 38)
      name: 'Smith Tower - 38th Floor - Penthouse Suite',
      description: `A low-ceilinged suite pressed under the pyramid roof. Dark wood paneling wraps the room; a built-in bar of dull brass and glass sits dry and dusty. A narrow view slit is cut into the terracotta skin, framing a sliver of skyline. Most furniture is draped in canvas sheets. A tight spiral stair winds up toward the dome framing.`,
      x: -13,
      y: 9,
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
      // Dome Service (-12, +11, 38) – inside the glass dome
      name: 'Smith Tower - 38th Floor - Glass Dome Catwalk',
      description: `A narrow metal catwalk circles the inside of the glass dome, every step ringing against the frame. A string of tired blue LEDs washes the beams in cold light. An access panel hums softly, and through the glass the city glitters in distorted reflections. A spiral stair descends through the floor.`,
      x: -12,
      y: 11,
      z: 38,
      population: 0,
      ambientNoise: 8,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%PH',
        south: '%ODL',
        west: '%DOME_MECH',
        east: '%DOME_VIEW',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // DOME & SERVICE AREAS
    // ═══════════════════════════════════════════════════════════════════

    '%DOME_MECH': {
      name: 'Smith Tower - 38th Floor - Dome Mechanics',
      description: `A cramped service nook tucked against the dome's western frame. Electrical panels are bolted to the wall, their breakers labeled in faded marker. Conduits snake up into the dome structure. A toolbox sits open, half its contents missing. The hum of the dome lights is louder here.`,
      x: -13,
      y: 11,
      z: 38,
      population: 0,
      ambientNoise: 9,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%ODECK',
        east: '%PHDOME',
      },
    },

    '%DOME_VIEW': {
      name: 'Smith Tower - 38th Floor - Northeast Observation Niche',
      description: `A small alcove pressed against the dome's eastern curve. The glass here is cleaner, offering an unobstructed view toward the bay and the ferries that crawl across its grey surface. A narrow bench is built into the frame. Initials are scratched into the metal railing.`,
      x: -11,
      y: 11,
      z: 38,
      population: 0,
      ambientNoise: 6,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%ODB',
        west: '%PHDOME',
        east: '%EAST_TERRACE',
      },
      sittables: [
        {
          name: 'an observation bench',
          capacity: 2,
          emptyMsg: 'A narrow bench faces the window.',
          occupiedMsg: '%s sitting at the observation window',
        },
      ],
    },

    '%SERVICE': {
      name: 'Smith Tower - 38th Floor - Service Closet',
      description: `A tight utility closet with cleaning supplies stacked on wire shelves. A mop bucket sits in the corner, dry and dusty. Spare light tubes lean against the wall. The air is stale and smells of old disinfectant. A clipboard hangs on a hook, its maintenance log years out of date.`,
      x: -11,
      y: 9,
      z: 38,
      population: 0,
      ambientNoise: 3,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ODB',
        west: '%PHL',
        east: '%EAST_ALCOVE',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // EAST COLUMN
    // ═══════════════════════════════════════════════════════════════════

    '%EAST_TERRACE': {
      name: 'Smith Tower - 38th Floor - East Terrace',
      description: `A narrow enclosed terrace pressed against the eastern crown. Floor-to-ceiling windows offer views of the waterfront and the grey expanse of Elliott Bay. The glass is old, slightly warped, giving the city a dreamlike quality. Built-in seating runs along the windows.`,
      x: -10,
      y: 11,
      z: 38,
      population: 0,
      ambientNoise: 5,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%DOME_VIEW',
        south: '%EAST_NOOK',
      },
      sittables: [
        {
          name: 'terrace seating',
          capacity: 3,
          emptyMsg: 'Built-in seating lines the windows.',
          occupiedMsg: '%s sitting at the east terrace',
        },
      ],
    },

    '%EAST_NOOK': {
      name: 'Smith Tower - 38th Floor - East Nook',
      description: `A small windowed alcove tucked into the building's eastern corner. The view stretches from the stadium district to the distant Cascades on clear days. Today, grey clouds blur the horizon. A single chair faces the window.`,
      x: -10,
      y: 10,
      z: 38,
      population: 0,
      ambientNoise: 4,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%EAST_TERRACE',
        west: '%ODB',
        south: '%EAST_ALCOVE',
      },
      sittables: [
        {
          name: 'a window chair',
          capacity: 1,
          emptyMsg: 'A chair faces the window.',
          occupiedMsg: '%s sitting at the east window',
        },
      ],
    },

    '%EAST_ALCOVE': {
      name: 'Smith Tower - 38th Floor - Southeast Alcove',
      description: `The building's southeastern corner, where two walls of windows meet. The view sweeps from the industrial waterfront to the distant hills. A small table and chairs occupy the space, positioned for the panorama. The glass here is cleaner than elsewhere.`,
      x: -10,
      y: 9,
      z: 38,
      population: 0,
      ambientNoise: 4,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%EAST_NOOK',
        west: '%SERVICE',
      },
      sittables: [
        {
          name: 'alcove seating',
          capacity: 2,
          emptyMsg: 'A small table and chairs face the windows.',
          occupiedMsg: '%s sitting in the southeast alcove',
        },
      ],
    },
  },
};
