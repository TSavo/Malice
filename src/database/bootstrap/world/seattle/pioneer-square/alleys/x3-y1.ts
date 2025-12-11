// 2nd Ave S alley section (between S. Main and S. Washington)
// Service alley atmosphere

export const room = {
  name: '2nd Ave S',
  description: `Second Avenue narrows here into what feels more like an alley than a street. The buildings close in, their ground floors showing the functional necessities—loading bays, utility doors, exhaust vents—that were hidden from the proper streets.

A loading dock extends from the eastern building, its concrete platform waist-high, its metal roll-up door sealed shut with rust and time. The dock is cluttered with debris—broken pallets, collapsed boxes, an overturned hand truck with one wheel missing.

The western wall is darker brick, water-stained where downspouts have failed, marked with the rectangular shadows where signs once hung. Bolt holes pattern the brick in arrangements that once meant something—business names, directional arrows, warnings now removed or fallen.

A dumpster sits near the western curb, listing slightly where the ground has settled beneath it. Its lid is missing, its interior long emptied of everything but rust and accumulated rainwater.

Second Avenue continues north toward S. Washington and south toward S. Main.`,
  x: 3,
  y: 1,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 5, // Quiet, some dripping water
  lighting: 40, // Shadowed (enclosed by buildings)
  waterLevel: 0, // Dry
  outdoor: true, // Open to sky but shadowed
};
