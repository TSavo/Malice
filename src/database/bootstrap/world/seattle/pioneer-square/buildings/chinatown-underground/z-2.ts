// Chinatown-International District Underground - Level z=-2
// Beneath the ID (y=-8 to y=-14, x=-7 to x=+7)
// Historic Chinese tunnels, gambling dens, and opium passages

export const building = {
  name: 'Chinatown Underground',
  x: 7,
  y: -8,
  width: 15,
  height: 14,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // JACKSON STREET CORRIDOR (y=-8, main east-west passage)
    // ═══════════════════════════════════════════════════════════════════════

    '%JACKSON_WEST': {
      name: 'Jackson Street Underground West',
      description: `The passage runs beneath Jackson Street at its western edge, where Chinatown meets Pioneer Square. The construction shifts here—Victorian brick giving way to rougher tunneling, the work of Chinese laborers who extended Seattle's underground in ways the official record never acknowledged.

The walls bear faded characters painted in red—directions, warnings, or perhaps prayers. The language of an older community written in the darkness where it would endure.`,
      x: -7,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: '%JACKSON_LAUNDRY',
        north: {
          to: 'buildings/king-street-underground/z-2.ts',
          room: '%KING_MAIN',
          description: 'A passage leads north toward King Street',
        },
        west: {
          to: 'buildings/waterfront-underground/z-2.ts',
          room: '%CHINESE_RAIL_3',
          description: 'A narrow passage leads west toward the old railroad workers\' dormitory',
        },
      },
      objects: [
        { prototype: 'sign', name: 'faded Chinese characters', description: 'Red characters painted on the wall have faded but remain legible to those who read them. They speak of safe passage and warn of danger ahead.', boltedDown: true },
        { prototype: 'bench', name: 'a stone bench', description: 'A worn stone bench is carved into the wall, smoothed by generations of workers resting between shifts.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // JACKSON STREET WEST SECTION (x=-6 to x=-4)
    // ═══════════════════════════════════════════════════════════════════════

    '%JACKSON_LAUNDRY': {
      name: 'Underground Laundry',
      description: `Steam once filled this chamber, where Chinese laundrymen worked the clothes of Seattle's elite in water heated by coal fires that burned around the clock. The great copper tubs remain, verdigrised and dented, their drainage channels cut into the stone floor leading to passages below. Wooden paddles for stirring the scalding water hang from hooks, their handles worn smooth by hands that worked until they bled.

The irony was not lost on the workers: washing the wealth's dirty laundry in tunnels the wealthy pretended didn't exist. Some of that laundry held secrets. Some of those secrets were remembered.`,
      x: -6,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%JACKSON_WEST',
        east: '%JACKSON_TEA_HOUSE',
      },
      objects: [
        { prototype: 'furniture', name: 'copper washing tubs', description: 'Three massive copper tubs could hold a week\'s laundry each. The metal is green with age, but the craftsmanship remains impressive.', boltedDown: true },
      ],
    },

    '%JACKSON_TEA_HOUSE': {
      name: 'Underground Tea House',
      description: `The tea house was never meant for tea alone—it was a meeting place, a negotiation room, a space where deals were made that could not be made in daylight. The low tables remain, their surfaces scarred by cups and elbows and the occasional blade. Cushions have rotted to dust, but the impressions in the stone floor show where they once lay.

The walls are painted with scenes of mountains and rivers—China remembered, China mourned, the homeland rendered in pigments that have faded to ghosts of their original brilliance. A brass brazier in the corner still holds the ash of the last fire, kindled perhaps a century ago.`,
      x: -5,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%JACKSON_LAUNDRY',
        east: '%JACKSON_BUNK_HOUSE',
      },
    },

    '%JACKSON_BUNK_HOUSE': {
      name: 'Workers\' Bunk House',
      description: `Bunks stacked four high line both walls, the wooden frames still standing though the rope mattresses have long since rotted away. Each bunk was a life—railroad workers, laundrymen, laborers who built a city that didn't want them, who lived beneath streets that wouldn't let them walk openly. Names are carved into the wood: Li Wei, Chen Tao, Wang Jun. Dates range from 1878 to 1942.

The ceiling is low, oppressive. The air would have been thick with breath and sweat and the smoke of cheap cigarettes. But it was safer than the streets above, where the riots sometimes came.`,
      x: -4,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 2,
      outdoor: false,
      exits: {
        west: '%JACKSON_TEA_HOUSE',
        east: '%JACKSON_MID_W',
      },
      objects: [
        { prototype: 'furniture', name: 'carved bunk frames', description: 'The wooden frames bear decades of carved names and dates. Some have been crossed out, others circled. A few have notes: "gone to Vancouver", "returned to Guangdong", "never came back".', boltedDown: true },
      ],
    },

    '%JACKSON_MID_W': {
      name: 'Jackson Street Underground',
      description: `The passage continues through the heart of the underground Chinatown, the construction showing the marks of community labor. Alcoves branch off at intervals—storage spaces, hiding places, rooms that served purposes the surface world never knew.

The air carries traces of incense, sandalwood and something older, the ghost of offerings made to ancestors in the darkness beneath the streets.`,
      x: -3,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%JACKSON_BUNK_HOUSE',
        east: '%JACKSON_SHRINE',
        south: '%HERB_SHOP_BASEMENT',
      },
      objects: [
        { prototype: 'cabinet', name: 'an altar niche', description: 'A carved niche in the wall holds a small shrine—an incense holder, offerings of oranges long since petrified, and a faded photograph of someone\'s ancestors.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // JACKSON STREET CENTRAL (x=-2 to x=2)
    // ═══════════════════════════════════════════════════════════════════════

    '%JACKSON_SHRINE': {
      name: 'Ancestor Shrine',
      description: `The passage widens into a shrine room, its walls covered with photographs and name tablets of those who never saw their homeland again. Candles in red glass holders—hundreds of them—cover every horizontal surface, their wax pooled and frozen, their last flames extinguished decades ago. The photographs show faces young and old, men in worker's clothes and women in elaborate dress, children who grew up in darkness.

An altar table holds offerings that have petrified beyond recognition, and a bronze incense burner shaped like a dragon, its scales green with age. The air is heavy with the memory of smoke and prayer.`,
      x: -2,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 2,
      lighting: 5,
      waterLevel: 2,
      outdoor: false,
      exits: {
        west: '%JACKSON_MID_W',
        east: '%JACKSON_MERCHANT',
      },
      objects: [
        { prototype: 'furniture', name: 'bronze dragon burner', description: 'The incense burner has the shape of a coiled dragon, its mouth open to release smoke. The bronze is so old it seems to breathe.', boltedDown: true },
        { prototype: 'cabinet', name: 'name tablets', description: 'Wooden tablets bear the names of the dead in gold Chinese characters. Some tablets have fresh flowers placed before them—someone still remembers.', boltedDown: true },
      ],
    },

    '%JACKSON_MERCHANT': {
      name: 'Underground Merchant',
      description: `A Chinese merchant's shop survives nearly intact, its shelves still stocked with goods that were never sold. Bolts of silk, now too fragile to touch. Porcelain that shattered in an earthquake and was never cleaned up. Jars of preserved ginger that have become archaeology. The abacus still sits on the counter, its beads frozen mid-calculation, the last transaction forever incomplete.

The merchant's ledger lies open, its pages covered in columns of Chinese characters—debts owed, debts paid, the flow of money through a community that had to be invisible to survive. The last entry is dated October 1941.`,
      x: -1,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 12,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%JACKSON_SHRINE',
        east: '%JACKSON_MAIN',
      },
      objects: [
        { prototype: 'furniture', name: 'merchant\'s abacus', description: 'Beads of jade and bone slide on brass rods. The calculation is incomplete, the merchant interrupted mid-sum. What was the total?', boltedDown: true },
      ],
    },

    '%JACKSON_MAIN': {
      name: 'Jackson Street Junction',
      description: `The passage opens into a junction where multiple routes converge beneath the heart of the International District. This was once a hub of underground activity—merchants, gamblers, workers, all moving through passages that let them avoid the hostility of the streets above.

The construction is more elaborate here, the ceiling higher, the space larger. This was a gathering place, a market, a community center hidden from eyes that wished the community harm.`,
      x: 0,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%JACKSON_MERCHANT',
        east: '%JACKSON_NOODLE',
        south: '%GAMBLING_HALL',
        north: '%KING_JACKSON_CONN',
        down: '%DEEP_PASSAGE',
      },
      objects: [
        { prototype: 'sign', name: 'a direction stone', description: 'A flat stone set in the floor shows carved arrows pointing in different directions, each labeled with Chinese characters indicating destinations.', boltedDown: true },
        { prototype: 'bench', name: 'a merchant\'s counter', description: 'A stone counter remains from when this junction served as an underground market. The surface shows wear patterns from years of goods being weighed and exchanged.', boltedDown: true },
        { prototype: 'furniture', name: 'iron sconces', description: 'Wrought iron sconces line the walls, designed for oil lamps. Some still hold the stumps of ancient wicks.', boltedDown: true },
      ],
    },

    '%JACKSON_NOODLE': {
      name: 'Noodle Kitchen',
      description: `The underground kitchen fed workers who couldn't eat above ground—not welcome in white restaurants, too exhausted to cook for themselves. The great wok, three feet across, still sits in its brick cradle, its iron surface seasoned by a million meals. Bundles of dried noodles hang from hooks, too old to eat but too preserved to rot. The chopping blocks show the valleys carved by countless knives.

A handwritten menu in Chinese and broken English lists dishes for pennies: "Noodle soup 5c", "Dumpling 3c", "Rice wine 2c". The prices of survival.`,
      x: 1,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%JACKSON_MAIN',
        east: '%JACKSON_BARBER',
      },
      objects: [
        { prototype: 'furniture', name: 'great wok', description: 'The wok could feed twenty workers at once. Its iron is black with seasoning built up over decades. The wooden handle shows the grip marks of a single hand.', boltedDown: true },
      ],
    },

    '%JACKSON_BARBER': {
      name: 'Queue Keeper',
      description: `The barber's shop was more than a place for haircuts—it was where men who had cut their queues in defiance of the Qing came to maintain the deception of loyalty, where those who kept them could have them properly styled. The barber's chair is an antique even by underground standards, its leather cracked but its mechanisms still functional. Scissors and razors rust on the counter.

A poster on the wall shows proper queue styling—the fashion of an empire that no longer exists, maintained in darkness by exiles who could never go home.`,
      x: 2,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%JACKSON_NOODLE',
        east: '%JACKSON_MID_E',
      },
    },

    '%JACKSON_MID_E': {
      name: 'Jackson Street Underground',
      description: `The passage continues east through the buried district, the construction growing newer as it approaches areas developed in later decades. The walls transition from hand-carved stone to more modern materials—concrete appearing alongside brick, the infrastructure of different eras overlapping.`,
      x: 3,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%JACKSON_BARBER',
        east: '%JACKSON_DOCTOR',
        south: '%OPIUM_DEN',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // JACKSON STREET EAST SECTION (x=4 to x=7)
    // ═══════════════════════════════════════════════════════════════════════

    '%JACKSON_DOCTOR': {
      name: 'Bone Setter\'s Office',
      description: `Traditional Chinese medicine kept workers alive when white doctors wouldn't treat them. The bone setter's office holds the tools of an older healing: acupuncture needles in graduated sizes, cupping glasses stained by fire, a human skeleton mounted for study with annotations in Chinese describing pressure points and energy flows. Dried herbs in glass jars line the walls, their labels faded but their scents still potent.

A treatment table, its padding rotted away to reveal wooden slats, still shows the hollow for a patient's face. How many broken bodies were made whole here? How many couldn't be fixed?`,
      x: 4,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 12,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%JACKSON_MID_E',
        east: '%JACKSON_TAILOR',
      },
      objects: [
        { prototype: 'cabinet', name: 'herb cabinet', description: 'Hundreds of small drawers hold dried herbs, each labeled with Chinese characters and Latin names. Some are still fragrant. Some are still potent.', boltedDown: true },
        { prototype: 'furniture', name: 'acupuncture model', description: 'A bronze statue of a human figure is covered with dots and lines marking acupuncture points. The craftsmanship is exquisite, the knowledge ancient.', boltedDown: true },
      ],
    },

    '%JACKSON_TAILOR': {
      name: 'Silk Tailor',
      description: `The tailor made two kinds of clothes: the rough work garments worn in public, and the fine silk robes worn in private, for festivals and funerals and the moments when being Chinese was celebrated rather than hidden. Bolts of fabric in various states of decay line the walls. A sewing machine, treadle-powered, sits ready at a workbench covered with pattern pieces that were never assembled.

A half-finished wedding dress hangs on a form—red silk, golden embroidery, the dragon and phoenix of double happiness rendered in thread. The bride it was made for may never have received it.`,
      x: 5,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 2,
      lighting: 10,
      waterLevel: 2,
      outdoor: false,
      exits: {
        west: '%JACKSON_DOCTOR',
        east: '%JACKSON_COBBLER',
      },
      objects: [
        { prototype: 'furniture', name: 'wedding dress form', description: 'Red silk and gold thread form the outline of joy, frozen incomplete. Dragons chase phoenixes across the bodice. Someone awaited this dress.', boltedDown: true },
      ],
    },

    '%JACKSON_COBBLER': {
      name: 'Cobbler\'s Alcove',
      description: `The cobbler made shoes for feet that walked miles every day—work boots for railroad crews, soft shoes for gamblers, and the tiny bound-foot shoes that some older women still wore in secret shame. His lasts are lined up by size, wooden forms that held the shape of a community's feet. Leather scraps carpet the floor, too degraded to use, too numerous to clean.

A pair of lotus shoes, barely three inches long, sits on the highest shelf—the last pair, perhaps, that he ever made for practices that were dying even then.`,
      x: 6,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%JACKSON_TAILOR',
        east: '%JACKSON_EAST',
      },
      objects: [
        { prototype: 'describable', name: 'lotus shoes', description: 'Tiny embroidered shoes for feet bound to an unnatural point. Beautiful and terrible. The practice is dead. The shoes remember.', boltedDown: true },
      ],
    },

    '%JACKSON_EAST': {
      name: 'Jackson Street Underground East',
      description: `The passage reaches its eastern extent, where the underground meets the foundations of more recent buildings. The construction here is a patchwork—original tunneling joined by basement connections, the network adapting to the buildings constructed above.

A doorway that was sealed with concrete in 1962 has been breached—a rough opening cut through the "PROGRESS" that once blocked this route. Beyond lies utility infrastructure from a later era.`,
      x: 7,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%JACKSON_COBBLER',
        south: '%LAUNDRY_BASEMENT',
        east: {
          to: 'buildings/southeast-underground/z-2.ts',
          room: '%JACKSON_EXTENSION',
          description: 'A rough opening leads east into utility corridors',
        },
      },
      objects: [
        { prototype: 'sign', name: 'a breached doorway', description: 'An arched doorway was filled with concrete, "1962 - PROGRESS" scratched into the wet cement. Someone has since cut through it with power tools.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NORTH-SOUTH CONNECTIONS
    // ═══════════════════════════════════════════════════════════════════════

    '%KING_JACKSON_CONN': {
      name: 'King-Jackson Connector',
      description: `The passage runs north toward King Street, connecting the Chinatown underground to the rail yard tunnels. The route is narrow, clearly carved as an afterthought, linking communities that existed in parallel beneath the same streets.`,
      x: 0,
      y: -7,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%JACKSON_MAIN',
        north: {
          to: 'buildings/king-street-underground/z-2.ts',
          room: '%SECOND_AVE_SOUTH',
          description: 'A passage leads north toward King Street',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // HISTORIC SPACES
    // ═══════════════════════════════════════════════════════════════════════

    '%HERB_SHOP_BASEMENT': {
      name: 'Herb Shop Basement',
      description: `The passage opens into what was once the basement of a traditional Chinese medicine shop. Wooden shelving still lines the walls, though the hundreds of drawers that once held herbs and ingredients are empty now, their contents long since dispersed or decayed.

The air retains a ghost of medicinal scents—ginseng, licorice, dried orange peel—the olfactory memory of remedies dispensed for a century.`,
      x: -3,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%JACKSON_MID_W',
        south: '%STORAGE_WARREN',
        east: '%FORTUNE_TELLER',
      },
      objects: [
        { prototype: 'cabinet', name: 'herb storage cabinet', description: 'A massive wooden cabinet with dozens of tiny drawers, each labeled in faded Chinese characters. Most are empty, but a few still hold desiccated roots and dried leaves.', boltedDown: true },
        { prototype: 'desk', name: 'a medicine preparation table', description: 'A heavy wooden table with a worn marble top, stained from decades of grinding and mixing herbs. A brass scale sits atop it, balanced and ready.', boltedDown: true },
        { prototype: 'sign', name: 'a prescription board', description: 'A wooden board shows columns of Chinese characters—recipes for traditional remedies, the knowledge of generations preserved in ink.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN y=-9 CORRIDOR
    // Connecting Herb Shop to Gambling Hall to Opium Den
    // ═══════════════════════════════════════════════════════════════════════

    '%FORTUNE_TELLER': {
      name: 'Fortune Teller\'s Chamber',
      description: `The tunnel opens into a small chamber where a fortune teller once read the fates of workers desperate to know if their luck would change. The circular table remains, its surface covered with faded zodiac symbols and celestial patterns. Incense holders shaped like dragons guard the corners, their scales worn smooth by generations of hands.

A cabinet against the wall holds the tools of divination: bamboo sticks for kau cim, coins for I Ching, and a set of oracle bones so old they crumble at a touch. The last fortune cast here predicted great change. The prediction was correct, if not in the way the seeker hoped.`,
      x: -2,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HERB_SHOP_BASEMENT',
        east: '%MONEY_LENDER',
      },
      objects: [
        { prototype: 'desk', name: 'a fortune table', description: 'A round table marked with the twelve animals of the zodiac, the five elements, and characters representing past, present, and future.', boltedDown: true },
        { prototype: 'cabinet', name: 'divination tools', description: 'Bamboo fortune sticks, ancient coins, and crumbling oracle bones. The tools of seeing what cannot be seen.', boltedDown: true },
        { prototype: 'sign', name: 'a fortune poem', description: 'A poem on the wall speaks of three paths: the path of gold, the path of water, and the path of bone. Each leads somewhere different.', boltedDown: true },
      ],
    },

    '%MONEY_LENDER': {
      name: 'Money Lender\'s Office',
      description: `A cramped office where a money lender once ran the underground economy—loans for passage from China, loans for gambling debts, loans that kept workers indentured to the community that claimed to protect them. The desk remains, its surface scarred by fingernails that gripped its edge during desperate negotiations.

A ledger book lies open, its pages filled with columns of names and numbers. Some entries are marked "PAID". Many are marked "INTEREST DUE". A few are simply crossed out, the debts cancelled by death or disappearance.`,
      x: -1,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%FORTUNE_TELLER',
        east: '%GAMBLING_HALL',
      },
      objects: [
        { prototype: 'desk', name: 'a money lender\'s desk', description: 'A heavy wooden desk with a brass lock on every drawer. The scratches in the wood tell stories of desperation.', boltedDown: true },
        { prototype: 'safe', name: 'an empty strongbox', description: 'The strongbox is open and empty. Whatever fortune it once held moved on when the money lender did.', boltedDown: true },
        { prototype: 'sign', name: 'interest rates', description: 'A sign shows interest rates in Chinese: "10% weekly for trusted borrowers. 20% for strangers. 50% for gamblers."', boltedDown: true },
      ],
    },

    '%GAMBLING_HALL': {
      name: 'Old Gambling Hall',
      description: `The passage opens into a larger space that once served as a gambling hall—the layout still visible in the worn floor patterns, the alcoves that held tables, the raised platform where the house watched over the games. Fan-tan, pai gow, lottery—the games that drew workers after their shifts are gone now, but the architecture of chance remains.

Police raided this hall a dozen times. It reopened each time within a week. Eventually, it was not the law but time that closed it.`,
      x: 0,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%JACKSON_MAIN',
        west: '%MONEY_LENDER',
        south: '%FAN_TAN_ROOM',
        east: '%LOTTERY_ROOM',
      },
      objects: [
        { prototype: 'desk', name: 'a fan-tan table', description: 'A circular table with a recessed center where beans or buttons were counted. The green felt is worn through to bare wood in spots.', boltedDown: true },
        { prototype: 'furniture', name: 'the house platform', description: 'A raised wooden platform where the house dealer once sat, watching the games below. The view commands the entire room.', boltedDown: true },
        { prototype: 'sign', name: 'gambling house rules', description: 'Faded characters painted on a board list the house rules. The last line, larger than the others, translates roughly to: "NO CREDIT. NO EXCEPTIONS."', boltedDown: true },
        { prototype: 'cabinet', name: 'a cashier\'s cage', description: 'A wooden cage with iron bars where money changed hands. The lock mechanism is broken, the cage empty.', boltedDown: true },
      ],
    },

    '%LOTTERY_ROOM': {
      name: 'Lottery Keeper\'s Room',
      description: `The tunnel opens into a small chamber where the Chinese lottery was run—a numbers game that predated every legal lottery by decades. The drawing wheel remains, its wooden segments still labeled with Chinese characters, each representing a symbol that could make a man rich or ruin him. The odds were long. The dreams were infinite.

Winning tickets were rare enough that each one was celebrated. Losing tickets carpeted the floor in drifts, paper prayers to luck that failed. The lottery keeper's ledger shows drawings that continued daily from 1882 until 1943, when the last keeper was interned and never returned.`,
      x: 1,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GAMBLING_HALL',
        east: '%PIPE_MAKER',
      },
      objects: [
        { prototype: 'furniture', name: 'a lottery wheel', description: 'A wooden wheel with eighty segments, each painted with a Chinese character. The wheel still spins freely, though who would draw lots now?', boltedDown: true },
        { prototype: 'sign', name: 'losing tickets', description: 'Drifts of paper lottery tickets cover the floor, each one a dream that didn\'t come true. The ink has faded, but the hope lingers.', boltedDown: true },
        { prototype: 'desk', name: 'the lottery keeper\'s desk', description: 'A desk with drawers for cash, tickets, and records. The last entry in the ledger is dated February 1943.', boltedDown: true },
      ],
    },

    '%PIPE_MAKER': {
      name: 'Pipe Maker\'s Workshop',
      description: `The chamber was once a craftsman's workshop—the pipe maker who supplied the opium dens nearby. The tools of the trade remain: bamboo stems of various lengths and diameters, ceramic bowls in stages of firing, and the intricate metal fittings that connected bowl to stem. The craft required precision. The pipes had to draw smoothly, burn evenly, and last through countless hours of dreaming.

The pipe maker's last creations sit on a shelf, finished but never sold. Each one is a work of art—dragons carved into stems, phoenixes painted on bowls, the iconography of immortality applied to instruments of slow destruction. The irony was not lost on the craftsman. His personal pipe, unadorned, rests beside them.`,
      x: 2,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LOTTERY_ROOM',
        east: '%OPIUM_DEN',
      },
      objects: [
        { prototype: 'furniture', name: 'a craftsman\'s bench', description: 'A workbench holds the tools of pipe making: files, drills, brushes, and clamps. Everything is arranged for hands that will never return.', boltedDown: true },
        { prototype: 'cabinet', name: 'finished pipes', description: 'Ornate opium pipes sit on a shelf, each one a masterwork. Dragons. Phoenixes. Clouds. The dreams they enabled are silent now.', boltedDown: true },
        { prototype: 'describable', name: 'the plain pipe', description: 'A single pipe without ornamentation sits apart from the others. The craftsman\'s own—he knew that decoration couldn\'t hide what the pipe was for.', boltedDown: true },
      ],
    },

    '%OPIUM_DEN': {
      name: 'Opium Den Remains',
      description: `The passage descends into a space that history tried to forget—an opium den that operated for decades beneath the streets. The room is smaller than expected, intimate, the wooden platforms along the walls designed for dreamers to recline while the pipes transported them elsewhere.

The smell of the drug is long gone, but something lingers—a heaviness in the air, a reluctance to leave. The dreams that were dreamed here left their mark.`,
      x: 3,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%JACKSON_MID_E',
        west: '%PIPE_MAKER',
        south: '%OPIUM_STORAGE',
        east: '%DREAM_CORRIDOR',
      },
      objects: [
        { prototype: 'bench', name: 'an opium platform', description: 'A low wooden platform with a shallow indentation where a head once rested. The wood is dark, stained by years of smoke and dreams.', boltedDown: true },
        { prototype: 'furniture', name: 'an oil lamp niche', description: 'A carved niche in the wall held the lamp that heated the pipes. Soot blackens the stone above it.', boltedDown: true },
        { prototype: 'sign', name: 'a poem on the wall', description: 'Chinese characters are painted on the wall—a poem about dreams and forgetting. The last line has been scratched out.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EASTERN y=-9 CORRIDOR
    // Connecting Opium Den to Laundry Basement
    // ═══════════════════════════════════════════════════════════════════════

    '%DREAM_CORRIDOR': {
      name: 'Dream Corridor',
      description: `The passage between the opium den and the working quarters is painted with murals that only dreamers would have appreciated—landscapes of China that never existed, mountains floating in clouds, rivers flowing upward into the sky. The paintings are crude by any standard, but they served their purpose: to remind those who smoked of homes they might never see again.

Some patches of wall are scratched bare, the paint removed by hands that couldn't distinguish dream from reality. Other sections show newer work, additions made by those who inherited the space and continued the tradition of impossible visions.`,
      x: 4,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 6,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%OPIUM_DEN',
        east: '%WATCH_POST',
      },
      objects: [
        { prototype: 'sign', name: 'dream murals', description: 'Painted mountains float in painted clouds. Rivers flow upward. Dragons dance in skies that never existed.', boltedDown: true },
        { prototype: 'sign', name: 'scratched patches', description: 'Sections of the mural have been scratched away, the plaster scored by fingernails. Someone tried to claw their way into the painting.', boltedDown: true },
      ],
    },

    '%WATCH_POST': {
      name: 'Lookout\'s Post',
      description: `A small alcove served as a lookout post—a place where a watcher could observe approaches from multiple directions while remaining hidden. Peepholes in the walls look toward the laundry, toward the opium den, toward routes that might bring police or rivals. The watcher's stool remains, worn smooth by decades of anxious waiting.

A bell rope hangs from the ceiling, connected to alarms that haven't rung in generations. The system was simple but effective: one pull for police, two for rivals, three for fire. The community survived because someone was always watching.`,
      x: 5,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%DREAM_CORRIDOR',
        east: '%SERVICE_PASSAGE',
      },
      objects: [
        { prototype: 'furniture', name: 'a watcher\'s stool', description: 'A wooden stool worn smooth by years of sitting, positioned to see through multiple peepholes at once.', boltedDown: true },
        { prototype: 'sign', name: 'peepholes', description: 'Small holes drilled through the walls provide views in multiple directions. Someone was always watching.', boltedDown: true },
        { prototype: 'furniture', name: 'a bell rope', description: 'A rope hangs from the ceiling, connected to bells somewhere deeper in the tunnels. One pull meant police.', boltedDown: true },
      ],
    },

    '%SERVICE_PASSAGE': {
      name: 'Service Passage',
      description: `A narrow passage connected the working areas—laundry, kitchen, dormitories—allowing workers to move between spaces without entering the gambling areas or the den. The passage is plain, utilitarian, its walls unpainted, its floor worn smooth by feet that hurried between tasks.

Hooks on the walls once held laundry baskets, aprons, the tools of labor. The hooks are empty now, but their arrangement tells the story of a schedule: this hook for morning, this for afternoon, this for night. The work never stopped.`,
      x: 6,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%WATCH_POST',
        east: '%LAUNDRY_BASEMENT',
      },
      objects: [
        { prototype: 'furniture', name: 'empty hooks', description: 'A row of iron hooks at shoulder height, arranged in groups of three. Morning shift, afternoon shift, night shift.', boltedDown: true },
        { prototype: 'sign', name: 'a schedule board', description: 'A wooden board shows a work schedule in faded chalk. Names, times, tasks. The routine of survival.', boltedDown: true },
      ],
    },

    '%LAUNDRY_BASEMENT': {
      name: 'Laundry Basement',
      description: `The passage opens into the basement of what was once a Chinese laundry—one of the businesses that sustained the community when other work was denied them. The space is large, the ceiling low, the construction designed for the work of washing and pressing.

Iron hooks line the walls where garments hung to dry. Drainage channels are cut into the floor. The infrastructure of labor remains even when the workers are gone.`,
      x: 7,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%JACKSON_EAST',
        south: '%WORKER_QUARTERS',
        west: '%SERVICE_PASSAGE',
      },
      objects: [
        { prototype: 'furniture', name: 'a washing trough', description: 'A long stone trough where laundry was scrubbed by hand. The stone is worn smooth, shaped by millions of strokes.', boltedDown: true },
        { prototype: 'furniture', name: 'a pressing station', description: 'An iron pressing stand with brackets for heavy irons heated over charcoal. The wood is scorched from a century of hot metal.', boltedDown: true },
        { prototype: 'sign', name: 'laundry tickets', description: 'A few paper laundry tickets remain pinned to a board, yellowed and brittle. The garments they represent were never collected.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN PASSAGES
    // ═══════════════════════════════════════════════════════════════════════

    '%STORAGE_WARREN': {
      name: 'Storage Warren',
      description: `The passage winds through a warren of small storage rooms carved from the earth—spaces used by merchants to hide inventory, by families to store possessions, by the desperate to shelter from the dangers of the surface. The rooms are small, barely large enough to stand in, connected by passages that require ducking.

Some rooms show signs of long habitation. Others appear untouched for decades.`,
      x: -3,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%HERB_SHOP_BASEMENT',
        east: '%FAN_TAN_ROOM',
        south: '%TUNNEL_SOUTH',
      },
      objects: [
        { prototype: 'trunk', name: 'an abandoned chest', description: 'A wooden chest with Chinese brass fittings, locked but rattling when moved. Whatever is inside has been there for a very long time.', boltedDown: true },
        { prototype: 'crate', name: 'stacked crates', description: 'Wooden crates stacked against the wall, their labels faded. Some are stamped with the names of import companies that no longer exist.', boltedDown: true },
      ],
    },

    '%FAN_TAN_ROOM': {
      name: 'Fan-Tan Room',
      description: `A smaller gambling room branches off from the main hall, this one dedicated to fan-tan—the game of counting and dividing that could occupy workers for hours with only a handful of buttons and a porcelain cup. The room is intimate, the table circular, the atmosphere suggesting long nights and small stakes.`,
      x: 0,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%GAMBLING_HALL',
        west: '%STORAGE_WARREN',
        east: '%DICE_DEN',
        south: '%TUNNEL_CROSS',
      },
      objects: [
        { prototype: 'desk', name: 'a fan-tan table', description: 'A small round table with a brass bowl in the center. Tokens are scattered around the rim, left mid-game decades ago.', boltedDown: true },
        { prototype: 'bench', name: 'player stools', description: 'Low wooden stools surround the table, worn smooth where gamblers sat for hours.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN y=-10 CORRIDOR
    // Connecting Fan-Tan Room to Opium Storage
    // ═══════════════════════════════════════════════════════════════════════

    '%DICE_DEN': {
      name: 'Dice Den',
      description: `A cramped chamber where pai gow and other dice games ran around the clock, the rattle of domino tiles and the clicking of dice filling the air with the percussion of chance. The tables are shallow pits in the floor, designed so players could sit or squat around them in the Chinese style, the dominos and dice always within arm's reach.

The walls are marked with tallies—wins and losses tracked by chalk marks that were never erased, the mathematics of luck preserved in white streaks. Some players ran lucky for months. Others lost everything in a single night. The walls remember both.`,
      x: 1,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%FAN_TAN_ROOM',
        east: '%COUNTING_ROOM',
      },
      objects: [
        { prototype: 'furniture', name: 'a dice pit', description: 'A shallow depression in the floor where players gathered around pai gow tiles and dice. The stone is worn smooth by countless hands.', boltedDown: true },
        { prototype: 'sign', name: 'tally marks', description: 'Chalk marks cover the walls in dense clusters—wins and losses tracked over years. Some sections show remarkable runs. Others are solid blocks of loss.', boltedDown: true },
      ],
    },

    '%COUNTING_ROOM': {
      name: 'Counting Room',
      description: `Between the gambling rooms and the opium storage, a small chamber served as the counting room—where the house's take was calculated, sorted, and hidden before it could be seized. The room is built like a vault, its walls thick, its door heavy. The abacuses on the desks could calculate sums faster than any American clerk.

The counting room was the heart of the underground economy—the place where risk became reward, where luck became cash, where the community's forbidden commerce was converted into funds for survival. The desks are empty now. The calculations are finished.`,
      x: 2,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%DICE_DEN',
        east: '%OPIUM_STORAGE',
      },
      objects: [
        { prototype: 'desk', name: 'counting desks', description: 'Heavy wooden desks with locked drawers and built-in abacuses. The beads are frozen mid-calculation, the sums never finished.', boltedDown: true },
        { prototype: 'safe', name: 'a false floor panel', description: 'A section of floor lifts to reveal a hidden compartment. Whatever it once held is long gone, but the hiding place remains.', boltedDown: true },
        { prototype: 'sign', name: 'ledger fragments', description: 'Fragments of a burned ledger lie in a corner—columns of numbers in Chinese, the record of underground commerce that someone tried to destroy.', boltedDown: true },
      ],
    },

    '%OPIUM_STORAGE': {
      name: 'Opium Storage',
      description: `A locked room that once held the supply for the den above—the dark paste that arrived from Asia in careful packaging, worth more than gold to those who craved it. The room is small, built like a vault, the door heavy iron designed to resist both thieves and raids.

The door stands open now. Whatever it protected is long since gone.`,
      x: 3,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%OPIUM_DEN',
        west: '%COUNTING_ROOM',
        east: '%PREPARATION_ROOM',
      },
      objects: [
        { prototype: 'safe', name: 'a broken vault door', description: 'A heavy iron door hangs from broken hinges, its lock mechanism destroyed by force. Scratch marks show where pry bars worked at the edges.', boltedDown: true },
        { prototype: 'cabinet', name: 'empty shelving', description: 'Wooden shelves line the walls, each compartment labeled with Chinese characters. All are empty, cleaned out thoroughly.', boltedDown: true },
        { prototype: 'sign', name: 'a inventory ledger page', description: 'A single page from a ledger is nailed to the wall, columns of numbers representing shipments and sales. The final entry is dated 1909.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EASTERN y=-10 CORRIDOR
    // Connecting Opium Storage to Worker Quarters
    // ═══════════════════════════════════════════════════════════════════════

    '%PREPARATION_ROOM': {
      name: 'Opium Preparation Room',
      description: `The chamber was where raw opium was processed for consumption—a meticulous craft that required precision and patience. The preparation table remains, its surface stained dark by decades of handling the drug. Small tools are scattered about: scales accurate to the grain, scissors for cutting the paste, and the ceramic dishes where the opium was portioned for sale.

A calendar on the wall shows the last month of operation—October 1937. The Marihuana Tax Act had passed that year, lumping opium with other substances. The preparation room fell silent, but the smell of the drug lingers in the wood like a ghost.`,
      x: 4,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%OPIUM_STORAGE',
        east: '%SMUGGLER_CHUTE',
      },
      objects: [
        { prototype: 'furniture', name: 'preparation table', description: 'A heavy wooden table stained nearly black by decades of opium handling. The surface shows the imprints of countless portioning dishes.', boltedDown: true },
        { prototype: 'cabinet', name: 'precision scales', description: 'Small brass scales accurate to the grain sit on a shelf, their weights arranged in descending order. Some weights are missing.', boltedDown: true },
        { prototype: 'sign', name: 'a dated calendar', description: 'A calendar shows October 1937. "CLOSED - FINAL" is written across the month in red.', boltedDown: true },
      ],
    },

    '%SMUGGLER_CHUTE': {
      name: 'Smuggler\'s Chute',
      description: `A vertical shaft in the floor leads down to deeper passages—the smuggler's chute, used to move contraband quickly out of reach during raids. The chute is narrow, barely wide enough for a man to slide through, with iron rungs set into one side for climbing back up. A pulley system at the top allowed cargo to be lowered and raised.

The chute still functions, though who uses it now is unclear. Fresh rope on the pulley suggests someone replaced the old hemp recently. Fresh scratches on the iron rungs suggest someone descended. Fresh silence suggests they haven't come back up.`,
      x: 5,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PREPARATION_ROOM',
        east: '%NIGHT_SOIL_PASSAGE',
        down: {
          to: 'buildings/deep-cisterns/z-4.ts',
          room: '%SMUGGLER_BOTTOM',
          description: 'A narrow chute descends into darkness',
        },
      },
      objects: [
        { prototype: 'furniture', name: 'a pulley system', description: 'A wooden beam spans the chute opening, a pulley wheel mounted at its center. The rope is new—someone replaced it recently.', boltedDown: true },
        { prototype: 'sign', name: 'fresh scratches', description: 'Iron rungs lead down into darkness. The scratches on them are fresh—someone descended. The silence suggests they\'re still down there.', boltedDown: true },
      ],
    },

    '%NIGHT_SOIL_PASSAGE': {
      name: 'Night Soil Passage',
      description: `The passage served a purpose everyone needed but nobody discussed—the removal of human waste from the underground community. Night soil carriers used this route in darkness, hauling the community's refuse to disposal points near the waterfront. The work was considered shameful, performed by the lowest members of society, but it kept the underground livable.

The smell has faded after decades, replaced by the general must of abandoned spaces. But the stains on the floor show the path the carriers walked, a route defined by necessity and repeated until it became permanent.`,
      x: 6,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%SMUGGLER_CHUTE',
        east: '%WORKER_QUARTERS',
      },
      objects: [
        { prototype: 'furniture', name: 'worn floor path', description: 'A darker path is worn into the stone floor—the route of the night soil carriers, marked by decades of heavy loads.', boltedDown: true },
        { prototype: 'sign', name: 'a water barrel', description: 'An empty barrel sits in a corner, once used for washing hands and tools. The bottom is stained black with age.', boltedDown: true },
      ],
    },

    '%WORKER_QUARTERS': {
      name: 'Worker Quarters',
      description: `The passage opens into a dormitory space where laundry workers once slept in bunks stacked three high. The bunks are gone, but the anchor points remain in the walls, along with the carved shelves where personal possessions were kept. A dozen men could sleep here, working sixteen-hour days and falling into exhausted rest within arm's reach of each other.

The community that built this space built it from necessity. They are gone now. The space remembers.`,
      x: 7,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LAUNDRY_BASEMENT',
        west: '%NIGHT_SOIL_PASSAGE',
        south: '%EASTERN_TUNNEL',
      },
      objects: [
        { prototype: 'sign', name: 'carved names', description: 'Names are carved into the wall—Chinese characters and anglicized versions side by side. "WONG YUEN - Charlie Wong". "LEE KAM - Samuel Lee". The workers named themselves twice.', boltedDown: true },
        { prototype: 'bench', name: 'a bunk frame', description: 'The iron frame of a triple bunk remains anchored to the wall, its mattresses and boards long since rotted away.', boltedDown: true },
        { prototype: 'cabinet', name: 'a personal shrine niche', description: 'A small niche carved into the wall held a personal shrine. Incense ash still stains the stone. A faded photograph shows a family in China, never reunited.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN TUNNELS
    // ═══════════════════════════════════════════════════════════════════════

    '%TUNNEL_SOUTH': {
      name: 'Southern Passage',
      description: `The passage runs south from the inhabited areas into territory that was never developed for use—a tunnel that was started and abandoned, perhaps intended to connect to something that was never built. The construction grows rougher, the passage narrower, the light dimmer.

The tunnel ends at a cave-in. Beyond it, who knows.`,
      x: -3,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 5,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%FAN_TAN_ROOM',
        east: '%SMUGGLER_CACHE',
      },
      objects: [
        { prototype: 'sign', name: 'a cave-in warning', description: 'Characters scratched into the wall warn of instability ahead. An arrow points back the way you came.', boltedDown: true },
        { prototype: 'crate', name: 'abandoned tools', description: 'Picks and shovels lie where they were dropped, rusted solid. The workers who left them never returned.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN PASSAGE CORRIDOR (y=-11, x=-2 to x=3)
    // Connecting Southern Passage to Eastern Tunnel
    // ═══════════════════════════════════════════════════════════════════════

    '%SMUGGLER_CACHE': {
      name: 'Smuggler\'s Cache',
      description: `The tunnel widens into a natural cavity that was enlarged by human hands—a hiding place for contraband that needed to disappear quickly. False walls line the space, their seams visible now that age has warped the wood. Behind them: shelving sized for crates, hooks for hanging goods, all empty but speaking of volumes that passed through.

Customs seized this cache in 1923. Or they thought they did. The false walls they found had false walls behind them. What those innermost chambers held, the official record doesn't say.`,
      x: -2,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%TUNNEL_SOUTH',
        east: '%BONE_CHAMBER',
      },
      objects: [
        { prototype: 'cabinet', name: 'false wall panels', description: 'Wooden panels are hinged at invisible points, swinging aside to reveal empty shelves. The hinges are brass, still functional, still silent.', boltedDown: true },
        { prototype: 'crate', name: 'a hidden compartment', description: 'A section of floor lifts to reveal a compartment below—large enough for a man to hide in. The wood is scratched from inside.', boltedDown: true },
      ],
    },

    '%BONE_CHAMBER': {
      name: 'Bone Collection Chamber',
      description: `The tunnel passes through a chamber that once served a sacred purpose—collecting the bones of Chinese workers for return to their homeland. Those who died in Seattle without family were brought here, their remains cleaned and prepared for the long journey home. Wooden shelves once held hundreds of carefully labeled bone boxes, each containing what remained of a man who never saw Guangdong again.

The shelves are empty now. In 1927, a ship carried the last of the bone boxes across the Pacific. The chamber's purpose was fulfilled. But it was never forgotten.`,
      x: -1,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 2,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%SMUGGLER_CACHE',
        east: '%TUNNEL_CROSS',
      },
      objects: [
        { prototype: 'furniture', name: 'bone preparation table', description: 'A stone table where the dead were prepared for their journey home. The surface is worn smooth by hands that worked with reverence.', boltedDown: true },
        { prototype: 'cabinet', name: 'empty bone shelves', description: 'Wooden shelving with labeled slots stretches to the ceiling. Each slot once held a box. Each box held what remained of a life.', boltedDown: true },
        { prototype: 'sign', name: 'a prayer scroll', description: 'A faded paper scroll bears prayers for the dead in classical Chinese. The ink has faded, but the intention remains.', boltedDown: true },
      ],
    },

    '%TUNNEL_CROSS': {
      name: 'Tunnel Crossroads',
      description: `Four passages meet at this junction—north toward the inhabited spaces, south into flooded darkness, east and west along the buried corridor. The intersection was important once, a hub where different routes converged. The walls show the marks of heavy traffic, the floor worn into paths by countless feet.

Someone has scratched a map into the stone—a crude guide to the underground that was never meant to be mapped. The destinations are labeled in Chinese, the distances marked in paces rather than feet.`,
      x: 0,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%BONE_CHAMBER',
        east: '%COOLING_ROOM',
        north: '%FAN_TAN_ROOM',
        down: '%FLOODED_DESCENT',
      },
      objects: [
        { prototype: 'sign', name: 'a scratched map', description: 'A rough map carved into the wall shows branching passages and destinations. Some routes are crossed out. Some have warnings: "水" (water), "塌" (collapse).', boltedDown: true },
        { prototype: 'furniture', name: 'a direction marker', description: 'A stone post rises from the floor, its four sides pointing in cardinal directions. Each side shows a carved symbol representing what lies that way.', boltedDown: true },
      ],
    },

    '%COOLING_ROOM': {
      name: 'Ice Merchant\'s Cooling Room',
      description: `The tunnel opens into a chamber once used to store ice—blocks cut from Lake Washington and hauled underground where the earth's coolness would preserve them. Sawdust still covers the floor, the insulation that kept the ice from melting too quickly. Channels in the floor carried the melt water away.

The ice merchant served the community above and below—keeping food fresh for restaurants, providing relief during summer heat, and running a profitable side business in cold storage for those who needed things preserved without questions asked.`,
      x: 1,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 15,
      outdoor: false,
      exits: {
        west: '%TUNNEL_CROSS',
        east: '%FIRECRACKER_VAULT',
      },
      objects: [
        { prototype: 'crate', name: 'frozen sawdust', description: 'The sawdust has compressed into a solid mass over decades, frozen into a floor covering that crunches underfoot like old snow.', boltedDown: true },
        { prototype: 'furniture', name: 'ice hooks', description: 'Heavy iron hooks hang from the ceiling, sized for grabbing 300-pound ice blocks. The metal is pitted with rust.', boltedDown: true },
        { prototype: 'sign', name: 'a price list', description: 'A faded sign shows prices: "ICE 5¢/LB - COLD STORAGE 10¢/DAY - NO QUESTIONS 25¢/DAY"', boltedDown: true },
      ],
    },

    '%FIRECRACKER_VAULT': {
      name: 'Firecracker Vault',
      description: `The chamber was built to store fireworks—the explosives that lit up Chinatown during festivals, that announced births and mourned deaths, that kept evil spirits at bay during the New Year. The walls are scarred by a fire that happened here once, the stone blackened in patterns that suggest a spectacular accident. Remarkably, the structure survived.

Empty shelves show where crates of firecrackers once stood, sorted by type and size. A few unexploded shells remain in corners, too dangerous to move, too old to trust. The smell of gunpowder has never quite left the stone.`,
      x: 2,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%COOLING_ROOM',
        east: '%ANCESTOR_PATH',
      },
      objects: [
        { prototype: 'sign', name: 'burn marks', description: 'The ceiling and walls show the star-shaped burn patterns of an explosion. Someone lit a fuse that wasn\'t meant to be lit.', boltedDown: true },
        { prototype: 'crate', name: 'old firecracker shells', description: 'A few unexploded shells remain in a corner, their paper casings brittle, their fuses crumbling. Touch them at your own risk.', boltedDown: true },
        { prototype: 'sign', name: 'a warning in three languages', description: 'A sign in Chinese, English, and something older reads: "NO FLAMES. NO SMOKING. NO EXCEPTIONS." Someone underlined "EXCEPTIONS" three times.', boltedDown: true },
      ],
    },

    '%ANCESTOR_PATH': {
      name: 'Ancestor\'s Path',
      description: `The tunnel widens into a ceremonial space—a passage used during funerals to carry the dead from the community to their resting places. Paper spirit money lies in drifts along the walls, burned to provide wealth in the afterlife. The passage is oriented carefully, following principles of feng shui that ensured the dead would find their way.

The living used other routes. This path was reserved for those making their final journey, accompanied by mourners and monks who ensured proper passage to the other world.`,
      x: 3,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 2,
      lighting: 6,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%FIRECRACKER_VAULT',
        east: '%EASTERN_TUNNEL',
      },
      objects: [
        { prototype: 'sign', name: 'spirit money drifts', description: 'Paper money printed with impossible denominations—millions, billions—lies in drifts. Burned for the dead, it accumulated here over decades.', boltedDown: true },
        { prototype: 'furniture', name: 'a funeral bier rest', description: 'Stone blocks at waist height provided places to rest the coffin during the journey. The stone is worn smooth by the weight of the dead.', boltedDown: true },
        { prototype: 'sign', name: 'feng shui markers', description: 'Compass points are carved into the stone, aligning the passage with directions that guide spirits home.', boltedDown: true },
      ],
    },

    '%FLOODED_DESCENT': {
      name: 'Flooded Descent',
      description: `A shaft descends from the crossroads into water—black water that has risen over decades, claiming passages that once led elsewhere. The shaft was built with steps, but only the top few remain above the surface. The rest disappear into depths that reflect nothing.

Those who remember say the flooded passages once led to the oldest tunnels—pre-fire construction, perhaps pre-city. Now only divers can explore them, and few divers are willing. The water is cold, the passages narrow, and the currents unpredictable.`,
      x: 0,
      y: -11,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 2,
      waterLevel: 80,
      outdoor: false,
      exits: {
        up: '%TUNNEL_CROSS',
        down: {
          to: 'buildings/deep-cisterns/z-4.ts',
          room: '%FLOODED_JUNCTION',
          description: 'The flooded shaft continues down into absolute darkness',
        },
      },
      objects: [
        { prototype: 'sign', name: 'carved steps', description: 'Stone steps descend into black water. You can see four steps clearly, two more dimly, then nothing. How deep does it go?', boltedDown: true },
        { prototype: 'furniture', name: 'a rusted chain', description: 'An iron chain is anchored to the wall, descending into the water. It\'s been cut partway down, the severed end dangling just above the surface.', boltedDown: true },
      ],
    },

    '%EASTERN_TUNNEL': {
      name: 'Eastern Tunnel',
      description: `The passage winds east through the edge of the underground network, connecting the Chinatown tunnels to routes that run toward the industrial district. The construction is mixed—hand-carved passages meeting later infrastructure, the work of different communities overlapping in the darkness.`,
      x: 4,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%ANCESTOR_PATH',
        north: '%WORKER_QUARTERS',
        east: '%WASHBOARD_PASSAGE',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EASTERN y=-11 EXTENSION
    // Connecting Eastern Tunnel to Industrial Connection
    // ═══════════════════════════════════════════════════════════════════════

    '%WASHBOARD_PASSAGE': {
      name: 'Washboard Passage',
      description: `The tunnel floor is ridged like a washboard—channels cut into the stone to drain water toward the deeper passages. The engineering was crude but effective: workers carved the grooves by hand, creating a surface that stayed relatively dry even when the tunnels flooded. Walking here requires care; the ridges catch feet and turn ankles.

The walls show watermarks from floods long past—high water lines that reached chest height, reminders of the battles against the underground water that never truly stops rising. Someone scratched a flood calendar into the stone: 1903, 1906, 1917, 1934, 1948. The intervals grew longer. Or maybe recording stopped.`,
      x: 5,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 8,
      waterLevel: 15,
      outdoor: false,
      exits: {
        west: '%EASTERN_TUNNEL',
        east: '%RAIL_WORKER_CACHE',
      },
      objects: [
        { prototype: 'sign', name: 'flood marks', description: 'Dark lines on the walls show how high the water rose in various floods. Some marks are chest-high. Below them: years carved in stone.', boltedDown: true },
        { prototype: 'furniture', name: 'washboard channels', description: 'Stone ridges run the length of the floor, cut to drain water. The channels show the wear of decades of flow.', boltedDown: true },
      ],
    },

    '%RAIL_WORKER_CACHE': {
      name: 'Rail Worker\'s Cache',
      description: `A hidden chamber where Chinese railroad workers stored supplies they couldn't keep in the open—tools bought with their own wages, medicines from home, letters to and from families across the Pacific. The cache was built into a natural cavity, its entrance disguised by a false wall that has since fallen away.

The shelves hold artifacts of lives lived at the margins: a set of hand-forged railroad spikes, a brass compass with Chinese characters on its face, and a photograph of men standing beside a locomotive, their faces small and serious. The locomotive is brand new. The men are exhausted. The railroad is finished. The workers are not.`,
      x: 6,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%WASHBOARD_PASSAGE',
        east: '%INDUSTRIAL_CONN',
      },
      objects: [
        { prototype: 'cabinet', name: 'a hidden cache', description: 'Shelves built into a cavity hold artifacts: hand-forged railroad spikes, a compass with Chinese characters, letters in silk envelopes.', boltedDown: true },
        { prototype: 'sign', name: 'a railroad photograph', description: 'Men stand beside a locomotive, their faces small and serious. The railroad is brand new. The workers look like they\'ve been building it forever.', boltedDown: true },
        { prototype: 'furniture', name: 'collapsed false wall', description: 'Planks that once hid this cache lie rotted on the floor. The secret lasted as long as anyone needed it to.', boltedDown: true },
      ],
    },

    '%INDUSTRIAL_CONN': {
      name: 'Industrial Connection',
      description: `The passage reaches a junction where the Chinatown tunnels meet routes that run toward the industrial waterfront. The construction changes abruptly—hand-carved stone giving way to concrete and steel, the infrastructure of the early twentieth century joining the work of earlier decades.

This connection linked the Chinese community to the industrial jobs that sometimes hired them when other employers would not.`,
      x: 7,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%RAIL_WORKER_CACHE',
        east: {
          to: 'buildings/industrial-underground/z-2.ts',
          room: '%WORKER_TUNNEL',
          description: 'A passage leads east toward the industrial tunnels',
        },
      },
      objects: [
        { prototype: 'sign', name: 'a bilingual sign', description: 'A sign in English and Chinese reads: "WORKERS THIS WAY →". The Chinese characters add: "Stay together. Stay silent."', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP SECTIONS
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_PASSAGE': {
      name: 'Deep Passage',
      description: `A narrow shaft descends from the junction into older passages—tunnels that predate the Chinatown community, perhaps dug during Seattle's earliest years or even before. The construction is primitive, the passage tight, the destination unclear.

Few venture this way. Those who do find the older Seattle, the one that existed before the fire, before the regrading, before the underground was forgotten.`,
      x: 0,
      y: -8,
      z: -3,
      population: 0,
      ambientNoise: 5,
      lighting: 3,
      waterLevel: 20,
      outdoor: false,
      exits: {
        up: '%JACKSON_MAIN',
        south: '%ANCIENT_TUNNEL',
      },
      objects: [
        { prototype: 'sign', name: 'old tool marks', description: 'The walls show tool marks from a different era—hand-forged picks, not the machine-made tools of later decades.', boltedDown: true },
      ],
    },

    '%ANCIENT_TUNNEL': {
      name: 'Ancient Tunnel',
      description: `The passage continues through what might be Seattle's oldest underground construction—tunnels dug before the Great Fire of 1889, preserved by chance when the city was rebuilt above them. The construction is rough, the purpose unclear. Perhaps drainage. Perhaps smuggling. Perhaps something else entirely.

Water seeps through the walls. The darkness is absolute without a light source. The city's foundations rest above, unaware of what lies beneath.`,
      x: 0,
      y: -9,
      z: -3,
      population: 0,
      ambientNoise: 8,
      lighting: 0,
      waterLevel: 30,
      outdoor: false,
      exits: {
        north: '%DEEP_PASSAGE',
        down: {
          to: 'buildings/deep-cisterns/z-4.ts',
          room: '%CHINATOWN_ACCESS',
          description: 'A flooded shaft descends into absolute darkness',
        },
      },
      objects: [
        { prototype: 'sign', name: 'carved date', description: 'A date is carved into the stone: "1878". Eleven years before the fire. Someone was here before Seattle buried itself.', boltedDown: true },
        { prototype: 'crate', name: 'a rotted barrel', description: 'The remains of a wooden barrel, its staves collapsed inward. Whatever it held dissolved into the earth decades ago.', boltedDown: true },
      ],
    },
  },
};
