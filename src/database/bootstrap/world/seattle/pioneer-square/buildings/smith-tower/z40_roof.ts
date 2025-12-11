// Smith Tower - Roof (above z=40)
// Exterior crown roof area; treated as same z to simplify elevator wiring

export const building = {
  rooms: {
    // Shared elevator car placeholder (not directly exiting onto roof; access via ladder/hatch)
    '%E': {
      prototype: 'elevator',
      exits: {
        out: '%PHL',
      },
    },

    // Central hatch base (reuse penthouse landing via shared placeholder) -- see z40

    // Roof grid, 4x3 spanning x=-5..-2, y=7..9 for consistency with lower floors

    '%RH1': {
      name: 'Roof - Northwest Corner',
      description: `Tar and gravel run to a low parapet stained by a century of rain. Wind up here tastes of salt, diesel, and ozone from the old radio kit below. Rusted conduit stubs jut from the deck where antenna masts once bristled.`,
      x: -5,
      y: 9,
      z: 40,
      population: 0,
      ambientNoise: 14,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        east: '%RH2',
        south: '%RH4',
      },
    },

    '%RH2': {
      name: 'Roof - North Run',
      description: `A narrow run of roof between the crown's terracotta ribs. The drop to the street canyons is dizzying; buses creep like toy models below. Pigeons explode away when you set foot here, leaving dusty feathers stuck to the tar.`,
      x: -4,
      y: 9,
      z: 40,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%RH1',
        east: '%RH3',
        south: '%RH5',
      },
    },

    '%RH3': {
      name: 'Roof - Northeast Corner',
      description: `The parapet here overlooks the old viaduct traces and the bay beyond. A lightning rod, bent at its base, leans seaward with slack copper strap coiled beside it.`,
      x: -3,
      y: 9,
      z: 40,
      population: 0,
      ambientNoise: 15,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        west: '%RH2',
        south: '%RH6',
      },
    },

    '%RH4': {
      name: 'Roof - West Walk',
      description: `A tight walk along the crown wall. Terracotta tiles here are crazed with hairline cracks and patched with mismatched caulk. Condensation beads on metal service boxes bolted to the parapet, trickling rust down the face.`,
      x: -5,
      y: 8,
      z: 40,
      population: 0,
      ambientNoise: 13,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%RH1',
        east: '%RH5',
        south: '%RH7',
      },
    },

    '%RH5': {
      name: 'Roof - Central Deck',
      description: `The central expanse between the crown faces. Fresh tar smears around a square hatch, layered over decades of older patches. From here the white terracotta pyramid rises above you, its seams stained and its glass cap catching stray light.`,
      x: -4,
      y: 8,
      z: 40,
      population: 0,
      ambientNoise: 14,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%RH2',
        west: '%RH4',
        east: '%RH6',
        south: '%RH8',
        down: { room: '%PHL', locks: ['%L1'] },
      },
    },

    '%RH6': {
      name: 'Roof - East Walk',
      description: `A narrow strip pressed against the eastern crown wall. The brick parapet is streaked dark by decades of runoff and moss. Wind whistles through a gap where a railing segment sheared away long ago.`,
      x: -3,
      y: 8,
      z: 40,
      population: 0,
      ambientNoise: 14,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%RH3',
        west: '%RH5',
        south: '%RH9',
      },
    },

    '%RH7': {
      name: 'Roof - Southwest Corner',
      description: `The roof sags slightly here. A drain choked with leaves and pigeon feathers holds a shallow puddle that mirrors the crown above in ripples.`,
      x: -5,
      y: 7,
      z: 40,
      population: 0,
      ambientNoise: 12,
      lighting: 100,
      waterLevel: 1,
      outdoor: true,
      exits: {
        north: '%RH4',
        east: '%RH8',
      },
    },

    '%RH8': {
      name: 'Roof - South Run',
      description: `A south-facing strip with a long view toward the stadium roofs and freight yards. On sunny days, heat shimmers off the tar; now, it holds footprints in soft black. The parapet is chest-high, chipped, and cold to the touch.`,
      x: -4,
      y: 7,
      z: 40,
      population: 0,
      ambientNoise: 13,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%RH5',
        west: '%RH7',
        east: '%RH9',
      },
    },

    '%RH9': {
      name: 'Roof - Southeast Corner',
      description: `The southeastern corner peers down toward Occidental and the waterfront cranes. A bent safety rail rattles in the wind until you brace it. Initials are scratched into the tar at your feet, half-filled with grit.`,
      x: -3,
      y: 7,
      z: 40,
      population: 0,
      ambientNoise: 13,
      lighting: 100,
      waterLevel: 0,
      outdoor: true,
      exits: {
        north: '%RH6',
        west: '%RH8',
      },
    },
  },
};
