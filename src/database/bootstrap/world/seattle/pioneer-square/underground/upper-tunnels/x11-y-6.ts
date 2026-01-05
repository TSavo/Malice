// Underground passage - connecting Utility Junction (10,-6) to Light Rail Service Tunnel (12,-6)

export const room = {
  name: 'Transit Link',
  description: `The passage connects the Utility Junction to the Light Rail Service Tunnel, the construction transitioning from older underground infrastructure to the modern transit system. The walls show the contrast—Victorian-era brick on one side, poured concrete from the 2000s on the other.

The sound of trains is constant here—the rumble and screech of light rail service penetrating the walls from the transit tunnel nearby. The vibrations are felt through the floor, the passage shaking slightly with each passing train.

A sealed maintenance hatch leads toward the transit tunnel, its surface marked with warnings about electrified rails and authorized access only.`,
  x: 11,
  y: -6,
  z: -2,
  population: 0,
  ambientNoise: 35,
  lighting: 20,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%UTILITY_JCT',
      description: 'The passage leads west to Utility Junction',
    },
    east: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%LIGHT_RAIL',
      description: 'The passage leads east to Light Rail Service Tunnel',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'transit maintenance hatch',
      description: 'A sealed hatch with warnings: "AUTHORIZED PERSONNEL ONLY - ELECTRIFIED RAILS". The transit system lies beyond.',
      boltedDown: true,
    },
  ],
};
