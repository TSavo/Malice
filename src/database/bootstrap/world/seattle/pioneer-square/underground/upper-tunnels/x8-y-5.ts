// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage continues through the southern underground, the long corridor stretching in both directions through darkness punctuated by occasional working lights. The construction varies—older sections with hand-laid brick giving way to newer reinforced concrete where repairs were made over the years.

The walls show the marks of time and use—graffiti faded to illegibility, scratches where heavy objects were dragged through, stains of unknown origin. This route has been used for generations by those who needed to move unseen.

A junction box mounted to one wall shows exposed wires and amateur repairs—someone has tapped into the electrical system to power lights or equipment elsewhere in the network.`,
  x: 8,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 12,
  waterLevel: 12,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x9-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x7-y-5.ts',
      description: 'The passage continues west',
    },
  },
};
