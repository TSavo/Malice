// Waterfront & S. King St intersection

export const room = {
  name: 'Alaskan Way & S. King St',
  description: `Alaskan Way meets S. King Street at Pioneer Square's southwestern corner—the end of the road in two directions. To the west, Elliott Bay stretches to the horizon, cold and impassable. To the south, the stadium district is completely blocked: collapsed overpasses and debris from the port facilities have created an impenetrable wall of concrete and twisted steel.

The Port of Seattle's container terminals are visible beyond the barricade—Terminal 30, Terminal 46, the cranes frozen over empty docks—but there's no way through. The choreography of global trade ended here, and so does passage south.

A public fishing pier extends from the seawall, wooden planking rotting on concrete pilings. The structure provides views across Elliott Bay to West Seattle and Bainbridge Island, shores you cannot reach. North along the waterfront or east on King Street—those are your options. South and west are walls, one made of water, one made of wreckage.`,
  x: -21,
  y: -12,
  z: 0,
  intersection: ['Alaskan Way', 'S. King St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
