// Underground passage - connecting Elevator Pit (8,-2) to Foundation Crawlspace (10,-2)

export const room = {
  name: 'Foundation Link',
  description: `The passage runs through the foundation level, connecting the elevator pit area to the Foundation Crawlspace. The construction is heavy—reinforced concrete designed to bear the weight of the buildings above.

The floor is covered with construction debris that was never cleaned up—broken concrete, rusted rebar, the detritus of the building process left behind when the work was completed. The debris has been pushed aside to create a passable route.

A support column blocks part of the passage, requiring a squeeze to pass. The column is massive—solid concrete reinforced with steel, the kind of engineering that suggests the building above is substantial.`,
  x: 9,
  y: -2,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 10,
  waterLevel: 10,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x8-y-2.ts',
      description: 'The passage leads west',
    },
    east: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%FOUNDATION_CRAWLSPACE',
      description: 'The passage leads east to Foundation Crawlspace',
    },
  },
};
