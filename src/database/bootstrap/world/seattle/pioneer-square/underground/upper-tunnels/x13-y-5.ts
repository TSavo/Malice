// Underground passage - connecting King Street approach to Fourth Avenue corridors

export const room = {
  name: 'King Street East',
  description: `The passage approaches King Street from the east, running through the transition zone between the underground network and the rail yard infrastructure. The construction is industrial—reinforced concrete poured to withstand the vibrations from the trains that pass above.

The sound of rail traffic is constant here, the rumble and clatter of trains penetrating the earth. The walls carry the vibrations, the entire passage humming with the rhythm of the city's transit system.

A maintenance access shaft rises toward the rail yards, its ladder rungs showing the wear of regular use. Workers still descend to service the infrastructure, their visits marked by boot prints in the dust.`,
  x: 13,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 35,
  lighting: 15,
  waterLevel: 10,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x13-y-4.ts',
      description: 'The passage leads north',
    },
    south: {
      to: 'underground/upper-tunnels/x13-y-6.ts',
      description: 'The passage continues south toward King Street Access',
    },
    west: {
      to: 'underground/upper-tunnels/x11-y-5.ts',
      description: 'A passage leads west',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%4TH_S4',
      description: 'The passage leads east toward Fourth Avenue',
    },
  },
  objects: [
    {
      prototype: 'describable',
      name: 'maintenance shaft',
      description: 'A vertical shaft rises toward the rail yards. The ladder rungs show regular use, worn smooth by the boots of maintenance workers.',
      boltedDown: true,
    },
  ],
};
