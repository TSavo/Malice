// S. Washington St - waterfront edge

export const room = {
  name: 'S. Washington St',
  description: `The street ends here at the waterfront, or what used to be the waterfront before they raised the city. The original Seattle is down there somewhere, beneath the streets, beneath the fill, beneath the layers of ambition and failure that this city was built on.

A retaining wall marks the edge of solid ground. Beyond it, the land drops away toward the piers and the grey water of Elliott Bay. The seawall is cracked in places, sections sagging where the fill has shifted. Engineers worried about this for years. They were right to worry. They just worried about the wrong things.

The buildings of Pioneer Square rise behind, brick and stone and terra cotta, their windows dark, their doors sealed or broken. Smith Tower is visible a block away, still the tallest thing in the neighborhood, still standing when everything else has fallen.

The wind comes off the water, cold and salt-tinged. It smells like the sea. It smells like rot.`,
  x: -15,
  y: 5,
  z: 0,
  intersection: ['Waterfront', 'S. Washington St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
