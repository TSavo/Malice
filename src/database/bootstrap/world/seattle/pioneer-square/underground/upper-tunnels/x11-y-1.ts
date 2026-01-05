// Underground passage - between Steam Tunnel S1 (10,-1) and Steam Tunnel S2 (12,-1)

export const room = {
  name: 'Steam Junction South',
  description: `The passage runs through a junction where multiple steam lines converge from the west and split toward their destinations to the east. The heat is intense here—the proximity to the active mains making the air thick with humidity and warmth.

Valves the size of steering wheels control flow through the junction, their positions set by engineers who service the system through official access points. The condensation dripping from the pipes has carved shallow channels in the concrete floor, water flowing toward drainage grates set at intervals.

A pressure gauge mounted to the wall shows readings for the main lines. The needle hovers in the acceptable range, but warning markers indicate the thresholds where automatic safety systems would engage.`,
  x: 11,
  y: -1,
  z: -2,
  population: 0,
  ambientNoise: 35,
  lighting: 22,
  waterLevel: 8,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%STEAM_S1',
      description: 'The passage leads west toward the steam tunnels',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%STEAM_S2',
      description: 'The passage leads east toward the steam junction',
    },
    north: {
      to: 'underground/upper-tunnels/x11-y0.ts',
      description: 'A passage continues north',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y-2.ts',
      description: 'A passage continues south',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'control valves',
      description: 'Large valve wheels control steam flow through the junction. Their handles are worn smooth by decades of use.',
      boltedDown: true,
    },
    {
      prototype: 'sign',
      name: 'pressure gauge',
      description: 'A large pressure gauge shows readings for the main steam lines. The needle sits comfortably in the green zone.',
      boltedDown: true,
    },
  ],
};
