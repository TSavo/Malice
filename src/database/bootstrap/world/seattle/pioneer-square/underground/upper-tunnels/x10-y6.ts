// Underground passage - between Eastern Yesler Access (10,5) and Slope Passage (10,8)

export const room = {
  name: 'Yesler North Passage',
  description: `The passage runs north from the Eastern Yesler Access, following the contour of the hill beneath Yesler Way. The floor rises gradually, tracking the slope of the terrain above, each step carrying you higher relative to sea level even as you remain deep underground.

The walls show the marks of hand excavation, pickaxe gouges preserved in the brick that was laid to stabilize the tunnel. This section was carved in the early twentieth century, connecting the eastern underground to the Yesler corridors when the neighborhood was still young.

A brass plate set into the wall reads: "YESLER EXTENSION - 1907 - PROPERTY OF SEATTLE UNDERGROUND TRANSIT CO." The company has been defunct for a century, but their work endures.`,
  x: 10,
  y: 6,
  z: -2,
  population: 0,
  ambientNoise: 15,
  lighting: 15,
  waterLevel: 5,
  outdoor: false,
  exits: {
    south: {
      to: 'buildings/eastside-underground/z-2.ts',
      room: '%YESLER_EAST',
      description: 'The passage leads south toward the Eastern Yesler Access',
    },
    north: {
      to: 'underground/upper-tunnels/x10-y7.ts',
      description: 'The passage continues north up the slope',
    },
    east: {
      to: 'underground/upper-tunnels/x11-y6.ts',
      description: 'A side passage leads east',
    },
  },
  objects: [
    {
      prototype: 'sign',
      name: 'brass plate',
      description: 'A tarnished brass plate commemorates the tunnel\'s construction: "YESLER EXTENSION - 1907 - PROPERTY OF SEATTLE UNDERGROUND TRANSIT CO."',
      boltedDown: true,
    },
  ],
};
