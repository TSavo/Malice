// Owl Cafe - Basement (z=-1)
// Original cellar converted to cold storage, with underground access

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%CELLAR_LOCK': {
      prototype: 'lock',
      name: 'Cellar Lock',
      description:
        'A heavy padlock on the cellar door, its brass finish greened with age.',
      difficulty: 4,
    },
    '%CELLAR_DOOR': {
      prototype: 'door',
      name: 'Cellar Door',
      description:
        'A heavy wooden door leading down to the cellar, reinforced with iron bands.',
      locked: true,
      open: false,
      locks: ['%CELLAR_LOCK'],
      material: 'wood',
      durability: 70,
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%CELLAR': {
      name: 'Owl Cafe - Cold Storage',
      description: `The basement beneath the Owl Cafe was converted to cold storage decades ago—industrial refrigeration units lining the walls, their compressors humming in the eternal mystery of power that still flows. The temperature holds at 34°F, cold enough to preserve anything that doesn't require freezing.

Shelving units hold the diner's backup supplies: cases of eggs, blocks of butter, the ingredients for ten thousand breakfasts that will never be served. The eggs are probably still good. The butter definitely isn't. The bacon has achieved a state of preservation that defies biology.

The original stone walls are visible behind the refrigeration units—this was a cellar before it was cold storage, a cellar before the street was raised, a cellar that remembers when this floor was ground level.`,
      x: -16,
      y: -1,
      z: -1,
      population: 0,
      ambientNoise: 15,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%KITCHEN',
          description: 'Stairs lead up to the kitchen',
          door: '%CELLAR_DOOR',
          locks: ['%CELLAR_LOCK'],
        },
        north: '%OLD_CELLAR',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'refrigeration unit',
          aliases: ['fridge', 'cooler', 'refrigerator'],
          description:
            'Industrial refrigeration units line the walls, their compressors humming steadily. The digital displays show 34°F. Inside: eggs in flats, butter in blocks, bacon in vacuum packs. The refrigeration continues because something powers it. The food inside exists in a state between preservation and decay.',
        },
        {
          prototype: 'crate',
          name: 'supply crates',
          aliases: ['crates', 'supplies', 'boxes'],
          description:
            'Wooden crates and cardboard boxes stacked along the walls—dry goods, paper supplies, the non-perishables that restaurants order in bulk. SYSCO labels, CHARLIE\'s PRODUCE invoices, the supply chain of diner cooking. Most of it is still usable. Some of it has been claimed by rodents. The mice, at least, are still eating.',
        },
      ],
    },

    '%OLD_CELLAR': {
      name: 'Owl Cafe - Original Foundation',
      description: `The northern section of the basement reveals the building's original construction—stone walls from before the Great Fire, before the street raising, before the Owl Cafe existed. This was someone else's cellar, converted to a different purpose when the building changed hands.

The stone is old and damp, water seeping through in places where the waterproofing has failed. The floor is packed earth here, never paved, the ground itself serving as foundation. In the northwest corner, the wall has been breached—stones removed to reveal a passage beyond.

The breach isn't new. The mortar shows decades of age. Someone opened this passage long ago, maintained it, used it for purposes the health department never inspected.`,
      x: -16,
      y: 0,
      z: -1,
      population: 0,
      ambientNoise: 8,
      lighting: 3,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%CELLAR',
        west: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%OCC_N1',
          description: 'A breach in the stone wall leads to the underground',
          hidden: true,
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'stone walls',
          aliases: ['walls', 'stones', 'foundation'],
          description:
            'The original foundation walls, built from local stone before modern construction methods arrived. The stones are fitted together with skill that predates Portland cement—lime mortar, hand-cut blocks, the craftsmanship of an earlier era. Water seeps through in places, leaving mineral deposits that trace its path. The walls have held for over a century. They will probably hold for another.',
        },
        {
          prototype: 'describable',
          name: 'wall breach',
          aliases: ['breach', 'passage', 'hole'],
          description:
            'A section of the stone wall where blocks have been removed, creating a passage large enough to crawl through. The breach is old—decades of wear on the edges, the mortar blackened by hands brushing past. Someone opened this connection to the underground long ago. Someone has been using it ever since.',
        },
      ],
    },
  },
};
