// Underground passage - between Transformer Room (10,-3) and Utility South (12,-3)

export const room = {
  name: 'Utility Crossing South',
  description: `The passage crosses through a junction where electrical and steam infrastructure overlap, cables running alongside pipes in a space not designed to accommodate both. The result is cramped, the passage narrowing where the infrastructure converges.

The hum of the transformers to the west mingles with the hiss of steam from the pipes above, creating a constant background noise that makes conversation difficult. The heat varies wildly—cooler near the electrical conduits, warmer where the steam lines pass.

Warning signs in multiple languages caution about electrical and steam hazards. The combination of both in such a confined space makes this one of the more dangerous passages in the network.`,
  x: 11,
  y: -3,
  z: -2,
  population: 0,
  ambientNoise: 40,
  lighting: 22,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%TRANSFORMER_ROOM',
      description: 'The passage leads west toward the transformer room',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%UTILITY_SOUTH',
      description: 'The passage leads east toward the utility corridor',
    },
    north: {
      to: 'underground/upper-tunnels/x11-y-2.ts',
      description: 'A passage continues north',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y-4.ts',
      description: 'A passage continues south',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'hazard warnings',
      description: 'Signs in English, Spanish, and Chinese warn of electrical and steam hazards. The combination of both dangers in such a small space demands caution.',
      boltedDown: true,
    },
  ],
};
