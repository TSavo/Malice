// 4th Ave S & Yesler Way
// Eastern boundary, gateway to the International District

export const room = {
  name: '4th Ave S & Yesler Way',
  description: `Fourth Avenue marks Pioneer Square's eastern boundary—and the end of the road. The Chinatown Gate that once welcomed visitors to the International District lies collapsed across the intersection, its red timber splintered, its curved eaves shattered, guardian dragons broken on the pavement. The gate fell during the burning, bringing down power lines and a traffic light with it. The debris has been here so long that weeds grow through the wreckage.

Beyond the fallen gate, Yesler Way is impassable. Buildings on both sides of the street partially collapsed into the road during the aftermath, creating a canyon of rubble that would take heavy equipment to clear. No one has heavy equipment. No one is clearing anything.

A gas station occupies the corner, its canopy stained and sagging, its pumps rusted solid. The station served this intersection for decades before the war and has stood empty since. A sign still lists prices for gas that will never be pumped. The convenience store behind security bars is dark and stripped.

This is as far east as you can go. The International District lies beyond the barricade, unreachable from here. North is equally blocked—the debris wall that isolates Pioneer Square from downtown sealing off passage in that direction as well.`,
  x: 14,
  y: 12,
  z: 0,

  imageOnDisk: '4th-ave-s-yesler-way-x14-y12-z0.png',
  intersection: ['4th Ave S', 'Yesler Way'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  // Street furniture
  objects: [
    { prototype: 'streetSignal', name: 'Traffic Signal' },
    { prototype: 'streetSign', streetName: '4th Ave S', direction: ['N', 'S'] },
    {
      prototype: 'streetSign',
      streetName: 'Yesler Way',
      direction: ['E', 'W'],
    },
  ],
};
