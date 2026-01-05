// Underground passage - factory district

export const room = {
  name: 'Loading Junction',
  description: `The passage reaches a junction where the cannery route meets the Loading Tunnel, the industrial traffic patterns of the old factory district visible in the worn floor and marked walls. Directional arrows faded to near-invisibility indicate which routes led where.

A loading dock projects from one wall, its wooden surface rotted but its iron frame still solid. Materials moving between the cannery and the rail yards would have been staged here.

The smell of fish and metalwork mingle—the cannery to the west, the foundry to the east—creating an oddly specific olfactory signature for this junction.`,
  x: 9,
  y: -13,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 12,
  waterLevel: 10,
  outdoor: false,
  exits: {
    west: {
      to: 'underground/upper-tunnels/x8-y-13.ts',
      description: 'The passage continues west toward the cannery',
    },
    east: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%LOADING_TUNNEL',
      description: 'The passage leads east to Loading Tunnel',
    },
    south: {
      to: 'underground/upper-tunnels/x9-y-14.ts',
      description: 'A passage leads south',
    },
  },
};
