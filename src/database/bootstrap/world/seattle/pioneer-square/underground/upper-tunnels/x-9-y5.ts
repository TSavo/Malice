// Junction Corridor - Brick-Lined Passage

export const room = {
  name: 'Brick-Lined Passage',
  description: `The tunnel runs through a section of particularly fine brickwork, the masonry laid in an ornamental pattern that suggests this was once a visible space rather than a buried utility passage. Decorative arches span the ceiling at regular intervals, purely aesthetic elements that served no structural purpose.

The craftsmanship speaks to a time when even basements were built with pride, when immigrant masons brought Old World techniques to this raw frontier town. Their work has outlasted the buildings above.`,
  x: -9,
  y: 5,
  z: -2,
  population: 0,
  ambientNoise: 8,
  lighting: 12,
  waterLevel: 0,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x-10-y5.ts',
      description: 'The passage continues west',
    },
    northeast: {
      to: 'underground/upper-tunnels/x-8-y6.ts',
      description: 'The passage angles northeast',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'decorative brick arches',
      description: 'Ornamental arches of contrasting brick colors span the ceiling, purely decorative elements from when this basement was meant to be seen.',
      boltedDown: true,
    },
  ],
};
