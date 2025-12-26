// 3rd Ave S & S. Washington St

export const room = {
  name: '3rd Ave S & S. Washington St',
  description: `Third Avenue intersects Washington at a pinch point in the street grid. The Collapsed Building's debris field presses in from the northeast, rubble slumping down into the gutter and narrowing the roadway to a careful path between broken brick and intact storefronts. It's passable—barely—and the route east continues toward Fourth Avenue if you can stomach the unstable slope of wreckage looming above the north sidewalk.

Third Avenue itself feels less certain. North toward Yesler, the street is choked in places by spillover debris and half-collapsed facades, the kind of slow failure that started in the Long Dark when nobody had the materials, labor, or will to shore anything up. South remains open, the city giving you choices in one direction and taking them away in another.

The northwest corner holds a building that survived, its brick facade cracked but intact. PACIFIC NORTHWEST TITLE COMPANY occupies the ground floor, the name etched in the glass transom above the entrance. A fire hydrant marks the corner, its paint weathered to rust, knocked off true by impacts that scattered when the structure up the block came down. West on Washington remains wider; east is the narrow way through.`,
  x: 7,
  y: 6,
  z: 0,
  intersection: ['3rd Ave S', 'S. Washington St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
