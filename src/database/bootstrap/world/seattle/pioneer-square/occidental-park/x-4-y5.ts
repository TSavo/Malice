// Occidental Mall - Central market (x=-4, y=5)

export const room = {
  name: 'Occidental Mall',
  description: `The heart of the open-air market. The walkway widens here into a small plaza, stalls arranged in a horseshoe pattern around a central gathering space. This was where musicians played on weekends, where crowds gathered to watch street performers, where the market felt most alive.

A small raised platform sits at the center—the performer's stage. The wood is weathered but solid, built from the same old-growth lumber as the stalls. Initials have been carved into its surface over the years, decades of small vandalisms that now read like archaeology.

The surrounding stalls are craft vendors' spaces, smaller and more delicate than the produce section. Glass display cases sit dark and empty, their contents long since removed or looted. The cases themselves remain, too heavy to carry, too specialized to repurpose.

Wind moves through the open space, carrying the smell of wet brick and growing things.`,
  x: -4,
  y: 5,
  z: 0,

  imageOnDisk: 'occidental-mall-x-4-y5-z0.png',
  population: 0,
  ambientNoise: 12,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Park furniture
  objects: [{ prototype: 'parkLamp', name: 'Park Lamp' }],
  sittables: [
    {
      name: 'the performer stage',
      capacity: 4,
      emptyMsg: 'The raised performance stage sits empty.',
      occupiedMsg: '%s sitting on the stage',
    },
    {
      name: 'a market bench',
      capacity: 3,
      emptyMsg: 'Benches ring the central plaza.',
      occupiedMsg: '%s sitting on a bench',
    },
  ],
};
