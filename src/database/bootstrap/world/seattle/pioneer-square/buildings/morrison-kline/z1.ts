// Morrison & Kline - Roof (z=1)
// Flat roof above the maritime law offices

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_HATCH_LOCK': {
      prototype: 'lock',
      name: 'Roof Access Lock',
      description:
        'A heavy-duty padlock securing the roof hatch, installed by building management years ago.',
      difficulty: 5,
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=1) - 2x2 flat roof
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_SW': {
      name: 'Morrison & Kline - Roof (Southwest)',
      description: `The southwest corner of the roof, directly above the partner's office below. The view here looks toward 1st Avenue and the waterfront beyond. From this vantage point, you can see the old piers—the infrastructure that made maritime law a profitable specialty in this city.

The tar paper roofing is in reasonable condition—this building was maintained longer than most. HVAC units cluster near the center of the roof, their fans silent, their compressors cold.`,
      x: -14,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%ROOF_NW',
        east: '%ROOF_SE',
      },
    },

    '%ROOF_SE': {
      name: 'Morrison & Kline - Roof (Southeast)',
      description: `The southeast corner overlooks 1st Avenue South, the traffic that once flowed past now frozen into stillness. The street is empty, the storefronts dark, the pedestrians gone. The view is a study in urban absence.

From here you can see the Pioneer Building to the north, its Richardsonian arches still impressive after a century. The two buildings were contemporaries once, filled with the commerce that made Pioneer Square the heart of Seattle. The commerce stopped. The buildings remain.

A low parapet runs along the roof's edge, brick and mortar that has weathered a century of Seattle rain. The mortar is crumbling in places. No one repairs it.`,
      x: -13,
      y: 7,
      z: 1,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_SW',
        north: '%ROOF_NE',
      },
    },

    '%ROOF_NW': {
      name: 'Morrison & Kline - Roof (Northwest)',
      description: `The northwest corner of the roof, looking toward the waterfront and Elliott Bay. On clear days the Olympic Mountains would be visible across the water. Today is not a clear day. Today the horizon dissolves into grey.

A steel hatch is set into the roof here, its edges sealed with weatherstripping that has dried and cracked. The ladder below leads into the law library. Someone thought roof access was important enough to install properly.

The HVAC equipment is concentrated nearby—compressors, condensers, the mechanical systems that once kept the law offices climate-controlled. The equipment is silent now, its copper piping worth more as scrap than as functional components.

Pigeons have colonized this corner, their droppings white against the grey roof. The cooing is constant, the only sound on a roof where legal arguments once echoed up from below.`,
      x: -14,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 30,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: { room: '%LIBRARY', locks: ['%ROOF_HATCH_LOCK'] },
        south: '%ROOF_SW',
        east: '%ROOF_NE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'HVAC equipment',
          aliases: ['hvac', 'air conditioning', 'compressors'],
          description: `Industrial HVAC equipment clusters on this section of roof—compressor units, condenser coils, sheet metal ductwork. The equipment is high-quality, commercial-grade, installed when the building was last renovated. The copper piping alone is worth thousands in scrap. The weight makes it impractical to remove without equipment. It sits here, valuable but immobile.`,
        },
      ],
    },

    '%ROOF_NE': {
      name: 'Morrison & Kline - Roof (Northeast)',
      description: `The northeast corner offers the best overall view—1st Avenue below, the Pioneer Building to the east, the tangle of streets and alleys that make up Pioneer Square spreading in all directions. The Fabrication Factory is visible to the northwest, its industrial bulk dominating the skyline.

The parapet here has a gap—a few bricks missing where someone or something knocked them loose. The gap offers a view straight down to the alley below, a three-story drop to unforgiving concrete.

An old TV antenna still stands in this corner, its elements rusted, its cable trailing down the side of the building to a window that no longer receives signals. The antenna was obsolete before everything ended. Now it serves as a perch for the pigeons that have claimed the roof.`,
      x: -13,
      y: 8,
      z: 1,
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
          name: 'TV antenna',
          aliases: ['antenna', 'aerial'],
          description: `An old television antenna rises from the corner of the roof, its elements rusted to orange-brown, its cable trailing down the building's exterior. The antenna received broadcast signals once—the evening news, sitcoms, whatever people watched before cable and streaming and the end of everything. The signals stopped broadcasting. The antenna remains, a monument to obsolete technology.`,
        },
      ],
    },
  },
};
