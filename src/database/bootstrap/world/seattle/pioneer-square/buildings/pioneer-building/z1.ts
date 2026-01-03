// Pioneer Building - Second Floor (z=1)
// Office suites occupied by insurance and maritime businesses

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - PACIFIC MARITIME INSURANCE
    // ═══════════════════════════════════════════════════════════════════

    '%ELEV_LOBBY_Z1': {
      name: 'Pioneer Building - Second Floor Elevator Lobby',
      description: `The elevator opens onto a small lobby, the brass gates folding aside to reveal worn marble floors and oak-paneled walls. A directory board mounted on the wall lists the floor's tenants in removable white letters—most now jumbled or missing, the names of businesses that stopped operating.

PACIFIC MARITIME INSURANCE CO. reads the largest remaining sign, gold letters on a frosted glass door to the west. The company insured ships that sailed routes now abandoned, cargoes that no longer move.

The grand staircase continues upward to the third floor and downward to the lobby. The carpet on the stairs is worn threadbare at the center, the path of a century's ascending feet.`,
      x: 2,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%MARITIME_RECEPTION',
        south: '%HALL_Z1',
        up: '%STAIR_Z2',
        down: '%LOBBY',
        in: '%E',
      },
      elevatorId: '%E',
    },

    '%STAIR_Z1': {
      name: 'Pioneer Building - Second Floor Stairwell',
      description: `The grand staircase landing, where the iron balusters curve gracefully between floors. The oak handrail is worn smooth by generations of hands, its varnish darkened by touch. A tall window faces west, its glass rippled with age, casting distorted light across the marble steps.

The building's age shows in the settling—a slight tilt to the landing, a crack in the plaster ceiling that's been painted over so many times it's become a relief sculpture of repairs. The building moves. Slowly. Imperceptibly. But it moves.`,
      x: 2,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%STAIR_Z2',
        down: '%LOBBY',
        north: '%ELEV_LOBBY_Z1',
      },
    },

    '%HALL_Z1': {
      name: 'Pioneer Building - Second Floor Hallway',
      description: `A long corridor running the length of the building, doors to offices lining both sides. The frosted glass panels bear names in gold leaf—some intact, some scraped away, some replaced with hand-lettered signs. The hallway feels endless, the ceiling high, the proportions designed to impress clients with the stability of the businesses within.

Transom windows above each door let light from the offices spill into the hall, though the offices are dark now. The transoms are hinged—they could be opened to let air circulate in the days before air conditioning. No one opens them anymore.`,
      x: 2,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ELEV_LOBBY_Z1',
        east: '%MARITIME_RECORDS',
        west: '%MARITIME_OFFICE',
      },
    },

    '%MARITIME_RECEPTION': {
      name: 'Pacific Maritime Insurance - Reception',
      description: `The reception area of Pacific Maritime Insurance, a space designed to communicate stability and wealth to anxious shipowners. A massive oak desk dominates the room, its surface cleared of everything except a brass lamp and a leather blotter. Behind it, the company's charter hangs in a gilded frame—1889, the year the company was founded.

Ship models line the walls in glass cases, each one a vessel the company insured. The Klondike Queen. The Seattle Star. The Pacific Venture. Some of these ships still exist, rusting at anchor or sunk in distant waters. The models preserve them at their best—sails unfurled, flags flying, cargoes imagined.

A waiting area offers leather chairs and maritime magazines from years past. The chairs are cracked but comfortable. No one waits in them.`,
      x: 1,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ELEV_LOBBY_Z1',
        south: '%MARITIME_OFFICE',
        west: '%MARITIME_PRESIDENT',
      },
      sittables: [
        {
          name: 'a leather waiting chair',
          capacity: 3,
          emptyMsg:
            'Three leather chairs form a waiting area, their seats cracked but comfortable.',
          occupiedMsg: '%s sitting in the waiting area',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'ship models',
          aliases: ['models', 'ships', 'display cases'],
          description: `Glass cases line the walls, each containing a meticulously crafted ship model. The Klondike Queen—a three-masted barque that ran the Alaska route. The Seattle Star—a steam freighter that serviced the Pacific Islands. The Pacific Venture—a clipper ship from the China trade. Each model is perhaps two feet long, every detail rendered in miniature: rigging, deck fixtures, tiny crew figures frozen at their posts. The ships exist here in perfect form, immune to storms and rot and the slow decay that claims their real counterparts.`,
        },
        {
          prototype: 'describable',
          name: 'company charter',
          aliases: ['charter', 'frame', 'certificate'],
          description: `A gilded frame holds the company's founding charter, dated 1889. The language is formal, legal, establishing Pacific Maritime Insurance Company as a Washington Territory corporation empowered to underwrite marine risks. The signatures at the bottom are elaborate, the penmanship of men who practiced their autographs. The company outlived most of them. The charter outlived the company.`,
        },
      ],
    },

    '%MARITIME_PRESIDENT': {
      name: 'Pacific Maritime Insurance - President\'s Office',
      description: `The corner office, reserved for the company president—a space designed to intimidate and impress. Floor-to-ceiling windows on two walls offer views of Pioneer Square and, on clear days, the distant mountains. A massive mahogany desk sits before the windows, its leather chair turned to face the door.

The walls are lined with nautical charts and photographs of ships—vessels the company insured, disasters it survived, the visual history of a century of maritime commerce. A brass telescope on a tripod stands near the window, pointed at Elliott Bay as if still watching for ships.

A safe the size of a small refrigerator squats in the corner, its door hanging open, its contents long since removed. Whatever the president kept locked away—policies, bearer bonds, secrets—is gone now.`,
      x: 1,
      y: 10,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%MARITIME_RECEPTION',
        south: '%MARITIME_RECORDS',
      },
      sittables: [
        {
          name: 'the president\'s chair',
          capacity: 1,
          emptyMsg:
            'A massive leather chair sits behind the desk, its back to the windows.',
          occupiedMsg: '%s sitting in the president\'s chair, surveying the office',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'brass telescope',
          aliases: ['telescope', 'spyglass'],
          description: `A brass telescope mounted on a wooden tripod, its lens pointed at Elliott Bay. The president could watch ships entering the harbor, tracking the arrivals that meant premiums paid or claims filed. The brass is tarnished now, the lens dusty, but the telescope still functions. Through it, the bay appears closer but no less empty.`,
        },
        {
          prototype: 'describable',
          name: 'nautical charts',
          aliases: ['charts', 'maps'],
          description: `Framed nautical charts cover one wall—shipping lanes of the Pacific Northwest, the Inside Passage to Alaska, the routes to Hawaii and Japan. The charts are annotated in pencil: depths, hazards, notes about currents and weather patterns. Someone sailed these waters with expertise. The expertise is preserved here, useless now.`,
        },
        {
          prototype: 'describable',
          name: 'open safe',
          aliases: ['safe', 'vault'],
          description: `A floor safe, perhaps four feet tall, its heavy door swung open to reveal empty shelves. The safe was made to resist fire and theft, its walls inches of steel. Whatever it protected—policies worth fortunes, cash reserves, documents too sensitive to leave out—was removed or taken. The safe remains, too heavy to move, too empty to matter.`,
        },
      ],
    },

    '%MARITIME_OFFICE': {
      name: 'Pacific Maritime Insurance - Claims Office',
      description: `The working heart of the insurance company—a room of desks and filing cabinets where clerks processed the endless paperwork of marine commerce. Desks are arranged in rows, each with a typewriter and a green-shaded lamp. The typewriters are ancient, mechanical, their ribbons long dried.

Filing cabinets line the walls, their drawers labeled by year: 1920-1925, 1926-1930, and so on, marching forward through decades of claims and policies. The most recent drawer is labeled 2018-2020. The sequence stops there.

A water cooler stands in the corner, its bottle empty, its drain tray crusted with mineral deposits. The social hub of the office, where workers gathered to complain about management and share gossip. The gossip died with the gathering.`,
      x: 1,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%MARITIME_RECEPTION',
        east: '%HALL_Z1',
        south: '%MARITIME_RECORDS',
      },
      sittables: [
        {
          name: 'a clerk\'s desk',
          capacity: 4,
          emptyMsg:
            'Rows of wooden desks fill the room, each with a typewriter and a green-shaded lamp.',
          occupiedMsg: '%s sitting at one of the clerk\'s desks',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'filing cabinets',
          aliases: ['cabinets', 'files', 'drawers'],
          description: `Rows of filing cabinets, gray metal with brass pulls, each drawer labeled by year. The drawers contain policy documents, claim forms, correspondence with ship captains and harbor masters—the paper trail of a century of insuring vessels against the sea's indifference. Some drawers are stuffed to overflowing; others are nearly empty. The pattern seems random until you notice: the light years have few claims. The heavy years had storms.`,
        },
        {
          prototype: 'describable',
          name: 'typewriters',
          aliases: ['typewriter', 'machines'],
          description: `Mechanical typewriters, Underwood and Remington models, sit on each desk. The keys are yellowed, the ribbons dried to uselessness, but the machines are intact—heavy iron frames designed to last generations. Someone could replace the ribbons and type again. No one does.`,
        },
      ],
    },

    '%MARITIME_RECORDS': {
      name: 'Pacific Maritime Insurance - Records Room',
      description: `A windowless room lined floor to ceiling with shelves of ledgers—the financial records of Pacific Maritime Insurance spanning over a century. The ledgers are bound in leather, their spines stamped with years: 1889-1890, 1891-1892, continuing forward through decades of profit and loss.

A large table dominates the center of the room, its surface scarred by years of heavy books being opened and closed. A magnifying glass on a brass stand sits on the table, along with a box of white cotton gloves—the tools of someone researching the past.

The air is dry, climate-controlled by a system that still functions, preserving the paper that records a century of maritime commerce. The records themselves are pristine, waiting for historians who never come.`,
      x: 1,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%MARITIME_OFFICE',
        east: '%HALL_Z1',
        west: '%MARITIME_PRESIDENT',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'ledgers',
          aliases: ['books', 'records', 'financial records'],
          description: `Leather-bound ledgers fill the shelves, their spines stamped in gold with date ranges. Each volume contains handwritten entries—premiums collected, claims paid, the mathematics of risk converted to profit. The handwriting changes over the years, generations of clerks adding their careful figures to the columns. The most recent entries are printed, not written—computer-generated reports bound alongside their ancestors. The numbers stopped accruing. The ledgers wait.`,
        },
        {
          prototype: 'describable',
          name: 'research table',
          aliases: ['table', 'work table'],
          description: `A heavy oak table, its surface protected by a leather pad worn smooth by use. A magnifying glass on a brass stand sits at one corner, next to a box of white cotton gloves for handling delicate documents. Someone used this table regularly, researching the company's history or auditing its accounts. The tools remain, ready for work that no one performs.`,
        },
      ],
    },
  },
};
