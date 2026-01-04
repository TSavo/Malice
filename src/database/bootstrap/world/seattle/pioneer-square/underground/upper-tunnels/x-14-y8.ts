// West Spine passage - with shaft access to Morrison & Kline basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The passage continues through what was once the ground floor of a commercial building. Fragments of the original structure remain visible: a doorframe leading nowhere, window wells bricked over from the inside, the ghost of a transom where light once entered. The building above was demolished long ago, but its foundation persists underground, walls within walls.

The floor is uneven here, brick giving way to packed earth in places where the original surface was never properly laid. The transition is deliberate—the 1889 builders saved materials where they could, knowing that buried floors would never need to impress anyone. They were wrong about that, but they couldn't have known.

Water stains trace vertical lines down the walls, mapping the paths that moisture follows from the street above. The stains are darkest near the ceiling. The leaks are old, persistent, accepted.

A narrow shaft rises in the northwest corner, its metal rungs disappearing into darkness above. The shaft is newer than the passage—installed sometime in the last century, providing access to the building above for those who knew where to look.`,
      x: -14,
      y: 8,
      z: -2,
      population: 0,
      ambientNoise: 10,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%SHAFT',
      },
    },

    '%SHAFT': {
      name: 'Maintenance Shaft',
      description: `A vertical shaft rises from the underground passage, its walls lined with old brick reinforced by steel bands. Metal rungs are bolted into the wall, forming a ladder that ascends toward a hatch in the ceiling. The rungs are worn smooth in the center—this shaft has seen regular use over the decades.

The air moves here, a faint draft pulling upward toward the building above. Sound travels strangely in the confined space—footsteps from below arrive before footsteps from above, the acoustic geometry confusing expectations.

The hatch at the top is heavy steel, installed to look like a floor drain from above. Those who know about this shaft know to look for the drain that isn't quite a drain.`,
      x: -14,
      y: 8,
      z: -1.5,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: '%PASSAGE',
        up: {
          to: 'buildings/morrison-kline/z-1.ts:%MECHANICAL',
          description: 'A hatch leads up into the building above',
        },
      },
    },
  },
};
