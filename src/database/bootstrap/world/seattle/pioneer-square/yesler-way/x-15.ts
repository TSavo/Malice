// Yesler Way at the Waterfront Edge
// Western terminus where the street meets Elliott Bay

export const room = {
  name: 'Yesler Way at Waterfront',
  description: `Yesler Way terminates at the waterfront seawall, the western edge of a street grid established when Henry Yesler built Seattle's first sawmill here in 1853. This location represents the city's founding geography—Elliott Bay meeting steep hillside, the narrow flat where Yesler's mill processed timber and established the "Skid Road" that gave Pioneer Square its original name.

The seawall is crumbling, early twentieth-century concrete giving way to salt water and time. Cracks run through the barrier where settlement has occurred over decades of neglect. The bay laps at foundations that were never meant to stand this long without maintenance. Rebar shows through spalled concrete like bones through rotting flesh.

The street rises eastward from here, climbing the grade that Yesler's original road established. The topography that made Seattle possible is visible from this vantage: the steep bluff that the early city carved into, the filled tidelands that extended the buildable area, the intersection of water and earth that all port cities share. The water is patient. The earth is indifferent. The city between them is mostly gone.`,
  x: -15,
  y: 10,
  z: 0,
  intersection: ['Waterfront', 'Yesler Way'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
