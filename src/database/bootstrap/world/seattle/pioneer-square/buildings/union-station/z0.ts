// Union Station - Ground Floor (z=0)
// Beaux-Arts terminal opened 1911, designed by Reed & Stem
// Same architects as New York's Grand Central Terminal

export const building = {
  name: 'Union Station',
  x: -7,
  y: -9,
  width: 4,
  height: 3,
  floors: 3, // z-1 (platforms), z0 (main hall), z1 (mezzanine), z2 (roof)

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN_LOCK': {
      prototype: 'lock',
      name: 'Union Station Main Door Lock',
      description:
        'A massive brass lock, the kind designed to secure a building meant to last centuries.',
      difficulty: 6,
    },

    '%SERVICE_LOCK': {
      prototype: 'biometricLock',
      name: 'Service Area Scanner',
      description:
        'A modern biometric scanner retrofitted to the service entrance, incongruous against the Beaux-Arts stonework.',
      scanners: [
        { type: 'fingerprint', part: 'hand', message: 'Authorized personnel only.' },
      ],
      authorizedUsers: {},
    },

    '%PLATFORM_LOCK': {
      prototype: 'lock',
      name: 'Platform Gate Lock',
      description:
        'A heavy padlock on the gate leading down to the platforms.',
      difficulty: 4,
    },

    // ═══════════════════════════════════════════════════════════════════
    // DOORS
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN_DOOR': {
      prototype: 'door',
      name: 'Union Station Main Entrance',
      description:
        'Massive bronze doors beneath a grand archway, their surfaces green with verdigris but still magnificent.',
      closed: true,
      locked: false,
      locks: ['%MAIN_LOCK'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - MAIN HALL AND TICKET OFFICES
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN_ENTRANCE': {
      name: 'Union Station - Main Entrance',
      description: `The grand entrance to Union Station, where massive bronze doors open beneath a Beaux-Arts archway of carved granite. The doors themselves are fifteen feet tall, their surfaces green with verdigris, decorated with relief sculptures of locomotives and eagles—the iconography of American expansion rendered in metal.

Above the doorway, carved into the stone frieze: UNION STATION 1911. The date marks the year Seattle believed itself destined for greatness, when railroads connected the city to the rest of the continent. The greatness came and went. The station remains.

The vestibule beyond is a transition space—marble floors, brass fixtures, the promise of the grand hall visible through interior doors of oak and glass. The smell is dust and cold stone, the silence of a space designed for crowds that no longer come.`,
      x: -5,
      y: -9,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 's-jackson/x-5.ts',
          door: '%MAIN_DOOR',
          description: 'Through the bronze doors to S. Jackson Street',
        },
        north: '%GRAND_HALL_S',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'bronze doors',
          aliases: ['doors', 'entrance doors', 'main doors'],
          description: `The main entrance doors, each weighing perhaps a ton, their bronze surfaces oxidized to a beautiful verdigris green. Relief sculptures decorate the panels: a steam locomotive on one door, a bald eagle on the other. The doors swing on massive hinges, their movement smooth despite a century of use. They were built to last. They have.`,
        },
        {
          prototype: 'describable',
          name: 'entrance frieze',
          aliases: ['frieze', 'carving', 'inscription'],
          description: `Carved into the granite above the doors: UNION STATION 1911, the letters deep-cut and still sharp. Flanking the text, decorative flourishes in the Beaux-Arts style—garlands, torches, the symbols of civic pride that architects once considered essential. The stone has weathered but the message remains clear: this was built to impress.`,
        },
      ],
    },

    '%GRAND_HALL_S': {
      name: 'Union Station - Grand Hall (South)',
      description: `The southern end of Union Station's grand hall, where the scale of the space first becomes apparent. The ceiling rises sixty feet overhead, a barrel vault of coffered plaster painted in pale blue and gold. The decoration is Beaux-Arts at its most confident—acanthus leaves, rosettes, the visual vocabulary of European palaces translated to American commerce.

Massive Corinthian columns line the walls, their capitals gilded, their shafts of polished granite that catches the light from tall arched windows. The windows are intact, their glass leaded in geometric patterns, filtering daylight into something almost sacred.

The marble floor stretches north toward the ticket windows, its surface worn by millions of footsteps—passengers who came and went when this hall was the gateway to the nation. The footsteps have stopped. The wear they left behind is permanent.`,
      x: -5,
      y: -8,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%MAIN_ENTRANCE',
        north: '%GRAND_HALL_C',
        west: '%WAITING_ROOM_S',
        east: '%TICKET_OFFICE',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'coffered ceiling',
          aliases: ['ceiling', 'vault', 'barrel vault'],
          description: `The ceiling rises sixty feet overhead, a barrel vault divided into deep coffers, each painted in pale blue with gold trim. The plaster work is elaborate—rosettes in each coffer, acanthus borders, the craftsmanship of an age that believed train stations deserved the same attention as cathedrals. Some water damage shows at the edges, stains spreading from failed roof flashings, but the overall effect remains magnificent.`,
        },
        {
          prototype: 'describable',
          name: 'Corinthian columns',
          aliases: ['columns', 'pillars'],
          description: `Massive columns of polished granite, perhaps four feet in diameter, rise from the floor to support the ceiling. Their capitals are gilded Corinthian—acanthus leaves and scrolls rendered in gold leaf that still catches the light. The columns are structural but also theatrical, designed to make passengers feel they were entering a palace rather than a train station. The palace is empty now. The columns remain.`,
        },
      ],
    },

    '%GRAND_HALL_C': {
      name: 'Union Station - Grand Hall (Center)',
      description: `The center of Union Station's grand hall, beneath the highest point of the barrel vault. A massive chandelier hangs from the apex—hundreds of crystal pendants and brass fixtures, dark now, its bulbs dead, but still impressive in its scale. The chandelier was electrified when the station opened, a marvel of modern technology. The electricity stopped. The chandelier waits.

Information boards line the walls, their departure times frozen at dates years past. PORTLAND - 2:15 PM. CHICAGO - 4:30 PM. LOS ANGELES - 8:00 PM. The trains left or didn't leave. The boards remember schedules that no longer apply.

A compass rose is inlaid in the marble floor, its cardinal points marked in bronze. The rose is worn smooth at its center, where generations of travelers stood to orient themselves. The orientation no longer matters, but the rose remains.`,
      x: -5,
      y: -7,
      z: 0,
      population: 0,
      ambientNoise: 10,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%GRAND_HALL_S',
        north: '%GRAND_HALL_N',
        west: '%WAITING_ROOM_N',
        east: '%BAGGAGE_CLAIM',
        up: '%MEZZANINE_C',
      },
      sittables: [
        {
          name: 'the compass rose',
          capacity: 4,
          emptyMsg:
            'A compass rose is inlaid in the marble floor, its bronze points marking cardinal directions.',
          occupiedMsg: '%s standing at the center of the compass rose',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'grand chandelier',
          aliases: ['chandelier', 'light fixture', 'crystal chandelier'],
          description: `A chandelier of monumental proportions hangs from the vault's apex, perhaps fifteen feet in diameter. Hundreds of crystal pendants catch what light remains, throwing faint rainbows across the walls. The brass framework is tarnished, the bulbs dead, but the chandelier's presence dominates the space. It was meant to awe arriving passengers with the grandeur of their destination. It still awes, though no passengers arrive.`,
        },
        {
          prototype: 'describable',
          name: 'departure boards',
          aliases: ['boards', 'schedules', 'information boards'],
          description: `Split-flap departure boards line the walls, their letters and numbers frozen at whatever position they held when the power failed. PORTLAND reads one, the departure time showing 2:15 PM, the track number blank. CHICAGO shows 4:30 PM. The dates are years past. The trains left or were cancelled. The boards remember a world of schedules and destinations, of connections and arrivals. The connections ended. The boards remain.`,
        },
      ],
    },

    '%GRAND_HALL_N': {
      name: 'Union Station - Grand Hall (North)',
      description: `The northern end of the grand hall, where the barrel vault descends toward a massive mural depicting the arrival of the transcontinental railroad in Seattle. The mural covers the entire north wall—locomotives streaming into the station, crowds waving, the triumph of engineering over geography celebrated in paint and gilt.

The mural is faded now, its colors muted by decades of grime, but the composition remains powerful. Workers drive spikes into rails. Mountains part for tunnels. The Pacific Ocean gleams on the horizon. The railroad's promise of connection is rendered in visual propaganda that once seemed like prophecy.

Doors on either side lead to the platform stairs, their brass handles worn smooth. The platforms below are silent now, but the doors remain, waiting for passengers who won't come.`,
      x: -5,
      y: -6,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%GRAND_HALL_C',
        west: '%RESTAURANT',
        east: '%NEWS_STAND',
        down: { room: '%PLATFORM_C', locks: ['%PLATFORM_LOCK'] },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'railroad mural',
          aliases: ['mural', 'painting', 'wall painting'],
          description: `A mural perhaps forty feet wide and twenty feet tall covers the north wall, depicting the arrival of the transcontinental railroad in Seattle. Steam locomotives pull into a station—this station—while crowds wave and cheer. Workers drive golden spikes. Mountains part for tunnels. The Pacific gleams in the distance. The style is heroic, propagandistic, the visual language of Manifest Destiny. The propaganda worked. The railroad came. The trains stopped. The mural endures, a monument to a triumph that didn't last.`,
        },
        {
          prototype: 'describable',
          name: 'platform doors',
          aliases: ['doors', 'brass doors'],
          description: `Heavy doors flank the mural, leading to stairs that descend to the platforms below. The doors are oak with brass handles, the handles worn smooth and bright by generations of hands. Signs above them read: TO TRAINS - TRACKS 1-6. The tracks are silent now. The doors wait for passengers who won't come.`,
        },
      ],
    },

    '%WAITING_ROOM_S': {
      name: 'Union Station - South Waiting Room',
      description: `The south waiting room, where passengers once sat on wooden benches while awaiting their trains. The benches remain—high-backed oak pews more suitable for a church than a station, arranged in rows facing a clock that stopped at 3:47. The clock face is ornate, its hands frozen, its pendulum still.

The walls are paneled in dark wood, the ceiling coffered in a smaller version of the grand hall's pattern. Brass light fixtures hang at intervals, their frosted glass shades intact, their bulbs dead. The room feels like a chapel, a space designed for quiet contemplation of journeys past and future.

A fireplace occupies one wall, its hearth cold, its mantle decorated with carved locomotives. The fireplace was probably never functional—a decorative gesture toward warmth in a space heated by steam radiators that still line the walls, cold and silent.`,
      x: -6,
      y: -8,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GRAND_HALL_S',
        north: '%WAITING_ROOM_N',
      },
      sittables: [
        {
          name: 'a waiting bench',
          capacity: 6,
          emptyMsg:
            'High-backed wooden benches are arranged in rows, their surfaces worn smooth by generations of waiting passengers.',
          occupiedMsg: '%s sitting on one of the waiting room benches',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'stopped clock',
          aliases: ['clock', 'wall clock'],
          description: `A large clock hangs on the wall, its face ornate with Roman numerals and decorative scrollwork. The hands are frozen at 3:47, the time preserved when the clock's mechanism finally failed. The clock was the waiting room's heartbeat once, its ticking marking the minutes until departure. The heartbeat stopped. The hands remain, pointing at a moment that means nothing now.`,
        },
        {
          prototype: 'describable',
          name: 'decorative fireplace',
          aliases: ['fireplace', 'hearth', 'mantle'],
          description: `A fireplace of carved marble, its hearth clearly never used—the flue probably decorative rather than functional. The mantle is carved with miniature locomotives, their details precise, their engines forever in motion. The fireplace was meant to suggest warmth and comfort, the domestic virtues of home applied to the transitional space of a station. The suggestion remains. The warmth is gone.`,
        },
      ],
    },

    '%WAITING_ROOM_N': {
      name: 'Union Station - North Waiting Room',
      description: `The north waiting room, a mirror of the south but with subtle differences that mark the passage of time. The same wooden benches, but some have been broken and removed, leaving gaps in the rows. The same wood paneling, but one section has been replaced with drywall—a renovation from the building's conversion to office space in the 1990s.

A newsstand occupied one corner, its glass case still visible though empty. Racks that held magazines and newspapers stand bare. A cigarette machine from the 1960s squats against one wall, its prices laughably low, its mechanism long since emptied.

The waiting continued here longer than most places. The 1990s conversion kept the waiting rooms largely intact, treating them as historic features. Now they wait for nothing, historic features of a history no one studies.`,
      x: -6,
      y: -7,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GRAND_HALL_C',
        south: '%WAITING_ROOM_S',
        north: '%RESTAURANT',
      },
      sittables: [
        {
          name: 'a remaining bench',
          capacity: 4,
          emptyMsg:
            'Gaps in the bench rows show where some were removed. The remaining benches are worn but intact.',
          occupiedMsg: '%s sitting on one of the remaining waiting room benches',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'empty newsstand',
          aliases: ['newsstand', 'magazine stand', 'kiosk'],
          description: `A glass-fronted newsstand case, its shelves empty, its cash register drawer hanging open. Wire racks that once held magazines and newspapers stand bare beside it. A sign above reads PERIODICALS & TOBACCO, the offerings of an age when people read on paper and smoked without shame. The stand is a time capsule of obsolete vices.`,
        },
        {
          prototype: 'describable',
          name: 'cigarette machine',
          aliases: ['machine', 'vending machine'],
          description: `A cigarette vending machine from the 1960s, its chrome trim dulled, its plastic buttons yellowed. The prices shown—$0.35 per pack—are archaeological evidence of another era. The machine is empty, its mechanism disabled, but its presence recalls a time when smoking was universal and buying cigarettes required no questions, no age verification, just coins and a pull of a lever.`,
        },
      ],
    },

    '%TICKET_OFFICE': {
      name: 'Union Station - Ticket Office',
      description: `The ticket office, where generations of passengers purchased their passage to destinations across the nation. A long marble counter separates the public area from the agent booths, its surface worn smooth by the elbows of travelers leaning forward to hear departure times and prices.

Behind the counter, five ticket windows are framed by brass grillwork in elaborate Art Nouveau patterns. The grilles are ornamental but also functional—they protected agents from aggressive travelers while allowing the passage of tickets and cash. The windows are dark now, the booths behind them stripped of equipment.

A destination board hangs above the counter, listing cities that were reachable by rail: PORTLAND, SPOKANE, SAN FRANCISCO, CHICAGO, NEW YORK. The cities may still exist. The routes do not. The board lists destinations that are no longer destinations.`,
      x: -4,
      y: -8,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GRAND_HALL_S',
        north: '%BAGGAGE_CLAIM',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'ticket windows',
          aliases: ['windows', 'booths', 'ticket booths'],
          description: `Five ticket windows, each framed by brass grillwork in flowing Art Nouveau patterns—vines and flowers rendered in metal, beautiful and functional. The grilles allowed money and tickets to pass while protecting agents from the occasional difficult customer. The windows are dark now, the booths empty, the grillwork tarnished but intact. The beauty outlasted its function.`,
        },
        {
          prototype: 'describable',
          name: 'destination board',
          aliases: ['board', 'cities', 'routes'],
          description: `A painted board lists the destinations reachable from Union Station: PORTLAND, SPOKANE, SAN FRANCISCO, LOS ANGELES, CHICAGO, MINNEAPOLIS, NEW YORK. The cities are arranged by route—the Northern Pacific, the Great Northern, connections that made Seattle a terminus rather than an endpoint. The routes are memories now. The board remains, promising journeys that can't be taken.`,
        },
        {
          prototype: 'desk',
          name: 'ticket counter',
          aliases: ['counter', 'marble counter'],
          description: `A counter of white marble, perhaps forty feet long, its surface worn by the elbows of millions of travelers. The marble is stained in places, scratched, its polish dulled by decades of hands and bags. The counter was designed to be imposing—the barrier between passengers and the power to send them places. The power is gone. The counter remains.`,
        },
      ],
    },

    '%BAGGAGE_CLAIM': {
      name: 'Union Station - Baggage Claim',
      description: `The baggage claim area, where porters once hauled trunks and suitcases to waiting passengers. A long counter runs the length of the room, its surface marked with the scars of heavy luggage. Behind the counter, empty shelving units stretch into shadow—the racks that once held bags waiting for their owners.

A conveyor belt occupies one section, a modernization from the 1970s that was never quite integrated with the station's historic architecture. The belt is still, its rubber surface cracked and gray. Luggage tags are scattered on the floor, their destinations illegible, their owners unknown.

The scales remain—massive brass devices that weighed trunks before the days of weight limits, when passengers could bring their entire households on a train. The scales are frozen, their needles pointing at zero.`,
      x: -4,
      y: -7,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GRAND_HALL_C',
        south: '%TICKET_OFFICE',
        north: '%NEWS_STAND',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'baggage conveyor',
          aliases: ['conveyor', 'belt', 'conveyor belt'],
          description: `A conveyor belt from the 1970s, retrofitted into the historic space with little concern for aesthetics. The belt is still, its rubber surface cracked and gray, its motor silent. The conveyor was meant to modernize baggage handling. The modernization became obsolete. The conveyor remains, a relic of a relic.`,
        },
        {
          prototype: 'describable',
          name: 'brass scales',
          aliases: ['scales', 'weighing scales'],
          description: `Massive brass scales, designed to weigh steamer trunks and heavy luggage. The scales are beautiful objects—decorated with scrollwork, their pans large enough to hold a small child. They predate weight limits, when passengers brought whatever they could afford to ship. The scales are frozen at zero. The luggage they weighed is dust.`,
        },
      ],
    },

    '%NEWS_STAND': {
      name: 'Union Station - News Stand',
      description: `A small commercial space that served travelers' last-minute needs—newspapers, magazines, snacks, the forgotten items that long journeys required. The shop is gutted now, its shelves empty, its cash registers looted, but the structure remains: glass display cases, wooden shelving, the bones of retail commerce.

A lunch counter occupies the back of the space, its stools still bolted to the floor, its counter scarred by coffee cups and sandwich plates. The counter served quick meals to travelers between trains—sandwiches, pie, coffee in heavy ceramic cups. The cups are gone. The stains remain.

A hand-painted sign above the door reads: UNION STATION SUNDRIES - NEWSPAPERS - TOBACCO - CONFECTIONS. The offerings of another age, when information came on paper and sugar was sold without guilt.`,
      x: -4,
      y: -6,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%GRAND_HALL_N',
        south: '%BAGGAGE_CLAIM',
      },
      sittables: [
        {
          name: 'a lunch counter stool',
          capacity: 5,
          emptyMsg:
            'Five stools remain bolted to the floor before the lunch counter, their leather seats cracked and faded.',
          occupiedMsg: '%s sitting at the old lunch counter',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'lunch counter',
          aliases: ['counter', 'food counter'],
          description: `A lunch counter of worn formica, its surface stained by decades of coffee and pie. The counter curves slightly, designed to give each customer a view of the cook working behind it. The cooking equipment is gone—the grill, the coffee urns, the pie case—but the counter remains, a fossil of quick-service dining from an age when train travel meant meals grabbed between connections.`,
        },
        {
          prototype: 'describable',
          name: 'sundries sign',
          aliases: ['sign', 'painted sign'],
          description: `A hand-painted sign above the door, its lettering faded but legible: UNION STATION SUNDRIES - NEWSPAPERS - TOBACCO - CONFECTIONS. The word "sundries" itself is a fossil, a term from an era when shops sold miscellaneous goods rather than curated collections. The sign advertises a business model that no longer exists, offerings for customers who no longer come.`,
        },
      ],
    },

    '%RESTAURANT': {
      name: 'Union Station - Station Restaurant',
      description: `The station restaurant, a formal dining room where travelers could enjoy proper meals before or after their journeys. The room is elegant even in decay—white tablecloths now gray with dust, crystal chandeliers dark but intact, the ghost of fine dining haunting an empty space.

Tables for two and four are arranged with mathematical precision, their chairs pushed in, their settings long since removed. A grand piano sits in one corner, its lid closed, its keys yellowed but probably still functional. Someone played here once, providing ambiance for diners who ate to the sound of standards and show tunes.

The kitchen doors are closed, their round windows revealing nothing of the space beyond. A menu board lists specialties: PRIME RIB, SALMON WELLINGTON, BAKED ALASKA. The specialties are memories now, recipes for meals no one will prepare.`,
      x: -6,
      y: -6,
      z: 0,
      population: 0,
      ambientNoise: 5,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%GRAND_HALL_N',
        south: '%WAITING_ROOM_N',
        west: '%KITCHEN',
      },
      sittables: [
        {
          name: 'a dining table',
          capacity: 4,
          emptyMsg:
            'Tables for four are arranged throughout the room, their white tablecloths gray with dust.',
          occupiedMsg: '%s sitting at one of the dining tables',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'grand piano',
          aliases: ['piano', 'instrument'],
          description: `A grand piano sits in the corner, its black lacquer dulled by dust but still elegant. The lid is closed, the keys protected. A piano bench waits before it, positioned as if the pianist just stepped away. The piano probably still works—these instruments were built to last. Someone played dinner music here once, standards and show tunes for travelers eating salmon wellington. The music stopped. The piano waits.`,
        },
        {
          prototype: 'describable',
          name: 'crystal chandeliers',
          aliases: ['chandeliers', 'lights'],
          description: `Crystal chandeliers hang at intervals across the ceiling, their pendants catching what light filters through dusty windows. The chandeliers are smaller than the grand hall's centerpiece but still impressive—perhaps four feet across, their brass frameworks supporting hundreds of crystals. They're dark now, their bulbs dead, but they still sparkle faintly, catching light they can no longer provide.`,
        },
      ],
    },

    '%KITCHEN': {
      name: 'Union Station - Restaurant Kitchen',
      description: `The commercial kitchen that served the station restaurant, a space of stainless steel and industrial efficiency. The equipment remains—massive stoves, walk-in refrigerators, prep tables—but all of it is cold and silent. The refrigerators stand open, their contents long since removed or rotted away. The stoves are crusted with grease that hardened years ago.

Pots and pans hang from overhead racks, their copper bottoms tarnished green. The kitchen was designed to serve hundreds of diners per day, with the capacity to prepare elaborate meals under time pressure. The pressure is gone. The capacity remains, unused.

A service door leads to the alley, its push bar corroded but functional. The door was for deliveries and staff, the working entrance that kept commerce invisible to diners.`,
      x: -7,
      y: -6,
      z: 0,
      population: 0,
      ambientNoise: 3,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%RESTAURANT',
        south: '%SERVICE_CORRIDOR',
        west: {
          to: 'alleys/x-8-y-6.ts',
          locks: ['%SERVICE_LOCK'],
          description: 'A service door leads to the alley',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'commercial stoves',
          aliases: ['stoves', 'ranges', 'ovens'],
          description: `Massive commercial stoves line one wall, their surfaces crusted with grease that hardened years ago. The stoves are gas-fired, their burners covered with cast iron grates. Ovens below are large enough to roast whole turkeys. The equipment was designed for volume—hundreds of meals per service, elaborate preparations executed under pressure. The pressure ended. The grease remains.`,
        },
        {
          prototype: 'describable',
          name: 'copper pans',
          aliases: ['pans', 'pots', 'cookware'],
          description: `Copper pans and pots hang from overhead racks, their bottoms tarnished to a green patina. The copper was expensive even when new—chosen for its heat distribution, maintained for its appearance. The pans are various sizes, each designed for specific dishes in the restaurant's repertoire. The repertoire is forgotten. The pans remain, waiting for heat that won't come.`,
        },
      ],
    },

    '%SERVICE_CORRIDOR': {
      name: 'Union Station - Service Corridor',
      description: `A utilitarian corridor behind the public spaces, where the station's operations happened out of sight. The walls are bare concrete, the floor linoleum worn through to the subfloor in high-traffic areas. Pipes and conduits run along the ceiling, the infrastructure of a building designed when mechanical systems were meant to be hidden.

Doors line both sides—storage rooms, mechanical spaces, the warren of support functions that kept the station running. Most doors are locked or jammed. Some hang open on darkness.

A staircase at the end leads down to the platform level, where trains once arrived and departed. A gate bars access, a chain and padlock securing it. The platform level is silent now, but the stairs remain, waiting for passengers who won't come.`,
      x: -7,
      y: -7,
      z: 0,
      population: 0,
      ambientNoise: 8,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%KITCHEN',
        east: '%WAITING_ROOM_N',
        down: { room: '%PLATFORM_W', locks: ['%PLATFORM_LOCK'] },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'exposed pipes',
          aliases: ['pipes', 'infrastructure'],
          description: `Pipes and conduits run along the ceiling—water, steam, electrical, each coded in colors that meant something to maintenance workers. The pipes show the station's age in their variety: cast iron from original construction, copper from mid-century renovations, PVC from more recent repairs. Each era left its mark in the infrastructure. The infrastructure remains, carrying nothing.`,
        },
      ],
    },
  },
};
