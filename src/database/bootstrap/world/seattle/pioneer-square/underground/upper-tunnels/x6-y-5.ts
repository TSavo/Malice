// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage narrows as it passes through a section where the walls have shifted inward over the years. The brick is cracked and displaced, the pressure of the earth above slowly deforming the tunnel. The route remains passable, but the compression is visible—a slow-motion collapse that may take decades more to complete.

Steel braces have been installed at intervals, shoring up the weakest sections. The braces are old but solid, their installation dates unknown but clearly predating modern construction techniques.

Water drips from a crack in the ceiling, the constant trickle having carved a shallow channel in the floor over years of patient erosion.`,
  x: 6,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 8,
  waterLevel: 15,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x7-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x5-y-5.ts',
      description: 'The passage continues west',
    },
  },
};
