// West Spine passage - with access to Owl Cafe basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The passage descends slightly here, following the natural slope of the buried terrain toward the waterfront. The grade is barely noticeable—a few degrees at most—but water follows it, seeping slowly toward lower ground. The floor is damp, the walls glistening, the air thick with moisture that condenses on every surface.

Old pipes run along the ceiling, iron tubes installed at some point after the streets were raised, carrying water or gas or something else through the buried space. The pipes are corroded, their surfaces rough with rust, their original purpose long since obsolete. They remain because no one has bothered to remove them. The underground accumulates. It rarely discards.

The eastern wall shows a breach in the stonework—blocks removed to reveal a cellar beyond. The smell of old refrigeration and preserved food drifts through the opening.`,
      x: -14,
      y: -1,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: {
          to: 'buildings/owl-cafe/z-1.ts:%OLD_CELLAR',
          description: 'A breach in the wall leads to a building cellar',
        },
      },
    },
  },
};
