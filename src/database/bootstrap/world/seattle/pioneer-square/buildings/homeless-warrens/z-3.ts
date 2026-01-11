// Homeless Warrens - Level z=-3
// Squatter camps and survival spaces in the forgotten depths
// Where the city's dispossessed have carved out a desperate existence

export const building = {
  name: 'Homeless Warrens',
  x: -18,
  y: -8,
  width: 20,
  height: 16,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // ACCESS POINTS
    // ═══════════════════════════════════════════════════════════════════════

    '%STEAM_GRATE_ACCESS': {
      name: 'Steam Grate Access',
      description: `A vertical shaft descends from a street-level steam grate into the warrens below. The warmth that rises through the grate draws people down in winter—those who know the grate leads somewhere. The shaft is lined with handholds worn smooth by countless hands.

This is the main entrance. The city above pretends not to notice the traffic.`,
      x: -10,
      y: 0,
      z: -3,
      imageOnDisk: 'steam-grate-access-x-10-y0-z-3.png',
      population: 0,
      ambientNoise: 15,
      lighting: 5,
      outdoor: false,
      exits: {
        up: {
          description: 'A shaft rises to the underground passages above',
        },
        south: '%MAIN_CAMP',
        east: '%SUPPLY_TUNNEL',
      },
      objects: [
        { prototype: 'sign', name: 'territorial markers', description: 'Spray-painted symbols mark territory boundaries. The meanings are known only to those who live here.', boltedDown: true },
        { prototype: 'furniture', name: 'a rope ladder', description: 'A frayed rope ladder hangs from the shaft, supplementing the worn handholds. It sways with each climber.', boltedDown: true },
      ],
    },

    '%DRAINAGE_ACCESS': {
      name: 'Drainage Access',
      description: `A storm drain opens into the warren system—a secondary entrance used when the main access is watched. The drain carries runoff during rains, but is dry most of the year. Those who use it know to watch the weather.

Water stains on the walls show how high floods have risen. The highest marks are at head height.`,
      x: -5,
      y: -7,
      z: -3,
      imageOnDisk: 'drainage-access-x-5-y-7-z-3.png',
      population: 0,
      ambientNoise: 20,
      lighting: 3,
      waterLevel: 10,
      outdoor: false,
      exits: {
        up: {
          description: 'A drain rises toward the utility tunnels',
        },
        west: '%FLOOD_ZONE',
        south: '%RAT_BORDER',
      },
      objects: [
        { prototype: 'sign', name: 'flood warnings', description: 'Hand-painted warnings in multiple languages: "WATCH SKY", "RUN WHEN WET", "NO SLEEP HERE".', boltedDown: true },
        { prototype: 'furniture', name: 'a drainage grate', description: 'A heavy iron grate covers the upward drain. It can be lifted from below, but not from above.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN ENCAMPMENT
    // ═══════════════════════════════════════════════════════════════════════

    '%MAIN_CAMP': {
      name: 'Main Encampment',
      description: `The largest open space in the warrens serves as the main camp—a cathedral-ceilinged chamber where dozens of people have established semi-permanent residence. Tarps and blankets partition the space into territories. Shopping carts and plastic bins hold possessions. The air is thick with the smell of unwashed bodies, cooking fires, and desperation.

A complex social order governs this place. Newcomers learn the rules or don't stay long.`,
      x: -10,
      y: -2,
      z: -3,
      imageOnDisk: 'main-encampment-x-10-y-2-z-3.png',
      population: 25,
      ambientNoise: 35,
      lighting: 10,
      outdoor: false,
      exits: {
        north: '%STEAM_GRATE_ACCESS',
        east: '%MARKET_CORNER',
        south: '%DEEPER_TUNNELS',
        west: '%FAMILY_SECTION',
      },
      objects: [
        { prototype: 'furniture', name: 'a communal fire pit', description: 'A metal barrel serves as a fire pit, its sides cut with ventilation holes. The fire is kept burning by collective effort—letting it die is a serious offense.', boltedDown: true },
        { prototype: 'furniture', name: 'the rules board', description: 'A piece of plywood lists camp rules: "NO STEALING", "NO VIOLENCE", "SHARE THE FIRE", "WATCH EACH OTHER\'S BACKS". Below: "BREAK THE RULES, LEAVE THE CAMP".', boltedDown: true },
        { prototype: 'furniture', name: 'makeshift shelters', description: 'Tarps strung between pillars create semi-private spaces. Cardboard provides insulation. Sleeping bags and blankets pile in corners.', boltedDown: true },
      ],
    },

    '%FAMILY_SECTION': {
      name: 'Family Section',
      description: `A quieter corner of the warrens has been claimed by those with children—a few families trying to maintain some normalcy in impossible circumstances. The space is cleaner than the main camp, the residents more protective of their territory.

Children's drawings cover one wall. Someone has hung a string of battery-powered lights.`,
      x: -13,
      y: -2,
      z: -3,
      imageOnDisk: 'family-section-x-13-y-2-z-3.png',
      population: 12,
      ambientNoise: 20,
      lighting: 15,
      outdoor: false,
      exits: {
        east: '%MAIN_CAMP',
        south: '%STORAGE_ALCOVE',
      },
      objects: [
        { prototype: 'furniture', name: 'children\'s drawings', description: 'Crayon drawings cover the wall: houses with smoking chimneys, families holding hands, dogs and cats, a sun. The dreams of children who have never had those things.', boltedDown: true },
        { prototype: 'furniture', name: 'a play corner', description: 'Salvaged toys occupy a corner: a one-armed doll, some plastic dinosaurs, a deflated basketball. The children share them.', boltedDown: true },
        { prototype: 'furniture', name: 'a sleeping area', description: 'Mattresses salvaged from dumpsters are pushed together, covered with donated blankets. The families sleep here together for warmth and protection.', boltedDown: true },
      ],
    },

    '%MARKET_CORNER': {
      name: 'Market Corner',
      description: `An informal economy operates in this corner of the camp—the exchange of goods, services, and information that keeps the community alive. Salvaged items are traded. Skills are bartered. News from the surface is currency.

Those who control the market have power. That power is contested.`,
      x: -7,
      y: -2,
      z: -3,
      imageOnDisk: 'market-corner-x-7-y-2-z-3.png',
      population: 8,
      ambientNoise: 30,
      lighting: 12,
      outdoor: false,
      exits: {
        west: '%MAIN_CAMP',
        east: '%SUPPLY_TUNNEL',
        south: '%SICK_BAY',
      },
      objects: [
        { prototype: 'furniture', name: 'trading tables', description: 'Overturned crates serve as trading tables. Salvaged goods are laid out: clothing, canned food, batteries, phone chargers, cigarettes—the currencies of the underground.', boltedDown: true },
        { prototype: 'sign', name: 'exchange rates', description: 'A chalkboard lists informal exchange rates: "1 PACK CIGS = 2 CANS FOOD", "PHONE CHARGE = 1 BLANKET HOUR", "INFO = NEGOTIABLE".', boltedDown: true },
        { prototype: 'furniture', name: 'a lookout post', description: 'Someone always watches the market from a raised platform. Theft is dealt with harshly.', boltedDown: true },
      ],
    },

    '%SUPPLY_TUNNEL': {
      name: 'Supply Tunnel',
      description: `A long tunnel connects the warrens to other underground systems—a supply line for scavenged goods from dumpsters, construction sites, and the occasional sympathetic business. The tunnel is traveled mainly at night, when the scavengers go out and return with what the surface discards.`,
      x: -4,
      y: 0,
      z: -3,
      imageOnDisk: 'supply-tunnel-x-4-y0-z-3.png',
      population: 2,
      ambientNoise: 10,
      lighting: 5,
      outdoor: false,
      exits: {
        west: '%STEAM_GRATE_ACCESS',
        south: '%MARKET_CORNER',
        east: {
          description: 'A tunnel leads east toward the Yesler passages',
        },
      },
      objects: [
        { prototype: 'furniture', name: 'a supply cache', description: 'Plastic bins line the walls, containing tonight\'s scavenged goods awaiting distribution: dented cans, day-old bread, discarded clothing.', boltedDown: true },
        { prototype: 'sign', name: 'scavenger routes', description: 'A hand-drawn map shows the best dumpster routes, restaurant schedules, and "friendly" businesses. It\'s updated regularly.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SUPPORT AREAS
    // ═══════════════════════════════════════════════════════════════════════

    '%SICK_BAY': {
      name: 'Sick Bay',
      description: `A former utility room has been converted into a makeshift medical station. The supplies are limited—donated first aid kits, expired medications, salvaged bandages—but those with medical knowledge do what they can. The sick and injured come here to heal or to die.

The smell of infection and disinfectant mingles in the air.`,
      x: -7,
      y: -4,
      z: -3,
      imageOnDisk: 'sick-bay-x-7-y-4-z-3.png',
      population: 5,
      ambientNoise: 15,
      lighting: 20,
      outdoor: false,
      exits: {
        north: '%MARKET_CORNER',
        west: '%DEEPER_TUNNELS',
        south: '%QUARANTINE',
      },
      objects: [
        { prototype: 'furniture', name: 'medical supplies', description: 'A salvaged cabinet holds what passes for medical supplies: bandages, antiseptic, expired antibiotics, a blood pressure cuff. Not enough. Never enough.', boltedDown: true },
        { prototype: 'furniture', name: 'cots', description: 'Folding cots hold the sick and injured. A volunteer sits with each one when possible. Some recover. Some don\'t.', boltedDown: true },
        { prototype: 'sign', name: 'a volunteer schedule', description: 'A chart shows who has medical training and when they\'re available. Most are self-taught. They do their best.', boltedDown: true },
      ],
    },

    '%QUARANTINE': {
      name: 'Quarantine Zone',
      description: `When sickness spreads—and it spreads often in these conditions—the infected are isolated here. The chamber is cold and dark, separated from the main camp by a plastic sheet barrier. Those inside wait to recover or to be carried deeper into the tunnels.

No one wants to end up here. Everyone fears it.`,
      x: -7,
      y: -6,
      z: -3,
      imageOnDisk: 'quarantine-zone-x-7-y-6-z-3.png',
      population: 3,
      ambientNoise: 5,
      lighting: 5,
      outdoor: false,
      exits: {
        north: '%SICK_BAY',
        south: '%RAT_BORDER',
      },
      objects: [
        { prototype: 'furniture', name: 'a plastic barrier', description: 'Heavy plastic sheeting separates the quarantine from the rest of the warrens. It rustles in the air currents, an inadequate defense against contagion.', boltedDown: true },
        { prototype: 'furniture', name: 'isolation cots', description: 'Cots are spaced far apart, each occupant wrapped in whatever blankets could be spared. Water bottles sit within reach. Some are empty.', boltedDown: true },
        { prototype: 'sign', name: 'a death count', description: 'Tally marks scratched into the wall count those who didn\'t make it. The count is higher than anyone wants to acknowledge.', boltedDown: true },
      ],
    },

    '%STORAGE_ALCOVE': {
      name: 'Storage Alcove',
      description: `A natural alcove in the tunnel system serves as communal storage—the collective resources of the camp kept here under guard. Food reserves for hard times. Extra blankets for winter. The medicine that isn't expired. Losing this would mean losing everything.

A rotation of volunteers guards the space around the clock.`,
      x: -13,
      y: -4,
      z: -3,
      imageOnDisk: 'storage-alcove-x-13-y-4-z-3.png',
      population: 2,
      ambientNoise: 10,
      lighting: 8,
      outdoor: false,
      exits: {
        north: '%FAMILY_SECTION',
        east: '%DEEPER_TUNNELS',
      },
      objects: [
        { prototype: 'furniture', name: 'food reserves', description: 'Plastic bins hold the camp\'s food reserves: canned goods, dried rice, peanut butter. Enough for maybe two weeks if rationed carefully.', boltedDown: true },
        { prototype: 'furniture', name: 'a blanket pile', description: 'Donated blankets are stacked in the driest corner, distributed when temperatures drop. The pile is smaller than it should be.', boltedDown: true },
        { prototype: 'furniture', name: 'a guard post', description: 'A folding chair faces the entrance, occupied by whoever drew guard duty. The job is boring but essential.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEPER ZONES
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEPER_TUNNELS': {
      name: 'Deeper Tunnels',
      description: `Beyond the main camp, the tunnels grow darker and less traveled. These passages are used by those who want privacy—for prayer, for grief, for things better done unseen. The community's unwritten rules grow thin here. Watch your back.`,
      x: -10,
      y: -4,
      z: -3,
      population: 3,
      ambientNoise: 8,
      lighting: 3,
      outdoor: false,
      exits: {
        north: '%MAIN_CAMP',
        east: '%SICK_BAY',
        west: '%STORAGE_ALCOVE',
        south: '%HIDDEN_SHRINE',
        down: '%FORGOTTEN_LEVEL',
      },
      objects: [
        { prototype: 'sign', name: 'warning graffiti', description: 'Spray-painted on the wall: "ALONE = PREY". A reminder of the dangers beyond the camp\'s protection.', boltedDown: true },
        { prototype: 'furniture', name: 'abandoned bedrolls', description: 'Scattered bedrolls mark where people once slept. Some left. Some were carried out. Some just disappeared.', boltedDown: true },
      ],
    },

    '%HIDDEN_SHRINE': {
      name: 'Hidden Shrine',
      description: `In a quiet alcove, someone has created a shrine—a space for the faithful among the forgotten. Candles flicker around religious icons from many traditions: a crucifix, a Buddha, a Star of David, images of saints and deities. Here, people come to pray to whatever power might listen.

The candles never go out. Someone always replaces them.`,
      x: -10,
      y: -6,
      z: -3,
      population: 1,
      ambientNoise: 2,
      lighting: 15,
      outdoor: false,
      exits: {
        north: '%DEEPER_TUNNELS',
        east: '%RAT_BORDER',
      },
      objects: [
        { prototype: 'furniture', name: 'a multi-faith altar', description: 'A makeshift altar holds religious items from many traditions—candles, prayer beads, small statues, handwritten prayers. All faiths are welcome here.', boltedDown: true },
        { prototype: 'furniture', name: 'votive candles', description: 'Dozens of candles burn in salvaged containers, each one a prayer for someone above or below. The flames are the brightest light in the warrens.', boltedDown: true },
        { prototype: 'sign', name: 'prayer notes', description: 'Scraps of paper are tucked into cracks in the wall—prayers, wishes, names of the lost. Some are legible. Some have been there for years.', boltedDown: true },
      ],
    },

    '%FLOOD_ZONE': {
      name: 'Flood Zone',
      description: `This section of the warrens floods during heavy rains—water pouring in from the drainage access, filling the passage waist-deep before slowly draining. The walls are stained with tide marks. Nothing valuable is stored here; nothing living stays long.

When the rains come, this passage becomes a death trap.`,
      x: -7,
      y: -7,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 2,
      waterLevel: 30,
      outdoor: false,
      exits: {
        east: '%DRAINAGE_ACCESS',
        south: '%RAT_BORDER',
        down: {
          to: 'buildings/flooded-sewers/z-4.ts',
          room: '%OVERFLOW_CHAMBER',
          description: 'A flooded passage descends into the sewers',
        },
      },
      objects: [
        { prototype: 'sign', name: 'high water marks', description: 'Painted lines on the walls show flood levels from different storms. The highest is at chest height, dated three years ago.', boltedDown: true },
        { prototype: 'furniture', name: 'debris piles', description: 'Flood debris accumulates against the walls: plastic bags, rotted wood, the occasional shoe. The waters bring strange things.', boltedDown: true },
      ],
    },

    '%RAT_BORDER': {
      name: 'Rat Border',
      description: `The warrens end here—or rather, human habitation ends. Beyond this point, the rats hold dominion. The camp maintains a fragile truce with the vermin: this territory for humans, that territory for rats. Cross the line, and the rats respond in force.

The scratching beyond the barrier never stops.`,
      x: -7,
      y: -8,
      z: -3,
      population: 0,
      ambientNoise: 40,
      lighting: 2,
      outdoor: false,
      exits: {
        north: '%QUARANTINE',
        west: '%HIDDEN_SHRINE',
        east: '%DRAINAGE_ACCESS',
        south: {
          to: 'buildings/rat-pits/z-4.ts',
          room: '%BORDER_CROSSING',
          description: 'A passage descends into rat territory',
        },
      },
      objects: [
        { prototype: 'furniture', name: 'the barrier', description: 'A makeshift barrier of sheet metal and wire mesh marks the border with rat territory. It wouldn\'t stop a determined incursion, but it makes a statement.', boltedDown: true },
        { prototype: 'sign', name: 'territorial warnings', description: 'Spray-painted on the barrier: "RAT TERRITORY - DO NOT ENTER" and below it, more ominously: "THEY BITE".', boltedDown: true },
        { prototype: 'furniture', name: 'bait stations', description: 'Poison bait stations line the border—a futile effort to control the population. The rats seem to have learned to avoid them.', boltedDown: true },
      ],
    },

    '%FORGOTTEN_LEVEL': {
      name: 'Forgotten Level',
      description: `Below the warrens, an older level exists—tunnels from an earlier era, abandoned when the water table rose. The passage down is treacherous, used only by those seeking solitude or hiding from something worse than rats.

The air here is bad. The walls weep moisture. Some say voices echo from deeper still.`,
      x: -10,
      y: -4,
      z: -4,
      population: 1,
      ambientNoise: 5,
      lighting: 0,
      waterLevel: 20,
      outdoor: false,
      exits: {
        up: '%DEEPER_TUNNELS',
        south: {
          to: 'buildings/deep-cisterns/z-4.ts',
          room: '%WESTERN_CISTERN',
          description: 'A flooded passage leads toward the cisterns',
        },
        east: {
          to: 'buildings/rat-pits/z-4.ts',
          room: '%DEEP_NEST',
          description: 'A foul passage leads into the rat pits',
        },
      },
      objects: [
        { prototype: 'furniture', name: 'a hermit\'s camp', description: 'A single bedroll occupies a dry corner, surrounded by candle stubs and empty cans. Someone lives here, away from everyone. They prefer it that way.', boltedDown: true },
        { prototype: 'sign', name: 'old graffiti', description: 'Faded graffiti from decades past: names, dates, obscenities. The forgotten leaving their mark before being forgotten themselves.', boltedDown: true },
      ],
    },
  },
};
