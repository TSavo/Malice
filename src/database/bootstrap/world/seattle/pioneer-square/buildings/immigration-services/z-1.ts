// Immigration Services - Basement (z=-1)
// Original detention cells and records storage, underground connection

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Lock',
      description:
        'A heavy padlock, rusted but functional, the kind that takes a serious key.',
      difficulty: 4
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Door',
      description:
        'A reinforced metal door, its surface painted institutional gray. The paint is chipped and peeling, revealing older layers beneath.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'metal',
      durability: 70
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%RECORDS': {
      name: 'Immigration Services - Records Storage',
      description: `The basement level was designed for storage and containment—the infrastructure of bureaucratic power hidden beneath the public-facing halls above. Filing cabinets line the walls, their drawers stuffed with yellowed documents: visa applications, deportation orders, appeals that were never heard. The paper has that particular smell of old records, dust and age and the ghost of ink.

The ceiling is low, the original joists visible between plaster that's cracked and stained by a century of moisture. The floor is bare concrete, painted gray at some point but worn back to its original surface in high-traffic areas. The walls are whitewashed brick, the mortar crumbling in places.

A heavy metal door leads up to the ground floor. The door was built for security—thick, reinforced, designed to keep whatever was down here down here.`,
      x: -16,
      y: 10,
      z: -1,
      imageOnDisk: 'immigration-services-records-storage-x-16-y10-z-1.png',
      population: 0,
      ambientNoise: 5,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%SERVICES',
          description: 'A reinforced door leads up to the processing hall',
          door: '%BASEMENT_DOOR',
          locks: ['%BASEMENT_LOCK']
        },
        east: '%CELLS'
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'filing cabinets',
          aliases: ['cabinets', 'files', 'records'],
          description:
            'Row after row of metal filing cabinets, their drawers labeled by year and category. The categories reveal the building\'s function: ENTRY DENIED, DEPORTATION, APPEALS PENDING, DECEASED. The last category has more files than the others. The paper inside is fragile, the ink faded, but the records remain—evidence of every decision made in this building.'
        },
      ]
    },

    '%CELLS': {
      name: 'Immigration Services - Detention Cells',
      description: `The eastern section of the basement reveals the building's darker purpose. Three cells line the wall, their iron bars rusted but intact, their doors standing open. Each cell is barely large enough for a cot and a bucket. The walls are scratched with marks—counting days, leaving names, expressing rage in languages that didn't help anyone understand.

The cells were temporary holding, the building's documentation claims. Temporary meaning hours or days while paperwork was processed, while decisions were made, while fates were determined by men in offices above. Some people stayed longer. The scratches suggest weeks. Months. The records upstairs would know, if anyone cared to look.

A breach in the far wall leads to the underground—stones removed, edges worn smooth by decades of passage.`,
      x: -16,
      y: 10,
      z: -1,
      imageOnDisk: 'immigration-services-detention-cells-x-16-y10-z-1.png',
      population: 0,
      ambientNoise: 3,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%RECORDS'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'detention cells',
          aliases: ['cells', 'cages', 'bars'],
          description:
            'Three iron-barred cells, each barely six feet deep and four feet wide. The bars are rusted, the doors stand open, but the function is unmistakable. These were cages for people. The cots are gone, the buckets removed, but the scratches on the walls remain—tallies of days, names of the forgotten, curses in a dozen languages.'
        },
        {
          prototype: 'describable',
          name: 'wall scratches',
          aliases: ['scratches', 'graffiti', 'marks'],
          description:
            'The cell walls are covered in scratches and carvings, layered over each other across decades. Tally marks count days. Names are carved deep: CHEN, YAMAMOTO, GONZALEZ, others worn illegible. Some scratches form words in languages the walls can\'t translate. Some form pictures. Some are just damage—the rage of confinement expressed through fingernails and found objects.'
        },
      ]
    }
  }
};
