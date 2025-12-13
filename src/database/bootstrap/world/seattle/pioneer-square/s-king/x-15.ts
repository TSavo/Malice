// Waterfront & S. King St intersection

export const room = {
  name: 'Alaskan Way & S. King St',
  description: `Alaskan Way terminates at S. King Street, where the waterfront becomes industrial access road serving container terminals that no longer operate. The Port of Seattle's facilities stretch south from here—Terminal 30, Terminal 46, the container yards rusted and empty where goods once moved in the choreography of global trade. The choreography ended. The cranes stand frozen over empty docks.

A public fishing pier extends from the seawall, wooden planking rotting on concrete pilings. The railing still holds rod holders; no one has fished here in decades. The structure provides views across Elliott Bay to West Seattle and Bainbridge Island, the geography unchanged even as everything else has.

The seawall shows its age and neglect—concrete spalling, rebar exposed to salt air, the barrier between city and water slowly losing the battle. A bait and tackle shop occupies a converted shipping container, rusted shut, its inventory of hooks and sinkers waiting for anglers who'll never come.`,
  x: -15,
  y: -10,
  z: 0,
  intersection: ['Alaskan Way', 'S. King St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
