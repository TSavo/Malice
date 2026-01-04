// Main corridor - junction approach

export const room = {
  name: 'Underground Passage',
  description: `The passage reaches the edge of the main crossing, the corridor opening into the larger junction space just ahead. The transition is marked architecturally—the ceiling rising, the walls stepping back, the confined passage surrendering to the more generous geometry of the intersection.

The floor shows the concentrated wear of convergent traffic, paths merging from multiple directions into the common space of the crossing. The stone is polished smooth in the transit routes, rough and dusty in the corners where feet rarely fall.

The main crossing is one of the oldest junctions in the underground, a place where routes have met since the city was buried. The architecture acknowledges its age and importance—more light, more space, more care in construction than the utilitarian passages deserve.`,
  x: -15,
  y: 0,
  z: -2,
  population: 0,
  ambientNoise: 16,
  lighting: 20,
  waterLevel: 0,
  outdoor: false,
  exits: {
    north: {
      to: 'buildings/zeitgeist-coffee/z-1.ts:%OLD_BASEMENT',
      description: 'A breach in the wall leads to an old foundation',
    },
  },
};
