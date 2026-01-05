// Underground passage - factory district connector

export const room = {
  name: 'Factory Tunnel',
  description: `The passage runs through the industrial underground beneath the old factory district, the construction rough but functional. The walls are reinforced with timber and steel, the work of laborers who built these tunnels to serve the factories that once stood above.

The air carries traces of industrial chemicals—machine oil, coal tar, the residue of manufacturing processes that ended decades ago. The smells have soaked into the brick and earth, persistent reminders of the neighborhood's working-class past.

Heavy iron rails are embedded in the floor, remnants of the cart system that once moved materials through these tunnels.`,
  x: 8,
  y: -11,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 10,
  waterLevel: 10,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%WORKER_TUNNEL',
      description: 'The passage leads west toward Worker Tunnel',
    },
    east: {
      to: 'underground/upper-tunnels/x9-y-11.ts',
      description: 'The passage continues east',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'embedded rails',
      description: 'Iron rails set into the floor—remnants of a cart system that once moved materials through the factory tunnels.',
      boltedDown: true,
    },
  ],
};
