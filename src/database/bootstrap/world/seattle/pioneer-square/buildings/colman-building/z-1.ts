// Colman Building - Basement (z=-1)
// Foundation access, utility systems, and underground tunnel connection

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Access Lock',
      description:
        'A modern keypad lock bolted beside the basement door, its LED glowing amber.',
      difficulty: 3,
    },

    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Door',
      description:
        'A solid steel door with frosted glass panels, the basement entrance from the service corridor. ACCESS AUTHORIZED PERSONNEL ONLY is stenciled across the glass.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'metal',
      durability: 70,
    },

    '%TUNNEL_DOOR': {
      prototype: 'door',
      name: 'Tunnel Access Hatch',
      description:
        'A heavy iron hatch set into the basement floor, painted over many times until the original brick color is barely visible. No lock is visible - the hatch simply opens when pulled, suggesting it was never meant to be secure.',
      locked: false,
      open: false,
      material: 'metal',
      durability: 40,
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN_AREA': {
      name: 'Colman Building - Basement',
      description: `The basement beneath the Colman Building is a maze of support columns and utility conduits, the space originally designed as storage for ground-floor retail businesses. The air is cool and damp, carrying the smell of old stone and occasional mold.

Brick walls show the original 1889 construction, their mortar lines dark with age. Overhead, ductwork and pipes snake between the support beams, evidence of modern retrofits. The concrete floor is cracked in places, water stains marking where the basement has flooded over the decades.

A service staircase climbs toward the lobby above. In the floor, a heavy iron hatch suggests access to something below, though its purpose isn't immediately obvious.`,
      x: -12,
      y: -2,
      z: -1,
      population: 0,
      ambientNoise: 8,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%SOUTH_CORRIDOR',
          description: 'A staircase leads up to the service corridor',
          door: '%BASEMENT_DOOR',
          locks: ['%BASEMENT_LOCK'],
        },
        down: {
          to: 'underground/upper-tunnels/x-12-y-2.ts',
          room: '%ACCESS_SHAFT',
          description: 'A shaft with metal rungs descends into darkness',
          door: '%TUNNEL_DOOR',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'support columns',
          description:
            "Brick support columns rise from the basement floor to the ceiling above, their surfaces darkened by more than a century of damp conditions. The columns are original to the 1889 construction, each one a testament to the building's structural integrity.",
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'utility pipes',
          description:
            'A network of utility pipes runs along the basement ceiling, carrying water, gas, and whatever other fluids the building needs. Some pipes show signs of corrosion, their surfaces mottled with rust and mineral deposits.',
          boltedDown: true,
        },
      ],
    },
  },
};
