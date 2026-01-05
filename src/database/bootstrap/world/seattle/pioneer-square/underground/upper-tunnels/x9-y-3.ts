// Underground passage - connecting to eastern infrastructure

export const room = {
  name: 'Utility Crossing',
  description: `The passage crosses through a junction of utility infrastructure—water, power, and communications all converging in a space barely large enough to accommodate them. The utilities were installed at different times, each addition squeezing into whatever space remained.

A maze of pipes and cables forces awkward maneuvering to pass through. The infrastructure hums and drips, the sounds of active systems filling the cramped space.

Warning labels cover every surface—electrical hazard, water main, do not disturb—the accumulated cautions of different utility companies marking their respective territories.`,
  x: 9,
  y: -3,
  z: -2,
  population: 0,
  ambientNoise: 25,
  lighting: 15,
  waterLevel: 8,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x8-y-3.ts',
      description: 'The passage leads west',
    },
    south: {
      to: 'underground/upper-tunnels/x9-y-4.ts',
      description: 'The passage continues south',
    },
  },
};
