// Jade Palace Jewelers - Ground Floor (z=0)
// A Chinese jewelry store in the International District, closed for 55 years
// Security gate down, inventory likely still inside—jade and gold that looters overlooked

export const building = {
  name: 'Jade Palace Jewelers',
  x: 12,
  y: -4,
  width: 5,
  height: 3,
  floors: 3,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%FRONT_LOCK': {
      prototype: 'lock',
      name: 'Security Gate Lock',
      description:
        'A heavy padlock securing the roll-down security gate. Chinese jewelry stores took security seriously—the merchandise was always gold and jade, never costume pieces.',
      difficulty: 5,
    },
    '%FRONT_GATE': {
      prototype: 'door',
      name: 'Security Gate',
      description:
        'A heavy roll-down security gate, the kind that protects jewelry stores in every Chinatown. The gate is rusted in place, locked from inside with a padlock that has corroded to the hasp. Through the diamond-pattern mesh: display cases, still arranged, still holding inventory.',
      locked: true,
      open: false,
      locks: ['%FRONT_LOCK'],
      material: 'metal',
      durability: 80,
    },

    '%BACK_LOCK': {
      prototype: 'lock',
      name: 'Service Door Lock',
      description:
        'A deadbolt on the service entrance. The jewelry trade required paranoia about security—every door a potential vulnerability.',
      difficulty: 4,
    },
    '%BACK_DOOR': {
      prototype: 'door',
      name: 'Service Door',
      description:
        'A reinforced steel door leading to the building\'s service corridor. No glass, no windows—jewelry stores learned not to provide easy access.',
      locked: true,
      open: false,
      locks: ['%BACK_LOCK'],
      material: 'metal',
      durability: 70,
    },

    '%UPSTAIRS_LOCK': {
      prototype: 'lock',
      name: 'Residential Lock',
      description:
        'A standard residential deadbolt. The apartments upstairs were separate from the jewelry business—different tenants, different keys.',
      difficulty: 3,
    },
    '%UPSTAIRS_DOOR': {
      prototype: 'door',
      name: 'Stairwell Door',
      description:
        'A plain door in the back of the showroom leading to the residential floors above. The store owner probably lived upstairs once, before the building was subdivided.',
      locked: true,
      open: false,
      locks: ['%UPSTAIRS_LOCK'],
      material: 'wood',
      durability: 45,
    },

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Karaoke Bar Lock',
      description:
        'A modern keypad lock, its battery long dead. The karaoke bar operated on different hours than the jewelry store—different clientele, different access.',
      difficulty: 2,
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Stairway Door',
      description:
        'A heavy door at the top of stairs descending to the basement karaoke bar. A faded sign in Chinese and English: PRIVATE ROOMS AVAILABLE.',
      locked: false,
      open: true,
      locks: ['%BASEMENT_LOCK'],
      material: 'metal',
      durability: 55,
    },

    // ═══════════════════════════════════════════════════════════════════
    // GROUND FLOOR (z=0) - JEWELRY STORE
    // ═══════════════════════════════════════════════════════════════════

    '%SHOWROOM': {
      name: 'Jade Palace Jewelers - Showroom',
      description: `The showroom is frozen in commercial time, every display case still arranged as if expecting customers. Glass cases line both walls, their contents organized by type and price point: jade bangles arranged by shade from pale celadon to deep imperial green, gold chains sorted by karat weight, pendants depicting dragons and Buddhas and the Chinese zodiac animals.

The security gate lets in striated light, falling across cases that haven't been touched in fifty-five years. Dust covers everything, but the inventory beneath is intact. Looters in the aftermath took electronics and food—they left the jade and gold, the traditional stores of value in Chinese communities. Portable wealth became worthless when there was nowhere to port it to.

A mirror runs along the back wall, positioned so customers could try on necklaces and see how jade looked against their skin. The mirror reflects only dust and darkness now. Red paper decorations hang from the ceiling, faded to pink, the prosperity they wished for long since evaporated.

The air smells of decades: dust and the faint chemical memory of jewelry cleaner, the metal polish that kept gold bright for customers who no longer exist.`,
      x: 11,
      y: -6,
      z: 0,
      imageOnDisk: 's-jackson-st-x11-y-6-z0.png',
      population: 0,
      ambientNoise: 0,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: {
          to: 's-jackson/x11.ts',
          description: 'The security gate leads to S. Jackson St',
          door: '%FRONT_GATE',
        },
        north: '%BACK_ROOM',
        up: {
          to: 'z1.ts#%STAIRWELL',
          description: 'A door leads to the residential floors above',
          door: '%UPSTAIRS_DOOR',
        },
        down: {
          to: 'z-1.ts#%KARAOKE_STAIRS',
          description: 'Stairs descend to the basement karaoke bar',
          door: '%BASEMENT_DOOR',
        },
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'jade display case',
          aliases: ['jade case', 'jade', 'bangles'],
          locked: true,
          description: `A long display case dedicated to jade, the stone Chinese culture valued above diamonds. Bangles are arranged by shade: pale lavender jade said to bring tranquility, apple green for vitality, and the rare imperial jade—deep emerald that once commanded prices higher than gold. The bangles are sized for Chinese wrists, smaller than Western averages. Price tags in faded ink show numbers with many zeros.`,
        },
        {
          prototype: 'cabinet',
          name: 'gold display case',
          aliases: ['gold case', 'gold', 'chains'],
          locked: true,
          description: `A case of gold pieces, the chains and pendants that Chinese communities used as portable wealth. The gold is 24-karat—pure gold, soft and bright, the way Asian markets preferred it. Western 14-karat would have been considered impure. Dragon pendants coil next to Buddha figures, zodiac animals beside lucky coins with square holes. The gold hasn't tarnished. Gold doesn't. It just waits.`,
        },
        {
          prototype: 'cabinet',
          name: 'wedding jewelry case',
          aliases: ['wedding case', 'bridal', 'marriage'],
          locked: true,
          description: `A special case for wedding jewelry—the double happiness symbols, the dragon and phoenix pairs that Chinese weddings required. Red silk lines the case, the color of luck and celebration. Gold bangles meant to be worn by brides, passed down through generations. The weddings these were meant for never happened. The traditions they represented have no one left to remember them.`,
        },
        {
          prototype: 'describable',
          name: 'try-on mirror',
          aliases: ['mirror', 'glass'],
          description: `A full-length mirror mounted on the back wall, positioned so customers could see how jade looked against their skin—the paleness that meant the stone was cold from the case, the way it warmed as it absorbed body heat. The mirror is dusty but intact, reflecting a showroom that no one visits. In the dim light, you might see your own reflection. You might see ghosts.`,
        },
        {
          prototype: 'describable',
          name: 'prosperity decorations',
          aliases: ['decorations', 'red paper', 'banners'],
          description: `Red paper decorations hang from the ceiling, the characters for prosperity and longevity faded to illegibility. Paper lanterns cluster in corners. A lucky cat with a waving arm is frozen mid-wave, its battery dead decades ago. The decorations were meant to attract fortune. Fortune stopped visiting fifty-five years ago.`,
        },
        {
          prototype: 'describable',
          name: 'glass counter',
          aliases: ['counter', 'register'],
          description: `The sales counter where transactions happened, its glass top protecting a velvet-lined display of smaller items: earrings, rings, the pieces priced for impulse purchases. The register is a modern point-of-sale terminal, its screen dark. A calculator with large buttons sits beside it—the old way of computing prices for customers who didn't trust computers. A pad of receipts with carbon copies is open to the last transaction, the ink too faded to read.`,
        },
      ],
    },

    '%BACK_ROOM': {
      name: 'Jade Palace Jewelers - Back Room',
      description: `The back room is where the real business happened—where jewelry was appraised, sized, and stored between sales. A workbench runs along one wall, equipped with the tools of a jeweler's trade: loupes of various magnification, small scales for weighing gold, the files and polishing wheels for adjustments.

A heavy safe dominates one corner, its door ajar, whatever was inside removed before the end—or after. The safe was rated for fire and burglary, but fifty-five years of neglect have rusted its hinges to frozen positions. A security camera mount points at the safe, the camera itself long since dead.

Inventory shelves line the walls, the backup stock that replenished display cases. Velvet-lined trays hold pieces awaiting repair: a jade bangle cracked and never fixed, a gold chain with a broken clasp, the everyday maintenance that kept the business running. The repairs will never be completed.

A small bathroom and a cramped kitchenette occupy one corner—the amenities that let staff work long hours without leaving the security of the store.`,
      x: 11,
      y: -5,
      z: 0,
      imageOnDisk: 'jade-palace-jewelers-back-room-x11-y-5-z0.png',
      population: 0,
      ambientNoise: 0,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%SHOWROOM',
        east: {
          to: null, // Service corridor not implemented
          description: 'A reinforced door leads to the service corridor',
          door: '%BACK_DOOR',
        },
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'jeweler workbench',
          aliases: ['workbench', 'bench', 'desk'],
          description: `A proper jeweler's workbench with a leather apron hanging from one edge to catch dropped pieces. Loupes of various magnification are scattered across the surface—a 10x for general inspection, a 20x for finding flaws. Small pliers and files wait in a wooden holder. A polishing wheel is caked with buffing compound that dried to powder decades ago. The last piece worked on sits in a vise: a jade ring being resized, the work interrupted and never resumed.`,
          boltedDown: true,
        },
        {
          prototype: 'safe',
          name: 'jewelry safe',
          aliases: ['safe', 'vault'],
          locked: false,
          open: true,
          description: `A massive floor safe, fireproof and burglar-resistant, now standing with its door ajar. The interior is dark and mostly empty—either cleared out before the end or looted after. A few velvet pouches remain in the corners, their contents unknown. The safe's dial is frozen at 36, the last number of a combination no one remembers. The safe could be closed and locked again. It would keep nothing safe.`,
        },
        {
          prototype: 'cabinet',
          name: 'inventory shelves',
          aliases: ['shelves', 'stock', 'inventory'],
          description: `Metal shelving holding velvet-lined trays of backup inventory—the pieces that would have replaced items as they sold. Some trays are empty, others still hold neatly arranged pieces: jade earrings in various shades, gold chains coiled precisely, pendant settings awaiting customization. A handwritten inventory sheet is tacked to one shelf, the last stock count before the world ended.`,
        },
        {
          prototype: 'furniture',
          name: 'repair tray',
          aliases: ['repairs', 'tray'],
          description: `A tray of jewelry awaiting repair, each piece tagged with the customer's name and the work to be done. A cracked jade bangle with "Mrs. Lin - reglue" written on its tag. A gold chain marked "Chen - new clasp." The repairs were never completed. The customers never returned to claim them.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'gold scale',
          aliases: ['scale', 'scales', 'balance'],
          description: `A precision balance for weighing gold, its pans still level after decades of disuse. The scale could measure to hundredths of a gram—important when gold prices were calculated by weight. A set of calibration weights sits in a velvet-lined box nearby. The scale still works, but there's no one to verify the weight of gold that no longer matters.`,
        },
      ],
    },
  },

  postProcessors: [],
};
