// Union Station - Mezzanine Level (z=1)
// Upper galleries and office conversion from 1990s

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%OFFICE_LOCK': {
      prototype: 'lock',
      name: 'Office Suite Lock',
      description:
        'A modern commercial lock, incongruous against the historic door frame.',
      difficulty: 4,
    },

    '%ROOF_HATCH_LOCK': {
      prototype: 'lock',
      name: 'Roof Access Lock',
      description: 'A heavy padlock securing the roof hatch.',
      difficulty: 5,
    },

    // ═══════════════════════════════════════════════════════════════════
    // MEZZANINE LEVEL (z=1) - OFFICES AND GALLERIES
    // ═══════════════════════════════════════════════════════════════════

    '%MEZZANINE_S': {
      name: 'Union Station - South Mezzanine',
      description: `The south end of the mezzanine gallery, overlooking the grand hall below. A wrought-iron railing runs along the edge, its balusters twisted into decorative spirals, the craftsmanship of an age when even functional elements deserved beauty.

The view from here is remarkable—the full sweep of the barrel vault visible, the compass rose in the floor below appearing as intended, a symbol to be viewed from above. The chandelier hangs at eye level here, its crystals close enough to touch, its scale more impressive from this vantage.

The mezzanine was added in the 1920s, a way to increase usable space without altering the grand hall's proportions. Office doors line the inner wall, their frosted glass panels bearing names of businesses that closed decades ago.`,
      x: -5,
      y: -8,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%MEZZANINE_C',
        east: '%OFFICE_S',
        west: '%GALLERY_S',
      },
      sittables: [
        {
          name: 'a gallery bench',
          capacity: 2,
          emptyMsg:
            'A wooden bench sits against the inner wall, positioned for viewing the hall below.',
          occupiedMsg:
            '%s sitting on the mezzanine bench, overlooking the grand hall',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'wrought-iron railing',
          aliases: ['railing', 'balustrade', 'iron railing'],
          description: `A wrought-iron railing runs along the gallery's edge, its balusters twisted into decorative spirals that catch the light. The iron is heavy, meant to last—and it has, despite a century of hands leaning on it to view the hall below. The craftsmanship is evident in every curve, the work of smiths who took pride in functional beauty.`,
        },
      ],
    },

    '%MEZZANINE_C': {
      name: 'Union Station - Central Mezzanine',
      description: `The center of the mezzanine gallery, directly above the compass rose and below the chandelier's mounting point. From here, the grand hall spreads in all directions, its scale comprehensible in a way it isn't from the floor. The barrel vault curves overhead, close enough to see the individual coffers, the rosettes, the water stains where the roof has failed.

A grand staircase descends to the main floor, its marble treads worn in the center, its brass handrails polished by generations of hands. The staircase is ceremonial—wider and more ornate than necessary for mere traffic. It was designed for arrivals, for the moment when passengers emerged into the grand hall and understood they had reached somewhere important.

The offices that ring this level were carved out of the original open gallery in the 1990s conversion. The partition walls don't reach the ceiling, preserving the sense of space while destroying its unity.`,
      x: -5,
      y: -7,
      z: 1,
      population: 0,
      ambientNoise: 8,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%MEZZANINE_S',
        north: '%MEZZANINE_N',
        east: '%OFFICE_C',
        west: '%GALLERY_N',
        down: '%GRAND_HALL_C',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'grand staircase',
          aliases: ['staircase', 'stairs', 'marble stairs'],
          description: `A grand staircase of white marble descends to the main floor, its treads worn smooth in the center by millions of feet. The stairs are wider than necessary—perhaps twelve feet across—designed for the ceremonial moment of arrival. Brass handrails run along both sides, their surfaces polished to gold by generations of hands. The staircase was meant to impress. It still does.`,
        },
        {
          prototype: 'describable',
          name: 'partition walls',
          aliases: ['partitions', 'office walls'],
          description: `Modern partition walls divide the mezzanine into office suites, their surfaces a neutral gray that clashes with the ornate ceiling above. The walls don't reach the ceiling—a nod to preserving the historic space, or perhaps just lazy construction. The partitions create offices while undermining the gallery's original purpose. The compromise satisfies no one.`,
        },
      ],
    },

    '%MEZZANINE_N': {
      name: 'Union Station - North Mezzanine',
      description: `The north end of the mezzanine, where the gallery curves around to meet the massive railroad mural on the main floor. From up here, the mural's scale is even more impressive—the locomotives seem to steam directly toward you, the workers' upraised hammers frozen at the moment of impact.

The gallery ends at a door marked ROOF ACCESS - AUTHORIZED PERSONNEL ONLY. The door is steel, a modern addition that clashes with the Beaux-Arts surroundings. A padlock secures it, its shackle rusted but intact.

The floor here shows more wear than the rest of the mezzanine—foot traffic concentrated at this point where the gallery meets the roof access. Someone used this route regularly. The regular use stopped. The wear remains.`,
      x: -5,
      y: -6,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%MEZZANINE_C',
        west: '%OFFICE_N',
        up: { room: '%ROOF_C', locks: ['%ROOF_HATCH_LOCK'] },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'roof access door',
          aliases: ['door', 'steel door', 'roof door'],
          description: `A steel door marked ROOF ACCESS - AUTHORIZED PERSONNEL ONLY, its surface painted industrial gray. The door is a jarring modern addition to the ornate mezzanine—functional rather than beautiful, installed without regard for the historic surroundings. A padlock secures the door, its shackle rusted. Beyond it, stairs lead up to the roof.`,
        },
      ],
    },

    '%GALLERY_S': {
      name: 'Union Station - South Gallery',
      description: `The western gallery of the mezzanine, running along the grand hall's west wall. Display cases line the inner wall, their glass intact, their contents removed. The cases once held exhibits about railroad history—photographs, artifacts, the material culture of an age when trains connected the nation.

Benches face outward, positioned for viewing the hall below. The benches are wooden, their slats worn but solid, designed for passengers waiting for trains that would be announced on the boards below. The announcements stopped. The benches remain.

Light from the tall arched windows falls across the gallery in long rectangles, dust motes drifting through the beams. The gallery feels like a museum, though the exhibits are gone and the visitors have stopped coming.`,
      x: -6,
      y: -8,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%MEZZANINE_S',
        north: '%GALLERY_N',
      },
      sittables: [
        {
          name: 'a gallery viewing bench',
          capacity: 3,
          emptyMsg:
            'Wooden benches face the railing, positioned for viewing the grand hall below.',
          occupiedMsg: '%s sitting on the gallery bench',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'empty display cases',
          aliases: ['cases', 'display cases', 'exhibits'],
          description: `Glass display cases line the wall, their interiors empty, their labels still in place. NORTHERN PACIFIC RAILWAY reads one label. GREAT NORTHERN EXPANSION reads another. The exhibits are gone—probably removed for safekeeping, probably lost—but the cases remain, monuments to a history no one studies anymore.`,
        },
      ],
    },

    '%GALLERY_N': {
      name: 'Union Station - North Gallery',
      description: `The northern section of the west gallery, where the mezzanine curves around toward the railroad mural. The view here is of the mural's upper reaches—the mountains rendered in the heroic style of early twentieth-century commercial art, their peaks forever snow-capped, their tunnels forever about to accept trains.

A small seating area occupies one corner, leather chairs arranged around a low table. The chairs are cracked and faded, but they're real leather, expensive even when new. This must have been a VIP waiting area, a place for important passengers to wait in comfort while the masses sat on wooden benches below.

A bar cart stands near the chairs, its brass fixtures tarnished, its bottles long since emptied. First-class passengers were served drinks while they waited. The service ended. The cart remains.`,
      x: -6,
      y: -7,
      z: 1,
      population: 0,
      ambientNoise: 5,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%MEZZANINE_C',
        south: '%GALLERY_S',
      },
      sittables: [
        {
          name: 'a leather club chair',
          capacity: 3,
          emptyMsg:
            'Leather club chairs are arranged around a low table, their surfaces cracked but still comfortable.',
          occupiedMsg: '%s relaxing in the VIP seating area',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'bar cart',
          aliases: ['cart', 'drinks cart', 'service cart'],
          description: `A brass bar cart, its wheels frozen with rust, its surface holding empty crystal decanters and tarnished silver accessories. The cart was for serving drinks to VIP passengers—cocktails and cordials while they waited for their private cars to be attached. The service is a memory. The cart remains, empty bottles catching light.`,
        },
      ],
    },

    '%OFFICE_S': {
      name: 'Union Station - South Office Suite',
      description: `An office suite carved from the mezzanine gallery during the 1990s conversion, when the station was transformed from transit hub to commercial space. The walls are modern drywall, the ceiling acoustic tile, the contrast with the ornate windows jarring.

Cubicle partitions divide the space into workstations, their fabric walls gray and institutional. Computer monitors sit dark on desks, their keyboards gathering dust. The office was generic even when occupied—the kind of space that could have been anywhere, that made no use of its historic setting.

A conference room occupies one corner, its glass walls providing the illusion of openness while maintaining the reality of separation. The conference table is fake wood veneer, the chairs ergonomic mesh. The contrast with the Beaux-Arts windows behind them is almost painful.`,
      x: -4,
      y: -8,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%MEZZANINE_S',
        north: '%OFFICE_C',
      },
      sittables: [
        {
          name: 'an office chair',
          capacity: 4,
          emptyMsg:
            'Ergonomic office chairs sit at empty cubicles, their mesh backs sagging.',
          occupiedMsg: '%s sitting in one of the office cubicles',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'cubicle partitions',
          aliases: ['cubicles', 'partitions', 'workstations'],
          description: `Fabric-covered cubicle partitions divide the space into workstations, their surfaces in institutional gray. The cubicles are identical, interchangeable, the opposite of the ornate space they occupy. Monitors sit dark on desks; keyboards gather dust. The workers who sat here are gone. The cubicles remain, monuments to the banality of office work.`,
        },
      ],
    },

    '%OFFICE_C': {
      name: 'Union Station - Central Office Suite',
      description: `The central office suite, slightly larger than its neighbors, probably designated for a manager or department head. The same gray cubicles, the same acoustic tile ceiling, but with a private office in the corner—glass walls, a real door, the signifiers of corporate hierarchy.

The private office has a view of the grand hall through the historic windows, a perk that must have made the mundane work slightly more bearable. A desk of fake mahogany sits before the window, its surface clear except for a desk lamp and a family photo frame lying face-down.

Someone left in a hurry, or didn't care enough to take everything. The photo frame remains, its occupants hidden, their fate unknown.`,
      x: -4,
      y: -7,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%MEZZANINE_C',
        south: '%OFFICE_S',
        north: '%OFFICE_N',
      },
      sittables: [
        {
          name: "the manager's chair",
          capacity: 1,
          emptyMsg:
            'An executive chair sits in the private office, positioned to face both the door and the window.',
          occupiedMsg: "%s sitting in the manager's office",
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'fallen photo frame',
          aliases: ['photo', 'frame', 'picture'],
          description: `A photo frame lies face-down on the desk, its backing visible. The frame is silver-plated, the kind given as corporate gifts or sold at department stores. Whoever worked here had a family, or at least wanted to appear to. The photo's subjects remain hidden. Turning it over would reveal them—or perhaps just the anonymous stock photo that came with the frame.`,
        },
      ],
    },

    '%OFFICE_N': {
      name: 'Union Station - North Office Suite',
      description: `The northernmost office suite, where the 1990s conversion met the building's constraints. The space here is oddly shaped, the modern walls working around historic columns that couldn't be moved. The result is a warren of irregular cubicles and dead-end corridors.

A break room occupies one corner, its vending machines dark and empty, its refrigerator door hanging open on an interior best left uninspected. The microwave is still there, its door ajar, something inside that has long since ceased to be identifiable as food.

The office had character, in its way—the columns rising through the cubicles, the ornate ceiling visible above the acoustic tiles, the jarring combination of old and new that characterized so many historic building conversions.`,
      x: -4,
      y: -6,
      z: 1,
      population: 0,
      ambientNoise: 3,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%MEZZANINE_N',
        south: '%OFFICE_C',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'historic columns',
          aliases: ['columns', 'pillars'],
          description: `Massive columns rise through the office space, their presence non-negotiable, the cubicle layout warping around them. The columns are the same polished granite as those in the grand hall below, their capitals gilded, their proportions designed for a sixty-foot ceiling rather than a drop-tile one. They're absurd in this context—monuments to grandeur surrounded by ergonomic chairs and dead monitors.`,
        },
        {
          prototype: 'describable',
          name: 'break room',
          aliases: ['kitchen', 'kitchenette'],
          description: `A break room corner with dark vending machines, an open refrigerator (the smell has faded, thankfully), and a microwave containing something that was once food. The break room is generic—the same as any office break room anywhere—a space for coffee and complaints about management. The coffee is gone. The complaints echo.`,
        },
      ],
    },
  },
};
