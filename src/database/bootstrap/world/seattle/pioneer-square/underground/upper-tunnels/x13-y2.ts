// Underground passage - between Old Boiler Room (12,2) and Fourth Avenue Passage (14,2)

export const room = {
  name: 'Boiler Connection',
  description: `A narrow passage connects the old boiler room to the Fourth Avenue utility corridor, threading through the gap between building foundations. The walls show marks where the passage was widened over time—pickaxe gouges giving way to chisel marks giving way to the smooth cuts of modern tools.

Heat radiates from the west, residual warmth from the boiler room and the steam network beyond. The air grows cooler as the passage extends toward the Fourth Avenue infrastructure, the temperature gradient marking the transition between the active heating system and the abandoned utility runs.

A bundle of cables runs along the ceiling, carrying power and data between the buildings above. The cables are modern additions, their plastic jackets pristine compared to the century-old brick and concrete they pass through.`,
  x: 13,
  y: 2,
  z: -2,
  population: 0,
  ambientNoise: 20,
  lighting: 18,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%BOILER_ROOM',
      description: 'The passage leads west toward the old boiler room',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%4TH_N2',
      description: 'The passage leads east toward Fourth Avenue',
    },
    north: {
      to: 'underground/upper-tunnels/x13-y3.ts',
      description: 'A connecting passage runs north',
    },
    south: {
      to: 'underground/upper-tunnels/x13-y1.ts',
      description: 'A connecting passage runs south',
    },
  },
};
