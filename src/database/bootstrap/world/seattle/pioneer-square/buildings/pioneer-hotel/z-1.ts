// Pioneer Hotel - Basement (z=-1)
// Storage, laundry, and maintenance access

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Lock',
      description:
        'A cheap padlock on a hasp, the kind that could be defeated with bolt cutters or patience.',
      difficulty: 2
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Door',
      description:
        'A wooden door reinforced with sheet metal, the hinges rusted but functional. Someone painted NO ENTRY on it in dripping letters.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'wood',
      durability: 50
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%LAUNDRY': {
      name: 'Pioneer Hotel - Laundry Room',
      description: `The basement laundry room still has its industrial washers and dryers, hulking machines from an era when the hotel provided services. The machines are dead now—no power, no water pressure, no one to operate them. They sit in rows like monuments to cleanliness that no longer matters.

The floor is cracked concrete, stained by decades of bleach and detergent and the other fluids that accumulate in a flophouse. Drains in the floor are clogged with lint and hair and things that shouldn't be examined. The smell is mildew and old soap and something organic beneath.

Stairs lead up to the lobby. A maintenance corridor leads east toward the building's mechanical systems.`,
      x: -16,
      y: 7,
      z: -1,
      population: 0,
      ambientNoise: 5,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%LOBBY',
          description: 'Stairs lead up to the lobby',
          door: '%BASEMENT_DOOR',
          locks: ['%BASEMENT_LOCK']
        },
        east: '%MECHANICAL'
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'industrial washers',
          aliases: ['washers', 'machines', 'laundry'],
          description:
            'A row of industrial washing machines, their drum doors hanging open like mouths. The machines are dead—no power, no water. Someone stripped the copper wiring from one of them. The others remain intact, waiting for electricity that will never come.'
        },
        {
          prototype: 'furniture',
          name: 'dryers',
          aliases: ['dryer'],
          description:
            'Industrial dryers line the opposite wall, their vents disconnected and hanging loose. Lint clogs the filters, accumulated from the last loads ever dried here. The lint is grey and matted, compressed into felt by time.'
        },
      ]
    },

    '%MECHANICAL': {
      name: 'Pioneer Hotel - Mechanical Room',
      description: `The building's mechanical room houses a water heater that hasn't heated water in months, an electrical panel that still hums with current from somewhere, and pipes that run in every direction. The infrastructure of a building that's falling apart above but still functions below.

A boiler sits cold in the corner, its pilot light extinguished. The hot water for six floors of residents came from this boiler. Now the residents use whatever water pressure remains, cold and getting colder.

A section of wall in the eastern corner has been knocked through, revealing an older passage beyond—the underground that predates this building, the buried streets of old Seattle.`,
      x: -16,
      y: 7,
      z: -1,
      population: 0,
      ambientNoise: 8,
      lighting: 10,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%LAUNDRY'
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'water heater',
          aliases: ['boiler', 'heater'],
          description:
            'A commercial water heater, large enough to supply six floors of hotel rooms. The heater is cold now, its pilot light extinguished, its tank empty of hot water. The residents use cold water when they can get it. The pressure varies.'
        },
        {
          prototype: 'describable',
          name: 'electrical panel',
          aliases: ['panel', 'breaker', 'electrical'],
          description:
            'An electrical panel, its breakers labeled with floor numbers and zones. The panel hums with current from somewhere—the grid still functions, or something like it. Some breakers are tripped. Others remain on. The pattern suggests selective maintenance by someone who knew what they were doing.'
        },
        {
          prototype: 'describable',
          name: 'wall breach',
          aliases: ['breach', 'hole', 'passage'],
          description:
            'A section of the eastern wall has been knocked through, bricks piled to either side. The breach reveals an older passage beyond—the underground that exists beneath all of Pioneer Square. Someone uses this passage. The footprints in the dust lead both ways.'
        },
      ]
    }
  }
};
