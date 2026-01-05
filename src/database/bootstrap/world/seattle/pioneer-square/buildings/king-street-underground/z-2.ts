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
        north: '%FIRST_SOUTH_PASSAGE',
        east: '%FREIGHT_CENTRAL',
        west: '%FREIGHT_WEST',
      },
      objects: [
        { prototype: 'sign', name: 'a railway timetable', description: 'A massive iron-framed timetable shows arrivals and departures. The trains listed haven\'t run since 1971, but the board remains, frozen in time.', boltedDown: true },
        { prototype: 'bench', name: 'a cargo scale platform', description: 'A massive industrial scale platform is set into the floor, its dial frozen at 2,347 pounds—the weight of some long-forgotten load.', boltedDown: true },
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
        south: '%FIRST_AVE_SOUTH',
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
        east: '%STORAGE_BAY',
      },
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
        north: '%OCC_SOUTH_PASSAGE',
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
        south: '%OCCIDENTAL_SOUTH',
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
        east: '%PLATFORM_TUNNEL',
        west: '%BAGGAGE_TUNNEL',
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
        west: '%PLATFORM_TUNNEL',
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
        west: '%OCCIDENTAL_SOUTH',
        east: '%SECOND_AVE_SOUTH',
        south: '%BAGGAGE_CLAIM',
      },
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
        west: '%SECOND_AVE_SOUTH',
        east: '%THIRD_AVE_SOUTH',
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
