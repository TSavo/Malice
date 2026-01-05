// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage Central',
  description: `The passage reaches what might be considered the center of the southern corridor—roughly equidistant from the eastern terminus and the western supply routes. The space here is larger, a natural gathering point for those traversing the long underground route.

Evidence of regular use is visible everywhere—worn paths on the floor, handprints on the walls where people have steadied themselves, the accumulated marks of countless passages through this waypoint.

A metal bucket collects water from a persistent drip in the ceiling, preventing the floor from becoming impassable mud. Someone maintains this small courtesy, emptying the bucket when it fills.`,
  x: 0,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 15,
  waterLevel: 8,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x1-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-1-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'drainage bucket',
      description: 'A metal bucket catches water dripping from the ceiling. Someone empties it regularly—a small act of maintenance that keeps the passage usable.',
      boltedDown: false,
    },
  ],
};
