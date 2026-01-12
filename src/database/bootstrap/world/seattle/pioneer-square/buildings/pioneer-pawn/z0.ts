// Pioneer Pawn & Loan - Ground Floor (z=0)
// A pawn shop on Yesler Way with security bars and dusty inventory
// The three golden balls above the door have tarnished green

export const building = {
  name: 'Pioneer Pawn & Loan',
  x: 5,
  y: 14,
  width: 2,
  height: 3,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Front Door Lock',
      description:
        "A heavy-duty deadbolt, the kind pawn shops install when they realize what they're storing.",
      difficulty: 5,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Security Door',
      description:
        'A steel security door with bars across its glass panel. The door is locked but shows signs of attempted forced entry—scratches around the lock, dents in the frame.',
      locked: true,
      open: false,
      locks: ['%FRONT_LOCK'],
      material: 'metal',
      durability: 80,
    },

    '%BACK_LOCK': {
      prototype: 'lock',
      name: 'Back Door Lock',
      description:
        'A commercial-grade deadbolt on the back door, with a secondary bar lock above it.',
      difficulty: 6,
    },
    '%BACK_DOOR': {
      prototype: 'door',
      name: 'Back Door',
      description:
        'A reinforced steel door with no window—pure security. The door opens outward into the alley, making it harder to force.',
      locked: true,
      open: false,
      locks: ['%BACK_LOCK'],
      material: 'metal',
      durability: 90,
    },

    '%CAGE_LOCK': {
      prototype: 'lock',
      name: 'Cage Lock',
      description:
        'A heavy padlock on the security cage, the kind that costs more than most of what it protects.',
      difficulty: 5,
    },
    '%CAGE_DOOR': {
      prototype: 'door',
      name: 'Security Cage Door',
      description:
        'A chain-link cage door separating the back room from the storage area. The cage is floor-to-ceiling, bolted to concrete.',
      locked: true,
      open: false,
      locks: ['%CAGE_LOCK'],
      material: 'metal',
      durability: 85,
    },

    '%SAFE_LOCK': {
      prototype: 'biometricLock',
      name: 'Gun Safe Lock',
      description:
        'A combination lock on the gun safe, the dial worn smooth from use.',
      scanners: [
        { type: 'keypad', part: 'hand', message: 'Combination required.' },
      ],
      authorizedUsers: {},
      difficulty: 8,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - PAWN SHOP
    // ═══════════════════════════════════════════════════════════════════

    '%SHOWROOM': {
      name: 'Pioneer Pawn - Showroom',
      description: `The showroom is a museum of desperation—row upon row of glass cases displaying the things people sold when they needed money more than memories. Guitars hang from the walls, their strings slack and dusty. Power tools crowd one section, their brand names promises of productivity that someone traded for cash. Electronics fill another case: phones, tablets, laptops, the technology of a world that no longer connects to anything.

The counter runs along the back wall, a barrier of glass and steel between customers and proprietor. A register sits silent on the counter, its drawer sealed. Behind it, the wall of high-value items: jewelry in locked cases, watches arranged on velvet, the small expensive things that represented quick cash and broken promises.

Security bars cross every window, casting striped shadows across the dusty inventory. The three golden balls that once proclaimed the pawnbroker's trade hang outside, tarnished green with age, their meaning now purely historical.`,
      x: 5,
      y: 12,
      z: 0,
      imageOnDisk: 'yesler-way-x5-y12-z0.png',
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 'yesler-way/x5.ts',
          description: 'The security door leads to Yesler Way',
          door: '%FRONT_DOOR',
        },
        north: '%BACK_ROOM',
        west: '%MUSIC_CORNER',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'jewelry case',
          aliases: ['jewelry', 'watches', 'case'],
          description: `A glass case behind the counter displaying jewelry and watches—gold chains, engagement rings, Rolexes and their imitators. Each piece has a tag with a number and a price. Each piece has a story: a marriage that ended, a inheritance that was sold, a theft that was fenced. The stories are gone. The objects remain, still tagged, still priced, still worthless.`,
        },
        {
          prototype: 'cabinet',
          name: 'electronics case',
          aliases: ['electronics', 'phones', 'laptops'],
          description: `A case of dead electronics: smartphones with cracked screens, tablets with dead batteries, laptops that will never connect to WiFi again. The technology is obsolete twice over—first by the endless upgrade cycle, then by the end of the infrastructure that gave it purpose. A phone without a network is just a rectangle of glass and metal.`,
        },
        {
          prototype: 'furniture',
          name: 'pawn counter',
          aliases: ['counter', 'register'],
          description: `A heavy counter of laminate and steel, designed to keep customers at arm's length while transactions happened. The register sits sealed, its drawer locked, whatever cash was inside still there—worthless now but present. A small camera above the counter, its lens dark, once recorded every transaction. The recordings are on a hard drive somewhere, unwatched.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'security bars',
          aliases: ['bars', 'grating'],
          description: `Heavy steel bars across every window, the kind that make a store feel like a prison or a fortress depending on which side you're on. The bars cast shadow patterns across the merchandise, stripes of light and dark that shift with the sun. The bars kept the inventory safe. The inventory is still safe. No one wants it anymore.`,
        },
      ],
    },

    '%MUSIC_CORNER': {
      name: 'Pioneer Pawn - Music Section',
      description: `The music section is a graveyard of abandoned creativity. Guitars hang from wall hooks in rows—acoustics and electrics, basses and ukuleles, the instruments of garage bands and bedroom recording sessions. Some are valuable: a vintage Fender, a Gibson Les Paul, brands that musicians once coveted. Most are cheap starter instruments, the kind bought with enthusiasm and sold when the enthusiasm faded.

Amplifiers stack against one wall, their speakers silent, their tubes cold. A drum kit sits assembled in the corner, its skins dusty, its cymbals tarnished. Someone brought it in piece by piece, needing rent more than rhythm.

A glass case near the counter holds the small accessories: picks in every color, capos, strings still in packages, tuners that will never measure pitch again. The tools of music-making, waiting for musicians who won't come.`,
      x: 4,
      y: 12,
      z: 0,
      imageOnDisk: 'yesler-way-x4-y12-z0.png',
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%SHOWROOM',
        north: '%TOOLS',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'guitar wall',
          aliases: ['guitars', 'instruments'],
          description: `Guitars hang from hooks on the wall, arranged by type and value: acoustics on the left, electrics on the right, the expensive ones higher up where they're harder to grab and run. A vintage Fender Stratocaster hangs near the ceiling, its sunburst finish faded, its value now purely theoretical. Below it, rows of lesser instruments await players who will never come.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'drum kit',
          aliases: ['drums', 'kit'],
          description: `A five-piece drum kit assembled in the corner, its chrome hardware tarnished, its drum heads covered in dust. Someone brought this in piece by piece over multiple visits, each piece representing a small surrender. The hi-hat is frozen open. The kick pedal is locked in place. The drums are silent, waiting for a beat that won't come.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'amplifiers',
          aliases: ['amps', 'speakers'],
          description: `A stack of amplifiers against the wall: Marshall, Fender, Vox, the names that defined rock and roll tone. The amps are dead without power, their tubes cold, their speakers silent. Someone once cranked these to eleven. Now they're furniture, expensive furniture that no one wants to move.`,
        },
      ],
    },

    '%TOOLS': {
      name: 'Pioneer Pawn - Tool Section',
      description: `The tool section tells stories of work that didn't pay enough. Power tools dominate: circular saws, drills, sanders, the equipment of construction and renovation. Hand tools fill pegboard walls: wrenches, screwdrivers, hammers, the basics that every toolbox needs. Each tool was someone's livelihood, sold when the work dried up or the bills piled too high.

A case of specialty tools shows the higher-end trades: surveying equipment, electrical testing gear, the precision instruments of skilled work. These commanded better prices, required more desperate sellers.

Garden equipment clusters in one corner: lawnmowers, trimmers, leaf blowers. The seasonal tools that homeowners bought with suburban optimism and sold when the optimism faded. The lawns they were meant to maintain have grown wild now. The tools sit here, useless.`,
      x: 4,
      y: 13,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%MUSIC_CORNER',
        east: '%BACK_ROOM',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'power tools',
          aliases: ['tools', 'saws', 'drills'],
          description: `Shelves of power tools: DeWalt, Makita, Milwaukee, the brands that contractors trusted. Circular saws with sawdust still in their guards. Drills with worn chuck keys attached by string. Each tool represents a job that needed doing, and someone who needed money more than they needed to do it.`,
        },
        {
          prototype: 'describable',
          name: 'hand tool wall',
          aliases: ['hand tools', 'pegboard'],
          description: `A pegboard wall covered with hand tools, organized by type: wrenches arranged by size, screwdrivers sorted by head type, hammers hung by weight. The organization is professional—someone who understood tools arranged this display. The dust is amateur—no one has touched these tools in years.`,
        },
        {
          prototype: 'cabinet',
          name: 'specialty equipment',
          aliases: ['equipment', 'specialty'],
          description: `A locked case of specialty tools: laser levels, oscilloscopes, multimeters, the expensive equipment of precise trades. These commanded premium prices from desperate sellers, sat longer waiting for buyers who understood their value. The buyers never came. The equipment waits.`,
        },
      ],
    },

    '%BACK_ROOM': {
      name: 'Pioneer Pawn - Back Room',
      description: `The back room is where deals were made and broken—a small office crammed with the paperwork of lending money at interest. A desk holds a computer, a printer, the forms that documented every transaction. The walls are covered with schedules: interest rates, redemption periods, the mathematics of desperation.

A security cage separates this space from the storage area beyond, chain-link floor to ceiling, bolted to concrete. Through the mesh, you can see the overflow inventory: more electronics, more tools, the items that didn't fit in the showroom. A gun safe stands against the far wall, massive and black, its door closed.

Stairs in the corner lead up to the second floor, where the owner lived above his inventory.`,
      x: 5,
      y: 13,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SHOWROOM',
        west: '%TOOLS',
        north: {
          description: 'A security cage separates the storage area',
          door: '%CAGE_DOOR',
          to: '%STORAGE',
        },
        up: 'z1.ts#UPSTAIRS_LANDING',
      },
      sittables: [
        {
          name: 'office chair',
          capacity: 1,
          emptyMsg:
            'A worn office chair sits behind the desk, its armrests cracked from years of use.',
          occupiedMsg: '%s in the office chair',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'office desk',
          aliases: ['desk', 'computer'],
          description: `A metal desk covered with the paperwork of pawn: loan agreements, redemption receipts, the carbon copies of transactions dating back years. A computer sits dark, its database of pawned items and their owners inaccessible. A calculator with a paper tape shows the last calculation: $127.50 at 15% monthly interest.`,
        },
        {
          prototype: 'describable',
          name: 'interest rate chart',
          aliases: ['chart', 'rates', 'schedule'],
          description: `A laminated poster on the wall shows the shop's rates: 15% monthly for general items, 20% for electronics, 10% for gold. The fine print explains redemption periods, forfeiture terms, the legal framework for extracting money from the desperate. The rates were predatory. The rates were legal. The rates no longer matter.`,
        },
        {
          prototype: 'describable',
          name: 'security monitors',
          aliases: ['monitors', 'cameras', 'cctv'],
          description: `A bank of small monitors, their screens dark, once showed feeds from cameras throughout the store. The recordings are on a hard drive somewhere, documenting transactions and movements that no one will ever review. The cameras saw everything. The cameras see nothing now.`,
        },
      ],
    },

    '%STORAGE': {
      name: 'Pioneer Pawn - Secure Storage',
      description: `The secure storage area holds the overflow and the valuable—items too bulky for display cases, too expensive to leave in the showroom. Shelving units hold labeled boxes: estate jewelry, coin collections, the concentrated wealth of people who needed cash more than heirlooms.

A massive gun safe dominates one corner, its door closed, its combination lock set. Whatever firearms are inside have waited fifty-five years for owners who never returned. The safe is rated for fire and theft. It has survived both, probably.

A back door leads to the alley, a secondary exit for deliveries and emergencies. The door is reinforced steel, locked from inside, the kind of door that says "don't try."`,
      x: 5,
      y: 14,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%BACK_ROOM',
        north: {
          description: 'A reinforced door leads to the back alley',
          door: '%BACK_DOOR',
          to: null, // Alley not implemented
        },
      },
      objects: [
        {
          prototype: 'safe',
          name: 'gun safe',
          aliases: ['safe', 'weapons'],
          description: `A massive gun safe, six feet tall, matte black, rated for fire and forced entry. The combination lock is a dial with numbers worn smooth from use. Whatever firearms are inside—hunting rifles, handguns, maybe something more exotic—have waited fifty-five years in climate-controlled darkness. The safe kept its contents secure. The contents may be the most valuable things in Pioneer Square now.`,
          locks: ['%SAFE_LOCK'],
        },
        {
          prototype: 'cabinet',
          name: 'estate boxes',
          aliases: ['boxes', 'jewelry boxes'],
          description: `Labeled boxes on shelving units: "MORRISON ESTATE - COINS," "JENSEN COLLECTION - WATCHES," "UNCLAIMED 2019." Each box contains the concentrated value of someone's lifetime, sold or forfeited when the original owner couldn't redeem it. The boxes are dusty, their contents untouched, their owners dead or disappeared.`,
        },
        {
          prototype: 'describable',
          name: 'inventory tags',
          aliases: ['tags', 'labels'],
          description: `Everything in storage has a tag: item number, date received, owner name, loan amount, redemption deadline. The tags create a paper trail of transactions, a database of desperation recorded in handwriting and printer ink. The deadlines have all passed. The items remain unredeemed.`,
        },
      ],
    },
  },

  postProcessors: [],
};
