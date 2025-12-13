// 3rd Ave S & Yesler Way
// Major intersection, light rail station nearby

export const room = {
  name: '3rd Ave S & Yesler Way',
  description: `Third Avenue crosses Yesler Way at this major intersection. The light rail used to run underground here, connecting Pioneer Square to downtown and beyond. The PIONEER SQUARE STATION entrance gapes open to the north, escalators frozen, stairs descending into darkness. No one has gone down there in decades. No one comes up.

The KING COUNTY ADMINISTRATION BUILDING occupies the northeast corner, its glass facade starred with cracks, its steel frame showing rust where the cladding has fallen away. The building housed government services once—permits, licenses, the bureaucratic machinery of civilization. The machinery stopped. The building remains, hollow and purposeless.

The southwest corner is wrapped in chain link and black fabric, a construction site that never finished. The fencing has held for fifty-five years, though the fabric is torn now, flapping in the wind, revealing glimpses of rebar and poured concrete foundations that never received their buildings. The cranes are gone. The workers are gone. The development died mid-birth.

Third Avenue had a reputation before the war. It still does, though the nature of the trouble has changed.`,
  x: 9,
  y: 10,
  z: 0,
  intersection: ['3rd Ave S', 'Yesler Way'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
