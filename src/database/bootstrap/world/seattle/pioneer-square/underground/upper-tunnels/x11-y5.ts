// Underground passage - between Eastern Yesler Access (10,5) and Junction Box Chamber (12,5)

export const room = {
  name: 'Yesler Connector',
  description: `The passage connects the Eastern Yesler Access to the Junction Box Chamber, running through a section where telecommunications infrastructure dominates the space. Cables run along both walls in organized bundles, each bundle labeled with destination codes that only the installers would understand.

The construction shows the marks of multiple eras—original Victorian brick at floor level, mid-century concrete above, and modern cable trays bolted to both. Each generation added its own layer without removing what came before.

A faint hum fills the air, the sound of data flowing through fiber optic cables at the speed of light. The cables carry the city's communications—phone calls, emails, financial transactions—flowing through passages most of the city doesn't know exist.`,
  x: 11,
  y: 5,
  z: -2,
  population: 0,
  ambientNoise: 22,
  lighting: 20,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%YESLER_EAST',
      description: 'The passage leads west toward the Yesler access',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%JUNCTION_BOX',
      description: 'The passage leads east toward the junction box chamber',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y4.ts',
      description: 'A passage continues south',
    },
    north: {
      to: 'underground/upper-tunnels/x11-y6.ts',
      description: 'A passage continues north',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'cable labels',
      description: 'Plastic tags identify cable bundles with cryptic codes: "SEA-TAC-CORE-7", "METRO-RING-2", "GOV-SECURE-1". Someone knows what these mean.',
      boltedDown: true,
    },
  ],
};
