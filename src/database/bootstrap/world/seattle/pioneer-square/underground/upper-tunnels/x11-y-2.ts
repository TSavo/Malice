// Underground passage - between Steam Tunnel S3 (10,-2) and Steam Tunnel S4 (12,-2)

export const room = {
  name: 'Steam Corridor South',
  description: `The passage runs through the southern section of the steam network, where the heat begins to diminish as the lines branch toward their final destinations. The pipes here are smaller—distribution lines rather than mains—carrying steam to individual buildings rather than entire blocks.

The condensation is less intense here, the floor merely damp rather than wet. The temperature is still elevated but no longer oppressive, the transition from the main network to its periphery marked by degrees of comfort.

A maintenance cart sits abandoned in the passage—tools scattered across its surface, a half-empty water bottle, a high-visibility vest draped over the handle. Whoever left it meant to come back. They haven't yet.`,
  x: 11,
  y: -2,
  z: -2,
  population: 0,
  ambientNoise: 28,
  lighting: 20,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%STEAM_S3',
      description: 'The passage leads west through the steam tunnels',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%STEAM_S4',
      description: 'The passage leads east toward the steam junction',
    },
    north: {
      to: 'underground/upper-tunnels/x11-y-1.ts',
      description: 'A passage continues north',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y-3.ts',
      description: 'A passage continues south',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'abandoned cart',
      description: 'A maintenance cart sits in the passage, tools scattered across its surface. A water bottle and high-vis vest suggest someone stepped away and never returned.',
      boltedDown: false,
    },
  ],
};
