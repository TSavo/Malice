// Underground passage - connecting Third Avenue Depths (8,0) to passages at y=-2

export const room = {
  name: 'Third Avenue South Access',
  description: `The passage descends from Third Avenue Depths toward the southern sections of the underground, the route transitioning from the maintained utility corridors to rougher, older construction. The walls show the marks of multiple construction eras—modern concrete patches over Victorian brick.

The air grows warmer as the passage approaches the steam infrastructure to the south, residual heat from the active network making itself felt. Condensation forms on the cooler surfaces.

A drainage channel runs along one wall, carrying seepage toward the lower passages. The channel is functional, evidence that someone still maintains the water management in this section.`,
  x: 8,
  y: -1,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 15,
  waterLevel: 8,
  outdoor: false,
  exits: {
    north: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%3RD_DEEP',
      description: 'The passage leads north to Third Avenue Depths',
    },
    south: {
      to: 'underground/upper-tunnels/x8-y-2.ts',
      description: 'The passage continues south',
    },
  },
};
