// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage continues west through the established sections of the underground network, approaching the supply routes that feed the community. The construction here is well-maintained—walls stable, floor clear, lighting adequate.

A small alcove cut into the wall serves as an informal storage space, shelves holding tools and supplies for maintaining the passage. The items are mundane—flashlights, rope, a first aid kit—but their presence indicates organized management of the underground.

The route continues in both directions, part of the long southern corridor that connects the eastern network to the western supply areas.`,
  x: -11,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 20,
  waterLevel: 3,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-10-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-12-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'cabinet',
      name: 'supply alcove',
      description: 'A small alcove holds maintenance supplies—flashlights, rope, a first aid kit. Someone keeps this passage well-maintained.',
      boltedDown: true,
    },
  ],
};
