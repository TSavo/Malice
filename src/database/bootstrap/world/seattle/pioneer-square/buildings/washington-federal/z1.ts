// Washington Federal Bank - Second Floor (z=1)
// Executive offices and conference rooms
// Where the real decisions were made

export const building = {
  name: 'Washington Federal Bank',
  x: -1,
  y: -2,
  width: 2,
  height: 2,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%EXEC_SUITE_LOCK': {
      prototype: 'biometricLock',
      name: 'Executive Suite Scanner',
      description:
        'A keycard reader beside the frosted glass doors. The LED is dark, the battery backup exhausted.',
      scanners: [
        { type: 'keycard', part: 'hand', message: 'Executive access required.' },
      ],
      authorizedUsers: {},
    },
    '%EXEC_SUITE_DOOR': {
      prototype: 'door',
      name: 'Executive Suite Doors',
      description:
        'Frosted glass double doors etched with the bank\'s logo. The electronic lock is dead, but the doors are wedged shut from inside.',
      locked: true,
      open: false,
      locks: ['%EXEC_SUITE_LOCK'],
      material: 'glass',
      durability: 45,
    },

    '%RECORDS_LOCK': {
      prototype: 'lock',
      name: 'Records Room Lock',
      description: 'A heavy-duty deadbolt on the records room door.',
      difficulty: 5,
    },
    '%RECORDS_DOOR': {
      prototype: 'door',
      name: 'Records Room Door',
      description:
        'A solid metal door marked "RECORDS - AUTHORIZED PERSONNEL ONLY." The door is designed for security, not aesthetics.',
      locked: true,
      open: false,
      locks: ['%RECORDS_LOCK'],
      material: 'metal',
      durability: 85,
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - EXECUTIVE LEVEL
    // ═══════════════════════════════════════════════════════════════════

    '%STAIRWELL_1': {
      name: 'Washington Federal - Stairwell (2nd Floor)',
      description: `The stairwell continues between floors, the same utilitarian construction as below. A landing window offers a view of the air shaft—grey walls, grey light, a pigeon that has made its nest on a ledge and stares at intruders with territorial hostility.

The door to the executive floor is marked with brass letters: EXECUTIVE OFFICES. The door has a keycard reader, its light dark, its battery backup exhausted years ago. Someone has wedged the door frame with a piece of wood, keeping it closed without the electronic lock.

Above, the stairs continue to the roof access.`,
      x: -1,
      y: -1,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z0.ts#STAIRWELL',
        up: 'z2.ts#ROOF_ACCESS',
        east: {
          description: 'Frosted glass doors lead to the executive suite',
          door: '%EXEC_SUITE_DOOR',
          to: '%EXEC_RECEPTION',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'landing window',
          aliases: ['window', 'airshaft'],
          description: `A small window looking onto the building's air shaft—a narrow vertical space designed for ventilation and light, succeeding at neither. A pigeon has built a nest on the opposite ledge and watches anyone who approaches the window with the alert hostility of urban wildlife.`,
        },
      ],
    },

    '%EXEC_RECEPTION': {
      name: 'Washington Federal - Executive Reception',
      description: `The executive floor's reception area—a smaller, more intimate version of the grand banking hall below. The furniture here is real leather, real wood, designed to make visitors feel important while they waited to see people who actually were. A reception desk of polished granite holds a phone console, a visitor log, and a vase of flowers that have long since dessicated into something botanical and sad.

The walls display the same motivational art found in offices everywhere—abstract prints in corporate colors, landscapes that offend no one, the visual equivalent of elevator music. A flat-screen TV, now dark, once showed market updates and financial news.

Doors lead to the conference room and the executive offices beyond. The carpet is plush enough to silence footsteps. The silence is complete.`,
      x: 0,
      y: -1,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%STAIRWELL_1',
        south: '%CONFERENCE',
        east: '%EXEC_HALL',
      },
      sittables: [
        {
          name: 'leather waiting chairs',
          capacity: 4,
          emptyMsg:
            'Leather chairs are arranged around a glass coffee table, positioned for waiting.',
          occupiedMsg: '%s waiting in the leather chairs',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'reception desk',
          aliases: ['desk', 'granite desk'],
          description: `A curved reception desk of polished grey granite, designed to impress visitors before they even met the executives. A multi-line phone console sits silent, its buttons labeled with extensions for people who no longer answer. A leather-bound visitor log lies open, the last signatures dated months before the world changed. Someone named "J. Morrison" had a 2:30 with the VP of Commercial Lending. They never arrived.`,
        },
        {
          prototype: 'describable',
          name: 'dead flowers',
          aliases: ['flowers', 'vase'],
          description: `A crystal vase holds what were once flowers—now dried stalks and brittle petals, a still life of decay in an expensive container. The water evaporated long ago, leaving a ring of mineral deposits. Someone used to replace these flowers weekly. That someone is gone. The flowers remain.`,
        },
        {
          prototype: 'describable',
          name: 'market screen',
          aliases: ['tv', 'screen', 'television'],
          description: `A large flat-screen TV mounted on the wall, its screen dark. The TV once displayed CNBC or Bloomberg—stock tickers scrolling, talking heads discussing interest rates, the constant churn of financial information. The information stopped. The screen reflects the empty room.`,
        },
      ],
    },

    '%CONFERENCE': {
      name: 'Washington Federal - Boardroom',
      description: `The bank's main conference room—a space designed for serious meetings about serious money. A long mahogany table dominates the room, surrounded by high-backed leather chairs, each place setting still equipped with a notepad and pen bearing the bank's logo. A speakerphone spider crouches at the center of the table, its lights dark.

Floor-to-ceiling windows offer a view of 2nd Avenue below, the glass tinted to reduce glare on the presentation screen at the far end. The presentation screen still displays the last PowerPoint—quarterly earnings, projected growth, charts that slope optimistically upward. The quarter never ended. The growth never happened.

A sidebar holds coffee carafes and water pitchers, the contents long since evaporated or grown strange things. A whiteboard on one wall is covered with handwritten notes in dry-erase marker, the strategic planning of people who could not have planned for this.`,
      x: 0,
      y: -2,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%EXEC_RECEPTION',
      },
      sittables: [
        {
          name: 'boardroom chairs',
          capacity: 12,
          emptyMsg:
            'High-backed leather chairs surround the conference table, each position set with notepad and pen.',
          occupiedMsg: '%s seated at the boardroom table',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'conference table',
          aliases: ['table', 'boardroom table'],
          description: `A massive mahogany conference table, long enough to seat twelve executives in the high-backed chairs that surround it. Each place has a leather-edged notepad embossed with the bank's logo, a branded pen, a coaster for drinks that were never poured. A speakerphone occupies the center, its console dark, its last conference call permanently on hold.`,
        },
        {
          prototype: 'describable',
          name: 'presentation screen',
          aliases: ['screen', 'projector', 'powerpoint'],
          description: `A large screen at the end of the room still displays a frozen PowerPoint presentation: "Q3 FINANCIAL RESULTS - EXCEEDING EXPECTATIONS." The charts show growth curves, the bullet points promise continued success, the corporate language is optimistically vague. The presentation was never completed. The expectations were never met.`,
        },
        {
          prototype: 'describable',
          name: 'whiteboard',
          aliases: ['board', 'notes'],
          description: `A whiteboard covered with the residue of strategic planning—circles and arrows, bullet points, acronyms that made sense to someone. "EXPAND SMB LENDING," "Q4 TARGETS: +15%," "COMPETITOR ANALYSIS (SEE HANDOUT)." The dry-erase marker has faded but remains legible. The strategy remains unexecuted.`,
        },
        {
          prototype: 'describable',
          name: 'boardroom windows',
          aliases: ['windows', 'view'],
          description: `Floor-to-ceiling windows with a tinted film to reduce glare, offering a view of 2nd Avenue three floors below. The street is empty now, the view unchanged from when it showed traffic and pedestrians and the ordinary life of a city. The executives who sat here watched the city without seeing it. Now no one watches at all.`,
        },
      ],
    },

    '%EXEC_HALL': {
      name: 'Washington Federal - Executive Hallway',
      description: `A carpeted corridor connecting the executive offices—the plush pathway where the bank's leadership walked between meetings and decisions and the subtle exercise of financial power. Portraits line the walls: past presidents and chairmen, their faces serious, their suits dark, their names brass-plaqued beneath frames that cost more than most people's cars.

The executives' assistants sat in alcoves along the hall, their desks positioned to intercept visitors and manage access. The desks are neat, organized, awaiting assistants who will never return. Family photos sit next to computer monitors, personal touches in a professional space.

Doors at the end of the hall lead to the corner office—the largest, the brightest, the most impressive. Other doors lead to smaller offices, a hierarchy expressed in square footage and window access.`,
      x: 0,
      y: -3,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%EXEC_RECEPTION',
        south: '%CORNER_OFFICE',
        north: '%RECORDS',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'executive portraits',
          aliases: ['portraits', 'paintings', 'pictures'],
          description: `Oil portraits of past bank presidents line the walls, each face rendered in the same serious pose, the same dark suit, the same expression of fiduciary responsibility. Brass plates beneath each frame list names and dates: "WILLIAM J. HARTLEY, PRESIDENT 1962-1978," "MARGARET O'BRIEN, CHAIRMAN 1998-2011." The faces watch the empty hallway with painted eyes that see nothing.`,
        },
        {
          prototype: 'desk',
          name: 'assistant desks',
          aliases: ['desks', 'workstations'],
          description: `Alcoves along the hallway contain the assistants' workstations—smaller desks than the executives', but still substantial. Each desk has a computer, a phone, a photo of family or pets or places. The assistants managed the executives' schedules, filtered their calls, protected their time. The protection continues. There is no one left to protect.`,
        },
      ],
    },

    '%CORNER_OFFICE': {
      name: 'Washington Federal - Regional VP Office',
      description: `The corner office—the apex of the local hierarchy, the largest and brightest space on the executive floor. Two walls of windows offer views in two directions: 2nd Avenue to the east, the cross street to the south. The desk is positioned to put visitors with their backs to the light, a subtle power move built into the architecture.

The office belongs—belonged—to the Regional Vice President. The nameplate on the desk reads "PATRICIA CHEN, REGIONAL VP - PACIFIC NORTHWEST." Her diploma from Stanford hangs on the wall. Her MBA from Wharton beside it. Her family photos are face-down on the credenza.

The desk is obsessively clean, every item aligned, every surface dust-free. Patricia Chen ran a tight operation. The operation ended. The tidiness persists.`,
      x: 0,
      y: -4,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%EXEC_HALL',
      },
      sittables: [
        {
          name: 'executive chair',
          capacity: 1,
          emptyMsg:
            'A Herman Miller Aeron chair sits behind the desk, adjusted to Patricia Chen\'s specifications.',
          occupiedMsg: '%s in the executive chair',
        },
        {
          name: 'guest chairs',
          capacity: 2,
          emptyMsg:
            'Two sleek guest chairs face the desk, positioned with their backs to the windows.',
          occupiedMsg: '%s in the guest chair',
        },
        {
          name: 'leather sofa',
          capacity: 3,
          emptyMsg:
            'A leather sofa occupies a sitting area by the windows, for informal meetings.',
          occupiedMsg: '%s on the executive sofa',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'executive desk',
          aliases: ['desk', 'patricia\'s desk'],
          description: `A sleek modern desk, all glass and chrome, positioned for maximum intimidation. A slim laptop sits closed on the surface. A brass nameplate reads "PATRICIA CHEN." The desk is immaculately organized—pen holder, inbox, outbox, everything at right angles. The inbox is empty. The outbox holds documents that will never be sent.`,
        },
        {
          prototype: 'cabinet',
          name: 'credenza',
          aliases: ['cabinet', 'sideboard'],
          description: `A low credenza along the wall holds the personal effects of executive life: framed diplomas (Stanford, Wharton), industry awards, photos of family that have been deliberately turned face-down. Patricia Chen was accomplished. Patricia Chen had a family. Patricia Chen did not want to look at their faces anymore.`,
        },
        {
          prototype: 'describable',
          name: 'corner windows',
          aliases: ['windows', 'view'],
          description: `Two walls of floor-to-ceiling windows meet at the corner, offering panoramic views of 2nd Avenue and the cross street. The view was the reward for climbing the corporate ladder—a reminder that you had made it, that you mattered, that your office was bigger than everyone else's. The view remains. The ladder is broken.`,
        },
      ],
    },

    '%RECORDS': {
      name: 'Washington Federal - Records Room',
      description: `The bank's records room—a climate-controlled vault for documents too important to digitize, too sensitive to discard. Filing cabinets line the walls from floor to ceiling, their drawers labeled with years and categories: MORTGAGES, COMMERCIAL LOANS, TRUST ACCOUNTS, ESTATES.

The room smells of old paper and the particular mustiness of archived information. A single desk sits in the center, equipped with a lamp and a magnifying glass for examining documents. A rolling ladder provides access to the highest shelves.

The records here span decades of financial transactions—births and deaths expressed in debits and credits, lives summarized in account numbers and interest rates. The records are complete, organized, utterly meaningless.`,
      x: 0,
      y: 0,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          description: 'A metal door leads back to the executive hallway',
          door: '%RECORDS_DOOR',
          to: '%EXEC_HALL',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'filing cabinets',
          aliases: ['cabinets', 'files', 'records'],
          description: `Floor-to-ceiling filing cabinets, each drawer labeled with years and categories. The organization is meticulous—someone spent a career maintaining this archive, ensuring every document could be found. MORTGAGES 2015-2020. COMMERCIAL LOANS 2010-2015. ESTATES (A-M). The documents are still here, still organized, still retrievable. No one will ever retrieve them.`,
        },
        {
          prototype: 'desk',
          name: 'records desk',
          aliases: ['desk', 'worktable'],
          description: `A metal desk in the center of the room, equipped with an adjustable lamp and a magnifying glass—tools for examining documents, for verifying signatures, for the careful work of records management. A stack of files sits on the desk, mid-review, the review never completed. The top file is marked CONFIDENTIAL in red ink.`,
        },
        {
          prototype: 'furniture',
          name: 'rolling ladder',
          aliases: ['ladder'],
          description: `A wooden rolling ladder on a brass rail, providing access to the highest shelves. The ladder is library-style, the kind that looks elegant until you have to climb it in dress shoes. The highest shelves hold the oldest records—documents from decades past, financial archaeology that someone thought worth preserving.`,
        },
      ],
    },
  },

  postProcessors: [],
};
