// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage opens slightly as it passes through what was once a basement or cellar, the underground route having absorbed the foundation of a demolished building. The walls here are made of cut stone rather than brick—the work of a different era, more substantial construction that has outlasted the building it supported.

A blocked doorway in one wall leads nowhere, the space beyond having been filled in decades ago. The door frame remains, its hardware rusted solid, a portal to a room that no longer exists.

The floor is more stable here, the old cellar's flagstones providing solid footing compared to the mud and debris of the connecting passages.`,
  x: 5,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 10,
  waterLevel: 8,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x6-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x4-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'blocked doorway',
      description: 'A doorway with a rusted iron door leads to solid fill. The room beyond was filled in long ago.',
      boltedDown: true,
    },
  ],
};
