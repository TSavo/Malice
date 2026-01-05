// Underground passage - y=-5 corridor - connects to Supply Junction South (-14,-5)

export const room = {
  name: 'Southern Approach',
  description: `The passage reaches the approach to Supply Junction South, the western terminus of the long southern corridor. The route has run from the eastern underground through more than two dozen sections to reach this point—a major artery in the underground network.

The construction here is substantial—reinforced walls, stable floor, good lighting—the infrastructure of a route that receives regular traffic and careful maintenance. The sounds of activity from the junction ahead indicate a busy space.

Direction markers point east toward the southern corridor and north toward the main underground routes, guiding travelers through the network's intersections.`,
  x: -13,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 22,
  lighting: 25,
  waterLevel: 3,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-12-y-5.ts',
      description: 'The long southern corridor continues east',
    },
    west: {
      to: 'underground/upper-tunnels/supply-junction.ts',
      description: 'The passage leads west to Supply Junction South',
    },
  },
};
