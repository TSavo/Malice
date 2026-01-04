// Gargoyle Building coal cellar connection

export const room = {
  name: 'Underground Coal Passage',
  description: `The passage narrows here, following the route of an old coal delivery tunnel that once serviced the buildings along Yesler Way. The walls are stained black with coal dust so deeply embedded that no amount of water or time could wash it clean. The dust has become part of the brick itself, a permanent record of the fuel that powered these buildings before the conversion to gas.

The passage connects to the Gargoyle Building's coal cellar to the west, the connection predating the building's conversion to natural gas. When the streets were at this level, coal wagons would deliver their loads directly to cellar storage. The wagons are gone, the delivery chutes sealed, but the passage persists.

The floor is uneven, cobblestone in places, packed earth in others, the surface marked by the scars of coal carts and wheelbarrows that once hauled fuel to the furnaces above. The passage smells of old smoke and mineral dust, the accumulated scent of a century underground.`,
  x: -16,
  y: 12,
  z: -2,
  population: 0,
  ambientNoise: 10,
  lighting: 12,
  waterLevel: 0,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/gargoyle-building/z-1.ts:%TUNNEL_ACCESS',
      description: 'The passage connects to the coal cellar',
    },
  },
};
