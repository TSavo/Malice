// Pioneer Hotel - Third Floor (z=3)

export const building = {
  name: 'Pioneer Hotel',
  x: -16,
  y: 7,
  width: 2,
  height: 1,
  floors: 6,

  rooms: {
    '%HALL_3': {
      name: 'Pioneer Hotel - Third Floor',
      description: `The third floor hallway has a smell the others lack—something chemical, astringent, the aftermath of cleaning products applied to something that needed cleaning. The source isn't visible. The smell lingers regardless, sharp beneath the usual mildew.

The carpet here has been replaced more recently than below, though "recently" is relative in a building this old. The new carpet is industrial gray, slightly cleaner than the faded red below, chosen for its ability to hide stains rather than its aesthetic appeal.

A fire extinguisher hangs on the wall, its pressure gauge in the red. Someone has written DON'T BOTHER on the wall beside it in permanent marker. The sentiment may be practical advice or philosophical statement. In this hotel, the distinction blurs.`,
      x: -16,
      y: 7,
      z: 3,
      population: 0,
      ambientNoise: 8,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ROOM_3',
        in: '%E',
      },
    },

    '%ROOM_3': {
      name: 'Pioneer Hotel - Room 3',
      description: `The third-floor room has a feature the others lack: a radiator that works. Heat rises from the cast-iron beast beneath the window, ancient but functional, making this room warmer than the floors below. The warmth comes with noise—clanks and hisses as steam moves through pipes older than anyone alive.

The extra warmth has consequences. The wallpaper peels more aggressively here, humidity trapped between layers, mold finding purchase in the gaps. The ceiling has brown spots that weren't there last year and will be worse next year.

Despite everything, this is the room people request. Warmth matters when the nights are cold. Comfort is relative. In a building full of bad options, being warm makes this the least bad.`,
      x: -15,
      y: 7,
      z: 3,
      population: 0,
      ambientNoise: 15,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_3',
      },
    },
  },

  postProcessors: [],
};
