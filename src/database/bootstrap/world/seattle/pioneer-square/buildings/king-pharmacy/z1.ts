// King Pharmacy - Second Floor (z=1)
// Upstairs apartment where the pharmacist lived
// A life preserved in abandonment

export const building = {
  name: 'King Pharmacy',
  x: 5,
  y: -10,
  width: 3,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%APT_LOCK': {
      prototype: 'lock',
      name: 'Apartment Lock',
      description:
        'A residential deadbolt, the kind found on countless apartment doors.',
      difficulty: 4,
    },
    '%APT_DOOR': {
      prototype: 'door',
      name: 'Apartment Door',
      description:
        'A solid wooden door separating the commercial stairwell from the private apartment.',
      locked: true,
      open: false,
      locks: ['%APT_LOCK'],
      material: 'wood',
      durability: 65,
    },

    '%ROOF_LOCK': {
      prototype: 'lock',
      name: 'Roof Access Lock',
      description: 'A padlock on the roof hatch, rusted but functional.',
      difficulty: 3,
    },
    '%ROOF_HATCH': {
      prototype: 'door',
      name: 'Roof Hatch',
      description:
        'A metal hatch leading to the roof, its hinges stiff with rust.',
      locked: true,
      open: false,
      locks: ['%ROOF_LOCK'],
      material: 'metal',
      durability: 70,
    },

    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - UPSTAIRS APARTMENT
    // ═══════════════════════════════════════════════════════════════════

    '%UPSTAIRS_HALL': {
      name: 'King Pharmacy - Upstairs Landing',
      description: `The stairs emerge into a small landing, the transitional space between the pharmacy below and the apartment above. The distinction is immediate—commercial linoleum gives way to worn carpet, the smell of medicine replaced by the mustiness of domestic space left too long unventilated.

A door leads to the apartment where the pharmacist lived, convenient to the business, always available for the emergencies that independent pharmacists handled. The door is locked, but the lock is residential grade—meant for privacy, not security.

The carpet shows the wear pattern of decades: a path from the stairs to the apartment door, the route walked twice daily, more during busy times.`,
      x: 4,
      y: -11,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        down: 'z0.ts#DISPENSARY',
        west: {
          description: 'A door leads to the apartment',
          door: '%APT_DOOR',
          to: '%LIVING_ROOM',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'worn carpet',
          aliases: ['carpet', 'floor'],
          description: `Beige carpet, industrial grade, worn to threads along the path between stairs and apartment. The wear pattern tells the story of daily life: the pharmacist climbing up after closing, descending before opening, the rhythm of living above your work. The carpet was never replaced. The wear became permanent.`,
        },
      ],
    },

    '%LIVING_ROOM': {
      name: 'Pharmacist\'s Apartment - Living Room',
      description: `The living room of a modest apartment, furnished with the practical simplicity of someone who spent most of their time downstairs. A sofa faces a television, both covered in dust thick enough to write in. Bookshelves line one wall, filled with volumes in both English and Chinese—medical texts, novels, the reading of a bicultural life.

Family photos cover another wall in careful arrangement: children growing up through school portraits, graduation photos, wedding pictures. The narrative of a family, told in frozen moments. The most recent photos show grandchildren, their faces bright with the particular innocence of children who don't know what's coming.

A window looks out onto S. King Street, its view now showing only abandoned storefronts and empty sidewalks. The curtains are drawn aside, as if someone left in daylight and expected to return before dark.`,
      x: 3,
      y: -11,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%UPSTAIRS_HALL',
        north: '%KITCHEN',
        south: '%BEDROOM',
        up: {
          description: 'A hatch leads to the roof',
          door: '%ROOF_HATCH',
          to: '%ROOF',
        },
      },
      sittables: [
        {
          name: 'living room sofa',
          capacity: 3,
          emptyMsg:
            'A worn sofa faces the television, its cushions shaped by years of evening sitting.',
          occupiedMsg: '%s on the sofa',
        },
        {
          name: 'reading chair',
          capacity: 1,
          emptyMsg:
            'An armchair beside the bookshelf, positioned for reading light.',
          occupiedMsg: '%s in the reading chair',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'family photos',
          aliases: ['photos', 'pictures', 'wall'],
          description: `A wall of family photographs, carefully arranged: school portraits showing children at every age, graduation photos with proud parents, wedding pictures of grown children starting their own families. The most recent additions are grandchildren—round faces, bright eyes, the future that was supposed to come. The future didn't come. The photos remain.`,
        },
        {
          prototype: 'cabinet',
          name: 'bookshelves',
          aliases: ['books', 'shelves'],
          description: `Bookshelves filled with volumes in English and Chinese, side by side. Medical references: Harrison's Principles of Internal Medicine, Chinese Medical Herbology and Pharmacology. Novels: Amy Tan, Ha Jin, books about the immigrant experience. History, philosophy, the wide reading of a curious mind. The books are dusty but intact, knowledge waiting for readers who won't come.`,
        },
        {
          prototype: 'describable',
          name: 'dusty television',
          aliases: ['tv', 'television'],
          description: `A flat-screen television, its surface covered in dust thick enough to obscure the screen. A remote control sits on the coffee table, batteries long since dead. The TV shows nothing—no news, no entertainment, no connection to a world that no longer broadcasts. The dust is undisturbed. No one has watched in years.`,
        },
      ],
    },

    '%KITCHEN': {
      name: 'Pharmacist\'s Apartment - Kitchen',
      description: `A small kitchen, efficient in the way of spaces used by someone who cooked regularly but didn't have time for elaborate meals. The counter holds a rice cooker and an electric kettle—the essentials of Asian home cooking. Cabinets are filled with bowls and utensils, some Western, some traditional.

The refrigerator door is closed, mercifully—whatever was inside decomposed long ago, and no one has opened it since. A calendar on the wall shows a month from fifty-five years ago, its squares filled with notations in neat handwriting: reminders, appointments, the scheduling of a busy life.

A small table with two chairs sits by the window, the breakfast nook where mornings began with rice porridge and tea before descending to open the pharmacy.`,
      x: 3,
      y: -10,
      z: 1,
      population: 0,
      ambientNoise: 1,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%LIVING_ROOM',
      },
      sittables: [
        {
          name: 'kitchen chairs',
          capacity: 2,
          emptyMsg:
            'Simple wooden chairs at the breakfast table, worn by daily use.',
          occupiedMsg: '%s at the kitchen table',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'rice cooker',
          aliases: ['cooker', 'appliance'],
          description: `A Zojirushi rice cooker, the kind that sings when the rice is done. The lid is closed, the pot inside probably containing the mummified remains of whatever was cooking fifty-five years ago. Best not to open it. The rice cooker was essential—no Asian home cook was without one.`,
        },
        {
          prototype: 'describable',
          name: 'calendar',
          aliases: ['schedule'],
          description: `A wall calendar frozen on a month fifty-five years past, its squares filled with neat handwriting. "Refill Mrs. Wong's prescription." "Grandkids visiting - close early?" "Supplier meeting 2pm." The mundane scheduling of a life that expected to continue. The scheduling stopped. The calendar remains.`,
        },
        {
          prototype: 'describable',
          name: 'refrigerator',
          aliases: ['fridge', 'icebox'],
          description: `A white refrigerator, its door closed and best left that way. Whatever was inside fifty-five years ago has long since become something else—something that science might find interesting but that human senses would find unbearable. A few magnets hold notes and photos to the door: a grocery list never completed, a child's drawing never framed.`,
        },
        {
          prototype: 'describable',
          name: 'tea setup',
          aliases: ['tea', 'kettle'],
          description: `An electric kettle beside a ceramic teapot, the equipment for proper Chinese tea. A canister nearby held tea leaves—the lid is slightly ajar, the contents dried to dust. Tea was morning ritual, afternoon break, evening wind-down. The ritual ended. The equipment remains ready.`,
        },
      ],
    },

    '%BEDROOM': {
      name: 'Pharmacist\'s Apartment - Bedroom',
      description: `The bedroom is undisturbed, frozen in the moment of a morning departure that expected an evening return. The bed is made—not perfectly, but with the habitual neatness of someone who makes their bed every day. Clothes hang in an open closet: practical work clothes, a few nicer items for occasions, the wardrobe of a life divided between pharmacy and home.

A nightstand holds a lamp, reading glasses, and a book with a bookmark about two-thirds through. The book is in Chinese—a novel, something to read before sleep. The reading was never finished. The bookmark holds a place that will never be continued.

A window looks out on the back alley, its blinds half-drawn. The morning light that once woke the pharmacist now falls on an empty bed.`,
      x: 3,
      y: -12,
      z: 1,
      population: 0,
      ambientNoise: 0,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%LIVING_ROOM',
      },
      sittables: [
        {
          name: 'double bed',
          capacity: 2,
          emptyMsg:
            'A neatly made bed, its covers undisturbed since the last morning.',
          occupiedMsg: '%s on the bed',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'nightstand',
          aliases: ['stand', 'table'],
          description: `A wooden nightstand with a lamp, reading glasses, and a book. The glasses are prescription—the kind that correct for age-related vision changes. The book is open face-down, a bookmark two-thirds through. Someone was going to finish this book. Someone didn't come back to finish it.`,
        },
        {
          prototype: 'cabinet',
          name: 'closet',
          aliases: ['wardrobe', 'clothes'],
          description: `An open closet showing the wardrobe of a pharmacist: white coats for work, practical shoes, a few dress items for occasions. The clothes are organized by type, the habit of someone who didn't have time to search for what to wear. Moths have been at some of the fabrics, but much remains intact—preserved by the cool, dry air of an undisturbed room.`,
        },
        {
          prototype: 'describable',
          name: 'alarm clock',
          aliases: ['clock', 'alarm'],
          description: `A digital alarm clock, its display dark, its wake-up call silenced by dead batteries. The clock was set for early—pharmacists keep long hours, and living above the shop means being the first to arrive and last to leave. The alarm will never sound again. The pharmacist will never wake to it.`,
        },
      ],
    },

    '%ROOF': {
      name: 'King Pharmacy - Roof',
      description: `The roof of King Pharmacy is a small flat space, accessible through a hatch that opens onto tar paper and gravel. The building is only two stories, so the view is limited—neighboring buildings block most sightlines, leaving only a rectangle of grey Seattle sky overhead.

Someone used this space, once. A few folding chairs sit near the western edge, positioned to catch the afternoon sun when Seattle provides it. Potted plants—dead now, their soil dried to dust—once grew here: tomatoes, peppers, the vegetables that remind immigrants of home gardens.

The rooftop shows the infrastructure of a small building: a ventilation stack, electrical conduits, a small satellite dish that once pulled in Chinese-language television. The dish points at a sky that no longer broadcasts.`,
      x: 3,
      y: -11,
      z: 2,
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%LIVING_ROOM',
      },
      sittables: [
        {
          name: 'folding chairs',
          capacity: 2,
          emptyMsg:
            'Folding lawn chairs, weathered but functional, positioned for sun-catching.',
          occupiedMsg: '%s in the folding chair',
        },
      ],
      objects: [
        {
          prototype: 'describable',
          name: 'dead garden',
          aliases: ['garden', 'plants', 'pots'],
          description: `Terra cotta pots that once held a rooftop garden—tomato cages rusting, pepper plants reduced to dry sticks, the basil and cilantro long since decomposed. Someone grew food up here, the vegetables of home that store-bought couldn't match. The soil is dust. The plants are skeletons. The garden is a memory.`,
        },
        {
          prototype: 'describable',
          name: 'satellite dish',
          aliases: ['dish', 'antenna'],
          description: `A satellite dish mounted on a pole, its face turned toward a position in the sky that once carried Chinese television. The broadcasts stopped. The dish remains aimed at empty space, receiving nothing, waiting for signals that will never come. The adjustment knobs are rusted in place.`,
        },
        {
          prototype: 'describable',
          name: 'rooftop view',
          aliases: ['view', 'sky'],
          description: `The view from the roof is limited by neighboring buildings, but a slice of sky is visible—the particular grey of Seattle, the clouds that roll in from Puget Sound. On clear days, which Seattle occasionally provides, the Olympic Mountains might be visible to the west. Today is not a clear day. Most days aren't.`,
        },
      ],
    },
  },

  postProcessors: [],
};
