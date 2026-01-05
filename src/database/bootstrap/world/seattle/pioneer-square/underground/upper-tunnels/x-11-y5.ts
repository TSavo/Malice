// Junction Corridor - Old Commercial Basement

export const room = {
  name: 'Old Commercial Basement',
  description: `The passage cuts through the basement of a building that burned in 1889 and was never rebuilt above this level. Iron window grates still cover the wells that once admitted light from the sidewalk—the glass long shattered, the wells filled with dirt and debris from the street regrading.

The brick walls bear faded painted signs: "J. MORTON DRY GOODS" on one side, "MINERS SUPPLIES" on the other. The two businesses shared this basement, a common arrangement when Seattle was young and space was at a premium.`,
  x: -11,
  y: 5,
  z: -2,
  population: 0,
  ambientNoise: 8,
  lighting: 10,
  waterLevel: 0,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x-12-y5.ts',
      description: 'The passage continues west',
    },
    east: {
      to: 'underground/upper-tunnels/x-10-y5.ts',
      description: 'The passage continues east',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'faded business signs',
      description: 'Painted advertisements for J. Morton Dry Goods and a miners supply company, the paint preserved by darkness but slowly flaking away.',
      boltedDown: true,
    },
    {
      prototype: 'furniture',
      name: 'iron window grates',
      description: 'Decorative iron grates that once covered light wells to the sidewalk above, now blocked by a century of accumulated fill.',
      boltedDown: true,
    },
  ],
};
