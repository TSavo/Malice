// Underground passage - between Cable Run (12,4) and Basement Ruins (14,4)

export const room = {
  name: 'Infrastructure Crossing',
  description: `The passage crosses through a dense concentration of infrastructure—pipes, cables, conduits, and ducts competing for space in a tunnel designed before any of them existed. The effect is claustrophobic, the passage narrowed to barely shoulder width by the accumulation of utilities installed over decades.

The ceiling is low here, forcing a crouch or a duck where the largest pipes cross overhead. The pipes are warm, carrying steam from the active network to the west. The cables are cool, carrying data rather than heat.

Tags and labels cover every surface, identifying the purpose of each conduit: "SEA WATER 1945", "CITY LIGHT 1962", "QWEST 2001", "CENTURY LINK 2018". The infrastructure grows denser with each decade, the available space shrinking as the city's needs expand.`,
  x: 13,
  y: 4,
  z: -2,
  population: 0,
  ambientNoise: 25,
  lighting: 18,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%CABLE_RUN',
      description: 'The passage leads west through the cable runs',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%BASEMENT_RUINS',
      description: 'The passage leads east toward ruined foundations',
    },
    south: {
      to: 'underground/upper-tunnels/x13-y3.ts',
      description: 'A passage continues south',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'utility tags',
      description: 'Dozens of tags identify pipes and cables spanning 80 years of installation. The newest is bright orange plastic; the oldest is corroded brass.',
      boltedDown: true,
    },
  ],
};
