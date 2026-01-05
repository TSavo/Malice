// Underground passage - waterfront approaches

export const room = {
  name: 'Tidal Zone',
  description: `The passage runs through the heart of the tidal zone, where the underground meets the influence of Elliott Bay. The water line is visible on the walls—a permanent mark showing how high the floods reach during the worst conditions.

The floor is often underwater during high tides, the route impassable for hours at a time. Experienced underground travelers know to check the tide tables before venturing into this section.

A makeshift platform has been constructed along one wall—a narrow walkway above the flood line that allows passage during moderate flooding.`,
  x: 9,
  y: -15,
  z: -2,
  population: 0,
  ambientNoise: 22,
  lighting: 8,
  waterLevel: 25,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x9-y-14.ts',
      description: 'The passage leads north',
    },
    west: {
      to: 'underground/upper-tunnels/x8-y-15.ts',
      description: 'The passage continues west',
    },
    east: {
      to: 'underground/upper-tunnels/x10-y-15.ts',
      description: 'The passage continues east',
    },
    south: {
      to: 'underground/upper-tunnels/x9-y-16.ts',
      description: 'The passage continues south',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'flood platform',
      description: 'A makeshift wooden platform runs along the wall, elevated above the flood line. It allows passage during moderate flooding.',
      boltedDown: true,
    },
  ],
};
