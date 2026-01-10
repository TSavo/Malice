// Occidental Mall - Eastern entrance (x=-1, y=5)

export const room = {
  name: 'Occidental Mall',
  description: `The eastern entrance to Occidental Mall, where the market meets 2nd Avenue. The stalls here are smaller, oriented toward impulse purchases—the last chance to grab something before leaving, the first impression when arriving. Newspaper stands, flower buckets, snack vendors.

A large iron archway spans the entrance, wrought iron letters spelling OCCIDENTAL MALL in an art deco style. The letters are rusted now, the O missing entirely, leaving CCIDENTAL MALL to greet visitors. The arch frames 2nd Avenue beyond, the construction barrier visible across the street.

The transition from market to street is marked by a change in paving—the worn brick giving way to cracked concrete. A storm drain at the corner is partially blocked by accumulated debris, creating a permanent damp patch that hosts a small ecosystem of moss and lichen.

The market stretches west behind you. The park opens to the south.`,
  x: -1,
  y: 5,
  z: 0,

  imageOnDisk: 'occidental-mall-x-1-y5-z0.png',
  population: 0,
  ambientNoise: 12,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Park furniture
  objects: [{ prototype: 'parkLamp', name: 'Park Lamp' }],
  sittables: [
    {
      name: 'a entrance bench',
      capacity: 3,
      emptyMsg: 'A bench sits near the eastern entrance.',
      occupiedMsg: '%s sitting on the entrance bench',
    },
  ],
};
