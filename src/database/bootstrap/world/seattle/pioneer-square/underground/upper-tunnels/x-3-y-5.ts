// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage approaches the Occidental underground, the character of the construction changing as it enters the more established sections of the network. The brick here is better maintained, the lighting more consistent, the floor clearer of debris.

A side passage branches north, leading toward the main underground corridors. The junction is marked with painted arrows—faded but still legible—indicating routes to different sections of the network.

The smell of the underground changes here too, the industrial odors of the eastern sections giving way to the mustier scent of the older, more heavily used passages to the west.`,
  x: -3,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 18,
  waterLevel: 5,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-2-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-4-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'directional arrows',
      description: 'Faded painted arrows mark routes through the underground. One points north toward the main corridors.',
      boltedDown: true,
    },
  ],
};
