// Gargoyle Building - Basement (z=-1 and z=-2)
// Victorian-era basement with coal cellar and underground tunnel access

export const building = {
  rooms: {
    '%BASEMENT': {
      name: 'Gargoyle Building - Basement',
      description: `The basement is a cathedral to Victorian-era building mechanics—a massive coal furnace converted to natural gas decades ago, its boiler rising two stories through the center of the space. Cast iron pipes radiate outward like tentacles, carrying (or once carrying) heat to the floors above.

The walls are exposed brick, sweating with moisture that seeps through from the water table. Support columns of cast iron hold up the building above, their surfaces rusted but still strong. The air is cold and damp, carrying the smell of old metal and older stone.

A workbench against one wall holds the building engineer's tools—wrenches arranged by size, gauges for reading pressure, a flashlight that will never light again. The building's mechanical heart is here, still and silent.

A section of the eastern wall has been knocked through, revealing a narrow passage that leads toward the underground tunnel network.`,
      x: -19,
      y: 12,
      z: -1,
      population: 0,
      ambientNoise: 3,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: 'z0.ts:%BACK_HALL',
        east: '%COAL_CELLAR',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'boiler',
          aliases: ['furnace', 'heater'],
          description: `The boiler is a massive cast iron cylinder, perhaps ten feet tall, its surface covered in gauges and valves and warning plates in languages both English and pictographic. The coal doors have been welded shut—the conversion to natural gas happened decades ago—but the original infrastructure remains, a monument to the industrial age. The pilot light is out. The basement is cold.`,
        },
        {
          prototype: 'describable',
          name: 'pipe network',
          aliases: ['pipes', 'ductwork'],
          description: `Cast iron pipes radiate from the boiler like the tentacles of some mechanical octopus, wrapped in asbestos insulation that no one dares remove. The pipes carried steam heat to radiators on every floor, a system that worked for a century. Some pipes are labeled in faded stencil: SUPPLY, RETURN, CONDENSATE. The labels remain legible. The steam no longer flows.`,
        },
        {
          prototype: 'desk',
          name: 'engineer workbench',
          aliases: ['workbench', 'bench', 'tools'],
          description: `A metal workbench against the wall, its surface organized with the precision of someone who spent decades maintaining this building. Wrenches hang on a pegboard, arranged by size. Pressure gauges are labeled and calibrated. A clipboard holds maintenance logs dating back years, each entry noting dates and readings and small repairs. The last entry is months old. The log ends mid-page.`,
        },
        {
          prototype: 'describable',
          name: 'wall breach',
          aliases: ['breach', 'passage', 'opening'],
          description: `A section of the eastern wall has been knocked through, bricks piled on either side of the opening. The breach leads into a narrow passage—not part of the original construction, but added later by someone who needed access to the spaces beyond. Coal dust stains the passage floor.`,
        },
      ],
    },

    '%COAL_CELLAR': {
      name: 'Gargoyle Building - Coal Cellar',
      description: `The coal cellar is a large room that once held the building's fuel supply—tons of coal delivered through a chute and stored here for the furnace. The walls are stained black, the coal dust so deeply embedded that no amount of cleaning could remove it. The dust has settled into every crack and crevice.

The coal bins are empty now, their wooden walls soft with age and damp. A coal chute in the ceiling is welded shut, its street-level access sealed decades ago. The iron door on the furnace side still works, though, creaking on hinges that could use oil.

A narrow passage descends toward the underground tunnels—a connection that predates the building's conversion to gas, perhaps used for deliveries when the streets above were at basement level.`,
      x: -18,
      y: 12,
      z: -1,
      population: 0,
      ambientNoise: 2,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%BASEMENT',
        down: '%TUNNEL_ACCESS',
        south: '%STORAGE_VAULT',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'coal bin',
          aliases: ['bin', 'coal'],
          description: `An empty coal bin occupies one corner, a relic from before the conversion to gas. The wooden walls are stained black with coal dust that will never wash away. The bin is empty now—has been empty for decades—but the staining persists, a permanent record of the fuel that once heated the building.`,
        },
        {
          prototype: 'describable',
          name: 'coal chute',
          aliases: ['chute', 'delivery chute'],
          description: `A coal chute rises to the street level above, its iron door welded shut from both ends. In the old days, coal wagons would stop here and shovel their load down the chute. The wagons are gone. The chute is sealed. The building heats with gas now, or would if anyone lived here to need heat.`,
        },
        {
          prototype: 'describable',
          name: 'coal shovel',
          aliases: ['shovel'],
          description: `A coal shovel leans against the wall, its blade worn thin from use that ended generations ago. The wooden handle is blackened with coal dust and the oils of many hands. The shovel is still functional—coal shovels are simple tools—but there's no coal to shovel.`,
        },
      ],
    },

    '%STORAGE_VAULT': {
      name: 'Gargoyle Building - Storage Vault',
      description: `A reinforced room beneath the building, originally constructed as a secure storage vault for the insurance company that occupied the upper floors. The walls are thick brick reinforced with iron bands, the door a heavy steel construction that was impressive security for its era.

Filing cabinets line the walls, their drawers labeled with policy types and date ranges. The insurance company dealt in maritime risk—ships and cargo, the same uncertain commerce that built Pioneer Square. The policies they wrote are all expired now, the ships they insured either scrapped or sunk, the risks they calculated rendered moot.

A large safe sits in one corner, its door slightly ajar, its contents removed by whoever had the combination when it still mattered.`,
      x: -18,
      y: 11,
      z: -1,
      population: 0,
      ambientNoise: 0,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%COAL_CELLAR',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'insurance files',
          aliases: ['files', 'filing cabinets', 'cabinets'],
          description: `Metal filing cabinets line the walls, each drawer labeled with policy types: HULL INSURANCE, CARGO COVERAGE, MARITIME LIABILITY. The papers inside are yellowed and foxed, policies written for ships that have long since completed their voyages—or not completed them, which is why there was insurance.`,
        },
        {
          prototype: 'safe',
          name: 'vault safe',
          aliases: ['safe'],
          description: `A large floor safe, perhaps three feet tall, its heavy door slightly ajar. Whatever was inside has been removed—cash, bonds, something worth securing behind this much steel. The combination dial is worn smooth from use. Someone knew the numbers. That someone took what was inside.`,
        },
        {
          prototype: 'desk',
          name: 'document table',
          aliases: ['table', 'desk'],
          description: `A heavy wooden table for reviewing documents, its surface covered in ring stains from coffee cups that the insurance adjusters drank decades ago. A magnifying glass sits on the table, the tool of someone who needed to read fine print. The fine print is still there. The reader is gone.`,
        },
      ],
    },

    '%TUNNEL_ACCESS': {
      name: 'Underground Passage',
      description: `A narrow passage connects the Gargoyle Building's coal cellar to the underground tunnel network that threads beneath Pioneer Square. The passage is old—original construction from when the streets were at basement level, before the city rebuilt itself after the fire.

The walls are rough brick, the floor packed earth with occasional patches of cobblestone showing through. The passage smells of coal dust and damp earth, the accumulated scent of a century underground.

The passage opens into the larger tunnel network to the east, the buried streets of old Seattle stretching in multiple directions. This building was connected to the underground long before anyone thought to give tours.`,
      x: -18,
      y: 12,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%COAL_CELLAR',
        east: {
          to: 'underground/upper-tunnels/x-16-y12.ts',
          description: 'The passage opens into the underground tunnel network',
        },
      },
    },
  },
};
