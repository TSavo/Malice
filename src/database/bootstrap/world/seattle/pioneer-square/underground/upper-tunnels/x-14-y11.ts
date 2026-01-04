// North of main spine - approaching Yesler Way - with access to Pioneer Books basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The passage continues north toward the chaos of Yesler Way above, where Seattle's two street grids collide in a geometry that has never made sense. The underground reflects the surface confusion—the walls angle slightly, the ceiling rises and falls, the passage itself seeming to bend as it approaches the boundary where order breaks down.

The brick here is older than in the southern passages, the construction dating to the earliest years of the underground, when the city was first burying its past. The mortar is crumbling in places, the bricks themselves soft with age and moisture, the structure held together more by habit than by engineering.

A freshly excavated passage leads north, climbing toward what appears to be a building's old foundation. The digging is recent, the earth fresh.`,
      x: -14,
      y: 11,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: {
          to: 'buildings/pioneer-books/z-1.ts:%FOUNDATION',
          description: 'An excavated passage leads up toward a building foundation',
        },
      },
    },
  },
};
