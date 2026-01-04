// Jade Noodle House - Ground Floor (z=0)
// A hand-pulled noodle restaurant in the International District
// The pass-through window framed performance art - dough stretched in rhythms

export const building = {
  name: 'Jade Noodle House',
  x: -10,
  y: -6,
  width: 2,
  height: 2,
  floors: 2,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Front Door Lock',
      description:
        'A commercial door lock, the kind installed on every restaurant in the city.',
      difficulty: 3,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Restaurant Door',
      description:
        'A glass door with a jade-green frame, the color matching the restaurant\'s name. A paper sign in the window still reads OPEN in Chinese and English, the hours listed below: 11AM-10PM.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'glass',
      durability: 30,
    },

    '%BACK_LOCK': {
      prototype: 'lock',
      name: 'Kitchen Door Lock',
      description:
        'A heavy-duty lock on the back door, installed after a break-in years before The Burning.',
      difficulty: 5,
    },
    '%BACK_DOOR': {
      prototype: 'door',
      name: 'Kitchen Exit',
      description:
        'A metal door leading to the back alley, dented from decades of deliveries and grease-slick from kitchen exhaust.',
      locked: true,
      open: false,
      locks: ['%BACK_LOCK'],
      material: 'metal',
      durability: 60,
    },

    '%UPSTAIRS_LOCK': {
      prototype: 'lock',
      name: 'Upstairs Lock',
      description:
        'A residential lock on the door to the family apartment above.',
      difficulty: 3,
    },
    '%UPSTAIRS_DOOR': {
      prototype: 'door',
      name: 'Apartment Door',
      description:
        'A plain door in the corner of the kitchen, leading to stairs up to the family apartment. A handwritten sign in Chinese warns staff that this is private.',
      locked: true,
      open: false,
      locks: ['%UPSTAIRS_LOCK'],
      material: 'wood',
      durability: 45,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - RESTAURANT
    // ═══════════════════════════════════════════════════════════════════

    '%DINING_ROOM': {
      name: 'Jade Noodle House - Dining Room',
      description: `The dining room is configured for efficiency—tables packed close together in the style of authentic Chinese restaurants, the intimate spacing that Westerners found uncomfortable and regulars found familiar. Plastic tablecloths still cover each table, their patterns faded from red to pink, their surfaces filmed with fifty-five years of settled dust.

A pass-through window dominates one wall, framing the kitchen behind. This was the restaurant's theater: hand-pulled noodles made in view of customers, dough stretched and folded in hypnotic rhythms, the performance as important as the product. The window frames only darkness now, the kitchen beyond visible but lifeless.

Decorations line the walls: Chinese landscape prints in cheap frames, paper lanterns dusty and faded, a wall calendar from a Chinese grocery showing August 2062—the date that wasn't turned. A jade-colored cash register sits by the door, its drawer sealed, the day's take still inside presumably. The last customers paid and left. The register never closed out.`,
      x: -10,
      y: -6,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 's-jackson/x-10.ts',
          description: 'The glass door leads to S. Jackson St',
          door: '%FRONT_DOOR',
        },
        north: '%KITCHEN',
        west: '%COUNTER_AREA',
      },
      sittables: [
        {
          name: 'corner booth',
          capacity: 4,
          emptyMsg:
            'A corner booth with vinyl seats cracked and faded, the table still set with chopsticks in paper sleeves.',
          occupiedMsg: '%s in the corner booth',
        },
        {
          name: 'window table',
          capacity: 2,
          emptyMsg:
            'A small table by the window, positioned for watching the street. Two chairs pushed in, waiting.',
          occupiedMsg: '%s at the window table',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'pass-through window',
          aliases: ['window', 'kitchen window', 'pass-through'],
          description: `A large pass-through window that once framed the noodle-making performance. Customers watched dough transformed into noodles through stretching and folding, the chef's hands working in rhythms that approached meditation. The window frames only darkness now, the kitchen beyond visible but silent. The performance ended mid-show.`,
        },
        {
          prototype: 'furniture',
          name: 'jade register',
          aliases: ['register', 'cash'],
          description: `A cash register in jade green, matching the restaurant's color scheme. The drawer is sealed, the day's receipts presumably still inside—worthless paper now, but present. The last transaction was fifty-five years ago. The register never closed out. The business never officially ended.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'wall calendar',
          aliases: ['calendar', 'date'],
          description: `A wall calendar from a Chinese grocery, showing August 2062. The page was never turned. Red circles mark dates that were important once: a delivery expected, a reservation for a large party, someone's birthday. The dates came and went without anyone to notice.`,
        },
        {
          prototype: 'describable',
          name: 'Chinese decorations',
          aliases: ['decorations', 'lanterns', 'prints'],
          description: `Decorations that proclaimed cultural identity: landscape prints of misty mountains and willows, paper lanterns dusty and faded from red to pink, a golden cat with waving paw—the lucky cat—frozen mid-wave. The decorations created atmosphere for customers who wanted authenticity. The authenticity has become genuine abandonment.`,
        },
      ],
    },

    '%COUNTER_AREA': {
      name: 'Jade Noodle House - Counter',
      description: `A service counter runs along one wall, the pickup point for takeout orders that dominated the lunch rush. The counter is scarred with decades of wear, its laminate surface burned by hot containers and scratched by countless transactions.

A menu board hangs above the counter, hand-lettered in Chinese with English translations below. The prices are frozen in 2062: beef noodle soup $8.95, dan dan noodles $7.50, wonton in chili oil $6.95. The menu describes a cuisine that required fresh ingredients, skilled hands, techniques passed down through generations. The ingredients rotted. The hands are gone. The techniques died with the cook who knew them.

A display case near the register holds small desserts that have long since mummified: red bean buns, sesame balls, the sweet endings that customers bought for children or themselves. The desserts are unrecognizable now, shapes without substance.`,
      x: -11,
      y: -6,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%DINING_ROOM',
        north: '%PREP_AREA',
      },
      sittables: [
        {
          name: 'counter stool',
          capacity: 1,
          emptyMsg:
            'A vinyl-topped stool bolted to the floor, its cushion cracked and deflated.',
          occupiedMsg: '%s on the counter stool',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'menu board',
          aliases: ['menu', 'board', 'prices'],
          description: `A hand-lettered menu board showing the restaurant's offerings in Chinese and English. Beef noodle soup, dan dan noodles, wonton in chili oil, the dishes that defined Sichuan cuisine. The prices are frozen in 2062. The dishes themselves are memory now—techniques that died with the cook who knew them, flavors that exist only in descriptions.`,
        },
        {
          prototype: 'cabinet',
          name: 'dessert case',
          aliases: ['desserts', 'pastries', 'case'],
          description: `A display case that once held Chinese pastries: red bean buns, sesame balls, egg tarts. The pastries have mummified, their shapes preserved but their substance gone. Fifty-five years of dry air have turned sweet treats into archaeological specimens.`,
        },
        {
          prototype: 'furniture',
          name: 'takeout counter',
          aliases: ['counter', 'pickup'],
          description: `A laminate counter scarred by decades of hot containers, stained with soy sauce and chili oil. The counter served the lunch rush—office workers grabbing containers, families picking up dinner. Stacks of paper bags with the restaurant logo sit ready for orders that won't come.`,
          boltedDown: true,
        },
      ],
    },

    '%KITCHEN': {
      name: 'Jade Noodle House - Kitchen',
      description: `The kitchen is a monument to cuisine that required fire and motion. Commercial wok stations line the back wall, their high-BTU burners silent, their seasoned steel woks still in place—black from decades of use, their surfaces holding the memory of ten thousand stir-fries. The exhaust hood above is thick with grease that has hardened to amber.

The noodle station dominates the center, a flour-dusted workspace where dough was stretched and folded into noodles by hand. The technique required years to master, the rhythm of pulling and folding creating strands of perfect consistency. The flour has long since been eaten by vermin. The workspace is bare wood now, stained and silent.

A walk-in cooler stands with its door ajar, empty and dark. Whatever was stored inside—vegetables, meat, the fresh ingredients that Chinese cooking demands—rotted in the first weeks and have since dried to nothing. The compressor has been silent for fifty-five years.

Stairs in the corner lead up to the family apartment.`,
      x: -10,
      y: -5,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%DINING_ROOM',
        west: '%PREP_AREA',
        east: {
          to: null, // Alley not implemented
          description: 'A metal door leads to the back alley',
          door: '%BACK_DOOR',
        },
        up: {
          to: 'z1.ts#APARTMENT_LANDING',
          description: 'Stairs lead up to the family apartment',
          door: '%UPSTAIRS_DOOR',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'wok stations',
          aliases: ['woks', 'burners', 'stoves'],
          description: `Commercial wok stations with high-BTU burners, the kind that generate flames fierce enough for proper stir-fry. The woks are still in place, carbon-steel seasoned black from ten thousand dishes. The seasoning holds flavor memory that outlasts the cook. The burners are cold, the gas long since cut. The flames that gave Sichuan food its breath are extinguished.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'noodle station',
          aliases: ['noodles', 'dough', 'workspace'],
          description: `The noodle-making station where dough was stretched and folded into hand-pulled noodles. The technique required years to master—the feel of the dough, the rhythm of the pull, the instinct for when strands were thin enough. The flour is gone. The workspace is bare wood, stained by decades of use. The technique died with the cook who knew it.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'exhaust hood',
          aliases: ['hood', 'ventilation'],
          description: `A massive stainless steel exhaust hood above the wok stations, its surfaces thick with grease that has hardened to amber over fifty-five years. The hood pulled smoke and steam and the smell of cooking from the kitchen. The hood is silent now, the ventilation fans frozen, the grease a geological record of meals that ended.`,
        },
        {
          prototype: 'cabinet',
          name: 'dead cooler',
          aliases: ['cooler', 'walk-in', 'refrigerator'],
          description: `A walk-in cooler with its door hanging ajar, its interior dark and empty. The cooler stored the fresh ingredients that Chinese cooking demands: vegetables crisp from morning markets, meat and seafood kept cold until ordered. Everything inside rotted in the first weeks. The smell is gone now. Only emptiness remains.`,
        },
      ],
    },

    '%PREP_AREA': {
      name: 'Jade Noodle House - Prep Area',
      description: `The prep area is where ingredients were transformed before they reached the wok. Stainless steel tables line the walls, their surfaces scored by years of knife work. A commercial sink—triple-basin, the kind health codes require—holds dishes that were never washed: prep bowls and strainers, the last vegetables of the last service.

Shelving holds the dry goods that outlasted everything perishable: soy sauce bottles dusty but full, rice wine evaporated to residue, dried chili peppers faded from red to brown. Containers of spices sit sealed, their contents still potent probably—Sichuan peppercorns and star anise, the aromatics that defined the cuisine. The spices wait for a cook who will never return.

A prep cooler against one wall is silent and dark, smaller than the main walk-in, used for ingredients in active rotation. The rotation stopped fifty-five years ago. The cooler holds only stale air and rust.`,
      x: -11,
      y: -5,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%COUNTER_AREA',
        east: '%KITCHEN',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'prep tables',
          aliases: ['tables', 'workspace'],
          description: `Stainless steel prep tables scored by decades of knife work, the surfaces telling stories in scratches and cuts. Vegetables were julienned here, meat sliced thin for stir-fry, the mise en place that made fast cooking possible. The cutting boards are still in place, stained and worn. The knives are probably still sharp.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'dry goods shelves',
          aliases: ['shelves', 'spices', 'ingredients'],
          description: `Shelving holding the dry goods that survived: soy sauce bottles dusty but sealed, containers of dried spices—Sichuan peppercorn, star anise, dried chilies faded to brown. The seasonings that defined the cuisine are still here, still potent probably. They wait for hands that knew how to use them.`,
        },
        {
          prototype: 'describable',
          name: 'unwashed dishes',
          aliases: ['dishes', 'sink', 'bowls'],
          description: `A triple-basin commercial sink holding dishes from the last service: prep bowls crusted with residue, strainers with vegetable matter dried to fiber, the tools of mise en place abandoned mid-shift. The dishes have waited fifty-five years to be washed. They're still waiting.`,
        },
        {
          prototype: 'cabinet',
          name: 'dead prep cooler',
          aliases: ['cooler', 'fridge'],
          description: `A prep cooler against the wall, smaller than the main walk-in, used for ingredients in active rotation—the vegetables and proteins needed for immediate service. The cooler is silent and dark, its compressor dead, its contents long since rotted to nothing.`,
        },
      ],
    },
  },

  postProcessors: [],
};
