// Supply Branch passage - with access to Supply Depot basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The passage runs east from the depot access, following the route of a buried loading alley. The proportions are different here than in the main tunnels—wider but lower, designed for carts rather than pedestrians, for cargo rather than customers. The ceiling is barely six feet, forcing taller travelers to duck, but the walls are far enough apart for two wagons to pass. The dimensions reflect an older kind of commerce.

The floor is stone here rather than brick, heavy slabs that could bear the weight of loaded wagons. The slabs are worn but not cracked, their surfaces grooved by iron wheels that rolled this way for decades. The grooves follow consistent paths, the tracks of routine, the record of regular delivery.

A breach in the western wall opens to a building basement—cold air drifts through, carrying the hum of machinery and the clinical smell of a Continuum facility.`,
      x: -19,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/supply-depot/z-1.ts:%RESERVES',
          description: 'A breach in the wall leads to a building basement',
        },
      },
    },
  },
};
