// Merchant's Cafe - Ground Floor (z=0)
// Seattle's oldest restaurant, est. 1890

export const building = {
  name: "Merchant's Cafe",
  x: -16,
  y: -3,
  width: 3,
  height: 2,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: "Merchant's Cafe Lock",
      description:
        'An antique brass lock, the kind with a skeleton key. The mechanism is worn but functional—over a century of use has polished it smooth.',
      difficulty: 4,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Cafe Entrance',
      description:
        "A heavy wooden door with a large glass panel, gold lettering spelling out MERCHANT'S CAFE in an arc across the glass. The door stands slightly ajar, as if waiting for the next customer.",
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'wood',
      durability: 70,
    },
    '%KITCHEN_DOOR': {
      prototype: 'door',
      name: 'Kitchen Door',
      description:
        'A swinging door with a round porthole window, the kind that lets servers see who is coming through. The hinges are well-oiled from decades of use.',
      locked: false,
      open: false,
      locks: [],
      material: 'wood',
      durability: 65,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - BAR AND DINING
    // ═══════════════════════════════════════════════════════════════════

    '%BAR': {
      name: "Merchant's Cafe - Bar",
      description: `The bar is a cathedral to drinking, a mahogany altar that runs the length of the room. The wood is dark and lustrous, polished by a century of elbows and spilled drinks and careful maintenance. Brass rails run along the base for feet, along the top for hands. The craftsmanship speaks to an era when bars were built to last forever.

Behind the bar, bottles line the mirrored shelves in neat rows—whiskey, bourbon, gin, the amber and clear spirits that fueled the neighborhood's evenings. The bottles are dusty but full, their labels faded, their contents still potent. A brass cash register sits at one end, its keys frozen, its drawer slightly open.

Bar stools with torn leather seats line the mahogany counter, their chrome bases dulled, their cushions cracked. Someone sat on each of these stools. Someone drank and talked and laughed. The stools remember even if no one else does.`,
      x: -14,
      y: -2,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '1st-ave-s/y-2.ts',
          description: 'The glass-paneled door leads back to 1st Ave S',
          door: '%FRONT_DOOR',
        },
        west: '%DINING',
        north: '%KITCHEN',
      },
      sittables: [
        {
          name: 'the bar stools',
          capacity: 8,
          emptyMsg:
            'Chrome bar stools with torn leather seats line the mahogany bar, waiting for drinkers who will never come.',
          occupiedMsg: '%s perched on a bar stool',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'mahogany bar',
          aliases: ['bar', 'counter'],
          description: `The bar is a work of art—solid mahogany, at least fifteen feet long, its surface worn smooth by generations of glasses and elbows. Brass rails run along its base and edge, tarnished but still elegant. The wood has absorbed decades of spills and conversations, its dark surface holding memories the way old wood does. This bar has outlasted everyone who ever drank at it.`,
        },
        {
          prototype: 'cabinet',
          name: 'bottle shelves',
          aliases: ['bottles', 'liquor', 'spirits', 'shelves'],
          description: `Mirrored shelves behind the bar hold rows of bottles—bourbon, whiskey, scotch, gin, vodka, the full taxonomy of spirits. The bottles are dusty but full, their labels faded but legible: Jim Beam, Jack Daniel's, Tanqueray, brands that survived Prohibition and depression and war. The mirrors multiply the bottles into an army of alcohol. The alcohol waits, patient, for someone to pour.`,
        },
        {
          prototype: 'describable',
          name: 'brass cash register',
          aliases: ['register', 'till', 'cash register'],
          description: `An antique brass cash register, the kind with mechanical keys and a bell that rings when the drawer opens. The drawer is slightly ajar, revealing the cash tray inside—bills sorted by denomination, coins in their compartments. Nobody took the money. The money doesn't matter anymore. The register remains, a monument to transactions that no longer occur.`,
        },
        {
          prototype: 'describable',
          name: 'bar mirror',
          aliases: ['mirror'],
          description: `A long mirror behind the bottles reflects the empty bar back on itself—the stools, the brass rails, the dust motes floating in whatever light seeps through the windows. The mirror is spotted with age, dark patches where the silver backing has oxidized. In the patches, the reflection disappears. The rest shows a room that used to be full.`,
        },
      ],
    },

    '%DINING': {
      name: "Merchant's Cafe - Dining Room",
      description: `The dining room extends behind the bar, a space of white tablecloths and wooden chairs arranged with the precision of a restaurant that took itself seriously. The tablecloths are yellowed now, stained in places, but still laid out as if expecting the dinner rush.

Framed photographs line the walls—black and white images of Seattle's past, the waterfront when it was a working port, the streets before automobiles, faces of people who have been dead for a century. The photographs document a city that no longer exists, displayed for diners who no longer come.

A fireplace occupies one wall, its hearth cold, its mantle displaying trophies and awards the restaurant earned over the decades. BEST OF SEATTLE 1987. JAMES BEARD SEMIFINALIST 1994. The accolades accumulated. The restaurant kept serving. Until it didn't.`,
      x: -15,
      y: -2,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%BAR',
      },
      sittables: [
        {
          name: 'the dining tables',
          capacity: 16,
          emptyMsg:
            'White-clothed tables fill the dining room, each set with silverware that will never be used.',
          occupiedMsg: '%s seated at a dining table',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'dining tables',
          aliases: ['tables'],
          description: `Wooden tables covered in white linen, arranged in neat rows with precise spacing between them. Each table is set with silverware, cloth napkins folded into fans, wine glasses positioned at the upper right. The settings are complete, waiting for orders that will never be taken. The white cloths have yellowed. The silverware has tarnished. The arrangement persists.`,
        },
        {
          prototype: 'furniture',
          name: 'fireplace',
          aliases: ['hearth', 'mantle'],
          description: `A brick fireplace, its hearth cold, ashes long since settled into grey dust. The mantle displays the restaurant's history: framed awards, photographs of celebrity diners, a proclamation from the mayor declaring some anniversary or another. Brass candlesticks flank the display, their candles burned down to nubs. The fireplace warmed countless winter evenings. The warmth has faded.`,
        },
        {
          prototype: 'describable',
          name: 'historic photographs',
          aliases: ['photographs', 'photos', 'pictures'],
          description: `Black and white photographs in wooden frames line the walls—images of Seattle in the 1890s, the original restaurant when it first opened, the waterfront crowded with sailing ships. Faces look out from the photographs: men in bowler hats, women in long dresses, expressions frozen in the formal poses of early photography. Everyone in these photographs is dead. The photographs remain.`,
        },
        {
          prototype: 'describable',
          name: 'award display',
          aliases: ['awards', 'trophies', 'plaques'],
          description: `Framed awards and plaques cover one section of wall, documenting the restaurant's culinary recognition over the decades. BEST SEAFOOD - SEATTLE MAGAZINE 1978. ZAGAT RATED 27. JAMES BEARD SEMIFINALIST 1994, 1997, 2001. The accolades pile up like sediment, layers of praise from critics who have moved on to other restaurants or other cities or other lives.`,
        },
      ],
    },

    '%KITCHEN': {
      name: "Merchant's Cafe - Kitchen",
      description: `The kitchen is stainless steel and white tile, the industrial heart that fed the dining room for over a century. A commercial range dominates one wall, its burners cold, its griddle crusted with the ghost of the last meal cooked here. Pots hang from overhead racks, their copper bottoms tarnished green.

The walk-in cooler hums quietly in the corner—someone left the power on, and the compressor still cycles, keeping whatever remains inside at temperature. The door is heavy steel with a latch that opens from inside, a safety feature for the staff who once worked here.

Prep tables line the center of the room, their surfaces stained with the history of vegetables chopped and meat portioned and plates assembled. The menu board on the wall still lists the day's specials in chalk. The chalk has faded. The specials expired long ago.`,
      x: -14,
      y: -3,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          description: 'A swinging door leads to the bar',
          door: '%KITCHEN_DOOR',
          to: '%BAR',
        },
        up: {
          description: 'A steel hatch and ladder lead up through the upper floors to the roof',
          to: '%ROOF_NW',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'commercial range',
          aliases: ['range', 'stove', 'griddle'],
          description: `A massive commercial range with eight burners, a griddle, and two ovens—the kind of equipment that can feed a hundred people in an evening. The burners are cold, the pilot lights extinguished. The griddle surface is crusted with carbonized residue from the last breakfast service. The ovens are empty. The kitchen waits for cooks who will never return.`,
        },
        {
          prototype: 'cabinet',
          name: 'walk-in cooler',
          aliases: ['cooler', 'refrigerator', 'walk-in'],
          description: `A walk-in cooler hums in the corner, its compressor still cycling, its temperature holding steady. The heavy steel door has a safety latch that opens from inside—a feature required by health codes, designed to prevent workers from being trapped. Whatever is inside has been at 38 degrees for months. The contents are best left to imagination.`,
        },
        {
          prototype: 'desk',
          name: 'prep tables',
          aliases: ['tables', 'prep station'],
          description: `Stainless steel prep tables line the center of the kitchen, their surfaces scarred by years of cutting and chopping. Cutting boards are stacked at one end, knives racked magnetically on the wall above. The mise en place that once occupied these tables—chopped onions, portioned proteins, prepped garnishes—is long gone. The tables remain, waiting for prep that will never begin.`,
        },
        {
          prototype: 'describable',
          name: 'specials board',
          aliases: ['board', 'menu', 'chalkboard'],
          description: `A chalkboard mounted on the wall lists the day's specials in faded script: "SALMON - PAN SEARED w/ LEMON BEURRE BLANC - $24." "CLAM CHOWDER - CUP $6 / BOWL $9." "PEAR TART - HOUSEMADE - $8." The prices are from another era. The dishes are from another world. The chalk has faded to ghosts of letters.`,
        },
        {
          prototype: 'describable',
          name: 'copper pots',
          aliases: ['pots', 'pans', 'cookware'],
          description: `Copper pots hang from an overhead rack, their surfaces tarnished to verdigris but their construction still solid. These are professional-grade cookware—heavy, responsive, expensive. The kind of tools that serious kitchens invest in and pass down through generations of cooks. The cooks are gone. The pots remain, waiting to conduct heat they will never feel.`,
        },
      ],
    },
  },
};
