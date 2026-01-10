// 2nd Ave S & Yesler Way
// Major intersection

export const room = {
  name: '2nd Ave S & Yesler Way',
  description: `Second Avenue crosses Yesler Way here. SMITH TOWER dominates the view to the southwest—thirty-eight stories of white glazed brick rising above everything else in Pioneer Square. The terracotta pyramid crown catches the light even on grey days, a beacon marking this intersection as significant. The tower was the tallest building west of the Mississippi when it was built, and it's still the tallest thing standing in Pioneer Square.

A mural covers the corner building's brick facade, five stories of salmon swimming upstream in Coast Salish style—bold reds and blacks faded now but still visible, the fish heading somewhere they'll never arrive. The mural seems small now, dwarfed by the tower behind it.

The street grid shifts at this intersection, a quirk of Seattle's founding visible in the misaligned blocks. North of Yesler Way, nothing quite lines up with what's south—two survey teams, two ideas of true north, a disagreement encoded in concrete and asphalt for two centuries and counting. North is impassable—collapsed buildings and debris sealing off downtown, the destruction that made Yesler Way Pioneer Square's northern edge.`,
  x: 0,
  y: 12,
  z: 0,
  intersection: ['2nd Ave S', 'Yesler Way'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  // Street furniture
  objects: [
    { prototype: 'streetSignal', name: 'Traffic Signal' },
    { prototype: 'streetSign', streetName: '2nd Ave S', direction: ['N', 'S'] },
    {
      prototype: 'streetSign',
      streetName: 'Yesler Way',
      direction: ['E', 'W'],
    },
  ],
  exits: {
    west: 'yesler-way/x-1.ts',
    south: '2nd-ave-s/y11.ts',
  },
};
