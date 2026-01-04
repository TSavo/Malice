// Eastside Underground - Level z=-3 (Deep Eastern Network)
// Beneath 4th Avenue and the eastern hill
// Connecting the eastern sections to the established deep network

export const building = {
  name: 'Eastside Underground',
  x: 7,
  y: -6,
  width: 10,
  height: 12,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // DEEP EASTERN CORRIDOR (connecting north to south)
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_EAST_N': {
      name: 'Deep Eastern Passage',
      description: `The passage extends south from the rubble descent, running through earth that was excavated rather than inherited. The walls show the marks of tools rather than the patterns of water or time, the route carved by people who needed to extend the network eastward.

The construction is rough but stable, the shoring adequate for the soil conditions, the passage sized for single-file traffic. This is a functional route, not a comfortable one.`,
      x: 12,
      y: 4,
      z: -3,
      population: 0,
      ambientNoise: 10,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        east: '%RUBBLE_DESCENT',
        south: '%DEEP_EAST_MID',
        west: '%DEEP_CONNECTOR',
      },
    },

    '%DEEP_CONNECTOR': {
      name: 'Deep Connector',
      description: `The passage connects the eastern deep sections to the established network beneath Occidental and Second Avenue. The transition is marked by a change in construction—rough excavation giving way to older, more established passages that show the marks of decades of use.`,
      x: 8,
      y: 4,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        east: '%DEEP_EAST_N',
        west: {
          to: 'buildings/underground-east/z-3.ts',
          room: '%CABLE_VAULT',
          description: 'A passage leads west toward the established network',
        },
        south: '%DEEP_MID_W',
      },
    },

    '%DEEP_EAST_MID': {
      name: 'Deep Eastern Passage',
      description: `The passage continues through the deep eastern network, the route descending slightly as it moves south. The water level increases with the descent, seepage from the water table making the floor perpetually wet.`,
      x: 12,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 18,
      outdoor: false,
      exits: {
        north: '%DEEP_EAST_N',
        south: '%DEEP_EAST_JUNCTION',
        west: '%DEEP_MID_W',
      },
    },

    '%DEEP_MID_W': {
      name: 'Deep Middle Passage',
      description: `The passage runs east-west through the center of the deep eastern network, connecting the established routes to the newer excavations. The construction varies along its length—older work giving way to newer, different hands contributing to a continuous route.`,
      x: 8,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 12,
      outdoor: false,
      exits: {
        north: '%DEEP_CONNECTOR',
        east: '%DEEP_EAST_MID',
        south: '%DEEP_MID_S',
      },
    },

    '%DEEP_EAST_JUNCTION': {
      name: 'Deep Eastern Junction',
      description: `The passage opens into a junction where multiple routes converge—the main north-south corridor, connections to the western network, and passages leading toward the rail tunnels to the south. The junction is large enough to serve as a gathering point, the space cleared and maintained despite its depth.

Chalk marks on the walls indicate directions and distances in a code that requires knowing. The marks are updated regularly, the information current, the route network mapped by those who use it.`,
      x: 12,
      y: 0,
      z: -3,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%DEEP_EAST_MID',
        south: '%DEEP_EAST_S',
        west: '%DEEP_MID_S',
        down: '%DEEP_SHAFT',
      },
    },

    '%DEEP_MID_S': {
      name: 'Deep Middle Passage',
      description: `The passage continues through the center of the network, the route maintained despite the increasing water level. The walls show tide marks here—the deep network floods during extreme high tides, the bay's influence reaching even this far from the waterfront.`,
      x: 8,
      y: 0,
      z: -3,
      population: 0,
      ambientNoise: 20,
      lighting: 10,
      waterLevel: 25,
      outdoor: false,
      exits: {
        north: '%DEEP_MID_W',
        east: '%DEEP_EAST_JUNCTION',
        south: '%DEEP_SOUTH_W',
        west: {
          to: 'buildings/underground-east/z-3.ts',
          room: '%DEEP_2ND_S',
          description: 'A passage leads west toward the Second Avenue deep network',
        },
      },
    },

    '%DEEP_EAST_S': {
      name: 'Deep Eastern Passage',
      description: `The passage extends south toward the rail tunnels, the route growing rougher as it approaches the industrial infrastructure beneath King Street. The air changes here—the smell of grease and diesel mixing with the mineral smell of deep earth.`,
      x: 12,
      y: -2,
      z: -3,
      population: 0,
      ambientNoise: 22,
      lighting: 8,
      waterLevel: 20,
      outdoor: false,
      exits: {
        north: '%DEEP_EAST_JUNCTION',
        south: '%RAIL_APPROACH',
        west: '%DEEP_SOUTH_W',
      },
    },

    '%DEEP_SOUTH_W': {
      name: 'Deep Southern Passage',
      description: `The passage runs through the southern section of the deep eastern network, connecting to routes that lead toward the rail yards and the industrial underground. The construction is utilitarian—sized for purpose rather than comfort, maintained for function rather than aesthetics.`,
      x: 8,
      y: -2,
      z: -3,
      population: 0,
      ambientNoise: 18,
      lighting: 10,
      waterLevel: 22,
      outdoor: false,
      exits: {
        north: '%DEEP_MID_S',
        east: '%DEEP_EAST_S',
        south: '%RAIL_JUNCTION',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RAIL TUNNEL CONNECTIONS
    // ═══════════════════════════════════════════════════════════════════════

    '%RAIL_APPROACH': {
      name: 'Rail Tunnel Approach',
      description: `The passage approaches the rail tunnels, the route showing the transition from the city's underground network to the industrial infrastructure beneath the rail yards. The air is thick with the smell of machinery, the constant vibration of trains passing above making the walls hum.`,
      x: 12,
      y: -4,
      z: -3,
      population: 0,
      ambientNoise: 35,
      lighting: 12,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%DEEP_EAST_S',
        south: '%RAIL_TUNNEL_E',
        west: '%RAIL_JUNCTION',
      },
    },

    '%RAIL_JUNCTION': {
      name: 'Rail Junction',
      description: `The passage reaches a junction where the deep eastern network meets the rail tunnels, the intersection of two underground systems that were built for different purposes and have found common use. The junction is maintained by those who value mobility between the city's hidden spaces.`,
      x: 8,
      y: -4,
      z: -3,
      population: 0,
      ambientNoise: 40,
      lighting: 15,
      waterLevel: 12,
      outdoor: false,
      exits: {
        north: '%DEEP_SOUTH_W',
        east: '%RAIL_APPROACH',
        south: '%RAIL_TUNNEL_W',
        west: {
          to: 'buildings/underground-east/z-3.ts',
          room: '%DRAIN_JUNCTION',
          description: 'A passage leads west toward the drainage network',
        },
      },
    },

    '%RAIL_TUNNEL_E': {
      name: 'Rail Tunnel East',
      description: `The passage enters the rail tunnel network, the route running alongside tracks that carry freight through the industrial underground. The tunnel is large enough to accommodate rail cars, the clearances generous, the construction industrial rather than intimate.

The tunnel is occasionally used by maintenance crews, the route official if rarely traveled. The unofficial traffic takes advantage of the gaps between official visits.`,
      x: 12,
      y: -5,
      z: -3,
      population: 0,
      ambientNoise: 45,
      lighting: 18,
      waterLevel: 8,
      outdoor: false,
      exits: {
        up: '%KING_ACCESS',
        north: '%RAIL_APPROACH',
        west: '%RAIL_TUNNEL_MAIN',
      },
    },

    '%RAIL_TUNNEL_W': {
      name: 'Rail Tunnel West',
      description: `The tunnel continues west through the rail infrastructure, the passage running parallel to tracks that connect the King Street Station to freight yards beyond the city. The tunnel is active—trains pass through, their rumble shaking the walls and filling the space with sound.

Alcoves along the route provide shelter when trains pass, the spaces sized for workers who need to clear the tracks quickly. The alcoves serve other purposes now, providing concealment for those who need to wait out traffic.`,
      x: 8,
      y: -5,
      z: -3,
      population: 0,
      ambientNoise: 50,
      lighting: 20,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%RAIL_JUNCTION',
        east: '%RAIL_TUNNEL_MAIN',
        west: '%RAIL_WEST_TERMINUS',
      },
    },

    '%RAIL_TUNNEL_MAIN': {
      name: 'Rail Tunnel Main',
      description: `The tunnel reaches its widest point here, where multiple tracks converge before splitting toward different destinations. The space is cavernous, the ceiling lost in darkness overhead, the walls distant in the perpetual twilight of industrial lighting.

The junction is dangerous—trains can approach from multiple directions, the rumble of one masking the approach of another. Those who use this route know to check all directions, to listen for the vibrations that precede the sound, to find shelter before the trains arrive.`,
      x: 10,
      y: -5,
      z: -3,
      population: 0,
      ambientNoise: 55,
      lighting: 22,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: '%RAIL_TUNNEL_E',
        west: '%RAIL_TUNNEL_W',
        north: '%RAIL_SERVICE',
      },
    },

    '%RAIL_SERVICE': {
      name: 'Rail Service Corridor',
      description: `A service corridor branches north from the main rail tunnel, providing access for maintenance crews without requiring them to walk the tracks. The corridor is narrow, sized for tools and workers rather than trains, the construction industrial but human-scaled.

The corridor connects the rail infrastructure to the city's underground network, a route that exists on maintenance diagrams but serves purposes beyond maintenance.`,
      x: 10,
      y: -4,
      z: -3,
      population: 0,
      ambientNoise: 35,
      lighting: 18,
      waterLevel: 10,
      outdoor: false,
      exits: {
        south: '%RAIL_TUNNEL_MAIN',
        north: '%SERVICE_JUNCTION',
        west: '%RAIL_JUNCTION',
        east: '%RAIL_APPROACH',
      },
    },

    '%SERVICE_JUNCTION': {
      name: 'Service Junction',
      description: `The service corridor reaches a junction where multiple maintenance routes converge, the space designed as a staging area for rail workers who need access to different sections of the underground. Tool cabinets line the walls, their contents long since removed or stolen.

The junction serves as a connection point between the rail network and the city's established underground, a transition zone between industrial and urban depths.`,
      x: 10,
      y: -3,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 15,
      waterLevel: 12,
      outdoor: false,
      exits: {
        south: '%RAIL_SERVICE',
        north: '%DEEP_MID_S',
      },
    },

    '%RAIL_WEST_TERMINUS': {
      name: 'Rail Tunnel Terminus',
      description: `The tunnel reaches its western extent within the accessible network, the route continuing toward the main rail infrastructure but requiring passage through sections that are regularly patrolled and monitored. Beyond this point, the unofficial traffic must give way to official observation.

A passage branches north toward the established underground network, connecting the rail tunnels to the city's deeper passages.`,
      x: 5,
      y: -5,
      z: -3,
      population: 0,
      ambientNoise: 42,
      lighting: 15,
      waterLevel: 8,
      outdoor: false,
      exits: {
        east: '%RAIL_TUNNEL_W',
        north: '%WEST_RAIL_CONN',
      },
    },

    '%WEST_RAIL_CONN': {
      name: 'Western Rail Connection',
      description: `The passage connects the rail tunnel terminus to the established underground network, climbing through earth that shows the layered history of the city's development. The route is maintained by those who value the connection between the rail infrastructure and the city's hidden passages.`,
      x: 5,
      y: -4,
      z: -3,
      population: 0,
      ambientNoise: 28,
      lighting: 12,
      waterLevel: 15,
      outdoor: false,
      exits: {
        south: '%RAIL_WEST_TERMINUS',
        west: {
          to: 'buildings/underground-east/z-3.ts',
          room: '%DRAIN_TUNNEL',
          description: 'A passage leads west toward the drainage network',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP SHAFT (connecting to z=-4)
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_SHAFT': {
      name: 'Deep Shaft',
      description: `A vertical shaft descends from the eastern junction toward the deepest levels of the underground network. The shaft is rough-hewn, carved through earth and rock by hands that prioritized access over aesthetics. Iron rungs set into the wall provide a climbing route that requires trust in metalwork installed by unknown people at unknown times.

The shaft is the eastern network's connection to the Gray Cartel's territory, a route that links the newer excavations to the established power structures below. Passage requires acknowledgment of territorial boundaries. The boundaries are not always explicit.`,
      x: 12,
      y: 0,
      z: -4,
      population: 0,
      ambientNoise: 15,
      lighting: 5,
      waterLevel: 10,
      outdoor: false,
      exits: {
        up: '%DEEP_EAST_JUNCTION',
        west: {
          to: 'buildings/underground-complex/z-4.ts',
          room: '%X7Y0',
          description: 'A passage leads west toward the established network',
        },
      },
    },
  },
};
