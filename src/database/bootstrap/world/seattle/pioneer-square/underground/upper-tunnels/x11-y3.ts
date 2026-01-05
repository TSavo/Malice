// Underground passage - connecting Steam Tunnel corridors at y=3

export const room = {
  name: 'Pump Station Access',
  description: `The passage connects the eastern utility corridors, running between the steam network and the pump station. The construction varies—utility corridor giving way to older basement space, the route assembled from whatever underground spaces were available.

A set of pipes runs along one wall, carrying water rather than steam—part of the drainage system that keeps the tunnels from flooding. The pipes show their age in corrosion and patches, the system maintained but showing decades of wear.

An access ladder leads up to a sealed hatch, the route to the surface blocked by welded steel. Whatever building once stood above has been cut off from the underground.`,
  x: 11,
  y: 3,
  z: -2,
  population: 0,
  ambientNoise: 22,
  lighting: 18,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x10-y3.ts',
      description: 'The passage leads west toward the steam network',
    },
    east: {
      to: 'underground/upper-tunnels/x11-y2.ts',
      description: 'The passage leads east toward the pump station',
    },
    north: {
      to: 'underground/upper-tunnels/x11-y4.ts',
      description: 'A passage continues north',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y2.ts',
      description: 'A passage continues south',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'sealed hatch',
      description: 'A steel hatch at the top of a ladder has been welded shut. The building above no longer connects to the underground.',
      boltedDown: true,
    },
  ],
};
