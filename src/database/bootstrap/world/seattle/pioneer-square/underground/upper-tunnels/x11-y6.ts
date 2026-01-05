// Underground passage - connecting Yesler North (10,6) to cable infrastructure (12,6)

export const room = {
  name: 'Cable Crossing East',
  description: `The passage runs east-west through a section where telecommunications cables dominate the space. Fiber optic lines and copper bundles run along the ceiling in organized trays, the modern infrastructure overlaying the century-old tunnel construction.

The air hums faintly with the flow of data, though no single cable produces an audible sound. Together, they create a subliminal vibration that speaks to the invisible rivers of information flowing through this buried passage.

Junction boxes punctuate the cable runs, their indicator lights blinking in patterns that indicate network health. Green means active, amber means warning, red means failure. Most lights are green. A few are amber. Someone should probably check on those.`,
  x: 11,
  y: 6,
  z: -2,
  population: 0,
  ambientNoise: 20,
  lighting: 18,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x10-y6.ts',
      description: 'The passage leads west toward the Yesler access',
    },
    east: {
      to: 'underground/upper-tunnels/x12-y6.ts',
      description: 'The passage leads east toward the cable hub',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y5.ts',
      description: 'A passage continues south',
    },
    north: {
      to: 'underground/upper-tunnels/x11-y7.ts',
      description: 'A passage continues north',
    },
  },
  objects: [
    {
      prototype: 'cabinet',
      name: 'junction box',
      description: 'A fiber optic junction box with status lights. Most show green; two show amber. A small label reads "PRIORITY: LOW".',
      boltedDown: true,
    },
  ],
};
