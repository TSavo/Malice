// Alley - between Factory and Immigration Services

export const room = {
  name: 'Alley',
  description: `The alley widens slightly here, a small alcove where the buildings' footprints don't quite align. Someone has claimed the space—a nest of flattened cardboard and plastic sheeting tucked against the Immigration Services wall, positioned under an overhang that keeps off the worst of the rain.

The nest is empty now, its occupant elsewhere or gone entirely. Personal effects remain: a torn blanket, a coffee can holding cigarette butts, a paperback book swollen with moisture damage. The setup suggests habitation, but the stillness suggests absence.

The Fabrication Factory's wall here has a service door, steel and featureless, locked from inside. A camera above it might work or might not—the lens is cracked, the housing dented. The factory watches, or pretends to watch, or watched once and forgot to stop.`,
  x: -17,
  y: 10,
  z: 0,

  imageOnDisk: 'alley-x-17-y10-z0.png',
  population: 0,
  ambientNoise: 18,
  lighting: 45,
  waterLevel: 0,
  outdoor: true,
  exits: {
    west: {
      to: 'buildings/fabrication-factory/z0.ts#%BREAKROOM',
      prototype: 'guardedExit',
      allowedFaction: 'Citizen',
      denyMessage:
        'The steel emergency exit is locked. A palm scanner glows red beside it.',
      description: 'A steel emergency exit leads into the Fabrication Factory',
    },
  },
};
