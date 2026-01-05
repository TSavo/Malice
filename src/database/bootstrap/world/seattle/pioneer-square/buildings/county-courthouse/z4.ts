// King County Courthouse - Fourth Floor (z=4)
// Judge's Chambers, Law Library, and Roof Access

export const building = {
  rooms: {
    '%STAIR_Z4': {
      name: 'King County Courthouse - Fifth Floor Landing',
      description: `The top floor of the courthouse—judge's chambers and the law library, the inner sanctum of the judicial system. The carpet here is thicker than lower floors. The lighting is softer. The message is clear: you have reached the realm of those who decide.

A security desk guards access to the chambers, its logbook showing entries months old, its chair empty. The security guard who sat here knew every judge, every clerk, every regular. The guard is gone. The desk remains, unauthorized access now trivially easy.

The atmosphere is hushed, preserved by walls designed to contain confidential conversations. Whatever the judges discussed in their chambers stays in their chambers. The walls have kept their secrets.`,
      x: 9,
      y: 2,
      z: 4,
      population: 0,
      ambientNoise: 1,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z3.ts#%STAIR_Z3',
        up: '%ROOF_ACCESS',
        north: '%CHAMBERS_HALL',
        south: '%LAW_LIBRARY',
        east: '%CONFERENCE',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'security desk',
          aliases: ['desk', 'guard'],
          description: `A security desk with a visitor log, a phone for calling chambers, and a coffee mug that reads "I'D RATHER BE FISHING." The guard who sat here knew everyone by face. Strangers were questioned. Now everyone is a stranger. No one is questioned.`,
          boltedDown: true,
        },
      ],
    },

    '%CHAMBERS_HALL': {
      name: 'King County Courthouse - Judicial Chambers Hall',
      description: `The corridor of judicial chambers—private offices where judges retreated between sessions, reviewed cases, wrote opinions, made the decisions that shaped lives. Each door bears a nameplate: HON. MARTINEZ, HON. CHEN, HON. OKONKWO. The names represent decades of accumulated judicial wisdom, now inaccessible.

The doors are solid, soundproofed, designed for privacy. Whatever conversations happened behind them—with attorneys, with clerks, with the judge's own conscience—remain private.

A shared kitchen at the end of the hall has the abandoned remains of the last judicial lunch: a takeout container, a half-empty coffee pot, someone's forgotten yogurt. The mundane details of judicial life, preserved.`,
      x: 9,
      y: 3,
      z: 4,
      population: 0,
      ambientNoise: 0,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STAIR_Z4',
        east: '%CHAMBERS_1',
        west: '%CHAMBERS_2',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'chamber nameplates',
          aliases: ['nameplates', 'doors', 'names'],
          description: `Brass nameplates on heavy wooden doors: HON. ROBERT MARTINEZ, HON. JENNIFER CHEN, HON. AMARA OKONKWO. The honorific means something—these people earned the right to judge, passed bar exams and elections and appointments. The honor remains. The judges do not.`,
        },
        {
          prototype: 'describable',
          name: 'judicial kitchen',
          aliases: ['kitchen', 'break room'],
          description: `A small kitchen for judicial use: refrigerator, microwave, coffee maker, the infrastructure of working lunches. The coffee pot is half full of liquid that's aged past beverage into something else. A takeout container from a Thai restaurant sits on the counter. Someone's lunch was interrupted.`,
        },
      ],
    },

    '%CHAMBERS_1': {
      name: 'King County Courthouse - Judge Martinez\'s Chambers',
      description: `The private chambers of Judge Robert Martinez, senior jurist of the criminal division. The room reflects thirty years on the bench: photographs with governors and senators, awards for judicial excellence, a gavel collection from colleagues around the country.

The desk is mahogany, massive, covered in case files the judge was reviewing. Notes in judicial handwriting show the analysis: facts, law, considerations, the reasoned process that led to decisions. The last case remains unresolved, the notes ending mid-thought.

A window offers a view of the city—the rooftops of Pioneer Square, downtown in the distance, the geography of the jurisdiction the judge oversaw. The jurisdiction is the same. The oversight has ended.`,
      x: 10,
      y: 3,
      z: 4,
      population: 0,
      ambientNoise: 0,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%CHAMBERS_HALL',
      },
      sittables: [
        {
          name: 'judicial chair',
          capacity: 1,
          emptyMsg:
            'A high-backed leather chair behind the desk, shaped by years of careful sitting.',
          occupiedMsg: '%s in the judge\'s chair',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'judges desk',
          aliases: ['desk', 'mahogany'],
          description: `A massive mahogany desk, the kind that says "I am permanent." Case files cover the surface, each one marked with the judge's notes: "RECIDIVISM CONCERNS," "CREDIBILITY ISSUES," "MITIGATING FACTORS." The analysis is thorough, the reasoning careful, the conclusion never reached.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'gavel collection',
          aliases: ['gavels', 'collection'],
          description: `A display case of gavels, each one presented by a colleague or bar association: carved wood, polished brass, one made from a railroad spike. The gavels are ceremonial, symbols of authority bestowed by peers. The authority they represent has dissolved. The gavels remain.`,
        },
        {
          prototype: 'describable',
          name: 'photographs',
          aliases: ['photos', 'awards'],
          description: `Photographs covering one wall: Judge Martinez with governors, senators, Supreme Court justices. Award plaques for judicial excellence. A framed letter from a former defendant, thanking the judge for a second chance. The career is documented. The legacy is uncertain.`,
        },
      ],
    },

    '%CHAMBERS_2': {
      name: 'King County Courthouse - Judge Chen\'s Chambers',
      description: `Judge Jennifer Chen's chambers, smaller than the senior jurist's but equally personal. The decoration tends toward minimalism—a single orchid (now dead), a ink brush painting, books arranged with architectural precision.

The desk is organized with the same precision: inbox, outbox, reference materials, the spatial logic of someone who processed work efficiently. The efficiency remains visible in the arrangement. The work has stopped.

A family photograph sits on the desk—Judge Chen with a partner and two children at what looks like a graduation ceremony. The photograph is the only personal item visible. The personal was kept personal. The professional dominated.`,
      x: 8,
      y: 3,
      z: 4,
      population: 0,
      ambientNoise: 0,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%CHAMBERS_HALL',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'minimalist desk',
          aliases: ['desk'],
          description: `A desk organized with precision: inbox containing cases to be reviewed, outbox containing completed orders, reference books arranged by subject. The system is visible, logical, efficient. The system continues to exist. The work does not.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'dead orchid',
          aliases: ['orchid', 'plant'],
          description: `An orchid in a ceramic pot, its blooms long since faded, its leaves yellowed. The orchid was alive when someone cared for it. The care ended. The orchid declined. The pot remains on the windowsill, a memorial to maintenance that stopped.`,
        },
        {
          prototype: 'describable',
          name: 'family photo',
          aliases: ['photo', 'photograph', 'family'],
          description: `A single framed photograph: Judge Chen with a partner and two children, everyone in graduation gowns, smiles genuine. The photograph is the only personal item visible in the room. The judge kept work and home separate. The separation was complete.`,
        },
      ],
    },

    '%LAW_LIBRARY': {
      name: 'King County Courthouse - Law Library',
      description: `The courthouse law library, a temple of legal scholarship stretching across the south side of the floor. Floor-to-ceiling shelves hold the accumulated wisdom of the legal profession: case reporters, statutes, treatises, the written law that governed disputes before there were disputes to govern.

Reading tables fill the center of the room, their surfaces worn by elbows and law books and the friction of legal research. Computer terminals line one wall, their screens dark, their databases inaccessible. The transition from books to computers happened. Now both are equally useless.

A librarian's desk sits empty, its surface covered in requested materials never retrieved. The librarian knew where everything was, could find precedent for any argument. That knowledge walked out the door and didn't come back.`,
      x: 9,
      y: 1,
      z: 4,
      population: 0,
      ambientNoise: 0,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%STAIR_Z4',
        east: '%RARE_BOOKS',
      },
      sittables: [
        {
          name: 'reading tables',
          capacity: 12,
          emptyMsg:
            'Long reading tables stretch across the room, their surfaces worn by generations of legal research.',
          occupiedMsg: '%s researching at a reading table',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'legal reporters',
          aliases: ['books', 'reporters', 'library'],
          description: `Floor-to-ceiling shelves of legal reporters: Washington Reports, Pacific Reporter, Federal Supplement. The spines are numbered, the volumes sequential, the law arranged chronologically. The arrangement makes sense if you understand the system. The system is documented. Understanding it requires training no one is providing.`,
        },
        {
          prototype: 'describable',
          name: 'computer terminals',
          aliases: ['computers', 'terminals', 'westlaw'],
          description: `A row of computer terminals for legal research: Westlaw, LexisNexis, the databases that made legal research faster and more comprehensive. The screens are dark. The databases are inaccessible. The books on the shelves contain the same information, for those who know how to find it.`,
        },
        {
          prototype: 'desk',
          name: 'librarian desk',
          aliases: ['desk'],
          description: `The law librarian's desk, covered in requests never fulfilled: "Need 1983 Washington Reports volume 42." "Looking for treatise on water rights." The librarian knew where everything was. The librarian is gone. The requests remain, unanswered.`,
          boltedDown: true,
        },
      ],
    },

    '%RARE_BOOKS': {
      name: 'King County Courthouse - Rare Books Room',
      description: `A climate-controlled room housing the library's rare collection: original territorial law books, founding documents, the legal archaeology of Washington State. The collection is modest by national standards but invaluable for local history.

Glass cases display the treasures: an original copy of the state constitution, law books from the 1860s with handwritten marginalia, the first published court reports from territorial days. The documents survived the fire of 1889, earthquakes, all the disasters that have befallen Seattle. They'll probably survive this too.

The climate control still hums, maintaining temperature and humidity that protect paper from decay. Someone ensured the power continued. Perhaps it's automatic. Perhaps someone cared enough to keep these documents alive.`,
      x: 10,
      y: 1,
      z: 4,
      population: 0,
      ambientNoise: 5,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LAW_LIBRARY',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'display cases',
          aliases: ['cases', 'displays', 'rare books'],
          description: `Glass cases protecting the library's treasures: an original copy of the Washington State Constitution, territorial law books with contemporary annotations, court reports from before statehood. The documents are history made physical, the legal DNA of the state. The climate control preserves them. The history they record continues without documentation.`,
        },
        {
          prototype: 'describable',
          name: 'climate control',
          aliases: ['hvac', 'temperature'],
          description: `A specialized climate control system maintaining archival conditions: 68°F, 40% humidity, filtered air. The system hums steadily, protecting documents that have survived for over a century. The power comes from somewhere. The protection continues. Someone—or something—decided these documents matter.`,
        },
      ],
    },

    '%CONFERENCE': {
      name: 'King County Courthouse - Judicial Conference Room',
      description: `A conference room for judicial deliberations—the space where judges met to discuss difficult cases, coordinate policies, make the administrative decisions that kept the court system functioning. The table seats twelve, the chairs substantial, the atmosphere serious.

A whiteboard shows the agenda from the last meeting: CASELOAD MANAGEMENT, BUDGET CUTS, COURTROOM SECURITY. The concerns of running a court system, frozen mid-discussion. The solutions were never reached. The problems have become irrelevant.

Coffee cups still sit on the table, their contents evaporated, their rings staining the wood. The judges drank coffee while they deliberated. The deliberations ended. The coffee cups remain.`,
      x: 10,
      y: 2,
      z: 4,
      population: 0,
      ambientNoise: 0,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%STAIR_Z4',
      },
      sittables: [
        {
          name: 'conference table',
          capacity: 12,
          emptyMsg:
            'A massive conference table dominates the room, surrounded by leather chairs.',
          occupiedMsg: '%s at the conference table',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'meeting agenda',
          aliases: ['agenda', 'whiteboard'],
          description: `A whiteboard showing the agenda of the last judicial meeting:
1. CASELOAD MANAGEMENT - BACKLOG UPDATE
2. FY2024 BUDGET CUTS - IMPACT ASSESSMENT
3. COURTROOM SECURITY - INCIDENT REVIEW
4. NEW BUSINESS

The meeting never concluded. The new business was never discussed. The problems listed have solved themselves, though not in ways anyone would have wanted.`,
        },
        {
          prototype: 'describable',
          name: 'coffee rings',
          aliases: ['cups', 'coffee'],
          description: `Coffee cups abandoned on the table, their contents long evaporated, rings staining the wood finish. The judges drank coffee during meetings—it was that kind of job. The coffee is gone. The stains are permanent. The meetings are history.`,
        },
      ],
    },

    '%ROOF_ACCESS': {
      name: 'King County Courthouse - Roof Stairwell',
      description: `A utilitarian stairwell leading to the roof—bare concrete walls, industrial lighting, the unfinished aesthetic of spaces not meant for the public. A door at the top leads to the rooftop mechanical area.

Graffiti covers one wall, names and dates from decades of building workers who climbed these stairs for maintenance. The newest tag is a year old. The oldest is from the 1980s. The tradition of leaving marks continues, or did.

Emergency lighting casts a red glow over the landing, battery backup still functioning, the last refuge if the power fails completely.`,
      x: 9,
      y: 2,
      z: 4,
      population: 0,
      ambientNoise: 3,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%STAIR_Z4',
        up: 'z5.ts#%ROOF',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'worker graffiti',
          aliases: ['graffiti', 'tags', 'names'],
          description: `Names and dates scratched or marked on the concrete: "DAVE M. 1987," "JULIO WAS HERE 2015," "F.K. + M.T." The workers who maintained this building left their marks. The marks survive the workers. The tradition of recording presence continues in the only permanent medium available.`,
        },
      ],
    },
  },
};
