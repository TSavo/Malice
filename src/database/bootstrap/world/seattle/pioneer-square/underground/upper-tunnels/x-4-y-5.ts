// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage runs through what might have been a coal storage cellar—the walls still show traces of black dust despite more than a century since coal was common fuel. The space is larger here, the original cellar's volume absorbed into the underground route.

An iron coal chute is visible in one wall, its upper end long since sealed. The chute is rusted solid, a relic of an era when buildings above depended on deliveries through these underground passages.

The floor shows the wear of heavy traffic—grooves worn into the stone by countless passages, the route so well-traveled that it has literally shaped the surface beneath it.`,
  x: -4,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 15,
  waterLevel: 5,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-3-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-5-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'sealed coal chute',
      description: 'An iron chute is rusted into the wall, its upper end sealed long ago. Coal dust still stains the surrounding brick.',
      boltedDown: true,
    },
  ],
};
