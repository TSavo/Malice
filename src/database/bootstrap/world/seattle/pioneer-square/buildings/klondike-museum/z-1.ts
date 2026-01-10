// Klondike Gold Rush Museum - Basement (z=-1)
// Original Cadillac Hotel cellar with Gold Rush artifacts and underground access

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Lock',
      description:
        'A heavy-duty deadbolt installed by the Park Service, its mechanism stiff but functional.',
      difficulty: 4
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Door',
      description:
        'A reinforced steel door with COLLECTION STORAGE stenciled across it. The door is thick, designed to protect the museum\'s most valuable artifacts.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'metal',
      durability: 80
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%COLLECTION_STORAGE': {
      name: 'Klondike Museum - Collection Storage',
      description: `The museum's secure collection storage occupies the Cadillac Hotel's original basement—stone walls from the 1890s, reinforced floors, the kind of construction that was built to last. Climate control equipment hums along one wall, maintaining the precise conditions that artifact preservation requires.

Metal shelving units fill the space, each one loaded with acid-free boxes labeled with accession numbers. The collection extends far beyond what the public displays could ever show: more gold pans, more photographs, personal letters from prospectors who never struck it rich, the ephemera of the gold rush preserved in archival folders.

Stairs lead up to the staff area, and a service corridor continues north into the building's older foundations. The air is cool and dry, controlled by machinery that doesn't know the museum closed.`,
      x: -12,
      y: -3,
      z: -1,
      population: 0,
      ambientNoise: 8,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%STAFF_AREA',
          description: 'Stairs lead up to the staff area',
          door: '%BASEMENT_DOOR',
          locks: ['%BASEMENT_LOCK']
        },
        north: '%VAULT',
        west: '%OLD_FOUNDATION'
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'archival shelving',
          aliases: ['shelves', 'archives', 'collection'],
          description:
            'Metal shelving units loaded with acid-free boxes, each labeled with accession numbers. The labels are meticulous: "1984.003.045 - Gold pan, iron, Chilkoot Pass provenance." The organization represents decades of careful curation. The curators are gone. The organization persists.'
        },
        {
          prototype: 'describable',
          name: 'climate control',
          aliases: ['hvac', 'machinery'],
          description:
            'Climate control equipment mounted along one wall—dehumidifiers, temperature regulators, air filtration. The machinery hums steadily, maintaining 65 degrees and 40% humidity, the conditions specified in the museum\'s collections policy. The policy is followed by machines that never read it.'
        },
      ]
    },

    '%VAULT': {
      name: 'Klondike Museum - Gold Vault',
      description: `The vault was installed when the museum acquired its most valuable artifacts—actual gold from the Klondike, nuggets and dust and flakes preserved behind steel and concrete. The vault door is massive, a bank-style installation from the 1950s, its combination dial frozen at some forgotten setting.

Inside, the gold is still there—display cases holding nuggets the size of thumbnails, vials of gold dust, the actual treasure that drew a hundred thousand people north. The gold gleams in the dim light, unchanged by time, as valuable now as it was in 1897. More valuable, maybe, if anyone knew what value meant anymore.

The vault also holds the museum's document collection: original letters, mining claims, maps drawn by prospectors, the paper trail of the gold rush. The paper is more fragile than the gold but equally irreplaceable.`,
      x: -12,
      y: -2,
      z: -1,
      population: 0,
      ambientNoise: 2,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%COLLECTION_STORAGE'
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'gold displays',
          aliases: ['gold', 'nuggets', 'display'],
          description:
            'Glass display cases hold actual gold from the Klondike—nuggets in various sizes, vials of gold dust, a small ingot stamped with a Dawson City assayer\'s mark. The gold catches what little light there is, gleaming with the color that drove men to madness and mountain passes. The gold is worth a fortune. The fortune is meaningless.'
        },
        {
          prototype: 'cabinet',
          name: 'document cases',
          aliases: ['documents', 'papers', 'letters'],
          description:
            'Archival cases hold the paper records of the gold rush: letters home from prospectors, mining claims signed in shaky handwriting, maps with "GOLD HERE" scrawled optimistically in pencil. The documents are fragile, their paper yellowed, their ink fading. The stories they tell are clearer than ever.'
        },
        {
          prototype: 'describable',
          name: 'vault door',
          aliases: ['door', 'safe'],
          description:
            'A massive vault door, the kind installed in banks in the 1950s—two feet of steel and concrete, combination locks, a handle that takes both hands to turn. The door is open now, swung wide on hinges that still work perfectly. The combination is lost. The door stays open.'
        },
      ]
    },

    '%OLD_FOUNDATION': {
      name: 'Klondike Museum - Old Foundation',
      description: `The western section of the basement reveals the Cadillac Hotel's original construction—stone walls from before the Great Fire, massive beams that have held up the building for over a century. This section was never renovated, never updated, its original character preserved by neglect rather than intention.

The floor is packed earth here, compacted by time but never paved. Water stains on the walls document flooding that happened decades ago, when the water table was higher and the drainage less reliable. The high-water marks reach nearly four feet in places.

A breach in the western wall leads into darkness—the underground network that runs beneath Pioneer Square, the buried streets and foundations from before the city rebuilt itself. Someone opened this passage long ago. Someone has been using it.`,
      x: -13,
      y: -3,
      z: -1,
      population: 0,
      ambientNoise: 5,
      lighting: 5,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: '%COLLECTION_STORAGE'      },
      objects: [
        {
          prototype: 'describable',
          name: 'stone walls',
          aliases: ['walls', 'foundation', 'stones'],
          description:
            'The original foundation walls, built from massive stones fitted together before modern construction. The stones are local, quarried from somewhere that no longer produces them. Water stains mark the walls at consistent levels—the memory of floods written in mineral deposits.'
        },
        {
          prototype: 'describable',
          name: 'wall breach',
          aliases: ['breach', 'passage', 'hole'],
          description:
            'A section of wall where stones have been removed, creating a passage into the darkness beyond. The breach is old—decades of wear on the edges—but the path beyond is maintained. Someone uses this passage. The underground network connects to the surface in places like this.'
        },
      ]
    }
  }
};
