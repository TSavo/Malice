// Alley behind Smith Tower
// Service alley south section

export const room = {
  name: 'Alley behind Smith Tower',
  description: `The alley runs along the eastern side of Smith Tower, pressed between that historic landmark and the buildings beyond. It's tighter here than most alleys, barely three meters wide, the kind of space that makes you aware of your shoulders and the walls.

Smith Tower's eastern wall is smooth brick, lighter than you'd expect, almost cream-colored where the grime hasn't taken hold. No windows on this side—this was never meant to be seen. High above, the tower rises forty-two stories, but down here in the alley, you can't see the top. Just brick and shadow.

The buildings to the east are lower, their walls an uneven mix of materials. Doors that once led to storage rooms are sealed with rust and time. A fire escape ends two meters above the ground, its ladder mechanism frozen or missing.

The pavement is buckled here, the ground beneath having shifted or settled. Water pools in the low spots, though it hasn't rained recently. Something is seeping up from below, or condensing from the perpetually damp air between the walls.

The alley continues north and south, squeezed between buildings.`,
  x: -4,
  y: 7,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 3, // Very quiet, sounds muffled by walls
  lighting: 30, // Dark (very narrow, minimal sky visible)
  waterLevel: 0, // Dry (pooled water is shallow)
  outdoor: true, // Open to sky but deeply shadowed
};
