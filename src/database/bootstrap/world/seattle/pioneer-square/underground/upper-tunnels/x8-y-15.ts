// Underground passage - waterfront approaches

export const room = {
  name: 'Tidal Zone West',
  description: `The passage enters the tidal influence zone, where the underground approaches the level of Elliott Bay. The walls show distinct water lines—marks of floods that occur when high tides and heavy rains combine to overwhelm the drainage systems.

The air is heavy with salt and the smell of the sea. Barnacles and mussels cling to the lower portions of the walls, evidence that seawater regularly enters this section of the underground.

The floor is covered with a layer of silt and debris deposited by tidal flooding—shells, seaweed, unidentifiable organic matter. The route is passable but unpleasant.`,
  x: 8,
  y: -15,
  z: -2,
  population: 0,
  ambientNoise: 20,
  lighting: 8,
  waterLevel: 25,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x9-y-15.ts',
      description: 'The passage continues east',
    },
    south: {
      to: 'underground/upper-tunnels/x8-y-16.ts',
      description: 'The passage continues south toward the waterfront',
    },
  },
};
