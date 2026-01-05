// Underground passage - factory district

export const room = {
  name: 'Industrial South',
  description: `The passage runs through the southern reaches of the factory underground, where industrial operations once extended toward the waterfront. The construction is rougher here—less permanent, designed for function rather than longevity.

The walls show the marks of hard use—gouges where equipment scraped, stains where chemicals spilled, the accumulated damage of industrial operations conducted with little regard for the infrastructure.

A rusted conveyor frame spans the passage, the belt long since rotted away. Materials once moved through here on their way to or from the waterfront.`,
  x: 11,
  y: -14,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 10,
  waterLevel: 15,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x11-y-13.ts',
      description: 'The passage leads north',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y-15.ts',
      description: 'The passage continues south',
    },
    west: {
      to: 'underground/upper-tunnels/x10-y-14.ts',
      description: 'A passage leads west',
    },
    east: {
      to: 'underground/upper-tunnels/x12-y-14.ts',
      description: 'A passage leads east',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'conveyor frame',
      description: 'A rusted iron frame that once held a conveyor belt. The belt is gone; the frame remains, spanning the passage.',
      boltedDown: true,
    },
  ],
};
