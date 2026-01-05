// Underground passage - between South Tunnel W (10,-4) and South Junction E (12,-4)

export const room = {
  name: 'Southern Crossing',
  description: `The passage runs through the southern underground, connecting the western and eastern sections beneath the King Street approach. The construction here is older, rougher—the work of earlier decades when the network was first extended toward the rail infrastructure.

The walls show marks of hand excavation, pickaxe gouges preserved in the brick that was laid to stabilize the passage. Water seeps through cracks, keeping the floor perpetually wet and creating a thin layer of mud that tracks footprints in both directions.

A faded arrow painted on the wall points south with the word "KING ST" barely visible beneath decades of grime. The route to the rail yards has been used for generations.`,
  x: 11,
  y: -4,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 12,
  waterLevel: 12,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%SOUTH_TUNNEL_W',
      description: 'The passage leads west through the southern tunnel',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%SOUTH_JUNCTION_E',
      description: 'The passage leads east toward the southern junction',
    },
    north: {
      to: 'underground/upper-tunnels/x11-y-3.ts',
      description: 'A passage continues north',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y-5.ts',
      description: 'A passage continues south toward King Street',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'faded arrow',
      description: 'A painted arrow points south, the word "KING ST" barely visible. Generations of travelers have followed this marker to the rail yards.',
      boltedDown: true,
    },
  ],
};
