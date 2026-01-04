// QuickPrint - Upper Floor (z=1)
// Apartment above the print shop
// Live-work space for the owner/operator

export const building = {
  name: 'QuickPrint',
  x: -12,
  y: 4,
  width: 2,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // UPPER FLOOR (z=1) - APARTMENT
    // ═══════════════════════════════════════════════════════════════════

    '%APARTMENT_MAIN': {
      name: 'QuickPrint Apartment - Living Room',
      description: `The apartment above QuickPrint is small but functional—a live-work space for someone who didn't want to commute. The living room is barely separated from the kitchen, an open floor plan forced by the building's bones rather than chosen for aesthetics.

The furniture is thrift-store eclectic: a couch that sags in the middle, a coffee table made from a cable spool, bookshelves overflowing with graphic design manuals and music magazines. The walls are covered in framed posters—the same ones sold downstairs, but personal favorites, signed by the bands.

A window overlooks First Avenue, the view that someone watched every day while drinking coffee and putting off going downstairs to work. The glass is old enough to have ripples, distorting the street below into gentle waves.`,
      x: -13,
      y: 3,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: { door: '%UPSTAIRS_DOOR', description: 'The apartment door leads to the stairs', to: '%LANDING' },
        east: '%KITCHEN',
        north: '%BEDROOM',
      },
      sittables: [
        {
          name: 'a sagging couch',
          capacity: 3,
          emptyMsg:
            'A deep couch sags in the middle, shaped by years of someone who lived alone and sat in the same spot.',
          occupiedMsg: '%s on the couch',
        },
        {
          name: 'a reading chair',
          capacity: 1,
          emptyMsg:
            'A wingback chair by the window offers a view of the street below.',
          occupiedMsg: '%s in the reading chair',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'bookshelves',
          aliases: ['books', 'shelves'],
          description: `Floor-to-ceiling bookshelves built from wooden planks and cinder blocks, the shelving of someone who had more books than money. The collection is heavy on graphic design—typography manuals, printing guides, the technical literature of the trade. Mixed in: music magazines, vinyl records standing upright, paperback novels with cracked spines.`,
        },
        {
          prototype: 'describable',
          name: 'signed posters',
          aliases: ['posters', 'prints'],
          description: `Framed posters cover the walls—the same designs sold downstairs, but these are personal. Signatures in Sharpie: "To Max - Keep printing! - Eddie Vedder." "Thanks for the rush job - Duff." The signatures document relationships, favors, the currency of a scene where everyone knew everyone. The signatures are fading. The relationships dissolved.`,
        },
        {
          prototype: 'furniture',
          name: 'cable spool table',
          aliases: ['table', 'coffee table'],
          description: `A wooden cable spool repurposed as a coffee table, its surface covered in ring stains from cups and glasses. A stack of unread mail sits on top—catalogues, bills, the paper that accumulated after someone stopped opening it. The spool was a practical choice, free from somewhere, heavy enough to stay put.`,
        },
      ],
    },

    '%KITCHEN': {
      name: 'QuickPrint Apartment - Kitchen',
      description: `The kitchen is a galley arrangement, cabinets on both sides of a narrow space, designed for efficiency rather than dinner parties. The appliances are decades old but functional—a gas stove with iron grates, a refrigerator that hums in a frequency you stop hearing after a while.

The sink is full of dishes, the archaeology of meals that were interrupted. Pots on the stove hold the dried remains of whatever was cooking when the world changed. The smell has faded—time took care of that—but the residue remains, crusted onto surfaces.

A small table sits by the window, barely big enough for one person and a plate. The view from here is the building's airshaft, a rectangle of grey sky and brick walls. The person who lived here ate alone, watching nothing.`,
      x: -12,
      y: 3,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%APARTMENT_MAIN',
        north: '%BATHROOM',
      },
      sittables: [
        {
          name: 'a kitchen chair',
          capacity: 1,
          emptyMsg:
            'A single chair sits at the small kitchen table, positioned for solitary meals.',
          occupiedMsg: '%s at the kitchen table',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'gas stove',
          aliases: ['stove', 'oven', 'range'],
          description: `A vintage gas stove with iron grates, the kind that heats unevenly but cooks with character. The burners are crusted with spilled food from a last meal that was never cleaned up. A pot sits on one burner, its contents long since dried to a brown residue. The pilot lights are out. The gas probably isn't flowing.`,
        },
        {
          prototype: 'cabinet',
          name: 'refrigerator',
          aliases: ['fridge'],
          description: `A humming refrigerator, old enough to remember when Freon was the standard. The hum is consistent, the compressor still cycling, somehow still powered. The contents are best left uninspected—whatever perishables were inside have passed through decay into something else entirely. The freezer is probably safer.`,
        },
        {
          prototype: 'describable',
          name: 'dirty dishes',
          aliases: ['dishes', 'sink'],
          description: `The sink is full of dishes—plates, bowls, coffee cups, the accumulation of someone who meant to wash them later. Later never came. The dishes are dried and crusty now, their food remains fossilized. The water in the sink evaporated long ago. The faucet still drips occasionally.`,
        },
      ],
    },

    '%BEDROOM': {
      name: 'QuickPrint Apartment - Bedroom',
      description: `The bedroom is barely big enough for a bed and a dresser, the closet space carved from what was once a larger room. The bed is unmade, sheets tangled, the shape of someone's last sleep still visible in the displaced blankets.

A nightstand holds a clock radio, its LED display dark, its last song unheard. A stack of books sits beside it—half-read paperbacks, a Kindle with a dead battery, the reading material of someone who fell asleep mid-sentence.

Clothes drape over a chair, hang from door hooks, spill from dresser drawers. The organization system was "wherever it lands." It worked for whoever lived here. It preserved itself when they left.`,
      x: -13,
      y: 4,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%APARTMENT_MAIN',
        east: '%BATHROOM',
        up: {
          description: 'A ladder leads up through a ceiling hatch to the roof',
          to: '%ROOF_NORTH',
        },
      },
      sittables: [
        {
          name: 'the bed',
          capacity: 2,
          emptyMsg:
            'An unmade bed fills most of the room, sheets twisted from restless sleep.',
          occupiedMsg: '%s on the bed',
        },
        {
          name: 'a clothes chair',
          capacity: 1,
          emptyMsg:
            'A chair piled with clothes serves as secondary storage.',
          occupiedMsg: '%s perched among the laundry',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'nightstand',
          aliases: ['stand', 'table'],
          description: `A small nightstand beside the bed, its surface cluttered with the debris of bedtime routines: a clock radio with a dark display, a stack of paperbacks, a phone charger with nothing to charge, a glass with the dried residue of water. The clock stopped at 3:47. AM or PM is unclear.`,
        },
        {
          prototype: 'cabinet',
          name: 'dresser',
          aliases: ['drawers'],
          description: `A dresser with drawers that don't quite close, clothes spilling from the gaps. The organization is chaotic—socks mixed with shirts, underwear tangled with pants. Someone lived out of these drawers, grabbing what was needed, never putting things back properly. The system worked for them.`,
        },
      ],
    },

    '%BATHROOM': {
      name: 'QuickPrint Apartment - Bathroom',
      description: `The bathroom is small and tiled, the kind of functional space that apartment buildings shoehorn into corners. The fixtures are old but solid—a claw-foot tub with a shower ring, a pedestal sink, a toilet that runs unless you jiggle the handle.

A medicine cabinet over the sink holds the usual remedies: aspirin, antacids, allergy pills, the pharmaceutical management of everyday ailments. A razor sits on the sink's edge, dried shaving cream crusted on its head.

The mirror is spotted with age, its silver backing failing at the edges. Your reflection is unclear, which might be for the best.`,
      x: -12,
      y: 4,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%KITCHEN',
        west: '%BEDROOM',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'medicine cabinet',
          aliases: ['medicine', 'cabinet'],
          description: `A mirrored medicine cabinet above the sink, its door slightly ajar. Inside: over-the-counter medications, expired prescriptions, the chemical toolkit of minor ailments. Aspirin, Tums, Benadryl. A prescription bottle with a name that was someone's. The pills are probably still effective, if less so than before.`,
        },
        {
          prototype: 'furniture',
          name: 'claw-foot tub',
          aliases: ['tub', 'bath', 'shower'],
          description: `A vintage claw-foot tub with a shower ring and a curtain that's seen better decades. The enamel is worn at the bottom where feet stood. A bar of soap has melted into a slick residue. The shower curtain is mildewed at the bottom, a ring of black where moisture collected.`,
        },
        {
          prototype: 'describable',
          name: 'spotted mirror',
          aliases: ['mirror'],
          description: `An old mirror above the sink, its silver backing failing at the edges, creating dark spots that eat into the reflection. Looking into it is like looking through water—the image is there but distorted, uncertain. The spots grow slowly, colonizing the glass.`,
        },
      ],
    },
  },

  postProcessors: [],
};
