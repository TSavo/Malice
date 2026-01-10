// 2nd Ave S - approaching Yesler Way

export const room = {
  name: '2nd Ave S',
  description: `SMITH TOWER rises immediately to the west, its white glazed brick facade filling the view. From this close, the building's scale is overwhelming—thirty-eight stories climbing toward the terracotta pyramid crown, the ornate eagles and classical motifs on the lower floors visible in sharp detail. Glass doors on the tower's east side lead into what was once Seattle's first skyscraper bank.

Yesler Way lies just ahead, the diagonal street that slices across the grid at an angle that never quite made sense. The intersection was always awkward for navigation, streets meeting at angles that created triangular lots and confused tourists. The confusion persists without the tourists.

The buildings here are scarred from the burning—upper floors blackened, windows blown out, facades pocked with damage that might be shrapnel or might be something else. The lower levels remain largely intact, protected by the mass of the structures themselves. Brick and stone absorbed what they could. Glass and wood didn't. Smith Tower absorbed everything, unscathed.`,
  x: 0,
  y: 11,
  z: 0,

  imageOnDisk: '2nd-ave-s-x0-y11-z0.png',
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Street furniture
  objects: [{ prototype: 'lamppost', name: 'Street Lamp' }],
  exits: {
    north: 'yesler-way/x0.ts',
    south: '2nd-ave-s/y10.ts',
  },
};
