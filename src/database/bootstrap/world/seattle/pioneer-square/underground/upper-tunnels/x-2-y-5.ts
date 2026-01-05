// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage runs through a section where utility infrastructure becomes more prominent, pipes and cables multiplying as the route approaches the main underground network. The systems date from different eras—Victorian-era gas lines alongside modern fiber optics, the infrastructure of multiple centuries sharing the same cramped space.

A junction point for several cable runs creates a bulge in the passage, the walls widened to accommodate the equipment. A small equipment cabinet is bolted to the wall, its door secured with a padlock that looks newer than the cabinet itself.

The sound of flowing water is audible from somewhere below—perhaps the city's storm drainage system, running in parallel through deeper passages.`,
  x: -2,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 20,
  lighting: 18,
  waterLevel: 5,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-1-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-3-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'cabinet',
      name: 'equipment cabinet',
      description: 'A utility cabinet bolted to the wall, secured with a relatively new padlock. The cabinet itself shows decades of wear.',
      boltedDown: true,
    },
  ],
};
