// Pioneer Books - Basement (z=-1)
// Old book storage and archive with underground connection

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Archive Lock',
      description:
        'A brass padlock, its keyhole worn smooth from decades of use by the staff.',
      difficulty: 4,
    },
    '%BASEMENT_HATCH': {
      prototype: 'door',
      name: 'Archive Hatch',
      description:
        'A wooden trapdoor set into the floor behind the philosophy section, its hinges oiled to prevent noise.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'wood',
      durability: 65,
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%ARCHIVE': {
      name: 'Pioneer Books - Archive',
      description: `The basement archive holds the bookstore's treasure: first editions, rare prints, books too valuable or too delicate for the sales floor. Climate-controlled cabinets line the walls—or they did when the power was consistent. Now the cabinets are just storage, their temperature controls dark.

Wooden crates and acid-free boxes fill the center of the room, each labeled in careful archival handwriting: INCUNABULA, PACIFIC NW HISTORY, MAPS & ATLASES, LITERARY CORRESPONDENCE. The collection was assembled over decades by owners who loved books more than profit.

A wooden ladder leads up to the back stacks above. The rungs are worn in the center, polished by feet that came down for treasures and went back up with selections.`,
      x: -15,
      y: 12,
      z: -1,
      population: 0,
      ambientNoise: 2,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts:%BACK',
          description: 'A ladder leads up to the back stacks',
          door: '%BASEMENT_HATCH',
          locks: ['%BASEMENT_LOCK'],
        },
        north: '%OLD_STORAGE',
        west: '%FOUNDATION',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'climate cabinets',
          aliases: ['cabinets', 'storage', 'climate control'],
          description:
            'Climate-controlled display cabinets designed to protect rare books from humidity and temperature fluctuations. The digital displays are dark, the compressors silent. Inside, first editions and rare prints wait in the same conditions as the outside air. The protection has failed. The books endure anyway.',
        },
        {
          prototype: 'crate',
          name: 'archival boxes',
          aliases: ['boxes', 'archives', 'crates'],
          description:
            'Acid-free archival boxes stacked in neat rows, each labeled in careful script: INCUNABULA (books printed before 1501), PACIFIC NW HISTORY, MAPS & ATLASES. The labels represent a taxonomy of knowledge, organized by someone who understood that books are more than just paper and ink.',
        },
      ],
    },

    '%OLD_STORAGE': {
      name: 'Pioneer Books - Old Storage',
      description: `A secondary storage room that predates the bookstore's ownership of this space. The walls are older brick here, the ceiling lower, the feeling of being underground more pronounced. This was someone else's basement before the bookstore claimed it.

Wooden shelving holds overflow stock—paperbacks that never sold, textbook editions that went out of print, the books that accumulate when a store stays open long enough. Some are water-damaged, their pages swollen, their covers warped. Others are just forgotten.

The north wall shows signs of repair—newer brick filling what was once an opening. The bookstore owners sealed something when they took over this space. Whatever was beyond is now hidden behind a century of mortar.`,
      x: -15,
      y: 13,
      z: -1,
      population: 0,
      ambientNoise: 3,
      lighting: 3,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%ARCHIVE',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'overflow shelving',
          aliases: ['shelves', 'books', 'stock'],
          description:
            'Wooden shelves holding books that never found buyers—unsold stock accumulating over decades. Water damage has claimed some: swollen pages, warped covers, the musty smell of mold. Others are merely dusty, forgotten rather than ruined. The distinction matters to collectors. It matters less to the mold.',
        },
        {
          prototype: 'describable',
          name: 'sealed wall',
          aliases: ['wall', 'brick', 'repair'],
          description:
            'A section of wall where newer brick fills what was once an opening. The mortar is lighter in color, the bricks more regular in size. Someone sealed this passage deliberately, probably when the bookstore took over. Whatever was beyond—another basement, a passage to neighboring buildings—is now hidden. The wall keeps its secret.',
        },
      ],
    },

    '%FOUNDATION': {
      name: 'Pioneer Books - Old Foundation',
      description: `The western edge of the basement reveals the building's original foundation—massive stones fitted together without mortar, the dry-stack technique of pre-fire construction. The stones are stable despite their age, holding up the building through whatever forces have tried to shake them loose.

In the far corner, the floor is earth rather than concrete. Someone dug here—recently, judging by the fresh soil. The excavation reveals a passage leading south, connecting to the underground network that runs beneath Pioneer Square. The passage is narrow but navigable.

The smell of old books mingles with the smell of old earth—paper and stone, knowledge and geology, the layers of what was buried beneath the city.`,
      x: -14,
      y: 12,
      z: -1,
      population: 0,
      ambientNoise: 5,
      lighting: 2,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ARCHIVE',
        south: {
          to: 'underground/upper-tunnels/x-14-y11.ts',
          description: 'An excavated passage leads into the underground',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'stone foundation',
          aliases: ['stones', 'foundation', 'walls'],
          description:
            'The original foundation walls, built from massive stones fitted together without mortar. The dry-stack technique predates the Great Fire, predates most of the city. The stones have held for over a century. They will probably hold for another.',
        },
        {
          prototype: 'describable',
          name: 'excavation',
          aliases: ['dig', 'passage', 'tunnel'],
          description:
            'A fresh excavation in the southwest corner, earth piled beside a narrow passage. The digging was done with care—proper shoring, clean walls. The passage leads south into darkness, connecting to the underground network. Someone knew what they were looking for. Someone found it.',
        },
      ],
    },
  },
};
