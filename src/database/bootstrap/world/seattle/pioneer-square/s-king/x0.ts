// 2nd Ave S & S. King St intersection

export const room = {
  name: '2nd Ave S & S. King St',
  description: `Second Avenue intersects S. King Street at Pioneer Square's southern boundary—and the end of southbound passage. The stadium district beyond is completely sealed off: collapsed overpasses, debris from damaged structures, and decades of accumulated wreckage have created an impassable barrier. The stadiums are visible over the rubble—T-Mobile Park, Lumen Field—but there's no way through.

The Stadium Station entrance descends at the corner, escalators frozen mid-step leading to platforms that haven't seen a train in decades. The infrastructure of mass transit serves no mass. The transit stopped.

The street is wider here than typical, extra lanes and broader sidewalks built for thousands of fans who no longer flow through. Second Avenue stretches north toward Pioneer Square's historic core. King Street continues east and west. South is a wall of concrete and twisted steel, the stadium district tantalizingly visible but absolutely unreachable.`,
  x: 0,
  y: -12,
  z: 0,

  imageOnDisk: '2nd-ave-s-s-king-st-x0-y-12-z0.png',
  intersection: ['2nd Ave S', 'S. King St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  // Street furniture
  objects: [
    { prototype: 'streetSignal', name: 'Traffic Signal' },
    { prototype: 'streetSign', streetName: '2nd Ave S', direction: ['N', 'S'] },
    {
      prototype: 'streetSign',
      streetName: 'S. King St',
      direction: ['E', 'W'],
    },
  ],
};
