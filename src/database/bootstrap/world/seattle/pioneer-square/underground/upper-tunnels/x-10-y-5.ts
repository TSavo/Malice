// Underground passage - y=-5 corridor

export const room = {
  name: 'Southern Passage',
  description: `The passage enters a section where the underground route has absorbed what was once a basement or cellar, the space larger and better lit than the connecting tunnels. The walls show remnants of the original construction—plastered surfaces, a blocked window that once looked out on a lower level.

A heavy wooden door leads north, its surface marked with graffiti that has been painted over and added to multiple times. The door is closed but not locked, the route beyond leading toward the main underground network.

The floor here is more stable—flagstones rather than bare earth or cracked concrete—a legacy of the building that once stood above.`,
  x: -10,
  y: -5,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 20,
  waterLevel: 3,
  outdoor: false,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-9-y-5.ts',
      description: 'The passage continues east',
    },
    west: {
      to: 'underground/upper-tunnels/x-11-y-5.ts',
      description: 'The passage continues west',
    },
  },
};
