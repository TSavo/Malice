// Underground passage - connecting Corp Construction Infrastructure Hub (2,3) to Observation Deck (0,3)

export const room = {
  name: 'Warehouse Passage',
  description: `The passage runs through the warehouse district underground, connecting the eastern Corp Construction area to the western corridors. The construction varies along its length—newer sections near the Corp Construction showing modern reinforcement techniques, older sections retaining Victorian-era brick.

The ceiling is higher here, the space originally sized for storing goods rather than simple transit. Evidence of the warehouse district's commercial past is visible—loading hooks, storage brackets, the infrastructure of trade.

A faint vibration comes from the east—the subtle hum of the Corp Construction operations, whatever they might be.`,
  x: 1,
  y: 3,
  z: -2,
  population: 0,
  ambientNoise: 20,
  lighting: 18,
  waterLevel: 5,
  outdoor: false,
  exits: {
    east: {
      to: 'buildings/corp-construction/z-2.ts',
      room: '%INFRASTRUCTURE_HUB',
      description: 'The passage leads east toward Corp Construction',
    },
    west: {
      to: 'buildings/underground-east/z-2.ts',
      room: '%WAREHOUSE_JCT',
      description: 'The passage leads west to Warehouse Junction',
    },
  },
};
