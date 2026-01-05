// Underground passage - connecting Steam Tunnel S4 (12,-2) to Fourth Avenue S2 (14,-2)

export const room = {
  name: 'Southern Utility Link',
  description: `The passage crosses through the utility infrastructure, connecting the steam network to the Fourth Avenue corridor. The systems overlap here—steam pipes running alongside electrical conduits, water lines crossing above communications cables.

The floor is wet, drainage from the steam system mixing with seepage from above. The water pools in depressions before finding its way to the drainage system, leaving mineral deposits that mark the flow patterns.

A junction box is mounted to one wall, its cover ajar to reveal spliced wires and bypass circuits. Someone has modified the electrical system, routing power in ways the original designers didn't intend.`,
  x: 13,
  y: -2,
  z: -2,
  population: 0,
  ambientNoise: 28,
  lighting: 18,
  waterLevel: 8,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x13-y-1.ts',
      description: 'The passage leads north',
    },
    south: {
      to: 'underground/upper-tunnels/x13-y-3.ts',
      description: 'The passage continues south',
    },
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%STEAM_S4',
      description: 'A passage leads west toward the steam tunnels',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%4TH_S2',
      description: 'The passage leads east toward Fourth Avenue',
    },
  },
  objects: [
    {
      prototype: 'cabinet',
      name: 'modified junction box',
      description: 'An electrical junction box with its cover ajar. Inside, spliced wires and bypass circuits suggest unauthorized modifications.',
      boltedDown: true,
    },
  ],
};
