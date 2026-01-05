// Underground East - Level z=-3 (Deep Eastern Tunnels)
// Transitional level connecting upper eastern tunnels to the Gray Cartel territory
// Mix of natural caverns, excavated passages, and utility infrastructure

export const building = {
  name: 'Underground East',
  x: 0,
  y: 4,
  width: 10,
  height: 9,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // VERTICAL CONNECTIONS FROM Z=-2
    // ═══════════════════════════════════════════════════════════════════════

    '%DOCK_SHAFT': {
      name: 'Loading Shaft',
      description: `A vertical shaft descends from the pergola undercroft, the remains of a freight elevator that once served the businesses above. The elevator car is gone, but the shaft remains—a concrete tube dropping into darkness.

Iron rungs set into the wall provide a precarious ladder for those willing to descend. The rungs are old but solid, their rust surface rather than structural, their grip adequate for careful climbing. The descent is not impossible. It merely requires commitment.`,
      x: -7,
      y: 4,
      z: -3,
      population: 0,
      ambientNoise: 20,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z-2.ts#%OCC_N4',
          description: 'A shaft rises toward the pergola undercroft',
        },
        down: '%DEEP_OCC',
      },
    },

    '%SLUICE_DOWN': {
      name: 'Sluice Descent',
      description: `A narrow passage follows the sluice channel downward, the water flowing alongside in a brick-lined channel. The descent is steep but navigable, the channel providing a guide through darkness that otherwise would disorient. The water knows the way. Following it leads somewhere.

The air grows colder with each step down, the temperature dropping as the passage approaches levels that never see sunlight, that never feel the warmth of surface days. The deep underground has its own climate, its own atmosphere, its own rules.`,
      x: -7,
      y: -4,
      z: -3,
      population: 0,
      ambientNoise: 35,
      lighting: 3,
      waterLevel: 40,
      outdoor: false,
      exits: {
        up: {
          to: 'z-2.ts#%OCC_S4',
          description: 'A passage rises toward the sluice chamber',
        },
        down: '%DEEP_SLUICE',
      },
    },

    '%DEEP_PUMP': {
      name: 'Deep Pump Station',
      description: `The shaft descends past the pump room into a deeper chamber where the city's original water management infrastructure still functions—or tries to. Massive pipes converge here, their Victorian engineering struggling against a water table that has risen with the city's growth.

The pumps here are a mix of centuries: cast iron behemoths from the original installation, electric replacements from various upgrades, and modern equipment that someone installed recently. The old and new work together, or fail together, in the eternal struggle to keep the deep underground dry enough to use.`,
      x: 0,
      y: -3,
      z: -3,
      population: 0,
      ambientNoise: 45,
      lighting: 25,
      waterLevel: 20,
      outdoor: false,
      exits: {
        up: {
          to: 'z-2.ts#%PUMP_ROOM',
          description: 'A shaft rises toward the pump room',
        },
        south: '%DEEP_2ND_S',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP OCCIDENTAL SECTION (beneath Occidental Ave)
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_OCC': {
      name: 'Deep Occidental',
      description: `The shaft terminates in a chamber that exists below the original underground—space that was excavated rather than inherited, dug through clay and gravel that the glaciers left behind. The walls are raw earth shored with timber and steel, the construction industrial rather than architectural.

The chamber serves as a junction between levels, a vertical hub connecting the buried streets above to the deeper network below. The infrastructure shows decades of modification: original timber replaced with steel, steel reinforced with concrete, concrete patched and repaired as settling and seepage take their toll.

Sound from above filters down—the whisper of water in the sluice system, the distant hum of the city's vibration. Sound from below is different: mechanical rhythms, the pulse of systems that serve purposes unknown to the streets above.`,
      x: -7,
      y: 4,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 15,
      waterLevel: 10,
      outdoor: false,
      exits: {
        up: '%DOCK_SHAFT',
        south: '%DEEP_OCC_S1',
        west: '%WEST_CONN',
        east: '%DEEP_OCC_E1',
      },
    },

    '%DEEP_OCC_S1': {
      name: 'Deep Passage',
      description: `The passage runs south through excavated earth, the walls showing the marks of picks and shovels rather than the precision of professional mining. This was dug by hand, by people who worked without the benefit of power tools or engineering expertise. The work is rough but effective, the passage stable despite its crude construction.

The air is cooler here than in the upper levels, the temperature dropping as the passage descends toward the deeper network. Moisture beads on the walls, condensation from air that has traveled from unknown depths.`,
      x: -7,
      y: 3,
      z: -3,
      population: 0,
      ambientNoise: 12,
      lighting: 8,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%DEEP_OCC',
        south: '%DEEP_OCC_S2',
      },
    },

    '%DEEP_OCC_S2': {
      name: 'Deep Passage',
      description: `The passage continues through a section where the excavation encountered something unexpected—the foundation of a building that was never recorded, its basement filled with rubble and sealed by whoever dug this route. The passage curves around the obstruction, evidence of adaptation rather than planning.`,
      x: -7,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 10,
      lighting: 10,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%DEEP_OCC_S1',
        south: '%DEEP_OCC_S3',
        east: '%RUBBLE_ROOM',
      },
    },

    '%RUBBLE_ROOM': {
      name: 'Rubble-Filled Chamber',
      description: `The passage opens into a chamber half-filled with collapsed masonry and debris. This was the basement of the building the tunnelers encountered—a space that was deliberately filled and sealed at some point in the past, then partially excavated again when the tunnel route required it.

Among the rubble, fragments of the building's history remain visible: broken pottery, rusted tools, the skeleton of a cast-iron stove. The debris tells a story of sudden abandonment, of a building that was not demolished but buried, its contents sealed rather than salvaged.

A narrow path has been cleared through the debris, evidence of recent passage.`,
      x: -5,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%DEEP_OCC_S2',
        east: '%RUBBLE_EAST',
      },
    },

    '%RUBBLE_EAST': {
      name: 'Cleared Passage',
      description: `The path through the rubble continues east, the debris pressed against the walls to create a narrow corridor. The work of clearing this route was significant—weeks or months of labor, judging by the volume of material moved. The effort suggests that this route matters, that the destination is worth the cost.`,
      x: -3,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%RUBBLE_ROOM',
        south: '%DEEP_ALLEY',
      },
    },

    '%DEEP_OCC_S3': {
      name: 'Deep Junction',
      description: `The passage reaches a junction where multiple routes converge—the main Occidental route from the north, passages from the east, and a steep descent toward the lower levels. The junction shows the marks of deliberate construction: the walls reinforced, the floor leveled, the space enlarged to accommodate traffic from multiple directions.

Chalk marks cover the walls here, a visual library of directions and warnings and claims. The marks layer upon each other, older symbols partially obscured by newer ones, the palimpsest of a community that communicates in codes and signs.`,
      x: -7,
      y: 1,
      z: -3,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%DEEP_OCC_S2',
        south: '%DEEP_OCC_S4',
        east: '%DEEP_MID',
      },
    },

    '%DEEP_OCC_S4': {
      name: 'Deep Passage',
      description: `The passage continues south through increasingly difficult terrain. The water table is close here, the walls seeping constantly, the floor covered with standing water that never quite drains. Progress is slow and uncomfortable, each step splashing through cold water that smells of minerals and rust.`,
      x: -7,
      y: 0,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 10,
      waterLevel: 30,
      outdoor: false,
      exits: {
        north: '%DEEP_OCC_S3',
        south: '%DEEP_OCC_S5',
      },
    },

    '%DEEP_OCC_S5': {
      name: 'Flooded Junction',
      description: `The passage opens into a junction where the water deepens to knee height, the floor having dropped during some long-past settling event. Wading is required here, the water cold enough to shock, dark enough to hide what lies beneath.

The walls show tide marks at multiple heights, evidence that the water level varies with the bay, with rainfall, with factors that are not immediately apparent. Sometimes this junction is merely wet. Sometimes it is impassable.`,
      x: -7,
      y: -1,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 8,
      waterLevel: 50,
      outdoor: false,
      exits: {
        north: '%DEEP_OCC_S4',
        east: '%SUMP_PASSAGE',
        south: '%DEEP_SLUICE',
      },
    },

    '%DEEP_SLUICE': {
      name: 'Deep Sluice Chamber',
      description: `The sluice channel from above terminates here in a deep chamber designed to manage the underground's constant battle with water. The chamber is part of the original Victorian drainage system—massive in scale, engineered with ambition that exceeded the technology available, failing slowly but inevitably against the tide.

Water pours in from the channel above and from seepage through every wall. The chamber was designed to direct this flow toward the bay through channels that are now partially blocked, damaged, or simply overwhelmed. The water finds its own way now, pooling in depths that are not easily measured.

The chamber is dominated by the remains of pumping equipment that was installed, failed, was replaced, failed again, and was finally abandoned. The machinery stands like monuments in the water, rusting testimony to the eternal struggle against the flood.`,
      x: -7,
      y: -2,
      z: -3,
      population: 0,
      ambientNoise: 40,
      lighting: 10,
      waterLevel: 60,
      outdoor: false,
      exits: {
        up: '%SLUICE_DOWN',
        north: '%DEEP_OCC_S5',
        east: '%DRAIN_TUNNEL',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EASTERN DEEP SECTION
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_OCC_E1': {
      name: 'Eastern Descent',
      description: `The passage extends east from the Occidental junction, dropping gradually as it crosses beneath the streets above. The construction here is newer than the Victorian work in the upper levels—twentieth century engineering, professional excavation, proper shoring. Someone with resources carved this route.`,
      x: -5,
      y: 4,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%DEEP_OCC',
        east: '%DEEP_2ND_N',
      },
    },

    '%DEEP_2ND_N': {
      name: 'Deep Second Avenue',
      description: `The passage reaches the deeper sections beneath Second Avenue, where the construction changes character again. This level was never part of the original underground—it was excavated later, for purposes that the surface city never knew about and would not have approved.

The walls are lined with conduit and cable, infrastructure serving systems that hum quietly in the darkness. Power flows through here, communication travels through here, the nervous system of something that lives beneath the streets.`,
      x: -2,
      y: 4,
      z: -3,
      population: 0,
      ambientNoise: 20,
      lighting: 18,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%DEEP_OCC_E1',
        south: '%DEEP_2ND_MAIN',
        east: '%CABLE_VAULT',
      },
    },

    '%CABLE_VAULT': {
      name: 'Cable Vault',
      description: `The passage opens into a chamber filled with the infrastructure of modern telecommunications—racks of cables, junction boxes, the physical reality of the invisible connections that tie the city together. The equipment is a palimpsest of technologies: nineteenth century telegraph wire next to twentieth century telephone cable next to twenty-first century fiber optic.

The vault is maintained, recently, regularly. The equipment shows signs of active use, lights blinking, fans humming, the machinery of communication functioning in the darkness beneath the streets. Someone operates from here. Someone taps the city's nervous system.`,
      x: 0,
      y: 4,
      z: -3,
      population: 0,
      ambientNoise: 30,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%DEEP_2ND_N',
        south: '%CABLE_SOUTH',
      },
    },

    '%CABLE_SOUTH': {
      name: 'Service Corridor',
      description: `A narrow corridor runs south from the cable vault, lined with the conduit that carries the city's communications. The corridor is barely wide enough for a single person to pass, the walls pressing close, the cables brushing against shoulders and arms. Maintenance in this space would be difficult. Maintenance in this space has clearly been performed.`,
      x: 0,
      y: 3,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%CABLE_VAULT',
        south: '%DEEP_2ND_MAIN',
      },
    },

    '%DEEP_2ND_MAIN': {
      name: 'Deep Second Avenue Junction',
      description: `The passages beneath Second Avenue converge here in a junction that serves as the hub of the eastern deep network. The space is large enough to accommodate groups, the ceiling high enough to stand, the construction solid enough to feel secure. This is a gathering place, a waystation, a point where routes diverge and travelers decide.

The junction shows signs of regular use: worn paths on the floor, marks on the walls where shoulders have brushed, the accumulated evidence of bodies passing through over years. The deep underground is not empty. It has never been empty. It merely hides its population from those who don't know where to look.`,
      x: -2,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 22,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%DEEP_2ND_N',
        south: '%DEEP_2ND_S',
        east: '%CABLE_SOUTH',
        west: '%DEEP_MID',
      },
    },

    '%DEEP_MID': {
      name: 'Central Passage',
      description: `The passage runs between the Occidental and Second Avenue deep sections, connecting the two halves of the eastern network. The route is well-maintained, the floor level, the walls stable, the passage clearly a primary artery in the underground circulation.`,
      x: -5,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%DEEP_2ND_MAIN',
        west: '%RUBBLE_ROOM',
        north: '%DEEP_BYPASS',
      },
    },

    '%DEEP_BYPASS': {
      name: 'Bypass Tunnel',
      description: `A narrow passage branches north from the central route, providing an alternate path that avoids the main junctions. The passage is deliberately obscure—its entrance unmarked, its route confusing, its purpose to provide escape for those who know it exists.

The walls show no chalk marks here. The absence is intentional. This route is meant to be forgotten.`,
      x: -5,
      y: 3,
      z: -3,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%DEEP_MID',
        west: '%DEEP_OCC_S1',
      },
    },

    '%DEEP_ALLEY': {
      name: 'Deep Alley',
      description: `The passage descends through a section that follows the path of the surface alley above—a service corridor carved through the deep earth, connecting the eastern tunnels to the western network. The construction is rough but functional, the work of hands that prioritized speed over aesthetics.`,
      x: -3,
      y: 1,
      z: -3,
      population: 0,
      ambientNoise: 10,
      lighting: 8,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%RUBBLE_EAST',
        south: '%DEEP_ALLEY_S',
        west: '%DEEP_OCC_S3',
      },
    },

    '%DEEP_ALLEY_S': {
      name: 'Deep Alley',
      description: `The alley passage continues south, the walls growing damper as the route approaches the water table. The floor is covered with a thin layer of water that never quite drains, the moisture a constant presence that seeps through shoes and chills feet.`,
      x: -3,
      y: 0,
      z: -3,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 20,
      outdoor: false,
      exits: {
        north: '%DEEP_ALLEY',
        south: '%SUMP_PASSAGE',
      },
    },

    '%SUMP_PASSAGE': {
      name: 'Sump Passage',
      description: `The passage enters a section that serves as a collection point for the underground's constant seepage. Water pools here, draining from multiple directions into a sump that was meant to channel it toward the bay. The sump is partially blocked, the water rising higher than it should, the passage wet enough to require wading.`,
      x: -3,
      y: -1,
      z: -3,
      population: 0,
      ambientNoise: 30,
      lighting: 8,
      waterLevel: 40,
      outdoor: false,
      exits: {
        north: '%DEEP_ALLEY_S',
        west: '%DEEP_OCC_S5',
        east: '%DEEP_2ND_S',
      },
    },

    '%DEEP_2ND_S': {
      name: 'Deep Second Avenue South',
      description: `The passage runs south beneath Second Avenue, connecting the main junction to the pump station. The route is maintained despite the constant water—evidence of regular traffic, of purposes that justify the discomfort of wading through cold underground streams.`,
      x: 0,
      y: 0,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 12,
      waterLevel: 25,
      outdoor: false,
      exits: {
        north: '%DEEP_2ND_MAIN',
        west: '%SUMP_PASSAGE',
        south: '%DEEP_PUMP',
      },
    },

    '%DRAIN_TUNNEL': {
      name: 'Drainage Tunnel',
      description: `A tunnel extends east from the sluice chamber, following the path of the original drainage system toward the bay. The tunnel is partially flooded, the water level rising and falling with the tide, the passage sometimes walkable and sometimes requiring swimming.

The walls show tide marks at multiple heights, the evidence of water levels that vary with forces beyond human control. At low tide, the tunnel is merely wet. At high tide, it is impassable. Timing matters here.`,
      x: -5,
      y: -2,
      z: -3,
      population: 0,
      ambientNoise: 35,
      lighting: 5,
      waterLevel: 70,
      outdoor: false,
      exits: {
        west: '%DEEP_SLUICE',
        east: '%DRAIN_JUNCTION',
      },
    },

    '%DRAIN_JUNCTION': {
      name: 'Drainage Junction',
      description: `Multiple drainage channels converge here in a chamber that was designed to manage the underground's water before directing it toward the bay. The chamber is dominated by iron grates and sluice gates, Victorian engineering on an impressive scale, most of it no longer functional.

A passage rises toward the surface through a maintenance shaft that was installed when the drainage system was built. The shaft is still accessible, providing a route to the streets above for those who know where it emerges.`,
      x: -2,
      y: -2,
      z: -3,
      population: 0,
      ambientNoise: 40,
      lighting: 15,
      waterLevel: 50,
      outdoor: false,
      exits: {
        west: '%DRAIN_TUNNEL',
        north: '%DEEP_2ND_S',
        up: '%MAINT_SHAFT',
      },
    },

    '%MAINT_SHAFT': {
      name: 'Maintenance Shaft',
      description: `A vertical shaft rises from the drainage junction toward the surface, lined with iron rungs set into the concrete walls. The shaft was installed when the drainage system was built, providing access for the workers who maintained the Victorian infrastructure.

The shaft still functions, its upper end emerging through a grating in an alley near Second Avenue. The grating is locked from the surface side, but the lock is old and the mechanism shows signs of regular use. Someone maintains access through this route.`,
      x: -2,
      y: -2,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%DRAIN_JUNCTION',
        up: {
          to: '2nd-ave-s/y-2.ts',
          description: 'A ladder rises toward the surface',
          hidden: true,
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TERRITORIAL BOUNDARY (connects to existing z=-4 network via park-shaft)
    // ═══════════════════════════════════════════════════════════════════════

    '%TO_GRAY_WEST': {
      name: 'Territorial Boundary',
      description: `The passage reaches the edge of Gray Cartel influence, the transition marked by construction that shifts from chaotic eastern tunnels to something more deliberate, more controlled. Chalk symbols on the walls warn of territorial claims—not threats exactly, but notices that passage beyond requires acknowledgment.

A shaft descends toward the transitional levels, where the eastern network connects to the established underground infrastructure. The descent requires commitment—the path down is steep, the rungs old, the darkness below uncertain.

The Cartel's territory lies to the west, accessible through routes that are watched if not always guarded. Permission is not always required. But permission is always noted.`,
      x: -7,
      y: 2,
      z: -3,
      population: 0,
      ambientNoise: 12,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%DEEP_OCC_S2',
        south: '%DEEP_ALLEY',
        down: {
          to: 'underground/transitional/park-shaft.ts',
          description: 'A shaft descends toward the transitional levels',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WESTERN CONNECTION (to existing upper tunnels)
    // ═══════════════════════════════════════════════════════════════════════

    '%WEST_CONN': {
      name: 'Western Passage',
      description: `A passage extends west toward the main underground network, connecting the eastern deep sections to the established tunnels beneath First Avenue. The passage shows signs of long use—the walls worn smooth, the floor polished by countless feet, the route established by generations of underground travelers.`,
      x: -9,
      y: 4,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: '%DEEP_OCC',
        west: {
          to: 'underground/transitional/junction-shaft.ts',
          description: 'A passage leads west toward the Junction Shaft',
        },
      },
    },

    '%SLUICE_CHANNEL': {
      name: 'Sluice Channel',
      description: `Water flows through this brick-lined channel, a Victorian engineering marvel designed to manage the constant seepage from the underground. The sluice directs water toward the bay, its iron gates long since rusted open, the flow controlled now only by gravity and the water table.

The channel is wide enough to walk beside the water, the stone ledge slick with accumulated moisture. The walls show high-water marks from decades of flooding, the stains marking the rhythm of wet and dry seasons.`,
      x: -5,
      y: -2,
      z: -3,
      population: 0,
      ambientNoise: 40,
      lighting: 8,
      waterLevel: 50,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/arterial-tunnel/z-3.ts',
          room: '%ARTERY_HUB',
          description: 'A passage leads west along the sluice channel',
        },
        up: '%SLUICE_DOWN',
        north: '%DEEP_SLUICE',
      },
    },
  },
};
