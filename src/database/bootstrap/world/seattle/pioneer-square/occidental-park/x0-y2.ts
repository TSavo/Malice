// Occidental Park - eastern plaza

export const room = {
  name: 'Occidental Park',
  description: `A pergola structure extends overhead here, its wooden beams weathered silver-grey but still intact. The lattice roof was designed to support climbing vines—wisteria, perhaps, or climbing roses—the plants that would have softened the geometry with organic curves. The vines are dead now, their dried stems still clinging to the lattice, creating a net of brown against the grey sky.

The pergola provides psychological shelter more than physical—the beams overhead create a sense of enclosure without blocking wind or rain. People gathered here for the intimacy the structure provided, the sense of being in a room within the larger plaza. The benches beneath the pergola are arranged for conversation, facing each other across a narrow space.

Light filters through the dead vines and lattice, creating complex shadows on the brick below. The shadows move with the sun, the only thing in the plaza that still keeps regular hours.`,
  x: 0,
  y: 2,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 15, // Open plaza, wind across brick
  lighting: 100, // Full daylight (open space)
  waterLevel: 0, // Dry
  outdoor: true, // Open plaza
};
