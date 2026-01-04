// Underground East - Level z=-2 (Upper Eastern Tunnels)
// Extends the underground network beneath 2nd Ave and Occidental
// These tunnels follow the buried streets from the 1889 fire raising

export const building = {
  name: 'Underground East',
  x: 7,
  y: 6,
  width: 17,
  height: 12,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // MAIN EASTERN CORRIDOR (x=-7, beneath Occidental Ave S, z=-2)
    // ═══════════════════════════════════════════════════════════════════════

    '%OCC_CROSS': {
      name: 'Occidental Crossing',
      description: `The tunnel opens into a vaulted chamber beneath what was once the heart of Seattle's commercial district. Brick arches span overhead, their keystone blocks inscribed with dates—1891, 1892, 1893—marking the rapid reconstruction after the fire. The arches supported sidewalks that became ceilings when the streets were raised. Now they support nothing but shadow.

Cast iron storefronts line the walls, their display windows still glazed with rippled glass that survived the fire and the forgetting. Through the glass: emptiness. Whatever these shops once sold has been gone for a century. The shelves remain, waiting for inventory that will never arrive.

The passage branches here—north toward the pergola and the park, south toward the waterfront, east toward corridors that were never meant for public eyes. The chalk marks on the walls multiply at this junction, a visual shout of competing claims and cautious alliances.`,
      x: -7,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%OCC_N1',
        south: '%OCC_S1',
        east: '%CONN_W',
        west: {
          to: 'underground/upper-tunnels/main-crossing.ts',
          description: 'A brick passage leads west toward 1st Ave',
        },
        up: {
          to: 'buildings/occidental-square/z0.ts',
          room: '%GALLERY',
          description: 'A trapdoor leads up toward the gallery above',
        },
      },
    },

    '%OCC_N1': {
      name: 'Underground Passage',
      description: `The passage runs north beneath Occidental, following the buried street's original path. The walls here show the layered construction of hasty rebuilding—brick laid over rubble, timber shoring added where brick proved insufficient, concrete patches filling gaps where time and water took their toll.

Above, through gaps in the timber ceiling, you can see the underside of the modern plaza. Daylight filters through grating, creating narrow strips of illumination that move as the sun crosses overhead. The effect is disorienting—celestial rhythms reaching into a space that should know only darkness.`,
      x: -7,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%OCC_CROSS',
        north: '%OCC_N2',
      },
    },

    '%OCC_N2': {
      name: 'Underground Passage',
      description: `The passage widens slightly where two basement spaces once shared a common wall that has since crumbled. The rubble has been cleared—recently, judging by the scrape marks on the floor—creating a wider corridor that feels almost comfortable after the tight spaces behind.

A faded sign painted directly on the brick reads "BERGMAN'S FINE GOODS" in letters that were once gold and are now the color of old tea. The sign points toward a doorway that opens onto collapsed debris. Bergman's is gone. The sign endures.`,
      x: -7,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%OCC_N1',
        north: '%OCC_N3',
        east: '%ALLEY_W',
      },
    },

    '%OCC_N3': {
      name: 'Underground Passage',
      description: `Water drips from overhead here, tracing dark lines down the brick walls. The moisture comes from the pergola above, where rain collects in the iron framework and seeps through century-old joints. The passage has adapted to this constant flow—the floor slopes slightly toward a drain that still functions, carrying water into deeper darkness.`,
      x: -7,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        south: '%OCC_N2',
        north: '%OCC_N4',
      },
    },

    '%OCC_N4': {
      name: 'Pergola Undercroft',
      description: `The tunnel opens into a broader space directly beneath Occidental Park's pergola. The iron structure above creates a skeletal shadow on the timber ceiling, its geometric pattern filtering what little light penetrates this depth. The effect is almost beautiful—industrial tracery rendered in darkness and dust.

This was once a loading dock, where goods descended from street level into the basements of surrounding buildings. The freight elevator shaft still exists, sealed with rusted grating and "DANGER" signs that predate modern typography. Whatever waits below the loading dock has been waiting for a very long time.

Passages branch in multiple directions here—the network spreads beneath the park like roots beneath a dying tree.`,
      x: -7,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%OCC_N3',
        north: '%OCC_N5',
        west: {
          to: 'underground/upper-tunnels/park-access.ts',
          description: 'A passage leads west toward the park access point',
        },
        east: '%PARK_E1',
        down: {
          to: 'buildings/underground-east/z-3.ts',
          description: 'A shaft descends into darkness',
        },
      },
    },

    '%OCC_N5': {
      name: 'Underground Passage',
      description: `The passage narrows as it continues north, the walls pressing closer where the original basements were smaller, the buildings above less prosperous. This was the edge of the commercial district, where warehouses gave way to boarding houses, where money was tight and construction reflected it.`,
      x: -7,
      y: 5,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%OCC_N4',
        north: '%OCC_JUNCTION',
      },
    },

    '%OCC_JUNCTION': {
      name: 'Northern Junction',
      description: `The passage ends at a junction where the underground network meets the foundations of buildings that still stand above. The transition is marked by newer construction—poured concrete replacing hand-laid brick, steel I-beams replacing timber shoring. Someone has maintained access to this junction. Someone still uses it.

A vertical shaft rises toward street level, its ladder rungs showing the wear of regular use. The shaft emerges somewhere in the park, the exact location obscured by a century of landscaping changes. Finding the surface exit requires knowing where to look.`,
      x: -7,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%OCC_N5',
        west: {
          to: 'underground/upper-tunnels/the-junction.ts',
          description: 'A passage leads west toward The Junction',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN OCCIDENTAL CORRIDOR
    // ═══════════════════════════════════════════════════════════════════════

    '%OCC_S1': {
      name: 'Underground Passage',
      description: `The passage descends slightly as it runs south, following the natural slope of the land toward the waterfront. The walls grow damper here, the water table rising closer to this level as the tunnel approaches the bay. Mineral deposits trace white lines down the brick, the accumulated residue of a century of seepage.`,
      x: -7,
      y: -1,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: {
          to: 'buildings/trinity-nightclub/z-2.ts',
          room: '%UNDERGROUND_EXIT',
          description: 'A steel fire door leads to Trinity Nightclub',
        },
        south: '%OCC_S2',
      },
    },

    '%OCC_S2': {
      name: 'Underground Passage',
      description: `The passage runs through what was once a particularly grand basement—the ceiling higher, the brickwork more refined, the iron columns that support it decorated with cast ornaments that have no practical purpose. Whoever built this basement wanted to impress. Who they wanted to impress, and why, has been forgotten.`,
      x: -7,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 15,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%OCC_S1',
        south: '%OCC_S3',
        east: '%DEAD_1',
      },
    },

    '%OCC_S3': {
      name: 'Underground Passage',
      description: `The passage continues south through increasingly utilitarian construction. The ornamental elements disappear, replaced by purely functional brick and timber. This was warehouse territory, where appearance mattered less than capacity, where goods moved through in quantities that had no patience for aesthetics.`,
      x: -7,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 20,
      outdoor: false,
      exits: {
        north: '%OCC_S2',
        south: '%OCC_S4',
        west: '%BRANCH_W1',
      },
    },

    '%OCC_S4': {
      name: 'Sluice Chamber',
      description: `The passage opens into a chamber designed for managing water—a sluice system built to channel the constant seepage away from the basements above. The engineering is Victorian in its ambition and execution: iron gates that once controlled flow, brick channels that directed water toward the bay, machinery rusted solid in positions that no longer matter.

The sluice still functions after a fashion, carrying water that finds its own path now, no longer directed by human intent. The chamber echoes with the sound of flowing water, a constant whisper that has spoken in this darkness for over a century.`,
      x: -7,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 8,
      waterLevel: 25,
      outdoor: false,
      exits: {
        north: '%OCC_S3',
        south: '%OCC_S5',
        down: {
          to: 'buildings/underground-east/z-3.ts',
          description: 'A sluice channel descends into darkness',
        },
      },
    },

    '%OCC_S5': {
      name: 'Underground Passage',
      description: `The passage continues south, the air growing saltier as it approaches the waterfront. The brickwork shows the effects of salt exposure—crystalline deposits, erosion patterns, the slow dissolution of mortar that holds the structure together. This section requires constant maintenance. It receives constant maintenance. Someone needs this route to remain open.`,
      x: -7,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 30,
      outdoor: false,
      exits: {
        north: '%OCC_S4',
        west: {
          to: 'underground/upper-tunnels/supply-junction.ts',
          description: 'A salt-encrusted passage leads west',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EASTERN ALLEY BRANCH (beneath the service alley)
    // ═══════════════════════════════════════════════════════════════════════

    '%ALLEY_W': {
      name: 'Alley Passage',
      description: `A narrow passage branches east, following the path of a service alley that once ran between Occidental and 2nd Avenue. The tunnel is tighter here, the walls closer, the ceiling lower—construction that followed an alley's width rather than a street's. The claustrophobia is intentional. Not everyone was meant to pass this way.`,
      x: -5,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%OCC_N2',
        east: '%ALLEY_E',
        northeast: '%MAZE_LOOP',
      },
    },

    '%ALLEY_E': {
      name: 'Alley Junction',
      description: `The alley passage opens into a small chamber where service tunnels once converged. The space is cramped, the ceiling so low that standing upright requires care. This was never meant for people—it was meant for pipes and cables and the infrastructure that served the buildings above. People adapted it later, when hiding mattered more than comfort.

Scratched into the brick: a crude map showing the tunnel network. The map is incomplete, possibly intentionally so. Certain passages are marked with X's. Warnings or waypoints—the distinction requires knowledge the map doesn't provide.`,
      x: -3,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%ALLEY_W',
        south: '%ALLEY_S1',
        north: '%MAZE_ENTRY',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MAZE SECTION (confusing dead ends and loops)
    // ═══════════════════════════════════════════════════════════════════════

    '%MAZE_ENTRY': {
      name: 'Cramped Passage',
      description: `The passage narrows severely, the walls composed of irregular rubble rather than laid brick. This section was never properly constructed—it was dug through the debris of collapsed buildings, a shortcut carved by necessity rather than design. The route twists and turns, following paths of least resistance through stone and timber.`,
      x: -3,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 3,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%ALLEY_E',
        north: '%MAZE_1',
        east: '%DEAD_MAZE_1',
      },
    },

    '%DEAD_MAZE_1': {
      name: 'Dead End',
      description: `The passage ends abruptly at a wall of collapsed masonry. The debris is old, settled, immovable without equipment that would never fit in these tunnels. Someone started to dig through once—pick marks scar the stones—then stopped. The reason for stopping is unclear. The evidence remains.`,
      x: -2,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 0,
      lighting: 0,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%MAZE_ENTRY',
      },
    },

    '%MAZE_1': {
      name: 'Twisting Passage',
      description: `The passage curves sharply, doubling back on itself before continuing. The disorientation is deliberate—whoever carved this route wanted to confuse pursuit, to make the path unmappable by simple memory. The walls show tool marks that vary in style and age, suggesting multiple hands worked on this maze across decades.`,
      x: -3,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%MAZE_ENTRY',
        west: '%MAZE_2',
        north: '%DEAD_MAZE_2',
      },
    },

    '%DEAD_MAZE_2': {
      name: 'Flooded Passage',
      description: `The passage descends sharply into standing water that reflects nothing but darkness. The flood is permanent—this section dropped below the water table when construction overhead shifted the drainage patterns. Whatever lay beyond is inaccessible now, claimed by the slow seep of groundwater that never recedes.`,
      x: -3,
      y: 5,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 2,
      waterLevel: 100,
      outdoor: false,
      exits: {
        south: '%MAZE_1',
      },
    },

    '%MAZE_2': {
      name: 'Low Passage',
      description: `The ceiling drops here, forcing anyone taller than a child to crouch. The passage extends in this cramped configuration for what feels like much longer than it actually is—the discomfort of hunched movement stretching time. The walls are rough stone, never finished, never intended for frequent use.`,
      x: -4,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 4,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%MAZE_1',
        west: '%MAZE_3',
        south: '%MAZE_LOOP',
      },
    },

    '%MAZE_3': {
      name: 'Widening Chamber',
      description: `The passage opens unexpectedly into a small chamber where someone once lived—or hid. The evidence remains: a bedframe rusted to a skeleton of iron, a cast-iron stove that was never connected to any chimney, shelves carved directly into the stone. The occupant is long gone. The sense of occupancy lingers.

A passage continues north toward the main network.`,
      x: -5,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%MAZE_2',
        north: '%PARK_E1',
      },
    },

    '%MAZE_LOOP': {
      name: 'Looping Passage',
      description: `The passage curves in a way that suggests purpose while delivering only confusion. Following it leads back to somewhere already passed—a loop designed to trap the unfamiliar, to waste the time of pursuers, to provide options for the pursued. The engineering of paranoia, written in stone.`,
      x: -4,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 2,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%MAZE_2',
        southwest: '%ALLEY_W',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEAD END BRANCHES (reward exploration with atmosphere)
    // ═══════════════════════════════════════════════════════════════════════

    '%DEAD_1': {
      name: 'Collapsed Basement',
      description: `The passage opens into what was once a basement that has partially collapsed. Timber beams angle down from above, supporting weight that threatens to shift. The floor is covered with debris: broken glass, crumbled mortar, the scattered contents of a storeroom that was sealed and forgotten.

Among the debris, a safe lies on its side, its door twisted open by the collapse that brought it here. The interior is empty. Whatever was worth protecting has been gone for a very long time.`,
      x: -5,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 3,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%OCC_S2',
      },
    },

    '%BRANCH_W1': {
      name: 'Sealed Passage',
      description: `The passage narrows into what was once a doorway, now partially blocked by a wall of brick that was clearly built in haste. The mortar is rough, the bricks misaligned, the work of someone sealing something away rather than building something to last.

Gaps in the hasty masonry reveal darkness beyond—space that continues past the barrier, space that someone decided should not be reached. The air that seeps through smells of deep earth and something older, something organic that has been decaying slowly for decades.`,
      x: -9,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 2,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%OCC_S3',
        west: {
          to: 'buildings/underground-tour/z-2.ts',
          room: '%STOREFRONT_ROW',
          description: 'A gap in the masonry leads toward the old tour route',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PARK EASTERN BRANCH
    // ═══════════════════════════════════════════════════════════════════════

    '%PARK_E1': {
      name: 'Park Passage East',
      description: `The passage extends east from the pergola undercroft, following the foundation line of buildings that once bordered the park. The construction is newer here—twentieth century rather than nineteenth—evidence of excavation work done when the park was redesigned.

Graffiti covers the walls: names, dates, declarations of love and defiance. The oldest date visible is 1932. The newest is much more recent. People have been finding their way down here for generations. The tradition continues.`,
      x: -5,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%OCC_N4',
        east: '%PARK_E2',
        south: '%MAZE_3',
      },
    },

    '%PARK_E2': {
      name: 'Eastern Terminus',
      description: `The passage ends at the edge of the underground network, where constructed space meets natural earth. The transition is abrupt: brick walls giving way to packed clay, the product of human labor surrendering to the labor of glaciers ten thousand years past.

Fresh excavation marks the eastern wall—picks and shovels have been at work here, extending the network toward new destinations. The work is recent. The destination is unclear. The tunnels are growing.`,
      x: -3,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%PARK_E1',
      },
    },

    '%ALLEY_S1': {
      name: 'Service Tunnel',
      description: `The passage drops into a service tunnel that once carried utilities beneath the alley. Pipes of various ages and materials line the walls—iron, clay, copper, PVC—a stratigraphy of infrastructure improvements spanning the city's history. Some still carry water. Others carry nothing but memory.`,
      x: -3,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 8,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%ALLEY_E',
        south: '%CONN_E',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CONNECTIONS TO SECOND AVE UNDERGROUND (x=0)
    // ═══════════════════════════════════════════════════════════════════════

    '%CONN_W': {
      name: 'Connector Passage',
      description: `A passage extends east toward the buried streets beneath Second Avenue. The construction here shows the marks of deliberate connection—walls breached and reinforced, passages excavated through foundations, the network extended beyond its original boundaries by hands that understood the value of mobility underground.`,
      x: -5,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%OCC_CROSS',
        east: '%CONN_E',
      },
    },

    '%CONN_E': {
      name: 'Second Avenue Access',
      description: `The passage approaches the underground sections beneath Second Avenue, where the street-raising created another layer of buried Seattle. The architecture changes here—different contractors, different standards, the subtle variations that mark work done by competing hands.

A narrow stairway rises toward a grating that opens into a service area beneath a building on Second Avenue. The grating is locked from the surface side, but the lock shows signs of being opened regularly. Someone uses this route. Someone maintains this access.`,
      x: -3,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%CONN_W',
        north: '%ALLEY_S1',
        east: '%2ND_MAIN',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SECOND AVENUE UNDERGROUND (x=0)
    // ═══════════════════════════════════════════════════════════════════════

    '%2ND_MAIN': {
      name: 'Second Avenue Underground',
      description: `The tunnel opens into the buried streets beneath Second Avenue—a parallel world to the Occidental passages, constructed at the same time but serving different purposes. Where Occidental was commerce, Second Avenue was industry. The basements here are larger, plainer, built for storage and manufacturing rather than retail.

Iron tracks run down the center of the passage, remnants of a cargo system that once moved goods between warehouses. The tracks are rusty but intact, the infrastructure waiting for trains that will never run again. The silence where machinery once worked is louder than the noise ever was.

This section feels more recently maintained than the Occidental tunnels—fresher air movement, fewer cobwebs, walls that show signs of regular passage. The Gray Cartel's influence extends here, though their marks are subtle rather than territorial.`,
      x: 0,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%CONN_E',
        north: '%2ND_N1',
        south: '%2ND_S1',
        east: '%2ND_EAST',
      },
    },

    '%2ND_N1': {
      name: 'Underground Passage',
      description: `The passage continues north along the Second Avenue corridor, the iron tracks still running down the center. Alcoves branch off at intervals—loading docks for the warehouses above, their freight elevators long sealed, their purposes forgotten.`,
      x: 0,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%2ND_MAIN',
        north: '%2ND_N2',
        west: '%VENT_CHAMBER',
      },
    },

    '%2ND_N2': {
      name: 'Underground Passage',
      description: `The passage shows signs of more recent modification here—walls reinforced with modern materials, the floor leveled with poured concrete, lighting fixtures that post-date the original construction by decades. Someone has invested resources in this section. The investment suggests value.`,
      x: 0,
      y: 2,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%2ND_N1',
        north: '%2ND_JUNCTION',
      },
    },

    '%2ND_JUNCTION': {
      name: 'Warehouse Junction',
      description: `The passage opens into a junction where multiple warehouse basements once connected. The space is surprisingly large—nearly thirty feet across—with multiple passages branching in different directions. The cargo tracks converge here, switches still set for destinations that no longer exist.

The walls are lined with industrial shelving, empty now but showing the marks of heavy use. Whatever was stored here was valuable enough to require organization, numerous enough to require scale. The shelving remains, waiting for goods that will never arrive.

Above, a freight elevator shaft rises toward one of the buildings on Second Avenue. The elevator itself is long gone, but the shaft remains accessible—a vertical route for those who know where it emerges.`,
      x: 0,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 22,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%2ND_N2',
        north: '%2ND_N3',
        east: '%COURT_TUNNEL',
      },
    },

    '%2ND_N3': {
      name: 'Underground Passage',
      description: `The passage narrows as it continues north, the warehouse construction giving way to older, rougher work. This section predates the street raising—a natural basement that was incorporated into the underground network when Seattle lifted itself above the tide.`,
      x: 0,
      y: 4,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 10,
      outdoor: false,
      exits: {
        south: '%2ND_JUNCTION',
        north: '%2ND_N4',
      },
    },

    '%2ND_N4': {
      name: 'Northern Terminus',
      description: `The passage ends at a wall of concrete that marks the foundation of a building constructed after the underground was forgotten. The newer construction sliced through the network without regard for what it severed, isolating this section from passages that once continued north.

Scratched into the concrete: "1956" and the initials of workers who probably didn't know they were sealing a door. The network adapted. It always adapts.`,
      x: 0,
      y: 5,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%2ND_N3',
      },
    },

    '%2ND_S1': {
      name: 'Underground Passage',
      description: `The passage runs south through territory that feels older, damper, closer to the water table that rises beneath the city. The walls show tide marks—the underground floods when the bay rises, a fact that the builders knew and the network remembers.`,
      x: 0,
      y: -1,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%2ND_MAIN',
        south: '%2ND_S2',
      },
    },

    '%2ND_S2': {
      name: 'Flooded Section',
      description: `The passage descends into permanent standing water here, the floor dropped below the water table by settling that occurred decades ago. The water is cold, dark, of uncertain depth. Wading is possible but unpleasant. Swimming would be necessary if the water rises further. It sometimes rises further.

Through the water, dim illumination suggests the passage continues, suggesting destinations that require commitment to reach.`,
      x: 0,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 5,
      waterLevel: 50,
      outdoor: false,
      exits: {
        north: '%2ND_S1',
        south: '%PUMP_ROOM',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY CHAMBERS
    // ═══════════════════════════════════════════════════════════════════════

    '%PUMP_ROOM': {
      name: 'Pump Room',
      description: `The passage opens into a chamber dominated by machinery—pumps designed to keep the underground dry, engines that once powered the cargo system, generators that provided light when the grid above failed. The machinery is silent now, its function superseded by modern systems or simply abandoned when the cost of maintenance exceeded the value of operation.

But not all the equipment is dead. A newer pump hums quietly in the corner, its power cable snaking up toward the surface through conduit that was installed recently. Someone is keeping this section from flooding completely. Someone has a reason to want access.`,
      x: 0,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 35,
      lighting: 20,
      waterLevel: 30,
      outdoor: false,
      exits: {
        north: '%2ND_S2',
        west: {
          to: 'buildings/underground-tour/z-2.ts',
          room: '%TOUR_END',
          description: 'A passage leads west toward the old tour route',
        },
        down: {
          to: 'buildings/underground-east/z-3.ts',
          description: 'A shaft descends to the deep pump station',
        },
      },
    },

    '%VENT_CHAMBER': {
      name: 'Ventilation Chamber',
      description: `The chamber houses the remains of a ventilation system designed to provide fresh air to the underground. Massive ducts rise toward the surface, their sheet metal corroded but intact, their purpose evident even if their function has long since failed.

The ducts connect to the streets above through gratings that were once concealed in sidewalks and building foundations. Some of these connections still exist, providing routes for air and light and—for those who know where to look—access.`,
      x: -2,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%2ND_N1',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EASTERN EXTENSION (toward 3rd Ave)
    // ═══════════════════════════════════════════════════════════════════════

    '%2ND_EAST': {
      name: 'Eastern Passage',
      description: `The passage continues east through a section that was clearly excavated rather than inherited—the walls show pick marks rather than brick, shoring rather than construction. Someone dug this tunnel after the underground was established, extending the network beyond its original boundaries.

The excavation is old but the maintenance is new. The tunnel serves a current purpose, connecting the Second Avenue underground to destinations that weren't part of the original network.`,
      x: 2,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%2ND_MAIN',
        east: '%3RD_CONN',
      },
    },

    '%3RD_CONN': {
      name: 'Third Avenue Connection',
      description: `The tunnel approaches the foundations of buildings on Third Avenue, where the underground network historically ended. The construction ahead is different—twentieth century rather than nineteenth, the product of different engineers and different purposes.

The passage continues through a breach in a foundation wall, the opening reinforced with steel and concrete, the work of decades rather than centuries. This connection was made deliberately, extending the network into territory it was never meant to reach.`,
      x: 4,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%2ND_EAST',
        east: '%3RD_BASEMENT',
      },
    },

    '%3RD_BASEMENT': {
      name: 'Third Avenue Basement',
      description: `The passage emerges into a basement that was built long after the underground was forgotten—a space that was never intended to connect to the hidden network beneath the city. The connection was made later, the wall breached, the route established by people who found value in extending the underground's reach.

The basement itself is empty, its contents removed or never installed. The floor shows the marks of heavy traffic leading toward the breach in the eastern wall, evidence that this route is used regularly, that the connection serves a current purpose.

Stairs rise toward the building above, their upper end sealed by a door that shows recent use. The surface is close here, accessible to those who have the key.`,
      x: 7,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%3RD_CONN',
        up: {
          to: '3rd-ave-s/y1.ts',
          description: 'Stairs rise toward Third Avenue',
          hidden: true,
        },
      },
    },

    '%COURT_TUNNEL': {
      name: 'Courthouse Passage',
      description: `The passage extends east toward the old courthouse, following what was once a service corridor connecting government buildings. The construction is more formal here—proper brick, decorative elements that served no practical purpose, the architecture of authority translated underground.

The passage has been sealed at multiple points throughout its history, then reopened, then sealed again. The current opening shows recent work, the mortar still relatively fresh. Someone is maintaining access to the courthouse from below.`,
      x: 3,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%2ND_JUNCTION',
        east: '%COURT_VAULT',
      },
    },

    '%COURT_VAULT': {
      name: 'Courthouse Vault',
      description: `The passage ends at a massive vault door set into a wall of reinforced concrete. The door is the work of a previous century—steel and iron, the mechanism massive and mechanical, the security designed to resist force rather than electronics. The lock is a combination type, its tumblers waiting for numbers that were last set by hands now dead.

Behind the door lies the old evidence vault, the secure storage where the courthouse once kept items too valuable or dangerous for ordinary storage. The vault was sealed when the courthouse above was renovated, its contents supposedly transferred to new facilities. Supposedly.

The door shows no signs of recent opening. But the passage leading to it shows signs of regular use, suggesting that some arrive here with purposes other than entry.`,
      x: 5,
      y: 3,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%COURT_TUNNEL',
      },
    },

  },
};
