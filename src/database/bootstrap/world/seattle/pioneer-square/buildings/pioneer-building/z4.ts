// Pioneer Building - Fifth Floor (z=4)
// Northwest Timber Company

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // FIFTH FLOOR (z=4) - NORTHWEST TIMBER CO.
    // ═══════════════════════════════════════════════════════════════════

    '%ELEV_LOBBY_Z4': {
      name: 'Pioneer Building - Fifth Floor Elevator Lobby',
      description: `The fifth-floor elevator lobby, now noticeably smaller than those on the floors below. The building narrows toward its peak, and this high up, the original grandeur gives way to practicality. NORTHWEST TIMBER CO. is spelled out in wooden letters on the wall—actual timber letters, probably samples of the company's product.

The walls are paneled in dark wood, different species displayed like samples: Douglas fir, Western red cedar, Sitka spruce. A small plaque identifies each one, a silent advertisement for the company beyond the door.

Through the window, the upper floors of surrounding buildings are visible, the perspective shifted from the street-level view. Up here, Pioneer Square looks almost orderly.`,
      x: 2,
      y: 9,
      z: 4,
      population: 0,
      ambientNoise: 2,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%TIMBER_RECEPTION',
        south: '%HALL_Z4',
        up: '%STAIR_Z5',
        down: '%STAIR_Z3',
        in: '%E',
      },
      elevatorId: '%E',
      objects: [
        {
          prototype: 'describable',
          name: 'wood panel samples',
          aliases: ['panels', 'wood samples', 'samples'],
          description: `The walls are paneled in different wood species, each section labeled with a small brass plaque: DOUGLAS FIR, WESTERN RED CEDAR, SITKA SPRUCE, PONDEROSA PINE. The woods show their character—grain patterns, color variations, the qualities that made Northwest timber famous. The display is both decoration and advertisement, showcasing the company's product to anyone who stepped off the elevator.`,
        },
        {
          prototype: 'describable',
          name: 'timber letters',
          aliases: ['letters', 'sign', 'wooden letters'],
          description: `The company name spelled out in wooden letters, each perhaps six inches tall, cut from different timber species. NORTHWEST in Douglas fir, TIMBER in Western red cedar, CO. in Sitka spruce. The letters are mounted directly to the wall, their surfaces polished smooth. Someone carved these as a demonstration of craftsmanship. The craftsmanship remains evident.`,
        },
      ],
    },

    '%STAIR_Z4': {
      name: 'Pioneer Building - Fifth Floor Stairwell',
      description: `The staircase landing between the fifth and sixth floors. The stairs continue upward, but the character changes here—the grand marble gives way to simpler wood, the iron balusters become plainer. The executive floor above warranted less ornamentation for the journey up, more for the destination itself.

A window faces north, offering a view of the Smith Tower and the buildings of the commercial district. From this height, the streets below seem less chaotic, the grid pattern of the city becoming visible.`,
      x: 2,
      y: 8,
      z: 4,
      population: 0,
      ambientNoise: 3,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%STAIR_Z5',
        down: '%STAIR_Z3',
        north: '%ELEV_LOBBY_Z4',
      },
    },

    '%HALL_Z4': {
      name: 'Pioneer Building - Fifth Floor Hallway',
      description: `The fifth-floor corridor, smaller than those below, reflecting the building's tapering profile. The hallway is paneled in wood—fitting for a floor occupied by a timber company—the grain patterns of Douglas fir running in horizontal bands along the walls.

The offices here feel more connected to the forest industry than the professional services below. Maps of timber claims cover one wall, showing the green holdings of Northwest companies in the Cascades and Olympics. The lands shown may still have trees. No one harvests them.`,
      x: 2,
      y: 8,
      z: 4,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ELEV_LOBBY_Z4',
        east: '%TIMBER_MAPS',
        west: '%TIMBER_ACCOUNTING',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'timber claim maps',
          aliases: ['maps', 'claim maps', 'forest maps'],
          description: `Large maps cover one wall, showing timber claims in the Cascade and Olympic mountains. The holdings are marked in different colors—company land in green, leased land in yellow, harvested sections in brown. The maps are marked with roads and rail lines, the infrastructure of logging operations. Some of the roads are overgrown now. Some of the rails have been pulled. The maps remember what was.`,
        },
      ],
    },

    '%TIMBER_RECEPTION': {
      name: 'Northwest Timber - Reception',
      description: `The reception area of Northwest Timber, a space that smells of wood even after years of abandonment. The walls are paneled in cedar, the desks made of fir, the company's product on display in every surface. A massive cross-section of a Douglas fir tree stands in one corner, its rings marked with historical events: 1492, 1776, 1889.

The reception desk is a solid slab of old-growth timber, its surface polished to a deep sheen. Behind it, photographs of logging operations cover the wall—men standing beside fallen giants, steam donkeys hauling logs, the industrial harvest of the Northwest forests.

A trophy case displays awards: BEST TIMBER, OUTSTANDING SUSTAINABILITY (the irony noted even then), industry recognition from associations that no longer meet.`,
      x: 1,
      y: 9,
      z: 4,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ELEV_LOBBY_Z4',
        south: '%TIMBER_ACCOUNTING',
        west: '%TIMBER_PRESIDENT',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'timber desk',
          aliases: ['desk', 'reception desk'],
          description: `A reception desk made from a single slab of old-growth Douglas fir, perhaps eight feet long and three feet deep. The wood grain swirls across its surface, preserved under layers of varnish. The desk weighs hundreds of pounds—it was probably assembled in the room, too heavy to move through the door. It will be here until the building falls.`,
        },
        {
          prototype: 'describable',
          name: 'tree cross-section',
          aliases: ['tree section', 'tree rings', 'tree slice'],
          description: `A massive cross-section of a Douglas fir, perhaps six feet in diameter, mounted on a stand. Labels point to specific rings: COLUMBUS SAILS 1492, DECLARATION OF INDEPENDENCE 1776, GREAT SEATTLE FIRE 1889. The tree lived through five centuries of human history before it was felled. Its rings record droughts and wet years, fires and growth spurts. The tree is dead. Its record lives on.`,
        },
        {
          prototype: 'describable',
          name: 'logging photographs',
          aliases: ['photographs', 'photos', 'pictures'],
          description: `Black and white photographs cover one wall, documenting the logging industry: men with axes standing beside trees ten feet in diameter, steam donkeys hauling logs up hillsides, log rafts filling rivers bank to bank. The scale is staggering—trees that took centuries to grow, felled in hours. The photographs celebrate this as progress. The forests that remain might disagree.`,
        },
      ],
    },

    '%TIMBER_PRESIDENT': {
      name: 'Northwest Timber - President\'s Office',
      description: `The corner office of Northwest Timber's president, paneled floor to ceiling in old-growth cedar. The room smells of wood even now, the cedar releasing its oils into air that hasn't changed in years. A massive desk dominates the space, carved from a single piece of timber, its surface cluttered with forestry reports and timber surveys.

The windows look north and west, toward the distant mountains where the company's holdings lie. On clear days, the peaks are visible, white with snow, their slopes still green with the timber that made fortunes.

A mounted salmon hangs on one wall—a chinook, perhaps forty pounds, caught by the president in the days when salmon still ran in the rivers. The salmon is frozen in mid-leap, forever escaping the water that no longer holds its kind.`,
      x: 1,
      y: 10,
      z: 4,
      population: 0,
      ambientNoise: 2,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%TIMBER_RECEPTION',
        south: '%TIMBER_ENGINEERING',
      },
      sittables: [
        {
          name: 'the president\'s chair',
          capacity: 1,
          emptyMsg:
            'A leather chair sits behind the massive timber desk.',
          occupiedMsg: '%s sitting in the timber president\'s chair',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'mounted salmon',
          aliases: ['salmon', 'fish', 'chinook'],
          description: `A mounted chinook salmon hangs on the wall, frozen in mid-leap, its silver scales still bright after years of display. The fish is massive—forty pounds at least—a trophy from the days when salmon still ran thick in Northwest rivers. A brass plaque reads: STILLAGUAMISH RIVER, JULY 1987. The river still flows. The salmon mostly don't.`,
        },
        {
          prototype: 'desk',
          name: 'timber desk',
          aliases: ['desk', 'wooden desk'],
          description: `A desk carved from a single massive piece of Douglas fir, its surface a swirl of grain and knots preserved under lacquer. The desk was probably brought in before the walls were finished—too large to fit through the door. Papers and surveys cover its surface, but the desk itself is the statement: the company's product, displayed in its finest form.`,
        },
      ],
    },

    '%TIMBER_ENGINEERING': {
      name: 'Northwest Timber - Engineering',
      description: `The engineering office, where logging operations were planned and machinery maintained. Drafting tables line the room, their surfaces still covered with blueprints for sawmills and yarding equipment. Scale models of logging machinery sit on shelves—steam donkeys, loaders, the industrial tools that transformed forests into lumber.

A tool rack on one wall holds hand tools: axes, saws, wedges, the implements of the trade before mechanization. Some of these tools are antiques, preserved as relics of the company's founding era.

Technical manuals fill a bookshelf—maintenance guides for equipment that may still exist somewhere, rusting in clearcuts and abandoned operations.`,
      x: 1,
      y: 7,
      z: 4,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%TIMBER_PRESIDENT',
        east: '%TIMBER_ACCOUNTING',
      },
      sittables: [
        {
          name: 'a drafting stool',
          capacity: 3,
          emptyMsg:
            'Wooden drafting stools sit at the angled tables.',
          occupiedMsg: '%s sitting at one of the drafting tables',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'machinery blueprints',
          aliases: ['blueprints', 'plans', 'drawings'],
          description: `Blueprints cover the drafting tables, showing the mechanical details of logging equipment: steam donkeys, cable yarders, sawmill configurations. The drawings are precise, every gear and cable specified, the engineering that powered the timber industry. Some of this equipment still exists, abandoned in the woods. The blueprints that created it remain here.`,
        },
        {
          prototype: 'describable',
          name: 'scale models',
          aliases: ['models', 'machinery models'],
          description: `Shelves hold scale models of logging machinery, each perhaps a foot long, crafted in wood and metal. A steam donkey shows its cables and pulleys in miniature. A log loader demonstrates its articulated arm. The models were probably made for presentations, demonstrating capability to investors. They remain, museum pieces of an industry that transformed the landscape.`,
        },
        {
          prototype: 'describable',
          name: 'antique tools',
          aliases: ['tools', 'axes', 'saws'],
          description: `A rack holds hand tools from the early days of logging: double-bit axes, two-man crosscut saws, steel wedges. The tools are worn but maintained, probably preserved as historical artifacts by the time operations mechanized. They represent the muscle-powered era of logging, before steam and diesel transformed the industry. The handles are worn smooth by hands that worked them hard.`,
        },
      ],
    },

    '%TIMBER_ACCOUNTING': {
      name: 'Northwest Timber - Accounting',
      description: `The accounting office, where the business of timber was tracked in ledgers and logs. Desks fill the room, each with an adding machine and stacks of invoices—board feet sold, stumpage paid, the mathematics of converting trees to dollars.

A large board on one wall tracks timber inventory across the company's holdings: estimated board feet remaining in each section, harvest schedules, replanting records. The numbers are outdated, but they paint a picture of an industry at industrial scale.

A small safe sits in the corner, its door closed but not locked, its combination presumably known to people who are no longer here.`,
      x: 1,
      y: 8,
      z: 4,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%TIMBER_RECEPTION',
        east: '%HALL_Z4',
        south: '%TIMBER_ENGINEERING',
      },
      sittables: [
        {
          name: 'an accountant\'s desk',
          capacity: 4,
          emptyMsg:
            'Wooden desks fill the room, each with an adding machine and stacks of invoices.',
          occupiedMsg: '%s sitting at an accountant\'s desk',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'inventory board',
          aliases: ['board', 'inventory', 'tracking board'],
          description: `A large board tracks timber inventory: SECTION, EST. BOARD FEET, HARVEST DATE, REPLANT STATUS. The numbers are staggering—millions of board feet across dozens of sections, entire mountainsides reduced to columns and rows. Some sections are marked HARVESTED, others PROTECTED, others PENDING. The harvest schedules stopped being updated. The trees, presumably, kept growing.`,
        },
        {
          prototype: 'describable',
          name: 'unlocked safe',
          aliases: ['safe', 'small safe'],
          description: `A small floor safe, its door closed but not locked—the combination dial sits at zero. Inside, the shelves are empty except for a few old contracts and a stack of bearer bonds that may or may not still have value. The safe protected the company's most important documents. The importance faded. The documents remain.`,
        },
      ],
    },

    '%TIMBER_MAPS': {
      name: 'Northwest Timber - Map Room',
      description: `A room dedicated to cartography, its walls covered with maps of the company's timber holdings. Topographical maps show the mountains where logging roads were cut. Aerial photographs trace the patterns of harvest—green forest, brown clearcuts, the checkerboard of industrial forestry.

A large light table dominates the center of the room, its surface designed for examining aerial photographs and overlaying maps. The light still works, casting an eerie glow upward.

Filing cabinets hold rolled maps and surveys, each drawer labeled with section numbers and dates. The records of the company's land holdings, preserved in paper.`,
      x: 3,
      y: 8,
      z: 4,
      population: 0,
      ambientNoise: 2,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_Z4',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'wall maps',
          aliases: ['maps', 'topographical maps'],
          description: `Large topographical maps cover the walls, showing the mountain terrain where the company logged. Contour lines trace ridges and valleys. Logging roads are marked in red, winding up mountainsides. Rivers and streams are marked in blue. The maps show a landscape shaped by industry—roads cut into wilderness, clearcuts opening views that trees once blocked.`,
        },
        {
          prototype: 'describable',
          name: 'light table',
          aliases: ['table', 'viewing table'],
          description: `A light table, perhaps four feet square, its translucent surface designed for examining aerial photographs. The light still works, casting a diffuse glow upward. Aerial photos are scattered across its surface, showing forest and clearcut from above—the patterns of harvest visible only from altitude. The table was for planning operations, identifying timber, routing roads. The planning stopped. The photographs remain.`,
        },
        {
          prototype: 'cabinet',
          name: 'map cabinets',
          aliases: ['cabinets', 'filing cabinets'],
          description: `Flat filing cabinets hold rolled maps and surveys, each drawer labeled with section numbers and dates: SECTION 24 TWP 8N R 12E, SURVEY 1956. The maps show the company's holdings in precise detail—every tree stand estimated, every access route planned. The paper trail of industrial forestry, preserved in an office that no longer oversees the forests.`,
        },
      ],
    },
  },
};
