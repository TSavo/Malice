// 2nd Ave S - between S. Main and S. Washington

export const room = {
  name: '2nd Ave S',
  description: `Second Avenue stretches north and south, the Corp Construction barrier a constant presence to the west. Whatever they're building behind that black fabric has been under construction for years now. The guards rotate but never speak. The work continues but never finishes.

A loading dock on the eastern side of the street sits empty, its roll-up door rusted shut. The painted numbers on the concrete have faded to ghosts. Someone has tagged the door with cryptic symbols—gang signs or something stranger. The paint is fresh against the rust.

Overhead, fire escapes zigzag up the building faces, their ladders retracted, their platforms home to pigeons and accumulated debris. A shopping cart sits on one landing three stories up, testament to some forgotten climb.`,
  x: 0,
  y: 3,
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
