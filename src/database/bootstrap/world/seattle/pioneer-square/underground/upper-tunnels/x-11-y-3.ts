// Underground passage - between Tour storefronts and Sealed Passage

export const room = {
  name: 'Prohibition Cache',
  description: `The passage opens into a small chamber that was clearly used for storage during Prohibition—broken wooden crates still bear stenciled labels for Canadian whiskey and French champagne. The good stuff was moved long ago, but the empties remain, along with the infrastructure of illegal commerce: a crude bar, a cashbox rusted shut, and a ledger whose pages have fused into an unreadable mass.

Someone lived here too, or at least slept here. A cot frame rusts in one corner, its canvas long since rotted away. A kerosene lamp stands on a crate, its chimney cracked. The bootleggers who used this space are all dead now, but their ghosts left their things behind.`,
  x: -11,
  y: -3,
  z: -2,
  population: 0,
  ambientNoise: 5,
  lighting: 8,
  waterLevel: 0,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x-12-y-3.ts',
      description: 'A raised walkway leads west',
    },
    east: {
      to: 'underground/upper-tunnels/x-10-y-3.ts',
      description: 'The passage continues east',
    },
  },
  objects: [
    {
      prototype: 'crate',
      name: 'bootlegger crates',
      description: 'Wooden crates stenciled with Canadian whiskey labels, all empty, all evidence of crimes that expired with the criminals.',
      boltedDown: true,
    },
    {
      prototype: 'furniture',
      name: 'rusted cot frame',
      description: 'An iron cot frame, its canvas rotted away, where a bootlegger once slept between shipments.',
      boltedDown: true,
    },
  ],
};
