// Occidental Ave alley section
// Adjacent to Occidental Park

export const room = {
  name: 'Occidental Ave S',
  description: `This stretch of Occidental runs alongside the park to the east, but the buildings to the west give it an alley-like atmosphere. The contrast is stark—open plaza on one side, enclosed service corridor on the other.

The western buildings show their backs here, presenting loading docks and service doors to the avenue. A metal roll-up door hangs half-open, frozen in place, revealing darkness within. Above it, faded lettering reads CENTRAL SUPPLY CO, a business that supplied something to someone, once.

A chain-link fence partially separates the avenue from the park, but it's collapsed in sections, easy to step over. Through the gaps, you can see the park's brick plaza, its dead trees, its empty benches arranged in rows for crowds that will never come.

The pavement here is broken, chunks of asphalt missing to reveal the dirt and buried debris beneath. Weeds grow aggressively, fed by runoff from the park and shaded enough to survive.

Occidental continues north and south, running between park and buildings.`,
  x: -7,
  y: 2,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 10, // Wind from park, distant echoes
  lighting: 55, // Better lit (park-adjacent, less enclosed)
  waterLevel: 0, // Dry
  outdoor: true, // Open to sky, park provides openness
};
