// South wing of arcade basement - with access to Grand Central cistern

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Arcade Basement',
      description: `The basement extends south beneath the arcade's retail wing, the space divided into sections by partial walls that once separated different merchants' storage areas. The divisions are partially broken now, gaps knocked through for passage, the commercial territories dissolved into a single continuous space.

Old fixtures remain bolted to walls and floor—mounting brackets, shelving supports, the hardware of retail infrastructure stripped of everything that wasn't permanently attached. The brackets hint at what once hung there: merchandise displays, lighting fixtures, the visual vocabulary of commerce. Now they're just metal shapes, their meaning lost with the context.

A culvert pipe leads north into the cistern room of Grand Central's basement—the connection never officially acknowledged but clearly maintained.`,
      x: -11,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: {
          to: 'buildings/grand-central/z-1.ts:%CISTERN',
          description: 'A culvert leads north into a basement cistern room',
        },
      },
    },
  },
};
