// Occidental Ave S & S. King St intersection

export const room = {
  name: 'Occidental Ave S & S. King St',
  description: `Occidental Avenue intersects S. King Street at the southern terminus of the pedestrian mall—and the southern edge of Pioneer Square. Beyond this point, passage south is blocked. Collapsed infrastructure and debris from the stadium district have created an impassable barricade across all southbound routes.

King Street Station is visible to the east, its clock tower—modeled on the campanile of St. Mark's Basilica—rising above surrounding buildings. The clock stopped at some point in the last fifty-five years. The station served Amtrak and Sounder commuter trains. The trains stopped when the fuel ran out. The station is still there, but you can't reach it from this direction.

The streetscape transitions here: Occidental's cracked cobblestones ending where asphalt and rubble begin. North leads back into Pioneer Square. East and west along King Street remain passable. South is a wall.`,
  x: -7,
  y: -12,
  z: 0,
  intersection: ['Occidental Ave S', 'S. King St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
  // Street furniture
  objects: [
    { prototype: 'streetSignal', name: 'Traffic Signal' },
    {
      prototype: 'streetSign',
      streetName: 'Occidental Ave S',
      direction: ['N', 'S'],
    },
    {
      prototype: 'streetSign',
      streetName: 'S. King St',
      direction: ['E', 'W'],
    },
  ],
};
