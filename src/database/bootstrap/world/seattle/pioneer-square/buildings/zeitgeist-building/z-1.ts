// Zeitgeist Building - Basement (z=-1)
// Art storage, mechanical systems, and underground connection

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'lock',
      name: 'Basement Lock',
      description:
        'A heavy-duty padlock, the kind used to secure valuable inventory.',
      difficulty: 4,
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Hatch',
      description:
        'A heavy trapdoor in the floor, its iron surface painted with grip strips for safety. A chain secures it when closed.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'metal',
      durability: 70,
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%ART_STORAGE': {
      name: 'Zeitgeist Building - Art Storage',
      description: `The basement level serves as long-term storage for the gallery above—climate-controlled space for works that aren't currently on display. The walls are lined with vertical art racks, canvases slotted into padded slots, each one numbered and catalogued in a system that predates digital databases.

Sculptures on pedestals fill the center of the room, shrouded in white cloth like ghosts of art movements past. Crates marked FRAGILE and HANDLE WITH CARE stack against one wall, their contents mysterious, their provenance forgotten.

The climate control system hums steadily—dehumidifiers and temperature regulators still functioning, protecting works that may never be exhibited again. The art waits. The art is patient.`,
      x: -13,
      y: 1,
      z: -1,
      population: 0,
      ambientNoise: 8,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%STORAGE',
          description: 'A trapdoor leads up to ground-floor storage',
          door: '%BASEMENT_DOOR',
          locks: ['%BASEMENT_LOCK'],
        },
        north: '%MECHANICAL',
        west: '%OLD_FOUNDATION',
      },
      objects: [
        {
          prototype: 'cabinet',
          name: 'art racks',
          aliases: ['racks', 'storage', 'canvases'],
          description:
            'Vertical art storage racks, their slots padded with archival materials. Canvases slide in and out, each numbered with a brass tag. The system is analog, efficient, and entirely dependent on someone remembering where everything is. That someone is gone.',
        },
        {
          prototype: 'describable',
          name: 'shrouded sculptures',
          aliases: ['sculptures', 'statues', 'art'],
          description:
            'Sculptures stand on pedestals, covered in white cloth that turns them into abstract shapes. The cloth protects from dust and light damage. The shapes beneath could be anything—figurative, abstract, political, personal. The mystery is part of the preservation.',
        },
      ],
    },

    '%MECHANICAL': {
      name: 'Zeitgeist Building - Mechanical Room',
      description: `The building's mechanical systems occupy this space—a commercial HVAC unit that still functions, electrical panels, the water heater that supplies the coffee shop above. The infrastructure is surprisingly modern, upgraded sometime in the last twenty years by owners who cared about the building's longevity.

The HVAC system cycles on and off, maintaining the climate control that protects the art stored nearby. The electricity comes from somewhere—the grid still functions, or some backup system does. The bills aren't being paid, but the power continues.

A small workspace in the corner has maintenance logs, the last entries from months ago. Whoever kept this building running has stopped keeping it running, but the machinery continues on its own inertia.`,
      x: -13,
      y: 1,
      z: -1,
      population: 0,
      ambientNoise: 15,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%ART_STORAGE',
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'HVAC unit',
          aliases: ['hvac', 'air conditioning', 'climate control'],
          description:
            'A commercial HVAC unit, its compressor humming steadily. The unit is modern—installed within the last two decades—and still functions perfectly. It maintains the climate that protects the art stored below. The power comes from somewhere. The maintenance has stopped. The machine continues.',
        },
        {
          prototype: 'describable',
          name: 'electrical panels',
          aliases: ['panels', 'breakers', 'electrical'],
          description:
            'Electrical panels with breakers for each floor and zone. The labels are printed, professional: GALLERY LIGHTING, COFFEE BAR, CLIMATE CONTROL. Some breakers are tripped. Others remain on. The pattern suggests intentional conservation of power.',
        },
      ],
    },

    '%OLD_FOUNDATION': {
      name: 'Zeitgeist Building - Old Foundation',
      description: `The western section of the basement reveals the building's original 1892 construction—massive stone blocks fitted together before modern cement techniques arrived in Seattle. The stones are local, quarried from somewhere that no longer exists, their surfaces worn smooth by time and moisture.

Water seeps through in places, leaving mineral deposits that trace its path down the walls. The floor is packed earth here, never paved, the building's bones exposed. The air is colder, damper, carrying the smell of underground places.

A breach in the western wall opens into darkness—the underground passage network that connects all of Pioneer Square. The breach is old, the edges worn smooth by generations of passage.`,
      x: -14,
      y: 1,
      z: -1,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        east: '%ART_STORAGE',
        west: {
          to: 'underground/upper-tunnels/x-14-y1.ts#%PASSAGE',
          description: 'A breach in the foundation leads to the underground',
        },
      },
      objects: [
        {
          prototype: 'describable',
          name: 'stone foundation',
          aliases: ['stones', 'walls', 'foundation'],
          description:
            'The original foundation stones, massive blocks fitted together with skill that predates modern construction. The stones are weathered, their surfaces marked by over a century of moisture seepage. Mineral deposits trace the water\'s path in white and orange lines. The foundation holds. It has held for 130 years.',
        },
        {
          prototype: 'describable',
          name: 'wall breach',
          aliases: ['breach', 'opening', 'passage'],
          description:
            'A section of wall where stones have been removed, creating a passage into the underground beyond. The breach is old—the edges worn smooth, the surrounding stones showing decades of contact. Someone uses this passage regularly. The footprints lead both ways.',
        },
      ],
    },
  },
};
