// Junction Shaft - main descent from The Junction (z=-2) to Lower Junction (z=-4)

export const room = {
  name: 'Junction Shaft',
  description: `The shaft drops straight down into darkness, a vertical wound in the earth that predates the underground network itself—an old well, perhaps, or a ventilation shaft from the mines that once honeycombed the hillside. Someone widened it. Someone installed the iron rungs that descend into the black. Someone made this passage deliberate.

The walls press close, barely wide enough for shoulders. The rungs are worn smooth at their centers, polished by countless hands, the metal bright where fingers grip and dark with age everywhere else. The descent is perhaps thirty feet, though it feels longer in the dark. Sound travels strangely here—voices from below arrive distorted, footsteps from above echo like drumbeats.

The air changes as you descend. The damp coolness of the upper tunnels gives way to something warmer, closer, carrying the faint chemical smell of inhabited space.`,
  x: -14,
  y: 5,
  z: -3,
  population: 0,
  ambientNoise: 12,
  lighting: 5,
  waterLevel: 0,
  outdoor: false,
  // Note: 'down' exit to building is created by building-builder from z-4.ts
};
