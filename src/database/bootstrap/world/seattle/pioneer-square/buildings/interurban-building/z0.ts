// Interurban Building - Ground Floor (z=0)
// Historic office building, built 1891
// Named for the interurban railway that once connected Seattle to Tacoma

export const building = {
  name: 'Interurban Building',
  x: -12,
  y: 6,
  width: 2,
  height: 2,
  floors: 4,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Building Lock',
      description:
        'A modern deadbolt installed in an antique brass plate, the contrast of eras visible in the metal.',
      difficulty: 4
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Main Entrance',
      description:
        'A set of double doors with brass frames and frosted glass panels, INTERURBAN BUILDING etched above in gold leaf. One door stands ajar, wedged open by debris.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'glass',
      durability: 45
    },
    '%STAIR_DOOR': {
      prototype: 'door',
      name: 'Stairwell Door',
      description:
        'A fire door with a wire-glass window, the kind required by safety codes in every commercial building. The door is heavy steel, painted grey.',
      locked: false,
      open: true,
      locks: [],
      material: 'metal',
      durability: 75
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - LOBBY AND RETAIL
    // ═══════════════════════════════════════════════════════════════════

    '%LOBBY': {
      name: 'Interurban Building - Lobby',
      description: `The lobby of the Interurban Building retains the grandeur of 1890s commercial architecture—marble floors, brass fixtures, carved wooden trim that speaks to an era when buildings were meant to impress. The building takes its name from the interurban railway that once connected Seattle to Tacoma, a transit system that seemed like the future in 1891.

A directory board dominates one wall, black felt with white plastic letters listing tenants who no longer occupy. JOHNSON & ASSOCIATES, SUITE 301. PACIFIC RIM IMPORTS, SUITE 105. The letters are yellowed, the businesses vanished, but the board remains, a registry of absence.

The elevator doors are brass, their surfaces tarnished to brown, their cage visible through the decorative grillwork. The elevator is old—the genuine antique kind, with mechanical controls and a car that shakes when it moves. Whether it still moves is a question the elevator itself might not be able to answer.`,
      x: -12,
      y: 6,
      z: 0,
      imageOnDisk: 's-washington-st-x-12-y6-z0.png',
      population: 0,
      ambientNoise: 3,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: '2nd-ave-s/y5.ts',
          description: 'The brass doors lead to 2nd Ave S',
          door: '%FRONT_DOOR'
        },
        north: '%RETAIL',
        west: '%MAIL_ROOM',
        up: {
          description: 'A stairwell door leads to the upper floors',
          door: '%STAIR_DOOR',
          to: '%HALL_1'
        }
      },
      sittables: [
        {
          name: 'a marble bench',
          capacity: 3,
          emptyMsg:
            'A marble bench sits against the wall, its surface cold and smooth, worn by generations of waiting.',
          occupiedMsg: '%s sitting on the marble bench'
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'directory board',
          aliases: ['directory', 'board'],
          description: `A large directory board, black felt with white plastic letters arranged in neat rows. The letters list businesses that occupied the building's suites—law firms, importers, consultants, the professional services that once filled Pioneer Square. Most slots are filled with names. All the names belong to businesses that closed. The board is a census of economic extinction.`
        },
        {
          prototype: 'describable',
          name: 'brass elevator doors',
          aliases: ['elevator', 'lift'],
          description: `Ornate brass elevator doors, their decorative grillwork allowing a glimpse of the cage car within. The elevator is a genuine antique—mechanical controls, a collapsing gate, the kind of lift that required an operator before automation made them obsolete. The car is visible at lobby level, its interior dark. The machinery hasn't moved in years.`
        },
        {
          prototype: 'describable',
          name: 'marble floors',
          aliases: ['floor', 'marble'],
          description: `The lobby floor is marble—real marble, imported from somewhere that produced marble, installed when such extravagance was merely expensive rather than impossible. The stone is worn in paths that reveal traffic patterns from a century of footsteps, darker where people walked, lighter where they didn't. The marble will outlast the building.`
        },
      ]
    },

    '%RETAIL': {
      name: 'Interurban Building - Ground Floor Retail',
      description: `The ground floor retail space once housed a succession of businesses—a tobacconist, a newsstand, a coffee shop, whatever the neighborhood needed and could support. The current configuration is coffee shop, frozen at the moment of closure: an espresso machine on the counter, pastry case with petrified muffins, chalkboard menu with prices in handwriting that tried to look casual.

The space is small but charming, exposed brick walls and pressed-tin ceiling, the aesthetic that Pioneer Square businesses adopted when they realized nostalgia was marketable. Tables and chairs are arranged for conversation, though the conversations ended long ago.

A door in the back leads to the mail room and building services—the infrastructure that kept the offices above functioning when functioning was something buildings did.`,
      x: -12,
      y: 7,
      z: 0,
      imageOnDisk: 'interurban-building-ground-floor-retail-x-12-y7-z0.png',
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%LOBBY',
        west: '%MAIL_ROOM'
      },
      sittables: [
        {
          name: 'a cafe table',
          capacity: 2,
          emptyMsg:
            'Small tables with mismatched chairs fill the space, arranged for intimate conversation.',
          occupiedMsg: '%s sitting at a cafe table'
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'espresso machine',
          aliases: ['espresso', 'coffee machine'],
          description: `A commercial espresso machine, chrome and brass, the kind that small cafes invest in and maintain with devotion. The portafilters are still locked into the group heads, packed with grounds that have fossilized into solid pucks. The steam wands are crusted with dried milk. The machine was the heart of this place. The heart stopped.`
        },
        {
          prototype: 'cabinet',
          name: 'pastry case',
          aliases: ['pastry', 'case', 'display'],
          description: `A glass display case containing pastries that have mummified into permanent shapes: muffins turned to stone, croissants fossilized mid-flake, a cheesecake that has achieved geological stability. The pastries are inedible but recognizable, preserved by dryness rather than intention.`
        },
        {
          prototype: 'describable',
          name: 'chalkboard menu',
          aliases: ['menu', 'chalkboard'],
          description: `A chalkboard menu behind the counter, the offerings listed in careful handwriting: AMERICANO $3. LATTE $4. CAPPUCCINO $4.50. The handwriting was practiced to look artisanal, the prices calculated to cover rent and wages and still turn a profit. The math no longer matters. The menu remains.`
        },
      ]
    },

    '%MAIL_ROOM': {
      name: 'Interurban Building - Mail Room',
      description: `The mail room serves—or served—the building's offices, a wall of brass mailboxes numbered to match the suites above. Most boxes are full, their contents never retrieved: envelopes and packages and the junk mail that accumulated while waiting for attention that never came.

A service counter separates the public area from the back office, where packages were received and sorted. The counter is worn, its surface scarred by decades of boxes and parcels sliding across the wood. A scale sits at one end, its needle frozen, its purpose historical.

A door leads to the basement and building utilities—the furnace room and electrical panels that keep the building technically functional.`,
      x: -13,
      y: 6,
      z: 0,
      imageOnDisk: 's-washington-st-x-13-y6-z0.png',
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LOBBY',
        north: '%RETAIL',
        down: {
          description: 'Stairs lead down to the basement utility area',
          to: '%BASEMENT'
        }
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'mailboxes',
          aliases: ['boxes', 'mail'],
          description: `A wall of brass mailboxes, each one numbered to match a suite upstairs. The boxes are mostly full—envelopes visible through the small windows, packages stuffed into openings too small for them. The mail accumulated after delivery stopped making sense. The mailboxes preserved it, waiting for tenants who will never come.`
        },
        {
          prototype: 'desk',
          name: 'service counter',
          aliases: ['counter'],
          description: `A wooden service counter separating the lobby side from the back office. The wood is worn smooth by decades of packages sliding across its surface, scarred where tape and labels were cut. A bell sits on the counter for summoning assistance. The bell still rings. No one answers.`
        },
        {
          prototype: 'describable',
          name: 'postal scale',
          aliases: ['scale'],
          description: `A postal scale, the mechanical kind with a needle and a dial, sits on the counter. The scale is accurate to a quarter ounce, precise enough for calculating postage on letters that no longer need sending. The needle points to zero. Nothing weighs anything anymore.`
        },
      ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT': {
      name: 'Interurban Building - Basement',
      description: `The basement contains the building's mechanical systems—furnace, water heater, electrical panels, the infrastructure that keeps the structure habitable. The ceiling is low, the lighting dim, the air thick with the smell of old machinery and older dust.

The furnace is a massive iron beast from the 1950s, a conversion from the original coal-burning system. The furnace is cold now, its pilot light extinguished, but the ductwork that spreads from it runs through the entire building, ready to distribute heat that will never be generated.

Electrical panels line one wall, their breakers labeled in the handwriting of electricians from different decades. Some circuits are tripped. Others remain on, feeding power to systems that still function for reasons no one fully understands.

In the eastern wall, behind the furnace, a section of brickwork has been removed—stones stacked neatly beside a passage leading into darkness. The underground network awaits beyond.`,
      x: -13,
      y: 6,
      z: -1,
      imageOnDisk: 'interurban-building-basement-x-13-y6-z-1.png',
      population: 0,
      ambientNoise: 8,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%MAIL_ROOM'
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'furnace',
          aliases: ['boiler', 'heater'],
          description: `A massive gas furnace from the 1950s, iron and steel construction meant to heat the entire building. The furnace converted from coal at some point—the original coal chute is still visible, bricked over. The pilot light is out. The furnace is cold. The building's heating died with the maintenance schedule.`
        },
        {
          prototype: 'describable',
          name: 'electrical panels',
          aliases: ['panels', 'breakers', 'electrical'],
          description: `A wall of electrical panels, their covers open to reveal rows of circuit breakers. Labels identify the circuits in handwriting from different decades: "3RD FLOOR LIGHTS" in 1960s script, "RETAIL OUTLETS" in 1990s marker. Some breakers are tripped. Others remain on, feeding power to systems that somehow still function.`
        },
        {
          prototype: 'describable',
          name: 'water heater',
          aliases: ['heater', 'tank'],
          description: `A commercial water heater, a cylindrical tank connected to pipes that run throughout the building. The tank is insulated, its surface warm to the touch—somehow, the water heater still functions, maintaining temperature for sinks and showers that no one uses. The persistence is mysterious but useful.`
        },
      ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // FIRST FLOOR (z=1) - OFFICES
    // ═══════════════════════════════════════════════════════════════════

    '%HALL_1': {
      name: 'Interurban Building - First Floor Hall',
      description: `The first floor hallway is classic Pioneer Square office construction: hardwood floors, high ceilings, transoms above each door to let light and air circulate. The doors are solid wood with frosted glass panels, each one etched with the name of a business that no longer exists.

PACIFIC RIM IMPORTS reads one door. WESTSIDE CONSULTING reads another. The names suggest prosperity, ambition, the kind of businesses that needed addresses in historic buildings. The addresses remained. The businesses didn't.

A water cooler stands in the hall, its bottle empty, its dispenser dry. Someone kept it filled once, part of the shared infrastructure that made office buildings work. The bottle was never replaced after the last one emptied.`,
      x: -12,
      y: 6,
      z: 1,
      imageOnDisk: 'interurban-building-first-floor-hall-x-12-y6-z1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%LOBBY',
        north: '%OFFICE_1',
        west: '%OFFICE_2',
        up: {
          description: 'The stairwell continues up',
          to: '%HALL_2'
        }
      },
      objects: [
        {
          prototype: 'describable',
          name: 'office doors',
          aliases: ['doors'],
          description: `Solid wooden doors with frosted glass panels, each etched with a business name in gold leaf. PACIFIC RIM IMPORTS, SUITE 101. WESTSIDE CONSULTING, SUITE 102. The names are legible but meaningless—the businesses dissolved, the people scattered, the suites empty behind their labeled doors.`
        },
        {
          prototype: 'describable',
          name: 'empty water cooler',
          aliases: ['cooler', 'water'],
          description: `A water cooler, the kind found in every office, sits in the hallway. The bottle is empty, its plastic walls clouded with mineral deposits. The dispenser is dry. The cooler was shared infrastructure, maintained by someone whose job included maintaining it. That job no longer exists.`
        },
      ]
    },

    '%OFFICE_1': {
      name: 'Interurban Building - Import Office',
      description: `Pacific Rim Imports occupied this suite—an import/export business dealing in goods from Asia, based on the shipping manifests still scattered across the desk. The office is small but well-appointed: a mahogany desk, leather chairs, the aesthetic of success even if success was uncertain.

Samples line the shelves: jade figurines, silk scarves, lacquered boxes, the inventory of a business that connected Seattle to the Pacific. The samples are dusty but intact, their value uncertain in an economy that no longer values such things.

A fax machine sits on a side table, its paper tray full of thermal printouts that have faded to blank. Whatever messages came through are lost. The machine remembers receiving them; the paper forgot what they said.`,
      x: -12,
      y: 7,
      z: 1,
      imageOnDisk: 'interurban-building-import-office-x-12-y7-z1.png',
      population: 0,
      ambientNoise: 1,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%HALL_1'
      },
      sittables: [
        {
          name: 'a leather chair',
          capacity: 1,
          emptyMsg:
            'A leather executive chair sits behind the mahogany desk, its cushion shaped by years of use.',
          occupiedMsg: '%s sitting in the executive chair'
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'mahogany desk',
          aliases: ['desk'],
          description: `A substantial mahogany desk, the kind that suggests permanence and prosperity. The surface is covered in shipping manifests, invoices, the paperwork of international trade. "CONTAINER 4521 - GUANGZHOU TO SEATTLE - PORCELAIN, SILK." The containers stopped arriving. The paperwork preserved the expectation that they would.`
        },
        {
          prototype: 'cabinet',
          name: 'sample shelves',
          aliases: ['shelves', 'samples'],
          description: `Shelves displaying samples of imported goods: jade figurines in various sizes, silk scarves in bright colors, lacquered boxes with intricate designs. The samples were meant to show clients what Pacific Rim could provide. The clients are gone. The samples remain, artifacts of trade routes that no longer flow.`
        },
      ]
    },

    '%OFFICE_2': {
      name: 'Interurban Building - Consulting Office',
      description: `Westside Consulting occupied this corner office—a consulting firm whose specialty is unclear from the remaining materials. The office is generic in its professionalism: a desk, a conference table, motivational posters that someone thought inspired confidence.

A whiteboard covers one wall, diagrams and bullet points in dry-erase marker that has long since become permanent. "Q4 OBJECTIVES" reads one header. "SYNERGY MATRIX" reads another. The jargon is corporate, the meaning obscure, the urgency that drove it evaporated.

Filing cabinets line the back wall, their drawers marked with client names and project codes. The files are presumably still inside, confidential information for clients who no longer exist about projects that were never completed.`,
      x: -13,
      y: 6,
      z: 1,
      imageOnDisk: 'interurban-building-consulting-office-x-13-y6-z1.png',
      population: 0,
      ambientNoise: 1,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%HALL_1'
      },
      sittables: [
        {
          name: 'a conference chair',
          capacity: 6,
          emptyMsg:
            'Ergonomic office chairs surround the conference table, arranged for meetings that never happened.',
          occupiedMsg: '%s seated at the conference table'
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'conference table',
          aliases: ['table'],
          description: `An oval conference table surrounded by ergonomic chairs, the setting for meetings that mattered to people who aren't here. A projector hangs from the ceiling, pointed at a pull-down screen. The last presentation is probably still loaded, slides about quarterly projections or market analysis, optimism preserved in PowerPoint.`
        },
        {
          prototype: 'describable',
          name: 'strategy whiteboard',
          aliases: ['whiteboard', 'board'],
          description: `A whiteboard covered in diagrams and bullet points that have become permanent—dry-erase marker dried to immovability. "Q4 OBJECTIVES: 1) EXPAND CLIENT BASE 2) IMPROVE MARGINS 3) SYNERGY." The objectives are corporate poetry, meaning nothing specific, applicable to any business, achieved by none.`
        },
        {
          prototype: 'cabinet',
          name: 'filing cabinets',
          aliases: ['cabinets', 'files'],
          description: `Filing cabinets labeled with project codes and client names: "PROJECT AURORA," "SMITH INDUSTRIES," "CONFIDENTIAL." The files inside contain whatever consultants produce—reports, analyses, recommendations. The recommendations were never implemented. The reports gather dust. The confidentiality protects nothing.`
        },
      ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=2) - OFFICES
    // ═══════════════════════════════════════════════════════════════════

    '%HALL_2': {
      name: 'Interurban Building - Second Floor Hall',
      description: `The second floor hallway mirrors the first—same hardwood floors, same high ceilings, same transoms above doors that lead to offices nobody uses. The pattern repeats, Pioneer Square's answer to office efficiency: stack identical floors, fill them with tenants, collect rent.

A bulletin board hangs on one wall, its surface covered in flyers for events that happened years ago: PIONEER SQUARE ART WALK, JAZZ NIGHT AT THE CENTRAL. The thumbtacks hold the flyers in place, preserving announcements for audiences that will never read them.

The stairwell continues up toward the top floors, where corner offices offered better views to whoever could afford the rent premium.`,
      x: -12,
      y: 6,
      z: 2,
      imageOnDisk: 'interurban-building-second-floor-hall-x-12-y6-z2.png',
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%HALL_1',
        north: '%OFFICE_3',
        west: '%OFFICE_4',
        up: {
          description: 'The stairwell continues up to the top floor',
          to: '%HALL_3'
        }
      },
      objects: [
        {
          prototype: 'describable',
          name: 'bulletin board',
          aliases: ['board', 'flyers'],
          description: `A bulletin board covered in flyers and announcements, all of them outdated: PIONEER SQUARE ART WALK - FIRST THURSDAY. JAZZ AT THE CENTRAL - FRIDAY NIGHTS. ROOM FOR RENT - QUIET PROFESSIONAL. The events happened or didn't. The room was rented or wasn't. The flyers remain, thumbtacked in place.`
        },
      ]
    },

    '%OFFICE_3': {
      name: 'Interurban Building - Architecture Office',
      description: `An architecture firm occupied this suite—drafting tables still arranged along the windows for maximum natural light, blueprints still rolled in tubes, models of buildings still displayed on shelves. The firm specialized in historic preservation, based on the projects visible: Pioneer Square renovations, waterfront developments, old buildings made new.

The irony isn't lost on the space—an architecture firm dedicated to preservation, abandoned like everything else. The blueprints they drew are probably still accurate. The buildings they planned to preserve still need preserving. The architects are gone.

A CAD workstation sits dark on one desk, its monitor dusty, its designs frozen in whatever state they were saved. The files are probably still there, recoverable if anyone cared to recover them.`,
      x: -12,
      y: 7,
      z: 2,
      population: 0,
      ambientNoise: 1,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%HALL_2'
      },
      sittables: [
        {
          name: 'a drafting stool',
          capacity: 3,
          emptyMsg:
            'Drafting stools sit at tilted tables, positioned for work that will never be completed.',
          occupiedMsg: '%s sitting at a drafting table'
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'drafting tables',
          aliases: ['tables', 'drafting'],
          description: `Tilted drafting tables arranged along the windows, their surfaces angled for drawing by hand. Some tables still have blueprints taped in place—building elevations, floor plans, the visual language of architecture. The drawings are detailed and careful, the work of people who cared about getting things right.`
        },
        {
          prototype: 'cabinet',
          name: 'blueprint tubes',
          aliases: ['tubes', 'blueprints'],
          description: `Cardboard tubes containing rolled blueprints, each one labeled with a project name and date. "PIONEER SQUARE HOTEL - RENOVATION - 2018." "WATERFRONT DEVELOPMENT - PHASE 2." The plans inside represent months of work, now archived in tubes that no one will open.`
        },
        {
          prototype: 'describable',
          name: 'building models',
          aliases: ['models'],
          description: `Scale models of buildings displayed on shelves: Pioneer Square storefronts, waterfront developments, a high-rise that was probably never built. The models are made of foam board and basswood, carefully painted, professionally presented. They show what buildings could become. What they actually became is different.`
        },
      ]
    },

    '%OFFICE_4': {
      name: 'Interurban Building - Law Office',
      description: `A small law practice occupied this suite—Johnson & Associates, according to the nameplate still affixed to the door. The office has the serious aesthetic of legal work: dark wood, heavy furniture, books lining the walls in their official bindings.

Legal files fill the cabinet drawers, case folders labeled with names and numbers. The cases were probably important to the people involved—divorces, contracts, disputes that needed resolution. The resolutions never came. The cases remain open, technically, their outcomes undetermined forever.

A law degree hangs on the wall, University of Washington School of Law, Class of 1987. The degree certified someone to practice law. The practice ended. The certification remains valid, legally speaking.`,
      x: -13,
      y: 6,
      z: 2,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%HALL_2'
      },
      sittables: [
        {
          name: 'a client chair',
          capacity: 2,
          emptyMsg:
            'Leather client chairs face the attorney desk, positioned for confidential consultations.',
          occupiedMsg: '%s seated in the client chair'
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'attorney desk',
          aliases: ['desk'],
          description: `A substantial desk in dark wood, the kind that conveys authority and justifies billing rates. Legal pads cover the surface, handwritten notes in the illegible scrawl that lawyers develop from years of depositions. A nameplate reads "MARGARET JOHNSON, ESQ." Margaret is gone. Her desk remains.`
        },
        {
          prototype: 'cabinet',
          name: 'law books',
          aliases: ['books', 'library'],
          description: `Floor-to-ceiling bookshelves hold legal volumes in matching bindings: WASHINGTON PRACTICE, LEGAL ETHICS, REAL PROPERTY LAW. The books are current through whenever the subscriptions lapsed. The law they document is still valid, technically. Whether it applies to anything anymore is a different question.`
        },
        {
          prototype: 'cabinet',
          name: 'case files',
          aliases: ['files', 'cases'],
          description: `Filing cabinets full of case folders, each one representing a legal matter that someone cared enough to hire a lawyer for. JOHNSON V. SMITH - PROPERTY DISPUTE. IN RE: ESTATE OF WILLIAMS. The cases were never resolved. The files preserve the arguments that would have been made, the evidence that would have been presented, the outcomes that will never be reached.`
        },
      ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // THIRD FLOOR (z=3) - TOP FLOOR AND ROOF ACCESS
    // ═══════════════════════════════════════════════════════════════════

    '%HALL_3': {
      name: 'Interurban Building - Third Floor Hall',
      description: `The third floor is the building's top level, its offices slightly larger, its ceilings slightly higher, the premium space for tenants who could afford the extra rent. The hallway ends at a door marked ROOF ACCESS, its lock broken, its passage to the roof unimpeded.

Skylights in the ceiling let in natural light—more than the lower floors receive, justifying the premium. The skylights are dirty now, their glass clouded with grime, but they still brighten the hallway.

The offices here had views—west toward the waterfront, north toward downtown—the selling points that real estate agents would have emphasized. The views are still there. The tenants who paid for them are not.`,
      x: -12,
      y: 6,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%HALL_2',
        north: '%CORNER_OFFICE',
        west: '%STORAGE',
        up: {
          description: 'A door leads to the roof',
          to: '%ROOF_SE'
        }
      },
      objects: [
        {
          prototype: 'describable',
          name: 'skylights',
          aliases: ['skylight', 'windows'],
          description: `Skylights set into the ceiling let natural light into the hallway—a luxury in a building where most illumination came from fixtures. The glass is dirty, clouded with years of accumulated grime, but light still filters through, brighter than the floors below. The skylights were a selling point once. They still work.`
        },
      ]
    },

    '%CORNER_OFFICE': {
      name: 'Interurban Building - Corner Office',
      description: `The corner office commanded the highest rent and offered the best views—windows on two sides, the waterfront visible to the west, downtown to the north. The tenant was clearly successful: massive desk, leather furniture, art on the walls that probably cost more than most people's salaries.

A telescope sits by the window, pointed toward Elliott Bay—perhaps for watching ships, perhaps for watching neighbors, the motivation lost with the watcher. The telescope is brass, expensive, the toy of someone who could afford toys.

The desk is remarkably clean, as if the occupant left with everything in order, files closed, surface cleared, the practiced tidiness of someone who expected to return. They didn't return. The tidiness preserved itself.`,
      x: -12,
      y: 7,
      z: 3,
      population: 0,
      ambientNoise: 1,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%HALL_3'
      },
      sittables: [
        {
          name: 'an executive chair',
          capacity: 1,
          emptyMsg:
            'A high-backed executive chair commands the view from behind the massive desk.',
          occupiedMsg: '%s sitting in the executive chair'
        },
        {
          name: 'leather sofa',
          capacity: 3,
          emptyMsg:
            'A leather sofa faces the window, positioned for contemplating success.',
          occupiedMsg: '%s lounging on the leather sofa'
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'executive desk',
          aliases: ['desk'],
          description: `A massive desk in dark wood, its surface remarkably clean—no papers, no clutter, just a leather blotter and a pen set and the careful emptiness of someone who kept things organized. The desk drawers are locked. Whatever's inside stayed inside.`
        },
        {
          prototype: 'describable',
          name: 'brass telescope',
          aliases: ['telescope', 'spyglass'],
          description: `A brass telescope on a wooden tripod, pointed toward Elliott Bay. The telescope is antique or made to look antique—either way, expensive. Through the eyepiece, ships would have been visible, or the islands, or whatever the owner wanted to watch. The view is still there. The watcher is not.`
        },
        {
          prototype: 'describable',
          name: 'artwork',
          aliases: ['art', 'paintings'],
          description: `Art hangs on the walls—original paintings, based on the signatures, in frames that cost as much as the paintings. Abstract expressionism, mostly, the kind of art that suggests taste without requiring understanding. The art was investment and decoration and status symbol. Now it's just colors on canvas, waiting for viewers.`
        },
      ]
    },

    '%STORAGE': {
      name: 'Interurban Building - Third Floor Storage',
      description: `A storage room serving the building's tenants, its shelves filled with the overflow of office life—boxes of old files, outdated equipment, the detritus that accumulates when nobody throws things away. The storage room is a time capsule of office technology: typewriters, adding machines, fax machines, each one replaced by something newer and stored here rather than discarded.

A window offers a view of the adjacent building's brick wall—the storage room was not assigned for its amenities. The light is dim, the air stale, the atmosphere of a space that was visited only when something needed storing or retrieving.

A ladder leads up to a roof hatch, providing maintenance access to the building's flat roof.`,
      x: -13,
      y: 6,
      z: 3,
      population: 0,
      ambientNoise: 1,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%HALL_3',
        up: {
          description: 'A ladder leads up through a roof hatch',
          to: '%ROOF_SW'
        }
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'storage shelves',
          aliases: ['shelves', 'storage'],
          description: `Metal shelving units hold boxes labeled with tenant names and dates—archive storage, the paper trail of businesses that generated paper. "PACIFIC RIM - 2015." "JOHNSON & ASSOC - TAX YEARS 2010-2014." The boxes contain history that mattered to someone, preserved here because destroying it seemed wrong.`
        },
        {
          prototype: 'describable',
          name: 'obsolete equipment',
          aliases: ['equipment', 'typewriters'],
          description: `A graveyard of office technology: typewriters from the 1960s, adding machines from the 1970s, fax machines from the 1990s. Each device was state-of-the-art once, then obsolete, then stored here rather than discarded. The equipment documents the evolution of office work, from mechanical to electronic to digital to whatever comes next.`
        },
      ]
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=4)
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_SE': {
      name: 'Interurban Building - Roof (Southeast)',
      description: `The roof of the Interurban Building offers views in all directions—the advantage of being among the taller structures in this section of Pioneer Square. To the south, the neighborhood spreads toward the stadiums. To the east, the hill rises toward downtown. The perspective is commanding, the kind of view that made corner offices worth the premium.

HVAC equipment clusters near the stairwell exit, the machinery that maintained comfortable temperatures in the offices below. The units are silent now, their fans frozen, their purpose ended with the maintenance contracts.

A radio antenna rises from one corner, its purpose unclear—amateur radio, perhaps, or some communication system that someone thought important enough to install on a four-story building.`,
      x: -12,
      y: 6,
      z: 4,
      population: 0,
      ambientNoise: 18,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%HALL_3',
        north: '%ROOF_NE',
        west: '%ROOF_SW'
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'HVAC units',
          aliases: ['hvac', 'equipment'],
          description: `Commercial HVAC equipment on concrete pads—compressors, fans, the machinery of climate control. The units are silent, their last maintenance visit years ago, their function ended. They'll rust in place, slowly, returning to the ore from which they were smelted.`
        },
        {
          prototype: 'describable',
          name: 'radio antenna',
          aliases: ['antenna', 'radio'],
          description: `A radio antenna rises from the roof, its wire elements pointing at the sky. The antenna is ham radio equipment, probably, installed by some tenant who wanted to talk to the world from the office roof. Whether the world is still listening is a question the antenna can't answer.`
        },
      ]
    },

    '%ROOF_NE': {
      name: 'Interurban Building - Roof (Northeast)',
      description: `The northeast corner of the roof offers the best view downtown—the towers of the financial district visible in the distance, Smith Tower prominent on the near horizon. From here you can trace the collision of Seattle's street grids, where Pioneer Square's cardinal orientation gives way to downtown's diagonal streets.

A small greenhouse structure occupies this corner, its glass panels dirty but intact. Someone grew plants up here—herbs or vegetables, based on the desiccated remains in terra cotta pots. The rooftop garden died when its gardener stopped tending it.

The parapet here is low, offering unobstructed views but minimal protection. The drop is four stories to unforgiving pavement.`,
      x: -12,
      y: 7,
      z: 4,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SE',
        west: '%ROOF_NW'
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'rooftop greenhouse',
          aliases: ['greenhouse', 'garden'],
          description: `A small greenhouse, maybe eight feet by ten, its glass panels clouded with grime. Inside, terra cotta pots hold the desiccated remains of plants—herbs, based on the leaf shapes, maybe tomatoes. Someone gardened here, tending a rooftop oasis above the city. The garden died when the gardening stopped.`
        },
      ]
    },

    '%ROOF_SW': {
      name: 'Interurban Building - Roof (Southwest)',
      description: `The southwest corner of the roof offers a glimpse of Elliott Bay between the buildings to the west—grey water under grey sky, the waterfront that made Seattle a city. A fire escape descends from here, iron stairs switchbacking down to the alley.

Graffiti covers the parapet wall—tags accumulated over years of unauthorized rooftop access. One piece stands out: a stylized train, rendered in silver and blue, captioned INTERURBAN. The artist knew the building's name and its history.

The fire escape is old but sound, Victorian ironwork built before liability concerns changed construction standards. The final ladder is latched in the raised position, awaiting someone to lower it from above.`,
      x: -13,
      y: 6,
      z: 4,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_SE',
        north: '%ROOF_NW',
        down: '%STORAGE'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'fire escape',
          aliases: ['escape', 'stairs'],
          description: `An iron fire escape descending the building's western face, switchbacking down four stories to the alley. The construction is Victorian—riveted iron, decorative brackets, built when fire escapes were meant to last generations. The escape would still work, probably. The iron is sound.`
        },
        {
          prototype: 'describable',
          name: 'train graffiti',
          aliases: ['graffiti', 'mural'],
          description: `A graffiti mural covers part of the parapet—a stylized train in silver and blue, sleek and fast, captioned INTERURBAN in period-appropriate lettering. The artist knew history: the interurban railway connected Seattle to Tacoma until 1928, giving this building its name. The trains are gone. The building remains. The art remembers both.`
        },
      ]
    },

    '%ROOF_NW': {
      name: 'Interurban Building - Roof (Northwest)',
      description: `The northwest corner of the roof is the highest point on the building, offering unobstructed views in multiple directions. A water tank stood here once—the mounting brackets remain, rusted to the concrete pad, waiting for a tank that was removed or rotted away.

A weathered bench faces north, positioned for watching the sunset over the Olympics—if the clouds ever part to reveal it. The bench is wooden, grey with age, its slats worn smooth by weather and occasional use.

From here, the entire neighborhood is visible: the brick buildings of Pioneer Square, the glass towers of downtown, the waterfront where ships still sometimes dock. The perspective is panoramic, a survey of the city's geography.`,
      x: -13,
      y: 7,
      z: 4,
      population: 0,
      ambientNoise: 12,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_NE',
        south: '%ROOF_SW'
      },
      sittables: [
        {
          name: 'a weathered bench',
          capacity: 2,
          emptyMsg:
            'A wooden bench faces the view, its surface grey with age but still sound.',
          occupiedMsg: '%s sitting on the weathered bench'
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'tank mounts',
          aliases: ['mounts', 'brackets'],
          description: `Iron mounting brackets bolted to a concrete pad, the remains of a water tank that supplied the building before city pressure was sufficient. The tank is gone—rotted, salvaged, or simply removed. The brackets remain, rusted to permanence, waiting for a tank that won't be installed.`
        },
      ]
    }
  }
};
