// Occidental Ave S & Yesler Way
// Northern edge of Occidental Park

export const room = {
  name: 'Occidental Ave S & Yesler Way',
  description: `Occidental Park opens here at the intersection with Yesler Way, what's left of the pedestrian mall that once served as Pioneer Square's central gathering space. The cobblestones are cracked and heaved, pushed up by roots and freeze-thaw cycles no one repairs. The park's European plaza design is still visible beneath the decay, the bones of urban planning exposed.

The Victorian iron pergola stands at the north end, listing slightly where rust has weakened its supports. The decorative ironwork—curved supports, lattice roof—was intended to support climbing plants. The plants are dead. The iron endures.

A totem pole rises near the pergola, the carved cedar column that has stood in various incarnations since 1899. The current pole is weathered grey, the paint faded, the carved figures—eagle, raven, human forms—barely visible beneath decades of lichen and rain. Tlingit artistic traditions, the pole's presence honoring and complicating Seattle's relationship with the Indigenous peoples whose land the city occupies. The land is still occupied, just not by many.`,
  x: -3,
  y: 10,
  z: 0,
  intersection: ['Occidental Ave S', 'Yesler Way'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
