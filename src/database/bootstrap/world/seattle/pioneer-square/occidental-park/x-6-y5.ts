// Occidental Mall - Western entrance (x=-6, y=5)

export const room = {
  name: 'Occidental Mall',
  description: `The western entrance to what was once Pioneer Square's open-air market. A wide pedestrian corridor stretches east between the brick facades of historic buildings. Metal framework overhead—once supporting canvas awnings—now frames only grey sky.

Empty vendor stalls line both sides, their wooden counters weathered but intact. The stalls were built to last, designed for decades of daily use. They got decades of abandonment instead. Faded signs advertise crafts, produce, flowers—businesses that existed in a different world.

The brick paving is uneven here, lifted by tree roots and settled by time. Weeds push through the gaps, small pioneers reclaiming the space. A few hardy dandelions have gone to seed, their white puffs waiting for wind.

The market continues east. Occidental Park opens to the south.`,
  x: -6,
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
      name: 'a vendor stall counter',
      capacity: 2,
      emptyMsg: 'Empty vendor counters line the walkway.',
      occupiedMsg: '%s sitting on a vendor counter',
    },
  ],
};
