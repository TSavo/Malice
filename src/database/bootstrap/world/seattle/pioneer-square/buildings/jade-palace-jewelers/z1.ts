// Jade Palace Jewelers - Upper Floor (z=1)
// Residential apartments above the jewelry store
// The International District's characteristic density: commercial below, residential above

export const floor = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // FIRST FLOOR (z=1) - RESIDENTIAL
    // ═══════════════════════════════════════════════════════════════════

    '%STAIRWELL': {
      name: 'Residential Stairwell',
      description: `A narrow stairwell connects the commercial ground floor to the residential units above. The stairs are worn at their centers, decades of foot traffic having polished the wood smooth before the traffic stopped. A handrail runs along one wall, its paint chipped, its brackets loose.

The stairwell smells of enclosed space—dust and old wood and the memory of cooking from apartments that no longer cook. A small window at the landing lets in gray light, its glass unwashed for fifty-five years. Mailboxes for the residential units are mounted on the wall: three boxes, three apartments, all full of mail that turned to mulch decades ago.

The building's characteristic density is evident here: every inch of vertical space monetized, the commercial ground floor giving way to residential units where the building's true population lived. The businesses provided services. The apartments provided community.`,
      x: 11,
      y: -6,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: {
          to: 'z0.ts#SHOWROOM',
          description: 'Stairs lead down to the jewelry store',
        },
        north: '%HALLWAY',
        up: {
          to: 'z2.ts#ROOF_ACCESS',
          description: 'Stairs continue up to the roof',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'mailboxes',
          aliases: ['mail', 'boxes'],
          description: `Three brass mailboxes, one for each apartment, mounted on the stairwell wall. The boxes are stuffed with mail that decomposed decades ago—bills, advertisements, letters from family overseas. The overflow sits on the floor beneath, a mulch of paper that was once communication. Unit 1A, 1B, 1C: the addresses still legible, the residents long gone.`,
        },
        {
          prototype: 'describable',
          name: 'landing window',
          aliases: ['window', 'light'],
          description: `A small window at the landing, unwashed for decades, letting in diffused gray light. Through the grimy glass: the narrow alley between buildings, fire escapes climbing upward, the density of the International District visible in the proximity of walls. The window doesn't open. It just illuminates.`,
        },
      ],
    },

    '%HALLWAY': {
      name: 'Residential Hallway',
      description: `A narrow hallway runs the length of the building's second floor, three apartment doors opening off it. The carpet is threadbare, worn through to the floorboards in spots, patterned in a design that was outdated when it was installed. The walls are painted a color that might once have been cream, now yellowed and water-stained in patches.

Light fixtures overhead are dead, their bulbs burned out long before the power failed. A fire extinguisher is mounted on one wall, its gauge in the red—either discharged or degraded, useless either way. Exit signs point to the stairwell at each end, their emergency batteries decades dead.

The apartment doors are numbered 1A, 1B, and 1C. Some have decorations still hanging—a paper sign in Chinese, a faded wreath, the personal touches that made rental units into homes. The doors are closed, their secrets kept, the lives within frozen at the moment everything stopped.`,
      x: 11,
      y: -5,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STAIRWELL',
        west: '%APT_1A',
        east: '%APT_1B',
        north: '%APT_1C',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'apartment doors',
          aliases: ['doors', 'units'],
          description: `Three apartment doors, each with a brass number and personal decorations that hint at the residents within. 1A has a paper sign with Chinese characters—a blessing, perhaps, or a family name. 1B has a dried wreath that crumbles to touch. 1C is bare, practical, no decoration needed. The doors are all closed. They've been closed for fifty-five years.`,
        },
        {
          prototype: 'describable',
          name: 'fire extinguisher',
          aliases: ['extinguisher', 'fire safety'],
          description: `A fire extinguisher mounted on the wall, its gauge deep in the red zone. Either it was discharged at some point—used against a fire that no one recorded—or the pressure degraded over decades. The pin is still in place. The nozzle is corroded. It won't save anything from fire now.`,
        },
        {
          prototype: 'describable',
          name: 'exit signs',
          aliases: ['signs', 'exit'],
          description: `Green exit signs point toward the stairwells, their battery-powered lights dead for decades. The signs are a reminder of building codes, of safety regulations, of a society that cared about emergency egress. The exits still work. The regulations no longer apply.`,
        },
      ],
    },

    '%APT_1A': {
      name: 'Apartment 1A',
      description: `A small studio apartment, the kind that housed single workers or elderly widows—people who needed little space and less company. The room serves every function: a twin bed against one wall, a kitchenette in the corner, a table that was desk and dining surface both.

The bed is made, the covers pulled tight in the old way, the way parents taught children who grew up in harder times. A wardrobe stands open, its contents moth-eaten but still arranged by type: work clothes, Sunday clothes, the careful organization of someone with little who valued what they had.

The kitchenette is tidy, dishes washed and stacked, as if the resident expected to return. A rice cooker sits on the counter, its bowl still inside, a reminder of the meals that sustained a life of simple needs. Photos are tacked to the wall above the bed: children and grandchildren, formal portraits and candid shots, the faces of people who probably never knew what happened to their relative here.

The window looks out on the fire escape, the view of brick walls and steel stairs that thousands of International District residents knew intimately. A small shrine sits on the windowsill: incense long since burned to ash, oranges long since rotted to nothing, the offerings to ancestors that tied this life to those that came before.`,
      x: 10,
      y: -5,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%HALLWAY',
      },
      objects: [
        {
          prototype: 'bed',
          name: 'twin bed',
          aliases: ['bed', 'cot'],
          capacity: 1,
          emptyMsg:
            'A twin bed is made with military precision, the covers pulled tight.',
          occupiedMsg:
            'Someone lies on the narrow bed, disturbing covers that have been still for decades.',
          description: `A twin bed pushed against the wall, made with the precision of someone who valued order. The bedspread is faded but clean—it was clean when the resident last left. A pillow still shows the indentation of a head, a memory of the last night's sleep. The mattress has compressed over decades, but the bed is still a bed. Someone could sleep here. Someone might.`,
        },
        {
          prototype: 'cabinet',
          name: 'wardrobe',
          aliases: ['closet', 'clothes'],
          description: `A wooden wardrobe, its doors standing open, revealing clothes organized with care. Work clothes on one side: simple blouses, practical pants. Better clothes on the other: a qi pao for special occasions, a wool coat for Seattle's mild winters. The clothes are moth-eaten now, the fabrics fragile, but the organization remains. Someone knew exactly where everything was.`,
        },
        {
          prototype: 'describable',
          name: 'ancestor shrine',
          aliases: ['shrine', 'altar', 'offerings'],
          description: `A small shrine on the windowsill, the kind that connected living to dead. Incense sticks have burned to ash in a brass holder. Oranges rotted to nothing and then dried to dust. Small photos of faces from another era: parents, grandparents, the chain of ancestors that this resident honored. The shrine is a connection across time. The connection is unbroken, even if no one tends it.`,
        },
        {
          prototype: 'describable',
          name: 'family photos',
          aliases: ['photos', 'pictures'],
          description: `Photos tacked to the wall above the bed, the faces of a family scattered across distance. Children grown to adults, grandchildren born after the resident immigrated. Formal portraits from photography studios, candid shots from visits that required plane tickets. The people in these photos probably never knew what happened to their relative. The photos are the only record that someone lived here and was loved.`,
        },
        {
          prototype: 'describable',
          name: 'rice cooker',
          aliases: ['cooker', 'kitchen', 'kitchenette'],
          description: `A rice cooker on the kitchenette counter, the appliance that made single-living possible. The inner pot is still in place, clean, waiting for rice that will never be added. The cooker is unplugged, its cord neatly coiled. The last meal was eaten, the dishes washed, the routine completed. Then the routine stopped.`,
        },
      ],
    },

    '%APT_1B': {
      name: 'Apartment 1B',
      description: `A one-bedroom apartment, larger than 1A, occupied by what was probably a young couple or small family. The main room combines living and dining, with a galley kitchen along one wall. A bedroom door stands open, revealing a double bed and a crib beside it.

The living room speaks of young life interrupted: a TV stand with no TV (looted?), a couch with cushions still compressed from use, toys scattered on the floor. The toys are the hardest part—plastic blocks and stuffed animals and a mobile that once hung above a crib, the evidence of a child who was learning to exist.

The kitchen is less tidy than 1A, the messiness of people too busy with work and child-rearing to maintain perfect order. Dishes in the sink, a calendar on the wall with dates circled in marker, the chaos of family life frozen mid-moment.

The bedroom is visible through its open door: the double bed unmade, the crib beside it with blankets arranged for a sleeping infant. A changing table holds supplies that decomposed decades ago. The mobile above the crib has sailboats and clouds, still as the air that hasn't moved in fifty-five years.`,
      x: 12,
      y: -5,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALLWAY',
      },
      objects: [
        {
          prototype: 'couch',
          name: 'family couch',
          aliases: ['couch', 'sofa'],
          capacity: 3,
          emptyMsg:
            'A couch with compressed cushions shows the shapes of the family that used it.',
          occupiedMsg:
            'Someone sits on the family couch, adding their weight to the memory of those who sat here before.',
          description: `A couch facing where the TV used to be—the center of family evenings, the place where parents collapsed after work while children played on the floor. The cushions are compressed into permanent shapes: adult shapes on the ends, child-sized depressions in the middle. Crumbs are fossilized in the seams. A baby bottle lies wedged between cushions, its contents dried to residue decades ago.`,
        },
        {
          prototype: 'describable',
          name: 'scattered toys',
          aliases: ['toys', 'blocks', 'stuffed animals'],
          description: `Toys scattered across the floor in the random pattern of play interrupted. Plastic building blocks in primary colors. A stuffed rabbit with one ear chewed. A wooden train missing a wheel. The toys speak of a child who was learning to play, to build, to imagine. The child would be middle-aged now, if the child survived. The toys don't know. The toys just wait.`,
        },
        {
          prototype: 'describable',
          name: 'bedroom doorway',
          aliases: ['bedroom', 'door'],
          description: `The bedroom door stands open, revealing the sleeping space of a young family. A double bed with tangled sheets—the parents slept restlessly, probably awakened by the baby in the crib beside them. The crib is small, with bars and a mobile above it. The mobile has sailboats and clouds, frozen in air that hasn't stirred in fifty-five years. The baby blankets are still arranged for a sleeping infant.`,
        },
        {
          prototype: 'describable',
          name: 'family calendar',
          aliases: ['calendar', 'dates'],
          description: `A calendar on the kitchen wall, open to a month fifty-five years past. Dates are circled in red marker: doctor's appointments for the baby, work deadlines, someone's birthday. The future was planned, the days allocated. Then the plans stopped mattering. The circled dates came and went without anyone to notice.`,
        },
        {
          prototype: 'describable',
          name: 'kitchen sink',
          aliases: ['sink', 'dishes'],
          description: `A sink with dishes that were never washed—the chaos of morning rushed, of parents balancing infant care with work preparation. Bottles and bowls, a coffee mug with the dregs of the last coffee, a pan with something that was once food. The mess speaks of life too busy for tidiness. The tidying never happened.`,
        },
      ],
    },

    '%APT_1C': {
      name: 'Apartment 1C',
      description: `The largest apartment on the floor, a corner unit with windows on two sides. This was probably the landlord's unit, or the building owner's family—the apartment that got the best light, the most space, the corner position that signaled status within the building's hierarchy.

The furniture is heavier, more traditional: dark wood pieces that Chinese families passed through generations. A formal dining set occupies one area, the table set for a meal that was never eaten—or eaten and never cleared. A living room area has a TV cabinet (TV missing), armchairs upholstered in fabric that was expensive when it was new, a coffee table with a tea service still arranged.

The kitchen is larger than the others, with a wok range that serious cooks required—the kind of burner that generated the heat for proper stir-frying. Pots hang from a rack, the batterie de cuisine of someone who cooked often and well.

The bedroom is through a doorway with no door, just a curtain that has rotted on its rod. The bed inside is a proper double, the kind that married couples shared for decades. Matching nightstands, matching lamps, the symmetry of long partnership. Photos on the dresser show a couple aging together, the same two faces across decades.`,
      x: 11,
      y: -4,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%HALLWAY',
      },
      objects: [
        {
          prototype: 'table',
          name: 'formal dining set',
          aliases: ['dining', 'table', 'chairs'],
          capacity: 6,
          emptyMsg:
            'A formal dining set waits for a meal, the table set but unused.',
          occupiedMsg:
            'Someone sits at the formal dining table, joining a meal that was never served.',
          description: `A formal dining table of dark wood—rosewood, probably, the kind that Chinese families valued—surrounded by chairs with carved backs. The table is set for a meal: bowls, chopsticks, a serving dish in the center covered with a lid that hides whatever was beneath (nothing now, or dust, or the ghost of dinner). The meal was never served, or never cleared. Fifty-five years is too long to tell which.`,
        },
        {
          prototype: 'describable',
          name: 'tea service',
          aliases: ['tea', 'service', 'cups'],
          description: `A tea service arranged on the coffee table—a ceramic pot, cups sized for proper gongfu brewing, a wooden tea tray to catch spills. The pot still holds the residue of the last brewing: tea leaves dried to dust, the water long since evaporated. Tea was the pause in the day, the ritual of hospitality, the thing you offered guests before conversation. No guests have come in fifty-five years.`,
        },
        {
          prototype: 'cabinet',
          name: 'tv cabinet',
          aliases: ['cabinet', 'entertainment'],
          description: `An entertainment cabinet of matching dark wood, its door open, its interior empty. The TV that once lived here is gone—looted, or taken when the residents fled, or simply failed and removed before the end. The cabinet remains, the altar for the god that no longer sits there. Family photos line the top: wedding portraits, children's graduations, the achievements that families displayed for visitors.`,
        },
        {
          prototype: 'describable',
          name: 'wok range',
          aliases: ['wok', 'stove', 'range', 'kitchen'],
          description: `A serious wok range in the kitchen—the kind of burner that generates enough heat for proper stir-frying, the kind that restaurants use and home cooks dream of. The wok itself hangs from a hook above, seasoned by decades of cooking, its patina speaking of ten thousand meals. The burner is cold, the flame that once rose from it extinguished with the gas supply. But the wok could cook again, if anyone brought fire.`,
        },
        {
          prototype: 'describable',
          name: 'couple photos',
          aliases: ['photos', 'dresser', 'bedroom'],
          description: `Through the bedroom curtain: a dresser covered with photos of a couple aging together. The same two faces across four decades, from young and formal to old and relaxed. Wedding photos from an era of simpler ceremonies. Children's photos, then grandchildren's. The couple's life is documented on the dresser, the timeline of a marriage that lasted until everything ended. They probably died together. Couples that long together often do.`,
        },
        {
          prototype: 'chair',
          name: 'armchair',
          aliases: ['chair', 'seat'],
          capacity: 1,
          emptyMsg:
            'A wing-backed armchair faces where the TV used to be, positioned for an evening routine.',
          occupiedMsg:
            'Someone sits in the armchair, claiming the seat of the man who watched TV here every evening.',
          description: `A wing-backed armchair upholstered in fabric that was expensive when new—brocade, perhaps, with a subtle pattern. The chair is positioned facing the empty TV cabinet, angled slightly toward the window for reading light. A side table holds a reading lamp (dead) and a pair of reading glasses (lenses dusty). This was someone's chair, the seat claimed by decades of evening routine. The indentation in the cushion still holds the shape of the man who sat here.`,
        },
      ],
    },
  },
};
