// Underground passage - connecting South Junction E (12,-4) to Fourth Avenue S4 (14,-4)

export const room = {
  name: 'King Street Approach',
  description: `The passage descends toward King Street, the gradient increasing as it approaches the rail yard level. The construction is older here—hand-carved and brick-lined, the work of laborers who extended the network toward the trains with picks and muscle.

The air carries traces of diesel and grease, the influence of the rail yard making itself felt even this far underground. The sound of trains—distant rumbles and the clatter of wheels on tracks—occasionally penetrates the earth, the vibrations felt as much as heard.

Water trickles along the floor, the drainage from higher passages converging toward the lowest points of the network. The wet floor reflects the dim lighting, making the passage seem longer than it is.`,
  x: 13,
  y: -4,
  z: -2,
  population: 0,
  ambientNoise: 22,
  lighting: 12,
  waterLevel: 12,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x13-y-3.ts',
      description: 'The passage leads north',
    },
    south: {
      to: 'underground/upper-tunnels/x13-y-5.ts',
      description: 'The passage continues south toward King Street',
    },
    west: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%SOUTH_JUNCTION_E',
      description: 'A passage leads west toward the southern junction',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%4TH_S4',
      description: 'The passage leads east toward Fourth Avenue',
    },
  },
};
