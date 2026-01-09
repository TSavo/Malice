// Colman Building Access Shaft - z=-2 underground connection
// Vertical shaft connecting Colman Building basement to upper tunnel network

export const room = {
  name: 'Colman Building Access Shaft',
  description: `A narrow shaft descends from the basement door into the darkness below, the original 1889 foundation visible in the rough-cut brick walls. The shaft appears to have been created during the building's construction, perhaps for coal delivery or some other practical purpose that has long been forgotten.

Metal rungs are bolted into the brick at regular intervals, cold to the touch and slick with moisture. The descent is about ten feet—just enough to clear the foundation and emerge into the tunnel network below. The air grows colder and damper with each step down.

At the bottom, the shaft opens into a low-ceilinged tunnel that connects to the broader underground network. The transition from building basement to underground passage is abrupt: maintained, lit space above to abandoned darkness below. The smell changes too—from building maintenance to earth and age and standing water.`,

  x: -12,
  y: -2,
  z: -2,
  population: 0,
  ambientNoise: 10,
  lighting: 8,
  waterLevel: 0,
  outdoor: false,
  exits: {
    up: {
      to: 'buildings/colman-building/z-1.ts',
      room: '%MAIN_AREA',
      description: 'A steel door leads up into the basement',
      door: {
        prototype: 'door',
        name: 'Basement Door',
        description:
          'A steel door set into the shaft ceiling, painted over many times. It opens into the Colman Building basement above.',
        locked: false,
        open: false,
        material: 'metal',
        durability: 40,
      },
    },
    south: {
      to: 'underground/upper-tunnels/x-12-y-3.ts',
      description: 'The tunnel continues south toward a flooded section',
    },
  },
  objects: [
    {
      prototype: 'furniture',
      name: 'metal rungs',
      description:
        'Metal rungs bolted into the brick wall provide climbing access between the basement door and the tunnel below. The rungs are slick with condensation and rust at the edges, but they hold firm.',
      boltedDown: true,
    },
    {
      prototype: 'furniture',
      name: 'brick shaft walls',
      description:
        'The shaft walls are original 1889 brickwork, the mortar joints dark with a century of moisture. The bricks show signs of water damage—efflorescence patterns where minerals have leached to the surface, dark stains where water has seeped through.',
      boltedDown: true,
    },
  ],
};
