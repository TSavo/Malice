// Gargoyle Building - Second Floor (z=2)
// Victorian-era offices: Suite 201-204 (Hendricks & Associates, Pacific Maritime Insurance)

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

    '%SUITE_201_LOCK': {
      prototype: 'rentableLock',
      name: 'Suite 201 Lock',
      description:
        'A brass lock with a tarnished plate reading "201". The mechanism shows wear from decades of use.',
      difficulty: 4,
    },
    '%SUITE_201_DOOR': {
      prototype: 'door',
      name: 'Suite 201 Door',
      description:
        'A solid wood door with a frosted glass panel. "HENDRICKS & ASSOCIATES - ATTORNEYS AT LAW" in faded gold lettering.',
      locked: true,
      open: false,
      locks: ['%SUITE_201_LOCK'],
      material: 'wood',
      durability: 70,
    },

    '%SUITE_203_LOCK': {
      prototype: 'rentableLock',
      name: 'Suite 203 Lock',
      description:
        'A brass lock with a heavily tarnished plate. This suite saw more traffic than most.',
      difficulty: 4,
    },
    '%SUITE_203_DOOR': {
      prototype: 'door',
      name: 'Suite 203 Door',
      description:
        'A wooden door with frosted glass. "PACIFIC MARITIME INSURANCE" is etched into the glass itself.',
      locked: false,
      open: true,
      locks: ['%SUITE_203_LOCK'],
      material: 'wood',
      durability: 65,
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=2) - OFFICES
    // ═══════════════════════════════════════════════════════════════════

    '%HALL_2': {
      name: 'Gargoyle Building - Second Floor Hall',
      description: `The second floor shows more wear than the first—the tin ceiling has water stains spreading from multiple points, rust bleeding through the decorative pattern like disease through tissue. The wallpaper peels in strips, revealing earlier layers beneath: roses over stripes over plain paint, the building's cosmetic history exposed.

The staircase continues both up and down, the cast iron rails still solid despite the neglect. A fire extinguisher hangs on the wall, its gauge reading empty, its last inspection sticker dated from before everything ended.

Suite numbers run 201 through 204, the same configuration as the floor below. Some doors stand open. Others remain sealed, their frosted glass transoms dark, their contents undisturbed.`,
      x: -18,
      y: 12,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z1.ts#HALL_1',
        up: '%HALL_3',
        east: {
          description: 'A frosted glass door leads to Suite 201',
          door: '%SUITE_201_DOOR',
          to: '%SUITE_201',
        },
        west: {
          description: 'A frosted glass door stands open to Suite 203',
          door: '%SUITE_203_DOOR',
          to: '%SUITE_203',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'peeling wallpaper',
          aliases: ['wallpaper', 'walls'],
          description: `The wallpaper peels in long strips, revealing the archaeological layers beneath: a floral pattern over stripes over plain cream paint. Each layer represents a renovation, an attempt to modernize or refresh or simply maintain. The maintenance stopped. The layers continue to reveal themselves.`,
        },
        {
          prototype: 'describable',
          name: 'fire extinguisher',
          aliases: ['extinguisher'],
          description: `A fire extinguisher hangs on the wall, its red paint faded to pink, its gauge reading EMPTY. The inspection tag shows a date from years ago, the last time someone verified it worked. It doesn't work now. If there's a fire, there's a fire.`,
        },
      ],
    },

    '%SUITE_201': {
      name: 'Gargoyle Building - Suite 201 (Law Office)',
      description: `Hendricks & Associates practiced law from this suite—the name suggests a firm, but the space suggests a solo practitioner with ambitions. A reception area leads to a single office, the layout cramped but professional.

Law books line one wall, their spines showing the familiar titles of Washington state legal codes. The books are current through whenever the subscription lapsed, their contents still technically accurate even if the courts that applied them no longer function.

A framed law degree hangs behind the desk: UNIVERSITY OF WASHINGTON SCHOOL OF LAW, CLASS OF 1982. Mr. or Ms. Hendricks practiced law for decades before the practice ended.`,
      x: -18,
      y: 12,
      z: 2,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_2',
        north: '%SUITE_201_PRIVATE',
      },
      sittables: [
        {
          name: 'a client chair',
          capacity: 2,
          emptyMsg:
            'Leather client chairs face the reception desk, positioned for waiting.',
          occupiedMsg: '%s waiting in a client chair',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'reception desk',
          aliases: ['desk'],
          description: `A reception desk for the secretary who scheduled appointments and managed the front office. The desk is covered in the usual debris: appointment book, telephone, a jar of hard candies turned to solid mass. The secretary is gone. The desk remains.`,
        },
        {
          prototype: 'cabinet',
          name: 'law books',
          aliases: ['books', 'library'],
          description: `Floor-to-ceiling shelves of legal volumes: WASHINGTON PRACTICE, REVISED CODE OF WASHINGTON, CIVIL PROCEDURE. The books represent years of accumulated knowledge, bought volume by volume as the practice grew. The knowledge is still valid. The practice is not.`,
        },
      ],
    },

    '%SUITE_201_PRIVATE': {
      name: 'Gargoyle Building - Suite 201 (Attorney Office)',
      description: `The attorney's private office—where the privileged communications happened, where the legal advice was dispensed, where the fees were negotiated. The desk is substantial, the chair high-backed, the aesthetic meant to convey competence and trustworthiness.

Case files are stacked on every surface, the paper trail of legal work in progress when the work stopped. Folders are labeled with client names and matter numbers, the organizational system of a practice that processed dozens of cases at once.

A window looks out over Yesler Way, the view unchanged from a century of attorneys gazing out while clients waited for counsel.`,
      x: -18,
      y: 11,
      z: 2,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SUITE_201',
      },
      sittables: [
        {
          name: 'the attorney chair',
          capacity: 1,
          emptyMsg:
            'A high-backed leather chair sits behind the desk, positioned for authority.',
          occupiedMsg: '%s seated in the attorney chair',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'attorney desk',
          aliases: ['desk'],
          description: `A substantial desk in dark wood, its surface buried under case files and legal pads. A brass nameplate reads "M. HENDRICKS, ESQ." The desk has seen decades of legal work—contracts reviewed, depositions prepared, settlements negotiated. The work stopped mid-case.`,
        },
        {
          prototype: 'cabinet',
          name: 'case files',
          aliases: ['files', 'folders'],
          description: `Stacks of case files everywhere—on the desk, on the credenza, in boxes on the floor. Each folder represents a legal matter: "SMITH v. JOHNSON - PROPERTY DISPUTE," "IN RE: ESTATE OF CHEN," "CONTINUUM CORP. - EMPLOYMENT CONTRACT." The cases were never resolved. The files preserve the arguments that would have been made.`,
        },
        {
          prototype: 'describable',
          name: 'law degree',
          aliases: ['degree', 'diploma'],
          description: `A framed law degree hangs on the wall: UNIVERSITY OF WASHINGTON SCHOOL OF LAW, CLASS OF 1982. The degree certified M. Hendricks to practice law in the State of Washington. The certification remains valid. The practice does not.`,
        },
      ],
    },

    '%SUITE_203': {
      name: 'Gargoyle Building - Suite 203 (Maritime Insurance)',
      description: `Pacific Maritime Insurance handled marine risks from this corner office—two walls of windows offered views of the city and, on clear days, glimpses of the waterfront that generated the business. The office is larger than those on the first floor, the premium space justifying higher rent.

Ship models line the shelves, their brass plates identifying vessels the company insured: M/V PACIFIC TRADER, S/S OLYMPIC CARRIER, F/V NORTHERN STAR. Some of these ships sank. The models survived.

The door to the office stands open, the lock intact but unused, as if someone stepped out for coffee and never returned.`,
      x: -19,
      y: 12,
      z: 2,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%HALL_2',
        north: '%SUITE_203_BACK',
      },
      sittables: [
        {
          name: 'a conference chair',
          capacity: 4,
          emptyMsg:
            'Leather chairs surround a conference table, positioned for meetings about maritime risk.',
          occupiedMsg: '%s seated at the maritime conference table',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'conference table',
          aliases: ['table'],
          description: `A mahogany conference table dominates the room, its surface covered with maritime charts and documents. The table was where risks were assessed, premiums calculated, policies written for ships that would sail into storms and return—or not.`,
        },
        {
          prototype: 'cabinet',
          name: 'ship models',
          aliases: ['models', 'ships'],
          description: `Scale models of ships line the shelves, each one a vessel the company insured. Brass plates identify them: M/V PACIFIC TRADER, S/S OLYMPIC CARRIER, F/V NORTHERN STAR. The models are beautifully detailed, their rigging intact, their hulls polished. Some of the ships they represent sank to the bottom of the Pacific. The models remain afloat.`,
        },
        {
          prototype: 'describable',
          name: 'corner windows',
          aliases: ['windows', 'view'],
          description: `Two walls of windows meet at the corner, offering a panoramic view that includes a slice of Elliott Bay on clear days. The windows are grimy but intact. The waterfront that generated the company's business is still visible, the piers rotting, the ships that once called here mostly gone.`,
        },
      ],
    },

    '%SUITE_203_BACK': {
      name: 'Gargoyle Building - Suite 203 (Underwriter Office)',
      description: `The underwriter's office—where the actuarial calculations happened, where risk was quantified and priced. The desk is covered in tables and charts, the mathematics of maritime insurance preserved in paper form.

An adding machine sits on the desk, the mechanical kind with a hand crank, its tape still loaded with numbers from the last calculation. The numbers predicted something about risk and probability. The predictions were made before everything became unpredictable.

Filing cabinets line the wall, their drawers labeled by year and policy type. The records of insured vessels, from the company's founding through its final policy.`,
      x: -19,
      y: 11,
      z: 2,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SUITE_203',
      },
      sittables: [
        {
          name: 'the underwriter chair',
          capacity: 1,
          emptyMsg:
            'A wooden swivel chair sits at the calculating desk, positioned for actuarial work.',
          occupiedMsg: '%s seated at the underwriter desk',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'calculating desk',
          aliases: ['desk'],
          description: `A desk covered in actuarial tables and risk calculations, the mathematics of maritime insurance in paper form. Mortality tables for ships. Loss ratios by route. Premium schedules by cargo type. The numbers made sense once. They still make mathematical sense. They no longer predict anything.`,
        },
        {
          prototype: 'describable',
          name: 'adding machine',
          aliases: ['calculator', 'machine'],
          description: `A mechanical adding machine with a hand crank, its paper tape still loaded with a strip of numbers from the last calculation. The numbers cascade down the tape in the rhythm of actuarial work: add, subtotal, multiply, total. The final answer is printed at the bottom. Whatever question it answered is forgotten.`,
        },
        {
          prototype: 'cabinet',
          name: 'policy files',
          aliases: ['files', 'cabinets'],
          description: `Filing cabinets labeled by year and policy type: HULL INSURANCE 2018, CARGO CLAIMS 2019, VESSEL TOTAL LOSSES. The records of every ship the company insured, every cargo covered, every loss paid. The maritime history of the Pacific Northwest, preserved in manila folders.`,
        },
      ],
    },
  },
};
