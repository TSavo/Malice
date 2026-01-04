// King County Courthouse - Basement (z=-1)
// Archives, evidence storage, mechanical systems

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Lock',
      description:
        'A heavy padlock on a chain, the old-fashioned kind that requires a key.',
      difficulty: 3,
    },
    '%EVIDENCE_LOCK': {
      prototype: 'biometricLock',
      name: 'Evidence Room Scanner',
      description:
        'A biometric lock requiring both keycard and fingerprint. The LED is dark.',
      scanners: [
        { type: 'keycard', part: 'hand', message: 'Evidence access restricted.' },
        { type: 'fingerprint', part: 'hand', message: 'Biometric verification required.' },
      ],
      authorizedUsers: {},
      difficulty: 7,
    },
    '%EVIDENCE_DOOR': {
      prototype: 'door',
      name: 'Evidence Room Door',
      description:
        'A reinforced steel door with multiple locks, designed to maintain chain of custody.',
      locked: true,
      open: false,
      locks: ['%EVIDENCE_LOCK'],
      material: 'metal',
      durability: 90,
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_STAIRS': {
      name: 'King County Courthouse - Basement Stairs',
      description: `Concrete stairs descend into the courthouse basement, fluorescent lights humming overhead (when the power is on). The walls are painted institutional grey, the kind of grey that discourages lingering. Signs point toward ARCHIVES, EVIDENCE, MECHANICAL.

The basement smells of old paper and climate control, the particular atmosphere of spaces designed to preserve documents rather than comfort people. The temperature is cool, the humidity controlled—or was controlled, before the systems started failing.

Pipes run along the ceiling, carrying water and steam and whatever else buildings need to function. Some pipes are labeled. Others are mysteries that only maintenance workers understood.`,
      x: 9,
      y: 3,
      z: -1,
      population: 0,
      ambientNoise: 8,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%RECORDS_HALL',
          description: 'Stairs lead up to the Records Hall',
        },
        south: '%ARCHIVES',
        east: '%EVIDENCE_ROOM',
        west: '%MECHANICAL',
      },
    },

    '%ARCHIVES': {
      name: 'King County Courthouse - Archives',
      description: `The county archives—rows of compact shelving holding records too old for active use but too important to destroy. The shelving moves on tracks, compressing to save space, expanding when someone needs to access a particular row. The mechanism still works, handles cranking smoothly, though no one has cranked them in months.

The records here go back to territorial days—land patents signed by the governor, mining claims from the 1890s, court decisions from before Washington was a state. The paper is yellowed, the ink faded, but the words remain legible. The history of the county, compressed and filed and waiting for historians who may never come.

A reading table sits in one corner, its surface covered in documents someone was examining. The examination was interrupted. The documents wait.`,
      x: 9,
      y: 2,
      z: -1,
      population: 0,
      ambientNoise: 2,
      lighting: 35,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%BASEMENT_STAIRS',
        east: '%DEEP_STORAGE',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'compact shelving',
          aliases: ['shelving', 'archives', 'records'],
          description: `Rows of compact shelving on tracks, the space-efficient storage solution for archives with too much history. The shelves hold boxes of documents, each box labeled with dates and case numbers. 1889-1892. 1893-1896. The boxes go back to before Seattle burned, before the streets were raised, before the courthouse existed.`,
        },
        {
          prototype: 'desk',
          name: 'reading table',
          aliases: ['table'],
          description: `A sturdy table for examining archival documents, its surface covered in papers someone was reviewing. Land surveys from the 1850s. Correspondence between territorial officials. The research project that was underway is unclear, but it was thorough—notes in careful handwriting, citations to other documents. The researcher left mid-sentence.`,
        },
      ],
    },

    '%DEEP_STORAGE': {
      name: 'King County Courthouse - Deep Storage',
      description: `The furthest reaches of the courthouse basement, where records go when they're too old to matter but no one has the authority to destroy them. The lighting is minimal, the climate control marginal, the filing system understood only by archivists who have retired or died.

Boxes are stacked floor to ceiling, their labels faded to illegibility. Some boxes have collapsed, their contents spilling onto the floor—papers that were important once, to someone, for some reason. The reasons are lost. The papers persist.

A section of wall shows evidence of the building's age—the original foundation from the 1960s, showing stress cracks that engineers would want to know about if engineers were still monitoring such things.`,
      x: 10,
      y: 2,
      z: -1,
      population: 0,
      ambientNoise: 0,
      lighting: 15,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%ARCHIVES',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'ancient records',
          aliases: ['boxes', 'records', 'storage'],
          description: `Towers of cardboard boxes, their labels faded, their contents mysterious. Some boxes have given way, spilling papers across the floor—handwritten documents in faded ink, forms in triplicate, the accumulated paperwork of decades. Whatever system organized this has been lost. The boxes are just boxes now.`,
        },
        {
          prototype: 'describable',
          name: 'foundation cracks',
          aliases: ['cracks', 'walls', 'foundation'],
          description: `Cracks run through the concrete foundation, hairline fractures that widen toward the floor. The building is settling, or the water table is rising, or both. The cracks have been there for years—someone marked them with dated tags for monitoring. The monitoring stopped. The cracking continues.`,
        },
      ],
    },

    '%EVIDENCE_ROOM': {
      name: 'King County Courthouse - Evidence Storage',
      description: `The evidence storage room, protected by locks that no longer respond to anyone living. Inside—if you could get inside—are the physical artifacts of resolved and unresolved cases. Murder weapons in sealed bags. Drug seizures in numbered containers. Documents that proved fraud or innocence or nothing at all.

The chain of custody was sacred here. Every item logged, every access recorded, every transfer witnessed. The chain extends into the past, through trials and appeals and outcomes that mattered once. The chain is broken now. The evidence waits, unclaimed.

Security cameras in the corners are dark, their recordings ended. Whatever happened to the evidence after the locks stopped working is unrecorded.`,
      x: 10,
      y: 3,
      z: -1,
      population: 0,
      ambientNoise: 0,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%BASEMENT_STAIRS',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'evidence lockers',
          aliases: ['lockers', 'evidence', 'storage'],
          description: `Metal lockers of various sizes, each one numbered and tagged with case identifiers. The lockers held the physical evidence of crimes—weapons, drugs, stolen property, the material proof that supported convictions or acquittals. The lockers are sealed. The evidence inside is evidence of nothing anymore.`,
        },
        {
          prototype: 'describable',
          name: 'chain of custody log',
          aliases: ['log', 'records'],
          description: `A logbook on a lectern, tracking every access to evidence storage. The entries are meticulous—name, badge number, date, time, item number, purpose. The last entry is months old. The logbook waits for entries that won't come.`,
        },
      ],
    },

    '%MECHANICAL': {
      name: 'King County Courthouse - Mechanical Room',
      description: `The courthouse's mechanical heart—HVAC systems, electrical panels, water treatment, the infrastructure that made a building of this size function. The equipment is industrial scale, designed for reliability rather than efficiency, built when energy was cheap and maintenance was expected.

The HVAC system is silent now, its fans frozen, its compressors cold. The climate that preserved records and comfortable jurors is gone, replaced by whatever temperature the building settles to naturally. The electrical panels still hum, drawing power from somewhere, distributing it to circuits that may or may not be necessary.

A maintenance log hangs from a clipboard, entries in multiple handwritings spanning years. The last entry notes a filter replacement. No one is replacing filters anymore.`,
      x: 8,
      y: 3,
      z: -1,
      population: 0,
      ambientNoise: 15,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%BASEMENT_STAIRS',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'HVAC system',
          aliases: ['hvac', 'air conditioning', 'ventilation'],
          description: `A commercial HVAC system, its components spread across the room—air handlers, compressors, ductwork, the arterial system of climate control. The system is silent, its last cycle complete, its next cycle never coming. The courthouse temperature now follows the seasons.`,
          boltedDown: true,
        },
        {
          prototype: 'describable',
          name: 'electrical panels',
          aliases: ['panels', 'breakers', 'electrical'],
          description: `Rows of electrical panels, their breakers labeled by floor and zone. Some breakers are tripped. Others remain on, feeding power to systems whose necessity is unclear. The panels hum faintly—electricity still flows through this building, from sources and for purposes that no one is monitoring.`,
        },
        {
          prototype: 'describable',
          name: 'maintenance log',
          aliases: ['log', 'clipboard'],
          description: `A clipboard holding years of maintenance logs—filter changes, belt replacements, the routine care that keeps buildings alive. The handwriting changes over time as maintenance workers came and went. The last worker left mid-sentence: "Replaced compressor belt. Need to order—" The order was never placed.`,
        },
      ],
    },
  },
};
