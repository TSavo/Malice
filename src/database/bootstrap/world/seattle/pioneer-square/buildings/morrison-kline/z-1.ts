// Morrison & Kline - Basement (z=-1)
// Archive storage, old case files, and a forgotten passage to the underground

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Door Lock',
      description:
        'A sturdy deadbolt lock on the basement door, the key long since lost.',
      difficulty: 4
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Door',
      description:
        'A heavy wooden door marked "STORAGE - AUTHORIZED PERSONNEL ONLY" in faded stencil.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK']
    },

    '%VAULT_LOCK': {
      prototype: 'lock',
      name: 'Records Vault Lock',
      description:
        'A combination lock protecting the records vault, its dial worn smooth from decades of use.',
      difficulty: 7
    },
    '%VAULT_DOOR': {
      prototype: 'door',
      name: 'Vault Door',
      description:
        'A heavy steel door protecting the records vault, its surface painted institutional grey.',
      locked: true,
      open: false,
      locks: ['%VAULT_LOCK']
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1) - ARCHIVES AND STORAGE
    // ═══════════════════════════════════════════════════════════════════

    '%STAIRS': {
      name: 'Morrison & Kline - Basement Stairs',
      description: `Narrow wooden stairs descend from the reception area into the building's basement. The steps creak with age, the wood worn smooth in the center from decades of paralegals carrying boxes of documents to and from storage. The walls are bare plaster, water-stained in places where pipes have leaked over the years.

A bare bulb hangs from the ceiling at the landing, its switch a pull-chain that hasn't been pulled in months. The darkness below is absolute, the kind of darkness that collects in spaces beneath cities—old air, old dust, the accumulated stillness of decades.

The stairs continue down to a storage area that spans the building's footprint, filled with the paper trail of maritime commerce.`,
      x: -14,
      y: 7,
      z: -1,
      imageOnDisk: 'morrison-kline-basement-stairs-x-14-y7-z-1.png',
      population: 0,
      ambientNoise: 3,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: { to: 'z0.ts#%RECEPTION', door: '%BASEMENT_DOOR', locks: ['%BASEMENT_LOCK'] },
        west: '%ARCHIVE_MAIN',
        north: '%MECHANICAL'
      }
    },

    '%ARCHIVE_MAIN': {
      name: 'Morrison & Kline - Case Archive',
      description: `The main archive occupies the western half of the basement, its low ceiling forcing a stoop in anyone over six feet. Metal shelving units fill the space in tight rows, each shelf loaded with banker's boxes labeled by year and case number. The boxes date back decades—the oldest from the 1950s, their cardboard soft and foxed with age.

The organization is meticulous despite the cramped conditions. Each row is labeled with a range of years, each shelf with case types: CARGO CLAIMS, MARITIME PERSONAL INJURY, CHARTER DISPUTES. The taxonomy of maritime law, filed and forgotten.

The air is thick with the smell of old paper and the mineral dampness that seeps through basement walls. A dehumidifier sits in the corner, silent, its reservoir long since overflowed and dried. The paper has begun to suffer in its absence—foxing spreading across documents, mold blooming in the dampest boxes.

A heavy door in the south wall leads to a records vault, its combination lock suggesting contents worth protecting.`,
      x: -15,
      y: 7,
      z: -1,
      imageOnDisk: 'morrison-kline-case-archive-x-15-y7-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%STAIRS',
        north: '%STORAGE',
        south: { room: '%VAULT', door: '%VAULT_DOOR', locks: ['%VAULT_LOCK'] }
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'archive shelves',
          aliases: ['shelves', 'shelving', 'boxes'],
          description:
            'Metal shelving units packed with banker\'s boxes, each labeled with case numbers and dates. The oldest boxes are soft with age, their contents slowly returning to pulp.'
        },
        {
          prototype: 'describable',
          name: 'dehumidifier',
          aliases: ['machine'],
          description:
            'A commercial dehumidifier, its reservoir cracked and empty. Without power, it serves only as a monument to the futility of fighting entropy in basement spaces.'
        },
      ]
    },

    '%STORAGE': {
      name: 'Morrison & Kline - Evidence Storage',
      description: `The northern section of the basement was used for physical evidence—exhibits from cases that required more than paper to prove. Wire cages divide the space into secure sections, each cage padlocked, each containing the material residue of maritime disputes.

Damaged cargo sits in some cages: waterlogged electronics, salt-corroded machinery, containers of goods that arrived in conditions warranting legal action. Other cages hold ship models used as demonstrative exhibits, their detail sufficient for juries to understand the geometry of collisions.

One cage contains personal effects from a wrongful death case—a seaman's gear, family photographs, the things a man carried when he went to work on a ship and never came home. The case file would explain the story. The objects tell it silently.

A section of the wall near the northeast corner shows signs of disturbance—bricks that don't quite match, mortar newer than the surrounding work. Someone walled something up down here.`,
      x: -15,
      y: 7,
      z: -1,
      imageOnDisk: 'morrison-kline-evidence-storage-x-15-y7-z-1.png',
      population: 0,
      ambientNoise: 2,
      lighting: 12,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%ARCHIVE_MAIN',
        east: '%MECHANICAL'
      },
      objects: [
        {
          prototype: 'locker',
          name: 'evidence cage',
          aliases: ['cage', 'locker'],
          description:
            'A wire mesh cage secured with a heavy padlock, containing damaged cargo from a shipping dispute. The electronics inside are corroded beyond recognition.'
        },
        {
          prototype: 'crate',
          name: 'exhibit crate',
          aliases: ['crate', 'box'],
          description:
            'A wooden crate labeled "EXHIBIT A - MV Pacific Fortune Collision" containing a detailed ship model used as courtroom evidence.'
        },
        {
          prototype: 'describable',
          name: 'disturbed wall section',
          aliases: ['wall', 'bricks', 'disturbance'],
          description:
            'A section of wall where the bricks don\'t quite match—newer mortar, slightly different color. Someone sealed something here, years or decades ago. The work was competent but hasty. Whatever lies beyond, someone wanted it hidden.'
        },
      ]
    },

    '%MECHANICAL': {
      name: 'Morrison & Kline - Mechanical Room',
      description: `The mechanical room houses the building's infrastructure—the furnace, water heater, electrical panel, and the tangle of pipes and conduits that keep a century-old building functional. The equipment is a museum of building systems: a cast iron boiler from the 1920s (long since cold), a newer gas furnace from the 1980s, water heaters that have been replaced multiple times.

The electrical panel is a hazard inspector's nightmare, circuits added over decades without regard for the original design. Wires snake through holes knocked in the panel cover, their purposes marked in handwriting from multiple eras.

In the corner, partially hidden behind the water heater, a floor drain sits lower than it should—not a drain at all, but a hatch, its edges worn smooth by something repeatedly passing through. The hatch leads down into darkness, into passages that the building's blueprints don't acknowledge.`,
      x: -14,
      y: 7,
      z: -1,
      imageOnDisk: 'morrison-kline-mechanical-room-x-14-y7-z-1.png',
      population: 0,
      ambientNoise: 8,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%STAIRS',
        west: '%STORAGE'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'gas furnace',
          aliases: ['furnace', 'heater'],
          description:
            'A gas furnace from the 1980s, its pilot light extinguished, its ducts disappearing into the ceiling. The unit is surprisingly well-maintained—someone cared about keeping the building warm.'
        },
        {
          prototype: 'describable',
          name: 'electrical panel',
          aliases: ['panel', 'breakers', 'fuse box'],
          description:
            'An electrical panel that has been modified repeatedly over decades. The original fuse box sits beside a modern breaker panel, both connected in ways that would horrify a licensed electrician. Labels in multiple handwriting styles identify circuits that may or may not still exist.'
        },
        {
          prototype: 'describable',
          name: 'concealed hatch',
          aliases: ['hatch', 'drain', 'trapdoor'],
          description:
            'What appears to be a floor drain is actually a hatch, its edges worn smooth by repeated use. The hatch lifts to reveal a narrow shaft descending into darkness—access to the underground tunnels that thread beneath Pioneer Square. The lawyers upstairs never knew. The building\'s janitors certainly did.'
        },
      ]
    },

    '%VAULT': {
      name: 'Morrison & Kline - Records Vault',
      description: `The records vault is a room within a room—steel walls, fireproof construction, climate control that still hums with residual charge from backup batteries. This is where the firm kept its most sensitive documents: settlement agreements with confidentiality clauses, corporate records from shipping companies that no longer exist, the paper trail of transactions that someone wanted protected.

Filing cabinets line the walls, each drawer locked, each lock requiring a different key. The keys hang on a board by the door—someone abandoned security procedures when they abandoned the building.

A small desk sits in the center of the vault, positioned for reviewing documents without removing them from the secured space. A ledger on the desk logs every file accessed, the last entry dated months ago. The handwriting is shaky, hurried. Someone was looking for something specific.`,
      x: -15,
      y: 6,
      z: -1,
      imageOnDisk: 'morrison-kline-records-vault-x-15-y6-z-1.png',
      population: 0,
      ambientNoise: 5,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: { room: '%ARCHIVE_MAIN', door: '%VAULT_DOOR', locks: ['%VAULT_LOCK'] }
      },
      sittables: [
        {
          name: 'the vault desk chair',
          capacity: 1,
          emptyMsg:
            'A simple office chair sits at the review desk, positioned for examining sensitive documents.',
          occupiedMsg: '%s seated at the vault review desk'
        },
      ],
      objects: [
        {
          prototype: 'cabinet',
          name: 'secured filing cabinets',
          aliases: ['cabinets', 'files', 'drawers'],
          description:
            'Heavy filing cabinets with individual drawer locks, designed to protect sensitive documents even if the vault itself is breached. The keys hang on a board by the door—security abandoned along with everything else.'
        },
        {
          prototype: 'desk',
          name: 'review desk',
          aliases: ['desk', 'table'],
          description:
            'A small desk for reviewing documents without removing them from the vault. An access ledger lies open on the surface, its last entry showing someone accessed the "CONTINUUM CONTRACTS" drawer months ago.'
        },
        {
          prototype: 'safe',
          name: 'floor safe',
          aliases: ['safe'],
          description:
            'A floor safe set into the concrete, its door slightly ajar. Whatever was inside has been removed—or was never there at all. The safe\'s purpose was as much psychological as practical: a final layer of security for the most sensitive materials.'
        },
      ]
    }
  }
};
