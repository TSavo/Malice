// J&M Cafe - Ground Floor (z=0)
// Historic bar and cardroom, operating since 1889
// One of Seattle's oldest continuously operating establishments

export const building = {
  name: 'J&M Cafe',
  x: -15,
  y: 4,
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
        'A heavy brass deadbolt, worn smooth by over a century of use.',
      difficulty: 3,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Cafe Entrance',
      description:
        'A heavy wooden door with frosted glass panels, J&M CAFE etched into the glass in an ornate Victorian script. The brass door handle is worn to a bright polish where countless hands have gripped it.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'wood',
      durability: 70,
    },
    '%CARD_ROOM_DOOR': {
      prototype: 'door',
      name: 'Card Room Door',
      description:
        'A solid wooden door with a small window covered by a sliding panel from inside. The door is heavier than it looks—built to muffle sound and discourage curiosity.',
      locked: false,
      open: false,
      locks: [],
      material: 'wood',
      durability: 65,
    },
    '%BACK_DOOR': {
      prototype: 'door',
      name: 'Alley Door',
      description:
        'A steel door with multiple locks, all currently disengaged. The door opens onto the back alley.',
      locked: false,
      open: false,
      locks: [],
      material: 'metal',
      durability: 80,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - BAR AND CARD ROOM
    // ═══════════════════════════════════════════════════════════════════

    '%BAR': {
      name: 'J&M Cafe - Bar',
      description: `The J&M Cafe has been serving drinks since 1889, making it one of Seattle's oldest bars—older than statehood, older than the fire that reshaped Pioneer Square, older than most of the buildings around it. The current building is post-fire, but the bar itself was salvaged from the original, its mahogany darkened by time and smoke and the hands of everyone who's ever leaned on it.

The back bar is a Victorian masterpiece: carved mahogany, beveled mirrors, brass fixtures green with verdigris. Bottles line the shelves in careful rows—whiskey, bourbon, gin, the eternal taxonomy of drinking. A brass cash register from the 1920s sits at one end, its keys frozen, its drawer slightly open.

The walls are covered in photographs and memorabilia: Seattle when it was a frontier town, Klondike prospectors spending their gold, Prohibition-era speakeasy tokens, decades of regular customers whose faces blur into a single expression of contentment. The J&M was never fancy. It was reliable. It was still here when almost nothing else was.`,
      x: -15,
      y: 4,
      z: 0,
      population: 0,
      ambientNoise: 2,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: '1st-ave-s/y4.ts',
          description: 'The heavy wooden door opens onto 1st Ave S',
          door: '%FRONT_DOOR',
        },
        north: '%DINING',
        west: {
          description: 'A solid door leads to the card room',
          door: '%CARD_ROOM_DOOR',
          to: '%CARD_ROOM',
        },
        down: {
          to: 'z-1.ts:%CELLAR',
          description: 'A trapdoor behind the bar leads to the cellar',
          door: 'z-1.ts:%CELLAR_DOOR',
          locks: ['z-1.ts:%CELLAR_LOCK'],
        },
      },
      sittables: [
        {
          name: 'a bar stool',
          capacity: 12,
          emptyMsg:
            'Wooden bar stools with worn leather seats line the mahogany bar, their brass footrests polished by generations of boots.',
          occupiedMsg: '%s sitting at the bar',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'mahogany bar',
          aliases: ['bar', 'counter'],
          description: `The bar is a survivor—salvaged from the original J&M before the Great Fire, it's been in continuous use since 1889. The mahogany is dark, almost black in places, stained by a century and a half of spilled drinks and resting elbows. Brass rails run along the base and edge, worn smooth by countless feet and hands. This bar has outlasted everyone who ever drank at it. It will probably outlast everyone who drinks at it now.`,
        },
        {
          prototype: 'cabinet',
          name: 'Victorian back bar',
          aliases: ['back bar', 'bottles', 'shelves'],
          description: `The back bar is a work of Victorian craftsmanship—carved mahogany rising eight feet, beveled mirrors multiplying the bottles into infinite regression, brass fixtures that were expensive when new and irreplaceable now. The bottles are dusty but full: local whiskeys, imported scotch, the anonymous vodkas that nobody drinks neat. The mirrors reflect a room that hasn't changed in decades and might never change again.`,
        },
        {
          prototype: 'describable',
          name: 'brass cash register',
          aliases: ['register', 'till'],
          description: `A National Cash Register from the 1920s, brass and iron and mechanical precision. The keys are labeled with amounts that seem quaint: 5¢, 10¢, 25¢. The drawer is slightly open, revealing empty slots where bills and coins once lived. The register was a marvel of technology once. Now it's a monument.`,
        },
        {
          prototype: 'describable',
          name: 'wall memorabilia',
          aliases: ['photographs', 'photos', 'memorabilia'],
          description: `Every inch of wall space is covered in photographs, newspaper clippings, and assorted memorabilia. Photos of Seattle before the fire. Klondike miners spending their last night in civilization. Prohibition-era speakeasy tokens that the J&M definitely didn't use. Signed photos of minor celebrities whose names nobody remembers. The wall is a museum of drinking, a chronicle of everyone who ever needed a drink and found one here.`,
        },
      ],
    },

    '%DINING': {
      name: 'J&M Cafe - Dining Room',
      description: `The dining room extends behind the bar, a space of dark wood and red leather that hasn't changed since the 1950s renovation. Booths line the walls, their leather cracked but comfortable, their tables scarred by generations of diners who didn't use coasters. The lighting is dim—intentionally so, hiding age and wear and the faces of people who preferred not to be seen clearly.

A jukebox stands in one corner, a Wurlitzer from the '60s, its bubble tubes dark but its selection still visible behind the curved glass. The songs are standards: Sinatra, Bennett, Mathis, the crooners who provided background music for a million drinks. The jukebox doesn't play anymore, but the songs are still there, waiting.

The menu board on the wall lists simple food at simple prices: BURGER $8. FISH & CHIPS $10. SOUP OF THE DAY $4. The J&M was never a destination restaurant. It was the place you ate when you were already drinking and realized you were hungry.`,
      x: -15,
      y: 5,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%BAR',
        west: '%KITCHEN',
        up: {
          description: 'A narrow stairway leads to the upper floor',
          to: '%STORAGE',
        },
      },
      sittables: [
        {
          name: 'a leather booth',
          capacity: 4,
          emptyMsg:
            'Red leather booths line the walls, their surfaces cracked with age but still comfortable.',
          occupiedMsg: '%s seated in a booth',
        },
        {
          name: 'a dining table',
          capacity: 4,
          emptyMsg:
            'Wooden tables fill the center of the room, their surfaces scarred by decades of use.',
          occupiedMsg: '%s sitting at a table',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'Wurlitzer jukebox',
          aliases: ['jukebox', 'wurlitzer'],
          description: `A Wurlitzer jukebox from the 1960s, chrome and colored plastic, its bubble tubes dark but its charm intact. The song selection is visible through the curved glass: Sinatra's "In the Wee Small Hours," Bennett's "I Left My Heart in San Francisco," Mathis's "Chances Are." The songs are frozen in time, as unplayable as the memories they'd evoke.`,
        },
        {
          prototype: 'describable',
          name: 'menu board',
          aliases: ['menu', 'board'],
          description: `A chalkboard menu listing the J&M's simple offerings: BURGER, FISH & CHIPS, SOUP OF THE DAY. The prices are from years ago, the specials from a day that never ended. Someone wrote "86 THE CHOWDER" in the corner and never erased it. The kitchen ran out of chowder once. The note remains.`,
        },
      ],
    },

    '%CARD_ROOM': {
      name: 'J&M Cafe - Card Room',
      description: `The card room is a Seattle institution—one of the last legal cardrooms in the city, operating under a grandfather clause that predates modern gambling regulations. The room is windowless, soundproofed, designed for privacy and concentration. Green felt tables fill the space, each one sized for poker or blackjack or whatever game found players.

Chips are still stacked at several tables, abandoned mid-game. Cards lie face-down on the felt, hands that will never be revealed. An unfinished pot sits in the center of one table—the stakes of a game that nobody won because nobody finished.

The walls are bare except for posted rules (HOUSE TAKES 5%) and a few photographs of legendary players whose luck ran out decades ago. The room smells of old smoke and older sweat and the particular anxiety that gambling produces. The anxiety has faded. The smell remains.`,
      x: -16,
      y: 4,
      z: 0,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          description: 'The heavy door leads back to the bar',
          door: '%CARD_ROOM_DOOR',
          to: '%BAR',
        },
        north: '%KITCHEN',
      },
      sittables: [
        {
          name: 'a poker table',
          capacity: 8,
          emptyMsg:
            'Green felt poker tables fill the room, chips still stacked at several positions.',
          occupiedMsg: '%s seated at the poker table',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'poker tables',
          aliases: ['tables', 'felt'],
          description: `Professional poker tables with green felt surfaces, padded rails for resting arms, and chip wells at each position. The felt is worn in spots where elbows rested and cards were dealt thousands of times. Some tables still have chips stacked—reds and blues and whites in neat columns, the currency of games that stopped mid-hand.`,
        },
        {
          prototype: 'describable',
          name: 'abandoned game',
          aliases: ['cards', 'chips', 'pot'],
          description: `One table shows a game frozen in progress: cards dealt face-down to five positions, a pot of chips accumulated in the center, betting markers indicating raises that were never called. The players left mid-hand. The stakes—maybe $200 in chips—sit unclaimed. The game will never be resolved. The cards will never be turned.`,
        },
        {
          prototype: 'describable',
          name: 'house rules',
          aliases: ['rules', 'sign'],
          description: `A framed sign on the wall lists the house rules: "HOUSE TAKES 5% OF ALL POTS. NO CREDIT. NO ARGUMENTS. MANAGEMENT RESERVES THE RIGHT TO REFUSE SERVICE." The rules are typed on yellowed paper in a typewriter font. The management that reserved those rights is gone. The rules remain posted.`,
        },
      ],
    },

    '%KITCHEN': {
      name: 'J&M Cafe - Kitchen',
      description: `The kitchen is a cramped galley, designed for efficiency rather than ambition—a flat-top grill, a deep fryer, a prep area, everything needed to produce bar food quickly. The equipment is commercial grade but old, the kind that runs forever because it was built before planned obsolescence.

A ticket wheel hangs by the service window, order slips still clipped to it. BURGER MED RARE. FISH CHIPS. The orders were never picked up. The cook—if there was one at the end—left without finishing the tickets.

The back door leads to the alley, its multiple locks all disengaged. Someone left this way, or entered this way, or both. The alley beyond is visible through the small window, grey light filtering into the fluorescent glow of the kitchen.`,
      x: -16,
      y: 5,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%DINING',
        south: '%CARD_ROOM',
        west: {
          description: 'The back door opens onto the alley',
          door: '%BACK_DOOR',
          to: 'alley/y11.ts',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'flat-top grill',
          aliases: ['grill', 'griddle'],
          description: `A commercial flat-top grill, its surface seasoned by years of burgers and eggs and whatever else the J&M served. The grill is cold now, its burners off, but the accumulated seasoning remains—a layer of carbonized flavor that no amount of scraping would remove. The grill could cook again, if anyone turned it on.`,
        },
        {
          prototype: 'furniture',
          name: 'deep fryer',
          aliases: ['fryer'],
          description: `A commercial deep fryer, its baskets still lowered into oil that has long since congealed. The oil is solid now, a waxy mass that trapped whatever was last fried—probably french fries, based on the shapes visible in the grease. The fryer is a time capsule of one last order that was never served.`,
        },
        {
          prototype: 'describable',
          name: 'order tickets',
          aliases: ['tickets', 'orders'],
          description: `Order tickets still hang from the wheel, handwritten in the shorthand of line cooks everywhere. "BURG MR" means burger medium rare. "F&C" means fish and chips. "86 ONION" means they ran out of onions. The tickets are a record of the last service, orders that were placed and never fulfilled.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // UPPER FLOOR (z=1)
    // ═══════════════════════════════════════════════════════════════════

    '%STORAGE': {
      name: 'J&M Cafe - Storage',
      description: `The second floor serves as storage and office space, converted from whatever the building's original purpose was—hotel rooms, probably, like most of Pioneer Square's upper floors. The space is cluttered with bar supplies: cases of liquor, kegs, boxes of glasses, the inventory of an establishment that expected to stay open.

Old gambling equipment fills one corner—roulette wheels from when the cardroom offered more games, slot machines that were legal briefly in the 1930s and never removed. The equipment is museum-quality now, worth money to collectors who care about such things.

A narrow stairway continues up to the roof access, its steps worn by decades of feet.`,
      x: -15,
      y: 5,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%DINING',
        west: '%OFFICE',
        up: {
          description: 'A stairway leads up to the roof',
          to: '%ROOF_NE',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'liquor storage',
          aliases: ['cases', 'bottles', 'inventory'],
          description: `Cases of liquor stacked along the walls—whiskey, vodka, gin, the staples of bar service. The inventory was meant to last months. It will last forever now, the bottles sealed, their contents preserved by the same chemistry that makes alcohol last. The J&M is stocked for customers who won't arrive.`,
        },
        {
          prototype: 'furniture',
          name: 'vintage gambling equipment',
          aliases: ['roulette', 'slots', 'gambling'],
          description: `Antique gambling equipment clusters in one corner: a roulette wheel with a mahogany frame, slot machines from the 1930s when they were briefly legal in Seattle, card tables too worn for the downstairs room. The equipment is worth money to collectors—or was, when money meant something different. Now it's just furniture with history.`,
        },
      ],
    },

    '%OFFICE': {
      name: 'J&M Cafe - Office',
      description: `The manager's office is small and cluttered, barely room for a desk and a filing cabinet and the accumulated paperwork of running a bar for decades. The desk is buried under invoices, schedules, and licensing paperwork. A computer sits dark in one corner, its monitor dusty, its tower silent.

Photographs cover one wall: previous owners, longtime employees, celebrity visitors whose fame has faded. The J&M has been owned by the same family for three generations—their faces repeat in the photos, aging through decades of snapshots.

A small safe sits open in the corner, contents gone. Someone knew it was here and had the means to open it.`,
      x: -16,
      y: 5,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 15,
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
          description: `A wooden desk buried under paperwork: liquor orders, employee schedules, health inspection reports, the bureaucratic requirements of running a legal establishment. A family photo shows three generations of owners, their faces similar, their clothing dating them to different decades. The desk has seen all of them.`,
        },
        {
          prototype: 'describable',
          name: 'family photos',
          aliases: ['photos', 'pictures'],
          description: `Photographs documenting the J&M's ownership history: the founder in the 1890s, stern-faced in Victorian collar; his son in the 1940s, returning from the war; his grandson in the 1980s, looking more like a businessman than a barkeeper. The faces share a family resemblance across the decades. The bar connected them all.`,
        },
        {
          prototype: 'cabinet',
          name: 'empty safe',
          aliases: ['safe'],
          description: `A floor safe, its door hanging open, interior empty. The safe is old—mid-century construction, the kind that was genuinely secure before modern tools. Whatever it held—cash, probably, maybe documents—is gone. The safe remains, too heavy to move, too obsolete to secure anything.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2)
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_NE': {
      name: 'J&M Cafe - Roof (Northeast)',
      description: `The roof of the J&M offers views north toward Washington Street and the blocks where Pioneer Square transitions to downtown. The roofline is cluttered with the infrastructure of a building that's been adapted over a century: HVAC units from different decades, antenna mounts from different technologies, a satellite dish that someone installed for sports broadcasts.

A neon J&M CAFE sign lies flat on the roof, removed during some renovation and never reinstalled. The neon tubes are intact, their script letters still legible. The sign could work again, if anyone connected it to power.

From here you can see the neighborhood laid out like a map—the grid of streets, the brick facades, the accumulated history of Seattle's oldest district.`,
      x: -15,
      y: 5,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%STORAGE',
        south: '%ROOF_SE',
        west: '%ROOF_NW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'neon sign',
          aliases: ['sign', 'neon'],
          description: `A neon sign lies flat on the roof, its letters spelling J&M CAFE in flowing script. The sign was removed during some renovation and left here, too fragile to throw away, too heavy to carry downstairs. The neon tubes are intact, the transformers probably functional. The sign could glow again, advertising a cafe that no longer needs advertising.`,
        },
        {
          prototype: 'furniture',
          name: 'satellite dish',
          aliases: ['dish', 'satellite'],
          description: `A satellite dish bolted to a concrete pad, pointed at a sky that still contains satellites—whether they're still broadcasting is another question. The dish was installed for sports broadcasts, letting the bar show games that cable couldn't reach. The games have stopped. The dish keeps pointing.`,
        },
      ],
    },

    '%ROOF_SE': {
      name: 'J&M Cafe - Roof (Southeast)',
      description: `The southeast corner of the roof overlooks 1st Avenue, the street visible through gaps in the parapet. The view east shows the row of buildings that line the avenue, their brick facades catching whatever light the clouds allow through.

A rusted air conditioning unit squats in this corner, its compressor seized, its function ended. Ductwork snakes from the unit toward the interior, carrying nothing now but dust and stale air.

The parapet here is low enough to look over comfortably—or low enough to fall over if you're not careful. The sidewalk is two stories down, unforgiving concrete that doesn't care about intentions.`,
      x: -15,
      y: 4,
      z: 2,
      population: 0,
      ambientNoise: 12,
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
          name: 'rusted AC unit',
          aliases: ['ac', 'air conditioner', 'unit'],
          description: `An air conditioning unit in advanced stages of decay—housing rusted through, compressor seized, fan frozen in place. The unit cooled the bar below once, making summer drinking tolerable. Now it's just a rust sculpture, slowly returning to the iron ore from which it came.`,
        },
      ],
    },

    '%ROOF_NW': {
      name: 'J&M Cafe - Roof (Northwest)',
      description: `The northwest corner of the roof is the quietest, sheltered from street noise by the building's own mass. A collection of lawn chairs suggests someone used this space for breaks—employees escaping the kitchen heat, perhaps, or the owner taking a moment away from customers.

The chairs are weathered but intact, their webbing faded from colors that were bright once. A milk crate serves as a side table, its surface stained with the rings of beverage containers long since removed.

The view is limited—taller buildings block the sightlines—but the sky is visible, which is sometimes enough.`,
      x: -16,
      y: 5,
      z: 2,
      population: 0,
      ambientNoise: 10,
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
          capacity: 3,
          emptyMsg:
            'Weathered lawn chairs cluster in this corner, arranged for conversation or solitude.',
          occupiedMsg: '%s relaxing in the lawn chairs',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'milk crate table',
          aliases: ['crate', 'table'],
          description: `A plastic milk crate turned upside-down to serve as a side table, its surface stained by the condensation of many drinks. The crate is sun-faded, its original color uncertain—could have been red, could have been blue. Now it's the grey of plastic that's given up.`,
        },
      ],
    },

    '%ROOF_SW': {
      name: 'J&M Cafe - Roof (Southwest)',
      description: `The southwest corner of the roof offers a view toward the waterfront, though the view is partial—slices of Elliott Bay visible between taller buildings, grey water under grey sky. A fire escape descends from here, iron stairs leading to the alley below.

Someone has spray-painted a mural on the parapet—a playing card, the ace of spades, rendered in black and silver with unusual skill. The mural references the cardroom below, though whether it's advertising or warning is unclear.

The fire escape is rusted but sound, the iron construction of an era when things were built to last. The final ladder is latched in the raised position, requiring release from above.`,
      x: -16,
      y: 4,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NW',
        east: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'fire escape',
          aliases: ['escape', 'stairs', 'ladder'],
          description: `An iron fire escape descending to the alley, its structure rusted but stable. The stairs switchback down two stories, ending in a drop-down ladder that's currently latched in the raised position. The ironwork is old—Victorian era, probably—built before anyone thought to cut corners on safety equipment.`,
        },
        {
          prototype: 'describable',
          name: 'ace mural',
          aliases: ['mural', 'graffiti', 'ace'],
          description: `A spray-painted mural covers part of the parapet: an ace of spades, rendered in black and silver with considerable skill. The card is oversized, stylized, the spade symbol detailed with abstract patterns. The mural references the cardroom below—a memorial, maybe, or just art in a place where someone could make art.`,
        },
      ],
    },
  },
};
