// Waterfront & S. King St intersection

export const room = {
  name: 'Alaskan Way & S. King St',
  description: `The Waterfront meets S. King Street at the southern boundary of Pioneer Square. The container port stretches to the south, its cranes frozen against the sky, its ships rusting at anchor. The port was never beautiful. Now it's not even functional.

A fishing pier extends into Elliott Bay here, its planks weathered and warped. The fishermen who cast lines from this pier are gone. The fish remain, presumably, swimming beneath waters that have become cleaner in humanity's absence.

Seagulls circle overhead, their cries the only voice in this corner of the city. They've adapted. They always do.

The intersection marks the corner of the grid. The waterfront runs north. S. King runs east. The bay waits to the west, patient and cold.`,
  x: -15,
  y: -10,
  z: 0,
  intersection: ['Alaskan Way', 'S. King St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
