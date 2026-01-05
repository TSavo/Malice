// Underground passage - waterfront approaches

export const room = {
  name: 'Tidal Zone East',
  description: `The passage continues through the eastern section of the tidal zone, the industrial character of the factory district giving way to the maritime environment of the waterfront. The transition is visible in the construction—industrial brick yielding to rougher stonework designed for marine conditions.

The floor is covered with sand and shell fragments, deposited by tidal action over decades. The footing is uncertain, the surface shifting underfoot.

A channel cut into the floor once served as a drainage system, directing floodwaters toward the bay. The channel is still functional, water flowing toward the south during flood events.`,
  x: 11,
  y: -15,
  z: -2,
  population: 0,
  ambientNoise: 22,
  lighting: 8,
  waterLevel: 22,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x11-y-14.ts',
      description: 'The passage leads north',
    },
    west: {
      to: 'underground/upper-tunnels/x10-y-15.ts',
      description: 'The passage continues west',
    },
    east: {
      to: 'underground/upper-tunnels/x12-y-15.ts',
      description: 'The passage continues east',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y-16.ts',
      description: 'The passage continues south',
    },
  },
};
