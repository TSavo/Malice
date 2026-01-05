// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage runs through a wider section where multiple routes converge, the junction serving as a crossroads in the southern underground. The space shows signs of regular use—worn paths on the floor, familiar marks on the walls, the accumulated evidence of countless passages.

A ventilation shaft rises through the ceiling, its grate admitting occasional drafts of fresh air from the surface. The shaft is too narrow for passage, but it provides circulation that keeps this section of the underground breathable.

The sounds of the western underground are clearer here—distant voices, the occasional clang of metal, the ambient noise of an active community living beneath the city.`,
  x: -8,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 22,
  lighting: 18,
  waterLevel: 5,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-6-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-9-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'ventilation shaft',
      description: 'A narrow shaft rises to the surface, its grate allowing fresh air to circulate. Too narrow for passage, but essential for ventilation.',
      boltedDown: true,
    },
  ],
};
