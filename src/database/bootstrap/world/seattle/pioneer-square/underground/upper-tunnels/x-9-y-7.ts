// Underground passage - connecting x-9-y-8 to Storage Bay (-10,-6)

export const room = {
  name: 'Storage Bay Access',
  description: `The passage reaches the approach to Storage Bay, the junction where multiple routes converge on the organized storage space of the western underground. The construction here is more substantial—walls reinforced, floors leveled, the infrastructure of a space meant for regular use.

A heavy wooden door frame marks the boundary of the storage area, though the door itself is missing. The hinges remain, massive iron hardware that could have supported a door thick enough to secure valuable goods.

The sound of activity drifts from the west—voices, movement, the signs of habitation in the Storage Bay beyond.`,
  x: -9,
  y: -7,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 18,
  waterLevel: 5,
  outdoor: false,
  exits: {
    south: {
      to: 'underground/upper-tunnels/x-9-y-8.ts',
      description: 'The passage leads south',
    },
    west: {
      to: 'buildings/underground-west/z-2.ts',
      room: '%STORAGE_BAY',
      description: 'The passage leads west to Storage Bay',
    },
  },
};
