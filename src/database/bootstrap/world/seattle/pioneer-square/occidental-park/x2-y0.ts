// Occidental Park - southeast corner where park meets S. Main

export const room = {
  name: 'Occidental Park',
  description: `The southeastern corner of Occidental Park opens toward S. Main Street, a low concrete barrier marking the boundary between plaza and roadway. The barrier is more symbolic than functional—easy to step over, designed to suggest rather than enforce separation. Graffiti tags cover its surface, accumulated over decades, the oldest ones weathered to ghosts.

A newspaper box stands near the corner, the coin-operated kind that once dispensed the Seattle Times. The box is rusted shut, its window opaque with grime, but the masthead is still visible through the haze. Whatever edition remains inside is fifty-five years old, its headlines reporting a world that no longer exists.

S. Main Street stretches away to the east and west, its storefronts dark. The sound of wind through the dead trees creates a constant whisper, the breath of the plaza, the only voice that speaks here now.`,
  x: 2,
  y: 0,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 15, // Open plaza, wind across brick
  lighting: 100, // Full daylight (open space)
  waterLevel: 0, // Dry
  outdoor: true, // Open plaza
};
