// Waterfront Underground - Level z=-2 (Smuggler's Tunnels)
// Beneath the piers and wharves of the waterfront (x=-21)
// Salt-worn passages, tidal chambers, and hidden cargo routes

export const building = {
  name: 'Waterfront Underground',
  x: -21,
  y: -8,
  width: 5,
  height: 20,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // MAIN WATERFRONT SPINE (x=-21, running north-south)
    // ═══════════════════════════════════════════════════════════════════════

    '%PIER_BASEMENT': {
      name: 'Pier Basement',
      description: `The chamber sits directly beneath the old pier structure, its ceiling formed by the massive timber beams that support the wharf above. Salt water has claimed this space over decades—the walls are crusted with white mineral deposits, the floor perpetually damp with tidal seepage that the original builders never managed to control.

The architecture speaks of commerce and concealment in equal measure. Loading hatches in the ceiling, now rusted shut, once allowed cargo to descend directly from ships. The cargo that passed through here—some of it, at least—never appeared on any manifest.

The air tastes of salt and rot, the organic decay of things the tide brings in and doesn't take back. Passages branch east toward the city's underground and south along the waterfront's hidden spine.`,
      x: -21,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 12,
      waterLevel: 25,
      outdoor: false,
      exits: {
        south: '%TIDAL_N1',
        north: '%PIER_N1',
        east: '%WHARF_CONN',
      },
      objects: [
        { prototype: 'crate', name: 'a rotting crate', description: 'A wooden shipping crate, its boards warped and green with algae. Salt crystals encrust the rusted iron bands.', boltedDown: true },
        { prototype: 'sign', name: 'a faded cargo manifest', description: 'A water-damaged manifest nailed to the wall. The ink has run, but a few words remain visible: "...SHANGHAI... 47 BARRELS... INSPECT..."', boltedDown: true },
      ],
    },

    '%PIER_N1': {
      name: 'Flooded Passage',
      description: `The passage runs north through territory the tide claims twice daily. The water level varies from ankle-deep to chest-high depending on forces that operate on lunar schedules rather than human ones. The walls show tide marks at multiple heights, a record of the bay's rhythms written in salt and slime.`,
      x: -21,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 40,
      lighting: 8,
      waterLevel: 45,
      outdoor: false,
      exits: {
        south: '%PIER_BASEMENT',
        north: '%PIER_N2',
      },
    },

    '%PIER_N2': {
      name: 'Barnacle Chamber',
      description: `The chamber is encrusted with the accumulated life of decades—barnacles, mussels, the calcified remains of creatures that found their way in through the bay and never found their way out. The organic growth covers every surface below the high-tide mark, transforming worked stone into something that resembles reef more than ruin.

A rusted iron ladder rises toward a hatch in the ceiling, the route to the pier above. The hatch is welded shut from the surface side—sealed during some renovation or security measure—but the ladder remains, a monument to access that once existed.`,
      x: -21,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 5,
      waterLevel: 40,
      outdoor: false,
      exits: {
        south: '%PIER_N1',
        north: '%PIER_N3',
        east: '%MUSSEL_CAVE',
      },
      objects: [
        { prototype: 'bench', name: 'a barnacle-covered bench', description: 'A stone bench embedded in the wall, completely encrusted with barnacles. Whatever it once was, the bay has claimed it.', boltedDown: true },
      ],
    },

    '%PIER_N3': {
      name: 'Northern Pier Passage',
      description: `The passage continues through increasingly unstable construction, the timber supports showing the stress of a century's tidal assault. The wood is soft in places, the iron fastenings rusted to fragility, the whole structure existing on borrowed time that might expire without warning.`,
      x: -21,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 10,
      waterLevel: 35,
      outdoor: false,
      exits: {
        south: '%PIER_N2',
        north: '%PIER_N4',
      },
    },

    '%PIER_N4': {
      name: 'Collapsed Section',
      description: `The passage ends where the ceiling has given way, timber and debris blocking further progress to the north. The collapse is old, the debris settled and stable, but the message is clear: the waterfront underground extends only so far before the bay reclaims it entirely.

Water seeps through the debris, finding its way from the surface through channels that the collapse created. The air here is fresher than below—the collapse opened routes for ventilation that the original construction never provided.`,
      x: -21,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 15,
      waterLevel: 30,
      outdoor: false,
      exits: {
        south: '%PIER_N3',
        east: '%DEBRIS_CRAWL',
      },
    },

    '%DEBRIS_CRAWL': {
      name: 'Debris Crawlspace',
      description: `A narrow passage has been cleared through the collapse debris, the route requiring crawling through a space barely large enough for a human body. The debris overhead groans occasionally, settling in ways that might be insignificant or might presage further collapse. The uncertainty is part of using this route.

The passage connects the waterfront to the eastern tunnels, a route that requires commitment and tolerance for enclosed spaces. The rewards of passage—or the necessity—must outweigh the risks.`,
      x: -20,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 3,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%PIER_N4',
        east: '%UPPER_CONN',
        north: '%FAB_TUNNEL_S',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FABRICATION FACTORY TUNNEL (connecting north to fab factory)
    // ═══════════════════════════════════════════════════════════════════════

    '%FAB_TUNNEL_S': {
      name: 'Fabrication Tunnel South',
      description: `A service tunnel extends north from the debris field, its construction newer than the surrounding passages—poured concrete rather than Victorian brick, installed when the Fabrication Factory was built. The tunnel was designed for utility access but serves other purposes now.

The walls are marked with conduit runs and cable trays, the infrastructure that powers the factory above. Emergency lights still function, their battery backups maintained by someone who values this route.`,
      x: -20,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%DEBRIS_CRAWL',
        north: '%FAB_TUNNEL_MID',
      },
    },

    '%FAB_TUNNEL_MID': {
      name: 'Fabrication Tunnel',
      description: `The tunnel continues north beneath the industrial district, passing through earth that was excavated when the factory's foundations were laid. The passage is utilitarian—bare concrete walls, exposed pipes, functional lighting that flickers occasionally.

Ventilation ducts run along the ceiling, carrying air from the factory's climate control system. The air is warmer here, heated by the machinery that operates overhead. The hum of fabrication equipment is audible through the concrete.`,
      x: -20,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%FAB_TUNNEL_S',
        north: '%FAB_BASEMENT',
      },
    },

    '%FAB_BASEMENT': {
      name: 'Fabrication Factory Basement',
      description: `The tunnel terminates in a basement chamber directly beneath the Fabrication Factory's loading bay. Heavy machinery once occupied this space—the marks of removed equipment still visible on the concrete floor. Now it serves as a nexus between official infrastructure and unofficial routes.

A freight elevator shaft rises toward the factory floor, its cage permanently locked at a level above. The stairs beside it are functional, leading up to a maintenance door that opens into the factory's service corridors. The door is not on any official plans.

The Gray Cartel maintains this access point. The factory's AI either doesn't know about it or has been instructed not to notice.`,
      x: -20,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%FAB_TUNNEL_MID',
        up: {
          to: 'buildings/fabrication-factory/z0.ts',
          room: '%PUBLIC_SERVICES',
          description: 'Stairs lead up to the Fabrication Factory',
          hidden: true,
        },
      },
      objects: [
        { prototype: 'furniture', name: 'a disabled elevator cage', description: 'A freight elevator cage sits locked one floor up. The controls have been disabled, but the shaft remains—a potential route for those with climbing skills.', boltedDown: true },
        { prototype: 'sign', name: 'a Cartel marker', description: 'A small gray symbol is scratched into the concrete near the stairs—the Cartel\'s mark, indicating safe passage for those who know.', boltedDown: true },
      ],
    },

    '%UPPER_CONN': {
      name: 'Upper Connection',
      description: `The crawlspace opens into a passage that shows the marks of different construction—nineteenth century brick rather than wharf timber, the architecture of the raised streets rather than the piers. This is where the waterfront underground meets the city underground, two networks built by different hands for different purposes, finding connection in the darkness.`,
      x: -19,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%DEBRIS_CRAWL',
        south: '%TRANSITION_1',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN WATERFRONT (tidal caves and smuggler routes)
    // ═══════════════════════════════════════════════════════════════════════

    '%TIDAL_N1': {
      name: 'Tidal Passage',
      description: `The passage runs south through a section that floods completely at high tide. The walls are worn smooth by water and time, the original construction obscured beneath layers of marine growth and mineral deposit. This route is passable only when the tide allows—timing matters here.`,
      x: -21,
      y: -1,
      z: -2,
      population: 0,
      ambientNoise: 45,
      lighting: 8,
      waterLevel: 50,
      outdoor: false,
      exits: {
        north: '%PIER_BASEMENT',
        south: '%TIDAL_N2',
      },
    },

    '%TIDAL_N2': {
      name: 'Tidal Chamber',
      description: `The passage opens into a chamber where the tide pools at low water, leaving a reservoir that never fully drains. The water is cold, dark, of uncertain depth. Creatures move in the darkness below the surface—small things, probably, but the uncertainty adds weight to every splash.

Smugglers used this chamber for storage that needed to be hidden quickly—goods could be weighted and dropped into the pool, retrieved later when attention passed. The practice required trust in the chamber's geography. Some caches were never retrieved.`,
      x: -21,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 50,
      lighting: 5,
      waterLevel: 60,
      outdoor: false,
      exits: {
        north: '%TIDAL_N1',
        south: '%TIDAL_CAVE',
        east: '%CARGO_HIDE',
      },
      objects: [
        { prototype: 'crate', name: 'a weighted crate', description: 'A wooden crate with chains attached, designed to sink quickly. Something rattles inside when the water moves it.', boltedDown: true },
        { prototype: 'sign', name: 'scratched tally marks', description: 'Tally marks scratched into the stone above the waterline. Someone counted something here. The count stopped at forty-seven.', boltedDown: true },
      ],
    },

    '%TIDAL_CAVE': {
      name: 'Tidal Cave',
      description: `The chamber opens into what might be a natural cave enlarged by human hands—the walls show both the irregular surfaces of water-carved stone and the regular marks of tools that shaped the space for specific purposes. The cave connects to the bay through a passage too small for boats but large enough for swimmers, the route used by those who needed to arrive or depart without using the docks.

At low tide, the cave floor is exposed, revealing the detritus of decades: bottles, tools, chains, the scattered evidence of activities that preferred darkness to light.`,
      x: -21,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 55,
      lighting: 3,
      waterLevel: 70,
      outdoor: false,
      exits: {
        north: '%TIDAL_N2',
        south: '%SMUGGLER_DOCK',
        down: '%DEEP_TIDE',
      },
    },

    '%SMUGGLER_DOCK': {
      name: `Smuggler's Dock`,
      description: `The cave opens into a chamber that was clearly built for loading and unloading—a stone platform at the water's edge, iron rings set into the walls for mooring lines, the infrastructure of commerce that never touched the official wharves. At high tide, small boats could enter through the cave passage. At low tide, goods could be moved on foot.

The platform shows the wear of heavy use, the stone polished by decades of boots and cargo. The rings are still solid, still capable of holding lines. The dock could be used tomorrow, if anyone still used it. Perhaps someone does.`,
      x: -21,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 40,
      lighting: 10,
      waterLevel: 55,
      outdoor: false,
      exits: {
        north: '%TIDAL_CAVE',
        south: '%SOUTH_CAVE',
        east: '%DOCK_PASSAGE',
      },
      objects: [
        { prototype: 'bench', name: 'a stone loading platform', description: 'A flat stone platform at the water\'s edge, worn smooth by decades of cargo. Iron rings are set into the rock for mooring lines.', boltedDown: true },
        { prototype: 'crate', name: 'an anchor chain pile', description: 'A massive pile of rusted anchor chain, coiled in the corner. It could hold a ship—or weigh down something that needed to disappear.', boltedDown: true },
        { prototype: 'sign', name: 'carved initials', description: 'Initials carved deep into the stone: "J.K. 1923" and below it, fresher, "R.M. 1987". The tradition continues.', boltedDown: true },
      ],
    },

    '%SOUTH_CAVE': {
      name: 'Southern Cave',
      description: `The cave continues south through passages that grow increasingly natural, the human construction giving way to water-carved stone. The route becomes more difficult here—narrow passages, sudden drops, sections that require wading or swimming depending on the tide.

The cave eventually connects to the bay through multiple openings, none large enough for easy access, all of them dangerous when the tide is moving. This is escape-route territory, used by those who had no better options.`,
      x: -21,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 45,
      lighting: 2,
      waterLevel: 65,
      outdoor: false,
      exits: {
        north: '%SMUGGLER_DOCK',
        south: '%CAVE_END',
        east: '%SOUTH_TUNNEL',
      },
    },

    '%CAVE_END': {
      name: 'Cave Terminus',
      description: `The cave narrows to a crack that admits water but not humans, the passage continuing only for the tide. Beyond this point, the only route is through water—swimming through submerged passages that might or might not emerge somewhere accessible.

Bones lie scattered on the floor here, too old to identify, too numerous to ignore. Some who fled this way didn't find the route they hoped for. The cave kept them.`,
      x: -21,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 0,
      waterLevel: 80,
      outdoor: false,
      exits: {
        north: '%SOUTH_CAVE',
        down: '%DEEP_SOUTH',
      },
      objects: [
        { prototype: 'sign', name: 'a warning scratched in stone', description: 'Words scratched deeply into the rock: "TIDE KILLS. WAIT FOR LOW." Below it, in different handwriting: "Chen didn\'t wait."', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EASTERN CONNECTIONS (to 1st Ave underground)
    // ═══════════════════════════════════════════════════════════════════════

    '%WHARF_CONN': {
      name: 'Wharf Connection',
      description: `The passage extends east from the pier basement, climbing slightly as it moves away from the waterfront toward the higher ground where the city's main underground network begins. The transition from wharf construction to street construction is gradual—timber giving way to brick, marine engineering giving way to urban.`,
      x: -20,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 28,
      lighting: 15,
      waterLevel: 15,
      outdoor: false,
      exits: {
        west: '%PIER_BASEMENT',
        east: '%WHARF_MID',
      },
    },

    '%WHARF_MID': {
      name: 'Transition Passage',
      description: `The passage runs through a section where the construction styles overlap—wharf timber reinforcing brick walls, marine fastenings holding urban stonework. The hybrid architecture speaks of builders who worked with what they found, extending networks without regard for stylistic consistency.`,
      x: -19,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 18,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%WHARF_CONN',
        east: '%FIRST_AVE_CONN',
      },
    },

    '%FIRST_AVE_CONN': {
      name: 'First Avenue Access',
      description: `The passage reaches the edge of the First Avenue underground network, where the waterfront tunnels connect to the established infrastructure beneath the raised streets. The transition is marked by newer construction—twentieth century modifications that extended the network westward, creating connections that the original builders never intended.

A shaft rises toward street level here, its upper end sealed but its route still visible. The waterfront was once accessible from above. The access was closed when the uses of the underground became inconvenient to acknowledge.`,
      x: -17,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 22,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%WHARF_MID',
        east: {
          to: 'underground/upper-tunnels/main-crossing.ts',
          description: 'A passage leads east toward the main underground network',
        },
        south: '%WAREHOUSE_N',
      },
    },

    '%TRANSITION_1': {
      name: 'Transition Tunnel',
      description: `A tunnel connects the upper waterfront section to the main network, running diagonally through earth that shows the layered history of Seattle's development—fill from the street raising, debris from the fire, the original clay deposited by glaciers.`,
      x: -19,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%UPPER_CONN',
        south: '%TRANSITION_2',
      },
    },

    '%TRANSITION_2': {
      name: 'Transition Tunnel',
      description: `The tunnel continues through increasingly stable ground, the marine influence fading as the passage moves away from the waterfront. The walls are drier here, the air less salty, the construction more recognizable as part of the city's standard underground network.`,
      x: -19,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%TRANSITION_1',
        south: '%TRANSITION_3',
      },
    },

    '%TRANSITION_3': {
      name: 'Warehouse Basement',
      description: `The tunnel opens into a basement that once served a waterfront warehouse—the dimensions large, the construction industrial, the purpose storage rather than habitation. The warehouse above is long gone, demolished or collapsed, but its foundation remains as infrastructure for the network below.`,
      x: -19,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 3,
      outdoor: false,
      exits: {
        north: '%TRANSITION_2',
        south: '%WAREHOUSE_N',
      },
    },

    '%WAREHOUSE_N': {
      name: 'Warehouse Passage',
      description: `The passage runs through a series of connected basements that once served the waterfront's commercial district. The walls show the marks of heavy use—scratches from cargo, stains from spills, the accumulated evidence of decades of storage and transit.`,
      x: -19,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%TRANSITION_3',
        east: '%FIRST_AVE_CONN',
        south: '%WAREHOUSE_MID',
      },
    },

    '%WAREHOUSE_MID': {
      name: 'Warehouse Junction',
      description: `The passage opens into a junction where multiple warehouse basements once connected, creating a network for moving goods without using the streets above. The infrastructure remains—iron tracks for cargo carts, loading platforms, the architecture of logistics—though the goods that once moved through here are long gone.`,
      x: -19,
      y: -1,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%WAREHOUSE_N',
        south: '%WAREHOUSE_S',
        east: '%SUPPLY_CONN',
      },
    },

    '%WAREHOUSE_S': {
      name: 'Warehouse Passage',
      description: `The passage continues south through warehouse basements that show increasing water damage—the proximity to the bay making itself felt in seepage, in mineral deposits, in the organic smell of tide-influenced air.`,
      x: -19,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 15,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%WAREHOUSE_MID',
        south: '%COLD_STORAGE',
      },
    },

    '%COLD_STORAGE': {
      name: 'Cold Storage',
      description: `The passage opens into a chamber that was once cold storage—the walls still showing the insulation that kept ice from melting in the days before mechanical refrigeration. The ice is long gone, but the cold remains, the chamber's thermal mass resisting the temperature changes that affect the rest of the underground.

The cold makes this chamber useful for purposes the original builders never intended. Some things keep better in cold. Some things need to stay cold until they can be moved.`,
      x: -19,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%WAREHOUSE_S',
        west: '%DOCK_PASSAGE',
        down: '%DEEP_COLD',
      },
      objects: [
        { prototype: 'cabinet', name: 'an ice-block frame', description: 'A massive wooden frame where ice blocks were once stacked. The wood is frozen into the walls, immovable after a century of cold.', boltedDown: true },
        { prototype: 'sign', name: 'an ice company sign', description: 'A painted metal sign reads "ALASKA ICE CO. - KEEP DOORS CLOSED". The paint is flaking but the warning remains clear.', boltedDown: true },
      ],
    },

    '%DOCK_PASSAGE': {
      name: 'Dock Passage',
      description: `The passage connects the cold storage to the smuggler's dock, a route that once allowed goods to move from the hidden loading point to the legitimate warehouse network without passing through any space that might be observed. The passage is narrow, sized for cargo rather than comfort, the walls showing the marks of heavy loads dragged through in darkness.`,
      x: -20,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 8,
      waterLevel: 20,
      outdoor: false,
      exits: {
        west: '%SMUGGLER_DOCK',
        east: '%COLD_STORAGE',
        north: {
          to: 'buildings/underground-tour/z-2.ts',
          room: '%UNTOUR_PASSAGE',
          description: 'A rough passage climbs toward the old tour route',
        },
      },
    },

    '%CARGO_HIDE': {
      name: 'Cargo Hide',
      description: `The chamber sits behind a false wall, its entrance concealed by construction that appears solid until examined closely. The hide was built for contraband—sized to hold significant cargo, positioned to be defensible, designed to be abandoned if necessary.

The walls show the marks of past contents: scuffs and scratches at consistent heights suggesting stacked boxes, oil stains suggesting machinery, salt residue suggesting goods that came directly from boats. The hide has held many things. It could hold more.`,
      x: -20,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 5,
      waterLevel: 15,
      outdoor: false,
      exits: {
        west: '%TIDAL_N2',
      },
      objects: [
        { prototype: 'crate', name: 'an oilcloth bundle', description: 'A bundle wrapped in deteriorating oilcloth, wedged behind a false panel. The cloth is old but the contents feel solid—metal, perhaps, or glass.', boltedDown: true },
        { prototype: 'trunk', name: 'a smuggler\'s cache', description: 'A watertight metal box hidden in a carved niche. It\'s locked, but the lock is old and corroded.', boltedDown: true },
      ],
    },

    '%SOUTH_TUNNEL': {
      name: 'Southern Tunnel',
      description: `The passage extends east from the southern caves, climbing toward the main underground network through earth that grows drier and more stable with each step away from the waterfront. The construction is rough—picks and shovels rather than professional excavation—the work of people who needed a route more than they needed engineering.`,
      x: -20,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 8,
      waterLevel: 25,
      outdoor: false,
      exits: {
        west: '%SOUTH_CAVE',
        east: '%SOUTH_JUNCTION',
        up: {
          to: 'buildings/supply-depot/z0.ts',
          room: '%WAREHOUSE',
          description: 'A steel hatch leads up to the Supply Depot',
        },
      },
    },

    '%SOUTH_JUNCTION': {
      name: 'Southern Junction',
      description: `The tunnel reaches a junction where the waterfront network meets older construction—possibly a basement, possibly a deliberately excavated chamber, the original purpose obscured by modifications made across decades. The junction serves as the southern link between the waterfront underground and the city's deeper network.`,
      x: -18,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 12,
      waterLevel: 15,
      outdoor: false,
      exits: {
        west: '%SOUTH_TUNNEL',
        east: {
          to: 'underground/upper-tunnels/supply-junction.ts',
          description: 'A passage leads east toward the supply routes',
        },
        down: '%DEEP_SOUTH_CONN',
      },
      objects: [
        { prototype: 'sign', name: 'a scratched message', description: 'Scratched into the stone: "M.C. was here - 1934. Made it to Vancouver. Made it free." The letters are worn but deep.', boltedDown: true },
      ],
    },

    '%SUPPLY_CONN': {
      name: 'Supply Connection',
      description: `The passage runs east toward the established supply routes, connecting the waterfront warehouses to the network that the Gray Cartel maintains. The construction is newer here—twentieth century modifications extending the network's reach—the investment suggesting that this connection serves ongoing purposes.`,
      x: -17,
      y: -1,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%WAREHOUSE_MID',
        east: {
          to: 'underground/upper-tunnels/supply-junction.ts',
          description: 'A passage leads east toward the supply junction',
        },
      },
    },

    '%MUSSEL_CAVE': {
      name: 'Mussel Cave',
      description: `A small cave branches east from the barnacle chamber, its walls completely covered with mussel shells—living and dead, the layers of generations clinging to every surface. The mussels filter the water that flows through, creating a pocket of clarity in the otherwise murky underground.

The cave dead-ends after a few meters, the route too narrow to continue. But the mussels suggest water flow, connection to the bay, routes that exist for creatures smaller than humans.`,
      x: -20,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 2,
      waterLevel: 55,
      outdoor: false,
      exits: {
        west: '%PIER_N2',
      },
    },
  },
};
