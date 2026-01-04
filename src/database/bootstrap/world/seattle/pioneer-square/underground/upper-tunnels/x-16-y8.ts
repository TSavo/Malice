// City Services basement approach - with access to building infrastructure

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The passage approaches the basement infrastructure of the City Services building, the walls showing the transition from buried street to municipal architecture. The construction becomes more institutional here—concrete block rather than brick, metal conduit rather than exposed wiring, the materials of government rather than commerce.

The ceiling is higher, the passage sized for the movement of equipment rather than just people. The City Services building houses the district's sanitation, water, and power operations; the basement below serves those functions with infrastructure that most residents never see.

An opening in the eastern wall connects to the City Services mechanical room—the building's basement, where boilers and switchgear maintain systems that somehow still function.`,
      x: -16,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'buildings/city-services/z-1.ts:%MECHANICAL',
          description: 'A ladder leads up to the building basement',
        },
      },
    },
  },
};
