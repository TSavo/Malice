// Occidental Park - center of the park

export const room = {
  name: 'Occidental Park',
  description: `This is the center of Occidental Park, the point where the plaza opens widest, where the sky feels closest. On clear days—rare in Seattle even before the Event—you could see the Olympic Mountains from here, their snow-capped peaks visible above the waterfront buildings. The mountains are probably still there. The haze that hangs over the city now makes them invisible.

The open space feels exposed, vulnerable. The buildings around the plaza's edges create walls that channel wind and amplify sound. Every footstep echoes off brick and glass. Every movement is visible from multiple angles. The design was meant to create a sense of civic gathering, of shared space. Now it creates a sense of being watched.

A drinking fountain stands near the center, its basin dry, its spout corroded green. A plaque dedicates the fountain to someone whose name has weathered away. The drinking stopped. The dedication persists, illegible but present.`,
  x: -2,
  y: 2,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 15, // Open plaza, wind across brick
  lighting: 100, // Full daylight (open space)
  waterLevel: 0, // Dry
  outdoor: true, // Open plaza
};
