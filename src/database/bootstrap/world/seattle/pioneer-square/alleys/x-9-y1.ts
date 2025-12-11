// 1st Ave S alley section (between S. Main and S. Washington)
// North-south avenue with alley character

export const room = {
  name: '1st Ave S',
  description: `First Avenue narrows here between S. Main and S. Washington, taking on the character of a service alley more than a proper street. The buildings press closer, their facades less finished, their ground floors showing loading bays and service entrances rather than storefronts.

A dumpster occupies space near the western curb, its green paint faded to grey-green, rust eating through the metal at the corners. It hasn't been emptied in months, maybe longer, but whatever it once held has been picked through or dissolved by weather.

Fire escapes cling to the eastern buildings, their metal stairs zigzagging upward in narrow runs. The lowest platforms hang just out of reach, ladders retracted or missing, leaving the upper floors accessible only from inside.

The pavement here is rougher than the main streets, patched concrete and broken asphalt creating an uneven surface. Weeds push through the cracks, more aggressive here where the shadows linger and foot traffic was always lighter.

First Avenue continues north toward S. Washington and south toward S. Main.`,
  x: -9,
  y: 1,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 5, // Quiet, muffled
  lighting: 45, // Shadowed (buildings block some light)
  waterLevel: 0, // Dry
  outdoor: true, // Open to sky but enclosed feeling
};
