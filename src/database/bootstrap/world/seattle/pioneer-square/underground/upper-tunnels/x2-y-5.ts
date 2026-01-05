// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage runs beneath what the old maps call Second Avenue, though the street above has been rebuilt so many times that the original alignment is a matter of historical record rather than physical fact. The tunnel maintains its course regardless of what happens on the surface.

The construction here shows layers of repair—patches of different eras overlapping, each generation fixing the problems left by the last. Concrete patches cover holes in the original brick, steel plates bridge gaps where the floor has collapsed, timber shores up sections where the ceiling has sagged.

The repairs tell a story of persistent use—this route has been worth maintaining for over a century.`,
  x: 2,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 10,
  waterLevel: 10,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x3-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x1-y-5.ts',
      description: 'The passage continues west',
    },
  },
};
