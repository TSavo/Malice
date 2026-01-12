// Sample prefabs - small buildings and structures
export const SAMPLE_PREFABS = [
  // === SMALL BUILDINGS ===
  {
    // 2x2 footprint, 3 floors with central stairwell
    id: 'townhouse-2x2x3',
    cells: [
      // Ground floor
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      // Second floor
      { x: 0, y: 0, z: 1 },
      { x: 1, y: 0, z: 1 },
      { x: 0, y: 1, z: 1 },
      { x: 1, y: 1, z: 1 },
      // Third floor
      { x: 0, y: 0, z: 2 },
      { x: 1, y: 0, z: 2 },
      { x: 0, y: 1, z: 2 },
      { x: 1, y: 1, z: 2 },
    ],
    exits: [
      // Ground floor connections
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 1, y: 0, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 0 },
        to: { x: 1, y: 0, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 0 },
        to: { x: 0, y: 1, z: 0 },
        kind: 'cardinal',
      },
      // Stairs at (0,0) corner
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 0, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 1 },
        to: { x: 0, y: 0, z: 2 },
        kind: 'cardinal',
      },
      // Second floor connections
      {
        from: { x: 0, y: 0, z: 1 },
        to: { x: 1, y: 0, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 1 },
        to: { x: 0, y: 1, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 1 },
        to: { x: 1, y: 0, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 1 },
        to: { x: 0, y: 1, z: 1 },
        kind: 'cardinal',
      },
      // Third floor connections
      {
        from: { x: 0, y: 0, z: 2 },
        to: { x: 1, y: 0, z: 2 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 2 },
        to: { x: 0, y: 1, z: 2 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 2 },
        to: { x: 1, y: 0, z: 2 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 2 },
        to: { x: 0, y: 1, z: 2 },
        kind: 'cardinal',
      },
    ],
    portals: [
      { cell: { x: 1, y: 0, z: 0 }, allowedDirs: ['+x'] },
      { cell: { x: 0, y: 1, z: 0 }, allowedDirs: ['+y'] },
    ],
  },
  {
    // 3x3 footprint, 2 floors - shop with apartment above
    id: 'shophouse-3x3x2',
    cells: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 1, y: 0, z: 1 },
      { x: 2, y: 0, z: 1 },
      { x: 0, y: 1, z: 1 },
      { x: 1, y: 1, z: 1 },
      { x: 2, y: 1, z: 1 },
      { x: 0, y: 2, z: 1 },
      { x: 1, y: 2, z: 1 },
      { x: 2, y: 2, z: 1 },
    ],
    exits: [
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 1, y: 0, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 0, z: 0 },
        to: { x: 2, y: 0, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 1, z: 0 },
        to: { x: 1, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 0 },
        to: { x: 2, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 2, z: 0 },
        to: { x: 1, y: 2, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 2, z: 0 },
        to: { x: 2, y: 2, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 1, z: 0 },
        to: { x: 0, y: 2, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 0, z: 0 },
        to: { x: 1, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 0 },
        to: { x: 1, y: 2, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 2, y: 0, z: 0 },
        to: { x: 2, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 2, y: 1, z: 0 },
        to: { x: 2, y: 2, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 2, y: 2, z: 0 },
        to: { x: 2, y: 2, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 2, y: 2, z: 1 },
        to: { x: 1, y: 2, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 2, z: 1 },
        to: { x: 0, y: 2, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 2, z: 1 },
        to: { x: 1, y: 1, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 1 },
        to: { x: 0, y: 1, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 1 },
        to: { x: 2, y: 1, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 1 },
        to: { x: 1, y: 0, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 0, z: 1 },
        to: { x: 0, y: 0, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 0, z: 1 },
        to: { x: 2, y: 0, z: 1 },
        kind: 'cardinal',
      },
    ],
    portals: [{ cell: { x: 1, y: 0, z: 0 } }],
  },
  {
    id: 'L-building-2floor',
    cells: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 1, y: 0, z: 1 },
      { x: 2, y: 0, z: 1 },
      { x: 0, y: 1, z: 1 },
      { x: 0, y: 2, z: 1 },
    ],
    exits: [
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 1, y: 0, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 0, z: 0 },
        to: { x: 2, y: 0, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 1, z: 0 },
        to: { x: 0, y: 2, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 0, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 1 },
        to: { x: 1, y: 0, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 0, z: 1 },
        to: { x: 2, y: 0, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 1 },
        to: { x: 0, y: 1, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 1, z: 1 },
        to: { x: 0, y: 2, z: 1 },
        kind: 'cardinal',
      },
    ],
    portals: [
      { cell: { x: 2, y: 0, z: 0 }, allowedDirs: ['+x'] },
      { cell: { x: 0, y: 2, z: 0 }, allowedDirs: ['+y'] },
    ],
  },
  {
    id: 'watchtower-1x1x4',
    cells: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: 2 },
      { x: 0, y: 0, z: 3 },
    ],
    exits: [
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 0, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 1 },
        to: { x: 0, y: 0, z: 2 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 2 },
        to: { x: 0, y: 0, z: 3 },
        kind: 'cardinal',
      },
    ],
    portals: [{ cell: { x: 0, y: 0, z: 0 } }],
  },
  {
    id: 'courtyard-3x3',
    cells: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
    exits: [
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 1, y: 0, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 0, z: 0 },
        to: { x: 2, y: 0, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 2, y: 0, z: 0 },
        to: { x: 2, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 2, y: 1, z: 0 },
        to: { x: 2, y: 2, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 2, y: 2, z: 0 },
        to: { x: 1, y: 2, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 2, z: 0 },
        to: { x: 0, y: 2, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 2, z: 0 },
        to: { x: 0, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 1, z: 0 },
        to: { x: 0, y: 0, z: 0 },
        kind: 'cardinal',
      },
    ],
    portals: [{ cell: { x: 1, y: 0, z: 0 } }, { cell: { x: 1, y: 2, z: 0 } }],
  },
  {
    id: 'cellar-2x2',
    cells: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: -1 },
      { x: 1, y: 0, z: -1 },
      { x: 0, y: 1, z: -1 },
      { x: 1, y: 1, z: -1 },
    ],
    exits: [
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 0, z: -1 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: -1 },
        to: { x: 1, y: 0, z: -1 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: -1 },
        to: { x: 0, y: 1, z: -1 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 0, z: -1 },
        to: { x: 1, y: 1, z: -1 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 1, z: -1 },
        to: { x: 1, y: 1, z: -1 },
        kind: 'cardinal',
      },
    ],
    portals: [{ cell: { x: 0, y: 0, z: 0 } }],
  },
  {
    id: 'crossroads-building',
    cells: [
      { x: 1, y: 2, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 1, y: 0, z: 0 },
    ],
    exits: [
      {
        from: { x: 1, y: 1, z: 0 },
        to: { x: 0, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 0 },
        to: { x: 2, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 0 },
        to: { x: 1, y: 0, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 1, y: 1, z: 0 },
        to: { x: 1, y: 2, z: 0 },
        kind: 'cardinal',
      },
    ],
    portals: [
      { cell: { x: 0, y: 1, z: 0 }, allowedDirs: ['-x'] },
      { cell: { x: 2, y: 1, z: 0 }, allowedDirs: ['+x'] },
      { cell: { x: 1, y: 0, z: 0 }, allowedDirs: ['-y'] },
      { cell: { x: 1, y: 2, z: 0 }, allowedDirs: ['+y'] },
    ],
  },
  {
    id: 'rowhouse-1x3x2',
    cells: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 1, z: 1 },
      { x: 0, y: 2, z: 1 },
    ],
    exits: [
      {
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 1, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 1, z: 0 },
        to: { x: 0, y: 2, z: 0 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 1, z: 0 },
        to: { x: 0, y: 1, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 0, z: 1 },
        to: { x: 0, y: 1, z: 1 },
        kind: 'cardinal',
      },
      {
        from: { x: 0, y: 1, z: 1 },
        to: { x: 0, y: 2, z: 1 },
        kind: 'cardinal',
      },
    ],
    portals: [
      { cell: { x: 0, y: 0, z: 0 }, allowedDirs: ['-y'] },
      { cell: { x: 0, y: 2, z: 0 }, allowedDirs: ['+y'] },
    ],
  },
];
