// Owl Cafe - Ground Floor (z=0)
// Classic American diner, operating since 1947
// 24-hour breakfast spot frozen at the moment of the end

export const building = {
  name: 'Owl Cafe',
  x: -15,
  y: -1,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Cafe Lock',
      description:
        'A simple deadbolt, the brass finish worn smooth by decades of use.',
      difficulty: 2,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Cafe Entrance',
      description:
        'A glass door with an aluminum frame, the kind every diner in America has. A neon OWL CAFE sign hangs above, dark now but still legible. An OPEN 24 HOURS decal is peeling at the corner. A smaller sign reads PLEASE SEAT YOURSELF.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'glass',
      durability: 35,
    },
    '%KITCHEN_DOOR': {
      prototype: 'door',
      name: 'Kitchen Door',
      description:
        'A swinging door with a round porthole window, stainless steel kick plate at the bottom. The door swings both ways, designed for servers carrying plates.',
      locked: false,
      open: false,
      locks: [],
      material: 'wood',
      durability: 55,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - DINER
    // ═══════════════════════════════════════════════════════════════════

    '%COUNTER': {
      name: 'Owl Cafe - Counter',
      description: `The counter is the heart of the Owl Cafe, a curved Formica bar with chrome trim that seats twelve on vinyl stools that swivel. The stools are red, faded to pink in places, their chrome bases spotted with rust but still functional. The counter surface is a speckled pattern meant to hide stains—coffee rings, syrup drips, the archaeology of thousands of breakfasts.

Behind the counter, the service area displays the diner's operational history: a coffee maker with two glass pots (one still containing something that was coffee once), a pie case with three petrified slices under glass, a milkshake machine with the chrome spindle frozen mid-rotation. The menu board above lists prices that seem impossibly cheap: EGGS & TOAST $4.99, STACK OF PANCAKES $5.99, COFFEE $1.50.

A ticket wheel hangs by the kitchen window, order slips still clipped to it—the last orders, never picked up. ADAM 2 EGGS OVER HASH. Table 4 WAFFLES X2 BACON. The handwriting is rushed, efficient, the shorthand of someone who did this a thousand times.`,
      x: -15,
      y: -1,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '1st-ave-s/y-1.ts',
          description: 'The glass door leads to 1st Ave S',
          door: '%FRONT_DOOR',
        },
        north: '%BOOTHS',
        west: {
          description: 'A swinging door leads to the kitchen',
          door: '%KITCHEN_DOOR',
          to: '%KITCHEN',
        },
      },
      sittables: [
        {
          name: 'a counter stool',
          capacity: 12,
          emptyMsg:
            'Red vinyl stools line the curved counter, their chrome bases spotted with age but still swiveling smoothly.',
          occupiedMsg: '%s sitting at the counter',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'diner counter',
          aliases: ['counter', 'bar'],
          description: `A curved Formica counter, the classic diner design that puts customers face-to-face with the action. The surface is speckled beige, chosen to hide stains but unable to hide history—decades of coffee rings, cigarette burns from when that was allowed, scratches from plates and elbows and the general friction of use. Chrome trim runs along the edge, dented in places, polished by a thousand hands reaching for coffee cups.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'pie case',
          aliases: ['pie', 'case', 'display'],
          description: `A rotating pie case, the glass sides clouded with age. Three slices remain inside: apple, cherry, and something that was probably lemon meringue before time turned the meringue to leather. The pies are mummified, preserved by the same dry air that kills everything eventually. Price tags read $3.50 a slice. The prices are from another world.`,
        },
        {
          prototype: 'describable',
          name: 'coffee maker',
          aliases: ['coffee', 'pot', 'burner'],
          description: `A commercial coffee maker with two glass pots sitting on warming plates. One pot is empty, its interior stained brown. The other contains something that was coffee—now a tar-like residue at the bottom, the water long since evaporated. The warming plates are cold. The burners stopped when the power changed. Someone left this brewing, expecting to come back.`,
        },
        {
          prototype: 'describable',
          name: 'menu board',
          aliases: ['menu', 'board', 'prices'],
          description: `A backlit menu board above the service area, the fluorescent tubes behind it dark. The menu is printed on translucent panels: BREAKFAST SERVED ALL DAY. EGGS ANY STYLE $4.99. DENVER OMELETTE $7.99. The all-day breakfast promise was the Owl Cafe's defining feature—24 hours, every day, breakfast whenever you wanted it. The promise persists. The breakfast doesn't.`,
        },
      ],
    },

    '%BOOTHS': {
      name: 'Owl Cafe - Dining Room',
      description: `The dining room extends beyond the counter, a collection of booths and tables that could seat maybe forty on a busy night. The booths line the windows—red vinyl benches, Formica tables, the same design repeated in every diner in every small town across America. The Owl Cafe wasn't trying to be special. It was trying to be reliable.

The tables are still set with paper placemats showing a cartoon owl in a chef's hat, the cafe's mascot since the 1950s. Salt and pepper shakers sit paired on each table, the chrome tops tarnished. Ketchup bottles, mostly empty, their contents crusted around the caps. Sugar dispensers, their contents crystallized into solid blocks.

One booth still has dishes on the table—plates with the remnants of breakfast, coffee cups, a newspaper folded to the crossword. Someone was here when it happened. They left quickly, or they didn't leave at all. The dishes remain, documenting a last meal.`,
      x: -15,
      y: 0,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%COUNTER',
        west: '%KITCHEN',
        up: {
          description: 'A narrow stairway leads up to the storage and office',
          to: '%STORAGE',
        },
      },
      sittables: [
        {
          name: 'a diner booth',
          capacity: 4,
          emptyMsg:
            'Red vinyl booths line the windows, their tables still set with paper placemats and condiments.',
          occupiedMsg: '%s seated in a booth',
        },
        {
          name: 'a table',
          capacity: 4,
          emptyMsg:
            'Square tables fill the center of the dining room, mismatched chairs tucked beneath them.',
          occupiedMsg: '%s sitting at a table',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'window booths',
          aliases: ['booths', 'benches'],
          description: `A row of booths along the front windows, the red vinyl upholstery cracked but still comfortable. Each booth seats four—two on each side, facing each other across Formica tables. The tables are bolted to the wall and floor, immovable, designed to last forever. They've outlasted almost everyone who sat at them.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'placemats',
          aliases: ['placemat', 'owl'],
          description: `Paper placemats on every table show the Owl Cafe mascot—a cartoon owl in a chef's hat, winking and holding a spatula. The owl design hasn't changed since the 1950s. Around the edges, text promotes local businesses that no longer exist: BILL'S AUTO BODY, PIONEER DRY CLEANING, SEATTLE TRUST & SAVINGS. The advertisements are time capsules. The placemat is archaeology.`,
        },
        {
          prototype: 'describable',
          name: 'abandoned breakfast',
          aliases: ['breakfast', 'dishes', 'plates'],
          description: `One booth holds a frozen moment: two plates with the remains of breakfast—eggs gone grey-green, bacon strips turned to jerky, hash browns mummified on the plate. Coffee cups sit half-full of something that's no longer liquid. A newspaper is folded to the crossword puzzle, a pen lying across it, three answers filled in. Someone was having breakfast. Someone stopped having breakfast suddenly.`,
        },
      ],
    },

    '%KITCHEN': {
      name: 'Owl Cafe - Kitchen',
      description: `The kitchen is a narrow galley, designed for efficiency rather than comfort—every tool within arm's reach, every movement economical. The grill dominates one wall, a flat-top surface crusted with carbonized residue from the last service. Above it, a hood vent hangs silent, its filters thick with grease.

A prep table runs the center of the kitchen, stainless steel scarred by years of chopping and slicing. Knives hang from a magnetic strip on the wall, their edges dull but their arrangement neat. Someone kept this kitchen organized, took pride in it. The organization persists in their absence.

A walk-in cooler hums in the corner—somehow still running, still maintaining temperature, still preserving whatever food was stored when the world changed. The door is heavy steel with a safety release on the inside. A thermometer by the door reads 38°F. The electricity that powers this place comes from somewhere no one questions anymore.`,
      x: -16,
      y: -1,
      z: 0,
      population: 0,
      ambientNoise: 12,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          description: 'A swinging door leads to the counter',
          door: '%KITCHEN_DOOR',
          to: '%COUNTER',
        },
        north: '%BOOTHS',
        down: {
          to: 'z-1.ts:%CELLAR',
          description: 'A heavy cellar door leads down to cold storage',
          door: 'z-1.ts:%CELLAR_DOOR',
          locks: ['z-1.ts:%CELLAR_LOCK'],
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'flat-top grill',
          aliases: ['grill', 'griddle', 'flattop'],
          description: `A commercial flat-top grill, the cooking surface crusted with carbonized grease from years of eggs and bacon and hash browns. The grill is cold now, the burners off, but the seasoning of ten thousand breakfasts remains baked into the steel. A row of squeeze bottles sits above: ketchup, mustard, hot sauce, their contents long since separated into layers.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'walk-in cooler',
          aliases: ['cooler', 'refrigerator', 'walk-in'],
          description: `A walk-in cooler, its heavy steel door sealed tight. The compressor hums—one of those mysterious systems that keeps running when nothing else does. The thermometer shows 38°F. Inside: eggs that are probably still good, milk that definitely isn't, vegetables that have liquefied into their containers. The cooler preserves whatever it can. Preservation has limits.`,
        },
        {
          prototype: 'desk',
          name: 'prep table',
          aliases: ['table', 'prep'],
          description: `A stainless steel prep table down the center of the kitchen, its surface scarred by thousands of knife cuts. Containers line one edge: salt, pepper, garlic powder, the basic seasoning of diner cooking. A cutting board sits on the table, an onion half-chopped on its surface, the knife that was chopping it lying beside. Someone stopped mid-prep. The onion has mummified.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // UPPER FLOOR (z=1)
    // ═══════════════════════════════════════════════════════════════════

    '%STORAGE': {
      name: 'Owl Cafe - Storage',
      description: `The upstairs storage room holds the cafe's supplies—or held them, before scavengers took what they needed. Metal shelving units line the walls, mostly empty now but with remnants of inventory: cases of ketchup, bulk coffee, the dry goods that last forever. A few cases of canned goods remain, their labels faded but their contents presumably intact.

A small office occupies one corner, separated by a half-wall with a window. Inside: a desk covered in invoices and schedules, a time clock on the wall still holding punch cards, a corkboard with family photos and health department certificates and a handwritten note that says MARY'S BIRTHDAY FRIDAY - CAKE???

The floor creaks underfoot, old construction settling under weight it still supports.`,
      x: -15,
      y: 0,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%BOOTHS',
        west: '%OFFICE',
        up: {
          description: 'A hatch in the ceiling leads to the roof',
          to: '%ROOF_NE',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'storage shelves',
          aliases: ['shelves', 'supplies'],
          description: `Metal shelving units hold what's left of the cafe's inventory: cases of condiments, bulk coffee in vacuum-sealed bags, the supplies that restaurants order in quantity. Most has been taken by scavengers with practical priorities. What remains is what nobody wanted: industrial-sized containers of pickle relish, decaf coffee, sugar substitute. The undesirable persists.`,
        },
        {
          prototype: 'describable',
          name: 'time clock',
          aliases: ['clock', 'punch'],
          description: `An old punch-card time clock, the kind employees used to record their arrivals and departures. Cards still fill the rack beside it: MARIA, DONG, STEVE, JENNIFER. The last punches are dated from whenever the end came. Some cards show arrivals without departures. Some show neither. The clock is frozen, but it remembers who was supposed to be here.`,
        },
      ],
    },

    '%OFFICE': {
      name: 'Owl Cafe - Office',
      description: `The manager's office is barely bigger than a closet—a desk, a chair, a filing cabinet, and enough room to turn around if you're careful. The desk is buried under paperwork: invoices, schedules, health inspection reports, the administrative detritus of running a restaurant. A computer monitor sits dark on one corner, ancient even before the world changed.

Photos cover one wall: the cafe through the decades, staff photos from the '50s through the present, a timeline of haircuts and fashion and faces that aged and were replaced. The current owner is in several recent photos—a middle-aged woman with tired eyes and a smile that suggests she loved this place even when it exhausted her.

A safe sits under the desk, door open, contents gone. Someone knew it was here. Someone knew the combination, or had the tools to bypass it.`,
      x: -16,
      y: 0,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%STORAGE',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'manager desk',
          aliases: ['desk'],
          description: `A small desk crammed with paperwork—invoices from suppliers, employee schedules marked up with shift changes, health inspection checklists. A coffee mug holds pens and pencils. A framed photo shows the owner shaking hands with the mayor, some civic award ceremony. The photo is dusty. The award is probably still on a shelf somewhere.`,
        },
        {
          prototype: 'describable',
          name: 'photo wall',
          aliases: ['photos', 'pictures'],
          description: `A wall of framed photographs documenting the Owl Cafe's history—seventy-plus years of staff and customers and special occasions. The photos yellow toward the older end: men in fedoras, women in victory rolls, the cafe when it was new. More recent photos show birthday parties, retirement dinners, the everyday moments someone thought worth preserving. All these faces, most of them gone now.`,
        },
        {
          prototype: 'cabinet',
          name: 'empty safe',
          aliases: ['safe'],
          description: `A floor safe under the desk, its heavy door hanging open. The interior is empty—whoever opened it took the contents and didn't bother closing up. Cash, probably. Maybe important documents. Maybe nothing worth taking. The safe remains, heavy and immovable, holding only shadows.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2)
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_NE': {
      name: 'Owl Cafe - Roof (Northeast)',
      description: `The roof of the Owl Cafe is flat tar and gravel, typical of commercial buildings from the mid-century. The neon OWL CAFE sign rises from the parapet, its tubes dark, its transformer box rusted shut. The sign was visible from blocks away when it worked—a beacon for night-shift workers and insomniacs seeking breakfast at 3 AM.

Ventilation equipment clusters near the kitchen exhaust—hood vents, fans, ductwork, all of it silent now. The grease buildup on the kitchen exhaust is thick enough to be a fire hazard, if fires were still something to worry about in the conventional sense.

From here you can see south toward Pioneer Square's historic core, the brick buildings and the totem pole and the triangular park that was never quite a destination but always seemed to be on the way to somewhere else.`,
      x: -15,
      y: 0,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%STORAGE',
        west: '%ROOF_NW',
        south: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'neon sign',
          aliases: ['sign', 'owl', 'neon'],
          description: `The OWL CAFE neon sign rises from the roof's edge, its tubes dark but intact. The owl shape is still recognizable—a stylized bird in flight, wings spread, the letters curved beneath it in classic 1950s typography. The sign was the cafe's identity, visible from blocks away. It hasn't glowed in years, but it still announces what this place was.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'kitchen exhaust',
          aliases: ['exhaust', 'vent', 'hood'],
          description: `The kitchen exhaust vent rises from the roof, its housing coated in years of grease buildup. The accumulation is thick, almost geological—layers of vaporized cooking oil condensed into a waxy residue. The vent hasn't exhausted anything in a long time. The grease remains, a record of ten thousand breakfasts rising through the ductwork.`,
        },
      ],
    },

    '%ROOF_NW': {
      name: 'Owl Cafe - Roof (Northwest)',
      description: `The northwest corner of the roof offers a view toward the waterfront, though taller buildings block most of the sightline. What's visible is a slice of Elliott Bay, grey water meeting grey sky at a horizon that's more suggestion than line.

An old antenna mount stands in this corner, its original purpose unclear—TV reception, maybe, or some communication system that predates the current infrastructure. The antenna itself is gone, leaving only the mounting bracket pointing at the sky.

A folding lawn chair sits against the parapet, sun-bleached and rusted, left here by someone who used the roof for breaks or lunch or just escape from the kitchen heat. The view isn't much, but it's outside, and sometimes that's enough.`,
      x: -16,
      y: 0,
      z: 2,
      population: 0,
      ambientNoise: 12,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_NE',
        south: '%ROOF_SW',
      },
      sittables: [
        {
          name: 'a lawn chair',
          capacity: 1,
          emptyMsg:
            'A sun-bleached folding lawn chair sits against the parapet, left here by someone seeking escape from the kitchen.',
          occupiedMsg: '%s sitting in the old lawn chair',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'antenna mount',
          aliases: ['antenna', 'mount'],
          description: `A metal mounting bracket for an antenna that's no longer here—TV reception, maybe, from the days when rooftop antennas were how you got channels. The bracket points at the sky, waiting for hardware that won't be reinstalled. The view it would have received is still broadcasting, to receivers that aren't tuned in.`,
        },
      ],
    },

    '%ROOF_SE': {
      name: 'Owl Cafe - Roof (Southeast)',
      description: `The southeast corner of the roof overlooks 1st Avenue, the street visible through gaps in the parapet. From here you can watch the avenue without being easily seen—a useful vantage for anyone interested in comings and goings.

An HVAC unit squats in this corner, its housing dented and corroded but its fan still occasionally spinning when the mysterious power that runs certain systems decides to engage. The unit probably cooled the dining room, back when climate control was a selling point.

The parapet here is lower than elsewhere, worn down by weather or never built to the same height. The drop to the sidewalk is maybe twenty feet—survivable if you land right, fatal if you don't.`,
      x: -15,
      y: -1,
      z: 2,
      population: 0,
      ambientNoise: 18,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NE',
        west: '%ROOF_SW',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'HVAC unit',
          aliases: ['hvac', 'ac', 'air conditioner'],
          description: `A rooftop HVAC unit, its housing dented by some past impact—falling debris, maybe, or vandalism. The fan inside still spins occasionally, responding to some power source that operates on its own schedule. The unit cooled the dining room once, making summer breakfast tolerable. Now it cools empty booths and abandoned plates.`,
          boltedDown: true,
        },
      ],
    },

    '%ROOF_SW': {
      name: 'Owl Cafe - Roof (Southwest)',
      description: `The southwest corner of the roof is the most exposed, with sightlines in multiple directions but also visible from the street below. A fire escape descends from here, iron stairs switchbacking down to the alley—the mandatory second egress that every building code requires.

The fire escape is rusted but probably sound, the kind of construction that was built to last even when maintenance lapsed. The final ladder is the drop-down type, currently retracted, requiring someone above to lower it for anyone climbing up.

Graffiti covers the rooftop access door from this side—tags accumulated over years of urban explorers and taggers claiming the space. One prominent piece reads OWLS SEE EVERYTHING in dripping silver letters.`,
      x: -16,
      y: -1,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_SE',
        north: '%ROOF_NW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'fire escape',
          aliases: ['escape', 'stairs', 'ladder'],
          description: `An iron fire escape descending the building's alley face, switchbacking down two stories to the ground. The iron is rusted but structurally sound—old construction, built before corners were cut. The final ladder section is retracted, held up by a latch that could be released from above. Getting up is harder than getting down.`,
        },
        {
          prototype: 'describable',
          name: 'graffiti',
          aliases: ['tag', 'tags'],
          description: `Graffiti covers the rooftop access door and surrounding wall—years of tags accumulated in overlapping layers. The most prominent piece reads OWLS SEE EVERYTHING in dripping silver letters, a play on the cafe's name. Other tags are less thematic: names, dates, the standard vocabulary of presence marking. KRONO WAS HERE 2019. So was everyone else, apparently.`,
        },
      ],
    },
  },
};
