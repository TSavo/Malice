// Underground passage - between Yesler North Passage (10,6) and Slope Passage (10,8)

export const room = {
  name: 'Upper Slope Passage',
  description: `The passage continues its climb toward the Slope Passage above, the gradient steeper here as it approaches the junction with the main Yesler underground. The walls are reinforced with steel beams, added at some point to prevent collapse as the earth settled around the tunnel.

Water seeps through cracks in the ceiling, trickling down the walls to collect in shallow pools on the floor. The drainage is poor in this section, the water accumulating until it spills over a lip and cascades toward lower passages.

Graffiti covers the walls—old tags layered over older tags, the generations of underground travelers marking their passage through these forgotten corridors.`,
  x: 10,
  y: 7,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 12,
  waterLevel: 10,
  outdoor: false,
  exits: {
    south: {
      to: 'underground/upper-tunnels/x10-y6.ts',
      description: 'The passage leads south down the slope',
    },
    north: {
      to: 'buildings/yesler-underground/z-2.ts',
      room: '%SLOPE_PASSAGE',
      description: 'The passage leads north toward the Slope Passage',
    },
    east: {
      to: 'underground/upper-tunnels/x11-y7.ts',
      description: 'A passage continues east',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'layered graffiti',
      description: 'Decades of spray-painted tags cover the walls, each generation covering the last. Some are simple names; others are elaborate art. All are slowly fading.',
      boltedDown: true,
    },
  ],
};
