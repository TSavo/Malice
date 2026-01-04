// Redux Vintage basement connection

export const room = {
  name: 'Underground Passage',
  description: `The passage runs beneath what was once a row of storefronts, the buried ground level of businesses that thrived before the fire. Fragments of the commercial past persist in the architecture—doorframes that once welcomed customers, display windows bricked over from the inside, transom spaces where light and ventilation entered from the sidewalk above.

A section of the west wall has been breached, opening into a narrow shaft that ascends toward the building above. The breach is deliberate—someone needed access between the underground and the basement spaces that occupy the intermediate level between the buried streets and the current ground floor.

The floor transitions from brick paving to packed earth where the original construction was never completed or has since deteriorated. The uneven surface suggests the passage sees regular use despite its condition—feet have worn paths through the debris and sediment.`,
  x: -15,
  y: 4,
  z: -2,
  population: 0,
  ambientNoise: 12,
  lighting: 15,
  waterLevel: 0,
  outdoor: false,
  exits: {
    north: {
      to: 'buildings/redux-vintage/z-1.ts:%TUNNEL_ACCESS',
      description: 'A breach in the wall leads up to the building above',
    },
  },
};
