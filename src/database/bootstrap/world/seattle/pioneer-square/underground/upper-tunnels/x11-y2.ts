// Underground passage - between Steam Tunnel N3 (10,2) and Old Boiler Room (12,2)

export const room = {
  name: 'Abandoned Pump Station',
  description: `The passage opens into a small pump station built to boost steam pressure to buildings at the edge of the distribution network. The pumps themselves are gone—removed when the equipment was upgraded decades ago—but the mounting brackets remain bolted to the floor, rust-red circles marking where the machinery once stood.

The chamber is drier than the active steam tunnels, the decommissioned equipment no longer contributing to the oppressive humidity. A workbench against one wall holds abandoned tools: wrenches sized for pipe fittings, a grease gun, replacement gaskets still in their original packaging.

The ceiling shows water damage from a leak that was never repaired—why maintain a decommissioned station? Plaster has fallen in patches, revealing the structural brick beneath, and the lighting fixture at the center flickers intermittently, its ballast failing.`,
  x: 11,
  y: 2,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 15,
  waterLevel: 3,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%STEAM_N3',
      description: 'The passage leads west toward the steam tunnels',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%BOILER_ROOM',
      description: 'The passage leads east toward the old boiler room',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y1.ts',
      description: 'A narrower passage leads south to the distribution junction',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'pump mountings',
      description: 'Rust-red circles on the floor mark where steam pumps once stood. The mounting bolts are still in place, waiting for equipment that will never return.',
      boltedDown: true,
    },
    {
      prototype: 'crate',
      name: 'workbench',
      description: 'A sturdy workbench holds abandoned maintenance tools: oversized wrenches, a grease gun, and sealed packages of replacement gaskets. Everything waits for repairs that never came.',
      boltedDown: true,
    },
  ],
};
