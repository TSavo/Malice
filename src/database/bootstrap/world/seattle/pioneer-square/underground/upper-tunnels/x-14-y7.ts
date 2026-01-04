// West Spine passage - with access to Pioneer Hotel basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `Old storefronts line the passage here, their facades preserved by darkness and neglect. The display windows are empty, their glass long since salvaged or broken, leaving rectangular voids that stare blindly at nothing. Signs above the empty windows advertise goods that haven't been sold for over a century: DRY GOODS, HARDWARE, PROVISIONS. The paint is faded but legible. The promises are empty but sincere.

The wooden decking that forms the ceiling shows the underside of the raised street above—timber joists and cross-bracing, the engineering of an earlier era visible in its honest simplicity. The wood is dark with age, swollen with absorbed moisture, but structurally sound.

A breach in the western wall leads to a building basement—the Pioneer Hotel's mechanical room, judging by the smell of old machinery and the hum of electrical panels.`,
      x: -14,
      y: 7,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/pioneer-hotel/z-1.ts:%MECHANICAL',
          description: 'A breach in the wall leads to a building basement',
        },
      },
    },
  },
};
