// Pioneer Building - Fourth Floor (z=3)
// Seattle Import/Export Company

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // FOURTH FLOOR (z=3) - SEATTLE IMPORT/EXPORT
    // ═══════════════════════════════════════════════════════════════════

    '%ELEV_LOBBY_Z3': {
      name: 'Pioneer Building - Fourth Floor Elevator Lobby',
      description: `The fourth-floor elevator lobby, smaller than those below as the building narrows toward its peak. SEATTLE IMPORT/EXPORT CO. reads the sign on the main door—a hand-painted sign, older than the building's other tenants, suggesting a company that predates the modern era of vinyl lettering.

The walls here are decorated with travel posters from another age—steamship lines to the Orient, railways across Siberia, trade routes that circled the globe. The posters are faded, their colors muted, their promises of adventure now ironic in their obsolescence.

A worn runner leads from the elevator to the office door, its pattern nearly invisible from decades of traffic.`,
      x: 2,
      y: 9,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%IMPORT_RECEPTION',
        south: '%HALL_Z3',
        up: '%STAIR_Z4',
        down: '%STAIR_Z2',
        in: '%E',
      },
      elevatorId: '%E',
      objects: [
        {
          prototype: 'describable',
          name: 'travel posters',
          aliases: ['posters', 'advertisements'],
          description: `Framed travel posters line the walls, relics of an age when global trade meant adventure. A Japanese steamship line promises GATEWAY TO THE ORIENT. A Siberian railway advertises THE GREAT TRANS-CONTINENTAL JOURNEY. A Pacific Mail poster shows a steamer against a tropical sunset. The posters are faded, their colors dulled by decades of light, their promises of distant shores now artifacts of a smaller, more connected world.`,
        },
      ],
    },

    '%STAIR_Z3': {
      name: 'Pioneer Building - Fourth Floor Stairwell',
      description: `The staircase landing between the fourth and fifth floors. The marble steps are more worn here, the center of each tread dipped by generations of ascending feet. The iron balusters continue their pattern of oak leaves and acorns, though some are loose in their sockets, rattling slightly when touched.

A small window faces south, offering a view of the buildings across S. Washington Street. The glass is thick, old, its surface slightly rippled. Through it, the city looks like an impressionist painting, all soft edges and uncertain boundaries.`,
      x: 2,
      y: 8,
      z: 3,
      population: 0,
      ambientNoise: 3,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%STAIR_Z4',
        down: '%STAIR_Z2',
        north: '%ELEV_LOBBY_Z3',
      },
    },

    '%HALL_Z3': {
      name: 'Pioneer Building - Fourth Floor Hallway',
      description: `The fourth-floor corridor, noticeably narrower than those below. The building's footprint decreases as it rises, the walls stepping inward in ways that feel almost organic. The hallway bends slightly, following the building's original construction, before modern architecture demanded perfect right angles.

Offices line both sides, their doors a mix of frosted glass and solid wood. Some bear the Seattle Import/Export name; others are unmarked, their tenants forgotten even before everything stopped. The carpet here is green, a color that might once have suggested money but now just suggests age.`,
      x: 2,
      y: 8,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ELEV_LOBBY_Z3',
        east: '%IMPORT_SAMPLES',
        west: '%IMPORT_ACCOUNTING',
      },
    },

    '%IMPORT_RECEPTION': {
      name: 'Seattle Import/Export - Reception',
      description: `The reception area of Seattle Import/Export, a company that seems to have been in business since the building was new. The walls are lined with curiosities from around the world—a Chinese screen, Japanese prints, Indonesian carvings, goods that were imports once and are now just objects.

A curved reception desk guards the entrance, its surface cluttered with shipping manifests and trade catalogs. Behind it, a massive world map covers one wall, its surface bristling with pins connected by strings—trade routes traced in red, green, and blue threads that form a web of global commerce.

The map is out of date, borders that have shifted, countries that have renamed themselves, but the trade routes remain traced, the paths that goods once traveled.`,
      x: 1,
      y: 9,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ELEV_LOBBY_Z3',
        south: '%IMPORT_ACCOUNTING',
        west: '%IMPORT_DIRECTOR',
      },
      objects: [
        {
          prototype: 'desk',
          name: 'reception desk',
          aliases: ['desk', 'curved desk'],
          description: `A curved wooden desk, its surface buried under the paper trail of international trade—shipping manifests, customs forms, catalogs from suppliers in a dozen countries. A rotary telephone sits among the papers, its cord tangled with shipping tape and rubber bands. The desk was the nerve center of the company's operations. The operations stopped. The paperwork remains.`,
        },
        {
          prototype: 'describable',
          name: 'world map',
          aliases: ['map', 'trade map'],
          description: `A massive world map, perhaps eight feet across, covers one wall. Its surface is studded with pins—red for ports, green for suppliers, blue for clients—connected by strings that trace the company's trade routes. Seattle to Tokyo to Hong Kong to Singapore, across to Mumbai and through Suez to Rotterdam and London. The web of global commerce, made visible in thread and pins. The threads are dusty now. The routes are closed.`,
        },
        {
          prototype: 'describable',
          name: 'Chinese screen',
          aliases: ['screen', 'folding screen'],
          description: `A folding screen of lacquered wood and painted silk, depicting cranes in flight against a mountain backdrop. The screen is at least a century old, its lacquer cracked, its silk slightly faded, but the craftsmanship remains impressive. It was probably a gift from a trading partner, or a sample of goods the company once imported. It has outlasted its provenance.`,
        },
      ],
    },

    '%IMPORT_DIRECTOR': {
      name: "Seattle Import/Export - Director's Office",
      description: `The director's office, a corner space filled with the accumulated artifacts of decades in the import/export trade. The desk is buried under ledgers and shipping documents, but the walls are what draw the eye—covered floor to ceiling with photographs, certificates, and memorabilia from a lifetime of global commerce.

A ship's wheel is mounted on one wall, brass fittings gleaming, the wheel of a vessel the director must have sailed. Photographs show the same wheel on the bridge of a freighter, the director younger and harder, squinting against Pacific sun. The photographs trace a career: ports in Japan, markets in Singapore, warehouses in Rotterdam.

A globe stands on a wooden pedestal, its surface worn smooth along the trade routes the director traced with his finger, planning voyages and calculating profits.`,
      x: 1,
      y: 10,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%IMPORT_RECEPTION',
        south: '%IMPORT_SHIPPING',
      },
      sittables: [
        {
          name: "the director's chair",
          capacity: 1,
          emptyMsg:
            'A leather chair sits behind the cluttered desk, angled to face both the door and the window.',
          occupiedMsg: "%s sitting in the director's chair",
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: "ship's wheel",
          aliases: ['wheel', 'helm'],
          description: `A ship's wheel mounted on the wall, perhaps three feet across, its brass fittings polished bright. The wheel is real, not decorative—worn smooth by years of hands steering through weather. A brass plaque beneath it reads: M/V SEATTLE MARU, 1962-1989. The ship is gone, scrapped or sunk. The wheel remains, spinning freely when turned, connected to nothing.`,
        },
        {
          prototype: 'describable',
          name: 'career photographs',
          aliases: ['photographs', 'photos', 'pictures'],
          description: `Dozens of photographs cover one wall, tracing a career in global trade. The director at different ages, in different ports: shaking hands with suppliers in Tokyo, supervising loading in Singapore, signing contracts in Rotterdam. The photographs yellow with age, the director growing older through them, the world around him changing while the work remained the same. The work stopped. The photographs persist.`,
        },
        {
          prototype: 'describable',
          name: 'worn globe',
          aliases: ['globe', 'world globe'],
          description: `A large globe on a wooden pedestal, perhaps two feet in diameter. The surface is worn smooth along certain paths—trade routes traced so often that the director's finger polished away the print. Seattle to Tokyo shows as a pale arc. The Pacific Rim is nearly blank. The routes he traveled are visible in what he wore away.`,
        },
      ],
    },

    '%IMPORT_SHIPPING': {
      name: 'Seattle Import/Export - Shipping Office',
      description: `The operational heart of the company, where shipments were tracked and logistics coordinated. Desks are arranged in efficient rows, each with a telephone and a stack of shipping forms. A large board on one wall displays vessel schedules—ships and their routes, arrival and departure dates, a snapshot of global trade in motion.

The schedule board shows ships that have long since completed their voyages or been scrapped for metal. The MV Pacific Trader, due Seattle December 15. The Hangzhou Star, departing for Shanghai January 3. The dates are years past. The ships have moved on to wherever ships go.

Teletype machines line one wall, silent now, their paper feeds long exhausted. They once chattered with news from ports around the world.`,
      x: 1,
      y: 7,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%IMPORT_DIRECTOR',
        east: '%IMPORT_ACCOUNTING',
      },
      sittables: [
        {
          name: 'a shipping desk',
          capacity: 4,
          emptyMsg:
            'Rows of desks fill the room, each with a telephone and stacks of shipping forms.',
          occupiedMsg: '%s sitting at one of the shipping desks',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'schedule board',
          aliases: ['board', 'vessel schedule', 'ship schedule'],
          description: `A large board displays vessel schedules in neat columns: VESSEL, ROUTE, ETA SEATTLE, ETD SEATTLE. The ships listed have long since completed their voyages—the MV Pacific Trader, the Hangzhou Star, the Rotterdam Express. The dates are years past, the schedules frozen in time. Somewhere these ships sailed on, or were scrapped, or rest on harbor bottoms. The board remembers their planned movements.`,
        },
        {
          prototype: 'describable',
          name: 'teletype machines',
          aliases: ['teletypes', 'machines'],
          description: `Three teletype machines line one wall, their keyboards silent, their paper feeds exhausted. They once chattered constantly with news from ports around the world—ship positions, cargo manifests, market prices. The machines are relics of an age before instant communication, when information traveled at the speed of wire. They wait for messages that will never come.`,
        },
      ],
    },

    '%IMPORT_ACCOUNTING': {
      name: 'Seattle Import/Export - Accounting',
      description: `The accounting office, where the company's finances were tracked across currencies and continents. Adding machines and calculators clutter the desks, their mechanisms frozen, their last calculations still displayed. Ledgers are stacked on every surface—accounts payable and receivable in yen, yuan, pounds, and dollars.

A wall safe stands in the corner, its door open, revealing empty shelves where cash reserves and important documents were kept. The safe is a serious piece of hardware—thick steel, combination lock, the kind of security appropriate for a company that moved money across borders.

A currency conversion chart is pinned to the wall, its exchange rates long obsolete, a snapshot of global finance frozen in time.`,
      x: 1,
      y: 8,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%IMPORT_RECEPTION',
        east: '%HALL_Z3',
        south: '%IMPORT_SHIPPING',
      },
      sittables: [
        {
          name: "an accountant's desk",
          capacity: 3,
          emptyMsg:
            'Desks cluttered with adding machines and ledgers fill the room.',
          occupiedMsg: "%s sitting at an accountant's desk",
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'adding machines',
          aliases: ['machines', 'calculators'],
          description: `Mechanical adding machines and early electronic calculators clutter the desks, each frozen mid-calculation. The adding machine tapes are still in their slots, the last figures printed visible: 47,832.50, 129,445.67, numbers that meant something urgent once. The calculators display partial sums. The mathematics of global trade, interrupted.`,
        },
        {
          prototype: 'describable',
          name: 'open safe',
          aliases: ['safe', 'vault'],
          description: `A floor safe, perhaps four feet tall, its heavy door swung open. The interior is empty—no cash, no documents, no valuables. The safe was rated for fire and theft, its walls thick steel. Whatever it protected was removed, either by the owners or by someone else. The combination dial is worn, the numbers polished by years of fingers.`,
        },
        {
          prototype: 'describable',
          name: 'currency chart',
          aliases: ['chart', 'exchange rates'],
          description: `A chart pinned to the wall showing currency exchange rates: USD to JPY, GBP, EUR, CNY. The rates are years out of date, frozen at values that no longer apply to markets that no longer function. Someone updated this chart regularly once, tracking the fluctuations that affected every deal. The updates stopped. The chart remains, a fossil of global finance.`,
        },
      ],
    },

    '%IMPORT_SAMPLES': {
      name: 'Seattle Import/Export - Sample Room',
      description: `A room filled with samples of goods the company once traded—textiles, ceramics, machinery, the tangible evidence of global commerce. Shelves line the walls, holding artifacts from every continent: silk from China, electronics from Japan, handicrafts from Indonesia, machinery parts from Germany.

A long table runs down the center of the room, its surface scarred by years of samples being unpacked and evaluated. Somewhere in this room are the things the company bought and sold, the actual goods that moved along those trade routes pinned on the map.

Some samples are still in their original packaging, never opened, waiting for evaluation that never came. Others are displayed on stands, showcased for clients who stopped visiting.`,
      x: 3,
      y: 8,
      z: 3,
      population: 0,
      ambientNoise: 2,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%HALL_Z3',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'sample shelves',
          aliases: ['shelves', 'samples', 'goods'],
          description: `Shelves hold samples from around the world: bolts of silk in protective wrappers, ceramic vases cushioned in straw, small electronic components in labeled bags, carved wooden figures from Southeast Asia. Each item was a sample of something the company could supply—proof of quality, demonstration of capability. The samples outlasted the supply chains that created them.`,
        },
        {
          prototype: 'describable',
          name: 'unopened packages',
          aliases: ['packages', 'boxes'],
          description: `Several packages sit on the table, never opened—samples that arrived after there was anyone to evaluate them. The shipping labels show origins: Osaka, Shenzhen, Jakarta. The customs stamps are dated. Inside, products wait that no one will unpack, samples of goods no one will order.`,
        },
        {
          prototype: 'describable',
          name: 'display stands',
          aliases: ['stands', 'displays'],
          description: `Small display stands show off the company's best samples: an intricate silk embroidery, a precision-machined gear, a ceramic teapot of exceptional craftsmanship. Each stand has a small card listing the product specifications and minimum order quantities. The cards are yellowed. The minimums will never be met.`,
        },
      ],
    },
  },
};
