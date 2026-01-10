// Supply Depot - Basement (z=-1)
// Sorting facility and emergency reserves, underground connection

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'biometricLock',
      name: 'Basement Access Scanner',
      description:
        'A palm scanner mounted beside the basement door, its LED glowing amber in standby mode.',
      scanners: [
        {
          type: 'palm',
          part: 'hand',
          message: 'Basement access restricted.'
        },
      ],
      authorizedUsers: {}
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Access Door',
      description:
        'A reinforced metal door with AUTHORIZED PERSONNEL ONLY stenciled across it.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'metal',
      durability: 80
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%SORTING': {
      name: 'Supply Depot - Sorting Facility',
      description: `The basement level houses the automated heart of the depot's operations. Conveyor belts run in channels cut into the concrete floor, their rubber surfaces worn but still functional. Packages slide down from chutes connected to the receiving bay above, sorted by destination codes into waiting bins.

The machinery is industrial—heavy, loud when running, designed for throughput rather than elegance. Motors hum in standby mode, sensors blink red and green, the system ready to process whatever comes down the chutes. The Continuum's logistics never truly sleep.

Banks of fluorescent lights cast harsh shadows across the sorting floor. The air is cold, the climate control prioritizing equipment preservation over human comfort. Few humans work down here anymore—the machines handle what machines can handle.`,
      x: -20,
      y: -5,
      z: -1,
      population: 0,
      ambientNoise: 20,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%RECEIVING',
          description: 'A reinforced door leads up to the receiving bay',
          door: '%BASEMENT_DOOR',
          locks: ['%BASEMENT_LOCK']
        },
        east: '%RESERVES'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'conveyor system',
          aliases: ['conveyors', 'belts', 'machinery'],
          description:
            'A network of conveyor belts channeled into the concrete floor, connecting intake chutes to sorting bins. The belts are worn but maintained—someone keeps the machinery running even if the volume has dropped. Sensors scan packages as they pass, routing them by destination code. The system is automatic, reliable, and utterly indifferent to what it moves.'
        },
        {
          prototype: 'describable',
          name: 'sorting bins',
          aliases: ['bins', 'containers'],
          description:
            'Large metal bins on wheeled bases, positioned at the ends of conveyor lines. Each bin is labeled with a destination code: PS-NORTH, PS-SOUTH, PS-CENTRAL, PRIORITY. The bins are half-empty now—demand has dropped, but the infrastructure remains sized for a larger population.'
        },
      ]
    },

    '%RESERVES': {
      name: 'Supply Depot - Emergency Reserves',
      description: `The eastern section of the basement holds the depot's emergency stockpile—supplies kept separate from regular distribution, reserved for crisis situations the Continuum prefers to plan for rather than experience. The shelving here is heavier, the packages larger, the inventory different.

Sealed crates marked EMERGENCY RATIONS. Cases of medical supplies. Water purification equipment. Radiation detection gear. The reserve tells a story about what the Continuum fears: contamination, starvation, systems failure, events that would overwhelm normal distribution.

The room is colder than the sorting floor, the climate control more aggressive. These supplies are meant to last. A breach in the eastern wall opens to the underground—an unofficial access point that predates the Continuum's occupation of this building.`,
      x: -20,
      y: -5,
      z: -1,
      population: 0,
      ambientNoise: 8,
      lighting: 40,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%SORTING'      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'emergency rations',
          aliases: ['rations', 'food', 'crates'],
          description:
            'Stacks of sealed crates marked EMERGENCY RATIONS - CONTINUUM AUTHORIZED in stenciled letters. Each crate contains nutrient bars, water tablets, and vitamin supplements—enough to sustain one person for thirty days. The crates are dated, rotated regularly, the oldest stock cycled out before expiration. Someone takes the reserve seriously.'
        },
        {
          prototype: 'cabinet',
          name: 'medical supplies',
          aliases: ['medical', 'supplies', 'medicine'],
          description:
            'Cases of medical supplies stacked against the wall: first aid kits, trauma supplies, broad-spectrum antibiotics, surgical tools still sealed in sterile packaging. The inventory suggests preparation for mass casualty events. The Continuum believes in being prepared.'
        },
        {
          prototype: 'describable',
          name: 'radiation equipment',
          aliases: ['radiation', 'detectors', 'gear'],
          description:
            'A shelf of radiation detection and protection equipment: Geiger counters in padded cases, dosimeters in sealed packaging, potassium iodide tablets in bulk containers. The presence of this equipment suggests threats the Continuum acknowledges but doesn\'t discuss publicly. The seals are intact. The equipment has never been needed. So far.'
        },
      ]
    }
  }
};
