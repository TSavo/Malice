// Gargoyle Building - Third Floor (z=3)
// Victorian-era offices: Suite 301-304 (Architecture firm, Vacant)
// Top office floor with roof access

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

    '%SUITE_301_LOCK': {
      prototype: 'rentableLock',
      name: 'Suite 301 Lock',
      description:
        'A brass lock with a tarnished plate reading "301". The mechanism is stiff from disuse.',
      difficulty: 4,
    },
    '%SUITE_301_DOOR': {
      prototype: 'door',
      name: 'Suite 301 Door',
      description:
        'A wooden door with frosted glass. "WESTLAKE ARCHITECTURE & DESIGN" is hand-painted in art deco lettering.',
      locked: true,
      open: false,
      locks: ['%SUITE_301_LOCK'],
      material: 'wood',
      durability: 70,
    },

    '%ROOF_HATCH_LOCK': {
      prototype: 'lock',
      name: 'Roof Hatch Lock',
      description:
        'A heavy padlock on the roof hatch, its brass tarnished green with age. The lock is rusted but functional.',
      difficulty: 4,
    },

    // ═══════════════════════════════════════════════════════════════════
    // THIRD FLOOR (z=3) - TOP OFFICE FLOOR
    // ═══════════════════════════════════════════════════════════════════

    '%HALL_3': {
      name: 'Gargoyle Building - Third Floor Hall',
      description: `The third floor is the highest office level, just below the roof. The skylight four stories above is visible through the stairwell opening, its grimy glass admitting grey light that filters down through all the floors below. Here, nearest to the source, the light is almost adequate.

The ceiling damage is worst here—closest to the roof, closest to the leaks. Plaster has fallen in chunks, exposing the lath beneath, dark with water stains. The tin ceiling tiles have buckled and warped.

At the end of the hall, a steel ladder leads up through a hatch to the roof. A faded sign reads: ROOF ACCESS - AUTHORIZED PERSONNEL ONLY. A padlock secures the hatch, its brass green with age.`,
      x: -18,
      y: 12,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z2.ts#HALL_2',
        east: {
          description: 'A frosted glass door leads to Suite 301',
          door: '%SUITE_301_DOOR',
          to: '%SUITE_301',
        },
        west: '%SUITE_303',
        up: {
          description: 'A steel ladder leads up through a roof hatch',
          locks: ['%ROOF_HATCH_LOCK'],
          to: '%ROOF_SE',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'skylight',
          aliases: ['light', 'glass'],
          description: `The skylight is visible four stories above through the stairwell opening—a square of grimy glass that admits whatever light the Seattle sky provides. The glass is clouded with decades of accumulated grime, bird droppings, and neglect. The light that filters through is grey and diffuse, but it's the brightest illumination the stairwell receives.`,
        },
        {
          prototype: 'describable',
          name: 'ceiling damage',
          aliases: ['ceiling', 'plaster', 'damage'],
          description: `The ceiling has suffered worst here, nearest to the roof. Plaster has fallen away in chunks, exposing the wooden lath beneath, dark with water stains and spotted with mold. The tin ceiling tiles have buckled under the weight of accumulated moisture. The damage continues its slow expansion, each storm adding to the destruction.`,
        },
        {
          prototype: 'furniture',
          name: 'roof ladder',
          aliases: ['ladder', 'hatch'],
          description: `A steel ladder bolted to the wall leads up through a roof hatch. The ladder is industrial, utilitarian—meant for maintenance workers, not tenants. The hatch above is secured with a padlock, green with oxidation, but the lock still functions. Authorized personnel only. There is no longer any personnel, authorized or otherwise.`,
        },
      ],
    },

    '%SUITE_301': {
      name: 'Gargoyle Building - Suite 301 (Architecture Firm)',
      description: `Westlake Architecture & Design occupied this corner suite—the premium space on the building's highest office floor, with windows on two sides and the best natural light for drafting work. The firm specialized in historic preservation, based on the project boards still leaning against the walls.

Drafting tables are arranged near the windows, their surfaces still holding blueprints weighted down with scale rules and triangles. The drawings show elevations of Pioneer Square buildings, renovation plans for structures that still stand—or stood—throughout the neighborhood.

The irony of a historic preservation firm operating in a building that is itself decaying is probably not lost on whoever isn't here to appreciate it.`,
      x: -18,
      y: 12,
      z: 3,
      population: 0,
      ambientNoise: 1,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_3',
        north: '%SUITE_301_STUDIO',
      },
      sittables: [
        {
          name: 'a drafting stool',
          capacity: 3,
          emptyMsg:
            'Drafting stools sit at tilted tables, positioned for work that requires good light.',
          occupiedMsg: '%s perched on a drafting stool',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'drafting tables',
          aliases: ['tables', 'drafting'],
          description: `Tilted drafting tables arranged along the windows, their surfaces covered with blueprints and drawings. Scale rules, triangles, and drafting pencils are scattered across the paper—the tools of architectural drawing, frozen mid-project. The drawings show Pioneer Square storefronts, elevation views of buildings that the firm was hired to preserve.`,
        },
        {
          prototype: 'describable',
          name: 'project boards',
          aliases: ['boards', 'projects'],
          description: `Foam-core presentation boards lean against the walls, showing completed projects in photographs and renderings. "PIONEER BUILDING RESTORATION - 2019," "SMITH TOWER LOBBY RENOVATION - 2017," "OCCIDENTAL SQUARE IMPROVEMENTS - 2016." The firm worked on the very buildings surrounding this one. The work is finished. The buildings remain.`,
        },
        {
          prototype: 'describable',
          name: 'corner windows',
          aliases: ['windows', 'view'],
          description: `Two walls of windows meet at the corner, offering the best light for drafting work and the best views for contemplating it. On clear days, the firm could see Smith Tower to the east and glimpses of the bay to the west. The architects who worked here could survey the buildings they were hired to preserve.`,
        },
      ],
    },

    '%SUITE_301_STUDIO': {
      name: 'Gargoyle Building - Suite 301 (Model Studio)',
      description: `The model-making studio—where architects transformed blueprints into three-dimensional representations. The room is cluttered with the materials of model-making: foam board, basswood, cork sheets, paint in tiny bottles.

Scale models of buildings line the shelves, some completed, some in progress. A half-finished model sits on the workbench—a Pioneer Square building recognizable by its Romanesque arches, its detail work interrupted mid-construction.

A supply cabinet stands open, its contents organized with the precision of craftspeople who took their work seriously. The precision continues. The work does not.`,
      x: -18,
      y: 13,
      z: 3,
      population: 0,
      ambientNoise: 1,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SUITE_301',
      },
      sittables: [
        {
          name: 'a workbench stool',
          capacity: 2,
          emptyMsg:
            'Stools sit at the model-making workbench, positioned for detailed handwork.',
          occupiedMsg: '%s working at the model bench',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'model workbench',
          aliases: ['workbench', 'bench'],
          description: `A workbench covered with model-making supplies: X-Acto knives, cutting mats, rulers, glue bottles. A half-finished building model sits at the center—a Pioneer Square structure in 1:48 scale, its Romanesque arches carefully cut from foam board, its cornice work incomplete. The model-maker stopped mid-cut.`,
        },
        {
          prototype: 'cabinet',
          name: 'building models',
          aliases: ['models', 'shelves'],
          description: `Shelves of architectural models, each one a miniature building: Pioneer Square storefronts, waterfront developments, a residential tower that was probably never built. The models are dusty but intact, their details still visible—windows, doors, the tiny figures of people who were never real.`,
        },
        {
          prototype: 'cabinet',
          name: 'supply cabinet',
          aliases: ['supplies', 'cabinet'],
          description: `A supply cabinet stands open, revealing the organized materials of model-making: sheets of basswood sorted by thickness, foam board in various colors, bottles of paint arranged by hue. Cork, cardboard, clear acrylic—everything needed to transform paper drawings into three-dimensional reality. The supplies await a craftsperson who won't return.`,
        },
      ],
    },

    '%SUITE_303': {
      name: 'Gargoyle Building - Suite 303 (Vacant Office)',
      description: `This corner office was vacant when everything ended—no furniture, no fixtures, just empty space with good windows. The walls show ghost rectangles where pictures once hung, the paint darker where frames blocked the light.

The emptiness is different from the occupied suites, which are full of abandoned things. This suite was already abandoned, waiting for a tenant who never came. The FOR LEASE sign still hangs in the window, its phone number for a real estate agent who no longer answers.

From here, the view extends north toward downtown, the debris wall visible where Pioneer Square ends and the wasteland begins.`,
      x: -19,
      y: 12,
      z: 3,
      population: 0,
      ambientNoise: 1,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%HALL_3',
        north: '%SUITE_303_BACK',
      },
      sittables: [
        {
          name: 'the window ledge',
          capacity: 2,
          emptyMsg:
            'The wide window ledge offers an improvised seat with a view.',
          occupiedMsg: '%s sitting on the window ledge',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'ghost rectangles',
          aliases: ['walls', 'marks'],
          description: `The walls show the outlines of pictures that once hung here—ghost rectangles where frames blocked light, leaving the covered paint darker than the exposed surfaces around it. The pictures are gone. The ghosts remain, marking where art or photographs or motivational posters once decorated an office that was never occupied.`,
        },
        {
          prototype: 'describable',
          name: 'for lease sign',
          aliases: ['sign', 'lease'],
          description: `A FOR LEASE sign hangs in the window, facing the street three floors below. The sign includes a phone number for the property management company and promises "PREMIUM OFFICE SPACE - HISTORIC BUILDING - EXCELLENT VIEWS." The views are still excellent. The phone number is no longer in service.`,
        },
      ],
    },

    '%SUITE_303_BACK': {
      name: 'Gargoyle Building - Suite 303 (Storage Area)',
      description: `The back room of the vacant suite—used for storage by whoever managed the building, based on the cleaning supplies and maintenance equipment stacked against the walls. The space wasn't meant for tenants; it was the hidden infrastructure that kept the building functioning.

Buckets and mops lean in one corner. A floor polisher, industrial-sized, sits under a dust cover. Boxes of light bulbs, most of them dead now, are stacked on shelves. The supplies for maintaining a building that no one maintains anymore.

A window offers a view north, toward downtown and the debris wall that marks the edge of the habitable zone.`,
      x: -19,
      y: 13,
      z: 3,
      population: 0,
      ambientNoise: 1,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SUITE_303',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'cleaning supplies',
          aliases: ['supplies', 'mops', 'buckets'],
          description: `Cleaning supplies stacked in the corner: mops with heads that have fossilized into rigid shapes, buckets stacked inside each other, bottles of industrial cleaner in brands that stopped being manufactured. The supplies represent maintenance that used to happen. The maintenance stopped. The supplies wait.`,
        },
        {
          prototype: 'describable',
          name: 'floor polisher',
          aliases: ['polisher', 'buffer'],
          description: `An industrial floor polisher under a dust cover, the kind used to maintain the lobby's marble and the hallways' hardwood. The polisher is heavy, professional-grade, designed for buildings that care about their appearance. The building no longer cares. The polisher hasn't moved in years.`,
        },
        {
          prototype: 'describable',
          name: 'light bulbs',
          aliases: ['bulbs', 'boxes'],
          description: `Boxes of replacement light bulbs stacked on metal shelving—fluorescent tubes, incandescent globes, the variety needed to maintain a building with fixtures from multiple eras. Most of the bulbs are dead now, their filaments broken from cold and time. The live ones await sockets that will never be filled.`,
        },
      ],
    },
  },
};
