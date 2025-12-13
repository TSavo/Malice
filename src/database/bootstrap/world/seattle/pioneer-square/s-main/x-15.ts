// Waterfront & S. Main intersection

export const room = {
  name: 'Alaskan Way & S. Main St',
  description: `S. Main Street begins here at the Waterfront—or ends here, depending on your perspective. The intersection marks the boundary between water and city, between the salt air of Elliott Bay and the brick-and-stone canyon of Pioneer Square rising to the east. Seagulls wheel overhead, the only things still commuting.

The Alaskan Way Viaduct is gone, demolished years before the Event, replaced by a surface boulevard that was supposed to reconnect the city to its waterfront. The reconnection worked beautifully for about eighteen months. Now the boulevard carries no traffic, just wind off the bay and the occasional dead leaf skittering across empty lanes. The absence of the viaduct lets in sky that was hidden for decades. The sky doesn't seem to care about the gift.

IVAR'S ACRES OF CLAMS occupies the corner building, a Seattle institution since 1938, feeding tourists and locals alike with fish and chips and chowder served in styrofoam cups. The neon sign—a cartoon clam with a fork and knife—has gone dark. The deep fryers inside are cold. The tanks that held live Dungeness crabs are dry, their former occupants either released or consumed or simply gone the way of things that needed tending. A faded menu board outside still promises ALL YOU CAN EAT FRIDAYS. The Fridays continue. The eating does not.`,
  x: -15,
  y: 0,
  z: 0,
  intersection: ['Alaskan Way', 'S. Main St'],
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 0, // Quiet/abandoned
  lighting: 100, // Daylight (outdoor)
  waterLevel: 0, // Dry
  outdoor: true, // Street level
};
