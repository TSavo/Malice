// 3rd Ave S & S. King St intersection

export const room = {
  name: '3rd Ave S & S. King St',
  description: `Third Avenue intersects S. King Street at Pioneer Square's southeastern corner—and another dead end heading south. The stadium district is blocked: collapsed structures and accumulated debris have sealed off all southbound routes. You can see the stadiums over the wreckage, their massive forms unchanged, but there's no passage through.

The intersection sits at what was once the commercial heart of the International District, where foot traffic from multiple directions converged. The pedestrian flow that supported the retail density is fifty-five years gone. The density remains. The pedestrians don't.

PACIFIC WIRELESS occupies the corner building, its windows smashed, its inventory long since looted. The mobile phone retailer served the neighborhood's communication needs—international calling cards that let immigrants call home. The phones are gone. The networks are gone. Home, for most of these families, is gone too. King Street continues east and west. Third Avenue runs north. South is rubble.`,
  x: 7,
  y: -12,
  z: 0,
  intersection: ['3rd Ave S', 'S. King St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  // Street furniture
  objects: [
    { prototype: 'streetSignal', name: 'Traffic Signal' },
    { prototype: 'streetSign', streetName: '3rd Ave S', direction: ['N', 'S'] },
    {
      prototype: 'streetSign',
      streetName: 'S. King St',
      direction: ['E', 'W'],
    },
  ],
};
