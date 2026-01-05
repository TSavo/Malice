// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage approaches the western terminus of the southern corridor, the route nearing the Supply Junction South that connects to the established underground network. The infrastructure here is more substantial—better lighting, cleaner air, signs of regular maintenance.

The walls show marks of long use—handprints where countless people have steadied themselves, worn patches where shoulders have brushed the brick. This route has been traveled for generations.

A junction with the main supply routes lies just ahead, the sounds of activity growing stronger from the west.`,
  x: -12,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 22,
  waterLevel: 3,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-11-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-13-y-5.ts',
      description: 'The passage continues west toward Supply Junction South',
    },
  },
};
