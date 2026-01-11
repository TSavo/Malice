// Occidental Mall - Produce section (x=-5, y=5)

export const room = {
  name: 'Occidental Mall',
  description: `This section of the mall was the produce market. Larger stalls with deeper counters, built to display crates of apples and berries and the famous Yakima Valley stone fruit. The wooden bins remain, stacked and empty, their slats grey with age.

A chalkboard price sign still hangs from one stall, the chalk long since washed away by rain that blew in under the awnings. The slate is clean now, a blank page waiting for prices that will never be written.

Drainage grates run down the center of the walkway—the market needed them to handle the mess of fresh produce, the dropped fruit and vegetable wash. Now they're clogged with leaves and debris, small pools forming after rain.

The smell of rotting fruit is long gone. Only brick and wood and the faint green of growing weeds.`,
  x: -5,
  y: 5,
  z: 0,

  imageOnDisk: 'occidental-mall-x-5-y5-z0.png',
  population: 0,
  ambientNoise: 10,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Park furniture
  objects: [{ prototype: 'parkLamp', name: 'Park Lamp' }],
  sittables: [
    {
      name: 'a produce bin',
      capacity: 2,
      emptyMsg: 'Stacked wooden produce bins sit empty.',
      occupiedMsg: '%s sitting in a produce bin',
    },
  ],
};
