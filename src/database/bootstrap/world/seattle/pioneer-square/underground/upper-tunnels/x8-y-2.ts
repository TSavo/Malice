// Underground passage - connecting x8-y-1 to Elevator Pit (8,-2)

export const room = {
  name: 'Foundation Passage',
  description: `The passage runs through the foundation level of the buildings above, the construction showing the heavy engineering required to support the structures. The walls are made of reinforced concrete, the floor of the same—industrial construction designed for permanence.

A junction with the Elevator Pit lies nearby, the vertical shaft visible through gaps in the construction. The elevator is long since abandoned, its mechanisms rusted solid, but the shaft provides a route for those willing to climb.

The sound of dripping water echoes from the elevator shaft, condensation trickling down the walls of the vertical passage.`,
  x: 8,
  y: -2,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 12,
  waterLevel: 10,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x8-y-1.ts',
      description: 'The passage leads north',
    },
    south: {
      to: 'underground/upper-tunnels/x8-y-3.ts',
      description: 'The passage continues south',
    },
    east: {
      to: 'underground/upper-tunnels/x9-y-2.ts',
      description: 'A passage leads east',
    },
  },
};
