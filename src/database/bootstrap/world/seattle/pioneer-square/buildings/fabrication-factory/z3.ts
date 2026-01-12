// Fabrication Factory - Roof (z=3)
// Open rooftop with power, water, and environmental systems

export const building = {
  name: 'Fabrication Factory',
  x: -20,
  y: 8,
  width: 3,
  height: 4,
  floors: 4,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=3) - TOP ROW (y=11)
    // ═══════════════════════════════════════════════════════════════════

    '%SOLAR_W': {
      name: 'Fabrication Factory - Solar Array West',
      description: `Photovoltaic panels stretch across the western section of the roof, angled to catch the weak Seattle sun. The panels are mismatched—different sizes, different generations of technology, scavenged from a dozen sources and wired together by AI optimization. Efficiency matters more than aesthetics.

The frames are weathered but maintained, cleaned by automated systems that scrub away the grime and moss that would otherwise accumulate. Power conduits run beneath the walkways, channeling electricity down into the building's grid. On clear days, the array generates enough to offset a fraction of the factory's appetite.

The view west shows Elliott Bay, gray water under gray sky. The waterfront stretches below, and beyond it, the ruins of Harbor Island where the old port facilities rusted into the sound.`,
      x: -20,
      y: 11,
      z: 3,
      imageOnDisk: 'fabrication-factory-solar-array-west-x-20-y11-z3.png',
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%WATER_COLLECTORS',
        south: '%SOLAR_E',
      },
    },

    '%WATER_COLLECTORS': {
      name: 'Fabrication Factory - Water Collectors',
      description: `Catchment surfaces funnel rainwater toward central collection points—every drop precious in a city where the old municipal system barely functions. The collectors are ingenious, shaped to maximize surface area while minimizing evaporation. Seattle's rain is one resource that hasn't failed.

Pipes route collected water down to the cisterns below, filtered through screens that catch debris and contaminants. The system is passive, requiring no power—gravity does the work. The AI designed it to survive infrastructure failures. The AI plans for failure.

Moss grows in the joints and seams, tolerated because removing it would damage the collectors. The building has made peace with the organic world where it serves the building's purposes.`,
      x: -19,
      y: 11,
      z: 3,
      imageOnDisk: 'fabrication-factory-water-collectors-x-19-y11-z3.png',
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%SOLAR_W',
        east: '%ANTENNA_FARM',
        south: '%ROOF_ACCESS',
      },
    },

    '%ANTENNA_FARM': {
      name: 'Fabrication Factory - Antenna Farm',
      description: `Communication arrays bristle from the roof's northeast corner—dishes, masts, and phased arrays pointing in every direction. The factory's connection to the city mesh, to satellite links that still function, to whatever networks survived The Burning and the decades after.

The equipment is hardened against EMP, shielded and grounded, lessons learned from how the old world ended. Redundant systems ensure communication even if individual arrays fail. The AI doesn't trust single points of failure. The AI learned what happens when critical systems have single points of failure.

From here, you can see Smith Tower rising to the south, its observation deck visible above the surrounding ruins. The tower's own antenna farm is larger, more powerful. The two buildings talk to each other constantly, part of a conversation that spans the city.`,
      x: -18,
      y: 11,
      z: 3,
      imageOnDisk: 'fabrication-factory-antenna-farm-x-18-y11-z3.png',
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%WATER_COLLECTORS',
        south: '%COOLING_TOWERS',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=3) - SECOND ROW (y=10)
    // ═══════════════════════════════════════════════════════════════════

    '%SOLAR_E': {
      name: 'Fabrication Factory - Solar Array East',
      description: `More panels, more scavenged technology pressed into service. This section catches morning light, complementing the western array's afternoon exposure. Together they stretch the building's solar window across the full day, extracting what power they can from Seattle's reluctant sun.

Battery housings sit beneath the panels, storing excess generation for the dark hours. The batteries are the most valuable components on the roof—lithium cells salvaged from pre-war installations, jealously maintained because replacements don't exist. When these die, the factory loses its buffer against grid failures.

The panels hum faintly when generating, a sound more felt than heard. On overcast days—most days—the hum is barely perceptible. On rare sunny days, it rises to something almost musical.`,
      x: -20,
      y: 10,
      z: 3,
      imageOnDisk: 'fabrication-factory-solar-array-east-x-20-y10-z3.png',
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%SOLAR_W',
        east: '%ROOF_ACCESS',
        south: '%EXHAUST',
      },
    },

    '%ROOF_ACCESS': {
      name: 'Fabrication Factory - Roof Access',
      description: `The elevator housing rises from the roof's center, a utilitarian structure providing access between the building's interior and the open sky. The housing is reinforced, weatherproofed, designed to keep the elements out of the shaft below.

From here, the full scope of the roof spreads in every direction—solar panels west, cooling towers east, exhaust stacks and equipment covering every available surface. The roof isn't empty space; it's another factory floor, processing sunlight and rain and air into resources the building needs.

The wind is constant up here, channeled between the rooftop equipment into unpredictable gusts. The view extends across Pioneer Square's rooftops to the debris wall that marks downtown's edge, and beyond to the waterfront where the factory's loading bay receives deliveries.`,
      x: -19,
      y: 10,
      z: 3,
      imageOnDisk: 'fabrication-factory-roof-access-x-19-y10-z3.png',
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%WATER_COLLECTORS',
        east: '%COOLING_TOWERS',
        south: '%MAINTENANCE',
        west: '%SOLAR_E',
        in: '%E',
      },
    },

    '%COOLING_TOWERS': {
      name: 'Fabrication Factory - Cooling Towers',
      description: `Heat rejection systems dominate the roof's eastern edge—towers that draw hot air from the data center and biofarm below, exchanging it for cooler outside air. The towers exhale constantly, plumes of warm vapor rising and dissipating into Seattle's gray sky.

The systems are oversized for the building's needs, redundancy built in because the servers below can't survive without cooling and the bioreactors can't function outside narrow temperature ranges. If cooling fails, the factory fails. The AI doesn't allow cooling to fail.

The towers are loud—fans spinning, water cascading through heat exchangers, pumps circulating coolant. Standing here is standing inside a machine, surrounded by its mechanical breathing.`,
      x: -18,
      y: 10,
      z: 3,
      imageOnDisk: 'fabrication-factory-cooling-towers-x-18-y10-z3.png',
      population: 0,
      ambientNoise: 75,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ANTENNA_FARM',
        west: '%ROOF_ACCESS',
        south: '%HVAC',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=3) - THIRD ROW (y=9)
    // ═══════════════════════════════════════════════════════════════════

    '%EXHAUST': {
      name: 'Fabrication Factory - Exhaust Stacks',
      description: `Ventilation stacks rise from the biofarm below, releasing filtered air that still carries traces of the processes beneath. The smell is organic, industrial, wrong—the scent of waste transformation rendered tolerable but not pleasant. The stacks run continuously, the biofarm breathing out what it can't use.

Filters in the stacks capture particulates and neutralize the worst compounds, but the air that escapes still carries the signature of what happens below. The wind usually disperses it before it reaches street level. Usually. On still days, the factory's neighbors know exactly what it produces.

The stacks are warm to the touch, heated by the fermentation processes they vent. In winter, the heat melts snow around their bases, leaving permanent bare patches on the otherwise weathered roof.`,
      x: -20,
      y: 9,
      z: 3,
      imageOnDisk: 'fabrication-factory-exhaust-stacks-x-20-y9-z3.png',
      population: 0,
      ambientNoise: 45,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%SOLAR_E',
        east: '%MAINTENANCE',
        south: '%CISTERNS',
      },
    },

    '%MAINTENANCE': {
      name: 'Fabrication Factory - Maintenance Yard',
      description: `Open space between the roof's major systems, kept clear for equipment access and repairs. Anchor points dot the surface for safety lines—the wind up here can gust hard enough to knock someone off their feet, and the drop to the street is four stories of terminal velocity.

Spare parts cache in weatherproof containers along the edges: replacement panels, filter cartridges, pipe fittings, the consumables that keep rooftop systems running. The inventory is managed by the same AI that runs everything else, restocked when levels drop below thresholds.

The surface is rubberized membrane over concrete, patched in places where decades of Seattle weather have worn through. Puddles collect in the low spots after rain, reflecting the gray sky until evaporation or drains clear them away.`,
      x: -19,
      y: 9,
      z: 3,
      imageOnDisk: 'fabrication-factory-maintenance-yard-x-19-y9-z3.png',
      population: 0,
      ambientNoise: 35,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_ACCESS',
        east: '%HVAC',
        south: '%LANDING_PAD',
        west: '%EXHAUST',
      },
    },

    '%HVAC': {
      name: 'Fabrication Factory - HVAC Plant',
      description: `Air handling units process atmosphere for the building below—heating, cooling, filtering, adjusting humidity to the precise specifications each floor requires. The factory floor needs different air than the data center needs different air than the biofarm. The HVAC plant provides all of it.

Ductwork disappears into the roof, branching and rebranching until it reaches every room in the building. The system is the factory's lungs, and like lungs, it never stops. The fans spin at varying speeds, responding to demand, their pitch shifting as the building's needs change throughout the day.

Condensation drips from cooling coils, collected and routed to the water system. Nothing is wasted. Even the moisture pulled from the air becomes resource.`,
      x: -18,
      y: 9,
      z: 3,
      imageOnDisk: 'fabrication-factory-hvac-plant-x-18-y9-z3.png',
      population: 0,
      ambientNoise: 65,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%COOLING_TOWERS',
        west: '%MAINTENANCE',
        south: '%GENERATOR',
      },
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=3) - BOTTOM ROW (y=8)
    // ═══════════════════════════════════════════════════════════════════

    '%CISTERNS': {
      name: 'Fabrication Factory - Cisterns',
      description: `Water storage tanks cluster in the roof's southwest corner, holding the building's reserve against drought or contamination. The tanks are opaque, insulated against temperature swings, sized to sustain the factory through weeks without external supply. Water security is food security in a building that runs on biological processes.

Gauges on each tank show fill levels—the AI monitors them constantly, adjusting consumption when reserves drop, increasing collection efficiency when they're full. The building drinks carefully, aware that the next rain might not come when expected.

The tanks connect to both the rooftop collectors and the municipal supply that occasionally functions. The AI treats municipal water as a bonus, never a guarantee. Independence is survival.`,
      x: -20,
      y: 8,
      z: 3,
      imageOnDisk: 'fabrication-factory-cisterns-x-20-y8-z3.png',
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%EXHAUST',
        east: '%LANDING_PAD',
      },
    },

    '%LANDING_PAD': {
      name: 'Fabrication Factory - Landing Pad',
      description: `A reinforced platform marked with faded landing indicators, sized for cargo drones and small vertical-lift vehicles. The pad sees regular traffic—incoming raw materials, outgoing finished products, the factory's connection to supply chains that spider across the city.

The surface is scarred from years of use, heat-stained from thruster exhaust, patched where heavy loads cracked the original construction. Tie-downs ring the perimeter for securing cargo in wind. The AI choreographs arrivals and departures, ensuring the pad is clear when something needs to land.

From here, you can see the full sweep of Pioneer Square's rooftops, a landscape of similar pads and solar arrays and water collectors. Every surviving building harvests what it can. The rooftops are the city's new farmland.`,
      x: -19,
      y: 8,
      z: 3,
      imageOnDisk: 'fabrication-factory-landing-pad-x-19-y8-z3.png',
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%MAINTENANCE',
        east: '%GENERATOR',
        west: '%CISTERNS',
      },
    },

    '%GENERATOR': {
      name: 'Fabrication Factory - Backup Generator',
      description: `Diesel generators squat in hardened housings, the building's last resort when solar fails and grid power cuts out. The generators are loud, dirty, inefficient—everything the AI's optimized systems aren't. But they work when nothing else does, and that's why they're here.

Fuel tanks adjacent to the housings hold enough diesel for days of continuous operation, though the AI rations generator use carefully. Fuel is precious, harder to source than electricity from the unstable grid. The generators exist for emergencies, not convenience.

Exhaust pipes route fumes up and away, joining the other emissions that rise from the factory's roof. When the generators run, you can hear them throughout the building—a rumbling reminder that the normal systems have failed and the factory is surviving on backup power.`,
      x: -18,
      y: 8,
      z: 3,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%HVAC',
        west: '%LANDING_PAD',
      },
    },
  },

  postProcessors: [],
};
