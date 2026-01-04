// Fabrication Branch passage - with access to Fabrication Factory basement

export const building = {
  rooms: {
    '%PASSAGE': {
      name: 'Underground Passage',
      description: `The tunnel cuts through the foundations of buildings that no longer exist, their basements repurposed as passage. The original walls show the wear of commercial use—scuff marks at cart height, smoothed patches where goods were loaded and unloaded, the practical damage of a working space. The buildings burned or were demolished. Their basements became thoroughfares.

Cast iron columns line the passage, supporting floors that were removed when the streets rose. The columns are decorative as well as structural, their capitals carved with acanthus leaves in the style of the 1880s. The craftsmanship seems absurd underground, beauty installed for a basement that was never meant to be seen.

A breach in the northern wall leads to an industrial basement—the heat of foundry work radiating through, the smell of hot metal and diesel fuel drifting down.`,
      x: -19,
      y: 10,
      z: -2,
      population: 0,
      ambientNoise: 20,
      lighting: 15,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: {
          to: 'buildings/fabrication-factory/z-1.ts:%FOUNDRY',
          description: 'A breach in the wall leads to a factory basement',
        },
      },
    },
  },
};
