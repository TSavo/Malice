// Pioneer Hotel - Roof (z=5)

export const building = {
  name: 'Pioneer Hotel',
  x: -16,
  y: 7,
  width: 2,
  height: 1,
  floors: 6,

  rooms: {
    '%ROOF': {
      name: 'Pioneer Hotel - Roof',
      description: `The roof is tar and gravel, patched in layers that document decades of leaks and repairs. The surface is uneven, puddles collecting in depressions that never quite drain, their water stagnant and iridescent with whatever leaches from the roofing material.

The elevator housing rises from the center, a brick shaft that terminates in a small access structure. The cage elevator reaches here, its final stop, gate opening onto open sky and the smell of rain-soaked city.

The view extends across Pioneer Square's rooftops—water towers, antenna arrays, solar panels, the accumulated infrastructure of survival. Smith Tower rises to the northeast, its terra cotta facade visible above the lower buildings. The Fabrication Factory's exhaust stacks vent to the west, their plumes rising and dispersing.

No railings protect the roof's edges. No one has bothered. Anyone who comes up here knows the risks and accepts them or doesn't care anymore.`,
      x: -16,
      y: 7,
      z: 5,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        in: '%E',
      },
    },
  },

  postProcessors: [],
};
