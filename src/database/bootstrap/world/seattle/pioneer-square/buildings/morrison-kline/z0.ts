// Morrison & Kline, Attorneys at Law - Ground Floor (z=0)
// Maritime law firm, frozen in time with decades of contracts and depositions

export const building = {
  name: 'Morrison & Kline',
  x: -15,
  y: 7,
  width: 2,
  height: 2,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - LAW OFFICES
    // ═══════════════════════════════════════════════════════════════════

    '%RECEPTION': {
      name: 'Morrison & Kline - Reception',
      description: `Frosted glass doors open into a reception area that still whispers of maritime law and the endless paperwork of goods moving through the port. The brass nameplate by the door is tarnished but legible: MORRISON & KLINE, ATTORNEYS AT LAW. The firm specialized in shipping disputes, cargo claims, the contractual minutiae that kept commerce flowing.

A reception desk faces the entrance, its surface covered in a thin layer of dust. Behind it, a leather chair sits empty, pushed back as if someone stood up and never returned. The wall behind the desk displays nautical charts in brass frames—Puget Sound, the Strait of Juan de Fuca, the shipping lanes that made Seattle a port city.

The waiting area offers leather chairs arranged around a coffee table stacked with legal journals and maritime trade publications. The publications are dated. The waiting is permanent.`,
      x: -15,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '1st-ave-s/y7.ts',
          description: 'Frosted glass doors lead back to 1st Ave S',
        },
        west: '%OFFICE_MAIN',
        north: '%CONFERENCE',
      },
      sittables: [
        {
          name: 'the leather waiting chairs',
          capacity: 4,
          emptyMsg:
            'Four leather chairs surround a coffee table, arranged for clients who will never arrive.',
          occupiedMsg: '%s waiting in the reception area',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'reception desk',
          aliases: ['desk', 'front desk'],
          description: `A heavy wooden desk with brass fittings, the kind that law firms bought to project solidity and permanence. The leather chair behind it is pushed back at an angle, as if someone stood suddenly. A telephone sits on the desk, its receiver cradled, its rotary dial speaking to an era before touch-tones. An appointment book lies open to a page from months ago, the handwriting neat, the appointments unkept.`,
        },
        {
          prototype: 'describable',
          name: 'nautical charts',
          aliases: ['charts', 'maps'],
          description: `Brass-framed nautical charts line the wall behind reception—Puget Sound in meticulous detail, depth soundings marked in fathoms, shipping lanes traced in red ink. These were working documents once, referenced when clients disputed the location of a collision or the path of a cargo vessel. The disputes have all been settled. The charts remain, recording waters that still flow.`,
        },
        {
          prototype: 'describable',
          name: 'legal journals',
          aliases: ['journals', 'magazines', 'publications'],
          description: `A stack of legal journals and maritime trade publications on the coffee table—Lloyd's List, Maritime Law Review, Pacific Shipper. The covers show container ships and port cranes, the infrastructure of global trade. The dates are months old. The trade routes they tracked have fallen silent. The journals wait for readers who moved on to more pressing concerns.`,
        },
      ],
    },

    '%OFFICE_MAIN': {
      name: 'Morrison & Kline - Partner Office',
      description: `The senior partner's office commands the building's best real estate—corner windows that once looked out on the bustle of 1st Avenue, now showing only the stillness of abandonment. A mahogany desk dominates the room, its surface organized with the precision of someone who billed by the quarter hour.

Filing cabinets line one wall, their labels identifying decades of maritime cases: CARGO DAMAGE 1990-1995, CHARTER DISPUTES, INSURANCE CLAIMS. The paper trail of commerce, meticulously organized and utterly obsolete. The statutes of limitations have run out on everything stored here.

A model ship sits in a glass case on the credenza—a container vessel rendered in exacting detail, the kind of gift clients gave to attorneys who saved them millions. The ship is dusty but intact, frozen in its eternal voyage across a sea of polished wood.`,
      x: -16,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%RECEPTION',
        north: '%LIBRARY',
      },
      sittables: [
        {
          name: 'the executive chair',
          capacity: 1,
          emptyMsg:
            'A high-backed leather executive chair sits behind the mahogany desk, positioned for authority.',
          occupiedMsg: '%s seated in the partner chair, behind the mahogany desk',
        },
        {
          name: 'the client chairs',
          capacity: 2,
          emptyMsg:
            'Two leather chairs face the desk, positioned for clients receiving counsel.',
          occupiedMsg: '%s seated across from the partner desk',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'mahogany desk',
          aliases: ['desk', 'partner desk'],
          description: `A mahogany desk that probably cost more than most people's cars, its surface covered in the organized detritus of legal practice: a brass letter opener, a crystal paperweight, a leather desk blotter stained with decades of ink. The computer monitor is dark. The Rolodex beside it contains business cards from shipping companies, insurance adjusters, other attorneys. The contacts are all cold now.`,
        },
        {
          prototype: 'cabinet',
          name: 'filing cabinets',
          aliases: ['cabinets', 'files'],
          description: `A wall of filing cabinets, each drawer labeled with the taxonomy of maritime law: CARGO DAMAGE, CHARTER DISPUTES, INSURANCE CLAIMS, PERSONAL INJURY (MARITIME). The drawers are stuffed with contracts, depositions, letters threatening legal action. The threats have all expired. The paper remains, a forest's worth of documentation for disputes no one will ever resolve.`,
        },
        {
          prototype: 'describable',
          name: 'model ship',
          aliases: ['ship', 'model', 'container vessel'],
          description: `A container vessel in miniature, perhaps two feet long, displayed in a glass case on the credenza. The model is exquisitely detailed—individual containers stacked on deck, tiny cranes on the rails, even a miniature crew on the bridge. A brass plaque identifies it: "MV Pacific Fortune, presented to Morrison & Kline by Evergreen Marine, 1998." The gift speaks to a relationship worth cultivating. The relationship ended like everything else.`,
        },
        {
          prototype: 'describable',
          name: 'law degree',
          aliases: ['degree', 'diploma', 'certificate'],
          description: `Framed diplomas hang on the wall: University of Washington School of Law, State Bar of Washington, Maritime Law Association. The names—Morrison, presumably, or Kline—are printed in calligraphy that took more care than most legal documents. The lawyers who earned these degrees are gone. The degrees remain, testifying to education and admission to a bar that no longer convenes.`,
        },
      ],
    },

    '%CONFERENCE': {
      name: 'Morrison & Kline - Conference Room',
      description: `The conference room was designed for depositions and negotiations, the long table surrounded by chairs for attorneys and clients and expert witnesses. The table is genuine mahogany, polished to a shine that shows every dust mote, every fingerprint from hands that touched it last.

A whiteboard on one wall still shows the remnants of a case outline—boxes and arrows in blue marker, names of parties and dates of incidents. The case was never resolved. The whiteboard was never erased. The strategy remains visible, waiting for attorneys who will never return to execute it.

A credenza against the wall holds a coffee service—carafe, cups, sugar and creamer in ceramic containers. The coffee is long since evaporated. The service remains, set for meetings that were cancelled permanently.`,
      x: -15,
      y: 8,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%RECEPTION',
        west: '%LIBRARY',
      },
      sittables: [
        {
          name: 'the conference chairs',
          capacity: 10,
          emptyMsg:
            'Leather chairs ring the long mahogany table, arranged for negotiations that will never resume.',
          occupiedMsg: '%s seated at the conference table',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'whiteboard',
          aliases: ['board', 'case outline'],
          description: `A large whiteboard mounted on the wall, its surface covered in blue and red marker. Boxes contain names: "Plaintiff - Matsuda Shipping," "Defendant - Pacific Stevedoring," "Insurer - Lloyd's of London." Arrows connect the boxes in patterns that made sense to the attorneys who drew them. The case number is written in the corner: 2019-CV-4477. Whatever dispute this represented, the statute of limitations has run. The diagram persists.`,
        },
        {
          prototype: 'describable',
          name: 'coffee service',
          aliases: ['coffee', 'carafe'],
          description: `A silver coffee service on the credenza—carafe, cups and saucers, sugar bowl and creamer, all arranged on a tray. The carafe is empty and tarnished. The sugar has solidified into a single mass. The creamer contains something that was once milk and is now better left unexamined. The service awaits a meeting that was adjourned permanently.`,
        },
        {
          prototype: 'describable',
          name: 'legal pads',
          aliases: ['pads', 'notebooks'],
          description: `Yellow legal pads are scattered on the table, covered in handwritten notes—questions for witnesses, points of law, citations to relevant cases. The handwriting varies: neat and precise in some places, hurried and slanted in others. Multiple attorneys, building a case together. The case was never tried. The notes remain, a paper trail of preparation for nothing.`,
        },
      ],
    },

    '%LIBRARY': {
      name: 'Morrison & Kline - Law Library',
      description: `Floor-to-ceiling shelves hold the tools of legal research: bound volumes of case reporters, statute books, maritime law treatises. The books are arranged with precision—Washington Reports, Federal Supplement, Corpus Juris Secundum. The spines are uniform, leather bindings in muted colors, gold lettering catching what light filters through the venetian blinds.

A research table occupies the center of the room, surrounded by wooden chairs with worn leather seats. Legal pads and pencils are scattered across the surface, notes from research that was never completed. The Westlaw terminal is dark, its subscription long since lapsed.

The room smells of old paper and leather bindings, the distinct scent of accumulated legal knowledge. The knowledge remains. The lawyers who might have applied it are gone.`,
      x: -16,
      y: 8,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%OFFICE_MAIN',
        east: '%CONFERENCE',
      },
      sittables: [
        {
          name: 'the library chairs',
          capacity: 4,
          emptyMsg:
            'Wooden chairs with worn leather seats surround the research table.',
          occupiedMsg: '%s researching at the library table',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'law books',
          aliases: ['books', 'volumes', 'reporters'],
          description: `Thousands of law books line the shelves—case reporters bound in matching leather, statutes organized by jurisdiction, treatises on maritime law and admiralty practice. The West key number system organizes legal concepts into categories. Shepard's Citations tracks which cases are still good law. None of it matters now. The law has gone silent. The books remain, monuments to a system of dispute resolution that no longer operates.`,
        },
        {
          prototype: 'describable',
          name: 'Westlaw terminal',
          aliases: ['terminal', 'computer'],
          description: `A computer terminal sits at one end of the research table, its screen dark, its keyboard dusty. The login screen would have required credentials to access Westlaw, the online legal database that made physical law books obsolete. The subscription has lapsed. The database is unreachable. The terminal is as dead as the paper books it was meant to replace.`,
        },
        {
          prototype: 'describable',
          name: 'research notes',
          aliases: ['notes', 'legal pads'],
          description: `Legal pads covered in handwritten research notes, citations in blue ink, questions in red. "See also: Pacific S.S. Co. v. Calmaquip Engineering Corp." "Distinguish from: Carriage of Goods by Sea Act §4(2)." The research was thorough, the citations precise. The case was never argued. The research remains, meticulous preparation for an argument no one will make.`,
        },
        {
          prototype: 'describable',
          name: 'card catalog',
          aliases: ['catalog', 'index'],
          description: `A wooden card catalog stands against one wall, its small drawers labeled alphabetically—an anachronism even before everything ended. The cards inside cross-reference cases and topics, handwritten in fountain pen by librarians who retired decades ago. Someone maintained the system out of tradition rather than necessity. The tradition outlived its practitioners.`,
        },
      ],
    },
  },
};
