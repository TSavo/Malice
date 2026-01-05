// Underground passage - between Eastern Passage (10,4) and Steam Tunnel (10,2)

export const room = {
  name: 'Steam Network Access',
  description: `The passage descends slightly as it runs between the Eastern Passage and the northern steam network, the transition from general underground to active utility infrastructure marked by increasing warmth and humidity. Pipes begin to appear along the walls, first small conduits, then larger mains as the steam system's presence grows.

The floor is made of metal grating here, installed to allow drainage from the constant condensation that drips from the steam pipes overhead. The grating shows decades of rust but remains structurally sound, the heavy gauge metal designed for industrial loads.

A service panel is mounted to one wall, its cover missing to reveal a tangle of wires and relay switches. The system is old but still functional, controlling valves and dampers in the network above.`,
  x: 10,
  y: 3,
  z: -2,
  population: 0,
  ambientNoise: 25,
  lighting: 20,
  waterLevel: 5,
  outdoor: false,
  exits: {
    north: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%EAST_PASSAGE',
      description: 'The passage leads north toward the Eastern Passage',
    },
    south: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%STEAM_N3',
      description: 'The passage leads south into the steam tunnels',
    },
    east: {
      to: 'underground/upper-tunnels/x11-y3.ts',
      description: 'A passage continues east',
    },
  },
  objects: [
    {
      prototype: 'cabinet',
      name: 'service panel',
      description: 'An open electrical panel reveals old relay switches and faded wiring diagrams. The system still controls steam valves somewhere in the network.',
      boltedDown: true,
    },
  ],
};
