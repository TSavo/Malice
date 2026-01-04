// Gargoyle Building - First Floor (z=1)
// Victorian-era offices: Suite 101-104 (Harbor Insurance, Dental Office)

export const building = {
  name: 'Gargoyle Building',
  x: -18,
  y: 12,
  width: 2,
  height: 2,
  floors: 5,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%SUITE_101_LOCK': {
      prototype: 'rentableLock',
      name: 'Suite 101 Lock',
      description:
        'A brass lock with a tarnished plate reading "101". The mechanism is old but functional.',
      difficulty: 4,
    },
    '%SUITE_101_DOOR': {
      prototype: 'door',
      name: 'Suite 101 Door',
      description:
        'A solid wood door with a frosted glass panel. Gold leaf lettering reads: "HARBOR INSURANCE CO." The glass is cracked but intact.',
      locked: true,
      open: false,
      locks: ['%SUITE_101_LOCK'],
      material: 'wood',
      durability: 70,
    },

    '%SUITE_102_LOCK': {
      prototype: 'rentableLock',
      name: 'Suite 102 Lock',
      description:
        'A brass lock matching the others on this floor. Slightly newer, installed during some renovation.',
      difficulty: 4,
    },
    '%SUITE_102_DOOR': {
      prototype: 'door',
      name: 'Suite 102 Door',
      description:
        'A wooden door with frosted glass. "DR. EDWARD CHEN, D.D.S." in peeling gold leaf. A dental practice.',
      locked: true,
      open: false,
      locks: ['%SUITE_102_LOCK'],
      material: 'wood',
      durability: 70,
    },

    // ═══════════════════════════════════════════════════════════════════
    // FIRST FLOOR (z=1) - OFFICES
    // ═══════════════════════════════════════════════════════════════════

    '%HALL_1': {
      name: 'Gargoyle Building - First Floor Hall',
      description: `The first floor hallway retains more of its original grandeur than the floors above—the tin ceiling panels are intact here, the wallpaper merely faded rather than peeling. The ornate cast iron staircase continues upward, while doors to offices line the corridor.

The numbering system is traditional: 101, 102, 103, 104. Each door has a frosted glass transom and a brass mail slot. The mail slots are stuffed with papers that will never be read, correspondence for businesses that no longer exist.

A water-stained ceiling panel near the end of the hall suggests problems from above—leaks that traveled down through the building's bones, finding their way through plaster and lathe to mark this spot.`,
      x: -18,
      y: 12,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z0.ts#STAIRWELL',
        up: '%HALL_2',
        east: {
          description: 'A frosted glass door leads to Suite 101',
          door: '%SUITE_101_DOOR',
          to: '%SUITE_101',
        },
        west: {
          description: 'A frosted glass door leads to Suite 102',
          door: '%SUITE_102_DOOR',
          to: '%SUITE_102',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'tin ceiling',
          aliases: ['ceiling', 'panels'],
          description: `The pressed tin ceiling panels are remarkably intact—stamped metal in a pattern of interlocking circles and flowers, painted cream that has yellowed to ivory over the decades. A few panels are dented where something hit them, but the overall effect remains impressive. Victorian-era buildings invested in their ceilings.`,
        },
        {
          prototype: 'describable',
          name: 'mail slots',
          aliases: ['slots', 'mail'],
          description: `Each office door has a brass mail slot, the kind designed for business correspondence in the days before email. The slots are stuffed with papers—bills and notices and marketing materials that accumulated after the last forwarding address expired. The papers are yellowed now, their urgency expired along with their recipients.`,
        },
      ],
    },

    '%SUITE_101': {
      name: 'Gargoyle Building - Suite 101 (Harbor Insurance)',
      description: `Harbor Insurance Company occupied this corner office—a small operation by the look of it, one reception area and one private office visible through a doorway. The aesthetic is 1960s corporate: wood paneling, acoustic tile ceiling, fluorescent lights that have long since burned out.

Filing cabinets line one wall, drawer labels reading ACTIVE CLAIMS, LAPSED POLICIES, PENDING INVESTIGATIONS. The insurance industry's paper trail, preserved in these drawers, claims for ships and cargo that sank or were damaged decades ago.

A maritime map covers one wall—Puget Sound, the Strait of Juan de Fuca, the Pacific coast from Alaska to California. Push pins mark locations, their meanings lost without the legend that explained them.`,
      x: -18,
      y: 12,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_1',
        north: '%SUITE_101_BACK',
      },
      sittables: [
        {
          name: 'a reception chair',
          capacity: 2,
          emptyMsg:
            'Vinyl reception chairs line the wall, the kind designed for uncomfortable waiting.',
          occupiedMsg: '%s waiting in a reception chair',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'reception desk',
          aliases: ['desk', 'counter'],
          description: `A reception desk with a sliding glass window—the barrier between clients and the business that served them. The window is open, frozen mid-slide. A sign on the counter reads "PLEASE TAKE A NUMBER." The number dispenser is empty.`,
        },
        {
          prototype: 'cabinet',
          name: 'filing cabinets',
          aliases: ['cabinets', 'files'],
          description: `Metal filing cabinets, grey and institutional, labeled with categories of insurance work: ACTIVE CLAIMS, LAPSED POLICIES, MARINE CASUALTIES. The drawers contain records of losses—ships that sank, cargo that was damaged, voyages that ended badly.`,
        },
        {
          prototype: 'describable',
          name: 'maritime map',
          aliases: ['map', 'chart'],
          description: `A large nautical chart covers one wall, showing Puget Sound and the approaches to Seattle's harbor. Push pins mark locations throughout the chart—some red, some blue, some yellow. The legend that explained the color coding is gone.`,
        },
      ],
    },

    '%SUITE_101_BACK': {
      name: 'Gargoyle Building - Suite 101 (Private Office)',
      description: `The insurance agent's private office—where the serious claims were discussed, the difficult conversations happened. The desk faces the door, the power position, a high-backed leather chair behind it. The chair is cracked and faded.

A window looks out over Yesler Way, the view framed by heavy drapes that are more dust than fabric at this point. The window is intact, the view unchanged from a century of occupants gazing out at the street below.

A safe sits in the corner, a squat iron box with a combination dial. The safe is locked, its contents unknown.`,
      x: -18,
      y: 11,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SUITE_101',
      },
      sittables: [
        {
          name: 'the executive chair',
          capacity: 1,
          emptyMsg:
            'A high-backed leather chair commands the room from behind the desk, its upholstery cracked with age.',
          occupiedMsg: '%s sitting in the executive chair',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'executive desk',
          aliases: ['desk'],
          description: `A substantial desk in dark wood, its surface covered in the debris of abandoned work: a desk blotter with notes in the margins, a pen set with dried-out pens, a calendar turned to a month that no longer matters.`,
        },
        {
          prototype: 'safe',
          name: 'office safe',
          aliases: ['safe', 'strongbox'],
          description: `A floor safe, maybe two feet on a side, with a combination dial and a brass handle. The safe is old—Victorian, probably installed when the building was new—but it still functions. The combination is unknown.`,
        },
      ],
    },

    '%SUITE_102': {
      name: 'Gargoyle Building - Suite 102 (Dental Office)',
      description: `Dr. Edward Chen, D.D.S. practiced dentistry in this suite—the equipment remains, frozen in time, a dental museum from the 1980s. The waiting room is small, just three chairs and a magazine rack, the magazines themselves long since decomposed into pulp.

A sliding window connects to the reception area, its glass clouded with age. Appointment cards are scattered on the counter, reminders for cleanings that never happened.

The sound system still has a cassette in it: EASY LISTENING FAVORITES. The kind of music meant to calm dental anxiety. The music stopped.`,
      x: -19,
      y: 12,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%HALL_1',
        north: '%EXAM_ROOM',
      },
      sittables: [
        {
          name: 'a waiting room chair',
          capacity: 3,
          emptyMsg:
            'Padded chairs in muted colors line the waiting area, designed for anxious patients.',
          occupiedMsg: '%s waiting nervously in a dental office chair',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'reception counter',
          aliases: ['counter', 'desk'],
          description: `A reception counter with a sliding glass window, appointment books open on the desk behind it. The books are filled with names and times, a schedule of dental work that was never performed.`,
        },
        {
          prototype: 'describable',
          name: 'cassette player',
          aliases: ['stereo', 'player', 'music'],
          description: `A small stereo system with a cassette deck, the kind that played soothing music to mask the sound of drills. A cassette is loaded: EASY LISTENING FAVORITES, the spine reads.`,
        },
      ],
    },

    '%EXAM_ROOM': {
      name: 'Gargoyle Building - Dental Exam Room',
      description: `The exam room is a time capsule of 1980s dentistry—a reclining chair in teal vinyl, an overhead light on an articulated arm, a tray of instruments that glint dully in the dim light. The instruments are clean but tarnished.

A poster on the wall shows the anatomy of a tooth, cross-sectioned and labeled in clinical detail. Another poster urges patients to BRUSH TWICE DAILY! with cartoon enthusiasm. The posters have faded to pastels.

The x-ray machine is mounted on its swing arm, its cone pointed at the empty chair. The last x-ray was taken years ago.`,
      x: -19,
      y: 11,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SUITE_102',
      },
      sittables: [
        {
          name: 'the dental chair',
          capacity: 1,
          emptyMsg:
            'A teal vinyl dental chair reclines at an angle, positioned under the overhead light.',
          occupiedMsg: '%s reclined in the dental chair',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'dental equipment',
          aliases: ['chair', 'equipment'],
          description: `A dental chair in teal vinyl, the kind that reclines patients into positions of vulnerability. The armrests are worn where thousands of nervous hands gripped them. The vinyl is cracked in places.`,
        },
        {
          prototype: 'describable',
          name: 'instrument tray',
          aliases: ['instruments', 'tools', 'tray'],
          description: `A tray of dental instruments: mirror, probe, scaler, excavator. The steel is tarnished but the edges are still sharp.`,
        },
        {
          prototype: 'describable',
          name: 'x-ray machine',
          aliases: ['xray', 'x-ray'],
          description: `A dental x-ray machine on a swing arm, its cone positioned to image the jaw of a patient who isn't here. The machine is old—the kind that required lead aprons.`,
        },
      ],
    },
  },
};
