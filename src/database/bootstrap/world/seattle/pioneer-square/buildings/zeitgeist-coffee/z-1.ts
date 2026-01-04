// Zeitgeist Coffee - Basement (z=-1)
// Coffee roasting facility and bean storage, with access to old underground passages

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Door Lock',
      description:
        'A heavy-duty deadbolt securing the basement access.',
      difficulty: 4,
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Door',
      description:
        'A steel fire door leading to the basement stairs, marked "AUTHORIZED PERSONNEL ONLY."',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
    },

    '%ROASTER_LOCK': {
      prototype: 'lock',
      name: 'Roaster Room Lock',
      description:
        'A secure lock on the roasting facility door, protecting expensive equipment.',
      difficulty: 5,
    },
    '%ROASTER_DOOR': {
      prototype: 'door',
      name: 'Roaster Room Door',
      description:
        'A heavy door with a small window, marked "ROASTING FACILITY - AUTHORIZED ONLY."',
      locked: true,
      open: false,
      locks: ['%ROASTER_LOCK'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1) - ROASTING AND STORAGE
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_STAIRS': {
      name: 'Zeitgeist - Basement Landing',
      description: `Narrow concrete stairs descend from the back room into the building's basement, the walls lined with old photographs documenting Zeitgeist's journey from pop-up coffee cart to neighborhood institution. The photos show smiling baristas, packed opening nights, local musicians performing in the space above. The smiles are frozen in time. The nights stopped.

The air here is thick with the ghost of roasted coffee—the scent embedded so deeply into the concrete walls that years of abandonment haven't erased it. The smell is comforting and sad, a reminder of rituals that no longer occur.

A bare bulb flickers at the bottom of the stairs, casting shadows that jump with each flicker. The electrical system down here was never meant for the commercial-grade equipment that fills the basement.`,
      x: -16,
      y: 0,
      z: -1,
      population: 0,
      ambientNoise: 5,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: { room: '%BACK', door: '%BASEMENT_DOOR', locks: ['%BASEMENT_LOCK'] },
        north: '%STORAGE',
        east: { room: '%ROASTER', door: '%ROASTER_DOOR', locks: ['%ROASTER_LOCK'] },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'photo wall',
          aliases: ['photos', 'pictures', 'photographs'],
          description:
            'Framed photographs line the stairwell—the history of Zeitgeist Coffee in images. Opening night, 2008. First anniversary party. The barista championship they hosted. Local bands playing to packed crowds. The faces are young, hopeful, unaware of how the story ends.',
        },
      ],
    },

    '%STORAGE': {
      name: 'Zeitgeist - Bean Storage',
      description: `The storage room is climate-controlled—or was, when the systems worked. Humidity and temperature were carefully maintained to preserve the green coffee beans that once filled these shelves. Now the dehumidifiers are silent, the temperature unregulated, and the beans have suffered.

Burlap sacks are stacked on wooden pallets, stamped with origins that read like a geography lesson: ETHIOPIA YIRGACHEFFE, GUATEMALA HUEHUETENANGO, SUMATRA MANDHELING. The beans inside have lost their freshness, their oils gone rancid, but the sacks remain organized by origin, altitude, and processing method—the taxonomy of specialty coffee.

A small desk holds cupping notes and roast profiles, the handwriting of master roasters documenting their craft. Pages of flavor wheels and tasting scores, the obsessive documentation of people who cared deeply about the difference between "bright" and "vibrant" acidity.`,
      x: -16,
      y: 1,
      z: -1,
      population: 0,
      ambientNoise: 2,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%BASEMENT_STAIRS',
        east: '%ROASTER',
      },
      sittables: [
        {
          name: 'a desk chair',
          capacity: 1,
          emptyMsg:
            'A simple office chair sits at the cupping desk, positioned for evaluating beans.',
          occupiedMsg: '%s seated at the cupping desk',
        },
      ],
      objects: [
        {
          prototype: 'crate',
          name: 'coffee sacks',
          aliases: ['sacks', 'burlap', 'beans'],
          description:
            'Burlap sacks of green coffee beans, stamped with exotic origins: Ethiopia Yirgacheffe, Guatemala Huehuetenango, Kenya AA. The beans inside have gone stale, their potential unfulfilled, but the sacks remain organized by the obsessive taxonomy of specialty coffee.',
        },
        {
          prototype: 'desk',
          name: 'cupping desk',
          aliases: ['desk', 'tasting desk'],
          description:
            'A desk covered in cupping notes—flavor wheels, roast profiles, tasting scores. The handwriting varies: multiple roasters contributing their observations. "Ethiopian Natural: blueberry, wine, floral finish." "Guatemala Washed: chocolate, citrus, clean." The observations are precise. The beans they describe are gone.',
        },
        {
          prototype: 'cabinet',
          name: 'sample jars',
          aliases: ['jars', 'samples'],
          description:
            'Glass jars line a shelf, each containing a sample of beans from different origins and roast dates. Labels in careful handwriting identify contents and dates. The oldest samples are years old now, their purpose—quality reference—obsolete.',
        },
      ],
    },

    '%ROASTER': {
      name: 'Zeitgeist - Roasting Room',
      description: `The roasting room houses the heart of Zeitgeist's operation—a vintage Probat roaster that cost more than most people's cars. The drum roaster dominates the space, its brass fittings polished (once), its sight glass dark, its burners cold. This was where green beans became the aromatic product that defined the shop above.

The air still carries notes of the last roast—a dark profile, judging by the oily residue on the drum. The cooling tray holds a few scattered beans, forgotten when the roaster was shut down. A logbook tracks every batch: date, origin, weight, duration, final temperature. The last entry is months old.

A floor hatch near the wall leads down into darkness—access to the building's original basement, from before the coffee shop renovated. Someone installed heavy bolts to keep it secured.

Industrial ventilation ductwork snakes across the ceiling, designed to carry away the smoke and chaff of roasting. The fans are silent. The ductwork is cold. The smoke has cleared.`,
      x: -15,
      y: 0,
      z: -1,
      population: 0,
      ambientNoise: 0,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: { room: '%BASEMENT_STAIRS', door: '%ROASTER_DOOR', locks: ['%ROASTER_LOCK'] },
        north: '%STORAGE',
        down: '%OLD_BASEMENT',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'Probat roaster',
          aliases: ['roaster', 'drum roaster', 'probat'],
          description:
            'A vintage Probat drum roaster—German engineering from the 1970s, worth more than the shop\'s first year\'s revenue. The brass fittings are dull with neglect, the sight glass dark, the burners cold. But the craftsmanship is undeniable. This was a serious machine for serious coffee.',
        },
        {
          prototype: 'describable',
          name: 'cooling tray',
          aliases: ['tray', 'cooling'],
          description:
            'A circular cooling tray beside the roaster, designed to rapidly cool beans after roasting. A few scattered beans remain—dark and oily, the last batch never collected. The stirring arms are frozen mid-rotation.',
        },
        {
          prototype: 'describable',
          name: 'roast logbook',
          aliases: ['logbook', 'log', 'records'],
          description:
            'A logbook tracking every batch roasted: date, origin, weight, roast time, final temperature. The handwriting is meticulous, the data comprehensive. The last entry reads: "Ethiopian Sidamo, 12kg, 14:32 roast, 218°C drop." The date was months ago.',
        },
        {
          prototype: 'describable',
          name: 'floor hatch',
          aliases: ['hatch', 'trapdoor'],
          description:
            'A heavy hatch in the floor, secured with industrial bolts. The hatch predates the coffee shop—original construction, probably, leading to an older basement level. Someone bolted it shut for a reason.',
        },
      ],
    },

    '%OLD_BASEMENT': {
      name: 'Zeitgeist - Old Foundation',
      description: `Below the roasting room lies an older space—the original basement of whatever building stood here before Zeitgeist, before the renovation, before the specialty coffee boom transformed Pioneer Square. The walls are rough brick, the floor packed earth, the ceiling low enough to force a stoop.

This was storage once, or maybe a coal cellar. The walls are blackened in places, either from coal dust or from the great fire that reshaped Seattle in 1889. The building above was rebuilt. This foundation remained.

A section of the south wall has been knocked through, revealing a passage into the underground tunnel network that threads beneath Pioneer Square. The breach is old—decades, probably—someone's attempt to connect this basement to the buried city below.

Wooden crates are stacked in the corners, their contents removed, their purpose forgotten. A rusted bicycle frame leans against one wall, a relic of some previous tenant's transportation.`,
      x: -15,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%ROASTER',
        south: {
          to: 'underground/upper-tunnels/x-15-y0.ts',
          description: 'A breach in the wall leads into the underground tunnels',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'wall breach',
          aliases: ['breach', 'hole', 'opening'],
          description:
            'A section of the south wall has been knocked through, bricks scattered on the floor, mortar dust still visible on the rubble. The breach opens into the underground passages—the buried streets of old Seattle. Someone made this connection deliberately, decades ago.',
        },
        {
          prototype: 'crate',
          name: 'old crates',
          aliases: ['crates', 'boxes', 'wooden crates'],
          description:
            'Wooden crates stacked in the corners, their stenciled labels faded to illegibility. Whatever they contained has been removed. The wood is soft with age, the iron bands rusted. They\'ve been here longer than the coffee shop above.',
        },
        {
          prototype: 'describable',
          name: 'rusted bicycle',
          aliases: ['bicycle', 'bike', 'frame'],
          description:
            'A bicycle frame without wheels or handlebars, rusted to a uniform orange-brown. The frame is old—balloon tires era, maybe 1940s—abandoned here when someone traded up or gave up. It leans against the wall, waiting for repairs that will never come.',
        },
      ],
    },
  },
};
