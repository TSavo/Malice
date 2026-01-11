// Second Chance Thrift - Ground Floor (z=0)
// Thrift store with mannequins and vintage clothing
// Three-story building with apartments above

export const building = {
  name: 'Second Chance Thrift',
  x: -10,
  y: 8,
  width: 3,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Thrift Store Lock',
      description:
        'A simple commercial deadbolt, the kind found on every retail door in America.',
      difficulty: 3,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Thrift Store Entrance',
      description:
        'A glass door with an aluminum frame, covered in donation hours and sale announcements. A bell hangs at the top, designed to jingle when opened. A CLOSED sign hangs crooked in the window.',
      locked: true,
      open: false,
      locks: ['%FRONT_LOCK'],
      material: 'glass',
      durability: 35,
    },
    '%STAIR_LOCK': {
      prototype: 'lock',
      name: 'Stairwell Lock',
      description:
        'A deadbolt separating the retail space from the residential stairwell above.',
      difficulty: 3,
    },
    '%STAIR_DOOR': {
      prototype: 'door',
      name: 'Stairwell Door',
      description:
        'A fire-rated door marked PRIVATE - NO ENTRY. The door separates the thrift store from the apartment stairwell.',
      locked: true,
      open: false,
      locks: ['%STAIR_LOCK'],
      material: 'metal',
      durability: 75,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - THRIFT STORE
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN_FLOOR': {
      name: 'Second Chance Thrift - Main Floor',
      description: `The main floor of Second Chance Thrift is a maze of circular racks and display shelves, organized with the desperate logic of businesses that receive random donations and must impose order on chaos. Clothing is sorted by color—a gradient from white through grey to black, then around through brown and tan to the brights that nobody wanted. The color organization makes finding specific items impossible but makes browsing oddly meditative.

Mannequins stand at strategic intervals, dressed in outfits assembled by staff with varying degrees of fashion sense. One wears a polyester pantsuit from the 1970s; another sports a formal gown with sneakers; a third has been left headless, its neckline stuffed with tissue paper. The mannequins are not so much modeling as haunting.

The smell is distinctive: mothballs and fabric softener and the particular mustiness of clothing that has lived in closets for decades. It's not unpleasant, exactly. It's the smell of previous lives, previous wardrobes, previous hopes about what people might wear and when.`,
      x: -11,
      y: 6,
      z: 0,
      imageOnDisk: 's-washington-st-x-11-y6-z0.png',
      population: 0,
      ambientNoise: 1,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 's-washington/x-11.ts',
          description: 'The glass door leads to S. Washington St',
          door: '%FRONT_DOOR',
        },
        east: '%HOUSEWARES',
        north: '%FITTING_ROOMS',
        west: '%DONATION_AREA',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'clothing racks',
          aliases: ['racks', 'clothes', 'clothing'],
          description: `Circular racks of clothing sorted by color, the visual organization that thrift stores have perfected. White shirts fade to cream to tan to brown; grey blouses transition through charcoal to black. The gradient is almost beautiful, until you realize it means finding a specific size requires checking every item in the color you want. Someone thought this was helpful. Someone was optimistic about the patience of shoppers.`,
        },
        {
          prototype: 'describable',
          name: 'mannequins',
          aliases: ['mannequin', 'display'],
          description: `Mannequins in various states of dress and disrepair stand throughout the store. One wears a powder-blue polyester suit with bell bottoms and a ruffled shirt—unironic formal wear from 1974. Another sports a wedding dress with combat boots, possibly an artistic choice, possibly an accident. A third mannequin has no head, its neck stuffed with tissue paper, its outfit a sensible cardigan over slacks. The headless one is somehow the least disturbing.`,
        },
        {
          prototype: 'describable',
          name: 'price tags',
          aliases: ['tags', 'prices'],
          description: `Color-coded price tags dangle from everything—red for $2.99, blue for $5.99, green for $8.99, the hierarchy of thrift value. The prices are absurdly low by any measure, the economics of donated goods priced to move. A cashmere sweater for $3. A leather jacket for $10. The prices assumed a world where money existed and mattered. The assumption is questionable now.`,
        },
      ],
    },

    '%HOUSEWARES': {
      name: 'Second Chance Thrift - Housewares',
      description: `The housewares section occupies the east side of the store, a graveyard of kitchen appliances and decorative objects that someone once wanted and then stopped wanting. Shelves hold mismatched dishes, orphaned coffee mugs, vases in shapes that were fashionable in specific decades. The items are organized by type: plates with plates, cups with cups, the order of commerce imposed on the disorder of donation.

A glass case displays the "valuables"—jewelry too cheap to steal but expensive enough to lock up, vintage watches that don't work, silver-plated serving ware that no one serves with anymore. The case is locked but not protected; the contents have more sentimental than monetary value.

Small appliances cluster on a back shelf: blenders with missing lids, waffle irons from the 1980s, a George Foreman grill still in its box. The appliances are priced to move at $3.99 each, the recognition that used electronics are essentially free. Some of them probably still work. Most of them probably don't.`,
      x: -10,
      y: 6,
      z: 0,
      imageOnDisk: 's-washington-st-x-10-y6-z0.png',
      population: 0,
      ambientNoise: 1,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%MAIN_FLOOR',
        north: '%BOOKS_MEDIA',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'dish shelves',
          aliases: ['dishes', 'plates', 'cups'],
          description: `Shelves stacked with donated dishware in every possible pattern and style. Corelle from the 1970s sits next to Fiestaware next to restaurant surplus. Coffee mugs advertise companies that no longer exist, vacations to places that have changed, jokes that are no longer funny. Each dish has a history. The histories are erased, leaving only objects.`,
        },
        {
          prototype: 'cabinet',
          name: 'jewelry case',
          aliases: ['jewelry', 'case', 'valuables'],
          description: `A glass display case holding the store's more valuable items—costume jewelry that might be real, watches that might work, silver plate that might be sterling. The items are locked behind glass but priced to sell: a pearl necklace for $15, a men's watch for $8, a silver tea service for $25. The prices suggest optimism about customers who no longer come.`,
        },
        {
          prototype: 'cabinet',
          name: 'small appliances',
          aliases: ['appliances', 'blenders', 'electronics'],
          description: `A shelf of small appliances in various states of functionality: blenders missing blades, coffee makers without carafes, toasters with questionable wiring. Each item is priced at $3.99 regardless of condition, the recognition that testing every donation is impossible. Buyer beware. Buyer is absent. The appliances wait.`,
        },
      ],
    },

    '%BOOKS_MEDIA': {
      name: 'Second Chance Thrift - Books & Media',
      description: `The books and media section fills a corner of the store, shelves sagging under the weight of donated reading material. Paperbacks are sorted by genre—romance with its characteristic spines, thrillers with raised lettering, literary fiction trying to look important. The sorting is approximate; a Stephen King novel sits between two Danielle Steeles, either miscategorized or making a statement about genre.

VHS tapes fill one shelf, relics of a dead format that nobody wants and nobody throws away. DVDs occupy the next shelf, a slightly less dead format. A few Blu-rays suggest donations from the recently departed, their collections now part of the store's archaeological record of media consumption.

A shelf of CDs holds the music that people owned before streaming made ownership pointless. The selection is heavy on compilations: NOW THAT'S WHAT I CALL MUSIC volumes, movie soundtracks, the audio equivalent of greatest hits. Individual artist CDs are scattered among them, their jewel cases cracked, their liner notes unread.`,
      x: -10,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%HOUSEWARES',
        west: '%FITTING_ROOMS',
      },
      sittables: [
        {
          name: 'a reading chair',
          capacity: 1,
          emptyMsg:
            'An overstuffed armchair sits in the corner, donated and now serving as seating for browsers.',
          occupiedMsg: '%s settled into the reading chair',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'book shelves',
          aliases: ['books', 'paperbacks', 'novels'],
          description: `Shelves of paperback books sorted by genre, their spines forming a rainbow of reading material. Romance novels with embossed titles dominate one section; mysteries with dark covers claim another. The books are priced by size: $0.50 for paperbacks, $1 for trade editions, $2 for hardcovers. The prices assume readers still exist. The books wait to find out.`,
        },
        {
          prototype: 'cabinet',
          name: 'VHS tapes',
          aliases: ['vhs', 'tapes', 'videos'],
          description: `A shelf of VHS tapes, relics of the analog era. Disney clamshells, exercise videos, movies recorded off television with commercials intact. The tapes are priced at $0.25 each, the recognition that the format is essentially worthless. A sign reads: "VHS TAPES - TEST AT YOUR OWN RISK." The risk is minimal. The reward is nostalgia.`,
        },
        {
          prototype: 'cabinet',
          name: 'CD collection',
          aliases: ['cds', 'music', 'albums'],
          description: `CDs in their jewel cases, the music people owned before streaming made ownership obsolete. NOW THAT'S WHAT I CALL MUSIC volumes spanning decades. Movie soundtracks from films that defined eras. Single-artist albums from bands that were popular and are now forgotten. Each CD is $1, the going rate for physical music in an age of infinite digital access.`,
        },
      ],
    },

    '%FITTING_ROOMS': {
      name: 'Second Chance Thrift - Fitting Rooms',
      description: `The fitting rooms are curtained cubicles along the back wall, their privacy approximate, their mirrors clouded with age. A sign limits customers to six items at a time, the rule of thrift stores everywhere—a defense against shoplifters who might layer their finds under their own clothes.

A chair sits outside the cubicles, the waiting spot for companions of shoppers who wanted opinions on their finds. The chair is a donation itself—a vinyl recliner from the 1960s, its surface cracked but still comfortable.

The mirrors inside the cubicles are the kind that make everyone look slightly worse than they are—deliberate, perhaps, since looking good in a bad mirror means looking great in a good one. The fluorescent lighting doesn't help. Nobody ever looked good in fluorescent lighting.

A door at the back is marked PRIVATE, leading to the stairwell that accesses the apartments above.`,
      x: -11,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%MAIN_FLOOR',
        east: '%BOOKS_MEDIA',
        north: {
          description: 'A door marked PRIVATE leads to the stairwell',
          door: '%STAIR_DOOR',
          to: '%STAIRWELL',
        },
      },
      sittables: [
        {
          name: 'the waiting chair',
          capacity: 1,
          emptyMsg:
            'A cracked vinyl recliner sits outside the fitting rooms, waiting for companions who will never arrive.',
          occupiedMsg: '%s sitting in the waiting chair',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'fitting cubicles',
          aliases: ['cubicles', 'curtains', 'rooms'],
          description: `Three fitting cubicles with curtain doors, each one barely wide enough to turn around in. The curtains are mismatched—floral print, solid blue, a shower curtain repurposed when the original wore out. Inside each cubicle: a mirror, a hook, and barely enough room to change. The privacy is psychological rather than physical.`,
        },
        {
          prototype: 'describable',
          name: 'six-item sign',
          aliases: ['sign', 'rules'],
          description: `A handwritten sign reads: "6 ITEM LIMIT IN FITTING ROOMS - NO EXCEPTIONS." The rule was meant to prevent shoplifting—layer enough clothes under your own and you could walk out wearing the inventory. The rule is unenforced now. The inventory is unguarded. The exceptions are universal.`,
        },
      ],
    },

    '%DONATION_AREA': {
      name: 'Second Chance Thrift - Donation Receiving',
      description: `The donation receiving area is the back of house, where the chaos arrives before being sorted into commerce. A long table holds items waiting for processing: bags of clothing not yet sorted, boxes of housewares not yet priced, the raw material of the thrift economy.

Rolling bins line one wall, labeled by category: WOMEN'S TOPS, MEN'S PANTS, KIDS, HOUSEWARES, TRASH. The taxonomy of donation, the first step toward order. Some bins are overflowing, donations that arrived faster than staff could process. Other bins are nearly empty, the categories that move quickly.

A time clock hangs on the wall, employees' punch cards still in the rack beside it. The last punches are from whenever the end came—some cards show arrivals without departures, the record of a shift that never ended.`,
      x: -12,
      y: 6,
      z: 0,
      imageOnDisk: 's-washington-st-x-12-y6-z0.png',
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%MAIN_FLOOR',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'sorting table',
          aliases: ['table'],
          description: `A long folding table covered with unsorted donations: bags of clothing spilling their contents, boxes of kitchen items, the miscellany of lives being simplified. The sorting was interrupted. The donations wait in the same disorder they arrived, neither processed nor rejected, in limbo.`,
        },
        {
          prototype: 'cabinet',
          name: 'sorting bins',
          aliases: ['bins', 'rolling bins'],
          description: `Large rolling bins with handwritten labels: WOMEN'S TOPS, MEN'S PANTS, KIDS CLOTHES, HOUSEWARES, ELECTRONICS, TRASH. The bins represent the categories of donation, the first step in turning chaos into commerce. Some bins overflow; others are nearly empty. The distribution says something about what people donated most often. Clothing, mostly. Always clothing.`,
        },
        {
          prototype: 'describable',
          name: 'time clock',
          aliases: ['clock', 'punch'],
          description: `A mechanical time clock mounted on the wall, employees' punch cards in a rack beside it. The cards show names: MARIA T., DEVON S., JANELLE R. The last punches are from the day everything stopped—some show clock-in times without corresponding clock-outs. Some employees left. Some employees didn't leave in time. The clock doesn't distinguish.`,
        },
      ],
    },

    '%STAIRWELL': {
      name: 'Second Chance Building - Stairwell',
      description: `The stairwell serves the apartments above, a narrow climb through the building's infrastructure. The stairs are concrete with metal railings, industrial construction from when the building was new. Mailboxes are mounted on the wall—four of them, numbered 1 through 4, their locks scratched and their contents empty.

The walls are painted institutional beige, the color of landlords who don't invest in aesthetics. Graffiti tags mark the landings, the inevitable decoration of urban stairwells. Most of the tags are illegible—stylized letters that communicate presence rather than meaning.

The smell of cooking has long since faded, replaced by the mustiness of unventilated space. Whatever the residents cooked is forgotten. The architecture that contained their lives remains.`,
      x: -11,
      y: 7,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          description: 'The fire door leads back to the thrift store',
          door: '%STAIR_DOOR',
          to: '%FITTING_ROOMS',
        },
        up: 'z1.ts#LANDING',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'mailboxes',
          aliases: ['mailbox', 'mail'],
          description: `Metal mailboxes mounted on the wall, four of them numbered for the apartments above. The boxes are the small kind—meant for letters, not packages. Each lock shows the scratches of years of keys. The boxes are empty now. The mail stopped. The boxes remain, labeled for residents who have departed.`,
        },
        {
          prototype: 'describable',
          name: 'graffiti tags',
          aliases: ['tags', 'graffiti'],
          description: `Graffiti tags cover the stairwell walls, layered over years of application. The styles overlap: bubble letters over angular throws over simple tags. Most are illegible to anyone outside the scene—names transformed into symbols, presence marked in spray paint. KRONOS was here. SEAZ was here. Everyone was here, at some point.`,
        },
      ],
    },
  },
};
