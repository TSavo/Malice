// Underground passage - connecting x8-y-2 to Parking Garage Basement (8,-4)

export const room = {
  name: 'Garage Approach',
  description: `The passage approaches the Parking Garage Basement, the construction transitioning from older underground infrastructure to the more recent work of the garage foundation. The walls show poured concrete over the original brick—the garage builders having incorporated the existing underground into their construction.

The smell of motor oil and exhaust fumes drifts from the garage below, the industrial odors mixing with the mustier scent of the underground. The parking structure still operates above, its traffic felt as vibrations through the concrete.

A ventilation duct connects to the garage's air system, carrying fumes that make extended stays in this section unpleasant.`,
  x: 8,
  y: -3,
  z: -2,
  population: 0,
  ambientNoise: 20,
  lighting: 15,
  waterLevel: 5,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x8-y-2.ts',
      description: 'The passage leads north',
    },
    south: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%PARKING_BASEMENT',
      description: 'The passage leads south to Parking Garage Basement',
    },
    east: {
      to: 'underground/upper-tunnels/x9-y-3.ts',
      description: 'A passage leads east',
    },
  },
};
