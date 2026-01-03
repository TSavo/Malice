// Redux Vintage - Roof (z=1)
// Flat roof above the vintage clothing store

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_HATCH_LOCK': {
      prototype: 'lock',
      name: 'Roof Hatch Lock',
      description:
        'A simple padlock on the roof hatch, the kind bought at any hardware store.',
      difficulty: 3,
    },

    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=1) - 2x2 flat roof
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_NW': {
      name: 'Redux - Roof (Northwest)',
      description: `The northwest corner of the roof, a flat expanse of aging tar paper and accumulated debris. Fallen leaves have gathered in the corners, decomposing into dark mulch. A plastic lawn chair—sun-bleached and cracked—suggests someone used to take breaks up here. The view northwest shows the taller buildings of Pioneer Square, their Victorian facades rising against grey sky.

A steel hatch is set into the roof, its frame rusted but solid. The ladder below leads into the storage room. Someone maintained this access once—building code compliance, or maybe just a preference for fresh air during inventory.

Cigarette butts litter the area around the chair, a hundred smoke breaks preserved in filter tips. The brand is unidentifiable, the filters brown with age.`,
      x: -16,
      y: 5,
      z: 1,
      population: 0,
      ambientNoise: 25,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: { room: '%STORAGE', locks: ['%ROOF_HATCH_LOCK'] },
        south: '%ROOF_SW',
        east: '%ROOF_NE',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'plastic lawn chair',
          aliases: ['chair', 'lawn chair'],
          description: `A plastic lawn chair, the kind sold at discount stores for backyard barbecues. The plastic has sun-bleached from green to grey, cracks spreading across the seat. Someone sat here regularly—the spot is surrounded by cigarette butts—watching the city or escaping the vintage smell of the shop below. The sitter is gone. The chair remains.`,
        },
      ],
    },

    '%ROOF_NE': {
      name: 'Redux - Roof (Northeast)',
      description: `The northeast corner offers a view of S. Washington Street and the commercial district beyond. From up here, the awnings and storefronts look smaller, the bustle that once filled these streets now frozen into stillness.

The roofing here shows more wear than the rest—patches over patches, the layers of repair creating an uneven surface that pools water. The drainage is inadequate. The puddles are permanent.

An old satellite dish is mounted to a pole here, its receiver aimed at a sky that no longer sends signals. The dish is rusted, its cable cut and dangling. Someone tried to get better reception once. The effort outlived its purpose.`,
      x: -15,
      y: 5,
      z: 1,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_NW',
        south: '%ROOF_SE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'satellite dish',
          aliases: ['dish', 'antenna'],
          description: `A satellite dish mounted on a rusted pole, its receiver aimed at a sky that stopped broadcasting years ago. The dish is perhaps three feet across, the white plastic yellowed and cracked. The cable has been cut—salvaged for copper, probably—the end dangling loose. The dish still points at its designated orbital slot. The satellite is probably still up there, circling uselessly.`,
        },
      ],
    },

    '%ROOF_SW': {
      name: 'Redux - Roof (Southwest)',
      description: `The southwest corner looks toward 1st Avenue and the waterfront beyond. On clear days the water would glitter. Today is grey. The water is grey. Everything is grey.

The parapet here is lower than the rest—someone removed bricks, or they fell, or time and weather wore them away. The gap offers an unobstructed view down to the street, three stories of empty air to unforgiving concrete.

A tangled mass of extension cords and Christmas lights lies in a heap near the parapet. Someone decorated the roofline once, probably for the holidays. The decorations came down. They were never rehung.`,
      x: -16,
      y: 4,
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
      objects: [
        {
          prototype: 'describable',
          name: 'tangled lights',
          aliases: ['christmas lights', 'lights', 'extension cords'],
          description: `A hopeless tangle of extension cords and Christmas lights, the kind of knot that happens when decorations are stuffed into storage without care. Bulbs in multiple colors—red, green, white, blue—are mixed with orange extension cords in a mass that would take hours to untangle. Someone gave up. The tangle waits for patience that never came.`,
        },
      ],
    },

    '%ROOF_SE': {
      name: 'Redux - Roof (Southeast)',
      description: `The southeast corner of the roof, the most exposed to weather and the least maintained. The tar paper is peeling here, the wooden decking visible beneath, soft with rot in places. Step carefully. The structure is sound but the surface is not.

The view east shows the backs of buildings—fire escapes, dumpsters, the unglamorous infrastructure that storefronts hide from customers. The alleys between buildings form a maze that once served commerce and now serves nothing.

Graffiti covers the parapet, tags in spray paint that accumulated over years. Some are legible—KAZE, SIREN, VOID. Others have been painted over so many times they've become abstract, layers of ego and territory reduced to texture.`,
      x: -15,
      y: 4,
      z: 1,
      population: 0,
      ambientNoise: 20,
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
          name: 'graffiti tags',
          aliases: ['graffiti', 'tags', 'spray paint'],
          description: `Spray-painted tags cover the parapet, layers of ego accumulated over years. KAZE in blue. SIREN in silver. VOID in black that someone tried to cover with grey paint. The styles vary—bubble letters, sharp angles, illegible scrawls—representing multiple artists, multiple years, multiple claims to this forgotten corner. The claims overlap. The territory belongs to no one now.`,
        },
      ],
    },
  },
};
