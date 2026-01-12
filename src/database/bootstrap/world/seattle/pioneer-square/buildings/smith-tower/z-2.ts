// Smith Tower - Utility Level (z=-2)
// Service infrastructure and emergency escape route
// Connects to the Seattle Underground (future expansion)

export const building = {
  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // UTILITY LEVEL (y=+9): Junction, Maintenance, Escape Tunnel
    // ═══════════════════════════════════════════════════════════════════

    '%DC_UTILITY': {
      // Utility Junction (-2, +9, -2)
      name: 'Datacenter - Utility Junction',
      description: `A cramped junction where pipes, cables, and conduits converge from all directions. Sparse emergency lights cast pools of dim illumination between stretches of shadow. The ceiling is low—barely six feet—with overhead pipes forcing you to duck.

Water pipes, power conduits, and fiber optic bundles run along the walls in organized chaos. Everything is labeled with faded tags from before The Burning. Some labels have been replaced by the AI's robotic maintenance systems—crisp white text on black backgrounds.

A ladder leads up to the datacenter level. The air is damp and smells of concrete and old copper.`,
      x: -2,
      y: 9,
      z: -2,
      imageOnDisk: 'datacenter-utility-junction-x-2-y9-z-2.png',
      population: 0,
      ambientNoise: 30,
      lighting: 30,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%DC_CORRIDOR',
        east: '%DC_MAINT',
        west: '%DC_TUNNEL',
      },
    },

    '%DC_MAINT': {
      // Maintenance Bay (-1, +9, -2)
      name: 'Datacenter - Maintenance Bay',
      description: `A workshop space for the facility's robotic maintenance systems. Work lights illuminate organized racks of spare parts: server blades, cooling fans, power supplies, cable spools. Everything the AI needs to keep itself running.

A charging station holds two dormant maintenance robots—squat, multi-armed machines designed for precision work in tight spaces. Their status lights glow amber: standby mode.

Tools hang on pegboards: soldering equipment, diagnostic devices, calibration instruments. All positioned for mechanical arms, not human hands. The workbenches are the wrong height for people.`,
      x: -1,
      y: 9,
      z: -2,
      imageOnDisk: 'datacenter-maintenance-bay-x-1-y9-z-2.png',
      population: 0,
      ambientNoise: 20,
      lighting: 50,
      waterLevel: 0,
      outdoor: false,
      exits: {
        west: '%DC_UTILITY',
      },
    },

    '%DC_TUNNEL': {
      // Escape Tunnel (-3, +9, -2)
      name: 'Datacenter - Escape Tunnel',
      description: `A narrow concrete tunnel stretching west into darkness. Emergency lighting has failed here—only a faint glow from the junction behind provides any visibility. The tunnel was built as an emergency escape route, connecting to the old Seattle Underground.

The air is stale and cold. Water has seeped through cracks in the concrete, leaving mineral deposits on the walls. The tunnel hasn't been used in decades—maybe never.

Somewhere ahead, the tunnel connects to the forgotten passages beneath Pioneer Square. The way is dark, uncertain. Whatever lies beyond, the AI's domain ends here.`,
      x: -3,
      y: 9,
      z: -2,
      imageOnDisk: 'datacenter-escape-tunnel-x-3-y9-z-2.png',
      population: 0,
      ambientNoise: 10,
      lighting: 20,
      waterLevel: 0,
      outdoor: false,
      exits: {
        east: '%DC_UTILITY',
        southwest: {
          description:
            'The tunnel continues southwest into the Seattle Underground',
        },
      },
    },
  },
};
