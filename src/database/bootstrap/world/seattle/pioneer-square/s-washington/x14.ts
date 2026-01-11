// 4th Ave S & S. Washington St intersection

export const room = {
  name: '4th Ave S & S. Washington St',
  description: `Fourth Avenue cuts through here with the bluntness of a major route, a wider channel of asphalt that the city once used to move people and freight between districts. The buildings along it are taller and less ornamented than Pioneer Square’s preserved brickwork—structures built in the years when “historic” was a word used to justify demolition.

Washington Street reaches Fourth and keeps going in spirit, if not in jurisdiction. East of here the neighborhood shifts toward the International District, the signage changing languages, the architecture changing eras, the street life changing rules. In Malice, boundaries are rarely marked with gates; they’re marked with who controls the next block, and what they’re willing to do to keep it.

North on Fourth, you can see the line of the city climbing toward Yesler. South, the avenue runs down toward King Street and the industrial flats beyond. The intersection holds the quiet tension of a corridor that still connects to somewhere else.`,
  x: 14,
  y: 6,
  z: 0,

  imageOnDisk: '4th-ave-s-s-washington-st-x14-y6-z0.png',
  intersection: ['4th Ave S', 'S. Washington St'],
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Street furniture
  objects: [
    { prototype: 'streetSignal', name: 'Traffic Signal' },
    { prototype: 'streetSign', streetName: '4th Ave S', direction: ['N', 'S'] },
    {
      prototype: 'streetSign',
      streetName: 'S. Washington St',
      direction: ['E', 'W'],
    },
  ],
};
