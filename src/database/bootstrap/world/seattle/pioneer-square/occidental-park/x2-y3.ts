// Occidental Park - northeast corner where park meets S. Washington

export const room = {
  name: 'Occidental Park',
  description: `The northeastern corner of Occidental Park meets S. Washington Street at a low concrete barrier, the brick plaza ending where the sidewalk begins. This is one of the park's exits—or entrances, depending on your direction of travel. The barrier is low enough to step over, its surface worn smooth where countless feet swung across it.

A street lamp rises near the corner, its fixture dark, its pole leaning slightly from decades of wind pressure. The lamp is an old design, ornamental ironwork meant to evoke gas lamps, the kind of historical reference that Pioneer Square's preservation ordinances required. The ordinances meant nothing when the power failed. The historical reference is more complete now—genuinely dark, like gas lamps before the gas.

S. Washington Street opens to the east and west, connecting the park to the rest of Pioneer Square. The pergola with its totem pole is visible to the west. The intersection with 2nd Avenue is visible to the east. Both directions lead to emptiness.`,
  x: 2,
  y: 3,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 15, // Open plaza, wind across brick
  lighting: 100, // Full daylight (open space)
  waterLevel: 0, // Dry
  outdoor: true, // Open plaza
};
