// Eastside Underground - Level z=-2 (Hill Tunnels)
// Beneath 4th Avenue S (x=+14) and the eastern hill
// Steam tunnels, utility passages, and basement connections

export const building = {
  name: 'Eastside Underground',
  x: 7,
  y: -6,
  width: 10,
  height: 16,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // THIRD AVENUE DEEP (connecting from underground-east to 4th Ave)
    // ═══════════════════════════════════════════════════════════════════════

    '%3RD_DEEP': {
      name: 'Third Avenue Depths',
      description: `The passage extends east from the Third Avenue basement, descending through newer excavation that was carved after the original underground was established. The walls show the marks of modern tools—pneumatic drills rather than picks, shaped charges rather than shovels—the work of people with resources and urgency.

The construction is professional but hasty, the engineering adequate but not elegant. Someone needed to extend the network quickly. The result serves function without pretense.`,
      x: 8,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%3RD_BASEMENT',
          description: 'A passage leads west toward Third Avenue',
        },
        east: '%STEAM_TUNNEL_W',
      },
    },

    '%STEAM_TUNNEL_W': {
      name: 'Steam Tunnel West',
      description: `The passage enters the city's steam tunnel network—a labyrinth of passages built to carry heating and utilities between buildings. The tunnels are warmer than the surrounding underground, pipes running along the walls carrying steam that still heats buildings above.

The infrastructure is maintained, the pipes insulated, the passages lit with industrial fixtures that still function. The city uses these tunnels. The city's unofficial residents use them too.`,
      x: 10,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%3RD_DEEP',
        east: '%STEAM_MAIN',
        north: '%STEAM_N1',
        south: '%STEAM_S1',
      },
    },

    '%STEAM_MAIN': {
      name: 'Steam Main Junction',
      description: `The tunnel opens into a junction where multiple steam lines converge, the infrastructure of the city's heating system displayed in corroded pipes and sweating insulation. Valves the size of steering wheels control flow through the system, their positions set by engineers who probably don't know about the traffic that passes through this junction.

The heat is significant here—the proximity to live steam making the air thick and hot, sweat forming on any exposed skin. Extended stays are uncomfortable. Brief passages are tolerable.`,
      x: 12,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 40,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%STEAM_TUNNEL_W',
        east: '%4TH_ACCESS',
        north: '%STEAM_N2',
        south: '%STEAM_S2',
      },
    },

    '%4TH_ACCESS': {
      name: 'Fourth Avenue Access',
      description: `The steam tunnel reaches the foundations of buildings along Fourth Avenue, the eastern edge of the original underground network. Here the construction is newer—mid-twentieth century rather than post-fire—the infrastructure installed during urban renewal projects that knew nothing of the passages they connected to.

A vertical shaft rises toward the surface, its maintenance ladder still in regular use by utility workers who focus on the pipes and ignore the passages. The official purpose provides cover for unofficial traffic.`,
      x: 14,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 28,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%STEAM_MAIN',
        north: '%4TH_N1',
        south: '%4TH_S1',
        up: {
          to: '4th-ave-s/y0.ts',
          description: 'A maintenance shaft rises to Fourth Avenue',
          hidden: true,
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NORTHERN STEAM SECTION (toward Yesler)
    // ═══════════════════════════════════════════════════════════════════════

    '%STEAM_N1': {
      name: 'Steam Tunnel',
      description: `The tunnel runs north through the steam distribution network, pipes of varying sizes running along the walls and ceiling. The heat varies with distance from the main junction—cooler here, the steam having lost energy to the buildings it serves.`,
      x: 10,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 28,
      lighting: 22,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STEAM_TUNNEL_W',
        north: '%STEAM_N3',
        east: '%STEAM_N2',
      },
    },

    '%STEAM_N2': {
      name: 'Steam Tunnel',
      description: `The tunnel continues through the network, the passage widening where multiple buildings' connections converge. The infrastructure shows decades of modifications—new pipes added alongside old, insulation replaced in patches, the system evolving rather than being rebuilt.`,
      x: 12,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 32,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STEAM_MAIN',
        west: '%STEAM_N1',
        north: '%BOILER_ROOM',
      },
    },

    '%STEAM_N3': {
      name: 'Steam Tunnel',
      description: `The tunnel approaches the edge of the steam network, the pipes branching toward individual building connections. The passage narrows as it moves away from the main distribution routes, sized for maintenance access rather than traffic.`,
      x: 10,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STEAM_N1',
        east: '%BOILER_ROOM',
      },
    },

    '%BOILER_ROOM': {
      name: 'Old Boiler Room',
      description: `The tunnel opens into a chamber dominated by the massive hulk of a steam boiler that has been cold for decades. The boiler was once the heart of a building's heating system, now abandoned when more efficient equipment replaced it. The building above was renovated; the boiler was left behind, too large to remove economically.

The chamber serves as a waystation in the eastern underground—a space large enough to gather, warm enough to be comfortable, hidden enough to be useful. The cold boiler watches over whatever activities occur in its shadow.`,
      x: 12,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STEAM_N2',
        west: '%STEAM_N3',
        north: '%UTILITY_NORTH',
        east: '%4TH_N2',
      },
    },

    '%4TH_N1': {
      name: 'Fourth Avenue Passage',
      description: `The passage runs north along the Fourth Avenue foundations, a utility corridor that was built to serve the buildings above and has been repurposed to serve the network below. The construction is functional—concrete floors, steel supports, industrial lighting that still works because the city still maintains it.`,
      x: 14,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%4TH_ACCESS',
        north: '%4TH_N2',
      },
    },

    '%4TH_N2': {
      name: 'Fourth Avenue Passage',
      description: `The passage continues north through the utility infrastructure, the corridor showing less maintenance as it moves away from the main access points. The lights here are fewer, some burned out and not replaced, the darkness encroaching from both ends of the passage.`,
      x: 14,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%4TH_N1',
        west: '%BOILER_ROOM',
        north: '%4TH_N3',
      },
    },

    '%4TH_N3': {
      name: 'Fourth Avenue Passage',
      description: `The passage reaches the edge of the maintained utility network, the corridor showing the transition from active infrastructure to abandoned space. The pipes here are cold, the conduits empty, the systems that once served the buildings above long since decommissioned.`,
      x: 14,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%4TH_N2',
        north: '%BASEMENT_RUINS',
        west: '%UTILITY_NORTH',
      },
    },

    '%UTILITY_NORTH': {
      name: 'Northern Utility Corridor',
      description: `The corridor connects the steam tunnels to the Fourth Avenue infrastructure, running through a section that shows the layered history of urban development—nineteenth century brick beneath twentieth century concrete beneath twenty-first century cable runs.`,
      x: 12,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%BOILER_ROOM',
        east: '%4TH_N3',
        north: '%CABLE_RUN',
      },
    },

    '%CABLE_RUN': {
      name: 'Cable Run',
      description: `The passage is dominated by cable trays running along both walls—telecommunications infrastructure installed during the digital age, carrying fiber and copper between buildings. The cables are still active, their status indicated by blinking lights on junction boxes that punctuate the passage.

Someone who understood these cables could tap into remarkable amounts of data. Someone already does.`,
      x: 12,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 22,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%UTILITY_NORTH',
        north: '%JUNCTION_BOX',
        east: '%BASEMENT_RUINS',
      },
    },

    '%JUNCTION_BOX': {
      name: 'Junction Box Chamber',
      description: `The passage opens into a chamber dominated by telecommunications equipment—junction boxes, patch panels, the infrastructure that connects the city's digital nervous system. The equipment hums with the constant flow of data, lights blinking in patterns that indicate traffic volumes no human could read.

The chamber is maintained by people who come through official channels, entering through locked doors that require keys and authorization. The underground connection is not on any diagram. The traffic that passes through is not logged.`,
      x: 12,
      y: 5,
      z: -2,
      population: 0,
      ambientNoise: 28,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%CABLE_RUN',
        west: '%YESLER_EAST',
      },
    },

    '%YESLER_EAST': {
      name: 'Eastern Yesler Access',
      description: `The passage reaches the eastern extent of the Yesler Way underground, where the hill's slope creates vertical separation between the street level and the tunnel network. A shaft rises toward the surface here, its upper end emerging somewhere along the eastern edge of Yesler Way.

The shaft is maintained, the ladder rungs solid, the route used by those who need access to the eastern hill without passing through the main underground corridors.`,
      x: 10,
      y: 5,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%JUNCTION_BOX',
        up: {
          to: 'yesler-way/x7.ts',
          description: 'A shaft rises toward Yesler Way',
          hidden: true,
        },
        south: '%EAST_PASSAGE',
      },
    },

    '%EAST_PASSAGE': {
      name: 'Eastern Passage',
      description: `The passage runs south from the Yesler access, connecting the northern sections of the eastern underground to the main network. The construction is varied—utility corridor giving way to older basement, giving way to excavated tunnel—the route assembled from whatever spaces were available.`,
      x: 10,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%YESLER_EAST',
        south: '%STEAM_N3',
        east: '%CABLE_RUN',
      },
    },

    '%BASEMENT_RUINS': {
      name: 'Basement Ruins',
      description: `The passage opens into the ruined basement of a building that was demolished decades ago, the foundation walls still standing though the structure above is long gone. The basement has been claimed by the underground—its floor broken through to connect to deeper passages, its walls breached to connect to neighboring spaces.

Debris litters the floor: fragments of the building that once stood here, materials left by those who've passed through, the accumulated refuse of abandonment. Among the debris, paths show where regular traffic has cleared routes through the chaos.`,
      x: 14,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        south: '%4TH_N3',
        west: '%CABLE_RUN',
        down: '%RUBBLE_DESCENT',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN STEAM SECTION (toward King St)
    // ═══════════════════════════════════════════════════════════════════════

    '%STEAM_S1': {
      name: 'Steam Tunnel',
      description: `The tunnel runs south from the western junction, carrying steam distribution lines toward the buildings that line the southern avenues. The heat is constant, the pipes sweating condensation that drips onto the walkway below.`,
      x: 10,
      y: -1,
      z: -2,
      population: 0,
      ambientNoise: 28,
      lighting: 22,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%STEAM_TUNNEL_W',
        south: '%STEAM_S3',
        east: '%STEAM_S2',
      },
    },

    '%STEAM_S2': {
      name: 'Steam Tunnel',
      description: `The tunnel continues through the steam distribution network, the pipes showing their age in rust and patched insulation. The heat varies as valves open and close automatically, responding to demands from the buildings above.`,
      x: 12,
      y: -1,
      z: -2,
      population: 0,
      ambientNoise: 32,
      lighting: 25,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%STEAM_MAIN',
        west: '%STEAM_S1',
        south: '%STEAM_S4',
      },
    },

    '%STEAM_S3': {
      name: 'Steam Tunnel',
      description: `The tunnel approaches the edge of the active steam network, the pipes branching toward final connections. The passage narrows, sized for the infrastructure it carries rather than the traffic that uses it.`,
      x: 10,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%STEAM_S1',
        south: '%TRANSFORMER_ROOM',
        east: '%STEAM_S4',
      },
    },

    '%STEAM_S4': {
      name: 'Steam Tunnel',
      description: `The tunnel reaches a junction where the steam lines split toward different building clusters, the infrastructure showing the logic of the city's heating system. The passage is larger here, sized to accommodate the converging lines.`,
      x: 12,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 22,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%STEAM_S2',
        west: '%STEAM_S3',
        east: '%4TH_S2',
        south: '%UTILITY_SOUTH',
      },
    },

    '%4TH_S1': {
      name: 'Fourth Avenue Passage',
      description: `The passage runs south along the Fourth Avenue foundations, the utility corridor extending toward the southern reaches of the underground network. The construction is consistent—the same industrial aesthetic, the same functional design—extending the network's eastern edge.`,
      x: 14,
      y: -1,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 22,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%4TH_ACCESS',
        south: '%4TH_S2',
      },
    },

    '%4TH_S2': {
      name: 'Fourth Avenue Passage',
      description: `The passage continues south, the corridor showing less maintenance as it approaches the edge of the active network. The infrastructure here is older, the systems decommissioned, the space repurposed for passage rather than utility.`,
      x: 14,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%4TH_S1',
        west: '%STEAM_S4',
        south: '%4TH_S3',
      },
    },

    '%4TH_S3': {
      name: 'Fourth Avenue Passage',
      description: `The passage reaches the southern extent of the Fourth Avenue underground, the corridor ending at a junction with older passages that predate the utility network. The transition marks the boundary between maintained infrastructure and abandoned depths.`,
      x: 14,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 12,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%4TH_S2',
        west: '%UTILITY_SOUTH',
        south: '%4TH_S4',
      },
    },

    '%4TH_S4': {
      name: 'Southern Fourth Avenue',
      description: `The passage extends into the southern underground, where the eastern network meets the passages beneath King Street. The construction is older here, rougher, the work of earlier decades rather than recent extension.

A vertical shaft descends toward deeper levels, the route marked by iron rungs set into the wall. The descent leads toward the rail yard tunnels, where the underground meets the infrastructure of freight and transit.`,
      x: 14,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 10,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%4TH_S3',
        west: '%SOUTH_TUNNEL_E',
        down: '%RAIL_ACCESS',
      },
    },

    '%TRANSFORMER_ROOM': {
      name: 'Transformer Room',
      description: `The passage opens into a chamber dominated by electrical transformers—massive coils of copper and iron that step down voltage for the buildings above. The transformers hum with contained power, the sound a constant presence that makes the air feel thick.

The equipment is still active, still serving its purpose, maintained by workers who enter through surface access points. The underground connection is not official. The traffic that uses it is not monitored.

WARNING signs in multiple languages warn of electrical hazard. The warnings are accurate. The transformers could kill someone who touched the wrong thing.`,
      x: 10,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 45,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%STEAM_S3',
        south: '%SOUTH_TUNNEL_W',
        east: '%UTILITY_SOUTH',
      },
    },

    '%UTILITY_SOUTH': {
      name: 'Southern Utility Corridor',
      description: `The corridor connects the steam tunnels to the Fourth Avenue infrastructure, running through sections that show the transition from active systems to abandoned passages. The infrastructure overhead is dead—pipes that carry nothing, cables that serve nothing—the systems decommissioned as the buildings they served were demolished or renovated.`,
      x: 12,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%STEAM_S4',
        west: '%TRANSFORMER_ROOM',
        east: '%4TH_S3',
        south: '%SOUTH_JUNCTION_E',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN SECTIONS (connecting to King Street tunnels)
    // ═══════════════════════════════════════════════════════════════════════

    '%SOUTH_TUNNEL_W': {
      name: 'Southern Tunnel',
      description: `The passage runs south from the transformer room, descending gradually toward the King Street level. The construction is older here—hand-carved rather than machine-cut, the work of earlier generations who extended the network with picks and shovels.`,
      x: 10,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%TRANSFORMER_ROOM',
        east: '%SOUTH_JUNCTION_E',
        south: '%SOUTH_TERMINUS',
      },
    },

    '%SOUTH_JUNCTION_E': {
      name: 'Southern Junction',
      description: `The passage reaches a junction where the eastern underground meets routes running toward King Street. The junction shows the marks of multiple construction eras—Victorian brick giving way to twentieth century concrete giving way to rougher excavation that might be from any decade.`,
      x: 12,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%UTILITY_SOUTH',
        west: '%SOUTH_TUNNEL_W',
        east: '%4TH_S4',
        south: '%KING_APPROACH',
      },
    },

    '%SOUTH_TUNNEL_E': {
      name: 'Southern Tunnel',
      description: `The passage extends west from the Fourth Avenue terminus, connecting the eastern underground to the main network beneath the city's southern edge. The construction is varied—utility corridor giving way to older passage, the route assembled from available spaces.`,
      x: 12,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 10,
      outdoor: false,
      exits: {
        east: '%4TH_S4',
        west: '%SOUTH_JUNCTION_E',
      },
    },

    '%SOUTH_TERMINUS': {
      name: 'Southern Terminus',
      description: `The passage ends at the edge of the maintained network, the corridor giving way to rougher excavation that continues south toward King Street. The transition marks the boundary between the eastern underground and the industrial tunnels beneath the rail yards.

A narrow passage continues west toward the main underground network, connecting the eastern sections to the established routes.`,
      x: 10,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 8,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%SOUTH_TUNNEL_W',
        west: {
          to: 'underground/upper-tunnels/supply-junction.ts',
          description: 'A passage leads west toward the supply routes',
        },
      },
    },

    '%KING_APPROACH': {
      name: 'King Street Approach',
      description: `The passage descends toward King Street, the route growing rougher as it approaches the industrial underground beneath the rail yards. The air changes here—grease and diesel mixing with the mineral smell of deep earth, the influence of the trains making itself felt even this far below.`,
      x: 12,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 10,
      waterLevel: 12,
      outdoor: false,
      exits: {
        north: '%SOUTH_JUNCTION_E',
        south: '%KING_ACCESS',
      },
    },

    '%KING_ACCESS': {
      name: 'King Street Access',
      description: `The passage reaches the edge of the King Street underground, where the utility network meets the industrial tunnels beneath the rail yards. A shaft descends toward deeper levels, connecting to the freight passages that run beneath the tracks.

The access is maintained but not official—the route used by those who need to move between the eastern underground and the rail infrastructure without using surface streets.`,
      x: 12,
      y: -6,
      z: -2,
      population: 0,
      ambientNoise: 28,
      lighting: 12,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%KING_APPROACH',
        down: '%RAIL_TUNNEL_E',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP SECTIONS (z=-3 connections)
    // ═══════════════════════════════════════════════════════════════════════

    '%RUBBLE_DESCENT': {
      name: 'Rubble Descent',
      description: `A precarious route descends through the basement ruins, following paths cleared through debris that settled decades ago. The descent is possible but risky—the rubble shifting occasionally, the route changing as materials find new configurations under the pressure of gravity.`,
      x: 14,
      y: 4,
      z: -3,
      population: 0,
      ambientNoise: 8,
      lighting: 3,
      waterLevel: 15,
      outdoor: false,
      exits: {
        up: '%BASEMENT_RUINS',
        west: '%DEEP_EAST_N',
      },
    },

    '%RAIL_ACCESS': {
      name: 'Rail Access Shaft',
      description: `The shaft descends from the Fourth Avenue terminus toward the rail tunnels, the iron rungs showing the wear of regular use. The route connects the eastern underground to the freight infrastructure, a vertical link between the city's upper network and its industrial depths.`,
      x: 14,
      y: -4,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        up: '%4TH_S4',
        west: '%DEEP_EAST_S',
      },
    },
  },
};
