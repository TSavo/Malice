// S. Jackson St - Union Station Plaza (x:-5, y:-9, z:0)
// Sidewalk/plaza area directly in front of Union Station's main entrance

export const room = {
  name: 'S. Jackson St - Union Station Plaza',
  description: `The sidewalk widens here into a plaza before Union Station's grand entrance. The pavement is granite, laid in a herringbone pattern that speaks to the civic importance this building once held. The granite is weathered now, its surface pitted by decades of freeze-thaw cycles, stained by rain and neglect, but the pattern remains legible—evidence of the craftsmanship invested in spaces meant to impress.

Union Station's facade looms to the north—a Beaux-Arts composition of carved granite, tall arched windows, and the massive bronze doors that mark the main entrance. Above the doors, carved into the stone frieze: UNION STATION 1911. The building was designed by Reed & Stem, the same architects who created New York's Grand Central Terminal. It was meant to announce Seattle's arrival as a terminus city, a place where railroads connected the Pacific to the rest of the nation.

The plaza is empty now, its benches gone or broken, its lampposts dark. This was a gathering place once—passengers arriving and departing, taxis queuing for fares, the circulation of a city connected by rail. The connections ended. The plaza waits.`,
  x: -5,
  y: -9,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  exits: {
    north: 'buildings/union-station/z0.ts#%MAIN_ENTRANCE',
  },
};
