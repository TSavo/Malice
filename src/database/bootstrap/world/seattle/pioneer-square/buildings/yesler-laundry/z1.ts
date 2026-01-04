// Yesler Laundry - Second Floor (z=1)
// Upstairs apartment where the building owner lived
// Abandoned like the laundromat below, personal effects left behind

export const building = {
  name: 'Yesler Laundry',
  x: -9,
  y: 12,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BEDROOM_LOCK': {
      prototype: 'lock',
      name: 'Bedroom Lock',
      description:
        'A simple privacy lock on the bedroom door, the kind that can be opened with a coin.',
      difficulty: 1,
    },
    '%BEDROOM_DOOR': {
      prototype: 'door',
      name: 'Bedroom Door',
      description:
        'A hollow-core interior door, its white paint yellowed and peeling.',
      locked: false,
      open: true,
      locks: ['%BEDROOM_LOCK'],
      material: 'wood',
      durability: 25,
    },

    '%ROOF_LOCK': {
      prototype: 'lock',
      name: 'Roof Access Lock',
      description:
        'A padlock on the roof hatch, installed after someone used it for unauthorized access.',
      difficulty: 3,
    },
    '%ROOF_HATCH': {
      prototype: 'door',
      name: 'Roof Hatch',
      description:
        'A metal hatch in the ceiling leading to the roof, its frame rusted but functional.',
      locked: true,
      open: false,
      locks: ['%ROOF_LOCK'],
      material: 'metal',
      durability: 55,
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - APARTMENT
    // ═══════════════════════════════════════════════════════════════════

    '%APARTMENT_LANDING': {
      name: 'Upstairs Apartment - Landing',
      description: `The narrow stairwell opens onto a small landing that serves as the apartment's entryway. Mail is piled against the door—fifty-five years of junk mail, bills that were never paid, catalogs for products no one could order anymore. The pile has fused into a single mass of paper and mold, archaeological evidence of a life interrupted.

Shoes are lined up neatly by the door—work boots, running shoes, house slippers—the habits of someone who kept an orderly home. The shoes are stiff now, leather cracked, rubber soles separated from uppers. A coat rack holds jackets that would crumble if worn.

The apartment beyond is visible through a beaded curtain, the cheap kind sold at import stores. Some beads have fallen, leaving gaps in the pattern. The air smells of dust and enclosed decay.`,
      x: -9,
      y: 12,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z0.ts#MAIN_FLOOR',
        north: '%LIVING_ROOM',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'mail pile',
          aliases: ['mail', 'letters', 'bills'],
          description: `A pile of mail that has accumulated for fifty-five years, fused into a solid mass of paper and mold. Bills from companies that no longer exist, catalogs from stores that closed before The Burning, junk mail promising prizes that were never claimed. The pile is archaeology—the concerns of a world that ended while the mailbox kept filling.`,
        },
        {
          prototype: 'furniture',
          name: 'coat rack',
          aliases: ['coats', 'jackets', 'rack'],
          description: `A wooden coat rack holding jackets that would crumble if worn. A rain jacket, a fleece, a denim jacket with patches from concerts no one remembers. The fabrics have dried and cracked, the zippers rusted. The coats kept someone warm once. They keep nothing now.`,
        },
        {
          prototype: 'describable',
          name: 'lined-up shoes',
          aliases: ['shoes', 'boots'],
          description: `Shoes lined up neatly by the door—the habit of someone who kept an orderly home. Work boots with steel toes, running shoes with worn treads, house slippers with flattened heels. The leather has cracked, the rubber soles separated from uppers, the canvas rotted. The shoes remember the shape of feet that will never fill them again.`,
        },
      ],
    },

    '%LIVING_ROOM': {
      name: 'Upstairs Apartment - Living Room',
      description: `The living room of someone who lived above their business, the décor modest and practical. A couch frame sits against one wall, its cushions rotted away, exposing springs and wooden slats. A coffee table holds the remains of a last evening: a TV remote with corroded batteries, a TV guide open to August 2062, a coffee mug with a ring of mold where coffee evaporated decades ago.

The television mounted on the wall is dead, its screen dark, its last broadcast fifty-five years ago. The news that night would have mentioned unusual activity, civil unrest, the tensions that preceded The Burning. No one here knew it was the last broadcast they'd ever see.

Windows look out over Yesler Way, filthy but unbroken, casting grey light across the dusty room. A bookshelf holds paperbacks with yellowed pages, their spines cracked, their stories unfinished.

A small kitchen is visible through an archway, and a door leads to the bedroom.`,
      x: -9,
      y: 13,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%APARTMENT_LANDING',
        west: '%KITCHEN',
        east: {
          to: '%BEDROOM',
          description: 'A door leads to the bedroom',
          door: '%BEDROOM_DOOR',
        },
      },
      sittables: [
        {
          name: 'couch frame',
          capacity: 2,
          emptyMsg:
            'The wooden frame of a couch, its cushions long since rotted away, exposing springs and slats.',
          occupiedMsg: '%s on the couch frame',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'coffee table',
          aliases: ['table', 'remote'],
          description: `A coffee table holding the artifacts of a last evening: a TV remote with batteries that leaked and corroded, a TV guide open to August 2062, a coffee mug with a ring of mold where coffee evaporated decades ago. These objects were mundane once. They're relics now, evidence of a life interrupted mid-evening.`,
        },
        {
          prototype: 'describable',
          name: 'dead television',
          aliases: ['tv', 'television', 'screen'],
          description: `A flat-screen television mounted on the wall, its screen dark, its components dead. The last broadcast was fifty-five years ago—probably news about civil unrest, about the tensions that would become The Burning. The viewer didn't know it was the last thing they'd ever watch on this screen. The screen shows nothing now but dust.`,
        },
        {
          prototype: 'cabinet',
          name: 'bookshelf',
          aliases: ['books', 'shelf'],
          description: `A bookshelf holding paperbacks with yellowed pages—mysteries, thrillers, romances, the comfort reading of someone who lived simply. The spines are cracked from reading and re-reading. Some books are bookmarked with receipts, their stories never finished. The characters wait frozen in mid-plot, fifty-five years into suspense that will never resolve.`,
        },
        {
          prototype: 'describable',
          name: 'TV guide',
          aliases: ['guide', 'schedule'],
          description: `A TV guide open to the week of August 12-18, 2062. Someone circled programs they planned to watch: a baseball game on Friday, a movie on Saturday night. The programs never aired. The circled entries are promises a world couldn't keep.`,
        },
      ],
    },

    '%KITCHEN': {
      name: 'Upstairs Apartment - Kitchen',
      description: `A galley kitchen, narrow and efficient, the kind built when space was expensive. Cabinets line both walls, their doors hanging open, their contents exposed to fifty-five years of air and mice. What food was stored here is long gone—eaten by vermin, rotted to dust, evaporated to stain.

The refrigerator stands with its door ajar, empty and dark, the compressor dead since the power failed. The seal has degraded, the magnetic strip that once held the door closed now hanging loose. A calendar on the refrigerator door shows August 2062, appointments and reminders for a life that ended mid-month.

Dishes sit in the sink, a single plate and mug from a last breakfast, never washed. The drain is dry, the U-trap evaporated, admitting sewer gases that have long since neutralized to staleness.

A fire escape is accessible through a window above the sink—an exit to the alley below.`,
      x: -10,
      y: 13,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LIVING_ROOM',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'open cabinets',
          aliases: ['cabinets', 'cupboards'],
          description: `Kitchen cabinets hanging open, their contents exposed to decades of decay. Empty boxes that once held cereal, cans with labels too faded to read, a bag of flour that turned to solid mass and then to dust. The mice got what they could. Time took the rest.`,
        },
        {
          prototype: 'cabinet',
          name: 'dead refrigerator',
          aliases: ['fridge', 'refrigerator'],
          description: `A refrigerator with its door hanging ajar, empty and dark, its compressor dead since the power failed. Whatever was inside rotted in the first weeks and has since dried to stain and dust. The calendar on the door shows August 2062, appointments circled that were never kept.`,
        },
        {
          prototype: 'describable',
          name: 'unwashed dishes',
          aliases: ['dishes', 'sink', 'plate'],
          description: `A single plate and mug in the sink, the remains of a last breakfast never washed. The plate held something once—eggs, probably, reduced now to a brown stain. The mug held coffee that evaporated years ago. The dishes waited for someone to return and wash them. They're still waiting.`,
        },
        {
          prototype: 'describable',
          name: 'fire escape window',
          aliases: ['window', 'fire escape', 'escape'],
          description: `A window above the sink leading to a fire escape—a rusted iron structure attached to the building's exterior. The window is stuck shut, painted over at some point, but the fire escape is visible through the dirty glass. An alternate exit for someone who needed one badly enough to force the window.`,
        },
      ],
    },

    '%BEDROOM': {
      name: 'Upstairs Apartment - Bedroom',
      description: `The bedroom of someone who lived alone, the space small but orderly. A bed frame holds a mattress that has sagged and stained, the sheets still made, the pillows flat, the bedding occupied only by dust and the husks of insects that came and went over decades.

A dresser against one wall holds clothes that will never be worn again—folded neatly, waiting in drawers that haven't been opened in fifty-five years. A mirror above the dresser reflects the room dimly, its surface spotted with age. The person who looked into this mirror is gone. The mirror keeps reflecting an empty room.

Photographs in frames sit on the nightstand—people smiling at cameras, moments captured before The Burning. The frames are dusty, the faces fading, the relationships they documented ended one way or another.

A ladder in the corner leads up to a roof hatch.`,
      x: -8,
      y: 13,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LIVING_ROOM',
        up: {
          to: 'z2.ts#ROOF',
          description: 'A ladder leads up to the roof hatch',
          door: '%ROOF_HATCH',
        },
      },
      sittables: [
        {
          name: 'sagging bed',
          capacity: 1,
          emptyMsg:
            'A bed with a mattress sagged in the middle, sheets still made, pillows flat and dust-covered.',
          occupiedMsg: '%s on the bed',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'dresser',
          aliases: ['drawers', 'clothes'],
          description: `A wooden dresser with drawers that haven't been opened in fifty-five years. The clothes inside are still folded, still waiting—underwear and socks, t-shirts and jeans, the wardrobe of someone who lived practically. The fabrics have stiffened with age but might still be wearable. They've certainly been patient enough.`,
        },
        {
          prototype: 'describable',
          name: 'spotted mirror',
          aliases: ['mirror'],
          description: `A mirror above the dresser, its surface spotted with age, its reflection dim and unclear. The person who used this mirror to check their appearance is gone. The mirror keeps reflecting an empty room, a made bed, a life suspended mid-moment.`,
        },
        {
          prototype: 'describable',
          name: 'framed photographs',
          aliases: ['photos', 'photographs', 'pictures', 'frames'],
          description: `Photographs in frames on the nightstand—people smiling at cameras, moments captured before the world ended. A birthday party, a beach vacation, a holiday dinner. The faces are fading behind dusty glass, the people they show either dead or old now. The photographs remember what the world has forgotten.`,
        },
        {
          prototype: 'describable',
          name: 'made bed',
          aliases: ['bed', 'sheets', 'pillows'],
          description: `A bed neatly made, sheets tucked, pillows arranged—the habit of someone who started each day with order. The mattress has sagged in the middle, the sheets yellowed, the pillows flat. The bed has been waiting for fifty-five years for someone to mess up its careful arrangement.`,
        },
      ],
    },
  },

  postProcessors: [],
};
