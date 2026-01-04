// S. Main Corridor passage - with access to Occidental Square basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The passage floor is uneven here, the brick surface disrupted by roots that found their way down from the street above. The roots are dead now, grey and desiccated, but they remain embedded in the floor like the fingers of giants grasping at nothing. The trees that sent them down are long gone. The roots persist.

The disruption creates ridges and valleys in the floor, tripping hazards in the darkness. Movement requires attention, each step placed carefully, each footfall tested before weight commits. The passage doesn't forgive inattention. The roots don't care.

A breach in the northern wall leads to a building cellar—old brick darkened by the Great Fire, the smell of stored books and roasted coffee drifting through.`,
      x: -8,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: {
          to: 'buildings/occidental-square/z-1.ts:%OLD_CELLAR',
          description: 'A breach in the wall leads to a building cellar',
        },
      },
    },
  },
};
