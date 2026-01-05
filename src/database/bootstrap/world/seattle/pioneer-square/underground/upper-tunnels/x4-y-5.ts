// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage runs through a junction where a vertical shaft descends to deeper levels. The shaft is partially blocked—debris has accumulated at the bottom over years—but the opening remains visible, a reminder that the underground extends further down.

The air here carries a different quality, a draft rising from the shaft that brings the smell of stagnant water and deeper earth. The ventilation, such as it is, creates a subtle circulation that keeps this section from becoming completely stale.

Graffiti marks the walls around the shaft opening—warnings in multiple languages, some legible, others faded beyond recognition. The messages seem to caution against the descent.`,
  x: 4,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 10,
  waterLevel: 10,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x5-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x3-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'blocked shaft',
      description: 'A vertical shaft descends into darkness, partially blocked by accumulated debris. Graffiti around the opening warns against descending.',
      boltedDown: true,
    },
  ],
};
