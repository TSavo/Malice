// Underground East - Northern Extension (z=-2)
// Extends the eastern underground network north toward Yesler Way
// These passages follow the original basement network beneath Occidental Ave

export const building = {
  name: 'Underground East North',

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // NORTHERN EXTENSION (from y=6 toward Yesler Way at y=10)
    // ═══════════════════════════════════════════════════════════════════════

    '%NORTH_7': {
      name: 'Underground Passage',
      description: `The passage continues north through a section that shows the marks of heavier traffic. The floor is worn smooth by countless feet, the walls polished by countless shoulders brushing past in the darkness. This route sees regular use—has seen regular use for generations, judging by the depth of the wear.

The construction transitions here from commercial basements to something older, deeper. The brickwork is rougher, laid by different hands in a different era. The passage was adapted rather than built, carved through pre-existing structures that were themselves repurposed from even earlier construction.`,
      x: -7,
      y: 7,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 'buildings/underground-east/z-2.ts',
          description: 'A passage leads south toward the Northern Junction',
        },
        north: '%NORTH_8',
        east: '%COMM_WEST',
      },
    },

    '%NORTH_8': {
      name: 'Underground Passage',
      description: `The passage runs through what was once a substantial basement—the ceiling rising higher, the walls farther apart, the sense of space almost comfortable after the constriction of the tunnels behind. Iron columns support the structure above, their surfaces covered with layers of old paint that crack and flake in the darkness.

A faded calendar hangs on one column, its pages yellowed, its dates meaningless. The calendar shows a forest scene—evergreens in snow, a winter that happened decades ago to trees that may no longer exist. Someone hung it here to remember what seasons looked like. The calendar has forgotten its own purpose.`,
      x: -7,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%NORTH_7',
        north: '%NORTH_9',
        west: '%STORAGE_WEST',
      },
    },

    '%NORTH_9': {
      name: 'Underground Passage',
      description: `The passage approaches the northern edge of the original underground network, where the buried commercial district gave way to smaller residential and industrial structures. The change is visible in the construction: brick becomes rougher, timber becomes cruder, the investment in each square foot of buried space diminishes as the buildings above became less valuable.

Water seeps more heavily here, the drainage that kept the commercial district dry less effective in this section. Puddles collect in low spots, their surfaces showing the oily sheen of contamination that has seeped down from the streets above over decades.`,
      x: -7,
      y: 9,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 12,
      waterLevel: 15,
      outdoor: false,
      exits: {
        south: '%NORTH_8',
        north: '%YESLER_APPROACH',
        west: {
          to: 'underground/upper-tunnels/tunnel-mouth.ts',
          description: 'A passage leads west toward the Tunnel Mouth',
        },
      },
    },

    '%YESLER_APPROACH': {
      name: 'Yesler Approach',
      description: `The passage reaches the northern limit of the underground network, where the buried streets of Pioneer Square meet the foundations of Yesler Way above. The construction here is different—newer, rougher, the work of hands that extended the network beyond its original boundaries.

The passage was dug through earth rather than inherited from basements, a tunnel carved by necessity rather than accident. The walls are shored with modern materials—steel beams, poured concrete, industrial-grade shoring—but the work is hasty, adequate rather than elegant.

Above, through the ceiling, the rumble of Yesler Way is occasionally audible—the passage of the few vehicles that still move on the empty streets, the footsteps of travelers who don't know what lies beneath their feet.`,
      x: -7,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%NORTH_9',
        north: '%YESLER_N1',
        east: '%YESLER_EAST',
      },
    },

    '%YESLER_N1': {
      name: 'Northern Passage',
      description: `The passage continues north through recently excavated sections, approaching the foundation of Occidental Park at Yesler Way.`,
      x: -7,
      y: 11,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%YESLER_APPROACH',
        north: '%YESLER_ACCESS',
      },
    },

    '%YESLER_ACCESS': {
      name: 'Yesler Access Chamber',
      description: `A chamber beneath the intersection of Occidental Avenue and Yesler Way, where a vertical shaft rises toward the surface. The shaft was constructed recently—within the last decade, judging by the concrete and steel—but the construction is deliberately roughed up to look older, to blend with the nineteenth-century infrastructure around it.

The shaft is equipped with a ladder of modern manufacture, its rungs showing the marks of regular use. A locked grating covers the upper end, accessible from above with the right key, invisible to anyone who doesn't know where to look beneath the pergola.`,
      x: -7,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%YESLER_N1',
        up: {
          to: 'yesler-way/x-7.ts',
          description: 'A shaft rises toward Yesler Way',
          hidden: true,
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EASTERN BRANCH TOWARD 2ND AVE
    // ═══════════════════════════════════════════════════════════════════════

    '%YESLER_EAST': {
      name: 'Underground Passage',
      description: `The passage extends east beneath Yesler Way, following the route of buried infrastructure that predates even the underground network. The walls show the marks of utility construction—the channels and brackets that once held pipes and cables, now empty, their contents removed or rerouted during modernization efforts that the underground never received.`,
      x: -5,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_APPROACH',
        east: '%YESLER_MID',
      },
    },

    '%YESLER_MID': {
      name: 'Underground Passage',
      description: `The passage continues east through a section where the infrastructure converges—water pipes, electrical conduit, communication cables, all running parallel to the tunnel's route. The effect is claustrophobic, the walls pressing close with the weight of systems that still function above.`,
      x: -3,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%YESLER_EAST',
        east: '%YESLER_2ND',
        south: '%PARK_NORTH',
      },
    },

    '%YESLER_2ND': {
      name: 'Second Avenue Crossing',
      description: `The passage reaches a junction beneath the intersection of Yesler Way and Second Avenue—territory that was never part of the original underground but was excavated later, connecting the eastern network to destinations that required connection.

The construction here is purely functional: concrete walls, steel supports, industrial lighting that flickers but still functions. The aesthetic of secrecy has given way to the aesthetic of utility. This section was built to move people and things, not to hide them.

A passage continues east toward territory beyond the original Pioneer Square development.`,
      x: 0,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%YESLER_MID',
        south: '%2ND_YESLER_S',
        east: '%YESLER_TERMINUS',
      },
    },

    '%YESLER_TERMINUS': {
      name: 'Eastern Terminus',
      description: `The passage ends here at the edge of the underground network's expansion, where excavation stopped at the boundary of what was once the original Pioneer Square district. The wall ahead is raw earth, unfinished, the end of the line.

Pick marks in the clay show where excavation continued briefly before stopping. Tools lean against the wall—picks, shovels, a wheelbarrow—evidence of work that was interrupted and never resumed. The reason for stopping is not apparent. The evidence of stopping is clear.

The passage turns south here, toward the main Second Avenue underground.`,
      x: 3,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%YESLER_2ND',
        south: '%3RD_CONN_N',
      },
    },

    '%3RD_CONN_N': {
      name: 'Northern Connector',
      description: `A passage runs south from the Yesler terminus, connecting the northern reaches to the main east-west corridors below. The passage is narrow but well-maintained, evidence of regular traffic between the Yesler access and the deeper network.`,
      x: 3,
      y: 9,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%YESLER_TERMINUS',
        south: '%3RD_CONN_S',
      },
    },

    '%3RD_CONN_S': {
      name: 'Connector Junction',
      description: `The connector passage reaches a junction with the main east-west route, creating an intersection that allows travel in multiple directions through the eastern underground network.`,
      x: 3,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%3RD_CONN_N',
        west: '%COMM_EAST',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // COMMUNICATION CORRIDOR (runs east-west at y=7)
    // ═══════════════════════════════════════════════════════════════════════

    '%COMM_WEST': {
      name: 'Communication Corridor',
      description: `The passage branches east into a corridor that was clearly designed for infrastructure rather than transit. The walls are lined with cable trays, conduit brackets, the mounting hardware for communication systems that may or may not still function.

The corridor is tight but passable, the infrastructure leaving enough room for a single person to move through with care. The cables that once filled these trays have been removed—or were never installed—leaving empty channels that suggest purposes that were never fulfilled.`,
      x: -5,
      y: 7,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%NORTH_7',
        east: '%COMM_MID',
      },
    },

    '%COMM_MID': {
      name: 'Communication Corridor',
      description: `The corridor continues through a section where the cable infrastructure converges on a junction box of impressive size—a hub for the communication systems that were meant to run through here. The junction box is dark, its indicators dead, its purpose suspended if not abandoned.`,
      x: -3,
      y: 7,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%COMM_WEST',
        east: '%COMM_EAST',
        south: {
          to: 'buildings/underground-east/z-2.ts',
          description: 'A passage leads south toward the Pergola Undercroft',
        },
      },
    },

    '%COMM_EAST': {
      name: 'Communication Corridor',
      description: `The corridor reaches its eastern extent at a point where the infrastructure plans exceeded the excavation budget. The cable trays end abruptly at a wall of raw earth, the installation incomplete, the connection never made.

The corridor turns south here, joining the connector passage that links the Yesler reaches to the main network.`,
      x: 0,
      y: 7,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%COMM_MID',
        north: '%PARK_NORTH',
        south: {
          to: 'buildings/underground-east/z-2.ts',
          description: 'A passage leads south toward the Second Avenue Underground',
        },
        east: '%3RD_CONN_S',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PARK NORTHERN SECTION
    // ═══════════════════════════════════════════════════════════════════════

    '%PARK_NORTH': {
      name: 'Park North Passage',
      description: `The passage runs beneath the northern edge of Occidental Park, connecting the Yesler reaches to the main park infrastructure below. The walls show the original park construction—stone foundations, drainage channels, the engineering that kept the park from flooding during Seattle's notorious rains.`,
      x: 0,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%YESLER_MID',
        south: '%COMM_EAST',
        west: '%NORTH_8',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STORAGE SECTION (old warehouse basements)
    // ═══════════════════════════════════════════════════════════════════════

    '%STORAGE_WEST': {
      name: 'Storage Basement',
      description: `The passage opens into what was once a warehouse basement—the ceiling high, the floor vast, the space designed to hold goods in quantities that would astound modern logistics. Cast iron columns march in rows across the floor, supporting beams that could bear the weight of anything the nineteenth century wanted to store.

The basement is empty now, its contents removed or decayed or stolen long ago. But the sense of capacity remains, the architecture speaking of commerce on a scale that justified this investment. Someone built this space expecting it to hold wealth. The expectations outlasted the wealth.`,
      x: -9,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%NORTH_8',
        north: '%STORAGE_NORTH',
        west: '%STORAGE_DEEP',
      },
    },

    '%STORAGE_NORTH': {
      name: 'Storage Basement',
      description: `The northern section of the storage basement is divided by timber partitions into smaller spaces—pens for goods, perhaps, or secure storage for items that required separation from the general stock. The partitions are rotting now, their purpose served and forgotten.`,
      x: -9,
      y: 9,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STORAGE_WEST',
        east: '%NORTH_9',
      },
    },

    '%STORAGE_DEEP': {
      name: 'Deep Storage',
      description: `The passage extends west into a section of basement that was clearly used for long-term storage. The walls are lined with iron hooks and brackets, the mounting points for shelving that has been removed. The floor shows the marks of heavy traffic—grooves worn by wheels, scratches from dragged loads, the evidence of commerce conducted in bulk.

This section connects to the main western underground through a narrow passage that may or may not still be passable.`,
      x: -11,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%STORAGE_WEST',
        west: {
          to: 'underground/upper-tunnels/x-14-y8.ts',
          description: 'A narrow passage leads west',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SECOND AVENUE YESLER SECTION
    // ═══════════════════════════════════════════════════════════════════════

    '%2ND_YESLER_S': {
      name: 'Underground Passage',
      description: `The passage descends from the Yesler crossing toward the main Second Avenue underground, connecting the northern reaches to the established network. The construction shows the marks of multiple eras: original nineteenth-century brick, early twentieth-century concrete patches, late twentieth-century steel reinforcement.`,
      x: 0,
      y: 9,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%YESLER_2ND',
        south: '%2ND_YESLER_MID',
        west: '%PARK_NORTH',
      },
    },

    '%2ND_YESLER_MID': {
      name: 'Underground Passage',
      description: `The passage continues south through the Second Avenue underground, the route growing more established as it approaches the main network. The walls show less improvisation here, more deliberate construction.`,
      x: 0,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%2ND_YESLER_S',
        south: '%2ND_YESLER_S2',
      },
    },

    '%2ND_YESLER_S2': {
      name: 'Underground Passage',
      description: `The passage approaches the park's northern boundary, where the Second Avenue underground meets the infrastructure beneath Occidental Park.`,
      x: 0,
      y: 7,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%2ND_YESLER_MID',
        south: '%2ND_YESLER_S3',
        west: '%COMM_MID',
      },
    },

    '%2ND_YESLER_S3': {
      name: 'Underground Passage',
      description: `The passage continues south, approaching the junction with the main Second Avenue underground.`,
      x: 0,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%2ND_YESLER_S2',
        south: '%2ND_YESLER_S4',
      },
    },

    '%2ND_YESLER_S4': {
      name: 'Underground Passage',
      description: `The passage reaches the established Second Avenue underground, connecting to the main network that runs beneath the street. The junction is unremarkable—just another intersection in the maze—but the traffic patterns show that this route is used, that the Yesler access serves a current purpose.`,
      x: 0,
      y: 5,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 22,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%2ND_YESLER_S3',
        south: {
          to: 'buildings/underground-east/z-2.ts',
          description: 'The passage continues south toward the Northern Junction',
        },
      },
    },
  },
};
