// Underground passage - waterfront approaches

export const room = {
  name: 'Tidal Crossing',
  description: `The passage crosses through the tidal zone, connecting the industrial underground to the waterfront passages. The construction here shows adaptations for flooding—elevated walkways, drainage channels, hooks for securing equipment above the water line.

The walls are encrusted with marine growth below the tide line—barnacles, mussels, algae that has colonized this section of the underground. Above the tide line, the brick is stained with mineral deposits left by evaporating seawater.

The sound of water is constant—dripping, trickling, occasionally the rush of flooding when the tide comes in.`,
  x: 10,
  y: -15,
  z: -2,
  population: 0,
  ambientNoise: 25,
  lighting: 10,
  waterLevel: 22,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x10-y-14.ts',
      description: 'The passage leads north',
    },
    west: {
      to: 'underground/upper-tunnels/x9-y-15.ts',
      description: 'The passage continues west',
    },
    east: {
      to: 'underground/upper-tunnels/x11-y-15.ts',
      description: 'The passage continues east',
    },
    south: {
      to: 'underground/upper-tunnels/x10-y-16.ts',
      description: 'The passage continues south',
    },
  },
};
