// Southeast Underground - Level z=-2
// Utility tunnels and basements beneath 4th Avenue S and S. Jackson intersection
// Connects Chinatown to eastside steam tunnels

export const building = {
  name: 'Southeast Underground',
  x: 14,
  y: -3,
  width: 8,
  height: 9,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // MAIN EAST-WEST CORRIDOR (y=-6, beneath S. Jackson St)
    // ═══════════════════════════════════════════════════════════════════════

    '%JACKSON_EXTENSION': {
      name: 'Jackson Street Extension',
      description: `The concrete wall that sealed the Chinatown underground has been breached—a rough opening cut through decades after "PROGRESS" was scratched into the wet cement. Beyond the breach, a utility corridor extends east, newer construction from the 1970s urban renewal that buried the old Chinatown under parking garages and civic projects.

The passage shows the marks of different builders. The original Chinese tunneling to the west, Victorian brick where it met the greater underground, and here: poured concrete, prefab conduit, the utilitarian architecture of municipal infrastructure. The city built this corridor for cable and pipe. Others found uses the city never intended.`,
      x: 8,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/chinatown-underground/z-2.ts',
          room: '%JACKSON_EAST',
          description: 'A rough opening leads west into the Chinatown underground',
        },
        east: '%UTILITY_JUNCTION',
        north: '%PARKING_BASEMENT',
      },
      objects: [
        { prototype: 'sign', name: 'the breach', description: 'The edges of the concrete breach are rough, cut with power tools rather than demolished. Someone wanted through but didn\'t want it to look easy.', boltedDown: true },
        { prototype: 'sign', name: 'utility markings', description: 'Spray-painted codes mark the walls: "T&T 1978", "WATER MAIN 12"", "DO NOT DIG".', boltedDown: true },
      ],
    },

    '%UTILITY_JUNCTION': {
      name: 'Utility Junction',
      description: `The corridor opens into a junction chamber where multiple utility runs converge. Massive pipes run overhead—water mains, storm drainage, the infrastructure that keeps a city functioning. Cable trays line the walls, some still carrying active fiber. The junction was built for maintenance access, sized for workers and equipment.

The space has been repurposed. Someone cleared a corner, installed a few amenities, created a waystation in the municipal labyrinth. The city workers who come here for maintenance don't ask questions about the evidence of other visitors.`,
      x: 10,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 22,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%JACKSON_EXTENSION',
        east: '%LIGHT_RAIL_PASSAGE',
        north: '%BANK_VAULT',
        south: '%DRAINAGE_ACCESS',
      },
      objects: [
        { prototype: 'bench', name: 'a maintenance bench', description: 'A folding bench someone left here, positioned against the wall out of the way of official traffic.', boltedDown: true },
        { prototype: 'cabinet', name: 'a junction box', description: 'A large metal box with warning labels and a padlock. Inside, cables split and route to different destinations.', boltedDown: true },
        { prototype: 'sign', name: 'a safety poster', description: 'A faded OSHA poster warns about confined space hazards. Someone has drawn a smiley face on the cartoon worker.', boltedDown: true },
      ],
    },

    '%LIGHT_RAIL_PASSAGE': {
      name: 'Light Rail Service Tunnel',
      description: `The corridor runs alongside the foundations of the light rail station above—the underground infrastructure that supported trains before they stopped running. The construction is modern, clean, the walls poured concrete with embedded conduit runs. Emergency lights at intervals still function, powered by systems that outlasted the transit authority.

The passage connects to the elevated station through maintenance shafts, but those are sealed now. The trains don't run. The maintenance isn't performed. Only the tunnel remains, repurposed by those who find uses for forgotten infrastructure.`,
      x: 12,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%UTILITY_JUNCTION',
        east: '%STATION_BASEMENT',
        north: '%STEAM_CONNECTOR',
      },
      objects: [
        { prototype: 'sign', name: 'a transit authority sign', description: 'A metal sign reads: "CENTRAL LINK - SERVICE ACCESS B7 - AUTHORIZED PERSONNEL ONLY". The authority no longer exists.', boltedDown: true },
        { prototype: 'furniture', name: 'emergency equipment cabinet', description: 'A wall-mounted cabinet contains fire extinguishers, flashlights, and first aid supplies—still stocked, never used.', boltedDown: true },
      ],
    },

    '%STATION_BASEMENT': {
      name: 'Station Utility Basement',
      description: `The passage opens into the utility basement of what was the International District light rail station. The space is vast—electrical rooms, ventilation equipment, pump stations, all the machinery needed to run a transit hub. Most of it is dormant now, but some systems still hum, powered by connections that were never severed.

The escalators that once carried passengers down are frozen overhead, their steps locked in place. The platforms are dark. The trains don't come. But the basement remains, and the connections it offers to the surrounding underground are still functional.`,
      x: 14,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 28,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LIGHT_RAIL_PASSAGE',
        north: '%4TH_AVE_TUNNEL',
      },
      objects: [
        { prototype: 'cabinet', name: 'an electrical panel', description: 'A massive electrical distribution panel with rows of breakers. Some switches are labeled, others marked only with numbers.', boltedDown: true },
        { prototype: 'furniture', name: 'ventilation machinery', description: 'Large ventilation fans sit dormant, their blades covered in dust. The air moves through other means now.', boltedDown: true },
        { prototype: 'sign', name: 'a station map', description: 'A faded map shows the station layout—platforms, exits, emergency routes. The "YOU ARE HERE" marker points to this basement.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NORTH-SOUTH CONNECTORS
    // ═══════════════════════════════════════════════════════════════════════

    '%4TH_AVE_TUNNEL': {
      name: '4th Avenue Utility Tunnel',
      description: `The passage runs north along Fourth Avenue, a utility corridor that connects the station basement to the broader underground network. The construction is consistent with the transit infrastructure—poured concrete, embedded conduit, the engineering of the late twentieth century.

The tunnel shows evidence of regular traffic. The floor is worn smooth in a path that follows the eastern wall. Someone uses this route often. The destination is not apparent from here.`,
      x: 14,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STATION_BASEMENT',
        north: '%4TH_JUNCTION',
      },
    },

    '%4TH_JUNCTION': {
      name: '4th Avenue Junction',
      description: `The passage reaches a junction where the transit corridor meets older infrastructure—Victorian-era basement construction intersecting with twentieth-century utility work. The junction shows the layered history of the underground: hand-laid brick beneath poured concrete beneath cable runs installed in the digital age.

A passage extends west toward the established eastside underground. Another continues north toward the main network.`,
      x: 14,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%4TH_AVE_TUNNEL',
        north: {
          to: 'buildings/eastside-underground/z-2.ts',
          room: '%4TH_S3',
          description: 'A passage leads north toward the eastside tunnels',
        },
        west: '%STEAM_CONNECTOR',
      },
    },

    '%STEAM_CONNECTOR': {
      name: 'Steam Tunnel Connection',
      description: `The passage runs between the transit infrastructure and the older steam distribution network, connecting systems built decades apart. The temperature rises noticeably here—residual heat from the steam pipes that still carry warmth to buildings above.

The walls show condensation where hot pipes meet cold concrete. The moisture creates an environment where rust never sleeps and maintenance is constant warfare against entropy.`,
      x: 12,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 28,
      lighting: 18,
      waterLevel: 8,
      outdoor: false,
      exits: {
        east: '%4TH_JUNCTION',
        south: '%LIGHT_RAIL_PASSAGE',
        west: '%BANK_VAULT',
        north: {
          to: 'buildings/eastside-underground/z-2.ts',
          room: '%STEAM_S4',
          description: 'A passage leads north toward the steam tunnels',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SPECIAL LOCATIONS
    // ═══════════════════════════════════════════════════════════════════════

    '%PARKING_BASEMENT': {
      name: 'Parking Garage Basement',
      description: `The passage opens into the lowest level of a parking structure that was built during urban renewal—one of the massive concrete boxes that replaced the historic Chinatown above. The parking levels are empty now, cars long since abandoned or removed, but the basement level connects to infrastructure that extends beyond the building's footprint.

The space is vast, the ceiling low, the columns marching in rows toward darkness. The floor shows oil stains from decades of vehicles. The air smells of exhaust that has seeped into the concrete and will never fully disperse.`,
      x: 8,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%JACKSON_EXTENSION',
        east: '%BANK_VAULT',
        north: '%ELEVATOR_PIT',
      },
      objects: [
        { prototype: 'sign', name: 'a parking level sign', description: 'A faded sign reads: "LEVEL P3 - COMPACT CARS ONLY - MONTHLY PERMIT REQUIRED". The permit system is moot.', boltedDown: true },
        { prototype: 'furniture', name: 'a ticket booth', description: 'An abandoned parking attendant booth, its window smashed, its cash drawer empty. A newspaper from 2019 sits on the counter.', boltedDown: true },
      ],
    },

    '%BANK_VAULT': {
      name: 'Abandoned Bank Vault',
      description: `The passage opens into what was once the basement vault of a bank that didn't survive the consolidation of the financial industry. The vault door stands open, its combination lock mechanism defeated by time rather than thieves. Inside: nothing but dust and the smell of old paper.

The vault construction is impressive—thick concrete, steel reinforcement, the architecture of security applied with industrial determination. Whatever the bank protected has been removed. The protection remains, purposeless but enduring.`,
      x: 10,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PARKING_BASEMENT',
        south: '%UTILITY_JUNCTION',
        east: '%STEAM_CONNECTOR',
      },
      objects: [
        { prototype: 'safe', name: 'the vault door', description: 'A massive circular vault door, eighteen inches of steel and concrete, stands permanently open. The combination mechanism is fused with age.', boltedDown: true },
        { prototype: 'cabinet', name: 'a safe deposit wall', description: 'A wall of safe deposit boxes, all open, all empty. The keys are long lost.', boltedDown: true },
        { prototype: 'desk', name: 'a counting table', description: 'A heavy table where money was once counted and bundled. The surface is worn smooth by handling.', boltedDown: true },
      ],
    },

    '%ELEVATOR_PIT': {
      name: 'Elevator Pit',
      description: `The passage ends at the bottom of an elevator shaft—the pit where counterweights descended while cars rose. The elevator mechanism is frozen, the cables slack, the car lodged somewhere above in perpetual limbo. Water has collected in the pit, creating a shallow pool that reflects the dim emergency lighting.

Access panels on the walls suggest routes into the building above, but the panels are rusted shut. The vertical connection is blocked. Only the horizontal passages remain accessible.`,
      x: 8,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 5,
      waterLevel: 20,
      outdoor: false,
      exits: {
        south: '%PARKING_BASEMENT',
        east: '%FOUNDATION_CRAWL',
      },
      objects: [
        { prototype: 'furniture', name: 'elevator mechanism', description: 'The bottom of an elevator shaft—hydraulic pistons, guide rails, a shallow pool of water. The cables hang slack above.', boltedDown: true },
        { prototype: 'sign', name: 'a maintenance tag', description: 'A metal tag wired to the mechanism: "INSPECTION DUE 06/2019 - PACIFIC ELEVATOR SERVICE". The inspection never happened.', boltedDown: true },
      ],
    },

    '%FOUNDATION_CRAWL': {
      name: 'Foundation Crawlspace',
      description: `The passage narrows to a crawlspace between building foundations—a route that was never meant for regular traffic but has been used by those small or desperate enough to navigate it. The ceiling is low, the walls rough concrete, the floor unfinished earth that has compacted over decades.

The crawlspace connects buildings that were constructed separately, a seam in the underground that was never sealed. Those who know it exists use it to move between structures without using surface streets.`,
      x: 10,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 3,
      waterLevel: 15,
      outdoor: false,
      exits: {
        west: '%ELEVATOR_PIT',
        east: '%DRAINAGE_CHAMBER',
        south: '%BANK_VAULT',
      },
      objects: [
        { prototype: 'sign', name: 'scratched directions', description: 'Scratched into the concrete: arrows pointing east with the word "OUT" and arrows pointing west with "SAFE".', boltedDown: true },
      ],
    },

    '%DRAINAGE_CHAMBER': {
      name: 'Storm Drainage Chamber',
      description: `The crawlspace opens into a storm drainage chamber—a junction in the city's stormwater system where multiple drains converge before flowing toward the bay. The chamber is wet, the walls stained to high-water marks that suggest seasonal flooding. When it rains hard above, this chamber fills.

Now the chamber is mostly dry, a trickle of water running through the central channel. The air smells of rain and the organic detritus that washes down from the streets. Everything the city above discards eventually passes through here.`,
      x: 12,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 8,
      waterLevel: 25,
      outdoor: false,
      exits: {
        west: '%FOUNDATION_CRAWL',
        south: '%STEAM_CONNECTOR',
        north: {
          to: 'buildings/eastside-underground/z-2.ts',
          room: '%STEAM_S2',
          description: 'A passage leads north toward the steam tunnels',
        },
      },
      objects: [
        { prototype: 'sign', name: 'high water marks', description: 'Dark stains on the walls show how high the water rises during storms. The highest mark is eight feet up.', boltedDown: true },
        { prototype: 'furniture', name: 'a drainage grate', description: 'A massive iron grate covers the central drain, preventing debris from clogging the outflow. The grate is caked with leaves and trash.', boltedDown: true },
      ],
    },

    '%DRAINAGE_ACCESS': {
      name: 'Drainage Access Tunnel',
      description: `The passage descends toward the stormwater system, a maintenance tunnel that provides access to the drains beneath the intersection. The walls are wet, the floor sloped toward the central channel, the construction purely functional—concrete cast in place, sized for a worker with equipment.

The tunnel ends at a flooded section where the drainage system meets the water table. Further south is impassable without equipment.`,
      x: 10,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 12,
      waterLevel: 30,
      outdoor: false,
      exits: {
        north: '%UTILITY_JUNCTION',
      },
      objects: [
        { prototype: 'sign', name: 'a drainage warning', description: 'A metal sign reads: "DANGER - FLASH FLOOD ZONE - DO NOT ENTER DURING RAIN". The warning is serious.', boltedDown: true },
        { prototype: 'sign', name: 'a flooded passage', description: 'The tunnel continues south but is flooded to the ceiling. Dark water fills the passage, blocking access to whatever lies beyond.', boltedDown: true },
      ],
    },
  },
};
