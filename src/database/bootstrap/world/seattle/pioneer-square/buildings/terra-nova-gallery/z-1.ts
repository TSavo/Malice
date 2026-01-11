// Terra Nova Gallery - Basement (z=-1)
// Art storage, framing workshop, and underground connection

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Padlock',
      description:
        'A heavy-duty padlock, the kind that resists bolt cutters.',
      difficulty: 4
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Hatch',
      description:
        'A trapdoor in the floor, its hinges well-oiled despite everything. The gallery owners cared about access to their storage.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'wood',
      durability: 50
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%WORKSHOP': {
      name: 'Terra Nova - Framing Workshop',
      description: `The basement level served as the gallery's working space—where art was received, inspected, framed, and prepared for display. A large worktable dominates the center, its surface scarred by years of cutting, gluing, and assembly. Framing equipment lines the walls: mat cutters, glass cutters, corner clamps, racks of molding in various styles.

The air is dusty with sawdust and the ghost of lacquer, the particular smell of a workshop that's been dormant but not abandoned. Tools hang in their places, labeled and organized, the system of someone who took craft seriously. The floor is concrete, painted gray, stained with the drips and spills of creative labor.

A trapdoor in the ceiling leads up to the gallery office. The basement ceiling is low—maybe seven feet—but the space is functional, built for work rather than display.`,
      x: -16,
      y: -6,
      z: -1,
      imageOnDisk: 'terra-nova-framing-workshop-x-16-y-6-z-1.png',
      population: 0,
      ambientNoise: 3,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%OFFICE',
          description: 'A trapdoor leads up to the gallery office',
          door: '%BASEMENT_DOOR',
          locks: ['%BASEMENT_LOCK']
        },
        north: '%VAULT'
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'worktable',
          aliases: ['table', 'workbench'],
          description:
            'A massive worktable built for framing, its surface a palimpsest of cuts and scratches. The table has seen hundreds of pieces pass through—measured, matted, framed, transformed from raw canvas to gallery-ready commodity. The tools around it are organized with the precision of someone who respected their craft.'
        },
        {
          prototype: 'describable',
          name: 'framing equipment',
          aliases: ['equipment', 'tools', 'cutters'],
          description:
            'The tools of the framing trade: mat cutters with parallel rulers, glass cutters with carbide wheels, corner clamps in various sizes, a miter saw for cutting molding. The equipment is dusty but maintained—cleaned and oiled before being left, perhaps in hope of return. The molding racks hold dozens of options, from minimalist metal to ornate gilded wood.'
        },
      ]
    },

    '%VAULT': {
      name: 'Terra Nova - Art Vault',
      description: `The northern section of the basement is the gallery's secure storage—climate-controlled, fireproof, built to protect valuable works between exhibitions or during long-term consignment. The walls are lined with vertical art racks, padded slots holding canvases of various sizes. The works here are wrapped in protective paper, their identities hidden, their value preserved.

The climate control still hums—someone ensured the power continued, or perhaps the system runs on backup. The temperature is cool and steady, the humidity controlled. Whatever is stored here remains in condition. The art waits.

A breach in the northern wall opens to the underground, the edges worn smooth by passage. The gallery owners knew about the tunnels. Perhaps they used them. The connection seems too convenient to be accidental.`,
      x: -16,
      y: -5,
      z: -1,
      imageOnDisk: 'terra-nova-art-vault-x-16-y-5-z-1.png',
      population: 0,
      ambientNoise: 5,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%WORKSHOP'
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'art racks',
          aliases: ['racks', 'storage', 'canvases'],
          description:
            'Vertical storage racks designed for paintings, each slot padded with archival foam. The works are wrapped in acid-free paper, their corners protected by cardboard. Numbers are visible on each wrapping—inventory codes that correspond to records in the office above. The art inside could be valuable or worthless. The wrapping treats all of it the same.'
        },
        {
          prototype: 'describable',
          name: 'climate control unit',
          aliases: ['hvac', 'climate control', 'cooling'],
          description:
            'A specialized climate control unit built into the wall, its display showing temperature and humidity readings. The system maintains gallery-standard conditions: 70°F, 50% relative humidity. The unit hums quietly, drawing power from somewhere to protect art that may never be displayed again. The dedication is touching, or absurd, depending on perspective.'
        },
        {
          prototype: 'describable',
          name: 'wall breach',
          aliases: ['breach', 'opening', 'hole'],
          description:
            'A section of wall where bricks have been removed, creating a passage into the underground beyond. The edges are worn smooth, the bricks around it darkened by the touch of hands over time. The breach was made intentionally, maintained intentionally, used regularly. Art and underground commerce have always been adjacent.'
        },
      ]
    }
  }
};
