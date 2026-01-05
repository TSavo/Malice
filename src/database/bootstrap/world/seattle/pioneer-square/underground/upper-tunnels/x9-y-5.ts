// Underground passage - y=-5 corridor connecting Southern Terminus (10,-5) to Supply Junction South (-14,-5)

export const room = {
  name: 'Southern Passage East',
  description: `The passage runs west through the southern underground, part of a long corridor that connects the eastern network to the supply routes. The construction is old and rough—hand-carved through earth and rubble, reinforced with brick that has shifted over the decades.

Water seeps through cracks in the walls, keeping the floor perpetually muddy. The drainage is poor in this section, water pooling in depressions before slowly finding its way to lower tunnels. Footprints track through the mud in both directions.

The air carries the industrial smell of the rail yards to the south—diesel, grease, and steel. The underground approaches the transit infrastructure that shaped the city's growth.`,
  x: 9,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 10,
  waterLevel: 15,
  outdoor: false,
  exits: {
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%SOUTH_TERMINUS',
      description: 'The passage leads east toward the Southern Terminus',
    },
    west: {
      to: 'underground/upper-tunnels/x8-y-5.ts',
      description: 'The passage continues west',
    },
  },
};
