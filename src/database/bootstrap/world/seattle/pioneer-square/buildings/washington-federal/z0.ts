// Washington Federal Bank - Ground Floor (z=0)
// Neoclassical bank building with marble facade, frozen clock at 2:47
// The money inside is worthless now, but the vault remains sealed

export const building = {
  name: 'Washington Federal Bank',
  x: 0,
  y: 0,
  width: 2,
  height: 5,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN_LOCK': {
      prototype: 'lock',
      name: 'Bronze Door Lock',
      description:
        'A heavy brass lock mechanism set into the bronze doors. The kind of security that said "we have something worth protecting."',
      difficulty: 6,
    },
    '%MAIN_DOOR': {
      prototype: 'door',
      name: 'Bronze Doors',
      description:
        'Massive bronze doors, their surfaces tarnished to a deep green patina. Each door weighs hundreds of pounds. They stand slightly ajar—someone forced them open once and never bothered to close them.',
      locked: false,
      open: true,
      locks: ['%MAIN_LOCK'],
      material: 'metal',
      durability: 95,
    },

    '%OFFICE_LOCK': {
      prototype: 'lock',
      name: 'Manager Office Lock',
      description: 'A brass lock on the manager\'s office door, more ceremonial than secure.',
      difficulty: 3,
    },
    '%OFFICE_DOOR': {
      prototype: 'door',
      name: 'Manager Office Door',
      description:
        'A solid oak door with a brass nameplate reading "BRANCH MANAGER." The frosted glass panel is cracked but intact.',
      locked: true,
      open: false,
      locks: ['%OFFICE_LOCK'],
      material: 'wood',
      durability: 70,
    },

    '%VAULT_LOCK': {
      prototype: 'biometricLock',
      name: 'Vault Time Lock',
      description:
        'A circular vault door with a time lock mechanism. The dial shows numbers from 0-99. A small digital display, long since dead, once showed the countdown to the next opening window.',
      scanners: [
        { type: 'keypad', part: 'hand', message: 'Time lock engaged. Vault sealed.' },
      ],
      authorizedUsers: {},
      difficulty: 10,
    },
    '%VAULT_DOOR': {
      prototype: 'door',
      name: 'Vault Door',
      description:
        'A massive circular vault door, two feet thick, made of layered steel and concrete. The door is closed and the time lock is engaged. Whatever is inside will stay inside until someone defeats engineering that was designed to be undefeatable.',
      locked: true,
      open: false,
      locks: ['%VAULT_LOCK'],
      material: 'metal',
      durability: 100,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - BANKING HALL
    // ═══════════════════════════════════════════════════════════════════

    '%LOBBY': {
      name: 'Washington Federal - Banking Hall',
      description: `The grand banking hall rises two stories, its marble columns supporting a coffered ceiling painted in faded gold and blue. The space was designed to inspire confidence—your money is safe here, the architecture says. We have marble. We have columns. We have Latin inscriptions you can't read but trust implicitly.

The teller windows line the east wall, their brass cages still gleaming despite decades of neglect. Glass partitions, bulletproof probably, separate the customers from the money. The money is still back there somewhere. Bundles of currency in locked drawers, coins in counted rolls, all of it as worthless as the paper it's printed on.

A circular information desk occupies the center of the hall, its marble surface cracked where something heavy fell. Deposit slips and withdrawal forms are scattered across the floor—the last transactions never completed, the last customers never served.`,
      x: 0,
      y: -2,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '2nd-ave-s/y-2.ts',
          description: 'Bronze doors lead to 2nd Avenue',
          door: '%MAIN_DOOR',
        },
        west: '%OFFICES',
        south: '%VAULT_ANTE',
        up: '%STAIRWELL',
      },
      sittables: [
        {
          name: 'marble benches',
          capacity: 6,
          emptyMsg:
            'Marble benches line the walls, designed for customers waiting to see a banker.',
          occupiedMsg: '%s waiting on the marble bench',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'teller windows',
          aliases: ['tellers', 'cages', 'windows'],
          description: `A row of teller windows with brass cages and bulletproof glass. Each station has a nameplate—JANET, MARCUS, CHRISTINE—the tellers who stood here counting other people's money. The cash drawers are visible through the glass, some still containing neat stacks of bills. The bills are worthless. The habit of organizing them neatly persists in the arrangement.`,
        },
        {
          prototype: 'furniture',
          name: 'information desk',
          aliases: ['desk', 'marble desk'],
          description: `A circular marble desk in the center of the hall, cracked down the middle where something heavy struck it. Brochures for mortgages and car loans are fanned out in holders—the financial products that defined middle-class aspiration. The brochures promise low rates and easy approval. The promises meant something once.`,
        },
        {
          prototype: 'describable',
          name: 'coffered ceiling',
          aliases: ['ceiling', 'coffers'],
          description: `The ceiling is a grid of coffered panels, each one painted in faded gold and Prussian blue. Classical motifs—acanthus leaves, Greek keys, laurel wreaths—decorate the beams. The paint is peeling in places, water damage visible where the roof has leaked, but the craftsmanship shows through. Someone spent real money on this ceiling. The irony of spending money to convince people to give you their money was probably not discussed.`,
        },
        {
          prototype: 'describable',
          name: 'marble columns',
          aliases: ['columns', 'pillars'],
          description: `Ionic columns of white marble, veined with grey, rise two stories to support the ceiling. The columns are purely decorative—the real structure is steel, hidden behind plaster. But the appearance of permanence was the point. Banks wanted you to believe they would last forever. Some of them did. The money didn't.`,
        },
      ],
    },

    '%OFFICES': {
      name: 'Washington Federal - Bank Offices',
      description: `The west side of the bank houses the private offices—where loans were approved or denied, where accounts were opened, where the bank's real business happened behind closed doors. The cubicle farm for loan officers and account managers has been ransacked, drawers pulled out, filing cabinets tipped over.

Someone was looking for something. Cash probably, or maybe documents that might still have value. They found neither—the cash was in the vault, and documents require a society to enforce them.

The branch manager's office is visible through a frosted glass door, its interior dark. A nameplate on the wall reads "DAVID HARRISON - BRANCH MANAGER." David Harrison is probably dead. His office remains.`,
      x: -1,
      y: -2,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LOBBY',
        south: {
          description: 'A frosted glass door leads to the manager\'s office',
          door: '%OFFICE_DOOR',
          to: '%MANAGER_OFFICE',
        },
      },
      objects: [
        {
          prototype: 'desk',
          name: 'loan officer cubicles',
          aliases: ['cubicles', 'desks'],
          description: `A maze of low cubicle walls, each workstation equipped with a computer, a phone, and the detritus of financial services: staplers, tape dispensers, motivational posters about TEAMWORK and EXCELLENCE. The computers are dead. The phones are silent. The motivational posters remain optimistic despite everything.`,
        },
        {
          prototype: 'cabinet',
          name: 'filing cabinets',
          aliases: ['files', 'cabinets'],
          description: `Metal filing cabinets, most of them tipped over, their contents scattered across the floor. Loan applications, credit reports, the paper trail of people's financial lives. The files are organized alphabetically—someone maintained order until the very end. The order means nothing now.`,
        },
      ],
    },

    '%MANAGER_OFFICE': {
      name: 'Washington Federal - Manager\'s Office',
      description: `The branch manager's corner office, appointed with the subtle luxury that says "I have access to money but I don't flaunt it." A mahogany desk faces the door, its leather blotter still holding a pen and notepad. The walls display framed certificates and photos—David Harrison shaking hands with regional executives, cutting ribbons, receiving plaques.

The desk drawers have been forced open, their contents rifled through. A bottle of scotch sits on a credenza, half-empty, the good stuff that managers keep for special occasions. The special occasions ended. The scotch remains.

A window looks out onto an air shaft, grey light filtering through dirty glass. Even the manager didn't get a view.`,
      x: -1,
      y: -3,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%OFFICES',
      },
      sittables: [
        {
          name: 'executive leather chair',
          capacity: 1,
          emptyMsg:
            'A high-backed leather chair sits behind the desk, the seat shaped by years of managerial sitting.',
          occupiedMsg: '%s sitting in the manager\'s chair',
        },
        {
          name: 'visitor chairs',
          capacity: 2,
          emptyMsg:
            'Two leather chairs face the desk, positioned for difficult conversations about loans.',
          occupiedMsg: '%s in the visitor\'s chair',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'mahogany desk',
          aliases: ['desk', 'manager desk'],
          description: `A substantial mahogany desk, the kind that says "I make decisions here." The leather blotter is stained with coffee rings. A brass nameplate reads DAVID HARRISON. The desk drawers have been forced open, their locks broken, whatever valuables they held long since taken. A framed photo lies face-down—family, probably. Some things you don't want to see anymore.`,
        },
        {
          prototype: 'cabinet',
          name: 'credenza',
          aliases: ['cabinet', 'sideboard'],
          description: `A matching mahogany credenza along the wall, its doors ajar. A half-empty bottle of Macallan 18 sits on top, the cork dried and cracked. Crystal glasses are arranged on a silver tray, dusty but unbroken. The manager's private stock, saved for closing big deals or consoling colleagues. The deals stopped. The consolation continues.`,
        },
        {
          prototype: 'describable',
          name: 'framed certificates',
          aliases: ['certificates', 'awards', 'photos'],
          description: `The walls display the trophies of a banking career: "President's Club 2019," "Million Dollar Producer," "25 Years of Service." Photos show David Harrison at various stages of his career, hair progressively greying, smile progressively strained. The last photo shows him accepting an award from someone important. Everyone in the photo looks happy. Everyone in the photo is probably dead.`,
        },
      ],
    },

    '%VAULT_ANTE': {
      name: 'Washington Federal - Vault Anteroom',
      description: `The anteroom before the vault—a space designed for security protocols, for verification procedures, for the careful ritual of accessing other people's money. The ceiling is lower here, the walls reinforced, the atmosphere deliberately intimidating. You are approaching something important, the architecture says. Behave accordingly.

Safe deposit boxes line the walls—hundreds of them, numbered brass doors each holding whatever people considered valuable enough to store in a bank. Some boxes have been drilled open, their contents removed by someone with the right tools and the wrong intentions. Most remain sealed, their contents unknown, their owners gone.

The vault door dominates the south wall—a circular steel behemoth with a combination dial and time lock. The door is closed. The time lock's digital display is dark. Whatever is inside will stay inside.`,
      x: 0,
      y: -3,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LOBBY',
        south: {
          description: 'The massive vault door stands closed',
          door: '%VAULT_DOOR',
          to: '%VAULT',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'safe deposit boxes',
          aliases: ['boxes', 'deposit boxes', 'lockboxes'],
          description: `Walls of safe deposit boxes, each one a small brass door with a number and two keyholes—one for the customer's key, one for the bank's. Some boxes have been drilled open, professional work that left clean holes and empty compartments. Others remain sealed: jewelry, documents, the small treasures people thought were safer here than at home. The treasures are still safe. The people are gone.`,
        },
        {
          prototype: 'furniture',
          name: 'viewing booth',
          aliases: ['booth', 'privacy booth'],
          description: `A small privacy booth where customers could examine their safe deposit box contents. A marble counter, a leather stool, a velvet-lined tray for handling valuables. The booth is designed for discretion—what you keep here is your business. The discretion continues. The business ended.`,
        },
        {
          prototype: 'describable',
          name: 'vault door',
          aliases: ['door', 'vault'],
          description: `The vault door is a marvel of security engineering—two feet of layered steel and concrete, a combination dial with numbers worn smooth by use, a time lock that once regulated access to specific hours. The door is seamlessly closed, its locking bolts extended into the frame. The combination died with whoever knew it. The time lock's battery died with everything else. The vault is sealed, possibly forever.`,
        },
      ],
    },

    '%VAULT': {
      name: 'Washington Federal - Vault Interior',
      description: `The vault itself—a reinforced room lined with more safe deposit boxes, shelving units for cash reserves, and the kind of security that only paranoia can design. The air is stale, unchanged since the door last closed. Bundles of currency are stacked on metal shelves, organized by denomination, bound with paper bands that list amounts in handwriting.

The money is all here. Hundreds of thousands of dollars, perhaps millions, sitting in neat piles under emergency lighting that has long since failed. The currency is technically still legal tender. The society that would honor it is not.

A secondary door leads to a smaller room—the bank's most secure storage, for whatever required even more protection than the main vault. That door is also locked, its mechanism separate from the main vault's.`,
      x: 0,
      y: -4,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 0,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%VAULT_ANTE',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'cash shelves',
          aliases: ['shelves', 'money', 'cash'],
          description: `Metal shelving units holding bundles of currency—twenties, fifties, hundreds, all bound with paper bands listing amounts in neat handwriting. The organization is meticulous: each shelf labeled by denomination, each bundle counted and recounted. The money is real. The value is imaginary. The difference didn't matter until it did.`,
        },
        {
          prototype: 'cabinet',
          name: 'coin storage',
          aliases: ['coins', 'rolls'],
          description: `Racks of coin rolls—quarters, dimes, nickels, pennies—stored in paper wrappers marked with values. The coins have actual metal content, which gives them more inherent value than the paper currency. Someone could melt them down, theoretically. No one has bothered.`,
        },
        {
          prototype: 'safe',
          name: 'inner vault door',
          aliases: ['inner vault', 'secondary door'],
          description: `A smaller vault door within the vault, leading to the bank's most secure storage. This door has its own combination lock, separate from the main vault's. Whatever required this level of protection—bearer bonds, gold certificates, the really important documents—remains behind it. The door is closed. The combination is unknown.`,
        },
      ],
    },

    '%STAIRWELL': {
      name: 'Washington Federal - Stairwell',
      description: `A utilitarian stairwell behind the grand banking hall—marble gives way to terrazzo, ornate columns to painted concrete. This is the back-of-house circulation, where employees moved between floors without disturbing the customers' illusion of timeless permanence.

The stairs wind upward to the executive floor, their treads worn at the center from decades of foot traffic. Emergency exit signs, long since dark, point to doors that lead nowhere useful. A fire extinguisher hangs on the wall, its pressure gauge in the red.

The contrast with the banking hall is deliberate. Customers got marble and columns. Employees got this.`,
      x: -1,
      y: -1,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%LOBBY',
        up: 'z1.ts#STAIRWELL_1',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'fire extinguisher',
          aliases: ['extinguisher'],
          description: `A fire extinguisher in a glass-fronted cabinet, the glass intact, the extinguisher's pressure gauge reading empty. The inspection tag shows a date years past due. The fire safety equipment protected the building from fires. It could not protect the building from time.`,
        },
        {
          prototype: 'describable',
          name: 'emergency signs',
          aliases: ['signs', 'exit signs'],
          description: `Emergency exit signs point to doors at each landing, their battery backup long since exhausted. The signs promised escape routes in case of emergency. The emergency came. The escape routes led to a world that no longer existed.`,
        },
      ],
    },
  },

  postProcessors: [],
};
