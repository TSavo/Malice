// Junction Corridor - entry point from The Junction

export const room = {
  name: 'Corridor from The Junction',
  description: `The passage extends eastward from The Junction, its brick walls bearing the soot stains of a century of torch and lantern use. The ceiling drops slightly as the tunnel follows the original contours of the 1889 street level, dipping where the old roadbed did before the city covered it all.

Water damage marks the lower courses of brick—the high-water line from when the Great Fire's ashes were still being washed into the bay. Everything below that line has a different color, leached of its original red by decades of flooding before the city finally got the drainage right.`,
  x: -13,
  y: 5,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 15,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/the-junction.ts',
      description: 'The passage leads west to The Junction',
    },
    east: {
      to: 'underground/upper-tunnels/x-12-y5.ts',
      description: 'The passage continues east',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'water stains',
      description: 'Dark mineral deposits trace the history of flooding along the lower walls, each band marking a different inundation before the drainage was perfected.',
      boltedDown: true,
    },
  ],
};
