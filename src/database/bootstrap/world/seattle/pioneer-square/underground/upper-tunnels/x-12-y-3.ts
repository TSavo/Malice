// Underground passage - between Tour storefronts and Sealed Passage

export const room = {
  name: 'Flooded Foundation',
  description: `The passage drops into a basement that still floods regularly, judging by the waterline stains that climb three feet up the walls. The floor is slick with organic muck—decomposed leaves, rotted paper, the accumulated residue of a century of periodic inundation.

The stench is powerful: mold and stagnant water and something sweeter beneath it, the smell of things that died and were forgotten. Metal shelving along one wall has collapsed into the muck, its contents—canned goods that once fed someone in hiding—now rusted beyond recognition.`,
  x: -12,
  y: -3,
  z: -2,
  population: 0,
  ambientNoise: 6,
  lighting: 3,
  waterLevel: 15,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x-13-y-3.ts',
      description: 'The passage rises west',
    },
    east: {
      to: 'underground/upper-tunnels/x-11-y-3.ts',
      description: 'A raised walkway leads east',
    },
    north: {
      to: 'underground/upper-tunnels/x-12-y-2.ts',
      description: 'A narrow shaft leads north toward a building foundation',
    },
  },
  objects: [
    {
      prototype: 'cabinet',
      name: 'collapsed shelving',
      description:
        'Metal shelving has fallen into the muck, its contents—ancient canned goods—now shapeless lumps of rust.',
      boltedDown: true,
    },
  ],
};
