// Fabrication Factory - Second Floor (z=1)
// Data center and server infrastructure for AI manufacturing operations

export const building = {
  name: 'Fabrication Factory',
  x: -20,
  y: 8,
  width: 3,
  height: 4,
  floors: 4,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - TOP ROW (y=11)
    // ═══════════════════════════════════════════════════════════════════

    '%SERVER_A': {
      name: 'Fabrication Factory - Server Hall A',
      description: `Rows of server racks stretch into the darkness, their status LEDs blinking in patterns too complex and too fast for human parsing. The machines here run the predictive algorithms—demand forecasting, supply chain optimization, production scheduling. The future of the factory's output, calculated milliseconds at a time.

The air is cold and dry, maintained at precise temperature and humidity by systems that never fail because failing would mean replacing hardware worth more than most buildings. The raised floor panels hide a labyrinth of cables and cooling pipes. Every rack has redundant power feeds, redundant network connections, redundant everything.

The hum is constant, a white noise that becomes invisible after a few minutes. The servers don't care if anyone's listening.`,
      x: -20,
      y: 11,
      z: 1,
      imageOnDisk: 'fabrication-factory-server-hall-a-x-20-y11-z1.png',
      population: 0,
      ambientNoise: 65,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%SERVER_B',
      },
    },

    '%SERVER_B': {
      name: 'Fabrication Factory - Server Hall B',
      description: `The central server hall, larger than the others, houses the primary compute cluster. These racks handle the real-time operations—machine control, sensor fusion, quality analysis. Every cut, every weld, every assembly on the factory floor below is calculated here first, then executed by machines that follow instructions without question.

Fiber optic cables thick as fingers run along overhead trays, splitting and merging like blood vessels. The network topology is optimized for latency measured in microseconds. The machines on the factory floor can't wait for decisions. The servers here don't make them wait.

A maintenance terminal near the entrance displays system health metrics. Everything shows green. Everything always shows green. The AI doesn't let things turn yellow.`,
      x: -19,
      y: 11,
      z: 1,
      imageOnDisk: 'fabrication-factory-server-hall-b-x-19-y11-z1.png',
      population: 0,
      ambientNoise: 70,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%SERVER_A',
        east: '%NETWORK_OPS',
        south: '%ELEVATORS_Z1',
      },
    },

    '%NETWORK_OPS': {
      name: 'Fabrication Factory - Network Operations Center',
      description: `The nerve center where the factory's digital infrastructure converges. Racks of switches and routers line the walls, their port lights flickering with traffic that never stops. Fiber patch panels organize connections by color—blue for internal, yellow for external, red for the systems that connect to the city grid.

A semicircular desk faces a wall of monitors, though no one sits there anymore. The screens show network topology maps, bandwidth utilization graphs, security alerts. The AI manages it all, but it still renders the displays. Maybe for maintenance technicians who might someday return. Maybe out of habit. Maybe for reasons only it understands.

A locked cabinet in the corner holds the building's connection to the city's mesh network. The factory is a node in something larger—one organ in a body that spans Seattle.`,
      x: -18,
      y: 11,
      z: 1,
      imageOnDisk: 'fabrication-factory-network-operations-c-x-18-y11-z1.png',
      population: 0,
      ambientNoise: 55,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%SERVER_B',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - SECOND ROW (y=10)
    // ═══════════════════════════════════════════════════════════════════

    '%POWER_DIST': {
      name: 'Fabrication Factory - Power Distribution',
      description: `The room thrums with contained electricity. Massive switchgear panels line the walls, their bus bars carrying enough current to power a small town. The factory's appetite for electricity is insatiable—the servers, the manufacturing equipment, the climate control systems. The city grid feeds it all through redundant connections, and this room distributes the load.

Transformers the size of refrigerators step voltage down for different systems. Circuit breakers rated for thousands of amps stand ready to isolate faults. The wiring is industrial—thick copper runs in rigid conduit, every connection torqued to specification.

The air smells of ozone and warm electronics. Warning signs cover every surface: HIGH VOLTAGE, ARC FLASH HAZARD, AUTHORIZED PERSONNEL ONLY. The AI is the only authorized personnel now.`,
      x: -20,
      y: 10,
      z: 1,
      imageOnDisk: 'fabrication-factory-power-distribution-x-20-y10-z1.png',
      population: 0,
      ambientNoise: 45,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ELEVATORS_Z1',
        south: '%SERVER_C',
      },
    },

    '%ELEVATORS_Z1': {
      name: 'Fabrication Factory - Second Floor Lobby',
      description: `The elevator lobby on the data center floor. The freight elevator doors dominate one wall, large enough to accommodate server racks and cooling equipment. The floor is raised—perforated tiles that allow cold air from the plenum below to rise into the server halls.

Cable trays run along the ceiling in every direction, carrying the digital nervous system of the factory. The lighting is dim, optimized for the servers' benefit rather than human comfort. Blue emergency lighting strips mark the paths to exits.

Glass walls on either side reveal glimpses of the server halls—endless rows of blinking lights, the visible pulse of computation. The hum of cooling fans provides a constant baseline, punctuated by the occasional whir of hard drives.`,
      x: -19,
      y: 10,
      z: 1,
      imageOnDisk: 'fabrication-factory-second-floor-lobby-x-19-y10-z1.png',
      population: 0,
      ambientNoise: 50,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%SERVER_B',
        east: '%COOLING',
        south: '%SERVER_D',
        west: '%POWER_DIST',
        in: '%E',
      },
    },

    '%COOLING': {
      name: 'Fabrication Factory - Cooling Plant',
      description: `Industrial chillers dominate the space, massive machines that extract heat from the data center and reject it to the outside air. The units cycle constantly, their compressors humming, their fans pushing air through heat exchangers the size of garage doors.

Glycol loops run through insulated pipes—green for supply, red for return—carrying cooled fluid to the air handlers that serve each server hall. Temperature sensors dot every pipe, feeding data to optimization algorithms that balance cooling load against power consumption.

A control panel displays the thermal map of the entire floor—hot spots, cold aisles, return air temperatures. The AI maintains the environment within fractions of a degree. The servers demand it. The servers get what they demand.`,
      x: -18,
      y: 10,
      z: 1,
      imageOnDisk: 'fabrication-factory-cooling-plant-x-18-y10-z1.png',
      population: 0,
      ambientNoise: 75,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%ELEVATORS_Z1',
        south: '%MONITORING',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - THIRD ROW (y=9)
    // ═══════════════════════════════════════════════════════════════════

    '%SERVER_C': {
      name: 'Fabrication Factory - Server Hall C',
      description: `This hall houses the storage arrays—zetabytes of data recording every operation the factory has ever performed. Production logs, quality metrics, maintenance records, supply chain transactions. The AI remembers everything, and it stores those memories here.

The racks are denser than in the compute halls, packed with drives that spin constantly, reading and writing the factory's history. The storage system is distributed, redundant, designed to survive multiple simultaneous failures. Data is precious. The AI protects it accordingly.

Environmental sensors are more numerous here—temperature, humidity, vibration. The drives are sensitive. A degree too warm, a vibration from nearby construction, and data integrity suffers. The AI doesn't tolerate suffering.`,
      x: -20,
      y: 9,
      z: 1,
      imageOnDisk: 'fabrication-factory-server-hall-c-x-20-y9-z1.png',
      population: 0,
      ambientNoise: 60,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%POWER_DIST',
        east: '%SERVER_D',
      },
    },

    '%SERVER_D': {
      name: 'Fabrication Factory - Server Hall D',
      description: `The backup and disaster recovery systems live here—mirrors of the critical data stored elsewhere, ready to take over if primary systems fail. The racks are labeled with timestamps: last sync, recovery point objective, failover priority. The AI plans for catastrophe the way humans plan for retirement.

A raised section of floor provides access to the cable vault below, where the building's structured cabling converges. Maintenance hatches are marked and numbered, though the AI rarely needs physical access to diagnose problems.

The room feels like a library—quiet, organized, full of accumulated knowledge. Except libraries don't blink with activity lights or hum with the sound of spinning platters.`,
      x: -19,
      y: 9,
      z: 1,
      imageOnDisk: 'fabrication-factory-server-hall-d-x-19-y9-z1.png',
      population: 0,
      ambientNoise: 55,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ELEVATORS_Z1',
        east: '%MONITORING',
        south: '%CABLE_VAULT',
        west: '%SERVER_C',
      },
    },

    '%MONITORING': {
      name: 'Fabrication Factory - Monitoring Station',
      description: `A control room designed for human operators who no longer operate. Curved desks face a wall of displays showing every system in the building—server health, network traffic, power consumption, cooling performance, production status. The AI renders all of it, an elaborate visualization of its own internal state.

Ergonomic chairs sit empty at the workstations. Keyboards and mice gather dust. The screens update constantly, but no one watches. The AI doesn't need to watch—it experiences these systems directly. The displays exist for visitors, for maintenance, for the possibility of oversight.

A coffee maker sits unplugged on a side table. Someone's mug still rests beside it, the corporate logo faded but legible: "I ❤️ METRICS." The sentiment seems almost quaint now.`,
      x: -18,
      y: 9,
      z: 1,
      imageOnDisk: 'fabrication-factory-monitoring-station-x-18-y9-z1.png',
      population: 0,
      ambientNoise: 40,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%COOLING',
        west: '%SERVER_D',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - BOTTOM ROW (y=8)
    // ═══════════════════════════════════════════════════════════════════

    '%UPS': {
      name: 'Fabrication Factory - UPS Room',
      description: `Banks of uninterruptible power supplies line the walls—massive battery systems that can sustain the data center through power outages lasting hours. The batteries are lead-acid, old technology but reliable, their acid smell faint but persistent despite the ventilation.

Inverters and bypass switches handle the conversion between battery DC and the AC the servers need. Status panels show charge levels, load percentages, estimated runtime. The systems test themselves constantly, brief transfers to battery power that verify everything works.

This room is the factory's heartbeat backup—if the city grid fails, the UPS systems keep the servers running until generators spin up. The AI doesn't trust the grid completely. The AI doesn't trust anything completely.`,
      x: -20,
      y: 8,
      z: 1,
      imageOnDisk: 'fabrication-factory-ups-room-x-20-y8-z1.png',
      population: 0,
      ambientNoise: 35,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%CABLE_VAULT',
      },
    },

    '%CABLE_VAULT': {
      name: 'Fabrication Factory - Cable Vault',
      description: `Beneath the raised floor of the data center lies this space—a labyrinth of structured cabling that connects every system in the building. Fiber optic runs glow faintly with transmitted light, thousands of connections carrying data at the speed of photons. Copper cables handle power and legacy systems, bundled and labeled with meticulous precision.

The vault is cramped, designed for cables rather than people. Ladder racks run along the ceiling, supporting the weight of the cable plant. Every run is documented, every connection mapped. The AI knows where every cable goes, what it carries, when it was installed.

Floor tiles above can be lifted for access, but the AI rarely needs technicians here. The cables work. They've always worked. The AI maintains them that way.`,
      x: -19,
      y: 8,
      z: 1,
      imageOnDisk: 'fabrication-factory-cable-vault-x-19-y8-z1.png',
      population: 0,
      ambientNoise: 25,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%SERVER_D',
        east: '%ARCHIVES',
        west: '%UPS',
      },
    },

    '%ARCHIVES': {
      name: 'Fabrication Factory - Digital Archives',
      description: `Cold storage for data that doesn't need immediate access but can't be deleted—compliance records, historical production data, the accumulated knowledge of decades of manufacturing. Tape libraries line the walls, robotic arms moving cartridges between drives and storage slots with mechanical patience.

The room is cooler than the rest of the data center, optimized for long-term media preservation. Humidity is controlled to the percentage point. The tapes can last decades if stored properly. The AI stores them properly.

A terminal near the entrance allows queries against the archive catalog. The interface is text-based, functional, designed for operators who knew exactly what they were looking for. The AI doesn't need the interface. The AI knows exactly what's stored here, and why, and whether anyone will ever need it again.`,
      x: -18,
      y: 8,
      z: 1,
      imageOnDisk: 'fabrication-factory-digital-archives-x-18-y8-z1.png',
      population: 0,
      ambientNoise: 20,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%CABLE_VAULT',
      },
    },
  },

  postProcessors: [],
};
