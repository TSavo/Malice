// Underground passage - factory district, connecting Factory Connector (10,-11) to Loading Tunnel (10,-13)

export const room = {
  name: 'Loading Approach',
  description: `The passage runs north-south between the Factory Connector and the Loading Tunnel, part of the route that once moved materials between the factories and the rail yards. The construction is heavy—reinforced walls, steel beams, floors designed for wheeled traffic.

The rails embedded in the floor show wear from decades of cart traffic, the grooves polished by countless wheels. The carts are gone, but the paths they carved remain.

A loading platform occupies one side of the passage, its wooden surface rotted but its iron frame still solid. Materials were staged here before moving to the tunnels below.`,
  x: 10,
  y: -12,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 10,
  waterLevel: 8,
  outdoor: false,
  exits: {
    north: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%FACTORY_CONNECTOR',
      description: 'The passage leads north to Factory Connector',
    },
    south: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%LOADING_TUNNEL',
      description: 'The passage leads south to Loading Tunnel',
    },
    east: {
      to: 'underground/upper-tunnels/x11-y-12.ts',
      description: 'A passage continues east',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'loading platform',
      description: 'A loading platform with a rotted wooden surface on a solid iron frame. Materials were staged here for transport.',
      boltedDown: true,
    },
  ],
};
