// Underground passage - between Tour storefronts and Sealed Passage

export const room = {
  name: 'Collapsed Storefront',
  description: `The passage continues through what was once another preserved storefront, but this one collapsed at some point after the tours ended. The ceiling timbers gave way, bringing down a section of the street above and filling the space with debris—brick, cobblestone, rotted wood, and layers of accumulated trash.

Someone has tunneled through the debris rather than cleared it, creating a low passage that forces visitors to duck and scramble. The original storefront is visible only in fragments: a doorframe here, a section of display window there, the corner of a painted sign reading "...INERY & N..." in faded letters.`,
  x: -13,
  y: -3,
  z: -2,
  population: 0,
  ambientNoise: 8,
  lighting: 5,
  waterLevel: 0,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/underground-tour/z-2.ts',
      room: '%STOREFRONT_ROW',
      description: 'The passage leads west toward the preserved storefronts',
    },
    east: {
      to: 'underground/upper-tunnels/x-12-y-3.ts',
      description: 'The tunnel continues east through debris',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'debris pile',
      description: 'A mountain of collapsed building materials blocks what was once a storefront. The tunnel through it is barely wide enough for one person.',
      boltedDown: true,
    },
  ],
};
