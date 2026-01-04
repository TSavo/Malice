// West Spine passage - with access to Immigration Services basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The buried street runs north-south here, its proportions still suggesting the avenue it once was. The ceiling is high enough to walk upright, the walls far enough apart for two people to pass without touching—a luxury in the underground, where most passages force single-file movement. Brick pillars stand at irregular intervals, supporting the weight of the modern city above.

The mortar between bricks is old, dark with decades of moisture absorption, but the structure holds. The builders of 1889 understood their craft. What they built survived the fire, survived the raising of the streets, survived a century of forgetting. The underground endures because it was built to endure.

A breach in the western wall leads to what was once a federal building's basement—the stone foundations visible through the opening, the smell of old paper and older confinement drifting through.`,
      x: -14,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/immigration-services/z-1.ts:%CELLS',
          description: 'A breach in the wall leads to a building basement',
        },
      },
    },
  },
};
