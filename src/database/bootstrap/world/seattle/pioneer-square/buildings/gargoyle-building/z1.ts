// Gargoyle Building - Upper Floors and Roof (z=1)
// Victorian-era offices and roof with gargoyle views

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_HATCH_LOCK': {
      prototype: 'lock',
      name: 'Roof Hatch Lock',
      description:
        'A heavy padlock on the roof hatch, its brass tarnished green with age. The lock is rusted but still functional.',
      difficulty: 4,
    },

    // ═══════════════════════════════════════════════════════════════════
    // UPPER FLOOR (z=1) - OFFICES
    // ═══════════════════════════════════════════════════════════════════

    '%UPPER_HALL': {
      name: 'Gargoyle Building - Upper Hall',
      description: `The upper hallway continues the building's Victorian grandeur, though neglect has taken a heavier toll up here. The pressed tin ceiling shows water damage where the roof has leaked, rust blooming through the decorative pattern. The plaster walls are cracked, the crown molding pulling away in places.

Doors line both sides of the hall—frosted glass transoms bearing suite numbers and the names of businesses that closed decades before everything else did. Some doors stand ajar, revealing empty offices beyond. Others remain locked, their contents preserved by neglect.

At the end of the hall, a narrow ladder leads up through a hatch to the roof. A faded sign reads: ROOF ACCESS - AUTHORIZED PERSONNEL ONLY. The lock on the hatch is rusted but intact.`,
      x: -18,
      y: 12,
      z: 1,
      population: 0,
      ambientNoise: 2,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%STAIRWELL',
        west: '%OFFICE_VACANT',
        up: { room: '%ROOF_NE', locks: ['%ROOF_HATCH_LOCK'] },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'water damage',
          aliases: ['ceiling', 'damage', 'rust'],
          description: `The pressed tin ceiling shows the telltale signs of roof leaks—rust blooming through the decorative pattern in orange-brown stains, the metal warped where water pooled above. Each storm added another layer of damage. The damage accumulated. The repairs never came.`,
        },
        {
          prototype: 'describable',
          name: 'office doors',
          aliases: ['doors', 'transoms'],
          description: `Frosted glass transoms above wooden doors, each one etched with a suite number and a business name: "Suite 201 - Hendricks & Associates," "Suite 203 - Pacific Maritime Insurance." The glass is dusty, the names of enterprises that shuttered long before the world did. Some doors are locked. Some stand ajar, revealing emptiness.`,
        },
      ],
    },

    '%OFFICE_VACANT': {
      name: 'Gargoyle Building - Vacant Office',
      description: `A corner office that once commanded premium rent—two walls of windows looking out over Yesler Way and the alley. The view would have been impressive once. Now it shows a city frozen in abandonment, the street below empty, the buildings across the way dark.

The office is stripped bare except for a massive wooden desk too heavy to move. The desk is scarred with decades of use—coffee rings, cigarette burns, the impressions of pens pressed too hard on paper above. Whoever worked here was a heavy user of this desk. They left it behind.

Dust motes float in the grey light from the windows. The silence is absolute.`,
      x: -19,
      y: 12,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%UPPER_HALL',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'massive desk',
          aliases: ['desk', 'wooden desk'],
          description: `A desk built to last centuries—solid oak, probably weighed five hundred pounds when it was new and weighs more now with the accumulated grime of a century. The surface is a map of use: coffee rings, cigarette burns, the impressions of ten thousand documents pressed too hard. A brass nameplate sits in a holder, the name worn away by thumbs that polished it unconsciously over decades.`,
        },
        {
          prototype: 'describable',
          name: 'corner windows',
          aliases: ['windows', 'view'],
          description: `Two walls of windows meet at the corner, offering a panoramic view that once justified the premium rent. The glass is grimy but intact, looking out over Yesler Way to the north and the alley to the west. The street below is empty. The buildings across are dark. The view persists. The viewers are gone.`,
        },
      ],
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=1) - Outdoor 2x2 area with gargoyles
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_NE': {
      name: 'Gargoyle Building - Roof (Northeast)',
      description: `The northeast corner of the roof, where a steel hatch opens up from the building below. The roofing is old—tar paper over wooden decking, patched a dozen times in a dozen different ways. Some patches are professional. Others are clearly amateur, applied in emergencies that became permanent.

From here, Smith Tower rises to the southeast, its white terracotta stained grey by decades of Seattle rain. The Chinese guardian figures at the corners are visible from here, watching over a city that has mostly forgotten them.

A stone gargoyle perches on the parapet at the corner, one of four that give the building its name. This one depicts something between a dog and a demon, its face worn smooth by a century of weather. Rain has carved channels in the stone. The expression beneath is still hungry.`,
      x: -17,
      y: 13,
      z: 2,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: { room: '%UPPER_HALL', locks: ['%ROOF_HATCH_LOCK'] },
        west: '%ROOF_NW',
        south: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'dog gargoyle',
          aliases: ['gargoyle', 'grotesque', 'stone figure'],
          description: `A stone gargoyle crouches on the parapet, part dog, part demon, all hunger. The carving is Victorian—detailed, slightly grotesque, designed to ward off evil spirits by being more frightening than whatever might approach. A century of Seattle rain has worn the features smooth, but the expression remains legible. The gargoyle is patient. It has been watching for a hundred years. It will watch for a hundred more.`,
        },
      ],
    },

    '%ROOF_NW': {
      name: 'Gargoyle Building - Roof (Northwest)',
      description: `The northwest corner of the roof, looking out over the grid collision where Pioneer Square meets downtown. Yesler Way runs below, the street that was once the skid road for timber sliding down to the mills. The view north shows the debris wall that seals Pioneer Square from the rest of the city—collapsed buildings that have become terrain.

The roofing here is in worse shape than the rest, the tar paper peeling up at the edges, exposing the wooden decking beneath. Rain pools in the low spots. The wood is soft with rot in places.

Another gargoyle watches from this corner—an eagle or something like it, its wings folded, its beak open in a silent scream. The stone is weathered, but the expression of rage or hunger or warning persists.`,
      x: -18,
      y: 13,
      z: 2,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_NE',
        south: '%ROOF_SW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'eagle gargoyle',
          aliases: ['gargoyle', 'eagle', 'bird'],
          description: `An eagle-like gargoyle perches at the corner, wings folded tight against its body, beak open in a silent scream. The carving captures something between nobility and menace—the bird of prey aspect emphasized, the eyes deep-set and predatory. Lichen grows in the carved feathers, green against grey stone. The eagle doesn't mind. It has other concerns.`,
        },
      ],
    },

    '%ROOF_SW': {
      name: 'Gargoyle Building - Roof (Southwest)',
      description: `The southwest corner offers the best view of Elliott Bay, grey water stretching to the horizon where it merges with grey sky. The waterfront is visible below—the crumbling seawall, the old piers, the water that claims a little more of the city each year.

The parapet here is crumbling, the mortar between stones failing, a few stones already fallen to the street far below. Someone should repair it. No one will repair it. The decay continues on its schedule.

The gargoyle on this corner is the strangest of the four—a face without a body, emerging from the stone as if trying to escape. The features are almost human, but twisted, the proportions wrong in ways that are hard to articulate. It watches the bay. It has been watching for a hundred years.`,
      x: -18,
      y: 12,
      z: 2,
      population: 0,
      ambientNoise: 35,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NW',
        east: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'face gargoyle',
          aliases: ['gargoyle', 'face', 'grotesque'],
          description: `A face emerges from the stone—no body, just a head pushing through the parapet as if trying to escape the building itself. The features are almost human but wrong: the eyes too wide, the mouth too long, the proportions shifted in ways that create unease without being identifiably monstrous. The sculptor was skilled. The sculptor may have been disturbed.`,
        },
      ],
    },

    '%ROOF_SE': {
      name: 'Gargoyle Building - Roof (Southeast)',
      description: `The southeast corner commands the best overall view—Smith Tower to the east, the bay to the west, Yesler Way below, the expanse of Pioneer Square spreading south. On a clear day, you could see the mountains. Today is not a clear day. Today the horizon dissolves into grey.

The roofing here is surprisingly solid, the tar paper intact, evidence that water drains properly from this corner. Small victories. The parapet is sturdy, the stones mortared tight.

The fourth gargoyle—the last of the set—is a serpent coiled around a sphere, its mouth open to show fangs worn smooth by weather. The sphere might be the world. The serpent might be time. Victorian sculptors loved their symbolism.`,
      x: -17,
      y: 12,
      z: 2,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NE',
        west: '%ROOF_SW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'serpent gargoyle',
          aliases: ['gargoyle', 'serpent', 'snake'],
          description: `A serpent coils around a stone sphere, its body wrapping three times before its head rises to show worn fangs. The sphere might represent the world, the serpent time consuming it—or perhaps the snake represents wisdom guarding knowledge. Victorian symbolism allowed for multiple interpretations. The sculptor left no notes. The serpent keeps its own counsel.`,
        },
      ],
    },
  },
};
