// Underground passage - factory district, connecting Cannery Basement (7,-13) to Loading Tunnel (10,-13)

export const room = {
  name: 'Cannery Passage',
  description: `The passage runs east from the Cannery Basement, carrying the industrial character of the fish processing operations that once dominated this section of the underground. The smell of the sea has never fully left—salt and fish oil embedded in the brick, persistent despite decades of abandonment.

The floor is made of heavy flagstones, designed to withstand the wet conditions of the cannery's operations. The stones are worn smooth by traffic, their surfaces showing the paths most traveled.

Drainage channels run along both walls, the system designed to carry away the runoff from ice and fish processing.`,
  x: 8,
  y: -13,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 10,
  waterLevel: 12,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%CANNERY_BASEMENT',
      description: 'The passage leads west to Cannery Basement',
    },
    east: {
      to: 'underground/upper-tunnels/x9-y-13.ts',
      description: 'The passage continues east',
    },
  },
};
