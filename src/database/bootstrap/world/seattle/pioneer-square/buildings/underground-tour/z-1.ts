// Underground Tour - Descent Level (z=-1)
// Transitional passage between tour staging and the buried streets

export const building = {
  name: 'Underground Tour',
  x: -15,
  y: -3,
  width: 1,
  height: 1,
  floors: 1,

  rooms: {
    // ═══════════════════════════════════════════════════════════════════
    // DESCENT (z=-1) - STAIRS TO UNDERGROUND
    // ═══════════════════════════════════════════════════════════════════

    '%DESCENT': {
      name: 'Underground Tour - Descent',
      description: `The stairs descend into darkness, a narrow passage that was once lit by carefully positioned fixtures designed to create atmosphere without revealing too much. The fixtures are dark now, the theatrical lighting replaced by the absolute black of spaces that haven't seen electricity in years.

The walls transition as the stairs drop—from finished drywall at the top to exposed brick in the middle to something older at the bottom, the original construction that was buried when Seattle rebuilt itself after the fire. The air grows cooler with each step, damper, carrying the mineral smell of underground spaces and the faint organic scent of things that grow in darkness.

A handrail runs along one wall, worn smooth by thousands of tourist hands. Safety tape on the steps has peeled away in places, revealing the concrete beneath. A sign at the bottom—barely visible in whatever light filters down—reads WELCOME TO UNDERGROUND SEATTLE. The welcome is still there. The underground is still there. Only the tours have stopped.`,
      x: -15,
      y: -3,
      z: -1,
      population: 0,
      ambientNoise: 8,
      lighting: 5,
      waterLevel: 0,
      outdoor: false,
      exits: {
        up: '%ENTRY',
        down: {
          to: 'underground/upper-tunnels/x-15-y-3.ts',
          description: 'The stairs continue down into the buried streets',
        },
      },
    },
  },
};
