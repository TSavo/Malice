// Underground passage - factory district

export const room = {
  name: 'Factory South',
  description: `The passage runs through the southern section of the factory underground, the route continuing toward the waterfront industrial areas. The construction here shows signs of subsidence—walls leaning slightly, floor tilted, the earth settling beneath the weight of the buildings above.

Cracks in the walls have been patched with cement, the repairs visible as lighter patches against the dark brick. The patches are old, the repairs made decades ago and holding despite the ongoing settling.

Water seeps through the cracks, the drainage systems unable to fully contain the groundwater that pressures this section of the underground.`,
  x: 11,
  y: -13,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 10,
  waterLevel: 15,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x11-y-12.ts',
      description: 'The passage leads north',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y-14.ts',
      description: 'The passage continues south',
    },
    east: {
      to: 'underground/upper-tunnels/x12-y-13.ts',
      description: 'A passage leads east',
    },
  },
};
