// Underground passage - connecting Expansion Passage (13,0) to Fourth Avenue corridor

export const room = {
  name: 'Fourth Avenue Connector',
  description: `The passage runs along the Fourth Avenue infrastructure, connecting the expansion loop section to the southern utility corridors. The construction is industrial—concrete floors, steel supports, the functional aesthetic of utility infrastructure.

The heat from the steam network to the west diminishes here, the passage cooler as it moves away from the active mains. The air is drier, the humidity dropping as the distance from the steam system increases.

A cable tray runs along the ceiling, carrying communications lines toward the Fourth Avenue buildings. The cables are modern additions, their plastic jackets pristine against the weathered concrete.`,
  x: 13,
  y: -1,
  z: -2,
  population: 0,
  ambientNoise: 22,
  lighting: 20,
  waterLevel: 5,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x13-y0.ts',
      description: 'The passage leads north toward the expansion loop',
    },
    south: {
      to: 'underground/upper-tunnels/x13-y-2.ts',
      description: 'The passage continues south',
    },
    west: {
      to: 'underground/upper-tunnels/x11-y-1.ts',
      description: 'A passage leads west toward the steam junction',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%4TH_S1',
      description: 'The passage leads east toward Fourth Avenue',
    },
  },
};
