// City Services - Third Floor (z=2)
// Operations Center

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // THIRD FLOOR (z=2) - OPERATIONS
    // ═══════════════════════════════════════════════════════════════════

    '%ELEV_LOBBY_Z2': {
      name: 'City Services - Operations Lobby',
      description: `The elevator opens onto the operations floor, the nerve center of City Services. The air is different here—cleaner, cooler, filtered. The hum of electronics replaces the mechanical sounds of the lower floors.

Security is tighter. A reinforced door leads west to the control center. The glass is thick, wire-reinforced. Whatever happens in operations, it's not meant for public view.

A stairwell door to the south provides roof access. The sign reads: ROOF - AUTHORIZED PERSONNEL ONLY.`,
      x: -15,
      y: 9,
      z: 2,
      imageOnDisk: 'city-services-operations-lobby-x-15-y9-z2.png',
      population: 0,
      ambientNoise: 15,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%CONTROL',
        south: '%MONITORING',
        in: '%E',
      },
      elevatorId: '%E',
    },

    '%CONTROL': {
      name: 'City Services - Control Center',
      description: `The control center for all city services operations. Banks of monitors line the walls, displaying status feeds for water, power, and sanitation systems. Most screens are dark, but the essential ones still glow—system status, pressure readings, grid loads.

A central console dominates the room, designed for coordinating emergency response across all utilities. The chair is worn, the armrests smooth from years of use. Someone still sits here. Someone still watches.

Maps on the wall show the entire service area, zones color-coded by status. Some zones are green. Many are grey—offline, abandoned, or unknown. The map tells the story of a city contracting.`,
      x: -16,
      y: 9,
      z: 2,
      imageOnDisk: 'city-services-control-center-x-16-y9-z2.png',
      population: 0,
      ambientNoise: 20,
      lighting: 60,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ELEV_LOBBY_Z2',
        south: '%DISPATCH',
      },
    },

    '%DISPATCH': {
      name: 'City Services - Dispatch',
      description: `The dispatch center for field crews. Radio equipment lines one wall, some of it newer than the building, patched into whatever communication network still functions. A scheduling board shows crew assignments, routes, priorities.

Lockers stand along the opposite wall—personal storage for workers who go out into the city to keep things running. Some lockers are still in use, names on the doors. Others are empty, their owners gone.

The work continues. Water pipes break. Power lines fall. Sewers back up. Someone has to fix it. This is where they get their orders.`,
      x: -16,
      y: 8,
      z: 2,
      imageOnDisk: 'city-services-dispatch-x-16-y8-z2.png',
      population: 0,
      ambientNoise: 12,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%CONTROL',
      },
    },

    '%MONITORING': {
      name: 'City Services - Systems Monitoring',
      description: `A room dedicated to monitoring automated systems. Server racks line one wall, status lights blinking in patterns that mean something to those who read them. The machines that watch the machines that run the city.

A workstation provides interface access to the monitoring systems—logs, alerts, historical data. The screen shows a dashboard of green and yellow indicators. No red. Not right now.

A door to the south leads to the roof access stairwell. Fresh air and a view of the city, for those who need a break from the hum of servers.`,
      x: -15,
      y: 8,
      z: 2,
      imageOnDisk: 'city-services-systems-monitoring-x-15-y8-z2.png',
      population: 0,
      ambientNoise: 18,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ELEV_LOBBY_Z2',
        up: '%ROOF_ACCESS',
      },
    },

    '%ROOF_ACCESS': {
      name: 'City Services - Roof',
      description: `The roof of City Services, accessible via a heavy door from the monitoring room below. Communication equipment clusters in one corner—antennas, dishes, relay boxes. The infrastructure that keeps the building connected to whatever network still exists.

The view spans Pioneer Square and beyond. Smith Tower rises to the northeast, the debris wall visible to the north. The waterfront lies to the west, grey water under grey sky.

The roof is flat, tarred, functional. No one comes here for the ambiance. They come to fix the antennas or to get away from the hum of electronics for a few minutes.`,
      x: -15,
      y: 8,
      z: 3,
      imageOnDisk: 'city-services-roof-x-15-y8-z3.png',
      population: 0,
      ambientNoise: 20,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        down: '%MONITORING',
      },
    },
  },
};
