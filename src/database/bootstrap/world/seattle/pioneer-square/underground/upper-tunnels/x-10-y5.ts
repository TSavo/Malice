// Junction Corridor - Collapsed Stairwell

export const room = {
  name: 'Collapsed Stairwell',
  description: `A wooden staircase once rose here to the street level, its treads now rotted away and its stringers collapsed into a jumble of timber. Someone cleared a path through the debris decades ago, the wood shoved aside rather than removed, creating a low crawlspace that becomes a proper passage again on the far side.

The ceiling is lower here where the stairwell's landing created a natural break in the tunnel height. Taller visitors must duck to pass through, their heads brushing the underside of what was once an elegant entryway.`,
  x: -10,
  y: 5,
  z: -2,
  population: 0,
  ambientNoise: 10,
  lighting: 8,
  waterLevel: 0,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x-11-y5.ts',
      description: 'The passage continues west',
    },
    east: {
      to: 'underground/upper-tunnels/x-9-y5.ts',
      description: 'The passage continues east',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'collapsed timber',
      description: 'The remains of a wooden staircase, its structural members rotted and collapsed into a jumble that was roughly cleared to allow passage.',
      boltedDown: true,
    },
  ],
};
