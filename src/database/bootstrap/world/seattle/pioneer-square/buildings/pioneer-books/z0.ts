// Pioneer Books - Ground Floor (z=0)
// Independent bookstore serving the neighborhood's literary community

export const building = {
  name: 'Pioneer Books',
  x: -14,
  y: 12,
  width: 2,
  height: 2,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Pioneer Books Lock',
      description:
        'A simple deadbolt, the kind found on storefronts everywhere. The key is probably on a ring somewhere, waiting for an owner who will never return.',
      difficulty: 4,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Bookstore Entrance',
      description:
        'A glass door with PIONEER BOOKS painted in green letters, a small bell hanging above the frame to announce customers. The door is unlocked, slightly ajar.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'glass',
      durability: 55,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - BOOKSTORE
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN': {
      name: 'Pioneer Books - Main Floor',
      description: `Floor-to-ceiling shelves create canyons of books, narrow passages between walls of spines in every color. The organization follows a logic that made sense to the staff: Fiction A-M to the left, N-Z to the right, Non-Fiction beyond, and somewhere in the back, the sections that required searching—Poetry, Philosophy, Architecture.

The books remain organized by subject and author, appreciated by no one. Looters don't take books. The knowledge inside is patient—it can wait. Dust motes float in whatever light filters through the front windows, settling on covers that haven't been touched in months.

A checkout counter near the entrance holds a cash register, a stack of bookmarks, and a handwritten sign: "STAFF PICKS" with arrows pointing to a nearby display. The picks were never collected. The staff moved on to more pressing concerns.`,
      x: -14,
      y: 12,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 'yesler-way/x-13.ts',
          description: 'The glass door leads back to Yesler Way',
          door: '%FRONT_DOOR',
        },
        east: '%BACK',
        north: '%READING',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'checkout counter',
          aliases: ['counter', 'register', 'desk'],
          description: `A wooden checkout counter worn smooth by decades of transactions—books slid across its surface, credit cards swiped, receipts torn from the register. The cash register is mechanical, its buttons faded, its drawer closed. A cup holds pens and bookmarks. A handwritten sign points to STAFF PICKS. The staff picked. The customers never collected.`,
        },
        {
          prototype: 'cabinet',
          name: 'fiction shelves',
          aliases: ['fiction', 'novels', 'books'],
          description: `Towering shelves of fiction organized alphabetically by author—Atwood through Zola, every letter represented. Paperbacks with cracked spines, hardcovers with dust jackets intact, mass market editions and trade paperbacks jumbled together in the democracy of alphabetization. The stories wait inside, patient, ready to be read by eyes that may never find them.`,
        },
        {
          prototype: 'describable',
          name: 'staff picks display',
          aliases: ['staff picks', 'display', 'recommendations'],
          description: `A table near the entrance displays STAFF PICKS—a dozen books with handwritten note cards explaining why each staff member loved them. "Sarah's Pick: This book changed how I think about memory." "Marcus recommends: The best Seattle novel ever written." The cards are personal, passionate. The staff members are gone. Their recommendations remain.`,
        },
        {
          prototype: 'describable',
          name: 'door bell',
          aliases: ['bell', 'chime'],
          description: `A small brass bell hangs above the entrance, rigged to ring when the door opens. The mechanism is simple—a lever attached to the door frame, a clapper that strikes when the door swings. The bell hasn't rung in months. It waits, ready to announce customers who aren't coming.`,
        },
      ],
    },

    '%READING': {
      name: 'Pioneer Books - Reading Nook',
      description: `A cozy corner carved out of the bookstore's north end, furnished with mismatched armchairs and a sagging couch—the kind of seating that invites lingering. This was where customers came to browse before buying, to read first chapters and flip through photo books and decide if a purchase was worth making.

Bookshelves line the walls here too, but these hold the prestige inventory: art books too expensive to leave on the main floor, first editions in protective sleeves, rare volumes locked in a glass case. The case is still locked. The rarities remain rare.

A coffee table holds scattered magazines—literary journals, The New Yorker, publications for readers who took reading seriously. The dates on the covers are months old. The articles inside discuss a world that no longer exists.`,
      x: -14,
      y: 13,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%MAIN',
      },
      sittables: [
        {
          name: 'the reading armchairs',
          capacity: 3,
          emptyMsg:
            'Mismatched armchairs cluster around a coffee table, inviting readers who never arrive.',
          occupiedMsg: '%s settled into a reading chair',
        },
        {
          name: 'the sagging couch',
          capacity: 2,
          emptyMsg:
            'A well-worn couch sags in the middle, its cushions shaped by years of readers.',
          occupiedMsg: '%s sinking into the couch',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'reading armchairs',
          aliases: ['chairs', 'armchairs'],
          description: `Three armchairs that don't match—one leather, one velvet, one upholstered in a floral pattern that was probably inherited. Each chair has found its shape over years of readers settling into it, the cushions compressed, the arms worn. They're comfortable in the way that old furniture is comfortable: broken in, familiar, accepting.`,
        },
        {
          prototype: 'cabinet',
          name: 'rare books case',
          aliases: ['case', 'glass case', 'rare books'],
          description: `A glass display case holds the store's treasures: first editions, signed copies, books too valuable to leave on open shelves. A handwritten card identifies each: "Hemingway, The Sun Also Rises, 1st Ed - $4,500." "Kerouac, On the Road, signed - $2,800." The case is locked. The key is probably in the drawer of the checkout counter. The books wait, preserved in climate-controlled twilight.`,
        },
        {
          prototype: 'furniture',
          name: 'coffee table',
          aliases: ['table'],
          description: `A low wooden table scarred by coffee rings and book corners, its surface cluttered with literary magazines and journals. The New Yorker, The Paris Review, Granta, publications for serious readers. The issues are months old, their contents discussing books and ideas from before everything changed. The table has held a thousand cups of coffee. No steam rises now.`,
        },
        {
          prototype: 'describable',
          name: 'art books',
          aliases: ['photo books', 'coffee table books'],
          description: `Oversized art books line the lower shelves—photography collections, exhibition catalogues, the kind of books meant to be browsed rather than read. Images of paintings, sculptures, architecture, the visual arts documented in print. The books are heavy, their pages glossy. Each one represents hours of someone looking at something beautiful.`,
        },
      ],
    },

    '%BACK': {
      name: 'Pioneer Books - Back Stacks',
      description: `The back of the store is where the serious collections live: academic volumes in philosophy and history, architecture and urban planning, the sections that required knowing what you were looking for. The shelves here are taller, the aisles narrower, the lighting dimmer.

A rolling ladder provides access to the highest shelves, its wheels set in brass tracks that run the length of each section. The ladder hasn't rolled in months. The highest shelves hold books that required effort to reach—Heidegger, Wittgenstein, the philosophers who demanded something from their readers.

A small desk in the corner was the staff's workspace—inventory lists, special orders, the paperwork of running a bookstore. A computer sits dark on the desk, its screen dusty. The last inventory was never finished.`,
      x: -13,
      y: 12,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%MAIN',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'philosophy section',
          aliases: ['philosophy', 'philosophy books'],
          description: `Shelves of philosophy texts, organized by tradition and era—ancient Greeks, medieval scholastics, German idealists, continental thinkers, analytical philosophers. Plato and Aristotle at eye level, Kant and Hegel requiring a reach, Derrida and Foucault on the highest shelf as if their difficulty earned them altitude. The books contain arguments about the nature of existence. Existence continues, unargued.`,
        },
        {
          prototype: 'cabinet',
          name: 'architecture section',
          aliases: ['architecture', 'architecture books'],
          description: `Books about buildings—histories of architectural movements, monographs on famous architects, technical volumes on construction and design. Seattle's own architecture is documented here: Pike Place Market, the Space Needle, the buildings of Pioneer Square itself. The neighborhood's history is recorded on these shelves, available to anyone who cares to read it.`,
        },
        {
          prototype: 'describable',
          name: 'rolling ladder',
          aliases: ['ladder'],
          description: `A wooden rolling ladder on brass wheels, the kind that made bookstores feel like libraries. The wheels run in tracks mounted to the floor, allowing access to the highest shelves. The rungs are worn smooth in the middle where countless feet have stepped. The ladder hasn't moved in months. The high books remain unreached.`,
        },
        {
          prototype: 'desk',
          name: 'staff desk',
          aliases: ['desk', 'office desk'],
          description: `A small desk tucked into the corner, cluttered with the paperwork of running a bookstore: inventory sheets, special order forms, publisher catalogues. A computer sits dark, its screen dusty. Post-it notes cling to the monitor's frame with reminders that will never be acted upon: "Call about Murakami order." "Check poetry restock." The tasks remain undone.`,
        },
      ],
    },
  },
};
