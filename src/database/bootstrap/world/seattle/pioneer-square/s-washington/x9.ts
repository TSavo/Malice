// S. Washington St - along the debris field

export const room = {
  name: 'S. Washington St',
  description: `The debris field crowds closest here, the street running under the shadow of broken floors stacked at angles that no building was ever meant to hold. Rebar sticks out like dead roots. When the wind comes off the sound it whistles through gaps in the rubble and turns the whole pile into a low, empty instrument.

At the base of the collapse, the city’s layers are visible in cross-section—old brick foundation walls, newer poured concrete, a seam of asphalt over older asphalt. The corporate wars didn’t do this; neglect did. This is what fifty years of no inspections and no repair look like when gravity finally collects its debt.

The south side is intact enough to offer cover: alcoves, recessed doorways, loading bays. It’s the kind of street that encourages moving quickly and watching your footing, because the ruin above you doesn’t have to choose to be dangerous.`,
  x: 9,
  y: 6,
  z: 0,
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Street furniture
  objects: [{ prototype: 'lamppost', name: 'Street Lamp' }],
};
