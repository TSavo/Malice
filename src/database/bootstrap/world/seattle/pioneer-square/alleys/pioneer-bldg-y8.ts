// Alley behind Pioneer Building
// Mid-section of service alley

export const room = {
  name: 'Alley behind Pioneer Building',
  description: `The alley runs straight here, a canyon between buildings. The Pioneer Building rises to the east, its upper floors lost in shadow, its base marked by service doors—metal frames, heavy locks, layers of paint that have cracked and peeled to show the years beneath.

One door stands slightly ajar, its frame bent, its lock mechanism broken. The gap is maybe ten centimeters, not enough to enter without forcing it wider, but enough to let out the smell of enclosed air and mildew. Nobody has been inside in a long time, but nobody has secured it either.

A dumpster sits against the western wall, its green paint faded to grey-green, its metal rusted through in places. It's empty except for water that has collected in the bottom—rainwater or condensation or both. The water is dark and still.

The pavement here is broken asphalt over old brick. In places where the asphalt has failed entirely, you can see the original brick street beneath, the same surface that existed here in the 1890s. The bricks are weathered but intact, still bearing the impressions of the molds that formed them.

The alley continues north and south between the buildings.`,
  x: 2,
  y: 8,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 5, // Dripping water, settling metal
  lighting: 30, // Dark (narrow section)
  waterLevel: 0, // Dry
  outdoor: true, // Open to sky but deeply shadowed
};
