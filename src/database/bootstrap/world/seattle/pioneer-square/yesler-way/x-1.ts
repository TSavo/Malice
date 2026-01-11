// Yesler Way - between Occidental and 2nd Ave

export const room = {
  name: 'Yesler Way',
  description: `Yesler Way approaches Second Avenue, the intersection where two street grids collide. South of Yesler, Pioneer Square's streets run cardinal—north, south, east, west. North of Yesler, downtown's streets rotate thirty-two degrees to follow the shoreline. The collision was a surveying decision made in 1853. The consequences echo through every map ever drawn of Seattle.

SMITH TOWER rises to the southwest, its white glazed brick facade and terracotta pyramid crown dominating the skyline. Thirty-eight stories of early twentieth-century ambition, still the tallest building in Pioneer Square after all these years. The ornate eagles and classical motifs on its facade catch what light filters through the clouds.

The Pioneer Building rises to the east, its Romanesque bulk anchoring the intersection. The building was designed to be a landmark, visible from both grids, claiming the junction as its own. But Smith Tower dwarfs it—dwarfs everything here. North is blocked—the debris wall that isolates Pioneer Square from downtown sealing off all passage in that direction.`,
  x: -1,
  y: 12,
  z: 0,

  imageOnDisk: 'yesler-way-x-1-y12-z0.png',
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Street furniture
  objects: [{ prototype: 'lamppost', name: 'Street Lamp' }],
  exits: {
    east: 'yesler-way/x0.ts',
    west: 'yesler-way/x-2.ts',
  },
};
