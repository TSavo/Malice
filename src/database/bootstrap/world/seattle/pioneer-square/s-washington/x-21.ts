// S. Washington St - waterfront edge

export const room = {
  name: 'S. Washington St',
  description: `S. Washington Street terminates here at the waterfront—or rather, at the edge of the raised city that Seattle built on top of its original waterfront after the Great Fire. The current street level is twelve feet higher than it was in 1889. The original Seattle is down there still, buried beneath fill and ambition, its storefronts sealed in darkness, its sidewalks preserved like insects in amber. The Underground tours used to bring tourists down to see it. The tourists stopped coming. The Underground waits beneath your feet, patient and dark.

A seawall retains the fill that retains the city, concrete and steel holding back the bay's patient pressure. The wall has developed cracks over the decades—engineers worried about liquefaction, about the big earthquake that would turn the fill to quicksand and send downtown sliding into Elliott Bay. They were right to worry. The big earthquake hasn't come yet. Something else came instead.

Alaskan Way runs along the waterfront below, empty now, the surface boulevard that replaced the viaduct carrying no traffic. The ferry terminal is visible to the northwest, its clock tower rising over water the color of old pewter. The ferries to Bainbridge and Bremerton have stopped running. The schedules posted in the terminal are historical documents now, timetables from an era when people moved between islands on a regular basis.

Wind comes off the bay carrying the smell of salt and marine decay—seaweed rotting on the piers, whatever the fishing boats left behind when the fishing stopped. Elliott Bay is still beautiful in its grey way, still reflecting whatever light the sky offers. The beauty persists. The people who appreciated it have gone elsewhere.`,
  x: -21,
  y: 6,
  z: 0,
  intersection: ['Waterfront', 'S. Washington St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
