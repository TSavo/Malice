// J&M Cafe - Basement (z=-1)
// Prohibition-era cellar with bootlegger tunnels and hidden storage

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%CELLAR_LOCK': {
      prototype: 'lock',
      name: 'Cellar Lock',
      description:
        'An ancient padlock, its brass mechanism green with age but still functional.',
      difficulty: 3,
    },
    '%CELLAR_DOOR': {
      prototype: 'door',
      name: 'Cellar Trapdoor',
      description:
        'A heavy wooden trapdoor in the floor behind the bar, reinforced with iron bands. Decades of footsteps have worn a path around it.',
      locked: true,
      open: false,
      locks: ['%CELLAR_LOCK'],
      material: 'wood',
      durability: 65,
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%CELLAR': {
      name: 'J&M Cafe - Cellar',
      description: `The cellar beneath the J&M is older than Prohibition but shaped by it—the original storage space expanded, reinforced, connected to passages that only bootleggers needed. The walls are brick, the floor packed earth, the ceiling low enough that tall people duck instinctively.

Wooden racks line the walls, built for kegs and cases but empty now except for dust and cobwebs. The racks are sturdy, hand-built, designed to hold the weight of inventory that could make or break a bar. A few crates remain, their contents unknown, their labels rotted to illegibility.

The air is cool and damp, smelling of earth and old wood and something faintly yeasty—the ghost of spilled beer from a century of kegs. The silence is deep, broken only by the occasional creak of the building settling above.`,
      x: -15,
      y: 4,
      z: -1,
      population: 0,
      ambientNoise: 3,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts:%BAR',
          description: 'A trapdoor leads up to the bar',
          door: '%CELLAR_DOOR',
          locks: ['%CELLAR_LOCK'],
        },
        north: '%BOOTLEGGER_ROOM',
        west: '%OLD_FOUNDATION',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'wooden keg racks',
          aliases: ['racks', 'shelves', 'storage'],
          description:
            'Hand-built wooden racks line the walls, their joints fitted without nails, their construction meant to last. The racks held kegs once—dozens of them, the inventory of a bar that served drinks through Prohibition and beyond. Now they hold dust and memory and the occasional forgotten crate.',
        },
        {
          prototype: 'crate',
          name: 'old crates',
          aliases: ['crates', 'boxes'],
          description:
            'A few wooden crates remain on the racks, their labels rotted, their contents a mystery. The wood is dry and grey, the nails rusted. Whatever was stored here was forgotten long ago. The forgetting continues.',
        },
      ],
    },

    '%BOOTLEGGER_ROOM': {
      name: 'J&M Cafe - Bootlegger Storage',
      description: `This section of the basement was clearly expanded during Prohibition—the brick is newer, the construction more deliberate, the purpose obvious. This was a bootlegger's stash, hidden beneath a legitimate business, accessed through passages that connected half the buildings in Pioneer Square.

The walls are lined with shelving still bearing the ghosts of whiskey bottles—rings in the dust, labels stuck to wood, the archaeological evidence of illegal commerce. A heavy workbench fills one corner, its surface scarred by tools and bottle caps and the general activity of an operation that processed hundreds of cases.

A heavy door in the north wall leads to a passage beyond—the tunnels the bootleggers used, connecting to the underground network that predates them by decades.`,
      x: -15,
      y: 5,
      z: -1,
      population: 0,
      ambientNoise: 2,
      lighting: 3,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%CELLAR',
        north: {
          to: 'underground/upper-tunnels/x-14-y4.ts:%PASSAGE',
          description: 'A bootlegger passage leads into the underground',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'bootlegger shelves',
          aliases: ['shelves', 'storage'],
          description:
            'Wooden shelving built to hold contraband whiskey, the rings from hundreds of bottles still visible in the dust. The shelves are deeper than normal, designed for cases stacked two or three deep. The construction is solid but fast—built by people who needed storage quickly and discreetly.',
        },
        {
          prototype: 'furniture',
          name: 'workbench',
          aliases: ['bench', 'table'],
          description:
            'A heavy wooden workbench, its surface scarred by decades of use. Bottle caps are embedded in the wood, hammered flat by repeated impacts. Scratches trace paths where cases were dragged. The bench was the center of operations—where bottles were labeled, cases packed, contraband prepared for distribution.',
        },
        {
          prototype: 'describable',
          name: 'tunnel entrance',
          aliases: ['passage', 'tunnel', 'door'],
          description:
            'A heavy wooden door in the north wall, reinforced with iron bands. Beyond it, darkness—the bootlegger tunnels that connected Pioneer Square during Prohibition, repurposing older passages that had existed since the street was raised. The door is unlocked now. Nobody cares about contraband anymore.',
        },
      ],
    },

    '%OLD_FOUNDATION': {
      name: 'J&M Cafe - Old Foundation',
      description: `The western section of the basement reveals the building's original bones—stone walls from the 1880s, before the fire, before the street raising, before the J&M existed. The stone is local, hand-cut, fitted together with skill that doesn't exist anymore.

The floor here is bare earth, packed hard by time but never paved. Moisture seeps through the stone walls, leaving mineral deposits that glitter faintly in dim light. The air is colder here, the depth more pronounced.

Old pipes run along the ceiling—gas lines from before electricity, water lines from before modern plumbing, the infrastructure of a city that kept rebuilding on top of itself. The pipes are corroded, their original purposes long since obsolete, their presence merely structural now.`,
      x: -16,
      y: 4,
      z: -1,
      population: 0,
      ambientNoise: 2,
      lighting: 2,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: '%CELLAR',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'stone walls',
          aliases: ['walls', 'stones', 'foundation'],
          description:
            'The original foundation walls, built from local stone before the Great Fire, before modern construction methods arrived. The stones are fitted together with skill that predates Portland cement—lime mortar, hand-cut blocks, the craftsmanship of an earlier era. Water seeps through in places, leaving mineral deposits that trace its path.',
        },
        {
          prototype: 'describable',
          name: 'old pipes',
          aliases: ['pipes', 'gas lines', 'plumbing'],
          description:
            'Ancient pipes run along the ceiling—gas lines from before electricity, water lines from before modern plumbing. The pipes are corroded, their joints crusted with mineral deposits, their contents long since drained or disconnected. They remain because removing them would cost more than leaving them.',
        },
      ],
    },
  },
};
