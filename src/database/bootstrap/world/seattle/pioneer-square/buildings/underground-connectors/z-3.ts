// Z=-3 Connecting Passages
// Transitional level between upper tunnels (z=-2) and deep passages (z=-4)
// Contains rail infrastructure, drainage systems, homeless territories, and transit corridors

export const building = {
  name: 'Transitional Passages Z-3',
  x: -25,
  y: -20,
  width: 45,
  height: 35,
  floors: 1,

  rooms: {
  // ═══════════════════════════════════════════════════════════════════════════
  // DEEP SOUTH - RAIL & FREIGHT INFRASTRUCTURE (y=-7 to -17)
  // Old rail tunnels, freight passages, industrial remnants
  // ═══════════════════════════════════════════════════════════════════════════

  '%UTILITY_DESCENT': {
    name: 'Utility Descent',
    description: `A maintenance shaft connects the Utility Main above to the Sewer Junction below. Rusty pipes and cable bundles line the walls, descending into the infrastructure depths. The shaft is narrow, forcing single-file passage.

Emergency lights flicker at intervals, battery-powered and failing. No one maintains this route anymore.`,
    x: 13,
    y: -16,
    z: -3,
    population: 0,
    ambientNoise: 35,
    lighting: 3,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/industrial-underground/z-3.ts',
        room: '%UTILITY_MAIN',
        description: 'The shaft ascends toward the Utility Main',
      },
      south: {
        to: 'buildings/industrial-underground/z-3.ts',
        room: '%SEWER_JUNCTION',
        description: 'The shaft descends toward the Sewer Junction',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'cable bundles', description: 'Thick bundles of cables run along the walls—power, data, telephone. Some are live, some long dead.', boltedDown: true },
      { prototype: 'furniture', name: 'failing emergency lights', description: 'Battery-powered emergency lights flicker weakly. Their ten-year batteries are well past expiration.', boltedDown: true },
    ],
  },

  '%OVERFLOW_LINK_W': {
    name: 'Overflow Passage West',
    description: `A connecting tunnel between the Deep Rail Junction and the Overflow Chamber. The passage was designed for emergency drainage during floods—the floor slopes toward the overflow system. Water stains mark past high-water events.

Rail infrastructure gives way to drainage infrastructure. The smell changes accordingly.`,
    x: -6,
    y: -12,
    z: -3,
    population: 0,
    ambientNoise: 40,
    lighting: 2,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/rail-underground/z-3.ts',
        room: '%RAIL_JUNCTION',
        description: 'The passage leads to the Deep Rail Junction',
      },
      east: {
        to: 'buildings/flooded-sewers/z-3.ts',
        room: '%OVERFLOW',
        description: 'The passage continues to the Overflow Chamber',
      },
      down: {
        to: 'underground/lower-passages/z-4-connectors.ts',
        room: '%SEWER_LINK',
        description: 'A drainage shaft descends to the sewer network',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'sloping floor', description: 'The floor slopes noticeably toward the east, designed to channel floodwater toward the overflow system.', boltedDown: true },
      { prototype: 'furniture', name: 'high-water marks', description: 'Dark stains on the walls mark past floods—some ankle height, some chest height, one disturbingly near the ceiling.', boltedDown: true },
    ],
  },

  '%BAGGAGE_LINK': {
    name: 'Baggage Tunnel',
    description: `A passage connecting the Overflow Chamber to the Deep Baggage Level. This was once a luggage handling tunnel, moving bags between platforms. The conveyor system is long dead, but the tunnel remains—now used by those who have nowhere else to go.

Abandoned luggage still lines the walls, decades old, their owners long forgotten.`,
    x: -4,
    y: -12,
    z: -3,
    population: 0,
    ambientNoise: 25,
    lighting: 2,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/flooded-sewers/z-3.ts',
        room: '%OVERFLOW',
        description: 'The tunnel leads to the Overflow Chamber',
      },
      east: {
        to: 'buildings/rail-underground/z-3.ts',
        room: '%BAGGAGE',
        description: 'The tunnel continues to the Deep Baggage Level',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'dead conveyor', description: 'A baggage conveyor runs along one wall, motionless for decades. Rubber belts have perished to dust.', boltedDown: true },
      { prototype: 'furniture', name: 'abandoned luggage', description: 'Old suitcases and bags line the walls—leather, canvas, hard plastic. Their owners never claimed them.', boltedDown: true },
    ],
  },

  '%FREIGHT_DESCENT': {
    name: 'Freight Descent',
    description: `A steep ramp connects the Deep Rail Junction to the Deep Freight Main below. Heavy cargo once rolled down this slope on industrial carts. The walls are scarred by decades of impacts—cargo that didn't stop in time.

Now rats use the ramp as a highway between territories.`,
    x: -7,
    y: -11,
    z: -3,
    population: 0,
    ambientNoise: 35,
    lighting: 1,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/rail-underground/z-3.ts',
        room: '%RAIL_JUNCTION',
        description: 'The ramp rises toward the Deep Rail Junction',
      },
      north: {
        to: 'buildings/freight-underground/z-3.ts',
        room: '%FREIGHT_MAIN',
        description: 'The ramp descends toward the Deep Freight Main',
      },
      west: '%OVERFLOW_LINK_W',
    },
    objects: [
      { prototype: 'furniture', name: 'impact scars', description: 'Deep gouges in the walls mark where heavy cargo failed to stop. Some are old, some newer. Accidents happen.', boltedDown: true },
      { prototype: 'furniture', name: 'rat traffic', description: 'Rat droppings and fur mark heavy traffic. This is a major transit route for the colony.', boltedDown: true },
    ],
  },

  '%RAT_BORDER_S': {
    name: 'Rat Border South',
    description: `A contested zone between the Rat Border above and the Deep Freight Main below. Territorial markers cover every surface—rat urine, scratches, the occasional dried blood. The border shifts constantly as colonies expand and contract.

Crossing uninvited risks attack. The rats are always watching.`,
    x: -7,
    y: -9,
    z: -3,
    population: 0,
    ambientNoise: 45,
    lighting: 1,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/rat-pits/z-3.ts',
        room: '%RAT_BORDER',
        description: 'The passage rises toward the Rat Border',
      },
      south: {
        to: 'buildings/freight-underground/z-3.ts',
        room: '%FREIGHT_MAIN',
        description: 'The passage descends toward the Deep Freight Main',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'territorial markers', description: 'Every surface is marked—urine, scratches, gnaw marks. The message is clear: this territory is claimed.', boltedDown: true },
      { prototype: 'sign', name: 'warning scratches', description: 'Human scratches on the wall: "DON\'T RUN. DON\'T SHOW FEAR. JUST WALK."', boltedDown: true },
    ],
  },

  '%DRAINAGE_LINK': {
    name: 'Drainage Connector',
    description: `A flooded passage connects the Flood Zone to the Drainage Access. Water flows steadily through the channel, carrying runoff from the upper levels. The passage is navigable but wet—ankle-deep in dry weather, impassable during storms.

Warning signs are posted at both ends. Not everyone heeds them.`,
    x: -6,
    y: -7,
    z: -3,
    population: 0,
    ambientNoise: 50,
    lighting: 2,
    waterLevel: 30,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/flooded-zones/z-3.ts',
        room: '%FLOOD_ZONE',
        description: 'The passage leads to the Flood Zone',
      },
      east: {
        to: 'buildings/drainage/z-3.ts',
        room: '%DRAINAGE_ACCESS',
        description: 'The passage continues to the Drainage Access',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'flowing water', description: 'Water streams through the channel, cold and fast. The flow increases dramatically during rain.', boltedDown: true },
      { prototype: 'sign', name: 'flood warnings', description: 'Signs at both ends: "IMPASSABLE DURING STORMS - FLASH FLOOD RISK". The warnings are faded but serious.', boltedDown: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SLUICE & DRAINAGE SYSTEM (y=-2 to -6)
  // Water management infrastructure, some operational, some abandoned
  // ═══════════════════════════════════════════════════════════════════════════

  '%SHRINE_DESCENT': {
    name: 'Shrine Descent',
    description: `A narrow passage connects the Deeper Tunnels above to the Hidden Shrine below. The walls are worn smooth by centuries of passage—pilgrims, perhaps, or simply water. The air grows colder as you descend, carrying the scent of incense and decay.

Someone still tends the shrine. The candles are fresh.`,
    x: -10,
    y: -5,
    z: -3,
    population: 0,
    ambientNoise: 15,
    lighting: 4,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/deep-tunnels/z-3.ts',
        room: '%DEEPER',
        description: 'The passage rises toward the Deeper Tunnels',
      },
      south: {
        to: 'buildings/secret-spaces/z-3.ts',
        room: '%SHRINE',
        description: 'The passage descends toward the Hidden Shrine',
      },
      east: '%QUARANTINE_LINK',
    },
    objects: [
      { prototype: 'furniture', name: 'worn walls', description: 'The stone is polished smooth by countless hands over centuries. This path is ancient.', boltedDown: true },
      { prototype: 'furniture', name: 'incense traces', description: 'The faint scent of incense lingers—sandalwood and something older. Someone maintains the shrine.', boltedDown: true },
    ],
  },

  '%SLUICE_DESCENT': {
    name: 'Sluice Descent',
    description: `A steep water channel connects the Sluice Descent above to the Quarantine Zone below. The sluice was designed to flush debris from the upper tunnels—now it flushes whatever falls in. The walls are slick with algae and unidentifiable slime.

Climbing back up is nearly impossible. Most go down and find another way out.`,
    x: -7,
    y: -5,
    z: -3,
    population: 0,
    ambientNoise: 55,
    lighting: 1,
    waterLevel: 40,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/sluice-system/z-3.ts',
        room: '%SLUICE',
        description: 'The sluice rises toward the Sluice Descent',
      },
      south: {
        to: 'buildings/quarantine/z-3.ts',
        room: '%QUARANTINE',
        description: 'The sluice descends toward the Quarantine Zone',
      },
      west: '%SHRINE_DESCENT',
    },
    objects: [
      { prototype: 'furniture', name: 'algae-slick walls', description: 'Green-black slime coats every surface. Handholds are impossible. Falling is easy.', boltedDown: true },
      { prototype: 'sign', name: 'one-way warning', description: 'Scratched into the stone at the top: "ONE WAY DOWN. FIND ANOTHER WAY OUT."', boltedDown: true },
    ],
  },

  '%QUARANTINE_LINK': {
    name: 'Quarantine Approach',
    description: `A sealed passage leads toward the Quarantine Zone. The door has been welded shut from the outside—quarantine is one-way. Someone has cut a hole through the metal, large enough for a person to crawl through. The edges are sharp.

Whatever was quarantined here, some decided the risk was worth taking.`,
    x: -7,
    y: -5,
    z: -3,
    population: 0,
    ambientNoise: 20,
    lighting: 2,
    outdoor: false,
    exits: {
      west: '%SHRINE_DESCENT',
      east: '%SLUICE_DESCENT',
    },
    objects: [
      { prototype: 'furniture', name: 'welded door', description: 'A heavy steel door is welded to its frame. Someone has cut through with a plasma torch.', boltedDown: true },
      { prototype: 'sign', name: 'quarantine warning', description: 'A faded biohazard sign: "QUARANTINE - NO ENTRY". The date is from 1987.', boltedDown: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RAIL NETWORK EAST (x=8-14, y=-5 to -4)
  // Active and abandoned rail infrastructure
  // ═══════════════════════════════════════════════════════════════════════════

  '%RAIL_CONNECTOR_W': {
    name: 'Rail Connector West',
    description: `A connecting passage between the Rail Tunnel West and the Rail Tunnel Main. The passage runs alongside the tracks, protected by a low barrier that has seen better days. Graffiti covers the walls—transit workers leaving their marks over decades.

The rumble of distant trains is constant. This section is still occasionally used.`,
    x: 9,
    y: -5,
    z: -3,
    population: 0,
    ambientNoise: 60,
    lighting: 5,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/rail-tunnels/z-3.ts',
        room: '%RAIL_WEST',
        description: 'The passage leads to Rail Tunnel West',
      },
      east: {
        to: 'buildings/rail-tunnels/z-3.ts',
        room: '%RAIL_MAIN',
        description: 'The passage continues to Rail Tunnel Main',
      },
      south: '%RAIL_SERVICE_W',
    },
    objects: [
      { prototype: 'furniture', name: 'safety barrier', description: 'A low concrete barrier separates the walkway from the tracks. It\'s crumbling in places.', boltedDown: true },
      { prototype: 'furniture', name: 'worker graffiti', description: 'Names and dates cover the walls—transit workers marking their territory. Some go back to the 1940s.', boltedDown: true },
    ],
  },

  '%RAIL_CONNECTOR_E': {
    name: 'Rail Connector East',
    description: `A passage connecting the Rail Tunnel Main to the Rail Tunnel East. This section sees less traffic—the eastern tunnels are largely abandoned. Emergency lighting is spaced further apart, and the darkness between pools of light is absolute.

Something has built nests in the cable trays overhead.`,
    x: 11,
    y: -5,
    z: -3,
    population: 0,
    ambientNoise: 45,
    lighting: 3,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/rail-tunnels/z-3.ts',
        room: '%RAIL_MAIN',
        description: 'The passage leads to Rail Tunnel Main',
      },
      east: {
        to: 'buildings/rail-tunnels/z-3.ts',
        room: '%RAIL_EAST',
        description: 'The passage continues to Rail Tunnel East',
      },
      south: '%RAIL_SERVICE_E',
    },
    objects: [
      { prototype: 'furniture', name: 'sparse lighting', description: 'Emergency lights are spaced far apart here. The darkness between them swallows sound.', boltedDown: true },
      { prototype: 'furniture', name: 'overhead nests', description: 'Something has built nests in the cable trays. Debris and droppings fall occasionally.', boltedDown: true },
    ],
  },

  '%RAIL_SERVICE_W': {
    name: 'Rail Service West',
    description: `A service passage connecting the Rail Junction to the Rail Service Corridor. The passage is lined with electrical panels and junction boxes—the nervous system of the rail network. Some panels are active, humming with power. Others are dead, their circuits long failed.

Warning signs about electrocution are prominently posted.`,
    x: 9,
    y: -4,
    z: -3,
    population: 0,
    ambientNoise: 40,
    lighting: 6,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/rail-tunnels/z-3.ts',
        room: '%JUNCTION',
        description: 'The passage leads to the Rail Junction',
      },
      east: {
        to: 'buildings/rail-tunnels/z-3.ts',
        room: '%SERVICE_CORRIDOR',
        description: 'The passage continues to the Rail Service Corridor',
      },
      north: '%RAIL_CONNECTOR_W',
    },
    objects: [
      { prototype: 'furniture', name: 'electrical panels', description: 'Banks of electrical panels line the walls. Some hum with active power; others are silent and dark.', boltedDown: true },
      { prototype: 'sign', name: 'electrocution warnings', description: 'Red signs warn: "DANGER - HIGH VOLTAGE - AUTHORIZED PERSONNEL ONLY". The warnings are serious.', boltedDown: true },
    ],
  },

  '%RAIL_SERVICE_E': {
    name: 'Rail Service East',
    description: `A service passage connecting the Rail Service Corridor to the Rail Tunnel Approach. This section is older, the equipment dating to the original construction. Brass fittings and cast iron contrast with the modern additions.

Someone has been salvaging copper wire. Fresh cuts mark recent visits.`,
    x: 11,
    y: -4,
    z: -3,
    population: 0,
    ambientNoise: 35,
    lighting: 4,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/rail-tunnels/z-3.ts',
        room: '%SERVICE_CORRIDOR',
        description: 'The passage leads to the Rail Service Corridor',
      },
      east: {
        to: 'buildings/rail-tunnels/z-3.ts',
        room: '%APPROACH',
        description: 'The passage continues to the Rail Tunnel Approach',
      },
      north: '%RAIL_CONNECTOR_E',
    },
    objects: [
      { prototype: 'furniture', name: 'antique equipment', description: 'Old brass fittings and cast iron housings mix with modern additions. The infrastructure spans a century.', boltedDown: true },
      { prototype: 'furniture', name: 'copper salvage', description: 'Fresh cuts mark where copper wire has been stripped. Scrap metal has value.', boltedDown: true },
    ],
  },

  '%RAIL_ACCESS_LINK': {
    name: 'Rail Access Link',
    description: `A connecting passage between the Rail Tunnel Approach and the Rail Access Shaft. The passage opens into a wider shaft area, where vertical access to other levels is possible. Ladder rungs ascend and descend into darkness.

This is a major junction point in the abandoned rail network.`,
    x: 13,
    y: -4,
    z: -3,
    population: 0,
    ambientNoise: 30,
    lighting: 3,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/rail-tunnels/z-3.ts',
        room: '%APPROACH',
        description: 'The passage leads to the Rail Tunnel Approach',
      },
      east: {
        to: 'buildings/rail-tunnels/z-3.ts',
        room: '%ACCESS_SHAFT',
        description: 'The passage opens to the Rail Access Shaft',
      },
      down: '%UTILITY_DESCENT',
    },
    objects: [
      { prototype: 'furniture', name: 'vertical shafts', description: 'Ladder rungs disappear into darkness both up and down. The shaft connects multiple levels.', boltedDown: true },
      { prototype: 'furniture', name: 'junction markings', description: 'Spray-painted arrows and codes mark routes. The abandoned rail network has its own navigation system.', boltedDown: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOMELESS ENCAMPMENT AREA (x=-10 to -13, y=-4 to -2)
  // Territory of the underground homeless community
  // ═══════════════════════════════════════════════════════════════════════════

  '%FAMILY_LINK': {
    name: 'Family Passage',
    description: `A carefully maintained passage connects the Family Section to the Storage Alcove. Unlike most of the underground, this section is swept clean and lit with battery-powered lanterns. Children's drawings are taped to the walls—hope in the darkness.

The community protects this area. Strangers are watched carefully.`,
    x: -13,
    y: -3,
    z: -3,
    population: 0,
    ambientNoise: 25,
    lighting: 5,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/homeless-warrens/z-3.ts',
        room: '%FAMILY',
        description: 'The passage leads to the Family Section',
      },
      south: {
        to: 'buildings/homeless-warrens/z-3.ts',
        room: '%STORAGE',
        description: 'The passage continues to the Storage Alcove',
      },
      east: '%ENCAMPMENT_LINK',
    },
    objects: [
      { prototype: 'furniture', name: 'children\'s drawings', description: 'Crayon drawings are taped to the walls—houses, suns, families. Dreams of a life above.', boltedDown: true },
      { prototype: 'furniture', name: 'battery lanterns', description: 'LED lanterns provide steady light. Someone ensures they always have batteries.', boltedDown: true },
    ],
  },

  '%ENCAMPMENT_LINK': {
    name: 'Encampment Approach',
    description: `A passage connecting the Main Encampment to the Deeper Tunnels. This is the main entrance to the homeless community—watched by sentries who keep track of everyone entering and leaving. Trust is earned slowly here.

The passage smells of cooking food and unwashed bodies. Life persists.`,
    x: -10,
    y: -3,
    z: -3,
    population: 0,
    ambientNoise: 40,
    lighting: 4,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/homeless-warrens/z-3.ts',
        room: '%ENCAMPMENT',
        description: 'The passage leads to the Main Encampment',
      },
      south: {
        to: 'buildings/deep-tunnels/z-3.ts',
        room: '%DEEPER',
        description: 'The passage continues to the Deeper Tunnels',
      },
      west: '%FAMILY_LINK',
      east: '%SLUICE_LINK',
    },
    objects: [
      { prototype: 'furniture', name: 'sentry post', description: 'A makeshift chair marks the sentry post. Someone is always watching who comes and goes.', boltedDown: true },
      { prototype: 'furniture', name: 'life signs', description: 'The smell of cooking, the murmur of voices, the occasional laugh. Community exists in the darkness.', boltedDown: true },
    ],
  },

  '%SLUICE_LINK': {
    name: 'Sluice Channel Approach',
    description: `A passage connecting the Deep Sluice Chamber to the Sluice Descent. Water noise grows louder ahead—the sluice system is active, draining the upper levels. The walls are damp, and the floor is slick.

A rope handline has been installed. It's the only thing preventing falls.`,
    x: -7,
    y: -3,
    z: -3,
    population: 0,
    ambientNoise: 55,
    lighting: 2,
    waterLevel: 20,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/sluice-system/z-3.ts',
        room: '%CHAMBER',
        description: 'The passage leads to the Deep Sluice Chamber',
      },
      south: {
        to: 'buildings/sluice-system/z-3.ts',
        room: '%DESCENT',
        description: 'The passage continues to the Sluice Descent',
      },
      west: '%ENCAMPMENT_LINK',
    },
    objects: [
      { prototype: 'furniture', name: 'rope handline', description: 'A thick rope is anchored to the walls, providing a handhold. It\'s frayed but holds.', boltedDown: true },
      { prototype: 'furniture', name: 'water noise', description: 'The rush of water grows louder ahead. The sluice system is active.', boltedDown: true },
    ],
  },

  '%SLUICE_CHANNEL_LINK': {
    name: 'Sluice Channel Link',
    description: `A wet passage connecting the Deep Sluice Chamber to the Sluice Channel. Water flows along a channel in the floor, carrying debris from the upper levels. Stepping stones provide passage—miss one and you're in the flow.

The channel leads to the main drainage system. Nothing that enters comes back up.`,
    x: -6,
    y: -2,
    z: -3,
    population: 0,
    ambientNoise: 50,
    lighting: 2,
    waterLevel: 35,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/sluice-system/z-3.ts',
        room: '%CHAMBER',
        description: 'The passage leads to the Deep Sluice Chamber',
      },
      east: {
        to: 'buildings/sluice-system/z-3.ts',
        room: '%CHANNEL',
        description: 'The passage continues to the Sluice Channel',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'stepping stones', description: 'Flat stones provide passage across the channel. They\'re slick and spaced awkwardly.', boltedDown: true },
      { prototype: 'furniture', name: 'flowing debris', description: 'Water carries debris through the channel—leaves, trash, rats, things best not examined.', boltedDown: true },
    ],
  },

  '%DRAINAGE_JUNCTION_LINK': {
    name: 'Drainage Junction Link',
    description: `A passage connecting the Drainage Junction to the Central Arterial Junction. The transition from drainage infrastructure to transit infrastructure is abrupt—wet concrete gives way to dry tiles.

A makeshift barrier marks the boundary. The drainage workers and transit authorities don't cooperate.`,
    x: -1,
    y: -2,
    z: -3,
    population: 0,
    ambientNoise: 40,
    lighting: 3,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/drainage/z-3.ts',
        room: '%JUNCTION',
        description: 'The passage leads to the Drainage Junction',
      },
      east: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%ARTERIAL_JUNCTION',
        description: 'The passage continues to the Central Arterial Junction',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'jurisdictional barrier', description: 'A makeshift barrier of caution tape and cones marks where drainage territory ends and transit begins.', boltedDown: true },
      { prototype: 'furniture', name: 'surface transition', description: 'Wet concrete gives way to dry tiles. The change is immediate and telling.', boltedDown: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSIT CORRIDORS (y=-1 to 4)
  // Main underground transit and utility passages
  // ═══════════════════════════════════════════════════════════════════════════

  '%STEAM_DESCENT': {
    name: 'Steam Grate Descent',
    description: `A passage connecting the Steam Grate Access above to the Main Encampment below. Steam from the city's heating system vents through grates overhead, keeping this passage warm even in winter. The homeless know this route well.

Condensation drips constantly. The warmth comes at the cost of dampness.`,
    x: -10,
    y: -1,
    z: -3,
    population: 0,
    ambientNoise: 45,
    lighting: 3,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/steam-tunnels/z-3.ts',
        room: '%GRATE_ACCESS',
        description: 'The passage rises toward the Steam Grate Access',
      },
      south: {
        to: 'buildings/homeless-warrens/z-3.ts',
        room: '%ENCAMPMENT',
        description: 'The passage descends toward the Main Encampment',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'steam vents', description: 'Steam escapes through overhead grates, keeping the passage warm and humid.', boltedDown: true },
      { prototype: 'furniture', name: 'condensation', description: 'Water drips from every surface—condensation from the constant steam. Nothing stays dry.', boltedDown: true },
    ],
  },

  '%STORM_DRAIN_LINK': {
    name: 'Storm Drain Link',
    description: `A passage connecting the Storm Drain to the Drainage Junction. The passage runs alongside the main storm drain, separated by a grating that allows water to flow through. During heavy rain, the drain fills and water laps at the grating.

The sound of flowing water is constant. It's almost peaceful, until it isn't.`,
    x: -2,
    y: -1,
    z: -3,
    population: 0,
    ambientNoise: 50,
    lighting: 3,
    waterLevel: 15,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/storm-drains/z-3.ts',
        room: '%DRAIN',
        description: 'The passage leads to the Storm Drain',
      },
      south: {
        to: 'buildings/drainage/z-3.ts',
        room: '%JUNCTION',
        description: 'The passage continues to the Drainage Junction',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'drain grating', description: 'Heavy grating separates the passage from the storm drain. Water flows constantly beyond.', boltedDown: true },
      { prototype: 'furniture', name: 'flood markers', description: 'Marks on the wall show past flood levels. Some are uncomfortably high.', boltedDown: true },
    ],
  },

  '%DEEP_SOUTHERN_LINK': {
    name: 'Deep Southern Link',
    description: `A passage connecting the Deep Middle Passage to the Deep Southern Passage. The tunnel runs straight and level, a rare luxury in the underground. Emergency lights provide consistent illumination—someone maintains this route.

Boot prints in the dust suggest regular traffic. This is a transit route.`,
    x: 8,
    y: -1,
    z: -3,
    population: 0,
    ambientNoise: 30,
    lighting: 4,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%MIDDLE',
        description: 'The passage leads to the Deep Middle Passage',
      },
      south: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%SOUTHERN',
        description: 'The passage continues to the Deep Southern Passage',
      },
      west: '%DRAINAGE_JUNCTION_LINK',
    },
    objects: [
      { prototype: 'furniture', name: 'emergency lighting', description: 'Battery-powered emergency lights line the passage. They\'re well-maintained.', boltedDown: true },
      { prototype: 'furniture', name: 'boot prints', description: 'Regular traffic has left tracks in the dust. Someone uses this route often.', boltedDown: true },
    ],
  },

  '%EASTERN_JUNCTION_LINK': {
    name: 'Eastern Junction Link',
    description: `A passage connecting the Deep Eastern Junction to the Deep Eastern Passage. The tunnel narrows here, squeezing between building foundations. The walls are a patchwork of different eras—brick, concrete, steel reinforcement.

This is where the old city meets the new. Neither fully dominates.`,
    x: 12,
    y: -1,
    z: -3,
    population: 0,
    ambientNoise: 25,
    lighting: 3,
    outdoor: false,
    exits: {
      north: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%EASTERN_JUNCTION',
        description: 'The passage leads to the Deep Eastern Junction',
      },
      south: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%EASTERN',
        description: 'The passage continues to the Deep Eastern Passage',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'patchwork walls', description: 'Brick, concrete, and steel meet in a chaotic patchwork. Each era added its layer.', boltedDown: true },
      { prototype: 'furniture', name: 'narrowing passage', description: 'The tunnel squeezes between foundations. Tall visitors duck; wide loads don\'t fit.', boltedDown: true },
    ],
  },

  '%TRANSIT_LINK_W': {
    name: 'Transit Corridor West',
    description: `A passage connecting the Steam Grate Access to the Western Transit Corridor. The transition from steam tunnels to transit tunnels is marked by a change in construction—older brick gives way to modern concrete.

Utility cables run along the ceiling, carrying power and data between sections.`,
    x: -10,
    y: 1,
    z: -3,
    population: 0,
    ambientNoise: 35,
    lighting: 4,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/steam-tunnels/z-3.ts',
        room: '%GRATE_ACCESS',
        description: 'The passage leads to the Steam Grate Access',
      },
      north: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%WESTERN_CORRIDOR',
        description: 'The passage continues to the Western Transit Corridor',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'construction transition', description: 'Old brick meets modern concrete at a visible seam. The infrastructure layers over itself.', boltedDown: true },
      { prototype: 'furniture', name: 'utility cables', description: 'Cable bundles run along the ceiling, carrying power and communications between sections.', boltedDown: true },
    ],
  },

  '%SECOND_AVE_LINK': {
    name: 'Second Avenue Link',
    description: `A passage connecting the Storm Drain to the Deep Second Avenue Junction. The passage runs beneath Second Avenue, following the street's path above. Traffic vibrations can be felt through the walls during rush hour.

Numbered markers track distance from the surface access points.`,
    x: -2,
    y: 1,
    z: -3,
    population: 0,
    ambientNoise: 45,
    lighting: 4,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/storm-drains/z-3.ts',
        room: '%DRAIN',
        description: 'The passage leads to the Storm Drain',
      },
      north: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%SECOND_AVE_JUNCTION',
        description: 'The passage continues to the Deep Second Avenue Junction',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'traffic vibrations', description: 'The walls vibrate with traffic from Second Avenue above. Rush hour is particularly noticeable.', boltedDown: true },
      { prototype: 'sign', name: 'distance markers', description: 'Numbered markers track distance: "SA-15", "SA-16". The system maps to surface access points.', boltedDown: true },
    ],
  },

  '%MIDDLE_LINK': {
    name: 'Middle Passage Link',
    description: `A passage connecting the Deep Middle Passage above to the Deep Middle Passage below. Yes, they're both called the same thing—the naming system was designed by committee. Signs attempt to clarify but mostly add confusion.

Most travelers navigate by landmark, not by sign.`,
    x: 8,
    y: 1,
    z: -3,
    population: 0,
    ambientNoise: 30,
    lighting: 4,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%MIDDLE_S',
        description: 'The passage leads to the Deep Middle Passage (South)',
      },
      north: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%MIDDLE_N',
        description: 'The passage continues to the Deep Middle Passage (North)',
      },
    },
    objects: [
      { prototype: 'sign', name: 'confusing signage', description: 'Signs point to "Deep Middle Passage" in both directions. Helpful arrows do not help.', boltedDown: true },
      { prototype: 'furniture', name: 'landmark graffiti', description: 'Travelers have added their own navigation: "SKULL ROCK →", "← OLD PIPES".', boltedDown: true },
    ],
  },

  '%EASTERN_LINK': {
    name: 'Eastern Passage Link',
    description: `A passage connecting the Deep Eastern Junction to the Deep Eastern Passage. The tunnel is wider here, designed for equipment access. Rails embedded in the floor suggest carts once traveled this route.

Now it's a shortcut for those who know the underground.`,
    x: 12,
    y: 1,
    z: -3,
    population: 0,
    ambientNoise: 25,
    lighting: 3,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%EASTERN_JUNCTION',
        description: 'The passage leads to the Deep Eastern Junction',
      },
      north: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%EASTERN',
        description: 'The passage continues to the Deep Eastern Passage',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'embedded rails', description: 'Metal rails are set into the floor, rusted but intact. Equipment carts once rolled here.', boltedDown: true },
      { prototype: 'furniture', name: 'wide passage', description: 'The tunnel is wider than most—designed for heavy equipment, now used by everyone.', boltedDown: true },
    ],
  },

  '%TRANSIT_EAST_LINK': {
    name: 'Transit East Link',
    description: `A passage connecting the Deep Second Avenue Junction to the Eastern Transit Corridor. The passage runs through a gap between building foundations, the walls showing exposed construction from above.

Dripping water and exposed rebar mark where waterproofing has failed.`,
    x: -1,
    y: 2,
    z: -3,
    population: 0,
    ambientNoise: 35,
    lighting: 3,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%SECOND_AVE_JUNCTION',
        description: 'The passage leads to the Deep Second Avenue Junction',
      },
      east: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%EASTERN_CORRIDOR',
        description: 'The passage continues to the Eastern Transit Corridor',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'exposed construction', description: 'Building foundations are visible through gaps in the wall. Rebar and concrete meet raw earth.', boltedDown: true },
      { prototype: 'furniture', name: 'waterproofing failure', description: 'Water drips through cracks where waterproofing has failed. Rust stains mark the flow.', boltedDown: true },
    ],
  },

  '%WESTERN_PASSAGE_LINK': {
    name: 'Western Passage Link',
    description: `A passage connecting the Utility Passage to the Western Passage. The tunnel descends slightly here, following the natural slope of the terrain beneath the city. Water pools in low spots despite drainage efforts.

Someone has placed wooden pallets to create a dry path.`,
    x: -9,
    y: 3,
    z: -3,
    population: 0,
    ambientNoise: 30,
    lighting: 3,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/utility-tunnels/z-3.ts',
        room: '%PASSAGE',
        description: 'The passage leads to the Utility Passage',
      },
      north: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%WESTERN',
        description: 'The passage continues to the Western Passage',
      },
      east: '%OCCIDENTAL_LINK',
    },
    objects: [
      { prototype: 'furniture', name: 'pooling water', description: 'Water collects in low spots despite the drains. The slope works against drainage.', boltedDown: true },
      { prototype: 'furniture', name: 'pallet path', description: 'Wooden pallets provide a dry path through the wet spots. Someone maintains them.', boltedDown: true },
    ],
  },

  '%SECOND_AVE_DESCENT': {
    name: 'Second Avenue Descent',
    description: `A passage connecting the Deep Second Avenue Junction to Deep Second Avenue. The passage follows the path of Second Avenue above, descending toward the waterfront. The slope is noticeable—drainage runs downhill.

Graffiti marks the walls with directional tags. The underground has its own wayfinding.`,
    x: -2,
    y: 3,
    z: -3,
    population: 0,
    ambientNoise: 35,
    lighting: 4,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%SECOND_AVE_JUNCTION',
        description: 'The passage leads to the Deep Second Avenue Junction',
      },
      north: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%SECOND_AVE',
        description: 'The passage continues to Deep Second Avenue',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'downhill slope', description: 'The floor slopes noticeably toward the waterfront. Drainage follows gravity.', boltedDown: true },
      { prototype: 'sign', name: 'directional graffiti', description: 'Spray-painted arrows and codes mark routes. The underground\'s own navigation system.', boltedDown: true },
    ],
  },

  '%CONNECTOR_LINK': {
    name: 'Deep Connector Link',
    description: `A passage connecting the Deep Middle Passage to the Deep Connector. The tunnel is well-maintained here—someone has an interest in keeping this route clear. The walls are clean, the lights work, the floor is swept.

This level of maintenance is unusual. Someone important uses this route.`,
    x: 8,
    y: 3,
    z: -3,
    population: 0,
    ambientNoise: 25,
    lighting: 6,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%MIDDLE',
        description: 'The passage leads to the Deep Middle Passage',
      },
      north: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%CONNECTOR',
        description: 'The passage continues to the Deep Connector',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'maintained passage', description: 'The tunnel is suspiciously clean. Someone sweeps, fixes lights, removes debris.', boltedDown: true },
      { prototype: 'furniture', name: 'working lights', description: 'Every light works. In the underground, this is remarkable.', boltedDown: true },
    ],
  },

  '%EASTERN_DESCENT': {
    name: 'Eastern Descent',
    description: `A passage connecting the Deep Eastern Passage to the Deep Eastern Passage below. The naming committee really didn't try. Locals call this section "The Drop" for the noticeable descent.

Stairs have been cut into the slope, worn smooth by countless feet.`,
    x: 12,
    y: 3,
    z: -3,
    population: 0,
    ambientNoise: 25,
    lighting: 3,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%EASTERN_UPPER',
        description: 'The passage rises toward the Deep Eastern Passage',
      },
      north: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%EASTERN_LOWER',
        description: 'The passage descends toward the Deep Eastern Passage',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'worn stairs', description: 'Steps cut into the slope have been polished smooth by countless feet. The edges are rounded.', boltedDown: true },
      { prototype: 'sign', name: 'local naming', description: 'Someone has scratched "THE DROP" into the wall. It\'s more useful than the official signs.', boltedDown: true },
    ],
  },

  '%OCCIDENTAL_LINK': {
    name: 'Occidental Link',
    description: `A passage connecting the Western Passage to Deep Occidental. The passage opens into the wider Occidental area—a former market square now underground. The ceiling rises, and the space feels less claustrophobic.

Old market stalls are still visible, their frames rotted but standing.`,
    x: -8,
    y: 4,
    z: -3,
    population: 0,
    ambientNoise: 30,
    lighting: 4,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%WESTERN',
        description: 'The passage leads to the Western Passage',
      },
      east: {
        to: 'buildings/historic-underground/z-3.ts',
        room: '%OCCIDENTAL',
        description: 'The passage opens to Deep Occidental',
      },
      south: '%WESTERN_PASSAGE_LINK',
    },
    objects: [
      { prototype: 'furniture', name: 'market remnants', description: 'Old wooden frames mark where market stalls once stood. The wood is rotted but the bones remain.', boltedDown: true },
      { prototype: 'furniture', name: 'rising ceiling', description: 'The ceiling rises as you approach Occidental. The space opens up, less confining.', boltedDown: true },
    ],
  },

  '%DESCENT_LINK': {
    name: 'Eastern Descent Link',
    description: `A passage connecting Deep Occidental to the Eastern Descent. The passage narrows again after the open space of Occidental, squeezing between building foundations. The walls are a mix of eras—brick, concrete, steel.

This is a major transit route despite the tight squeeze.`,
    x: -6,
    y: 4,
    z: -3,
    population: 0,
    ambientNoise: 35,
    lighting: 3,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/historic-underground/z-3.ts',
        room: '%OCCIDENTAL',
        description: 'The passage leads to Deep Occidental',
      },
      east: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%EASTERN_DESCENT',
        description: 'The passage continues to the Eastern Descent',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'narrowing passage', description: 'The passage squeezes between foundations. The walls close in after the open space of Occidental.', boltedDown: true },
      { prototype: 'furniture', name: 'worn edges', description: 'The walls are worn smooth where shoulders have rubbed for decades. This route is well-traveled.', boltedDown: true },
    ],
  },

  '%CABLE_VAULT_LINK': {
    name: 'Cable Vault Approach',
    description: `A passage connecting Deep Second Avenue to the Cable Vault. Bundles of cables converge here from all directions, feeding into the vault that houses critical infrastructure. Warning signs about tampering are everywhere.

This is sensitive territory. The city's communications run through here.`,
    x: -1,
    y: 4,
    z: -3,
    population: 0,
    ambientNoise: 25,
    lighting: 5,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%SECOND_AVE',
        description: 'The passage leads to Deep Second Avenue',
      },
      east: {
        to: 'buildings/infrastructure/z-3.ts',
        room: '%CABLE_VAULT',
        description: 'The passage continues to the Cable Vault',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'converging cables', description: 'Cable bundles from all directions converge toward the vault. The infrastructure is impressive.', boltedDown: true },
      { prototype: 'sign', name: 'tampering warnings', description: 'Signs warn: "CRITICAL INFRASTRUCTURE - TAMPERING IS A FEDERAL OFFENSE". They mean it.', boltedDown: true },
    ],
  },

  '%RUBBLE_LINK': {
    name: 'Rubble Approach',
    description: `A passage connecting the Deep Eastern Passage to the Rubble Descent. The passage shows signs of structural damage—cracks in the walls, shifted supports, dust that never settles. The Rubble Descent ahead is aptly named.

Proceed with caution. The ceiling isn't entirely trustworthy.`,
    x: 13,
    y: 4,
    z: -3,
    population: 0,
    ambientNoise: 20,
    lighting: 2,
    outdoor: false,
    exits: {
      west: {
        to: 'buildings/transit-tunnels/z-3.ts',
        room: '%EASTERN',
        description: 'The passage leads to the Deep Eastern Passage',
      },
      east: {
        to: 'buildings/damaged/z-3.ts',
        room: '%RUBBLE',
        description: 'The passage continues to the Rubble Descent',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'structural damage', description: 'Cracks spider across walls and ceiling. The supports have shifted. This section is unstable.', boltedDown: true },
      { prototype: 'sign', name: 'caution warning', description: 'A hand-painted sign: "CEILING SUSPECT - DON\'T LINGER". Wise advice.', boltedDown: true },
    ],
  },

  '%BOOTLEG_DESCENT': {
    name: 'Bootleg Descent',
    description: `A hidden passage connecting Deep Yesler Passage to the Bootleg Cellar. This was a prohibition-era route, smuggling alcohol from the waterfront to the speakeasies above. The passage is intentionally hidden—you have to know where to look.

Secret doors and false walls mark the entrance. Someone still maintains them.`,
    x: -10,
    y: 7,
    z: -3,
    population: 0,
    ambientNoise: 15,
    lighting: 2,
    outdoor: false,
    exits: {
      south: {
        to: 'buildings/historic-underground/z-3.ts',
        room: '%YESLER',
        description: 'The passage leads to Deep Yesler Passage',
      },
      north: {
        to: 'buildings/prohibition/z-3.ts',
        room: '%BOOTLEG',
        description: 'The hidden passage continues to the Bootleg Cellar',
      },
    },
    objects: [
      { prototype: 'furniture', name: 'hidden entrance', description: 'A false wall conceals the entrance. You have to know exactly where to push.', boltedDown: true },
      { prototype: 'furniture', name: 'bootleg history', description: 'Old crates marked "MACHINE PARTS" still hold bottle remnants. The speakeasy trade lives in memory.', boltedDown: true },
    ],
  },
  },
};
