// QuickPrint - Ground Floor (z=0)
// Print shop specializing in concert posters and band flyers
// The paper record of Seattle's music scene, frozen in time

export const building = {
  name: 'QuickPrint',
  x: -12,
  y: 4,
  width: 2,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Shop Lock',
      description:
        'A simple deadbolt, the brass mechanism worn smooth by daily use.',
      difficulty: 3,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Shop Entrance',
      description:
        'A glass door with QUICKPRINT stenciled across it in bold sans-serif letters. Hours of operation are painted below: M-F 9-6, SAT 10-4. A CLOSED sign hangs crooked in the window.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'glass',
      durability: 40,
    },
    '%BACK_LOCK': {
      prototype: 'lock',
      name: 'Back Door Lock',
      description: 'A heavy-duty deadbolt on the delivery entrance.',
      difficulty: 4,
    },
    '%BACK_DOOR': {
      prototype: 'door',
      name: 'Back Door',
      description:
        'A metal fire door leading to the alley, dented from years of deliveries and hasty exits.',
      locked: true,
      open: false,
      locks: ['%BACK_LOCK'],
      material: 'metal',
      durability: 70,
    },
    '%UPSTAIRS_LOCK': {
      prototype: 'rentableLock',
      name: 'Apartment Lock',
      description:
        'A modern deadbolt on the apartment door, installed when the upstairs was converted.',
      rentPeriodDays: 30,
      rentAmount: 500,
    },
    '%UPSTAIRS_DOOR': {
      prototype: 'door',
      name: 'Apartment Door',
      description:
        'A solid wood door at the top of the stairs, separating the shop from the living space above.',
      locked: true,
      open: false,
      locks: ['%UPSTAIRS_LOCK'],
      material: 'wood',
      durability: 60,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - PRINT SHOP
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT': {
      name: 'QuickPrint - Front Counter',
      description: `The front of the shop is customer-facing: a service counter, sample books, and the window display that advertised capabilities to passersby. A letterpress in the window still holds a forme locked with wood type, SATURDAY NIGHT spelled out in reverse, waiting for paper that will never come.

The counter is cluttered with order forms, business cards, and a cash register that still shows the last transaction: $47.50. Binders of paper samples line one wall—cardstock weights, cover finishes, the tactile choices that print customers once agonized over.

Finished orders sit in cubbies behind the counter, organized alphabetically, wrapped in brown paper and rubber-banded: ANDERSON, CAFE RACER, DJINN. These orders were never picked up. The customers never came back.`,
      x: -13,
      y: 3,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: '1st-ave-s/y3.ts',
          description: 'The glass door leads to 1st Ave S',
          door: '%FRONT_DOOR',
        },
        east: '%PRESS_ROOM',
        up: {
          description: 'A narrow stairway leads to the apartment above',
          to: '%LANDING',
        },
      },
      sittables: [
        {
          name: 'a customer chair',
          capacity: 2,
          emptyMsg:
            'Plastic chairs sit by the counter for customers reviewing proofs.',
          occupiedMsg: '%s waiting at the counter',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'service counter',
          aliases: ['counter', 'register'],
          description: `A Formica counter separating staff from customers, its surface covered in order forms and business cards and the everyday clutter of commerce. The cash register is mechanical, a vintage NCR that the owner kept because it worked and because it looked good. The drawer is open, emptied of bills but still holding coins. The last sale was $47.50.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'order cubbies',
          aliases: ['cubbies', 'orders', 'packages'],
          description: `A wall of wooden cubbies behind the counter, each one a finished order waiting for pickup. The packages are wrapped in brown paper, labeled with names in marker: ANDERSON - 500 FLYERS. CAFE RACER - MENU REPRINT. DJINN - ALBUM RELEASE. These orders were ready. These customers were expected. Neither the orders nor the customers moved.`,
        },
        {
          prototype: 'describable',
          name: 'paper samples',
          aliases: ['samples', 'binders', 'paper'],
          description: `Binders of paper samples covering the taxonomy of print: cover weights, text weights, coated and uncoated, smooth and textured. Each sample is labeled with weight, finish, and price per sheet. Customers once spent hours comparing 80lb to 100lb cover, debating the merits of matte versus gloss. The debates are over. The paper remains, catalogued and organized.`,
        },
        {
          prototype: 'furniture',
          name: 'window letterpress',
          aliases: ['letterpress', 'window', 'display'],
          description: `A vintage letterpress positioned in the shop window, its forme locked with wooden type spelling SATURDAY NIGHT in reverse—ready to print, never printed. The press was decorative and functional, a demonstration of craft that also produced actual work. The type is dusty now, the ink dried in its well, but the letters still spell their message for anyone who can read backward.`,
          boltedDown: true,
        },
      ],
    },

    '%PRESS_ROOM': {
      name: 'QuickPrint - Press Room',
      description: `The back of the shop is where the work happened—a cramped space filled with printing equipment in various states of obsolescence. A large offset press dominates one corner, its rollers dried and cracked, its ink fountains crusted. Beside it, a digital printer from the 2010s still has paper loaded, a test print stuck in the output tray.

The smell is ink and paper and the chemical ghost of solvents. Cutting mats cover the work tables, their surfaces scarred by decades of X-Acto knives. A paper cutter—the guillotine type, blade exposed—sits ready for sheets that won't be cut.

Band posters cover every wall, the shop's portfolio and decoration combined: SOUNDGARDEN, PEARL JAM, NIRVANA, newer bands nobody remembers. The posters are sun-faded near the windows, vibrant in the shadows, a gradient of preservation.`,
      x: -12,
      y: 3,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%FRONT',
        north: '%STORAGE',
        south: {
          door: '%BACK_DOOR',
          description: 'A fire door leads to the alley',
          to: '%ALLEY',
        },
      },
      sittables: [
        {
          name: 'an office chair',
          capacity: 1,
          emptyMsg:
            'A worn office chair sits at the main workstation, its fabric permanently shaped by years of use.',
          occupiedMsg: '%s at the press room workstation',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'offset press',
          aliases: ['press', 'offset', 'printer'],
          description: `A Heidelberg offset press, vintage 1970s, the workhorse that produced thousands of posters and flyers over the decades. The rollers have dried and cracked, the ink in the fountains turned to tar, but the machinery is still beautiful in its industrial complexity. Someone knew how to run this. That knowledge is probably gone.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'digital printer',
          aliases: ['digital', 'color printer'],
          description: `A large-format digital printer from the 2010s, the technology that made offset obsolete for short runs. Paper is still loaded in the tray. A test print is stuck in the output—color bars and registration marks, the diagnostics of a machine testing itself. The test passed. No one came to see the results.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'paper cutter',
          aliases: ['cutter', 'guillotine'],
          description: `A commercial paper cutter, the guillotine type with a heavy blade and a safety guard that's been disabled for convenience. The blade is still sharp—these things stay sharp for decades. A stack of paper sits on the bed, measured and marked for cutting. The cut never happened.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'band posters',
          aliases: ['posters', 'prints'],
          description: `Posters cover every available wall—the shop's portfolio, its pride, its documentation of Seattle's music scene. Grunge icons share space with indie bands, hip-hop acts, jazz ensembles. Each poster was designed, printed, and hung by someone who believed in the show being advertised. The shows happened or didn't. The posters remain, colors fading at different rates based on sun exposure.`,
        },
      ],
    },

    '%STORAGE': {
      name: 'QuickPrint - Storage',
      description: `The storage room holds paper—reams and reams of it, organized by size and weight and color, the raw material of print production. Metal shelving units rise to the ceiling, each shelf labeled and stocked with precision. The paper is yellowing at the edges, humidity taking its toll despite the dry storage conditions.

A small bathroom occupies one corner, utilitarian and cramped. A coffee maker sits on a shelf, its pot crusted with residue, its power indicator dark. The employee break area was wherever you could find a moment.

Ink cartridges and toner fill another shelf, the consumables that kept the machines running. Some are opened and half-used. Others are still sealed, waiting for machines that might never print again.`,
      x: -12,
      y: 4,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%PRESS_ROOM',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'paper shelves',
          aliases: ['shelves', 'paper', 'supplies'],
          description: `Metal shelving units stacked with reams of paper: letter size, tabloid, poster sizes, cardstock in various weights. The paper is organized with the precision of someone who needed to find things quickly. Labels identify each shelf: 80LB COVER WHITE, 100LB TEXT CREAM, 11x17 NEWSPRINT. The paper yellows at the edges, but the organization persists.`,
        },
        {
          prototype: 'cabinet',
          name: 'ink supplies',
          aliases: ['ink', 'toner', 'cartridges'],
          description: `A shelf of printing supplies: ink cartridges for the digital printer, cans of offset ink, cleaning solvents, the consumables of print production. Some containers are open, their contents hardening. Others are sealed, their shelf life expired but their seals unbroken. Whether any of this still works is a question for someone who needs it to.`,
        },
        {
          prototype: 'describable',
          name: 'coffee station',
          aliases: ['coffee', 'break area'],
          description: `A small coffee maker on a shelf, its carafe stained brown from thousands of pots. A jar of Folgers instant sits beside it—backup for desperate times. The coffee maker is unplugged, its brew cycle permanently interrupted. A mug sits beside it, WORLD'S OKAYEST PRINTER in faded letters.`,
        },
      ],
    },

    '%ALLEY': {
      name: 'QuickPrint - Back Alley',
      description: `The alley behind QuickPrint smells like garbage and old paper, a narrow passage between buildings that sees no sunlight. A dumpster overflows with paper scraps—misprints, test sheets, the waste stream of print production. The paper has composted into a solid mass, rained on and dried and rained on again.

A fire escape climbs the building's back wall, switchbacking up to the roof. The iron is rusted but solid, the construction meant to last. Someone spray-painted PRINTERS NEVER DIE on the dumpster in silver letters.

The alley connects to streets at both ends, a through-passage for those who know the neighborhood's back channels.`,
      x: -12,
      y: 2,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 35,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: {
          door: '%BACK_DOOR',
          description: 'A fire door leads into the shop',
          to: '%PRESS_ROOM',
        },
        up: {
          description: 'A fire escape climbs the back of the building',
          to: '%ROOF_SOUTH',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'paper dumpster',
          aliases: ['dumpster', 'garbage'],
          description: `A dumpster overflowing with paper scraps—misprints, test sheets, the shredded remains of jobs gone wrong. The paper has composted into a solid mass after years of weather, unrecognizable as individual sheets. PRINTERS NEVER DIE is spray-painted on the side in silver letters. Whether that's true is debatable.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'fire escape',
          aliases: ['escape', 'stairs'],
          description: `An iron fire escape ascending the building's back wall, its ladder sections switchbacking up to the roof. The iron is rusted but structurally sound—old construction, built to endure. The lowest ladder is fixed in place, reachable from the ground if you can jump.`,
        },
      ],
    },

    '%LANDING': {
      name: 'QuickPrint - Stair Landing',
      description: `A narrow landing at the top of the stairs, where the commercial space below meets the residential space above. The transition is visible in the architecture: shop-worn wood gives way to apartment carpet, industrial lighting to domestic fixtures.

The apartment door is solid wood with a modern deadbolt—installed when the upstairs was converted from storage to living space. A welcome mat sits askew in front of the door, its message faded but readable: COME IN.

Through a window on the landing, you can see the street below, the view that renters accepted in exchange for affordable Pioneer Square rent.`,
      x: -13,
      y: 3,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%FRONT',
        east: {
          door: '%UPSTAIRS_DOOR',
          description: 'The apartment door',
          to: '%APARTMENT_MAIN',
        },
      },
    },
  },

  postProcessors: [],
};
