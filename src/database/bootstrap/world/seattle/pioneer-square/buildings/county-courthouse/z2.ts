// King County Courthouse - Second Floor (z=2)
// Civil Courtrooms (Departments 5-8)

export const building = {
  rooms: {
    '%STAIR_Z2': {
      name: 'King County Courthouse - Third Floor Landing',
      description: `The civil courts floor—where disputes over money and property and broken contracts were resolved. The atmosphere here was different from criminal courts: less drama, more paperwork, the quiet violence of financial destruction instead of physical.

Attorneys in civil cases wore better suits than their criminal counterparts. The stakes were different—fortunes rather than freedom—and the dress code reflected it. The suits are gone now. The stakes have evaporated.

A coffee station sits in an alcove, its pot empty, its creamer curdled, its sugar bowl overturned. Lawyers needed caffeine to survive civil litigation. The litigation ended. The caffeine remains, useless.`,
      x: 9,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z1.ts#%STAIR_Z1',
        up: 'z3.ts#%STAIR_Z3',
        north: '%COURTROOM_5',
        south: '%COURTROOM_6',
        east: '%CIVIL_HALL',
      },
    },

    '%COURTROOM_5': {
      name: 'Department 5 - Civil Court',
      description: `A civil courtroom configured for jury trials—contract disputes, negligence claims, the civil wrongs that required twelve citizens to assess blame and calculate damages. The jury box is larger here, more comfortable, recognizing that civil juries might deliberate for weeks.

The exhibits still line the courtroom walls—poster-sized photographs of an intersection, a diagram of a building's floor plan, evidence from a trial that never concluded. The exhibits tell a story no one is left to hear. The intersection. The building. The accident or failure that led to litigation.

A litigation bag sits by the plaintiff's table, its wheels still extended, ready to roll back to an office that no longer functions.`,
      x: 9,
      y: 3,
      z: 2,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STAIR_Z2',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'trial exhibits',
          aliases: ['exhibits', 'evidence', 'photos'],
          description: `Exhibits on easels around the courtroom: an aerial photograph of an intersection, a floor plan with arrows marking paths of travel, photographs of damage. The exhibits tell a story—someone was hurt, someone was blamed, money was demanded. The story has no ending. The exhibits wait for closing arguments that never came.`,
        },
        {
          prototype: 'describable',
          name: 'litigation bag',
          aliases: ['bag', 'briefcase'],
          description: `A wheeled litigation bag, the attorney's mobile office, packed with depositions and motions and the ammunition of civil combat. The bag was ready to roll back to the office for more preparation. The preparation continues forever, the trial permanently continued.`,
        },
      ],
    },

    '%COURTROOM_6': {
      name: 'Department 6 - Civil Court',
      description: `A smaller civil courtroom for bench trials—cases decided by judges rather than juries, usually contract disputes too technical for lay people to understand. The jury box is empty, unused, the room configured for arguments between lawyers and rulings from the bench.

Law books line the walls, bound volumes of precedent that lawyers cited and judges consulted. The books are outdated now—law changes, but these volumes capture only what was true when they were printed. The law they contain is historical, academic, irrelevant.

A whiteboard shows someone's trial outline, boxes and arrows mapping out the flow of evidence. The outline is incomplete. The trial never progressed beyond opening statements.`,
      x: 9,
      y: 1,
      z: 2,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%STAIR_Z2',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'law library',
          aliases: ['books', 'library', 'volumes'],
          description: `Shelves of law books—Washington Reports, Federal Reporter, the Restatement of Torts. The spines are cracked from use, the pages marked with sticky notes, the margins annotated by attorneys seeking advantage. The law inside was current once. It aged without updating. The precedents it contains may or may not apply to whatever comes next.`,
        },
        {
          prototype: 'describable',
          name: 'trial outline',
          aliases: ['whiteboard', 'outline'],
          description: `A whiteboard mapping out trial strategy: OPENING → PLAINTIFF'S CASE → DEFENSE CASE → CLOSING. Under "Plaintiff's Case" are numbered witnesses, exhibits, estimated times. The outline reaches "WITNESS 3 - DR. HENDRICKS - EXPERT" and stops. Dr. Hendricks never testified.`,
        },
      ],
    },

    '%CIVIL_HALL': {
      name: 'King County Courthouse - Civil Corridor',
      description: `The corridor serving the remaining civil courtrooms, its walls lined with bulletin boards announcing bar association meetings and CLE courses and the social calendar of the legal profession. The profession gathered for lunches and seminars and awards ceremonies. The gatherings ended. The announcements persist.

Settlement conference rooms branch off the hallway—private spaces where attorneys met to negotiate resolutions before trial. Most civil cases settled. The settlement rooms saw more justice dispensed than the courtrooms. The rooms are dark now, their conferences concluded.

A display case holds awards and commendations: "PRO BONO SERVICE AWARD - 2019." "BEST BRIEF - CIVIL DIVISION - 2018." The achievements of attorneys who served the public, recognized by their peers. The service ended. The recognition remains.`,
      x: 10,
      y: 2,
      z: 2,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%STAIR_Z2',
        north: '%COURTROOM_7',
        south: '%COURTROOM_8',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'awards display',
          aliases: ['display', 'awards', 'case'],
          description: `A glass display case holding the trophies of legal achievement: plaques for pro bono service, certificates for exceptional advocacy, the small recognitions that motivated lawyers to excel. The awards meant something to the people who received them. The people are gone. The meaning persists in polished brass.`,
        },
      ],
    },

    '%COURTROOM_7': {
      name: 'Department 7 - Civil Court',
      description: `A civil courtroom specializing in complex commercial litigation—multi-million dollar disputes between corporations, the kind of cases that employed teams of lawyers for years. The room is equipped for extended trials: extra power outlets, dedicated internet connections (when internet existed), space for document review.

A projector hangs from the ceiling, its last PowerPoint still frozen on the screen: a timeline of events in some corporate dispute, dates and arrows and the flow of money between entities. The timeline extends years into the past. The future is blank.

The court reporter's station has a real-time display, allowing attorneys to see testimony as it was transcribed. The display is dark. The last words transcribed are preserved in the memory of a machine no one will ever query.`,
      x: 10,
      y: 3,
      z: 2,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%CIVIL_HALL',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'frozen presentation',
          aliases: ['projector', 'powerpoint', 'screen'],
          description: `A projection screen showing the last slide of a corporate litigation presentation: a timeline of wire transfers, entity names in boxes, arrows showing the flow of allegedly misappropriated funds. The dispute involved millions. The millions are meaningless now. The slide remains, documenting arguments that will never be resolved.`,
        },
        {
          prototype: 'describable',
          name: 'realtime display',
          aliases: ['display', 'transcript'],
          description: `A monitor at counsel table showing real-time transcription—testimony as it was spoken, appearing in text as the court reporter typed. The last line reads: "Q: And what did you do when you discovered the discrepancy? A: I—" The answer is lost. The question echoes.`,
        },
      ],
    },

    '%COURTROOM_8': {
      name: 'Department 8 - Civil Court',
      description: `The eighth civil department, handling small claims appeals and simple contract cases—the minor disputes that still needed judicial resolution. The room is simpler than the others, less equipment, less drama, the efficient processing of ordinary grievances.

A stack of small claims cases sits on the clerk's desk, each file a dispute over a few hundred or thousand dollars. Landlords versus tenants. Contractors versus homeowners. The small betrayals of commerce, documented and filed and never resolved.

The simplicity of this courtroom is almost comforting—the scale of disputes here was human, comprehensible, the kind of problems that people used to solve. The problems persist. The solutions do not.`,
      x: 10,
      y: 1,
      z: 2,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%CIVIL_HALL',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'small claims files',
          aliases: ['files', 'cases', 'claims'],
          description: `A stack of small claims files, each one a dispute over amounts that seemed important to the people involved. "MARTINEZ v. CHEN - $1,500 - SECURITY DEPOSIT." "WILLIAMS v. AAA PLUMBING - $2,200 - DEFECTIVE WORK." The disputes were real. The amounts mattered. Now they don't.`,
        },
      ],
    },
  },
};
