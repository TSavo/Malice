// Underground passage - waterfront approaches

export const room = {
  name: 'Tidal Zone Southeast',
  description: `The passage approaches the southeastern limit of the factory underground, where the industrial tunnels meet the tidal caves that extend toward the bay. The construction is minimal here—rough excavation with little reinforcement, the passage more natural than built.

The walls are wet with constant seepage, water filtering through the earth from the bay. The air tastes of salt, the marine environment overwhelming the industrial odors that characterize the tunnels to the north.

A partially collapsed section ahead marks the transition to even rougher passages—the tidal caves where the underground meets the sea.`,
  x: 12,
  y: -15,
  z: -2,
  population: 0,
  ambientNoise: 25,
  lighting: 5,
  waterLevel: 25,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x12-y-14.ts',
      description: 'The passage leads north',
    },
    west: {
      to: 'underground/upper-tunnels/x11-y-15.ts',
      description: 'The passage continues west',
    },
    east: {
      to: 'underground/upper-tunnels/x13-y-15.ts',
      description: 'The passage continues east',
    },
  },
};
