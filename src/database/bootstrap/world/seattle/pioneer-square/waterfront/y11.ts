// Waterfront - approaching Yesler Way from south

export const room = {
  name: 'Alaskan Way',
  description: `The waterfront approaches Yesler Way here, where the gap in the seawall provides the only passage to downtown. To the west, Elliott Bay laps against the concrete barrier—cold grey water stretching to the horizon, impassable without a boat.

The seawall is fifteen feet high along this stretch, a sheer drop to water that's deeper than it looks. The currents are deceptive, the water cold enough to kill. The bay has always been Pioneer Square's western boundary, and it always will be.

To the east, the Fabrication Factory's loading bay dominates the block—a massive roll-up door built into a converted transport warehouse. The building stretches four stories up, its industrial bulk a monument to the city's automated infrastructure. Through gaps in the door, conveyor belts and gantry cranes are visible, moving materials with mechanical precision. The factory runs day and night, keeping Seattle's systems supplied with replacement parts.

Yesler Way intersection lies just ahead to the north—the crossing point to downtown. South leads back along the waterfront. The bay waits to the west, patient as water always is, offering passage only to those with boats that no longer exist.`,
  x: -21,
  y: 11,
  z: 0,
  population: 0,
  ambientNoise: 20,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Street furniture
  objects: [{ prototype: 'lamppost', name: 'Street Lamp' }],
  exits: {
    east: {
      to: 'buildings/fabrication-factory/z0.ts#%LOADING_BAY',
      description: 'A massive roll-up door leads into the Fabrication Factory loading bay',
    },
  },
};
