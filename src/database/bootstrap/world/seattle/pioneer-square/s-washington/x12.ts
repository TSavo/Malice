// S. Washington St - approaching 4th Ave

export const room = {
  name: 'S. Washington St',
  description: `The air feels a little less trapped here. The debris field is mostly behind you now, reduced to scattered brick and a permanent dusting that stains everything the color of old clay. Washington Street widens back into its intended shape—two lanes, parking on both sides, a street built for a city that assumed cars would keep coming.

A collapsed awning lies half in the roadway, its metal ribs bent into a shape like a broken umbrella. Someone scavenged the fabric long ago; only the frame remains. The building it once sheltered still has its sign bracket, empty, bolts rusting in place where a name used to be.

To the east, you can see Fourth Avenue’s broader right-of-way cutting north and south, a corridor that survived because it had room to fail without closing completely.`,
  x: 12,
  y: 6,
  z: 0,
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Street furniture
  objects: [
    { prototype: 'lamppost', name: 'Street Lamp' },
  ],
};
