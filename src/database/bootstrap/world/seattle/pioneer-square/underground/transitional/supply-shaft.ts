// Supply Shaft - descent from Supply Junction (z=-2) to Supply Hub (z=-4)

export const room = {
  name: 'Supply Shaft',
  description: `A reinforced shaft angles downward at a steep grade, the walls shored with timber and corrugated metal that shows the marks of recent installation. The construction is practical rather than elegant—someone built this to move weight, not people, and the engineering reflects that priority. The descent is easier than a vertical drop but harder on the knees, the angle just steep enough to require bracing.

Rope guides run along both walls, the fibers worn rough where hands have gripped them. The wood of the shoring shows deep grooves at regular intervals, evidence of heavy loads dragged up and down over time. The passage is wide enough for burden, narrow enough for defense.

Warm air rises from below, carrying sounds that suggest activity—rhythmic, mechanical, purposeful. The upper tunnels feel abandoned by comparison.`,
  x: -14,
  y: -5,
  z: -3,
  population: 0,
  ambientNoise: 15,
  lighting: 8,
  waterLevel: 0,
  outdoor: false,
  // Note: 'down' exit to building is created by building-builder from z-4.ts
};
