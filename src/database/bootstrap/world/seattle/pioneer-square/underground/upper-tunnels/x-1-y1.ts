// Underground passage - between Ventilation Chamber and Underground Passage

export const room = {
  name: 'Duct Junction',
  description: `The passage runs through what was once a maintenance access point for the ventilation system—a place where workers could reach the ductwork without crawling through the shafts themselves. The walls are lined with access panels, most still sealed with their original rivets, a few pried open over the decades by curiosity or necessity.

A vertical shaft rises through the ceiling here, its metal sides covered in condensation that drips constantly into a catch basin below. The shaft connects to the surface somewhere above, but the grating at the top has been welded shut for decades. Someone didn't want anyone climbing up. Or down.

The passage shows the junction between two different construction philosophies: the utilitarian infrastructure work of the ventilation system to the west, and the commercial underground architecture to the east. The transition is marked by a change in brick patterns—industrial yellow giving way to commercial red.`,
  x: -1,
  y: 1,
  z: -2,
  population: 0,
  ambientNoise: 20,
  lighting: 12,
  waterLevel: 5,
  outdoor: false,
  exits: {
    west: {
      to: 'buildings/underground-east/z-2.ts',
      room: '%VENT_CHAMBER',
      description: 'The passage leads west toward the ventilation chamber',
    },
    east: {
      to: 'buildings/underground-east/z-2.ts',
      room: '%2ND_N1',
      description: 'The passage leads east toward the Second Avenue corridor',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'access panels',
      description: 'Metal access panels line the walls, most still riveted shut. A few have been pried open, revealing the dark interior of ventilation ducts.',
      boltedDown: true,
    },
    {
      prototype: 'sign',
      name: 'catch basin',
      description: 'A shallow metal basin catches the constant drip of condensation from the vertical shaft above. The water is clear but cold.',
      boltedDown: true,
    },
  ],
};
