// Underground passage - factory district

export const room = {
  name: 'Factory Central',
  description: `The passage runs through the center of the factory underground, at the intersection of multiple industrial routes. The space is larger here, sized to accommodate the heavy traffic that once flowed through this junction.

The walls are lined with iron hooks and brackets—remnants of the equipment storage system that kept the tunnels organized. Some hooks still hold ancient tools; most are empty, their contents long since scavenged.

A chimney shaft rises through the ceiling, connected to a factory that no longer exists above. The shaft is blocked, but drafts of air still flow through cracks in the obstruction.`,
  x: 11,
  y: -12,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 12,
  waterLevel: 8,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x11-y-11.ts',
      description: 'The passage leads north',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y-13.ts',
      description: 'The passage continues south',
    },
    west: {
      to: 'underground/upper-tunnels/x10-y-12.ts',
      description: 'A passage leads west',
    },
    east: {
      to: 'underground/upper-tunnels/x12-y-12.ts',
      description: 'A passage leads east',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'storage hooks',
      description: 'Iron hooks and brackets line the walls. A few still hold ancient tools; most are empty.',
      boltedDown: true,
    },
  ],
};
