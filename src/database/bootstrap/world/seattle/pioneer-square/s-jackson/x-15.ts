// Waterfront & S. Jackson St intersection

export const room = {
  name: 'Alaskan Way & S. Jackson St',
  description: `The Waterfront meets S. Jackson Street at Seattle's southern port district. The container cranes loom to the south, frozen mid-lift, their cables slack and their loads abandoned. The port was always working, day and night, ships loading and unloading. The work has stopped.

A seafood processing plant occupies the corner, its loading dock empty, its refrigeration units silent. The smell of fish is gone, replaced by rust and salt air and the absence of industry.

The ferry terminal is visible to the north, its tower a landmark for a transportation system that no longer transports. The water laps against the pilings, patient and indifferent.

The intersection is clear. The waterfront runs north and south. S. Jackson rises east into Pioneer Square.`,
  x: -15,
  y: -5,
  z: 0,
  intersection: ['Alaskan Way', 'S. Jackson St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
