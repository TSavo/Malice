// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage runs through a section where the underground crosses beneath what was once a major street—the construction here is more substantial, the tunnel reinforced to support the traffic that once passed above. The street is gone now, replaced by buildings, but the engineering remains.

The ceiling is higher here, the space originally sized for larger traffic. Someone has taken advantage of the extra room to store supplies—crates stacked against one wall, their contents concealed beneath tarps that haven't been disturbed in years.

A faded sign on the wall reads "S. WASHINGTON - 200 FT", a distance marker from the tunnel's original purpose that lost its meaning when the city was rebuilt above.`,
  x: 7,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 10,
  waterLevel: 10,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x8-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x6-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'crate',
      name: 'stacked crates',
      description: 'Old crates stacked against the wall, covered with dusty tarps. Whatever they contain has been here for years undisturbed.',
      boltedDown: true,
    },
  ],
};
