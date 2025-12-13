// Occidental Park - central-northern section

export const room = {
  name: 'Occidental Park',
  description: `Three abstract sculptures occupy this section of the plaza, welded steel forms installed in the 1980s as part of Seattle's public art program. The sculptures were meant to represent something—movement, connection, the human condition—but fifty-five years of weather have transformed them into something else entirely.

Rust has eaten through the steel in places, creating organic patterns that the artist never intended. Moss grows in the joints where metal meets metal. One sculpture has partially collapsed, its upper section hanging at an angle, connected to the base by a single corroded weld. The collapse happened slowly, metal fatiguing over decades until gravity finally won.

The sculptures cast long shadows across the brick. Even diminished, even decaying, they have presence. Someone made these things. Someone thought they mattered enough to weld and paint and install in a public space. The caring shows, even now.`,
  x: -3,
  y: 4,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 15, // Open plaza, wind across brick
  lighting: 100, // Full daylight (open space)
  waterLevel: 0, // Dry
  outdoor: true, // Open plaza
};
