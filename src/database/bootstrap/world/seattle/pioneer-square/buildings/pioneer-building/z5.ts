// Pioneer Building - Sixth Floor (z=5)
// Executive Offices - Restricted Access

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%EXEC_LOCK': {
      prototype: 'biometricLock',
      name: 'Executive Floor Scanner',
      description:
        'A modern biometric scanner, incongruous against the century-old architecture. It requires fingerprint authentication for access.',
      scanners: [
        { type: 'fingerprint', part: 'hand', message: 'Executive access only.' },
      ],
      authorizedUsers: {},
    },

    '%ROOF_HATCH_LOCK': {
      prototype: 'lock',
      name: 'Roof Access Lock',
      description:
        'A heavy-duty padlock securing the roof hatch, designed to keep unauthorized personnel off the roof.',
      difficulty: 5,
    },

    // ═══════════════════════════════════════════════════════════════════
    // SIXTH FLOOR (z=5) - EXECUTIVE OFFICES
    // ═══════════════════════════════════════════════════════════════════

    '%ELEV_LOBBY_Z5': {
      name: 'Pioneer Building - Sixth Floor Elevator Lobby',
      description: `The elevator doesn't stop on this floor without credentials. The brass gates open onto a small security vestibule, a modern addition to the building's original architecture. A biometric scanner guards the door ahead, its blue light pulsing in the dimness—EXECUTIVE OFFICES reads the sign above it, the letters deliberately understated.

The vestibule is paneled in the same dark wood as the floors below, but the security hardware is modern: reinforced door, electronic lock, camera mounted in the corner. Someone invested in keeping this floor private. The investment outlasted whoever made it.

Through the reinforced glass, the executive suite beyond is visible—richer, more luxurious than the tenant offices below.`,
      x: 2,
      y: 9,
      z: 5,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          room: '%EXEC_RECEPTION',
          locks: ['%EXEC_LOCK'],
          description: 'A reinforced door with biometric scanner leads to the executive suite',
        },
        south: '%HALL_Z5',
        down: '%STAIR_Z4',
        in: '%E',
      },
      elevatorId: '%E',
      objects: [
        {
          prototype: 'describable',
          name: 'security camera',
          aliases: ['camera', 'surveillance'],
          description: `A security camera mounted in the corner, its lens dark, its recording light off. The camera was part of the executive floor's security upgrades, watching everyone who stepped off the elevator. The watching has stopped. The camera remains, blind eye in a blind building.`,
        },
      ],
    },

    '%STAIR_Z5': {
      name: 'Pioneer Building - Sixth Floor Stairwell',
      description: `The top of the grand staircase, where the marble ends and the stairs continue in simple wood toward the roof. A security door blocks access from the stairwell to the executive floor—the same biometric lock as the elevator vestibule.

Above, a narrow staircase leads to a roof hatch, the building's ultimate vertical limit. A sign reads ROOF ACCESS - MAINTENANCE ONLY, the kind of warning that's more suggestion than command.

The light here comes from a small skylight, its glass dirty with years of accumulated grime. The light it admits is gray and uncertain.`,
      x: 2,
      y: 8,
      z: 5,
      population: 0,
      ambientNoise: 3,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: { room: '%ROOF_SE', locks: ['%ROOF_HATCH_LOCK'] },
        down: '%STAIR_Z4',
        north: '%ELEV_LOBBY_Z5',
      },
    },

    '%HALL_Z5': {
      name: 'Pioneer Building - Sixth Floor Hallway',
      description: `The executive floor hallway, noticeably more luxurious than the corridors below. The carpet is thick, the color of old wine, unmarked by the foot traffic that wore paths in the lower floors. The walls are paneled in dark wood, original to the building, polished to a soft gleam.

Art hangs on the walls—real art, not prints—paintings of ships and forests, the industries that built Seattle's wealth. The frames are gilded, the canvases large. Someone with money and taste decorated this floor.

The silence here is deeper than below. The executive floor feels like it's been waiting longer.`,
      x: 2,
      y: 8,
      z: 5,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ELEV_LOBBY_Z5',
        east: '%EXEC_CONFERENCE',
        west: '%EXEC_SITTING',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'maritime painting',
          aliases: ['painting', 'ship painting', 'art'],
          description: `A large oil painting of a clipper ship under full sail, its hull cutting through Pacific swells. The painting is at least a century old, its varnish darkened, but the craftsmanship is evident—every rope rendered, every wave distinct. A brass plaque identifies it: THE SEATTLE CLIPPER, WILLAMSON 1898. The ship is long gone. Its portrait remains.`,
        },
        {
          prototype: 'describable',
          name: 'forest painting',
          aliases: ['landscape', 'timber painting'],
          description: `A painting of old-growth forest, massive Douglas firs rising into mist, their trunks impossibly straight and tall. The painting captures a forest that probably no longer exists in that form—the old growth that was cut to build the city that built this building. The painting is a memorial to what was taken.`,
        },
      ],
    },

    '%EXEC_RECEPTION': {
      name: 'Executive Suite - Reception',
      description: `The reception area of the executive suite, a space designed to impress and intimidate. A reception desk of carved mahogany guards access to the offices beyond, its surface clear except for an antique telephone and a crystal vase that once held flowers.

The walls are covered in silk wallpaper, a deep burgundy pattern that absorbs light and sound. Original art hangs at intervals—more maritime scenes, more forests, the sources of wealth that built these offices.

A chandelier hangs from the ceiling, its crystals dusty, its light bulbs long burned out. Someone used to turn it on for important visitors. No visitors come now, important or otherwise.`,
      x: 1,
      y: 9,
      z: 5,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ELEV_LOBBY_Z5',
        south: '%EXEC_SITTING',
        west: '%EXEC_CORNER',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'executive reception desk',
          aliases: ['desk', 'mahogany desk'],
          description: `A reception desk of carved mahogany, its surface a swirl of grain and relief carving. The desk is a museum piece, the kind of furniture that was built to demonstrate wealth and permanence. An antique telephone sits on its surface—rotary dial, brass fittings—along with a crystal vase that holds the ghosts of flowers long since wilted and removed.`,
        },
        {
          prototype: 'describable',
          name: 'crystal chandelier',
          aliases: ['chandelier', 'light', 'fixture'],
          description: `A crystal chandelier hangs from the ceiling, perhaps three feet in diameter, its hundreds of crystals catching what light remains. The bulbs are dead, their filaments long since failed, but the crystals still refract the ambient light into small rainbows. The chandelier was meant to dazzle. It still does, in a diminished way.`,
        },
      ],
    },

    '%EXEC_CORNER': {
      name: 'Executive Suite - Corner Office',
      description: `The building's premier office space, occupying the northwest corner with windows on two walls. This is the office that commanded the best view, the most space, the greatest prestige. Whoever sat here ruled whatever enterprise occupied this floor.

The desk is a monument in mahogany, its surface larger than some apartments. Behind it, the chair is positioned to place the occupant against the windows, backlighting them to visitors, a power move preserved in furniture arrangement.

The view is remarkable even now—the waterfront, the bay, the mountains beyond on clear days. The view that made fortunes, watched from the office those fortunes built.

A private bathroom is visible through an open door, its fixtures marble and brass, executive privilege in porcelain.`,
      x: 1,
      y: 10,
      z: 5,
      population: 0,
      ambientNoise: 1,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%EXEC_RECEPTION',
        south: '%EXEC_PRIVATE',
      },
      sittables: [
        {
          name: 'the executive chair',
          capacity: 1,
          emptyMsg:
            'A massive leather chair sits behind the desk, positioned against the windows.',
          occupiedMsg: '%s sitting in the building\'s most prestigious seat',
        },
        {
          name: 'visitor chairs',
          capacity: 2,
          emptyMsg:
            'Two leather chairs face the desk, positioned to look up at whoever holds power here.',
          occupiedMsg: '%s sitting in one of the visitor chairs',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'executive desk',
          aliases: ['desk', 'mahogany desk'],
          description: `A desk that makes a statement about power. Mahogany, easily eight feet wide, its surface empty except for a brass desk lamp and a leather blotter. The wood is carved with subtle relief patterns—vines and leaves, barely visible unless you look closely. Drawers line both sides, locked or stuck shut, their contents private. This is the desk of someone who made decisions that mattered.`,
        },
        {
          prototype: 'describable',
          name: 'executive bathroom',
          aliases: ['bathroom', 'private bathroom', 'restroom'],
          description: `Through an open door, a private bathroom is visible—marble floors, brass fixtures, the executive's personal facilities. A claw-foot tub sits against one wall (executive baths were not unheard of in the Gilded Age). The fixtures are antique, the plumbing probably modernized but invisible. Privacy and luxury, even in the bathroom.`,
        },
      ],
    },

    '%EXEC_PRIVATE': {
      name: 'Executive Suite - Private Study',
      description: `A private study adjacent to the corner office, a retreat within a retreat. Bookshelves line the walls, holding leather-bound volumes that look read rather than decorative. A fireplace occupies one wall, its hearth cold, its mantle displaying photographs and small trophies.

This room feels more personal than the formal office—a place for thinking rather than performing, for actual work rather than the theater of it. A reading chair sits near the window, angled to catch the light, a side table holding a glass and a bottle of something that evaporated long ago.

The books are eclectic: history, philosophy, industry manuals, a few novels. The reading habits of whoever worked here, preserved in their library.`,
      x: 1,
      y: 7,
      z: 5,
      population: 0,
      ambientNoise: 1,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%EXEC_CORNER',
        east: '%EXEC_SITTING',
      },
      sittables: [
        {
          name: 'the reading chair',
          capacity: 1,
          emptyMsg:
            'A leather reading chair sits near the window, angled to catch the light.',
          occupiedMsg: '%s reading in the executive\'s private chair',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'private bookshelf',
          aliases: ['bookshelf', 'books', 'library'],
          description: `Bookshelves line the walls, holding a personal library. The books are worn, their spines cracked—these were read, not displayed. History dominates: Pacific Northwest, maritime trade, the timber industry. Philosophy occupies one shelf: Marcus Aurelius, Seneca, the Stoics. A few novels hide among the serious volumes. The reading habits of power, preserved in paper.`,
        },
        {
          prototype: 'describable',
          name: 'fireplace',
          aliases: ['hearth', 'mantle'],
          description: `A fireplace of carved marble, its hearth cold, its flue probably sealed years ago. The mantle displays photographs in silver frames: a family, a yacht, a handshake with someone important. Small trophies commemorate achievements—industry awards, civic honors, the tokens of a successful life. The fire that warmed this room is long out. The memories remain, cold.`,
        },
      ],
    },

    '%EXEC_SITTING': {
      name: 'Executive Suite - Sitting Room',
      description: `A sitting room for executive entertaining, a space for conversations too sensitive for conference rooms and too important for restaurants. Couches and armchairs are arranged around a low table, the furniture antique and valuable, upholstered in leather that has aged to a deep patina.

A wet bar occupies one corner, its crystal decanters still arranged on silver trays, their contents long since evaporated. The bar was stocked for serious drinking, the kind that closed deals and sealed alliances.

Windows look south toward Jackson Street and the buildings beyond. The view is less prestigious than the corner office, but the room itself speaks to a different kind of power—the power to entertain, to persuade, to build relationships over scotch and cigars.`,
      x: 1,
      y: 8,
      z: 5,
      population: 0,
      ambientNoise: 1,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%EXEC_RECEPTION',
        east: '%HALL_Z5',
        south: '%EXEC_PRIVATE',
      },
      sittables: [
        {
          name: 'a leather couch',
          capacity: 3,
          emptyMsg:
            'A leather couch faces the windows, its cushions worn to comfortable softness.',
          occupiedMsg: '%s sitting on the executive sitting room couch',
        },
        {
          name: 'an armchair',
          capacity: 2,
          emptyMsg:
            'Leather armchairs flank the couch, positioned for conversation.',
          occupiedMsg: '%s sitting in one of the executive armchairs',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'wet bar',
          aliases: ['bar', 'drinks', 'liquor cabinet'],
          description: `A wet bar of dark wood, its surface lined with crystal decanters and heavy tumblers. The decanters are empty now, labels identifying scotch, bourbon, cognac—the spirits of serious business. A small refrigerator below the bar is silent, its contents best left uninvestigated. Ice buckets in silver stand ready. The ice melted long ago. The ritual of the executive drink no longer observed.`,
        },
        {
          prototype: 'describable',
          name: 'cigar humidor',
          aliases: ['humidor', 'cigars'],
          description: `A wooden humidor sits on a side table, its cedar interior visible through a lifted lid. The cigars inside have long since dried out, their wrappers cracked and brown. The humidor's humidity system failed years ago. These were expensive cigars once—Cuban, probably, smuggled or pre-embargo. Now they're just dried tobacco, waiting for a match that won't come.`,
        },
      ],
    },

    '%EXEC_CONFERENCE': {
      name: 'Executive Suite - Boardroom',
      description: `The boardroom where the building's most important decisions were made. A massive table of polished wood dominates the space, surrounded by high-backed leather chairs—twelve of them, arranged in the hierarchy of corporate governance. The chair at the head is slightly larger, slightly more impressive. Whoever sat there ran things.

A projection screen hangs on one wall, its surface yellowed with age. The projector on the ceiling is dark, its bulb cold. Presentations were made here—deals proposed, strategies debated, fates decided. The screen waits for content that won't come.

Windows line the eastern wall, offering views of the buildings across 2nd Avenue. The morning sun would have filled this room with light. The meetings are over. The light remains.`,
      x: 3,
      y: 8,
      z: 5,
      population: 0,
      ambientNoise: 1,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_Z5',
      },
      sittables: [
        {
          name: 'a board chair',
          capacity: 8,
          emptyMsg:
            'Twelve leather chairs surround the boardroom table, their backs high, their seats deep.',
          occupiedMsg: '%s sitting at the boardroom table',
        },
        {
          name: 'the head chair',
          capacity: 1,
          emptyMsg:
            'The chair at the head of the table is slightly larger, slightly more imposing.',
          occupiedMsg: '%s sitting in the chairman\'s seat',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'boardroom table',
          aliases: ['table', 'conference table'],
          description: `A table of dark wood, perhaps twenty feet long, its surface polished to a mirror sheen. The table is a single piece—or made to look like one—its grain flowing unbroken from end to end. Leather blotters are positioned at each seat, pens still in their holders. The table saw decisions that shaped the city. The decisions ended. The table remains.`,
        },
        {
          prototype: 'describable',
          name: 'corporate portraits',
          aliases: ['portraits', 'paintings'],
          description: `Oil portraits hang on the walls, depicting men in suits across different eras—the board chairmen and presidents who ran whatever enterprise called this floor home. The portraits are arranged chronologically, the fashions changing, the expressions remaining the same: confident, authoritative, convinced of their own importance. The importance faded. The portraits persist.`,
        },
      ],
    },
  },
};
