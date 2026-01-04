// Second Chance Thrift - Roof (z=2)
// Flat roof with rooftop access
// Views of Pioneer Square neighborhood

export const building = {
  name: 'Second Chance Thrift',
  x: -10,
  y: 8,
  width: 3,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // ROOF (z=2) - OUTDOOR AREA
    // ═══════════════════════════════════════════════════════════════════

    '%ROOF_SW': {
      name: 'Second Chance Building - Roof (Southwest)',
      description: `The southwest corner of the roof is where the stairwell exits, a metal door opening onto tar paper and gravel. The roof is flat, functional, not designed for human use but used anyway—a folding lawn chair sits near the stairwell door, positioned to face west toward glimpses of Elliott Bay between buildings.

HVAC equipment hums in the corner, still functioning, still cooling apartments that may or may not be occupied. The machinery is the kind that runs forever or until it doesn't, no maintenance possible, no parts available.

The parapet is low here, barely knee-high, offering minimal protection from the two-story drop to the alley below. A pigeon coop sits against the parapet—old, abandoned, its wire mesh rusted, its former occupants long departed.`,
      x: -12,
      y: 6,
      z: 2,
      population: 0,
      ambientNoise: 18,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: 'z1.ts#LANDING',
        east: '%ROOF_SE',
        north: '%ROOF_NW',
      },
      sittables: [
        {
          name: 'the lawn chair',
          capacity: 1,
          emptyMsg:
            'A faded lawn chair faces west, positioned for sunset views through the gap between buildings.',
          occupiedMsg: '%s sitting in the rooftop lawn chair',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'HVAC unit',
          aliases: ['hvac', 'ac'],
          description: `An HVAC unit on a concrete pad, its housing dented and weathered but its fan still spinning. The unit serves the apartments below, maintaining climate control for residents who are no longer present. The electricity comes from somewhere. The maintenance comes from nowhere. The unit runs on.`,
        },
        {
          prototype: 'describable',
          name: 'pigeon coop',
          aliases: ['coop', 'cage'],
          description: `An old pigeon coop against the parapet, its wire mesh rusted, its wooden frame weathered grey. Someone kept pigeons here once—homing pigeons, probably, given the setup. The pigeons are gone, released or escaped or simply departed when their keeper stopped coming. The coop is a monument to a hobby that ended.`,
        },
      ],
    },

    '%ROOF_SE': {
      name: 'Second Chance Building - Roof (Southeast)',
      description: `The southeast corner of the roof overlooks S. Washington Street, the thrift store's entrance visible below. From here you can see the mannequins in the window, their poses frozen, their blank faces staring out at a street that no longer brings customers.

A clothesline stretches across this section of roof, its cord sagging, a few clothespins still clipped to it. Someone dried laundry up here when the weather allowed. The laundry is gone. The clothesline waits.

The view east shows the neighborhood spreading toward the waterfront, rooftops at various heights, the urban landscape of Seattle's oldest district. Water towers and antenna masts punctuate the skyline, the infrastructure of a city that was built before zoning.`,
      x: -11,
      y: 6,
      z: 2,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%ROOF_SW',
        north: '%ROOF_NE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'clothesline',
          aliases: ['line', 'laundry'],
          description: `A clothesline strung between poles, its cord sagging from years of weight and weather. A few plastic clothespins remain clipped to the line, waiting for laundry that won't arrive. The clothesline is practical—rooftop drying works when Seattle grants sun. The sun is infrequent. The hope is persistent.`,
        },
        {
          prototype: 'describable',
          name: 'street view',
          aliases: ['view', 'street'],
          description: `Looking down, you can see the thrift store's entrance below—the window display with its mannequins, the door with its CLOSED sign, the sidewalk where customers once walked. The mannequins stare out at the street with their blank faces. From up here, they're almost invisible. Almost.`,
        },
      ],
    },

    '%ROOF_NE': {
      name: 'Second Chance Building - Roof (Northeast)',
      description: `The northeast corner of the roof is the most exposed, with views north toward the blocks where Pioneer Square gives way to other neighborhoods. Smith Tower is visible from here, its white spire rising above the surrounding buildings, the Continuum logo gleaming on its facade.

A fire escape descends from this corner, iron stairs switchbacking down to the alley. The fire escape is rusted but probably functional, the kind of Victorian construction that was built to last. The final ladder is latched in the raised position.

Someone has set up a makeshift garden here: pots arranged in a cluster, their contents long since dead, dried stalks and desiccated soil. The gardener tried to grow something—herbs, maybe, or tomatoes. The growing season ended. The pots remain.`,
      x: -10,
      y: 7,
      z: 2,
      population: 0,
      ambientNoise: 12,
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
          name: 'fire escape',
          aliases: ['escape', 'stairs', 'ladder'],
          description: `An iron fire escape descends the building's northeast corner, switchbacking down to the alley two stories below. The ironwork is rusted but structurally sound, the construction of an era when builders overengineered everything. The final ladder section is latched up, requiring release from above.`,
        },
        {
          prototype: 'describable',
          name: 'dead garden',
          aliases: ['garden', 'pots', 'plants'],
          description: `A cluster of pots arranged on the roof, their contents dead and desiccated. Someone tried to garden up here: clay pots, plastic planters, even a wooden crate filled with soil. The plants are unidentifiable now—dried stalks that might have been tomatoes, desiccated leaves that might have been basil. The growing ended. The containers remain.`,
        },
        {
          prototype: 'describable',
          name: 'Smith Tower view',
          aliases: ['tower', 'view'],
          description: `Smith Tower is visible to the northeast, its white terracotta spire rising above the surrounding rooftops. The Continuum logo gleams on the building's facade, a beacon of the new order. The tower was Seattle's tallest when it was built. It's still impressive now, watching over the neighborhood from its Art Deco heights.`,
        },
      ],
    },

    '%ROOF_NW': {
      name: 'Second Chance Building - Roof (Northwest)',
      description: `The northwest corner of the roof is sheltered by the taller building next door, its brick wall rising another story and blocking the wind. The shadow keeps this corner cool even on sunny days.

Graffiti covers the parapet on this side—tags accumulated over years of rooftop access. The building next door is tagged too, as far up as painters could reach from this roof. KRONOS. SEAZ. PHANTOM. The names of artists who claimed the space.

A bucket collects rainwater here, positioned under a gutter that drains from the higher roof. The bucket is half-full of stagnant water, mosquito larvae visible in the murk. The collection was intentional. The water's current state is not.`,
      x: -12,
      y: 7,
      z: 2,
      population: 0,
      ambientNoise: 10,
      lighting: 70,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ROOF_NE',
        south: '%ROOF_SW',
      },
      sittables: [
        {
          name: 'an overturned bucket',
          capacity: 1,
          emptyMsg:
            'An overturned plastic bucket serves as an improvised stool in the shadowed corner.',
          occupiedMsg: '%s perched on the overturned bucket',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'graffiti wall',
          aliases: ['graffiti', 'tags'],
          description: `The parapet and adjacent building wall are covered in graffiti—years of tags layered over each other, the visual history of rooftop access. KRONOS in bubble letters. SEAZ in angular throws. PHANTOM in dripping silver. The artists competed for space, covered each other's work, created a palimpsest of urban claiming.`,
        },
        {
          prototype: 'describable',
          name: 'rain bucket',
          aliases: ['bucket', 'water'],
          description: `A five-gallon bucket positioned under a gutter drainpipe, collecting rainwater from the taller roof next door. The bucket is half-full of stagnant water, its surface covered with a film that moves when you look too closely. Someone placed this here to collect water. The collection succeeded. The intended use failed.`,
        },
      ],
    },
  },
};
