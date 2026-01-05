// Underground passage - between Occidental South Passage and Occidental South Junction

export const room = {
  name: 'Transition Corridor',
  description: `The passage narrows here as it descends between the Occidental corridor and the King Street junction. The walls show a distinct change in construction—Victorian commercial brick giving way to heavier industrial stonework, the boundary between two eras of underground development.

Water seeps through the eastern wall where some long-forgotten pipe has corroded through, leaving mineral deposits that streak the stone in rust and verdigris. A makeshift gutter of bent sheet metal channels the trickle toward a floor drain that gurgles constantly, the sound echoing in the narrow space.

Electrical conduit runs along the ceiling, an addition from the twentieth century that brought power to sections that had survived on gas and candle. The wiring is exposed in places, the insulation cracked and peeling, suggesting the installation predates modern safety codes by several decades.`,
  x: -7,
  y: -9,
  z: -2,
  population: 0,
  ambientNoise: 28,
  lighting: 15,
  waterLevel: 10,
  outdoor: false,
  exits: {
    north: {
      to: 'buildings/king-street-underground/z-2.ts',
      room: '%OCC_SOUTH_PASSAGE',
      description: 'The passage leads north toward the Occidental corridor',
    },
    south: {
      to: 'buildings/king-street-underground/z-2.ts',
      room: '%OCCIDENTAL_SOUTH',
      description: 'The passage leads south toward the King Street junction',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'makeshift gutter',
      description: 'Bent sheet metal channels water from a seeping wall toward a floor drain. The work is crude but effective.',
      boltedDown: true,
    },
    {
      prototype: 'sign',
      name: 'exposed wiring',
      description: 'Electrical conduit with cracked insulation runs along the ceiling. A faded label reads "CAUTION - 220V" in letters barely visible.',
      boltedDown: true,
    },
  ],
};
