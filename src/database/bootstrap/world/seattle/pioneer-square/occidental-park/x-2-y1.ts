// Occidental Park - heart of the plaza

export const room = {
  name: 'Occidental Park',
  description: `A raised platform occupies the center of the park—the performance stage where musicians and speakers once addressed crowds. The brick surface is elevated six inches, its edges trimmed in weathered steel, the geometry designed to create a focal point. The stage faced west, audiences gathered on the plaza below, the buildings providing a backdrop for whatever spectacle was being performed.

No one performs here now. The stage collects leaves and debris, its surface stained by seasons of rain. Bolt holes mark where equipment was once mounted—speaker stands, lighting rigs, the infrastructure of performance. The bolts are gone, salvaged long ago. The holes remain, filling with rainwater, small wells in the brick.

The dead trees ringing the plaza create an accidental amphitheater, their bare branches framing the sky like the ribs of a cathedral.`,
  x: -2,
  y: 1,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 15, // Open plaza, wind across brick
  lighting: 100, // Full daylight (open space)
  waterLevel: 0, // Dry
  outdoor: true, // Open plaza
};
