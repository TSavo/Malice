// Union Station - Roof (z=2)
// Outdoor rooftop with views of the city

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2) - 4x3 outdoor rooftop
    // ═══════════════════════════════════════════════════════════════════

    // Row y=-6 (north edge)
    '%ROOF_NW': {
      name: 'Union Station - Roof (Northwest)',
      description: `The northwest corner of Union Station's roof, where the Beaux-Arts parapet rises in decorative stonework. From here, the view north encompasses Pioneer Square—the Richardsonian Romanesque buildings of the historic district, the Smith Tower rising above them all, the skyline of a Seattle that was built when Union Station was young.

An HVAC unit occupies this corner, its modern housing clashing with the ornate stonework surrounding it. The unit was retrofitted during the 1990s conversion, when the building's historic character mattered less than functional climate control. The unit is silent now, its compressors dead, its purpose obsolete.

The parapet here is carved with railroad motifs—locomotives, wheels, the symbols of the industry the station served. The carvings are weathered but intact, a century of rain having softened their edges without destroying their meaning.`,
      x: -7,
      y: -6,
      z: 2,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_N',
        south: '%ROOF_W',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'HVAC unit',
          aliases: ['unit', 'air conditioner'],
          description: `A rooftop HVAC unit, its housing a utilitarian box of painted steel. The unit was installed during the 1990s conversion, when the building became office space and climate control became a necessity. The unit is silent now, its compressors dead, its purpose ended with the offices it served.`,
        },
        {
          prototype: 'describable',
          name: 'railroad carvings',
          aliases: ['carvings', 'locomotive carving'],
          description: `The parapet is carved with railroad motifs: a steam locomotive in profile, driving wheels in motion. The carving is worn by a century of weather, its edges softened, but the locomotive still seems to move, forever pulling toward destinations it will never reach.`,
        },
      ],
    },

    '%ROOF_N': {
      name: 'Union Station - Roof (North Center)',
      description: `The north-center section of the roof, where the barrel vault of the grand hall rises through the roofline. The vault's exterior is sheathed in copper, oxidized to a beautiful verdigris green that matches the bronze entrance doors below. Skylights are set into the copper, their glass grimy but intact, admitting light to the hall below.

From here, the full sweep of Pioneer Square is visible—the historic buildings clustered around Occidental Park, the streets that form the original core of Seattle. King Street Station's tower is visible to the east, Union Station's Beaux-Arts rival from the Great Northern Railway.

The copper roofing is slick underfoot, its surface smooth with age and weather. Walking here requires care—a fall from this height would be fatal.`,
      x: -6,
      y: -6,
      z: 2,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_NW',
        east: '%ROOF_NE',
        south: '%ROOF_C',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'copper vault',
          aliases: ['vault', 'barrel vault', 'copper roof'],
          description: `The barrel vault rises through the roofline, its copper sheathing oxidized to verdigris green. The copper was installed when the station was built—a century of weather has transformed its color from bright penny to this deep green that seems organic, as if the building is slowly becoming part of the landscape.`,
        },
        {
          prototype: 'describable',
          name: 'roof skylights',
          aliases: ['skylights', 'glass'],
          description: `Skylights are set into the copper vault, their glass thick with grime and pigeon droppings. The skylights were designed to illuminate the grand hall below, supplementing the tall arched windows with overhead light. They still admit light, though filtered now through decades of accumulated dirt.`,
        },
      ],
    },

    '%ROOF_NE': {
      name: 'Union Station - Roof (Northeast)',
      description: `The northeast corner of the roof, offering views east toward King Street Station and the industrial waterfront beyond. King Street Station's tower is clearly visible from here—a Venetian campanile transplanted to the Pacific Northwest, the Great Northern's answer to Union Pacific's Beaux-Arts grandeur.

A decorative finial rises from this corner, a carved stone ornament that once held a flagpole. The pole is gone—probably removed for safety after the station closed—but the mounting hardware remains, rusted in place.

The view east shows the railroad infrastructure that once made both stations vital: switching yards, warehouses, the industrial zone where trains were assembled and cargo was transferred. The infrastructure is silent now, but its extent is still visible—miles of track and structure, the skeleton of a transportation network.`,
      x: -5,
      y: -6,
      z: 2,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_N',
        south: '%ROOF_E',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'corner finial',
          aliases: ['finial', 'ornament'],
          description: `A decorative stone finial rises from the corner, carved with acanthus leaves and scrollwork in the Beaux-Arts style. The finial once supported a flagpole—mounting hardware is visible at its peak, rusted and empty. The flag that flew here is gone. The finial remains, reaching toward the sky it once marked with colors.`,
        },
      ],
    },

    // Row y=-7 (middle row)
    '%ROOF_W': {
      name: 'Union Station - Roof (West)',
      description: `The west section of the roof, overlooking the industrial area toward Elliott Bay. The waterfront is visible in the distance—the gray waters of Puget Sound, the container cranes that once loaded ships, the infrastructure of maritime commerce that paralleled the railroad's work.

A rooftop water tank stands here, cylindrical steel painted a faded red, its purpose to provide fire suppression water before the building was connected to municipal systems. The tank is empty now, its interior rusted, but the structure remains—too heavy to remove, too useless to maintain.

The parapet along the west edge is lower than the ornate sections facing the city, a practical acknowledgment that this side faced industry rather than the public. Even grand buildings have their service sides.`,
      x: -7,
      y: -7,
      z: 2,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NW',
        east: '%ROOF_C',
        south: '%ROOF_SW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'water tank',
          aliases: ['tank', 'steel tank'],
          description: `A cylindrical steel water tank, perhaps ten feet in diameter and fifteen feet tall, painted a faded red. The tank provided fire suppression water in the building's early years, before municipal water pressure was reliable. The tank is empty now, its interior a chamber of rust and echoes, but the structure remains—too massive to remove economically.`,
        },
      ],
    },

    '%ROOF_C': {
      name: 'Union Station - Roof (Center)',
      description: `The center of Union Station's roof, where the copper vault rises to its highest point. The hatch from the mezzanine below opens here, a steel door set into the roofline, secured with a padlock. From this vantage, the full extent of the building is visible—the ornate Beaux-Arts facades, the utilitarian rear elevations, the century of additions and modifications that mark any building's life.

The view is remarkable in all directions. Pioneer Square to the north, the waterfront to the west, the railroad yards to the south, the industrial district to the east. Union Station was positioned to connect all of these—the hub of a network that no longer functions.

Pigeons have colonized this section of roof, their nests tucked into the decorative stonework, their droppings covering the copper in gray-white patterns. The pigeons coo and flutter at intrusion, but don't flee—humans are a fading memory here.`,
      x: -6,
      y: -7,
      z: 2,
      population: 0,
      ambientNoise: 35,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: { room: '%MEZZANINE_N', locks: ['%ROOF_HATCH_LOCK'] },
        north: '%ROOF_N',
        west: '%ROOF_W',
        east: '%ROOF_E',
        south: '%ROOF_S',
      },
      sittables: [
        {
          name: 'the roof hatch frame',
          capacity: 2,
          emptyMsg:
            'The raised frame around the roof hatch provides a place to sit.',
          occupiedMsg: '%s sitting on the roof hatch frame',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'roof hatch',
          aliases: ['hatch', 'access hatch'],
          description: `A steel hatch set into the copper roofline, its surface painted gray. The hatch leads down to the mezzanine level, secured with a padlock that's rusted but intact. The hatch was for maintenance access—roof repairs, skylight cleaning, the tasks that kept the building functioning. The tasks stopped. The hatch waits.`,
        },
        {
          prototype: 'describable',
          name: 'pigeon colony',
          aliases: ['pigeons', 'nests', 'birds'],
          description: `Pigeons have colonized this section of roof, their nests tucked into every available crevice in the decorative stonework. The birds coo and flutter, undisturbed by occasional visitors. Their droppings cover the copper in gray-white patterns, the only fresh marks on a surface otherwise unchanged for years.`,
        },
      ],
    },

    '%ROOF_E': {
      name: 'Union Station - Roof (East)',
      description: `The east section of the roof, overlooking the railroad infrastructure that made Union Station possible. The rail yards stretch south, a maze of tracks and switches that once sorted trains for their various destinations. The tracks are rusted now, weeds growing between them, but the extent of the system is still visible—the industrial scale of passenger rail travel.

A cluster of antenna masts rises from this section, communications equipment added over the decades. A radio mast from the 1940s. A television antenna from the 1960s. A satellite dish from the 1990s. Each generation added its technology without removing what came before. None of them function now.

King Street Station's tower is directly visible from here, close enough to see the clock faces that once helped passengers time their connections between the rival stations.`,
      x: -5,
      y: -7,
      z: 2,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NE',
        west: '%ROOF_C',
        south: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'antenna array',
          aliases: ['antennas', 'masts'],
          description: `A collection of antenna masts, each from a different era. A steel radio mast from the 1940s, its guy wires still taut. A television antenna from the 1960s, its elements spread like aluminum wings. A satellite dish from the 1990s, pointed at a sky that may or may not still have satellites. The technologies accumulated. None of them work now.`,
        },
      ],
    },

    // Row y=-8 (south edge)
    '%ROOF_SW': {
      name: 'Union Station - Roof (Southwest)',
      description: `The southwest corner of the roof, where the building overlooks S. Jackson Street and the approach from Pioneer Square. This is the view passengers had as they arrived—the grand facade, the ornate entrance, the promise of journeys about to begin.

A decorative eagle perches on this corner, cast in bronze and mounted on a granite pedestal. The eagle's wings are spread, its head turned toward the harbor, the pose suggesting watchfulness over the city's commerce. The bronze is weathered to green, matching the copper roof, the eagle becoming part of the building rather than an addition to it.

The facade below is the building's finest face—the Beaux-Arts details visible from above, the arched entrance, the carved stonework that announced the station's importance to arriving passengers.`,
      x: -7,
      y: -8,
      z: 2,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_W',
        east: '%ROOF_S',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'bronze eagle',
          aliases: ['eagle', 'statue'],
          description: `A bronze eagle perches on a granite pedestal, its wings spread, its head turned toward the harbor. The eagle is perhaps four feet tall, its feathers rendered in meticulous detail, its pose suggesting vigilance over the city's commerce. The bronze has weathered to verdigris green, matching the copper roof—the eagle has become part of the building, watching over a commerce that no longer flows.`,
        },
      ],
    },

    '%ROOF_S': {
      name: 'Union Station - Roof (South Center)',
      description: `The south-center section of the roof, directly above the main entrance. The building's dedication is carved into the parapet here, visible from below: UNION STATION 1911, the same inscription that marks the entrance doors. From above, the letters are reversed, meant to be read from the street.

The main entrance's grand archway is visible below, its bronze doors green with age. The approach that passengers once took—from streetcar or automobile, up the wide steps, through the monumental doors—is laid out like a diagram from this height.

A flagpole rises from a mount near the parapet, its rope frayed, its pulley frozen. No flag flies. The pole points at the sky like a finger, indicating something above that no longer matters.`,
      x: -6,
      y: -8,
      z: 2,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_C',
        west: '%ROOF_SW',
        east: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'flagpole',
          aliases: ['pole', 'flag pole'],
          description: `A flagpole rises from a mount near the parapet, its aluminum surface dulled by weather. The rope is frayed, the pulley frozen with rust—no flag has been raised here in years. The pole stands empty against the sky, waiting for colors that won't be raised, ceremonies that won't be held.`,
        },
        {
          prototype: 'describable',
          name: 'dedication inscription',
          aliases: ['inscription', 'carving', 'lettering'],
          description: `UNION STATION 1911 is carved into the parapet, the letters deep-cut into granite. From up here, the inscription is reversed—meant to be read from the street below, where arriving passengers would see the building's name and date. The date marked an achievement: Seattle's connection to the national rail network, the city's arrival as a destination. The connection ended. The inscription remains.`,
        },
      ],
    },

    '%ROOF_SE': {
      name: 'Union Station - Roof (Southeast)',
      description: `The southeast corner of the roof, where the building meets the railroad infrastructure it was designed to serve. The view south shows the rail yards in their full extent—acres of track and switching equipment, the industrial machinery of a transportation network.

A matching bronze eagle perches on this corner, the twin of the one at the southwest. This eagle faces east, toward the mountains, toward the routes that led to Spokane and beyond. The paired eagles guarded the approaches to the station, symbols of the railroad's power and reach.

The parapet here shows earthquake repairs from some past disaster—newer stonework patched into the original, the colors not quite matching. The building has survived what the city has thrown at it. The eagles still watch.`,
      x: -5,
      y: -8,
      z: 2,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_E',
        west: '%ROOF_S',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'eastern eagle',
          aliases: ['eagle', 'bronze eagle', 'statue'],
          description: `A bronze eagle, twin to the one at the southwest corner, perches on its granite pedestal facing east. The eagle watches the mountains, the routes that led to Spokane, Chicago, the destinations that made Union Station a gateway rather than a terminus. The eagle is weathered to green, patient, watching for trains that will never come.`,
        },
        {
          prototype: 'describable',
          name: 'earthquake repairs',
          aliases: ['repairs', 'patched stonework'],
          description: `A section of the parapet shows earthquake repairs—newer stonework patched into the original construction, the colors not quite matching. The repair work is solid, professional, but visible. The building has been shaken and has survived. The patched stones are a record of that survival, testimony to what the building has endured.`,
        },
      ],
    },
  },
};
