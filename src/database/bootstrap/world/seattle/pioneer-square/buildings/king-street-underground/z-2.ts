// King Street Underground - Level z=-2 (Rail Yard Tunnels)
// Beneath King Street and the rail yards (y=-12 to y=-6)
// Industrial infrastructure, freight passages, and worker tunnels

export const building = {
  name: 'King Street Underground',
  x: -21,
  y: -12,
  width: 36,
  height: 8,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // KING STREET MAIN CORRIDOR (y=-12, beneath the street)
    // ═══════════════════════════════════════════════════════════════════════

    '%KING_WEST': {
      name: 'King Street Underground West',
      description: `The passage runs beneath King Street at its western extent, where the road meets the waterfront industrial district. The construction here is different from the commercial underground to the north—heavier, more industrial, designed for freight and machinery rather than pedestrians and commerce.

The air smells of oil and rust, the accumulated residue of a century of industrial activity. The passage vibrates with the distant rumble of trains, the rail infrastructure making its presence felt even this far below.`,
      x: -21,
      y: -12,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 18,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%WATERFRONT_SOUTH',
        east: '%KING_MID_W',
      },
    },

    '%WATERFRONT_SOUTH': {
      name: 'Waterfront South Connection',
      description: `The passage extends north from King Street toward the southern waterfront underground, connecting the industrial tunnels to the smuggler routes beneath the piers. The construction transitions from industrial to maritime—the smell of oil giving way to salt, the rumble of trains giving way to the whisper of tide.`,
      x: -21,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 12,
      waterLevel: 20,
      outdoor: false,
      exits: {
        south: '%KING_WEST',
        north: {
          to: 'buildings/waterfront-underground/z-2.ts',
          room: '%SOUTH_JUNCTION',
          description: 'A passage leads north toward the waterfront tunnels',
        },
        east: '%FREIGHT_WEST',
      },
    },

    '%KING_MID_W': {
      name: 'King Street Underground',
      description: `The passage continues east beneath King Street, running parallel to the rail lines that dominate the surface. The tunnel is sized for industrial traffic—wider than the commercial passages, the ceiling higher to accommodate loads that required clearance.

Alcoves branch off at intervals, the remains of loading docks and storage bays that served the rail yards above. Some alcoves are collapsed. Others are sealed. A few remain accessible, their purposes adapted to the needs of the current underground.`,
      x: -14,
      y: -12,
      z: -2,
      population: 0,
      ambientNoise: 40,
      lighting: 20,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%KING_WEST',
        east: '%KING_MAIN',
        north: '%FIRST_AVE_SOUTH',
      },
    },

    '%FIRST_AVE_SOUTH': {
      name: 'First Avenue South Junction',
      description: `The passage reaches a junction where the King Street underground meets the routes beneath First Avenue. The intersection is a major hub in the southern network—multiple routes converging, traffic flowing in all directions, the space large enough to accommodate the industrial loads that once passed through.

The junction is maintained despite the decades since its official use ended. Someone values this intersection. Someone keeps it functional.`,
      x: -14,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 22,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%KING_MID_W',
        north: '%FIRST_AVE_TRANS',
        east: '%FREIGHT_CENTRAL',
        west: '%FREIGHT_WEST',
      },
      objects: [
        { prototype: 'sign', name: 'a railway timetable', description: 'A massive iron-framed timetable shows arrivals and departures. The trains listed haven\'t run since 1971, but the board remains, frozen in time.', boltedDown: true },
        { prototype: 'bench', name: 'a cargo scale platform', description: 'A massive industrial scale platform is set into the floor, its dial frozen at 2,347 pounds—the weight of some long-forgotten load.', boltedDown: true },
      ],
    },

    '%FIRST_AVE_TRANS': {
      name: 'First Avenue Transition',
      description: `The passage passes through a transitional zone where the character of the underground shifts from industrial bulk to commercial refinement. The ceiling drops here, the walls narrow, the space becoming more human-scaled as it approaches the retail basements to the north.

An old freight scale is embedded in the floor, its brass dial frozen at some long-forgotten weight. Workers once used this spot to tally goods moving between the rail yards and the commercial district—counting boxes, weighing barrels, documenting everything in ledgers that rotted decades ago.

Pipes cross overhead, a tangle of gas, water, and steam lines that serve buildings above. Condensation drips from the steam pipes, creating a constant percussion that masks quieter sounds. Someone has hung tin cans from the water pipes—a makeshift alarm system that rattles when vibration travels through the metal.`,
      x: -14,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 15,
      waterLevel: 8,
      outdoor: false,
      exits: {
        south: '%FIRST_AVE_SOUTH',
        north: '%FIRST_SOUTH_PASSAGE',
      },
      objects: [
        { prototype: 'furniture', name: 'an embedded floor scale', description: 'A brass-faced weighing scale is set into the floor, its platform large enough for cargo pallets. The needle points to 847 lbs, frozen there since someone walked away.', boltedDown: true },
        { prototype: 'sign', name: 'tin can alarms', description: 'Empty tin cans hang from wires wrapped around the overhead pipes. They rattle when anything heavy moves through the tunnel.', boltedDown: true },
      ],
    },

    '%FIRST_SOUTH_PASSAGE': {
      name: 'First Avenue South Passage',
      description: `The passage runs north from the junction, connecting the King Street network to the established underground beneath First Avenue. The construction shows the transition from industrial to commercial—the scale decreasing, the architecture softening, the purpose shifting from freight to people.`,
      x: -14,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 18,
      waterLevel: 8,
      outdoor: false,
      exits: {
        south: '%FIRST_AVE_TRANS',
        north: '%FIRST_SOUTH_MID',
      },
    },

    '%FIRST_SOUTH_MID': {
      name: 'First Avenue Passage',
      description: `The passage continues through the transition zone between the industrial south and the commercial center, the construction showing the marks of different eras and different purposes. The passage serves as infrastructure, connecting significant spaces without being significant itself.`,
      x: -14,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 18,
      waterLevel: 8,
      outdoor: false,
      exits: {
        south: '%FIRST_SOUTH_PASSAGE',
        north: {
          to: 'underground/upper-tunnels/supply-junction.ts',
          description: 'A passage leads north toward the supply routes',
        },
        east: '%BOTTLING_WORKS',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FIRST AVENUE EAST CORRIDOR (y=-6, x=-13 to x=-11)
    // Connecting First Avenue to Storage Bay
    // ═══════════════════════════════════════════════════════════════════════

    '%BOTTLING_WORKS': {
      name: 'Bottling Works Cellar',
      description: `The passage opens into the basement of what was once a bottling works—a facility that filled bottles with everything from soda water to patent medicines to whiskey during Prohibition. The bottling machinery is long gone, but the infrastructure remains: concrete troughs for washing bottles, drains for spillage, and the iron tracks where crates of filled bottles were pushed toward the loading dock.

Empty bottles litter the floor in drifts—green glass, brown glass, clear glass, each shape designed for a specific product. Some still bear paper labels: "DR. WHITMORE'S VITALITY TONIC", "RAINIER BREWING CO.", "SEATTLE SODA WORKS". The products they held are history. The bottles remain.`,
      x: -13,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%FIRST_SOUTH_MID',
        east: '%COOPERAGE',
      },
      objects: [
        { prototype: 'crate', name: 'empty bottle drifts', description: 'Glass bottles in every color and shape cover the floor—soda bottles, medicine bottles, whiskey bottles. Each one held something once.', boltedDown: true },
        { prototype: 'furniture', name: 'bottle washing troughs', description: 'Concrete troughs where bottles were sterilized before filling. The stains show where cleaning solution pooled.', boltedDown: true },
        { prototype: 'sign', name: 'old product labels', description: 'Faded paper labels for patent medicines and tonics. "GUARANTEED TO CURE ALL AILMENTS". Nothing was guaranteed.', boltedDown: true },
      ],
    },

    '%COOPERAGE': {
      name: 'Abandoned Cooperage',
      description: `The chamber served as a cooperage—a barrel-making shop that supplied the breweries and distilleries of early Seattle. The cooper's tools remain: curved drawknives, heading planes, croze cutters, each designed for a specific step in transforming wood into watertight vessels. The smell of oak and char lingers after decades.

Barrel staves are stacked against the walls, wood that was never assembled into barrels. A half-finished barrel sits on the workbench, its hoops loosely fitted, its bottom unset. The cooper walked away mid-project and never returned. The barrel has waited a century for completion.`,
      x: -12,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%BOTTLING_WORKS',
        east: '%ICE_VAULT',
      },
      objects: [
        { prototype: 'furniture', name: 'a cooper\'s bench', description: 'A heavy workbench holds barrel-making tools arranged for work that stopped mid-task. The drawknife still sits in the vice.', boltedDown: true },
        { prototype: 'crate', name: 'barrel staves', description: 'Oak staves are stacked by size—whiskey barrels, beer kegs, pickle barrels. Each stack a different curve, a different capacity.', boltedDown: true },
        { prototype: 'furniture', name: 'an unfinished barrel', description: 'A barrel sits half-assembled on the bench, its hoops loose, its bottom missing. The cooper never came back to finish it.', boltedDown: true },
      ],
    },

    '%ICE_VAULT': {
      name: 'Ice Vault',
      description: `Before refrigeration, ice was money. This vault stored blocks cut from frozen lakes, packed in sawdust, sold to restaurants and saloons and anyone who needed to keep food cold. The insulation has rotted away, but the construction tells the story: walls three feet thick, doors that sealed airtight, drains for melt water.

The ice dealers were some of the first businessmen to use the underground—natural refrigeration, hidden from the heat of summer days, cool enough to keep ice frozen for months. The trade died when mechanical refrigeration arrived. The vault found new purposes.`,
      x: -11,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%COOPERAGE',
        east: '%STORAGE_BAY',
      },
      objects: [
        { prototype: 'furniture', name: 'thick vault walls', description: 'The walls are three feet of brick and mortar, designed to hold cold. The insulation between layers has rotted to dust.', boltedDown: true },
        { prototype: 'sign', name: 'ice merchant\'s scales', description: 'A massive iron scale hangs from the ceiling, capable of weighing 500-pound blocks. The chains are rusted but intact.', boltedDown: true },
        { prototype: 'crate', name: 'sawdust drifts', description: 'Sawdust that once insulated ice blocks has compressed into solid masses. It crunches like old snow underfoot.', boltedDown: true },
      ],
    },

    '%KING_MAIN': {
      name: 'King Street Main Junction',
      description: `The passage reaches the central junction of the King Street underground, where multiple routes converge beneath the main rail station. The space is cavernous—the ceiling lost in shadow overhead, the walls distant enough to feel like a cavern rather than a tunnel.

The junction was built to handle the traffic of a major rail terminus, designed for the movement of goods and people on an industrial scale. The terminus above is quieter now, the traffic reduced, but the infrastructure below remains—waiting for loads that may never return.`,
      x: -7,
      y: -12,
      z: -2,
      population: 0,
      ambientNoise: 45,
      lighting: 25,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%KING_MID_W',
        east: '%KING_MID_E',
        north: '%OCCIDENTAL_SOUTH',
        down: '%FREIGHT_SHAFT',
      },
      objects: [
        { prototype: 'furniture', name: 'freight elevator machinery', description: 'The massive drum and cable system for a freight elevator stands silent, its gears frozen with rust. The elevator car is somewhere below, immobile.', boltedDown: true },
        { prototype: 'sign', name: 'a load capacity sign', description: 'A metal plate reads: "MAXIMUM LOAD 10,000 LBS - GREAT NORTHERN RAILWAY". The railway merged decades ago, but its infrastructure remains.', boltedDown: true },
        { prototype: 'cabinet', name: 'a switch box', description: 'An electrical switch cabinet with handles labeled "UP", "DOWN", "STOP". The power was cut long ago.', boltedDown: true },
      ],
    },

    '%OCCIDENTAL_SOUTH': {
      name: 'Occidental South Junction',
      description: `The passage reaches the junction where the King Street underground meets the southern extent of the Occidental corridor. The intersection connects the industrial tunnels to the established underground network, a transition point between different scales and purposes.`,
      x: -7,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 20,
      waterLevel: 8,
      outdoor: false,
      exits: {
        south: '%KING_MAIN',
        north: {
          to: 'underground/upper-tunnels/x-7-y-9.ts',
          description: 'The passage leads north toward the Occidental corridor',
        },
        east: '%BAGGAGE_TUNNEL',
        west: '%FREIGHT_CENTRAL',
      },
    },

    '%OCC_SOUTH_PASSAGE': {
      name: 'Occidental South Passage',
      description: `The passage runs north from the junction, connecting the King Street network to the Occidental corridor. The construction transitions from industrial to commercial as the route approaches the established underground.`,
      x: -7,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 18,
      waterLevel: 8,
      outdoor: false,
      exits: {
        south: {
          to: 'underground/upper-tunnels/x-7-y-9.ts',
          description: 'The passage leads south toward the King Street junction',
        },
        north: '%OCC_TRANSITION',
        west: '%STORAGE_BAY',
      },
    },

    '%OCC_TRANSITION': {
      name: 'Occidental Transition',
      description: `The passage widens into a chamber that marks the boundary between the industrial south and the commercial network. The change is visible in the architecture—rough-cut stone giving way to dressed brick, iron railway hardware giving way to decorative cast fixtures. Someone built a proper threshold here, a deliberate transition between worlds.

A loading platform juts from the eastern wall, its purpose unclear now but its construction suggesting significant traffic once passed this way. Iron rings are set into the stone at intervals, perhaps for securing cargo, perhaps for other purposes the builders didn't document. The platform is worn smooth by use that continued long after its official function ended.`,
      x: -7,
      y: -7,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 15,
      waterLevel: 6,
      outdoor: false,
      exits: {
        south: '%OCC_SOUTH_PASSAGE',
        north: '%OCC_SOUTH_MID',
      },
    },

    '%OCC_SOUTH_MID': {
      name: 'Occidental Passage',
      description: `The passage continues through the southern Occidental network, approaching the connection with the main underground. The construction is consistent with the established network—Victorian brick, iron fixtures, the architecture of buried commerce.`,
      x: -7,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%OCC_TRANSITION',
        north: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%OCC_S5',
          description: 'A passage leads north toward the Occidental corridor',
        },
        up: {
          to: 'buildings/union-station/z-1.ts',
          room: '%MAINTENANCE_TUNNEL',
          description: 'A service shaft rises toward the Union Station tunnels',
        },
      },
    },

    '%KING_MID_E': {
      name: 'King Street Underground',
      description: `The passage continues east beneath King Street, the industrial corridor extending toward the eastern neighborhoods. The construction remains heavy, the dimensions large, the purpose industrial despite the distance from the main rail facilities.`,
      x: 0,
      y: -12,
      z: -2,
      population: 0,
      ambientNoise: 40,
      lighting: 20,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%KING_MAIN',
        east: '%KING_EAST',
        north: '%SECOND_AVE_SOUTH',
      },
    },

    '%SECOND_AVE_SOUTH': {
      name: 'Second Avenue South Junction',
      description: `The passage reaches the junction where the King Street underground meets the routes beneath Second Avenue. The intersection connects the industrial network to the commercial underground, a transition between different worlds beneath the same streets.

A shaft descends from here into the arterial tunnel—the express route that runs the length of Pioneer Square from Yesler Way to King Street.`,
      x: 0,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 22,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%KING_MID_E',
        north: '%SECOND_SOUTH_PASSAGE',
        east: '%TRACKSIDE_1',
        west: '%MAIL_VAULT',
        down: {
          to: 'buildings/arterial-tunnel/z-3.ts',
          room: '%ARTERY_TERMINUS',
          description: 'A shaft descends to the arterial tunnel terminus',
        },
      },
    },

    '%SECOND_SOUTH_PASSAGE': {
      name: 'Second Avenue South Passage',
      description: `The passage runs north from the junction, connecting the King Street network to the established Second Avenue underground. The route shows regular traffic—the floor worn, the walls marked with the passage of many hands.`,
      x: 0,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%SECOND_AVE_SOUTH',
        north: '%SECOND_SOUTH_MID',
      },
    },

    '%SECOND_SOUTH_MID': {
      name: 'Second Avenue Passage',
      description: `The passage continues toward the connection with the main Second Avenue underground, the industrial character fading as the route approaches the commercial network.`,
      x: 0,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 20,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%SECOND_SOUTH_PASSAGE',
        north: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%PUMP_ROOM',
          description: 'A passage leads north toward the pump room',
        },
      },
    },

    '%KING_EAST': {
      name: 'King Street Underground East',
      description: `The passage reaches the eastern extent of the King Street underground, where the industrial corridor meets the routes beneath the eastern hill. The construction transitions from the heavy industrial of the rail yards to the lighter utility infrastructure of the residential neighborhoods.`,
      x: 7,
      y: -12,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 18,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%KING_MID_E',
        east: '%KING_TERMINUS',
        north: '%THIRD_AVE_SOUTH',
      },
    },

    '%THIRD_AVE_SOUTH': {
      name: 'Third Avenue South Junction',
      description: `The passage reaches the junction where the King Street underground meets the routes beneath Third Avenue, connecting the industrial network to the eastern underground.`,
      x: 7,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%KING_EAST',
        north: '%THIRD_SOUTH_PASSAGE',
        west: '%PLATFORM_EAST_2',
      },
    },

    '%THIRD_SOUTH_PASSAGE': {
      name: 'Third Avenue South Passage',
      description: `The passage runs north from the junction, connecting the King Street network to the Third Avenue underground. The construction is mixed—industrial elements giving way to utility infrastructure.`,
      x: 7,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 15,
      waterLevel: 8,
      outdoor: false,
      exits: {
        south: '%THIRD_AVE_SOUTH',
        north: '%THIRD_SOUTH_MID',
      },
    },

    '%THIRD_SOUTH_MID': {
      name: 'Third Avenue Passage',
      description: `The passage continues toward the connection with the eastern underground network, the route approaching the established passages beneath Third Avenue.`,
      x: 7,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%THIRD_SOUTH_PASSAGE',
        north: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%3RD_DEEP',
          description: 'A passage leads north toward Third Avenue',
        },
      },
    },

    '%KING_TERMINUS': {
      name: 'King Street Terminus',
      description: `The passage reaches the eastern terminus of the King Street underground, where the industrial corridor ends at the foundation of the hill. Beyond this point, the underground continues only through excavated passages that climb the slope rather than following the buried streets.

A shaft descends toward the deeper rail infrastructure, connecting the street-level tunnels to the freight passages that run beneath the tracks.`,
      x: 14,
      y: -12,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 15,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%KING_EAST',
        north: '%FOURTH_SOUTH_JUNCTION',
        down: '%DEEP_RAIL_ACCESS',
      },
    },

    '%FOURTH_SOUTH_JUNCTION': {
      name: 'Fourth Avenue South Junction',
      description: `The passage reaches the junction where the King Street underground meets the routes beneath Fourth Avenue, connecting the industrial network to the eastern utility infrastructure.`,
      x: 14,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 18,
      waterLevel: 8,
      outdoor: false,
      exits: {
        south: '%KING_TERMINUS',
        north: {
          to: 'buildings/eastside-underground/z-2.ts',
          room: '%4TH_S4',
          description: 'A passage leads north toward Fourth Avenue',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FREIGHT AND RAIL INFRASTRUCTURE
    // ═══════════════════════════════════════════════════════════════════════

    '%FREIGHT_WEST': {
      name: 'Freight Tunnel West',
      description: `The tunnel extends through the western freight infrastructure, a passage built for the movement of cargo between the waterfront and the rail yards. The construction is heavy—reinforced for the loads it was designed to carry, sized for the equipment that once moved through.

The tunnel is still accessible, the route maintained by those who find value in industrial-scale passages that avoid the surface entirely.`,
      x: -17,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 38,
      lighting: 15,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%WATERFRONT_SOUTH',
        east: '%FIRST_AVE_SOUTH',
        south: '%FREIGHT_LOADING',
      },
    },

    '%FREIGHT_LOADING': {
      name: 'Freight Loading Bay',
      description: `The tunnel opens into a loading bay built for industrial traffic—the space sized for trucks and forklifts, the floor marked with faded lines that once directed traffic, the walls showing the dents and scrapes of decades of heavy use.

The loading bay is abandoned now, the freight operations moved elsewhere, but the space remains as infrastructure for the underground network. The scale of the bay makes it useful for purposes the original builders never imagined.`,
      x: -17,
      y: -12,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%FREIGHT_WEST',
        east: '%KING_MID_W',
      },
      objects: [
        { prototype: 'bench', name: 'a loading dock', description: 'A concrete loading dock with a rusted chain-link barrier. Yellow paint on the floor marks where trucks once backed in.', boltedDown: true },
        { prototype: 'crate', name: 'abandoned pallets', description: 'A stack of wooden shipping pallets, rotting and splintered. Some still bear faded shipping labels: "FRAGILE - MACHINERY".', boltedDown: true },
        { prototype: 'sign', name: 'a dock assignment board', description: 'A chalkboard shows dock assignments in faded chalk: "DOCK 1 - ALASKA S.S. CO. / DOCK 2 - PACIFIC FREIGHT / DOCK 3 - RESERVED".', boltedDown: true },
      ],
    },

    '%FREIGHT_CENTRAL': {
      name: 'Freight Tunnel Central',
      description: `The tunnel runs through the central freight infrastructure, connecting the western loading facilities to the main rail station. The passage is dark and echoing, the sound of footsteps bouncing between walls that were designed for louder noises.`,
      x: -10,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%FIRST_AVE_SOUTH',
        east: '%OCCIDENTAL_SOUTH',
        south: '%FREIGHT_JUNCTION',
      },
    },

    '%FREIGHT_JUNCTION': {
      name: 'Freight Junction',
      description: `The tunnel reaches a junction where multiple freight routes converge, the intersection designed for the complex logistics of rail operations. Track switches and signal equipment remain in place, rusted but recognizable, the infrastructure of a transportation system that has been mostly forgotten.`,
      x: -10,
      y: -12,
      z: -2,
      population: 0,
      ambientNoise: 40,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%FREIGHT_CENTRAL',
        east: '%KING_MAIN',
        west: '%FREIGHT_LOADING',
        down: '%DEEP_FREIGHT',
      },
      objects: [
        { prototype: 'furniture', name: 'a track switching lever', description: 'A massive iron lever is set into the floor, connected to cables that disappear into the walls. The mechanism for routing freight cars still appears functional.', boltedDown: true },
        { prototype: 'sign', name: 'a switch diagram', description: 'A painted diagram on the wall shows rail routes: lines to the docks, to the station, to sidings. Some routes are marked "CLOSED" in red.', boltedDown: true },
        { prototype: 'cabinet', name: 'a signal lantern cabinet', description: 'A wall cabinet holds old railroad signal lanterns—red, green, clear glass. Some still have kerosene in their reservoirs.', boltedDown: true },
      ],
    },

    '%STORAGE_BAY': {
      name: 'Storage Bay',
      description: `The passage opens into a storage bay built for freight operations—the space divided into sections by faded paint lines, the walls lined with bracket holes where shelving once stood. The bay is empty now, the goods it once held long since moved or decayed.

The emptiness is useful in its own way. The space accommodates what the current underground needs it to accommodate.`,
      x: -10,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: '%OCC_SOUTH_PASSAGE',
        west: '%FIRST_SOUTH_MID',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STATION SERVICE CORRIDOR (y=-10, x=-6 to x=-4)
    // Infrastructure connecting Occidental to Baggage
    // ═══════════════════════════════════════════════════════════════════════

    '%STATION_SERVICE_1': {
      name: 'Steam Plant Passage',
      description: `The tunnel passes through what was once the steam plant that heated Union Station—massive boilers reduced to rusted hulks, their fireboxes cold for decades. Coal bins line one wall, still filled with anthracite that will never burn. The infrastructure of warmth, frozen in time.

Pipes run overhead in every direction, some still pressurized with something, their valves seized, their gauges reading numbers that may or may not be accurate. The hiss of steam escaping somewhere adds to the ambient noise.`,
      x: -6,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 40,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%OCCIDENTAL_SOUTH',
        east: '%STATION_SERVICE_2',
      },
      objects: [
        { prototype: 'furniture', name: 'a dead boiler', description: 'A massive industrial boiler, its riveted plates corroded, its gauge glass shattered. "BABCOCK & WILCOX - 1905" is cast into the iron.', boltedDown: true },
        { prototype: 'crate', name: 'coal storage bins', description: 'Concrete bins still hold tons of coal that will never be burned. The coal has fossilized into a solid mass.', boltedDown: true },
      ],
    },

    '%STATION_SERVICE_2': {
      name: 'Electrical Vault',
      description: `The tunnel opens into an electrical vault that once powered the station's lights and signals. Switchgear lines the walls, massive knife switches frozen in position, transformers humming with residual magnetism or perhaps still carrying current from some forgotten source.

Warning signs are everywhere: "DANGER - 4160 VOLTS", "AUTHORIZED PERSONNEL ONLY", "LOCKOUT/TAGOUT REQUIRED". The procedures are from another era. The danger may not be.`,
      x: -5,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 18,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%STATION_SERVICE_1',
        east: '%STATION_SERVICE_3',
      },
      objects: [
        { prototype: 'cabinet', name: 'vintage switchgear', description: 'Rows of electrical switches, each labeled with cryptic designations: "PLATFORM 3 LIGHTS", "SIGNAL TOWER MAIN", "EMERGENCY BACKUP".', boltedDown: true },
        { prototype: 'sign', name: 'high voltage warnings', description: 'Faded signs warn of lethal voltage. Whether any circuits remain live is unknown and untested.', boltedDown: true },
      ],
    },

    '%STATION_SERVICE_3': {
      name: 'Tool Crib',
      description: `A chamber that served as the station's maintenance tool storage—pegboards still hold wrenches and hammers, drawers contain bins of bolts sorted by size, shelving holds supplies for repairs that will never be made. The organization is meticulous, the inventory frozen at some moment when someone walked away and never returned.

A time clock on the wall still holds punch cards. The last one stamped: "JAMESON, R. - 03/15/1971 - 5:42 PM". Jameson never punched out.`,
      x: -4,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 20,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%STATION_SERVICE_2',
        east: '%BAGGAGE_TUNNEL',
      },
      objects: [
        { prototype: 'cabinet', name: 'tool storage', description: 'Pegboards and drawers hold a complete maintenance toolkit, every tool in its place, waiting for hands that will never come.', boltedDown: true },
        { prototype: 'furniture', name: 'a time clock', description: 'A mechanical time clock with a rack of punch cards. The last entry is dated 1971.', boltedDown: true },
      ],
    },

    '%BAGGAGE_TUNNEL': {
      name: 'Baggage Tunnel',
      description: `The tunnel runs through what was once the baggage handling infrastructure of the rail station—a passage designed for the movement of luggage and parcels between platforms and the main building. The conveyor systems are long gone, but the route remains, sized for wheeled carts rather than pedestrians.`,
      x: -3,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%STATION_SERVICE_3',
        east: '%MAIL_ROOM',
        south: '%BAGGAGE_CLAIM',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // POSTAL SERVICE CORRIDOR (y=-10, x=-2 to x=-1)
    // Railway mail infrastructure
    // ═══════════════════════════════════════════════════════════════════════

    '%MAIL_ROOM': {
      name: 'Railway Post Office',
      description: `The tunnel opens into what was once a Railway Post Office—mail was sorted here while trains waited, then loaded directly into mail cars for destinations across the nation. The sorting frames remain, their pigeonholes labeled with city names: CHICAGO, NEW YORK, LOS ANGELES, DENVER.

A poster on the wall shows the schedule of mail trains, connections color-coded for priority. The last mail train left Seattle in 1967. The poster awaits an update that will never come.`,
      x: -2,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%BAGGAGE_TUNNEL',
        east: '%MAIL_VAULT',
      },
      objects: [
        { prototype: 'furniture', name: 'mail sorting frames', description: 'Wooden sorting frames with slots labeled for destinations across America. The wood is worn smooth where hands placed letters for decades.', boltedDown: true },
        { prototype: 'sign', name: 'a mail train schedule', description: 'A poster shows the Railway Post Office schedule. Connections to every major city. Service terminated 1967.', boltedDown: true },
      ],
    },

    '%MAIL_VAULT': {
      name: 'Registered Mail Vault',
      description: `A reinforced chamber that once secured registered mail and valuables—the walls are thick, the door is steel, the construction meant to resist anything short of heavy equipment. The vault was emptied when rail mail service ended, but the infrastructure remains, repurposed by those who value secure storage.

Recent graffiti on the walls suggests the vault has found new uses. A gray triangle marks one corner—the Cartel's sign of claimed territory.`,
      x: -1,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%MAIL_ROOM',
        east: '%SECOND_AVE_SOUTH',
      },
      objects: [
        { prototype: 'safe', name: 'a mail vault door', description: 'The vault door stands open, its combination lock still functional, its hinges maintained. Someone uses this space.', boltedDown: true },
        { prototype: 'sign', name: 'a gray triangle', description: 'A small gray triangle scratched into the wall—the Cartel claims this vault.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TRACKSIDE CORRIDOR (y=-10, x=1 to x=3)
    // Under-platform infrastructure between Second Ave and Platform Tunnel
    // ═══════════════════════════════════════════════════════════════════════

    '%TRACKSIDE_1': {
      name: 'Signal Maintainer\'s Den',
      description: `The tunnel opens into a cramped workspace where signal maintainers once calibrated the intricate mechanisms that kept trains from colliding. Workbenches line the walls, covered with the disassembled guts of signal relays—copper contacts, spring tensioners, glass-lensed lamps in every color of the railway rainbow.

A cot in the corner suggests someone lived here, waiting for the next signal failure that would demand immediate attention. The blanket is moth-eaten. The pillow still holds the shape of a head that last rested there decades ago. On the wall, a calendar from 1968 shows a pin-up girl and the notation "MARY'S BIRTHDAY" circled in red on a date long past.`,
      x: 1,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%SECOND_AVE_SOUTH',
        east: '%TRACKSIDE_2',
      },
      objects: [
        { prototype: 'furniture', name: 'a signal workbench', description: 'A workbench holds the innards of a position-light signal—four lenses arranged in a diamond, each aimed at a different track. The mechanism is half-reassembled.', boltedDown: true },
        { prototype: 'furniture', name: 'a maintainer\'s cot', description: 'A narrow army-surplus cot with a thin mattress and moth-eaten blanket. Someone slept here between emergencies.', boltedDown: true },
        { prototype: 'sign', name: 'a pinup calendar', description: 'A 1968 calendar shows Miss August in a bathing suit. "MARY\'S BIRTHDAY - DON\'T FORGET ROSES" is written in the margin.', boltedDown: true },
      ],
    },

    '%TRACKSIDE_2': {
      name: 'Brake Shoe Storage',
      description: `The tunnel passes through a storage area for brake equipment—cast iron brake shoes stacked in rusting pyramids, wooden blocks for hand brakes, coils of brake chain hanging from hooks like metallic snakeskins. The infrastructure of stopping, gathered in one place.

The smell of brake dust permeates everything, a fine gray powder that coats every surface. It's the residue of friction, of momentum converted to heat, of the countless times trains were commanded to halt. Each shoe wears the grooves of wheels it once pressed against.

Graffiti on one wall shows a cartoon train with X's for eyes, captioned "RUNAWAY 1947 - NEVER FORGET". Someone memorialized a disaster in brake storage. The irony was probably intentional.`,
      x: 2,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%TRACKSIDE_1',
        east: '%TRACKSIDE_3',
      },
      objects: [
        { prototype: 'crate', name: 'brake shoe pyramids', description: 'Cast iron brake shoes are stacked in neat pyramids, each stamped with manufacturer marks: "WESTINGHOUSE AIR BRAKE CO." The iron is pitted with rust.', boltedDown: true },
        { prototype: 'furniture', name: 'hanging brake chains', description: 'Coils of chain hang from ceiling hooks, each link sized for freight car brakes. Some chains still show grease.', boltedDown: true },
        { prototype: 'sign', name: 'memorial graffiti', description: 'A cartoon train with X-ed out eyes. "RUNAWAY 1947 - NEVER FORGET". Someone added: "12 dead, 47 injured, 0 accountable".', boltedDown: true },
      ],
    },

    '%TRACKSIDE_3': {
      name: 'Conductor\'s Refuge',
      description: `A small chamber that served as an emergency refuge for conductors and brakemen caught between trains—a steel-reinforced bunker sized for three men standing, built into the tunnel wall where workers could press themselves flat as locomotives thundered past inches away.

The refuge is wider than most, suggesting this was a known danger point, a place where the geometry of the tunnels created blind spots that required extraordinary caution. The walls are scratched with initials and dates—men who sheltered here and lived to carve their names. Not all names have dates after them.

A notice board holds faded safety bulletins: "ALWAYS WATCH FOR SECOND SECTION", "LISTEN FOR THREE WHISTLES", "WHEN IN DOUBT, TAKE REFUGE". The advice is timeless. The trains that prompted it are gone.`,
      x: 3,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 8,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%TRACKSIDE_2',
        east: '%PLATFORM_TUNNEL',
      },
      objects: [
        { prototype: 'sign', name: 'carved initials', description: 'Names and dates scratched into the steel walls. "JB 1923", "TOMMY M 1931", "WILSON & CRANE 1945". Some entries have no dates.', boltedDown: true },
        { prototype: 'sign', name: 'safety bulletins', description: 'Faded paper notices warn of specific dangers: blind curves, deaf spots, known collision points. The ink is brown with age.', boltedDown: true },
        { prototype: 'furniture', name: 'a refuge bench', description: 'A narrow steel bench is bolted to the wall—room for three men to sit while waiting for danger to pass.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EASTERN PLATFORM CORRIDOR (y=-10, x=5 to x=6)
    // Under-platform infrastructure between Platform Tunnel and Third Ave
    // ═══════════════════════════════════════════════════════════════════════

    '%PLATFORM_EAST_1': {
      name: 'Ice House Passage',
      description: `The tunnel passes through what was once the railway ice house—a refrigerated chamber where blocks of ice were stored to cool passenger cars before air conditioning made them obsolete. The insulation is rotting from the walls, revealing layers of sawdust and cork designed to trap cold.

Massive iron hooks hang from overhead rails, the infrastructure for moving 300-pound ice blocks with relative ease. The hooks are rusted now, the rails frozen, but the geometry of ice handling remains legible in the architecture.

A thermometer mounted on the wall still shows temperature in Fahrenheit. The mercury is pooled at the bottom, escaped from its tube decades ago. The room hasn't been cold for a very long time.`,
      x: 5,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%PLATFORM_TUNNEL',
        east: '%PLATFORM_EAST_2',
      },
      objects: [
        { prototype: 'furniture', name: 'ice hooks', description: 'Heavy iron hooks hang from an overhead rail system, designed for sliding 300-pound ice blocks. The rails are frozen with rust.', boltedDown: true },
        { prototype: 'furniture', name: 'a broken thermometer', description: 'A large wall thermometer shows no reading—the mercury has escaped and pooled at the bottom of its tube.', boltedDown: true },
        { prototype: 'crate', name: 'rotting insulation', description: 'Chunks of cork and sawdust insulation have fallen from the walls, revealing the brick underneath.', boltedDown: true },
      ],
    },

    '%PLATFORM_EAST_2': {
      name: 'Expressman\'s Office',
      description: `A small office that once belonged to the Railway Express Agency—the shipping company that handled everything from perishables to prize livestock, from mail-order brides' trousseaus to racing pigeons in ventilated crates. The expressman was a logistics genius, routing packages across a continent using railroads as arteries.

The desk remains, covered with faded routing forms and carbon-paper manifests. A map on the wall shows the American rail network circa 1952, with penciled annotations marking preferred routes for different classes of freight: "EGGS - AVOID MOUNTAIN DIVISION", "LIVESTOCK - WATER STOPS MANDATORY", "DYNAMITE - SPECIAL HANDLING ONLY".

A safe in the corner stands open, its door hanging from one hinge. Whatever cash-on-delivery payments it once held are long gone. The combination is still taped to the inside of the door—someone trusted the isolation more than the lock.`,
      x: 6,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%PLATFORM_EAST_1',
        east: '%THIRD_AVE_SOUTH',
      },
      objects: [
        { prototype: 'furniture', name: 'an expressman\'s desk', description: 'A wooden desk buried under faded manifests and routing slips. "REA EXPRESS - NATIONWIDE SERVICE" letterhead on every form.', boltedDown: true },
        { prototype: 'sign', name: 'a rail network map', description: 'A 1952 railroad map covers one wall, every major line marked, with handwritten routing notes in the margins.', boltedDown: true },
        { prototype: 'safe', name: 'a broken express safe', description: 'A small safe stands open, its combination taped inside the door: "32-14-7". Whatever it protected is long gone.', boltedDown: true },
      ],
    },

    '%BAGGAGE_CLAIM': {
      name: 'Old Baggage Claim',
      description: `The tunnel opens into what was once a baggage claim area—the carousels long since removed, the space now empty except for the columns that once supported the equipment. The floor shows the marks where the carousels once spun, the traces of a system designed for a different era of travel.`,
      x: -3,
      y: -12,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%BAGGAGE_TUNNEL',
        east: '%KING_MAIN',
        down: '%DEEP_BAGGAGE',
      },
      objects: [
        { prototype: 'furniture', name: 'a carousel frame', description: 'The steel frame of a baggage carousel remains bolted to the floor, its belt and rollers removed. The outline shows where travelers once waited.', boltedDown: true },
        { prototype: 'crate', name: 'an unclaimed trunk', description: 'A battered steamer trunk sits in the corner, its owner\'s name painted on the side: "MRS. HAROLD SINCLAIR - TACOMA". She never came back for it.', boltedDown: true },
        { prototype: 'sign', name: 'a claim check board', description: 'A board with hooks for claim checks still hangs on the wall. A few yellowed tickets remain: "CLAIM #4471 - HOLD FOR PASSENGER".', boltedDown: true },
      ],
    },

    '%PLATFORM_TUNNEL': {
      name: 'Platform Tunnel',
      description: `The tunnel runs beneath the rail platforms, a service passage built for workers who needed to access the infrastructure beneath the tracks. The tunnel is cramped by industrial standards, sized for people rather than freight, the ceiling low enough to require ducking in places.

The rumble of trains overhead is constant when service is running, the vibration making the walls hum and dust fall from the ceiling. Between trains, the silence feels unnatural.`,
      x: 4,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 45,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%TRACKSIDE_3',
        east: '%PLATFORM_EAST_1',
        south: '%PLATFORM_ACCESS',
      },
    },

    '%PLATFORM_ACCESS': {
      name: 'Platform Access',
      description: `The tunnel reaches an access point to the rail platforms above—a ladder rising through a vertical shaft toward a hatch that opens onto the platform level. The access is still used by maintenance crews, the route official if rarely traveled.

The hatch is locked from the surface side, but the lock is old and the mechanism familiar to those who have studied it.`,
      x: 4,
      y: -12,
      z: -2,
      population: 0,
      ambientNoise: 40,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%PLATFORM_TUNNEL',
        down: '%DEEP_PLATFORM',
      },
      objects: [
        { prototype: 'furniture', name: 'maintenance ladder', description: 'A steel ladder is bolted to the wall, rising toward a hatch in the ceiling. The hatch has a heavy padlock, but the hasp is loose.', boltedDown: true },
        { prototype: 'sign', name: 'a platform diagram', description: 'A faded diagram shows the platforms above: "TRACK 1 - COAST STARLIGHT / TRACK 2 - EMPIRE BUILDER / TRACK 3 - LOCAL SERVICE".', boltedDown: true },
        { prototype: 'cabinet', name: 'a tool locker', description: 'A metal locker holds railroad maintenance tools: track gauges, spike mauls, lanterns. The Amtrak logo is scratched but visible.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP SECTIONS (z=-3 connections)
    // ═══════════════════════════════════════════════════════════════════════

    '%FREIGHT_SHAFT': {
      name: 'Freight Shaft',
      description: `A massive shaft descends from the King Street junction toward the deeper freight infrastructure—a vertical route built for cargo elevators that no longer function. The shaft is large enough to lower vehicles, the scale industrial rather than human.

Iron rungs line one wall, providing a climbing route for those willing to descend without mechanical assistance. The climb is long. The darkness at the bottom is complete.`,
      x: -7,
      y: -12,
      z: -3,
      population: 0,
      ambientNoise: 35,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        up: '%KING_MAIN',
        south: '%DEEP_FREIGHT_MAIN',
        east: '%DEEP_KING_MID',
      },
      objects: [
        { prototype: 'furniture', name: 'the shaft cage', description: 'A rusted freight elevator cage sits at the bottom of the shaft, its cables long since cut. The frame would still hold, but there\'s no way to raise it.', boltedDown: true },
        { prototype: 'sign', name: 'a depth marker', description: 'Painted numbers mark depth intervals on the shaft wall: "40 FT... 60 FT... 80 FT". Someone has added in chalk: "100 FT - bottom".', boltedDown: true },
      ],
    },

    '%DEEP_FREIGHT': {
      name: 'Deep Freight Passage',
      description: `The shaft descends into the deep freight infrastructure, where the industrial tunnels run beneath the rail yards. The passage is large—sized for the freight that once moved through, now empty but still functional.`,
      x: -10,
      y: -12,
      z: -3,
      population: 0,
      ambientNoise: 40,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        up: '%FREIGHT_JUNCTION',
        east: '%DEEP_FREIGHT_MAIN',
        west: '%DEEP_WATERFRONT_CONN',
      },
    },

    '%DEEP_WATERFRONT_CONN': {
      name: 'Deep Waterfront Connection',
      description: `The passage extends west toward the deep waterfront network, connecting the freight infrastructure to the smuggler tunnels beneath the piers. The route is maintained by those who value mobility between the industrial and maritime underground.`,
      x: -14,
      y: -12,
      z: -3,
      population: 0,
      ambientNoise: 35,
      lighting: 8,
      waterLevel: 15,
      outdoor: false,
      exits: {
        east: '%DEEP_FREIGHT',
        north: {
          to: 'buildings/waterfront-underground/z-3.ts',
          room: '%DEEP_SOUTH_CONN',
          description: 'A passage leads north toward the waterfront depths',
        },
      },
    },

    '%DEEP_FREIGHT_MAIN': {
      name: 'Deep Freight Main',
      description: `The passage runs through the main deep freight corridor, connecting the various shafts and tunnels that serve the rail infrastructure. The construction is heavy, the scale industrial, the purpose the movement of goods that never touched the surface.`,
      x: -7,
      y: -10,
      z: -3,
      population: 0,
      ambientNoise: 45,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%FREIGHT_SHAFT',
        west: '%DEEP_FREIGHT',
        east: '%DEEP_KING_MID',
        south: '%DEEP_RAIL_JUNCTION',
      },
    },

    '%DEEP_KING_MID': {
      name: 'Deep King Street',
      description: `The passage runs beneath King Street at the deepest accessible level, connecting the freight infrastructure to the rail tunnels. The construction is consistent—industrial scale, heavy reinforcement, the architecture of cargo movement.

A utility shaft descends from here, connecting to the deep connector network that spans the z=-4 level.`,
      x: 0,
      y: -10,
      z: -3,
      population: 0,
      ambientNoise: 42,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%DEEP_FREIGHT_MAIN',
        east: '%DEEP_KING_EAST',
        north: '%DEEP_BAGGAGE',
        down: {
          to: 'buildings/deep-connector/z-4.ts',
          room: '%INDUSTRIAL_DEEP',
          description: 'A utility shaft descends to the deep connector',
        },
      },
    },

    '%DEEP_BAGGAGE': {
      name: 'Deep Baggage Level',
      description: `The shaft from the baggage claim above descends into a deeper storage level, where baggage that was never claimed eventually accumulated before being disposed of or repurposed. The level is empty now, the unclaimed luggage dealt with long ago.`,
      x: -3,
      y: -12,
      z: -3,
      population: 0,
      ambientNoise: 20,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        up: '%BAGGAGE_CLAIM',
        south: '%DEEP_KING_MID',
      },
    },

    '%DEEP_PLATFORM': {
      name: 'Deep Platform Level',
      description: `The shaft descends beneath the platform access into a maintenance level that serves the rail infrastructure from below. The space is cramped, the ceiling low, the purpose purely utilitarian—access to the underside of the tracks.`,
      x: 4,
      y: -12,
      z: -3,
      population: 0,
      ambientNoise: 50,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        up: '%PLATFORM_ACCESS',
        west: '%DEEP_KING_MID',
        east: '%DEEP_KING_EAST',
      },
    },

    '%DEEP_KING_EAST': {
      name: 'Deep King Street East',
      description: `The passage extends east through the deep King Street network, approaching the connection with the eastern underground. The construction transitions from heavy industrial to lighter utility infrastructure.`,
      x: 7,
      y: -10,
      z: -3,
      population: 0,
      ambientNoise: 35,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%DEEP_KING_MID',
        north: '%DEEP_PLATFORM',
        east: '%DEEP_RAIL_ACCESS',
      },
    },

    '%DEEP_RAIL_ACCESS': {
      name: 'Deep Rail Access',
      description: `The passage reaches the deep rail access point, where the King Street underground meets the freight tunnels beneath the eastern tracks. The connection links the street-level network to the rail infrastructure.`,
      x: 14,
      y: -12,
      z: -3,
      population: 0,
      ambientNoise: 45,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        up: '%KING_TERMINUS',
        west: '%DEEP_KING_EAST',
        north: {
          to: 'buildings/eastside-underground/z-3.ts',
          room: '%RAIL_TUNNEL_E',
          description: 'A passage leads north toward the eastern rail tunnels',
        },
      },
    },

    '%DEEP_RAIL_JUNCTION': {
      name: 'Deep Rail Junction',
      description: `The passage reaches a junction where the deep freight infrastructure meets the rail tunnels, the intersection of routes that serve different aspects of the transportation network. The junction is maintained, the routes active despite their unofficial status.`,
      x: -7,
      y: -12,
      z: -3,
      population: 0,
      ambientNoise: 50,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%DEEP_FREIGHT_MAIN',
        east: {
          to: 'buildings/eastside-underground/z-3.ts',
          room: '%RAIL_WEST_TERMINUS',
          description: 'A passage leads east toward the rail tunnels',
        },
      },
      objects: [
        { prototype: 'sign', name: 'a worker\'s memorial', description: 'A small brass plaque is bolted to the wall: "IN MEMORY OF THE TUNNEL WORKERS - 1903-1906 - TWELVE MEN GAVE THEIR LIVES". Below, someone added: "we remember".', boltedDown: true },
        { prototype: 'sign', name: 'union graffiti', description: 'Faded paint reads: "IWW LOCAL 10 - AN INJURY TO ONE IS AN INJURY TO ALL". The Wobblies organized these tunnels a century ago.', boltedDown: true },
      ],
    },
  },
};
