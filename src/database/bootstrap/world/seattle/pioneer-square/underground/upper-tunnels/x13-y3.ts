// Underground passage - between Northern Utility Corridor (12,3) and Fourth Avenue Passage (14,3)

export const room = {
  name: 'Northern Connector',
  description: `The passage runs east-west through the northern section of the eastside underground, connecting the utility corridor to the Fourth Avenue infrastructure. The construction varies along its length—older sections built with hand-laid brick, newer sections with poured concrete, the work of different eras unified by purpose.

A junction box mounted to the wall hums with electrical activity, the indicator lights blinking in patterns that indicate data flow. The box is labeled with a telecommunications company logo, the infrastructure serving the digital age installed in tunnels built for the gaslight era.

The floor is damp, water seeping from hairline cracks in the concrete above. Drainage is poor here, the water pooling in depressions before eventually finding its way to the deeper tunnels.`,
  x: 13,
  y: 3,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 15,
  waterLevel: 8,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%UTILITY_NORTH',
      description: 'The passage leads west toward the utility corridor',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%4TH_N3',
      description: 'The passage leads east toward Fourth Avenue',
    },
    south: {
      to: 'underground/upper-tunnels/x13-y2.ts',
      description: 'A passage continues south',
    },
    north: {
      to: 'underground/upper-tunnels/x13-y4.ts',
      description: 'A passage continues north',
    },
  },
  objects: [
    {
      prototype: 'cabinet',
      name: 'telecommunications junction',
      description: 'A metal box with a telecom logo, indicator lights blinking green. Fiber and copper cables enter and exit through sealed conduits.',
      boltedDown: true,
    },
  ],
};
