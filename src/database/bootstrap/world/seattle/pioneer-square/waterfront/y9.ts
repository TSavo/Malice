// Waterfront - between S. Washington and Yesler Way

export const room = {
  name: 'Waterfront',
  description: `The waterfront curves toward the gap in the seawall that provides passage to downtown—the only crossing point that remained open after the burning blocked all other routes. The gap is visible ahead, a crack in the concrete where the wall collapsed and was never repaired.

To the west, Elliott Bay is an impassable barrier. The seawall drops fifteen feet to cold grey water, deep and treacherous. Without a boat, the bay cannot be crossed. The currents alone would kill you before the cold finished the job.

To the east, the Fabrication Factory's massive western wall rises without windows or doors at this section—just industrial concrete stained by decades of Seattle rain. The hum of automated machinery filters through the wall. The factory's entrances are north of here; this side of the building is all production floor and heavy equipment.

North leads toward the gap—the only way to downtown. South continues along the waterfront. The bay stretches west, cold and grey and absolute, the same boundary it has always been.`,
  x: -21,
  y: 9,
  z: 0,
  population: 0,
  ambientNoise: 25,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Street furniture
  objects: [{ prototype: 'lamppost', name: 'Street Lamp' }],
};
