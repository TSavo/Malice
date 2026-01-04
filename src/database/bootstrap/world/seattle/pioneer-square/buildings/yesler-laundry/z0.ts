// Yesler Laundry - Ground Floor (z=0)
// A coin-operated laundromat near Occidental Park
// The last loads were never retrieved - clothes rotted in the machines

export const building = {
  name: 'Yesler Laundry',
  x: -9,
  y: 12,
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
        'A commercial glass door lock, the kind that was meant to keep people out after hours.',
      difficulty: 2,
    },
    '%FRONT_DOOR': {
      prototype: 'door',
      name: 'Laundromat Door',
      description:
        'A glass door with a metal push bar, the kind found on every commercial storefront. The glass is intact but filthy, the hours posted in faded vinyl: OPEN 24 HOURS. The hours were optimistic.',
      locked: false,
      open: true,
      locks: ['%FRONT_LOCK'],
      material: 'glass',
      durability: 30,
    },

    '%BACK_LOCK': {
      prototype: 'lock',
      name: 'Service Door Lock',
      description:
        'A deadbolt on the service entrance, standard commercial hardware.',
      difficulty: 4,
    },
    '%BACK_DOOR': {
      prototype: 'door',
      name: 'Service Door',
      description:
        'A metal service door for maintenance access, dented from decades of equipment dollies.',
      locked: true,
      open: false,
      locks: ['%BACK_LOCK'],
      material: 'metal',
      durability: 65,
    },

    '%UPSTAIRS_LOCK': {
      prototype: 'lock',
      name: 'Apartment Lock',
      description:
        'A residential deadbolt on the upstairs door, the kind that gave false security.',
      difficulty: 3,
    },
    '%UPSTAIRS_DOOR': {
      prototype: 'door',
      name: 'Apartment Door',
      description:
        'A plain door in the back corner leading to the upstairs apartment. A mailbox slot is cut into the door, stuffed with fifty-five years of junk mail that no one collected.',
      locked: true,
      open: false,
      locks: ['%UPSTAIRS_LOCK'],
      material: 'wood',
      durability: 45,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - LAUNDROMAT
    // ═══════════════════════════════════════════════════════════════════

    '%MAIN_FLOOR': {
      name: 'Yesler Laundry - Main Floor',
      description: `The laundromat is a museum of interrupted domesticity. Rows of front-loading washers line one wall, their circular doors hanging open, their drums containing the remains of loads that were never retrieved. Fifty-five years have reduced the clothes to fiber and stain—colored masses of decay that were once someone's work uniforms, someone's bedsheets, someone's favorite shirts.

Stacked dryers occupy the opposite wall, their lint traps clogged with the dust of the last loads, their drums rusted from the humidity of wet clothes that sat too long. The metal is oxidized brown, the white enamel yellowed and cracked.

A folding counter runs along the back wall, its laminate surface warped and peeling. Plastic laundry baskets sit abandoned beneath it, some empty, some containing folded clothes that were never collected—stiff now, brittle, the fabrics breaking when touched. Someone folded these clothes and left. They never came back.

The air smells of mildew and decay, the ghost of detergent long since overwhelmed by the reality of rot. A vending machine in the corner offers single-use detergent packets and fabric softener, its coin mechanism jammed, its inventory untouched.`,
      x: -9,
      y: 12,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 45,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 'yesler-way/x-9.ts',
          description: 'The glass door leads to Yesler Way',
          door: '%FRONT_DOOR',
        },
        north: '%BACK_AREA',
        up: {
          to: 'z1.ts#APARTMENT_LANDING',
          description: 'A door leads to the upstairs apartment',
          door: '%UPSTAIRS_DOOR',
        },
      },
      sittables: [
        {
          name: 'plastic chair',
          capacity: 1,
          emptyMsg:
            'A molded plastic chair, the kind bolted to laundromat floors to prevent theft. Its orange color has faded to salmon.',
          occupiedMsg: '%s in the plastic chair',
        },
        {
          name: 'waiting bench',
          capacity: 3,
          emptyMsg:
            'A wooden bench against the window, worn smooth by generations of waiting customers. The varnish is gone.',
          occupiedMsg: '%s on the waiting bench',
        },
      ],
      objects: [
        {
          prototype: 'furniture',
          name: 'washing machines',
          aliases: ['washers', 'machines', 'laundry'],
          description: `A row of front-loading washing machines, their circular doors hanging open like mouths frozen mid-scream. The drums contain the remains of the last loads—colored masses of decay that were once clothes. The fabrics have rotted to fiber and stain, the colors bleeding together into brown and gray. The machines haven't run in fifty-five years. The loads will never be finished.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'dryers',
          aliases: ['dryer', 'stacked dryers'],
          description: `Stacked dryers along the opposite wall, their lint traps clogged with the accumulated dust of final loads. The drums are rusted from wet clothes that sat too long, the humidity of decay eating at the metal. Some dryer doors are closed, their contents sealed in darkness. Others hang open, revealing drum interiors stained with the residue of clothes that rotted in place.`,
          boltedDown: true,
        },
        {
          prototype: 'furniture',
          name: 'folding counter',
          aliases: ['counter', 'table'],
          description: `A laminate folding counter along the back wall, its surface warped by decades of humidity, its edges peeling. Plastic laundry baskets sit beneath it—some empty, some containing clothes that were folded and never collected. The folded clothes are stiff now, brittle, the fabrics crystallized with age. Someone took the time to fold these. Someone never came back for them.`,
          boltedDown: true,
        },
        {
          prototype: 'cabinet',
          name: 'vending machine',
          aliases: ['vending', 'detergent'],
          description: `A vending machine offering single-use laundry supplies: detergent packets, fabric softener sheets, dryer sheets. The coin mechanism is jammed with a half-inserted quarter from fifty-five years ago. The supplies are still there—plastic-wrapped, theoretically usable, waiting for customers who will never come. The prices are quaint: $1.50 for detergent.`,
        },
        {
          prototype: 'describable',
          name: 'abandoned baskets',
          aliases: ['baskets', 'laundry baskets'],
          description: `Plastic laundry baskets scattered around the floor, some overturned, some neatly stacked, some containing the remains of laundry in various states. One basket holds a child's clothes, tiny shirts and pants that someone never collected. Another contains what might have been a business suit, now reduced to threads and buttons. The baskets are archaeology.`,
        },
      ],
    },

    '%BACK_AREA': {
      name: 'Yesler Laundry - Service Area',
      description: `The back of the laundromat is utilitarian—the space behind the customer-facing facade where the real work happened. Commercial laundry equipment fills most of the space: industrial machines for large loads, a pressing station with a steam iron, racks for hanging dry cleaning that was never claimed.

A coin sorting machine sits on a desk, its mechanism jammed mid-count, quarters and dimes frozen in the sorting slots. The laundromat must have been profitable once—there's a lot of coin inventory here. The coins are worthless now, but someone could melt them for metal.

A bulletin board on the wall holds notices that no one reads anymore: a roommate wanted ad, a lost cat poster (the cat has been lost for fifty-five years), a flyer for a community event at the park. The community dispersed. The cat was never found.

A service door leads to the back alley. The water heater in the corner is cold, its pilot light extinguished decades ago.`,
      x: -9,
      y: 13,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%MAIN_FLOOR',
        west: '%UTILITY_ROOM',
        north: {
          to: null, // Alley not implemented
          description: 'A service door leads to the back alley',
          door: '%BACK_DOOR',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'industrial machines',
          aliases: ['machines', 'commercial', 'industrial'],
          description: `Commercial-grade washing machines for large loads—the kind apartment buildings use, the kind that can handle a week's worth of laundry at once. These machines are larger than the customer-facing ones, more powerful, more expensive. They haven't run in fifty-five years. They might still work. No one has tried.`,
          boltedDown: true,
        },
        {
          prototype: 'desk',
          name: 'coin desk',
          aliases: ['desk', 'coins', 'sorting'],
          description: `A desk with a coin sorting machine, its mechanism jammed mid-count. Quarters and dimes fill the sorting slots, frozen in the act of being counted. Canvas coin bags sit beneath the desk, some full, some empty. The laundromat was a cash business. Cash doesn't mean anything now, but the metal might.`,
        },
        {
          prototype: 'furniture',
          name: 'pressing station',
          aliases: ['press', 'iron', 'steam'],
          description: `A commercial pressing station with a steam iron mounted on a swing arm, positioned over a padded ironing surface. The iron is cold, its water reservoir evaporated decades ago, mineral deposits crusted inside. Hangers hold garments that were pressed and never collected—shirts that crumble when touched, pants that have fused to the hanger clips.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'bulletin board',
          aliases: ['board', 'notices', 'flyers'],
          description: `A cork bulletin board covered with notices from before The Burning: a roommate wanted ad (the room is probably collapsed now), a lost cat poster (the cat has been lost for fifty-five years), a flyer for a summer concert in Occidental Park (the concert never happened). The notices are time capsules, evidence of concerns that seem quaint now.`,
        },
        {
          prototype: 'describable',
          name: 'dead water heater',
          aliases: ['heater', 'water heater'],
          description: `A commercial water heater, its pilot light extinguished, its tank cold. The heater provided hot water for dozens of loads a day. The last water it heated has long since evaporated. The tank might have rusted through. Opening it could be interesting, or catastrophic.`,
        },
      ],
    },

    '%UTILITY_ROOM': {
      name: 'Yesler Laundry - Utility Room',
      description: `A cramped utility room housing the mechanical systems that kept the laundromat running. Pipes and ducts crowd the ceiling, some insulated, some bare metal corroded green. The main water shutoff is here, along with the electrical panel, the gas meter, the infrastructure of a building that hasn't functioned in fifty-five years.

Chemical drums line one wall—industrial detergent, bleach, fabric softener in quantities meant for commercial use. The drums are sealed, their contents probably still viable, the industrial formulations more stable than consumer products. The labels are faded but legible.

A drain in the floor is clogged with lint and debris, a puddle of stagnant water around it that has never quite dried. The smell here is stronger than in the main space—mildew and chemical decay mixing in the enclosed air.

Maintenance records hang from a clipboard on the wall, the last entry dated three days before The Burning. The technician noted a slow drain in machine #7. The drain was never fixed.`,
      x: -10,
      y: 13,
      z: 0,
      population: 0,
      ambientNoise: 0,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%BACK_AREA',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'chemical drums',
          aliases: ['drums', 'chemicals', 'detergent'],
          description: `Industrial chemical drums along the wall: detergent concentrate, bleach, fabric softener, stain treatment. The drums are sealed, their contents probably still viable—industrial formulations last longer than consumer products. The labels are faded but readable. Someone could use these. Someone could also be poisoned by them if they've degraded.`,
        },
        {
          prototype: 'describable',
          name: 'electrical panel',
          aliases: ['panel', 'breakers', 'electrical'],
          description: `The building's electrical panel, its circuit breakers in various positions—some tripped, some still set. A master shutoff has been pulled, probably by whoever closed the building. The wiring behind the panel is old but probably intact. The building could have power again, if anyone cared to provide it.`,
        },
        {
          prototype: 'describable',
          name: 'maintenance clipboard',
          aliases: ['clipboard', 'records', 'maintenance'],
          description: `A clipboard hanging from a nail, holding maintenance records in faded ink. The last entry is dated August 12, 2062—three days before The Burning. "Machine #7 - slow drain - scheduled for service 8/17." The service was never performed. Machine #7 is still clogged, probably.`,
        },
        {
          prototype: 'describable',
          name: 'clogged drain',
          aliases: ['drain', 'puddle'],
          description: `A floor drain clogged with lint and debris, a puddle of stagnant water surrounding it that has persisted for decades. The water is brown and still, hosting things that thrive in stagnant darkness. The drain would need to be cleared before the room could dry. No one has bothered.`,
        },
      ],
    },
  },

  postProcessors: [],
};
