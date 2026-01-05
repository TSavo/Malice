// Underground passage - factory district connector

export const room = {
  name: 'Factory Tunnel East',
  description: `The passage runs through the eastern section of the factory underground, connecting the main junction to the Foundry Basement. The construction here is heavier—designed to support the industrial buildings that once stood above.

Soot stains the ceiling, residue from the forges and furnaces that operated in this district. The smell of coal and metal lingers despite decades of abandonment, the industrial past embedded in the very walls.

A side passage leads south toward the loading areas, where goods once moved between the factories and the rail yards.`,
  x: 11,
  y: -11,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 10,
  waterLevel: 8,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%FACTORY_CONNECTOR',
      description: 'The passage leads west to Factory Connector',
    },
    east: {
      to: 'underground/upper-tunnels/x12-y-11.ts',
      description: 'The passage continues east',
    },
    south: {
      to: 'underground/upper-tunnels/x11-y-12.ts',
      description: 'A passage leads south toward the loading areas',
    },
  },
};
