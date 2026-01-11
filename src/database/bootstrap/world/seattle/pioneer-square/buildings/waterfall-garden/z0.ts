// Waterfall Garden Park - Ground Level (z=0)
// Private pocket park built in 1978 on the site of the original UPS headquarters
// 22-foot man-made waterfall in a small urban oasis

export const building = {
  name: 'Waterfall Garden Park',
  x: -6,
  y: -4,
  width: 2,
  height: 2,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%GATE_LOCK': {
      prototype: 'lock',
      name: 'Garden Gate Lock',
      description:
        'A simple padlock on the wrought iron gate. The mechanism is corroded from years of exposure to the waterfall mist.',
      difficulty: 2,
    },
    '%GARDEN_GATE': {
      prototype: 'door',
      name: 'Wrought Iron Gate',
      description:
        'An ornate wrought iron gate with climbing ivy patterns worked into the metalwork. A bronze plaque reads WATERFALL GARDEN PARK - OPEN TO THE PUBLIC. The gate stands slightly ajar, its hinges rusted in place.',
      locked: false,
      open: true,
      locks: ['%GATE_LOCK'],
      material: 'metal',
      durability: 80,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND LEVEL (z=0) - THE PARK
    // ═══════════════════════════════════════════════════════════════════

    '%ENTRANCE': {
      name: 'Waterfall Garden - Entrance',
      description: `A narrow passage between two brick buildings opens into something unexpected: a pocket park, barely visible from the street, hidden like a secret. Wrought iron gates mark the threshold, their ornate scrollwork depicting vines and leaves. A bronze plaque announces WATERFALL GARDEN PARK, the letters verdigrised to the color of old copper roofs.

The sound hits before the sight does—the rush and crash of falling water, impossibly loud for this urban canyon. Mist drifts through the entrance, carrying the mineral smell of wet stone. The air is cooler here, damper, a microclimate created by the artificial falls that dominate the space beyond.

Ivy covers the brick walls on either side, so thick in places that the underlying masonry has vanished entirely. The vegetation is overgrown now, untrimmed, but still alive—a pocket of persistent green in the grey city.`,
      x: -6,
      y: -4,
      z: 0,
      population: 0,
      ambientNoise: 45,
      lighting: 60,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: {
          to: '2nd-ave-s/y-5.ts',
          description: 'The narrow passage leads back to 2nd Ave S',
          door: '%GARDEN_GATE',
        },
        west: '%WATERFALL',
        north: '%SEATING',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'bronze plaque',
          aliases: ['plaque', 'sign'],
          description: `A bronze plaque set into the brick wall, its surface green with verdigris. The text reads:

WATERFALL GARDEN PARK
Dedicated 1978

Built on the site where United Parcel Service
was founded in 1907 by Jim Casey

"A place of peace in the heart of the city"

The corporate legacy seems quaint now—a delivery company that grew into a global logistics empire, commemorated with a waterfall. The waterfall outlasted the deliveries.`,
        },
        {
          prototype: 'furniture',
          name: 'ivy-covered walls',
          aliases: ['ivy', 'vines', 'walls'],
          description: `English ivy covers the brick walls, decades of growth forming a living curtain. The vines have thickened to the diameter of small branches in places, woody and permanent. Without maintenance, the ivy has gone feral—climbing higher, spreading wider, sending exploratory tendrils across the iron gates and up toward the rooflines above.`,
          boltedDown: true,
        },
      ],
    },

    '%WATERFALL': {
      name: 'Waterfall Garden - The Falls',
      description: `The waterfall dominates everything—a 22-foot cascade tumbling over artificial boulders into a pool of churning foam. The sound is enormous, a white noise that swallows conversation and thought alike. You have to shout to be heard. You don't want to shout. The noise enforces a meditative silence.

The boulders are granite, imported from somewhere and arranged to look natural, though nothing about this place is natural. An architect designed this cascade to provide urban workers with a moment of wilderness between meetings. The workers are gone. The wilderness persists, more authentic now than it was when maintained.

Mist rises from the impact point, coating everything within twenty feet in perpetual dampness. Moss and fern have colonized every crevice in the stone. The pump system still functions—someone rigged it to run indefinitely, or it's drawing from groundwater, or the city's infrastructure maintains itself now in ways nobody fully understands.`,
      x: -7,
      y: -4,
      z: 0,
      imageOnDisk: 'occidental-ave-s-x-7-y-4-z0.png',
      population: 0,
      ambientNoise: 80,
      lighting: 50,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%ENTRANCE',
        north: '%POOL',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'waterfall',
          aliases: ['falls', 'cascade', 'water'],
          description: `Twenty-two feet of falling water, a manufactured cascade that has become genuinely wild. The original architects imported granite boulders and arranged them to simulate a mountain stream. Decades of mineral deposits have crusted the stone with white calcium streaks. Moss fills every joint between rocks. Ferns sprout from cracks that weren't there when the park was built.

The pump that drives the waterfall hums somewhere below, hidden in the infrastructure. Whether anyone maintains it or whether it runs on systems that maintain themselves—the question seems academic. The water falls. The falls continue.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'mist',
          aliases: ['spray', 'fog'],
          description: `A perpetual cloud of mist rises from where the waterfall strikes the pool below. The droplets hang in the air, catching what light filters into this urban canyon. Everything within range stays damp—benches, railings, the ivy on the walls, anyone standing too close. The mist smells of minerals and wet stone, clean in a way that Seattle rain never quite achieves.`,
        },
      ],
    },

    '%POOL': {
      name: 'Waterfall Garden - Reflecting Pool',
      description: `The pool at the waterfall's base is smaller than the sound suggests—maybe fifteen feet across, its surface in constant motion from the cascade's impact. The water is surprisingly clear, filtered and recirculated by machinery hidden beneath the surrounding stonework. Pennies and coins carpet the bottom, wishes from another era accumulating in copper sediment.

A low stone wall surrounds the pool, its surface worn smooth by decades of visitors sitting on its edge. The stones are slick with moisture and moss, treacherous for the unwary. Drainage channels cut into the surrounding pavement handle the overflow that mist and splash would otherwise create.

The roar of the falls is loudest here, directly at the impact point. The air is thick with spray. Sound becomes texture, white noise so complete that it approaches silence from the other direction.`,
      x: -7,
      y: -3,
      z: 0,
      imageOnDisk: 'occidental-ave-s-x-7-y-3-z0.png',
      population: 0,
      ambientNoise: 85,
      lighting: 45,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%WATERFALL',
        east: '%SEATING',
      },
      sittables: [
        {
          name: 'the pool wall',
          capacity: 6,
          emptyMsg:
            'The low stone wall surrounding the pool offers seating, though the constant mist keeps the surface perpetually damp.',
          occupiedMsg: '%s sitting on the slick pool wall',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'reflecting pool',
          aliases: ['pool', 'water', 'pond'],
          description: `The pool churns beneath the waterfall's impact, never achieving the stillness its name implies. The water is clear enough to see the bottom—pennies and coins forming a mosaic of copper and silver, wishes cast by visitors over decades. The coins haven't been collected since the world changed. The wishes remain unfulfilled but preserved, a record of small hopes in a drowned archive.`,
        },
        {
          prototype: 'describable',
          name: 'coins',
          aliases: ['pennies', 'wishes', 'money'],
          description: `Hundreds of coins carpet the pool's bottom, tossed by visitors making wishes over the park's forty-year history. Pennies predominate, their copper faces turned green and black by oxidation. Silver coins gleam here and there—quarters, dimes, the occasional dollar coin. Someone threw a watch in once; its face stares up through the water, hands frozen at 4:17. The wishes were small things, probably. Health, love, luck. The coins accumulated. The wishing stopped. The coins remain.`,
        },
      ],
    },

    '%SEATING': {
      name: 'Waterfall Garden - Seating Area',
      description: `A terrace of café tables and metal chairs occupies the space between the waterfall and the entrance, arranged on flagstone pavers in the dappled shade of vine maples. The trees have grown beyond their planters, roots cracking the stonework, branches reaching toward what light penetrates this urban canyon.

The café tables are small, round, wrought iron painted dark green—the kind of outdoor furniture that's bolted down because it's designed to be permanent. The chairs are the same style, their seats uncomfortable in the way that discourages lingering. The park wanted visitors to find peace, not residence.

Despite the roar of the waterfall, this corner is quieter—far enough from the cascade that conversation becomes possible, if you're willing to raise your voice. A stone planter serves as a divider, its contents long since overgrown into a tangle of hostas and ferns.`,
      x: -6,
      y: -3,
      z: 0,
      population: 0,
      ambientNoise: 35,
      lighting: 55,
      waterLevel: 0,
      outdoor: true,
      exits: {
        south: '%ENTRANCE',
        west: '%POOL',
        north: {
          to: '2nd-ave-s/y-2.ts',
          description: 'A narrow path leads north to 2nd Ave S',
        },
      },
      sittables: [
        {
          name: 'a café table',
          capacity: 4,
          emptyMsg:
            'Wrought iron café tables sit on the flagstone terrace, their green paint chipped and fading.',
          occupiedMsg: '%s seated at a café table',
        },
        {
          name: 'a park bench',
          capacity: 3,
          emptyMsg:
            'A wooden bench faces the waterfall, positioned for contemplation of the cascade.',
          occupiedMsg: '%s resting on the bench',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'café tables',
          aliases: ['tables', 'furniture'],
          description: `Wrought iron café tables, their round tops sized for coffee and pastries from a café that doesn't operate anymore. The green paint is chipped and peeling, exposing rust beneath. The tables are bolted to the flagstone—theft-proof, weather-proof, time-resistant. They'll be here when the waterfall finally stops.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'vine maples',
          aliases: ['trees', 'maples'],
          description: `Two vine maples grow from stone planters, their multiple trunks twisted and graceful in the Japanese style. The trees have outgrown their containers, roots cracking through the stone, branches reaching toward the narrow strip of sky visible above. Leaves filter what light reaches this level, creating shifting patterns on the flagstone below.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'stone planters',
          aliases: ['planters', 'gardens'],
          description: `Large stone planters divide the seating area, originally containing cultivated gardens of hostas and ferns. Without maintenance, the plants have gone wild—hostas spreading in thick clumps, ferns sending fronds over the planter edges, moss carpeting every surface. The cultivated has become feral, which is its own kind of beauty.`,
        },
      ],
    },
  },
};
