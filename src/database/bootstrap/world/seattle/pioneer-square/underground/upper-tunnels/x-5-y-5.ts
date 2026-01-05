// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage enters the western sections of the southern corridor, the route approaching the storage areas and supply depots that feed the underground community. The construction here is more deliberately maintained—repairs made with care rather than expedience, the space valued for its role in the network's logistics.

A heavy iron door is set into one wall, its surface marked with a stenciled number that might indicate a storage unit or vault. The door is closed and secured, its purpose unclear to casual passersby.

The sound of distant activity drifts from the west—voices, movement, the signs of more active sections of the underground ahead.`,
  x: -5,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 18,
  waterLevel: 3,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-4-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-6-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'numbered iron door',
      description: 'A heavy iron door marked with a stenciled number. The door is secured, its contents or purpose unknown.',
      boltedDown: true,
    },
  ],
};
