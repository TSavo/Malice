// Occidental Square - Basement (z=-1)
// Storage areas, old prohibition tunnels, and underground connection

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Padlock',
      description:
        'A worn brass padlock, the kind that came with the building.',
      difficulty: 3
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Door',
      description:
        'A heavy wooden door, its surface scarred by decades of moving furniture and boxes.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'wood',
      durability: 55
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%STORAGE': {
      name: 'Occidental Square - Storage',
      description: `The basement storage for the storefronts above, a utilitarian space divided into caged sections. Wire mesh partitions separate each tenant's area, padlocked gates controlling access to accumulated stock, seasonal decorations, and the detritus of small business operations.

The gallery's section holds stretched canvases and bubble-wrapped sculptures. The coffee roaster's cage contains backup equipment and bags of green beans that will never be roasted. The bookstore's area is floor-to-ceiling with cartons of books—overstock, returns, the weight of words in cardboard.

The ceiling is low, the floor unfinished concrete, the lighting dim emergency fixtures. The air is cool and slightly musty, the particular atmosphere of spaces built for storage rather than occupation.`,
      x: -8,
      y: 0,
      z: -1,
      population: 0,
      ambientNoise: 3,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%COFFEE',
          description: 'A trapdoor leads up to the coffee shop',
          door: '%BASEMENT_DOOR',
          locks: ['%BASEMENT_LOCK']
        },
        south: '%OLD_CELLAR'
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'storage cages',
          aliases: ['cages', 'storage', 'partitions'],
          description:
            'Wire mesh partitions divide the basement into caged storage sections, each one padlocked. The gallery\'s cage holds art supplies and wrapped works. The roaster\'s contains equipment and green beans in burlap sacks. The bookstore\'s is a wall of boxes labeled by genre and author. The inventory of abandoned commerce.'
        },
      ]
    },

    '%OLD_CELLAR': {
      name: 'Occidental Square - Old Cellar',
      description: `The southern section of the basement reveals older construction—brick walls instead of concrete, an arched ceiling that predates the current building. This was a cellar before the streets rose, before the building above was built, perhaps before the fire. The brick is fire-blackened in places, the soot of 1889 preserved underground.

The space shows evidence of multiple uses across the decades. Old shelving from when this was a store's basement. Hooks on the walls from when someone kept things hanging here. Scratches on the floor from when heavy things were dragged across it.

A breach in the southern wall opens into darkness—the underground tunnel network that connects Pioneer Square's buried history.`,
      x: -8,
      y: 0,
      z: -1,
      population: 0,
      ambientNoise: 5,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%STORAGE'      },
      objects: [
        {
          prototype: 'describable',
          name: 'fire-blackened brick',
          aliases: ['brick', 'walls', 'soot'],
          description:
            'The brick walls show the scorch marks of the Great Fire of 1889, preserved underground for over a century. The soot is permanent now, baked into the brick at temperatures that made the material stronger. The fire that destroyed old Seattle hardened what it didn\'t consume.'
        },
        {
          prototype: 'describable',
          name: 'wall breach',
          aliases: ['breach', 'opening', 'hole'],
          description:
            'A section of wall where bricks have been removed, the edges worn smooth by generations of passage. The breach is old—the mortar around it crumbling, the surrounding bricks darkened by the touch of hands. Someone connected this cellar to the underground network. The connection has been used ever since.'
        },
      ]
    }
  }
};
