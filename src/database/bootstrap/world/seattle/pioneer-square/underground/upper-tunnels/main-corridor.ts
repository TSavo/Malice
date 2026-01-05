// Main Corridor - connecting Main Crossing to Occidental Crossing
// Beneath S. Main Street (y=0, x=-13 to x=-9)

export const building = {
  name: 'Main Street Corridor',
  x: -13,
  y: 0,
  width: 5,
  height: 1,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════════
    // MAIN STREET UNDERGROUND (y=0, z=-2)
    // ═══════════════════════════════════════════════════════════════════════

    '%MAIN_BANK': {
      name: 'Underground Bank Vault',
      description: `The passage opens into what was once a bank vault—the massive steel door still hangs from broken hinges, its combination mechanism frozen by corrosion. The vault was cleaned out during the fire, its contents either saved or stolen depending on which history you believe. What remains is the architecture of security: walls of reinforced concrete, a ceiling of iron plate, the infrastructure of trust that outlasted the trust itself.

Safety deposit boxes line one wall, their small doors hanging open, their contents long since emptied. A few have been pried open more recently, the tool marks fresh. Someone still believes treasures wait here in the darkness.`,
      x: -13,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: {
          to: 'underground/upper-tunnels/main-crossing.ts',
          description: 'The passage continues west toward the Main Crossing',
        },
        east: '%MAIN_RECORDS',
      },
      objects: [
        { prototype: 'safe', name: 'a ruined vault door', description: 'The bank vault door hangs askew, its hinges broken, its lock mechanism exposed. Whatever it once protected is long gone.', boltedDown: true },
        { prototype: 'cabinet', name: 'empty deposit boxes', description: 'Rows of safety deposit boxes, all open, all empty. Someone checked every one.', boltedDown: true },
      ],
    },

    '%MAIN_RECORDS': {
      name: 'Records Archive',
      description: `The chamber was a records archive—filing cabinets line the walls, their drawers hanging open, their contents transformed into pulp by decades of moisture. Whatever was important enough to store here—deeds, contracts, evidence—has returned to the wood fiber from which it came.

A few documents survived, protected by glass cases that remained intact. These fragments tell stories of land deals and business partnerships, of money borrowed and debts called due. The details have faded, but the anxiety they once caused lingers in the air like a residue.`,
      x: -12,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 3,
      lighting: 8,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%MAIN_BANK',
        east: '%MAIN_EXCHANGE',
      },
      objects: [
        { prototype: 'cabinet', name: 'ruined filing cabinets', description: 'Metal filing cabinets contain only paper pulp and rust. Whatever secrets they held have dissolved.', boltedDown: true },
      ],
    },

    '%MAIN_EXCHANGE': {
      name: 'The Old Exchange',
      description: `This was the underground extension of the Seattle Exchange—not the stock exchange, but the place where commodities changed hands: lumber futures, fish catches, labor contracts. The blackboards remain, their surfaces still showing the ghostly outlines of numbers written in chalk, erased, and written again. The last prices posted here are still visible: CEDAR $12/M, SALMON $0.03/LB, CHINESE LABOR $1.50/DAY.

The market closed when the streets rose. The prices were never updated. The exchange became a monument to values that no longer apply.`,
      x: -11,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 12,
      waterLevel: 3,
      outdoor: false,
      exits: {
        west: '%MAIN_RECORDS',
        east: '%MAIN_TELEGRAPH',
      },
      objects: [
        { prototype: 'furniture', name: 'commodity blackboards', description: 'Slate blackboards show faded prices from 1889. The commodities traded here—timber, fish, human labor—all had their values recorded before the fire.', boltedDown: true },
      ],
    },

    '%MAIN_TELEGRAPH': {
      name: 'Telegraph Relay',
      description: `The chamber housed a telegraph relay station, one of several that connected Seattle to the broader world before telephones made them obsolete. The equipment remains: brass keys for sending Morse code, sounder boxes that once clicked out messages, spools of wire that connected this darkness to daylight thousands of miles away.

The last message received is still on the desk, transcribed by a hand that has long since stopped writing: "FIRE CONFIRMED STOP TOTAL LOSS ESTIMATED STOP SEND RELIEF IMMEDIATELY STOP". The relief never came through here. The station fell silent.`,
      x: -10,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 5,
      lighting: 10,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%MAIN_EXCHANGE',
        east: '%MAIN_NEWSPAPER',
      },
      objects: [
        { prototype: 'furniture', name: 'telegraph equipment', description: 'A brass telegraph key sits on a wooden desk, its mechanism still functional. The sounder box beside it is silent.', boltedDown: true },
        { prototype: 'sign', name: 'a final message', description: 'A piece of paper pinned to the wall reads: "FIRE CONFIRMED STOP TOTAL LOSS ESTIMATED STOP SEND RELIEF IMMEDIATELY STOP"', boltedDown: true },
      ],
    },

    '%MAIN_NEWSPAPER': {
      name: 'Press Row Basement',
      description: `The passage runs beneath what was once Press Row—the concentration of newspaper offices that made this block the information center of the young city. The basement served multiple papers, each with its own section: storage for newsprint, archives for back issues, and the cramped offices where reporters wrote stories that shaped the city's image of itself.

Bound volumes of the Seattle Post-Intelligencer line one wall, their pages fused together by moisture. Headlines are still visible on the spines: "FIRE SWEEPS CITY", "STREETS TO BE RAISED", "UNDERGROUND CLOSED TO PUBLIC". The papers documented their own burial.`,
      x: -9,
      y: 0,
      z: -2,
      population: 0,
      ambientNoise: 8,
      lighting: 12,
      waterLevel: 5,
      outdoor: false,
      exits: {
        west: '%MAIN_TELEGRAPH',
        east: {
          to: 'buildings/underground-east/z-2.ts',
          room: '%MAIN_ST_CONN',
          description: 'The passage continues east toward the Occidental tunnels',
        },
      },
      objects: [
        { prototype: 'cabinet', name: 'newspaper archives', description: 'Bound volumes of newspapers from the 1880s and 1890s. The pages are fused together, but headlines remain visible on the spines.', boltedDown: true },
      ],
    },
  },
};
