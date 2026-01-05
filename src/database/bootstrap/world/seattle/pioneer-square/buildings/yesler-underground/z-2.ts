// Yesler Underground - Level z=-2 (Northern Historic Basements)
// Beneath Yesler Way (y=+6 to y=+12)
// Prohibition-era speakeasies, historic basements, and hidden passages

export const building = {
  name: 'Yesler Underground',
  x: -14,
  y: 12,
  width: 29,
  height: 14,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // YESLER WAY MAIN CORRIDOR (y=+12, beneath the street)
    // ═══════════════════════════════════════════════════════════════════════

    '%YESLER_WEST': {
      name: 'Yesler Way Underground West',
      description: `The passage runs beneath Yesler Way at its western extent, where the historic street meets the waterfront. The construction here shows the marks of the street-raising era—brick walls that once fronted businesses, now buried beneath the modern street level.

The air is damp with proximity to the bay, salt seeping in through routes that connect to the waterfront underground. The passage serves as a junction between the northern network and the coastal tunnels, a crossroads beneath the crossroads.`,
      x: -14,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 12,
      outdoor: false,
      exits: {
        south: '%YESLER_JUNCTION_W',
        east: '%YESLER_ARCADE_1',
        west: {
          to: 'buildings/waterfront-underground/z-2.ts',
          room: '%FIRST_AVE_CONN',
          description: 'A damp passage leads toward the waterfront',
        },
        north: {
          to: 'buildings/pioneer-books/z-1.ts',
          room: '%FOUNDATION',
          description: 'A rough passage leads north into an old basement',
          hidden: true,
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // YESLER WAY ARCADE (x=-13 to x=-8, connecting West to Mid-West)
    // ═══════════════════════════════════════════════════════════════════════

    '%YESLER_ARCADE_1': {
      name: 'Buried Arcade',
      description: `The passage opens into what was once a covered shopping arcade—a Victorian innovation that brought natural light to retailers through skylights now buried under twelve feet of street fill. The skylights are still there, sealed and dark, their iron frames visible in the ceiling like the ribs of some great beast.

Cast iron storefronts line both sides, their plate glass windows surprisingly intact behind protective shutters that were closed during the street-raising and never reopened. One shutter has fallen away, revealing a frozen moment: a tailor's shop, its dress forms still standing, draped in fabric that crumbles at a touch.`,
      x: -13,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%YESLER_WEST',
        east: '%YESLER_ARCADE_2',
      },
      objects: [
        { prototype: 'sign', name: 'an arcade directory', description: 'A marble plaque lists businesses: "SCHWARTZ TAILORING", "ORIENTAL IMPORTS", "MADAME CLARICE - FORTUNES TOLD", "THE YESLER PHARMACY". All gone now, all forgotten.', boltedDown: true },
      ],
    },

    '%YESLER_ARCADE_2': {
      name: 'The Pharmacy Ruins',
      description: `The pharmacy that once anchored the arcade's center stands frozen in commercial amber. Wooden cabinets line the walls, their glass doors shattered by decades of settling, revealing rows of brown bottles still labeled in Latin. The apothecary's counter stretches across the back, its marble top cracked but still bearing the stains of tinctures and elixirs mixed over a century ago.

A mortar and pestle sit on the counter, bone dry, the last prescription ground to dust along with the pharmacist who compounded it. The smell of old medicines lingers—camphor and laudanum and something sweeter that might once have been vanilla extract.`,
      x: -12,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_ARCADE_1',
        east: '%YESLER_ARCADE_3',
      },
      objects: [
        { prototype: 'cabinet', name: 'apothecary cabinet', description: 'Glass-fronted drawers hold mysteries: dried herbs now powder, patent medicines promising impossible cures, and a locked drawer marked "DANGEROUS - DO NOT DISPENSE".', boltedDown: true },
      ],
    },

    '%YESLER_ARCADE_3': {
      name: 'Fortune Teller\'s Parlor',
      description: `Madame Clarice's establishment survives in remarkable condition, its velvet curtains faded from crimson to rust, its crystal ball still sitting on its brass stand though now clouded with a century of dust. The fortune teller's chair faces the entrance, positioned for dramatic effect, its occupant long since departed though their cigarette holder still lies on the side table.

The walls are painted with zodiac symbols and mystical iconography that would have seemed exotic in the 1890s—pyramids, all-seeing eyes, serpents devouring their tails. Someone more recently has added new symbols in chalk: geometric patterns that pulse with an unsettling familiarity, as if Madame Clarice's successors found something real in these depths.`,
      x: -11,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%YESLER_ARCADE_2',
        east: '%YESLER_ARCADE_4',
      },
    },

    '%YESLER_ARCADE_4': {
      name: 'Oriental Imports',
      description: `The import shop's inventory survives in fragments—porcelain figurines, their glazes crazed by temperature fluctuations; bamboo furniture collapsed into neat piles of kindling; silk screens that disintegrate when touched. A ship's manifest tacked to the wall lists goods from Shanghai and Hong Kong, tea and spices and "sundry curios" that made the long Pacific crossing only to be entombed here.

The merchant's desk still holds a ledger, its pages fused by moisture into a solid brick of transactions. On the wall behind, a calendar shows February 1890—the last month before the street was raised, the last month this shop saw customers.`,
      x: -10,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_ARCADE_3',
        east: '%YESLER_ARCADE_5',
      },
    },

    '%YESLER_ARCADE_5': {
      name: 'The Penny Arcade',
      description: `Before the term meant video games, penny arcades offered mechanical wonders—and this one's wonders remain. Kinetoscope machines stand in rows, their hand-crank viewers promising "MOVING PICTURES FROM THE ORIENT" and "THE EXOTIC DANCERS OF PARIS". A strength-testing machine shaped like a brass boxer challenges all comers to ring its bell. A fortune-telling automaton in a glass case stares with painted eyes that seem to follow movement.

The machines are dead, their mechanisms seized by rust and time. But the automaton's hand, extended to dispense paper fortunes, holds one last card—yellowed, waiting for someone to claim a future predicted over a century ago.`,
      x: -9,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 2,
      lighting: 12,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%YESLER_ARCADE_4',
        east: '%YESLER_ARCADE_6',
      },
      objects: [
        { prototype: 'furniture', name: 'fortune automaton', description: 'A mechanical fortune-teller in Ottoman dress sits frozen in her glass case. One hand extends a yellowed card. The other points at something you cannot see.', boltedDown: true },
      ],
    },

    '%YESLER_ARCADE_6': {
      name: 'Arcade\'s End',
      description: `The arcade terminates at what was once an elegant café, its wrought-iron tables still arranged as if awaiting patrons who left for lunch in 1890 and simply never returned. A pastry case of curved glass holds the fossilized remains of confections that have transcended decay, their sugars crystallized into permanent sculptures of Victorian indulgence.

The café's back wall has collapsed partially, revealing a passage beyond that was carved later—a rough-hewn connection to the next section of the underground, pragmatic tunneling that ignores the arcade's genteel pretensions.`,
      x: -8,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_ARCADE_5',
        east: '%YESLER_MID_W',
      },
      objects: [
        { prototype: 'sign', name: 'café menu', description: 'A chalkboard lists offerings in an elegant hand: "CAFÉ AU LAIT - 5¢", "CHOCOLATE TORTE - 10¢", "ABSINTHE DRIP - 25¢". The prices of a lost world.', boltedDown: true },
      ],
    },

    '%YESLER_MID_W': {
      name: 'Yesler Way Underground',
      description: `The passage continues east beneath Yesler Way, the construction showing the layered history of Seattle's development. Victorian storefronts still line the walls—their display windows dark, their doors sealed, the businesses they once housed forgotten. The ghostly retail arcade runs for blocks beneath the modern street.`,
      x: -7,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_ARCADE_6',
        east: '%YESLER_BANK_VAULT',
        south: '%OCCIDENTAL_YESLER',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // YESLER WAY CENTRAL (x=-6 to x=-1, connecting Mid-West to Main)
    // ═══════════════════════════════════════════════════════════════════════

    '%YESLER_BANK_VAULT': {
      name: 'The Forgotten Vault',
      description: `The massive door of a bank vault stands open, its combination lost, its contents long since removed—or so it appears. The vault itself is built into the bedrock, a fortress of steel and concrete that was the most secure location in 1890s Seattle. The door, two feet thick, bears the maker's mark: "MOSLER SAFE CO. - IMPREGNABLE".

Inside, the vault is empty except for rows of safety deposit boxes, their doors hanging open, their contents gone. But one box in the back corner remains locked—sealed when the bank closed, never opened since, its owner's identity and its contents a mystery that has outlasted generations.`,
      x: -6,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 0,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%YESLER_MID_W',
        east: '%YESLER_TELEGRAPH',
      },
      objects: [
        { prototype: 'safe', name: 'sealed deposit box', description: 'Safety deposit box #1889 remains locked. No key has opened it since the Panic of 1893. What secrets could survive so long?', boltedDown: true },
      ],
    },

    '%YESLER_TELEGRAPH': {
      name: 'Telegraph Office',
      description: `The Western Union office preserved here was the nerve center of Seattle's communications in the 1880s—every business deal, every romantic declaration, every death notice passed through these instruments. The telegraph keys remain at their stations, silent now, their operators' chairs pushed back as if their occupants just stepped out for coffee.

Spools of ticker tape fill the corners, their messages unread, the market fluctuations and sports scores of 1890 forever relevant to no one. A stack of unsent telegrams sits on one desk, their urgent pleas—"STOP SHIPMENT", "FATHER ILL COME HOME", "DEAL CONCLUDED VICTORIOUSLY"—never delivered.`,
      x: -5,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 15,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%YESLER_BANK_VAULT',
        east: '%YESLER_NEWSPAPER',
      },
    },

    '%YESLER_NEWSPAPER': {
      name: 'The Gazette Office',
      description: `The Seattle Gazette's underground office was their production facility—the actual newsroom was upstairs, in sunlight, but the printing happened here where the massive iron presses could shake the earth without disturbing the writers' concentration. The press itself is still here, a Hoe rotary that could produce ten thousand papers an hour, its type still set for the edition that never ran.

The headlines visible on the plates tell stories that were about to become history: "GREAT FIRE CLEANUP CONTINUES", "CITY COUNCIL APPROVES STREET-RAISING PLAN", "FORTUNES TO BE MADE IN NEW SEATTLE". The paper that would have told the story of the underground's creation was never printed—the underground swallowed its chronicler.`,
      x: -4,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_TELEGRAPH',
        east: '%YESLER_THEATER',
      },
      objects: [
        { prototype: 'furniture', name: 'Hoe rotary press', description: 'The iron beast of journalism squats in darkness, its roller drums frozen mid-revolution, ink dried to lacquer. The last headline: "A NEW SEATTLE RISES".', boltedDown: true },
      ],
    },

    '%YESLER_THEATER': {
      name: 'The Bijou Underground',
      description: `The Bijou Theater's basement level served as its backstage and storage—but someone converted it into a performance space after the street-raising, creating an intimate theater for audiences who didn't want their entertainment observed. The stage is small, the seating just twenty chairs arranged in a semicircle, the lighting oil lamps in sconces that still hold the residue of their last flames.

Playbills papering the walls advertise performances no newspaper ever reviewed: "FORBIDDEN SONGS OF OLD SHANGHAI", "THE MIDNIGHT DANCERS", "MONOLOGUES UNFIT FOR POLITE COMPANY". Whatever happened on this stage was meant to be forgotten—but the stage remembers.`,
      x: -3,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%YESLER_NEWSPAPER',
        east: '%YESLER_PHOTOGRAPHY',
      },
    },

    '%YESLER_PHOTOGRAPHY': {
      name: 'Daguerreotype Studio',
      description: `The photographer's studio is a time capsule of silver and light. Cameras on wooden tripods point at backdrops painted with pastoral scenes—forests, oceans, the Alps—places Seattle's residents could pretend to visit for the cost of a portrait. The chemical smell of developing fluid still lingers, mixed with the metallic tang of mercury vapor that slowly poisoned every daguerreotypist of the era.

A collection of unclaimed portraits lines one wall: faces frozen in formal poses, their identities lost, their descendants unaware these images exist. The last photograph taken here shows the street outside—the day before the raising began, the last day the sun reached this studio.`,
      x: -2,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_THEATER',
        east: '%YESLER_JEWELER',
      },
      objects: [
        { prototype: 'describable', name: 'portrait collection', description: 'Dozens of faces from the 1880s stare from tarnished frames: loggers, merchants, prostitutes, priests, all reduced to the same silver permanence. Some are labeled; most are not.', boltedDown: true },
      ],
    },

    '%YESLER_JEWELER': {
      name: 'Goldsmith\'s Workshop',
      description: `The goldsmith's workshop survived because its owner bricked up the entrance before the street was raised, protecting his tools and supplies from the construction chaos above. The bricks were breached decades later by someone who recognized the outline of a hidden door—and found a workshop frozen in time, its occupant's lunch still on the workbench, petrified but recognizable as bread and cheese.

Gold leaf in paper-thin books, jeweler's tools of surgical precision, a magnifying lens on an articulated arm—everything a craftsman needed to transform raw metal into beauty. The safe in the corner was empty when the wall came down. Someone removed the valuables. The tools were left behind, perhaps considered worthless by thieves who didn't understand their purpose.`,
      x: -1,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 2,
      lighting: 12,
      waterLevel: 2,
      outdoor: false,
      exits: {
        west: '%YESLER_PHOTOGRAPHY',
        east: '%YESLER_MAIN',
      },
    },

    '%YESLER_MAIN': {
      name: 'Yesler Way Underground',
      description: `The passage reaches the center of the Yesler Way underground, where the buried street was widest and most commercial. The space is larger here, the ceiling higher, the construction more elaborate—evidence of the prosperity that once characterized this intersection.

A shaft rises toward the surface, its upper end emerging through a grating that appears unremarkable from above but provides access to those who know its location.`,
      x: 0,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 22,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%YESLER_JEWELER',
        east: '%YESLER_HOTEL',
        south: '%SECOND_YESLER',
        up: {
          to: 'yesler-way/x0.ts',
          description: 'A shaft rises toward Yesler Way',
          hidden: true,
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // YESLER WAY EAST SECTION (x=1 to x=6, connecting Main to Mid-East)
    // ═══════════════════════════════════════════════════════════════════════

    '%YESLER_HOTEL': {
      name: 'Hotel Subterranean',
      description: `The basement of the Grand Pacific Hotel extends beneath Yesler Way, its laundry and storage rooms converted to guest quarters after the street-raising created an underground level. For decades, these rooms housed travelers who couldn't afford—or didn't want—rooms with windows: transients, fugitives, those who preferred anonymity to sunlight.

The rooms are tiny, barely coffin-sized, with iron bed frames bolted to the walls and chamber pots that were never properly disposed of. Names are scratched into the brick: dates, claims of innocence, declarations of love, confessions that may or may not be true. The hotel's guest registry, if it existed, was never found.`,
      x: 1,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_MAIN',
        east: '%YESLER_SALOON',
      },
    },

    '%YESLER_SALOON': {
      name: 'The Bucket of Blood',
      description: `Every frontier town had a saloon called the Bucket of Blood, and Seattle had three. This one earned its name. The bar itself is a massive slab of mahogany, scarred by knife fights and bullet holes, stained by spilled whiskey and spilled blood in roughly equal measure. The mirror behind the bar is shattered—by the last bullet fired here, or the first, or one of hundreds in between.

The gaming tables still stand, their green felt faded to gray, their edges worn smooth by desperate hands pushing desperate bets. A roulette wheel sits frozen at double zero—the house number, the one that broke the most hearts. Chips scattered on the floor might be worth fortunes in collector's markets. Down here, they're just colored clay.`,
      x: 2,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 15,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%YESLER_HOTEL',
        east: '%YESLER_BARBERSHOP',
      },
      objects: [
        { prototype: 'furniture', name: 'mahogany bar', description: 'The bar has more history carved into it than most libraries: names, dates, crude drawings, and what appear to be at least three separate confessions to murder.', boltedDown: true },
      ],
    },

    '%YESLER_BARBERSHOP': {
      name: 'Tonsorial Parlor',
      description: `The barbershop served both public and private functions—shaves and haircuts in the front, back-room surgery for those whose injuries couldn't be explained to legitimate doctors. The barber's chair, enameled white and adjustable by foot pump, could recline flat for procedures that required more access than a close shave.

Surgical instruments mix with grooming tools in the cabinets: straight razors alongside scalpels, styptic pencils next to suture thread. The distinction between barber and surgeon was blurry in the 1890s, and this establishment apparently embraced the ambiguity. A jar of leeches, long since desiccated, suggests the full range of period medicine was available.`,
      x: 3,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 12,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%YESLER_SALOON',
        east: '%YESLER_GUNSHOP',
      },
    },

    '%YESLER_GUNSHOP': {
      name: 'Armorer\'s Den',
      description: `The gunsmith's shop was already underground when the street was raised—below street level for sound dampening during test-firing, and for discretion when customers wanted modifications that weren't strictly legal. The workbench still holds the tools of the trade: files, springs, firing pins, and detailed drawings of mechanisms that would make modern gunsmiths weep with admiration.

Empty wooden cases line the walls, their velvet interiors shaped to hold weapons that were sold or seized long ago. But the modifications log survives, recording transactions in careful code: "hair trigger for Mr. H", "silencing apparatus for Lady B", "customization to appear as walking stick for the Senator". Not all weapons were created equal.`,
      x: 4,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 2,
      outdoor: false,
      exits: {
        west: '%YESLER_BARBERSHOP',
        east: '%YESLER_UNDERTAKER',
      },
    },

    '%YESLER_UNDERTAKER': {
      name: 'Mortician\'s Basement',
      description: `The undertaker's preparation room was always underground—discretion in death being important to Victorian sensibilities. The embalming table, a slab of black granite, still bears the channels that directed fluids, its surface polished by use and time. The equipment is remarkably intact: pumps and tubes and the chemical apparatus of the mortician's art.

A cabinet of glass eyes stares from one wall—every color, every size, waiting for clients who never arrived. The prosthetic limbs on their stands include hands posed for prayer and legs jointed for walking, the undertaker apparently catering to those who wanted their corpses presentable for open caskets. A ledger records the last clients: fire victims, mostly, from the Great Fire. Many were never identified.`,
      x: 5,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 0,
      lighting: 8,
      waterLevel: 2,
      outdoor: false,
      exits: {
        west: '%YESLER_GUNSHOP',
        east: '%YESLER_LAWYER',
      },
      objects: [
        { prototype: 'cabinet', name: 'glass eye collection', description: 'Hundreds of glass eyes in every shade stare from their velvet case. Blue, brown, hazel, and stranger colors—violet, gold, pure black. Some were never meant for human faces.', boltedDown: true },
      ],
    },

    '%YESLER_LAWYER': {
      name: 'Counselor\'s Archive',
      description: `The law office basement held the records—deeds and wills, contracts and criminal files, the paper trail of Seattle's first generation. The shelves still stand, their folders still organized by year and alphabet, though moisture has fused many documents into solid blocks of illegible pulp.

Some files remain readable, their contents revealing scandals that would have shaken the city: bribery of officials, irregular land transfers, partnerships sealed with handshakes that were later denied in court. The lawyers who worked here kept everything. Some of what they kept could still destroy reputations, if anyone remembered whose reputations these were.`,
      x: 6,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_UNDERTAKER',
        east: '%YESLER_MID_E',
      },
    },

    '%YESLER_MID_E': {
      name: 'Yesler Way Underground',
      description: `The passage continues east through the buried commercial district, the storefronts giving way to more utilitarian construction as the route approaches the eastern hill. The transition marks the boundary between the commercial core and the residential areas that once climbed the slope.`,
      x: 7,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_LAWYER',
        east: '%YESLER_WAREHOUSE_1',
        south: '%THIRD_YESLER',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // YESLER WAY EASTERN (x=8 to x=13, connecting Mid-East to East)
    // ═══════════════════════════════════════════════════════════════════════

    '%YESLER_WAREHOUSE_1': {
      name: 'Lumber Warehouse',
      description: `The warehouse stored lumber waiting for shipment—Douglas fir and Western red cedar, the foundation of Seattle's first fortune. Some of that lumber remains, too waterlogged to burn and too rotted to build with, but still recognizable as the giants that once covered the hills. The smell of cedar persists, a ghost of the forest that was sacrificed to build the city.

Sawdust covers the floor in drifts that have partially petrified, their patterns showing where workers walked, where carts rolled, where the foreman stood to supervise the loading. The warehouse was full when the street was raised. The lumber was never removed—too much trouble for wood already rotting. Now it composts slowly, returning to the earth that grew it.`,
      x: 8,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%YESLER_MID_E',
        east: '%YESLER_WAREHOUSE_2',
      },
    },

    '%YESLER_WAREHOUSE_2': {
      name: 'Salmon Cannery',
      description: `Before refrigeration, salmon was preserved in tin cans that were manufactured on-site, filled, sealed, and shipped to markets around the world. This cannery operated until the street-raising made the logistics impossible, then simply... stopped. The canning equipment remains: the presses, the sealing machines, the conveyor systems that moved fish from delivery to shipment.

Cans of salmon still sit in their racks, their labels faded but legible: "PUGET SOUND FINEST - PACKED 1889". The cans are swollen with a century of internal chemistry, their contents transformed into something that should never be opened. The fish that weren't canned simply rotted, their bones still visible in the loading area, mixed with the bones of rats that came to feast.`,
      x: 9,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 12,
      outdoor: false,
      exits: {
        west: '%YESLER_WAREHOUSE_1',
        east: '%YESLER_ICE_HOUSE',
      },
    },

    '%YESLER_ICE_HOUSE': {
      name: 'The Ice House',
      description: `Before mechanical refrigeration, ice was wealth. This ice house held tons of the stuff, cut from mountain lakes in winter and insulated with sawdust to survive Seattle's mild summers. The insulation remains—sawdust packed so deep it reaches the ceiling in places—but the ice is long since water, long since evaporated or seeped into the earth.

The ice hooks and saws hang on their racks, tools for a trade that no longer exists. The loading chute, down which blocks of ice would slide into delivery wagons, is now an entrance used by those who know about it. The ice house was the coldest place in old Seattle. Now it's just cool, the thick walls holding temperature steady, the sawdust slowly composting into heat.`,
      x: 10,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%YESLER_WAREHOUSE_2',
        east: '%YESLER_BLACKSMITH',
      },
    },

    '%YESLER_BLACKSMITH': {
      name: 'Forge and Foundry',
      description: `The blacksmith's underground forge was practical—the smoke and heat that made street-level smithies unbearable could vent upward while the work happened in relative comfort below. The forge itself is cold now, its bricks cracked by thermal shock, its bellows collapsed into leather fragments, but its anvil still stands where the smith left it, too heavy to steal.

Horseshoes hang on the walls in graduated sizes, ready for the teams that pulled wagons through old Seattle's muddy streets. Some of those horses are buried in the Great Fire, their remains never recovered, their shoes never worn. The tools are all here too: hammers and tongs, punches and swages, everything needed to shape hot iron into usefulness.`,
      x: 11,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_ICE_HOUSE',
        east: '%YESLER_STABLE',
      },
      objects: [
        { prototype: 'furniture', name: 'blacksmith anvil', description: 'The anvil weighs at least three hundred pounds, its face worn into a smooth saddle by countless hammer blows. Initials are stamped into the base: "J.M. 1881".', boltedDown: true },
      ],
    },

    '%YESLER_STABLE': {
      name: 'Underground Stable',
      description: `Horses couldn't climb stairs, but they could be led down ramps—and this stable served animals that needed to disappear. Stolen horses, racing horses being hidden from competitors, the working stock of operations that preferred not to advertise their logistics. The stalls still smell of hay and manure, the scents embedded in wood that absorbed a decade of occupation.

The ramp that led to the surface is sealed now, filled with rubble during the street-raising, but the stable remains accessible through the underground. Hay still fills the loft overhead, fire-hazard dry, waiting for a spark that has somehow never come. Horse blankets, water buckets, feed bags—everything a horse might need except the horses themselves.`,
      x: 12,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%YESLER_BLACKSMITH',
        east: '%YESLER_CARRIAGE',
      },
    },

    '%YESLER_CARRIAGE': {
      name: 'Carriage House',
      description: `The carriage house holds vehicles that never left: a hearse with black plumes still attached to its corners, a delivery wagon with "PUGET SOUND BREWERY" painted on its sides, a private carriage whose velvet interior has rotted into a skeleton of springs and frame. The carriages were too large to remove when the street was raised, so they stayed, gathering dust, their iron fittings rusting into the shapes of their last positions.

The hearse is the most intact, its glass windows still clear, its black lacquer still glossy in places. Someone maintained it for years after the street-raising—why a hearse, for what purpose, the underground doesn't say. The passenger compartment is empty now, its cargo delivered or escaped.`,
      x: 13,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 8,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%YESLER_STABLE',
        east: '%YESLER_EAST',
      },
      objects: [
        { prototype: 'furniture', name: 'Victorian hearse', description: 'The glass-sided hearse stands ready for passengers who will never arrive. Its black horses are gone, but someone replaced the plumes with fresh black feathers. Recently.', boltedDown: true },
      ],
    },

    '%YESLER_EAST': {
      name: 'Yesler Way Underground East',
      description: `The passage reaches its eastern extent, where the buried street meets the hill's slope. The construction ends here—the hill rising too steeply for the street-raising technique that created the underground elsewhere. Beyond this point, the network continues only through excavated passages that were carved later.`,
      x: 14,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 8,
      outdoor: false,
      exits: {
        west: '%YESLER_CARRIAGE',
        south: '%FOURTH_YESLER',
        down: '%DEEP_EAST_ACCESS',
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // NORTH-SOUTH CONNECTORS (linking Yesler to the main network)
    // ═══════════════════════════════════════════════════════════════════════

    '%YESLER_JUNCTION_W': {
      name: 'Western Yesler Junction',
      description: `The passage reaches a junction where the Yesler Way underground meets the routes running north from the main network. The junction shows the marks of multiple construction eras—the original street-raising joined by later excavation, the passages meeting in a space that was never planned but has become essential.`,
      x: -14,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 15,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%YESLER_WEST',
        south: '%FIRST_AVE_N',
        east: '%PROHIBITION_HALL',
      },
    },

    '%FIRST_AVE_N': {
      name: 'First Avenue North',
      description: `The passage runs south toward the main underground network, following the route beneath First Avenue. The construction is consistent with the established network—the same Victorian brick, the same iron fixtures, the same architecture of buried commerce.`,
      x: -14,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%YESLER_JUNCTION_W',
        south: '%FIRST_AVE_CORRIDOR',
      },
    },

    '%FIRST_AVE_CORRIDOR': {
      name: 'First Avenue Corridor',
      description: `The corridor passes through what was once a prosperous merchant's basement—the remnants of display cases still line the walls, their glass long since shattered and swept away. A faded sign painted directly on the brick reads "FINE TOBACCO & SUNDRIES" in elegant Victorian lettering, though the merchandise vanished generations ago.

The ceiling here is reinforced with steel I-beams added sometime in the last century, modern engineering shoring up Victorian ambition. Water stains trace dark lines down the walls from some leak overhead that has been dripping for decades. A worn path through the dust shows where travelers habitually pass, avoiding the debris that has accumulated in the corners.`,
      x: -14,
      y: 7,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%FIRST_AVE_N',
        south: '%FIRST_AVE_MID',
      },
    },

    '%FIRST_AVE_MID': {
      name: 'First Avenue Passage',
      description: `The passage continues toward the junction with the main network, the route showing increased traffic wear as it approaches the established corridors. The walls bear the chalk marks of the underground's residents, the territorial symbols of groups that claim these passages.`,
      x: -14,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 20,
      waterLevel: 3,
      outdoor: false,
      exits: {
        north: '%FIRST_AVE_CORRIDOR',
        south: {
          to: 'underground/upper-tunnels/the-junction.ts',
          description: 'A passage leads south toward The Junction',
        },
        east: '%GAMBLING_DEN',
      },
    },

    '%OCCIDENTAL_YESLER': {
      name: 'Occidental-Yesler Junction',
      description: `The passage reaches the junction where the Yesler Way underground meets the Occidental corridor, the intersection of two major routes through the hidden city. The space is larger here, cleared and maintained by traffic that flows in multiple directions.

The walls show the accumulated markings of decades—territorial claims overlapping, directions scratched and re-scratched, the visual record of a community that communicates in code.`,
      x: -7,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 20,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%YESLER_MID_W',
        south: '%OCC_NORTH_EXT',
        east: '%BASEMENT_ROW',
        west: '%PROHIBITION_HALL',
      },
      objects: [
        { prototype: 'sign', name: 'layered graffiti', description: 'Decades of graffiti cover one wall: "HOBOS WELCOME 1932", "ARMY OF THE UNEMPLOYED", "WE WERE HERE BEFORE THE WAR", and newer: "still here - 2019".', boltedDown: true },
        { prototype: 'sign', name: 'a direction marker', description: 'Chalk arrows point in multiple directions with cryptic labels: "WATER ←", "HEAT ↑", "TROUBLE →", "OUT ↓".', boltedDown: true },
      ],
    },

    '%OCC_NORTH_EXT': {
      name: 'Occidental North Extension',
      description: `The passage extends south from the Yesler junction, connecting the northern underground to the established Occidental corridor. The construction is consistent—the same Victorian brick, the same architectural patterns—evidence that this route was part of the original street-raising.`,
      x: -7,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%OCCIDENTAL_YESLER',
        south: '%OCC_NORTH_MID',
        west: '%SPEAKEASY_HALL',
      },
    },

    '%OCC_NORTH_MID': {
      name: 'Occidental Passage',
      description: `The passage continues through the northern Occidental underground, the route approaching the connection with the main network. The construction shows the transition from the Yesler area to the central underground—newer modifications overlaying older work.`,
      x: -7,
      y: 7,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 18,
      waterLevel: 3,
      outdoor: false,
      exits: {
        north: '%OCC_NORTH_EXT',
        south: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%OCC_JUNCTION',
          description: 'A passage leads south toward the Northern Junction',
        },
      },
    },

    '%SECOND_YESLER': {
      name: 'Second Avenue-Yesler Junction',
      description: `The passage reaches the junction where the Yesler Way underground meets the routes beneath Second Avenue. The intersection is a natural gathering point, the space cleared and maintained despite the lack of official attention.

A concealed opening behind what appears to be collapsed rubble leads to a deeper passage—the northern access to the arterial tunnel that runs the length of Pioneer Square.`,
      x: 0,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 20,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%YESLER_MAIN',
        south: '%SECOND_NORTH',
        east: '%HOTEL_BASEMENT',
        west: '%BASEMENT_ROW',
        down: {
          to: 'buildings/arterial-tunnel/z-3.ts',
          room: '%ARTERY_N1',
          description: 'A concealed shaft descends into the arterial tunnel',
          hidden: true,
        },
      },
    },

    '%SECOND_NORTH': {
      name: 'Second Avenue North',
      description: `The passage runs south from the Yesler junction, connecting the northern underground to the established Second Avenue corridor. The route shows the marks of regular traffic—the floor worn smooth, the walls polished at shoulder height.`,
      x: 0,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%SECOND_YESLER',
        south: '%SECOND_NORTH_MID',
        east: '%BOARDING_BASEMENT',
      },
    },

    '%SECOND_NORTH_MID': {
      name: 'Second Avenue Passage',
      description: `The passage continues toward the main network, the construction showing the consistency of the street-raising era. The buried storefronts still line the walls, their windows dark, their purpose forgotten but their structure intact.`,
      x: 0,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 20,
      waterLevel: 3,
      outdoor: false,
      exits: {
        north: '%SECOND_NORTH',
        south: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%2ND_JUNCTION',
          description: 'A passage leads south toward the Warehouse Junction',
        },
      },
    },

    '%THIRD_YESLER': {
      name: 'Third Avenue-Yesler Junction',
      description: `The passage reaches the junction where the Yesler Way underground meets the routes beneath Third Avenue. The construction here is different—twentieth century rather than nineteenth, the infrastructure added during later development rather than inherited from the street-raising.`,
      x: 7,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 18,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%YESLER_MID_E',
        south: '%THIRD_NORTH',
        west: '%HOTEL_BASEMENT',
      },
    },

    '%THIRD_NORTH': {
      name: 'Third Avenue North',
      description: `The passage runs south from the Yesler junction, connecting the northern underground to the eastern network. The route is less established than the western corridors—newer construction, less traffic, fewer territorial markers.`,
      x: 7,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%THIRD_YESLER',
        south: '%THIRD_NORTH_MID',
      },
    },

    '%THIRD_NORTH_MID': {
      name: 'Third Avenue Passage',
      description: `The passage continues toward the eastern network, the route descending slightly as it approaches the connection with the established tunnels. The construction shows the marks of different hands—excavation overlaying foundation, the route assembled from available spaces.`,
      x: 7,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%THIRD_NORTH',
        south: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%3RD_BASEMENT',
          description: 'A passage leads south toward Third Avenue',
        },
      },
    },

    '%FOURTH_YESLER': {
      name: 'Fourth Avenue-Yesler Junction',
      description: `The passage reaches the eastern extent of the accessible Yesler Way underground, where the buried street meets the utility infrastructure beneath Fourth Avenue. The junction connects the historic underground to the modern utility network, different eras of construction meeting in the darkness.`,
      x: 14,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 18,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%YESLER_EAST',
        south: '%FOURTH_NORTH',
        west: '%EASTERN_BASEMENTS',
      },
    },

    '%FOURTH_NORTH': {
      name: 'Fourth Avenue North',
      description: `The passage runs south from the Yesler junction, following the utility infrastructure beneath Fourth Avenue. The construction is modern—concrete and steel rather than brick and timber—the systems installed during urban development that never knew about the historic network nearby.`,
      x: 14,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 22,
      lighting: 22,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%FOURTH_YESLER',
        south: {
          to: 'buildings/eastside-underground/z-2.ts',
          room: '%JUNCTION_BOX',
          description: 'A passage leads south toward the junction box chamber',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // HISTORIC BASEMENTS (Prohibition-era speakeasies and hidden spaces)
    // ═══════════════════════════════════════════════════════════════════════

    '%PROHIBITION_HALL': {
      name: 'Prohibition Hall',
      description: `The passage opens into a space that was once a speakeasy—the architecture of illegal alcohol still visible in the layout of the room. A long bar dominates one wall, its surface worn smooth by a century of elbows and glasses. Behind the bar, shelving that once held bottles now holds nothing but dust and shadow.

The speakeasy operated during Prohibition, serving customers who descended from Yesler Way through hidden stairs that have since been sealed. The business died when alcohol became legal again, but the space remained, repurposed by generations of underground residents who found value in a room designed for concealment.`,
      x: -10,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%YESLER_JUNCTION_W',
        east: '%OCCIDENTAL_YESLER',
        south: '%SPEAKEASY_BACK',
        northeast: {
          to: 'buildings/smith-tower/z-2.ts',
          room: '%DC_TUNNEL',
          description: 'A narrow tunnel leads toward the Smith Tower basement',
        },
      },
      objects: [
        { prototype: 'furniture', name: 'the old bar', description: 'A long mahogany bar stretches along the wall, its brass rail tarnished green. A century of elbows have worn grooves in the wood. Behind it, empty shelves wait for bottles that will never return.', boltedDown: true },
        { prototype: 'sign', name: 'a painted menu board', description: 'A slate board on the wall still shows prices in chalk: "BEER 5¢ - WHISKEY 10¢ - CHAMPAGNE 50¢". Below, someone added "DON\'T ASK QUESTIONS".', boltedDown: true },
        { prototype: 'bench', name: 'a booth bench', description: 'A curved wooden bench from a booth, its leather upholstery cracked and split. The high back offered privacy for conversations that couldn\'t be overheard.', boltedDown: true },
      ],
    },

    '%SPEAKEASY_BACK': {
      name: 'Speakeasy Back Room',
      description: `The passage leads into the speakeasy's back room—a smaller space designed for private parties and discreet transactions. The room is intimate, the ceiling lower, the atmosphere suggesting secrets shared among trusted friends.

A hidden door in the back wall opens onto a passage that was used to evacuate customers during raids. The raids ended a century ago. The passage remains.`,
      x: -10,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PROHIBITION_HALL',
        east: '%SPEAKEASY_HALL',
        down: '%BOOTLEG_CELLAR',
      },
      objects: [
        { prototype: 'desk', name: 'a poker table', description: 'A round felt-topped table, the green baize stained with old spills and cigarette burns. Chips and cards are long gone, but the indentations where elbows rested remain.', boltedDown: true },
        { prototype: 'sign', name: 'a framed photo', description: 'A sepia photograph in a tarnished frame shows men in suits raising glasses. Someone has scratched out all the faces.', boltedDown: true },
      ],
    },

    '%SPEAKEASY_HALL': {
      name: 'Speakeasy Corridor',
      description: `The passage runs through what was once the speakeasy's service corridor—the route used by staff to move supplies and by customers to reach private rooms. The corridor connects multiple spaces that were once part of a single entertainment complex, now fragmented and repurposed.`,
      x: -10,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%SPEAKEASY_BACK',
        west: '%GAMBLING_DEN',
      },
    },

    '%GAMBLING_DEN': {
      name: 'Old Gambling Den',
      description: `The passage opens into a room that was once a gambling den—the layout suggesting card tables and roulette wheels, the walls showing the marks where paintings once hung to give the space an air of sophistication. The gambling equipment is long gone, but the room retains the geometry of risk and reward.

The den operated alongside the speakeasy, offering customers a chance to lose their money after they'd spent it on illegal drinks. The synergy of vices made this corner of the underground particularly profitable—and particularly targeted by periodic crackdowns.`,
      x: -12,
      y: 6,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%FIRST_AVE_MID',
        east: '%SPEAKEASY_HALL',
        down: '%GAMBLING_VAULT',
      },
      objects: [
        { prototype: 'furniture', name: 'a roulette wheel base', description: 'The base of a roulette wheel remains bolted to the floor, though the wheel itself is long gone. Faded numbers are painted on the surrounding floor.', boltedDown: true },
        { prototype: 'desk', name: 'a card dealer\'s table', description: 'A curved blackjack table, its padded rail worn smooth by thousands of nervous hands. The green felt shows outlines where cards were dealt.', boltedDown: true },
        { prototype: 'sign', name: 'a painted wall slogan', description: 'Faded paint on the wall reads: "LADY LUCK LOVES THE BOLD". Below it, someone scratched: "Lady Luck is a liar."', boltedDown: true },
        { prototype: 'safe', name: 'an empty wall safe', description: 'A safe door hangs open in the wall, its interior empty. The lock mechanism has been removed—someone took their time getting in.', boltedDown: true },
      ],
    },

    '%BASEMENT_ROW': {
      name: 'Basement Row',
      description: `The passage runs through a series of connected basements that once served the businesses along Yesler Way. The basements were designed for storage, their dimensions practical rather than elegant, their construction sturdy rather than stylish. Now they serve as infrastructure for the underground network, connecting routes rather than storing goods.`,
      x: -3,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%OCCIDENTAL_YESLER',
        east: '%SECOND_YESLER',
        south: '%BASEMENT_SOUTH',
      },
    },

    '%BASEMENT_SOUTH': {
      name: 'Basement Passage',
      description: `The passage continues through the basement network, the construction showing the transition from commercial storage to abandoned infrastructure. The basements here are empty, their contents long since removed or decayed, the spaces serving only as routes between more significant locations.`,
      x: -3,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%BASEMENT_ROW',
        east: '%BOARDING_BASEMENT',
      },
    },

    '%HOTEL_BASEMENT': {
      name: 'Old Hotel Basement',
      description: `The passage opens into the basement of what was once a hotel—the dimensions larger, the construction more elaborate, the space designed to serve an establishment rather than a single business. The hotel is long gone, demolished or renovated beyond recognition, but its basement remains as infrastructure for the network.

Storage rooms branch off the main space, their doors hanging open on rusted hinges. The rooms once held linens and supplies. Now they hold whatever the underground's residents choose to store in them.`,
      x: 4,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%SECOND_YESLER',
        east: '%THIRD_YESLER',
        south: '%LAUNDRY_ROOM',
      },
      objects: [
        { prototype: 'cabinet', name: 'a linen closet', description: 'A built-in closet with shelves still lined with yellowed paper. A few moth-eaten towels remain, their hotel monogram barely visible: "P.S.H."', boltedDown: true },
        { prototype: 'sign', name: 'a room service menu', description: 'A framed menu offers "OYSTERS 25¢ - STEAK 40¢ - ROOM SERVICE AVAILABLE 24 HOURS". The Pioneer Square Hotel has been gone for decades.', boltedDown: true },
      ],
    },

    '%LAUNDRY_ROOM': {
      name: 'Old Laundry Room',
      description: `The passage opens into what was once the hotel's laundry room—the space still showing the marks of the equipment that once filled it. Iron brackets in the walls once supported mangles and presses; floor drains once carried away the water from washing and rinsing. The equipment is gone. The architecture of labor remains.`,
      x: 4,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 15,
      lighting: 12,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%HOTEL_BASEMENT',
        west: '%BOARDING_BASEMENT',
      },
      objects: [
        { prototype: 'furniture', name: 'a mangle frame', description: 'The iron frame of an industrial mangle is bolted to the floor, its rollers and gears long removed. The wall behind it is stained dark from decades of steam.', boltedDown: true },
        { prototype: 'bench', name: 'a folding table base', description: 'A heavy wooden table base where laundry was sorted and folded. The iron legs are rusted but solid.', boltedDown: true },
      ],
    },

    '%BOARDING_BASEMENT': {
      name: 'Boarding House Basement',
      description: `The passage opens into the basement of what was once a boarding house—a space designed for storage and utilities rather than habitation. The basement is smaller than the hotel's, the construction simpler, the purpose more modest. But the space serves the network, connecting routes and providing shelter.`,
      x: 2,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        north: '%SECOND_NORTH',
        east: '%LAUNDRY_ROOM',
        west: '%BASEMENT_SOUTH',
      },
    },

    '%EASTERN_BASEMENTS': {
      name: 'Eastern Basements',
      description: `The passage runs through basements that served buildings along the eastern slope—the construction showing the challenges of building on the hill. The floors are not quite level, the walls not quite vertical, the geometry of construction adapting to the slope rather than fighting it.`,
      x: 10,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 12,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: '%FOURTH_YESLER',
        south: '%SLOPE_PASSAGE',
      },
    },

    '%SLOPE_PASSAGE': {
      name: 'Slope Passage',
      description: `The passage descends through the eastern slope, following the terrain beneath buildings that climbed the hill. The construction is rough—excavated rather than inherited—the route carved by those who needed access to the network from the eastern neighborhoods.`,
      x: 10,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 10,
      waterLevel: 8,
      outdoor: false,
      exits: {
        north: '%EASTERN_BASEMENTS',
        south: {
          to: 'buildings/eastside-underground/z-2.ts',
          room: '%YESLER_EAST',
          description: 'A passage leads south toward the eastern Yesler access',
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DEEP SECTIONS (z=-3 connections)
    // ═══════════════════════════════════════════════════════════════════════

    '%BOOTLEG_CELLAR': {
      name: 'Bootleg Cellar',
      description: `The shaft descends into a cellar that was built to store bootleg liquor during Prohibition—a hidden space beneath the hidden speakeasy, twice removed from the legal world above. The cellar is cool and dry, the construction showing the care that valuable inventory demanded.

The liquor is long gone, but the cellar remains as a connection to the deeper network—a route that links the Prohibition-era underground to passages that existed before and after the great experiment in temperance.`,
      x: -10,
      y: 8,
      z: -3,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        up: '%SPEAKEASY_BACK',
        south: '%DEEP_YESLER_W',
      },
      objects: [
        { prototype: 'crate', name: 'an empty bottle rack', description: 'A wooden rack designed to hold whiskey bottles lies empty against the wall. The wood is stained dark from decades of spilled liquor.', boltedDown: true },
        { prototype: 'sign', name: 'a painted warning', description: 'Red paint on the wall reads: "IF BELL RINGS, HIDE EVERYTHING". The bell mechanism is gone, but the warning remains.', boltedDown: true },
        { prototype: 'trunk', name: 'a bootlegger\'s trunk', description: 'A large steamer trunk with false bottom compartments, designed to smuggle bottles past inspectors. The secret latches still work.', boltedDown: true },
      ],
    },

    '%GAMBLING_VAULT': {
      name: 'Gambling Vault',
      description: `The shaft descends into what was once the gambling den's vault—a reinforced space built to store the operation's cash and valuables. The vault door stands open, its mechanism long since defeated by time or force. Whatever the vault once protected has been removed. The space remains.`,
      x: -14,
      y: 6,
      z: -3,
      population: 0,
      ambientNoise: 3,
      lighting: 5,
      waterLevel: 8,
      outdoor: false,
      exits: {
        up: '%GAMBLING_DEN',
        east: '%DEEP_YESLER_W',
      },
      objects: [
        { prototype: 'safe', name: 'a cracked vault', description: 'A massive Mosler safe stands in the corner, its door blown off by an ancient explosion. Scorch marks blacken the walls around it.', boltedDown: true },
        { prototype: 'sign', name: 'a ledger page', description: 'A yellowed page nailed to the wall shows columns of numbers and initials—bets placed, debts owed. The last entry is dated October 1929.', boltedDown: true },
      ],
    },

    '%DEEP_YESLER_W': {
      name: 'Deep Yesler Passage',
      description: `The passage runs through the deep level beneath the Yesler Way underground, connecting the Prohibition-era spaces to the established deep network. The construction is rough—excavated rather than inherited—the route carved by hands that valued access over aesthetics.`,
      x: -10,
      y: 6,
      z: -3,
      population: 0,
      ambientNoise: 10,
      lighting: 8,
      waterLevel: 12,
      outdoor: false,
      exits: {
        north: '%BOOTLEG_CELLAR',
        west: '%GAMBLING_VAULT',
        east: '%DEEP_YESLER_MID',
        south: {
          to: 'underground/transitional/junction-shaft.ts',
          description: 'A passage leads south toward the Junction Shaft',
        },
      },
    },

    '%DEEP_YESLER_MID': {
      name: 'Deep Yesler Passage',
      description: `The passage continues through the deep Yesler network, the route showing less traffic than the surface corridors. The deep level serves as bypass and storage, used by those who value discretion over convenience.`,
      x: 0,
      y: 6,
      z: -3,
      population: 0,
      ambientNoise: 8,
      lighting: 8,
      waterLevel: 10,
      outdoor: false,
      exits: {
        west: '%DEEP_YESLER_W',
        east: '%DEEP_YESLER_E',
        south: {
          to: 'buildings/underground-east/z-3.ts',
          room: '%CABLE_VAULT',
          description: 'A passage leads south toward the Cable Vault',
        },
      },
    },

    '%DEEP_YESLER_E': {
      name: 'Deep Yesler Passage',
      description: `The passage reaches the eastern extent of the deep Yesler network, connecting to the routes beneath the hill. The construction shows the challenges of excavating through the slope—the walls reinforced against soil pressure, the floor following the natural grade.`,
      x: 10,
      y: 6,
      z: -3,
      population: 0,
      ambientNoise: 10,
      lighting: 8,
      waterLevel: 15,
      outdoor: false,
      exits: {
        west: '%DEEP_YESLER_MID',
        south: '%DEEP_EAST_ACCESS',
      },
    },

    '%DEEP_EAST_ACCESS': {
      name: 'Deep Eastern Access',
      description: `The passage connects the deep Yesler network to the eastern underground, a route that links the historic tunnels to the modern utility infrastructure. The transition is marked by changing construction—Victorian excavation giving way to twentieth century engineering.`,
      x: 14,
      y: 8,
      z: -3,
      population: 0,
      ambientNoise: 15,
      lighting: 10,
      waterLevel: 10,
      outdoor: false,
      exits: {
        up: '%YESLER_EAST',
        north: '%DEEP_YESLER_E',
        south: {
          to: 'buildings/eastside-underground/z-3.ts',
          room: '%DEEP_EAST_N',
          description: 'A passage leads south toward the deep eastern network',
        },
      },
    },

    '%BOOTLEGGER_STASH': {
      name: 'Bootlegger\'s Stash',
      description: `A hidden alcove off the main passage, its entrance concealed by a rotating brick section that would have been invisible to casual observers. The chamber beyond is small but well-constructed, the walls lined with shelves that once held illegal liquor during Prohibition.

The shelves are empty now, the contraband long since consumed or confiscated, but the hiding spot remains functional. The walls are thick, the entrance well-disguised, the acoustics arranged to muffle sound from within. Someone has been using it for storage again—fresh scratches on the floor suggest recent activity.`,
      x: -7,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          to: 'buildings/homeless-warrens/z-3.ts',
          room: '%SUPPLY_TUNNEL',
          description: 'A concealed passage leads west toward the warrens',
        },
        east: '%YESLER_MID_W',
      },
    },
  },
};
