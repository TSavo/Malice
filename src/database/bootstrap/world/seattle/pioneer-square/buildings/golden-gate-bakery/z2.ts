// Golden Gate Bakery - Roof (z=2)
// Flat roof with HVAC equipment and a view of the International District
// The photographer came up here to smoke between sessions

export const building = {
  name: 'Golden Gate Bakery',
  x: 5,
  y: -12,
  width: 1,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2)
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF': {
      name: 'Golden Gate Bakery - Roof',
      description: `The flat roof of the bakery building has weathered fifty-five years of Seattle rain. The tar paper is cracked and peeling, exposing the underlayment in places, pooling water in others that never quite drains. HVAC equipment rusts in one corner, the exhaust vents from the bakery ovens and photo studio lights both silent and still.

A folding chair—aluminum frame, nylon webbing rotted away—sits near the roof edge facing south. Cigarette butts in a coffee can rusted through at the bottom mark this as someone's smoke break spot. The photographer came up here between sessions, probably. The breaks ended with The Burning.

From here, the International District spreads south toward the stadiums—or where the stadiums were. The debris wall is visible, the collapsed infrastructure that seals off the southern reaches of the city. Other rooftops are visible at various heights, some intact, some collapsed, the skyline of a neighborhood that was densely built before the war and densely abandoned after.

A faded sign is painted on the roof surface: "GOLDEN GATE BAKERY" with an arrow, visible to aircraft that no longer fly overhead.`,
      x: 5,
      y: -12,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: 'z1.ts#MAIN_STUDIO',
      },
      sittables: [
        {
          name: 'chair frame',
          capacity: 1,
          emptyMsg:
            'The aluminum frame of a folding chair, its nylon webbing long since rotted away.',
          occupiedMsg: '%s perched on the chair frame',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'rusted coffee can',
          aliases: ['can', 'ashtray', 'cigarettes'],
          description: `A large coffee can rusted through at the bottom, filled with the remains of cigarettes smoked decades ago. The butts have long since dissolved to fiber and ash, washed away by countless rains. The can remains, a monument to smoke breaks that ended with The Burning. The brand on the can is unreadable.`,
        },
        {
          prototype: 'describable',
          name: 'dead HVAC',
          aliases: ['hvac', 'vents', 'equipment'],
          description: `Rooftop HVAC equipment, the exhaust systems for the bakery ovens below and the photo studio lights. The fans are frozen with rust, the housings dented by debris and weather. The system kept the bakery cool during summer baking and the studio comfortable during portrait sessions. It keeps nothing now. The building breathes on its own.`,
        },
        {
          prototype: 'describable',
          name: 'painted sign',
          aliases: ['sign', 'arrow', 'advertisement'],
          description: `"GOLDEN GATE BAKERY" painted in faded red letters on the roof surface, with an arrow pointing down toward the street entrance. The sign was meant for aircraft—helicopters delivering executives to nearby buildings, news choppers covering events at the stadiums. No aircraft fly over the International District now. The sign advertises to clouds.`,
        },
        {
          prototype: 'describable',
          name: 'rooftop view',
          aliases: ['view', 'district', 'panorama'],
          description: `The roof offers a view of the International District's rooftops, a dense patchwork of different heights and conditions. To the south, the debris wall is visible—collapsed buildings and infrastructure sealing off the stadium district. To the north, other commercial buildings of Chinatown rise at various levels. The Space Needle should be visible in the distance, but something blocks the view. The city was built vertically once. Gravity has been working on it for fifty-five years.`,
        },
        {
          prototype: 'describable',
          name: 'pooled water',
          aliases: ['water', 'puddles', 'rain'],
          description: `Depressions in the deteriorating roof surface collect rainwater that never quite drains. The water is stagnant, hosting mosquito larvae in summer, freezing to ice in winter. The tar paper was meant to shed water. Fifty-five years have created low spots where water pools and slowly seeps through to the studio below.`,
        },
      ],
    },
  },

  postProcessors: [],
};
