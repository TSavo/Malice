// 4th Ave S & S. Washington St
// Eastern edge, past the Collapsed Building

export const room = {
  name: '4th Ave S & S. Washington St',
  description: `Washington Street emerges here on the far side of the Collapsed Building, or what would be Washington Street if the Collapsed Building had not eaten most of the block. The rubble pile extends almost to 4th Avenue, a barrier of concrete and steel and broken glass that separates this corner from the rest of the neighborhood.

The building that fell was on the other side of the debris. From here, you can see the back of the collapse, the exposed floors and dangling pipes and the intimate architecture of destruction. Wallpaper is visible on one intact section of wall, a cheerful floral pattern that someone chose for their office. The flowers are faded but still there, still blooming in the ruins.

Fourth Avenue marks the edge of Pioneer Square, the boundary with the International District. The boundary feels less meaningful now. Rubble does not care about neighborhood lines.

The street is passable heading north and south, but heading west means climbing over what is left of someone else's workplace. Most people go around.`,
  x: 15,
  y: 5,
  z: 0,
  intersection: ['4th Ave S', 'S. Washington St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
