// Underground passage - factory district

export const room = {
  name: 'Cannery South',
  description: `The passage continues south from the Loading Junction, carrying the character of the cannery operations toward the waterfront. The smell of the sea grows stronger here, salt and fish oil mixing with the dampness of the underground.

The walls are lined with iron hooks that once held nets and equipment for the fishing industry. Some hooks still hold fragments of rope, the fibers stiff with age and salt.

A channel in the floor once carried water and waste from the cannery toward the bay. The channel is dry now, but water stains mark the high-water lines of past floods.`,
  x: 9,
  y: -14,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 10,
  waterLevel: 15,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x9-y-13.ts',
      description: 'The passage leads north toward Loading Junction',
    },
    south: {
      to: 'underground/upper-tunnels/x9-y-15.ts',
      description: 'The passage continues south',
    },
    east: {
      to: 'underground/upper-tunnels/x10-y-14.ts',
      description: 'A passage leads east',
    },
  },
};
