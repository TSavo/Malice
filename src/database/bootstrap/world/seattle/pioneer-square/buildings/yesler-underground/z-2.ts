// Yesler Underground - Level z=-2 (Northern Historic Basements)
// Beneath Yesler Way (y=+6 to y=+12)
// Prohibition-era speakeasies, historic basements, and hidden passages

export const building = {
  name: 'Yesler Underground',
  x: -14,
  y: 12,
  width: 29,
  height: 14,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // YESLER WAY MAIN CORRIDOR (y=+12, beneath the street)
    // ═══════════════════════════════════════════════════════════════════════

    '%YESLER_WEST': {
      name: 'Yesler Way Underground West',
      description: `The passage runs beneath Yesler Way at its western extent, where the historic street meets the waterfront. The construction here shows the marks of the street-raising era—brick walls that once fronted businesses, now buried beneath the modern street level.

The air is damp with proximity to the bay, salt seeping in through routes that connect to the waterfront underground. The passage serves as a junction between the northern network and the coastal tunnels, a crossroads beneath the crossroads.`,
      x: -14,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 12,
      outdoor: false,
      exits: {
        south: '%YESLER_JUNCTION_W',
        east: '%YESLER_MID_W',
        west: {
          to: 'buildings/waterfront-underground/z-2.ts',
          room: '%FIRST_AVE_CONN',
          description: 'A damp passage leads toward the waterfront',
        },
      },
    },

    '%YESLER_MID_W': {
      name: 'Yesler Way Underground',
      description: `The passage continues east beneath Yesler Way, the construction showing the layered history of Seattle's development. Victorian storefronts still line the walls—their display windows dark, their doors sealed, the businesses they once housed forgotten. The ghostly retail arcade runs for blocks beneath the modern street.`,
      x: -7,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_WEST',
        east: '%YESLER_MAIN',
        south: '%OCCIDENTAL_YESLER',
      },
    },

    '%YESLER_MAIN': {
      name: 'Yesler Way Underground',
      description: `The passage reaches the center of the Yesler Way underground, where the buried street was widest and most commercial. The space is larger here, the ceiling higher, the construction more elaborate—evidence of the prosperity that once characterized this intersection.

A shaft rises toward the surface, its upper end emerging through a grating that appears unremarkable from above but provides access to those who know its location.`,
      x: 0,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 22,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%YESLER_MID_W',
        east: '%YESLER_MID_E',
        south: '%SECOND_YESLER',
        up: {
          to: 'yesler-way/x0.ts',
          description: 'A shaft rises toward Yesler Way',
          hidden: true,
        },
      },
    },

    '%YESLER_MID_E': {
      name: 'Yesler Way Underground',
      description: `The passage continues east through the buried commercial district, the storefronts giving way to more utilitarian construction as the route approaches the eastern hill. The transition marks the boundary between the commercial core and the residential areas that once climbed the slope.`,
      x: 7,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_MAIN',
        east: '%YESLER_EAST',
        south: '%THIRD_YESLER',
      },
    },

    '%YESLER_EAST': {
      name: 'Yesler Way Underground East',
      description: `The passage reaches its eastern extent, where the buried street meets the hill's slope. The construction ends here—the hill rising too steeply for the street-raising technique that created the underground elsewhere. Beyond this point, the network continues only through excavated passages that were carved later.`,
      x: 14,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%YESLER_MID_E',
        south: '%FOURTH_YESLER',
        down: '%DEEP_EAST_ACCESS',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NORTH-SOUTH CONNECTORS (linking Yesler to the main network)
    // ═══════════════════════════════════════════════════════════════════════

    '%YESLER_JUNCTION_W': {
      name: 'Western Yesler Junction',
      description: `The passage reaches a junction where the Yesler Way underground meets the routes running north from the main network. The junction shows the marks of multiple construction eras—the original street-raising joined by later excavation, the passages meeting in a space that was never planned but has become essential.`,
      x: -14,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%YESLER_WEST',
        south: '%FIRST_AVE_N',
        east: '%PROHIBITION_HALL',
      },
    },

    '%FIRST_AVE_N': {
      name: 'First Avenue North',
      description: `The passage runs south toward the main underground network, following the route beneath First Avenue. The construction is consistent with the established network—the same Victorian brick, the same iron fixtures, the same architecture of buried commerce.`,
      x: -14,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%YESLER_JUNCTION_W',
        south: '%FIRST_AVE_MID',
      },
    },

    '%FIRST_AVE_MID': {
      name: 'First Avenue Passage',
      description: `The passage continues toward the junction with the main network, the route showing increased traffic wear as it approaches the established corridors. The walls bear the chalk marks of the underground's residents, the territorial symbols of groups that claim these passages.`,
      x: -14,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 3,
      outdoor: false,
      exits: {
        north: '%FIRST_AVE_N',
        south: {
          to: 'underground/upper-tunnels/the-junction.ts',
          description: 'A passage leads south toward The Junction',
        },
        east: '%SPEAKEASY_HALL',
      },
    },

    '%OCCIDENTAL_YESLER': {
      name: 'Occidental-Yesler Junction',
      description: `The passage reaches the junction where the Yesler Way underground meets the Occidental corridor, the intersection of two major routes through the hidden city. The space is larger here, cleared and maintained by traffic that flows in multiple directions.

The walls show the accumulated markings of decades—territorial claims overlapping, directions scratched and re-scratched, the visual record of a community that communicates in code.`,
      x: -7,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 20,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%YESLER_MID_W',
        south: '%OCC_NORTH_EXT',
        east: '%BASEMENT_ROW',
        west: '%PROHIBITION_HALL',
      },
      objects: [
        { prototype: 'sign', name: 'layered graffiti', description: 'Decades of graffiti cover one wall: "HOBOS WELCOME 1932", "ARMY OF THE UNEMPLOYED", "WE WERE HERE BEFORE THE WAR", and newer: "still here - 2019".', boltedDown: true },
        { prototype: 'sign', name: 'a direction marker', description: 'Chalk arrows point in multiple directions with cryptic labels: "WATER ←", "HEAT ↑", "TROUBLE →", "OUT ↓".', boltedDown: true },
      ],
    },

    '%OCC_NORTH_EXT': {
      name: 'Occidental North Extension',
      description: `The passage extends south from the Yesler junction, connecting the northern underground to the established Occidental corridor. The construction is consistent—the same Victorian brick, the same architectural patterns—evidence that this route was part of the original street-raising.`,
      x: -7,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%OCCIDENTAL_YESLER',
        south: '%OCC_NORTH_MID',
        west: '%SPEAKEASY_HALL',
      },
    },

    '%OCC_NORTH_MID': {
      name: 'Occidental Passage',
      description: `The passage continues through the northern Occidental underground, the route approaching the connection with the main network. The construction shows the transition from the Yesler area to the central underground—newer modifications overlaying older work.`,
      x: -7,
      y: 7,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 3,
      outdoor: false,
      exits: {
        north: '%OCC_NORTH_EXT',
        south: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%OCC_JUNCTION',
          description: 'A passage leads south toward the Northern Junction',
        },
      },
    },

    '%SECOND_YESLER': {
      name: 'Second Avenue-Yesler Junction',
      description: `The passage reaches the junction where the Yesler Way underground meets the routes beneath Second Avenue. The intersection is a natural gathering point, the space cleared and maintained despite the lack of official attention.`,
      x: 0,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 20,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%YESLER_MAIN',
        south: '%SECOND_NORTH',
        east: '%HOTEL_BASEMENT',
        west: '%BASEMENT_ROW',
      },
    },

    '%SECOND_NORTH': {
      name: 'Second Avenue North',
      description: `The passage runs south from the Yesler junction, connecting the northern underground to the established Second Avenue corridor. The route shows the marks of regular traffic—the floor worn smooth, the walls polished at shoulder height.`,
      x: 0,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%SECOND_YESLER',
        south: '%SECOND_NORTH_MID',
        east: '%BOARDING_BASEMENT',
      },
    },

    '%SECOND_NORTH_MID': {
      name: 'Second Avenue Passage',
      description: `The passage continues toward the main network, the construction showing the consistency of the street-raising era. The buried storefronts still line the walls, their windows dark, their purpose forgotten but their structure intact.`,
      x: 0,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 20,
      waterLevel: 3,
      outdoor: false,
      exits: {
        north: '%SECOND_NORTH',
        south: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%2ND_JUNCTION',
          description: 'A passage leads south toward the Warehouse Junction',
        },
      },
    },

    '%THIRD_YESLER': {
      name: 'Third Avenue-Yesler Junction',
      description: `The passage reaches the junction where the Yesler Way underground meets the routes beneath Third Avenue. The construction here is different—twentieth century rather than nineteenth, the infrastructure added during later development rather than inherited from the street-raising.`,
      x: 7,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%YESLER_MID_E',
        south: '%THIRD_NORTH',
        west: '%HOTEL_BASEMENT',
      },
    },

    '%THIRD_NORTH': {
      name: 'Third Avenue North',
      description: `The passage runs south from the Yesler junction, connecting the northern underground to the eastern network. The route is less established than the western corridors—newer construction, less traffic, fewer territorial markers.`,
      x: 7,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%THIRD_YESLER',
        south: '%THIRD_NORTH_MID',
      },
    },

    '%THIRD_NORTH_MID': {
      name: 'Third Avenue Passage',
      description: `The passage continues toward the eastern network, the route descending slightly as it approaches the connection with the established tunnels. The construction shows the marks of different hands—excavation overlaying foundation, the route assembled from available spaces.`,
      x: 7,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%THIRD_NORTH',
        south: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%3RD_BASEMENT',
          description: 'A passage leads south toward Third Avenue',
        },
      },
    },

    '%FOURTH_YESLER': {
      name: 'Fourth Avenue-Yesler Junction',
      description: `The passage reaches the eastern extent of the accessible Yesler Way underground, where the buried street meets the utility infrastructure beneath Fourth Avenue. The junction connects the historic underground to the modern utility network, different eras of construction meeting in the darkness.`,
      x: 14,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%YESLER_EAST',
        south: '%FOURTH_NORTH',
        west: '%EASTERN_BASEMENTS',
      },
    },

    '%FOURTH_NORTH': {
      name: 'Fourth Avenue North',
      description: `The passage runs south from the Yesler junction, following the utility infrastructure beneath Fourth Avenue. The construction is modern—concrete and steel rather than brick and timber—the systems installed during urban development that never knew about the historic network nearby.`,
      x: 14,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 22,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%FOURTH_YESLER',
        south: {
          to: 'buildings/eastside-underground/z-2.ts',
          room: '%JUNCTION_BOX',
          description: 'A passage leads south toward the junction box chamber',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // HISTORIC BASEMENTS (Prohibition-era speakeasies and hidden spaces)
    // ═══════════════════════════════════════════════════════════════════════

    '%PROHIBITION_HALL': {
      name: 'Prohibition Hall',
      description: `The passage opens into a space that was once a speakeasy—the architecture of illegal alcohol still visible in the layout of the room. A long bar dominates one wall, its surface worn smooth by a century of elbows and glasses. Behind the bar, shelving that once held bottles now holds nothing but dust and shadow.

The speakeasy operated during Prohibition, serving customers who descended from Yesler Way through hidden stairs that have since been sealed. The business died when alcohol became legal again, but the space remained, repurposed by generations of underground residents who found value in a room designed for concealment.`,
      x: -10,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%YESLER_JUNCTION_W',
        east: '%OCCIDENTAL_YESLER',
        south: '%SPEAKEASY_BACK',
        northeast: {
          to: 'buildings/smith-tower/z-2.ts',
          room: '%DC_TUNNEL',
          description: 'A narrow tunnel leads toward the Smith Tower basement',
        },
      },
      objects: [
        { prototype: 'furniture', name: 'the old bar', description: 'A long mahogany bar stretches along the wall, its brass rail tarnished green. A century of elbows have worn grooves in the wood. Behind it, empty shelves wait for bottles that will never return.', boltedDown: true },
        { prototype: 'sign', name: 'a painted menu board', description: 'A slate board on the wall still shows prices in chalk: "BEER 5¢ - WHISKEY 10¢ - CHAMPAGNE 50¢". Below, someone added "DON\'T ASK QUESTIONS".', boltedDown: true },
        { prototype: 'bench', name: 'a booth bench', description: 'A curved wooden bench from a booth, its leather upholstery cracked and split. The high back offered privacy for conversations that couldn\'t be overheard.', boltedDown: true },
      ],
    },

    '%SPEAKEASY_BACK': {
      name: 'Speakeasy Back Room',
      description: `The passage leads into the speakeasy's back room—a smaller space designed for private parties and discreet transactions. The room is intimate, the ceiling lower, the atmosphere suggesting secrets shared among trusted friends.

A hidden door in the back wall opens onto a passage that was used to evacuate customers during raids. The raids ended a century ago. The passage remains.`,
      x: -10,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PROHIBITION_HALL',
        east: '%SPEAKEASY_HALL',
        down: '%BOOTLEG_CELLAR',
      },
      objects: [
        { prototype: 'desk', name: 'a poker table', description: 'A round felt-topped table, the green baize stained with old spills and cigarette burns. Chips and cards are long gone, but the indentations where elbows rested remain.', boltedDown: true },
        { prototype: 'sign', name: 'a framed photo', description: 'A sepia photograph in a tarnished frame shows men in suits raising glasses. Someone has scratched out all the faces.', boltedDown: true },
      ],
    },

    '%SPEAKEASY_HALL': {
      name: 'Speakeasy Corridor',
      description: `The passage runs through what was once the speakeasy's service corridor—the route used by staff to move supplies and by customers to reach private rooms. The corridor connects multiple spaces that were once part of a single entertainment complex, now fragmented and repurposed.`,
      x: -10,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%SPEAKEASY_BACK',
        east: '%FIRST_AVE_MID',
        west: '%GAMBLING_DEN',
      },
    },

    '%GAMBLING_DEN': {
      name: 'Old Gambling Den',
      description: `The passage opens into a room that was once a gambling den—the layout suggesting card tables and roulette wheels, the walls showing the marks where paintings once hung to give the space an air of sophistication. The gambling equipment is long gone, but the room retains the geometry of risk and reward.

The den operated alongside the speakeasy, offering customers a chance to lose their money after they'd spent it on illegal drinks. The synergy of vices made this corner of the underground particularly profitable—and particularly targeted by periodic crackdowns.`,
      x: -14,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%SPEAKEASY_HALL',
        down: '%GAMBLING_VAULT',
      },
      objects: [
        { prototype: 'furniture', name: 'a roulette wheel base', description: 'The base of a roulette wheel remains bolted to the floor, though the wheel itself is long gone. Faded numbers are painted on the surrounding floor.', boltedDown: true },
        { prototype: 'desk', name: 'a card dealer\'s table', description: 'A curved blackjack table, its padded rail worn smooth by thousands of nervous hands. The green felt shows outlines where cards were dealt.', boltedDown: true },
        { prototype: 'sign', name: 'a painted wall slogan', description: 'Faded paint on the wall reads: "LADY LUCK LOVES THE BOLD". Below it, someone scratched: "Lady Luck is a liar."', boltedDown: true },
        { prototype: 'safe', name: 'an empty wall safe', description: 'A safe door hangs open in the wall, its interior empty. The lock mechanism has been removed—someone took their time getting in.', boltedDown: true },
      ],
    },

    '%BASEMENT_ROW': {
      name: 'Basement Row',
      description: `The passage runs through a series of connected basements that once served the businesses along Yesler Way. The basements were designed for storage, their dimensions practical rather than elegant, their construction sturdy rather than stylish. Now they serve as infrastructure for the underground network, connecting routes rather than storing goods.`,
      x: -3,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%OCCIDENTAL_YESLER',
        east: '%SECOND_YESLER',
        south: '%BASEMENT_SOUTH',
      },
    },

    '%BASEMENT_SOUTH': {
      name: 'Basement Passage',
      description: `The passage continues through the basement network, the construction showing the transition from commercial storage to abandoned infrastructure. The basements here are empty, their contents long since removed or decayed, the spaces serving only as routes between more significant locations.`,
      x: -3,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%BASEMENT_ROW',
        east: '%BOARDING_BASEMENT',
      },
    },

    '%HOTEL_BASEMENT': {
      name: 'Old Hotel Basement',
      description: `The passage opens into the basement of what was once a hotel—the dimensions larger, the construction more elaborate, the space designed to serve an establishment rather than a single business. The hotel is long gone, demolished or renovated beyond recognition, but its basement remains as infrastructure for the network.

Storage rooms branch off the main space, their doors hanging open on rusted hinges. The rooms once held linens and supplies. Now they hold whatever the underground's residents choose to store in them.`,
      x: 4,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%SECOND_YESLER',
        east: '%THIRD_YESLER',
        south: '%LAUNDRY_ROOM',
      },
      objects: [
        { prototype: 'cabinet', name: 'a linen closet', description: 'A built-in closet with shelves still lined with yellowed paper. A few moth-eaten towels remain, their hotel monogram barely visible: "P.S.H."', boltedDown: true },
        { prototype: 'sign', name: 'a room service menu', description: 'A framed menu offers "OYSTERS 25¢ - STEAK 40¢ - ROOM SERVICE AVAILABLE 24 HOURS". The Pioneer Square Hotel has been gone for decades.', boltedDown: true },
      ],
    },

    '%LAUNDRY_ROOM': {
      name: 'Old Laundry Room',
      description: `The passage opens into what was once the hotel's laundry room—the space still showing the marks of the equipment that once filled it. Iron brackets in the walls once supported mangles and presses; floor drains once carried away the water from washing and rinsing. The equipment is gone. The architecture of labor remains.`,
      x: 4,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%HOTEL_BASEMENT',
        west: '%BOARDING_BASEMENT',
      },
      objects: [
        { prototype: 'furniture', name: 'a mangle frame', description: 'The iron frame of an industrial mangle is bolted to the floor, its rollers and gears long removed. The wall behind it is stained dark from decades of steam.', boltedDown: true },
        { prototype: 'bench', name: 'a folding table base', description: 'A heavy wooden table base where laundry was sorted and folded. The iron legs are rusted but solid.', boltedDown: true },
      ],
    },

    '%BOARDING_BASEMENT': {
      name: 'Boarding House Basement',
      description: `The passage opens into the basement of what was once a boarding house—a space designed for storage and utilities rather than habitation. The basement is smaller than the hotel's, the construction simpler, the purpose more modest. But the space serves the network, connecting routes and providing shelter.`,
      x: 2,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%SECOND_NORTH',
        east: '%LAUNDRY_ROOM',
        west: '%BASEMENT_SOUTH',
      },
    },

    '%EASTERN_BASEMENTS': {
      name: 'Eastern Basements',
      description: `The passage runs through basements that served buildings along the eastern slope—the construction showing the challenges of building on the hill. The floors are not quite level, the walls not quite vertical, the geometry of construction adapting to the slope rather than fighting it.`,
      x: 10,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: '%FOURTH_YESLER',
        south: '%SLOPE_PASSAGE',
      },
    },

    '%SLOPE_PASSAGE': {
      name: 'Slope Passage',
      description: `The passage descends through the eastern slope, following the terrain beneath buildings that climbed the hill. The construction is rough—excavated rather than inherited—the route carved by those who needed access to the network from the eastern neighborhoods.`,
      x: 10,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%EASTERN_BASEMENTS',
        south: {
          to: 'buildings/eastside-underground/z-2.ts',
          room: '%YESLER_EAST',
          description: 'A passage leads south toward the eastern Yesler access',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP SECTIONS (z=-3 connections)
    // ═══════════════════════════════════════════════════════════════════════

    '%BOOTLEG_CELLAR': {
      name: 'Bootleg Cellar',
      description: `The shaft descends into a cellar that was built to store bootleg liquor during Prohibition—a hidden space beneath the hidden speakeasy, twice removed from the legal world above. The cellar is cool and dry, the construction showing the care that valuable inventory demanded.

The liquor is long gone, but the cellar remains as a connection to the deeper network—a route that links the Prohibition-era underground to passages that existed before and after the great experiment in temperance.`,
      x: -10,
      y: 8,
      z: -3,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        up: '%SPEAKEASY_BACK',
        south: '%DEEP_YESLER_W',
      },
      objects: [
        { prototype: 'crate', name: 'an empty bottle rack', description: 'A wooden rack designed to hold whiskey bottles lies empty against the wall. The wood is stained dark from decades of spilled liquor.', boltedDown: true },
        { prototype: 'sign', name: 'a painted warning', description: 'Red paint on the wall reads: "IF BELL RINGS, HIDE EVERYTHING". The bell mechanism is gone, but the warning remains.', boltedDown: true },
        { prototype: 'trunk', name: 'a bootlegger\'s trunk', description: 'A large steamer trunk with false bottom compartments, designed to smuggle bottles past inspectors. The secret latches still work.', boltedDown: true },
      ],
    },

    '%GAMBLING_VAULT': {
      name: 'Gambling Vault',
      description: `The shaft descends into what was once the gambling den's vault—a reinforced space built to store the operation's cash and valuables. The vault door stands open, its mechanism long since defeated by time or force. Whatever the vault once protected has been removed. The space remains.`,
      x: -14,
      y: 6,
      z: -3,
      population: 0,
      ambientNoise: 3,
      lighting: 5,
      waterLevel: 8,
      outdoor: false,
      exits: {
        up: '%GAMBLING_DEN',
        east: '%DEEP_YESLER_W',
      },
      objects: [
        { prototype: 'safe', name: 'a cracked vault', description: 'A massive Mosler safe stands in the corner, its door blown off by an ancient explosion. Scorch marks blacken the walls around it.', boltedDown: true },
        { prototype: 'sign', name: 'a ledger page', description: 'A yellowed page nailed to the wall shows columns of numbers and initials—bets placed, debts owed. The last entry is dated October 1929.', boltedDown: true },
      ],
    },

    '%DEEP_YESLER_W': {
      name: 'Deep Yesler Passage',
      description: `The passage runs through the deep level beneath the Yesler Way underground, connecting the Prohibition-era spaces to the established deep network. The construction is rough—excavated rather than inherited—the route carved by hands that valued access over aesthetics.`,
      x: -10,
      y: 6,
      z: -3,
      population: 0,
      ambientNoise: 10,
      lighting: 8,
      waterLevel: 12,
      outdoor: false,
      exits: {
        north: '%BOOTLEG_CELLAR',
        west: '%GAMBLING_VAULT',
        east: '%DEEP_YESLER_MID',
        south: {
          to: 'underground/transitional/junction-shaft.ts',
          description: 'A passage leads south toward the Junction Shaft',
        },
      },
    },

    '%DEEP_YESLER_MID': {
      name: 'Deep Yesler Passage',
      description: `The passage continues through the deep Yesler network, the route showing less traffic than the surface corridors. The deep level serves as bypass and storage, used by those who value discretion over convenience.`,
      x: 0,
      y: 6,
      z: -3,
      population: 0,
      ambientNoise: 8,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%DEEP_YESLER_W',
        east: '%DEEP_YESLER_E',
        south: {
          to: 'buildings/underground-east/z-3.ts',
          room: '%CABLE_VAULT',
          description: 'A passage leads south toward the Cable Vault',
        },
      },
    },

    '%DEEP_YESLER_E': {
      name: 'Deep Yesler Passage',
      description: `The passage reaches the eastern extent of the deep Yesler network, connecting to the routes beneath the hill. The construction shows the challenges of excavating through the slope—the walls reinforced against soil pressure, the floor following the natural grade.`,
      x: 10,
      y: 6,
      z: -3,
      population: 0,
      ambientNoise: 10,
      lighting: 8,
      waterLevel: 15,
      outdoor: false,
      exits: {
        west: '%DEEP_YESLER_MID',
        south: '%DEEP_EAST_ACCESS',
      },
    },

    '%DEEP_EAST_ACCESS': {
      name: 'Deep Eastern Access',
      description: `The passage connects the deep Yesler network to the eastern underground, a route that links the historic tunnels to the modern utility infrastructure. The transition is marked by changing construction—Victorian excavation giving way to twentieth century engineering.`,
      x: 14,
      y: 8,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 10,
      waterLevel: 10,
      outdoor: false,
      exits: {
        up: '%YESLER_EAST',
        north: '%DEEP_YESLER_E',
        south: {
          to: 'buildings/eastside-underground/z-3.ts',
          room: '%DEEP_EAST_N',
          description: 'A passage leads south toward the deep eastern network',
        },
      },
    },
  },
};
