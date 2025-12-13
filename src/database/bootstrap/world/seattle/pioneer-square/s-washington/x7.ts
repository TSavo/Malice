// 3rd Ave S & S. Washington St

export const room = {
  name: '3rd Ave S & S. Washington St',
  description: `Third Avenue intersects Washington here, but north of this intersection Third Avenue is impassable. The collapsed building's rubble has completely buried the road—a mountain of brick, concrete, and twisted steel two stories high blocking all passage north toward Yesler. The debris field starts just past this corner.

Washington Street remains clear east and west, passable all the way to 4th Avenue. To continue north toward Yesler on this side of Pioneer Square, you'll have to detour east to 4th Ave and go around.

The northwest corner holds a building that survived, its brick facade cracked but intact. PACIFIC NORTHWEST TITLE COMPANY occupies the ground floor, the name etched in the glass transom above the entrance. A fire hydrant marks the corner, its red paint weathered to rust, knocked off true by debris that scattered when the building came down. South from here, Third Avenue remains passable toward the International District.`,
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
