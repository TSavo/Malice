// Underground passage - factory district connector

export const room = {
  name: 'Foundry Approach',
  description: `The passage approaches the Foundry Basement, the heat of the old forge having seeped into the surrounding earth over decades of operation. The walls are warm to the touch, thermal mass that still radiates the accumulated heat of countless metalworking fires.

The floor is covered with a layer of fine black sand—casting sand that has escaped from the foundry over the years, impossible to fully clean from the rough surface. The sand muffles footsteps and tracks movements.

Heavy iron doors once sealed this passage, their hinges still visible in the wall though the doors themselves have long since been removed.`,
  x: 12,
  y: -11,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 12,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x11-y-11.ts',
      description: 'The passage continues west',
    },
    east: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%FOUNDRY_BASEMENT',
      description: 'The passage leads east to Foundry Basement',
    },
    south: {
      to: 'underground/upper-tunnels/x12-y-12.ts',
      description: 'A passage leads south',
    },
  },
};
