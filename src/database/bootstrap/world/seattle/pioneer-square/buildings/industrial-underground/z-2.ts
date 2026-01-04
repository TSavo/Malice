// Industrial Underground - Level z=-2
// Beneath SoDo industrial district (y=-14 to y=-20, x=+7 to x=+14)
// Factory basements, worker tunnels, and industrial infrastructure

export const building = {
  name: 'Industrial Underground',
  x: 13,
  y: -11,
  width: 7,
  height: 9,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // WORKER ACCESS TUNNELS
    // ═══════════════════════════════════════════════════════════════════════

    '%WORKER_TUNNEL': {
      name: 'Worker Tunnel',
      description: `The passage runs through a tunnel built for workers to move between factories without crossing the surface streets—a route that kept them working even when weather or strikes made the surface dangerous. The construction is utilitarian, sized for groups of men walking quickly, the walls bare of decoration.

The tunnel still serves its purpose for those who know it exists. The workers are different now. The need for hidden routes remains.`,
      x: 7,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/chinatown-underground/z-2.ts',
          room: '%INDUSTRIAL_CONN',
          description: 'A passage leads west toward Chinatown',
        },
        east: '%FACTORY_CONN',
        south: '%CANNERY_BASEMENT',
      },
      objects: [
        { prototype: 'sign', name: 'a time clock station', description: 'A rusted time clock station with slots for punch cards. The clock face is frozen at 6:47—start of a shift that ended decades ago.', boltedDown: true },
        { prototype: 'bench', name: 'worker benches', description: 'Wooden benches line the walls where workers waited to punch in. The wood is carved with initials and dates.', boltedDown: true },
      ],
    },

    '%FACTORY_CONN': {
      name: 'Factory Connector',
      description: `The tunnel widens into a connector that once linked multiple factories—a subterranean crossroads where workers from different industries passed each other on their way to shifts. The walls show painted numbers and arrows, a wayfinding system for a workforce that moved through darkness.`,
      x: 10,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%WORKER_TUNNEL',
        east: '%FOUNDRY_BASEMENT',
        south: '%LOADING_TUNNEL',
      },
      objects: [
        { prototype: 'sign', name: 'directional arrows', description: 'Painted arrows point in different directions: "FOUNDRY →", "CANNERY ←", "DOCKS ↓". The paint is faded but legible.', boltedDown: true },
        { prototype: 'cabinet', name: 'a first aid station', description: 'A metal cabinet marked with a red cross hangs on the wall. Inside are ancient bandages and a rusted first aid manual.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FACTORY BASEMENTS
    // ═══════════════════════════════════════════════════════════════════════

    '%CANNERY_BASEMENT': {
      name: 'Cannery Basement',
      description: `The passage opens into the basement of what was once a salmon cannery—the smell of fish long since faded but somehow still present in imagination. The space is large, the ceiling supported by cast iron columns, the floor still showing the drainage channels that carried away blood and brine.

Rusted machinery remains bolted to the floor—can seamers, conveyors, the infrastructure of an industry that defined the city for decades.`,
      x: 7,
      y: -13,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%WORKER_TUNNEL',
        east: '%LOADING_TUNNEL',
        south: '%COLD_STORAGE',
      },
      objects: [
        { prototype: 'furniture', name: 'a can seaming machine', description: 'A massive can seaming machine stands rusted in place, its gears frozen. The brand plate reads "ATLANTIC CAN COMPANY - 1924".', boltedDown: true },
        { prototype: 'bench', name: 'a processing table', description: 'A long steel table where fish were processed, stained dark despite decades of disuse. Gutting knives hang rusted on a rack.', boltedDown: true },
        { prototype: 'sign', name: 'production quota board', description: 'A chalkboard shows daily production targets: "SHIFT 1: 2,400 CASES / SHIFT 2: 2,200 CASES". Below: "QUOTA NOT MET - 15% BONUS WITHHELD".', boltedDown: true },
      ],
    },

    '%FOUNDRY_BASEMENT': {
      name: 'Foundry Basement',
      description: `The passage opens into the basement of an iron foundry—a space designed to withstand the heat and weight of molten metal above. The floor is thick concrete, cracked and stained, the walls blackened by decades of residual heat. Cast iron fixtures remain embedded in every surface.

The foundry closed when the work moved overseas. The building was demolished. The basement remains, too sturdy to destroy economically.`,
      x: 13,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%FACTORY_CONN',
        south: '%TOOL_ROOM',
      },
      objects: [
        { prototype: 'furniture', name: 'a casting pit frame', description: 'The iron frame of a casting pit remains embedded in the floor, its sand and molds long since removed. The metal is still warm to the touch—thermal mass from decades of pours.', boltedDown: true },
        { prototype: 'cabinet', name: 'a pattern cabinet', description: 'A wooden cabinet holds casting patterns—wooden forms for creating molds. Each is labeled with part numbers for machines no longer made.', boltedDown: true },
        { prototype: 'sign', name: 'safety rules', description: 'A metal sign lists foundry safety rules: "WEAR GOGGLES WHEN POURING. NO LOOSE CLOTHING. REPORT ALL BURNS IMMEDIATELY."', boltedDown: true },
        { prototype: 'crate', name: 'slag pile', description: 'A pile of blackite slag—the waste from iron pours—fills one corner. The material is glass-like, shot through with metal flecks.', boltedDown: true },
      ],
    },

    '%LOADING_TUNNEL': {
      name: 'Loading Tunnel',
      description: `The tunnel runs through the industrial heart of the underground, connecting factory basements to the loading docks that once received and shipped goods. The passage is wide enough for carts, the floor worn into ruts by decades of heavy traffic.

Rails are embedded in the floor—a narrow gauge system for moving cargo through the tunnels without requiring daylight or surface streets.`,
      x: 10,
      y: -13,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%FACTORY_CONN',
        west: '%CANNERY_BASEMENT',
        south: '%MACHINE_SHOP',
        east: '%TOOL_ROOM',
      },
      objects: [
        { prototype: 'furniture', name: 'rail cart tracks', description: 'Narrow gauge rails are embedded in the floor, worn smooth by decades of cargo carts. A rusted cart sits abandoned on the tracks.', boltedDown: true },
        { prototype: 'sign', name: 'loading instructions', description: 'A painted sign reads: "ALL CARGO MUST BE WEIGHED. MAXIMUM CART LOAD: 1,000 LBS. NO RIDING ON CARTS."', boltedDown: true },
      ],
    },

    '%TOOL_ROOM': {
      name: 'Tool Room',
      description: `The passage opens into a tool room that served multiple factories—a shared resource where workers could borrow equipment and have repairs made. Pegboard lines the walls, the shadows of missing tools visible in the dust. Workbenches run down the center, vises still bolted in place.

The room was locked and abandoned when the factories closed. Whatever tools remained were locked inside.`,
      x: 13,
      y: -13,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%FOUNDRY_BASEMENT',
        west: '%LOADING_TUNNEL',
        south: '%MAINTENANCE_SHAFT',
      },
      objects: [
        { prototype: 'desk', name: 'a tool crib counter', description: 'A heavy wooden counter with a cage-wire upper section. Workers borrowed tools here, signing them out on clipboards that still hang from nails.', boltedDown: true },
        { prototype: 'cabinet', name: 'a parts cabinet', description: 'A metal cabinet with dozens of small drawers, each labeled with part numbers. Many drawers still contain bolts, washers, and small components.', boltedDown: true },
        { prototype: 'bench', name: 'a sharpening station', description: 'A grinding wheel and sharpening stones remain set up on a bench. The wheel still turns freely when pushed.', boltedDown: true },
        { prototype: 'sign', name: 'tool checkout rules', description: 'A sign reads: "CHECK OUT BEFORE USE. RETURN CLEAN. DAMAGED TOOLS WILL BE CHARGED TO YOUR ACCOUNT."', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // COLD STORAGE AND DOCK ACCESS
    // ═══════════════════════════════════════════════════════════════════════

    '%COLD_STORAGE': {
      name: 'Industrial Cold Storage',
      description: `The passage descends into a cold storage facility built to preserve salmon and other goods before shipment. The insulation is failing, the refrigeration long since dead, but the space retains a chill that feels unnatural—thermal mass from decades of cold holding onto temperature like a memory.

Ice still forms on the walls in winter. In summer, the condensation drips constantly.`,
      x: 7,
      y: -15,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 8,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%CANNERY_BASEMENT',
        east: '%MACHINE_SHOP',
        south: '%DOCK_TUNNEL',
      },
      objects: [
        { prototype: 'cabinet', name: 'fish hanging rails', description: 'Steel rails with hooks run the length of the ceiling, designed for hanging salmon to chill. A few rusted hooks still dangle, swaying.', boltedDown: true },
        { prototype: 'sign', name: 'temperature chart', description: 'A chart on the wall shows required temperatures for different products: "SALMON: 28°F / HALIBUT: 30°F / GENERAL: 34°F".', boltedDown: true },
        { prototype: 'furniture', name: 'ammonia compressor base', description: 'The concrete base of an ammonia refrigeration compressor remains, the machine itself long since salvaged. Pipes extend into the walls.', boltedDown: true },
      ],
    },

    '%MACHINE_SHOP': {
      name: 'Underground Machine Shop',
      description: `The passage opens into a machine shop built to service the factories above—lathes, drill presses, and milling machines still bolted to the floor, their power disconnected but their precision intact. This was where broken parts were remade, where prototypes were built, where the machinery of industry was maintained.

The machines are silent now, but the smell of cutting oil lingers.`,
      x: 10,
      y: -15,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LOADING_TUNNEL',
        west: '%COLD_STORAGE',
        east: '%MAINTENANCE_SHAFT',
        south: '%BOILER_ACCESS',
      },
      objects: [
        { prototype: 'furniture', name: 'a South Bend lathe', description: 'A 16-inch South Bend lathe stands ready for use, its ways still oiled, its gears intact. The brand plate shows a 1937 manufacture date.', boltedDown: true },
        { prototype: 'furniture', name: 'a Bridgeport mill', description: 'A vertical milling machine, its spindle locked in place. Metal chips still fill the tray, left from the last job that was never completed.', boltedDown: true },
        { prototype: 'desk', name: 'a machinist\'s bench', description: 'A heavy wooden bench with a machinist\'s vise bolted to one end. Micrometers, calipers, and gauge blocks remain in a drawer.', boltedDown: true },
        { prototype: 'cabinet', name: 'a tool chest', description: 'A Gerstner wooden machinist\'s tool chest, its drawers still organized with precision instruments. Worth a fortune to collectors.', boltedDown: true },
      ],
    },

    '%MAINTENANCE_SHAFT': {
      name: 'Maintenance Shaft',
      description: `A vertical shaft descends through the industrial underground, providing access to utility infrastructure and deeper levels. Iron rungs are set into the concrete walls, the descent lit by caged bulbs at intervals—a few still functional, most burned out and never replaced.

The shaft connects the factory level to the tunnels that carry steam, power, and sewage beneath the industrial district.`,
      x: 13,
      y: -15,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%TOOL_ROOM',
        west: '%MACHINE_SHOP',
        down: '%UTILITY_MAIN',
      },
      objects: [
        { prototype: 'sign', name: 'a shaft depth marker', description: 'Painted numbers mark depth intervals on the shaft wall: "0... 10... 20... 30 FT". Someone has added "WATCH YOUR STEP" in chalk.', boltedDown: true },
        { prototype: 'furniture', name: 'a cable drum', description: 'A large drum for lowering equipment down the shaft remains mounted at the top. The cable is rusted but present.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DOCK AND WATERFRONT ACCESS
    // ═══════════════════════════════════════════════════════════════════════

    '%DOCK_TUNNEL': {
      name: 'Dock Tunnel',
      description: `The tunnel runs toward the industrial waterfront, connecting the factory underground to the docks where goods were loaded and shipped. The construction is heavy, the passage wide enough for cargo, the floor sloping gradually down toward the water.

The smell of salt and diesel grows stronger toward the south.`,
      x: 7,
      y: -17,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 12,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%COLD_STORAGE',
        east: '%BOILER_ACCESS',
        south: '%WHARF_BASEMENT',
      },
      objects: [
        { prototype: 'furniture', name: 'dock cart rails', description: 'Rails for cargo carts extend down the tunnel toward the docks. The gauge is narrow, designed for the tunnel\'s constraints.', boltedDown: true },
        { prototype: 'sign', name: 'a shipping schedule', description: 'A faded schedule board shows shipping times for companies long since absorbed or dissolved: "ALASKA S.S. - 0600 / PACIFIC COAST - 1400".', boltedDown: true },
      ],
    },

    '%BOILER_ACCESS': {
      name: 'Boiler Access',
      description: `The passage opens into an access room for the steam boiler system that once powered the industrial district—a network of pipes and valves that carried heat and pressure to factories throughout the area. The boilers themselves are elsewhere, but this room controlled distribution.

Massive valves line the walls, each labeled with the factory it served. Most are frozen shut with corrosion.`,
      x: 10,
      y: -17,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%MACHINE_SHOP',
        west: '%DOCK_TUNNEL',
        south: '%PUMP_STATION',
      },
      objects: [
        { prototype: 'furniture', name: 'distribution valves', description: 'A row of massive gate valves control steam flow to different factories. Each is labeled: "CANNERY", "FOUNDRY", "MACHINE WORKS".', boltedDown: true },
        { prototype: 'sign', name: 'a pressure diagram', description: 'A diagram shows the steam distribution system, pipes running to various buildings. Red X marks indicate "DISCONNECTED".', boltedDown: true },
        { prototype: 'cabinet', name: 'a pressure gauge panel', description: 'A panel of pressure gauges monitors lines that no longer carry steam. All needles rest at zero.', boltedDown: true },
      ],
    },

    '%WHARF_BASEMENT': {
      name: 'Wharf Basement',
      description: `The tunnel opens into the basement of a wharf building—a space that once stored goods between factory and ship. The floor is stained with the residue of a thousand cargoes: oil, fish, grain, machinery. The walls show tide marks where the bay has invaded during extreme events.

Windows, now sealed, once opened onto the water. The sound of ships and seabirds is gone, replaced by silence.`,
      x: 7,
      y: -19,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 8,
      waterLevel: 25,
      outdoor: false,
      exits: {
        north: '%DOCK_TUNNEL',
        east: '%PUMP_STATION',
      },
      objects: [
        { prototype: 'crate', name: 'shipping crates', description: 'Wooden shipping crates are stacked against one wall, their destinations painted on the sides: "NOME, ALASKA", "YOKOHAMA, JAPAN", "VALPARAISO, CHILE".', boltedDown: true },
        { prototype: 'furniture', name: 'a cargo winch', description: 'A hand-cranked cargo winch remains mounted to the floor, its cable extending up through a hatch that once opened to the wharf above.', boltedDown: true },
        { prototype: 'sign', name: 'a harbormaster notice', description: 'A yellowed notice reads: "WHARF 7 CLOSED FOR REPAIRS - NOVEMBER 1958". The repairs were never completed.', boltedDown: true },
      ],
    },

    '%PUMP_STATION': {
      name: 'Pump Station',
      description: `The passage ends at a pump station built to keep the industrial underground dry—massive pumps that fought a constant battle against groundwater and tidal intrusion. The pumps are silent now, their motors burned out, their purpose abandoned when the factories closed.

Water pools in the corners. The bay is winning its long war against the infrastructure.`,
      x: 10,
      y: -19,
      z: -2,
      population: 0,
      ambientNoise: 30,
      lighting: 10,
      waterLevel: 35,
      outdoor: false,
      exits: {
        north: '%BOILER_ACCESS',
        west: '%WHARF_BASEMENT',
        down: {
          to: 'buildings/deep-cisterns/z-4.ts',
          room: '%INDUSTRIAL_ACCESS',
          description: 'A flooded shaft descends into darkness',
        },
      },
      objects: [
        { prototype: 'furniture', name: 'a dead pump', description: 'A massive cast-iron pump, its motor housing cracked and corroded. The intake pipe extends down into standing water.', boltedDown: true },
        { prototype: 'cabinet', name: 'a control panel', description: 'An electrical control panel for the pump system, its switches frozen in the OFF position. Corrosion has fused the contacts.', boltedDown: true },
        { prototype: 'sign', name: 'a maintenance log', description: 'The last entry in a maintenance log reads: "DEC 3 1971 - PUMP 2 FAILED. PARTS ON ORDER." The parts never arrived.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY LEVEL
    // ═══════════════════════════════════════════════════════════════════════

    '%UTILITY_MAIN': {
      name: 'Utility Main',
      description: `The shaft opens into a utility corridor that runs beneath the industrial district—a passage built for maintenance access to the steam, water, and sewer lines that served the factories. Pipes of various sizes run along the walls and ceiling, some still carrying water, most dry and corroded.

The air is damp, the light dim, the passage extending in both directions into darkness.`,
      x: 13,
      y: -15,
      z: -3,
      population: 0,
      ambientNoise: 20,
      lighting: 8,
      waterLevel: 15,
      outdoor: false,
      exits: {
        up: '%MAINTENANCE_SHAFT',
        south: '%SEWER_JUNCTION',
      },
      objects: [
        { prototype: 'sign', name: 'a utility map', description: 'A painted diagram shows the utility layout: water mains in blue, steam in red, sewer in green. Most of the blue lines are crossed out.', boltedDown: true },
        { prototype: 'cabinet', name: 'a valve access panel', description: 'A panel provides access to shutoff valves for various systems. The handles are labeled by building and function.', boltedDown: true },
      ],
    },

    '%SEWER_JUNCTION': {
      name: 'Sewer Junction',
      description: `The utility corridor reaches a junction with the main sewer line—a brick-lined tunnel large enough to stand in, carrying the waste of the industrial district toward the treatment plants. The smell is surprisingly mild; the factories are gone, their effluent no longer flows.

The junction provides access to the deep cistern system, the water infrastructure that predates the current city.`,
      x: 13,
      y: -17,
      z: -3,
      population: 0,
      ambientNoise: 25,
      lighting: 5,
      waterLevel: 25,
      outdoor: false,
      exits: {
        north: '%UTILITY_MAIN',
        down: {
          to: 'buildings/deep-cisterns/z-4.ts',
          room: '%SEWER_ACCESS',
          description: 'A shaft descends into the ancient cistern system',
        },
      },
      objects: [
        { prototype: 'sign', name: 'a junction marker', description: 'A brass plate marks the junction: "SEWER MAIN 14-A / EST. 1902 / CITY OF SEATTLE". The brass is green with age.', boltedDown: true },
        { prototype: 'furniture', name: 'an overflow weir', description: 'A concrete weir controls overflow into a secondary channel. The mechanism is jammed with debris.', boltedDown: true },
      ],
    },
  },
};
