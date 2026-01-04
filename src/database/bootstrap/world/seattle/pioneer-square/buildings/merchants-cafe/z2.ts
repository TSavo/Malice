// Merchant's Cafe - Third Floor (z=2)
// Former offices and storage, now abandoned

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%OFFICE_LOCK': {
      prototype: 'lock',
      name: 'Office Door Lock',
      description:
        'A heavy deadbolt lock on the office door, more substantial than the hotel room locks below.',
      difficulty: 5,
    },
    '%OFFICE_DOOR': {
      prototype: 'door',
      name: 'Office Door',
      description:
        'A solid door with a frosted glass panel, the words "PRIVATE OFFICE" painted in gold letters that have mostly flaked away.',
      locked: true,
      open: false,
      locks: ['%OFFICE_LOCK'],
    },

    '%STORAGE_LOCK': {
      prototype: 'lock',
      name: 'Storage Room Lock',
      description: 'A heavy padlock on the storage room door, rusted but functional.',
      difficulty: 4,
    },
    '%STORAGE_DOOR': {
      prototype: 'door',
      name: 'Storage Room Door',
      description:
        'A reinforced door with steel plating, protecting whatever the restaurant stored here.',
      locked: true,
      open: false,
      locks: ['%STORAGE_LOCK'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // THIRD FLOOR (z=2) - OFFICES AND STORAGE
    // ═══════════════════════════════════════════════════════════════════

    '%HALL_Z2': {
      name: "Merchant's Cafe - Third Floor Landing",
      description: `The third floor landing, where the stairs from below meet the access to the roof above. The space is smaller than the floors below—the building tapers slightly at this height, a quirk of Victorian architecture that creates odd angles and cramped corners.

A door leads west to what was once the restaurant's office. Another door, reinforced with steel, protects a storage room to the south. The doors are closed, their locks engaged, whatever they protected still protected.

A ladder bolted to the wall leads up through a hatch in the ceiling to the roof. The hatch is weathered, its edges showing daylight where the seal has failed.`,
      x: -15,
      y: -2,
      z: 2,
      population: 0,
      ambientNoise: 8,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%HALL_Z1',
        up: '%ROOF_NE',
        west: { room: '%OFFICE', door: '%OFFICE_DOOR', locks: ['%OFFICE_LOCK'] },
        south: { room: '%STORAGE', door: '%STORAGE_DOOR', locks: ['%STORAGE_LOCK'] },
      },
    },

    '%OFFICE': {
      name: "Merchant's Cafe - Manager's Office",
      description: `The restaurant's administrative heart, where the business side of feeding a city was conducted. A heavy oak desk dominates the room, its surface covered in ledgers and papers that document the final days of operation. The handwriting grows more erratic in the later entries, the numbers increasingly desperate.

Filing cabinets line one wall, their drawers labeled by year. The earliest dates back to the 1920s. The most recent is labeled with a year that feels impossibly close. A century of receipts, invoices, employee records—the paper trail of a restaurant that outlived everyone who built it.

A small safe sits in the corner, its door slightly ajar. Whatever was inside has been removed—by the owner, by looters, by someone who needed whatever cash or valuables a restaurant owner might keep on hand.`,
      x: -16,
      y: -2,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        out: { room: '%HALL_Z2', door: '%OFFICE_DOOR', locks: ['%OFFICE_LOCK'] },
      },
      objects: [
        {
          prototype: 'desk',
          name: 'manager desk',
          description:
            'A heavy oak desk covered in ledgers, receipts, and the accumulated paperwork of a century of restaurant operation.',
        },
        {
          prototype: 'safe',
          name: 'office safe',
          description:
            'A small floor safe, its door ajar, its contents long since removed. The combination dial is worn smooth from decades of use.',
        },
        {
          prototype: 'cabinet',
          name: 'filing cabinets',
          description:
            'Metal filing cabinets labeled by decade, containing employee records, vendor contracts, and tax documents dating back to the Jazz Age.',
        },
      ],
      sittables: [
        {
          name: 'a leather office chair',
          capacity: 1,
          emptyMsg:
            'A leather office chair sits behind the desk, its cushion cracked and flattened by decades of use.',
          occupiedMsg: '%s sitting in the manager\'s chair',
        },
      ],
    },

    '%STORAGE': {
      name: "Merchant's Cafe - Dry Storage",
      description: `A reinforced storage room used for keeping valuable supplies—wine, spirits, and items too precious for the kitchen's walk-in. Metal shelving units line the walls, still holding dusty bottles and sealed containers.

The wine rack covers one entire wall, bottles resting in diamond-shaped compartments. Many labels are too faded to read, but some are legible: vintages from Bordeaux, Burgundy, Napa Valley. The collection represents decades of acquisition, bottles bought when they were merely expensive, now priceless or vinegar.

Boxes of preserved goods sit on the shelves—canned truffles, dried mushrooms, olive oils in dark glass. The restaurant's insurance policy against supply disruptions, now its legacy. The temperature is stable, the room dark. Some of it might still be good.`,
      x: -15,
      y: -3,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        out: { room: '%HALL_Z2', door: '%STORAGE_DOOR', locks: ['%STORAGE_LOCK'] },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'wine rack',
          description:
            'A floor-to-ceiling wine rack holding dusty bottles from decades of collection. Some labels are still legible: Château Margaux, Opus One, Domaine de la Romanée-Conti.',
        },
        {
          prototype: 'crate',
          name: 'supply crates',
          description:
            'Wooden crates stamped with import labels, containing preserved delicacies from before the fall.',
        },
      ],
    },

    '%ARCHIVES': {
      name: "Merchant's Cafe - Archives",
      description: `A small room tucked into the building's northeast corner, filled with the accumulated history of Seattle's oldest restaurant. Framed photographs cover the walls—the restaurant in various decades, famous diners, staff portraits, newspaper clippings celebrating anniversaries and awards.

Boxes of memorabilia fill the shelves: menus from different eras, matchbooks with the restaurant's logo, commemorative plates, napkins with handwritten notes from celebrity guests. The collection spans the entire history of the restaurant, from its founding in 1890 to its final service.

A window looks north toward where the debris wall now stands, blocking the view of downtown that once drew diners to this corner of the city.`,
      x: -15,
      y: -2,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_Z2',
      },
    },
  },
};
