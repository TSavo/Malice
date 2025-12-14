// Pioneer Hotel - Second Floor (z=2)

export const building = {
  name: 'Pioneer Hotel',
  x: -16,
  y: 7,
  width: 2,
  height: 1,
  floors: 6,

  rooms: {
    '%HALL_2': {
      name: 'Pioneer Hotel - Second Floor',
      description: `The second floor hallway mirrors the first—same dim lighting, same worn carpet, same green walls marked by passing bodies. The elevator gate clangs open here with particular violence, something in the mechanism catching before releasing.

A water stain spreads across the ceiling, brown at the edges, evidence of leaks from above that someone addressed just enough to stop the dripping. The plaster is soft to the touch, waiting for the next heavy rain to resume its slow collapse.

The single door to the room stands slightly ajar, its frame warped by humidity or age or both. The lock still works. Everything in this building still works, barely, maintained by necessity rather than care.`,
      x: -16,
      y: 7,
      z: 2,
      population: 0,
      ambientNoise: 8,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ROOM_2',
        'in': '%E',
      },
    },

    '%ROOM_2': {
      name: 'Pioneer Hotel - Room 2',
      description: `Identical to the room below and the rooms above—the hotel buys in bulk what little it buys, and repairs with whatever materials cost least. The sameness is institutional, the kind of uniformity that stops feeling oppressive only when you're too tired to notice.

This room's window faces the building across the alley, close enough that you could reach out and touch the opposite wall if the window opened. It doesn't. The view is brick and drainpipe and the occasional shadow moving behind curtains that aren't your concern.

Someone scratched initials into the metal bed frame: JK + TM, surrounded by a heart. The heart is crossed out. The initials remain. Love and its aftermath, documented in steel.`,
      x: -15,
      y: 7,
      z: 2,
      population: 0,
      ambientNoise: 12,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_2',
      },
    },
  },

  postProcessors: [],
};
