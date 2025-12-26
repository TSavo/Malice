// Park Shaft - descent from Park Access (z=-2) to Runner's Den (z=-4)

export const room = {
  name: 'Park Shaft',
  description: `The shaft is barely wider than a body, carved through raw earth and shored with mismatched materials—old signage, flattened drums, sections of chain-link stretched flat and bolted to timber frames. The construction speaks of urgency and improvisation, a passage dug in haste and reinforced in stages. Whoever built this didn't have resources to spare.

The descent follows a series of switchback platforms connected by steep wooden steps, the treads worn thin at their centers. The walls show scratch marks at shoulder height, evidence of tight navigation in darkness. The passage feels watched, though nothing suggests observation—just the architecture itself, designed to slow anyone moving through.

Sound from above is muffled by the earth and timber. Sound from below carries clearly: the distant hum of electricity, the occasional echo of movement, the breathing presence of inhabited space.`,
  x: -3,
  y: 2,
  z: -3,
  population: 0,
  ambientNoise: 10,
  lighting: 5,
  waterLevel: 0,
  outdoor: false,
  // Note: 'down' exit to building is created by building-builder from z-4.ts
};
