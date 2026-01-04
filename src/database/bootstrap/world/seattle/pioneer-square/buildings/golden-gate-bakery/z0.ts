// Golden Gate Bakery - Ground Floor (z=0)
// A Chinese bakery in the International District, closed for 55 years
// The display cases are empty, the ovens cold, the last batch never baked

export const building = {
  name: 'Golden Gate Bakery',
  x: 5,
  y: -12,
  width: 1,
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
        'A simple commercial lock, the kind that kept honest people honest. The dishonest found other ways in.',
      difficulty: 3,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Bakery Door',
      description:
        'A glass door with a red wooden frame, the traditional color of luck and prosperity. The glass is cracked but intact. A paper sign in Chinese and English still clings to the glass: OPEN DAILY 6AM-8PM. The hours are aspirational now.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'glass',
      durability: 25,
    },

    '%BACK_LOCK': {
      prototype: 'lock',
      name: 'Kitchen Door Lock',
      description:
        'A deadbolt on the kitchen entrance, installed after a break-in that happened before the world ended.',
      difficulty: 4,
    },
    '%BACK_DOOR': {
      prototype: 'door',
      name: 'Kitchen Door',
      description:
        'A metal door leading to the back alley, dented from decades of delivery carts. The door is locked but rusted at the hinges.',
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
        'A residential lock on the door leading upstairs. The photo studio and bakery were separate businesses, separate keys.',
      difficulty: 3,
    },
    '%UPSTAIRS_DOOR': {
      prototype: 'door',
      name: 'Stairwell Door',
      description:
        'A plain wooden door in the corner of the bakery, leading to the second-floor photo studio. A small sign reads: HAPPY DAY PHOTOGRAPHY - UPSTAIRS.',
      locked: true,
      open: false,
      locks: ['%UPSTAIRS_LOCK'],
      material: 'wood',
      durability: 45,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - BAKERY
    // ═══════════════════════════════════════════════════════════════════

    '%STOREFRONT': {
      name: 'Golden Gate Bakery - Storefront',
      description: `The storefront is a museum of absent sweetness. Glass display cases line the counter, their shelves empty and dusty, designed to showcase pastries that haven't existed for fifty-five years. Hand-lettered signs in Chinese and English describe what should be there: pineapple buns, egg tarts, barbecue pork buns, lotus seed pastries. The prices are written in marker, the last prices ever set, frozen in time.

The counter is scratched laminate, worn smooth where generations of customers placed their orders. A cash register sits open and empty, its drawer pulled out during the Long Dark when people thought paper money might still matter. Behind the counter, a pegboard holds order tickets on metal clips—the last day's orders, never filled, the names of customers who never collected their pastries.

The air should smell of baked goods: yeast and sugar and the red bean paste that filled moon cakes. Instead it smells of dust and age, the ghost of sweetness long since dissipated. A calendar on the wall shows August 2062. No one turned the page.`,
      x: 5,
      y: -12,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 's-king/x5.ts',
          description: 'The glass door leads to S. King St',
          door: '%FRONT_DOOR',
        },
        north: '%KITCHEN',
        up: {
          to: 'z1.ts#STUDIO_LANDING',
          description: 'A door leads to the upstairs photo studio',
          door: '%UPSTAIRS_DOOR',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'display cases',
          aliases: ['cases', 'displays', 'counter'],
          description: `Glass display cases that once held the day's production, now holding only dust and the memory of pastries. The glass is foggy with age, scratched by fifty-five years of neglect. Price labels still cling to the shelves: "$1.25 - Pineapple Bun," "$2.50 - Egg Tart (4pc)," "$3.00 - BBQ Pork Bun." The prices are from before money lost meaning.`,
        },
        {
          prototype: 'furniture',
          name: 'order board',
          aliases: ['tickets', 'orders', 'pegboard'],
          description: `A pegboard behind the counter holds order tickets on metal clips—the last day's special orders, never fulfilled. Names written in careful handwriting: "Mrs. Chen - 2 doz egg tarts," "Wong family - wedding cake pickup 8/16." The wedding cake was never picked up. The wedding probably never happened.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'calendar',
          aliases: ['date', 'august'],
          description: `A wall calendar showing August 2062, the page never turned. A picture of the Golden Gate Bridge decorates the month—the bakery's namesake, a different Golden Gate than the neighborhood. Red circles mark dates that were important once: a delivery, a special order, someone's birthday. The dates came and went without anyone to notice.`,
        },
        {
          prototype: 'describable',
          name: 'empty register',
          aliases: ['register', 'cash'],
          description: `An old cash register, its drawer pulled open and empty. Someone took the money during the Long Dark, when people still believed cash would buy things. The receipt roll is jammed, the last transaction frozen mid-print: "$7.50 - 8/15/62 - 6:47 AM." The bakery opened early. It never closed properly.`,
        },
      ],
    },

    '%KITCHEN': {
      name: 'Golden Gate Bakery - Kitchen',
      description: `The kitchen is where the magic happened—where flour and water and yeast became the pastries that fed the neighborhood. Commercial ovens line one wall, their doors hanging open, their interiors rusted from decades of humidity. Prep tables are covered with a fine layer of dust that was once flour, mixed now with the dust of fifty-five years of neglect.

A massive mixer stands in the corner, its bowl empty, its paddle frozen in place. Racks that held rising dough hold nothing now. Molds for moon cakes sit stacked on shelves, their patterns—flowers, Chinese characters for prosperity and longevity—waiting to press shapes into dough that will never be made.

The walk-in refrigerator stands open, its compressor dead, whatever was inside long since rotted to nothing and desiccated to dust. The smell that must have lingered for months after The Burning is gone now. Only the faint odor of rust and decay remains.

A set of narrow stairs leads up to what was probably storage, accessed from inside the kitchen.`,
      x: 5,
      y: -11,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STOREFRONT',
        north: {
          to: null, // Alley not implemented
          description: 'A dented metal door leads to the back alley',
          door: '%BACK_DOOR',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'commercial ovens',
          aliases: ['ovens', 'stove'],
          description: `Three commercial deck ovens, the workhorses of Chinese bakery production. Their doors hang open, their stone baking surfaces cracked and rusted. The temperature dials are frozen at 350 degrees—the last setting, fifty-five years ago. No one turned them off. The power did that.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'mixer',
          aliases: ['dough mixer', 'stand mixer'],
          description: `A massive floor-standing mixer, the kind that could handle fifty pounds of dough at once. The bowl is empty, the paddle crusted with the residue of the last batch—flour and water that dried to cement half a century ago. The machine is silent. The motor might still work. No one has tried.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'moon cake molds',
          aliases: ['molds', 'presses'],
          description: `Wooden molds for pressing moon cakes, stacked on shelves above the prep table. Each mold has a different pattern carved into it: chrysanthemums, lotus flowers, Chinese characters meaning "double happiness" and "longevity." The molds are works of art. They're also useless without dough to press. Mid-Autumn Festival hasn't been celebrated in fifty-five years.`,
        },
        {
          prototype: 'cabinet',
          name: 'dead refrigerator',
          aliases: ['fridge', 'walk-in', 'cooler'],
          description: `A walk-in refrigerator, its heavy door propped open, its interior dark and empty. Whatever was stored here—eggs, butter, the custard for egg tarts—rotted in the first weeks after The Burning, when the power died and no one came to clean. Fifty-five years later, even the smell is gone. Only rust and emptiness remain.`,
        },
        {
          prototype: 'describable',
          name: 'prep tables',
          aliases: ['tables', 'workspace'],
          description: `Stainless steel prep tables, their surfaces covered in a layer that was once flour but is now indistinguishable from ordinary dust. Rolling pins lie where they were left. Measuring cups sit in neat rows. The workspace is ready for a baker who will never return.`,
        },
      ],
    },
  },

  postProcessors: [],
};
