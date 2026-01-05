// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage continues west through the southern underground, the route straightening as it approaches the more organized sections of the network. The construction improves slightly—better drainage, more consistent lighting, signs that this section receives more attention than the eastern reaches.

A cable tray runs along one wall, carrying power and communications lines toward the supply routes. The cables are relatively modern additions, their plastic jackets cleaner than the century-old brick they pass through.

The air is drier here, the drainage systems functioning well enough to prevent the waterlogging that plagues other sections.`,
  x: -1,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 15,
  waterLevel: 5,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x0-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-2-y-5.ts',
      description: 'The passage continues west',
    },
  },
};
