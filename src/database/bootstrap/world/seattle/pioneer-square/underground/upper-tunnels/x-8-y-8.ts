// Underground passage - connecting Occidental South Passage (-7,-8) to Storage Bay (-10,-6)

export const room = {
  name: 'Occidental West',
  description: `The passage runs west from the Occidental South Passage, connecting toward the Storage Bay in the western underground. The construction is older here—Victorian-era brick showing its age, the mortar crumbling in places, the walls bowing slightly under the weight of the earth above.

The floor is uneven, the surface having shifted over decades of settling. Footing is uncertain, each step requiring attention to the changing terrain beneath.

A faded sign on the wall reads "STORAGE" with an arrow pointing west—a navigation aid from an era when these passages were more actively used.`,
  x: -8,
  y: -8,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 10,
  waterLevel: 12,
  outdoor: false,
  exits: {
    east: {
      to: 'buildings/king-street-underground/z-2.ts',
      room: '%OCC_S_PASSAGE',
      description: 'The passage leads east to Occidental South Passage',
    },
    west: {
      to: 'underground/upper-tunnels/x-9-y-8.ts',
      description: 'The passage continues west',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'storage sign',
      description: 'A faded sign with an arrow: "STORAGE". The lettering is barely visible but the direction is clear.',
      boltedDown: true,
    },
  ],
};
