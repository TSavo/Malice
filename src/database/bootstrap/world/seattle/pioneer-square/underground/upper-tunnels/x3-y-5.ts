// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage widens into what might have been a staging area—the ceiling is higher, the floor more level, the space deliberately enlarged for purposes no longer apparent. The walls show marks where equipment was once mounted, bolts and brackets rusting in place.

A pile of refuse occupies one corner—old mattresses, broken furniture, the remnants of someone's temporary shelter. The occupant is long gone, but the evidence of their stay remains undisturbed.

The passage continues in both directions, the staging area serving as a waypoint in the long southern corridor that connects the eastern and western underground networks.`,
  x: 3,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 12,
  waterLevel: 8,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x4-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x2-y-5.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'abandoned shelter',
      description: 'Old mattresses and broken furniture—someone lived here once. The shelter has been abandoned for years.',
      boltedDown: true,
    },
  ],
};
