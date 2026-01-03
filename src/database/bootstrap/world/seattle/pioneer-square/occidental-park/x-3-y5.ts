// Occidental Mall - Artisan row (x=-3, y=5)

export const room = {
  name: 'Occidental Mall',
  description: `The artisan section of the market. These stalls were built with more care than the others—custom woodwork, individual character, each one reflecting the craftsperson who once occupied it. A jewelry maker's booth still has its velvet-lined display trays, faded to grey. A leather worker's station retains its tool hooks, empty now.

One stall stands out: a blacksmith's demonstration space with a small forge and anvil bolted to the concrete. The forge is cold, has been cold for years, but the anvil remains—too heavy to move, too specialized to steal. Someone tried to pry it loose once, leaving gouge marks in the surrounding concrete.

The overhead framework is more elaborate here, wrought iron instead of simple steel, twisted into decorative patterns. The artisans demanded better. They got it. Now it frames the same empty sky as everywhere else.

Faded photographs are still pinned to some of the stall backboards, protected by plastic sleeves that have grown cloudy with age.`,
  x: -3,
  y: 5,
  z: 0,
  population: 0,
  ambientNoise: 10,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Park furniture
  objects: [
    { prototype: 'parkLamp', name: 'Park Lamp' },
  ],
  sittables: [
    {
      name: 'a craftsman stool',
      capacity: 2,
      emptyMsg: 'Wooden stools sit at the artisan stalls.',
      occupiedMsg: '%s sitting on a craftsman stool',
    },
  ],
};
