// Underground passage - factory district

export const room = {
  name: 'Tool Storage',
  description: `The passage widens into what was once a tool storage area for the foundry, the walls lined with heavy wooden shelving that has partially collapsed over the years. Tools and equipment litter the floor—files, hammers, tongs, the implements of metalworking abandoned when the foundry closed.

The shelves that remain standing hold an assortment of containers—wooden boxes, metal cans, glass jars—their contents unknown and likely worthless after decades of neglect. Some have spilled, their contents forming strange deposits on the floor.

The smell of oil and rust pervades the space, the residue of the industrial equipment that was stored here.`,
  x: 12,
  y: -12,
  z: -2,
  population: 0,
  ambientNoise: 8,
  lighting: 10,
  waterLevel: 5,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x12-y-11.ts',
      description: 'The passage leads north toward the foundry',
    },
    south: {
      to: 'underground/upper-tunnels/x12-y-13.ts',
      description: 'The passage continues south',
    },
    west: {
      to: 'underground/upper-tunnels/x11-y-12.ts',
      description: 'A passage leads west',
    },
    east: {
      to: 'underground/upper-tunnels/x13-y-12.ts',
      description: 'A passage leads east',
    },
  },
  objects: [
    {
      prototype: 'crate',
      name: 'scattered tools',
      description: 'Metalworking tools litter the floor—files, hammers, tongs. The implements of a foundry abandoned decades ago.',
      boltedDown: true,
    },
  ],
};
