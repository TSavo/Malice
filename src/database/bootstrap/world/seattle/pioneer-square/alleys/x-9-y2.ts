// Sidewalk between 1st Ave S and Occidental Ave S
// East of Grand Central Arcade entrance

export const room = {
  name: '1st Ave S Sidewalk',
  description: `A narrow strip of sidewalk wedged between Grand Central's ornate facade and the empty lots to the east. The sandstone arch of the arcade's entrance dominates the view west—carved eagles watching from the capitals, the broken letters spelling GRAND ENTRAL above weathered oak doors.

The sidewalk itself is buckled, tree roots and settling foundations having lifted the original hexagonal paving stones into a treacherous terrain. A dead locust tree stands in a cast-iron grate, its branches bare and grey, bark peeling in strips.

To the east, the view opens toward Occidental Park, though the sightline is broken by debris and the remains of temporary structures that became permanent and then became ruins themselves.

The building's upper floors rise overhead—the iron framework of the partially collapsed roof visible against the sky, the clock tower at the corner with its frozen faces. Pigeons roost in the broken windows, cooing from somewhere inside.`,
  x: -9,
  y: 2,
  z: 0,
  // Environmental properties

  imageOnDisk: '1st-ave-s-sidewalk-x-9-y2-z0.png',
  population: 0, // Empty (post-Event)
  ambientNoise: 8, // Some sound from the arcade
  lighting: 75, // Outdoor, partially shaded
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  exits: {
    west: {
      to: 'buildings/grand-central/z0.ts#%GC_ENTRANCE',
      description: 'The ornate archway leads into Grand Central Arcade',
    },
  },
};
