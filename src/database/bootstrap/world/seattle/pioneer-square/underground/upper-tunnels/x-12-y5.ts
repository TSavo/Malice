// Junction Corridor - Buried Intersection

export const room = {
  name: 'Buried Intersection',
  description: `The tunnel passes through what was once a street intersection, the perpendicular passage now collapsed and blocked with rubble. Fragments of wooden sidewalk decking protrude from the ceiling—the undersides of boardwalks that once crossed here, now entombed in fill and forgotten.

A brass survey marker embedded in the floor reads "CITY OF SEATTLE 1907," marking when engineers mapped these abandoned spaces for the first time since they were buried. The survey predates the current street grid by decades.`,
  x: -12,
  y: 5,
  z: -2,
  population: 0,
  ambientNoise: 10,
  lighting: 12,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x-13-y5.ts',
      description: 'The passage continues west',
    },
    east: {
      to: 'underground/upper-tunnels/x-11-y5.ts',
      description: 'The passage continues east',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'brass survey marker',
      description: 'A brass disc set into the floor, inscribed "CITY OF SEATTLE 1907" with reference numbers that meant something to surveyors over a century ago.',
      boltedDown: true,
    },
    {
      prototype: 'furniture',
      name: 'wooden sidewalk fragments',
      description: 'Splintered remnants of the wooden boardwalks that once spanned the street intersections, now fossilized in the ceiling fill.',
      boltedDown: true,
    },
  ],
};
