// Jade Palace Jewelers - Basement Level (z=-1)
// A karaoke bar beneath the jewelry store, private rooms for singing
// The singing stopped fifty-five years ago. The songs remain on dead servers.

export const floor = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1) - KARAOKE BAR
    // ═══════════════════════════════════════════════════════════════════

    '%KARAOKE_STAIRS': {
      name: 'Karaoke Bar - Stairs',
      description: `The stairs descend into darkness, the kind of deliberate darkness that nightlife venues cultivated. Neon tubes line the stairwell walls, dead now but once pulsing with color—the descent into entertainment, away from the daylight world of work and responsibility.

The walls are painted black, absorbing what little light filters down from above. Faded posters advertise the services: THOUSANDS OF SONGS • PRIVATE ROOMS • FOOD & DRINKS • OPEN LATE. The promise of controlled environments where groups could sing without judgment, where tone-deaf fathers could perform for patient families, where office workers could scream away their stress.

At the bottom, the stairs open into the reception area. The smell of old upholstery and the ghost of cigarette smoke linger—smoking was probably banned, but basements keep secrets.`,
      x: 11,
      y: -6,
      z: -1,
      population: 0,
      ambientNoise: 0,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#SHOWROOM',
          description: 'Stairs lead up to the jewelry store',
        },
        north: '%RECEPTION',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'neon tubes',
          aliases: ['neon', 'tubes', 'lights'],
          description: `Neon tubes running along the stairwell walls in patterns that once pulsed with color—probably synced to music, probably responsive to the bass. The tubes are dead, their gas long since leaked through degraded seals. They'll never glow again, but they still outline the path into the basement's darkness.`,
        },
        {
          prototype: 'describable',
          name: 'promotional posters',
          aliases: ['posters', 'signs', 'advertisements'],
          description: `Faded posters advertising the karaoke bar's services, the images washed to pastels by time. K-pop stars with perfect hair and impossible skin. Hong Kong celebrities whose names no one remembers. The universal promise of karaoke: that anyone can be a star, for one song, in a private room where judgment is suspended. The stars are dead now, or as good as. The songs they performed are data on servers that haven't spun in decades.`,
        },
      ],
    },

    '%RECEPTION': {
      name: 'Karaoke Bar - Reception',
      description: `The reception area was designed to impress—black walls, neon accents, the promise of entertainment to come. A curved counter dominates the space, its surface once backlit in shifting colors, now dark. Behind the counter: a booking system's dark screen, racks of remote controls for the private rooms, the organizational infrastructure of managed fun.

Leather couches line the waiting area, their upholstery cracked from decades of no climate control. This was where groups waited for rooms, where latecomers caught up with parties already in progress, where staff assessed how much the evening's customers were likely to spend on drinks.

A menu board shows prices in a currency that no longer exists: room rental by the hour, drinks by the glass, appetizers meant to soak up alcohol. The prices seem quaint now. Money was the least of what people lost.

Corridors branch off to the private rooms—the real business of karaoke, the soundproofed spaces where people could be terrible singers without consequence.`,
      x: 11,
      y: -5,
      z: -1,
      population: 0,
      ambientNoise: 0,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%KARAOKE_STAIRS',
        east: '%ROOM_CORRIDOR',
        west: '%BAR',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'reception counter',
          aliases: ['counter', 'desk'],
          description: `A curved reception counter that once glowed with internal lighting, now dark. The surface is covered in a layer of dust and forgotten drink rings. Behind the counter: a computer terminal for booking rooms, its screen blank; a cabinet of numbered remote controls, one for each private room; a cash drawer that was probably emptied long ago. A laminated FAQ answers questions no one will ever ask again: "How do I search for songs?" "Can we order more drinks to the room?"`,
        },
        {
          prototype: 'couch',
          name: 'waiting couches',
          aliases: ['couches', 'sofas', 'seating'],
          capacity: 6,
          emptyMsg: 'Cracked leather couches line the waiting area, their cushions compressed from use that ended decades ago.',
          occupiedMsg: 'Someone sits on the cracked leather, disturbing dust that has settled for fifty-five years.',
          description: `Black leather couches arranged in a U-shape around a low table, the waiting area for groups not yet assigned rooms. The leather has cracked in the absence of conditioning, splitting along seams, revealing foam beneath. Cushions bear the permanent impressions of the last people to sit here—waiting for rooms, waiting for friends, waiting for nights that never ended properly.`,
        },
        {
          prototype: 'describable',
          name: 'menu board',
          aliases: ['menu', 'prices', 'board'],
          description: `A backlit menu board listing prices for room rental, drinks, and appetizers. The backlighting is dead, but the printed prices are still legible: "$40/hour - Small Room (4 people)," "$80/hour - Large Room (10 people)," "$25 - Bottle of Soju," "$8 - Edamame." The prices are archaeological artifacts, frozen in time. The currency they reference no longer circulates.`,
        },
        {
          prototype: 'describable',
          name: 'remote controls',
          aliases: ['remotes', 'controls', 'cabinet'],
          description: `A cabinet of numbered remote controls, one for each private room. The remotes are chunky devices, specialized for karaoke systems—buttons for song search, volume control, key changes, skipping intros. They're all dead, their batteries corroded inside. The song library they controlled is stored on servers that haven't powered on in fifty-five years.`,
        },
      ],
    },

    '%BAR': {
      name: 'Karaoke Bar - Bar Area',
      description: `The bar is a time capsule of pre-war drinking culture. Shelves of bottles line the back wall, their labels faded but their contents likely still potent—alcohol doesn't spoil, it just waits. Soju and sake predominate, the drinks Asian karaoke patrons preferred, but whiskey and vodka hold their ground for Western tastes.

The bar counter is sticky with the residue of spilled drinks that dried decades ago. Beer taps are crusted with the ghosts of the last kegs to run dry. A refrigerator case displays bottles that no longer need refrigeration—the glass is fogged, the contents warm, but beer and soda in sealed containers might still be consumable. Might.

A small kitchen window opens to a prep area where appetizers were assembled—the drinking food that kept customers drinking, the profit margin that made bars profitable. The smell of old grease lingers, mixing with the dust and the alcoholic memory of a thousand spilled drinks.`,
      x: 10,
      y: -5,
      z: -1,
      population: 0,
      ambientNoise: 0,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%RECEPTION',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'liquor shelves',
          aliases: ['shelves', 'bottles', 'liquor', 'alcohol'],
          description: `Floor-to-ceiling shelves of bottles, arranged by type and nationality. Korean soju in green bottles, Japanese sake in ceramic jugs, Taiwanese whiskey beside Scottish imports. The bottles are dusty but sealed—their contents probably still drinkable after fifty-five years. Alcohol doesn't spoil. It just waits for mouths that never come.`,
        },
        {
          prototype: 'furniture',
          name: 'bar counter',
          aliases: ['counter', 'bar'],
          description: `A curved bar counter with a padded edge for leaning elbows, the surface sticky with the residue of ancient spills. The lacquer finish has clouded with age. Beer taps rise from the counter, their handles dusty, their lines dried out long ago. The last kegs ran dry decades ago. A tip jar sits empty by the register, its sign—"Tips Appreciated!"—a plea to people who no longer exist.`,
        },
        {
          prototype: 'cabinet',
          name: 'refrigerator case',
          aliases: ['fridge', 'refrigerator', 'cooler'],
          description: `A glass-fronted refrigerator case, its compressor long dead, displaying bottles at whatever temperature the basement maintains. Beer bottles, soda cans, energy drinks—some sealed, some with caps that have corroded. The drinks might still be consumable. They might be poison. Only one way to find out.`,
        },
        {
          prototype: 'describable',
          name: 'beer taps',
          aliases: ['taps', 'draft', 'kegs'],
          description: `A row of beer taps with branded handles—Asian beers mostly: Tsingtao, Sapporo, Asahi. The taps are crusted with the dried residue of the last pours. The kegs they connected to ran dry weeks after the Burning, when the staff stopped coming and the beer kept flowing until it didn't. The CO2 leaked out years ago. The lines are fossilized with dried beer.`,
        },
        {
          prototype: 'describable',
          name: 'prep window',
          aliases: ['window', 'kitchen'],
          description: `A pass-through window to a small kitchen where bar appetizers were prepared. Through the window: a narrow prep space with a wok station, a deep fryer with petrified oil, a reach-in cooler that failed decades ago. The smell of old cooking oil mixes with dust. Whatever food was left rotted to nothing long ago.`,
        },
      ],
    },

    '%ROOM_CORRIDOR': {
      name: 'Karaoke Bar - Room Corridor',
      description: `A corridor lined with numbered doors, each leading to a private karaoke room. The doors are heavy, soundproofed—designed to contain the enthusiastic singing (and screaming) within. Small windows at eye level let staff check on rooms without interrupting, their glass now dusty and dark.

The carpet is industrial, patterned to hide stains, the kind that nightlife venues chose for practicality over beauty. It's worn along the center from decades of foot traffic, though no feet have walked here in fifty-five years.

Room numbers on doors: 1 through 6, plus a larger door marked VIP. Status lights above each door are dark—they once showed green for available, red for occupied. Every room is available now. No one is coming to occupy them.`,
      x: 12,
      y: -5,
      z: -1,
      population: 0,
      ambientNoise: 0,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%RECEPTION',
        north: '%ROOM_3',
        south: '%VIP_ROOM',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'numbered doors',
          aliases: ['doors', 'rooms'],
          description: `Heavy doors line the corridor, each marked with a brass number and equipped with a small window at eye level. The windows let staff peek in to check on parties—to see if drinks needed refreshing, if groups were getting too rowdy, if the night was winding down. The windows are dark now, the rooms beyond silent.`,
        },
        {
          prototype: 'describable',
          name: 'status lights',
          aliases: ['lights', 'indicators'],
          description: `Small status lights above each door, designed to glow green for available, red for occupied. The lights are dark—no power to indicate status, no status to indicate. Every room is available for the next fifty-five years, or forever.`,
        },
        {
          prototype: 'describable',
          name: 'corridor carpet',
          aliases: ['carpet', 'floor'],
          description: `Industrial carpet patterned in dark geometric shapes—the kind chosen to hide drink spills and foot traffic stains. The pattern is worn along the center where people walked, the edges still showing the original colors. The wear patterns are the last record of human movement in this space.`,
        },
      ],
    },

    '%ROOM_3': {
      name: 'Karaoke Bar - Room 3',
      description: `A private karaoke room frozen in the moment its last party ended—or didn't end. A semicircular couch faces a wall-mounted screen, dark now. Microphones on stands wait for singers who will never return. A disco ball hangs from the ceiling, its mirrors dusty, its motor silent.

The room is small, designed for groups of six to eight, intimate enough for friends, large enough for a party. A table in the center holds the detritus of the last session: glasses with the residue of drinks that evaporated decades ago, an ashtray with cigarette butts (so they did smoke despite the ban), a remote control with dead batteries.

Speakers are mounted in corners, silent. The song list screen is dark. The karaoke machine—a specialized computer designed for one purpose—sits in a cabinet, its hard drive holding thousands of songs that no one will ever sing again. Pop songs, ballads, rock anthems, all the music that people used to perform for each other. The performance space is ready. The performers are gone.`,
      x: 12,
      y: -4,
      z: -1,
      population: 0,
      ambientNoise: 0,
      lighting: 0,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%ROOM_CORRIDOR',
      },
      objects: [
        {
          prototype: 'couch',
          name: 'karaoke couch',
          aliases: ['couch', 'sofa', 'seating', 'semicircle'],
          capacity: 8,
          emptyMsg: 'A semicircular couch faces the dark screen, waiting for singers to gather.',
          occupiedMsg: 'Someone sits on the karaoke couch, facing a screen that will never light up.',
          description: `A semicircular couch in synthetic leather, designed to let groups face the screen while still seeing each other. The cushions are compressed from years of use, the surface sticky from spilled drinks that no one cleaned. This is where people gathered to watch friends perform, to cheer terrible singing, to share the kind of vulnerability that alcohol and private rooms made possible.`,
        },
        {
          prototype: 'describable',
          name: 'karaoke screen',
          aliases: ['screen', 'tv', 'monitor'],
          description: `A wall-mounted screen that once displayed lyrics with bouncing balls and music videos with the artist's voice removed. The screen is dark, its power cable dangling behind it. The last song's lyrics are probably still queued in the system's memory, waiting for a singer who will never perform them.`,
        },
        {
          prototype: 'describable',
          name: 'microphones',
          aliases: ['mics', 'microphone'],
          description: `Two wireless microphones on stands, their batteries corroded inside, their foam windscreens yellowed with age. The mics are positioned for duets—the standard karaoke configuration, because suffering is better when shared. They'll never transmit another voice.`,
        },
        {
          prototype: 'describable',
          name: 'disco ball',
          aliases: ['disco', 'ball', 'mirror ball'],
          description: `A disco ball hangs from the ceiling, its mirrored tiles dusty but intact. The motor that once spun it is frozen. When the lights worked and the ball turned, it scattered fragments of color across the room, across the singers, across the drinks. Now it just hangs, reflecting nothing.`,
        },
        {
          prototype: 'describable',
          name: 'drink remnants',
          aliases: ['glasses', 'drinks', 'table'],
          description: `A low table covered with the archaeology of the last party: glasses with the dried residue of drinks that evaporated years ago, an ashtray with cigarette butts gray with age, a karaoke remote with corroded batteries. Someone's phone charging cable is still plugged into the wall—the phone it charged is long gone. The party didn't end. It just stopped.`,
        },
        {
          prototype: 'cabinet',
          name: 'karaoke machine cabinet',
          aliases: ['cabinet', 'machine', 'system'],
          description: `A cabinet housing the karaoke system—a specialized computer with a massive song library stored on hard drives that haven't spun in decades. The system could search songs by title, artist, genre, or language. It could change keys for singers who couldn't reach the high notes. It could adjust tempo for the dramatically inclined. Now it's a box of dead electronics and frozen data.`,
        },
      ],
    },

    '%VIP_ROOM': {
      name: 'Karaoke Bar - VIP Room',
      description: `The VIP room is larger, more lavish, designed for parties that could afford to pay extra for status. Leather couches line three walls instead of one. The screen is bigger. The sound system was better. A private bar in the corner let VIPs drink without waiting for service.

The room speaks of excess that once felt normal: gold-painted accents, mirrors that multiplied the space, lighting designed to flatter. The VIP package probably included champagne service, appetizers, maybe a hostess to manage the song queue. The room was designed to make people feel important.

Now it's a mausoleum of status. The leather has cracked worse than the standard rooms—real leather, not synthetic, more vulnerable to neglect. The private bar's bottles are dusty but intact. The sound system is silent, its speakers larger than the other rooms, its subwoofer still mounted in the corner. The bass hasn't thumped in fifty-five years.`,
      x: 12,
      y: -6,
      z: -1,
      population: 0,
      ambientNoise: 0,
      lighting: 0,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ROOM_CORRIDOR',
      },
      objects: [
        {
          prototype: 'couch',
          name: 'vip couches',
          aliases: ['couches', 'leather', 'seating'],
          capacity: 12,
          emptyMsg: 'Leather couches line three walls, arranged for a party that never ended properly.',
          occupiedMsg: 'Someone claims a spot on the cracked leather, raising dust from cushions that haven\'t been disturbed in decades.',
          description: `Real leather couches—the kind that cost extra, that signaled VIP status—line three walls. The leather has cracked and split from decades without conditioning, revealing stuffing beneath. The couches could seat twelve comfortably, more if people didn't mind proximity. They're empty now, their cushions still bearing the impressions of the last party.`,
        },
        {
          prototype: 'cabinet',
          name: 'vip bar',
          aliases: ['bar', 'mini bar', 'private bar'],
          description: `A private bar in the corner of the VIP room—bottles of premium liquor arranged on glass shelves, wine glasses hanging from an overhead rack, a small sink for washing between drinks. The bottles are the expensive ones: Yamazaki whiskey, Dom Pérignon champagne, the status symbols that VIP rooms required. The champagne has probably gone flat in its bottles. The whiskey doesn't care about time.`,
        },
        {
          prototype: 'describable',
          name: 'gold accents',
          aliases: ['gold', 'accents', 'trim'],
          description: `Gold-painted accents cover surfaces throughout the room—crown molding, picture frames, the edges of tables. The gold is tarnished now, more brown than bright, but it still signals the room's elevated status. VIPs paid for this gold. The gold doesn't care that they're gone.`,
        },
        {
          prototype: 'describable',
          name: 'wall mirrors',
          aliases: ['mirrors', 'reflections'],
          description: `Mirrors cover portions of the walls, designed to make the room feel larger, to multiply the party, to let singers see themselves perform from every angle. The mirrors are dusty but intact, reflecting a room that no longer hosts parties. In the right light, you might see the ghosts of VIPs, still singing, still drinking, still pretending their status matters.`,
        },
        {
          prototype: 'describable',
          name: 'subwoofer',
          aliases: ['sub', 'bass', 'speaker'],
          description: `A massive subwoofer mounted in the corner, the component that made VIP rooms feel different—the bass you could feel in your chest, the vibration that turned music into physical experience. The speaker cone has sagged from years without use. It'll never thump again, but it still occupies the space where bass used to live.`,
        },
      ],
    },
  },
};
