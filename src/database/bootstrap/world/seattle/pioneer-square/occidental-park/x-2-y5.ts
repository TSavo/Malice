// Occidental Mall - Food court (x=-2, y=5)

export const room = {
  name: 'Occidental Mall',
  description: `The food court section. Larger stalls here, built to accommodate cooking equipment and food prep. Stainless steel counters have held up better than the wood, still gleaming dully despite years of neglect. The cooking equipment is gone—generators, grills, fryers, all salvaged or stolen—but the infrastructure remains.

Picnic tables fill the center of the walkway, bolted to the brick. They're the heavy-duty commercial kind, steel frames with composite tops, designed to survive decades of public use. They've survived something else instead. The surfaces are covered in carved graffiti, years of idle hands leaving marks.

Menu boards still hang above some stalls, hand-painted signs advertising Thai food, BBQ, fresh crepes, artisan coffee. The prices are from another era. The foods are from another world. The signs remain, cheerful advertisements for meals no one will ever eat.

A water fountain stands at the edge of the seating area, dry and silent.`,
  x: -2,
  y: 5,
  z: 0,
  population: 0,
  ambientNoise: 10,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Park furniture
  objects: [{ prototype: 'parkLamp', name: 'Park Lamp' }],
  sittables: [
    {
      name: 'a picnic table',
      capacity: 6,
      emptyMsg: 'Heavy picnic tables fill the food court.',
      occupiedMsg: '%s sitting at a picnic table',
    },
  ],
};
