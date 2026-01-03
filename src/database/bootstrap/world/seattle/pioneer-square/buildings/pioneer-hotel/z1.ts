// Pioneer Hotel - First Floor (z=1)

export const building = {
  name: 'Pioneer Hotel',
  x: -16,
  y: 7,
  width: 2,
  height: 1,
  floors: 6,

  rooms: {
    '%HALL_1': {
      name: 'Pioneer Hotel - First Floor',
      description: `A narrow hallway lit by a single bulb in a wire cage. The carpet was red once, now worn to a colorless mat that shows the floorboards beneath in high-traffic areas. The walls are the same institutional green as the lobby, marked by decades of shoulders brushing past, hands steadying against plaster.

The elevator gate opens here, brass accordion folding back to release passengers into the dim corridor. A single door leads to the floor's only room—this isn't a hotel with suites, it's a hotel with cells.

The air is stale, recycled through vents that wheeze but function. Someone has scratched numbers into the wall beside the elevator: dates, maybe, or room assignments, or something more personal. The scratches are old enough that no one remembers what they meant.`,
      x: -16,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 8,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ROOM_1',
        in: '%E',
      },
    },

    '%ROOM_1': {
      name: 'Pioneer Hotel - Room 1',
      description: `A room barely large enough for its contents: a narrow bed with a mattress that sags in the middle, a metal locker bolted to the wall, a sink with a cracked mirror above it. The window is painted shut, its glass so grimy that daylight enters as gray suggestion rather than illumination.

The bed has sheets—thin, laundered to transparency, but clean. The pillow is flat. The blanket is wool, military surplus from wars no one remembers. It's warm enough if you keep your clothes on.

The walls are thin. You can hear the elevator cables through one, the building's plumbing through another, and your neighbors through the third. Privacy is an illusion sold by the hour. What you get is a door that locks and a place to lie down. In this city, that's enough.`,
      x: -15,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 12,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_1',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'a narrow bed',
          description:
            'A narrow bed with a sagging mattress occupies most of the room.',
          quality: 'cheap',
        },
      ],
    },
  },

  postProcessors: [],
};
