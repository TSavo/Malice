// Gargoyle Building - Roof (z=4)
// Victorian rooftop with the four gargoyles that give the building its name
// Outdoor 2x2 area with views of Pioneer Square

export const building = {
  name: 'Gargoyle Building',
  x: -18,
  y: 12,
  width: 2,
  height: 2,
  floors: 5,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=4) - OUTDOOR AREA WITH GARGOYLES
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_SE': {
      name: 'Gargoyle Building - Roof (Southeast)',
      description: `The southeast corner of the roof commands the best overall view—Smith Tower rises to the east, the bay glimmers to the west, Yesler Way runs below, and Pioneer Square spreads south. On clear days, you could see the mountains. Today is not a clear day. Today the horizon dissolves into grey.

The roofing here is surprisingly solid, the tar paper intact where it matters, evidence that water drains properly from this corner. Small victories in a building losing its war with entropy.

A stone serpent coils around a sphere at this corner—the last of the four gargoyles, its mouth open to show fangs worn smooth by weather. The sphere might be the world. The serpent might be time. Victorian sculptors loved their symbolism.`,
      x: -18,
      y: 12,
      z: 4,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: 'z3.ts#HALL_3',
        north: '%ROOF_NE',
        west: '%ROOF_SW',
      },
      sittables: [
        {
          name: 'the roof parapet',
          capacity: 2,
          emptyMsg:
            'The stone parapet offers a place to sit with a view of Pioneer Square below.',
          occupiedMsg: '%s perched on the roof parapet',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'serpent gargoyle',
          aliases: ['gargoyle', 'serpent', 'snake'],
          description: `A serpent coils around a stone sphere, its body wrapping three times before its head rises to show worn fangs. The sphere might represent the world, the serpent time consuming it—or perhaps the snake represents wisdom guarding knowledge. Victorian symbolism allowed for multiple interpretations. The sculptor left no notes. The serpent keeps its own counsel.`,
        },
        {
          prototype: 'describable',
          name: 'city view',
          aliases: ['view', 'vista'],
          description: `From the southeast corner, the view encompasses much of Pioneer Square and beyond. Smith Tower rises to the east, its white terracotta stained grey by rain. The waterfront lies to the west, the bay visible between buildings. To the south, the neighborhood spreads toward the stadiums. The perspective is comprehensive—a survey of a city that was alive and now persists in different forms.`,
        },
      ],
    },

    '%ROOF_NE': {
      name: 'Gargoyle Building - Roof (Northeast)',
      description: `The northeast corner of the roof looks toward downtown—or what was downtown, before the debris wall separated Pioneer Square from the rest of the city. Smith Tower is visible from here, its white terracotta spire the tallest thing for blocks. The Chinese guardian figures at the tower's corners are visible from this angle, ancient faces watching over a modern ruin.

The skylight that illuminates the stairwell below is here, a square of grimy glass set into the roof. The glass is thick with accumulated filth, but still intact. A fall through it would be four stories straight down.

A stone gargoyle perches on the parapet at this corner—something between a dog and a demon, its face worn smooth by a century of Seattle rain. The expression beneath remains hungry.`,
      x: -18,
      y: 11,
      z: 4,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ROOF_SE',
        west: '%ROOF_NW',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'dog gargoyle',
          aliases: ['gargoyle', 'grotesque', 'demon'],
          description: `A stone gargoyle crouches on the parapet, part dog, part demon, all hunger. The carving is Victorian—detailed, slightly grotesque, designed to ward off evil spirits by being more frightening than whatever might approach. A century of Seattle rain has worn the features smooth, but the expression remains legible. The gargoyle is patient. It has been watching for a hundred years.`,
        },
        {
          prototype: 'furniture',
          name: 'skylight',
          aliases: ['glass', 'light'],
          description: `A skylight set into the roof, thick glass in a steel frame, illuminating the stairwell four stories below. The glass is clouded with decades of grime, bird droppings, and the detritus of a city that no longer cleans. The skylight is structurally sound—stepping on it would probably be fine. Probably.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'smith tower view',
          aliases: ['view', 'tower', 'downtown'],
          description: `Smith Tower dominates the eastern view—its white terracotta stained grey by decades of Seattle rain, its Chinese guardian figures visible at the corners, watching over the city with ancient eyes. The tower was the tallest building west of the Mississippi when it was built. Now it's just the tallest building still standing in Pioneer Square. Continuum Banking operates from inside.`,
        },
      ],
    },

    '%ROOF_NW': {
      name: 'Gargoyle Building - Roof (Northwest)',
      description: `The northwest corner looks toward the collision point where Pioneer Square's grid meets downtown's diagonal streets. The debris wall is visible to the north—collapsed buildings that have become terrain, marking the edge of the habitable zone. Yesler Way runs below, the street that was once the skid road for timber sliding down to the mills.

The roofing here is in worse shape than the rest, tar paper peeling up at the edges, exposing the wooden decking beneath. Rain pools in the low spots. The wood is soft with rot in places. Someone should repair it. No one will.

An eagle-like gargoyle watches from this corner—wings folded, beak open in a silent scream. The stone is weathered, but the expression of rage or hunger or warning persists.`,
      x: -19,
      y: 11,
      z: 4,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_NE',
        south: '%ROOF_SW',
      },
      sittables: [
        {
          name: 'a rusted bench',
          capacity: 2,
          emptyMsg:
            'A metal bench, rusted but sturdy, faces north toward downtown.',
          occupiedMsg: '%s sitting on the rusted bench',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'eagle gargoyle',
          aliases: ['gargoyle', 'eagle', 'bird'],
          description: `An eagle-like gargoyle perches at the corner, wings folded tight against its body, beak open in a silent scream. The carving captures something between nobility and menace—the bird of prey aspect emphasized, the eyes deep-set and predatory. Lichen grows in the carved feathers, green against grey stone. The eagle doesn't mind. It has other concerns.`,
        },
        {
          prototype: 'describable',
          name: 'debris wall view',
          aliases: ['view', 'debris', 'wall'],
          description: `The debris wall is visible to the north—a barrier of collapsed buildings that separates Pioneer Square from whatever lies beyond. The wall wasn't built; it happened, when structures fell and no one cleared them. Now it serves as a boundary, marking where the habitable zone ends and the wasteland begins. The view is sobering from up here.`,
        },
        {
          prototype: 'describable',
          name: 'rotting roof',
          aliases: ['roof', 'damage', 'rot'],
          description: `The tar paper roofing peels up at the edges here, exposing the wooden decking beneath to rain and rot. The wood is soft in places, dangerous to trust. Water pools in low spots during storms, accelerating the decay. The building is losing this battle slowly, one leak at a time.`,
        },
      ],
    },

    '%ROOF_SW': {
      name: 'Gargoyle Building - Roof (Southwest)',
      description: `The southwest corner offers the best view of Elliott Bay—grey water stretching to the horizon where it merges with grey sky. The waterfront is visible below, the old piers rotting, the seawall crumbling, the water claiming a little more of the city each year. Ships still come sometimes, following the deep channel into the harbor.

The parapet here is crumbling, mortar failing between the stones, a few blocks already fallen to the street far below. The instability creates both danger and opportunity—an escape route if you're desperate enough to use it.

The strangest of the four gargoyles watches from this corner—a face without a body, emerging from the stone as if trying to escape. The features are almost human, but wrong in ways that create unease.`,
      x: -19,
      y: 12,
      z: 4,
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
        {
          prototype: 'describable',
          name: 'crumbling parapet',
          aliases: ['parapet', 'wall', 'crumbling'],
          description: `The parapet wall is crumbling here, mortar failing between the stones, gaps opening where water has frozen and thawed through countless winters. A few stones have already fallen to the street four floors below. The instability is dangerous—and might be useful to someone desperate for an unconventional exit.`,
        },
        {
          prototype: 'describable',
          name: 'bay view',
          aliases: ['view', 'bay', 'water'],
          description: `Elliott Bay stretches to the west, grey water meeting grey sky at a horizon that's hard to determine. The waterfront is visible below—rotting piers, crumbling seawall, the gradual victory of water over land. Ships still use the deep channel, their silhouettes visible when they call. The bay is patient. It was here before Seattle. It will be here after.`,
        },
      ],
    },
  },
};
