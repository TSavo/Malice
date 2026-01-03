// S. Washington St - the narrow way east

export const room = {
  name: 'S. Washington St',
  description: `Washington Street holds its line eastward, even here, where the city tried to fold in on itself. The rubble pile has stopped advancing—settled, compacted, stabilized by time and rain—yet it still feels temporary in the way cliffs feel temporary. A hard shake, a freeze-thaw season, and the geometry could change.

A faded mural clings to the south wall of a surviving building: stylized salmon, a skyline, optimistic colors scoured pale by years of weather. The paint predates the wars. It predates The Burning. It belonged to the era when civic pride was still something you could buy with grant money.

The street is quiet enough to hear small sounds: gravel shifting underfoot, water dripping somewhere inside the wreckage, the distant pop of settling timber. In a city that died loudly, the afterlife is mostly silence.`,
  x: 10,
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
