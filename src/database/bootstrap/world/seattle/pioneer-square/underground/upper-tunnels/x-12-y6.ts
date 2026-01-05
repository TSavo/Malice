// East approach to Junction - with access to Interurban Building basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The passage reaches the eastern approach to the Junction, the corridor opening into a transitional space that mediates between the utilitarian passages and the more trafficked intersection ahead. The walls show evidence of intentional modification—doorways widened, corners rounded, the geometry smoothed to accommodate the flow of movement.

The lighting is brighter here, electrical fixtures installed by people with resources and reasons. The illumination serves practical purposes—navigation, security, the basic need to see what's coming—but it also marks territory. Light in the underground is not neutral. Someone pays for it.

A breach in the western wall reveals a building basement beyond—the mechanical room of the Interurban Building, its furnace visible through the opening. The passage was created deliberately, connecting surface infrastructure to the underground network.`,
      x: -12,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 16,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/interurban-building/z0.ts:%BASEMENT',
          description: 'A breach in the wall leads to a building basement',
        },
      },
    },
  },
};
