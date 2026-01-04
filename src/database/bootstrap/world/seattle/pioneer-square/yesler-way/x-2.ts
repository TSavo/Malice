// Yesler Way - in front of Smith Tower

export const room = {
  name: 'Yesler Way',
  description: `SMITH TOWER rises to the south, its terracotta pyramid crown visible from anywhere in Pioneer Square. The 38-story landmark—once the tallest building west of the Mississippi—still dominates the skyline. Its white glazed brick facade has weathered decades with dignity, the ornate terra cotta ornamentation intact despite everything. Glass doors at street level lead into what was once Seattle's first skyscraper bank.

North of here, collapsed structures and debris form an impassable barrier—the destruction that sealed Pioneer Square off from downtown. The grid collision between Pioneer Square's cardinal streets and downtown's angled ones made this intersection unstable even before the Event.

Yesler Way continues east toward 2nd Ave and west toward Occidental. The street's brick pavers are cracked but intact, laid over the buried original streets of 1889.`,
  x: -2,
  y: 12,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 15, // Occasional wind through tower
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  exits: {
    east: 'yesler-way/x-1.ts',
    west: 'yesler-way/x-3.ts',
    south: {
      to: 'buildings/smith-tower/z0.ts',
      room: '%1',
      description: 'Glass doors lead into Smith Tower',
    },
  },
};
