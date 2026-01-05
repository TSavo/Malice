// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage crosses beneath First Avenue, the original heart of the underground city. The construction here is some of the oldest in the network—Victorian-era brick laid in careful patterns, the craftsmanship evident despite more than a century of wear.

A faded mural covers one section of wall, the painted scene barely visible beneath accumulated grime. The image seems to depict the Seattle waterfront as it appeared before the Great Fire—sailing ships, wooden docks, the city that was destroyed and rebuilt.

The mural is signed in the corner, but the name has faded beyond legibility. Someone, long ago, thought this passage worth beautifying.`,
  x: 1,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 12,
  waterLevel: 8,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x2-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x0-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'faded mural',
      description: 'A barely visible mural depicts the pre-fire Seattle waterfront. The artist\'s signature has faded beyond recognition.',
      boltedDown: true,
    },
  ],
};
