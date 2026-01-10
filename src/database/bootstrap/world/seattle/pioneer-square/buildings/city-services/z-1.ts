// City Services - Basement (z=-1)
// Utility infrastructure, boiler room, and emergency systems

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DOORS AND LOCKS
    // ═══════════════════════════════════════════════════════════════════

    '%BASEMENT_LOCK': {
      prototype: 'biometricLock',
      name: 'Basement Access Scanner',
      description:
        'A fingerprint scanner beside a heavy steel door, its surface worn from years of use.',
      scanners: [
        {
          type: 'fingerprint',
          part: 'hand',
          message: 'Maintenance access only.'
        },
      ],
      authorizedUsers: {}
    },
    '%BASEMENT_DOOR': {
      prototype: 'door',
      name: 'Basement Access',
      description:
        'A heavy steel door with MAINTENANCE ACCESS stenciled across it in faded yellow paint.',
      locked: true,
      open: false,
      locks: ['%BASEMENT_LOCK'],
      material: 'metal',
      durability: 80
    },

    // ═══════════════════════════════════════════════════════════════════
    // BASEMENT (z=-1)
    // ═══════════════════════════════════════════════════════════════════

    '%MECHANICAL': {
      name: 'City Services - Mechanical Room',
      description: `The mechanical heart of City Services—boilers, pumps, electrical switchgear, the infrastructure that kept a government building functioning. The ceiling is a maze of pipes and conduits, color-coded in a system that made sense to the maintenance staff who are no longer here.

The main boiler is cold now, its pilot light extinguished, but the gauge still shows pressure in the emergency backup tank. Someone shut this down properly, following procedures even at the end. The electrical panels hum with current from somewhere, feeding the systems above that still function.

A stairwell leads up to the processing area. A passage in the western wall opens into older construction—the underground network that predates this building.`,
      x: -16,
      y: 8,
      z: -1,
      population: 0,
      ambientNoise: 15,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: {
          to: 'z0.ts#%PROCESSING',
          description: 'Stairs lead up to the processing area',
          door: '%BASEMENT_DOOR',
          locks: ['%BASEMENT_LOCK']
        },
        east: '%UTILITY_VAULT'
      },
      objects: [
        {
          prototype: 'furniture',
          name: 'main boiler',
          aliases: ['boiler', 'furnace'],
          description:
            'A commercial boiler, its heavy steel housing cold to the touch. The system was shut down properly—valves closed, gauges at zero, the checklist completed by the last maintenance worker. The boiler could be restarted. The fuel supply is the question.',
          boltedDown: true
        },
        {
          prototype: 'describable',
          name: 'electrical panels',
          aliases: ['panels', 'switchgear', 'electrical'],
          description:
            'Banks of electrical panels and switchgear, the main distribution point for the building. The panels hum with current from somewhere—the city grid or something else. Warning labels caution about voltages that could kill. The warnings remain relevant.'
        },
      ]
    },

    '%UTILITY_VAULT': {
      name: 'City Services - Utility Vault',
      description: `The utility vault houses the building's connection to city infrastructure—water mains, sewer lines, electrical feeds, the pipes and conduits that link this building to the larger urban network. The walls are lined with valves and meters, the control points for systems that span the city.

A massive water main runs through the chamber, its diameter large enough to crawl through. Smaller pipes branch off, feeding the building's various needs. The valves are labeled with floors and functions, a maintenance worker's map of the building's circulatory system.

Emergency equipment fills one corner: a backup generator, fuel cans, emergency lighting. The generator is silent but maintained, its fuel tanks still showing volume. Someone prepared for outages that never came—or came in ways they didn't anticipate.`,
      x: -15,
      y: 8,
      z: -1,
      population: 0,
      ambientNoise: 12,
      lighting: 25,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%MECHANICAL',
        north: '%EMERGENCY_SYSTEMS'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'water main',
          aliases: ['main', 'pipe', 'water'],
          description:
            'A massive water main, its diameter measured in feet rather than inches. The pipe runs through the chamber, feeding city water to the building and beyond. Valves along its length control flow to different systems. The main still holds pressure—somewhere, the water system functions.'
        },
        {
          prototype: 'furniture',
          name: 'backup generator',
          aliases: ['generator', 'genset'],
          description:
            'A diesel backup generator, large enough to power the building\'s essential systems. The generator is silent, waiting. Fuel cans sit nearby, their levels visible through translucent plastic. Enough fuel for maybe a week of operation. The generator has never been started since the maintenance schedule ended.',
          boltedDown: true
        },
      ]
    },

    '%EMERGENCY_SYSTEMS': {
      name: 'City Services - Emergency Systems',
      description: `The emergency systems room contains the infrastructure for disaster response—communication equipment, backup power switching, the control points that would activate during city emergencies. Banks of radio equipment line one wall, their frequencies labeled for fire, police, and emergency services.

A situation map covers the opposite wall—Pioneer Square and the surrounding areas, marked with evacuation routes, shelter locations, and infrastructure nodes. The map is outdated but the geography hasn't changed. The routes would still work, if anyone needed to evacuate.

The room feels like a bunker, which it essentially is—hardened against whatever disasters the city planners anticipated. They didn't anticipate this one.`,
      x: -15,
      y: 9,
      z: -1,
      population: 0,
      ambientNoise: 5,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        south: '%UTILITY_VAULT'
      },
      objects: [
        {
          prototype: 'describable',
          name: 'radio equipment',
          aliases: ['radios', 'communication', 'comms'],
          description:
            'Banks of radio equipment for emergency communication—frequencies for fire, police, EMS, and city services. The equipment is dark, unpowered or waiting for someone to activate it. The frequencies are probably still monitored. The question is by whom.'
        },
        {
          prototype: 'describable',
          name: 'situation map',
          aliases: ['map', 'evacuation'],
          description:
            'A large wall map of the district, marked with emergency infrastructure: evacuation routes in green, shelter locations in blue, utility nodes in red. The map predates the current situation but the geography is accurate. The routes still lead somewhere. Whether that somewhere is safe is unknown.'
        },
      ]
    }
  }
};
