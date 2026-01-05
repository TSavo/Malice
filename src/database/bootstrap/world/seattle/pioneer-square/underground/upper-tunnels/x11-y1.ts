// Underground passage - between Steam Tunnel West (10,1) and Steam Tunnel East (12,1)

export const room = {
  name: 'Steam Distribution Junction',
  description: `The tunnel widens at a distribution junction where multiple steam lines branch toward different building clusters. The pipes here are larger, the valves more numerous, the gauges clustered on a control panel that still functions despite decades of neglect.

A pressure release valve hisses intermittently, venting small amounts of steam into the passage and filling the air with warmth and moisture. The walls are covered in a thin film of condensation that drips constantly, keeping the floor perpetually wet despite drainage grates along the edges.

The junction shows signs of regular maintenance—recently replaced pipe insulation, fresh paint on valve handles color-coded by function, a clipboard hanging from a hook with handwritten notes about pressure readings. Someone still tends this infrastructure, even if their presence is invisible.`,
  x: 11,
  y: 1,
  z: -2,
  population: 0,
  ambientNoise: 35,
  lighting: 22,
  waterLevel: 8,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%STEAM_N1',
      description: 'The tunnel leads west through the steam network',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%STEAM_N2',
      description: 'The tunnel leads east toward the main steam junction',
    },
    north: {
      to: 'underground/upper-tunnels/x11-y2.ts',
      description: 'A narrower passage leads north',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'control panel',
      description: 'A steel control panel bristles with gauges and valve handles. Pressure readings hover in acceptable ranges. Someone maintains this equipment.',
      boltedDown: true,
    },
    {
      prototype: 'furniture',
      name: 'pressure release valve',
      description: 'A brass valve vents small amounts of steam with an irregular hissing sound. The warmth it releases makes this junction uncomfortably humid.',
      boltedDown: true,
    },
  ],
};
