// 1st Ave S alley section
// Darker mid-section

export const room = {
  name: '1st Ave S',
  description: `This section of First Avenue feels more like a back alley than a street. The buildings to either side lean close, blocking direct sunlight except at midday. The architecture here is purely functional—brick walls without ornament, doors marked DELIVERIES ONLY, windows high and small.

A loading dock juts from the eastern wall, its concrete platform cracked and listing. Above it, a faded sign reads EMPLOYEES PARKING IN REAR, pointing to a space that no longer exists or was never accessible from here.

The western buildings show their service sides—metal doors with peeling paint, exhaust vents crusted with years of grime, electrical conduits running exposed along the brick. These are the parts of buildings that were never meant to be seen, the infrastructural necessities hidden from the proper streets.

Water has pooled in a depression in the pavement, dark and still. The pool hasn't dried since the last rain, suggesting something seeps up from below or condenses perpetually in this shadowed space.

The avenue continues north and south between the buildings.`,
  x: -14,
  y: 2,
  z: 0,
  // Environmental properties
  population: 0, // Empty (post-Event)
  ambientNoise: 3, // Very quiet, sounds muffled
  lighting: 35, // Dark (narrowest/most shadowed section)
  waterLevel: 0, // Dry (pooled water is shallow)
  outdoor: true, // Open to sky but deeply shadowed
};
