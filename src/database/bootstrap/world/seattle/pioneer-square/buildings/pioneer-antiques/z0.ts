// Pioneer Antiques - Ground Floor (z=0)
// A double-wide antique store crammed with estate sale inventory
// The grandfather clock's pendulum froze mid-swing 55 years ago

export const building = {
  name: 'Pioneer Antiques',
  x: -3,
  y: 7,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Front Door Lock',
      description:
        'An antique brass lock, appropriately enough—the kind that takes a skeleton key.',
      difficulty: 4,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Antique Store Door',
      description:
        'A heavy wooden door with a beveled glass panel, the glass etched with the store name in Victorian script. The door has been forced open at some point—the frame is splintered near the lock.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'wood',
      durability: 40,
    },

    '%BACK_LOCK': {
      prototype: 'lock',
      name: 'Back Door Lock',
      description:
        'A modern deadbolt, incongruously new against the antique inventory.',
      difficulty: 5,
    },
    '%BACK_DOOR': {
      prototype: 'door',
      name: 'Delivery Door',
      description:
        'A wide door for moving large furniture, reinforced with steel bands. Scratches on the doorframe record decades of inventory coming and going.',
      locked: true,
      open: false,
      locks: ['%BACK_LOCK'],
      material: 'wood',
      durability: 55,
    },

    '%OFFICE_LOCK': {
      prototype: 'lock',
      name: 'Office Lock',
      description:
        'A simple privacy lock on the office door.',
      difficulty: 2,
    },
    '%OFFICE_DOOR': {
      prototype: 'door',
      name: 'Office Door',
      description:
        'A door marked PRIVATE in gold leaf letters, leading to the back office.',
      locked: false,
      open: false,
      locks: ['%OFFICE_LOCK'],
      material: 'wood',
      durability: 35,
    },

    '%UPSTAIRS_LOCK': {
      prototype: 'lock',
      name: 'Stairwell Lock',
      description:
        'A sturdy lock on the door to the upstairs gallery.',
      difficulty: 4,
    },
    '%UPSTAIRS_DOOR': {
      prototype: 'door',
      name: 'Gallery Stairs Door',
      description:
        'A door at the foot of a staircase, marked GALLERY - FINE ART & ESTATE JEWELRY.',
      locked: true,
      open: false,
      locks: ['%UPSTAIRS_LOCK'],
      material: 'wood',
      durability: 45,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - MAIN SHOWROOM
    // ═══════════════════════════════════════════════════════════════════

    '%SHOWROOM_FRONT': {
      name: 'Pioneer Antiques - Front Showroom',
      description: `The front showroom is a maximalist fever dream of accumulated history. Furniture crowds every available space: rolltop desks and china cabinets, fainting couches and hall trees, secretary desks with hidden compartments and wardrobes that could hide a family. Every horizontal surface holds smaller objects: crystal decanters and silver tea services, porcelain figurines and brass candlesticks, the concentrated material culture of a century of estate sales.

A grandfather clock dominates one corner, its dark walnut case rising nearly to the ceiling, its brass pendulum frozen mid-swing. The clock stopped at 2:47—morning or afternoon, no one remembers. The chimes that marked hours for generations are silent now. The clock outlived everyone who wound it.

Display windows face the arcade, their glass clouded with fifty-five years of grime. Through the haze, the shapes of furniture and collectibles are visible—the window display that once drew customers now drawing only dust. A hand-lettered sign in the window reads "EVERYTHING MUST GO." The sign is yellowed. Nothing went.`,
      x: -3,
      y: 6,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 's-washington/x-3.ts',
          description: 'The beveled glass door leads to S. Washington St',
          door: '%FRONT_DOOR',
        },
        west: '%SHOWROOM_BACK',
        north: '%FURNITURE_HALL',
      },
      sittables: [
        {
          name: 'fainting couch',
          capacity: 1,
          emptyMsg:
            'A Victorian fainting couch with carved mahogany frame, its velvet upholstery moth-eaten but structurally intact.',
          occupiedMsg: '%s on the fainting couch',
        },
        {
          name: 'wingback chair',
          capacity: 1,
          emptyMsg:
            'A leather wingback chair, its hide cracked and faded, still holding the shape of countless sitters.',
          occupiedMsg: '%s in the wingback chair',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'grandfather clock',
          aliases: ['clock', 'pendulum'],
          description: `A grandfather clock in dark walnut, its case rising nearly eight feet, its brass pendulum frozen mid-swing at 2:47. The clock was made in the 1890s, survived two world wars, kept time for five generations. It stopped when the power grid failed—the pendulum needed no electricity, but the owner who wound it every Sunday never came back. The chimes are silent. The hours pass unannounced.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'china cabinet',
          aliases: ['cabinet', 'china', 'dishes'],
          description: `A curved-glass china cabinet displaying porcelain from estates long settled. Blue willow plates, hand-painted teacups, serving dishes with gold trim. The porcelain has survived fifty-five years without incident—no earthquakes, no looters interested in fragile beauty. The dishes wait for tables that will never be set.`,
        },
        {
          prototype: 'furniture',
          name: 'secretary desk',
          aliases: ['desk', 'secretary'],
          description: `A secretary desk with a drop-front writing surface and dozens of small compartments—the kind designed to hold correspondence, accounts, the paper business of a pre-digital life. The compartments are empty now, whatever secrets they held removed or rotted. The desk surface is stained with ink from pens that dried out decades ago.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'estate sale sign',
          aliases: ['sign', 'everything must go'],
          description: `A hand-lettered sign in the display window: "EVERYTHING MUST GO - FINAL DAYS." The sign is yellowed with age, its urgency made permanent. Everything was meant to go. Nothing did. The final days became final decades.`,
        },
      ],
    },

    '%SHOWROOM_BACK': {
      name: 'Pioneer Antiques - Back Showroom',
      description: `The back showroom continues the maximalist theme, specializing in the larger pieces that wouldn't fit in the window display. Wardrobes and armoires line the walls, their doors hanging open to show empty interiors that once held someone's entire wardrobe. Dining tables are stacked with chairs inverted on their surfaces, legs pointing upward like a forest of wooden antlers.

A decorative suit of armor stands in one corner, its visor down, its gauntlets at its sides—probably never worn in battle, manufactured as decor in the 19th century, now guarding an empty store. A brass cash register sits on a display counter, its drawer sealed, its mechanical workings frozen. The prices on the tags are in dollars that no longer exist.

The smell here is of old wood and dust, the ghost of furniture polish overwhelmed by decades of neglect. Cobwebs connect the taller pieces, the spiders long since dead, their webs now just geometry made of dust.`,
      x: -4,
      y: 6,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%SHOWROOM_FRONT',
        north: '%STORAGE',
        up: {
          to: 'z1.ts#GALLERY_LANDING',
          description: 'A staircase leads to the upstairs gallery',
          door: '%UPSTAIRS_DOOR',
        },
      },
      sittables: [
        {
          name: 'dining chair',
          capacity: 1,
          emptyMsg:
            'One of many dining chairs, this one set upright, its needlepoint cushion faded but intact.',
          occupiedMsg: '%s in the dining chair',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'suit of armor',
          aliases: ['armor', 'knight'],
          description: `A decorative suit of armor, probably 19th century, manufactured for wealthy collectors who wanted medieval aesthetics without medieval warfare. The armor is dusty but intact, visor down, gauntlets at its sides. It guards an empty antique store now, which is more than it ever guarded before.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'armoires',
          aliases: ['wardrobes', 'cabinets'],
          description: `A row of armoires and wardrobes, their doors hanging open, their interiors empty. Each once held someone's clothes, someone's linens, the textile accumulation of a life. The clothes were sold or donated before the furniture came here. The armoires hold only dust and the smell of cedar that has almost faded.`,
          boltedDown: true,
        },
        {
          prototype: 'desk',
          name: 'cash counter',
          aliases: ['counter', 'register'],
          description: `A glass display counter with a brass cash register, the kind with ornate scrollwork and mechanical keys. The drawer is sealed shut, whatever cash inside worthless now but present. Price tags on items nearby show amounts in dollars—$450 for a mirror, $1,200 for a desk. The prices meant something once.`,
        },
        {
          prototype: 'describable',
          name: 'stacked chairs',
          aliases: ['chairs', 'dining chairs'],
          description: `Dining tables stacked with inverted chairs, legs pointing upward like a forest of wooden antlers. The arrangement was meant to save floor space, make room for browsing customers. No customers have browsed in fifty-five years. The chairs remain inverted, waiting to be set down around tables that will never be set.`,
        },
      ],
    },

    '%FURNITURE_HALL': {
      name: 'Pioneer Antiques - Furniture Hall',
      description: `A long narrow hall lined with furniture too large for the main showrooms—the pieces that required dedicated space, that customers came specifically seeking. Bedroom sets are arranged in approximations of rooms: bed frames with mattresses long since rotted, matching dressers and vanities, nightstands paired as they were in homes that no longer exist.

The beds are stripped of linens, their mattresses collapsed and stained, springs visible through torn fabric. Mice nested here at some point, though no mice remain—even vermin have moved on. The bedroom sets represent complete domestic visions: here is how you were supposed to live, here is the furniture that would make your life orderly and beautiful. The vision survives. The lives don't.

Office furniture fills one section: oak desks with green leather tops, swivel chairs with wooden arms, filing cabinets with brass handles. The tools of business from before business became digital, then became irrelevant.`,
      x: -3,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SHOWROOM_FRONT',
        west: '%STORAGE',
        east: {
          to: '%OFFICE',
          description: 'A door marked PRIVATE leads to the office',
          door: '%OFFICE_DOOR',
        },
      },
      sittables: [
        {
          name: 'oak swivel chair',
          capacity: 1,
          emptyMsg:
            'An oak swivel chair with a worn leather seat, the kind that equipped offices before ergonomics was invented.',
          occupiedMsg: '%s in the swivel chair',
        },
        {
          name: 'collapsed bed',
          capacity: 2,
          emptyMsg:
            'A bed frame with a mattress that has collapsed in the middle, its springs visible through torn fabric.',
          occupiedMsg: '%s on the collapsed bed',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'bedroom set',
          aliases: ['bed', 'dresser', 'vanity'],
          description: `A complete bedroom set arranged as it might appear in a home: bed frame, matching dresser, vanity with mirror, paired nightstands. The mattress has collapsed and stained, the mirror spotted with age, the dresser drawers empty. The set represents a domestic vision from another era—here is how you were supposed to live. No one lives this way anymore.`,
          boltedDown: true,
        },
        {
          prototype: 'desk',
          name: 'oak desk',
          aliases: ['desk', 'office desk'],
          description: `An oak partner's desk with a green leather top, the kind that equipped offices before computers made flat surfaces irrelevant. Brass handles on the drawers, a leather blotter stained with decades of use, pen holders with dried-out ink. The desk is a monument to a way of working that ended before The Burning.`,
        },
        {
          prototype: 'cabinet',
          name: 'filing cabinets',
          aliases: ['files', 'cabinets'],
          description: `Oak filing cabinets with brass handles, the kind that held paper records in alphabetical order. The drawers are empty—whatever files they held removed or rotted. The cabinets represent an organizational system that required physical space, physical effort. The system is obsolete twice over.`,
        },
      ],
    },

    '%STORAGE': {
      name: 'Pioneer Antiques - Storage',
      description: `The storage area is where the overflow accumulated—pieces awaiting appraisal, items not yet priced, the inventory that arrived faster than it could be processed. Furniture is stacked three deep, chairs inverted on tables inverted on other tables, a Tetris of accumulated domesticity.

Cardboard boxes line the walls, their contents labeled in faded marker: "ESTATE MORRISON - SILVER," "CONSIGNMENT 6/62 - GLASSWARE," "UNSORTED." The boxes contain the concentrated material wealth of lives that ended and were liquidated. Some boxes have collapsed, their contents spilled across the floor—silverware tarnished black, glassware surprisingly intact.

A delivery door leads to the back alley, wide enough to admit the largest furniture. The door is reinforced with steel bands, scratched and dented from decades of inventory movement. A clipboard on the wall holds delivery manifests from the last shipments, dated early August 2062.`,
      x: -4,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SHOWROOM_BACK',
        east: '%FURNITURE_HALL',
        north: {
          to: null, // Alley not implemented
          description: 'A delivery door leads to the back alley',
          door: '%BACK_DOOR',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'estate boxes',
          aliases: ['boxes', 'cartons'],
          description: `Cardboard boxes labeled with estate names and contents: "ESTATE MORRISON - SILVER," "JENSEN CONSIGNMENT - CHINA," "UNSORTED - PRIORITY." Each box contains the material legacy of someone who died, their possessions reduced to inventory. Some boxes have collapsed, spilling tarnished silver and dusty glassware across the floor.`,
        },
        {
          prototype: 'furniture',
          name: 'stacked furniture',
          aliases: ['furniture', 'pile'],
          description: `Furniture stacked three deep, an impossible puzzle of chairs and tables and dressers. The stacking was efficient once—a system for maximizing storage space. The system is frozen now, no one remaining to disassemble it. The furniture at the bottom has been supporting the weight for fifty-five years.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'delivery manifests',
          aliases: ['manifests', 'clipboard', 'records'],
          description: `A clipboard on the wall holding delivery manifests from early August 2062. The last delivery was August 12—a bedroom set from the Peterson estate, a dining table from a restaurant closing. The items were received but never processed. The manifests are the last business records of a business that never officially closed.`,
        },
        {
          prototype: 'describable',
          name: 'spilled silverware',
          aliases: ['silver', 'silverware', 'flatware'],
          description: `Silverware spilled from a collapsed box, scattered across the floor—forks and spoons and serving pieces, all tarnished black from fifty-five years of oxidation. The silver could be polished back to shine. No one has bothered. The pattern on the handles identifies it as someone's wedding silver, someone's family inheritance.`,
        },
      ],
    },

    '%OFFICE': {
      name: 'Pioneer Antiques - Office',
      description: `The back office where the business of antiques happened—appraisals and negotiations, the paperwork that transformed someone's heirlooms into inventory. A desk is covered with papers that have yellowed and curled, forms and invoices and handwritten notes. A computer sits dark and dead, its technology obsolete even before The Burning made all technology irrelevant.

Reference books line one wall: price guides for various collectibles, auction records, identification manuals for silver marks and furniture styles. The books are outdated now—prices that meant something in 2062 mean nothing in 2110—but the knowledge they contain about identifying antiques remains valid. Things don't change just because the world did.

A safe sits in the corner, its door closed, its combination lock set. Whatever valuables warranted a safe—cash, gold, jewelry consigned for sale—are still inside, presumably. The safe has kept its secrets for fifty-five years.`,
      x: -3,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%FURNITURE_HALL',
      },
      sittables: [
        {
          name: 'desk chair',
          capacity: 1,
          emptyMsg:
            'A wooden desk chair with a cracked leather seat, positioned behind the cluttered desk.',
          occupiedMsg: '%s in the desk chair',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'cluttered desk',
          aliases: ['desk', 'papers'],
          description: `A desk covered with the paper trail of an antiques business: appraisal forms, consignment agreements, handwritten notes about provenance and pricing. The papers have yellowed and curled, the ink fading. The last entries are from early August 2062, routine business that continued until business became impossible.`,
        },
        {
          prototype: 'cabinet',
          name: 'reference books',
          aliases: ['books', 'guides', 'manuals'],
          description: `Reference books for the antiques trade: price guides for silver and furniture, identification manuals for pottery marks and furniture styles, auction records from major houses. The prices are obsolete—what cost $5,000 in 2062 costs nothing in 2110—but the knowledge about identifying and dating antiques remains valid.`,
        },
        {
          prototype: 'safe',
          name: 'floor safe',
          aliases: ['safe', 'vault'],
          description: `A floor safe in the corner, its door closed, its combination dial showing random numbers. Whatever warranted secure storage—cash, gold, consigned jewelry—remains inside. The safe has kept its secrets for fifty-five years. It might keep them forever, or until someone with patience and a stethoscope comes along.`,
          locks: [],
        },
        {
          prototype: 'describable',
          name: 'dead computer',
          aliases: ['computer', 'monitor'],
          description: `A desktop computer from the early 2060s, its monitor dark, its tower silent. The computer was already outdated when The Burning came—this business ran on paper as much as data. The hard drive might contain inventory records, customer lists, the digital memory of a business. The hard drive is inaccessible without power.`,
        },
      ],
    },
  },

  postProcessors: [],
};
