// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage continues through the western underground, approaching the storage and supply areas that serve the community living beneath the city. The infrastructure becomes more organized here—better lighting, clearer signage, the marks of active maintenance.

A pipe junction creates a bulge in one wall, the infrastructure carrying water and steam through the underground. The pipes are warm to the touch, the residual heat from the city's heating system making this section slightly more comfortable than the colder eastern passages.

Direction markers are painted on the walls—arrows and symbols that mean nothing to outsiders but guide regular users through the network.`,
  x: -9,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 20,
  lighting: 18,
  waterLevel: 5,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-8-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-10-y-5.ts',
      description: 'The passage continues west',
    },
  },
};
