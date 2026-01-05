// Underground passage - connecting x-8-y-8 to Storage Bay (-10,-6)

export const room = {
  name: 'Storage Approach',
  description: `The passage approaches the Storage Bay, the character of the construction changing as it enters the organized sections of the western underground. The walls are cleaner here, the floors better maintained—signs of active use rather than abandonment.

The ceiling rises as the passage widens, the space sized for the storage operations that once characterized this section. Heavy iron rings are set into the walls—anchors for ropes that might have secured stored goods.

The smell of dry goods lingers—grain, cloth, materials that were stored here decades ago and left their traces in the very walls.`,
  x: -9,
  y: -8,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 15,
  waterLevel: 8,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-8-y-8.ts',
      description: 'The passage leads east',
    },
    north: {
      to: 'underground/upper-tunnels/x-9-y-7.ts',
      description: 'The passage continues north toward Storage Bay',
    },
  },
};
