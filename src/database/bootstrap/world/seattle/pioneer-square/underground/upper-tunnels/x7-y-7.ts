// Underground passage - connecting Third Avenue South Passage (7,-8) to Third Avenue Passage (7,-6)

export const room = {
  name: 'Third Avenue Link',
  description: `The passage runs north-south along the Third Avenue underground, connecting the southern passage to the main Third Avenue corridor. The construction is consistent—utility infrastructure typical of the eastern underground network.

The walls are lined with cable conduits, the telecommunications and power infrastructure that serves the buildings above. The conduits are maintained, their contents still active and regularly serviced.

A maintenance access panel is set into one wall, its surface marked with utility company logos and warning labels. The panel provides access to the systems behind the walls.`,
  x: 7,
  y: -7,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 18,
  waterLevel: 8,
  outdoor: false,
  exits: {
    north: {
      to: 'buildings/underground-east/z-2.ts',
      room: '%3RD_AVE_PASSAGE',
      description: 'The passage leads north to Third Avenue Passage',
    },
    south: {
      to: 'buildings/underground-east/z-2.ts',
      room: '%3RD_AVE_S_PASSAGE',
      description: 'The passage leads south to Third Avenue South Passage',
    },
  },
};
