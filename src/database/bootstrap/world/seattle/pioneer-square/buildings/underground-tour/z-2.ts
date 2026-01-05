// Underground Tour - Buried Streets Level (z=-2)
// The actual historic underground that tourists once paid to see
// Now accessible without a guide

export const building = {
  name: 'Underground Tour',
  x: -15,
  y: -3,
  width: 3,
  height: 3,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // TOUR ROUTE (z=-2) - THE BURIED STREETS
    // ═══════════════════════════════════════════════════════════════════════

    '%TOUR_START': {
      name: 'Underground Tour - Buried Sidewalk',
      description: `The stairs deposit you onto what was once a sidewalk—now a ceiling of wooden planks overhead, the street-level that tourists walked on became the roof of the world below. The prism glass skylights are dark, their purple panes admitting nothing from the modern streets far above.

This is where the tours began their actual underground journey, where guides gestured at the brick storefronts and explained how Seattle raised itself after the Great Fire. The storefronts are still here—display windows with iron frames, doorways leading to shops that closed over a century ago.

A rope barrier that once kept tourists in line lies coiled on the ground, its brass stanchions toppled and tarnished. The tour route leads south, but the rope can no longer compel obedience.`,
      x: -15,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%DESCENT',
        south: '%TOUR_MID',
        east: '%STOREFRONT_ROW',
        north: {
          to: 'buildings/merchants-cafe/z-1.ts',
          room: '%OLD_FOUNDATION',
          description: 'A rough passage leads north toward an old basement',
          hidden: true,
        },
      },
      objects: [
        { prototype: 'furniture', name: 'prism glass skylights', description: 'Glass prisms set into the ceiling once allowed light to filter down from the street above. The prisms are dark now—the sidewalk above them replaced with solid concrete decades ago.', boltedDown: true },
        { prototype: 'sign', name: 'a tour placard', description: 'A laminated placard on a stand explains the Great Fire of 1889, the decision to raise the streets, and the creation of this underground world. The corners are curled with moisture damage.', boltedDown: true },
        { prototype: 'furniture', name: 'fallen rope stanchions', description: 'Brass stanchions with red velvet rope, toppled and scattered. They once guided tourist traffic in orderly lines. The order has ended.', boltedDown: true },
      ],
    },

    '%TOUR_MID': {
      name: 'Underground Tour - Commerce Row',
      description: `The tour route continues past storefronts that once served a working city—a bank with iron-barred windows, a hotel lobby with a marble counter, a tailor's shop with a headless mannequin still wearing half a suit. The businesses closed when the streets rose, their owners relocating upward, leaving inventory behind.

The guides had stories for each storefront. The bank that survived three robberies before the fire took it. The hotel where Mark Twain supposedly spent one night. The tailor who made clothes for loggers and longshoremen. Truth and embellishment blended into entertainment.

The tour route turns east here, toward the main underground network that the tours only hinted at.`,
      x: -15,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%TOUR_START',
        east: '%TOUR_END',
        south: '%HIDDEN_ALCOVE',
      },
      objects: [
        { prototype: 'furniture', name: 'a headless mannequin', description: 'A dressmaker\'s mannequin still wears half a Victorian suit—one sleeve pinned, the other dangling loose. The head is missing, perhaps taken as a souvenir.', boltedDown: true },
        { prototype: 'furniture', name: 'an iron-barred window', description: 'The bank\'s teller window still has its iron bars intact. A cash drawer hangs open, emptied long ago but never removed.', boltedDown: true },
        { prototype: 'sign', name: 'a hotel register', description: 'A guest register lies open on the marble counter, its pages water-damaged but readable. Names from 1889, the last guests before the fire: "J. Stevens, Portland. W. Chen, San Francisco. A. Morrison, Tacoma."', boltedDown: true },
      ],
    },

    '%STOREFRONT_ROW': {
      name: 'Underground Tour - Preserved Storefronts',
      description: `The side passage runs along a row of storefronts that were preserved as tour exhibits—windows cleaned, facades stabilized, small plaques identifying each business. The preservation efforts ended when the tours did, but the storefronts remain in better condition than the rest of the underground.

A pharmacy with shelves of empty brown bottles. A hardware store with rusted tools still hanging on pegboards. A dry goods store with wooden barrels that once held flour and sugar and beans, their contents long since claimed by rats and rot.

The passage opens east into the wider underground network, where the tours never went.`,
      x: -14,
      y: -3,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%TOUR_START',
        south: '%TOUR_END',
        east: {
          to: 'underground/upper-tunnels/x-13-y-3.ts',
          description: 'A passage leads east into the broader underground network',
        },
      },
      objects: [
        { prototype: 'cabinet', name: 'pharmacy shelves', description: 'Wooden shelves hold rows of brown glass bottles, their paper labels faded to illegibility. Whatever medicines they held evaporated decades ago.', boltedDown: true },
        { prototype: 'furniture', name: 'hardware pegboards', description: 'Rusted tools hang on pegboards: hammers, saws, chisels, files. A price tag is still visible: "HAND SAW - 75¢".', boltedDown: true },
        { prototype: 'crate', name: 'wooden barrels', description: 'Wooden barrels that once held dry goods now hold only dust and cobwebs. The staves are warped, the iron bands rusted.', boltedDown: true },
      ],
    },

    '%TOUR_END': {
      name: 'Underground Tour - End of the Line',
      description: `The tour route terminates at a junction where the preserved sections meet the unpreserved underground. A chain barrier with an EMPLOYEES ONLY sign once prevented tourists from wandering further. The chain hangs loose now, one end unhooked from the stanchion.

Beyond the barrier, the underground continues—less maintained, more authentic, the actual buried streets rather than the curated exhibit. This is where the tours turned around, where guides warned about unstable construction and liability concerns. The warnings were real. The unstable construction is still unstable.

A door in the south wall leads to passages that weren't on the tour.`,
      x: -14,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 5,
      waterLevel: 10,
      outdoor: false,
      exits: {
        north: '%STOREFRONT_ROW',
        west: '%TOUR_MID',
        south: '%UNTOUR_PASSAGE',
        east: '%MAINT_1',
      },
      objects: [
        { prototype: 'sign', name: 'an employees only sign', description: 'A weathered sign reads "EMPLOYEES ONLY - TOUR PARTICIPANTS DO NOT PROCEED". Below it, graffiti adds: "tour\'s over".', boltedDown: true },
        { prototype: 'furniture', name: 'a loose chain barrier', description: 'A chain that once blocked the passage hangs from one stanchion, the other end unhooked. The barrier is symbolic now.', boltedDown: true },
      ],
    },

    '%HIDDEN_ALCOVE': {
      name: 'Underground Tour - Hidden Alcove',
      description: `A small alcove behind a collapsed display case, invisible from the main tour route. The guides didn't know about this space, or pretended not to—it wasn't part of the script. The alcove shows evidence of regular use: a sleeping bag, empty food cans, a battery-powered lantern.

Someone has been living here, using the tour infrastructure for shelter. The sleeping bag is recent. The person might return.`,
      x: -15,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 2,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%TOUR_MID',
        east: '%UNTOUR_PASSAGE',
      },
      objects: [
        { prototype: 'furniture', name: 'a sleeping bag', description: 'A worn sleeping bag rolled neatly against the wall. It\'s been used recently—the fabric is dirty but not mildewed.', boltedDown: true },
        { prototype: 'crate', name: 'empty food cans', description: 'A small pile of empty cans: beans, soup, Vienna sausages. The labels are from this decade.', boltedDown: true },
        { prototype: 'furniture', name: 'a battery lantern', description: 'A battery-powered camping lantern. The switch is off, but the batteries might still work.', boltedDown: true },
      ],
    },

    '%UNTOUR_PASSAGE': {
      name: 'Underground Tour - Restricted Passage',
      description: `Beyond the tour boundary, the underground loses its curated character. The walls are rougher, the floor uneven, the maintenance that kept the tour route passable never extended here. This is the real underground—the parts the tourists never saw.

The passage runs south toward the docks, connecting the tour infrastructure to the broader network that links Pioneer Square's basements and buried streets. The air is damper here, the smell stronger, the sense of history unmediated by plaques and guides.`,
      x: -14,
      y: -5,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 3,
      waterLevel: 15,
      outdoor: false,
      exits: {
        north: '%TOUR_END',
        west: '%HIDDEN_ALCOVE',
        south: {
          to: 'buildings/waterfront-underground/z-2.ts',
          room: '%DOCK_PASSAGE',
          description: 'A rough passage descends toward the waterfront',
        },
      },
      objects: [
        { prototype: 'sign', name: 'scratched directions', description: 'Directions scratched into the brick: "DOCKS ↓" and "CITY →". Someone mapped these passages the old-fashioned way.', boltedDown: true },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // MAINTENANCE CORRIDOR (y=-4, connecting Tour End to Pump Room)
    // The passage the tour never showed - 12 rooms of forgotten infrastructure
    // ═══════════════════════════════════════════════════════════════════════

    '%MAINT_1': {
      name: 'Abandoned Maintenance Room',
      description: `Beyond the tour barrier, the first space you encounter is a maintenance room that served the tour operation itself—cleaning supplies long since hardened into useless masses, replacement lightbulbs still in their boxes, a clipboard with inspection checklists dated 1997. The last inspector signed off and never returned.

A pegboard on the wall holds keys to doors that may or may not still exist, each tagged with cryptic codes: "B-7", "PUMP ACCESS", "DO NOT DUPLICATE - SEE MANAGEMENT". Management stopped seeing visitors twenty years ago.`,
      x: -13,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 8,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%TOUR_END',
        east: '%MAINT_2',
      },
      objects: [
        { prototype: 'cabinet', name: 'a maintenance cabinet', description: 'A metal cabinet with a broken lock. Inside: dried paint cans, stiff brushes, and a hard hat with "BILL" written in marker.', boltedDown: true },
        { prototype: 'sign', name: 'a key pegboard', description: 'Tagged keys hang from hooks, each promising access to somewhere. The tags are coded, the meanings lost.', boltedDown: true },
      ],
    },

    '%MAINT_2': {
      name: 'The Sorting Room',
      description: `The passage opens into a chamber where the tour company sorted artifacts—genuine historical items separated from reproductions, things safe to display distinguished from things better left hidden. Wooden crates line the walls, their contents documented on yellowed inventory sheets: "OPIUM PIPES (3) - DO NOT DISPLAY", "CHINESE LOTTERY TICKETS - AUTHENTIC", "HUMAN BONE FRAGMENT - PROVENANCE UNKNOWN".

Someone made careful decisions about what stories to tell and which to bury. The buried stories remain in their crates, waiting for historians who never came.`,
      x: -12,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%MAINT_1',
        east: '%MAINT_3',
      },
      objects: [
        { prototype: 'crate', name: 'artifact crates', description: 'Wooden crates stacked with care, their contents inventoried but never catalogued by any museum. "DO NOT DISPLAY" appears on several.', boltedDown: true },
      ],
    },

    '%MAINT_3': {
      name: 'Collapsed Gallery',
      description: `The passage threads through a section where the ceiling partially gave way, timber beams angled down like broken ribs. The collapse exposed what was behind the tour's false walls: the actual buried storefronts, far less picturesque than the sanitized exhibits. A brothel's advertisement is clearly visible through the gap—"MISS LULU'S ESTABLISHMENT - GENTLEMEN WELCOME" in letters meant to be read from below, not above.

The tour guides walked past this section for decades, never mentioning what lay behind the plaster. The plaster is gone now. Miss Lulu's welcomes no one.`,
      x: -11,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 6,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%MAINT_2',
        east: '%MAINT_4',
      },
    },

    '%MAINT_4': {
      name: 'The Plague Room',
      description: `A chamber that the tour company sealed and never reopened. The door's warning signs are direct: "BIOLOGICAL HAZARD - DO NOT ENTER WITHOUT AUTHORIZATION". Inside, the reason becomes clear—this was a quarantine space during the 1899 plague outbreak, and the tour company discovered evidence of hasty burials beneath the floor.

The floorboards have been pried up in places, revealing packed earth that shows the disturbance of digging. Whatever investigation began was never completed. The door was sealed instead. The silence here is different from elsewhere—heavier, more final.`,
      x: -10,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 0,
      lighting: 4,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%MAINT_3',
        east: '%MAINT_5',
      },
      objects: [
        { prototype: 'sign', name: 'biohazard warning', description: 'A red sign with the biohazard trefoil: "BIOLOGICAL HAZARD - AUTHORIZED PERSONNEL ONLY - REPORT TO SITE SUPERVISOR". No supervisor remains to report to.', boltedDown: true },
      ],
    },

    '%MAINT_5': {
      name: 'Junction of Lost Basements',
      description: `The passage opens into a junction where several basement spaces once connected, their shared walls long since crumbled. The geography is confusing—you can see through gaps into spaces that seem to repeat, basements behind basements, a recursion of abandoned commerce that defies easy mapping.

Chalk marks on the walls suggest others have tried to navigate this space: arrows pointing in contradictory directions, X marks whose meanings are disputed, a crude map that doesn't match the actual layout. The underground refuses to be charted.`,
      x: -9,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%MAINT_4',
        east: '%MAINT_6',
      },
      objects: [
        { prototype: 'sign', name: 'conflicting directions', description: 'Chalk arrows point every direction. Someone wrote "THIS WAY" with an arrow; someone else crossed it out and wrote "NO" with an arrow pointing opposite.', boltedDown: true },
      ],
    },

    '%MAINT_6': {
      name: 'The Crematorium Passage',
      description: `The walls here are blackened by heat that touched them long ago. A brass plate, still legible, identifies this space: "SEATTLE CREMATION SOCIETY - EST. 1891". The crematorium operated legally for only three years before the city shut it down for reasons the records don't specify.

The furnace is gone, removed by hands that didn't want evidence. But the heat scarring remains, the stones permanently altered by temperatures no grave should require. The passage continues past this unmarked memorial to whatever burned here.`,
      x: -8,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%MAINT_5',
        east: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%OCC_S4',
          description: 'A flooded passage leads east toward the sluice chamber',
        },
      },
    },

    '%MAINT_7': {
      name: 'The Opium Den Remains',
      description: `The passage passes through what was unmistakably an opium den—the layout still visible in the raised platforms along the walls where smokers once reclined, the niches where lamps were placed, the decorative tiles that survived a century underground. The den was closed by police raids in 1909, according to newspapers of the era. The newspapers didn't mention what happened to those inside when the police came.

Pipes and paraphernalia were removed long ago, but the scorch marks on the platform tiles remain, the chemical residue of dreams that outlasted the dreamers.`,
      x: -6,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 6,
      waterLevel: 15,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%OCC_S4',
          description: 'A flooded passage leads west toward the sluice chamber',
        },
        east: '%MAINT_9',
      },
      objects: [
        { prototype: 'bench', name: 'an opium platform', description: 'A raised wooden platform where smokers once reclined, its surface stained and scorched. The lacquer finish suggests this was an upscale establishment.', boltedDown: true },
      ],
    },

    '%MAINT_9': {
      name: 'The Counting Room',
      description: `A reinforced chamber that was clearly built for security—iron bars on the single window (now looking onto nothing but earth), a heavy door with multiple locks (all long since broken), and a floor safe that was professionally cut open decades ago. This was where someone counted money that couldn't be counted in daylight.

Ledger pages scattered on the floor record transactions in code: numbers and initials, amounts and dates, the bookkeeping of enterprises that left no legitimate records. The safe is empty. The secrets remain, indecipherable.`,
      x: -5,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%MAINT_7',
        east: '%MAINT_10',
      },
      objects: [
        { prototype: 'safe', name: 'a cracked floor safe', description: 'A floor safe with its door cut away by professional tools. The interior shows scorch marks from thermite—someone really wanted in.', boltedDown: true },
      ],
    },

    '%MAINT_10': {
      name: 'Underground Chapel',
      description: `The passage opens into what was once a chapel—the architecture unmistakable despite the decay. A stone altar stands against the east wall, its surface stained with substances that might be wine or might be something else. Pews have rotted into fragments, their arrangement still suggesting rows of worshippers facing the altar.

The denomination is unclear. The iconography is missing, removed or never present. But the devotion is evident—someone built a place of worship underground, where no congregation could be observed, where no practices could be questioned. What was worshipped here, the stones don't say.`,
      x: -4,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%MAINT_9',
        east: '%MAINT_11',
      },
      objects: [
        { prototype: 'furniture', name: 'a stone altar', description: 'A heavy stone altar, its surface stained dark with age and use. No cross or symbol identifies the faith that worshipped here.', boltedDown: true },
      ],
    },

    '%MAINT_11': {
      name: 'The Printing Press',
      description: `A chamber containing the remains of a printing operation—not the legitimate newspaper press visible on the tour, but something more clandestine. This press produced materials that weren't meant for public consumption: pamphlets advocating labor organization, counterfeit theater tickets, anarchist manifestos, and according to the evidence scattered on the floor, currency.

The press itself is a massive iron beast, its mechanism seized with rust. Type trays spilled across the floor show letters reversed, ready to print. The last run was never completed. Perhaps the printers fled. Perhaps they were found.`,
      x: -3,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%MAINT_10',
        east: '%MAINT_12',
      },
      objects: [
        { prototype: 'furniture', name: 'a clandestine press', description: 'An iron printing press, its workings frozen. Scattered type shows fragments of text: "WORKERS OF THE WORLD" and "UNITED STATES TREASURY".', boltedDown: true },
      ],
    },

    '%MAINT_12': {
      name: 'Surgery Theater',
      description: `The final chamber before the pump room contains the unmistakable architecture of a surgical theater—tiled walls that could be cleaned, drains in the floor for fluids, an operating table of porcelain and steel. But this was no hospital. The straps on the table, the locked cabinet of surgical tools, and the barred windows tell a different story.

What surgeries were performed here, on whom, and by whose consent, the records don't say. The tools remain in their cabinet: bone saws, scalpels, implements for procedures no modern surgeon would recognize. The table is clean—too clean, recently cleaned, suggesting use that continued long after any legitimate purpose ended.`,
      x: -2,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%MAINT_11',
        east: '%MAINT_13',
      },
      objects: [
        { prototype: 'furniture', name: 'surgical table', description: 'A porcelain operating table with leather straps at the wrists and ankles. The surface is clean—suspiciously clean for something a century old.', boltedDown: true },
        { prototype: 'cabinet', name: 'surgical cabinet', description: 'A locked glass cabinet holding instruments that predate anesthesia. Some tools have no obvious medical purpose.', boltedDown: true },
      ],
    },

    '%MAINT_13': {
      name: 'Pump Access Corridor',
      description: `The passage straightens and widens as it approaches the pump room, the construction becoming more industrial, more modern. This section was renovated in the twentieth century—poured concrete replacing Victorian brick, electrical conduit running along the ceiling, emergency lights that still function on backup batteries.

The Gray Cartel maintains this section. Their marks are subtle but visible to those who know what to look for: a gray triangle scratched near the entrance, fresh grease on the door hinges, the absence of debris that accumulates everywhere else. This route serves current purposes.`,
      x: -1,
      y: -4,
      z: -2,
      population: 0,
      ambientNoise: 25,
      lighting: 20,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%MAINT_12',
        east: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%PUMP_ROOM',
          description: 'A corridor leads east to the pump room',
        },
      },
      objects: [
        { prototype: 'sign', name: 'a gray triangle', description: 'A small gray triangle scratched into the concrete near the doorway—the Cartel\'s mark of safe passage.', boltedDown: true },
      ],
    },
  },
};
