// Alley behind Grand Central building
// Service alley running north-south

export const room = {
  name: 'Alley behind Grand Central',
  description: `The alley runs between the back of the Grand Central building and the facades of buildings to the west. It's narrow here, maybe four meters wide, the kind of space that was meant for deliveries and garbage trucks, not for people.

A rusted fire escape zigzags up the Grand Central's brick wall, its lowest ladder hanging just out of reach. The metal is orange with rust, the bolts weeping brown stains down the bricks. Nobody has used it in a long time.

Dumpsters line the western wall, their lids propped open or missing entirely. Whatever they once held has been picked through, scattered, reclaimed by weather and time. Empty bottles. Cardboard boxes collapsed and dissolving. A single work boot, no laces.

The pavement is cracked, weeds pushing through. The shadows here are deep even at midday. The walls block the wind but trap the smells—decay, rust, old grease from a kitchen that no longer operates.

The alley continues north and south. To the east, a service door into Grand Central stands closed, its paint peeling, its lock probably rusted shut.`,
  x: -7,
  y: 1,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 5, // Slight echo, dripping water
  lighting: 40, // Shadowed (narrow alley, buildings block light)
  waterLevel: 0, // Dry
  outdoor: true, // Open to sky but shadowed
};
