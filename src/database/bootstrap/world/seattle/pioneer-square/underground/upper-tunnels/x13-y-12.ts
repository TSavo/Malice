// Underground passage - factory district, connecting to Foundry Basement (13,-11) and Tool Room (13,-13)

export const room = {
  name: 'Foundry Access',
  description: `The passage runs along the eastern edge of the factory underground, connecting the Foundry Basement to the Tool Room. The walls still carry the warmth of the forges that once operated above, thermal mass that will take decades more to fully cool.

The floor is covered with a layer of scale—iron oxide that flaked from hot metal and was never cleaned up. The scale crunches underfoot, a metallic sound that echoes in the enclosed space.

An iron grate covers a drain in the floor, its bars thick with rust. Water and oil were once channeled through here, the industrial runoff of the foundry's operations.`,
  x: 13,
  y: -12,
  z: -2,
  population: 0,
  ambientNoise: 10,
  lighting: 10,
  waterLevel: 5,
  outdoor: false,
  exits: {
    north: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%FOUNDRY_BASEMENT',
      description: 'The passage leads north to Foundry Basement',
    },
    south: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%TOOL_ROOM',
      description: 'The passage leads south to Tool Room',
    },
    west: {
      to: 'underground/upper-tunnels/x12-y-12.ts',
      description: 'A passage leads west',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'iron drain grate',
      description: 'A heavy iron grate covers a drain, its bars thick with rust. Industrial runoff once flowed through here.',
      boltedDown: true,
    },
  ],
};
