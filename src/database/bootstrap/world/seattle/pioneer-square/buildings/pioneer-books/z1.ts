// Pioneer Books - Second Floor (z=1)
// Storage, staff areas, and apartment above the bookstore

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%APT_LOCK': {
      prototype: 'rentableLock',
      name: 'Apartment Lock',
      description:
        'A heavy deadbolt lock on the apartment door, more secure than a typical interior lock.',
      price: 600,
      duration: 2678400000, // 1 month
    },
    '%APT_DOOR': {
      prototype: 'door',
      name: 'Apartment Door',
      description:
        'A solid wooden door with a small brass plate reading "PRIVATE RESIDENCE".',
      locked: true,
      open: false,
      locks: ['%APT_LOCK'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - STORAGE AND APARTMENT
    // ═══════════════════════════════════════════════════════════════════

    '%LANDING': {
      name: 'Pioneer Books - Second Floor Landing',
      description: `A small landing at the top of the stairs from the bookstore below. The stairwell continues up to the roof, a narrow passage between floors. The walls are lined with more bookshelves—even the stairs weren't spared from the overflow of inventory.

A door to the east leads to the book storage area, where overstock and special orders waited for customers who never collected them. Another door to the north is marked PRIVATE RESIDENCE—someone lived above the bookstore, close enough to smell the pages.

The landing creaks with every step. The building settles around you, old wood complaining about the weight of all these books.`,
      x: -15,
      y: 12,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%BACK',
        up: '%ROOF_SW',
        east: '%STORAGE',
        north: { room: '%APT_LIVING', door: '%APT_DOOR', locks: ['%APT_LOCK'] },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'stairwell shelves',
          aliases: ['shelves', 'books'],
          description:
            'Even the stairwell has bookshelves—narrow ones, wedged against the wall, holding overflow stock that never found space on the main floor. The spines are faded, the titles obscure: academic remainders, unsold poetry collections, the books that nobody wanted.',
        },
      ],
    },

    '%STORAGE': {
      name: 'Pioneer Books - Book Storage',
      description: `The overflow storage for a bookstore that never had enough shelf space. Boxes stacked on boxes, each labeled in marker with subjects and authors. POETRY - CONTEMPORARY. HISTORY - PACIFIC NW. ARCHITECTURE - SEATTLE. The boxes form walls and corridors, a maze of unpacked inventory.

Rolling carts hold recent arrivals—books that came in before everything stopped, still in their shipping boxes, never shelved. Publisher invoices are clipped to the boxes, dates from months ago, payment terms that will never be met.

A small desk in the corner served as the ordering station—catalogues, order forms, a computer for managing inventory. The computer is dark, its database frozen, the last order never processed.`,
      x: -14,
      y: 12,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LANDING',
        north: '%PACKING',
      },
      objects: [
        {
          prototype: 'crate',
          name: 'book boxes',
          aliases: ['boxes', 'inventory'],
          description:
            'Cardboard boxes stacked in towers, each labeled with its contents. Some are sealed, never opened. Others have been rifled through, their contents partially shelved. The inventory of a bookstore frozen in time.',
        },
        {
          prototype: 'desk',
          name: 'ordering desk',
          aliases: ['desk', 'station'],
          description:
            'A small desk buried under publisher catalogues and order forms. A computer sits dark, its inventory database inaccessible. Post-it notes on the monitor remind of orders to place: "Check Penguin reprint." "McSweeney\'s backlist."',
        },
      ],
    },

    '%PACKING': {
      name: 'Pioneer Books - Packing Room',
      description: `A narrow room used for packing mail orders and special shipments. A long table runs its length, its surface scarred by box cutters and tape dispensers. Shipping supplies fill the shelves: brown paper, bubble wrap, boxes in various sizes, rolls of packing tape.

The room smells of cardboard and adhesive, the particular scent of mail-order commerce. A scale for weighing packages sits on one end of the table, a label printer beside it. The last labels printed are still in the tray—addresses of customers who ordered books that were never shipped.

A window overlooks the alley behind the building, frosted glass providing light but no view. The window doesn't open.`,
      x: -14,
      y: 13,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STORAGE',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'packing table',
          aliases: ['table', 'workbench'],
          description:
            'A long wooden table scarred by years of packing and shipping. Box cutters, tape dispensers, and shipping labels are scattered across its surface. The work stopped mid-task—a half-packed box sits waiting, its contents never sealed.',
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'shipping scale',
          aliases: ['scale'],
          description:
            'A digital shipping scale, its display dark, its last measurement forgotten. Beside it sits a label printer with unshipped labels still in the tray. The addresses are legible—customers in Spokane, Portland, Boise, waiting for books that will never arrive.',
        },
      ],
    },

    '%APT_LIVING': {
      name: 'Pioneer Books - Apartment (Living Room)',
      description: `The living room of the apartment above the bookstore, small but cozy—the home of whoever ran this place. More bookshelves line the walls, of course, but these hold personal collection rather than inventory: fiction mixed with biography, poetry beside cookbooks, the eclectic taste of a reader with no commercial constraints.

A worn couch faces a window that looks out over Yesler Way. A reading lamp stands beside it, positioned for evening reading. The lamp is off, the evening reading permanently postponed.

The smell of books is different up here—personal, lived-in, mixed with the other smells of a home: coffee, soap, the faint mustiness of old upholstery.`,
      x: -15,
      y: 11,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        out: { room: '%LANDING', door: '%APT_DOOR', locks: ['%APT_LOCK'] },
        east: '%APT_KITCHEN',
        north: '%APT_BEDROOM',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'personal bookshelves',
          aliases: ['bookshelves', 'books'],
          description:
            'Bookshelves holding a personal library—not inventory, but books owned and read and kept. The organization is emotional rather than alphabetical: favorites at eye level, aspirational reads on high shelves, guilty pleasures hidden behind serious spines.',
        },
      ],
      sittables: [
        {
          name: 'the worn couch',
          capacity: 2,
          emptyMsg:
            'A couch worn into the shape of its owner, positioned for reading by the window light.',
          occupiedMsg: '%s settled into the couch',
        },
        {
          name: 'a reading chair',
          capacity: 1,
          emptyMsg:
            'A comfortable chair sits beside a reading lamp, a stack of books on the floor beside it.',
          occupiedMsg: '%s reading in the chair',
        },
      ],
    },

    '%APT_KITCHEN': {
      name: 'Pioneer Books - Apartment (Kitchen)',
      description: `A galley kitchen, narrow but functional, with just enough space for one person to cook. The appliances are old but well-maintained: a gas stove, a humming refrigerator, a microwave older than most of Pioneer Square's current residents.

Cookbooks are wedged above the cabinets—a bookseller's kitchen has cookbooks everywhere. Recipes are bookmarked, pages stained with ingredients from past attempts. The refrigerator holds the remains of a last shopping trip: expired milk, shriveled vegetables, condiments that will outlast the apocalypse.

A small table with two chairs occupies what space remains. The table is cluttered with mail, receipts, the detritus of daily life that accumulated until daily life stopped.`,
      x: -14,
      y: 11,
      z: 1,
      population: 0,
      ambientNoise: 8,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%APT_LIVING',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'gas stove',
          aliases: ['stove', 'range'],
          description:
            'A gas stove that still works—the gas lines are still pressurized, a small miracle of municipal infrastructure. The burners light with a click, blue flames dancing. Someone could cook here, if someone had ingredients to cook.',
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'refrigerator',
          aliases: ['fridge'],
          description:
            'A refrigerator humming quietly, its contents a snapshot of interrupted life. Expired milk, vegetables gone to mush, condiments that might still be good. The freezer holds frost-covered mysteries best left undisturbed.',
        },
      ],
      sittables: [
        {
          name: 'kitchen chairs',
          capacity: 2,
          emptyMsg:
            'Two mismatched chairs sit at a small table cluttered with mail.',
          occupiedMsg: '%s sitting at the kitchen table',
        },
      ],
    },

    '%APT_BEDROOM': {
      name: 'Pioneer Books - Apartment (Bedroom)',
      description: `The bedroom of someone who read themselves to sleep every night. Books are stacked on the nightstand, piled on the floor beside the bed, accumulated in drifts along the walls. A reading light is clipped to the headboard, positioned for late-night pages.

The bed is unmade, the sheets twisted as if the occupant left in a hurry—or simply never made it after the last night of sleep. A closet door stands open, revealing clothes that no one will wear, shoes for feet that walked away.

A window faces north, its curtains drawn. Behind the curtains, the world continued without whoever lived here. The bedroom waits, patient, for a reader who will not return.`,
      x: -15,
      y: 13,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%APT_LIVING',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'unmade bed',
          description:
            'A bed with tangled sheets, unmade, books scattered across the empty side. The pillow still holds the impression of a head. The reading light is still clipped to the headboard.',
          quality: 'comfortable',
        },
        {
          prototype: 'cabinet',
          name: 'closet',
          aliases: ['wardrobe', 'clothes'],
          description:
            'A closet with the door left open, revealing clothes hanging in the darkness. Shirts, pants, dresses, the wardrobe of someone who worked in a bookstore and dressed accordingly. The clothes wait for a body to fill them.',
        },
      ],
    },
  },
};
