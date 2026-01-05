// Underground passage - connecting Southern Terminus (10,-5) to King Street Approach (12,-5)

export const room = {
  name: 'Southern Corridor',
  description: `The passage runs through the southern depths of the underground network, connecting the western terminus to the eastern King Street approach. The construction is old and rough—hand-carved passages reinforced with brick that has shifted and settled over the decades.

Water collects here, the drainage from the higher tunnels pooling in depressions that never fully drain. The floor is perpetually muddy, tracks showing the passage of those who use this route despite its challenging conditions.

The smell of the rail yards is stronger here—diesel, grease, and the mineral tang of steel on steel. The underground approaches its connection with the city's transit infrastructure.`,
  x: 11,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 20,
  lighting: 10,
  waterLevel: 15,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%SOUTH_TERMINUS',
      description: 'The passage leads west toward the southern terminus',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%KING_APPROACH',
      description: 'The passage leads east toward King Street',
    },
    north: {
      to: 'underground/upper-tunnels/x11-y-4.ts',
      description: 'A passage continues north',
    },
  },
};
