// Underground passage - factory district

export const room = {
  name: 'Waterfront Approach',
  description: `The passage descends toward the waterfront industrial area, the character of the construction changing as it approaches the tidal zone. The walls show water stains at multiple levels—marks of floods from different years, the high tide of the underground.

The air grows damper as the passage continues south, humidity increasing as the water table approaches. Salt mingles with the industrial smells—the influence of Elliott Bay making itself felt even this far inland.

Barnacles cling to the lower portions of the walls, evidence that seawater has reached this section during extreme high tides.`,
  x: 10,
  y: -14,
  z: -2,
  population: 0,
  ambientNoise: 18,
  lighting: 8,
  waterLevel: 20,
  outdoor: false,
  exits: {
    north: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%LOADING_TUNNEL',
      description: 'The passage leads north to Loading Tunnel',
    },
    south: {
      to: 'underground/upper-tunnels/x10-y-15.ts',
      description: 'The passage continues south toward the waterfront',
    },
    east: {
      to: 'underground/upper-tunnels/x11-y-14.ts',
      description: 'A passage leads east',
    },
  },
};
