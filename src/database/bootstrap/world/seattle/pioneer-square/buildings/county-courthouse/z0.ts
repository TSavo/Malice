// King County Courthouse - Ground Floor (z=0)
// Brutalist concrete tower, built 1960s, where justice was dispensed until it wasn't
// Records, courtrooms, and the machinery of law frozen in amber

export const building = {
  name: 'King County Courthouse',
  x: 8,
  y: 1,
  width: 3,
  height: 3,
  floors: 5,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN_LOCK': {
      prototype: 'lock',
      name: 'Courthouse Security Lock',
      description:
        'A heavy-duty magnetic lock, the kind that requires a keycard and a prayer. The card reader is dark.',
      difficulty: 5,
    },
    '%MAIN_DOOR': {
      prototype: 'door',
      name: 'Courthouse Entrance',
      description:
        'Glass doors in aluminum frames, the utilitarian aesthetic of government architecture. One door is propped open with a fire extinguisher—someone needed to get in or out and didn\'t care about security protocols.',
      locked: false,
      open: true,
      locks: ['%MAIN_LOCK'],
      material: 'glass',
      durability: 60,
    },

    '%RECORDS_LOCK': {
      prototype: 'lock',
      name: 'Records Room Lock',
      description:
        'A combination lock on a cage door, the kind used to protect files that mattered.',
      difficulty: 4,
    },
    '%RECORDS_DOOR': {
      prototype: 'door',
      name: 'Records Cage Door',
      description:
        'A chain-link cage door, the kind used in evidence rooms and file storage. The lock is intact but someone cut through the mesh.',
      locked: true,
      open: false,
      locks: ['%RECORDS_LOCK'],
      material: 'metal',
      durability: 40,
    },

    '%SERVICE_LOCK': {
      prototype: 'biometricLock',
      name: 'Staff Access Scanner',
      description:
        'A keycard reader beside the staff entrance. The LED is dead.',
      scanners: [
        { type: 'keycard', part: 'hand', message: 'Staff access only.' },
      ],
      authorizedUsers: {},
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - LOBBY AND PUBLIC SERVICES
    // ═══════════════════════════════════════════════════════════════════

    '%LOBBY': {
      name: 'King County Courthouse - Main Lobby',
      description: `The lobby of the King County Courthouse is a monument to 1960s civic architecture—poured concrete walls, terrazzo floors, a double-height ceiling that makes humans feel appropriately small before the machinery of law. The brutalist aesthetic was intentional: justice is serious business, the architecture says. No frivolity here.

A security checkpoint dominates the entrance, its X-ray conveyor frozen mid-scan, a forgotten briefcase still waiting to be examined. Metal detectors stand like sentinels, their lights dark, their purpose obsolete. The checkpoint was meant to keep weapons out of the courthouse. Whatever came next didn't use weapons that could be detected.

A directory board lists courtrooms by floor, judges by name, the taxonomy of justice. Department 1 through Department 12, each one a universe where lives were decided. The departments are empty now. The decisions unmade.

Wide stairs lead up to the courtroom floors. An elevator bank offers the same destination with less exercise.`,
      x: 9,
      y: 2,
      z: 0,
      imageOnDisk: 'king-county-courthouse-main-lobby-x9-y2-z0.png',
      population: 0,
      ambientNoise: 3,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: '3rd-ave-s/y2.ts',
          description: 'Glass doors lead to 3rd Ave S',
          door: '%MAIN_DOOR',
        },
        east: '%CLERKS_OFFICE',
        north: '%RECORDS_HALL',
        south: '%CAFETERIA',
        up: 'z1.ts#%STAIR_Z1',
      },
      sittables: [
        {
          name: 'waiting benches',
          capacity: 8,
          emptyMsg:
            'Rows of wooden benches line the walls, worn smooth by decades of anxious waiting.',
          occupiedMsg: '%s waiting on a courthouse bench',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'security checkpoint',
          aliases: ['checkpoint', 'security', 'metal detector'],
          description: `The security checkpoint is frozen in time—X-ray machine humming silently (or not at all, the power is uncertain), metal detector arch standing ready, a plastic bin containing someone's keys and belt and pocket change. The briefcase on the conveyor was never claimed. Its owner never came back for it.`,
        },
        {
          prototype: 'describable',
          name: 'court directory',
          aliases: ['directory', 'board'],
          description: `A wall-mounted directory lists the courthouse's departments:

FLOOR 1: Clerk's Office, Records, Cafeteria
FLOOR 2: Departments 1-4 (Criminal)
FLOOR 3: Departments 5-8 (Civil)
FLOOR 4: Departments 9-12 (Family Court)
FLOOR 5: Judge's Chambers, Law Library

The directory is accurate. The departments are empty. The distinction between criminal and civil has lost its meaning.`,
        },
        {
          prototype: 'describable',
          name: 'concrete walls',
          aliases: ['walls', 'concrete'],
          description: `Poured concrete walls, their surfaces showing the grain of the forms that shaped them. The brutalist aesthetic was a statement: government is solid, permanent, unyielding. The walls remain. The government they represented is less certain.`,
        },
      ],
    },

    '%CLERKS_OFFICE': {
      name: 'King County Courthouse - Clerk\'s Office',
      description: `The County Clerk's office processed the paperwork of justice—filing fees, court dates, the bureaucratic infrastructure that turned disputes into cases and cases into records. The counter separates staff from public, a barrier of laminate and institutional distrust.

Behind the counter, desks are arranged in the open-plan style that someone thought promoted efficiency. Stacks of files cover every surface—cases pending, cases filed, cases that will never be resolved. The filing system made sense to someone. That someone is gone.

A sign-in sheet lies on the counter, the last entries dated months ago. People came here to file motions, request continuances, navigate the labyrinth. The labyrinth remains. The Minotaur is just neglect.`,
      x: 10,
      y: 2,
      z: 0,
      imageOnDisk: 'king-county-courthouse-clerk-s-office-x10-y2-z0.png',
      population: 0,
      ambientNoise: 2,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LOBBY',
        north: '%RECORDS_ROOM',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'service counter',
          aliases: ['counter'],
          description: `A long laminate counter with brass rails and signs explaining fees and procedures. FILING FEE: $200. CERTIFIED COPIES: $5/PAGE. The fees were important once—revenue for the county, barriers to frivolous litigation. The fees are meaningless now. The barriers remain.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'pending files',
          aliases: ['files', 'cases', 'paperwork'],
          description: `Stacks of manila folders covering every desk surface, each one a case that someone cared about enough to file. Divorce petitions, contract disputes, personal injury claims—the spectrum of human conflict rendered in paperwork. The conflicts persist. The paperwork just documents them.`,
        },
        {
          prototype: 'describable',
          name: 'sign-in sheet',
          aliases: ['sheet', 'log'],
          description: `A clipboard with a sign-in sheet, the last page half-filled with names and times. "Martinez, 9:15 AM - Filing Response." "Chen, 10:30 AM - Request Continuance." The log ends mid-day. No one signed out.`,
        },
      ],
    },

    '%RECORDS_HALL': {
      name: 'King County Courthouse - Records Hall',
      description: `A corridor leading to the county's central records repository—property deeds, court filings, the paper trail of civilization. The hall is lined with portraits of judges past, their robes and gavels and stern expressions watching over the passage to the archives.

The portraits are dusty now, their gilt frames tarnished, but the judges still preside. Judge Harrison, 1952-1978. Judge Nakamura, 1985-2003. The dates are carved into brass plaques. The judges dispensed justice for decades. Justice outlasted them. Then it didn't.

A drinking fountain protrudes from one wall, its basin dry, its chrome spotted with mineral deposits. The fountain stopped when the water pressure dropped. Or when someone turned it off. The mechanism remains, waiting for water that won't flow.`,
      x: 9,
      y: 3,
      z: 0,
      imageOnDisk: 'king-county-courthouse-records-hall-x9-y3-z0.png',
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%LOBBY',
        east: '%RECORDS_ROOM',
        north: {
          to: 'z-1.ts#%BASEMENT_STAIRS',
          description: 'Stairs descend to the basement archives',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'judicial portraits',
          aliases: ['portraits', 'paintings', 'judges'],
          description: `Oil portraits of judges who served on this bench, their expressions conveying the seriousness expected of the role. Judge William Harrison presides from the largest frame, his tenure spanning three decades. The judges are all dead now—some before the Event, some after. Their portraits survive.`,
        },
        {
          prototype: 'describable',
          name: 'drinking fountain',
          aliases: ['fountain', 'water'],
          description: `A stainless steel drinking fountain, the kind found in every public building. The basin is dry, mineral deposits marking the water line. The button still clicks when pressed. Nothing happens. The infrastructure that fed the fountain—pipes, pumps, treatment plants—requires more maintenance than it's receiving.`,
        },
      ],
    },

    '%RECORDS_ROOM': {
      name: 'King County Courthouse - Records Room',
      description: `The county records room—rows of filing cabinets containing property deeds, court judgments, the documentary evidence of ownership and obligation. A chain-link cage protects the most sensitive files, its mesh cut open by someone who needed something specific.

The room smells of old paper and newer decay—water damage in one corner has turned files into pulp. The damage is spreading slowly, entropy claiming records that once determined who owned what. The abstracts of title are becoming abstract. The chains of ownership are breaking.

Someone was here recently—drawers left open, files scattered on the floor. They were looking for something. Whether they found it is unclear from the mess.`,
      x: 10,
      y: 3,
      z: 0,
      imageOnDisk: 'king-county-courthouse-records-room-x10-y3-z0.png',
      population: 0,
      ambientNoise: 0,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%RECORDS_HALL',
        south: '%CLERKS_OFFICE',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'property records',
          aliases: ['deeds', 'titles', 'records'],
          description: `Filing cabinets labeled by parcel number—the geographic index of ownership. Each drawer contains deeds, easements, liens, the layers of claims that accumulate on property over decades. The records go back to the 1850s, the original land grants, the foundation of all subsequent ownership. Foundation is the right word. The ownership it represents is crumbling.`,
        },
        {
          prototype: 'cabinet',
          name: 'court judgments',
          aliases: ['judgments', 'rulings', 'files'],
          description: `Cabinets of court judgments—the official record of who won and who lost, who owed what to whom. The judgments were enforceable once, backed by sheriffs and marshals and the threat of contempt. The enforcement mechanism is gone. The judgments remain, toothless but documented.`,
        },
        {
          prototype: 'describable',
          name: 'water damage',
          aliases: ['damage', 'mold', 'decay'],
          description: `A corner of the room shows significant water damage—files turned to pulp, mold spreading across cabinet surfaces. The roof is leaking somewhere. The building is slowly returning its contents to nature. The process cannot be stopped, only delayed. No one is delaying it.`,
        },
      ],
    },

    '%CAFETERIA': {
      name: 'King County Courthouse - Cafeteria',
      description: `The courthouse cafeteria fed attorneys and defendants, jurors and judges, the whole ecosystem of the legal system. The serving line is frozen mid-service—trays stacked, sneeze guards in place, the day's specials written on a whiteboard in handwriting that tried to make institutional food sound appetizing.

MONDAY: SALISBURY STEAK, MASHED POTATOES, GREEN BEANS
TUESDAY: CHICKEN POT PIE, SALAD BAR
WEDNESDAY: FISH FILLET, RICE PILAF

The food is long gone—eaten, rotted, or removed. The menu remains, a record of the last week anyone thought about feeding courthouse workers.

Tables and chairs fill the room in institutional rows, their plastic surfaces easy to clean, their ergonomics indifferent to comfort. Vending machines line one wall, their glass fronts showing snacks that have outlasted their expiration dates.`,
      x: 9,
      y: 1,
      z: 0,
      imageOnDisk: 'king-county-courthouse-cafeteria-x9-y1-z0.png',
      population: 0,
      ambientNoise: 2,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LOBBY',
        east: '%KITCHEN',
      },
      sittables: [
        {
          name: 'cafeteria tables',
          capacity: 12,
          emptyMsg:
            'Rows of institutional tables fill the room, their attached benches designed for function rather than comfort.',
          occupiedMsg: '%s at a cafeteria table',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'menu board',
          aliases: ['menu', 'whiteboard', 'specials'],
          description: `A whiteboard listing the week's specials in dry-erase marker that has become permanent. The menu suggests a rotation that repeated endlessly—Salisbury steak on Monday, chicken pot pie on Tuesday, the reliable rhythm of institutional cooking. The rhythm stopped. The menu preserves its last beat.`,
        },
        {
          prototype: 'cabinet',
          name: 'vending machines',
          aliases: ['vending', 'snacks'],
          description: `A row of vending machines—snacks, sodas, coffee. The snacks are still visible through the glass, their packaging faded but intact. The chips have probably gone stale. The chocolate has probably bloomed. The machines still work if you have power and coins, neither of which is guaranteed.`,
        },
        {
          prototype: 'describable',
          name: 'serving line',
          aliases: ['line', 'counter', 'steam table'],
          description: `The cafeteria serving line, its steam tables empty, its sneeze guards still in place. Stacks of trays wait at one end, plastic-wrapped silverware at the other. The infrastructure of feeding hundreds of people remains. The hundreds of people do not.`,
        },
      ],
    },

    '%KITCHEN': {
      name: 'King County Courthouse - Kitchen',
      description: `The commercial kitchen that fed the courthouse—stainless steel surfaces, industrial appliances, the infrastructure of mass food production. The space is cleaner than expected, someone having removed perishables before they could rot. Or perhaps the health inspector made one last visit before health inspections ended.

Walk-in refrigerators stand with doors ajar, their compressors silent, their interiors dark and empty. A commercial dishwasher holds a rack of plates, never run, never unloaded. The dishwasher was waiting for water and power and someone to press the button. The waiting continues.

A back door leads to the loading dock, where supplies were once delivered and garbage removed. The door is secured with a biometric lock that has forgotten all its authorized users.`,
      x: 10,
      y: 1,
      z: 0,
      imageOnDisk: 'king-county-courthouse-kitchen-x10-y1-z0.png',
      population: 0,
      ambientNoise: 3,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%CAFETERIA',
        south: {
          to: null,
          description: 'A service door leads to the loading dock',
          locks: ['%SERVICE_LOCK'],
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'commercial stove',
          aliases: ['stove', 'range', 'burners'],
          description: `A commercial gas range, six burners and a griddle and two ovens. The burners are clean, the griddle scraped, the ovens empty. The range could still cook if someone brought fuel and food and the knowledge of how to use it. The range waits, patient, its pilot lights extinguished.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'walk-in refrigerator',
          aliases: ['refrigerator', 'cooler', 'walk-in'],
          description: `A walk-in refrigerator, its heavy door standing open, its interior dark and empty. Someone cleaned it out before the power failed, or perhaps during the process. The shelves are bare. The compressor is silent. The walk-in is just a small room now, its purpose ended.`,
        },
        {
          prototype: 'furniture',
          name: 'commercial dishwasher',
          aliases: ['dishwasher'],
          description: `A commercial dishwasher, the kind that can blast clean a hundred plates in an hour. A rack of plates sits inside, loaded but never run. The plates are dusty now, their need for washing moot. The dishwasher holds them in limbo between dirty and clean.`,
          boltedDown: true,
        },
      ],
    },
  },
};
