// Merchant's Cafe - Basement (z=-1)
// Original cellar with underground connection

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%CELLAR_LOCK': {
      prototype: 'lock',
      name: 'Cellar Lock',
      description:
        'A heavy brass padlock, its keyhole worn smooth from decades of use.',
      difficulty: 4,
    },
    '%CELLAR_HATCH': {
      prototype: 'door',
      name: 'Cellar Hatch',
      description:
        'A wooden hatch set into the kitchen floor, its iron hinges thick with grease to prevent squeaking.',
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
      name: "Merchant's Cafe - Wine Cellar",
      description: `The wine cellar beneath Merchant's Cafe is a temple to fermented grape—floor-to-ceiling racks holding hundreds of bottles, the accumulated collection of a restaurant that took its wine list seriously. The racks are wooden, custom-built to fit the space, organized by region and vintage.

The temperature is naturally cool, the stone walls sweating slightly, the humidity maintained by the earth itself. Bottles lie on their sides in proper storage position, corks moist, contents aging. Burgundies and Bordeaux, Oregon Pinots and Washington Cabernets, the geography of wine represented in glass and cork.

A wooden staircase leads up to the kitchen above, its treads worn by waiters who came down for bottles and back up with selections for tables that no longer exist.`,
      x: -15,
      y: -3,
      z: -1,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts:%KITCHEN',
          description: 'Wooden stairs lead up to the kitchen',
          door: '%CELLAR_HATCH',
          locks: ['%CELLAR_LOCK'],
        },
        south: '%DRY_STORAGE',
        west: '%OLD_FOUNDATION',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'wine racks',
          aliases: ['racks', 'bottles', 'wine'],
          description:
            'Custom wooden wine racks holding hundreds of bottles—Burgundy, Bordeaux, California, Washington, Oregon, the world of wine represented in glass. The bottles lie on their sides, corks facing out, labels yellowed but legible. Some of these bottles were waiting for special occasions. The occasions never came. The wine continues to age.',
        },
        {
          prototype: 'describable',
          name: 'tasting table',
          aliases: ['table'],
          description:
            'A small wooden table in the center of the cellar, used for tasting and selecting wines. A corkscrew and a single wine glass sit on the surface, as if someone was interrupted mid-selection. The glass is empty. The corkscrew is clean.',
        },
      ],
    },

    '%DRY_STORAGE': {
      name: "Merchant's Cafe - Dry Storage",
      description: `The dry storage room holds the restaurant's shelf-stable provisions—canned goods, dried pasta, rice, flour, the pantry staples that kept the kitchen running. Metal shelving units line the walls, their contents organized by type and frequency of use.

Much of what's stored here is still edible—canned goods don't spoil, dried goods last for years. The flour has likely gone stale, the pasta absorbed humidity, but the canned tomatoes and beans and stocks remain viable. A survival cache, unintentionally assembled.

The room is windowless, the air still, the only light whatever filters down from the kitchen above. The darkness has preserved what it contains.`,
      x: -15,
      y: -4,
      z: -1,
      population: 0,
      ambientNoise: 2,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%CELLAR',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'storage shelves',
          aliases: ['shelves', 'provisions', 'supplies'],
          description:
            'Metal shelving units stocked with canned goods, dried pasta, bags of rice, the staples of restaurant cooking. Labels face out: crushed tomatoes, cannellini beans, chicken stock. The organization is professional. The inventory is substantial. The kitchen above will never use it.',
        },
        {
          prototype: 'crate',
          name: 'flour sacks',
          aliases: ['flour', 'sacks'],
          description:
            'Heavy paper sacks of flour stacked in the corner, some burst and spilling their contents. The flour has absorbed moisture from the air, clumping into unusable masses. Weevils have probably found their way in. The sacks represent cooking that will never happen.',
        },
      ],
    },

    '%OLD_FOUNDATION': {
      name: "Merchant's Cafe - Old Foundation",
      description: `The western end of the basement reveals the building's original foundation—rough-cut stone rather than brick, the work of builders who constructed this before the Great Fire. The stones are fitted together without mortar in places, a dry-stack technique that has held for over a century.

The floor here is bare earth rather than concrete, and in the far corner, someone has dug. The excavation reveals an older passage—part of the original street level that was buried when the city raised its grades. The passage leads south, into the underground network that threads beneath Pioneer Square.

Debris around the excavation suggests the work was done recently, with modern tools. Someone knew what they were looking for. Someone found it.`,
      x: -16,
      y: -3,
      z: -1,
      population: 0,
      ambientNoise: 5,
      lighting: 3,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%CELLAR',
        south: {
          to: 'buildings/underground-tour/z-2.ts',
          room: '%TOUR_START',
          description: 'An excavated passage leads into the underground',
          hidden: true,
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'stone foundation',
          aliases: ['stones', 'foundation', 'walls'],
          description:
            'The original foundation walls, built from rough-cut local stone before the fire that destroyed the neighborhood. The stones are grey and weathered, fitted together with skill that predates modern construction. They have held the building up for over a century. They will probably hold it up for another.',
        },
        {
          prototype: 'describable',
          name: 'excavation',
          aliases: ['dig', 'hole', 'passage'],
          description:
            'A fresh excavation in the corner of the basement, earth piled beside a narrow passage that leads down and south. The digging was done with care—straight walls, proper shoring—by someone who knew what they were doing. The passage connects to the old street level, the buried city beneath the current one.',
        },
      ],
    },
  },
};
