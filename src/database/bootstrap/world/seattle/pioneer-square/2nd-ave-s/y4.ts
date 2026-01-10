// 2nd Ave S - between S. Main and S. Washington

export const room = {
  name: '2nd Ave S',
  description: `The Corp Construction barrier continues its march along the eastern side of the avenue, an unbroken wall of black fabric and metal poles. The street here is cleaner than most—the corporation keeps their perimeter tidy. The contrast with the western side is jarring.

A convenience store on the west side has been boarded up, but the boards have been pried open enough to squeeze through. The shelves inside have been picked clean long ago. Only the fixtures remain, bolted to the floor, too heavy to carry and too worthless to bother with.

Water stains mark the asphalt where something leaked from above. The source isn't visible from street level. The stains have dried into abstract patterns, modern art created by neglect and gravity.`,
  x: 0,
  y: 4,
  z: 0,

  imageOnDisk: '2nd-ave-s-x0-y4-z0.png',
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Street furniture
  objects: [{ prototype: 'lamppost', name: 'Street Lamp' }],
};
