// Pioneer Hotel - Ground Floor (z=0)
// Cheap flophouse south of S. Washington

export const building = {
  name: 'Pioneer Hotel',
  x: -16,
  y: 7,
  width: 2,
  height: 1,
  floors: 6,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%SERVICE_LOCK': {
      prototype: 'biometricLock',
      name: 'Service Entrance Scanner',
      description:
        'A fingerprint scanner beside a metal door, its housing cracked but functional.',
      scanners: [
        {
          type: 'fingerprint',
          part: 'hand',
          message: 'Service entrance - staff only.',
        },
      ],
      authorizedUsers: {},
    },

    // ═══════════════════════════════════════════════════════════════════
    // ELEVATOR
    // ═══════════════════════════════════════════════════════════════════

    '%E': {
      prototype: 'elevator',
      name: 'Pioneer Hotel - Elevator',
      description: `A cage elevator from another century, its brass fixtures tarnished to brown, its safety gate a lattice of metal that folds like an accordion. The car lurches and groans with every floor, cables squealing in the shaft above. It works. That's the best that can be said.

The control panel has six buttons, each one worn smooth by decades of fingers. The numbers are barely visible, rubbed away by use. The emergency stop button is painted red, though the paint has chipped to reveal brass beneath.`,
      x: -16,
      y: 7,
      z: 0,
      exits: {
        out: '%LOBBY',
      },
      elevator: {
        floors: [0, 1, 2, 3, 4, 5],
        currentFloor: 0,
        doorsOpen: true,
        floorRooms: {
          0: '%LOBBY',
          1: '%HALL_1',
          2: '%HALL_2',
          3: '%HALL_3',
          4: '%HALL_4',
          5: '%ROOF',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0)
    // ═══════════════════════════════════════════════════════════════════

    '%LOBBY': {
      name: 'Pioneer Hotel - Lobby',
      description: `The lobby of a hotel that stopped pretending to be respectable decades before The Burning and hasn't improved since. The floor is cracked linoleum over older tile over older wood, each layer representing someone's failed renovation. The walls are painted institutional green, the color of hospitals and prisons and places where people wait for things to end.

A cage elevator occupies the corner, its brass gate folded open. The stairs beside it are blocked by a chain and a handwritten sign: USE ELEVATOR. The stairs haven't been safe since something happened that no one talks about anymore.

The smell is mildew and bodies and the chemical attempts to mask both. The lighting is fluorescent, one tube flickering in a rhythm that suggests it's been flickering for years.`,
      x: -16,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 15,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 's-washington/x-16.ts',
          description: 'A smudged glass door opens onto S. Washington St',
        },
        east: '%OFFICE',
        northwest: {
          to: 'alley/y8.ts',
          locks: ['%SERVICE_LOCK'],
          description: 'A metal service door leads to the alley',
        },
        in: '%E',
      },
    },

    '%OFFICE': {
      name: 'Pioneer Hotel - Office',
      description: `Behind a counter of bulletproof glass, the hotel office contains everything needed to run a flophouse: a cash drawer, a rack of room keys on hooks, a surveillance monitor showing grainy feeds from the hallways above. The glass is scratched and yellowed, the speaker grille crusted with something better not examined.

The office is barely larger than a closet, crammed with filing cabinets and stacked ledgers that no one has consulted in years. A cot in the corner suggests someone sleeps here, or did. Personal effects are absent—either removed or never present.

A rate card is taped to the glass: BY THE HOUR, BY THE NIGHT, BY THE WEEK. The prices are handwritten, crossed out and rewritten as the economy shifts. The current rates are high for what you get, cheap for what you need.`,
      x: -15,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 10,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LOBBY',
      },
      sittables: [
        {
          name: 'a narrow cot',
          capacity: 1,
          emptyMsg: 'A cot wedged in the corner suggests someone sleeps here.',
          occupiedMsg: '%s lying on the cot',
        },
      ],
    },
  },

  postProcessors: [],
};
