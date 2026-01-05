// Underground passage - connecting Expansion Loop (13,0) to Steam Corridor (13,1)

export const room = {
  name: 'Expansion Passage',
  description: `The passage runs along the expansion loop section of the steam main, the massive curved pipes dominating the space. The heat here is intense—metal radiating warmth that makes the air shimmer slightly, the temperature enough to cause discomfort but not danger.

The passage is narrow, squeezed between the expansion loops and the foundation walls of the buildings above. Handholds have been welded to the pipe supports, making passage easier for those who know the route. The welds are crude but solid, installed by people who valued function over form.

A maintenance log is mounted to the wall in a weathered plastic sleeve, the entries recording inspections and pressure readings. The most recent entry is three weeks old.`,
  x: 13,
  y: 0,
  z: -2,
  population: 0,
  ambientNoise: 35,
  lighting: 20,
  waterLevel: 0,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x13-y1.ts',
      description: 'A passage continues north through the steam corridor',
    },
    south: {
      to: 'underground/upper-tunnels/x13-y-1.ts',
      description: 'A passage continues south',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'maintenance log',
      description: 'A clipboard in a plastic sleeve contains handwritten maintenance logs. The entries are technical—pressure readings, inspection dates, valve positions.',
      boltedDown: true,
    },
  ],
};
