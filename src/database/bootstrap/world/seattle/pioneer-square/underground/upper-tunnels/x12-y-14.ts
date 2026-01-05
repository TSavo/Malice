// Underground passage - factory district

export const room = {
  name: 'Foundry South',
  description: `The passage extends south from the Tool Room, the industrial character of the foundry district gradually giving way to the rougher construction of the waterfront approaches. The heat that once radiated from the forge has long since dissipated; the cold of the earth has reclaimed this section.

A heavy iron door is set into the eastern wall, its surface covered with rust but its hinges still functional. The door leads to a storage area that might have been a vault—its contents, if any remain, are unknown.

The floor slopes downward toward the south, following the natural grade toward the waterfront.`,
  x: 12,
  y: -14,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 10,
  waterLevel: 12,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x12-y-13.ts',
      description: 'The passage leads north',
    },
    south: {
      to: 'underground/upper-tunnels/x12-y-15.ts',
      description: 'The passage continues south',
    },
    west: {
      to: 'underground/upper-tunnels/x11-y-14.ts',
      description: 'A passage leads west',
    },
    east: {
      to: 'underground/upper-tunnels/x13-y-14.ts',
      description: 'A passage leads east',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'rusted iron door',
      description: 'A heavy iron door set into the wall, rusted but still on its hinges. It appears to lead to a storage vault.',
      boltedDown: true,
    },
  ],
};
