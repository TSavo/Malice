// Chinatown-International District Underground - Level z=-2
// Beneath the ID (y=-8 to y=-14, x=-7 to x=+7)
// Historic Chinese tunnels, gambling dens, and opium passages

export const building = {
  name: 'Chinatown Underground',
  x: -7,
  y: -14,
  width: 15,
  height: 14,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // JACKSON STREET CORRIDOR (y=-8, main east-west passage)
    // ═══════════════════════════════════════════════════════════════════════

    '%JACKSON_WEST': {
      name: 'Jackson Street Underground West',
      description: `The passage runs beneath Jackson Street at its western edge, where Chinatown meets Pioneer Square. The construction shifts here—Victorian brick giving way to rougher tunneling, the work of Chinese laborers who extended Seattle's underground in ways the official record never acknowledged.

The walls bear faded characters painted in red—directions, warnings, or perhaps prayers. The language of an older community written in the darkness where it would endure.`,
      x: -7,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: '%JACKSON_MID_W',
        north: {
          to: 'buildings/king-street-underground/z-2.ts',
          room: '%KING_MAIN',
          description: 'A passage leads north toward King Street',
        },
      },
      objects: [
        { prototype: 'sign', name: 'faded Chinese characters', description: 'Red characters painted on the wall have faded but remain legible to those who read them. They speak of safe passage and warn of danger ahead.', boltedDown: true },
        { prototype: 'bench', name: 'a stone bench', description: 'A worn stone bench is carved into the wall, smoothed by generations of workers resting between shifts.', boltedDown: true },
      ],
    },

    '%JACKSON_MID_W': {
      name: 'Jackson Street Underground',
      description: `The passage continues through the heart of the underground Chinatown, the construction showing the marks of community labor. Alcoves branch off at intervals—storage spaces, hiding places, rooms that served purposes the surface world never knew.

The air carries traces of incense, sandalwood and something older, the ghost of offerings made to ancestors in the darkness beneath the streets.`,
      x: -3,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%JACKSON_WEST',
        east: '%JACKSON_MAIN',
        south: '%HERB_SHOP_BASEMENT',
      },
      objects: [
        { prototype: 'cabinet', name: 'an altar niche', description: 'A carved niche in the wall holds a small shrine—an incense holder, offerings of oranges long since petrified, and a faded photograph of someone\'s ancestors.', boltedDown: true },
      ],
    },

    '%JACKSON_MAIN': {
      name: 'Jackson Street Junction',
      description: `The passage opens into a junction where multiple routes converge beneath the heart of the International District. This was once a hub of underground activity—merchants, gamblers, workers, all moving through passages that let them avoid the hostility of the streets above.

The construction is more elaborate here, the ceiling higher, the space larger. This was a gathering place, a market, a community center hidden from eyes that wished the community harm.`,
      x: 0,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%JACKSON_MID_W',
        east: '%JACKSON_MID_E',
        south: '%GAMBLING_HALL',
        north: '%KING_JACKSON_CONN',
        down: '%DEEP_PASSAGE',
      },
      objects: [
        { prototype: 'sign', name: 'a direction stone', description: 'A flat stone set in the floor shows carved arrows pointing in different directions, each labeled with Chinese characters indicating destinations.', boltedDown: true },
        { prototype: 'bench', name: 'a merchant\'s counter', description: 'A stone counter remains from when this junction served as an underground market. The surface shows wear patterns from years of goods being weighed and exchanged.', boltedDown: true },
        { prototype: 'furniture', name: 'iron sconces', description: 'Wrought iron sconces line the walls, designed for oil lamps. Some still hold the stumps of ancient wicks.', boltedDown: true },
      ],
    },

    '%JACKSON_MID_E': {
      name: 'Jackson Street Underground',
      description: `The passage continues east through the buried district, the construction growing newer as it approaches areas developed in later decades. The walls transition from hand-carved stone to more modern materials—concrete appearing alongside brick, the infrastructure of different eras overlapping.`,
      x: 3,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%JACKSON_MAIN',
        east: '%JACKSON_EAST',
        south: '%OPIUM_DEN',
      },
    },

    '%JACKSON_EAST': {
      name: 'Jackson Street Underground East',
      description: `The passage reaches its eastern extent, where the underground meets the foundations of more recent buildings. The construction here is a patchwork—original tunneling joined by basement connections, the network adapting to the buildings constructed above.

A doorway that was sealed with concrete in 1962 has been breached—a rough opening cut through the "PROGRESS" that once blocked this route. Beyond lies utility infrastructure from a later era.`,
      x: 7,
      y: -8,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%JACKSON_MID_E',
        south: '%LAUNDRY_BASEMENT',
        east: {
          to: 'buildings/southeast-underground/z-2.ts',
          room: '%JACKSON_EXTENSION',
          description: 'A rough opening leads east into utility corridors',
        },
      },
      objects: [
        { prototype: 'sign', name: 'a breached doorway', description: 'An arched doorway was filled with concrete, "1962 - PROGRESS" scratched into the wet cement. Someone has since cut through it with power tools.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NORTH-SOUTH CONNECTIONS
    // ═══════════════════════════════════════════════════════════════════════

    '%KING_JACKSON_CONN': {
      name: 'King-Jackson Connector',
      description: `The passage runs north toward King Street, connecting the Chinatown underground to the rail yard tunnels. The route is narrow, clearly carved as an afterthought, linking communities that existed in parallel beneath the same streets.`,
      x: 0,
      y: -7,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        south: '%JACKSON_MAIN',
        north: {
          to: 'buildings/king-street-underground/z-2.ts',
          room: '%SECOND_AVE_SOUTH',
          description: 'A passage leads north toward King Street',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // HISTORIC SPACES
    // ═══════════════════════════════════════════════════════════════════════

    '%HERB_SHOP_BASEMENT': {
      name: 'Herb Shop Basement',
      description: `The passage opens into what was once the basement of a traditional Chinese medicine shop. Wooden shelving still lines the walls, though the hundreds of drawers that once held herbs and ingredients are empty now, their contents long since dispersed or decayed.

The air retains a ghost of medicinal scents—ginseng, licorice, dried orange peel—the olfactory memory of remedies dispensed for a century.`,
      x: -3,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%JACKSON_MID_W',
        south: '%STORAGE_WARREN',
        east: '%GAMBLING_HALL',
      },
      objects: [
        { prototype: 'cabinet', name: 'herb storage cabinet', description: 'A massive wooden cabinet with dozens of tiny drawers, each labeled in faded Chinese characters. Most are empty, but a few still hold desiccated roots and dried leaves.', boltedDown: true },
        { prototype: 'desk', name: 'a medicine preparation table', description: 'A heavy wooden table with a worn marble top, stained from decades of grinding and mixing herbs. A brass scale sits atop it, balanced and ready.', boltedDown: true },
        { prototype: 'sign', name: 'a prescription board', description: 'A wooden board shows columns of Chinese characters—recipes for traditional remedies, the knowledge of generations preserved in ink.', boltedDown: true },
      ],
    },

    '%GAMBLING_HALL': {
      name: 'Old Gambling Hall',
      description: `The passage opens into a larger space that once served as a gambling hall—the layout still visible in the worn floor patterns, the alcoves that held tables, the raised platform where the house watched over the games. Fan-tan, pai gow, lottery—the games that drew workers after their shifts are gone now, but the architecture of chance remains.

Police raided this hall a dozen times. It reopened each time within a week. Eventually, it was not the law but time that closed it.`,
      x: 0,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%JACKSON_MAIN',
        west: '%HERB_SHOP_BASEMENT',
        south: '%FAN_TAN_ROOM',
        east: '%OPIUM_DEN',
      },
      objects: [
        { prototype: 'desk', name: 'a fan-tan table', description: 'A circular table with a recessed center where beans or buttons were counted. The green felt is worn through to bare wood in spots.', boltedDown: true },
        { prototype: 'furniture', name: 'the house platform', description: 'A raised wooden platform where the house dealer once sat, watching the games below. The view commands the entire room.', boltedDown: true },
        { prototype: 'sign', name: 'gambling house rules', description: 'Faded characters painted on a board list the house rules. The last line, larger than the others, translates roughly to: "NO CREDIT. NO EXCEPTIONS."', boltedDown: true },
        { prototype: 'cabinet', name: 'a cashier\'s cage', description: 'A wooden cage with iron bars where money changed hands. The lock mechanism is broken, the cage empty.', boltedDown: true },
      ],
    },

    '%OPIUM_DEN': {
      name: 'Opium Den Remains',
      description: `The passage descends into a space that history tried to forget—an opium den that operated for decades beneath the streets. The room is smaller than expected, intimate, the wooden platforms along the walls designed for dreamers to recline while the pipes transported them elsewhere.

The smell of the drug is long gone, but something lingers—a heaviness in the air, a reluctance to leave. The dreams that were dreamed here left their mark.`,
      x: 3,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%JACKSON_MID_E',
        west: '%GAMBLING_HALL',
        south: '%OPIUM_STORAGE',
      },
      objects: [
        { prototype: 'bench', name: 'an opium platform', description: 'A low wooden platform with a shallow indentation where a head once rested. The wood is dark, stained by years of smoke and dreams.', boltedDown: true },
        { prototype: 'furniture', name: 'an oil lamp niche', description: 'A carved niche in the wall held the lamp that heated the pipes. Soot blackens the stone above it.', boltedDown: true },
        { prototype: 'sign', name: 'a poem on the wall', description: 'Chinese characters are painted on the wall—a poem about dreams and forgetting. The last line has been scratched out.', boltedDown: true },
      ],
    },

    '%LAUNDRY_BASEMENT': {
      name: 'Laundry Basement',
      description: `The passage opens into the basement of what was once a Chinese laundry—one of the businesses that sustained the community when other work was denied them. The space is large, the ceiling low, the construction designed for the work of washing and pressing.

Iron hooks line the walls where garments hung to dry. Drainage channels are cut into the floor. The infrastructure of labor remains even when the workers are gone.`,
      x: 7,
      y: -9,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%JACKSON_EAST',
        south: '%WORKER_QUARTERS',
        west: '%OPIUM_STORAGE',
      },
      objects: [
        { prototype: 'furniture', name: 'a washing trough', description: 'A long stone trough where laundry was scrubbed by hand. The stone is worn smooth, shaped by millions of strokes.', boltedDown: true },
        { prototype: 'furniture', name: 'a pressing station', description: 'An iron pressing stand with brackets for heavy irons heated over charcoal. The wood is scorched from a century of hot metal.', boltedDown: true },
        { prototype: 'sign', name: 'laundry tickets', description: 'A few paper laundry tickets remain pinned to a board, yellowed and brittle. The garments they represent were never collected.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN PASSAGES
    // ═══════════════════════════════════════════════════════════════════════

    '%STORAGE_WARREN': {
      name: 'Storage Warren',
      description: `The passage winds through a warren of small storage rooms carved from the earth—spaces used by merchants to hide inventory, by families to store possessions, by the desperate to shelter from the dangers of the surface. The rooms are small, barely large enough to stand in, connected by passages that require ducking.

Some rooms show signs of long habitation. Others appear untouched for decades.`,
      x: -3,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%HERB_SHOP_BASEMENT',
        east: '%FAN_TAN_ROOM',
        south: '%TUNNEL_SOUTH',
      },
      objects: [
        { prototype: 'trunk', name: 'an abandoned chest', description: 'A wooden chest with Chinese brass fittings, locked but rattling when moved. Whatever is inside has been there for a very long time.', boltedDown: true },
        { prototype: 'crate', name: 'stacked crates', description: 'Wooden crates stacked against the wall, their labels faded. Some are stamped with the names of import companies that no longer exist.', boltedDown: true },
      ],
    },

    '%FAN_TAN_ROOM': {
      name: 'Fan-Tan Room',
      description: `A smaller gambling room branches off from the main hall, this one dedicated to fan-tan—the game of counting and dividing that could occupy workers for hours with only a handful of buttons and a porcelain cup. The room is intimate, the table circular, the atmosphere suggesting long nights and small stakes.`,
      x: 0,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%GAMBLING_HALL',
        west: '%STORAGE_WARREN',
        east: '%OPIUM_STORAGE',
        south: '%TUNNEL_SOUTH',
      },
      objects: [
        { prototype: 'desk', name: 'a fan-tan table', description: 'A small round table with a brass bowl in the center. Tokens are scattered around the rim, left mid-game decades ago.', boltedDown: true },
        { prototype: 'bench', name: 'player stools', description: 'Low wooden stools surround the table, worn smooth where gamblers sat for hours.', boltedDown: true },
      ],
    },

    '%OPIUM_STORAGE': {
      name: 'Opium Storage',
      description: `A locked room that once held the supply for the den above—the dark paste that arrived from Asia in careful packaging, worth more than gold to those who craved it. The room is small, built like a vault, the door heavy iron designed to resist both thieves and raids.

The door stands open now. Whatever it protected is long since gone.`,
      x: 3,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%OPIUM_DEN',
        west: '%FAN_TAN_ROOM',
        east: '%LAUNDRY_BASEMENT',
      },
      objects: [
        { prototype: 'safe', name: 'a broken vault door', description: 'A heavy iron door hangs from broken hinges, its lock mechanism destroyed by force. Scratch marks show where pry bars worked at the edges.', boltedDown: true },
        { prototype: 'cabinet', name: 'empty shelving', description: 'Wooden shelves line the walls, each compartment labeled with Chinese characters. All are empty, cleaned out thoroughly.', boltedDown: true },
        { prototype: 'sign', name: 'a inventory ledger page', description: 'A single page from a ledger is nailed to the wall, columns of numbers representing shipments and sales. The final entry is dated 1909.', boltedDown: true },
      ],
    },

    '%WORKER_QUARTERS': {
      name: 'Worker Quarters',
      description: `The passage opens into a dormitory space where laundry workers once slept in bunks stacked three high. The bunks are gone, but the anchor points remain in the walls, along with the carved shelves where personal possessions were kept. A dozen men could sleep here, working sixteen-hour days and falling into exhausted rest within arm's reach of each other.

The community that built this space built it from necessity. They are gone now. The space remembers.`,
      x: 7,
      y: -10,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LAUNDRY_BASEMENT',
        west: '%OPIUM_STORAGE',
        south: '%EASTERN_TUNNEL',
      },
      objects: [
        { prototype: 'sign', name: 'carved names', description: 'Names are carved into the wall—Chinese characters and anglicized versions side by side. "WONG YUEN - Charlie Wong". "LEE KAM - Samuel Lee". The workers named themselves twice.', boltedDown: true },
        { prototype: 'bench', name: 'a bunk frame', description: 'The iron frame of a triple bunk remains anchored to the wall, its mattresses and boards long since rotted away.', boltedDown: true },
        { prototype: 'cabinet', name: 'a personal shrine niche', description: 'A small niche carved into the wall held a personal shrine. Incense ash still stains the stone. A faded photograph shows a family in China, never reunited.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // SOUTHERN TUNNELS
    // ═══════════════════════════════════════════════════════════════════════

    '%TUNNEL_SOUTH': {
      name: 'Southern Passage',
      description: `The passage runs south from the inhabited areas into territory that was never developed for use—a tunnel that was started and abandoned, perhaps intended to connect to something that was never built. The construction grows rougher, the passage narrower, the light dimmer.

The tunnel ends at a cave-in. Beyond it, who knows.`,
      x: -1,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 5,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%FAN_TAN_ROOM',
        east: '%EASTERN_TUNNEL',
      },
      objects: [
        { prototype: 'sign', name: 'a cave-in warning', description: 'Characters scratched into the wall warn of instability ahead. An arrow points back the way you came.', boltedDown: true },
        { prototype: 'crate', name: 'abandoned tools', description: 'Picks and shovels lie where they were dropped, rusted solid. The workers who left them never returned.', boltedDown: true },
      ],
    },

    '%EASTERN_TUNNEL': {
      name: 'Eastern Tunnel',
      description: `The passage winds east through the edge of the underground network, connecting the Chinatown tunnels to routes that run toward the industrial district. The construction is mixed—hand-carved passages meeting later infrastructure, the work of different communities overlapping in the darkness.`,
      x: 4,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%TUNNEL_SOUTH',
        north: '%WORKER_QUARTERS',
        east: '%INDUSTRIAL_CONN',
      },
    },

    '%INDUSTRIAL_CONN': {
      name: 'Industrial Connection',
      description: `The passage reaches a junction where the Chinatown tunnels meet routes that run toward the industrial waterfront. The construction changes abruptly—hand-carved stone giving way to concrete and steel, the infrastructure of the early twentieth century joining the work of earlier decades.

This connection linked the Chinese community to the industrial jobs that sometimes hired them when other employers would not.`,
      x: 7,
      y: -11,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%EASTERN_TUNNEL',
        east: {
          to: 'buildings/industrial-underground/z-2.ts',
          room: '%WORKER_TUNNEL',
          description: 'A passage leads east toward the industrial tunnels',
        },
      },
      objects: [
        { prototype: 'sign', name: 'a bilingual sign', description: 'A sign in English and Chinese reads: "WORKERS THIS WAY →". The Chinese characters add: "Stay together. Stay silent."', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP SECTIONS
    // ═══════════════════════════════════════════════════════════════════════

    '%DEEP_PASSAGE': {
      name: 'Deep Passage',
      description: `A narrow shaft descends from the junction into older passages—tunnels that predate the Chinatown community, perhaps dug during Seattle's earliest years or even before. The construction is primitive, the passage tight, the destination unclear.

Few venture this way. Those who do find the older Seattle, the one that existed before the fire, before the regrading, before the underground was forgotten.`,
      x: 0,
      y: -8,
      z: -3,
      population: 0,
      ambientNoise: 5,
      lighting: 3,
      waterLevel: 20,
      outdoor: false,
      exits: {
        up: '%JACKSON_MAIN',
        south: '%ANCIENT_TUNNEL',
      },
      objects: [
        { prototype: 'sign', name: 'old tool marks', description: 'The walls show tool marks from a different era—hand-forged picks, not the machine-made tools of later decades.', boltedDown: true },
      ],
    },

    '%ANCIENT_TUNNEL': {
      name: 'Ancient Tunnel',
      description: `The passage continues through what might be Seattle's oldest underground construction—tunnels dug before the Great Fire of 1889, preserved by chance when the city was rebuilt above them. The construction is rough, the purpose unclear. Perhaps drainage. Perhaps smuggling. Perhaps something else entirely.

Water seeps through the walls. The darkness is absolute without a light source. The city's foundations rest above, unaware of what lies beneath.`,
      x: 0,
      y: -9,
      z: -3,
      population: 0,
      ambientNoise: 8,
      lighting: 0,
      waterLevel: 30,
      outdoor: false,
      exits: {
        north: '%DEEP_PASSAGE',
        down: {
          to: 'buildings/deep-cisterns/z-4.ts',
          room: '%CHINATOWN_ACCESS',
          description: 'A flooded shaft descends into absolute darkness',
        },
      },
      objects: [
        { prototype: 'sign', name: 'carved date', description: 'A date is carved into the stone: "1878". Eleven years before the fire. Someone was here before Seattle buried itself.', boltedDown: true },
        { prototype: 'crate', name: 'a rotted barrel', description: 'The remains of a wooden barrel, its staves collapsed inward. Whatever it held dissolved into the earth decades ago.', boltedDown: true },
      ],
    },
  },
};
