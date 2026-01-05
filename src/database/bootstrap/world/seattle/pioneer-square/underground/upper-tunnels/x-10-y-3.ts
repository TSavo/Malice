// Underground passage - between Tour storefronts and Sealed Passage

export const room = {
  name: 'Bricked Threshold',
  description: `The passage narrows to a point where a brick wall once stood—the bricks have been knocked through, creating a jagged opening into the space beyond. The work was recent, relatively speaking; the broken bricks show red cores where older walls would be weathered through. Someone wanted access to what lay on the other side badly enough to demolish the barrier.

Scratches on the bricks suggest tools rather than explosives—patient work, probably done in darkness to avoid detection. The opening is large enough for one person to squeeze through at a time. Beyond, the passage shows signs of different construction, a different era of the underground.`,
  x: -10,
  y: -3,
  z: -2,
  population: 0,
  ambientNoise: 4,
  lighting: 6,
  waterLevel: 0,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x-11-y-3.ts',
      description: 'The passage continues west',
    },
    east: {
      to: 'buildings/underground-east/z-2.ts',
      room: '%BRANCH_W1',
      description: 'A jagged opening leads east into another section of the underground',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'demolished brick wall',
      description: 'A brick wall with a rough opening smashed through it. The broken bricks are scattered on both sides, evidence of determined effort.',
      boltedDown: true,
    },
  ],
};
