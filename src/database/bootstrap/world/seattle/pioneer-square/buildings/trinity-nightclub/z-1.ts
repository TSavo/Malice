// Trinity Nightclub - Main Level (z=-1)
// The club proper - dance floor, bar, DJ booth

export const building = {
  name: 'Trinity Nightclub',
  x: -14,
  y: 0,
  width: 4,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // MAIN CLUB LEVEL (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%LOBBY': {
      name: 'Trinity - Club Lobby',
      description: `The bottom of the stairs opens into the club's lobby, a transitional space between the world above and the world below. The ceiling here is the original brick vaulting from 1890—arched tunnels that once held storefronts, now painted black and hung with defunct disco balls that catch what little light remains.

A cashier's window is built into one wall, barred and empty, where cover charges were once collected. Signs list prices for different nights: THURSDAYS $5, FRIDAYS $10, SATURDAY SPECIAL $15. The prices seem quaint now, relics of an economy that measured things in dollars.

The main room opens to the south, a cavern of darkness visible through the archway. The bar is visible to the east, its bottles catching the emergency light. The floor is sticky with the residue of countless spilled drinks, the kind of sticky that never quite cleans up.

Restrooms are marked to the west—stick figures in white on black doors. The graffiti inside was legendary. Some of it was art.`,
      x: -13,
      y: 2,
      z: -1,
      imageOnDisk: 'trinity-club-lobby-x-13-y2-z-1.png',
      population: 0,
      ambientNoise: 5,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%LANDING',
        south: '%FLOOR',
        east: '%BAR',
        west: '%RESTROOMS',
      },
      sittables: [
        {
          name: 'a lobby bench',
          capacity: 3,
          emptyMsg:
            'A padded bench lines one wall, its vinyl cracked and taped.',
          occupiedMsg: '%s sitting in the club lobby',
        },
      ],
    },

    '%FLOOR': {
      name: 'Trinity - Dance Floor',
      description: `The heart of Trinity—a dance floor carved from the bones of Seattle's underground. The ceiling arches twelve feet overhead, original brickwork from the 1890s, when this was street level before the city raised itself out of the mud. The bricks are painted black but the mortar lines still show, pale veins in the darkness.

The floor is sprung hardwood, installed for dancing, now warped and uneven from years of spilled drinks and condensation. Light rigs hang from the ceiling—dead now, but their positions still trace the patterns they once threw: strobes, lasers, UV. The dance floor could hold two hundred people pressed tight, moving as one organism to bass that shook the bricks.

The DJ booth rises against the south wall, a fortress of equipment on a platform three feet high. Turntables, mixers, speakers stacked like monuments. The booth is caged in chain-link, protection for the gear and the DJ alike.

The silence here is louder than it should be. This room remembers sound.`,
      x: -13,
      y: 1,
      z: -1,
      imageOnDisk: 'trinity-dance-floor-x-13-y1-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LOBBY',
        east: '%BAR_FLOOR',
        west: '%ALCOVES',
        south: '%BOOTH',
      },
      sittables: [
        {
          name: 'the dance floor edge',
          capacity: 6,
          emptyMsg:
            'The perimeter of the dance floor has a narrow ledge for leaning.',
          occupiedMsg: '%s at the edge of the dance floor',
        },
      ],
    },

    '%BOOTH': {
      name: 'Trinity - DJ Booth',
      description: `The elevated platform where DJs once commanded the room. The booth is caged in chain-link fence—partly to protect the equipment, partly to protect the DJ from crowds that got too enthusiastic. Entry is through a gate on the back side, always locked during shows.

The equipment remains, frozen mid-set. Two Technics 1200s—the industry standard for decades—sit on a flight case, their platters still. A mixer between them shows channels left where they were last adjusted. Headphones hang from a hook, their padding cracked and peeling.

Crates of vinyl line the back wall, each record in a sleeve, organized by a system only the DJ understood. House, techno, drum and bass, the Seattle sound that never quite got named. Some of these records are rare. Some are irreplaceable. They wait for hands that know how to use them.

The view from here encompasses the entire dance floor. This was the throne room. This was where the night was made.`,
      x: -13,
      y: 0,
      z: -1,
      imageOnDisk: 'trinity-dj-booth-x-13-y0-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%FLOOR',
      },
      sittables: [
        {
          name: 'the DJ chair',
          capacity: 1,
          emptyMsg: 'A worn office chair sits behind the decks.',
          occupiedMsg: '%s at the DJ booth',
        },
      ],
    },

    '%BAR': {
      name: 'Trinity - Main Bar',
      description: `The main bar runs the length of the eastern wall, a slab of zinc-topped wood that's seen better decades. The surface is scarred with cigarette burns from before the ban, with glass rings, with the carved initials of people who thought this moment would last forever.

Bottles line the back bar, still full—the amber and clear liquids of spirits that don't spoil, preserved like specimens in a museum of intoxication. The good stuff is gone, looted early. What remains is the house vodka, the well whiskey, the bottles nobody wanted badly enough to steal.

Three beer taps protrude from the bar, their handles collecting dust. The kegs they connected to went flat years ago, but the taps remain as sculptural elements of a functioning bar.

The cash register is mechanical, an antique even before The Burning. It sits open, empty, the drawer's wood worn smooth by decades of transactions.`,
      x: -12,
      y: 2,
      z: -1,
      imageOnDisk: 'trinity-main-bar-x-12-y2-z-1.png',
      population: 0,
      ambientNoise: 3,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LOBBY',
        south: '%BAR_FLOOR',
        east: '%STORAGE',
      },
      sittables: [
        {
          name: 'a bar stool',
          capacity: 8,
          emptyMsg:
            'Metal stools with vinyl seats line the bar, some spinning, some stuck.',
          occupiedMsg: '%s at the bar',
        },
      ],
    },

    '%BAR_FLOOR': {
      name: 'Trinity - Bar Side',
      description: `The eastern edge of the dance floor, where the bar meets the action. This was the zone for people who wanted to drink and watch, not quite committing to the floor but close enough to feel the bass. High tables without chairs lined this area—places to set drinks while standing, moving, deciding whether to stay or go.

The tables remain, their surfaces sticky with ancient residue. Some have candles melted into pools, never relit. Others hold abandoned drinks, their contents long evaporated, leaving only residue in glasses that no one bothered to bus.

From here, you can see both the bar and the dance floor, the DJ booth in the distance. This was the social zone, the place where connections were made, where eyes met across crowded rooms, where the night's possibilities were assessed and pursued.

The floor slopes slightly toward a drain in the center—practical for cleaning up after long nights. The drain is clogged now. No one cleans up anymore.`,
      x: -12,
      y: 1,
      z: -1,
      imageOnDisk: 'trinity-bar-side-x-12-y1-z-1.png',
      population: 0,
      ambientNoise: 3,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%BAR',
        west: '%FLOOR',
        south: '%BACK_HALL',
      },
      sittables: [
        {
          name: 'a high table',
          capacity: 4,
          emptyMsg:
            'High tables without stools offer standing spots near the action.',
          occupiedMsg: '%s at a high table',
        },
      ],
    },

    '%ALCOVES': {
      name: 'Trinity - Alcoves',
      description: `The western wall is carved into alcoves—brick niches that were probably storage rooms in the 1890s, repurposed as semi-private spaces for the club. Each alcove is deep enough for a small group, lit by colored bulbs that have long since burned out. Velvet curtains hang at their entrances, moth-eaten now but still functional for privacy.

The alcoves were numbered, 1 through 6, the numbers painted in gold on the brick above each entrance. Some numbers are more worn than others, popular spots claimed by regulars, jealously guarded through social dynamics that no longer apply.

Couches fill each alcove, the kind of deep, low furniture that's impossible to get out of gracefully. The fabric varies—velvet, leather, something that might have been silk—all of it now worn and stained by years of use that polite company doesn't discuss.

This was where deals were made, where intimacies began, where the night got real.`,
      x: -14,
      y: 1,
      z: -1,
      imageOnDisk: 'trinity-alcoves-x-14-y1-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%FLOOR',
        south: '%VIP_STAIRS',
      },
      sittables: [
        {
          name: 'alcove 1',
          capacity: 4,
          emptyMsg: 'A deep alcove with a curved leather couch.',
          occupiedMsg: '%s in alcove 1',
        },
        {
          name: 'alcove 2',
          capacity: 4,
          emptyMsg: 'A brick niche with a velvet loveseat.',
          occupiedMsg: '%s in alcove 2',
        },
        {
          name: 'alcove 3',
          capacity: 6,
          emptyMsg: 'The largest alcove, with an L-shaped sectional.',
          occupiedMsg: '%s in alcove 3',
        },
        {
          name: 'alcove 4',
          capacity: 3,
          emptyMsg: 'A smaller alcove with floor cushions.',
          occupiedMsg: '%s in alcove 4',
        },
        {
          name: 'alcove 5',
          capacity: 4,
          emptyMsg: 'An alcove with a daybed and curtains.',
          occupiedMsg: '%s in alcove 5',
        },
        {
          name: 'alcove 6',
          capacity: 2,
          emptyMsg: 'The smallest, most private alcove.',
          occupiedMsg: '%s in alcove 6',
        },
      ],
    },

    '%RESTROOMS': {
      name: 'Trinity - Restrooms',
      description: `The restrooms of Trinity are as famous as the club itself—or were. Two doors, marked with abstract symbols that took newcomers a moment to parse. Inside: industrial tile, stainless steel fixtures, and walls covered in graffiti that constituted a kind of philosophy.

The graffiti remains, layer upon layer of Sharpie and paint and scratched etchings. Phone numbers (do those still work?), declarations of love, drug deals, poetry that drunk people thought was profound, art that actually was. Reading the walls is like reading the last decade's collective unconscious, one bathroom stall at a time.

The mirrors are intact but spotted with age, reflecting whoever looks into them as something less than what they were. The hand dryers died years ago. Paper towels were always preferred anyway—better for various purposes.

A condom machine hangs on one wall, still stocked, its products probably expired. The past's optimism, preserved in foil packets.`,
      x: -14,
      y: 2,
      z: -1,
      imageOnDisk: 'trinity-restrooms-x-14-y2-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LOBBY',
      },
      sittables: [
        {
          name: 'the counter',
          capacity: 2,
          emptyMsg: 'A counter by the mirrors offers a spot to regroup.',
          occupiedMsg: '%s at the restroom counter',
        },
      ],
    },

    '%STORAGE': {
      name: 'Trinity - Bar Storage',
      description: `Behind the bar, a narrow storage room holds the club's supplies—or held them, before the useful things were taken. Wire shelving lines the walls, holding mostly empties now: liquor bottles drained, beer cases empty, mixers gone flat and discarded.

A walk-in cooler occupies the back wall, its compressor long dead, its contents spoiled and then decayed to nothing. The smell has faded, but the memory of the smell lingers in the imagination.

Cases of Red Bull are stacked in one corner, the cans still sealed, their contents technically drinkable if you're desperate enough. Energy drinks don't spoil exactly, but they do age into something chemically suspicious.

A clipboard hangs by the door, inventory sheets from the last delivery. Someone marked items as received. Someone expected more deliveries. The expectation never arrived.`,
      x: -11,
      y: 2,
      z: -1,
      imageOnDisk: 'trinity-bar-storage-x-11-y2-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%BAR',
      },
    },

    '%BACK_HALL': {
      name: 'Trinity - Back Hallway',
      description: `A narrow service corridor connecting the bar area to the deeper reaches of the club. The walls are bare brick, unpainted, the utilitarian spine of the building. Exposed pipes run along the ceiling, sweating condensation that drips into puddles on the concrete floor.

Fire exit signs glow at each end, their battery backup somehow still functioning. The exit itself is at the far end—a crash bar door that leads to the underground passages, the Seattle Underground that connects these buried spaces.

Doors line the hallway: the office, the green room, the stairs down to VIP. Each door is closed, some locked, their contents preserved or looted depending on what was worth taking.

The floor is sloped toward a drain. Even in the service areas, everything was designed for cleanup. This club knew it would get messy.`,
      x: -12,
      y: 0,
      z: -1,
      imageOnDisk: 'trinity-back-hallway-x-12-y0-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%BAR_FLOOR',
        east: {
          room: '%OFFICE',
          door: '%OFFICE_DOOR',
          locks: ['%OFFICE_LOCK'],
        },
        west: '%GREEN_ROOM',
        down: '%VIP_STAIRS',
      },
    },

    '%GREEN_ROOM': {
      name: 'Trinity - Green Room',
      description: `The green room for DJs and performers, a small respite from the chaos of the club. The walls are painted a dark green that gives the room its name—though someone added glow-in-the-dark stars to the ceiling at some point, an incongruous touch of whimsy.

A worn leather couch dominates one wall, its cushions shaped by countless bodies taking breaks between sets. A mini-fridge hums in the corner—still running, somehow, its contents long since raided. A mirror with lights around it serves as a makeup station, the bulbs burnt out but the mirror still reflecting.

Posters and photos cover the walls—performers who played here, signed and dated, a gallery of the Seattle electronic scene. Some names became famous. Some burned out. Some are just dead now.

A rider sheet is pinned to a bulletin board, listing a DJ's requirements from years ago: specific vodka brands, temperature preferences, M&Ms with the brown ones removed. The specificity seems charming now.`,
      x: -13,
      y: 0,
      z: -1,
      imageOnDisk: 'trinity-green-room-x-13-y0-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%BACK_HALL',
      },
      sittables: [
        {
          name: 'the green room couch',
          capacity: 4,
          emptyMsg: 'A deep leather couch sags against the wall.',
          occupiedMsg: '%s on the green room couch',
        },
        {
          name: 'a makeup chair',
          capacity: 1,
          emptyMsg: 'A chair sits before the lit mirror.',
          occupiedMsg: '%s at the mirror',
        },
      ],
    },

    '%OFFICE': {
      name: 'Trinity - Office',
      description: `The club's business office, a cramped room that handled everything from bookings to payroll to the less documented aspects of nightlife commerce. A desk dominates the space, its surface buried under paperwork that no one will ever file.

A safe sits in the corner, door hanging open, interior empty. Whatever was worth locking up was taken when worth still meant something. The safe's weight made it impractical to move, so it remains, a monument to the concept of security.

Filing cabinets line one wall, their drawers pulled out, contents scattered. Whoever searched this room was looking for something specific, or was just thorough in their destruction. Tax records mix with DJ contracts mix with what appear to be love letters.

A calendar on the wall shows a month from years ago, its pages never turned, its future dates forever unmet.`,
      x: -11,
      y: 0,
      z: -1,
      imageOnDisk: 'trinity-office-x-11-y0-z-1.png',
      population: 0,
      ambientNoise: 1,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: {
          room: '%BACK_HALL',
          door: '%OFFICE_DOOR',
          locks: ['%OFFICE_LOCK'],
        },
      },
      sittables: [
        {
          name: 'the office chair',
          capacity: 1,
          emptyMsg: 'A rolling office chair sits behind the desk.',
          occupiedMsg: '%s at the office desk',
        },
      ],
    },

    '%VIP_STAIRS': {
      name: 'Trinity - VIP Stairs',
      description: `A narrow staircase descending to the VIP level, hidden behind the alcoves and accessible only to those who knew. The stairs are steep, the treads worn smooth by feet that paid premium prices for privacy and privilege.

Red velvet lines the walls, faded now but still soft to the touch. The fabric absorbs sound, creating a buffer between the main club and whatever happened below. Whatever happened below was the stuff of rumors.

A rope light along the stair edges provided the only illumination, its red glow creating an atmosphere of descent into something other. The lights still work, their transformer somehow drawing power from whatever keeps this building alive.

At the bottom, a velvet curtain blocks the view. Behind it, the VIP lounge waits—smaller than the legends suggested, more intimate than the main floor, and far more private than anywhere else in the city.`,
      x: -14,
      y: 0,
      z: -1,
      imageOnDisk: 'trinity-vip-stairs-x-14-y0-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 8,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ALCOVES',
        up: '%BACK_HALL',
        down: { room: '%VIP', door: '%VIP_DOOR', locks: ['%VIP_LOCK'] },
      },
    },
  },

  postProcessors: [],
};
