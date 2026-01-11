// Yesler Way - between Waterfront and 1st Ave

export const room = {
  name: 'Yesler Way',
  description: `Yesler Way climbs eastward from the waterfront, following the grade that the original "Skid Road" established in the 1850s. Seattle's terrain still asserts itself against the street grid's attempt to impose order—the pitch noticeable here, the Fabrication Factory rising to the south where the street levels out.

The factory's loading bay is visible to the south—a massive roll-up door that once accepted shipments from the waterfront. The building stretches four stories up, its northwestern corner showing the original transport warehouse architecture beneath decades of industrial additions. The hum of machinery is constant; the AI-controlled systems never rest.

A Metro bus stop marks this location, its shelter yellowed and cracked, its bench weathered grey. Route maps are still posted behind scratched plexiglass, showing connections to destinations that exist only in memory. The buses stopped running when the fuel ran out. The infrastructure remains, waiting for transit that will never come. North leads only to rubble—the debris wall that separates Pioneer Square from downtown blocking all passage in that direction.`,
  x: -20,
  y: 12,
  z: 0,
  // Environmental properties

  imageOnDisk: 'yesler-way-x-20-y12-z0.png',
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
