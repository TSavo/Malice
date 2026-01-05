// Underground passage - waterfront approaches

export const room = {
  name: 'Eastern Tidal Limit',
  description: `The passage reaches the eastern limit of the factory underground's extension toward the waterfront. Beyond this point, the construction becomes too rough for regular passage—natural caves and tidal channels that flood completely at high tide.

The walls here are bare rock in places, the excavation having broken through to natural formations. The stone is smooth where water has polished it over millennia, rough where pickaxes carved through resistant sections.

A warning sign, faded almost beyond legibility, cautions: "DANGER - FLOODING - DO NOT PROCEED AT HIGH TIDE". The advice remains valid.`,
  x: 13,
  y: -15,
  z: -2,
  population: 0,
  ambientNoise: 28,
  lighting: 5,
  waterLevel: 28,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x13-y-14.ts',
      description: 'The passage leads north',
    },
    west: {
      to: 'underground/upper-tunnels/x12-y-15.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'flood warning',
      description: 'A faded warning sign: "DANGER - FLOODING - DO NOT PROCEED AT HIGH TIDE". The letters are barely visible but the message is clear.',
      boltedDown: true,
    },
  ],
};
