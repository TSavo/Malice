// Underground passage - connecting King Street Access (12,-6) to Fourth Avenue

export const room = {
  name: 'Rail Yard Connector',
  description: `The passage reaches the edge of the King Street infrastructure, where the underground network meets the industrial tunnels beneath the rail yards. The transition is marked by a change in construction—the brick and concrete of the underground giving way to the steel and timber of the rail infrastructure.

The air here is thick with the smell of diesel and lubricant, the rail yards' influence permeating the underground. The sound of trains is constant—the rumble of engines, the screech of brakes, the clatter of couplings.

A heavy steel door leads toward the rail yard tunnels, its surface marked with warning signs and access restrictions. The door is not locked—the restriction is administrative rather than physical.`,
  x: 13,
  y: -6,
  z: -2,
  population: 0,
  ambientNoise: 40,
  lighting: 18,
  waterLevel: 8,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x13-y-5.ts',
      description: 'The passage leads north',
    },
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%KING_ACCESS',
      description: 'The passage leads west toward King Street Access',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'rail yard door',
      description: 'A heavy steel door marked with warning signs: "RESTRICTED AREA - AUTHORIZED PERSONNEL ONLY". The door is unlocked despite the warnings.',
      boltedDown: true,
    },
  ],
};
