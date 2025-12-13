// Occidental Park - central plaza

export const room = {
  name: 'Occidental Park',
  description: `Benches are arranged in a circle here, facing inward, creating a conversation pit in the middle of the plaza. The arrangement was intentional—urban designers believed that facing benches toward each other would encourage interaction, would transform strangers into neighbors. The benches face each other still, holding conversations with no one.

One bench has collapsed, its wooden slats rotted through, its metal frame twisted. Someone sits there anyway—not a person, but a mannequin, its plastic form weathered to grey, its features smoothed by decades of rain. The mannequin wears the remains of a coat. Its hands rest on its knees. Its blank face stares at the bench opposite, patient and waiting.

Someone placed the mannequin here. Someone thought it was funny, or meaningful, or just wanted to see how it would feel to make the empty park seem occupied. The joke persists. The mannequin waits.`,
  x: -3,
  y: 3,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 15, // Open plaza, wind across brick
  lighting: 100, // Full daylight (open space)
  waterLevel: 0, // Dry
  outdoor: true, // Open plaza
};
