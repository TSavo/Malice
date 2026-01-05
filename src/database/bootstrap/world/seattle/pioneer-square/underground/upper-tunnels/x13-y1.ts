// Underground passage - connecting Steam Tunnel corridors at y=1

export const room = {
  name: 'Steam Corridor',
  description: `The passage runs through the steam distribution network, pipes of varying sizes lining the walls and ceiling. The heat is significant here, the proximity to the main steam lines making the air thick and humid. Condensation drips from the pipes, keeping the floor perpetually wet.

The passage is well-traveled, the floor worn smooth by decades of foot traffic. Someone has painted directional arrows on the walls—faded now, but still visible—indicating routes through the network. A green arrow points west toward the main junction; a red arrow points east toward the Fourth Avenue access.

Industrial lighting casts harsh shadows, the fixtures maintained by utility workers who still service this section of the network.`,
  x: 13,
  y: 1,
  z: -2,
  population: 0,
  ambientNoise: 28,
  lighting: 22,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x11-y1.ts',
      description: 'The passage leads west through the steam distribution junction',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%4TH_N1',
      description: 'The passage leads east toward Fourth Avenue',
    },
    north: {
      to: 'underground/upper-tunnels/x13-y2.ts',
      description: 'A passage continues north toward the boiler room',
    },
    south: {
      to: 'underground/upper-tunnels/x13-y0.ts',
      description: 'A passage continues south',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'directional arrows',
      description: 'Faded painted arrows mark routes through the steam network. Green points toward the main junction; red points toward surface access.',
      boltedDown: true,
    },
  ],
};
