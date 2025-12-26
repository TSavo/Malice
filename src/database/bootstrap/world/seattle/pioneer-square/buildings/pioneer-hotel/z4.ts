// Pioneer Hotel - Fourth Floor (z=4)

export const building = {
  name: 'Pioneer Hotel',
  x: -16,
  y: 7,
  width: 2,
  height: 1,
  floors: 6,

  rooms: {
    '%HALL_4': {
      name: 'Pioneer Hotel - Fourth Floor',
      description: `The top residential floor, one level below the roof. The ceiling is lower here, the building's structure compressing as it rises. The hallway feels tighter, more claustrophobic, though the dimensions are technically the same as below.

The elevator reaches this floor with particular reluctance, cables straining, car swaying slightly before settling. The mechanism wasn't designed for this many floors, or it's been repaired with parts that don't quite fit. The ride up feels longer. The ride down feels faster than it should.

Light leaks from beneath the door to the roof access, gray daylight seeping into the dim hallway. The roof is close. The sky is closer. For some guests, that matters.`,
      x: -16,
      y: 7,
      z: 4,
      population: 0,
      ambientNoise: 8,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ROOM_4',
        in: '%E',
      },
    },

    '%ROOM_4': {
      name: 'Pioneer Hotel - Room 4',
      description: `The top-floor room is half attic, its ceiling sloping where the roof intrudes. The bed fits only in one corner, positioned where someone can sit up without hitting their head. The window is a dormer, jutting from the roofline, offering the best view in the building—which is to say, a view of other rooftops and the gray sky above them.

Rain drums louder here, directly overhead rather than filtered through floors above. Wind finds gaps in the eaves, whistling through on stormy nights. The room is the coldest in winter, the hottest in summer, the least comfortable by every objective measure.

It's also the most private. No one above, no one beside, only the hallway below. Some people pay extra for that. Some people need walls between themselves and others. This room provides what walls remain.`,
      x: -15,
      y: 7,
      z: 4,
      population: 0,
      ambientNoise: 20,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_4',
      },
    },
  },

  postProcessors: [],
};
