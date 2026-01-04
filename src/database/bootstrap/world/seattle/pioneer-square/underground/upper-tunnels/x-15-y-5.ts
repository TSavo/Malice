// Supply Branch passage - with access to Terra Nova Gallery basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The passage opens here into a broader space where several routes once converged. The intersection is less formal than others in the underground—more crossroads than junction, more accident than design. The buried buildings that created this space were positioned for surface logic that doesn't translate underground. The result is a shape that defies easy description: roughly triangular, with exits in unexpected directions.

The floor is a patchwork of different surfaces: brick, stone, packed earth, and concrete laid over older materials at different times for different reasons. Walking across the space means crossing decades of repair and renovation, each surface telling its own story of maintenance and modification.

A breach in the southern wall leads to a building basement—the faint smell of sawdust and old lacquer drifts through, the ghost of a workshop.`,
      x: -15,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 'buildings/terra-nova-gallery/z-1.ts:%VAULT',
          description: 'A breach in the wall leads to a building basement',
        },
      },
    },
  },
};
