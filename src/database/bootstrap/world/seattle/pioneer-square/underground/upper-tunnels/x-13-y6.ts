// Underground passage - between First Avenue Passage and Old Gambling Den

export const room = {
  name: 'Vice Alley',
  description: `The passage runs through what was once the back entrance to multiple establishments of questionable virtue—the connecting corridor between gambling, drinking, and other services that respectable Seattle preferred not to acknowledge. The walls show the marks of a century of furtive traffic: worn brick at waist height, graffiti in languages that changed with each wave of immigration.

A painted arrow on one wall points east with the legend "GAMES OF CHANCE" in faded gold lettering. Another points west: "REFRESHMENTS". The operators of old Seattle understood customer flow. Guide the patrons from one vice to the next, and take a cut at every station.

The air carries traces of old perfume and older tobacco, scents that have seeped into the brick itself and refuse to dissipate. Someone swept the floor recently—the debris pushed into corners rather than removed—suggesting the passage still sees use.`,
  x: -13,
  y: 6,
  z: -2,
  population: 0,
  ambientNoise: 10,
  lighting: 12,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/yesler-underground/z-2.ts',
      room: '%FIRST_AVE_MID',
      description: 'The passage leads west toward First Avenue',
    },
    east: {
      to: 'buildings/yesler-underground/z-2.ts',
      room: '%GAMBLING_DEN',
      description: 'The passage leads east toward the old gambling den',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'directional arrows',
      description: 'Faded gold lettering on opposing walls: "GAMES OF CHANCE →" and "← REFRESHMENTS". The marketing of Victorian vice.',
      boltedDown: true,
    },
    {
      prototype: 'furniture',
      name: 'worn brick walls',
      description: 'The bricks at waist height are polished smooth by generations of hands steadying themselves after one drink too many.',
      boltedDown: true,
    },
  ],
};
