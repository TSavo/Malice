// Deep Connector - Level z=-4 (Cross-Network Passage)
// Connects the three isolated z=-4 zones:
// - Gray Cartel territory (underground-complex) in the west
// - Deep Cisterns in the center
// - Flooded Sewers/Industrial in the east
// Ancient pre-fire passages discovered and expanded by various groups

export const building = {
  name: 'Deep Connector',
  x: -8,
  y: -4,
  width: 16,
  height: 5,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // WESTERN CONNECTION (to Gray Cartel territory)
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_W1': {
      name: 'Deep Western Access',
      description: `A narrow passage branches from the Cartel's lower network, descending through rock that shows the marks of old excavation—pick marks rather than drill holes, the work of people who dug by hand. This passage predates the Cartel's occupation by decades.

The Cartel has reinforced the route but not expanded it, preserving the narrow dimensions that limit traffic. The restriction is intentional—this is a connection, not a highway. Movement is possible. Mass movement is not.

The air is damp here, the moisture increasing as the passage extends east toward the water table. The walls glisten with seepage that the Cartel's drainage cannot fully control.`,
      x: -8,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/underground-complex/z-4.ts',
          room: '%X8Y_4',
          description: 'A passage leads west toward the Cartel network',
        },
        east: '%DEEP_W2',
      },
      objects: [
        { prototype: 'sign', name: 'old pick marks', description: 'The walls show the rhythmic marks of hand excavation—pickaxe strikes that predate power tools. Someone dug this by lantern light.', boltedDown: true },
      ],
    },

    '%DEEP_W2': {
      name: 'Ancient Passage',
      description: `The passage runs through construction that predates Seattle's great fire—rough-hewn stone, timber supports that have somehow survived a century of moisture, the infrastructure of the original city. This tunnel was here before the streets were raised. It was here before the Cartel. It may have been here before Seattle.

The construction is different from the tunnels above. The dimensions are smaller, the ceiling lower, sized for people of a different era. The passage feels old in a way that the underground above does not.`,
      x: -6,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 8,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%DEEP_W1',
        east: '%DEEP_JUNCTION_W',
      },
    },

    '%DEEP_JUNCTION_W': {
      name: 'Western Deep Junction',
      description: `The ancient passage opens into a natural cavern that the original excavators incorporated into their route. The space is larger than the tunnel, the ceiling rising into darkness, the walls receding to dimensions that feel less constructed than discovered.

Water drips from above, collecting in pools that fill depressions in the rock floor. The drainage is natural, the water finding paths that existed before anyone dug here. The cavern has been used—the evidence is clear in fire scars and scattered debris—but not maintained.

Routes branch north and east, the passages showing different construction styles. The northern route is older, perhaps original. The eastern route was cut later, connecting to infrastructure that didn't exist when the first passage was made.`,
      x: -4,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 15,
      lighting: 5,
      waterLevel: 12,
      outdoor: false,
      exits: {
        west: '%DEEP_W2',
        east: '%DEEP_CENTER_W',
        north: '%DEEP_CAVERN_N',
      },
      objects: [
        { prototype: 'furniture', name: 'a dripping formation', description: 'Water drips from a stalactite-like formation, the minerals building slowly over decades. The drip is constant, the sound rhythmic.', boltedDown: true },
        { prototype: 'sign', name: 'fire scars', description: 'The rock is blackened in places where fires were built—camps, perhaps, or signals. The scars are old, layers of soot over decades.', boltedDown: true },
      ],
    },

    '%DEEP_CAVERN_N': {
      name: 'Northern Cavern',
      description: `The cavern extends north through natural formation, the passage following a fault line that water carved before humans arrived. The walls show the smooth curves of water erosion, the shapes organic rather than constructed.

This section connects upward to the transitional network, a shaft rising through rock toward the z=-3 passages. The shaft is natural, a vertical crack that someone widened enough for passage. The climb is possible but dangerous.`,
      x: -4,
      y: -2,
      z: -4,
      population: 0,
      ambientNoise: 10,
      lighting: 3,
      waterLevel: 15,
      outdoor: false,
      exits: {
        south: '%DEEP_JUNCTION_W',
        up: {
          to: 'buildings/arterial-tunnel/z-3.ts',
          room: '%ARTERY_CENTER_S4',
          description: 'A natural shaft rises toward the arterial',
          hidden: true,
        },
      },
      objects: [
        { prototype: 'sign', name: 'rope fragments', description: 'Frayed rope hangs from pitons driven into the rock—evidence of climbs made and abandoned. The equipment is old, the rope rotted.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // CENTRAL SECTION (through the cistern network)
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_CENTER_W': {
      name: 'Cistern Approach',
      description: `The passage approaches the deep cistern network, the construction transitioning from ancient excavation to Victorian engineering. The walls change from rough stone to shaped brick, the architecture of the city's original water system appearing through the darkness.

The air grows damper, the moisture no longer seepage but atmosphere. The cisterns ahead still hold water, their reservoirs fed by sources that the modern city has forgotten. The smell is mineral, clean—groundwater rather than runoff.`,
      x: -2,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 18,
      lighting: 8,
      waterLevel: 15,
      outdoor: false,
      exits: {
        west: '%DEEP_JUNCTION_W',
        east: '%CISTERN_WEST',
      },
    },

    '%CISTERN_WEST': {
      name: 'Western Cistern',
      description: `The passage opens into a brick-lined chamber that was built to hold water—a cistern from Seattle's original water system, constructed before the fire, before the regrading, before the city above forgot what lay beneath. The chamber is domed, the architecture designed to contain pressure, the construction professional and precise.

The cistern still functions, partially. Water fills the lower section, the level rising and falling with the seasons. The brickwork above the waterline is dry but stained, the high-water marks documenting decades of variation.

A walkway runs around the cistern's edge, the path narrow but passable. The walkway connects to passages east and west, the cistern serving as a junction in a network that the city no longer maintains.`,
      x: 0,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 22,
      lighting: 10,
      waterLevel: 25,
      outdoor: false,
      exits: {
        west: '%DEEP_CENTER_W',
        east: '%CISTERN_CENTER',
        north: '%CISTERN_N_PASSAGE',
      },
      objects: [
        { prototype: 'furniture', name: 'a cistern walkway', description: 'A narrow brick walkway circles the cistern edge, just wide enough for single-file passage. The bricks are worn smooth by water and time.', boltedDown: true },
        { prototype: 'sign', name: 'construction date', description: 'A stone lintel above the eastern passage is carved: "SEATTLE WATER CO. 1887". Two years before the fire. This survived.', boltedDown: true },
      ],
    },

    '%CISTERN_N_PASSAGE': {
      name: 'Cistern North Passage',
      description: `A brick-lined passage runs north from the western cistern, connecting to the network of chambers that once supplied water to the city above. The passage is dry, elevated above the cistern's water level, its construction showing the same Victorian craftsmanship as the chamber it serves.

The passage connects to routes that lead upward, toward the z=-3 network. The connections were made later, breaking through the original construction to create access that the builders never intended.`,
      x: 0,
      y: -2,
      z: -4,
      population: 0,
      ambientNoise: 15,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        south: '%CISTERN_WEST',
        up: {
          to: 'buildings/arterial-tunnel/z-3.ts',
          room: '%ARTERY_CENTER_S2',
          description: 'A rough shaft rises toward the arterial',
        },
      },
    },

    '%CISTERN_CENTER': {
      name: 'Central Cistern',
      description: `The largest of the cistern chambers, a vaulted space that once held the primary reservoir for Pioneer Square's water supply. The dome rises thirty feet overhead, the brickwork displaying the ambition of Victorian engineers who built for permanence.

The water level here is higher than in the adjacent chambers, the central cistern still receiving flow from sources unknown. The water is cold, clear, fed by springs that predate the city's plumbing. Someone could drink from this reservoir. Someone probably does.

Passages radiate from the central chamber like spokes from a hub—the cistern network was designed for distribution, with routes connecting to buildings that have long since been demolished or forgotten.`,
      x: 2,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 25,
      lighting: 12,
      waterLevel: 30,
      outdoor: false,
      exits: {
        west: '%CISTERN_WEST',
        east: '%CISTERN_EAST',
        north: '%CISTERN_SHAFT',
        south: '%CISTERN_DEEP',
      },
      objects: [
        { prototype: 'furniture', name: 'a central column', description: 'A brick column rises from the water to support the dome above. The column is wrapped in iron bands, the reinforcement added when the original construction proved inadequate.', boltedDown: true },
        { prototype: 'sign', name: 'water level marks', description: 'Painted marks on the column indicate water levels: numbers in faded paint documenting decades of measurement. The highest mark is alarming. The lowest is reassuring. The current level is between them.', boltedDown: true },
      ],
    },

    '%CISTERN_SHAFT': {
      name: 'Cistern Shaft',
      description: `A vertical shaft rises from the central cistern toward the surface, the original access point for maintenance and inspection. The shaft is lined with the same Victorian brick as the chambers below, the construction professional despite the confined space.

A ladder is bolted to one wall, the rungs iron, some missing, all corroded. The climb is possible but requires care. The shaft connects to the z=-3 network above, breaking through into passages that were cut decades after the cistern was built.`,
      x: 2,
      y: -2,
      z: -4,
      population: 0,
      ambientNoise: 18,
      lighting: 5,
      waterLevel: 10,
      outdoor: false,
      exits: {
        south: '%CISTERN_CENTER',
        up: {
          to: 'buildings/arterial-tunnel/z-3.ts',
          room: '%ARTERY_CENTER_S1',
          description: 'An iron ladder rises toward the arterial',
        },
      },
      objects: [
        { prototype: 'furniture', name: 'an iron ladder', description: 'A corroded iron ladder climbs the shaft wall, bolted to the brick at intervals. Several rungs are missing. The remaining rungs are slick with condensation.', boltedDown: true },
      ],
    },

    '%CISTERN_DEEP': {
      name: 'Deep Cistern Access',
      description: `A passage descends from the central cistern toward the deepest chambers of the water system—reservoirs that tap directly into the water table, their levels controlled by hydrology rather than infrastructure. The passage is wet, the walls streaming with groundwater that the builders learned to channel rather than fight.

The deep chambers are partially flooded year-round, accessible only to those willing to wade or swim. The passage ends at water that varies from knee-deep to chest-deep depending on the season.`,
      x: 2,
      y: -6,
      z: -4,
      population: 0,
      ambientNoise: 30,
      lighting: 3,
      waterLevel: 40,
      outdoor: false,
      exits: {
        north: '%CISTERN_CENTER',
        down: {
          to: 'buildings/flooded-sewers/z-4.ts',
          room: '%DEEP_POOL',
          description: 'The passage descends into flooded depths',
          hidden: true,
        },
      },
      objects: [
        { prototype: 'sign', name: 'a depth marker', description: 'A pole is driven into the passage floor, marked with measurements. The current water level reads three feet. The highest mark reads seven.', boltedDown: true },
      ],
    },

    '%CISTERN_EAST': {
      name: 'Eastern Cistern',
      description: `The eastern chamber of the cistern network, smaller than the central reservoir but still substantial. This cistern shows more damage than its neighbors—cracks in the brickwork, sections that have been patched with concrete, the evidence of a century's worth of improvised repairs.

The water level is lower here, the chamber draining through cracks that the patches couldn't seal. The leakage flows east, toward the flooded sewers that occupy the network's eastern extent.`,
      x: 4,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 28,
      lighting: 8,
      waterLevel: 20,
      outdoor: false,
      exits: {
        west: '%CISTERN_CENTER',
        east: '%DEEP_CENTER_E',
      },
      objects: [
        { prototype: 'sign', name: 'patched cracks', description: 'Concrete patches cover sections of the brick walls—repairs made with whatever materials were available. Some patches are holding. Others are failing.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EASTERN CONNECTION (to Flooded Sewers/Industrial)
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_CENTER_E': {
      name: 'Eastern Passage',
      description: `The passage transitions from the Victorian construction of the cisterns to the industrial infrastructure of the sewer network. The brickwork gives way to concrete, the architecture shifting from nineteenth century to twentieth, the purpose changing from water supply to waste removal.

The air changes too—the mineral smell of groundwater replaced by something more organic, the atmosphere of the sewers seeping west through passages that were never meant to connect.`,
      x: 6,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 32,
      lighting: 10,
      waterLevel: 25,
      outdoor: false,
      exits: {
        west: '%CISTERN_EAST',
        east: '%DEEP_JUNCTION_E',
      },
    },

    '%DEEP_JUNCTION_E': {
      name: 'Eastern Deep Junction',
      description: `The passage reaches a junction where the cistern drainage meets the sewer infrastructure—two systems that were built separately but connected by water that doesn't respect human engineering. The junction is wet, the floor covered with standing water that flows slowly east.

Routes branch north toward the industrial underground and east toward the flooded sewers proper. The northern route is drier, maintained by utility workers who focus on the infrastructure and ignore the passages. The eastern route is abandoned, the sewers that way having failed decades ago.`,
      x: 8,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 35,
      lighting: 12,
      waterLevel: 30,
      outdoor: false,
      exits: {
        west: '%DEEP_CENTER_E',
        east: '%SEWER_ACCESS',
        north: '%INDUSTRIAL_DEEP',
      },
      objects: [
        { prototype: 'sign', name: 'a warning sign', description: 'A rusted metal sign reads: "DANGER - COMBINED SEWER OVERFLOW - DO NOT ENTER DURING RAIN". The sign is official but ancient.', boltedDown: true },
      ],
    },

    '%INDUSTRIAL_DEEP': {
      name: 'Industrial Deep Access',
      description: `A passage rises toward the industrial underground, connecting the deep network to the utility infrastructure that serves the buildings above. The passage is drier than the junction below, the elevation providing drainage that the lower sections lack.

This route is occasionally used by utility workers, the passage showing signs of recent traffic—footprints in the sediment, equipment left for return trips, the evidence of people who come and go.`,
      x: 8,
      y: -2,
      z: -4,
      population: 0,
      ambientNoise: 25,
      lighting: 15,
      waterLevel: 15,
      outdoor: false,
      exits: {
        south: '%DEEP_JUNCTION_E',
        up: {
          description: 'A utility shaft rises toward King Street',
        },
      },
      objects: [
        { prototype: 'crate', name: 'utility equipment', description: 'Coiled cables and pipe fittings are stacked against the wall, left by workers who will return for them. The equipment is modern.', boltedDown: false },
      ],
    },

    '%SEWER_ACCESS': {
      name: 'Sewer Network Access',
      description: `The passage enters the flooded sewer network proper—a system of combined storm and sanitary sewers that overwhelms during heavy rain. The infrastructure here is twentieth century, concrete rather than brick, sized for the city's growth rather than its founding.

The water is deeper here, rising to ankle depth even in dry weather. During rain, the passage becomes impassable, the combined flow overwhelming the capacity that the engineers calculated. The smell is organic, the air thick with the evidence of what flows through these tunnels.

This is the eastern extent of the deep connector—beyond lies the flooded sewers, accessible only to those willing to wade through what the city discards.`,
      x: 10,
      y: -4,
      z: -4,
      population: 0,
      ambientNoise: 40,
      lighting: 8,
      waterLevel: 35,
      outdoor: false,
      exits: {
        west: '%DEEP_JUNCTION_E',
        east: {
          to: 'buildings/flooded-sewers/z-4.ts',
          room: '%OVERFLOW_W',
          description: 'The passage continues east into the flooded sewers',
        },
      },
      objects: [
        { prototype: 'sign', name: 'a flow gauge', description: 'A mechanical gauge is mounted on the wall, measuring water flow through the passage. The needle sits at LOW in dry weather. The red zone is labeled OVERFLOW.', boltedDown: true },
      ],
    },
  },
};
