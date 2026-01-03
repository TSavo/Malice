// Pioneer Building - Third Floor (z=2)
// Henderson & Associates - Legal Firm

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%HENDERSON_LOCK': {
      prototype: 'lock',
      name: 'Henderson & Associates Lock',
      description:
        'A heavy brass deadbolt, the kind that communicates serious intentions about privacy.',
      difficulty: 5,
    },

    // ═══════════════════════════════════════════════════════════════════
    // THIRD FLOOR (z=2) - HENDERSON & ASSOCIATES
    // ═══════════════════════════════════════════════════════════════════

    '%ELEV_LOBBY_Z2': {
      name: 'Pioneer Building - Third Floor Elevator Lobby',
      description: `The elevator lobby on the third floor, where the brass gates open onto a space that smells faintly of old paper and leather. HENDERSON & ASSOCIATES, ATTORNEYS AT LAW reads the sign on the frosted glass door ahead—the letters intact, professionally applied, as if the firm still expects clients.

A wooden bench sits against the wall, the kind meant for people waiting to be seen. The bench is polished by use, its surface darkened where generations of anxious clients sat, clutching documents that would change their lives. The anxious clients are gone. The bench remains.`,
      x: 2,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: '%HENDERSON_RECEPTION',
          locks: ['%HENDERSON_LOCK'],
          description: 'A frosted glass door leads to Henderson & Associates',
        },
        south: '%HALL_Z2',
        up: '%STAIR_Z3',
        down: '%STAIR_Z1',
        in: '%E',
      },
      elevatorId: '%E',
      sittables: [
        {
          name: 'a waiting bench',
          capacity: 3,
          emptyMsg:
            'A wooden bench sits against the wall, polished by years of anxious waiting.',
          occupiedMsg: '%s sitting on the bench outside Henderson & Associates',
        },
      ],
    },

    '%STAIR_Z2': {
      name: 'Pioneer Building - Third Floor Stairwell',
      description: `The staircase landing between the third and fourth floors. A large window here faces east, offering a view of Occidental Park and the buildings beyond. The window glass is old, slightly rippled, casting distorted light across the marble steps.

A fire extinguisher is mounted on the wall, its gauge still in the green zone despite years of neglect. Someone maintained the safety equipment even as everything else failed. The extinguisher waits for fires that may never come.`,
      x: 2,
      y: 8,
      z: 2,
      population: 0,
      ambientNoise: 3,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%STAIR_Z3',
        down: '%STAIR_Z1',
        north: '%ELEV_LOBBY_Z2',
      },
    },

    '%HALL_Z2': {
      name: 'Pioneer Building - Third Floor Hallway',
      description: `The third-floor corridor, narrower than the floors below—the building's frame stepping in as it rises. Offices line both sides, their frosted glass doors dark, their transoms sealed shut. The carpet here is burgundy, a shade darker than the floors below, an attempt at distinction that now just looks like a different kind of abandonment.

A drinking fountain is set into the wall, its porcelain basin stained by minerals, its chrome fixtures dull. The water might still flow. No one tests it.`,
      x: 2,
      y: 8,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ELEV_LOBBY_Z2',
        east: '%HENDERSON_CONFERENCE',
        west: '%HENDERSON_LIBRARY',
      },
    },

    '%HENDERSON_RECEPTION': {
      name: 'Henderson & Associates - Reception',
      description: `The reception area of Henderson & Associates projects the gravitas expected of a law firm. Dark wood paneling, brass fixtures, framed portraits of the firm's founders gazing sternly from the walls. A reception desk of polished mahogany guards access to the offices beyond, its surface clear except for an antique telephone and a leather-bound appointment book.

The appointment book lies open, its pages blank after a date three years past. No one made appointments. No one canceled them. The calendar just stopped.

Legal journals are arranged on a side table, their covers promising insights into maritime law, corporate litigation, estate planning. The insights are outdated now, the laws they interpret no longer enforced.`,
      x: 1,
      y: 9,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ELEV_LOBBY_Z2',
        south: '%HENDERSON_LIBRARY',
        west: '%HENDERSON_PARTNER',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'reception desk',
          aliases: ['desk', 'mahogany desk'],
          description: `A massive mahogany desk, the kind that takes four men to move. Its surface is polished to a mirror sheen, reflecting the ceiling lights. An antique telephone sits on one corner—black Bakelite, rotary dial, the kind that connected to operators before direct dialing. The phone might still work. No one calls.`,
        },
        {
          prototype: 'describable',
          name: 'founder portraits',
          aliases: ['portraits', 'paintings', 'founders'],
          description: `Three oil portraits hang on the wall, each depicting a stern-faced man in legal robes. Brass placards identify them: JAMES HENDERSON, FOUNDER 1891. WILLIAM HENDERSON JR., PARTNER 1923. CHARLES HENDERSON III, SENIOR PARTNER 1962. Three generations of Hendersons, each painted to project authority and wisdom. The fourth generation, if there was one, never made it to the wall.`,
        },
        {
          prototype: 'describable',
          name: 'appointment book',
          aliases: ['book', 'calendar', 'appointments'],
          description: `A leather-bound appointment book, open to a page three years past. The entries are written in careful script: 10:00 MORRISON ESTATE CLOSING, 2:00 PACIFIC FREIGHT CONSULTATION, 4:30 DEPOSITION PREP. The appointments for that day were kept or missed. The days after are blank, the appointments that would have been never made.`,
        },
      ],
    },

    '%HENDERSON_PARTNER': {
      name: 'Henderson & Associates - Partner Office',
      description: `The senior partner's office, a corner space with windows on two walls that once offered views worth the rent. The office is dominated by a desk the size of a small boat, its surface buried under files and legal briefs that no one will ever read.

A wall of built-in bookshelves holds the law library—leather-bound volumes of Washington statutes, federal regulations, case reporters going back a century. The books are organized with obsessive precision, spines aligned, gold lettering facing out. Someone cared about this library. The caring shows.

A drinks cabinet stands in the corner, its glass doors revealing crystal decanters and tumblers. The decanters are empty, their contents long since evaporated or consumed. The ritual of the celebratory drink, or the consoling one, no longer observed.`,
      x: 1,
      y: 10,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%HENDERSON_RECEPTION',
        south: '%HENDERSON_ASSOCIATE',
      },
      sittables: [
        {
          name: 'the partner\'s chair',
          capacity: 1,
          emptyMsg:
            'A high-backed leather chair sits behind the massive desk.',
          occupiedMsg: '%s sitting in the senior partner\'s chair',
        },
        {
          name: 'client chairs',
          capacity: 2,
          emptyMsg:
            'Two leather chairs face the desk, positioned for clients seeking counsel.',
          occupiedMsg: '%s sitting in one of the client chairs',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'law library',
          aliases: ['bookshelves', 'books', 'library'],
          description: `Floor-to-ceiling bookshelves line one wall, holding a comprehensive law library. Washington Reports, Pacific Reporter, United States Code—the accumulated wisdom of American jurisprudence, bound in leather and stamped in gold. The books are organized by subject and date, decades of legal evolution preserved in paper. The law changed. The books record the changes. No one consults them.`,
        },
        {
          prototype: 'cabinet',
          name: 'drinks cabinet',
          aliases: ['cabinet', 'bar', 'liquor cabinet'],
          description: `A mahogany drinks cabinet with glass doors, revealing crystal decanters and heavy tumblers arranged on silver trays. The decanters are empty, their stoppers still in place, labels identifying scotch, bourbon, brandy. The cabinet was for celebrations and commiserations—cases won, cases lost, the rituals of legal practice. The rituals ended. The glassware remains.`,
        },
      ],
    },

    '%HENDERSON_ASSOCIATE': {
      name: 'Henderson & Associates - Associate Office',
      description: `A smaller office, windowless, designated for the junior lawyers who did the firm's actual work. Two desks face each other across a narrow aisle, each piled with documents and legal pads. The associates worked here in cramped proximity, racing to bill hours and prove their worth.

The desks show the personality of their absent occupants. One is obsessively neat, files stacked at perfect right angles, pens arranged by color. The other is chaos—papers overflowing, coffee cups fossilized, sticky notes covering every surface. Two approaches to legal practice, frozen in amber.

A motivational poster hangs on the wall: JUSTICE DELAYED IS JUSTICE DENIED. The justice, delayed indefinitely, neither denied nor delivered.`,
      x: 1,
      y: 7,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%HENDERSON_PARTNER',
        east: '%HENDERSON_LIBRARY',
      },
      sittables: [
        {
          name: 'the neat desk',
          capacity: 1,
          emptyMsg:
            'A perfectly organized desk sits on one side, files stacked with geometric precision.',
          occupiedMsg: '%s sitting at the immaculate associate desk',
        },
        {
          name: 'the chaotic desk',
          capacity: 1,
          emptyMsg:
            'A desk buried in papers and coffee cups occupies the other side.',
          occupiedMsg: '%s sitting amid the chaos of the other associate desk',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'motivational poster',
          aliases: ['poster', 'sign'],
          description: `A framed poster showing scales of justice against a sunset, with the quote: \"JUSTICE DELAYED IS JUSTICE DENIED - WILLIAM GLADSTONE.\" The kind of corporate inspiration meant to keep associates billing through their exhaustion. The poster is slightly askew, never straightened by hands too busy with briefs to care about wall decor.`,
        },
      ],
    },

    '%HENDERSON_LIBRARY': {
      name: 'Henderson & Associates - Legal Library',
      description: `A research library lined with case reporters and legal treatises, the working collection that supported the firm's practice. Unlike the partner's office library—kept for show—these books are worn, their spines cracked, their pages marked with sticky notes and pencil annotations.

A large table dominates the center of the room, surrounded by wooden chairs. The table is scarred by years of heavy books being stacked and restacked, legal research conducted under deadline pressure. Yellow legal pads are scattered across its surface, covered in handwritten notes that meant something urgent once.

A coffee maker sits on a side table, its carafe empty, its hot plate mercifully off. The library ran on caffeine. The caffeine ran out.`,
      x: 1,
      y: 8,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%HENDERSON_RECEPTION',
        east: '%HALL_Z2',
        south: '%HENDERSON_ASSOCIATE',
      },
      sittables: [
        {
          name: 'a research chair',
          capacity: 4,
          emptyMsg:
            'Wooden chairs surround the central research table, worn by years of use.',
          occupiedMsg: '%s sitting at the legal research table',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'case reporters',
          aliases: ['reporters', 'books', 'legal books'],
          description: `Rows of case reporters line the shelves—Federal Reporter, Washington Reports, Pacific Reporter—each volume containing hundreds of judicial decisions. The books are organized by date and jurisdiction, a comprehensive record of how courts interpreted the law. Sticky notes protrude from some volumes, marking cases that mattered to ongoing research. The research stopped. The markers remain.`,
        },
        {
          prototype: 'describable',
          name: 'legal pads',
          aliases: ['pads', 'notes', 'yellow pads'],
          description: `Yellow legal pads scattered across the table, their pages covered in handwritten notes. The handwriting varies—some neat, some frantic—the different researchers who worked here leaving their traces. Arguments are outlined, case citations listed, questions marked with aggressive underlining. The thoughts recorded here were urgent once. Now they're just ink on paper.`,
        },
      ],
    },

    '%HENDERSON_CONFERENCE': {
      name: 'Henderson & Associates - Conference Room',
      description: `The firm's conference room, where depositions were taken and deals were struck. A long table of dark wood dominates the space, surrounded by a dozen leather chairs. The table's surface is polished to a reflective sheen, designed to intimidate opposing counsel across its expanse.

A projection screen hangs on one wall, retracted into its housing. The projector mounted on the ceiling is dark, its bulb cold. Presentations were made here—evidence displayed, arguments visualized, juries simulated. The technology waits for content that won't come.

A credenza along one wall holds legal documents in labeled folders, the files of cases in progress when progress stopped. Each folder represents a dispute, a grievance, a question of rights that no court will resolve.`,
      x: 3,
      y: 8,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_Z2',
      },
      sittables: [
        {
          name: 'a conference chair',
          capacity: 8,
          emptyMsg:
            'Leather chairs surround the long conference table.',
          occupiedMsg: '%s sitting at the conference table',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'conference table',
          aliases: ['table', 'long table'],
          description: `A table perhaps twelve feet long, dark wood polished until it reflects like a mirror. The table was designed for confrontation—depositions, negotiations, the careful dance of legal combat. Each chair positioned at the perfect distance, each angle calculated to project authority. The table has seen deals that changed fortunes. It waits for deals that won't be made.`,
        },
        {
          prototype: 'cabinet',
          name: 'case files',
          aliases: ['credenza', 'files', 'documents'],
          description: `A credenza holds labeled folders, each representing a case in progress: MORRISON V. PACIFIC SHIPPING, HENDERSON FAMILY TRUST, STATE V. UNKNOWN DEFENDANT. The files contain depositions, motions, correspondence—the paper trail of disputes that will never be resolved. The clients have moved on or disappeared. The files remain, awaiting judgments that won't come.`,
        },
      ],
    },
  },
};
