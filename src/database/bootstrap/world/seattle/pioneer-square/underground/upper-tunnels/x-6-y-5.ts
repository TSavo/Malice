// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage runs through a transition zone between the eastern underground and the more organized western network. The character changes here—better lighting, cleaner floors, signs that this section is actively maintained by people who consider it their territory.

A message board is mounted to one wall, notes and papers pinned to its cork surface. The messages are cryptic—dates, times, initials, codes that mean something to their intended readers and nothing to anyone else.

The passage continues in both directions, the western route leading toward the supply junctions and storage areas that serve the underground community.`,
  x: -6,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 20,
  waterLevel: 3,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-5-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-8-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'message board',
      description: 'A cork board covered with cryptic notes—dates, initials, codes. The messages are meaningless without context.',
      boltedDown: true,
    },
  ],
};
