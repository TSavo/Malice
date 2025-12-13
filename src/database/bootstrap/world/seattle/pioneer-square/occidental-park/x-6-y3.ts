// Occidental Park - Western edge (x=-4, y=2)

export const room = {
  name: 'Occidental Park',
  description: `The western side of Occidental Park, where brick plaza meets the alley-like space along First Avenue. The park opens east from here into its central expanse.

A pergola structure extends overhead, its wooden beams weathered to grey, its lattice top open to the sky. The pergola was meant to provide shade and define space, to create intimate zones within the larger plaza. It serves that function still, though there are no people to enjoy the shade or intimacy.

Benches line the pergola's length, arranged in a social configuration—facing each other, inviting conversation. The benches are empty. Their arrangement suggests a use that no longer happens, a social interaction frozen in architectural form.

A drinking fountain stands near the path, its basin stained with mineral deposits, its spout dry. A small plaque mounted on the fountain dedicates it to someone, their name and dates visible despite the weathering. They donated money for this fountain. The water has stopped but the plaque remains.

The park extends in all cardinal directions from here.`,
  x: -6,
  y: 3,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 12, // Pergola slightly muffles wind
  lighting: 90, // Slight shade from pergola
  waterLevel: 0, // Dry
  outdoor: true, // Open plaza with pergola
};
