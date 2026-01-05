// Underground passage - connecting Utility South (12,-3) to Fourth Avenue S3 (14,-3)

export const room = {
  name: 'Southern Corridor Link',
  description: `The passage runs through the transition zone between the utility infrastructure and the older tunnel network, the construction varying along its length. Modern concrete gives way to older brick, the systems of different eras meeting in a cramped space.

The air is cooler here, away from both the steam network and the electrical systems. The temperature approaches the constant of deep earth—cool but not cold, stable throughout the seasons.

A faded stencil on the wall marks the passage as part of a route: "SOUTH ACCESS - 1952". The designation was probably relevant when it was painted. Now it's just another layer of history on these underground walls.`,
  x: 13,
  y: -3,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 15,
  waterLevel: 8,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x13-y-2.ts',
      description: 'The passage leads north',
    },
    south: {
      to: 'underground/upper-tunnels/x13-y-4.ts',
      description: 'The passage continues south',
    },
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%UTILITY_SOUTH',
      description: 'A passage leads west toward the utility corridor',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%4TH_S3',
      description: 'The passage leads east toward Fourth Avenue',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'route stencil',
      description: 'Faded stenciled letters read "SOUTH ACCESS - 1952". The route designation is decades old, its meaning lost to time.',
      boltedDown: true,
    },
  ],
};
