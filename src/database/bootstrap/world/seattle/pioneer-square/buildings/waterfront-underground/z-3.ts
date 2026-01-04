// Waterfront Underground - Level z=-3 (Deep Waterfront)
// Below the tidal zone, where the water table meets ancient infrastructure
// Sea caves, drowned passages, and connections to the deep network

export const building = {
  name: 'Waterfront Underground',
  x: -21,
  y: -6,
  width: 6,
  height: 12,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // DEEP TIDAL SECTION (beneath the smuggler caves)
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_TIDE': {
      name: 'Deep Tidal Chamber',
      description: `The shaft from above descends into a chamber that exists at the boundary between land and sea—the water table here is not below the floor but within it, rising and falling with the tide, the chamber flooding completely twice daily before draining to knee-height.

The walls show the passage of decades of tidal flow, worn smooth and encrusted with life that thrives in the interface zone. The chamber smells of salt and organic decay, the accumulated residue of things the tide brings in and doesn't retrieve.

Sound behaves strangely here—the water amplifies some frequencies while absorbing others, voices seeming to come from the walls themselves. Navigation requires more than sight. The chamber has its own acoustic geography.`,
      x: -21,
      y: -3,
      z: -3,
      population: 0,
      ambientNoise: 55,
      lighting: 3,
      waterLevel: 75,
      outdoor: false,
      exits: {
        up: '%TIDAL_CAVE',
        south: '%SEA_PASSAGE_N',
        east: '%DEEP_WHARF',
      },
    },

    '%SEA_PASSAGE_N': {
      name: 'Sea Passage',
      description: `The passage extends south through rock that was carved by water long before humans arrived—a natural cave system that the underground network incorporated rather than created. The walls are irregular, the floor uneven, the route requiring careful navigation in the perpetual twilight of the deep waterfront.

The passage connects to the bay through submerged channels that are impassable at all but the lowest tides. Those who know the timing can use these routes. Those who don't can drown in them.`,
      x: -21,
      y: -4,
      z: -3,
      population: 0,
      ambientNoise: 50,
      lighting: 2,
      waterLevel: 70,
      outdoor: false,
      exits: {
        north: '%DEEP_TIDE',
        south: '%SEA_PASSAGE_S',
      },
    },

    '%SEA_PASSAGE_S': {
      name: 'Sea Passage',
      description: `The cave continues through a section where the ceiling drops low, requiring wading through chest-deep water that smells of brine and organic decay. The passage is passable but unpleasant, the water cold enough to shock and dark enough to hide whatever might share the space.

Phosphorescence glows faintly on some surfaces—bioluminescent organisms that have colonized this lightless space, providing dim illumination that is somehow more unsettling than complete darkness.`,
      x: -21,
      y: -5,
      z: -3,
      population: 0,
      ambientNoise: 45,
      lighting: 1,
      waterLevel: 80,
      outdoor: false,
      exits: {
        north: '%SEA_PASSAGE_N',
        south: '%DROWNED_ROOM',
      },
    },

    '%DROWNED_ROOM': {
      name: 'Drowned Room',
      description: `The passage opens into a chamber that was once a constructed space—brick walls still visible beneath layers of marine growth, the remains of a basement or storage room claimed by the rising water table. The room is permanently flooded, the water reaching to neck height, the ceiling barely above the surface.

Debris floats in the water: fragments of wood, plastic containers, the detritus of decades washing through on the tides. Among the debris, shapes that might be furniture or might be something else. The water is too murky to tell without touching, and touching feels inadvisable.`,
      x: -21,
      y: -6,
      z: -3,
      population: 0,
      ambientNoise: 40,
      lighting: 0,
      waterLevel: 90,
      outdoor: false,
      exits: {
        north: '%SEA_PASSAGE_S',
        east: '%DEEP_SOUTH_PASSAGE',
      },
    },

    '%DEEP_SOUTH': {
      name: 'Deep South Cave',
      description: `The shaft descends from the cave terminus above into a space that exists entirely below the water table—a flooded chamber where swimming is the only option. The water is cold, utterly dark, of uncertain depth.

The cave continues in directions that can only be determined by touch, the walls guiding movement through absolute darkness. Air pockets exist somewhere—they must, for the chamber to have any purpose—but finding them requires faith or knowledge.`,
      x: -21,
      y: -6,
      z: -4,
      population: 0,
      ambientNoise: 60,
      lighting: 0,
      waterLevel: 100,
      outdoor: false,
      exits: {
        up: '%CAVE_END',
        east: '%FLOODED_TUNNEL',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP WHARF SECTION (beneath the pier infrastructure)
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_WHARF': {
      name: 'Deep Wharf Foundation',
      description: `The passage enters the foundation level of the old wharf, where massive timber pilings descend into the seafloor. The construction is Victorian in scale and ambition—engineered to support the weight of commerce, to resist the assault of tide and weather, to last for centuries.

The foundations are still solid despite the decades, the timber preserved by the constant immersion that would rot it if exposed to air. The passage threads between the pilings, following routes that were built for inspection and maintenance, repurposed for passage.`,
      x: -20,
      y: -3,
      z: -3,
      population: 0,
      ambientNoise: 48,
      lighting: 5,
      waterLevel: 65,
      outdoor: false,
      exits: {
        west: '%DEEP_TIDE',
        east: '%PILING_MAZE',
        south: '%FOUNDATION_SOUTH',
      },
    },

    '%PILING_MAZE': {
      name: 'Piling Maze',
      description: `The passage winds through a forest of timber pilings, the massive posts creating a maze that could disorient anyone unfamiliar with the route. The pilings are encrusted with marine growth, slippery underfoot, treacherous in the darkness that fills the space between them.

Navigation here requires knowing the pattern—which pilings to pass on the left, which on the right, where the clearances narrow and where they widen. The maze is unintentional, a product of engineering rather than design, but it serves as effectively as any deliberate obstacle.`,
      x: -19,
      y: -3,
      z: -3,
      population: 0,
      ambientNoise: 42,
      lighting: 3,
      waterLevel: 60,
      outdoor: false,
      exits: {
        west: '%DEEP_WHARF',
        east: '%DEEP_WAREHOUSE',
      },
    },

    '%DEEP_WAREHOUSE': {
      name: 'Deep Warehouse Level',
      description: `The passage emerges from the piling maze into a constructed space—a basement level beneath the warehouse foundations, built to store goods below the water table. The engineering required to keep this space dry has long since failed, the pumps dead, the seals breached, the chamber claimed by the water that was never far away.

The warehouse level is now a flooded chamber, the original storage shelving still visible beneath the water, the goods they once held dissolved or decayed into the murk. The space is useless for its original purpose. It serves other purposes now.`,
      x: -18,
      y: -3,
      z: -3,
      population: 0,
      ambientNoise: 35,
      lighting: 8,
      waterLevel: 55,
      outdoor: false,
      exits: {
        west: '%PILING_MAZE',
        north: '%DEEP_PASSAGE_N',
        south: '%DEEP_PASSAGE_S',
      },
    },

    '%DEEP_PASSAGE_N': {
      name: 'Deep Passage',
      description: `The passage runs north through flooded warehouse basements, the water level varying as the floor rises and falls with the original construction. Some sections require wading; others require swimming brief distances through submerged doorways. The route is passable but demanding.`,
      x: -18,
      y: -2,
      z: -3,
      population: 0,
      ambientNoise: 32,
      lighting: 10,
      waterLevel: 50,
      outdoor: false,
      exits: {
        south: '%DEEP_WAREHOUSE',
        north: '%DEEP_JUNCTION',
      },
    },

    '%DEEP_JUNCTION': {
      name: 'Deep Junction',
      description: `The passage reaches a junction where the waterfront deep level meets the city's established underground network. The transition is marked by a change in construction—warehouse foundations giving way to the brick and stone of the raised-street infrastructure, the water level dropping as the route moves away from the bay.

This is the gateway between the waterfront depths and the city's deeper network, a junction maintained by those who value the connection between land-based and sea-based routes.`,
      x: -18,
      y: -1,
      z: -3,
      population: 0,
      ambientNoise: 28,
      lighting: 15,
      waterLevel: 35,
      outdoor: false,
      exits: {
        south: '%DEEP_PASSAGE_N',
        east: {
          to: 'underground/transitional/supply-shaft.ts',
          description: 'A passage leads east toward the supply shaft',
        },
        up: '%WAREHOUSE_MID',
      },
    },

    '%DEEP_PASSAGE_S': {
      name: 'Deep Passage',
      description: `The passage extends south through increasingly flooded sections, the water level rising as the route descends toward the bay. The air is heavy with salt and organic decay, the smell of things rotting in water that never dries.`,
      x: -18,
      y: -4,
      z: -3,
      population: 0,
      ambientNoise: 38,
      lighting: 5,
      waterLevel: 65,
      outdoor: false,
      exits: {
        north: '%DEEP_WAREHOUSE',
        south: '%DEEP_SOUTH_PASSAGE',
      },
    },

    '%DEEP_SOUTH_PASSAGE': {
      name: 'Deep South Passage',
      description: `The passage connects the warehouse sections to the sea caves, running through earth that is saturated with water, the walls seeping constantly, the floor submerged beneath knee-deep tide that never fully recedes.`,
      x: -18,
      y: -5,
      z: -3,
      population: 0,
      ambientNoise: 42,
      lighting: 3,
      waterLevel: 70,
      outdoor: false,
      exits: {
        north: '%DEEP_PASSAGE_S',
        west: '%DROWNED_ROOM',
        south: '%DEEP_SOUTH_CONN',
      },
    },

    '%DEEP_SOUTH_CONN': {
      name: 'Deep Southern Connection',
      description: `The passage reaches the southernmost extent of the accessible deep waterfront, connecting to shafts that rise toward the surface network and passages that lead to the flooded caves below. The junction is a decision point—up toward breathable air, or deeper into water that claims more territory with every meter.`,
      x: -18,
      y: -6,
      z: -3,
      population: 0,
      ambientNoise: 45,
      lighting: 8,
      waterLevel: 60,
      outdoor: false,
      exits: {
        north: '%DEEP_SOUTH_PASSAGE',
        up: '%SOUTH_JUNCTION',
      },
    },

    '%FOUNDATION_SOUTH': {
      name: 'Southern Foundation',
      description: `The passage runs south along the wharf foundations, the massive timber pilings creating a colonnade of rotting wood in the perpetual darkness. The route is stable but unpleasant, the water waist-deep and cold, the footing uncertain on surfaces slick with organic growth.`,
      x: -20,
      y: -4,
      z: -3,
      population: 0,
      ambientNoise: 45,
      lighting: 2,
      waterLevel: 70,
      outdoor: false,
      exits: {
        north: '%DEEP_WHARF',
        south: '%FOUNDATION_END',
      },
    },

    '%FOUNDATION_END': {
      name: 'Foundation Terminus',
      description: `The passage ends where the wharf foundations end, the timber pilings giving way to natural stone and the open darkness of the bay's underground interface. Beyond this point, the route continues only for those willing to swim through submerged passages of uncertain length and destination.

Iron rings set into the stone suggest that boats once moored here, in the darkness beneath the wharf, loading and unloading cargo that never touched the official docks. The rings are still solid. The practice may continue.`,
      x: -20,
      y: -5,
      z: -3,
      population: 0,
      ambientNoise: 50,
      lighting: 0,
      waterLevel: 80,
      outdoor: false,
      exits: {
        north: '%FOUNDATION_SOUTH',
        east: '%DEEP_SOUTH_PASSAGE',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP COLD SECTION (beneath the cold storage)
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_COLD': {
      name: 'Deep Cold Chamber',
      description: `The shaft descends from the cold storage above into a chamber that is somehow colder still—the thermal mass of the earth and the influence of the water table combining to create a space where breath fogs and exposed skin numbs quickly.

The chamber was used for deep storage, for goods that required temperatures below what the surface facilities could maintain. The ice that once filled this space is long gone, but the cold remains, the chamber a pocket of preserved chill in the otherwise tepid underground.

Shelving lines the walls, still solid despite the decades, still capable of holding cargo. The shelves are empty now. Or appear to be.`,
      x: -19,
      y: -3,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 8,
      waterLevel: 25,
      outdoor: false,
      exits: {
        up: '%COLD_STORAGE',
        south: '%COLD_PASSAGE',
        east: '%COLD_CONN',
      },
    },

    '%COLD_PASSAGE': {
      name: 'Cold Passage',
      description: `The passage extends south from the cold chamber, maintaining the chill temperature through construction that insulates against the warmer earth. The walls show frost patterns in places, ice forming from moisture in the air and never quite melting.`,
      x: -19,
      y: -4,
      z: -3,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 20,
      outdoor: false,
      exits: {
        north: '%DEEP_COLD',
        south: '%COLD_JUNCTION',
      },
    },

    '%COLD_JUNCTION': {
      name: 'Cold Junction',
      description: `The passage reaches a junction where the cold storage network meets the deeper waterfront infrastructure. The temperature rises slightly here, the cold giving way to the damp chill of the bay-influenced tunnels. The transition is marked by condensation on the walls, the cold air meeting warmer moisture.`,
      x: -19,
      y: -5,
      z: -3,
      population: 0,
      ambientNoise: 20,
      lighting: 12,
      waterLevel: 30,
      outdoor: false,
      exits: {
        north: '%COLD_PASSAGE',
        east: '%DEEP_SOUTH_PASSAGE',
      },
    },

    '%COLD_CONN': {
      name: 'Cold Connection',
      description: `A passage connects the deep cold section to the main underground network, climbing slightly as it moves away from the waterfront toward the established tunnels beneath the raised streets. The temperature rises with each step, the cold storage's influence fading as distance increases.`,
      x: -17,
      y: -3,
      z: -3,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 20,
      outdoor: false,
      exits: {
        west: '%DEEP_COLD',
        east: {
          to: 'underground/transitional/junction-shaft.ts',
          description: 'A passage leads east toward the junction shaft',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FLOODED TUNNEL (z=-4, connecting bay to underground)
    // ═══════════════════════════════════════════════════════════════════════

    '%FLOODED_TUNNEL': {
      name: 'Flooded Tunnel',
      description: `The tunnel extends east from the deep south cave through completely submerged passage—a route that requires swimming through darkness, following the walls by touch, trusting that air exists somewhere ahead.

The tunnel was not built flooded; it was built dry and later claimed by the rising water table and the bay's encroachment. The original construction is still visible in places—brick walls, iron fixtures—but the water has transformed the space into something that serves creatures with gills better than those with lungs.

Air pockets exist at irregular intervals, trapped against the ceiling in depressions that might be natural or might be engineered. Finding them requires luck or knowledge.`,
      x: -19,
      y: -6,
      z: -4,
      population: 0,
      ambientNoise: 65,
      lighting: 0,
      waterLevel: 100,
      outdoor: false,
      exits: {
        west: '%DEEP_SOUTH',
        east: '%CISTERN_ACCESS',
      },
    },

    '%CISTERN_ACCESS': {
      name: 'Cistern Access',
      description: `The flooded tunnel surfaces in a cistern—a massive underground reservoir that was once part of the city's water supply, now abandoned and partially flooded. The cistern is large enough that the far walls are invisible in the darkness, the space feeling limitless in a way that the cramped tunnels do not.

The water here is less saline than in the bay-connected passages, the cistern fed by groundwater rather than tidal flow. The relative freshness makes it slightly less unpleasant to swim in, though the darkness and cold remain.

A shaft rises toward the surface somewhere in the cistern's expanse. Finding it requires crossing the flooded chamber.`,
      x: -17,
      y: -6,
      z: -4,
      population: 0,
      ambientNoise: 55,
      lighting: 5,
      waterLevel: 85,
      outdoor: false,
      exits: {
        west: '%FLOODED_TUNNEL',
        up: '%CISTERN_SHAFT',
      },
    },

    '%CISTERN_SHAFT': {
      name: 'Cistern Shaft',
      description: `A vertical shaft rises from the cistern toward the surface, iron rungs set into the brick walls providing a climbing route that was installed when the cistern was still in use. The rungs are rusted but solid, the climb possible for those willing to trust century-old metalwork.

The shaft emerges somewhere in the underground network above, the exact location obscured by the darkness below but discoverable by those who make the climb.`,
      x: -17,
      y: -6,
      z: -3,
      population: 0,
      ambientNoise: 40,
      lighting: 8,
      waterLevel: 50,
      outdoor: false,
      exits: {
        down: '%CISTERN_ACCESS',
        up: '%DEEP_SOUTH_CONN',
      },
    },
  },
};
