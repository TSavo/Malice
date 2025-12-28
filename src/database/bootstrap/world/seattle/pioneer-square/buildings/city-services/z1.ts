// City Services - Second Floor (z=1)
// Water & Power Department

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // SECOND FLOOR (z=1) - WATER & POWER
    // ═══════════════════════════════════════════════════════════════════

    '%ELEV_LOBBY_Z1': {
      name: 'City Services - Second Floor Lobby',
      description: `The elevator opens onto a utilitarian hallway, the floor covered in industrial tile worn by decades of work boots. The walls are painted institutional green—the color of municipal buildings everywhere, the color of patience and persistence.

A directory board lists the departments: WATER SERVICES - WEST. POWER SERVICES - SOUTH. The lettering is hand-painted, touched up over the years in slightly different shades.

Windows along the east wall look out over 1st Ave S, grey light filtering through glass that needs cleaning.`,
      x: -15,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 8,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%WATER',
        south: '%POWER',
        in: '%E',
      },
      elevatorId: '%E',
    },

    '%WATER': {
      name: 'City Services - Water Services',
      description: `The Water Services department occupies the northwest corner of the second floor. Maps cover the walls—the city's water infrastructure laid out in blue lines and pressure zones. The pipes that keep a city alive, invisible beneath the streets until they fail.

Desks sit in rows, terminals dark, chairs pushed back from workstations as if their occupants just stepped away. The infrastructure maps are annotated with handwritten notes, repairs logged, pressure readings recorded. The water still flows. Someone maintains the system.

A door to the south leads to the pump monitoring station. The hum of machinery is audible through the walls.`,
      x: -16,
      y: 9,
      z: 1,
      population: 0,
      ambientNoise: 12,
      lighting: 65,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%ELEV_LOBBY_Z1',
        south: '%PUMP_STATION',
      },
    },

    '%PUMP_STATION': {
      name: 'City Services - Pump Monitoring',
      description: `A control room for the city's water infrastructure. Panels line the walls, gauges and readouts tracking pressure, flow rates, reservoir levels. Most of the displays are dark, but a few still glow with steady readings. The essential systems.

The hum of pumps resonates through the floor—machinery in the basement pushing water through pipes to wherever it's still needed. The sound is constant, almost soothing. The heartbeat of infrastructure.

Valve wheels and manual overrides stand ready for emergencies. The systems are automated, but someone built in the option for human intervention. Old engineers who didn't trust computers entirely.`,
      x: -16,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 25,
      lighting: 55,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%WATER',
      },
    },

    '%POWER': {
      name: 'City Services - Power Services',
      description: `The Power Services section of the second floor. The east wall is covered in electrical diagrams—the city's grid mapped in lines and nodes, substations marked, load calculations penciled in margins. The power that keeps the lights on.

Workbenches hold testing equipment, multimeters and oscilloscopes, tools for diagnosing problems in systems that span miles. A whiteboard lists outages and repairs, some entries fresh, others faded. The grid is patched together, but it holds.

Through the window, you can see the city. Some buildings are dark. Some still have power. The pattern tells a story about priorities and capacity.`,
      x: -15,
      y: 8,
      z: 1,
      population: 0,
      ambientNoise: 8,
      lighting: 70,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ELEV_LOBBY_Z1',
      },
    },
  },
};
