// Jade Noodle House - Second Floor (z=1)
// Family apartment above the restaurant
// The cook lived where he worked - common for immigrant-owned businesses

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

    '%BEDROOM_LOCK': {
      prototype: 'lock',
      name: 'Bedroom Lock',
      description: 'A simple privacy lock on the bedroom door.',
      difficulty: 1,
    },
    '%BEDROOM_DOOR': {
      prototype: 'door',
      name: 'Bedroom Door',
      description:
        'A thin interior door, its paint peeling, offering minimal privacy.',
      locked: false,
      open: true,
      locks: ['%BEDROOM_LOCK'],
      material: 'wood',
      durability: 25,
    },

    '%ROOF_LOCK': {
      prototype: 'lock',
      name: 'Roof Access Lock',
      description: 'A simple padlock on the roof hatch.',
      difficulty: 2,
    },
    '%ROOF_HATCH': {
      prototype: 'door',
      name: 'Roof Hatch',
      description:
        'A metal hatch leading to the flat roof, its frame showing rust from decades of rain seepage.',
      locked: false,
      open: false,
      locks: ['%ROOF_LOCK'],
      material: 'metal',
      durability: 50,
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - FAMILY APARTMENT
    // ═══════════════════════════════════════════════════════════════════

    '%APARTMENT_LANDING': {
      name: 'Family Apartment - Landing',
      description: `The narrow stairway opens onto a small landing that smells of enclosed air and distant kitchen grease—the smell that permeated the building for decades, trapped now in walls and fabric. Shoes are lined up neatly by the door: work clogs for the kitchen, house slippers, a child's sneakers that were outgrown and never discarded.

A small altar shelf is mounted on the wall, the kind found in Chinese homes—a place for incense and offerings, for honoring ancestors. The incense has long since burned out. Dust covers the altar. Small oranges placed as offerings have dried to leather spheres, still arranged in their ceremonial positions.

The apartment beyond is compact—the kind of space immigrant families made work through efficiency and acceptance. Every square foot serves a purpose. Space is not wasted.`,
      x: -10,
      y: -6,
      z: 1,
      imageOnDisk: 'family-apartment-landing-x-10-y-6-z1.png',
      population: 0,
      ambientNoise: 0,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z0.ts#KITCHEN',
        north: '%LIVING_ROOM',
      },
      objects: [
        {
          prototype: 'describable',
          name: 'ancestor altar',
          aliases: ['altar', 'shrine', 'incense'],
          description: `A small altar shelf mounted on the wall—the kind found in traditional Chinese homes. A brass incense holder sits empty, its last sticks long since burned. Dried oranges, placed as offerings, have shrunk to leather spheres. A small photograph shows elderly faces, the ancestors being honored. The altar was tended daily. No one tends it now.`,
        },
        {
          prototype: 'describable',
          name: 'lined-up shoes',
          aliases: ['shoes', 'slippers', 'clogs'],
          description: `Shoes lined up neatly by the door: work clogs worn in the kitchen, house slippers for comfort upstairs, a child's sneakers outgrown but kept. The shoes remember the shape of feet that will never fill them again. The neatness of the arrangement suggests a household that valued order.`,
        },
      ],
    },

    '%LIVING_ROOM': {
      name: 'Family Apartment - Living Room',
      description: `The living room is small but carefully arranged—furniture positioned to maximize space, every item serving a purpose. A sofa with a blanket draped over it shows where someone napped between lunch and dinner service. A television sits dark in the corner, its last broadcast fifty-five years past.

The room doubles as a home office: a desk in one corner holds paperwork in Chinese—restaurant accounts, supplier invoices, the bureaucracy of running a small business. A abacus sits beside a calculator, the old ways and new ways side by side. The last calculation is preserved on both.

Photographs cover one wall: the restaurant's opening day, family gathered around laden tables, a child's graduation, the visual history of a family that worked and lived in the same building. The photographs are fading, the faces becoming uncertain, the memories losing definition.

A window looks out over S. Jackson Street, the view now of empty storefronts and silent streets.`,
      x: -10,
      y: -5,
      z: 1,
      imageOnDisk: 'family-apartment-living-room-x-10-y-5-z1.png',
      population: 0,
      ambientNoise: 0,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%APARTMENT_LANDING',
        west: '%KITCHEN_LIVING',
        east: {
          to: '%BEDROOM',
          description: 'A door leads to the bedroom',
          door: '%BEDROOM_DOOR',
        },
      },
      sittables: [
        {
          name: 'worn sofa',
          capacity: 2,
          emptyMsg:
            'A sofa with a blanket draped over it, the cushions compressed from years of napping between shifts.',
          occupiedMsg: '%s on the sofa',
        },
      ],
      objects: [
        {
          prototype: 'desk',
          name: 'business desk',
          aliases: ['desk', 'paperwork', 'accounts'],
          description: `A desk serving as home office for the restaurant business: invoices from suppliers, accounts written in Chinese characters, the paperwork of a family enterprise. An abacus sits beside an electronic calculator, the old ways and new ways both frozen mid-calculation. The business ended without closing its books.`,
        },
        {
          prototype: 'describable',
          name: 'family photographs',
          aliases: ['photos', 'pictures', 'wall'],
          description: `Photographs covering one wall: the restaurant's opening day with relatives gathered for celebration, family dinners at laden tables, a child in graduation robes, the visual history of immigrant success. The photographs are fading, faces becoming uncertain, the sharp moments of joy blurring into suggestion.`,
        },
        {
          prototype: 'describable',
          name: 'dead television',
          aliases: ['tv', 'television'],
          description: `A television in the corner, its screen dark, its last broadcast fifty-five years past. Chinese language programming from satellite, probably, or maybe local news. The TV watched while someone rested between shifts. The rest became permanent.`,
        },
      ],
    },

    '%KITCHEN_LIVING': {
      name: 'Family Apartment - Home Kitchen',
      description: `A small kitchen separate from the restaurant below—the family's private space for meals not prepared for customers. The irony of cooking at home after cooking all day was lost on no one, but the food here was different: home cooking, comfort dishes, the recipes grandmother made that weren't on any menu.

The kitchen is compact and efficient: a two-burner stove, a rice cooker still plugged in (the power long dead), a small refrigerator that rotted and dried decades ago. Woks hang from hooks—smaller than the ones downstairs, seasoned for different purposes.

Dry goods sit on open shelving: rice containers empty now, eaten by vermin during the Long Dark; spice jars still sealed; a tea canister that might still hold tea. The kitchen was stocked for daily life, not restaurant service.

A small table with two chairs sits by the window—meals eaten here were intimate, family conversations held in Cantonese or Mandarin, the language of home rather than commerce.`,
      x: -11,
      y: -5,
      z: 1,
      imageOnDisk: 'family-apartment-home-kitchen-x-11-y-5-z1.png',
      population: 0,
      ambientNoise: 0,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%LIVING_ROOM',
        up: {
          to: 'z2.ts#ROOF',
          description: 'A hatch in the ceiling leads to the roof',
          door: '%ROOF_HATCH',
        },
      },
      sittables: [
        {
          name: 'kitchen chair',
          capacity: 1,
          emptyMsg:
            'A wooden chair at the small kitchen table, its seat worn smooth.',
          occupiedMsg: '%s at the kitchen table',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'home stove',
          aliases: ['stove', 'burners'],
          description: `A two-burner stove, modest compared to the commercial equipment downstairs. This was for home cooking—comfort dishes, grandmother's recipes, the food that wasn't on any menu. A small wok sits on one burner, seasoned differently than the restaurant woks, used for different purposes.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'dead rice cooker',
          aliases: ['rice cooker', 'cooker'],
          description: `A rice cooker still plugged in, its indicator light dark, its bowl empty. The rice cooker was the heart of the home kitchen—rice made fresh for every meal, the staple that anchored everything else. The cooker hasn't made rice in fifty-five years. The outlet has no power.`,
        },
        {
          prototype: 'cabinet',
          name: 'tea canister',
          aliases: ['tea', 'canister'],
          description: `A decorative tin canister that might still hold tea—oolong or jasmine, probably, the varieties that accompanied meals. The canister is sealed. The tea inside might still be drinkable, or might have degraded to dust. Someone would have to open it to find out.`,
        },
        {
          prototype: 'furniture',
          name: 'kitchen table',
          aliases: ['table'],
          description: `A small table with two chairs by the window, sized for intimate meals. Conversations were held here in Cantonese or Mandarin, the language of home rather than the mixed English used with customers. The table is set for a meal that was never eaten.`,
          boltedDown: true,
        },
      ],
    },

    '%BEDROOM': {
      name: 'Family Apartment - Bedroom',
      description: `The bedroom is small but tidy—the habits of people who worked too hard to make messes. A double bed with a carved wooden headboard takes up most of the space, its mattress sagged, its bedding still made. The sheets are dusty but arranged, the pillows positioned by hands that valued order.

A wardrobe against one wall holds clothes that will never be worn: work clothes for the kitchen, a few nicer items for temple visits or family gatherings. The clothes are organized by purpose, the efficiency of limited space and limited time.

A bedside table holds the small objects of daily life: reading glasses, a worn paperback in Chinese, a jar of Tiger Balm for hands cramped from pulling noodles. The book is marked with a receipt as bookmark, the reading interrupted and never resumed.

A window looks out over the International District, the view of storefronts that were busy once, streets that were crowded once, a neighborhood that was alive once.`,
      x: -9,
      y: -5,
      z: 1,
      imageOnDisk: 'family-apartment-bedroom-x-9-y-5-z1.png',
      population: 0,
      ambientNoise: 0,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LIVING_ROOM',
      },
      sittables: [
        {
          name: 'double bed',
          capacity: 2,
          emptyMsg:
            'A double bed with a carved wooden headboard, its bedding still made, its mattress sagged in the middle.',
          occupiedMsg: '%s on the bed',
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'wardrobe',
          aliases: ['clothes', 'closet'],
          description: `A wooden wardrobe holding clothes organized by purpose: work clothes for the kitchen—stained and practical; a few nicer items for temple or family gatherings—pressed and waiting. The clothes smell of enclosed air and faded detergent. They'll never be worn again.`,
        },
        {
          prototype: 'furniture',
          name: 'bedside table',
          aliases: ['nightstand', 'table'],
          description: `A bedside table holding the small objects of daily life: reading glasses with one lens cracked, a worn paperback novel in Chinese marked with a receipt, a jar of Tiger Balm for hands cramped from years of pulling noodles. The items wait for their owner. The owner is not coming back.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'bedroom window view',
          aliases: ['window', 'view'],
          description: `A window overlooking the International District: storefronts with signs in Chinese and Vietnamese, streets that were crowded with shoppers and diners, a neighborhood that defined itself by its density and vitality. The storefronts are dark now. The streets are empty. The neighborhood is a ghost of what it was.`,
        },
      ],
    },
  },

  postProcessors: [],
};
