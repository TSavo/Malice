// Underground passage - connecting Blowoff Chamber (11,0) corridors

export const room = {
  name: 'Blowoff Approach',
  description: `The passage runs alongside the blowoff chamber's expansion, the massive safety valve visible through gaps in the wall where maintenance access panels have been removed. The chamber's purpose is evident in the blackened walls—residue from steam venting events that occurred when the system needed to shed pressure.

The heat radiates from the west, warmth escaping through the gaps in the structure. The sound of steam hissing through valves creates a constant background noise, punctuated occasionally by louder venting sounds that echo through the tunnel network.

An emergency shutdown panel is mounted to the wall, protected by a glass cover that reads "BREAK IN EMERGENCY". The glass is dusty but intact—the emergency has never come.`,
  x: 11,
  y: 0,
  z: -2,
  population: 0,
  ambientNoise: 38,
  lighting: 20,
  waterLevel: 5,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x11-y1.ts',
      description: 'The passage leads north toward the distribution junction',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y-1.ts',
      description: 'The passage leads south toward the steam junction',
    },
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%BLOWOFF_CHAMBER',
      description: 'A gap in the wall provides access to the blowoff chamber',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%STEAM_MAIN',
      description: 'The passage leads east toward the steam main junction',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'emergency shutdown',
      description: 'A red panel behind dusty glass reads "EMERGENCY SHUTDOWN - BREAK GLASS". The glass remains unbroken.',
      boltedDown: true,
    },
  ],
};
