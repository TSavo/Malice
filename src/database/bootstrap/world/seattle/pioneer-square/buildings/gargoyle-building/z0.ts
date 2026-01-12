// Gargoyle Building - Ground Floor (z=0)
// Victorian-era building with ornate facade and carved grotesques

export const building = {
  name: 'Gargoyle Building',
  x: -18,
  y: 12,
  width: 2,
  height: 2,
  floors: 5,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Pioneer Mutual Front Lock',
      description:
        'A massive brass lock mechanism set into the heavy wooden doors. Victorian engineering—intricate but well-maintained despite its age.',
      difficulty: 5
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Heavy Wooden Doors',
      description:
        'Double doors of solid oak, darkened with age and carved with geometric patterns. Brass handles worn smooth by a century of hands. The doors stand open, wedged with a brick that someone placed there long ago.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'wood',
      durability: 85
    },
    '%SHOP_LOCK': {
      prototype: 'lock',
      name: 'Shop Alley Lock',
      description:
        'A simple deadbolt on the shop\'s alley entrance. The kind of lock meant to deter casual theft, not determined entry.',
      difficulty: 4
    },
    '%SHOP_DOOR': {
      prototype: 'door',
      name: 'Cracked Glass Door',
      description:
        'A door with a large glass panel, now held together by a spider-web of cracks. The glass fractures haven\'t fallen out yet, but they will. The door is locked from inside.',
      locked: true,
      open: false,
      locks: ['%SHOP_LOCK'],
      material: 'glass',
      durability: 25
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - LOBBY AND SHOPS
    // ═══════════════════════════════════════════════════════════════════

    '%LOBBY': {
      name: 'Gargoyle Building - Lobby',
      description: `The lobby speaks to an era when buildings were designed to impress—sixteen-foot ceilings with pressed tin panels, marble floors in checkerboard black and white, ornate plasterwork depicting maritime scenes along the crown molding. The cast iron staircase rises against the eastern wall, its banister worn smooth by a century of hands.

The building's name is set in the terrazzo floor: PIONEER MUTUAL BUILDING, 1892. Above the main entrance, visible through the transom, a carved stone face peers inward—one of the gargoyles that give the building its unofficial name. The face is weathered, its features softened by a century of rain and freeze-thaw, but the expression remains legible: something between wisdom and hunger.

A brass mailbox bank lines one wall, each box labeled with suite numbers and names of tenants who have long since departed. Some boxes hang open, their contents scattered or removed. Others remain locked, their mail accumulating for recipients who will never collect it.`,
      x: -18,
      y: 12,
      z: 0,
      imageOnDisk: 'yesler-way-x-18-y12-z0.png',
      population: 0,
      ambientNoise: 3,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: {
          to: 'yesler-way/x-17.ts',
          description: 'Heavy wooden doors lead back to Yesler Way',
          door: '%FRONT_DOOR'
        },
        west: '%BACK_HALL',
        up: '%STAIRWELL'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'terrazzo floor',
          aliases: ['floor', 'mosaic'],
          description: `The terrazzo floor is a work of art in itself—chips of marble in black and white creating a checkerboard pattern, with the building's name set in brass letters in the center: PIONEER MUTUAL BUILDING, 1892. The floor is cracked in places, the brass letters tarnished, but the craftsmanship persists. Someone took pride in this floor once. The pride shows through the neglect.`
        },
        {
          prototype: 'cabinet',
          name: 'brass mailboxes',
          aliases: ['mailboxes', 'mail', 'mailbox bank'],
          description: `A bank of brass mailboxes, each one labeled with a suite number and a name on a paper insert: "Suite 201 - Hendricks & Associates," "Suite 304 - Pacific Maritime Insurance," "Suite 412 - J. R. Peterson, CPA." Some boxes hang open, rifled through. Others remain locked, their contents visible through the mesh: catalogues, bills, letters from people who didn't know the recipients would never read them.`
        },
        {
          prototype: 'describable',
          name: 'cast iron staircase',
          aliases: ['staircase', 'stairs', 'stair'],
          description: `A cast iron staircase rises against the eastern wall, its ornate balusters shaped like twisted vines, its newel post capped with a brass acorn. The stairs are worn at the center of each tread, the iron showing through where paint has been worn away by generations of feet. The staircase spirals upward into shadow, promising access to floors above.`
        },
        {
          prototype: 'describable',
          name: 'pressed tin ceiling',
          aliases: ['ceiling', 'tin panels'],
          description: `The ceiling is a grid of pressed tin panels, each one stamped with an intricate pattern of flowers and scrollwork. Paint has flaked in places, revealing the tin beneath—silver-grey where it's protected, oxidized brown where moisture has reached it. A chandelier hangs from the center, its crystals dusty, its bulbs long since burned out. The craftsmanship remains impressive. The maintenance ended.`
        },
      ]
    },

    '%BACK_HALL': {
      name: 'Gargoyle Building - Back Hall',
      description: `The back hallway is utilitarian compared to the lobby's grandeur—plain plaster walls, industrial lighting, the back-of-house infrastructure that visitors weren't meant to see. Doors line both sides: janitor's closet, electrical room, the service entrance to what was once a ground-floor shop.

The elevator sits at the end of the hall, its brass doors closed, the needle on its position indicator frozen between floors. An OUT OF ORDER sign in yellowed paper is taped to the doors, though the distinction between "out of order" and "permanently non-functional" has long since blurred.

A service staircase, narrower than the ornate one in the lobby, descends into darkness. The basement access—maintenance tunnels, boiler room, the building's mechanical heart.`,
      x: -19,
      y: 12,
      z: 0,
      imageOnDisk: 'yesler-way-x-19-y12-z0.png',
      population: 0,
      ambientNoise: 2,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LOBBY',
        south: '%SHOP',
        down: '%BASEMENT'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'elevator',
          aliases: ['lift', 'brass doors'],
          description: `An old elevator with brass doors, the kind with an accordion gate that operators once pulled closed by hand. The doors are sealed now, and the position indicator above them—a brass semicircle with floor numbers—shows the car frozen between 2 and 3. An OUT OF ORDER sign is taped to the doors, its paper yellowed, its message redundant. Nothing in this building is "in order" anymore.`
        },
        {
          prototype: 'cabinet',
          name: 'janitor closet',
          aliases: ['closet', 'janitor'],
          description: `A closet door stands ajar, revealing the tools of building maintenance: mops and brooms, buckets stacked inside each other, bottles of cleaning solution in brands that stopped being manufactured decades ago. A grey jumpsuit hangs on a hook—someone's work uniform, waiting for a shift that will never start. The smell of industrial cleanser lingers, faint but persistent.`
        },
        {
          prototype: 'describable',
          name: 'service staircase',
          aliases: ['stairs', 'basement stairs'],
          description: `A narrow staircase descends into darkness, its steps concrete, its handrail steel pipe. This is the servants' stair, built for maintenance workers and delivery personnel, not for the tenants who used the ornate lobby stairs. The basement waits below—boiler room, mechanical systems, the building's hidden infrastructure.`
        },
      ]
    },

    '%SHOP': {
      name: 'Gargoyle Building - Abandoned Shop',
      description: `This was a ground-floor retail space once—the kind of shop that building developers include to generate street-level foot traffic. The fixtures suggest it was most recently a tailor's shop: a three-way mirror against one wall, a raised platform for fittings, racks that once held suits and alterations.

The tailor's worktable remains, its surface scarred with pin marks and cutting guides. A dress form stands in the corner, headless and armless, draped with measuring tape like a sash. Spools of thread line the wall in a rainbow of colors, their labels faded, their contents still usable if anyone needed thread.

A separate entrance opens onto the alley to the south, its door locked but its glass cracked, held together by a spiderweb of fractures.`,
      x: -19,
      y: 11,
      z: 0,
      imageOnDisk: 'gargoyle-building-abandoned-shop-x-19-y11-z0.png',
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%BACK_HALL',
        south: {
          to: null, // Alley exit not implemented
          description: 'A cracked glass door leads to the alley',
          door: '%SHOP_DOOR'
        }
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'three-way mirror',
          aliases: ['mirror', 'mirrors'],
          description: `A three-way mirror, the kind that lets you see yourself from all angles when trying on clothes. The glass is dusty but unbroken, its brass frame tarnished. The reflections show the empty shop from multiple angles, multiplying the abandonment. In better days, customers stood here and watched themselves transformed by tailored clothing.`,
          boltedDown: true
        },
        {
          prototype: 'desk',
          name: 'tailor worktable',
          aliases: ['worktable', 'table', 'cutting table'],
          description: `A large worktable designed for cutting fabric and making alterations, its surface a patchwork of pin marks, chalk lines, and cutting guides worn into the wood. A pair of fabric shears lies on the table, their blades rusted shut. Pins are scattered in the corners, their heads forming tiny constellations. The tailor's tools remain. The tailor's hands are gone.`
        },
        {
          prototype: 'furniture',
          name: 'dress form',
          aliases: ['mannequin', 'form', 'dummy'],
          description: `A headless, armless dress form stands in the corner, its adjustable sections set for someone's measurements. Measuring tape hangs across its torso like a sash, the inches and centimeters still legible. A half-finished alteration—pinned but never sewn—clings to the form: a jacket waiting to have its sleeves shortened. The customer never came back for it.`
        },
        {
          prototype: 'describable',
          name: 'thread spools',
          aliases: ['thread', 'spools'],
          description: `Spools of thread line a wall-mounted rack, organized by color in a rainbow that runs from white through every shade to black. The labels are faded—Coats & Clark, Gutermann, brands that served the garment industry for generations. The thread is still good, still usable. If anyone needed to sew anything, the materials are here. No one needs to sew anything.`
        },
      ]
    },

    '%BASEMENT': {
      name: 'Gargoyle Building - Basement',
      description: `The basement is a cathedral to Victorian-era building mechanics—a massive coal furnace converted to natural gas decades ago, its boiler rising two stories through the center of the space. Cast iron pipes radiate outward like tentacles, carrying (or once carrying) heat to the floors above.

The walls are exposed brick, sweating with moisture that seeps through from the water table. Support columns of cast iron hold up the building above, their surfaces rusted but still strong. The air is cold and damp, carrying the smell of old metal and older stone.

A workbench against one wall holds the building engineer's tools—wrenches arranged by size, gauges for reading pressure, a flashlight that will never light again. The building's mechanical heart is here, still and silent.

A section of the eastern wall has been knocked through, revealing a narrow passage that leads toward the underground tunnel network.`,
      x: -19,
      y: 12,
      z: -1,
      imageOnDisk: 'gargoyle-building-basement-x-19-y12-z-1.png',
      population: 0,
      ambientNoise: 3,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%BACK_HALL',
        east: '%COAL_CELLAR'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'boiler',
          aliases: ['furnace', 'heater'],
          description: `The boiler is a massive cast iron cylinder, perhaps ten feet tall, its surface covered in gauges and valves and warning plates in languages both English and pictographic. The coal doors have been welded shut—the conversion to natural gas happened decades ago—but the original infrastructure remains, a monument to the industrial age. The pilot light is out. The basement is cold.`
        },
        {
          prototype: 'describable',
          name: 'pipe network',
          aliases: ['pipes', 'ductwork'],
          description: `Cast iron pipes radiate from the boiler like the tentacles of some mechanical octopus, wrapped in asbestos insulation that no one dares remove. The pipes carried steam heat to radiators on every floor, a system that worked for a century. Some pipes are labeled in faded stencil: SUPPLY, RETURN, CONDENSATE. The labels remain legible. The steam no longer flows.`
        },
        {
          prototype: 'desk',
          name: 'engineer workbench',
          aliases: ['workbench', 'bench', 'tools'],
          description: `A metal workbench against the wall, its surface organized with the precision of someone who spent decades maintaining this building. Wrenches hang on a pegboard, arranged by size. Pressure gauges are labeled and calibrated. A clipboard holds maintenance logs dating back years, each entry noting dates and readings and small repairs. The last entry is months old. The log ends mid-page.`
        },
        {
          prototype: 'describable',
          name: 'wall breach',
          aliases: ['breach', 'passage', 'opening'],
          description: `A section of the eastern wall has been knocked through, bricks piled on either side of the opening. The breach leads into a narrow passage—not part of the original construction, but added later by someone who needed access to the spaces beyond. Coal dust stains the passage floor.`
        },
      ]
    },

    '%COAL_CELLAR': {
      name: 'Gargoyle Building - Coal Cellar',
      description: `The coal cellar is a large room that once held the building's fuel supply—tons of coal delivered through a chute and stored here for the furnace. The walls are stained black, the coal dust so deeply embedded that no amount of cleaning could remove it. The dust has settled into every crack and crevice.

The coal bins are empty now, their wooden walls soft with age and damp. A coal chute in the ceiling is welded shut, its street-level access sealed decades ago. The iron door on the furnace side still works, though, creaking on hinges that could use oil.

A narrow passage descends toward the underground tunnels—a connection that predates the building's conversion to gas, perhaps used for deliveries when the streets above were at basement level.`,
      x: -18,
      y: 12,
      z: -1,
      imageOnDisk: 'gargoyle-building-coal-cellar-x-18-y12-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%BASEMENT',
        down: '%TUNNEL_ACCESS',
        south: '%STORAGE_VAULT'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'coal bin',
          aliases: ['bin', 'coal'],
          description: `An empty coal bin occupies one corner, a relic from before the conversion to gas. The wooden walls are stained black with coal dust that will never wash away. The bin is empty now—has been empty for decades—but the staining persists, a permanent record of the fuel that once heated the building.`
        },
        {
          prototype: 'describable',
          name: 'coal chute',
          aliases: ['chute', 'delivery chute'],
          description: `A coal chute rises to the street level above, its iron door welded shut from both ends. In the old days, coal wagons would stop here and shovel their load down the chute. The wagons are gone. The chute is sealed. The building heats with gas now, or would if anyone lived here to need heat.`
        },
        {
          prototype: 'describable',
          name: 'coal shovel',
          aliases: ['shovel'],
          description: `A coal shovel leans against the wall, its blade worn thin from use that ended generations ago. The wooden handle is blackened with coal dust and the oils of many hands. The shovel is still functional—coal shovels are simple tools—but there's no coal to shovel.`
        },
      ]
    },

    '%STORAGE_VAULT': {
      name: 'Gargoyle Building - Storage Vault',
      description: `A reinforced room beneath the building, originally constructed as a secure storage vault for the insurance company that occupied the upper floors. The walls are thick brick reinforced with iron bands, the door a heavy steel construction that was impressive security for its era.

Filing cabinets line the walls, their drawers labeled with policy types and date ranges. The insurance company dealt in maritime risk—ships and cargo, the same uncertain commerce that built Pioneer Square. The policies they wrote are all expired now, the ships they insured either scrapped or sunk, the risks they calculated rendered moot.

A large safe sits in one corner, its door slightly ajar, its contents removed by whoever had the combination when it still mattered.`,
      x: -18,
      y: 11,
      z: -1,
      imageOnDisk: 'gargoyle-building-storage-vault-x-18-y11-z-1.png',
      population: 0,
      ambientNoise: 0,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%COAL_CELLAR'
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'insurance files',
          aliases: ['files', 'filing cabinets', 'cabinets'],
          description: `Metal filing cabinets line the walls, each drawer labeled with policy types: HULL INSURANCE, CARGO COVERAGE, MARITIME LIABILITY. The papers inside are yellowed and foxed, policies written for ships that have long since completed their voyages—or not completed them, which is why there was insurance.`
        },
        {
          prototype: 'safe',
          name: 'vault safe',
          aliases: ['safe'],
          description: `A large floor safe, perhaps three feet tall, its heavy door slightly ajar. Whatever was inside has been removed—cash, bonds, something worth securing behind this much steel. The combination dial is worn smooth from use. Someone knew the numbers. That someone took what was inside.`
        },
        {
          prototype: 'desk',
          name: 'document table',
          aliases: ['table', 'desk'],
          description: `A heavy wooden table for reviewing documents, its surface covered in ring stains from coffee cups that the insurance adjusters drank decades ago. A magnifying glass sits on the table, the tool of someone who needed to read fine print. The fine print is still there. The reader is gone.`
        },
      ]
    },

    '%TUNNEL_ACCESS': {
      name: 'Underground Passage',
      description: `A narrow passage connects the Gargoyle Building's coal cellar to the underground tunnel network that threads beneath Pioneer Square. The passage is old—original construction from when the streets were at basement level, before the city rebuilt itself after the fire.

The walls are rough brick, the floor packed earth with occasional patches of cobblestone showing through. The passage smells of coal dust and damp earth, the accumulated scent of a century underground.

The passage opens into the larger tunnel network to the east, the buried streets of old Seattle stretching in multiple directions. This building was connected to the underground long before anyone thought to give tours.`,
      x: -17,
      y: 12,
      z: -2,
      imageOnDisk: 'underground-passage-x-17-y12-z-2.png',
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%COAL_CELLAR'
      }
    },

    '%STAIRWELL': {
      name: 'Gargoyle Building - Stairwell',
      description: `The ornate staircase spirals upward from the lobby, its cast iron balusters forming a cage of twisted vines and acanthus leaves. The stairs are worn in the center of each tread, the pattern of decades of feet mapped in the missing paint. The walls are bare plaster, cracked in places, marked by water damage where the roof has leaked.

Light filters down from a skylight far above—four stories up, the glass grimy but intact. The light is grey and diffuse, barely enough to see by, but it saves the stairwell from complete darkness.

Doors on each landing lead to the upper floors—offices once, apartments perhaps, the building's mixed-use history evident in the variety of locks and mail slots. Most doors are closed. Some stand ajar, revealing empty rooms beyond.`,
      x: -18,
      y: 12,
      z: 0,
      imageOnDisk: 'yesler-way-x-18-y12-z0.png',
      population: 0,
      ambientNoise: 2,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%LOBBY',
        up: 'z1.ts#HALL_1'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'skylight',
          aliases: ['light', 'glass'],
          description: `A skylight four stories above lets in grey, filtered light—enough to navigate by, not enough to read by. The glass is grimy with decades of accumulated dirt, bird droppings, and the detritus of a city that no longer cleans. The light that does penetrate is diffuse and shadowless, giving the stairwell an underwater quality.`
        },
        {
          prototype: 'describable',
          name: 'office doors',
          aliases: ['doors', 'offices'],
          description: `Doors on each landing lead to what were once offices or apartments. The doors are solid wood with frosted glass transoms, each one labeled with a suite number. Some doors stand ajar—202, 305, 411—revealing empty rooms, abandoned desks, windows looking out on the street below. Other doors remain closed and locked, their contents unknown, their tenants departed.`
        },
        {
          prototype: 'describable',
          name: 'iron balusters',
          aliases: ['balusters', 'railings', 'banister'],
          description: `The cast iron balusters are works of art—each one individually cast, depicting twisted vines, acanthus leaves, and occasional faces hidden in the foliage. The style is Victorian, ornate, completely impractical, absolutely beautiful. The iron is cold to the touch, the metalwork smooth from a century of hands gripping it on the climb.`
        },
      ]
    }
  }
};
