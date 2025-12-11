// Alley east of Occidental Park
// Running parallel to the park between park and 2nd Ave

export const room = {
  name: 'Alley off Occidental Park',
  description: `This alley runs along the eastern edge of Occidental Park, squeezed between the park's boundary and the buildings that face 2nd Avenue. It's wider than a service alley, more like a forgotten side street, but it never had a name.

To the west, the park is visible through gaps in a chain-link fence that marks the boundary. The fence leans inward, partially collapsed, easy to step over. Beyond it, the park's dead trees and empty plaza spread out in silent testimony to better days.

The eastern side is a wall of building backs—brick, concrete, metal siding. These are the structures that face 2nd Avenue with their front doors and display windows. Here in the alley, they show only utility doors, boarded windows, electrical boxes crusted with corrosion.

The pavement is broken, chunks of it missing entirely to reveal the dirt and buried debris beneath. Weeds grow aggressively here, fed by runoff from the park and shaded enough to survive Seattle's inconsistent rain.

A shopping cart lies on its side near the fence, its wheels rusted solid. Someone once pushed it here, left it, forgot it.

The alley continues north and south along the park's edge.`,
  x: 1,
  y: 0,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 10, // More open, wind noise from park
  lighting: 60, // Better lit (adjacent to open park space)
  waterLevel: 0, // Dry
  outdoor: true, // Open to sky, less enclosed
};
