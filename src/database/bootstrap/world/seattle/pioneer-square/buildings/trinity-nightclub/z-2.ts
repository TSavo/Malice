// Trinity Nightclub - VIP Level (z=-2)
// The basement beneath the basement - where the real action happened

export const building = {
  name: 'Trinity Nightclub',
  x: -14,
  y: 0,
  width: 4,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // VIP LEVEL (z=-2)
    // ═══════════════════════════════════════════════════════════════════

    '%VIP': {
      name: 'Trinity - VIP Lounge',
      description: `The VIP lounge exists in its own reality, two stories below street level, insulated from the world above by brick and earth and money. The ceiling is lower here—eight feet of arched brick—creating an intimacy that the main floor lacked. This was the inner sanctum. This was where the night got interesting.

The décor is darker than upstairs, if that's possible. Black velvet walls absorb what little light exists. Crystal chandeliers hang from the vaulted ceiling, their prisms dusty, their bulbs dead, their statement still clear: this room cost more than you can afford.

A horseshoe of leather banquettes rings the room, each section separated by translucent curtains that provided the illusion of privacy while permitting enough visibility to ensure safety. The leather is soft, worn, shaped by bodies that once paid dearly for the privilege of wearing it down.

A small bar occupies one corner, its selection more refined than upstairs—or it was, before the top shelf was emptied. What remains is still better than what's above.`,
      x: -13,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 1,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: { room: '%VIP_STAIRS', door: '%VIP_DOOR', locks: ['%VIP_LOCK'] },
        east: '%VIP_BAR',
        south: '%PRIVATE_ROOMS',
        west: '%CHAMPAGNE_ROOM',
      },
      sittables: [
        {
          name: 'the center banquette',
          capacity: 8,
          emptyMsg: 'A curved leather banquette commands the center of the room.',
          occupiedMsg: '%s in the VIP seating',
        },
        {
          name: 'a corner booth',
          capacity: 4,
          emptyMsg: 'A secluded corner booth with its own curtain.',
          occupiedMsg: '%s in a VIP booth',
        },
        {
          name: 'floor cushions',
          capacity: 6,
          emptyMsg: 'Silk floor cushions are scattered around low tables.',
          occupiedMsg: '%s on the floor cushions',
        },
      ],
    },

    '%VIP_BAR': {
      name: 'Trinity - VIP Bar',
      description: `A smaller, more intimate bar serving the VIP lounge. The back bar here once held the real collection—aged whiskeys, rare gins, champagnes that cost more than rent. The bottles that remain are still impressive by post-Burning standards, their labels indicating quality that's become impossible to replace.

The bar top is black marble, cool to the touch, reflecting the dim lights like a dark mirror. Crystal glasses still line the shelf behind the bar, survivors of whatever chaos claimed the rest. Someone valued these enough to be careful.

A small refrigerator hums beneath the counter—one of the few working appliances in the building, its contents unknown but presumably liquid. The ice machine beside it is dead, but ice hasn't been a priority for years.

A tip jar sits on the bar, still holding bills from the last night of operation. The money is worthless now, but no one's taken it. Bad luck, maybe, or just pointless.`,
      x: -12,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 1,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%VIP',
        south: '%PRIVATE_ROOMS',
      },
      sittables: [
        {
          name: 'a velvet barstool',
          capacity: 4,
          emptyMsg: 'Velvet-topped barstools line the marble bar.',
          occupiedMsg: '%s at the VIP bar',
        },
      ],
    },

    '%CHAMPAGNE_ROOM': {
      name: 'Trinity - Champagne Room',
      description: `The champagne room—a name that promised more than it usually delivered, a space for private parties within the private party. The room is small, barely large enough for the circular couch that dominates it, designed for groups who wanted to be seen being exclusive while remaining hidden from judgment.

Empty champagne bottles line shelves built into the walls, displayed like trophies of excess. Moët, Veuve Clicquot, Dom Pérignon—the labels read like a catalog of celebration. The bottles are empty but preserved, monuments to nights that cost more than most people's months.

A sound system is built into the walls, separate from the main club's—the champagne room could have its own music, its own vibe, its own reality. The speakers are dead now, but the subwoofer's presence is still felt in the floor, a ghost of bass.

Mirrors cover one wall, positioned to make the small room seem larger and to let occupants see themselves being fabulous. The reflections now show only dust and absence.`,
      x: -14,
      y: 1,
      z: -2,
      population: 0,
      ambientNoise: 1,
      lighting: 6,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%VIP',
      },
      sittables: [
        {
          name: 'the circular couch',
          capacity: 10,
          emptyMsg: 'A white leather circular couch fills most of the room.',
          occupiedMsg: '%s in the champagne room',
        },
      ],
    },

    '%PRIVATE_ROOMS': {
      name: 'Trinity - Private Corridor',
      description: `A narrow corridor lined with doors—the private rooms that made Trinity's reputation. Each door is numbered in brass, 1 through 4, each leading to a small room equipped for activities that never appeared on any official menu.

The corridor itself is red—walls, carpet, lighting—creating an atmosphere of heat and anticipation. Vintage photographs line the walls, black and white images of Seattle from a century ago, providing a veneer of class to a space designed for excess.

A house phone hangs on the wall, its cord cut, its dial tone long dead. The phone once connected to the bar, for orders, for emergencies, for whatever needs arose in the private rooms. The needs now go unmet.

At the corridor's end, a fire exit leads into the Seattle Underground proper—the buried streets and storefronts that connect beneath Pioneer Square. The door is heavy, its crash bar functional, its destination dark.`,
      x: -13,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 1,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%VIP',
        east: '%VIP_BAR',
        south: '%UNDERGROUND_EXIT',
        west: '%ROOM_1',
      },
    },

    '%ROOM_1': {
      name: 'Trinity - Private Room 1',
      description: `The largest of the private rooms, designed for small groups rather than couples. A circular bed dominates the center—yes, a bed, because Trinity never pretended to be anything other than what it was. The mattress is bare now, its sheets long since taken by someone with practical needs.

Mirrors cover the ceiling, a classic touch that seemed decadent once and seems exhausting now. The walls are padded in red leather, for sound insulation as much as aesthetics. What happened in the private rooms stayed in the private rooms, enforced by architecture as much as social contract.

A small wet bar occupies one corner, its bottles empty, its ice bucket dry. A sound system is built into the wall, its controls simple—volume and source, nothing else. The source options are vinyl, CD, and aux. All are silent now.

A closet door stands ajar, revealing an interior that once held... supplies. The supplies are gone. The closet remains, a witness to whatever it witnessed.`,
      x: -14,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 0,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%PRIVATE_ROOMS',
      },
      sittables: [
        {
          name: 'the circular bed',
          capacity: 6,
          emptyMsg: 'A large circular bed, stripped of sheets, fills the room.',
          occupiedMsg: '%s on the circular bed',
        },
        {
          name: 'a chaise lounge',
          capacity: 2,
          emptyMsg: 'A red velvet chaise lounge curves against one wall.',
          occupiedMsg: '%s on the chaise',
        },
      ],
    },

    '%UNDERGROUND_EXIT': {
      name: 'Trinity - Underground Access',
      description: `The back exit from Trinity opens directly into the Seattle Underground—the buried streets that lie beneath Pioneer Square. This was the escape route for those who needed to leave unseen, the supply route for things that didn't come through the front door, the connection to a network that existed before Trinity and will exist long after.

The door is fire-rated steel, equipped with a crash bar that still functions. Pushing it open reveals the Underground proper: brick tunnels, purple light from skylights embedded in the sidewalks above, the smell of damp earth and old commerce.

The Underground here is part of the Gray Cartel's territory, though Trinity existed in a zone of ambiguity—a business that served many masters and belonged to none. The relationship was complicated. The Underground doesn't judge.

A map is painted on the wall beside the door, faded but readable: the passages that connect beneath Pioneer Square, marked with warnings and routes and destinations. Some passages lead to other buildings. Some lead deeper. Some are marked with X's that suggest they lead nowhere anymore.`,
      x: -13,
      y: -1,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%PRIVATE_ROOMS',
        south: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%OCC_S1',
          description: 'The fire exit opens into the Seattle Underground',
        },
      },
      sittables: [
        {
          name: 'a storage crate',
          capacity: 2,
          emptyMsg: 'Wooden crates are stacked near the exit.',
          occupiedMsg: '%s sitting on crates by the exit',
        },
      ],
      objects: [
        {
          prototype: 'sign',
          name: 'Underground Map',
          description: `A faded map painted directly on the brick wall, showing the tunnel network beneath Pioneer Square:

     UNDERGROUND PASSAGES - PIONEER SQUARE
     ======================================

     [X] COLLAPSED - DO NOT ENTER
     [!] GRAY CARTEL CHECKPOINT
     [~] FLOODING - SEASONAL

     TRINITY -----> GRAND CENTRAL (2 blocks E)
        |
        v
     YESLER TUNNEL ---> WATERFRONT (4 blocks W)
        |
        v
     DEEP WARREN [!] ---> ??? (unmapped)

     "THE UNDERGROUND REMEMBERS"
     - Gray Cartel, 2024`,
        },
      ],
    },
  },

  postProcessors: [],
};
