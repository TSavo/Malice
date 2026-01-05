// Underground passage - connecting Eastern Passage (10,4) to Cable Run (12,4)

export const room = {
  name: 'East Central Crossing',
  description: `The passage runs through the center of the eastern underground, connecting the cable infrastructure to the older tunnel network. The construction shows the layered history of the space—Victorian brick at floor level, twentieth century concrete above, modern cable trays mounted to both.

A ventilation duct runs along the ceiling, carrying fresh air from the surface to the deeper sections of the network. The airflow is slight but noticeable, keeping the passage from becoming completely stagnant.

Graffiti covers portions of the walls—old tags layered over older tags, the markings of decades of underground travelers. Some are simple names; others are more elaborate, the work of artists who found their canvas in these forgotten spaces.`,
  x: 11,
  y: 4,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 18,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%EAST_PASSAGE',
      description: 'The passage leads west toward the Eastern Passage',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%CABLE_RUN',
      description: 'The passage leads east toward the cable runs',
    },
    north: {
      to: 'underground/upper-tunnels/x11-y5.ts',
      description: 'A passage continues north',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y3.ts',
      description: 'A passage continues south',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'layered graffiti',
      description: 'Tags spanning decades cover the walls. Some are names, some are dates, some are elaborate art. Each generation added its mark to the underground.',
      boltedDown: true,
    },
  ],
};
